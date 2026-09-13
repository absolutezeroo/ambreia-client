import type {OrderedMap} from '@core/utils/OrderedMap';
import {VariableFxPaintColor} from './VariableFxPaintColor';

/**
 * How many segments a segmented bar has: the config's `segments` extra when it carries a usable
 * one, and the renderer's own default for the configured size otherwise.
 *
 * The override is validated rather than trusted — non-numeric, non-finite and zero-or-negative all
 * fall back to the default, and the count is capped at 100. A bar is one bitmap per segment-ish, so
 * an unbounded count from the wire is a way to ask the client to composite forever.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxSegmentedProgress.as
 */
export class VariableFxSegmentedProgress
{
    // AS3: .../variablefx/VariableFxSegmentedProgress.as::MIN_SEGMENTS
    //   Name derived: the AS3 constant is `_SafeStr_11831`, value 0, and nothing reads it — the
    //   validation below uses a literal `<= 0`.
    static readonly MIN_SEGMENTS: number = 0;

    // AS3: .../variablefx/VariableFxSegmentedProgress.as::MAX_SEGMENTS
    static readonly MAX_SEGMENTS: number = 100;

    // AS3: .../variablefx/VariableFxSegmentedProgress.as::resolveSegmentOverride()
    static resolveSegmentOverride(extra: OrderedMap | null): number | null
    {
        const raw = VariableFxPaintColor.readExtra(extra, 'segments');

        if(raw === null || raw.length === 0) return null;

        const parsed = Number(raw);

        if(!Number.isFinite(parsed)) return null;

        const count = parsed | 0;

        if(count <= 0) return null;

        return Math.min(VariableFxSegmentedProgress.MAX_SEGMENTS, count);
    }

    // AS3: .../variablefx/VariableFxSegmentedProgress.as::resolveSegmentCount()
    static resolveSegmentCount(width: string, extra: OrderedMap | null, fallback: (width: string) => number): number
    {
        const override = VariableFxSegmentedProgress.resolveSegmentOverride(extra);

        return override === null ? fallback(width) | 0 : override;
    }
}
