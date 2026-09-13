import {LevelProgressPathAnimator} from './LevelProgressPathAnimator';
import type {LevelProgressPathSample} from './LevelProgressPathSample';

/** What the caption should read at some point along the animated path. */
export interface ILevelNumberDisplay
{
    currentText: string;
    maxText: string;
}

/** The caption's destination: the value, its ceiling, and the level sample that goes with them. */
export interface ILevelNumberTarget
{
    maxValue: number;
    pathSample: LevelProgressPathSample;
    value: number;
}

/**
 * The `123/456` caption, resolved for any point along the level animation.
 *
 * Two different problems, and the second is the interesting one.
 *
 * The CURRENT value simply interpolates from where it was to where it is going, in step with the
 * path — so a level-up counts up rather than jumping.
 *
 * The MAXIMUM cannot interpolate, because it is not a quantity being animated: each level has its
 * own ceiling and the ceilings of the levels in between are not known at all. So it shows the old
 * maximum until the path leaves the old level, the new one once the path enters the target level,
 * and `...` in between — which reads as "the target moved" rather than as a number sliding to a
 * value it never had. `resolveForwardMaxText` and `resolveBackwardMaxText` are that rule in each
 * direction.
 *
 * The `...` window is therefore only open when the move spans MORE THAN ONE boundary, since the two
 * other windows are adjacent for a single-level move. Measured, 7.8 → 10.25 with ceilings 100 and
 * 250: `100` up to 8.0, `...` from 8.2 to 9.9, `250` from 10.0 — where 7.8 → 8.25 goes straight
 * from `100` to `250` at the boundary, with no `...` at all. The backward case is symmetric.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelDetailsNumberProgress.as
 */
export class LevelDetailsNumberProgress
{
    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::ELLIPSIS (name derived)
    //   The AS3 constant is `_SafeStr_11480`, value "...".
    private static readonly ELLIPSIS: string = '...';

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::PATH_EPSILON
    private static readonly PATH_EPSILON: number = 0.0001;

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::_initialized (name derived)
    private _initialized: boolean = false;

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::_sourceMaxText (name derived)
    //   `_SafeStr_7576`: the maximum the caption showed when the current move started.
    private _sourceMaxText: string = '0';

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::_sourcePath
    private _sourcePath: number = 0;

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::_sourceValue (name derived)
    //   `_SafeStr_6829`: the value the caption showed when the current move started.
    private _sourceValue: number = 0;

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::_target (name derived)
    private _target: ILevelNumberTarget | null = null;

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::_targetMaxText (name derived)
    //   `_SafeStr_6587`: the maximum the caption will show when the move lands.
    private _targetMaxText: string = '0';

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::_targetPath
    private _targetPath: number = 0;

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::_targetValue (name derived)
    //   `_SafeStr_4872`: the value the caption will show when the move lands.
    private _targetValue: number = 0;

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::snapTo()
    snapTo(target: ILevelNumberTarget): void
    {
        this._target = LevelDetailsNumberProgress.normalizeTarget(target);
        this._targetPath = LevelProgressPathAnimator.resolveLevelProgressPath(this._target.pathSample);
        this._targetValue = LevelDetailsNumberProgress.normalizeNumber(this._target.value);
        this._targetMaxText = LevelDetailsNumberProgress.formatNumber(this._target.maxValue);
        this._sourcePath = this._targetPath;
        this._sourceValue = this._targetValue;
        this._sourceMaxText = this._targetMaxText;
        this._initialized = true;
    }

    /**
     * The new move starts from what the caption is showing RIGHT NOW, not from the last target —
     * which is what stops a value retargeted mid-animation from snapping backwards first.
     */
    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::setTarget()
    setTarget(target: ILevelNumberTarget, path: number): void
    {
        if(!this._initialized)
        {
            this.snapTo(target);

            return;
        }

        const display = this.resolveDisplay(path);

        this._sourcePath = LevelDetailsNumberProgress.normalizePath(path);
        this._sourceValue = LevelDetailsNumberProgress.normalizeNumber(Number(display.currentText));
        this._sourceMaxText = display.maxText;

        this._target = LevelDetailsNumberProgress.normalizeTarget(target);
        this._targetPath = LevelProgressPathAnimator.resolveLevelProgressPath(this._target.pathSample);
        this._targetValue = LevelDetailsNumberProgress.normalizeNumber(this._target.value);
        this._targetMaxText = LevelDetailsNumberProgress.formatNumber(this._target.maxValue);
    }

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::resolveDisplay()
    resolveDisplay(path: number): ILevelNumberDisplay
    {
        const normalized = LevelDetailsNumberProgress.normalizePath(path);

        return {
            currentText: LevelDetailsNumberProgress.formatNumber(this.resolveCurrentValue(normalized)),
            maxText: this.resolveMaxText(normalized)
        };
    }

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::isAtTarget()
    isAtTarget(path: number): boolean
    {
        return Math.abs(LevelDetailsNumberProgress.normalizePath(path) - this._targetPath)
            <= LevelDetailsNumberProgress.PATH_EPSILON;
    }

