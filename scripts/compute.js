const ComputeUtility = {
    calculate_stops_between(height_a, height_b, step) {
        const is_flipped = height_a > height_b;

        const a = Math.min(height_a, height_b);
        const b = Math.max(height_a, height_b);

        let first = Math.floor(a / step) * step;

        if (first <= a) {
            first += step;
        }

        let current = first;
        let stops = [];
        while (current < b) {
            stops.push(current);
            current += step;
        }

        if (is_flipped) {
            stops.reverse();
        }

        stops = stops
            .map((p) => {
                // Inverse lerp
                let v = (p - a) / (b - a);
                if (is_flipped) {
                    v = 1 - v;
                }
                return v;
            })
            .filter((value) => value > 0.00001 && value < 0.99999);

        return stops;
    },

    compute_lines_from_group(group) {
        if (group.length <= 1) {
            // If there's only one point in height group, it does not form a line
            return [];
        }

        if (group.length === 2) {
            // If both points are corner points, ignore them
            // if (group.every((value) => value.source === "corner")) return [];

            // Two points can form only one line
            return [group];
        }

        if (group.length === 3) {
            // Three points can have the same height in two cases
            //  1) They are all corner points
            //  2) One is on the diagonal
            if (group.every((value) => value.source === "corner")) {
                // If all are corner points, ignore them for now
                // TODO: Figure out
                return [];
            } else {
                // If one point is on the diagonal, we make it the middle point
                const is_diagonal = (value) => value.side === LUT.DIAGONAL.TLBR || value.side === LUT.DIAGONAL.BLTR;
                const middle = group.filter(is_diagonal)[0];
                const ends = group.filter((v) => !is_diagonal(v));
                return [[ends[0], middle, ends[1]]];
            }
        }

        if (group.length === 4) {
            // // Four points can only happen when there is one on each side
            // // We form two lines, each parallel to diagonal
            // switch (this.#diagonal_type) {
            //     case LUT.DIAGONAL.TLBR:
            //         return [
            //             group.filter((value) => value.side === LUT.SIDE.LEFT || value.side === LUT.SIDE.BOTTOM),
            //             group.filter((value) => value.side === LUT.SIDE.RIGHT || value.side === LUT.SIDE.TOP),
            //         ];
            //     case LUT.DIAGONAL.BLTR:
            //         return [
            //             group.filter((value) => value.side === LUT.SIDE.LEFT || value.side === LUT.SIDE.TOP),
            //             group.filter((value) => value.side === LUT.SIDE.RIGHT || value.side === LUT.SIDE.BOTTOM),
            //         ];
            // }

            // We ignore this case for now
            // TODO: Figure out
            return [];
        }

        throw new Error(`Unknown case occured: ${JSON.stringify(group)}`);
    },
};

Object.freeze(ComputeUtility);

class ComputedHeightGridWindow extends HeightGridWindow {
    #step = 0.5;

    #stops = new Map();

    #diagonal_type = undefined;
    #diagonal_stops = [];

    #height_lines = [];

    #onupdate = undefined;

    // get stops() {
    //     return this.#stops;
    // }

    /**
     * @returns {LUT.DIAGONAL} diagonal type
     */
    get diagonal_type() {
        return this.#diagonal_type;
    }

    // get diagonal_stops() {
    //     return this.#diagonal_stops;
    // }

    /**
     * Set onupdate event handler
     * @param {Function} value
     */
    set onupdate(value) {
        this.#onupdate = value;
    }

    set step(value) {
        if (typeof value !== "number") {
            throw new Error("Invalid step");
        }
        this.#step = value;
        this.#update();
        if (this.#onupdate) this.#onupdate();
    }

    get step() {
        return this.#step;
    }

    /**
     * @param {HeightGrid} grid underlying grid
     */
    constructor(grid) {
        if (!grid instanceof HeightGrid || !grid.is_valid) {
            throw new Error("Invalid grid");
        }

        super(grid);

        super.onupdate = (() => {
            this.#update();
            if (this.#onupdate) this.#onupdate();
        }).bind(this);

        this.#update();
    }

    #calculate_stops() {
        if (!this.is_valid) {
            throw new Error("Invalid window");
        }
        LUT.ALL_SIDES.forEach(
            ((side) => {
                const side_corners = LUT.SIDE_TO_CORNERS.get(side);
                const height_a = this.grid.get_corner_of(this.position, side_corners[0]);
                const height_b = this.grid.get_corner_of(this.position, side_corners[1]);
                this.#stops.set(side, ComputeUtility.calculate_stops_between(height_a, height_b, this.#step));
            }).bind(this)
        );
    }

    #update_diagonal_type() {
        if (!this.is_valid) {
            throw new Error("Invalid window");
        }
        let stop_count = LUT.ALL_SIDES.map((side) => {
            return {
                side: side,
                stop_count: this.#stops.get(side).length,
            };
        })
            .sort((a, b) => b.stop_count - a.stop_count)
            .map((s) => s.side);

        this.#diagonal_type = LUT.STOP_COUNT_TO_DIAGONAL.get(stop_count.map((s) => s.toString()).join(""));
    }

