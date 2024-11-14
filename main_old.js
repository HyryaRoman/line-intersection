const TOP_LEFT_CORNER = "top_left"; // Represents top left corner
const TOP_RIGHT_CORNER = "top_right"; // Represents top right corner
const BOTTOM_LEFT_CORNER = "bottom_left"; // Represents bottom left corner
const BOTTOM_RIGHT_CORNER = "bottom_right"; // Represents bottom right corner

const MAIN_CORNERS = [TOP_LEFT_CORNER, TOP_RIGHT_CORNER, BOTTOM_LEFT_CORNER, BOTTOM_RIGHT_CORNER];

const TOP_SIDE = "top_side"; // Represents top side
const BOTTOM_SIDE = "bottom_side"; // Represents bottom side
const LEFT_SIDE = "left_side"; // Represents left side
const RIGHT_SIDE = "right_side"; // Represents right side

const MAIN_SIDES = [TOP_SIDE, BOTTOM_SIDE, LEFT_SIDE, RIGHT_SIDE];

const TLBR_DIAGONAL = "top_left_bottom_right_diagonal"; // Represents diagonal going from top left to bottom right
const BLTR_DIAGONAL = "bottom_left_top_right_diagonal"; // Represents diagonal going from bottom left to top right

// Lookup table for assotiating corners to lines
const clut = new Map();

clut.set(TOP_SIDE, [TOP_LEFT_CORNER, TOP_RIGHT_CORNER]);
clut.set(BOTTOM_SIDE, [BOTTOM_LEFT_CORNER, BOTTOM_RIGHT_CORNER]);
clut.set(LEFT_SIDE, [TOP_LEFT_CORNER, BOTTOM_LEFT_CORNER]);
clut.set(RIGHT_SIDE, [TOP_RIGHT_CORNER, BOTTOM_RIGHT_CORNER]);
clut.set(TLBR_DIAGONAL, [TOP_LEFT_CORNER, BOTTOM_RIGHT_CORNER]);
clut.set(BLTR_DIAGONAL, [BOTTOM_LEFT_CORNER, TOP_RIGHT_CORNER]);

// Lookup table for determining diagonals
const dlut = new Map();

