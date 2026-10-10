// One frame of a monster: the four passes, as four RGBA layers and the flattened image; and the
// canvas that holds every frame from every direction.
import {add, apply, len, mul, sub} from './vec.mjs';
import {SPREAD, heading, modelToWorld, project} from './projection.mjs';
import {ANIMATIONS, poseBones} from './rig.mjs';
import {form} from './form.mjs';
import {paint} from './paint.mjs';
import {details} from './details.mjs';
import {finish} from './finish.mjs';

/** Bounding spheres of the posed shapes, in model space. */
export function spheres(rig, posed)
{
    return rig.shapes.map(s =>
    {
        const m = posed.get(s.bone).world;

        if(s.kind === 'ellipsoid') return {c: apply(m, s.center), r: Math.max(...s.radii)};
        if(s.kind === 'cone')
        {
            const a = apply(m, s.from), b = apply(m, s.to);

            return {c: mul(add(a, b), 0.5), r: len(sub(a, b)) / 2 + Math.max(...s.radius)};
        }

        const pts = s.points.map(p => apply(m, p)), c = mul(add(add(pts[0], pts[1]), pts[2]), 1 / 3);

        return {c, r: Math.max(...pts.map(p => len(sub(p, c)))) + s.thickness};
    });
}

/** The screen box (relative to the anchor) of a posed rig seen from a direction. */
function box(list, direction)
{
    const hd = heading(direction);
    const b = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};

    for(const {c, r} of list)
    {
        const [sx, sy] = project(modelToWorld(hd, c)), e = r * SPREAD;

        b.x0 = Math.min(b.x0, sx - e);
        b.y0 = Math.min(b.y0, sy - e);
        b.x1 = Math.max(b.x1, sx + e);
        b.y1 = Math.max(b.y1, sy + e);
    }

    return b;
}

/** Every frame of the monster in build order: direction 0 to 7, then the animations in ANIMATIONS order. */
export function frameList(rig)
{
    const list = [];

    for(let direction = 0; direction < 8; direction++)
    {
        for(const animation of ANIMATIONS)
        {
            (rig.animations[animation] ?? []).forEach((frame, index) => list.push({direction, animation, index, frame}));
        }
    }

    return list;
}

/** One canvas for the whole monster (every frame, every direction, plus 2 px); the anchor is where the origin lands. */
export function canvasFor(rig)
{
    const all = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};
    let radius = 0;

    for(const frames of Object.values(rig.animations))
    {
        for(const frame of frames)
        {
            const list = spheres(rig, poseBones(rig, frame.pose));

            for(const {c, r} of list) radius = Math.max(radius, len(c) + r);
            for(let direction = 0; direction < 8; direction++)
            {
                const b = box(list, direction);

                all.x0 = Math.min(all.x0, b.x0);
                all.y0 = Math.min(all.y0, b.y0);
                all.x1 = Math.max(all.x1, b.x1);
                all.y1 = Math.max(all.y1, b.y1);
            }
        }
    }

    const left = Math.floor(all.x0) - 2, top = Math.floor(all.y0) - 2;

    return {width: Math.ceil(all.x1) + 2 - left, height: Math.ceil(all.y1) + 2 - top, anchorX: -left, anchorY: -top, radius: radius + 2};
}

export function rgba(colours, width, height)
{
    const buf = Buffer.alloc(width * height * 4);

    colours.forEach((c, i) =>
    {
        if(c) buf.set(c, i * 4);
    });

    return buf;
}

export function renderFrame(rig, canvas, direction, frame)
{
    const {width, height, anchorX, anchorY} = canvas;
    const posed = poseBones(rig, frame.pose);
    // Trace only this pose's box (one pixel wider for the outline).
    const b = box(spheres(rig, posed), direction);
    const region = {
        x0: Math.max(0, Math.floor(b.x0 + anchorX) - 1), y0: Math.max(0, Math.floor(b.y0 + anchorY) - 1),
        x1: Math.min(width, Math.ceil(b.x1 + anchorX) + 1), y1: Math.min(height, Math.ceil(b.y1 + anchorY) + 1)
    };
    const G = form(rig, posed, direction, canvas, region);
    const {img, index, base} = paint(G, {flash: frame.flash});
    const painted = img.slice();
    const locked = details(rig, posed, direction, G, img, canvas);
    const detailed = img.slice();
    const final = finish(G, img, index, locked, canvas);

    return {
        forme: rgba(base, width, height),
        peinture: rgba(painted, width, height),
        details: rgba(detailed.map((c, i) => (c !== painted[i] ? c : null)), width, height),
        finition: rgba(final.map((c, i) => (c !== detailed[i] ? c : null)), width, height),
        final: rgba(final, width, height)
    };
}
