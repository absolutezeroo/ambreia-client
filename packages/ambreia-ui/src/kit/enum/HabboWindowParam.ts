/**
 * Habbo-specific window parameter flags (bitwise).
 *
 * Extends the core WindowParam with Habbo-specific behavior flags.
 * These are OR'd together to create a composite param value.
 *
 * @see sources/win63_version/habbo/window/enum/HabboWindowParam.as
 */
export const HabboWindowParam =
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::NULL
        NULL: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::INPUT_EVENT_PROCESSOR
        INPUT_EVENT_PROCESSOR: 1,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::ROUTE_INPUT_EVENTS_TO_PARENT
        ROUTE_INPUT_EVENTS_TO_PARENT: 3,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowParam.as::const_855
        OBSERVE_PARENT_INPUT_EVENTS: 5,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::INTERNAL_EVENT_HANDLING
        INTERNAL_EVENT_HANDLING: 9,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::USE_PARENT_GRAPHIC_CONTEXT
        USE_PARENT_GRAPHIC_CONTEXT: 16,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::BOUND_TO_PARENT_RECT
        BOUND_TO_PARENT_RECT: 32,

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_HORIZONTAL_SCALE_FIXED
        RELATIVE_HORIZONTAL_SCALE_FIXED: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_HORIZONTAL_SCALE_MOVE
        RELATIVE_HORIZONTAL_SCALE_MOVE: 64,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_HORIZONTAL_SCALE_STRECH (renamed STRETCH)
        RELATIVE_HORIZONTAL_SCALE_STRETCH: 128,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_HORIZONTAL_SCALE_CENTER
        RELATIVE_HORIZONTAL_SCALE_CENTER: 192,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_HORIZONTAL_SCALE_MASK
        RELATIVE_HORIZONTAL_SCALE_MASK: 192,

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_VERTICAL_SCALE_FIXED
        RELATIVE_VERTICAL_SCALE_FIXED: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_VERTICAL_SCALE_MOVE
        RELATIVE_VERTICAL_SCALE_MOVE: 1024,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_VERTICAL_SCALE_STRECH (renamed STRETCH)
        RELATIVE_VERTICAL_SCALE_STRETCH: 2048,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_VERTICAL_SCALE_CENTER
        RELATIVE_VERTICAL_SCALE_CENTER: 3072,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_VERTICAL_SCALE_MASK
        RELATIVE_VERTICAL_SCALE_MASK: 3072,

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_SCALE_FIXED
        RELATIVE_SCALE_FIXED: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_SCALE_MOVE
        RELATIVE_SCALE_MOVE: 1088,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_SCALE_STRECH (renamed STRETCH)
        RELATIVE_SCALE_STRETCH: 2176,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RELATIVE_SCALE_CENTER
        RELATIVE_SCALE_CENTER: 3264,

        // AS3: sources/win63_version/habbo/window/enum/HabboWindowParam.as::const_1088
        ON_RESIZE_ALIGN_LEFT: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::ON_RESIZE_ALIGN_RIGHT
        ON_RESIZE_ALIGN_RIGHT: 262144,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::ON_RESIZE_ALIGN_CENTER
        ON_RESIZE_ALIGN_CENTER: 786432,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowParam.as::const_336
        ON_RESIZE_ALIGN_TOP: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::ON_RESIZE_ALIGN_BOTTOM
        ON_RESIZE_ALIGN_BOTTOM: 1048576,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowParam.as::const_1195
        ON_RESIZE_ALIGN_MIDDLE: 3145728,

        // AS3: sources/win63_version/habbo/window/enum/HabboWindowParam.as::const_194
        EXPAND_TO_ACCOMMODATE_CHILDREN: 131072,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::RESIZE_TO_ACCOMMODATE_CHILDREN
        RESIZE_TO_ACCOMMODATE_CHILDREN: 147456,

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::MOUSE_DRAGGING_TARGET
        MOUSE_DRAGGING_TARGET: 32768,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::MOUSE_DRAGGING_TRIGGER
        MOUSE_DRAGGING_TRIGGER: 257,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowParam.as::const_924
        DRAGGABLE_WITH_MOUSE: 33025,

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::MOUSE_SCALING_TARGET
        MOUSE_SCALING_TARGET: 65536,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::HORIZONTAL_MOUSE_SCALING_TRIGGER
        HORIZONTAL_MOUSE_SCALING_TRIGGER: 4096,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::VERTICAL_MOUSE_SCALING_TRIGGER
        VERTICAL_MOUSE_SCALING_TRIGGER: 8192,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::MOUSE_SCALING_TRIGGER
        MOUSE_SCALING_TRIGGER: 12288,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::MOUSE_SCALING_TRIGGER_MASK
        MOUSE_SCALING_TRIGGER_MASK: 12288,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::SCALABLE_WITH_MOUSE
        SCALABLE_WITH_MOUSE: 77824,

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::PARENT_WINDOW
        PARENT_WINDOW: 1,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::CHILD_WINDOW
        CHILD_WINDOW: 33,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::EMBEDDED_CONTROLLER
        EMBEDDED_CONTROLLER: 51,

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowParam.as::FORCE_CLIPPING
        FORCE_CLIPPING: 1073741824,
    } as const;

export type HabboWindowParamValue = typeof HabboWindowParam[keyof typeof HabboWindowParam];
