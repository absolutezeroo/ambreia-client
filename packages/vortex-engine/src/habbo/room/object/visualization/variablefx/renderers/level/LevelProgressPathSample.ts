/**
 * A level and how far through it the value is, with every field already sanitised.
 *
 * Everything that builds one of these builds it from wire data, so the constructor normalises
 * rather than trusting: a negative or non-finite level is 0, progress is clamped into 0..1, and a
 * max level that is missing or nonsense becomes null rather than NaN — which matters because
 * `maxLevel` is compared, not just displayed.
 *
 * `normalize()` re-runs the same constructor on an existing sample. That looks redundant and is
 * not: the class is passed around by reference and the renderers hand one in from outside, so
 * every consumer re-normalises rather than assuming the one it was given came from here.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/level/LevelProgressPathSample.as
 */
export class LevelProgressPathSample
{
    // AS3: .../renderers/level/LevelProgressPathSample.as::isMaxed
    isMaxed: boolean;

    // AS3: .../renderers/level/LevelProgressPathSample.as::level
    level: number;

    /** Null when the wire gave no usable maximum — not 0, which is a real level. */
    // AS3: .../renderers/level/LevelProgressPathSample.as::maxLevel
    maxLevel: number | null;

    // AS3: .../renderers/level/LevelProgressPathSample.as::progress
    progress: number;

    // AS3: .../renderers/level/LevelProgressPathSample.as::LevelProgressPathSample()
    constructor(level: number, progress: number, isMaxed: boolean, maxLevel: number | null)
    {
        this.level = LevelProgressPathSample.normalizeLevel(level);
        this.progress = LevelProgressPathSample.normalizeProgress(progress);
        this.isMaxed = isMaxed;
        this.maxLevel = LevelProgressPathSample.normalizeMaxLevel(maxLevel);
    }

    // AS3: .../renderers/level/LevelProgressPathSample.as::normalize()
    static normalize(sample: LevelProgressPathSample): LevelProgressPathSample
    {
        return new LevelProgressPathSample(sample.level, sample.progress, sample.isMaxed, sample.maxLevel);
    }

    // AS3: .../renderers/level/LevelProgressPathSample.as::normalizeLevel()
    private static normalizeLevel(level: number): number
    {
        if(!Number.isFinite(level) || level < 0) return 0;

        return Math.trunc(level);
    }

    // AS3: .../renderers/level/LevelProgressPathSample.as::normalizeProgress()
    private static normalizeProgress(progress: number): number
    {
        if(!Number.isFinite(progress)) return 0;

        return Math.max(0, Math.min(1, progress));
    }

    // AS3: .../renderers/level/LevelProgressPathSample.as::normalizeMaxLevel()
    private static normalizeMaxLevel(maxLevel: number | null): number | null
    {
        if(maxLevel === null || !Number.isFinite(maxLevel) || maxLevel < 0) return null;

        return Math.trunc(maxLevel);
    }
}
