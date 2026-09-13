import type {OrderedMap} from '@core/utils/OrderedMap';

/** A colour the renderers can paint with, once its name and any overrides have been resolved. */
export interface IVariableFxPaintColor
{
    typeName: string;
    rgb: number;
    isMetallic: boolean;
    /** Set only by DYNAMIC_RED_TO_GREEN: which of its three bands this is. */
    dynamicBandIndex?: number;
    /** Set by the dynamic colours that must not crossfade — see the class note. */
    snapTransition?: boolean;
}

/**
 * The named colour palette, and the three colours that are computed instead of looked up.
 *
 * A config carries a colour *name*, not a value. Most resolve to a fixed RGB; three do not:
 *
 *   DYNAMIC_RED_TO_GREEN  three bands chosen by the progress — red, amber, green
 *   DYNAMIC_LEVELLING     a hue swept 115°→360° across the levels, from the status's extra data
 *   DYNAMIC_TEAM_COLOR    whatever `delegated_color` the status carries
 *
 * The latter two set `snapTransition`, which stops `AnimatedPaintColor` crossfading them: a team
 * colour or a level hue is an identity, and fading between two identities is wrong rather than
 * smooth. Only RED_TO_GREEN animates, band by band.
 *
 * Class name derived: the AS3 class is obfuscated (`_SafeCls_3898`). Named for what its members
 * return — every one of its ~30 constants and all eight of its methods are readable.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_3898.as
 */
export class VariableFxPaintColor
{
    // AS3: .../variablefx/_SafeCls_3898.as::NOT_APPLICABLE
    static readonly NOT_APPLICABLE: string = 'NOT_APPLICABLE';
    static readonly DYNAMIC_DELEGATED: string = 'DYNAMIC_DELEGATED';
    static readonly DYNAMIC_RED_TO_GREEN: string = 'DYNAMIC_RED_TO_GREEN';
    static readonly DYNAMIC_LEVELLING: string = 'DYNAMIC_LEVELLING';
    static readonly DYNAMIC_TEAM_COLOR: string = 'DYNAMIC_TEAM_COLOR';

    // AS3: .../variablefx/_SafeCls_3898.as::DYNAMIC_LEVELLING_START_HUE
    private static readonly DYNAMIC_LEVELLING_START_HUE: number = 115;
    private static readonly DYNAMIC_LEVELLING_END_HUE: number = 360;
    private static readonly DYNAMIC_LEVELLING_SATURATION: number = 0.85;
    private static readonly DYNAMIC_LEVELLING_VALUE: number = 0.8;

    // AS3: .../variablefx/_SafeCls_3898.as::DYNAMIC_RED_TO_GREEN_BAND_RGBS
    private static readonly DYNAMIC_RED_TO_GREEN_BAND_RGBS: readonly number[] = [15672088, 16554256, 904478];

    /**
     * The palette. Decimal in the AS3 and kept decimal here on purpose — rewriting them as hex
     * would be a transcription of thirty numbers with nothing to check the result against.
     */
    // AS3: .../variablefx/_SafeCls_3898.as::resolve()
    private static readonly PALETTE: ReadonlyMap<string, {rgb: number; isMetallic: boolean}> = new Map([
        ['GREEN', {rgb: 3584586, isMetallic: false}],
        ['LIME_GREEN', {rgb: 9296949, isMetallic: false}],
        ['YELLOW', {rgb: 16767037, isMetallic: false}],
        ['ORANGE', {rgb: 16752420, isMetallic: false}],
        ['RED', {rgb: 14625054, isMetallic: false}],
        ['CYAN', {rgb: 4379880, isMetallic: false}],
        ['BLUE', {rgb: 3898851, isMetallic: false}],
        ['PURPLE', {rgb: 8868305, isMetallic: false}],
        ['PINK', {rgb: 16740275, isMetallic: false}],
        ['BROWN', {rgb: 9065274, isMetallic: false}],
        ['BEIGE', {rgb: 14074508, isMetallic: false}],
        ['TEAL', {rgb: 3127208, isMetallic: false}],
        ['INDIGO', {rgb: 5069783, isMetallic: false}],
        ['MAGENTA', {rgb: 14044097, isMetallic: false}],
        ['LIGHT_BLUE', {rgb: 8572927, isMetallic: false}],
        ['FIRE_ORANGE', {rgb: 16734751, isMetallic: false}],
        ['DARK_GREEN', {rgb: 2060090, isMetallic: false}],
        ['DARK_BLUE', {rgb: 2047375, isMetallic: false}],
        ['WHITE', {rgb: 14211288, isMetallic: false}],
        ['BRONZE', {rgb: 13467442, isMetallic: true}],
        ['SILVER', {rgb: 12632256, isMetallic: true}],
        ['GOLD', {rgb: 16762941, isMetallic: true}],
        ['DIAMOND', {rgb: 9366271, isMetallic: true}],
        ['EMERALD', {rgb: 2606187, isMetallic: true}],
        ['DYNAMIC_RED_TO_GREEN', {rgb: 14625054, isMetallic: false}],
        ['DYNAMIC_LEVELLING', {rgb: 3001374, isMetallic: false}],
        ['DYNAMIC_TEAM_COLOR', {rgb: 14211288, isMetallic: false}],
        ['DYNAMIC_DELEGATED', {rgb: 16777215, isMetallic: false}]
    ]);

