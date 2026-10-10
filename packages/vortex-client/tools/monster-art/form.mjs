// Pass 1, form: one ray per pixel toward the posed rig; what each pixel sees (depth, normals, which
// shape and where on it at rest, ambient occlusion). Everything after works from this buffer.
import {add, apply, clamp, dot, mul, norm, rotate, sub} from './vec.mjs';
import {VIEW, heading, unproject, worldToModel} from './projection.mjs';
import {ellipsoid, roundCone, smin, triangle} from './sdf.mjs';

/** Distance from a model-space point to the posed rig; the nearest shape and the point in its bone's rest space. */
export function sceneAt(rig, posed, p)
{
    let d = Infinity, best = Infinity, shape = null, h = 0, rest = null;
    const restOf = new Map();

    for(const s of rig.shapes)
    {
        let q = restOf.get(s.bone);

        if(!q)
        {
            q = apply(posed.get(s.bone).inverse, p);
            restOf.set(s.bone, q);
        }

        let di, hi = 0;

        if(s.kind === 'ellipsoid') di = ellipsoid(q, s.center, s.radii);
        else if(s.kind === 'cone') ({d: di, h: hi} = roundCone(q, s.from, s.to, s.radius[0], s.radius[1]));
        else di = triangle(q, s.points[0], s.points[1], s.points[2], s.thickness);

        d = d === Infinity ? di : smin(d, di, s.blend);
        if(di < best)
        {
            best = di;
            shape = s;
            h = hi;
            rest = q;
        }
    }

    return {d, shape, h, rest};
}

const STEPS = 160, HIT = 0.02, EPSILON = 0.05;

export function form(rig, posed, direction, canvas, region)
{
    const hd = heading(direction);
    const sdf = p => sceneAt(rig, posed, worldToModel(hd, p));
    const {width, height, anchorX, anchorY, radius} = canvas;
    const G = new Array(width * height).fill(null);

    for(let y = region.y0; y < region.y1; y++)
    {
        for(let x = region.x0; x < region.x1; x++)
        {
            const origin = unproject(x + 0.5 - anchorX, y + 0.5 - anchorY);
            let t = radius, hit = null;

            for(let i = 0; i < STEPS && t > -radius; i++)
            {
                const p = add(origin, mul(VIEW, t)), s = sdf(p);

                if(s.d < HIT)
                {
                    hit = {p, s};
                    break;
                }
                t -= Math.max(s.d * 0.9, HIT);
            }

            // Under the floor is not drawn: a foot sunk by a pose is cut at the floor line.
            if(!hit || hit.p[2] < -0.5) continue;

            const p = hit.p;
            const n = norm([
                sdf(add(p, [EPSILON, 0, 0])).d - sdf(sub(p, [EPSILON, 0, 0])).d,
                sdf(add(p, [0, EPSILON, 0])).d - sdf(sub(p, [0, EPSILON, 0])).d,
                sdf(add(p, [0, 0, EPSILON])).d - sdf(sub(p, [0, 0, EPSILON])).d
            ]);
            // Ambient occlusion: how hemmed in the surface is a few pixels out along its normal.
            let ao = 0;

            for(let k = 1; k <= 4; k++)
            {
                const dist = k * 1.4;
                ao += (dist - sdf(add(p, mul(n, dist))).d) / 2 ** k;
            }

            const restN = rotate(posed.get(hit.s.shape.bone).inverse, worldToModel(hd, n));

            G[y * width + x] = {depth: dot(p, VIEW), n, restN, rest: hit.s.rest, shape: hit.s.shape, h: hit.s.h, ao: clamp(ao * 0.35, 0, 1)};
        }
    }

    return G;
}
