/**
 * An RGB colour that crossfades to a new one over a fixed duration.
 *
 * Linear per channel and duration-based, unlike {@link AnimatedScalar}'s physics — a colour has no
 * momentum to carry, so a bar recolouring mid-transition simply restarts from wherever it had got
 * to (`setTarget` takes the current value as the new origin).
 *
 * Alpha is dropped: `normalizeColor` masks to 0xFFFFFF, so a caller passing an ARGB gets its RGB
 * animated and its alpha silently ignored — which is what every caller wants, since opacity here
 * is the composer's business.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/animation/AnimatedColor.as
 */
export class AnimatedColor
{
    // AS3: .../variablefx/animation/AnimatedColor.as::_durationMs
    private _durationMs: number;

    // AS3: .../variablefx/animation/AnimatedColor.as::_from (name derived)
    private _from: number = 0;

    // AS3: .../variablefx/animation/AnimatedColor.as::_startedAtMs (name derived)
    private _startedAtMs: number = 0;

    // AS3: .../variablefx/animation/AnimatedColor.as::_target (name derived)
    private _target: number = 0;

    // AS3: .../variablefx/animation/AnimatedColor.as::_value
    private _value: number = 0;

    // AS3: .../variablefx/animation/AnimatedColor.as::AnimatedColor()
    constructor(durationMs: number)
    {
        this._durationMs = Math.max(0, durationMs);
    }

    // AS3: .../variablefx/animation/AnimatedColor.as::get value()
    get value(): number
    {
        return this._value;
    }

    // AS3: .../variablefx/animation/AnimatedColor.as::snapTo()
    snapTo(color: number, timeMs: number): void
    {
        const normalized = AnimatedColor.normalizeColor(color);

        this._from = normalized;
        this._startedAtMs = timeMs;
        this._target = normalized;
        this._value = normalized;
    }

    /**
     * Catches up first, then starts the new fade from where the old one had reached — not from the
     * old target, which would jump.
     */
    // AS3: .../variablefx/animation/AnimatedColor.as::setTarget()
    setTarget(color: number, timeMs: number): void
    {
        this.update(timeMs);

        this._from = this._value;
        this._startedAtMs = timeMs;
        this._target = AnimatedColor.normalizeColor(color);
    }

    // AS3: .../variablefx/animation/AnimatedColor.as::needsUpdate()
    needsUpdate(_timeMs: number): boolean
    {
        return this._value !== this._target;
    }

    // AS3: .../variablefx/animation/AnimatedColor.as::update()
    update(timeMs: number): boolean
    {
        const before = this._value;

        if(this._durationMs === 0 || timeMs >= this._startedAtMs + this._durationMs)
        {
            this._value = this._target;

            return before !== this._value;
        }

        const progress = Math.max(0, (timeMs - this._startedAtMs) / this._durationMs);

        this._value = AnimatedColor.fromRgb(
            AnimatedColor.interpolateChannel((this._from >> 16) & 0xFF, (this._target >> 16) & 0xFF, progress),
            AnimatedColor.interpolateChannel((this._from >> 8) & 0xFF, (this._target >> 8) & 0xFF, progress),
            AnimatedColor.interpolateChannel(this._from & 0xFF, this._target & 0xFF, progress)
        );

        return before !== this._value;
    }

    // AS3: .../variablefx/animation/AnimatedColor.as::fromRgb()
    private static fromRgb(r: number, g: number, b: number): number
    {
        return ((r << 16) | (g << 8) | b) >>> 0;
    }

    // AS3: .../variablefx/animation/AnimatedColor.as::interpolateChannel()
    private static interpolateChannel(from: number, to: number, progress: number): number
    {
        return Math.round(from + (to - from) * progress);
    }

    // AS3: .../variablefx/animation/AnimatedColor.as::normalizeColor()
    private static normalizeColor(color: number): number
    {
        return color & 0xFFFFFF;
    }
}