    /** Interpolated on the PATH's fraction, not on time — so it tracks the bar exactly. */
    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::resolveCurrentValue()
    private resolveCurrentValue(path: number): number
    {
        const span = this._targetPath - this._sourcePath;

        if(Math.abs(span) <= LevelDetailsNumberProgress.PATH_EPSILON) return this._targetValue;

        const t = Math.max(0, Math.min(1, (path - this._sourcePath) / span));

        if(t >= 1 - LevelDetailsNumberProgress.PATH_EPSILON) return this._targetValue;

        if(t <= LevelDetailsNumberProgress.PATH_EPSILON) return this._sourceValue;

        return Math.trunc(this._sourceValue + (this._targetValue - this._sourceValue) * t);
    }

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::resolveMaxText()
    private resolveMaxText(path: number): string
    {
        const span = this._targetPath - this._sourcePath;

        if(Math.abs(span) <= LevelDetailsNumberProgress.PATH_EPSILON) return this._targetMaxText;

        return span > 0 ? this.resolveForwardMaxText(path) : this.resolveBackwardMaxText(path);
    }

    /** Old maximum until the old level is left, new one once the target level is entered, `...` between. */
    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::resolveForwardMaxText()
    private resolveForwardMaxText(path: number): string
    {
        const leavingSource = Math.floor(this._sourcePath) + 1;
        const enteringTarget = this.resolveTargetSegmentStart();

        if(path < leavingSource - LevelDetailsNumberProgress.PATH_EPSILON) return this._sourceMaxText;

        if(path >= enteringTarget - LevelDetailsNumberProgress.PATH_EPSILON) return this._targetMaxText;

        return LevelDetailsNumberProgress.ELLIPSIS;
    }

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::resolveBackwardMaxText()
    private resolveBackwardMaxText(path: number): string
    {
        const leavingSource = Math.floor(this._sourcePath);
        const enteringTarget = Math.floor(this._targetPath) + 1;

        if(path >= leavingSource + LevelDetailsNumberProgress.PATH_EPSILON) return this._sourceMaxText;

        if(path <= enteringTarget + LevelDetailsNumberProgress.PATH_EPSILON) return this._targetMaxText;

        return LevelDetailsNumberProgress.ELLIPSIS;
    }

    /**
     * A target that sits exactly at a level boundary belongs to the level BELOW it — otherwise
     * landing on 8.0 would show level 8's maximum while the bar reads as a full level 7.
     */
    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::resolveTargetSegmentStart()
    private resolveTargetSegmentStart(): number
    {
        const sample = this._target === null ? null : this._target.pathSample;
        const progress = sample === null ? 0 : sample.progress;

        return progress <= LevelDetailsNumberProgress.PATH_EPSILON && this._targetPath > 0
            ? this._targetPath - 1
            : Math.floor(this._targetPath);
    }

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::normalizeTarget()
    private static normalizeTarget(target: ILevelNumberTarget): ILevelNumberTarget
    {
        return {
            maxValue: LevelDetailsNumberProgress.normalizeNumber(target.maxValue),
            pathSample: target.pathSample,
            value: LevelDetailsNumberProgress.normalizeNumber(target.value)
        };
    }

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::normalizePath()
    private static normalizePath(path: number): number
    {
        return Number.isFinite(path) ? Math.max(0, path) : 0;
    }

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::normalizeNumber()
    private static normalizeNumber(value: number): number
    {
        if(!Number.isFinite(value)) return 0;

        return Math.max(0, Math.trunc(value));
    }

    // AS3: .../renderers/level/LevelDetailsNumberProgress.as::formatNumber()
    private static formatNumber(value: number): string
    {
        return String(LevelDetailsNumberProgress.normalizeNumber(value));
    }
}
