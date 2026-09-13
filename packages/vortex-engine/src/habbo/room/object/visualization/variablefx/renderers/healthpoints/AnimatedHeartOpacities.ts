/**
 * The opacity of every heart in a stack, animated as a CASCADE rather than all at once.
 *
 * `AnimatedScalar` and `AnimatedColor` move one value; this moves an array, and the interesting part
 * is that the hearts do not move together. Each changed heart gets its own fade window, and the
 * windows are staggered across the whole animation so the stack fills or empties one heart after
 * another — left to right when it grows, right to left when it shrinks, which is the direction the
 * sort at the end of `setTarget()` picks.
 *
 * The total duration is deliberately sub-linear: one heart takes exactly
 * `SINGLE_HEART_ANIMATION_MS`, and any number of them asymptotes to `MAX_ANIMATION_DURATION_MS`
 * instead of adding up. Losing twenty hearts at once therefore reads as a fast sweep, not a
 * twenty-times-longer one.
 *
 * Named for what it does: the AS3 class is `_SafeCls_4196` and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/healthpoints/_SafeCls_4196.as
 */
export class AnimatedHeartOpacities
{
    /** Below this an opacity is "gone" and two of them are "equal". */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::EPSILON (name derived)
    //   The AS3 constant is `_SafeStr_10920`, value 0.0001; it is the tolerance in all four of the
    //   comparisons below.
    private static readonly EPSILON: number = 0.0001;

    /** What one heart's change costs — and, by the curve below, exactly what it costs alone. */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::SINGLE_HEART_ANIMATION_MS
    private static readonly SINGLE_HEART_ANIMATION_MS: number = 200;

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::MIN_HEART_FADE_DURATION_MS
    private static readonly MIN_HEART_FADE_DURATION_MS: number = 100;

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::MAX_ANIMATION_DURATION_MS
    private static readonly MAX_ANIMATION_DURATION_MS: number = 1400;

    /** Which hearts are moving, in the order they start moving. */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_changedIndices
    private _changedIndices: number[] = [];

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_durationMs
    private _durationMs: number = 0;

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_fadeDurationMs (name derived)
    //   `_SafeStr_6616`: how long ONE heart takes to cross, as opposed to the whole cascade.
    private _fadeDurationMs: number = 0;

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_opacities
    private _opacities: number[] = [];

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_staggerMs (name derived)
    //   `_SafeStr_6957`: the delay between one heart starting and the next.
    private _staggerMs: number = 0;

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_startOpacities
    private _startOpacities: number[] = [];

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_startTimeMs (name derived)
    //   `_SafeStr_7244`: the timestamp the current animation was set at.
    private _startTimeMs: number = 0;

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_targetCount (name derived)
    //   `_SafeStr_4869`: how many hearts the animation is heading for.
    private _targetCount: number = 0;

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::_targetOpacities
    private _targetOpacities: number[] = [];

    /** One past the last heart with anything left to show — what the renderer actually draws. */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::get visibleHeartCount()
    get visibleHeartCount(): number
    {
        let count = 0;

        for(let index = 0; index < this._opacities.length; index++)
        {
            if(this._opacities[index] > AnimatedHeartOpacities.EPSILON) count = Math.max(count, index + 1);
        }

        return count;
    }

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::getOpacity()
    getOpacity(index: number): number
    {
        return index >= 0 && index < this._opacities.length ? this._opacities[index] : 0;
    }

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::snapTo()
    snapTo(count: number, time: number): void
    {
        this._durationMs = 0;
        this._fadeDurationMs = 0;
        this._staggerMs = 0;
        this._startTimeMs = time;
        this._targetCount = count;
        this._opacities = AnimatedHeartOpacities.filledArray(count, 1);
        this._startOpacities = this._opacities.slice();
        this._targetOpacities = this._opacities.slice();
        this._changedIndices = [];
    }

    /**
     * Plans the cascade: which hearts move, in what order, and over how long.
     *
     * The order is the point. Growing, the hearts light up left to right; shrinking, they go out
     * right to left — so the animation always runs from the middle of the stack outwards in the
     * direction the value moved, never back over hearts that are staying put.
     */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::setTarget()
    setTarget(count: number, time: number): void
    {
        // Land the animation in flight first: the new one starts from where the hearts are now,
        // not from where the last one began.
        this.update(time);

        const length = Math.max(this._opacities.length, count);
        const currentWeight = this.calculateCurrentWeight(length);
        const growing = count >= currentWeight;

        this._startTimeMs = time;
        this._targetCount = count;
        this._startOpacities = new Array(length);
        this._targetOpacities = new Array(length);
        this._changedIndices = [];

        let weight = 0;

        for(let index = 0; index < length; index++)
        {
            const from = index < this._opacities.length ? this._opacities[index] : 0;
            const to = index < count ? 1 : 0;
            const distance = Math.abs(to - from);

            this._startOpacities[index] = from;
            this._targetOpacities[index] = to;
            weight += distance;

            if(distance > AnimatedHeartOpacities.EPSILON) this._changedIndices.push(index);
        }

        this._changedIndices.sort(
            growing ? AnimatedHeartOpacities.ascendingNumeric : AnimatedHeartOpacities.descendingNumeric
        );

        this._durationMs = AnimatedHeartOpacities.resolveDuration(weight);

        if(this._durationMs <= 0 || this._changedIndices.length === 0)
        {
            this.settle();

            return;
        }

        this._fadeDurationMs = this.resolveFadeDuration(weight);
        this._staggerMs = this._changedIndices.length > 1
            ? (this._durationMs - this._fadeDurationMs) / (this._changedIndices.length - 1)
            : 0;
    }