    /** An unknown name resolves to opaque white under NOT_APPLICABLE, never to null. */
    // AS3: .../variablefx/_SafeCls_3898.as::resolve()
    static resolve(name: string): IVariableFxPaintColor
    {
        const entry = VariableFxPaintColor.PALETTE.get(name);

        if(entry === undefined)
        {
            return {typeName: VariableFxPaintColor.NOT_APPLICABLE, rgb: 16777215 & 0xFFFFFF, isMetallic: false};
        }

        return {typeName: name, rgb: entry.rgb & 0xFFFFFF, isMetallic: entry.isMetallic};
    }

    /**
     * The palette colour, with the config's own `color` extra overriding the RGB when it carries a
     * readable one.
     */
    // AS3: .../variablefx/_SafeCls_3898.as::resolvePaintColor()
    static resolvePaintColor(name: string, extra: OrderedMap | null = null): IVariableFxPaintColor
    {
        const base = VariableFxPaintColor.resolve(name);
        const override = VariableFxPaintColor.parseExtraColor(VariableFxPaintColor.readExtra(extra, 'color'));

        return {
            typeName: base.typeName,
            rgb: override === null ? base.rgb : override,
            // AS3 reads a `metallic` extra here and then discards it: its parseExtraBoolean() is a
            // stub that returns null unconditionally, so the palette's own flag always wins. Kept
            // as it behaves rather than as it reads — "guess what it meant" is how a port invents
            // behaviour the server never asked for.
            isMetallic: base.isMetallic
        };
    }

    /**
     * What the colour should be *right now*, for the dynamic ones. Falls through to
     * {@link resolvePaintColor} for everything static.
     */
    // AS3: .../variablefx/_SafeCls_3898.as::resolveTargetPaintColor()
    static resolveTargetPaintColor(
        name: string,
        extra: OrderedMap | null = null,
        progress: number = 0,
        statusExtra: OrderedMap | null = null
    ): IVariableFxPaintColor
    {
        const base = VariableFxPaintColor.resolve(name);

        if(base.typeName === VariableFxPaintColor.DYNAMIC_RED_TO_GREEN)
        {
            const band = VariableFxPaintColor.resolveDynamicRedToGreenBand(progress);

            return {typeName: base.typeName, rgb: band.rgb, isMetallic: false, dynamicBandIndex: band.index};
        }

        if(base.typeName === VariableFxPaintColor.DYNAMIC_LEVELLING)
        {
            return {
                typeName: base.typeName,
                rgb: VariableFxPaintColor.resolveDynamicLevellingRgb(statusExtra),
                isMetallic: false,
                snapTransition: true
            };
        }

        if(base.typeName === VariableFxPaintColor.DYNAMIC_DELEGATED
            || base.typeName === VariableFxPaintColor.DYNAMIC_TEAM_COLOR)
        {
            const delegated = VariableFxPaintColor.parseExtraColor(
                VariableFxPaintColor.readExtra(statusExtra, 'delegated_color')
            );

            return {
                typeName: base.typeName,
                rgb: delegated === null ? base.rgb : delegated,
                isMetallic: false,
                snapTransition: true
            };
        }

        return VariableFxPaintColor.resolvePaintColor(name, extra);
    }

    // AS3: .../variablefx/_SafeCls_3898.as::resolveDynamicPaintBandRgb()
    static resolveDynamicPaintBandRgb(name: string, bandIndex: number): number | null
    {
        if(VariableFxPaintColor.resolve(name).typeName !== VariableFxPaintColor.DYNAMIC_RED_TO_GREEN) return null;

        return VariableFxPaintColor.DYNAMIC_RED_TO_GREEN_BAND_RGBS[Math.max(0, Math.min(2, bandIndex))] ?? null;
    }

    // AS3: .../variablefx/_SafeCls_3898.as::isDynamicPaintColor()
    static isDynamicPaintColor(name: string): boolean
    {
        return VariableFxPaintColor.resolve(name).typeName.indexOf('DYNAMIC_') === 0;
    }

    // AS3: .../variablefx/_SafeCls_3898.as::parseRgbColor()
    static parseRgbColor(value: string | null): number | null
    {
        return VariableFxPaintColor.parseExtraColor(value);
    }

    /** Thirds of the progress, not a gradient — the bar changes colour in three steps. */
    // AS3: .../variablefx/_SafeCls_3898.as::resolveDynamicRedToGreenBand()
    private static resolveDynamicRedToGreenBand(progress: number): {index: number; rgb: number}
    {
        const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;

        if(clamped < 1 / 3) return {index: 0, rgb: VariableFxPaintColor.DYNAMIC_RED_TO_GREEN_BAND_RGBS[0]!};

        if(clamped < 2 / 3) return {index: 1, rgb: VariableFxPaintColor.DYNAMIC_RED_TO_GREEN_BAND_RGBS[1]!};

        return {index: 2, rgb: VariableFxPaintColor.DYNAMIC_RED_TO_GREEN_BAND_RGBS[2]!};
    }

