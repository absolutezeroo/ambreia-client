// Pass 3, details: the rig's decals (eyes, nose, claws…) where the surface at their pixel is them
// and faces the camera, so an eye on the far side of the head is never painted.
import {add, apply, dot} from './vec.mjs';
import {VIEW, heading, modelToWorld, project} from './projection.mjs';

export function details(rig, posed, direction, G, img, canvas)
{
    const hd = heading(direction), {width, height, anchorX, anchorY} = canvas, painted = new Set();
    const toWorld = (bone, at) => modelToWorld(hd, apply(posed.get(bone).world, at));
    const locate = (bone, at) =>
    {
        const world = toWorld(bone, at), [sx, sy] = project(world);
        const x = Math.floor(sx + anchorX), y = Math.floor(sy + anchorY);

        if(x < 0 || y < 0 || x >= width || y >= height) return null;

        const g = G[y * width + x];

        return g && Math.abs(g.depth - dot(world, VIEW)) < 1.6 && dot(g.n, VIEW) > 0.15 ? {x, y, fx: sx + anchorX} : null;
    };
    const put = (x, y, colour) =>
    {
        const i = y * width + x;

        if(x >= 0 && y >= 0 && x < width && y < height && img[i])
        {
            img[i] = colour;
            painted.add(i);
        }
    };

    for(const d of rig.decals)
    {
        const at = locate(d.bone, d.at);

        if(!at) continue;
        if(d.kind === 'eye')
        {
            put(at.x, at.y, d.colours[0]);
            // The pupil sits on the side the head looks to; looking at the viewer, the iris alone.
            const [ax] = project(toWorld(d.bone, add(d.at, [1, 0, 0])));
            const side = ax + anchorX > at.fx + 0.3 ? 1 : ax + anchorX < at.fx - 0.3 ? -1 : 0;

            if(side) put(at.x + side, at.y, d.colours[1]);
            continue;
        }
        for(let dy = 0; dy < d.size[1]; dy++)
        {
            for(let dx = 0; dx < d.size[0]; dx++) put(at.x + dx, at.y - dy, d.colours[0]);
        }
    }

    return painted;
}
