import {VariableFxPaintColor} from './VariableFxPaintColor';
import {VariableFxWidth} from './VariableFxWidth';
import {resolveVariableFxRendererById, resolveVariableFxRendererId} from './VariableFxRendererType';

/**
 * The id↔name tables the wire speaks in: categories, colours, widths and renderers.
 *
 * A `VariableFxConfigUpdate` carries nothing but numbers, and every renderer in the feature is
 * written against names. This is the one place that translation happens, in both directions,
 * because the Wired editor has to send ids back for names the user picked.
 *
 * Two asymmetries are deliberate and both are the AS3's. An unknown CATEGORY resolves to null,
 * because there is nothing sensible to draw for a category this build does not have; an unknown
 * COLOUR or WIDTH resolves to a working default (`NOT_APPLICABLE` and `medium`), because a config
 * whose colour this build cannot name is still a config that should render.
 *
 * Named for what it is: the AS3 class is `_SafeCls_2108` and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_2108.as
 */
export class VariableFxCatalog
{
    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_HEALTH_POINTS
    static readonly CATEGORY_HEALTH_POINTS: string = 'health_points';

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_PROGRESS_BAR
    static readonly CATEGORY_PROGRESS_BAR: string = 'progress_bar';

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_LEVELLING_PROGRESS
    static readonly CATEGORY_LEVELLING_PROGRESS: string = 'levelling_progress';

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_STATUS_BAR
    static readonly CATEGORY_STATUS_BAR: string = 'status_bar';

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_BOSS_BAR
    static readonly CATEGORY_BOSS_BAR: string = 'boss_bar';

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_NUMBER_DISPLAY
    static readonly CATEGORY_NUMBER_DISPLAY: string = 'number_display';

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_HEALTH_POINTS_ID
    static readonly CATEGORY_HEALTH_POINTS_ID: number = 0;

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_PROGRESS_BAR_ID
    static readonly CATEGORY_PROGRESS_BAR_ID: number = 1;

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_LEVELLING_PROGRESS_ID
    static readonly CATEGORY_LEVELLING_PROGRESS_ID: number = 2;

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_STATUS_BAR_ID
    static readonly CATEGORY_STATUS_BAR_ID: number = 3;

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_BOSS_BAR_ID
    static readonly CATEGORY_BOSS_BAR_ID: number = 4;

    // AS3: .../variablefx/_SafeCls_2108.as::CATEGORY_NUMBER_DISPLAY_ID
    static readonly CATEGORY_NUMBER_DISPLAY_ID: number = 5;

    /**
     * The single table every accessor below reads, in both directions.
     *
     * AS3 writes each direction as its own switch — eight of them — which is eight places for the
     * two halves of one mapping to drift apart. One table cannot.
     */
    // AS3: .../variablefx/_SafeCls_2108.as::resolveCategoryById()
    private static readonly CATEGORIES: ReadonlyArray<[number, string]> = [
        [0, VariableFxCatalog.CATEGORY_HEALTH_POINTS],
        [1, VariableFxCatalog.CATEGORY_PROGRESS_BAR],
        [2, VariableFxCatalog.CATEGORY_LEVELLING_PROGRESS],
        [3, VariableFxCatalog.CATEGORY_STATUS_BAR],
        [4, VariableFxCatalog.CATEGORY_BOSS_BAR],
        [5, VariableFxCatalog.CATEGORY_NUMBER_DISPLAY]
    ];

    // AS3: .../variablefx/_SafeCls_2108.as::resolveColorById()
    private static readonly COLORS: ReadonlyArray<[number, string]> = [
        [-1, VariableFxPaintColor.NOT_APPLICABLE],
        [1, 'GREEN'], [2, 'LIME_GREEN'], [3, 'YELLOW'], [4, 'ORANGE'], [5, 'RED'],
        [6, 'CYAN'], [7, 'BLUE'], [8, 'PURPLE'], [9, 'PINK'], [10, 'BROWN'],
        [11, 'BEIGE'], [12, 'TEAL'], [13, 'INDIGO'], [14, 'MAGENTA'], [15, 'LIGHT_BLUE'],
        [16, 'FIRE_ORANGE'], [17, 'DARK_GREEN'], [18, 'DARK_BLUE'], [19, 'WHITE'],
        [100, 'BRONZE'], [101, 'SILVER'], [102, 'GOLD'], [103, 'DIAMOND'], [104, 'EMERALD'],
        [1000, VariableFxPaintColor.DYNAMIC_RED_TO_GREEN],
        [1001, VariableFxPaintColor.DYNAMIC_LEVELLING],
        [1002, VariableFxPaintColor.DYNAMIC_TEAM_COLOR]
    ];

