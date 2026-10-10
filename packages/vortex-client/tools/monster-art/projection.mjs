// Habbo's 2:1 floor. World x goes toward the screen's lower right, y toward its lower left, z up; one
// unit along a floor diagonal is one pixel. MX and MY are the screen axes (the projection's rows).
import {add, dot, mul, norm} from './vec.mjs';

const S5 = Math.sqrt(5);

export const MX = [2 / S5, -2 / S5, 0];
export const MY = [1 / S5, 1 / S5, -1];
/** Toward the viewer: the direction the projection flattens. */
export const VIEW = norm([1, 1, 2 / S5]);
/** Habbo's light, from the screen's upper left and high; the back light rims the far edges. */
export const LIGHT = norm([-0.9, 0.25, 1.3]);
export const BACK_LIGHT = norm([0.35, -1, 0.55]);
/** How far a sphere of radius 1 spreads on screen at most (the longer row's norm). */
export const SPREAD = Math.sqrt(8 / 5);

/** Screen offset of a world point from the anchor, where the world origin lands. */
export const project = p => [dot(MX, p), dot(MY, p)];
/** The world point projecting to (sx, sy) on the plane through the origin that faces the viewer. */
export const unproject = (sx, sy) => add(mul(MX, sx / (8 / 5)), mul(MY, sy / (7 / 5)));

/** Direction k turns the model by (k − 2) × 45° from x toward y: 2 faces the lower right, 3 the viewer. */
export function heading(direction)
{
    const a = (direction - 2) * Math.PI / 4;

    return {f: [Math.cos(a), Math.sin(a), 0], r: [-Math.sin(a), Math.cos(a), 0]};
}

export const modelToWorld = (h, q) => [h.f[0] * q[0] + h.r[0] * q[1], h.f[1] * q[0] + h.r[1] * q[1], q[2]];
export const worldToModel = (h, p) => [dot(p, h.f), dot(p, h.r), p[2]];
