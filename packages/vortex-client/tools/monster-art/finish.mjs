// Pass 4, finish: what makes a 3D render read as drawn pixel art. Interior lines where a near part
// covers a far one; crests lightened and creases darkened; a rim of back light on the silhouette; the
// selective outline; lone pixels removed. Decal pixels are never touched.
import {clamp, dot} from './vec.mjs';
import {BACK_LIGHT, LIGHT} from './projection.mjs';
import {rampFor} from './paint.mjs';

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function finish(G, img, index, locked, canvas)
{
    const {width: W, height: H} = canvas;
    const out = img.slice();
    const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? y * W + x : -1);

    // Interior lines: the far pixel next to a nearer, different shape takes its ramp's darkest.
    for(let y = 0; y < H; y++)
    {
        for(let x = 0; x < W; x++)
        {
            const i = y * W + x, g = G[i];

            if(!g || locked.has(i)) continue;
            for(const [dx, dy] of N4)
            {
                const j = at(x + dx, y + dy), q = j < 0 ? null : G[j];

                if(q && q.depth - g.depth > 2.2 && q.shape !== g.shape)
                {
                    out[i] = rampFor(g)[0];
                    break;
                }
            }
        }
    }

    // Crests (nearer than a neighbour that turns away) +1, creases −1; silhouette pixels facing the back light +1.
    for(let y = 1; y < H - 1; y++)
    {
        for(let x = 1; x < W - 1; x++)
        {
            const i = y * W + x, g = G[i];

            if(!g || locked.has(i) || out[i] !== img[i]) continue;

            const ramp = rampFor(g), k = index[i];

            // Glints, the floor's bounce tint and the flash are left as painted.
            if(img[i] !== ramp[k]) continue;

            let edge = 0, silhouette = false;

            for(const [dx, dy] of N4)
            {
                const q = G[(y + dy) * W + x + dx];

                if(!q)
                {
                    silhouette = true;
                    continue;
                }
                if(1 - dot(g.n, q.n) > 0.3) edge += g.depth > q.depth + 0.15 ? 1 : g.depth < q.depth - 0.15 ? -1 : 0;
            }

            let kk = k + Math.sign(edge);

            if(silhouette && dot(g.n, BACK_LIGHT) > 0.2) kk = Math.max(kk, k + 1);
            kk = clamp(kk, 0, 4);
            if(kk !== k) out[i] = ramp[kk];
        }
    }

    // Outline: an empty pixel touching the shape takes the darkest of its brightest neighbour's ramp,
    // one step lighter where that neighbour is lit.
    for(let y = 0; y < H; y++)
    {
        for(let x = 0; x < W; x++)
        {
            const i = y * W + x;

            if(img[i]) continue;

            let best = -1;

            for(const [dx, dy] of N4)
            {
                const j = at(x + dx, y + dy);

                if(j >= 0 && img[j] && (best < 0 || index[j] > index[best])) best = j;
            }
            if(best < 0) continue;

            const g = G[best], ramp = rampFor(g);

            out[i] = index[best] >= 3 && dot(g.n, LIGHT) > 0.45 ? ramp[1] : ramp[0];
        }
    }

    // Cleanup: a lone pixel whose four neighbours agree takes their colour.
    const before = out.slice();

    for(let y = 1; y < H - 1; y++)
    {
        for(let x = 1; x < W - 1; x++)
        {
            const i = y * W + x, c = before[i];

            if(!c || locked.has(i)) continue;

            const ns = N4.map(([dx, dy]) => before[(y + dy) * W + x + dx]);

            if(ns.every(n => n && n === ns[0]) && ns[0] !== c) out[i] = ns[0];
        }
    }

    return out;
}
