class GridOverview {
    #canvas = undefined;
    #ctx = undefined;

    #resize_event_observer = undefined;

    #bounding_box = {
        width: 300,
        height: 300,
        get center() {
            return new Point(this.width, this.height).scale(0.5);
        },
    };

    #settings = {
        cell_size: 10,
        cell_fill_color: "#f53535",
        cell_border_size: 2,
        cell_border_color: "#313131",
    };

    #onresize = undefined;

    set onresize(value) {
        this.#onresize = value;
    }

    constructor(canvas) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext("2d");

        // Observe canvas size changes
        this.#resize_event_observer = new ResizeObserver((entries) => {
            const entry = entries[0];

            if (entry.contentBoxSize) {
                // According to standart, 'contentBoxSize' is an array, but some browsers will return plain object
                if (entry.contentBoxSize[0]) {
                    this.#bounding_box.width = entry.contentBoxSize[0].inlineSize;
                    this.#bounding_box.height = entry.contentBoxSize[0].blockSize;
                } else {
                    this.#bounding_box.width = entry.contentBoxSize.inlineSize;
                    this.#bounding_box.height = entry.contentBoxSize.blockSize;
                }
            }

            this.#canvas.width = this.#bounding_box.width;
            this.#canvas.height = this.#bounding_box.height;

            if (this.#onresize) this.#onresize();
        });

        this.#resize_event_observer.observe(canvas);
    }

    #compute_table_anchor(grid) {
        const tpw = (grid.width - 2) * this.#settings.cell_size;
        const tph = (grid.height - 2) * this.#settings.cell_size;

        return this.#bounding_box.center.subtract(new Point(tpw, tph).scale(0.5));
    }

    #clear_canvas() {
        this.#ctx.clearRect(0, 0, this.#bounding_box.width, this.#bounding_box.height);
    }

    render(grid_window) {
        this.#clear_canvas();

        const ctx = this.#ctx;

        ctx.save();

        ctx.fillStyle = this.#settings.cell_fill_color;
        ctx.strokeStyle = this.#settings.cell_border_color;
        ctx.lineWidth = this.#settings.cell_border_size;

        const grid = grid_window.grid;
        const size = this.#settings.cell_size;
        const half_size = size / 2;
        const point_offset = Point.subtract(this.#compute_table_anchor(grid), new Point(half_size, half_size));

        const win_x = grid_window.position.x;
        const win_y = grid_window.position.y;

        for (let y = 0; y < grid.height - 1; y++) {
            for (let x = 0; x < grid.width - 1; x++) {
                const current = x === win_x && y === win_y;
                const pos = new Point(x, y).scale(size).add(point_offset);

                if (current) {
                    ctx.fillRect(pos.x, pos.y, size, size);
                }

                ctx.strokeRect(pos.x, pos.y, size, size);
            }
        }

        ctx.restore();
    }
}

class MapRenderer {
    #canvas = undefined;
    #ctx = undefined;

    #resize_event_observer = undefined;

