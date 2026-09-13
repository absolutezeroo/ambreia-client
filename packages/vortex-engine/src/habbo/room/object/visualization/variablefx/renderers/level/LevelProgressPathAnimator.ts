import {AnimatedScalar} from '../../animation/AnimatedScalar';
import {LevelProgressPathSample} from './LevelProgressPathSample';

/** A level and a progress, decomposed back out of an animated path. */
export interface ILevelProgressPathDisplay
{
    level: number;
    progress: number;
}

/**
 * Animates a level and its progress as ONE number — the "path", which is `level + progress`.
 *
 * That is the whole idea. Animating the two separately would make a level-up a discontinuity: the
 * progress bar would have to run to 1, jump to 0, and the badge would flip at some moment in
 * between. As a single scalar, 7.98 → 8.03 is a continuous motion and the level falling out of it
 * changes exactly when the path crosses the integer.
 *
 * A maxed level is the exception and is folded into the path itself: at max, progress 1 collapses
 * to the level rather than adding to it, so a finished bar does not read as the start of a level
 * that does not exist.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelProgressPathAnimator.as
 */
export class LevelProgressPathAnimator
{
    /** Tight enough that a path landing on an integer reads as that level, not as 0.9999 of it. */
    // AS3: .../renderers/level/LevelProgressPathAnimator.as::PATH_EPSILON (name derived)
    //   The AS3 constant is `_SafeStr_11513`, value 1e-6.
    private static readonly PATH_EPSILON: number = 0.000001;

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::_path
    private _path: AnimatedScalar;

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::_target (name derived)
    //   `_SafeStr_4869`: the sample the path is heading for.
    private _target: LevelProgressPathSample = new LevelProgressPathSample(0, 0, false, null);

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::LevelProgressPathAnimator()
    constructor()
    {
        this._path = new AnimatedScalar(0.000008, 0.02, 0.0001, 0.000006);
    }

    /**
     * A maxed variable sitting at its ceiling reports progress 1 whatever the raw fraction says.
     *
     * Without this a max-level bar would show whatever the last partial level worked out to, which
     * is nonsense once there is no next level to fill.
     */
    // AS3: .../renderers/level/LevelProgressPathAnimator.as::resolveLevelProgressSampleProgress()
    static resolveLevelProgressSampleProgress(
        progress: number,
        value: number,
        minValue: number,
        maxValue: number,
        isMaxed: boolean
    ): number
    {
        if(isMaxed
            && Number.isFinite(value) && Number.isFinite(minValue) && Number.isFinite(maxValue)
            && minValue === maxValue && value >= maxValue)
        {
            return 1;
        }

        return progress;
    }

    /**
     * Splits an animated path back into a level and a progress.
     *
     * The first branch is what keeps a settled bar exact: once the path has reached the target's
     * own path, the target's level and progress are returned verbatim rather than re-derived, so a
     * maxed sample still reads as progress 1 instead of collapsing to 0 of the next level. The two
     * epsilon branches do the same job mid-flight at each end of a level.
     */
    // AS3: .../renderers/level/LevelProgressPathAnimator.as::resolveLevelProgressPathDisplay()
    static resolveLevelProgressPathDisplay(path: number, target: LevelProgressPathSample): ILevelProgressPathDisplay
    {
        const sample = LevelProgressPathSample.normalize(target);
        const targetPath = LevelProgressPathAnimator.resolveLevelProgressPath(sample);

        if(Math.abs(path - targetPath) <= LevelProgressPathAnimator.PATH_EPSILON)
        {
            return {level: sample.level, progress: sample.progress};
        }

        const clamped = Number.isFinite(path) ? Math.max(0, path) : 0;
        const level = Math.floor(clamped);
        const fraction = clamped - level;

        if(fraction <= LevelProgressPathAnimator.PATH_EPSILON) return {level, progress: 0};

        if(1 - fraction <= LevelProgressPathAnimator.PATH_EPSILON) return {level: level + 1, progress: 0};

        return {level, progress: fraction};
    }

    /** `level + progress`, except at max, where a full bar is the level itself. */
    // AS3: .../renderers/level/LevelProgressPathAnimator.as::resolveLevelProgressPath()
    static resolveLevelProgressPath(target: LevelProgressPathSample): number
    {
        const sample = LevelProgressPathSample.normalize(target);

        if(sample.isMaxed && sample.progress >= 1) return sample.level;

        return sample.level + sample.progress;
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::get displayedLevel()
    get displayedLevel(): number
    {
        return this.displayed.level;
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::get displayedProgress()
    get displayedProgress(): number
    {
        return this.displayed.progress;
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::get displayedPath()
    get displayedPath(): number
    {
        return this._path.value;
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::get target()
    get target(): LevelProgressPathSample
    {
        return this._target;
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::snapTo()
    snapTo(sample: LevelProgressPathSample, time: number): void
    {
        this._target = LevelProgressPathSample.normalize(sample);

        this._path.snapTo(LevelProgressPathAnimator.resolveLevelProgressPath(this._target), time);
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::setTarget()
    setTarget(sample: LevelProgressPathSample, time: number): void
    {
        this._target = LevelProgressPathSample.normalize(sample);

        this._path.setTarget(LevelProgressPathAnimator.resolveLevelProgressPath(this._target), time);
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::needsUpdate()
    needsUpdate(time: number, quantization: number): boolean
    {
        return this._path.needsUpdate(time, quantization);
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::update()
    update(time: number): boolean
    {
        return this._path.update(time);
    }

    // AS3: .../renderers/level/LevelProgressPathAnimator.as::get displayed()
    private get displayed(): ILevelProgressPathDisplay
    {
        return LevelProgressPathAnimator.resolveLevelProgressPathDisplay(this._path.value, this._target);
    }
}
