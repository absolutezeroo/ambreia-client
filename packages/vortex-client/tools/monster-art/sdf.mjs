// Signed distances of the rig's three shapes, and the smooth minimum that melts them together.
import {clamp, cross, dot, len, mix, mul, sub} from './vec.mjs';

/** Round cone from a (radius ra) to b (rb). h is the position along it, 0 at a, 1 at b. */
export function roundCone(p, a, b, ra, rb)
{
    const pa = sub(p, a), ba = sub(b, a);
    const h = clamp(dot(pa, ba) / dot(ba, ba), 0, 1);

    return {d: len(sub(pa, mul(ba, h))) - mix(ra, rb, h), h};
}

/** Axis-aligned ellipsoid (an approximation that is exact for a sphere). */
export function ellipsoid(p, c, r)
{
    const q = sub(p, c);
    const k0 = Math.hypot(q[0] / r[0], q[1] / r[1], q[2] / r[2]);
    const k1 = Math.hypot(q[0] / (r[0] * r[0]), q[1] / (r[1] * r[1]), q[2] / (r[2] * r[2]));

    return k0 * (k0 - 1) / (k1 || 1e-6);
}

const dot2 = a => dot(a, a);

/** A membrane: the triangle abc with a thickness (wings, fins, a loincloth's flap). */
export function triangle(p, a, b, c, thickness)
{
    const ba = sub(b, a), pa = sub(p, a), cb = sub(c, b), pb = sub(p, b), ac = sub(a, c), pc = sub(p, c);
    const n = cross(ba, ac);
    const outside = Math.sign(dot(cross(ba, n), pa)) + Math.sign(dot(cross(cb, n), pb)) + Math.sign(dot(cross(ac, n), pc)) < 2;
    const d2 = outside
        ? Math.min(
            dot2(sub(mul(ba, clamp(dot(ba, pa) / dot2(ba), 0, 1)), pa)),
            dot2(sub(mul(cb, clamp(dot(cb, pb) / dot2(cb), 0, 1)), pb)),
            dot2(sub(mul(ac, clamp(dot(ac, pc) / dot2(ac), 0, 1)), pc)))
        : dot(n, pa) * dot(n, pa) / dot2(n);

    return Math.sqrt(d2) - thickness;
}

/** Polynomial smooth minimum: within k of each other, two shapes melt into one. k = 0 is a hard edge. */
export function smin(a, b, k)
{
    if(k <= 0) return Math.min(a, b);

    const h = Math.max(k - Math.abs(a - b), 0) / k;

    return Math.min(a, b) - h * h * k * 0.25;
}
