/**
 * The link tokens a help-bubble script may name, mapped to the icon ids the toolbar, the friend
 * bar, the room tools and the chat input actually register their windows under.
 *
 * The mapping exists because the script author writes readable names — a `helpBubble/add/
 * BOTTOM_BAR_CATALOGUE/...` link — while the three bars look their icons up by internal id. An
 * unknown token is **not** an error: `UiHelpBubblesWidget.linkReceived()` falls back to the raw
 * token, so a script may also name an icon id directly.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/uihelpbubbles/UiHelpBubbleIconEnum.as
 */
export class UiHelpBubbleIconEnum
{
    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::FRIENDS_BAR_ALL_FRIENDS
    public static readonly FRIENDS_BAR_ALL_FRIENDS: string = 'icon_all_friends';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::FRIENDS_BAR_FIND_FRIENDS
    public static readonly FRIENDS_BAR_FIND_FRIENDS: string = 'icon_find_friends';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::BOTTOM_BAR_HOME
    public static readonly BOTTOM_BAR_HOME: string = 'HTIE_ICON_HOME';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::BOTTOM_BAR_RECEPTION
    public static readonly BOTTOM_BAR_RECEPTION: string = 'HTIE_ICON_RECEPTION';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::BOTTOM_BAR_NAVIGATOR
    public static readonly BOTTOM_BAR_NAVIGATOR: string = 'HTIE_ICON_NAVIGATOR';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::BOTTOM_BAR_CATALOGUE
    public static readonly BOTTOM_BAR_CATALOGUE: string = 'HTIE_ICON_CATALOGUE';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::BOTTOM_BAR_INVENTORY
    public static readonly BOTTOM_BAR_INVENTORY: string = 'HTIE_ICON_INVENTORY';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::BOTTOM_BAR_STORIES
    public static readonly BOTTOM_BAR_STORIES: string = 'HTIE_ICON_STORIES';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::BOTTOM_BAR_MEMENU
    public static readonly BOTTOM_BAR_MEMENU: string = 'HTIE_ICON_MEMENU';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::BOTTOM_BAR_QUESTS
    // The constant and its value disagree — quests point at the *progression* icon.
    public static readonly BOTTOM_BAR_QUESTS: string = 'HTIE_ICON_PROGRESSION';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::MEMENU_ACHIEVEMENTS
    public static readonly MEMENU_ACHIEVEMENTS: string = 'achievements';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::MEMENU_CLOTHES
    public static readonly MEMENU_CLOTHES: string = 'clothes';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::MEMENU_FORUMS
    public static readonly MEMENU_FORUMS: string = 'forums';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::MEMENU_TALENTS
    public static readonly MEMENU_TALENTS: string = 'talents';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::MEMENU_GUIDE
    public static readonly MEMENU_GUIDE: string = 'guide';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::MEMENU_MAIL
    public static readonly MEMENU_MAIL: string = 'mail';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::MEMENU_PROFILE
    public static readonly MEMENU_PROFILE: string = 'profile';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::MEMENU_ROOMS
    public static readonly MEMENU_ROOMS: string = 'rooms';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::CHAT_INPUT
    // The one token the widget itself compares against by value — it is the only element reached
    // through the chat input rather than through an icon lookup.
    public static readonly CHAT_INPUT: string = 'chat_input';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::HC_JOIN_BUTTON
    // Name DERIVED (`_SafeStr_11024`), from its value "hc_join_button".
    public static readonly HC_JOIN_BUTTON: string = 'hc_join_button';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::HELP_BUTTON
    // Name DERIVED (`_SafeStr_10699`), from its value "help_button".
    public static readonly HELP_BUTTON: string = 'help_button';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::SETTINGS_BUTTON
    // Name DERIVED (`_SafeStr_11088`), from its value "settings_button".
    public static readonly SETTINGS_BUTTON: string = 'settings_button';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::CREDITS_BUTTON
    public static readonly CREDITS_BUTTON: string = 'credit_count_button';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::DUCKET_COUNT_BUTTON
    // Name DERIVED (`_SafeStr_10522`), from its value. Its unobfuscated neighbour is named
    // CREDITS_BUTTON rather than CREDIT_COUNT_BUTTON, so the scheme is not consistent enough to
    // shorten this one the same way.
    public static readonly DUCKET_COUNT_BUTTON: string = 'ducket_count_button';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::DIAMOND_COUNT_BUTTON
    // Name DERIVED (`_SafeStr_11592`), from its value "diamond_count_button".
    public static readonly DIAMOND_COUNT_BUTTON: string = 'diamond_count_button';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::LOGOUT_BUTTON
    // Name DERIVED (`_SafeStr_11310`), from its value "logout_button".
    public static readonly LOGOUT_BUTTON: string = 'logout_button';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::ROOM_HISTORY_BACK_BUTTON
    public static readonly ROOM_HISTORY_BACK_BUTTON: string = 'button_history_back';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::ROOM_HISTORY_FORWARD_BUTTON
    public static readonly ROOM_HISTORY_FORWARD_BUTTON: string = 'button_history_forward';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::ROOM_HISTORY_BUTTON
    public static readonly ROOM_HISTORY_BUTTON: string = 'button_history';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::CHAT_HISTORY_BUTTON
    public static readonly CHAT_HISTORY_BUTTON: string = 'button_chat_history';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::LIKE_ROOM_BUTTON
    public static readonly LIKE_ROOM_BUTTON: string = 'button_like';

    // AS3: .../widget/uihelpbubbles/UiHelpBubbleIconEnum.as::CAMERA_BUTTON
    public static readonly CAMERA_BUTTON: string = 'button_camera';

    /**
     * TS-only: AS3 reads the constant straight off the class — `UiHelpBubbleIconEnum[token]` — so
     * an unknown token yields undefined and the caller falls back to the raw string.
     *
     * An explicit table is used rather than an index signature on the class, because bracket
     * access on a JS class object also resolves `name`, `length` and `prototype`. A script naming
     * an element "name" would otherwise be handed the string "UiHelpBubbleIconEnum".
     */
    // TS-only: the lookup table behind `resolve()` — see the block comment above.
    private static readonly TOKENS: ReadonlyMap<string, string> = new Map(
        Object.entries(UiHelpBubbleIconEnum).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
        )
    );

    // TS-only: the guarded form of AS3's `UiHelpBubbleIconEnum[token]` — see `TOKENS` above.
    public static resolve(token: string): string | null
    {
        return UiHelpBubbleIconEnum.TOKENS.get(token) ?? null;
    }
}