dlut.set([TOP_SIDE, BOTTOM_SIDE, LEFT_SIDE, RIGHT_SIDE].join(""), TLBR_DIAGONAL); // Opposite sides have the most points
dlut.set([BOTTOM_SIDE, TOP_SIDE, LEFT_SIDE, RIGHT_SIDE].join(""), BLTR_DIAGONAL); // Opposite sides have the most points
dlut.set([LEFT_SIDE, TOP_SIDE, BOTTOM_SIDE, RIGHT_SIDE].join(""), TLBR_DIAGONAL); // Simple case
dlut.set([TOP_SIDE, LEFT_SIDE, BOTTOM_SIDE, RIGHT_SIDE].join(""), TLBR_DIAGONAL); // Simple case
dlut.set([BOTTOM_SIDE, LEFT_SIDE, TOP_SIDE, RIGHT_SIDE].join(""), BLTR_DIAGONAL); // Simple case
dlut.set([LEFT_SIDE, BOTTOM_SIDE, TOP_SIDE, RIGHT_SIDE].join(""), BLTR_DIAGONAL); // Simple case
dlut.set([LEFT_SIDE, BOTTOM_SIDE, RIGHT_SIDE, TOP_SIDE].join(""), BLTR_DIAGONAL); // Simple case
dlut.set([BOTTOM_SIDE, LEFT_SIDE, RIGHT_SIDE, TOP_SIDE].join(""), BLTR_DIAGONAL); // Simple case
dlut.set([RIGHT_SIDE, LEFT_SIDE, BOTTOM_SIDE, TOP_SIDE].join(""), TLBR_DIAGONAL); // Opposite sides have the most points
dlut.set([LEFT_SIDE, RIGHT_SIDE, BOTTOM_SIDE, TOP_SIDE].join(""), BLTR_DIAGONAL); // Opposite sides have the most points
dlut.set([BOTTOM_SIDE, RIGHT_SIDE, LEFT_SIDE, TOP_SIDE].join(""), TLBR_DIAGONAL); // Simple case
dlut.set([RIGHT_SIDE, BOTTOM_SIDE, LEFT_SIDE, TOP_SIDE].join(""), TLBR_DIAGONAL); // Simple case
dlut.set([RIGHT_SIDE, TOP_SIDE, LEFT_SIDE, BOTTOM_SIDE].join(""), BLTR_DIAGONAL); // Simple case
dlut.set([TOP_SIDE, RIGHT_SIDE, LEFT_SIDE, BOTTOM_SIDE].join(""), BLTR_DIAGONAL); // Simple case
dlut.set([LEFT_SIDE, RIGHT_SIDE, TOP_SIDE, BOTTOM_SIDE].join(""), TLBR_DIAGONAL); // Opposite sides have the most points
dlut.set([RIGHT_SIDE, LEFT_SIDE, TOP_SIDE, BOTTOM_SIDE].join(""), BLTR_DIAGONAL); // Opposite sides have the most points
dlut.set([TOP_SIDE, LEFT_SIDE, RIGHT_SIDE, BOTTOM_SIDE].join(""), TLBR_DIAGONAL); // Simple case
dlut.set([LEFT_SIDE, TOP_SIDE, RIGHT_SIDE, BOTTOM_SIDE].join(""), TLBR_DIAGONAL); // Simple case
dlut.set([BOTTOM_SIDE, TOP_SIDE, RIGHT_SIDE, LEFT_SIDE].join(""), TLBR_DIAGONAL); // Opposite sides have the most points
dlut.set([TOP_SIDE, BOTTOM_SIDE, RIGHT_SIDE, LEFT_SIDE].join(""), BLTR_DIAGONAL); // Opposite sides have the most points
dlut.set([RIGHT_SIDE, BOTTOM_SIDE, TOP_SIDE, LEFT_SIDE].join(""), TLBR_DIAGONAL); // Simple case
dlut.set([BOTTOM_SIDE, RIGHT_SIDE, TOP_SIDE, LEFT_SIDE].join(""), TLBR_DIAGONAL); // Simple case
dlut.set([TOP_SIDE, RIGHT_SIDE, BOTTOM_SIDE, LEFT_SIDE].join(""), BLTR_DIAGONAL); // Simple case
dlut.set([RIGHT_SIDE, TOP_SIDE, BOTTOM_SIDE, LEFT_SIDE].join(""), BLTR_DIAGONAL); // Simple case

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(p2) {
        return Point.add(this, p2);
    }

    subtract(p2) {
        return Point.subtract(this, p2);
    }

    scale(s) {
        return Point.scale(this, s);
    }

    scale_away_from(c, s) {
        return Point.scale_away_from(c, this, s);
    }

    static add(p1, p2) {
        return new Point(p1.x + p2.x, p1.y + p2.y);
    }

    static subtract(p1, p2) {
        return new Point(p1.x - p2.x, p1.y - p2.y);
    }

    static scale(p, s) {
        return new Point(p.x * s, p.y * s);
    }

    static scale_away_from(c, p, s) {
        return Point.subtract(p, c).scale(s).add(c);
    }

    static lerp(p1, p2, t) {
        return Point.subtract(p2, p1).scale(t).add(p1);
    }

    static distance_sqr(p1, p2) {
        const p = Point.subtract(p1, p2);
        return p.x * p.x + p.y * p.y;
    }

    static distance(p1, p2) {
        return Math.sqrt(Point.distance_sqr(p1, p2));
    }
}

class Chunk {
    #corners = new Map();
    #stops = new Map();

    #diagonal_type = TLBR_DIAGONAL;
    #diagonal_stops = [];

    #step = 0.5;

    get step() {
        return this.#step;
    }

    set step(value) {
        this.#step = value;
        this.update();
    }

    get corners() {
        return this.#corners;
    }

    set corners(value) {
        this.#corners = value;
    }

    get stops() {
        return this.#stops;
    }

    get diagonal_type() {
        return this.#diagonal_type;
    }

    get diagonal_stops() {
        return this.#diagonal_stops;
    }

    set_corner(corner, height) {
        if (height === undefined) return;
        this.#corners.set(corner, height);
        this.update();
    }

    find_stops_between_heights(height_a, height_b) {
        const is_flipped = height_a > height_b;

        const a = Math.min(height_a, height_b);
        const b = Math.max(height_a, height_b);

        let first = Math.floor(a / this.step) * this.step;

        if (first <= a) {
            first += this.step;
        }

        let current = first;
        let stops = [];
        while (current < b) {
            stops.push(current);
            current += this.step;
        }

        if (is_flipped) {
            stops.reverse();
        }

        // console.log("found points", stops);

        stops = stops.map((p) => {
            // Inverse lerp
            let v = (p - a) / (b - a);
            if (is_flipped) {
                v = 1 - v;
            }
            return v;
        });

        // console.log("inverse lerp", stops);

        return stops;
    }