    // AS3: .../variablefx/_SafeCls_2108.as::resolveWidthById()
    private static readonly WIDTHS: ReadonlyArray<[number, string]> = [
        [-1, VariableFxWidth.NOT_APPLICABLE],
        [0, VariableFxWidth.EXTRA_SMALL],
        [1, VariableFxWidth.SMALL],
        [2, VariableFxWidth.MEDIUM],
        [3, VariableFxWidth.LARGE],
        [4, VariableFxWidth.EXTRA_LARGE],
        [100, VariableFxWidth.BIG_MAHOOSIVE_CHONKY]
    ];

    /** The renderer ids the shipped mapping declares — 200/201 are the two number displays. */
    // AS3: .../variablefx/_SafeCls_2108.as::RENDERER_IDS
    private static readonly RENDERER_IDS: ReadonlyArray<number> = [
        0, 1, 2, 3, 4, 10, 11, 12, 13, 20, 21, 100, 101, 200, 201
    ];

    // AS3: .../variablefx/_SafeCls_2108.as::getCategoryIds()
    static getCategoryIds(): number[]
    {
        return VariableFxCatalog.CATEGORIES.map(([id]) => id);
    }

    // AS3: .../variablefx/_SafeCls_2108.as::getColorIds()
    static getColorIds(): number[]
    {
        return VariableFxCatalog.COLORS.map(([id]) => id);
    }

    // AS3: .../variablefx/_SafeCls_2108.as::getWidthIds()
    static getWidthIds(): number[]
    {
        return VariableFxCatalog.WIDTHS.map(([id]) => id);
    }

    // AS3: .../variablefx/_SafeCls_2108.as::getRendererIds()
    static getRendererIds(): number[]
    {
        return VariableFxCatalog.RENDERER_IDS.slice();
    }

    /** Null on an unknown id — there is nothing to draw for a category this build does not have. */
    // AS3: .../variablefx/_SafeCls_2108.as::resolveCategoryById()
    static resolveCategoryById(id: number): string | null
    {
        return VariableFxCatalog.nameOf(VariableFxCatalog.CATEGORIES, id);
    }

    // AS3: .../variablefx/_SafeCls_2108.as::resolveCategoryId()
    static resolveCategoryId(name: string): number
    {
        return VariableFxCatalog.idOf(VariableFxCatalog.CATEGORIES, name, -1);
    }

    /** An unknown colour still renders — as `NOT_APPLICABLE`, which the palette resolves to white. */
    // AS3: .../variablefx/_SafeCls_2108.as::resolveColorById()
    static resolveColorById(id: number): string
    {
        return VariableFxCatalog.nameOf(VariableFxCatalog.COLORS, id) ?? VariableFxPaintColor.NOT_APPLICABLE;
    }

    // AS3: .../variablefx/_SafeCls_2108.as::resolveColorId()
    static resolveColorId(name: string): number
    {
        return VariableFxCatalog.idOf(VariableFxCatalog.COLORS, name, -1);
    }

    /** An unknown width falls back to `medium`, the same default every renderer's switch uses. */
    // AS3: .../variablefx/_SafeCls_2108.as::resolveWidthById()
    static resolveWidthById(id: number): string
    {
        return VariableFxCatalog.nameOf(VariableFxCatalog.WIDTHS, id) ?? VariableFxWidth.MEDIUM;
    }

    // AS3: .../variablefx/_SafeCls_2108.as::resolveWidthId()
    static resolveWidthId(name: string): number
    {
        return VariableFxCatalog.idOf(VariableFxCatalog.WIDTHS, name, -1);
    }

    /** Delegated, not duplicated: the renderer table belongs to the mapping the server ships. */
    // AS3: .../variablefx/_SafeCls_2108.as::resolveRendererById()
    static resolveRendererById(id: number): string | null
    {
        return resolveVariableFxRendererById(id);
    }

    // AS3: .../variablefx/_SafeCls_2108.as::resolveRendererId()
    static resolveRendererId(name: string | null): number
    {
        return resolveVariableFxRendererId(name);
    }

    // AS3: .../variablefx/_SafeCls_2108.as::resolveCategoryById()
    private static nameOf(table: ReadonlyArray<[number, string]>, id: number): string | null
    {
        for(const [entryId, name] of table)
        {
            if(entryId === id) return name;
        }

        return null;
    }

    // AS3: .../variablefx/_SafeCls_2108.as::resolveCategoryId()
    private static idOf(table: ReadonlyArray<[number, string]>, name: string, fallback: number): number
    {
        for(const [id, entryName] of table)
        {
            if(entryName === name) return id;
        }

        return fallback;
    }
}
