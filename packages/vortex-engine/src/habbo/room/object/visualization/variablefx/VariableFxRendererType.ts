/**
 * The renderer vocabulary: a name and a numeric id per renderer, and the translation between them.
 *
 * The server sends the id; `variablefx_renderer_mapping` maps that id to a class name, and this
 * table is what validates the pair — the mapping parser drops any row whose `name` does not match
 * `resolveById(id)`, so a mapping the client does not understand is ignored rather than trusted.
 *
 * The ids are not contiguous: they are grouped by family (0-4 bars, 10-13 health points, 20-21
 * levelling, 100-101 boss/numeric, 200-201 number displays), which is why they are spelled out.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafeCls_3090`). Three of its id constants are
 * obfuscated too, and all three are RECOVERED rather than derived — `resolveId()` maps the readable
 * name to the same number a line away.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_3090.as
 */
export const VariableFxRendererType = {
    // AS3: .../variablefx/_SafeCls_3090.as::CLASSIC_PROGRESS
    CLASSIC_PROGRESS: 'classic_progress',
    CLASSIC_MINI_PROGRESS: 'classic_mini_progress',
    BLOCK_PROGRESS: 'block_progress',
    STRIPED_PROGRESS: 'striped_progress',
    ARROW_PROGRESS: 'arrow_progress',
    HEALTH_PROGRESS: 'health_progress',
    MASKED_HEART_FILL: 'masked_heart_fill',
    STACKED_HEALTH_POINTS: 'stacked_health_points',
    THERMOMETER_HEALTH_POINTS: 'thermometer_health_points',
    LEVEL_WITH_PROGRESS: 'level_with_progress',
    LEVEL_WITH_BAR_AND_NUMERICAL_PROGRESS: 'level_with_bar_and_numerical_progress',
    BOSS_HEALTH_BAR: 'boss_health_bar',
    NUMERICAL_PROGRESS: 'numerical_progress',
    NUMBER_RECOLORABLE: 'number_recolorable',
    NUMBER_BAKED_COLORS: 'number_baked_colors'
} as const;

/**
 * Name to id. The AS3 spells both directions out as switches rather than deriving one from the
 * other; one table here says the same thing once, and `resolveId`/`resolveById` read it both ways.
 */
// AS3: .../variablefx/_SafeCls_3090.as::CLASSIC_PROGRESS_ID
//   HEALTH_PROGRESS_ID (10), LEVEL_WITH_PROGRESS_ID (20) and
//   LEVEL_WITH_BAR_AND_NUMERICAL_PROGRESS_ID (21) are `_SafeStr_11746`, `_SafeStr_11836` and
//   `_SafeStr_11801` in the AS3; their names are recovered from `resolveId()`, which returns those
//   same numbers for the readable name strings above.
const IDS_BY_NAME = new Map<string, number>([
    [VariableFxRendererType.CLASSIC_PROGRESS, 0],
    [VariableFxRendererType.CLASSIC_MINI_PROGRESS, 1],
    [VariableFxRendererType.BLOCK_PROGRESS, 2],
    [VariableFxRendererType.STRIPED_PROGRESS, 3],
    [VariableFxRendererType.ARROW_PROGRESS, 4],
    [VariableFxRendererType.HEALTH_PROGRESS, 10],
    [VariableFxRendererType.MASKED_HEART_FILL, 11],
    [VariableFxRendererType.STACKED_HEALTH_POINTS, 12],
    [VariableFxRendererType.THERMOMETER_HEALTH_POINTS, 13],
    [VariableFxRendererType.LEVEL_WITH_PROGRESS, 20],
    [VariableFxRendererType.LEVEL_WITH_BAR_AND_NUMERICAL_PROGRESS, 21],
    [VariableFxRendererType.BOSS_HEALTH_BAR, 100],
    [VariableFxRendererType.NUMERICAL_PROGRESS, 101],
    [VariableFxRendererType.NUMBER_RECOLORABLE, 200],
    [VariableFxRendererType.NUMBER_BAKED_COLORS, 201]
]);

const NAMES_BY_ID = new Map<number, string>([...IDS_BY_NAME].map(([name, id]) => [id, name]));

// AS3: .../variablefx/_SafeCls_3090.as::resolveId()
//   Returns -1 for an unknown name, as the AS3's default branch does.
export function resolveVariableFxRendererId(name: string | null): number
{
    if(name === null) return -1;

    return IDS_BY_NAME.get(name) ?? -1;
}

// AS3: .../variablefx/_SafeCls_3090.as::resolveById()
export function resolveVariableFxRendererById(id: number): string | null
{
    return NAMES_BY_ID.get(id) ?? null;
}
