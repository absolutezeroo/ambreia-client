// Micro-benchmark of the per-frame hot spots read in RoomRenderingCanvas.render():
//  (a) the full sort of _sortableSpriteList every frame (compare b.z - a.z) with ~10% of z moving,
//  (b) RoomRenderingCanvas.bounds() returning a fresh tuple per call,
//  (c) RoomPlane.shareKey() string building per floor plane per frame.
import {SortableSprite} from '/home/user/ambreia-client/packages/ambreia-iso/src/scene/renderer/utils/SortableSprite.ts';

function median(xs: number[]): number { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }
const compare = (a: SortableSprite, b: SortableSprite): number => b.z - a.z;

for(const n of [200, 1000, 3000, 8000])
{
    const list: SortableSprite[] = [];
    for(let i = 0; i < n; i++) { const s = new SortableSprite(); s.z = Math.random() * 1000; list.push(s); }
    list.sort(compare);
    const frames: number[] = [];
    for(let f = 0; f < 300; f++)
    {
        // ~10% of sprites move a little (walking avatars), the rest keep their z: the realistic case.
        for(let i = 0; i < n / 10; i++) { const s = list[(i * 7919) % n]; s.z += (Math.random() - 0.5) * 2; }
        const t0 = performance.now();
        list.sort(compare);
        frames.push(performance.now() - t0);
    }
    const shuffled: number[] = [];
    for(let f = 0; f < 50; f++)
    {
        for(const s of list) s.z = Math.random() * 1000;
        const t0 = performance.now();
        list.sort(compare);
        shuffled.push(performance.now() - t0);
    }
    console.log(`sort N=${n}: nearly-sorted median ${median(frames).toFixed(3)} ms, fully shuffled median ${median(shuffled).toFixed(3)} ms`);
}

// (b) bounds(): tuple per call vs shared scratch array. 5000 sprites x 60 frames.
const sprites = Array.from({length: 5000}, () => ({x: Math.random() * 800, y: Math.random() * 600, w: 64, h: 128, sx: Math.random() < 0.5 ? -1 : 1}));
function boundsTuple(s: typeof sprites[0]): [number, number, number, number] { const l = s.sx < 0 ? s.x - s.w : s.x; return [l, s.y, l + s.w, s.y + s.h]; }
const scratch = new Float64Array(4);
function boundsScratch(s: typeof sprites[0]): Float64Array { const l = s.sx < 0 ? s.x - s.w : s.x; scratch[0] = l; scratch[1] = s.y; scratch[2] = l + s.w; scratch[3] = s.y + s.h; return scratch; }
let acc = 0;
for(const [name, fn] of [['tuple', boundsTuple], ['scratch', boundsScratch]] as const)
{
    const t: number[] = [];
    for(let f = 0; f < 60; f++)
    {
        const t0 = performance.now();
        for(const s of sprites) { const b = fn(s); acc += b[0] + b[3]; }
        t.push(performance.now() - t0);
    }
    console.log(`bounds() ${name}: 5000 calls median ${median(t).toFixed(3)} ms`);
}

// (c) shareKey()-style string per floor plane per frame: 120 floor planes.
const corners = Array.from({length: 120}, () => [{x: 1.5, y: 2.5}, {x: 2.5, y: 2.5}, {x: 2.5, y: 3.5}, {x: 1.5, y: 3.5}]);
const tk: number[] = [];
let len = 0;
for(let f = 0; f < 100; f++)
{
    const t0 = performance.now();
    for(let i = 0; i < corners.length; i++)
    {
        const c = corners[i].map(p => `${p.x},${p.y}`).join(';');
        const key = `${3}|${i}|${64}|${64}x${32}|${c}|${0},${0},${1}` + `|${0},${0},${1},${1}|${0xffffff}|${i}`;
        len += key.length;
    }
    tk.push(performance.now() - t0);
}
console.log(`shareKey x120 planes: median ${median(tk).toFixed(3)} ms per frame (acc ${acc > 0}, len ${len > 0})`);
