/**
 * Alert dialog content flags (bitwise).
 *
 * Controls which elements appear in a Habbo alert dialog.
 * Flags are OR'd together to compose a dialog layout.
 *
 * @see sources/win63_version/habbo/window/enum/HabboAlertDialogFlag.as
 */
export const HabboAlertDialogFlag =
    {
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboAlertDialogFlag.as::NULL
        NULL: 0,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboAlertDialogFlag.as::TEXT_TITLE
        TEXT_TITLE: 1,
        // AS3: sources/win63_version/habbo/window/enum/HabboAlertDialogFlag.as::const_479
        TEXT_SUMMARY: 2,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboAlertDialogFlag.as::TEXT_HTML
        TEXT_HTML: 4,
        // AS3: sources/win63_version/habbo/window/enum/HabboAlertDialogFlag.as::const_693
        TEXT_LINK: 8,
        // AS3: sources/win63_version/habbo/window/enum/HabboAlertDialogFlag.as::const_210
        BUTTON_OK: 16,
        // AS3: sources/win63_version/habbo/window/enum/HabboAlertDialogFlag.as::const_131
        BUTTON_CANCEL: 32,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboAlertDialogFlag.as::BUTTON_CUSTOM
        BUTTON_CUSTOM: 64,
        // AS3: sources/win63_version/habbo/window/enum/HabboAlertDialogFlag.as::const_1066
        BUTTON_CLOSE: 128,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboAlertDialogFlag.as::BITMAP_ICON
        BITMAP_ICON: 256,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboAlertDialogFlag.as::BITMAP_RESERVED_1
        BITMAP_RESERVED_1: 512,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboAlertDialogFlag.as::BITMAP_RESERVED_2
        BITMAP_RESERVED_2: 1024,
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/HabboAlertDialogFlag.as::BITMAP_RESERVED_3
        BITMAP_RESERVED_3: 2048,
    } as const;

export type HabboAlertDialogFlagValue = typeof HabboAlertDialogFlag[keyof typeof HabboAlertDialogFlag];
