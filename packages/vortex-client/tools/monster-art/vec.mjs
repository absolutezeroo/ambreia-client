// Vector and rigid-transform helpers for the monster art tools. A point is [u, s, v] in model space
// or [x, y, z] in world space; a transform is a rotation r (3×3, row-major) then a translation t.
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = a => Math.hypot(a[0], a[1], a[2]);
export const norm = a => mul(a, 1 / (len(a) || 1));
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const mix = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export const IDENTITY = {r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0]};

export const rotate = (m, p) => [
    m.r[0] * p[0] + m.r[1] * p[1] + m.r[2] * p[2],
    m.r[3] * p[0] + m.r[4] * p[1] + m.r[5] * p[2],
    m.r[6] * p[0] + m.r[7] * p[1] + m.r[8] * p[2]
];
export const apply = (m, p) => add(rotate(m, p), m.t);

/** a ∘ b: b first, then a. */
export function compose(a, b)
{
    const r = new Array(9);

    for(let i = 0; i < 3; i++)
    {
        for(let j = 0; j < 3; j++) r[i * 3 + j] = a.r[i * 3] * b.r[j] + a.r[i * 3 + 1] * b.r[3 + j] + a.r[i * 3 + 2] * b.r[6 + j];
    }

    return {r, t: apply(a, b.t)};
}

/** The inverse of a rigid transform: the rotation transposed. */
export function invert(m)
{
    const r = [m.r[0], m.r[3], m.r[6], m.r[1], m.r[4], m.r[7], m.r[2], m.r[5], m.r[8]];

    return {r, t: mul(rotate({r, t: [0, 0, 0]}, m.t), -1)};
}

export const translation = t => ({r: IDENTITY.r, t: [...t]});

/**
 * Degrees about u, then s, then v (R = Rv · Rs · Ru). A positive s-rotation lifts what points
 * forward and swings forward what hangs down; a positive v-rotation turns toward +s.
 */
export function rotation([ru, rs, rv])
{
    const k = Math.PI / 180;
    const [cu, su] = [Math.cos(ru * k), Math.sin(ru * k)];
    const [cs, ss] = [Math.cos(rs * k), Math.sin(rs * k)];
    const [cv, sv] = [Math.cos(rv * k), Math.sin(rv * k)];
    const Ru = {r: [1, 0, 0, 0, cu, -su, 0, su, cu], t: [0, 0, 0]};
    const Rs = {r: [cs, 0, -ss, 0, 1, 0, ss, 0, cs], t: [0, 0, 0]};
    const Rv = {r: [cv, -sv, 0, sv, cv, 0, 0, 0, 1], t: [0, 0, 0]};

    return compose(Rv, compose(Rs, Ru));
}