    /**
     * A hue swept from green to red across the levels — first level green, last level red, and a
     * maxed track pinned to the end hue.
     */
    // AS3: .../variablefx/_SafeCls_3898.as::resolveDynamicLevellingRgb()
    private static resolveDynamicLevellingRgb(statusExtra: OrderedMap | null): number
    {
        const maxLevelValue = VariableFxPaintColor.parseExtraNumber(
            VariableFxPaintColor.readExtra(statusExtra, 'max_level')
        );
        const maxLevel = maxLevelValue === null ? 0 : (maxLevelValue | 0);

        // AS3 writes `readExtra(...).toLowerCase()` unguarded, and readExtra returns null when the
        // key is absent — which in AS3 is a #1009 on every call with no `is_maxed` extra, i.e. on
        // every DYNAMIC_LEVELLING status that does not carry one. Guarded here: an absent flag
        // reads as false. Kept as a guard rather than a faithful crash because the AS3's own
        // behaviour is to take the whole room's render down with it.
        const isMaxed = (VariableFxPaintColor.readExtra(statusExtra, 'is_maxed') ?? '').toLowerCase() === 'true';

        if(maxLevel <= 1)
        {
            return VariableFxPaintColor.rgbFromHsv(
                isMaxed ? VariableFxPaintColor.DYNAMIC_LEVELLING_END_HUE : VariableFxPaintColor.DYNAMIC_LEVELLING_START_HUE,
                VariableFxPaintColor.DYNAMIC_LEVELLING_SATURATION,
                VariableFxPaintColor.DYNAMIC_LEVELLING_VALUE
            );
        }

        const currentLevelValue = VariableFxPaintColor.parseExtraNumber(
            VariableFxPaintColor.readExtra(statusExtra, 'current_level')
        );
        const currentLevel = currentLevelValue === null ? 0 : (currentLevelValue | 0);
        const progress = Math.max(0, Math.min(1, (currentLevel - 1) / (maxLevel - 1)));

        const hue = VariableFxPaintColor.DYNAMIC_LEVELLING_START_HUE
            + (VariableFxPaintColor.DYNAMIC_LEVELLING_END_HUE - VariableFxPaintColor.DYNAMIC_LEVELLING_START_HUE) * progress;

        return VariableFxPaintColor.rgbFromHsv(
            hue,
            VariableFxPaintColor.DYNAMIC_LEVELLING_SATURATION,
            VariableFxPaintColor.DYNAMIC_LEVELLING_VALUE
        );
    }

    // AS3: .../variablefx/_SafeCls_3898.as::rgbFromHsv()
    private static rgbFromHsv(hue: number, saturation: number, value: number): number
    {
        const normalized = ((hue % 360) + 360) % 360;
        const chroma = value * saturation;
        const section = normalized / 60;
        const secondary = chroma * (1 - Math.abs((section % 2) - 1));
        const floor = value - chroma;
        const channels = VariableFxPaintColor.resolveRgbFromHueSection(section, chroma, secondary);

        return (
            (Math.floor((channels[0]! + floor) * 255) << 16)
            | (Math.floor((channels[1]! + floor) * 255) << 8)
            | Math.floor((channels[2]! + floor) * 255)
        ) >>> 0;
    }

    // AS3: .../variablefx/_SafeCls_3898.as::resolveRgbFromHueSection()
    private static resolveRgbFromHueSection(section: number, chroma: number, secondary: number): number[]
    {
        if(section < 1) return [chroma, secondary, 0];

        if(section < 2) return [secondary, chroma, 0];

        if(section < 3) return [0, chroma, secondary];

        if(section < 4) return [0, secondary, chroma];

        if(section < 5) return [secondary, 0, chroma];

        return [chroma, 0, secondary];
    }

    // AS3: .../variablefx/_SafeCls_3898.as::parseExtraNumber()
    private static parseExtraNumber(value: string | null): number | null
    {
        if(value === null) return null;

        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : null;
    }

    /** Six hex digits, with an optional `#` or `0x` — anything else is not a colour. */
    // AS3: .../variablefx/_SafeCls_3898.as::parseExtraColor()
    private static parseExtraColor(value: string | null): number | null
    {
        if(value === null) return null;

        const trimmed = value.trim().replace(/^#/, '').replace(/^0x/i, '');

        if(!/^[0-9a-f]{6}$/i.test(trimmed)) return null;

        return parseInt(trimmed, 16) & 0xFFFFFF;
    }

    // AS3: .../variablefx/_SafeCls_3898.as::readExtra()
    static readExtra(extra: OrderedMap | null, key: string): string | null
    {
        if(extra === null) return null;

        const value = extra.getValue(key);

        if(value === null || value === undefined) return null;

        return String(value).trim();
    }
}
