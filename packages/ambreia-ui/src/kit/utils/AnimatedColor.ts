/**
 * Animates a 24-bit RGB color from its current value toward a target over
 * a fixed duration, using simple per-channel linear interpolation.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedColor.as
 */
export class AnimatedColor
{
    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedColor.as::_durationMs
    private readonly _durationMs: number;

    private _startColor: number = 0;
    private _startTimeMs: number = 0;
    private _targetColor: number = 0;
    private _value: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedColor.as::AnimatedColor()
    constructor(durationMs: number)
    {
        this._durationMs = Math.max(0, durationMs);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedColor.as::get value()
    public get value(): number
    {
        return this._value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedColor.as::snapTo()
    public snapTo(color: number, nowMs: number): void
    {
        const normalized = AnimatedColor.normalizeColor(color);

        this._startColor = normalized;
        this._startTimeMs = nowMs;
        this._targetColor = normalized;
        this._value = normalized;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedColor.as::setTarget()
    public setTarget(color: number, nowMs: number): void
    {
        const normalized = AnimatedColor.normalizeColor(color);

        if(normalized === this._targetColor)
        {
            return;
        }

        this.update(nowMs);
        this._startColor = this._value;
        this._startTimeMs = nowMs;
        this._targetColor = normalized;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedColor.as::needsUpdate()
    public needsUpdate(_nowMs: number): boolean
    {
        return this._value !== this._targetColor;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/AnimatedColor.as::update()
    public update(nowMs: number): boolean
    {
        const previous = this._value;

        if(this._durationMs === 0 || nowMs >= this._startTimeMs + this._durationMs)
        {
            this._value = this._targetColor;

            return previous !== this._value;
        }

        const progress = Math.max(0, (nowMs - this._startTimeMs) / this._durationMs);

        this._value = AnimatedColor.fromRgb(
            AnimatedColor.interpolateChannel((this._startColor >> 16) & 0xFF, (this._targetColor >> 16) & 0xFF, progress),
            AnimatedColor.interpolateChannel((this._startColor >> 8) & 0xFF, (this._targetColor >> 8) & 0xFF, progress),
            AnimatedColor.interpolateChannel(this._startColor & 0xFF, this._targetColor & 0xFF, progress)
        );

        return previous !== this._value;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedColor.as::fromRgb()
    private static fromRgb(r: number, g: number, b: number): number
    {
        return (r << 16) | (g << 8) | b;
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedColor.as::interpolateChannel()
    private static interpolateChannel(from: number, to: number, progress: number): number
    {
        return Math.round(from + (to - from) * progress);
    }

    // AS3: .../src/com/sulake/habbo/window/utils/AnimatedColor.as::normalizeColor()
    private static normalizeColor(color: number): number
    {
        return color & 0xFFFFFF;
    }
}
