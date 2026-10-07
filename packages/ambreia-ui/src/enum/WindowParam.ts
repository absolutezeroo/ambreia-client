/**
 * Window parameter flags (bitwise).
 *
 * Controls window behavior: input handling, scaling, dragging, alignment, etc.
 * These are OR'd together to create a composite param value.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/WindowParam.as
 */
export const WindowParam =
    {
        NULL: 0x0,
        INPUT_EVENT_PROCESSOR: 0x1,
        ROUTE_INPUT_EVENTS_TO_PARENT: 0x3,
        OBSERVE_PARENT_INPUT_EVENTS: 0x5,
        INTERNAL_EVENT_HANDLING: 0x9,
        USE_PARENT_GRAPHIC_CONTEXT: 0x10,
        BOUND_TO_PARENT_RECT: 0x20,

        RELATIVE_HORIZONTAL_SCALE_FIXED: 0x0,
        RELATIVE_HORIZONTAL_SCALE_MOVE: 0x40,
        RELATIVE_HORIZONTAL_SCALE_STRETCH: 0x80,
        RELATIVE_HORIZONTAL_SCALE_CENTER: 0xC0,
        RELATIVE_HORIZONTAL_SCALE_MASK: 0xC0,

        RELATIVE_VERTICAL_SCALE_FIXED: 0x0,
        RELATIVE_VERTICAL_SCALE_MOVE: 0x400,
        RELATIVE_VERTICAL_SCALE_STRETCH: 0x800,
        RELATIVE_VERTICAL_SCALE_CENTER: 0xC00,
        RELATIVE_VERTICAL_SCALE_MASK: 0xC00,

        RELATIVE_SCALE_FIXED: 0x0,
        RELATIVE_SCALE_MOVE: 0x440,
        RELATIVE_SCALE_STRETCH: 0x880,
        RELATIVE_SCALE_CENTER: 0xCC0,

        EXPAND_TO_ACCOMMODATE_CHILDREN: 0x20000,
        RESIZE_TO_ACCOMMODATE_CHILDREN: 0x24000,

        MOUSE_DRAGGING_TARGET: 0x8000,
        MOUSE_DRAGGING_TRIGGER: 0x101,
        DRAGGABLE_WITH_MOUSE: 0x8101,

        MOUSE_SCALING_TARGET: 0x10000,
        HORIZONTAL_MOUSE_SCALING_TRIGGER: 0x1000,
        VERTICAL_MOUSE_SCALING_TRIGGER: 0x2000,
        MOUSE_SCALING_TRIGGER: 0x3000,
        MOUSE_SCALING_TRIGGER_MASK: 0x3000,
        SCALABLE_WITH_MOUSE: 0x13000,

        ON_ACCOMMODATE_ALIGN_LEFT: 0x0,
        ON_ACCOMMODATE_ALIGN_RIGHT: 0x40000,
        ON_ACCOMMODATE_ALIGN_CENTER: 0xC0000,
        ON_ACCOMMODATE_ALIGN_TOP: 0x0,
        ON_ACCOMMODATE_ALIGN_BOTTOM: 0x100000,
        ON_ACCOMMODATE_ALIGN_MIDDLE: 0x300000,
        ON_ACCOMMODATE_ALIGN_MASK: 0x3C0000,

        ON_RESIZE_ALIGN_LEFT: 0x0,
        ON_RESIZE_ALIGN_RIGHT: 0x40000,
        ON_RESIZE_ALIGN_CENTER: 0xC0000,
        ON_RESIZE_ALIGN_TOP: 0x0,
        ON_RESIZE_ALIGN_BOTTOM: 0x100000,
        ON_RESIZE_ALIGN_MIDDLE: 0x300000,
        ON_RESIZE_ALIGN_HORIZONTAL: 0xC0000,
        ON_RESIZE_ALIGN_VERTICAL: 0x300000,

        REFLECT_HORIZONTAL_RESIZE_TO_PARENT: 0x400000,
        REFLECT_VERTICAL_RESIZE_TO_PARENT: 0x800000,
        REFLECT_RESIZE_TO_PARENT: 0xC00000,

        PARENT_WINDOW: 0x1,
        CHILD_WINDOW: 0x21,
        EMBEDDED_CONTROLLER: 0x33,

        FORCE_CLIPPING: 0x40000000,
        INHERIT_CAPTION: 0x80000000,
    } as const;

export type WindowParamValue = typeof WindowParam[keyof typeof WindowParam];

/**
 * Map param name to bitwise flag value.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/ParamCodeTable.as
 */
