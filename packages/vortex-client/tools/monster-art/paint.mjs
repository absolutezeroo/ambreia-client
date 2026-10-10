// Pass 2, paint: each pixel's ramp step from Habbo's light, ambient occlusion and the floor's bounce;
// glints on shiny materials; textures as clusters (a mid tone moved one step), never noise.
import {add, clamp, dot, norm} from './vec.mjs';
import {LIGHT, VIEW} from './projection.mjs';

export const FLOOR = [152, 151, 104, 255];
export const FLASH = [242, 245, 255, 255];

const HALF = norm(add(LIGHT, VIEW));
const within = (x, [lo, hi]) => x >= lo && x <= hi;
const frac = x => x - Math.floor(x);
const hash = (i, j) => frac(Math.sin(i * 127.1 + j * 311.7) * 43758.5453);
const mixColour = (a, b, t) => [0, 1, 2].map(c => Math.round(a[c] + (b[c] - a[c]) * t)).concat(255);

/** The ramp a surface point takes: its material's first matching rule, else the material's ramp. */
export function rampFor(g)
{
    const m = g.shape.material;

    for(const w of m.when)
    {
        if(w.normalUp && !within(g.restN[2], w.normalUp)) continue;
        if(w.normalForward && !within(g.restN[0], w.normalForward)) continue;
        if(w.height && !within(g.rest[2], w.height)) continue;
        if(w.forward && !within(g.rest[0], w.forward)) continue;
        if(w.along && !within(g.h, w.along)) continue;

        return w.ramp;
    }

    return m.ramp;
}

/** -1, 0 or +1 ramp step on the texture's pattern, at rest so the pattern does not swim when posed. */
export function texture(kind, g, k)
{
    if(!kind || k === 0 || k === 4) return 0;

    const [u, s, v] = g.rest;

    if(kind === 'scales')
    {
        // Small staggered scales: a lit bead on the light side, a dark bead in shadow; none underneath.
        if(g.restN[2] < -0.25) return 0;

        const b = v + Math.abs(s) * 0.5, row = Math.floor(b / 1.8), a = u + (row & 1) * 1.25;

        return frac(a / 2.5) < 0.4 && frac(b / 1.8) > 0.5 ? (k >= 2 ? 1 : -1) : 0;
    }

    // Fur: long, sparse strands along the body.
    const j = Math.floor(v * 0.7 + Math.abs(s) * 0.5), t = (u + j * 2.3) / 5;

    return hash(Math.floor(t), j) < 0.22 && frac(t) < 0.75 ? -1 : 0;
}

export function paint(G, {flash = false} = {})
{
    const img = new Array(G.length).fill(null), index = new Int8Array(G.length).fill(-1), base = new Array(G.length).fill(null);

    for(let i = 0; i < G.length; i++)
    {
        const g = G[i];

        if(!g) continue;

        const m = g.shape.material, ramp = rampFor(g);

        base[i] = m.ramp[2];
        if(flash)
        {
            img[i] = FLASH;
            index[i] = 4;
            continue;
        }

        const light = 0.36 + 0.82 * Math.max(0, dot(g.n, LIGHT)) - 0.45 * g.ao;
        // The floor lights the undersides a little, with its own colour.
        const bounce = Math.max(0, -g.n[2]) * (1 - g.ao);
        let k = Math.floor(clamp((light + bounce * 0.18) * 5, 0, 4.999));

        k = clamp(k + texture(m.texture, g, k), 0, 4);

        const glint = Math.pow(Math.max(0, dot(g.n, HALF)), m.shininess) * m.specular > 0.55;
        let colour = glint ? (m.glint ?? ramp[4]) : ramp[k];

        if(!glint && bounce > 0.35 && k <= 1) colour = mixColour(colour, FLOOR, 0.22);
        img[i] = colour;
        index[i] = k;
    }

    return {img, index, base};
}
