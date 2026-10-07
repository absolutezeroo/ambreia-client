/**
 * Every room-widget type code, as one table.
 *
 * **Nothing in any source tree reads this class.** AS3's own call sites write the literals its
 * constants expand to, and so does this port. It is transcribed because it is part of the client
 * and because it is the only place these names are recorded — not because anything dispatches on
 * it. Adopting it across the widget switches would be a bulk string-to-constant swap with no
 * behaviour change and a real chance of a silent typo; the literals are already correct.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/enums/RoomWidgetEnum.as
 */
export const RoomWidgetEnum = {
    // AS3: RoomWidgetEnum.as::INFOSTAND_WIDGET
    INFOSTAND_WIDGET: "RWE_INFOSTAND",

    // AS3: RoomWidgetEnum.as::ME_MENU_WIDGET
    ME_MENU_WIDGET: "RWE_ME_MENU",

    // AS3: RoomWidgetEnum.as::CHAT_INPUT_WIDGET
    CHAT_INPUT_WIDGET: "RWE_CHAT_INPUT_WIDGET",

    // AS3: RoomWidgetEnum.as::FURNI_PLACEHOLDER_WIDGET
    FURNI_PLACEHOLDER_WIDGET: "RWE_FURNI_PLACEHOLDER",

    // AS3: RoomWidgetEnum.as::FURNI_CREDIT_WIDGET
    FURNI_CREDIT_WIDGET: "RWE_FURNI_CREDIT_WIDGET",

    // AS3: RoomWidgetEnum.as::FURNI_STICKIE_WIDGET
    FURNI_STICKIE_WIDGET: "RWE_FURNI_STICKIE_WIDGET",

    // AS3: RoomWidgetEnum.as::FURNI_TROPHY_WIDGET
    FURNI_TROPHY_WIDGET: "RWE_FURNI_TROPHY_WIDGET",

    // AS3: RoomWidgetEnum.as::FURNI_PRESENT_WIDGET
    FURNI_PRESENT_WIDGET: "RWE_FURNI_PRESENT_WIDGET",

    // AS3: RoomWidgetEnum.as::FURNI_ECOTRONBOX_WIDGET
    FURNI_ECOTRONBOX_WIDGET: "RWE_FURNI_ECOTRONBOX_WIDGET",

    // AS3: RoomWidgetEnum.as::FURNI_PET_PACKAGE_WIDGET
    FURNI_PET_PACKAGE_WIDGET: "RWE_FURNI_PET_PACKAGE_WIDGET",

    // AS3: RoomWidgetEnum.as::DOORBELL
    DOORBELL: "RWE_DOORBELL",

    // AS3: RoomWidgetEnum.as::LOADINGBAR
    LOADINGBAR: "RWE_LOADINGBAR",

    // AS3: RoomWidgetEnum.as::ROOM_QUEUE
    ROOM_QUEUE: "RWE_ROOM_QUEUE",

    // AS3: RoomWidgetEnum.as::USER_CHOOSER
    USER_CHOOSER: "RWE_USER_CHOOSER",

    // AS3: RoomWidgetEnum.as::FURNI_CHOOSER
    FURNI_CHOOSER: "RWE_FURNI_CHOOSER",

    // AS3: RoomWidgetEnum.as::DIMMER
    DIMMER: "RWE_ROOM_DIMMER",

    // AS3: RoomWidgetEnum.as::FRIEND_REQUEST
    FRIEND_REQUEST: "RWE_FRIEND_REQUEST",

    // AS3: RoomWidgetEnum.as::CLOTHING_CHANGE
    CLOTHING_CHANGE: "RWE_CLOTHING_CHANGE",

    // AS3: RoomWidgetEnum.as::CONVERSION_TRACKING
    CONVERSION_TRACKING: "RWE_CONVERSION_TRACKING",

    // AS3: RoomWidgetEnum.as::USER_NOTIFICATION
    USER_NOTIFICATION: "RWE_USER_NOTIFICATION",

    // AS3: RoomWidgetEnum.as::FRIENDS_BAR
    FRIENDS_BAR: "RWE_FRIENDS_BAR",

    /** Derived name — `_SafeStr_11541`; named from its own value, which is all it has. */
    // AS3: RoomWidgetEnum.as::_SafeStr_11541
    PURSE_WIDGET: "RWE_PURSE_WIDGET",

    // AS3: RoomWidgetEnum.as::AVATAR_INFO
    AVATAR_INFO: "RWE_AVATAR_INFO",

    // AS3: RoomWidgetEnum.as::SPAMWALL_POSTIT_WIDGET
    SPAMWALL_POSTIT_WIDGET: "RWE_SPAMWALL_POSTIT_WIDGET",

    /** Derived name — `_SafeStr_10234`; named from its own value, which is all it has. */
    // AS3: RoomWidgetEnum.as::_SafeStr_10234
    EFFECTS: "RWE_EFFECTS",

    // AS3: RoomWidgetEnum.as::MANNEQUIN
    MANNEQUIN: "RWE_MANNEQUIN",

    // AS3: RoomWidgetEnum.as::FURNITURE_CONTEXT_MENU
    FURNITURE_CONTEXT_MENU: "RWE_FURNITURE_CONTEXT_MENU",

    // AS3: RoomWidgetEnum.as::LOCATION_WIDGET
    LOCATION_WIDGET: "RWE_LOCATION_WIDGET",

    // AS3: RoomWidgetEnum.as::ROOM_BACKGROUND_COLOR
    ROOM_BACKGROUND_COLOR: "RWE_ROOM_BACKGROUND_COLOR",

    // AS3: RoomWidgetEnum.as::AREA_HIDE
    AREA_HIDE: "RWE_AREA_HIDE",

    // AS3: RoomWidgetEnum.as::CUSTOM_USER_NOTIFICATION
    CUSTOM_USER_NOTIFICATION: "RWE_CUSTOM_USER_NOTIFICATION",

    // AS3: RoomWidgetEnum.as::FURNI_ACHIEVEMENT_RESOLUTION_ENGRAVING
    FURNI_ACHIEVEMENT_RESOLUTION_ENGRAVING: "RWE_FURNI_ACHIEVEMENT_RESOLUTION_ENGRAVING",

    // AS3: RoomWidgetEnum.as::FRIEND_FURNI_CONFIRM
    FRIEND_FURNI_CONFIRM: "RWE_FRIEND_FURNI_CONFIRM",

    // AS3: RoomWidgetEnum.as::FRIEND_FURNI_ENGRAVING
    FRIEND_FURNI_ENGRAVING: "RWE_FRIEND_FURNI_ENGRAVING",

    /** Derived name — `_SafeStr_10404`; named from its own value, which is all it has. */
    // AS3: RoomWidgetEnum.as::_SafeStr_10404
    HIGH_SCORE_DISPLAY: "RWE_HIGH_SCORE_DISPLAY",

    // AS3: RoomWidgetEnum.as::INTERNAL_LINK
    INTERNAL_LINK: "RWE_INTERNAL_LINK",

    // AS3: RoomWidgetEnum.as::CUSTOM_STACK_HEIGHT
    CUSTOM_STACK_HEIGHT: "RWE_CUSTOM_STACK_HEIGHT",

    // AS3: RoomWidgetEnum.as::YOUTUBE
    YOUTUBE: "RWE_YOUTUBE",

    // AS3: RoomWidgetEnum.as::RENTABLESPACE
    RENTABLESPACE: "RWE_RENTABLESPACE",

    // AS3: RoomWidgetEnum.as::VIMEO
    VIMEO: "RWE_VIMEO",

    // AS3: RoomWidgetEnum.as::ROOM_TOOLS
    ROOM_TOOLS: "RWE_ROOM_TOOLS",

    // AS3: RoomWidgetEnum.as::EXTERNAL_IMAGE
    EXTERNAL_IMAGE: "RWE_EXTERNAL_IMAGE",

    /** Derived name — `_SafeStr_11391`; named from its own value, which is all it has. */
    // AS3: RoomWidgetEnum.as::_SafeStr_11391
    UI_HELP_BUBBLE: "RWE_UI_HELP_BUBBLE",

    // AS3: RoomWidgetEnum.as::ROOM_LINK
    ROOM_LINK: "RWE_ROOM_LINK",

    // AS3: RoomWidgetEnum.as::CRAFTING
    CRAFTING: "RWE_CRAFTING",

    // TS-only: Vortex-only fishing system — no AS3 counterpart.
    //   See docs/vortex-original/fishing.md §2.3.
    FISHING_SPOT: "RWE_FISHING_SPOT",
    // TS-only: the wooden sign beside a fishing zone; a click opens the Fish-O-Pedia.
    //   See docs/vortex-original/fishing.md §1 and §15.
    FISHING_SIGN: "RWE_FISHING_SIGN",
} as const;

export type RoomWidgetEnum = typeof RoomWidgetEnum[keyof typeof RoomWidgetEnum];