    update_stops() {
        MAIN_SIDES.forEach((side) => {
            const sp = clut.get(side);
            const h1 = this.#corners.get(sp[0]);
            const h2 = this.#corners.get(sp[1]);
            this.#stops.set(side, this.find_stops_between_heights(h1, h2));
        });
    }

    update_diagonal_type() {
        let max_points = MAIN_SIDES.map((side) => {
            return {
                name: side,
                value: this.#stops.get(side).length,
            };
        })
            .sort((a, b) => b.value - a.value)
            .map((s) => s.name);

        this.#diagonal_type = dlut.get(max_points.join(""));
    }

    update_diagonal_stops() {
        const d = clut.get(this.#diagonal_type);
        const h1 = this.#corners.get(d[0]);
        const h2 = this.#corners.get(d[1]);

        this.#diagonal_stops = this.find_stops_between_heights(h1, h2);
    }

    update() {
        // if (!MAIN_CORNERS.find((c) => this.#corners.get(c))) {
        //     return;
        // }
        MAIN_CORNERS.forEach((c) => {
            if (this.#corners.get(c) === undefined) {
                this.#corners.set(c, 0);
            }
        });
        // console.log("Updating", this);

        this.update_stops();
        this.update_diagonal_type();
        this.update_diagonal_stops();

        if (this.on_update) {
            this.on_update();
        }
    }
}

class ChunkRenderer {
    // Settings
    #scale = 200;
    #dist_scale = 200;
    #size_box = {
        width: 300,
        height: 300,
        center: new Point(150, 150),
    };
    #settings = {
        text_color: "black",
        text_size: 14,
        text_font: "sans-serif",
        line_color: "black",
        line_size: 2,

        point_size: 10,
        point_color: "#f53535",

