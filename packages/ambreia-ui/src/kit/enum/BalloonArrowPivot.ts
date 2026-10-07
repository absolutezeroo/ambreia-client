/**
 * Where a balloon's arrow sits, as one string
 *
 * A pivot is `"<direction>, <position>"`: the direction is the side of the balloon the arrow
 * grows out of, the position is where along that side it sits. The two halves are read back out
 * by `directionFromPivot()` and `positionFromPivot()` rather than being stored apart, because the
 * pivot arrives from a layout as a single `balloon:arrow_pivot` property.
 *
 * **The class name is derived.** It is obfuscated in all three trees (`_SafeCls_4137` in the
 * primary, `class_4052` in win63_version, `_Str_3142` in PRODUCTION) and named here after the
 * `balloon:arrow_pivot` property it exists to describe. The member names below are real.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/_SafeCls_4137.as
 */
export class BalloonArrowPivot
{
    // Name DERIVED: obfuscated (`_SafeStr_11214`); the up/left pivot, by its value.
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_11214
    public static readonly UP_LEFT: string = 'up, left';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::UP_CENTER
    public static readonly UP_CENTER: string = 'up, center';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::UP_RIGHT
    public static readonly UP_RIGHT: string = 'up, right';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::DOWN_LEFT
    public static readonly DOWN_LEFT: string = 'down, left';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::DOWN_CENTER
    public static readonly DOWN_CENTER: string = 'down, center';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::DOWN_RIGHT
    public static readonly DOWN_RIGHT: string = 'down, right';

    // Name DERIVED: obfuscated (`_SafeStr_10597`).
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_10597
    public static readonly LEFT_TOP: string = 'left, top';

    // Name DERIVED: obfuscated (`_SafeStr_11635`).
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_11635
    public static readonly LEFT_MIDDLE: string = 'left, middle';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::LEFT_BOTTOM
    public static readonly LEFT_BOTTOM: string = 'left, bottom';

    // Name DERIVED: obfuscated (`_SafeStr_10657`).
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_10657
    public static readonly RIGHT_TOP: string = 'right, top';

    // Name DERIVED: obfuscated (`_SafeStr_11608`).
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_11608
    public static readonly RIGHT_MIDDLE: string = 'right, middle';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::RIGHT_BOTTOM
    public static readonly RIGHT_BOTTOM: string = 'right, bottom';

    // Name DERIVED: obfuscated (`_SafeStr_10286`).
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_10286
    public static readonly UP: string = 'up';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::DOWN
    public static readonly DOWN: string = 'down';

    // Name DERIVED: obfuscated (`_SafeStr_10087`).
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_10087
    public static readonly LEFT: string = 'left';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::RIGHT
    public static readonly RIGHT: string = 'right';

    // Name DERIVED: obfuscated (`_SafeStr_11588`).
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_11588
    public static readonly MINIMUM: string = 'minimum';

    // Name DERIVED: obfuscated (`_SafeStr_11119`).
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::_SafeStr_11119
    public static readonly MIDDLE: string = 'middle';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::MAXIMUM
    public static readonly MAXIMUM: string = 'maximum';

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::ALL
    public static readonly ALL: readonly string[] = [
        BalloonArrowPivot.UP_LEFT,
        BalloonArrowPivot.UP_CENTER,
        BalloonArrowPivot.UP_RIGHT,
        BalloonArrowPivot.DOWN_LEFT,
        BalloonArrowPivot.DOWN_CENTER,
        BalloonArrowPivot.DOWN_RIGHT,
        BalloonArrowPivot.LEFT_TOP,
        BalloonArrowPivot.LEFT_MIDDLE,
        BalloonArrowPivot.LEFT_BOTTOM,
        BalloonArrowPivot.RIGHT_TOP,
        BalloonArrowPivot.RIGHT_MIDDLE,
        BalloonArrowPivot.RIGHT_BOTTOM
    ];

    // AS3: .../habbo/window/enum/_SafeCls_4137.as::directionFromPivot()
    public static directionFromPivot(pivot: string): string
    {
        return pivot.substring(0, pivot.indexOf(','));
    }

    /**
	 * `middle` is the default, so an unknown or malformed pivot centres the arrow rather than
	 * throwing — the value comes straight from a layout.
	 */
    // AS3: .../habbo/window/enum/_SafeCls_4137.as::positionFromPivot()
    public static positionFromPivot(pivot: string): string
    {
        switch(pivot)
        {
            case BalloonArrowPivot.UP_LEFT:
            case BalloonArrowPivot.DOWN_LEFT:
            case BalloonArrowPivot.LEFT_TOP:
            case BalloonArrowPivot.RIGHT_TOP:
                return BalloonArrowPivot.MINIMUM;

            case BalloonArrowPivot.UP_RIGHT:
            case BalloonArrowPivot.DOWN_RIGHT:
            case BalloonArrowPivot.LEFT_BOTTOM:
            case BalloonArrowPivot.RIGHT_BOTTOM:
                return BalloonArrowPivot.MAXIMUM;

            default:
                return BalloonArrowPivot.MIDDLE;
        }
    }
}
