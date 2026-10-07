/**
 * Every integer cell a straight line passes through — Bresenham, split into the two halves the
 * algorithm needs depending on which axis moves faster.
 *
 * Name DERIVED, not recovered: the class is `_SafeCls_4424` in the primary tree and `class_3675`
 * in `win63_version`, obfuscated in both, and it does not exist in the 2016 tree at all. The
 * public member name, `interpolationPoints`, is real.
 *
 * The one caller that matters is the wired floor editor: dragging the mouse fast skips cells
 * between two frames, and this is what fills them in so a drag draws a continuous line rather than
 * a dotted one.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/utils/_SafeCls_4424.as
 */
export interface IInterpolationPoint
{
    // TS-only: AS3 pushes anonymous `{x, y}` objects; this is that shape, named.
    x: number;
    // TS-only: see above.
    y: number;
}

export class LineInterpolation
{
    /**
     * The shallow case: x moves faster than y, so the loop steps x and decides when to nudge y.
     */
    // AS3: _SafeCls_4424.as::interpolationPointsLow()
    private static interpolationPointsLow(x0: number, y0: number, x1: number, y1: number): IInterpolationPoint[]
    {
        const points: IInterpolationPoint[] = [];
        const dx = x1 - x0;

        let dy = y1 - y0;
        let step = 1;

        if(dy < 0)
        {
            step = -1;
            dy = -dy;
        }

        let error = 2 * dy - dx;
        let y = y0;

        for(let x = x0; x <= x1; x++)
        {
            points.push({x, y});

            if(error > 0)
            {
                y += step;
                error += 2 * (dy - dx);
            }
            else
            {
                error += 2 * dy;
            }
        }

        return points;
    }

    /**
     * The steep case: the same thing with the axes swapped.
     */
    // AS3: _SafeCls_4424.as::interpolationPointsHigh()
    private static interpolationPointsHigh(x0: number, y0: number, x1: number, y1: number): IInterpolationPoint[]
    {
        const points: IInterpolationPoint[] = [];
        const dy = y1 - y0;

        let dx = x1 - x0;
        let step = 1;

        if(dx < 0)
        {
            step = -1;
            dx = -dx;
        }

        let error = 2 * dx - dy;
        let x = x0;

        for(let y = y0; y <= y1; y++)
        {
            points.push({x, y});

            if(error > 0)
            {
                x += step;
                error += 2 * (dx - dy);
            }
            else
            {
                error += 2 * dx;
            }
        }

        return points;
    }

    /**
     * Both endpoints are included. The swap when the line runs backwards means the returned points
     * are ordered from whichever end came first in the *scan*, not from `(x0, y0)` — AS3 has the
     * same property and its one caller does not care, because it skips both endpoints anyway.
     */
    // AS3: _SafeCls_4424.as::interpolationPoints()
    public static interpolationPoints(x0: number, y0: number, x1: number, y1: number): IInterpolationPoint[]
    {
        if(Math.abs(y1 - y0) < Math.abs(x1 - x0))
        {
            return x0 > x1
                ? LineInterpolation.interpolationPointsLow(x1, y1, x0, y0)
                : LineInterpolation.interpolationPointsLow(x0, y0, x1, y1);
        }

        return y0 > y1
            ? LineInterpolation.interpolationPointsHigh(x1, y1, x0, y0)
            : LineInterpolation.interpolationPointsHigh(x0, y0, x1, y1);
    }
}
