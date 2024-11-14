// ========================================================================================================== CONSTANTS

const LUT = {
    CORNER: {
        TOP_LEFT: Symbol("top_left"), // Represents top left corner
        TOP_RIGHT: Symbol("top_right"), // Represents top right corner
        BOTTOM_LEFT: Symbol("bottom_left"), // Represents bottom left corner
        BOTTOM_RIGHT: Symbol("bottom_right"), // Represents bottom right corner
    },

    SIDE: {
        TOP: Symbol("top_side"), // Represents top side
        BOTTOM: Symbol("bottom_side"), // Represents bottom side
        LEFT: Symbol("left_side"), // Represents left side
        RIGHT: Symbol("right_side"), // Represents right side
    },

    DIAGONAL: {
        TLBR: Symbol("top_left_bottom_right_diagonal"), // Represents diagonal going from top left to bottom right
        BLTR: Symbol("bottom_left_top_right_diagonal"), // Represents diagonal going from bottom left to top right
    },

    DIRECTION: {
        UP: Object.freeze(new Point(0, -1)),
        DOWN: Object.freeze(new Point(0, 1)),
        LEFT: Object.freeze(new Point(-1, 0)),
        RIGHT: Object.freeze(new Point(1, 0)),
    },

    ALL_CORNERS: [],
    ALL_SIDES: [],
    ALL_DIRECTIONS: [],

    SIDE_TO_CORNERS: new Map(),
    STOP_COUNT_TO_DIAGONAL: new Map(),
    NAME_TO_DIRECTION: new Map(),
    NAME_TO_CORNER: new Map(),
    CORNER_TO_OFFSET: new Map(),
};

LUT.ALL_CORNERS = [LUT.CORNER.TOP_LEFT, LUT.CORNER.TOP_RIGHT, LUT.CORNER.BOTTOM_LEFT, LUT.CORNER.BOTTOM_RIGHT];
LUT.ALL_SIDES = [LUT.SIDE.TOP, LUT.SIDE.BOTTOM, LUT.SIDE.LEFT, LUT.SIDE.RIGHT];
LUT.ALL_DIRECTIONS = [LUT.DIRECTION.UP, LUT.DIRECTION.DOWN, LUT.DIRECTION.LEFT, LUT.DIRECTION.RIGHT];

// Lookup table for assotiating corners to lines
LUT.SIDE_TO_CORNERS.set(LUT.SIDE.TOP, [LUT.CORNER.TOP_LEFT, LUT.CORNER.TOP_RIGHT]);
LUT.SIDE_TO_CORNERS.set(LUT.SIDE.BOTTOM, [LUT.CORNER.BOTTOM_LEFT, LUT.CORNER.BOTTOM_RIGHT]);
LUT.SIDE_TO_CORNERS.set(LUT.SIDE.LEFT, [LUT.CORNER.TOP_LEFT, LUT.CORNER.BOTTOM_LEFT]);
LUT.SIDE_TO_CORNERS.set(LUT.SIDE.RIGHT, [LUT.CORNER.TOP_RIGHT, LUT.CORNER.BOTTOM_RIGHT]);
LUT.SIDE_TO_CORNERS.set(LUT.DIAGONAL.TLBR, [LUT.CORNER.TOP_LEFT, LUT.CORNER.BOTTOM_RIGHT]);
LUT.SIDE_TO_CORNERS.set(LUT.DIAGONAL.BLTR, [LUT.CORNER.BOTTOM_LEFT, LUT.CORNER.TOP_RIGHT]);