    #calculate_diagonal_stops() {
        if (!this.is_valid) {
            throw new Error("Invalid window");
        }

        const diagonal_corners = LUT.SIDE_TO_CORNERS.get(this.#diagonal_type);
        const height_a = this.grid.get_corner_of(this.position, diagonal_corners[0]);
        const height_b = this.grid.get_corner_of(this.position, diagonal_corners[1]);

        this.#diagonal_stops = ComputeUtility.calculate_stops_between(height_a, height_b, this.#step);
    }

    #update() {
        if (!this.is_valid) {
            throw new Error("Invalid window");
        }

        this.#calculate_stops();
        this.#update_diagonal_type();
        this.#calculate_diagonal_stops();

        this.#order_points_into_lines();
    }

    #group_points_by_height() {
        const points = [];
        const height_set = new Set();

        LUT.ALL_CORNERS.forEach(
            ((corner) => {
                const height = this.get(corner);

                height_set.add(height.toFixed(2));
                points.push({
                    height: height.toFixed(2),
                    source: "corner",
                    corner: corner,
                });
            }).bind(this)
        );

        this.get_sides().forEach(
            ((side) => {
                const corners = LUT.SIDE_TO_CORNERS.get(side);
                const a = this.get(corners[0]);
                const b = this.get(corners[1]);
                this.get_stops_for(side).forEach(
                    ((t, index) => {
                        const height = a + (b - a) * t;

                        // if (Math.abs((Math.round(height * 1000000) / 1000000) % this.#step) > 0.000001) {
                        //     console.log(height, this.#step - (height % this.#step));
                        //     return;
                        // }

                        height_set.add(height.toFixed(2));
                        points.push({
                            height: height.toFixed(2),
                            source: "stop",
                            side: side,
                            index: index,
                            value: t,
                        });
                    }).bind(this)
                );
            }).bind(this)
        );

        const groups = [];

        height_set.forEach((height) => {
            groups.push(points.filter((point) => point.height === height));
        });

        return groups;
    }

    #order_points_into_lines() {
        const groups = this.#group_points_by_height();

        const lines = groups.flatMap(ComputeUtility.compute_lines_from_group.bind(this));

        // console.log("Lines", lines);

        this.#height_lines = lines;
    }

    /**
     * Get stops for given side
     * @param {LUT.SIDE | LUT.DIAGONAL} side
     * @returns {number[]} stops
     */
    get_stops_for(side) {
        if (!this.is_valid) {
            throw new Error("Invalid window");
        }
        if (!side in [...LUT.ALL_SIDES, ...Object.values(LUT.DIAGONAL)]) {
            throw new Error("Invalid side");
        }

        if (side === this.#diagonal_type) {
            return this.#diagonal_stops;
        } else if (this.#stops.has(side)) {
            return this.#stops.get(side);
        } else {
            throw new Error(`No stops for given side: ${side.toString()}!`);
        }
    }

    /**
     * Returns all sides and calculated diagonal
     * @returns {symbol[]} sides
     */
    get_sides() {
        if (!this.is_valid) {
            throw new Error("Invalid window");
        }
        return [...LUT.ALL_SIDES, this.#diagonal_type];
    }

    /**
     * Returns list of lines, each being array of points.
     *
     * All points contain `height` and `source`.
     *
     * `source` can be one of two values:
     *  - "corner": point sits at the `corner` of this window
     *  - "stop": point represents a stop and contains `side`, `index` and `value` for this stop
     * @returns {object[]}
     */
    get_height_lines() {
        return this.#height_lines;
    }
}

class ComputedHeightGrid extends HeightGrid {
    #onupdate = undefined;

    #vertical_stops = [[], []];
    #horizontal_stops = [[], []];
    #diagonal_stops = [[]];
    #diagonal_types = [[]];

    #all_sides = [];
    #height_lines = [[]];

    #step = 0.5;

