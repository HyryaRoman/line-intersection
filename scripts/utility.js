/**
 * Represents point in a two dimensional euclidian space
 */
class Point {
    /**
     * Create new point with given coords
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        if (typeof x !== "number" || typeof y !== "number") {
            throw new Error("Invalid point coordinates");
        }
        this.x = Math.round(x);
        this.y = Math.round(y);
    }

    /**
     * Adds two points
     * @param {Point} p second point
     */
    add(p) {
        return new Point(this.x + p.x, this.y + p.y);
    }

    /**
     * Subtracts second point from first point
     * @param {Point} p second point
     */
    subtract(p) {
        return new Point(this.x - p.x, this.y - p.y);
    }

    /**
     * Multiplies point by scalar
     * @param {Point} p point
     * @param {number} s scale factor
     */
    scale(s) {
        return new Point(this.x * s, this.y * s);
    }

    /**
     * Performs 1/x
     * @param {Point} p point
     */
    inverse() {
        return new Point(1 / this.x, 1 / this.y);
    }

    /**
     * Adds two points
     * @param {Point} p1 first point
     * @param {Point} p2 second point
     */
    static add(p1, p2) {
        return new Point(p1.x + p2.x, p1.y + p2.y);
    }

    /**
     * Subtracts second point from first point
     * @param {Point} p1 first point
     * @param {Point} p2 second point
     */
    static subtract(p1, p2) {
        return new Point(p1.x - p2.x, p1.y - p2.y);
    }

    /**
     * Multiplies point by scalar
     * @param {Point} p point
     * @param {number} s scale factor
     */
    static scale(p, s) {
        return new Point(p.x * s, p.y * s);
    }

    /**
     * Performs 1/x
     * @param {Point} p point
     */
    static inverse(p) {
        return new Point(1 / p.x, 1 / p.y);
    }

    /**
     * Scales target point away from center point
     * @param {Point} c center point
     * @param {Point} p target point
     * @param {number} s scale factor
     */
    static scale_away_from(c, p, s) {
        return Point.subtract(p, c).scale(s).add(c);
    }

    /**
     * Linear interpolation between two points
     * @param {Point} p1 first point
     * @param {Point} p2 second point
     * @param {number} t factor
     */
    static lerp(p1, p2, t) {
        return Point.subtract(p2, p1).scale(t).add(p1);
    }

    /**
     * Inverse linear interpolation of target point between first and second points
     * @param {Point} p1 first point
     * @param {Point} p2 second point
     * @param {Point} pt target point
     */
    static inverse_lerp(p1, p2, pt) {
        return Point.scale(Point.subtract(pt, p1), Point.invert(Point.subtract(p2, p1)));
    }

    /**
     * Returns squared distance between two points
     * @param {Point} p1 first point
     * @param {Point} p2 second point
     */
    static distance_sqr(p1, p2) {
        const p = Point.subtract(p1, p2);
        return p.x * p.x + p.y * p.y;
    }

    /**
     * Returns distance between two points
     * @param {Point} p1 first point
     * @param {Point} p2 second point
     */
    static distance(p1, p2) {
        return Math.sqrt(Point.distance_sqr(p1, p2));
    }
}

/**
 * Height map represented as an expandable grid
 */