        show_height: true,
        show_length: true,
    };

    // Rendering
    #verticies = new Map();
    #path_order = {};
    #label_params = {};

    // Rendering context
    #canvas = undefined;
    #ctx = undefined;
    #resize_event_observer = undefined;

    get scale() {
        return this.#scale;
    }

    set scale(value) {
        this.#scale = value;
        this.update_verticies();
    }

    get dist_scale() {
        return this.#dist_scale;
    }

    set dist_scale(value) {
        this.#dist_scale = value;
        if (this.redraw) this.redraw();
    }

    get size() {
        return this.#size_box;
    }

    set size(value) {
        this.#size_box = value;
        this.update_verticies();
    }

    get show_height() {
        return this.#settings.show_height;
    }

    set show_height(value) {
        this.#settings.show_height = value;
        if (this.redraw) this.redraw();
    }

    get show_length() {
        return this.#settings.show_length;
    }

    set show_length(value) {
        this.#settings.show_length = value;
        if (this.redraw) this.redraw();
    }

    constructor(canvas) {
        // Rendering context
        this.#canvas = canvas;
        this.#ctx = canvas.getContext("2d");

        // Path order constant
        // For top left -> bottom right diagonal:
        // top left -> top right -> bottom right -> bottom left -> top left -> bottom right
        this.#path_order[TLBR_DIAGONAL] = [TOP_LEFT_CORNER, TOP_RIGHT_CORNER, BOTTOM_RIGHT_CORNER, BOTTOM_LEFT_CORNER, TOP_LEFT_CORNER, BOTTOM_RIGHT_CORNER];

        // For bottom left -> top right diagonal:
        // top right -> bottom right -> bottom left -> top left -> top right -> bottom left
        this.#path_order[BLTR_DIAGONAL] = [TOP_RIGHT_CORNER, BOTTOM_RIGHT_CORNER, BOTTOM_LEFT_CORNER, TOP_LEFT_CORNER, TOP_RIGHT_CORNER, BOTTOM_LEFT_CORNER];

        this.#label_params[TOP_LEFT_CORNER] = {
            align: "right",
            baseline: "bottom",
        };
        this.#label_params[TOP_RIGHT_CORNER] = {
            align: "left",
            baseline: "bottom",
        };
        this.#label_params[BOTTOM_LEFT_CORNER] = {
            align: "right",
            baseline: "top",
        };
        this.#label_params[BOTTOM_RIGHT_CORNER] = {
            align: "left",
            baseline: "top",
        };

        // While browser will call on_resize after construction,
        // we do not rely on that and instead set default size from canvas size
        this.#size_box = {
            width: canvas.width,
            height: canvas.height,
        };

        // Observe canvas size changes
        this.#resize_event_observer = new ResizeObserver((entries) => this.on_resize(entries[0]));
        this.#resize_event_observer.observe(canvas);

        this.update_verticies();
    }

    update_verticies() {
        const wd = new Point(this.#size_box.width, this.#size_box.height);
        this.#size_box.center = wd.scale(0.5);

        this.#verticies.set(TOP_LEFT_CORNER, wd.add(new Point(-this.#scale, -this.#scale)).scale(0.5)); // 0 - top left
        this.#verticies.set(TOP_RIGHT_CORNER, wd.add(new Point(+this.#scale, -this.#scale)).scale(0.5)); // 1 - top right
        this.#verticies.set(BOTTOM_LEFT_CORNER, wd.add(new Point(-this.#scale, +this.#scale)).scale(0.5)); // 2 - bottom left
        this.#verticies.set(BOTTOM_RIGHT_CORNER, wd.add(new Point(+this.#scale, +this.#scale)).scale(0.5)); // 3 - bottom right
    }

    on_resize(entry) {
        if (entry.contentBoxSize) {
            // According to standart, 'contentBoxSize' is an array, but some browsers will return plain object
            if (entry.contentBoxSize[0]) {
                this.#size_box = {
                    width: entry.contentBoxSize[0].inlineSize,
                    height: entry.contentBoxSize[0].blockSize,
                };
            } else {
                this.#size_box = {
                    width: entry.contentBoxSize.inlineSize,
                    height: entry.contentBoxSize.blockSize,
                };
            }
        }

        this.#canvas.width = this.#size_box.width;
        // this.#canvas.height = this.#size.height; // height is not reset when screen widens

        // console.log("Resized:", this.#size.width, this.#size.height);

        this.update_verticies();
        if (this.redraw) this.redraw();
    }

    ctx_set_text_font() {
        this.#ctx.font = `${this.#settings.text_size}px ${this.#settings.text_font}`;
    }

    clear() {
        this.#ctx.clearRect(0, 0, this.#size_box.width, this.#size_box.height);
    }

    draw_base_path(chunk) {
        const ctx = this.#ctx;

        ctx.save();
        ctx.strokeStyle = this.#settings.line_color;
        ctx.fillStyle = this.#settings.text_color;
        ctx.lineWidth = this.#settings.line_size;

        // console.log("draw_base_path", chunk.diagonal_type, this.#path_order[chunk.diagonal_type]);

        const path = this.#path_order[chunk.diagonal_type].map((i) => this.#verticies.get(i));

        ctx.beginPath();
        path.forEach((p) => {
            // console.log("path[i]", p);
            if (p === 0) {
                ctx.moveTo(p.x, p.y);
            } else {
                ctx.lineTo(p.x, p.y);
            }
        });
        ctx.stroke();

        ctx.restore();
    }

    draw_corners(chunk) {
        const ctx = this.#ctx;

        this.#verticies.forEach((val, key, map) => {
            this.draw_point(val);
        });
    }

    draw_side_stops(chunk) {
        MAIN_SIDES.forEach((side) => {
            const a = this.#verticies.get(clut.get(side)[0]);
            const b = this.#verticies.get(clut.get(side)[1]);
            chunk.stops.get(side).forEach((t) => {
                this.draw_point(Point.lerp(a, b, t));
            });
        });
    }

    draw_diagonal_stops(chunk) {
        const a = this.#verticies.get(clut.get(chunk.diagonal_type)[0]);
        const b = this.#verticies.get(clut.get(chunk.diagonal_type)[1]);
        chunk.diagonal_stops.forEach((t) => {
            this.draw_point(Point.lerp(a, b, t));
        });
    }

    draw_point(point) {
        const ctx = this.#ctx;

        ctx.save();

        ctx.fillStyle = this.#settings.point_color;
        const size = this.#settings.point_size;

        //    needed to center the point \/
        ctx.fillRect(point.x - size / 2 - 1, point.y - size / 2, size, size);

        ctx.restore();
    }

    draw_corner_labels(chunk) {
        MAIN_CORNERS.forEach((corner) => {
            this.draw_corner_label(corner, chunk.corners.get(corner));
        });
    }

    draw_corner_label(corner, text) {
        const ctx = this.#ctx;
        const params = this.#label_params[corner];
        const point = this.#verticies.get(corner).scale_away_from(this.#size_box.center, 1.1);

        ctx.save();
        this.ctx_set_text_font();
        ctx.fillStyle = this.#settings.text_color;
        ctx.textAlign = params.align;
        ctx.textBaseline = params.baseline;

        ctx.fillText(text, point.x, point.y);

        ctx.restore();
    }

    draw_distance_labels(chunk) {
        MAIN_SIDES.forEach((side) => {
            this.draw_distance_labels_for_side(chunk.stops.get(side), side);
        });

        this.draw_distance_labels_for_side(chunk.diagonal_stops, chunk.diagonal_type);
    }

    draw_distance_labels_for_side(stops, side) {
        let start = this.#verticies.get(clut.get(side)[0]);
        let end = this.#verticies.get(clut.get(side)[1]);

        let prev = start;

        let offset = 0;
        // switch (side) {
        //     case TOP_SIDE:
        //     case RIGHT_SIDE:
        //         offset = 1;
        //         break;
        //     case BOTTOM_SIDE:
        //     case LEFT_SIDE:
        //         offset = -1;
        //         break;
        //     case TLBR_DIAGONAL:
        //         offset = 1;
        //         break;
        //     case BLTR_DIAGONAL:
        //         offset = -1;
        //         break;
        //     default:
        //         break;
        // }

        stops.forEach((t) => {
            const current = Point.lerp(start, end, t);
            this.draw_distance_label(prev, current, offset);
            prev = current;
        });

        this.draw_distance_label(prev, end, offset);
    }

    // offset = 1: On top
    // offset = 0: Inline
    // offset = -1: On bottom
    draw_distance_label(pa, pb, offset = 1) {
        const d = Point.distance(pa, pb);
        // Convert pixel distance to scaled length
        const sd = (d / this.#scale) * this.#dist_scale;
        const text = sd.toFixed(1);

        this.#ctx.save();
        this.ctx_set_text_font();
        const clear_size = this.#ctx.measureText(text);
        const clear_width = clear_size.width + 20;
        this.#ctx.restore();

        if (clear_width > d) {
            // console.log("skipping", text);
            return;
        }

        this.draw_label_between_2_points(pa, pb, text, offset);
    }

    // offset = 1: On top
    // offset = 0: Inline
    // offset = -1: On bottom
    draw_label_between_2_points(pa, pb, text, offset = 1) {
        const ctx = this.#ctx;
        const middle = Point.add(pa, pb).scale(0.5);
        offset = Math.sign(offset);

        let diff = Point.subtract(pb, pa);
        let angle = Math.atan(diff.y / diff.x);

        ctx.save();
        this.ctx_set_text_font();
        ctx.fillStyle = this.#settings.text_color;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        ctx.translate(middle.x, middle.y);
        ctx.rotate(angle);

        switch (offset) {
            case 1:
                ctx.textBaseline = "bottom";
                ctx.fillText(text, 0, -3);
                break;
            case 0:
                const clear_size = ctx.measureText(text);
                const clear_width = clear_size.width + 4;
                const clear_height = clear_size.fontBoundingBoxAscent;
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

        ctx.restore();
    }

    round(value) {
        return Math.round(value * 100.0) / 100.0;
    }

    find_points_with_the_same_height(chunk) {
        const points_at_height = [];

        const height_set = new Set();

        this.#verticies.forEach((coords, corner, map) => {
            const height = this.round(chunk.corners.get(corner));

            height_set.add(height);
            points_at_height.push({
                point: coords,
                height: height,
                source: "corner",
                corner: corner,
            });
        });

        MAIN_SIDES.forEach((side) => {
            chunk.stops.get(side).forEach((t) => {
                const a = chunk.corners.get(clut.get(side)[0]);
                const b = chunk.corners.get(clut.get(side)[1]);

                const height = this.round(a + (b - a) * t);

                // console.log("HERE:", side, "a:", typeof a, "b:", typeof b, "result:", a + (b - a) * t);

                height_set.add(height);
                points_at_height.push({
                    point: Point.lerp(a, b, t),
                    height: height,
                    source: "side",
                    side: side,
                });
            });
        });

        const grouped_points = [];

        console.log("pat:", points_at_height);

        height_set.forEach((h) => {
            grouped_points.push(points_at_height.filter((pat) => pat.height === h));
        });

        console.log("gp:", grouped_points);
    }

    render(chunk) {
        this.clear();
        if (chunk == undefined) return;

        this.draw_base_path(chunk);
        this.draw_corners(chunk);
        this.draw_side_stops(chunk);
        this.draw_diagonal_stops(chunk);
        if (this.#settings.show_height) this.draw_corner_labels(chunk);
        if (this.#settings.show_length) this.draw_distance_labels(chunk);
        // this.find_points_with_the_same_height(chunk);
    }
}

class Grid {
    constructor() {
        this.clear();
    }

    clear() {
        this.offset = new Point(0, 0);
        this.width = 2;
        this.height = 2;
        this.data = [
            [0.0, 0.0],
            [0.0, 0.0],
        ];
    }

    add_column_at_the_end() {
        this.width += 1;
        this.data.forEach((row) => {
            row.push(0.0);
        });
    }

    add_column_at_the_start() {
        this.offset.x += 1;
        this.width += 1;
        this.data.forEach((row) => {
            row.unshift(0.0);
        });
    }

    add_row_at_the_end() {
        this.height += 1;
        this.data.push([].fill(0.0, 0, this.width));
    }

    add_row_at_the_start() {
        this.offset.y += 1;
        this.height += 1;
        this.data.unshift([].fill(0.0, 0, this.width));
    }

    add_offset(o) {
        let new_offset = Point.add(this.offset, o);
        while (new_offset.x < 0) {
            this.add_column_at_the_start();
            new_offset.x = this.offset.x + o.x;
        }
        while (new_offset.x >= this.width - 1) {
            this.add_column_at_the_end();
            new_offset.x = this.offset.x + o.x;
        }
        while (new_offset.y < 0) {
            this.add_row_at_the_start();
            new_offset.y = this.offset.y + o.y;
        }
        while (new_offset.y >= this.height - 1) {
            this.add_row_at_the_end();
            new_offset.y = this.offset.y + o.y;
        }
        this.offset = new_offset;
        if (this.update) {
            this.update();
        }
    }

    get(corner) {
        switch (corner) {
            case TOP_LEFT_CORNER:
                return this.data[this.offset.y][this.offset.x];
            case TOP_RIGHT_CORNER:
                return this.data[this.offset.y][this.offset.x + 1];
            case BOTTOM_LEFT_CORNER:
                return this.data[this.offset.y + 1][this.offset.x];
            case BOTTOM_RIGHT_CORNER:
                return this.data[this.offset.y + 1][this.offset.x + 1];
            default:
                return undefined;
        }
    }

    set(corner, value) {
        switch (corner) {
            case TOP_LEFT_CORNER:
                this.data[this.offset.y][this.offset.x] = value;
                if (this.on_update) this.update();
                break;
            case TOP_RIGHT_CORNER:
                this.data[this.offset.y][this.offset.x + 1] = value;
                if (this.on_update) this.update();
                break;
            case BOTTOM_LEFT_CORNER:
                this.data[this.offset.y + 1][this.offset.x] = value;
                if (this.on_update) this.update();
                break;
            case BOTTOM_RIGHT_CORNER:
                this.data[this.offset.y + 1][this.offset.x + 1] = value;
                if (this.on_update) this.update();
                break;
            default:
                console.error("Trying to set undefined corner");
        }
    }
}

class GridRenderer {
    #canvas = undefined;
    #ctx = undefined;
    #resize_event_observer = undefined;
    #grid = undefined;

    #size_box = {
        width: 300,
        height: 300,
        center: new Point(150, 150),
    };

    #cell_size = 10;
    #cell_fill_color = "#f53535";
    #cell_border_color = "black";

    #table_anchor = undefined;

    constructor(canvas, grid) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext("2d");
        this.#grid = grid;

        // Observe canvas size changes
        this.#resize_event_observer = new ResizeObserver((entries) => this.on_resize(entries[0]));
        this.#resize_event_observer.observe(canvas);

        this.update_anchors();
    }

    on_resize(entry) {
        if (entry.contentBoxSize) {
            // According to standart, 'contentBoxSize' is an array, but some browsers will return plain object
            if (entry.contentBoxSize[0]) {
                this.#size_box = {
                    width: entry.contentBoxSize[0].inlineSize,
                    height: entry.contentBoxSize[0].blockSize,
                };
            } else {
                this.#size_box = {
                    width: entry.contentBoxSize.inlineSize,
                    height: entry.contentBoxSize.blockSize,
                };
            }
        }

        this.#canvas.width = this.#size_box.width;
        this.#canvas.height = this.#size_box.height;

        // console.log("Resized:", this.#size.width, this.#size.height);
        this.render();
    }

    clear() {
        this.#ctx.clearRect(0, 0, this.#size_box.width, this.#size_box.height);
    }

    render() {
        this.update_anchors();

        this.clear();

        this.#ctx.save();
        this.#ctx.fillStyle = this.#cell_fill_color;
        this.#ctx.strokeStyle = this.#cell_border_color;

        for (let y = 0; y < this.#grid.height - 1; y++) {
            for (let x = 0; x < this.#grid.width - 1; x++) {
                const current = this.#grid.offset.x === x && this.#grid.offset.y === y;
                const p = new Point(x, y);
                this.render_cell(p, current);
            }
        }

        this.#ctx.restore();
    }

    update_anchors() {
        const tpw = (this.#grid.width - 2) * this.#cell_size;
        const tph = (this.#grid.height - 2) * this.#cell_size;

        this.#size_box.center = new Point(this.#size_box.width, this.#size_box.height).scale(0.5);
        this.#table_anchor = this.#size_box.center.subtract(new Point(tpw, tph).scale(0.5));
    }

    grid_point_to_pixel_point(grid_position) {
        return grid_position.scale(this.#cell_size).add(this.#table_anchor);
    }

    render_cell(p, fill) {
        const ctx = this.#ctx;

        const c = this.grid_point_to_pixel_point(p);
        const s = this.#cell_size / 2;
        const s2 = this.#cell_size;

        if (fill) {
            ctx.fillRect(c.x - s, c.y - s, s2, s2);
        }
        ctx.strokeRect(c.x - s, c.y - s, s2, s2);
    }
}

class App {
    constructor() {
        this.chunk = new Chunk();
        this.grid = new Grid();
        this.chunk.corners = this.grid;
    }

    start() {
        window.addEventListener("load", (event) => {
            console.log("Page loaded");
            this.on_page_load();
        });

        // document.addEventListener("beforeunload", (event) => {
        //     console.log("Page unloading");
        //     this.before_page_unload();
        // });
    }

    on_page_load() {
        this.load_grid_data();
        this.load_grid_offset();

        this.chunk.update();

        this.bind_corner_inputs();
        this.bind_movement_inputs();
        this.bind_chunk_renderer();
        this.bind_grid_renderer();
        this.bind_inputs();
        // this.bind_config();
    }

    bind_config() {}

    load_grid_data() {
        if (localStorage.getItem("grid_data").length === 0 || localStorage.getItem("grid_data") === "undefined") return;

        // const data123 = JSON.parse(localStorage.getItem("grid_data"));
        let a = JSON.parse(localStorage.getItem("grid_data"));
        // let b = JSON.parse(localStorage.getItem("grid_data"));
        // console.log("DATA A", a);
        // console.log("DATA B", b);

        if (a === undefined) return;
        if (!Array.isArray(a)) return;

        // Check if every row is an array and only contains numbers
        if (
            !a.every((row) => {
                if (row === undefined) return false;
                if (!Array.isArray(row)) return false;
                if (!row.every((value) => typeof value === "number")) return false;
                return true;
            })
        )
            return;

        const row_length = a[0].length;

        // Check if every row has equal length
        if (!a.every((row) => row.length === row_length)) return;

        this.grid.data = a;
        // a.forEach((row, y) => {
        //     this.grid.data.push([]);
        //     row.forEach((value, x) => {
        //         // console.log(x, y, value);
        //         this.grid.data[y][x] = value;
        //         // console.log("here", this.grid.data);
        //         console.table(this.grid.data);
        //     });
        // });
        // console.table(this.grid.data);
        // console.group("DATA");
        // this.grid.data.forEach((row) => console.log(row.map((v) => v.toFixed(1)).join(" ")));
        // console.groupEnd();
        this.grid.width = row_length;
        this.grid.height = a.length;
    }

    load_grid_offset() {
        if (localStorage.getItem("grid_offset").length === 0 || localStorage.getItem("grid_offset") === "undefined") return;

        const offset = JSON.parse(localStorage.getItem("grid_offset"));

        if (!offset) return;
        if (typeof offset != "object") return;
        if (offset.x === undefined || offset.y === undefined) return;

        this.grid.offset = new Point(offset.x, offset.y);
    }

    bind_corner_inputs() {
        const c_attr_lut = new Map();
        c_attr_lut.set("top-left", TOP_LEFT_CORNER);
        c_attr_lut.set("top-right", TOP_RIGHT_CORNER);
        c_attr_lut.set("bottom-left", BOTTOM_LEFT_CORNER);
        c_attr_lut.set("bottom-right", BOTTOM_RIGHT_CORNER);

        const corner_config = document.getElementById("corner_config");

        this.corner_inputs = new Map();

        for (const el of corner_config.children) {
            if (el.attributes["corner"]) {
                const corner = c_attr_lut.get(el.attributes["corner"].value);
                if (corner) {
                    this.corner_inputs.set(corner, el);
                    // console.log(corner, "=", el.value);
                    el.value = this.chunk.corners.get(corner);
                    // this.chunk.set_corner(corner, el.value === undefined ? 0 : parseFloat(el.value));
                    // el.value = el.value === undefined ? 0 : el.value;
                    el.oninput = () => {
                        // console.log("Changed", corner);
                        app.chunk.set_corner(corner, el.value === undefined ? 0 : parseFloat(el.value));
                    };
                }
            }
        }
    }

    bind_movement_inputs() {
        const dir_lut = new Map();
        dir_lut.set("up", new Point(0, -1));
        dir_lut.set("down", new Point(0, 1));
        dir_lut.set("left", new Point(-1, 0));
        dir_lut.set("right", new Point(1, 0));

        const corner_config = document.getElementById("data_input_panel");
        for (const el of corner_config.children) {
            if (el.attributes["direction"]) {
                const direction = dir_lut.get(el.attributes["direction"].value);
                if (direction) {
                    // console.log(direction, "=", el);
                    el.onclick = () => app.move(direction);
                }
            }
        }
    }

    move(direction) {
        app.grid.add_offset(direction);
        app.chunk.update();

        MAIN_CORNERS.forEach((c) => {
            app.corner_inputs.get(c).value = app.chunk.corners.get(c);
        });
    }

    bind_inputs() {
        this.bind_input("step", (value) => {
            if (this.chunk) this.chunk.step = value;
        });

        this.bind_input("dist_scale", (value) => {
            if (this.chunk_renderer) this.chunk_renderer.dist_scale = value;
        });

        this.bind_input("show_height", (value) => {
            if (this.chunk_renderer) this.chunk_renderer.show_height = value;
        });

        this.bind_input("show_length", (value) => {
            if (this.chunk_renderer) this.chunk_renderer.show_length = value;
        });

        this.bind_input("show_as_a_map", (value) => {
            this.set_map_mode(value);
        });

        // this.bind_input("clear_grid", (_) => {
        //     this.grid.clear();
        //     this.grid.update();
        //     this.chunk.update();
        // });
    }

    bind_input(id, on_input) {
        const el = document.getElementById(id);
        if (el) {
            let get_value;
            switch (el.type) {
                case "checkbox":
                case "radiobox":
                    get_value = () => el.checked;
                    break;
                case "number":
                    get_value = () => parseFloat(el.value);
                    break;
                default:
                    get_value = () => el.value;
                    break;
            }
            el.oninput = () => on_input(get_value());
            el.oninput();
        }
    }

    bind_chunk_renderer() {
        const canvas = document.getElementById("main_canvas");
        if (canvas) {
            this.chunk_renderer = new ChunkRenderer(canvas, this.chunk);
            this.chunk_renderer.redraw = () => this.chunk_renderer.render(app.chunk);
            this.chunk.on_update = () => this.chunk_renderer.redraw();
            this.chunk_renderer.render(this.chunk);
        }
    }

    bind_grid_renderer() {
        const canvas = document.getElementById("grid_overview_canvas");
        if (canvas) {
            this.grid_renderer = new GridRenderer(canvas, this.grid);
            this.grid.update = () => {
                localStorage.setItem("grid_data", JSON.stringify(this.grid.data));
                localStorage.setItem("grid_offset", JSON.stringify(this.grid.offset));
                this.grid_renderer.render();
            };
        }
    }

    set_map_mode(map_mode) {
        console.log("set_map_mode (", map_mode, ")");
    }
}

const app = new App();
app.start();
