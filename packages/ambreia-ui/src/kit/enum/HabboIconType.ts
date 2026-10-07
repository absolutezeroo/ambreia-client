/**
 * Habbo icon type identifiers.
 *
 * Enumerates all available icon types used in the window system.
 *
 * @see sources/win63_version/habbo/window/enum/HabboIconType.as
 */
export const HabboIconType =
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::ARROW_DOWN
        ARROW_DOWN: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::ARROW_UP
        ARROW_UP: 1,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::ARROW_LEFT
        ARROW_LEFT: 2,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::ARROW_RIGHT
        ARROW_RIGHT: 3,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::TRIANGLE_LEFT
        TRIANGLE_LEFT: 4,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::TRIANGLE_RIGHT
        TRIANGLE_RIGHT: 5,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::TRIANGLE_UP
        TRIANGLE_UP: 6,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::TRIANGLE_DOWN
        TRIANGLE_DOWN: 7,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::SYMBOL_ACCEPT
        SYMBOL_ACCEPT: 8,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::SYMBOL_DECLINE
        SYMBOL_DECLINE: 9,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::COIN
        COIN: 10,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::CLUB_ICON_SMALL
        CLUB_ICON_SMALL: 11,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::VIP_ICON_SMALL
        VIP_ICON_SMALL: 12,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::CLUB_ICON_SQUARE
        CLUB_ICON_SQUARE: 13,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::VIP_ICON_SQUARE
        VIP_ICON_SQUARE: 14,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::CLUB_ICON_SQUARE_BIG
        CLUB_ICON_SQUARE_BIG: 15,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::VIP_ICON_SQUARE_BIG
        VIP_ICON_SQUARE_BIG: 16,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::CLUB_ICON_GIGANTIC
        CLUB_ICON_GIGANTIC: 17,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboIconType.as::VIP_ICON_GIGANTIC
        VIP_ICON_GIGANTIC: 18,
    } as const;

export type HabboIconTypeValue = typeof HabboIconType[keyof typeof HabboIconType];
