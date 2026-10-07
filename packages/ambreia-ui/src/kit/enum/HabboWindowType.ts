/**
 * Habbo window element type identifiers.
 *
 * Defines the high-level element types used by the Habbo window system.
 * These map to specific UI widget implementations.
 *
 * @see sources/win63_version/habbo/window/enum/HabboWindowType.as
 */
export const HabboWindowType =
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::NULL
        NULL: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::BACKGROUND
        BACKGROUND: 2,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::CONTAINER
        CONTAINER: 4,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::HEADER
        HEADER: 6,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowType.as::const_106
        REGION: 10,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::LABEL
        LABEL: 12,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::DISPLAY_OBJECT_WRAPPER
        DISPLAY_OBJECT_WRAPPER: 20,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::BITMAP_WRAPPER
        BITMAP_WRAPPER: 21,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::SHAPE
        SHAPE: 22,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::STATIC_BITMAP_WRAPPER
        STATIC_BITMAP_WRAPPER: 23,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::GRADIENT
        GRADIENT: 24,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::STROKE
        STROKE: 25,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::BITMAP_FILL
        BITMAP_FILL: 26,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::BORDER
        BORDER: 30,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::FRAME
        FRAME: 35,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::DEFAULT_FRAME
        DEFAULT_FRAME: 35,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::SIMPLE_FRAME
        SIMPLE_FRAME: 35,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::CONTAINER_BUTTON
        CONTAINER_BUTTON: 41,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowType.as::const_222
        TAB_CONTAINER: 42,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::SELECTOR_LIST
        SELECTOR_LIST: 43,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::BUBBLE
        BUBBLE: 45,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::VERTICAL_ITEM_LIST
        VERTICAL_ITEM_LIST: 50,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::VERTICAL_ITEMLIST
        VERTICAL_ITEMLIST: 50,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::HORIZONTAL_ITEM_LIST
        HORIZONTAL_ITEM_LIST: 51,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::HORIZONTAL_ITEMLIST
        HORIZONTAL_ITEMLIST: 51,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::VERTICAL_ITEM_GRID
        VERTICAL_ITEM_GRID: 53,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowType.as::const_696
        HORIZONTAL_ITEM_GRID: 54,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::VERTICAL_SCROLLABLE_ITEMLIST
        VERTICAL_SCROLLABLE_ITEMLIST: 56,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::HORIZONTAL_SCROLLABLE_ITEMLIST
        HORIZONTAL_SCROLLABLE_ITEMLIST: 57,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::SIMPLE_BUTTON
        SIMPLE_BUTTON: 60,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::THICK_BUTTON
        THICK_BUTTON: 61,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowType.as::const_165
        BUTTON_GROUP_LEFT: 67,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::BUTTON_GROUP_CENTER
        BUTTON_GROUP_CENTER: 68,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::BUTTON_GROUP_RIGHT
        BUTTON_GROUP_RIGHT: 69,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::CHECKBOX
        CHECKBOX: 70,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowType.as::const_61
        RADIO_BUTTON: 71,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::INPUT_FIELD
        INPUT_FIELD: 77,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::PASSWORD
        PASSWORD: 78,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::TAB_CONTEXT
        TAB_CONTEXT: 91,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::TAB_SELECTOR
        TAB_SELECTOR: 92,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::TAB_BUTTON
        TAB_BUTTON: 93,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::DROP_MENU
        DROP_MENU: 102,
        // AS3: sources/win63_version/habbo/window/enum/HabboWindowType.as::const_957
        DROP_MENU_ITEM: 103,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::HORIZONTAL_SCROLLBAR
        HORIZONTAL_SCROLLBAR: 130,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::VERTICAL_SCROLLBAR
        VERTICAL_SCROLLBAR: 131,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboWindowType.as::VERTICAL_SCROLLABLE_GRIDLIST
        VERTICAL_SCROLLABLE_GRIDLIST: 140,
    } as const;

export type HabboWindowTypeValue = typeof HabboWindowType[keyof typeof HabboWindowType];