    #bounding_box = {
        width: 300,
        height: 300,
        get center() {
            return new Point(this.width, this.height).scale(0.5);
        },
    };

    settings = {
        margin: 50, // In pixels
        chunk_pixel_size: 250, // In pixels
        chunk_scale_size: 20, // In millimeters

        border_size: 3,
        border_color: "#313131",

        diagonal_size: 1,
        diagonal_color: "#818181",

        height_line_size: 2,
        height_line_color: "#306fe7",

        marker_size: 6,
        marker_color: "#f53535",

        text_color: "#131313",
        text_size: 14,
        text_font: "sans-serif",

        show_vertex_height: true,
        show_side_length: true,
        show_height_lines: false,
        show_height_lines_labels: false,
    };

    #current_chunk_pixel_size = this.settings.chunk_pixel_size;

    #onresize = undefined;

    /**
     * @param {Function} value
     */
    set onresize(value) {
        this.#onresize = value;
    }

    constructor(canvas) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext("2d");

        // Observe canvas size changes
        this.#resize_event_observer = new ResizeObserver((entries) => {
            this.update_current_canvas_size();

            if (this.#onresize) this.#onresize();
        });

        this.#resize_event_observer.observe(canvas);
    }

    // ========================================================================================================================== SIZE UTILITIES

    update_current_canvas_size() {
        const box = this.#canvas.getBoundingClientRect();

        // console.log("SYNCING:", box);

        this.#bounding_box.width = this.#canvas.width = box.width;
        this.#bounding_box.height = this.#canvas.height = box.height;
    }

    set_pixel_size_for_grid(grid) {
        const margin = this.settings.margin;

        const optimal_pixel_width = (this.#bounding_box.width - 2 * margin) / (grid.width - 1);
        const optimal_pixel_height = (this.#bounding_box.height - 2 * margin) / (grid.height - 1);

        this.#current_chunk_pixel_size = Math.min(optimal_pixel_width, optimal_pixel_height, this.settings.chunk_pixel_size);
    }

    set_pixel_size_for_window(window) {
        const margin = this.settings.margin;

        const optimal_pixel_width = this.#bounding_box.width - 2 * margin;
        const optimal_pixel_height = this.#bounding_box.height - 2 * margin;

        this.#current_chunk_pixel_size = Math.min(optimal_pixel_width, optimal_pixel_height, this.settings.chunk_pixel_size);
    }

    preferred_size_for_grid(grid) {
        const margin = this.settings.margin;
        const width = 2 * margin + this.settings.chunk_pixel_size * (grid.width - 1);
        const height = 2 * margin + this.settings.chunk_pixel_size * (grid.height - 1);
        return new Point(width, height);
    }

    preferred_size_for_window(window) {
        const margin = this.settings.margin;
        const width = 2 * margin + this.settings.chunk_pixel_size;
        const height = 2 * margin + this.settings.chunk_pixel_size;
        return new Point(width, height);
    }

    set_canvas_size(size) {
        this.#canvas.width = size.x;
        this.#canvas.height = size.y;
    }

    // ========================================================================================================================== RENDERING UTILITIES

    #compute_table_anchor(grid) {
        const tpw = (grid.width - 1) * this.#current_chunk_pixel_size;
        const tph = (grid.height - 1) * this.#current_chunk_pixel_size;

        return this.#bounding_box.center.subtract(new Point(tpw, tph).scale(0.5));
    }

    clear_canvas() {
        this.#ctx.clearRect(0, 0, this.#bounding_box.width, this.#bounding_box.height);
    }

    #table2point(table_anchor, x, y) {
        return table_anchor.add(new Point(x, y).scale(this.#current_chunk_pixel_size));
    }

    #table_point2point(table_anchor, p) {
        return table_anchor.add(p.scale(this.#current_chunk_pixel_size));
    }

    #corner2point(corner) {
        return LUT.CORNER_TO_OFFSET.get(corner).scale(this.#current_chunk_pixel_size);
    }

    #determine_label(coords, width, height) {
        const x = coords.x;
        const y = coords.y;

        const offset_size = new Point(7, 5);

        let config = {
            align: "left",
            baseline: "top",
            offset: new Point(offset_size.x, offset_size.y),
            clear: {
                x: 0,
                y: 0,
                width: 1,
                height: 1,
            },
        };

        if (x === 0 || x === width - 1) {
            if (y > 0 && y < height - 1) {
                config.baseline = "middle";
                config.offset.y = 0;
                config.clear.y = -0.5;
                // config.clear.height = 1;
            }

            if (x === 0) {
                config.align = "right";
                config.offset.x = -offset_size.x;
                config.clear.x = -1;
            } else if (x === width - 1) {
                config.align = "left";
                config.offset.x = offset_size.x;
                config.clear.x = 0;
            }
        }

        if (y === 0 || y === height - 1) {
            if (x > 0 && x < width - 1) {
                config.align = "center";
                config.offset.x = 0;
                config.clear.x = -0.5;
            }

            if (y === 0) {
                config.baseline = "bottom";
                config.offset.y = -offset_size.y;
                config.clear.y = -1;
            } else if (y === height - 1) {
                config.baseline = "top";
                config.offset.y = offset_size.y;
                config.clear.y = 0;
            }
        }

        return config;
    }

    // offset = 1: On top
    // offset = 0: Inline
    // offset = -1: On bottom
    #draw_label_between_points(point_a, point_b, text, offset = 1, set_style = true) {
        const ctx = this.#ctx;
        const middle = Point.add(point_a, point_b).scale(0.5);

        let diff = Point.subtract(point_b, point_a);
        let angle = Math.atan(diff.y / diff.x);

        ctx.save();
        if (set_style) {
            ctx.fillStyle = this.settings.text_color;
            ctx.font = `${this.settings.text_size}px ${this.settings.text_font}`;
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        const clear_size = ctx.measureText(text);
        const clear_width = clear_size.width + 4;
        const clear_height = clear_size.fontBoundingBoxAscent;

        if (Point.distance_sqr(point_a, point_b) >= clear_width * clear_width) {
            ctx.translate(middle.x, middle.y);
            ctx.rotate(angle);

            switch (offset) {
                case 1:
                    ctx.textBaseline = "bottom";
                    ctx.fillText(text, 0, -3);
                    break;
                case 0:
                    ctx.clearRect(-clear_width / 2, 2, clear_width, -clear_height / 2);
                    ctx.textBaseline = "middle";
                    // offsetting text verticaly based on the angle
                    // without it, text written on the vertical sides will be offcenter
                    ctx.fillText(text, 0, Math.sin(angle));
                    break;
                case -1:
                    ctx.textBaseline = "top";
                    ctx.fillText(text, 0, 4);
                    break;

                default:
                    break;
            }
        }

        ctx.restore();
    }

    // offset = 1: On top
    // offset = 0: Inline
    // offset = -1: On bottom
    #draw_distance_label(point_a, point_b, offset = 1) {
        const ctx = this.#ctx;
        const distance = Point.distance(point_a, point_b);

        // Convert pixel distance to scaled length
        const sd = (distance / this.settings.chunk_pixel_size) * this.settings.chunk_scale_size;
        const text = sd.toFixed(1);

        ctx.save();
        ctx.fillStyle = this.settings.text_color;
        ctx.font = `${this.settings.text_size}px ${this.settings.text_font}`;

        const clear_size = this.#ctx.measureText(text);
        const clear_width = clear_size.width + 20;
        ctx.restore();

        if (clear_width > distance) {
            return;
        }

        this.#draw_label_between_points(point_a, point_b, text, offset);
    }

    // ========================================================================================================================== MAP RENDERING

    #draw_map_borders(grid) {
        const ctx = this.#ctx;
        const size = this.#current_chunk_pixel_size;

        ctx.save();
        ctx.strokeStyle = this.settings.border_color;
        ctx.lineWidth = this.settings.border_size;

        ctx.beginPath();

        const pixel_halfsize = new Point(grid.width - 1, grid.height - 1).scale(size * 0.5);

        const top_left = Point.subtract(this.#bounding_box.center, pixel_halfsize);
        const bottom_right = Point.add(this.#bounding_box.center, pixel_halfsize);

        for (let y = 0; y < grid.height; y++) {
            ctx.moveTo(top_left.x, top_left.y + y * size);
            ctx.lineTo(bottom_right.x, top_left.y + y * size);
        }
        for (let x = 0; x < grid.width; x++) {
            ctx.moveTo(top_left.x + x * size, top_left.y);
            ctx.lineTo(top_left.x + x * size, bottom_right.y);
        }

        ctx.stroke();

        ctx.restore();
    }

    #draw_map_markers(grid) {
        const ctx = this.#ctx;
        const table_anchor = this.#compute_table_anchor(grid);

        ctx.save();
        ctx.fillStyle = this.settings.marker_color;
        const size = this.settings.marker_size;

        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const pos = this.#table2point(table_anchor, x, y);
                ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
            }
        }

        ctx.restore();
    }

    #draw_map_height_labels(grid) {
        const ctx = this.#ctx;
        const table_anchor = this.#compute_table_anchor(grid);

        ctx.save();
        ctx.fillStyle = this.settings.text_color;
        ctx.font = `${this.settings.text_size}px ${this.settings.text_font}`;

        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const coords = new Point(x, y);
                const text = grid.get(coords).toFixed(2);
                const label_cfg = this.#determine_label(coords, grid.width, grid.height);

                const pos = this.#table2point(table_anchor, x, y).add(label_cfg.offset);

                // const clear_size = ctx.measureText(text);
                // const clear_width = clear_size.width + 4;
                // const clear_height = clear_size.fontBoundingBoxAscent;
                // const clear_x = clear_width * label_cfg.clear.x;
                // const clear_y = clear_height * label_cfg.clear.y;

                ctx.textAlign = label_cfg.align;
                ctx.textBaseline = label_cfg.baseline;

                // ctx.fillRect(pos.x + clear_x, pos.y + clear_y, clear_width * label_cfg.clear.width, clear_height * label_cfg.clear.height);
                ctx.fillText(text, pos.x, pos.y);
            }
        }

        ctx.restore();
    }

    #draw_computed_map_diagonals(grid) {
        const ctx = this.#ctx;
        const size = this.#current_chunk_pixel_size;
        const table_anchor = this.#compute_table_anchor(grid);

        ctx.save();
        ctx.strokeStyle = this.settings.diagonal_color;
        ctx.lineWidth = this.settings.diagonal_size;

        ctx.beginPath();

        for (let y = 0; y < grid.height - 1; y++) {
            for (let x = 0; x < grid.width - 1; x++) {
                const pos = this.#table2point(table_anchor, x, y);
                const corners = LUT.SIDE_TO_CORNERS.get(grid.get_diagonal_of(new Point(x, y)));
                const a = LUT.CORNER_TO_OFFSET.get(corners[0]).scale(size).add(pos);
                const b = LUT.CORNER_TO_OFFSET.get(corners[1]).scale(size).add(pos);
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
            }
        }

        ctx.stroke();

        ctx.restore();
    }

    #draw_computed_map_stops(grid, data) {
        const ctx = this.#ctx;
        const table_anchor = this.#compute_table_anchor(grid);

        ctx.save();
        ctx.fillStyle = this.settings.marker_color;
        const marker_size = this.settings.marker_size;
        const pixel_size = this.#current_chunk_pixel_size;

        data.forEach(
            (({ chunk, side, stops }) => {
                const chunk_top_left = this.#table2point(table_anchor, chunk.x, chunk.y);
                const corners = LUT.SIDE_TO_CORNERS.get(side);
                const a = LUT.CORNER_TO_OFFSET.get(corners[0]).scale(pixel_size).add(chunk_top_left);
                const b = LUT.CORNER_TO_OFFSET.get(corners[1]).scale(pixel_size).add(chunk_top_left);

                stops.forEach(
                    ((t) => {
                        if (t < 0.0001 || t > 0.9999) return;
                        const marker = Point.lerp(a, b, t);
                        ctx.fillRect(marker.x - marker_size / 2, marker.y - marker_size / 2, marker_size, marker_size);
                    }).bind(this)
                );
            }).bind(this)
        );
        // for (let y = 0; y < grid.height; y++) {
        //     for (let x = 0; x < grid.width; x++) {
        //         const pos = this.#table2point(table_anchor, x, y);
        //         ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
        //     }
        // }

        ctx.restore();
    }

    #draw_computed_map_distance_labels_for_side(grid, chunk, side, stops) {
        const table_anchor = this.#compute_table_anchor(grid);
        const chunk_top_left = this.#table2point(table_anchor, chunk.x, chunk.y);
        const pixel_size = this.#current_chunk_pixel_size;

        const corners = LUT.SIDE_TO_CORNERS.get(side);
        const start = LUT.CORNER_TO_OFFSET.get(corners[0]).scale(pixel_size).add(chunk_top_left);
        const end = LUT.CORNER_TO_OFFSET.get(corners[1]).scale(pixel_size).add(chunk_top_left);

        let prev = start;

        stops.forEach((t) => {
            const stop = Point.lerp(start, end, t);
            this.#draw_distance_label(prev, stop, 0);
            prev = stop;
        });

        this.#draw_distance_label(prev, end, 0);
    }

    #draw_computed_map_distance_labels(grid, data) {
        data.forEach(
            (({ chunk, side, stops }) => {
                this.#draw_computed_map_distance_labels_for_side(grid, chunk, side, stops);
            }).bind(this)
        );
    }

    #draw_computed_map_height_lines(grid) {
        const ctx = this.#ctx;

        const table_anchor = this.#compute_table_anchor(grid);

        ctx.save();
        ctx.strokeStyle = this.settings.height_line_color;
        ctx.lineWidth = this.settings.height_line_size;

        ctx.beginPath();

        let is_first = true;

        function begin() {
            is_first = true;
        }

        function path(p) {
            if (is_first) {
                ctx.moveTo(p.x, p.y);
                is_first = false;
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }

        function point(chunk, line_point) {
            let coords = undefined;
            switch (line_point.source) {
                case "corner":
                    coords = this.#table_point2point(table_anchor, LUT.CORNER_TO_OFFSET.get(line_point.corner).add(chunk));
                    break;
                case "stop":
                    const corners = LUT.SIDE_TO_CORNERS.get(line_point.side);
                    const a = this.#table_point2point(table_anchor, LUT.CORNER_TO_OFFSET.get(corners[0]).add(chunk));
                    const b = this.#table_point2point(table_anchor, LUT.CORNER_TO_OFFSET.get(corners[1]).add(chunk));
                    coords = Point.lerp(a, b, line_point.value);
                    break;
                default:
                    throw new Error("Unknown line point source");
            }

            path(coords);
        }

        function end() {}

        for (let y = 0; y < grid.height - 1; y++) {
            for (let x = 0; x < grid.width - 1; x++) {
                const chunk = new Point(x, y);
                grid.get_height_lines_of(chunk).forEach(
                    ((line) => {
                        begin();
                        line.forEach(
                            ((p) => {
                                point.bind(this)(chunk, p);
                            }).bind(this)
                        );
                        console.groupEnd();
                        end();
                    }).bind(this)
                );
            }
        }

        ctx.stroke();

        ctx.restore();
    }

    #draw_computed_map_label_for_height_line(grid, chunk, line) {
        const table_anchor = this.#compute_table_anchor(grid);

        function coords_for(line_point) {
            switch (line_point.source) {
                case "corner":
                    return this.#table_point2point(table_anchor, LUT.CORNER_TO_OFFSET.get(line_point.corner).add(chunk));
                case "stop":
                    const corners = LUT.SIDE_TO_CORNERS.get(line_point.side);
                    const a = this.#table_point2point(table_anchor, LUT.CORNER_TO_OFFSET.get(corners[0]).add(chunk));
                    const b = this.#table_point2point(table_anchor, LUT.CORNER_TO_OFFSET.get(corners[1]).add(chunk));
                    return Point.lerp(a, b, line_point.value);
                default:
                    throw new Error("Unknown line point source");
            }
        }

        const choice = line.reduce(
            (choice, point, index) => {
                if (index === 0)
                    return {
                        length: 0,
                    };

                const start = coords_for.bind(this)(line[index - 1]);
                const end = coords_for.bind(this)(line[index]);

                const length = Point.distance(start, end);

                if (choice.length <= length) {
                    return {
                        a: start,
                        b: end,
                        length: length,
                        height: line[index].height,
                    };
                } else {
                    return choice;
                }
            },
            { length: 0 }
        );
        this.#draw_label_between_points(choice.a, choice.b, choice.height, 0, false);
    }

    #draw_computed_map_height_line_labels(grid) {
        const ctx = this.#ctx;

        ctx.save();
        ctx.fillStyle = this.settings.height_line_color;
        ctx.font = `${this.settings.text_size}px ${this.settings.text_font}`;

        for (let y = 0; y < grid.height - 1; y++) {
            for (let x = 0; x < grid.width - 1; x++) {
                const chunk = new Point(x, y);
                grid.get_height_lines_of(chunk).forEach(
                    ((line) => {
                        this.#draw_computed_map_label_for_height_line.bind(this)(grid, chunk, line);
                    }).bind(this)
                );
            }
        }

        ctx.restore();
    }

    // ========================================================================================================================== WINDOW RENDERING

    #draw_window_border(window) {
        const ctx = this.#ctx;
        const size = this.#current_chunk_pixel_size;

        ctx.save();
        ctx.strokeStyle = this.settings.border_color;
        ctx.lineWidth = this.settings.border_size;

        ctx.beginPath();

        const top_left = Point.subtract(this.#bounding_box.center, new Point(size * 0.5, size * 0.5));

        ctx.strokeRect(top_left.x, top_left.y, size, size);

        ctx.restore();
    }

    #draw_window_markers(window) {
        const ctx = this.#ctx;

        ctx.save();
        ctx.fillStyle = this.settings.marker_color;
        const marker_size = this.settings.marker_size;
        const pixel_size = this.#current_chunk_pixel_size;
        const top_left = Point.subtract(this.#bounding_box.center, new Point(pixel_size * 0.5, pixel_size * 0.5));

        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 2; x++) {
                const pos = top_left.add(new Point(x, y).scale(pixel_size));
                ctx.fillRect(pos.x - marker_size / 2, pos.y - marker_size / 2, marker_size, marker_size);
            }
        }

        ctx.restore();
    }

    #draw_window_height_labels(window) {
        const ctx = this.#ctx;
        const pixel_size = this.#current_chunk_pixel_size;
        const top_left = Point.subtract(this.#bounding_box.center, new Point(pixel_size * 0.5, pixel_size * 0.5));

        ctx.save();
        ctx.fillStyle = this.settings.text_color;
        ctx.font = `${this.settings.text_size}px ${this.settings.text_font}`;

        LUT.ALL_CORNERS.forEach((corner) => {
            const coords = LUT.CORNER_TO_OFFSET.get(corner);
            const label_cfg = this.#determine_label(coords, 2, 2);

            const pos = top_left.add(coords.scale(pixel_size)).add(label_cfg.offset);
            ctx.textAlign = label_cfg.align;
            ctx.textBaseline = label_cfg.baseline;

            ctx.fillText(window.get(corner), pos.x, pos.y);
        });

        ctx.restore();
    }

    #draw_computed_window_diagonal(window) {
        const ctx = this.#ctx;
        const size = this.#current_chunk_pixel_size;

        ctx.save();
        ctx.strokeStyle = this.settings.border_color;
        ctx.lineWidth = this.settings.border_size;

        const pixel_halfsize = new Point(size * 0.5, size * 0.5);
        const top_left = Point.subtract(this.#bounding_box.center, pixel_halfsize);

        const corners = LUT.SIDE_TO_CORNERS.get(window.diagonal_type);
        const a = LUT.CORNER_TO_OFFSET.get(corners[0]).scale(size).add(top_left);
        const b = LUT.CORNER_TO_OFFSET.get(corners[1]).scale(size).add(top_left);

        ctx.beginPath();

        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        ctx.stroke();

        ctx.restore();
    }

    #draw_computed_window_height_lines(window) {
        const ctx = this.#ctx;
        const size = this.#current_chunk_pixel_size;

        ctx.save();
        ctx.strokeStyle = this.settings.height_line_color;
        ctx.lineWidth = this.settings.height_line_size;

        const pixel_halfsize = new Point(size * 0.5, size * 0.5);
        const top_left = Point.subtract(this.#bounding_box.center, pixel_halfsize);

        ctx.beginPath();

        let is_first = true;

        function begin() {
            is_first = true;
        }

        function path(p) {
            if (is_first) {
                ctx.moveTo(p.x, p.y);
                is_first = false;
            } else {
                ctx.lineTo(p.x, p.y);
            }
        }

        function point(line_point) {
            let coords = undefined;
            switch (line_point.source) {
                case "corner":
                    coords = LUT.CORNER_TO_OFFSET.get(line_point.corner).scale(size).add(top_left);
                    break;
                case "stop":
                    const corners = LUT.SIDE_TO_CORNERS.get(line_point.side);
                    const a = LUT.CORNER_TO_OFFSET.get(corners[0]).scale(size).add(top_left);
                    const b = LUT.CORNER_TO_OFFSET.get(corners[1]).scale(size).add(top_left);
                    coords = Point.lerp(a, b, line_point.value);
                    break;
                default:
                    throw new Error("Unknown line point source");
            }

            path(coords);
        }

        function end() {}

        window.get_height_lines().forEach(
            ((line) => {
                begin();
                line.forEach(point.bind(this));
                console.groupEnd();
                end();
            }).bind(this)
        );

        ctx.stroke();

        ctx.restore();
    }

    #draw_computed_window_stop_markers(window) {
        const ctx = this.#ctx;

        ctx.save();

        ctx.fillStyle = this.settings.marker_color;
        const marker_size = this.settings.marker_size;
        const pixel_size = this.#current_chunk_pixel_size;
        const top_left = Point.subtract(this.#bounding_box.center, new Point(pixel_size * 0.5, pixel_size * 0.5));

        window.get_sides().forEach((side) => {
            const corners = LUT.SIDE_TO_CORNERS.get(side);
            const a = LUT.CORNER_TO_OFFSET.get(corners[0]).scale(pixel_size);
            const b = LUT.CORNER_TO_OFFSET.get(corners[1]).scale(pixel_size);

            window.get_stops_for(side).forEach((t) => {
                const marker_offset = Point.lerp(a, b, t);
                const pos = top_left.add(marker_offset);
                ctx.fillRect(pos.x - marker_size / 2, pos.y - marker_size / 2, marker_size, marker_size);
            });
        });
        ctx.restore();
    }

    #draw_computed_window_distance_labels_for_side(stops, side) {
        const pixel_halfsize = this.#current_chunk_pixel_size * 0.5;
        const top_left = Point.subtract(this.#bounding_box.center, new Point(pixel_halfsize, pixel_halfsize));

        const corners = LUT.SIDE_TO_CORNERS.get(side);
        const start = this.#corner2point(corners[0]).add(top_left);
        const end = this.#corner2point(corners[1]).add(top_left);

        let prev = start;

        stops.forEach((t) => {
            const stop = Point.lerp(start, end, t);
            this.#draw_distance_label(prev, stop, 0);
            prev = stop;
        });

        this.#draw_distance_label(prev, end, 0);
    }

    #draw_computed_window_distance_labels(window) {
        window.get_sides().forEach((side) => {
            this.#draw_computed_window_distance_labels_for_side(window.get_stops_for(side), side);
        });
    }

    #draw_computed_window_label_for_height_line(line) {
        const size = this.#current_chunk_pixel_size;
        const pixel_halfsize = new Point(size * 0.5, size * 0.5);
        const top_left = Point.subtract(this.#bounding_box.center, pixel_halfsize);

        function coords_for(line_point) {
            switch (line_point.source) {
                case "corner":
                    return LUT.CORNER_TO_OFFSET.get(line_point.corner).scale(size).add(top_left);
                case "stop":
                    const corners = LUT.SIDE_TO_CORNERS.get(line_point.side);
                    const a = LUT.CORNER_TO_OFFSET.get(corners[0]).scale(size).add(top_left);
                    const b = LUT.CORNER_TO_OFFSET.get(corners[1]).scale(size).add(top_left);
                    return Point.lerp(a, b, line_point.value);
                default:
                    throw new Error("Unknown line point source");
            }
        }

        const choice = line.reduce(
            (choice, point, index) => {
                if (index === 0)
                    return {
                        length: 0,
                    };

                const start = coords_for(line[index - 1]);
                const end = coords_for(line[index]);

                const length = Point.distance(start, end);

                if (choice.length <= length) {
                    return {
                        a: start,
                        b: end,
                        length: length,
                        height: line[index].height,
                    };
                } else {
                    return choice;
                }
            },
            { length: 0 }
        );
        this.#draw_label_between_points(choice.a, choice.b, choice.height, 0, false);
    }

    #draw_computed_window_height_line_labels(window) {
        const ctx = this.#ctx;

        ctx.save();
        ctx.fillStyle = this.settings.height_line_color;
        ctx.font = `${this.settings.text_size}px ${this.settings.text_font}`;

        window.get_height_lines().forEach(this.#draw_computed_window_label_for_height_line.bind(this));

        ctx.restore();
    }

    // ========================================================================================================================== RENDERING

    render_full_map(grid) {
        this.update_current_canvas_size();
        this.set_pixel_size_for_grid(grid);
        this.clear_canvas();
        this.#draw_map_borders(grid);
        this.#draw_map_markers(grid);

        if (grid instanceof ComputedHeightGrid) this.#render_computed_map(grid);

        if (this.settings.show_vertex_height) this.#draw_map_height_labels(grid);
    }

    #render_computed_map(grid) {
        const computed_data = grid.get_stops_for_all_sides();
        this.#draw_computed_map_diagonals(grid);
        if (this.settings.show_height_lines) this.#draw_computed_map_height_lines(grid);
        this.#draw_computed_map_stops(grid, computed_data);
        if (this.settings.show_side_length) this.#draw_computed_map_distance_labels(grid, computed_data);
        if (this.settings.show_height_lines && this.settings.show_height_lines_labels) this.#draw_computed_map_height_line_labels(grid);
    }

    render_window(window) {
        this.update_current_canvas_size();
        this.set_pixel_size_for_window(window);
        this.clear_canvas();
        this.#draw_window_border(window);
        this.#draw_window_markers(window);

        if (window instanceof ComputedHeightGridWindow) this.#render_computed_window(window);

        if (this.settings.show_vertex_height) this.#draw_window_height_labels(window);
    }

    #render_computed_window(window) {
        this.#draw_computed_window_diagonal(window);
        if (this.settings.show_height_lines) this.#draw_computed_window_height_lines(window);
        this.#draw_computed_window_stop_markers(window);
        if (this.settings.show_side_length) this.#draw_computed_window_distance_labels(window);
        if (this.settings.show_height_lines && this.settings.show_height_lines_labels) this.#draw_computed_window_height_line_labels(window);
    }
}