    constructor() {
        super();

        super.onupdate = (() => {
            this.#update();
            if (this.#onupdate) this.#onupdate();
        }).bind(this);

        this.#update();
    }

    /**
     * Set onupdate event handler
     * @param {Function} value
     */
    set onupdate(value) {
        this.#onupdate = value;
    }

    set step(value) {
        if (typeof value !== "number") {
            throw new Error("Invalid step");
        }
        this.#step = value;

        this.#update();
        if (this.#onupdate) this.#onupdate();
    }

    get step() {
        return this.#step;
    }

    #update() {
        if (!this.is_valid) {
            throw new Error("Trying to use inside invalid HeightGrid");
        }

        this.#clear();
        this.#update_horizontal_stops();
        this.#update_vertical_stops();
        this.#update_diagonal_stops();
        this.#update_all_sides();
        this.#update_height_lines();
    }

    #clear() {
        this.#vertical_stops = Array.from({ length: this.height - 1 }, () => Array.from({ length: this.width }, () => 0.0));
        this.#horizontal_stops = Array.from({ length: this.height }, () => Array.from({ length: this.width - 1 }, () => 0.0));
        this.#diagonal_stops = Array.from({ length: this.height - 1 }, () => Array.from({ length: this.width - 1 }, () => 0.0));
        this.#diagonal_types = Array.from({ length: this.height - 1 }, () => Array.from({ length: this.width - 1 }, () => LUT.DIAGONAL.TLBR));
        this.#height_lines = Array.from({ length: this.height - 1 }, () => Array.from({ length: this.width - 1 }, () => []));
    }

    #update_horizontal_stops() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                const a = this.get(new Point(x, y));
                const b = this.get(new Point(x + 1, y));