export const PARAM_NAME_TO_FLAG: Record<string, number> =
    {
        'null': WindowParam.NULL,
        'input_event_processor': WindowParam.INPUT_EVENT_PROCESSOR,
        'route_input_events_to_parent': WindowParam.ROUTE_INPUT_EVENTS_TO_PARENT,
        'observe_parent_input_events': WindowParam.OBSERVE_PARENT_INPUT_EVENTS,
        'internal_event_handling': WindowParam.INTERNAL_EVENT_HANDLING,
        'use_parent_graphic_context': WindowParam.USE_PARENT_GRAPHIC_CONTEXT,
        'bound_to_parent_rect': WindowParam.BOUND_TO_PARENT_RECT,
        'relative_horizontal_scale_fixed': WindowParam.RELATIVE_HORIZONTAL_SCALE_FIXED,
        'relative_horizontal_scale_move': WindowParam.RELATIVE_HORIZONTAL_SCALE_MOVE,
        'relative_horizontal_scale_strech': WindowParam.RELATIVE_HORIZONTAL_SCALE_STRETCH,
        'relative_horizontal_scale_center': WindowParam.RELATIVE_HORIZONTAL_SCALE_CENTER,
        'relative_vertical_scale_fixed': WindowParam.RELATIVE_VERTICAL_SCALE_FIXED,
        'relative_vertical_scale_move': WindowParam.RELATIVE_VERTICAL_SCALE_MOVE,
        'relative_vertical_scale_strech': WindowParam.RELATIVE_VERTICAL_SCALE_STRETCH,
        'relative_vertical_scale_center': WindowParam.RELATIVE_VERTICAL_SCALE_CENTER,
        'relative_scale_fixed': WindowParam.RELATIVE_SCALE_FIXED,
        'relative_scale_move': WindowParam.RELATIVE_SCALE_MOVE,
        'relative_scale_strech': WindowParam.RELATIVE_SCALE_STRETCH,
        'relative_scale_center': WindowParam.RELATIVE_SCALE_CENTER,
        'expand_to_accommodate_children': WindowParam.EXPAND_TO_ACCOMMODATE_CHILDREN,
        'resize_to_accommodate_children': WindowParam.RESIZE_TO_ACCOMMODATE_CHILDREN,
        'mouse_dragging_target': WindowParam.MOUSE_DRAGGING_TARGET,
        'mouse_dragging_trigger': WindowParam.MOUSE_DRAGGING_TRIGGER,
        'draggable_with_mouse': WindowParam.DRAGGABLE_WITH_MOUSE,
        'mouse_scaling_target': WindowParam.MOUSE_SCALING_TARGET,
        'horizontal_mouse_scaling_trigger': WindowParam.HORIZONTAL_MOUSE_SCALING_TRIGGER,
        'vertical_mouse_scaling_trigger': WindowParam.VERTICAL_MOUSE_SCALING_TRIGGER,
        'mouse_scaling_trigger': WindowParam.MOUSE_SCALING_TRIGGER,
        'scalable_with_mouse': WindowParam.SCALABLE_WITH_MOUSE,
        'on_accommodate_align_left': WindowParam.ON_ACCOMMODATE_ALIGN_LEFT,
        'on_accommodate_align_right': WindowParam.ON_ACCOMMODATE_ALIGN_RIGHT,
        'on_accommodate_align_center': WindowParam.ON_ACCOMMODATE_ALIGN_CENTER,
        'on_accommodate_align_top': WindowParam.ON_ACCOMMODATE_ALIGN_TOP,
        'on_accommodate_align_bottom': WindowParam.ON_ACCOMMODATE_ALIGN_BOTTOM,
        'on_accommodate_align_middle': WindowParam.ON_ACCOMMODATE_ALIGN_MIDDLE,
        'on_resize_align_left': WindowParam.ON_RESIZE_ALIGN_LEFT,
        'on_resize_align_right': WindowParam.ON_RESIZE_ALIGN_RIGHT,
        'on_resize_align_center': WindowParam.ON_RESIZE_ALIGN_CENTER,
        'on_resize_align_top': WindowParam.ON_RESIZE_ALIGN_TOP,
        'on_resize_align_bottom': WindowParam.ON_RESIZE_ALIGN_BOTTOM,
        'on_resize_align_middle': WindowParam.ON_RESIZE_ALIGN_MIDDLE,
        'reflect_horizontal_resize_to_parent': WindowParam.REFLECT_HORIZONTAL_RESIZE_TO_PARENT,
        'reflect_vertical_resize_to_parent': WindowParam.REFLECT_VERTICAL_RESIZE_TO_PARENT,
        'reflect_resize_to_parent': WindowParam.REFLECT_RESIZE_TO_PARENT,
        'parent_window': WindowParam.PARENT_WINDOW,
        'child_window': WindowParam.CHILD_WINDOW,
        'embedded_controller': WindowParam.EMBEDDED_CONTROLLER,
        'force_clipping': WindowParam.FORCE_CLIPPING,
        'inherit_caption': WindowParam.INHERIT_CAPTION,
    };
