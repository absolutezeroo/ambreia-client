/**
 * Math utility functions.
 *
 * Provides static helper methods for common math operations
 * such as normalization, interpolation, clamping, and mapping.
 *
 * The class name is obfuscated in every tree (`_SafeCls_2916` here, `class_419` in
 * win63_version), so `MathUtils` is derived; the member names below are real.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/_SafeCls_2916.as
 */
import {Matrix} from 'pixi.js';

export class MathUtils
{
    /**
	 * Normalize a value to a 0-1 range between min and max.
	 *
	 * @param value The value to normalize
	 * @param min The minimum of the range
	 * @param max The maximum of the range
	 * @returns The normalized value (0-1)
	 */
    // AS3: .../src/com/sulake/habbo/utils/_SafeCls_2916.as::normalize()
    static normalize(value: number, min: number, max: number): number
    {
        return (value - min) / (max - min);
    }

    /**
	 * Linearly interpolate between min and max by t.
	 *
	 * @param t The interpolation factor (0-1)
	 * @param min The start value
	 * @param max The end value
	 * @returns The interpolated value
	 */
    // AS3: .../src/com/sulake/habbo/utils/_SafeCls_2916.as::lerp()
    static lerp(t: number, min: number, max: number): number
    {
        return t * (max - min) + min;
    }

    /**
	 * Clamp a value between min and max.
	 *
	 * @param value The value to clamp
	 * @param min The minimum bound (default 0)
	 * @param max The maximum bound (default 1)
	 * @returns The clamped value
	 */
    // AS3: .../src/com/sulake/habbo/utils/_SafeCls_2916.as::clamp()
    static clamp(value: number, min: number = 0, max: number = 1): number
    {
        return Math.max(min, Math.min(max, value));
    }

    /**
	 * Map a value from one range to another.
	 *
	 * @param value The input value
	 * @param inMin The input range minimum
	 * @param inMax The input range maximum
	 * @param outMin The output range minimum
	 * @param outMax The output range maximum
	 * @returns The mapped value
	 */
    // AS3: .../src/com/sulake/habbo/utils/_SafeCls_2916.as::map()
    static map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number
    {
        return MathUtils.lerp(MathUtils.normalize(value, inMin, inMax), outMin, outMax);
    }

    /**
     * The transform that maps `from` onto `to`.
     *
     * Axis-aligned only: AS3 sets `a`/`d`/`tx`/`ty` and leaves `b`/`c` at zero, so this scales
     * and translates but never rotates or skews. A zero-width or zero-height source divides by
     * zero in AS3 too, and the result is `Infinity` there as here — guarding it would answer a
     * different question than the one the caller asked.
     *
     * DEVIATION: AS3 returns a `flash.geom.Matrix`. PixiJS's `Matrix` is the same six numbers in
     *   the same order and is what this port draws through, so it is what comes back.
     */
    // AS3: .../src/com/sulake/habbo/utils/_SafeCls_2916.as::rectangleTransformMatrix()
    static rectangleTransformMatrix(
        from: {x: number; y: number; width: number; height: number},
        to: {x: number; y: number; width: number; height: number}
    ): Matrix
    {
        const a = to.width / from.width;
        const d = to.height / from.height;

        return new Matrix(a, 0, 0, d, to.x - from.x * a, to.y - from.y * d);
    }
}
