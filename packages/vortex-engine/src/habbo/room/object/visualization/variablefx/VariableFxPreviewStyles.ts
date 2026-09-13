import {OrderedMap} from '@core/utils/OrderedMap';
import {VariableFxPreviewStyleDefinition} from './VariableFxPreviewStyleDefinition';

/**
 * Every style the server can name, as one table built on first use.
 *
 * The wire sends `(categoryId, styleId)` and the client needs a style NAME plus the extras that go
 * with it — an icon for a status bar, a `design` for a number display, a `sub_renderer` for a level
 * badge. None of that is on the wire; it lives here.
 *
 * Twenty-two of the thirty-eight entries are status bars, and they are all the same definition with
 * a different icon and colour, which is why {@link statusDefinition} exists. That is also the tell
 * for what `status_bar` is: not a different renderer from `progress_bar`, just a different reason
 * for the bar to be there.
 *
 * Named for what it holds: the AS3 class is `_SafeCls_2134` and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_2134.as
 */
export class VariableFxPreviewStyles
{
    // AS3: .../variablefx/_SafeCls_2134.as::HEALTH_POINTS_CATEGORY_ID (name derived)
    //   The AS3 constant is `_SafeStr_11748`, value 0.
    private static readonly HEALTH_POINTS_CATEGORY_ID: number = 0;

    // AS3: .../variablefx/_SafeCls_2134.as::PROGRESS_BAR_CATEGORY_ID
    private static readonly PROGRESS_BAR_CATEGORY_ID: number = 1;

    // AS3: .../variablefx/_SafeCls_2134.as::LEVELLING_PROGRESS_CATEGORY_ID (name derived)
    //   The AS3 constant is `_SafeStr_11466`, value 2.
    private static readonly LEVELLING_PROGRESS_CATEGORY_ID: number = 2;

    // AS3: .../variablefx/_SafeCls_2134.as::STATUS_BAR_CATEGORY_ID
    private static readonly STATUS_BAR_CATEGORY_ID: number = 3;

    // AS3: .../variablefx/_SafeCls_2134.as::BOSS_BAR_CATEGORY_ID
    private static readonly BOSS_BAR_CATEGORY_ID: number = 4;

    // AS3: .../variablefx/_SafeCls_2134.as::NUMBER_DISPLAY_CATEGORY_ID
    private static readonly NUMBER_DISPLAY_CATEGORY_ID: number = 5;

    // AS3: .../variablefx/_SafeCls_2134.as::_definitions (name derived)
    private static _definitions: VariableFxPreviewStyleDefinition[] | null = null;

    // AS3: .../variablefx/_SafeCls_2134.as::_serverStyleNames
    private static _serverStyleNames: string[] | null = null;

