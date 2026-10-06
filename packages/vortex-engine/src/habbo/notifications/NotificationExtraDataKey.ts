/**
 * NotificationExtraDataKey
 *
 * The keys a notification's `extraData` bag may carry. AS3 declares them as a constants class so
 * the producers (wired, the catalog, the friend bar) and the consumers (the item view's display
 * time, `hasNotificationById()`'s dedup) agree without sharing a type.
 *
 * Two of the seven are obfuscated in every tree and are named after the string they hold, which is
 * the string the consumers actually match on — see the individual notes.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/NotificationExtraDataKey.as
 */
export const NotificationExtraDataKey = {
    /**
     * How long the notification stays up, in milliseconds, overriding the type's configured
     * default. Read by `HabboNotificationItemView.displayTime`, which is not ported yet, so a
     * notification carrying this key currently falls back to the default duration.
     *
     * Name DERIVED (`_SafeStr_10583`): obfuscated in every tree; named after its value.
     */
    // AS3: .../src/com/sulake/habbo/notifications/NotificationExtraDataKey.as::_SafeStr_10583
    TIME_DISPLAY: 'time_display',

    // AS3: .../src/com/sulake/habbo/notifications/NotificationExtraDataKey.as::STAY
    STAY: 'stay',

    // AS3: .../src/com/sulake/habbo/notifications/NotificationExtraDataKey.as::ID
    ID: 'id',

    // AS3: .../src/com/sulake/habbo/notifications/NotificationExtraDataKey.as::PRODUCT
    PRODUCT: 'product',

    // AS3: .../src/com/sulake/habbo/notifications/NotificationExtraDataKey.as::TOGGLE_BUTTON_CALLBACK
    TOGGLE_BUTTON_CALLBACK: 'toggle_callback'
} as const;