                this.#horizontal_stops[y][x] = ComputeUtility.calculate_stops_between(a, b, this.#step);
            }
        }
    }

    #update_vertical_stops() {
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width; x++) {
                const a = this.get(new Point(x, y));
                const b = this.get(new Point(x, y + 1));

                this.#vertical_stops[y][x] = ComputeUtility.calculate_stops_between(a, b, this.#step);
            }
        }
    }

    #update_diagonal_stops() {
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                const chunk = new Point(x, y);
                let stop_count = LUT.ALL_SIDES.map((side) => {
                    return {
                        side: side,
                        stop_count: this.#get_side_of(chunk, side).length,
                    };
                })
                    .sort((a, b) => b.stop_count - a.stop_count)
                    .map((s) => s.side);

                const type = LUT.STOP_COUNT_TO_DIAGONAL.get(stop_count.map((s) => s.toString()).join(""));

                const corners = LUT.SIDE_TO_CORNERS.get(type);
                const a = this.get_corner_of(chunk, corners[0]);
                const b = this.get_corner_of(chunk, corners[1]);

                const stops = ComputeUtility.calculate_stops_between(a, b, this.#step);

                this.#set_side_of(chunk, type, stops);
            }
        }
    }

    #update_all_sides() {
        if (!this.is_valid) {
            throw new Error("Trying to use inside invalid HeightGrid");
        }

        let result = [];

        function _push(chunk, side) {
            result.push({
                chunk: chunk,
                side: side,
                stops: this.#get_side_of(chunk, side),
            });
        }

        const push = _push.bind(this);

        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                const chunk = new Point(x, y);
                push(chunk, LUT.SIDE.TOP);
                push(chunk, LUT.SIDE.LEFT);
                push(chunk, this.#diagonal_types[y][x]);

                if (x === this.width - 2) {
                    push(chunk, LUT.SIDE.RIGHT);
                }
                if (y === this.height - 2) {
                    push(chunk, LUT.SIDE.BOTTOM);
                }
            }
        }

        this.#all_sides = result;
    }

    #group_points_by_height_for(chunk) {
        const points = [];
        const height_set = new Set();

        LUT.ALL_CORNERS.forEach(
            ((corner) => {
                const height = this.get_corner_of(chunk, corner);

                if (Math.abs(height - Math.round(height / this.#step) * this.#step) > 0.001) {
                    // console.log(height, Math.abs(height - Math.round(height / this.#step) * this.#step));
                    return;
                }

                height_set.add(height.toFixed(2));
                points.push({
                    height: height.toFixed(2),
                    source: "corner",
                    corner: corner,
                });
            }).bind(this)
        );

        this.get_sides_of(chunk).forEach(
            ((side) => {
                const corners = LUT.SIDE_TO_CORNERS.get(side);
                const a = this.get_corner_of(chunk, corners[0]);
                const b = this.get_corner_of(chunk, corners[1]);
                this.#get_side_of(chunk, side).forEach(
                    ((t, index) => {
                        const height = a + (b - a) * t;

                        // if (Math.abs((Math.round(height * 1000000000) / 1000000000) % this.#step) > 0.000000001) {
                        //     console.log(height, this.#step - (height % this.#step));
                        //     return;
                        // }

                        height_set.add(height.toFixed(2));
                        points.push({
                            height: height.toFixed(2),
                            source: "stop",
                            side: side,
                            index: index,
                            value: t,
                        });
                    }).bind(this)
                );
            }).bind(this)
        );

        const groups = [];

        height_set.forEach((height) => {
            groups.push(points.filter((point) => point.height === height));
        });

        return groups;
    }

    #update_height_lines() {
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                const chunk = new Point(x, y);
                const groups = this.#group_points_by_height_for(chunk);
                const lines = groups.flatMap(ComputeUtility.compute_lines_from_group.bind(this));
                this.#height_lines[y][x] = lines;
            }
        }
    }

    get_stops_for_all_sides() {
        if (!this.is_valid) {
            throw new Error("Trying to use inside invalid HeightGrid");
        }

        return this.#all_sides;
    }

    get_height_lines_of(chunk) {
        if (!this.is_valid) {
            throw new Error("Trying to use inside invalid HeightGrid");
        }

        if (!this.is_a_valid_chunk_position(chunk)) {
            throw new Error("Position is not valid for a chunk");
        }

        return this.#height_lines[chunk.y][chunk.x];
    }

    get_diagonal_of(chunk) {
        if (!this.is_valid) {
            throw new Error("Trying to use inside invalid HeightGrid");
        }

        if (!this.is_a_valid_chunk_position(chunk)) {
            throw new Error("Position is not valid for a chunk");
        }

        return this.#diagonal_types[chunk.y][chunk.x];
    }

    get_sides_of(chunk) {
        if (!this.is_valid) {
            throw new Error("Trying to use inside invalid HeightGrid");
        }

        if (!this.is_a_valid_chunk_position(chunk)) {
            throw new Error("Position is not valid for a chunk");
        }

        return [...LUT.ALL_SIDES, this.#diagonal_types[chunk.y][chunk.x]];
    }

    #get_side_of(chunk, side) {
        if (!this.is_a_valid_chunk_position(chunk)) {
            throw new Error("Invalid position");
        }

        switch (side) {
            case LUT.SIDE.TOP:
                return this.#horizontal_stops[chunk.y][chunk.x];
            case LUT.SIDE.BOTTOM:
                return this.#horizontal_stops[chunk.y + 1][chunk.x];
            case LUT.SIDE.LEFT:
                return this.#vertical_stops[chunk.y][chunk.x];
            case LUT.SIDE.RIGHT:
                return this.#vertical_stops[chunk.y][chunk.x + 1];
            case LUT.DIAGONAL.TLBR:
                if (this.#diagonal_types[chunk.y][chunk.x] === LUT.DIAGONAL.TLBR) {
                    return this.#diagonal_stops[chunk.y][chunk.x];
                } else {
                    throw new Error("Invalid side");
                }
            case LUT.DIAGONAL.BLTR:
                if (this.#diagonal_types[chunk.y][chunk.x] === LUT.DIAGONAL.BLTR) {
                    return this.#diagonal_stops[chunk.y][chunk.x];
                } else {
                    throw new Error("Invalid side");
                }
            default:
                throw new Error("Invalid side");
        }
    }

    #set_side_of(chunk, side, stops) {
        if (!this.is_a_valid_chunk_position(chunk)) {
            throw new Error("Invalid position");
        }

        switch (side) {
            case LUT.SIDE.TOP:
                this.#horizontal_stops[chunk.y][chunk.x] = stops;
                break;
            case LUT.SIDE.BOTTOM:
                this.#horizontal_stops[chunk.y + 1][chunk.x] = stops;
                break;
            case LUT.SIDE.LEFT:
                this.#vertical_stops[chunk.y][chunk.x] = stops;
                break;
            case LUT.SIDE.RIGHT:
                this.#vertical_stops[chunk.y][chunk.x + 1] = stops;
                break;
            case LUT.DIAGONAL.TLBR:
            case LUT.DIAGONAL.BLTR:
                this.#diagonal_stops[chunk.y][chunk.x] = stops;
                this.#diagonal_types[chunk.y][chunk.x] = side;
                break;
            default:
                throw new Error("Invalid side");
        }
    }
}