    // AS3: .../variablefx/_SafeCls_2134.as::get DEFINITIONS()
    static get DEFINITIONS(): VariableFxPreviewStyleDefinition[]
    {
        VariableFxPreviewStyles.initialize();

        return VariableFxPreviewStyles._definitions ?? [];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::getByServerStyle()
    static getByServerStyle(serverStyle: string): VariableFxPreviewStyleDefinition | null
    {
        for(const definition of VariableFxPreviewStyles.DEFINITIONS)
        {
            if(definition.serverStyle === serverStyle) return definition;
        }

        return null;
    }

    /** The pair the wire sends — `styleId` is scoped to the category, not global. */
    // AS3: .../variablefx/_SafeCls_2134.as::getByCategoryAndStyleId()
    static getByCategoryAndStyleId(categoryId: number, styleId: number): VariableFxPreviewStyleDefinition | null
    {
        for(const definition of VariableFxPreviewStyles.DEFINITIONS)
        {
            if(definition.categoryId === categoryId && definition.styleId === styleId) return definition;
        }

        return null;
    }

    // AS3: .../variablefx/_SafeCls_2134.as::getByCategoryId()
    static getByCategoryId(categoryId: number): VariableFxPreviewStyleDefinition[]
    {
        return VariableFxPreviewStyles.DEFINITIONS.filter((definition) => definition.categoryId === categoryId);
    }

    // AS3: .../variablefx/_SafeCls_2134.as::getImplementedServerStyles()
    static getImplementedServerStyles(): string[]
    {
        VariableFxPreviewStyles.initialize();

        return (VariableFxPreviewStyles._serverStyleNames ?? []).slice();
    }

    // AS3: .../variablefx/_SafeCls_2134.as::initialize()
    private static initialize(): void
    {
        if(VariableFxPreviewStyles._definitions !== null) return;

        const define = VariableFxPreviewStyles.definition;
        const status = VariableFxPreviewStyles.statusDefinition;
        const allTeam = VariableFxPreviewStyles.allAndTeamColors;
        const xsToXl = VariableFxPreviewStyles.xsToXlWidths;
        const sToL = VariableFxPreviewStyles.smallToLargeWidths;
        const extra = VariableFxPreviewStyles.extra;
        const PROGRESS = VariableFxPreviewStyles.PROGRESS_BAR_CATEGORY_ID;
        const HEALTH = VariableFxPreviewStyles.HEALTH_POINTS_CATEGORY_ID;
        const LEVEL = VariableFxPreviewStyles.LEVELLING_PROGRESS_CATEGORY_ID;
        const BOSS = VariableFxPreviewStyles.BOSS_BAR_CATEGORY_ID;
        const NUMBER = VariableFxPreviewStyles.NUMBER_DISPLAY_CATEGORY_ID;

        VariableFxPreviewStyles._definitions = [
            define(allTeam(), ['classic_progress'], xsToXl(), 'progress_bar', PROGRESS, 'GREEN', 'classic_progress', 'medium', 'CLASSIC_BAR', 0),
            define(allTeam(), ['block_progress'], xsToXl(), 'progress_bar', PROGRESS, 'GREEN', 'block_progress', 'medium', 'BLOCK_BAR', 1),
            define(allTeam(), ['striped_progress'], xsToXl(), 'progress_bar', PROGRESS, 'GREEN', 'striped_progress', 'medium', 'STRIPED_BAR', 2),
            define(allTeam(), ['arrow_progress'], xsToXl(), 'progress_bar', PROGRESS, 'GREEN', 'arrow_progress', 'medium', 'ARROW_BAR', 3),
            define(allTeam(), ['classic_mini_progress'], xsToXl(), 'progress_bar', PROGRESS, 'GREEN', 'classic_mini_progress', 'medium', 'CLASSIC_MINI_BAR', 4),

            define(VariableFxPreviewStyles.dynamicRedToGreenColors(), ['health_progress'], sToL(), 'health_points', HEALTH, 'DYNAMIC_RED_TO_GREEN', 'health_progress', 'medium', 'HEALTH_BAR', 0, extra('icon', 'misc_heart')),
            define(allTeam(), ['masked_heart_fill'], ['not_applicable'], 'health_points', HEALTH, 'RED', 'masked_heart_fill', 'not_applicable', 'SINGLE_HEART', 3),
            define(allTeam(), ['stacked_health_points'], ['medium', 'large'], 'health_points', HEALTH, 'RED', 'stacked_health_points', 'medium', 'STACKED', 1),
            define(['NOT_APPLICABLE'], ['thermometer_health_points'], xsToXl(), 'health_points', HEALTH, 'NOT_APPLICABLE', 'thermometer_health_points', 'medium', 'THERMOMETER', 2),

            define(VariableFxPreviewStyles.levellingColors(), ['level_with_progress'], sToL(), 'levelling_progress', LEVEL, 'DYNAMIC_LEVELLING', 'level_with_progress', 'medium', 'LEVEL_AND_BAR', 0, extra('sub_renderer', '2'), VariableFxPreviewStyles.levelStatusExtra()),
            define(VariableFxPreviewStyles.levellingColors(), ['level_with_bar_and_numerical_progress'], VariableFxPreviewStyles.sToXlWidths(), 'levelling_progress', LEVEL, 'DYNAMIC_LEVELLING', 'level_with_bar_and_numerical_progress', 'medium', 'LEVEL_DETAILS', 1, extra('sub_renderer', '1'), VariableFxPreviewStyles.levelStatusExtra()),

            define(['RED'], ['boss_health_bar'], VariableFxPreviewStyles.lToXxlWidths(), 'boss_bar', BOSS, 'RED', 'boss_health_bar', 'extra_large', 'BOSS_HEALTH_AND_SKULL', 0, extra('icon', 'misc_skull', 'icon_alignment', 'double')),
            define(VariableFxPreviewStyles.allAndRedToGreenColors(), ['boss_health_bar'], VariableFxPreviewStyles.lToXxlWidths(), 'boss_bar', BOSS, 'RED', 'boss_health_bar', 'extra_large', 'BOSS_HEALTH', 1),

            define(VariableFxPreviewStyles.numberTeamColors(), ['number_baked_colors'], ['not_applicable'], 'number_display', NUMBER, 'GREEN', 'number_baked_colors', 'not_applicable', 'NUMBER_FREEZE', 0, extra('design', 'freeze_style')),
            define(allTeam(), ['number_recolorable'], ['not_applicable'], 'number_display', NUMBER, 'GREEN', 'number_recolorable', 'not_applicable', 'NUMBER_SHALIMAR', 1, extra('design', 'shalimar')),
            define(allTeam(), ['number_recolorable'], ['not_applicable'], 'number_display', NUMBER, 'GREEN', 'number_recolorable', 'not_applicable', 'NUMBER_BLOCKY', 2, extra('design', 'blocky')),

            status('STATUS_ENERGY', 0, 'energy', '#ffd83d'),
            status('STATUS_SHIELD', 1, 'shield', '#4aa9f6'),
            status('STATUS_MAGIC', 2, 'magic', '#8751d1'),
            status('STATUS_FOOD', 3, 'food', '#ff9f24'),
            status('STATUS_STAMINA', 4, 'stamina', '#86d213'),
            status('STATUS_POISON', 5, 'poison', '#8ddc35'),
            status('STATUS_MANA', 6, 'mana', '#268fff'),
            status('STATUS_HEALTH', 7, 'health', '#7dce35'),
            status('STATUS_GOLD', 8, 'gold', '#ffc83d', true),
            status('STATUS_GEMS', 9, 'gems', '#416bdd', true),
            status('STATUS_HONOR', 10, 'honor', '#fac384'),
            status('STATUS_REPUTATION', 11, 'reputation', '#ffd83d'),
            status('STATUS_COOLDOWN', 12, 'cooldown', '#b8c3cc'),
            status('STATUS_TIME_LEFT', 13, 'timeleft', '#74b9e8'),
            status('STATUS_BURNING', 14, 'burning', '#ff5a1f'),
            status('STATUS_FREEZING', 15, 'freezing', '#82cfff'),

            // The one status style that is not a `statusDefinition()`: it takes the red-to-green
            // ramp and an icon rather than a fixed colour.
            define(VariableFxPreviewStyles.dynamicRedToGreenColors(), VariableFxPreviewStyles.statusRenderers(), xsToXl(), 'status_bar', VariableFxPreviewStyles.STATUS_BAR_CATEGORY_ID, 'DYNAMIC_RED_TO_GREEN', 'block_progress', 'medium', 'STATUS_BATTERY', 16, extra('icon', 'battery')),

            status('STATUS_REPAIRING', 17, 'repairing', '#c9c5b8', true),
            status('STATUS_STEALTH', 18, 'stealth', '#6254a8'),
            status('STATUS_UPGRADING', 19, 'upgrading', '#6bdc34'),
            status('STATUS_STAR_POWER', 20, 'star_power', '#ffd900', true),
            status('STATUS_WATER', 21, 'droplet', '#4aabf5')
        ];

        VariableFxPreviewStyles._serverStyleNames = VariableFxPreviewStyles._definitions.map((d) => d.serverStyle);
    }

    // AS3: .../variablefx/_SafeCls_2134.as::definition()
    private static definition(
        allowedColors: string[],
        allowedRenderers: string[],
        allowedWidths: string[],
        category: string,
        categoryId: number,
        defaultColor: string,
        defaultRenderer: string,
        defaultWidth: string,
        serverStyle: string,
        styleId: number,
        defaultConfigExtra: OrderedMap | null = null,
        defaultStatusExtra: OrderedMap | null = null
    ): VariableFxPreviewStyleDefinition
    {
        return new VariableFxPreviewStyleDefinition(
            allowedColors, allowedRenderers, allowedWidths, category, categoryId,
            defaultColor, defaultRenderer, defaultWidth, serverStyle, styleId,
            defaultConfigExtra, defaultStatusExtra
        );
    }

    /** Twenty-two of the table's entries are this — a block bar with an icon and a fixed colour. */
    // AS3: .../variablefx/_SafeCls_2134.as::statusDefinition()
    private static statusDefinition(
        serverStyle: string,
        styleId: number,
        icon: string,
        color: string,
        metallic: boolean = false
    ): VariableFxPreviewStyleDefinition
    {
        return VariableFxPreviewStyles.definition(
            ['NOT_APPLICABLE'],
            VariableFxPreviewStyles.statusRenderers(),
            VariableFxPreviewStyles.xsToXlWidths(),
            'status_bar',
            VariableFxPreviewStyles.STATUS_BAR_CATEGORY_ID,
            'NOT_APPLICABLE',
            'block_progress',
            'medium',
            serverStyle,
            styleId,
            VariableFxPreviewStyles.extra('icon', icon, 'color', color, 'metallic', String(metallic))
        );
    }

    // AS3: .../variablefx/_SafeCls_2134.as::normalColors()
    private static normalColors(): string[]
    {
        return [
            'GREEN', 'LIME_GREEN', 'YELLOW', 'ORANGE', 'RED', 'CYAN', 'BLUE', 'PURPLE', 'PINK',
            'BROWN', 'BEIGE', 'TEAL', 'INDIGO', 'MAGENTA', 'LIGHT_BLUE', 'FIRE_ORANGE',
            'DARK_GREEN', 'DARK_BLUE', 'WHITE', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'EMERALD'
        ];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::allAndTeamColors()
    private static allAndTeamColors(): string[]
    {
        return [...VariableFxPreviewStyles.normalColors(), 'DYNAMIC_TEAM_COLOR'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::allAndRedToGreenColors()
    private static allAndRedToGreenColors(): string[]
    {
        return [...VariableFxPreviewStyles.normalColors(), 'DYNAMIC_RED_TO_GREEN', 'DYNAMIC_TEAM_COLOR'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::levellingColors()
    private static levellingColors(): string[]
    {
        return [...VariableFxPreviewStyles.normalColors(), 'DYNAMIC_LEVELLING', 'DYNAMIC_TEAM_COLOR'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::dynamicRedToGreenColors()
    private static dynamicRedToGreenColors(): string[]
    {
        return ['DYNAMIC_RED_TO_GREEN'];
    }

    /** The five the freeze sheet has rows for, plus the team colour that resolves into them. */
    // AS3: .../variablefx/_SafeCls_2134.as::numberTeamColors()
    private static numberTeamColors(): string[]
    {
        return ['RED', 'GREEN', 'BLUE', 'YELLOW', 'WHITE', 'DYNAMIC_TEAM_COLOR'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::smallToLargeWidths()
    private static smallToLargeWidths(): string[]
    {
        return ['small', 'medium', 'large'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::sToXlWidths()
    private static sToXlWidths(): string[]
    {
        return ['small', 'medium', 'large', 'extra_large'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::xsToXlWidths()
    private static xsToXlWidths(): string[]
    {
        return ['extra_small', 'small', 'medium', 'large', 'extra_large'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::lToXxlWidths()
    private static lToXxlWidths(): string[]
    {
        return ['large', 'extra_large', 'big_mahoosive_chonky'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::statusRenderers()
    private static statusRenderers(): string[]
    {
        return ['block_progress', 'striped_progress', 'arrow_progress'];
    }

    // AS3: .../variablefx/_SafeCls_2134.as::levelStatusExtra()
    private static levelStatusExtra(): OrderedMap
    {
        return VariableFxPreviewStyles.extra('current_level', '1', 'is_maxed', 'false', 'max_level', '25');
    }

    // AS3: .../variablefx/_SafeCls_2134.as::extra()
    private static extra(
        key1: string,
        value1: string,
        key2: string | null = null,
        value2: string | null = null,
        key3: string | null = null,
        value3: string | null = null
    ): OrderedMap
    {
        const extra = new OrderedMap();

        extra.add(key1, value1);

        if(key2 !== null && value2 !== null) extra.add(key2, value2);

        if(key3 !== null && value3 !== null) extra.add(key3, value3);

        return extra;
    }
}