    /**
     * AS3 takes a time and a scale here and reads NEITHER — the signature is the one every animated
     * value in this feature shares, and this implementation only asks whether anything is moving.
     */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::needsUpdate()
    needsUpdate(_time: number, _scale: number): boolean
    {
        return this._changedIndices.length > 0;
    }

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::update()
    update(time: number): boolean
    {
        if(this._durationMs <= 0 || this._changedIndices.length === 0) return false;

        const elapsed = Math.max(0, time - this._startTimeMs);

        if(elapsed >= this._durationMs) return this.settle();

        let changed = false;

        for(let index = 0; index < this._targetOpacities.length; index++)
        {
            const next = this.resolveNextOpacity(index, elapsed);

            // Compared against the raw slot, which is `undefined` past the end of `_opacities` when
            // the stack has just grown — that inequality is what extends the array.
            if(next !== this._opacities[index])
            {
                this._opacities[index] = next;
                changed = true;
            }
        }

        this.trimTrailingInvisibleHearts();

        return changed;
    }

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::filledArray()
    private static filledArray(length: number, value: number): number[]
    {
        const out = new Array<number>(Math.max(0, length));

        for(let index = 0; index < out.length; index++) out[index] = value;

        return out;
    }

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::ascendingNumeric()
    private static ascendingNumeric(a: number, b: number): number
    {
        return a - b;
    }

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::descendingNumeric()
    private static descendingNumeric(a: number, b: number): number
    {
        return b - a;
    }

    /**
     * One heart costs `SINGLE_HEART_ANIMATION_MS` exactly, and any number of them approaches
     * `MAX_ANIMATION_DURATION_MS` without reaching it.
     *
     * Substituting a weight of 1 into the curve gives 1400 × (1 − 1200/1400) = 200 — the constant,
     * so the two are not independent numbers but the same one read twice.
     */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::resolveDuration()
    private static resolveDuration(weight: number): number
    {
        if(weight <= AnimatedHeartOpacities.EPSILON) return 0;

        const decay = (AnimatedHeartOpacities.MAX_ANIMATION_DURATION_MS - AnimatedHeartOpacities.SINGLE_HEART_ANIMATION_MS)
            / AnimatedHeartOpacities.MAX_ANIMATION_DURATION_MS;

        return AnimatedHeartOpacities.MAX_ANIMATION_DURATION_MS * (1 - Math.pow(decay, weight));
    }

    /**
     * How long one heart's own fade lasts: half again its share of the total, floored at
     * `MIN_HEART_FADE_DURATION_MS`.
     *
     * Being longer than the share is what makes the windows OVERLAP — without it each heart would
     * wait for the previous one to finish and the cascade would read as a queue.
     */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::resolveFadeDuration()
    private resolveFadeDuration(weight: number): number
    {
        const share = this._durationMs / weight;
        const fade = Math.max(AnimatedHeartOpacities.MIN_HEART_FADE_DURATION_MS, Math.round(share * 1.5));

        return Math.min(this._durationMs, fade);
    }

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::settle()
    private settle(): boolean
    {
        const settled = AnimatedHeartOpacities.filledArray(this._targetCount, 1);
        const changed = this._durationMs !== 0 || !AnimatedHeartOpacities.opacitiesEqual(this._opacities, settled);

        this._opacities = settled;
        this._startOpacities = settled.slice();
        this._targetOpacities = settled.slice();
        this._changedIndices = [];
        this._durationMs = 0;
        this._fadeDurationMs = 0;
        this._staggerMs = 0;

        return changed;
    }

    /** How many hearts are on screen right now, counted as a fraction — mid-fade ones count partly. */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::calculateCurrentWeight()
    private calculateCurrentWeight(length: number): number
    {
        let weight = 0;

        for(let index = 0; index < length; index++)
        {
            weight += index < this._opacities.length ? this._opacities[index] : 0;
        }

        return weight;
    }

    /** A heart not in the cascade is simply already at its target. */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::resolveNextOpacity()
    private resolveNextOpacity(index: number, elapsed: number): number
    {
        const order = this._changedIndices.indexOf(index);

        if(order === -1)
        {
            return index < this._targetOpacities.length ? this._targetOpacities[index] : 0;
        }

        const own = elapsed - order * this._staggerMs;
        const t = Math.max(0, Math.min(1, own / this._fadeDurationMs));
        const from = index < this._startOpacities.length ? this._startOpacities[index] : 0;
        const to = index < this._targetOpacities.length ? this._targetOpacities[index] : 0;

        return from + (to - from) * t;
    }

    /** Faded-out hearts past the target are dropped, so the stack shrinks once they are gone. */
    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::trimTrailingInvisibleHearts()
    private trimTrailingInvisibleHearts(): void
    {
        while(this._opacities.length > this._targetCount
            && this._opacities[this._opacities.length - 1] <= AnimatedHeartOpacities.EPSILON)
        {
            this._opacities.pop();
        }
    }

    // AS3: .../renderers/healthpoints/_SafeCls_4196.as::opacitiesEqual()
    private static opacitiesEqual(a: number[], b: number[]): boolean
    {
        if(a.length !== b.length) return false;

        for(let index = 0; index < a.length; index++)
        {
            if(Math.abs(a[index] - b[index]) > AnimatedHeartOpacities.EPSILON) return false;
        }

        return true;
    }
}
