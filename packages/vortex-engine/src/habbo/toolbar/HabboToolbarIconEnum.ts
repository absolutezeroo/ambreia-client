/**
 * Toolbar icon ID constants and icon name mapping
 *
 * Each constant represents a toolbar icon identifier. The getIconName() method
 * maps icon IDs back to their human-readable names.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as
 */
export class HabboToolbarIconEnum
{
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::HELP
    public static readonly HELP: string = 'HTIE_ICON_HELP';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::NAVIGATOR
    public static readonly NAVIGATOR: string = 'HTIE_ICON_NAVIGATOR';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::CATALOGUE
    public static readonly CATALOGUE: string = 'HTIE_ICON_CATALOGUE';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::INVENTORY
    public static readonly INVENTORY: string = 'HTIE_ICON_INVENTORY';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::PROGRESSION
    public static readonly PROGRESSION: string = 'HTIE_ICON_PROGRESSION';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::ACHIEVEMENTS
    public static readonly ACHIEVEMENTS: string = 'HTIE_ICON_ACHIEVEMENTS';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::MEMENU
    public static readonly MEMENU: string = 'HTIE_ICON_MEMENU';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::STORIES
    public static readonly STORIES: string = 'HTIE_ICON_STORIES';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::RECEPTION
    public static readonly RECEPTION: string = 'HTIE_ICON_RECEPTION';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::HOME
    public static readonly HOME: string = 'HTIE_ICON_HOME';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::GUIDE
    public static readonly GUIDE: string = 'HTIE_ICON_GUIDE';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::ROOMINFO
    public static readonly ROOMINFO: string = 'HTIE_ICON_ROOMINFO';

    public static readonly GROUP: string = 'HTIE_EXT_GROUP';

    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::NAVIGATOR_ME_TAB
    public static readonly NAVIGATOR_ME_TAB: string = 'HTIE_ICON_NAVIGATOR_ME_TAB';

    private static readonly TOOLBAR_NAMES: Map<string, string> = new Map<string, string>([
        ['HTIE_ICON_HELP', 'HELP'],
        ['HTIE_ICON_NAVIGATOR', 'NAVIGATOR'],
        ['HTIE_ICON_CATALOGUE', 'CATALOGUE'],
        ['HTIE_ICON_INVENTORY', 'INVENTORY'],
        ['HTIE_ICON_PROGRESSION', 'PROGRESSION'],
        ['HTIE_ICON_ACHIEVEMENTS', 'ACHIEVEMENTS'],
        ['HTIE_ICON_MEMENU', 'MEMENU'],
        ['HTIE_ICON_STORIES', 'STORIES'],
        ['HTIE_ICON_RECEPTION', 'RECEPTION'],
        ['HTIE_ICON_HOME', 'HOME'],
        ['HTIE_ICON_GUIDE', 'GUIDE'],

    ]);

    /**
	 * Get the human-readable name for a toolbar icon ID
	 *
	 * @param iconId The icon identifier string
	 * @returns The icon name, or null if not found
	 */
    // AS3: .../src/com/sulake/habbo/toolbar/HabboToolbarIconEnum.as::getIconName()
    public static getIconName(iconId: string): string | null
    {
        return HabboToolbarIconEnum.TOOLBAR_NAMES.get(iconId) ?? null;
    }
}
