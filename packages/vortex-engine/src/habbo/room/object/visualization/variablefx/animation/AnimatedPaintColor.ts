import type {OrderedMap} from '@core/utils/OrderedMap';
import {AnimatedColor} from './AnimatedColor';
import {VariableFxPaintColor} from '../VariableFxPaintColor';

/** What a paint colour is resolved from, each frame. */
export interface IVariableFxPaintColorSource
{
    color: string;
    extra: OrderedMap | null;
    progress: number;
    statusExtra: OrderedMap | null;
}

/**
 * A paint colour that follows its own configuration — including the dynamic ones, whose target
 * changes as the value does.
 *
 * Over {@link AnimatedColor} it adds two things. First, colours that must not crossfade snap
 * instead: a team colour or a level hue is an identity, and sliding between two identities is
 * wrong rather than smooth.
 *
 * Second, and the reason the class is not trivial: DYNAMIC_RED_TO_GREEN has three bands, and it
 * walks them ONE AT A TIME. A value jumping from the red band to the green one fades red → amber →
 * green rather than red → green, and a value that reverses mid-fade finishes the band it is in
 * before turning around. That is what the direction memory below is for.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/animation/AnimatedPaintColor.as
 */
export class AnimatedPaintColor
{
    // AS3: .../variablefx/animation/AnimatedPaintColor.as::_color
    private _color: AnimatedColor;

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::_bandIndex (name derived)
    private _bandIndex: number | null = null;

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::_targetRgb (name derived)
    private _targetRgb: number = -1;

    /** -1, 0 or 1: which way the band walk is currently going. */
    // AS3: .../variablefx/animation/AnimatedPaintColor.as::_bandDirection (name derived)
    private _bandDirection: number = 0;

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::AnimatedPaintColor()
    constructor(durationMs: number)
    {
        this._color = new AnimatedColor(durationMs);
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::sign()
    private static sign(value: number): number
    {
        if(value > 0) return 1;

        if(value < 0) return -1;

        return 0;
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::get value()
    get value(): number
    {
        return this._color.value;
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::get argb()
    get argb(): number
    {
        return (0xFF000000 | this._color.value) >>> 0;
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::snapTo()
    snapTo(source: IVariableFxPaintColorSource, timeMs: number): void
    {
        const resolved = AnimatedPaintColor.resolvePaintColor(source);
        const rgb = resolved.rgb & 0xFFFFFF;

        this._color.snapTo(rgb, timeMs);
        this._bandIndex = resolved.dynamicBandIndex ?? null;
        this._targetRgb = rgb;
        this._bandDirection = 0;
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::setTarget()
    setTarget(source: IVariableFxPaintColorSource, timeMs: number): void
    {
        this.syncTarget(source, timeMs);
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::needsUpdate()
    needsUpdate(timeMs: number): boolean
    {
        return this._color.needsUpdate(timeMs);
    }

    /**
     * Syncs, advances, then syncs again — the second pass is what lets a band that completed during
     * this very update immediately start walking toward the next one, instead of stalling for a
     * frame.
     */
    // AS3: .../variablefx/animation/AnimatedPaintColor.as::update()
    update(source: IVariableFxPaintColorSource, timeMs: number): boolean
    {
        const before = this.syncTarget(source, timeMs);
        const advanced = this._color.update(timeMs);
        const after = this.syncTarget(source, timeMs);

        return before || advanced || after;
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::syncTarget()
    private syncTarget(source: IVariableFxPaintColorSource, timeMs: number): boolean
    {
        const resolved = AnimatedPaintColor.resolvePaintColor(source);

        if(resolved.snapTransition === true) return this.snapColorTarget(resolved.rgb, null, timeMs);

        const wantedBand = resolved.dynamicBandIndex ?? null;

        if(wantedBand === null) return this.setColorTarget(resolved.rgb, null, timeMs);

        const nextBand = this.resolveNextDynamicBandIndex(wantedBand);
        const bandRgb = VariableFxPaintColor.resolveDynamicPaintBandRgb(source.color, nextBand);

        return this.setColorTarget(bandRgb === null ? resolved.rgb : bandRgb, nextBand, timeMs);
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::setColorTarget()
    private setColorTarget(rgb: number, bandIndex: number | null, timeMs: number): boolean
    {
        const normalized = rgb & 0xFFFFFF;

        if(this._targetRgb === normalized && this._bandIndex === bandIndex) return false;

        const previousBand = this._bandIndex;

        this._color.setTarget(normalized, timeMs);
        this._bandIndex = bandIndex;
        this._targetRgb = normalized;
        this._bandDirection = previousBand !== null && bandIndex !== null
            ? AnimatedPaintColor.sign(bandIndex - previousBand)
            : 0;

        return true;
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::snapColorTarget()
    private snapColorTarget(rgb: number, bandIndex: number | null, timeMs: number): boolean
    {
        const normalized = rgb & 0xFFFFFF;

        if(this._targetRgb === normalized && this._bandIndex === bandIndex && this._color.value === normalized)
        {
            return false;
        }

        this._color.snapTo(normalized, timeMs);
        this._bandIndex = bandIndex;
        this._targetRgb = normalized;
        this._bandDirection = 0;

        return true;
    }

    /**
     * The next band to head for — never more than one away from the current one.
     *
     * Mid-fade, it holds: continuing in the same direction keeps the band it is already fading
     * into, and a reversal takes the newly requested band directly rather than finishing the old
     * step. Only once a band is fully reached does it step toward the requested one.
     */
    // AS3: .../variablefx/animation/AnimatedPaintColor.as::resolveNextDynamicBandIndex()
    private resolveNextDynamicBandIndex(wanted: number): number
    {
        if(this._bandIndex === null) return wanted;

        if(wanted === this._bandIndex) return this._bandIndex;

        const direction = AnimatedPaintColor.sign(wanted - this._bandIndex);

        if(!this.isAtTarget() && direction === this._bandDirection) return this._bandIndex;

        if(!this.isAtTarget()) return wanted;

        return this._bandIndex + direction;
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::isAtTarget()
    private isAtTarget(): boolean
    {
        return this._color.value === this._targetRgb;
    }

    // AS3: .../variablefx/animation/AnimatedPaintColor.as::resolvePaintColor()
    private static resolvePaintColor(source: IVariableFxPaintColorSource)
    {
        return VariableFxPaintColor.resolveTargetPaintColor(
            source.color,
            source.extra,
            source.progress,
            source.statusExtra
        );
    }
}