// Lookup table for determining diagonals
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.TOP, LUT.SIDE.BOTTOM, LUT.SIDE.LEFT, LUT.SIDE.RIGHT].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Opposite sides have the most points
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.BOTTOM, LUT.SIDE.TOP, LUT.SIDE.LEFT, LUT.SIDE.RIGHT].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Opposite sides have the most points
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.LEFT, LUT.SIDE.TOP, LUT.SIDE.BOTTOM, LUT.SIDE.RIGHT].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.TOP, LUT.SIDE.LEFT, LUT.SIDE.BOTTOM, LUT.SIDE.RIGHT].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.BOTTOM, LUT.SIDE.LEFT, LUT.SIDE.TOP, LUT.SIDE.RIGHT].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.LEFT, LUT.SIDE.BOTTOM, LUT.SIDE.TOP, LUT.SIDE.RIGHT].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.LEFT, LUT.SIDE.BOTTOM, LUT.SIDE.RIGHT, LUT.SIDE.TOP].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.BOTTOM, LUT.SIDE.LEFT, LUT.SIDE.RIGHT, LUT.SIDE.TOP].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.RIGHT, LUT.SIDE.LEFT, LUT.SIDE.BOTTOM, LUT.SIDE.TOP].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Opposite sides have the most points
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.LEFT, LUT.SIDE.RIGHT, LUT.SIDE.BOTTOM, LUT.SIDE.TOP].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Opposite sides have the most points
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.BOTTOM, LUT.SIDE.RIGHT, LUT.SIDE.LEFT, LUT.SIDE.TOP].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.RIGHT, LUT.SIDE.BOTTOM, LUT.SIDE.LEFT, LUT.SIDE.TOP].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.RIGHT, LUT.SIDE.TOP, LUT.SIDE.LEFT, LUT.SIDE.BOTTOM].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.TOP, LUT.SIDE.RIGHT, LUT.SIDE.LEFT, LUT.SIDE.BOTTOM].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.LEFT, LUT.SIDE.RIGHT, LUT.SIDE.TOP, LUT.SIDE.BOTTOM].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Opposite sides have the most points
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.RIGHT, LUT.SIDE.LEFT, LUT.SIDE.TOP, LUT.SIDE.BOTTOM].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Opposite sides have the most points
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.TOP, LUT.SIDE.LEFT, LUT.SIDE.RIGHT, LUT.SIDE.BOTTOM].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.LEFT, LUT.SIDE.TOP, LUT.SIDE.RIGHT, LUT.SIDE.BOTTOM].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.BOTTOM, LUT.SIDE.TOP, LUT.SIDE.RIGHT, LUT.SIDE.LEFT].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Opposite sides have the most points
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.TOP, LUT.SIDE.BOTTOM, LUT.SIDE.RIGHT, LUT.SIDE.LEFT].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Opposite sides have the most points
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.RIGHT, LUT.SIDE.BOTTOM, LUT.SIDE.TOP, LUT.SIDE.LEFT].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.BOTTOM, LUT.SIDE.RIGHT, LUT.SIDE.TOP, LUT.SIDE.LEFT].map((s) => s.toString()).join(""), LUT.DIAGONAL.TLBR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.TOP, LUT.SIDE.RIGHT, LUT.SIDE.BOTTOM, LUT.SIDE.LEFT].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Simple case
LUT.STOP_COUNT_TO_DIAGONAL.set([LUT.SIDE.RIGHT, LUT.SIDE.TOP, LUT.SIDE.BOTTOM, LUT.SIDE.LEFT].map((s) => s.toString()).join(""), LUT.DIAGONAL.BLTR); // Simple case

// Lookup table for transforming direction name to Point
LUT.NAME_TO_DIRECTION.set("up", LUT.DIRECTION.UP);
LUT.NAME_TO_DIRECTION.set("down", LUT.DIRECTION.DOWN);
LUT.NAME_TO_DIRECTION.set("left", LUT.DIRECTION.LEFT);
LUT.NAME_TO_DIRECTION.set("right", LUT.DIRECTION.RIGHT);

// Lookup table for transforming corner name to corner symbol
LUT.NAME_TO_CORNER.set("top_left", LUT.CORNER.TOP_LEFT);
LUT.NAME_TO_CORNER.set("top_right", LUT.CORNER.TOP_RIGHT);
LUT.NAME_TO_CORNER.set("bottom_left", LUT.CORNER.BOTTOM_LEFT);
LUT.NAME_TO_CORNER.set("bottom_right", LUT.CORNER.BOTTOM_RIGHT);

// Lookup table for transforming corner to offset
LUT.CORNER_TO_OFFSET.set(LUT.CORNER.TOP_LEFT, Object.freeze(new Point(0, 0)));
LUT.CORNER_TO_OFFSET.set(LUT.CORNER.TOP_RIGHT, Object.freeze(new Point(1, 0)));
LUT.CORNER_TO_OFFSET.set(LUT.CORNER.BOTTOM_LEFT, Object.freeze(new Point(0, 1)));
LUT.CORNER_TO_OFFSET.set(LUT.CORNER.BOTTOM_RIGHT, Object.freeze(new Point(1, 1)));

Object.freeze(LUT);

Object.entries(LUT).forEach(([key, value]) => {
    Object.freeze(value);
});

// ==========================================================================================================

console.log("Constant lookup table", LUT);