class HeightGrid {
    #width = 2;
    #height = 2;
    #data = [
        [0.0, 0.0],
        [0.0, 0.0],
    ];
    #is_valid = true;
    #onupdate = undefined;
    #is_expansion_locked = false;

    /**
     * Width of the grid
     * @returns {number}
     */
    get width() {
        return this.#width;
    }

    /**
     * Height of the grid
     * @returns {number}
     */
    get height() {
        return this.#height;
    }

    /**
     * Validation flag, updated via `HeightMap.validate()`
     * @returns {boolean}
     */
    get is_valid() {
        return this.#is_valid;
    }

    /**
     * Set onupdate event handler
     */
    set onupdate(value) {
        this.#onupdate = value;
    }

    /**
     * Lock grid expansion flag
     * @returns {boolean}
     */
    get is_expansion_locked() {
        return this.#is_expansion_locked;
    }

    /**
     * Lock grid expansion flag
     * @param {boolean} value
     */
    set is_expansion_locked(value) {
        this.#is_expansion_locked = value === true;
    }

    /**
     * Resets the grid into its default state: 2x2 grid of zeros
     */
    clear() {
        this.#width = 2;
        this.#height = 2;
        this.#data = [
            [0.0, 0.0],
            [0.0, 0.0],
        ];

        this.validate();

        if (this.#onupdate) this.#onupdate();
    }

    #is_valid_array(arr, len, should_be_number) {
        // undefined is not valid
        if (arr === undefined) {
            console.log(`[is_valid_array]: arr === undefined`);
            return false;
        }

        // non-arrays are not valid
        if (!Array.isArray(arr)) {
            console.log(`[is_valid_array]: !Array.isArray(arr)`);
            return false;
        }

        // arrays of incorrect length are not valid
        if (arr.length !== len) {
            console.log(`[is_valid_array]: arr.length(${arr.length}) !== len(${len})`);
            return false;
        }

        // arrays which contain non-number types are not valid
        if (should_be_number && arr.some((v) => typeof v !== "number")) {
            console.log(`[is_valid_array]: arr.some((v) => typeof v !== "number")`);
            return false;
        }

        return true;
    }

    /**
     * Validates the current state of the grid. Throws error if grid is not valid
     */
    validate() {
        function check_if_valid() {
            if (this.#width === undefined || this.#height === undefined) {
                console.log("this.#width === undefined || this.#height === undefined");
                return false;
            }
            if (typeof this.#width !== "number" || typeof this.#height !== "number") {
                console.log('typeof this.#width !== "number" || typeof this.#height !== "number"');
                return false;
            }
            if (!Number.isInteger(this.#width) || !Number.isInteger(this.#height)) {
                console.log("!Number.isInteger(this.#width) || !Number.isInteger(this.#height)");
                return false;
            }
            if (this.#width < 2 || this.#height < 2) {
                console.log("this.#width < 2 || this.#height < 2");
                return false;
            }
            if (!this.#is_valid_array(this.#data, this.#height, false)) {
                console.log("!is_valid_array(this.#data, this.#height, false)");
                return false;
            }
            if (!this.#data.every((row) => this.#is_valid_array(row, this.#width, true))) {
                console.log("!this.#data.every((row) => is_valid_array(row, this.#width, true))");
                return false;
            }

            return true;
        }

        this.#is_valid = check_if_valid.call(this);
        if (!this.#is_valid) {
            throw new Error("HeightGrid not valid!");
        }
        // return this.#is_valid;
    }

    /**
     * Attempts to recover grid and make it valid.
     *
     * API note: after calling this function grid will be valid regardless of
     * the result. Returning false just means no data could be recovered and the grid was cleared
     * @returns {boolean} true if data recovery attempt was successful, false otherwise
     */
    attempt_recovery() {
        function recover() {
            // Two fatal errors happen when some parts of data are not valid at all
            // If we encounter either, we assume nothing can be recovered, fully clear the grid and return
            if (!this.#is_valid_array(this.#data, this.#data.length, false)) {
                console.log("Data is not a valid array, clearing");
                this.clear();
                return false;
            }

            if (!this.#data.every((row) => this.#is_valid_array(row, row.length, false))) {
                console.log("Not every row is a valid array, clearing");
                this.clear();
                return false;
            }

            // In all other cases at least some data can be recovered

            // If not all rows have the same length, trim all rows to the length of the shortest
            if (!this.#data.every((row) => row.length === this.#data[0].length)) {
                const new_width = this.#data.reduce((accumulator, row) => Math.min(accumulator, row.length), Infinity);
                this.#data.forEach((row) => row.splice(new_width));
            }

            // If some element is not a number, make it 0.0
            this.#data.forEach((row) =>
                row.forEach((val, i, arr) => {
                    arr[i] = typeof val === "number" ? val : 0.0;
                })
            );

            // Set height and width to actual values
            this.#height = this.#data.length;
            this.#width = this.#data[0].length;

            try {
                // Validate if everything is correct
                this.validate();
                return true;
            } catch (error) {
                // We tried, clear the grid and return false
                this.clear();
                return false;
            }
        }

        try {
            this.validate();
            console.log("Grid is valid, recovery is unnecessary");
            return true;
        } catch (error) {
            console.log("Grid is not valid, attempting recovery");
            let result = recover.call(this);
            console.log("Recovery", result ? "success" : "failure");
            return result;
        }
    }

    /**
     * Saves the grid in localStorage in item with given name
     * @param {string} name Item name to store grid under
     */
    save_with_name(name) {
        this.validate();

        const item = {
            width: this.#width,
            height: this.#height,
            data: this.#data,
        };

        localStorage.setItem(name, JSON.stringify(item));
    }

    /**
     * Loads the grid in localStorage from localStorage item with given name
     * @param {string} name Item name to load grid from
     */
    load_from_name(name) {
        const item = JSON.parse(localStorage.getItem(name));
        // console.log(item);

        this.#width = item.width;
        this.#height = item.height;
        this.#data = item.data;

        this.validate();

        if (this.#onupdate) this.#onupdate();
    }

    /**
     * Check if point is inside the grid, thus being a valid position
     * @param {Point} point point to check
     * @returns {boolean} true if point is inside the grid, false otherwise
     */
    is_a_valid_position(point) {
        if (!this.#is_valid) {
            throw new Error("Trying to use inside invalid HeightGrid");
        }

        if (point === undefined || !point instanceof Point) {
            throw new Error("Invalid point");
        }

        return point.x >= 0 && point.x < this.#width && point.y >= 0 && point.y < this.#height;
    }

    /**
     * Check if point is inside the grid, thus being a valid position
     * @param {Point} point point to check
     * @returns {boolean} true if point is inside the grid, false otherwise
     */
    is_a_valid_chunk_position(point) {
        if (!this.#is_valid) {
            throw new Error("Trying to use invalid HeightGrid");
        }

        if (point === undefined || !point instanceof Point) {
            throw new Error("Invalid point");
        }

        return point.x >= 0 && point.x < this.#width - 1 && point.y >= 0 && point.y < this.#height - 1;
    }

    /**
     * Get height at given point
     * @param {Point} pos position
     * @returns {number} height at given point
     */
    get(pos) {
        if (!this.#is_valid) {
            throw new Error("Trying to get value from invalid HeightGrid");
        }

        if (!this.is_a_valid_position(pos)) {
            throw new Error("Position out of bounds");
        }

        return this.#data[pos.y][pos.x];
    }

    /**
     * Set height at given point
     * @param {Point} pos position
     * @param {number} height height at given point
     */
    set(pos, height) {
        if (!this.#is_valid) {
            throw new Error("Trying to set value to invalid HeightGrid");
        }

        if (!this.is_a_valid_position(pos)) {
            throw new Error("Position out of bounds");
        }

        if (height === undefined || typeof height !== "number") {
            throw new Error("Invalid height");
        }

        this.#data[pos.y][pos.x] = height;

        if (this.#onupdate) this.#onupdate();
    }

    /**
     * Get height of given corner of given chunk
     * @param {Point} chunk_pos chunk position
     * @param {LUT.CORNER} corner chunk corner
     * @returns {number} height at given corner of given chunk
     */
    get_corner_of(chunk_pos, corner) {
        if (!this.#is_valid) {
            throw new Error("Trying to get value from invalid HeightGrid");
        }

        if (!this.is_a_valid_chunk_position(chunk_pos)) {
            throw new Error("Position is not valid for a chunk");
        }

        if (!LUT.CORNER_TO_OFFSET.has(corner)) {
            throw new Error("Invalid corner");
        }

        return this.get(Point.add(chunk_pos, LUT.CORNER_TO_OFFSET.get(corner)));
    }

    /**
     * Get height of given corner of given chunk
     * @param {Point} chunk_pos chunk position
     * @param {LUT.CORNER} corner chunk corner
     * @param {number} height height at given point
     */
    set_corner_of(chunk_pos, corner, height) {
        if (!this.is_a_valid_chunk_position(chunk_pos)) {
            throw new Error("Position is not valid for a chunk");
        }

        if (!LUT.CORNER_TO_OFFSET.has(corner)) {
            throw new Error("Invalid corner");
        }

        this.set(Point.add(chunk_pos, LUT.CORNER_TO_OFFSET.get(corner)), height);
    }

    /**
     * Expand grid to the right, filling right-most column with zeros
     * @param {boolean} should_validate_and_update Should expansion trigger validation and update event
     */
    expand_right(should_validate_and_update = true) {
        if (!this.#is_valid) {
            throw new Error("Trying to expand invalid HeightGrid");
        }

        if (this.#is_expansion_locked) {
            throw new Error("This grid has expancion locked");
        }

        this.#width += 1;
        this.#data.forEach((row) => {
            row.push(0.0);
        });

        if (should_validate_and_update) {
            this.validate();
            if (this.#onupdate) this.#onupdate();
        }
    }

    /**
     * Expand grid to the left, filling left-most column with zeros
     * @param {boolean} should_validate_and_update Should expansion trigger validation and update event
     */
    expand_left(should_validate_and_update = true) {
        if (!this.#is_valid) {
            throw new Error("Trying to expand invalid HeightGrid");
        }

        if (this.#is_expansion_locked) {
            throw new Error("This grid has expancion locked");
        }

        this.#width += 1;
        this.#data.forEach((row) => {
            row.unshift(0.0);
        });

        if (should_validate_and_update) {
            this.validate();
            if (this.#onupdate) this.#onupdate();
        }
    }

    /**
     * Expand grid downwards, filling bottom row with zeros
     * @param {boolean} should_validate_and_update Should expansion trigger validation and update event
     */
    expand_down(should_validate_and_update = true) {
        if (!this.#is_valid) {
            throw new Error("Trying to expand invalid HeightGrid");
        }

        if (this.#is_expansion_locked) {
            throw new Error("This grid has expancion locked");
        }

        this.#height += 1;
        this.#data.push(Array.from({ length: this.#width }, () => 0.0));

        if (should_validate_and_update) {
            this.validate();
            if (this.#onupdate) this.#onupdate();
        }
    }

    /**
     * Expand grid upwards, filling top row with zeros
     * @param {boolean} should_validate_and_update Should expansion trigger validation and update event
     */
    expand_up(should_validate_and_update = true) {
        if (!this.#is_valid) {
            throw new Error("Trying to expand invalid HeightGrid");
        }

        if (this.#is_expansion_locked) {
            throw new Error("This grid has expancion locked");
        }

        this.#height += 1;
        this.#data.unshift(Array.from({ length: this.#width }, () => 0.0));

        if (should_validate_and_update) {
            this.validate();
            if (this.#onupdate) this.#onupdate();
        }
    }

    /**
     * Expand grid horizontaly by `amount.x` and vertically by `amount.y`
     * Sign specifies direction (x < 0 means left, y < 0 means up)
     * @param {Point} amount amount by which to expand in specified direction
     */
    expand_by(amount) {
        if (!this.#is_valid) {
            throw new Error("Trying to expand invalid HeightGrid");
        }

        if (this.#is_expansion_locked) {
            throw new Error("This grid has expancion locked");
        }

        if (amount === undefined || !amount instanceof Point) {
            throw new Error("Invalid amount");
        }

        const remaining = new Point(amount.x, amount.y);

        while (remaining.x < 0) {
            this.expand_left(false);
            remaining.x += 1;
        }
        while (remaining.x > 0) {
            this.expand_right(false);
            remaining.x -= 1;
        }
        while (remaining.y < 0) {
            this.expand_up(false);
            remaining.y += 1;
        }
        while (remaining.y > 0) {
            this.expand_down(false);
            remaining.y -= 1;
        }

        this.validate();
        if (this.#onupdate) this.#onupdate();
    }
}

/**
 * Window into the HeightGrid
 */
class HeightGridWindow {
    #grid = undefined;
    #position = new Point(0, 0);
    #onupdate = undefined;

    /**
     * @param {HeightGrid} grid underlying grid
     */
    constructor(grid) {
        if (!grid instanceof HeightGrid || !grid.is_valid) {
            throw new Error("Invalid grid");
        }

        this.#grid = grid;
    }

    /**
     * Underlying grid
     * @returns {HeightGrid}
     */
    get grid() {
        return this.#grid;
    }

    /**
     * Window position
     * @returns {Point}
     */
    get position() {
        return this.#position;
    }

    /**
     * Set onupdate event handler
     * @param {Function} value
     */
    set onupdate(value) {
        this.#onupdate = value;
    }

    /**
     * Validation flag, updated dynamically
     * @returns {boolean}
     */
    get is_valid() {
        return this.#grid.is_valid && this.#grid.is_a_valid_chunk_position(this.#position);
    }

    /**
     * Resets windows position
     */
    reset() {
        this.#position = new Point(0, 0);
        if (this.#onupdate) this.#onupdate();
    }

    /**
     * Offset window by given offset
     * @param {Point} offset offset vector
     */
    offset_by(offset) {
        if (offset === undefined || !offset instanceof Point) {
            throw new Error("Invalid offset");
        }

        const new_pos = Point.add(this.#position, offset);

        if (this.#grid.is_a_valid_chunk_position(new_pos)) {
            this.#position = new_pos;
            if (this.#onupdate) this.#onupdate();
        } else if (!this.#grid.is_expansion_locked) {
            const x_dir = Math.sign(offset.x);
            const x_wall = x_dir > 0 ? this.#grid.width - 2 : 0;
            const dist_to_x_wall = Math.abs(this.position.x - x_wall) * x_dir;

            const y_dir = Math.sign(offset.y);
            const y_wall = y_dir > 0 ? this.#grid.height - 2 : 0;
            const dist_to_y_wall = Math.abs(this.position.y - y_wall) * y_dir;

            const amount = new Point(offset.x - dist_to_x_wall, offset.y - dist_to_y_wall);

            this.#grid.expand_by(amount);

            if (new_pos.x < 0) new_pos.x = 0;
            if (new_pos.y < 0) new_pos.y = 0;

            if (!this.#grid.is_a_valid_chunk_position(new_pos)) {
                throw new Error("Failed expand grid");
            }

            this.#position = new_pos;

            if (this.#onupdate) this.#onupdate();
        } else {
            throw new Error("Cannot move the window out of bounds of underlying grid");
        }
    }

    /**
     * Check if window can be offset by given vector
     * @param {Point} offset offset vector
     * @returns {boolean}
     */
    can_offset_by(offset) {
        if (offset === undefined || !offset instanceof Point) {
            throw new Error("Invalid offset");
        }

        return this.#grid.is_a_valid_chunk_position(Point.add(this.#position, offset));
    }

    /**
     * Get height of given corner
     * @param {LUT.CORNER} corner corner
     * @returns {number} height in given corner
     */
    get(corner) {
        if (!corner in LUT.ALL_CORNERS) {
            throw new Error("Invalid corner");
        }
        if (!this.#grid.is_a_valid_chunk_position(this.#position)) {
            throw new Error("Invalid window position");
        }

        return this.#grid.get_corner_of(this.#position, corner);
    }

    /**
     * Set height of given corner
     * @param {LUT.CORNER} corner corner
     * @param {number} height height
     */
    set(corner, height) {
        if (!corner in LUT.ALL_CORNERS) {
            throw new Error("Invalid corner");
        }
        if (typeof height !== "number") {
            throw new Error("Invalid height");
        }
        if (!this.#grid.is_a_valid_chunk_position(this.#position)) {
            throw new Error("Invalid window position");
        }

        this.#grid.set_corner_of(this.#position, corner, height);

        if (this.#onupdate) this.#onupdate();
    }
}
