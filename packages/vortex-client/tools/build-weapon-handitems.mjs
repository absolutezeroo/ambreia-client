#!/usr/bin/env node
// Turns the 45-degree weapon icons (images/rpg/weapons/icon_NN.png, hilt bottom-left, tip top-right)
// into avatar hand items, weapon id 9000 + NN, in the `ambreia_weapons` library:
//
//   wpn=<id>  the weapon held in guard (action Wield, arm down)
//   atk=<id>  one swing (action Attack: wind-up, strike, follow-through, back to guard)
//
// Each image is the icon attached to the hand (a socket, as in 3D games): the swing is written once
// in 3D around the avatar (SWING), and every direction's image follows from it, foreshortening
// included. A weapon is split in two layers per frame: what is in front of the avatar's body plane
// is part `ri` (geometry: rightitem), what is behind it part `rib` (geometry: behind), so the
// avatar geometry orders them per direction like the rest of the body.
//
//   node packages/vortex-client/tools/build-weapon-handitems.mjs <clothing dir> [--dry-run]
//
// Writes <clothing dir>/ambreia_weapons.nitro (the folder of hh_human_item.nitro) and puts the
// library's parts into src/assets/configurations/AmbreiaFigureMap.xml (gitignored assets, shipped in
// vortex-client-assets.zip: `node install.mjs --pack`). The actions, the animation and the `rib`
// part type are in the other Ambreia*.xml once, not per weapon. Re-running replaces what it wrote.
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ICONS = resolve(HERE, '../src/assets/images/rpg/weapons');
const CONFIGURATIONS = resolve(HERE, '../src/assets/configurations');
const LIBRARY = 'ambreia_weapons';
export const PART_BASE = 9000;
// Bows and crossbows are held differently (left hand, across the body): not swung.
const SKIPPED = new Set([8, 9, 10, 11, 28, 29, 30, 31]);
// The icons' own axes: the blade runs from the hilt toward the top-right, its edge faces top-left.
const ICON_TIP = [Math.SQRT1_2, -Math.SQRT1_2];
const ICON_EDGE = [-Math.SQRT1_2, -Math.SQRT1_2];
// The hand closes this many pixels above the end of the handle.
const GRIP = 3;

/**
 * The right hand per arm pose and direction, in part space (u = -asset x, v = -asset y of a pixel at
 * the sprite's top-left). crr: the grip of Habbo's sword (hh_human_item 241); drk: the centre of
 * Habbo's drinks (item 1); std: the bottom of the hanging arm, read off renders. A part `ri`/`rib`
 * lands on the canvas at (13 + u, 114 + v), (15 + u, …) in the mirrored directions 4-6, never flipped.
 */
export const HAND = {
    std: [[45, -15], [32, -16], [20, -20], [20, -20], [19, -24], [25, -18], [45, -26], [47, -18]],
    crr: [[54, -31], [47, -25], [37, -21], [27, -28], [8, -27], [16, -27], [33, -28], [39, -28]],
    drk: [[46, -53], [50, -49], [44, -44], [32, -41], [15, -45], [13, -48], [24, -52], [36, -52]]
};
/** The hand in the avatar's own frame (f forward, r to its right), pixels: decides front or behind. */
const HAND_BODY = {std: {f: 3, r: 12}, crr: {f: 14, r: 8}, drk: {f: 9, r: 6}};

/**
 * One swing, in the avatar's frame: `blade` points from the grip to the tip, `edge` is the side the
 * cutting edge faces (made perpendicular to the blade). Frame k is drawn as h_<pose>_ri_<id>_<dir>_<k>;
 * the Attack animation in AmbreiaAvatarAnimation.xml plays 1,1,2,3,3,0, Wield shows 0.
 * `trail` draws the path of the tip since the frame named, as a fading arc.
 */
export const SWING = [
    // Guard: mostly up, so no direction sees the blade end-on (the camera never looks from above),
    // and tilted forward: Habbo draws the hanging arm over the hand item, a blade along it is hidden.
    {pose: 'std', blade: {f: 0.55, r: 0.1, u: 0.83}, edge: {f: 1, r: 0, u: 0}},
    // Wind-up: raised and tilted back, so it rises behind the head instead of across the face.
    {pose: 'drk', blade: {f: -0.5, r: 0.3, u: 0.81}, edge: {f: 0, r: 0, u: 1}},
    {pose: 'crr', blade: {f: 1, r: 0.25, u: 0.05}, edge: {f: 0, r: 0, u: -1}, trail: {from: 1, alpha: 255}},
    {pose: 'std', blade: {f: 0.55, r: 0.2, u: -0.8}, edge: {f: 0, r: 0, u: -1}, trail: {from: 2, alpha: 130}}
];

const unit = v => { const n = Math.hypot(v.f, v.r, v.u) || 1; return {f: v.f / n, r: v.r / n, u: v.u / n}; };
const dot = (a, b) => a.f * b.f + a.r * b.r + a.u * b.u;

/**
 * Screen pixels of a vector in the avatar's frame, facing direction d: Habbo direction 1 faces
 * screen-right, 3 the viewer, each step turns 45°; the floor is drawn at half height (2:1).
 */
export function project(v, direction)
{
    const a = (direction - 1) * Math.PI / 4;
    const gx = v.f * Math.cos(a) + v.r * Math.cos(a + Math.PI / 2);
    const gy = v.f * Math.sin(a) + v.r * Math.sin(a + Math.PI / 2);

    return [gx, gy / 2 - v.u];
}

/** Scale2x (EPX) of RGBA pixels: doubles the size without inventing colours, rounding diagonals. */
export function scale2x({data, width, height})
{
    const out = Buffer.alloc(width * height * 16);
    const at = (x, y) => (Math.min(Math.max(y, 0), height - 1) * width + Math.min(Math.max(x, 0), width - 1)) * 4;
    const same = (a, b) => data.readUInt32LE(a) === data.readUInt32LE(b);
    const put = (x, y, from) => data.copy(out, (y * width * 2 + x) * 4, from, from + 4);

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            const e = at(x, y), b = at(x, y - 1), d = at(x - 1, y), f = at(x + 1, y), h = at(x, y + 1);

            put(2 * x, 2 * y, same(d, b) && !same(b, f) && !same(d, h) ? d : e);
            put(2 * x + 1, 2 * y, same(b, f) && !same(b, d) && !same(f, h) ? f : e);
            put(2 * x, 2 * y + 1, same(d, h) && !same(d, b) && !same(h, f) ? d : e);
            put(2 * x + 1, 2 * y + 1, same(h, f) && !same(d, h) && !same(b, f) ? f : e);
        }
    }

    return {data: out, width: width * 2, height: height * 2};
}

/** Where the hand closes, in icon pixels: GRIP px up the blade from the end of the handle, mid-width. */
export function iconGrip(icon)
{
    const pixels = [];

    for(let y = 0; y < icon.height; y++) for(let x = 0; x < icon.width; x++)
    {
        if(icon.data[(y * icon.width + x) * 4 + 3] === 0) continue;

        pixels.push([x + 0.5, y + 0.5, (x + 0.5) * ICON_TIP[0] + (y + 0.5) * ICON_TIP[1]]);
    }

    if(pixels.length === 0) throw new Error('empty icon');

    const end = Math.min(...pixels.map(p => p[2]));
    const ring = pixels.filter(p => Math.abs(p[2] - end - GRIP) <= 0.75);
    const mean = i => ring.reduce((s, p) => s + p[i], 0) / ring.length;

    return [mean(0), mean(1)];
}

/**
 * One frame of one weapon in one direction: the icon mapped through the screen images of its blade
 * and edge axes, sampled from the icon at 8x (Scale2x three times) so the palette stays the icon's.
 * Returns the two layers on one box and the grip's pixel inside it.
 */
export function drawFrame(icon, big, grip, frame, direction, trailFrom = null)
{
    const blade = unit(frame.blade);
    const raw = frame.edge;
    const along = dot(raw, blade);
    let edge = unit({f: raw.f - along * blade.f, r: raw.r - along * blade.r, u: raw.u - along * blade.u});
    const T = project(blade, direction);
    let E = project(edge, direction);
    // An edge pointing at the camera would flatten the weapon to nothing: keep a third of its width.
    const det = () => T[0] * E[1] - T[1] * E[0];

    if(Math.abs(det()) < 0.33 * Math.hypot(...T))
    {
        const n = Math.hypot(...T) || 1, s = Math.sign(det()) || 1;

        E = [-T[1] / n * 0.33 * s, T[0] / n * 0.33 * s];
        edge = null;
    }

    const toScreen = (x, y) =>
    {
        const a = (x - grip[0]) * ICON_TIP[0] + (y - grip[1]) * ICON_TIP[1];
        const p = (x - grip[0]) * ICON_EDGE[0] + (y - grip[1]) * ICON_EDGE[1];

        return [a * T[0] + p * E[0], a * T[1] + p * E[1], a, p];
    };
    const D = det();
    const toIcon = (sx, sy) =>
    {
        const a = (sx * E[1] - sy * E[0]) / D, p = (T[0] * sy - T[1] * sx) / D;

        return [grip[0] + a * ICON_TIP[0] + p * ICON_EDGE[0], grip[1] + a * ICON_TIP[1] + p * ICON_EDGE[1], a, p];
    };
    const hand = HAND_BODY[frame.pose];
    const inFront = (a, p) => hand.f + a * blade.f + (edge ? p * edge.f : 0) >= 0;

    // The arc the tip swept since `trailFrom`, relative to this frame's grip.
    const trail = [];

    if(trailFrom)
    {
        const length = Math.max(...corners(icon).map(([x, y]) => toScreen(x, y)[2]));
        const [hx0, hy0] = HAND[trailFrom.frame.pose][direction], [hx1, hy1] = HAND[frame.pose][direction];

        for(let i = 0; i <= 96; i++)
        {
            const t = i / 96, b0 = unit(trailFrom.frame.blade);
            const w = unit({f: b0.f + (blade.f - b0.f) * t, r: b0.r + (blade.r - b0.r) * t, u: b0.u + (blade.u - b0.u) * t});
            const [px, py] = project(w, direction);

            trail.push({x: hx0 + (hx1 - hx0) * t - hx1 + px * length, y: hy0 + (hy1 - hy0) * t - hy1 + py * length, t, front: hand.f + length * w.f >= 0, nx: -py, ny: px});
        }
    }

    const points = [...corners(icon).map(([x, y]) => toScreen(x, y)), ...trail.map(p => [p.x, p.y])];
    const left = Math.floor(Math.min(...points.map(p => p[0]))) - 3, top = Math.floor(Math.min(...points.map(p => p[1]))) - 3;
    const width = Math.ceil(Math.max(...points.map(p => p[0]))) + 4 - left, height = Math.ceil(Math.max(...points.map(p => p[1]))) + 4 - top;
    const front = Buffer.alloc(width * height * 4), back = Buffer.alloc(width * height * 4);
    const put = (layer, x, y, rgba) => { if(x >= 0 && y >= 0 && x < width && y < height) layer.writeUInt32LE(rgba, (y * width + x) * 4); };

    for(const p of trail)
    {
        // Thick at the tip's end of the swing, thinning back toward where it started.
        const w = 1 + Math.round(3 * p.t), n = Math.hypot(p.nx, p.ny) || 1;

        for(let k = 0; k < w; k++)
        {
            const x = Math.round(p.x - left - p.nx / n * k), y = Math.round(p.y - top - p.ny / n * k);
            const colour = k < 2 ? 0x00ffffff : 0x00ffd7aa;

            put(p.front ? front : back, x, y, (colour | (trailFrom.alpha << 24)) >>> 0);
        }
    }

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            const [ix, iy, a, p] = toIcon(x + left + 0.5, y + top + 0.5);
            const bx = Math.floor(ix * 8), by = Math.floor(iy * 8);

            if(bx < 0 || by < 0 || bx >= big.width || by >= big.height) continue;

            const offset = (by * big.width + bx) * 4;

            if(big.data[offset + 3] === 0) continue;

            big.data.copy(inFront(a, p) ? front : back, (y * width + x) * 4, offset, offset + 4);
        }
    }

    return {width, height, front, back, grip: [-left, -top]};
}

function opaque(pixels)
{
    let count = 0;

    for(let i = 3; i < pixels.length; i += 4) if(pixels[i] > 0) count++;

    return count;
}

/** Moves every pixel of `from` into `to`, emptying `from`. */
function merge(from, to)
{
    for(let i = 0; i < from.length; i += 4)
    {
        if(from[i + 3] === 0) continue;

        from.copy(to, i, i, i + 4);
        from.fill(0, i, i + 4);
    }
}

function corners(icon)
{
    return [[0, 0], [icon.width, 0], [0, icon.height], [icon.width, icon.height]];
}

/** A .nitro: int16 file count, then per file int16 name length, name, int32 length, zlib data. */
function nitro(files)
{
    const parts = [Buffer.from([files.length >> 8, files.length & 255])];

    for(const [name, data] of files)
    {
        const z = deflateSync(data), head = Buffer.alloc(2 + Buffer.byteLength(name) + 4);

        head.writeInt16BE(Buffer.byteLength(name), 0);
        head.write(name, 2);
        head.writeInt32BE(z.length, 2 + Buffer.byteLength(name));
        parts.push(head, z);
    }

    return Buffer.concat(parts);
}

async function readIcon(file)
{
    const {data, info} = await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject: true});

    return {data, width: info.width, height: info.height};
}

/** Shelf packing of the images into one sheet, 1 px apart. */
function pack(images, sheetWidth)
{
    let x = 0, y = 0, row = 0;

    for(const image of images)
    {
        if(x + image.width > sheetWidth) { x = 0; y += row + 1; row = 0; }

        image.x = x; image.y = y; x += image.width + 1; row = Math.max(row, image.height);
    }

    return y + row;
}

async function main()
{
    const args = process.argv.slice(2);
    const outDir = args.find(a => !a.startsWith('--'));
    const dryRun = args.includes('--dry-run');

    if(!outDir)
    {
        console.error('usage: build-weapon-handitems.mjs <clothing dir> [--dry-run]');
        process.exit(2);
    }

    const images = [], ids = [];

    for(const file of readdirSync(ICONS).sort())
    {
        const n = /^icon_(\d+)\.png$/.exec(file)?.[1];

        if(n === undefined || SKIPPED.has(Number(n))) continue;

        const id = PART_BASE + Number(n), icon = await readIcon(join(ICONS, file));
        const big = scale2x(scale2x(scale2x(icon))), grip = iconGrip(icon);

        ids.push(id);

        SWING.forEach((frame, k) =>
        {
            for(let direction = 0; direction < 8; direction++)
            {
                const trailFrom = frame.trail ? {frame: SWING[frame.trail.from], alpha: frame.trail.alpha} : null;
                const drawn = drawFrame(icon, big, grip, frame, direction, trailFrom);
                const hand = HAND[frame.pose][direction];

                // A few stray pixels (a pommel past the body plane) are not worth a second image.
                const [larger, smaller] = opaque(drawn.front) >= opaque(drawn.back) ? [drawn.front, drawn.back] : [drawn.back, drawn.front];

                if(opaque(smaller) < 8) merge(smaller, larger);

                for(const [part, pixels] of [['ri', drawn.front], ['rib', drawn.back]])
                {
                    if(opaque(pixels) === 0) continue;

                    images.push({name: `h_${frame.pose}_${part}_${id}_${direction}_${k}`, width: drawn.width, height: drawn.height, pixels,
                        asset: {x: drawn.grip[0] - hand[0], y: drawn.grip[1] - hand[1]}});
                }
            }
        });
    }

    images.sort((a, b) => b.height - a.height);

    const sheetWidth = 2048, sheetHeight = pack(images, sheetWidth);
    const pixels = Buffer.alloc(sheetWidth * sheetHeight * 4);
    const frames = {}, assets = {};

    for(const image of images)
    {
        for(let line = 0; line < image.height; line++) image.pixels.copy(pixels, ((image.y + line) * sheetWidth + image.x) * 4, line * image.width * 4, (line + 1) * image.width * 4);

        frames[`${LIBRARY}_${image.name}`] = {frame: {x: image.x, y: image.y, w: image.width, h: image.height}, sourceSize: {w: image.width, h: image.height}, spriteSourceSize: {x: 0, y: 0, w: image.width, h: image.height}, rotated: false, trimmed: false};
        assets[image.name] = image.asset;
    }

    const mapFile = join(CONFIGURATIONS, 'AmbreiaFigureMap.xml');
    const lib = `  <lib id="${LIBRARY}" revision="2">\n${ids.flatMap(id => [`    <part id="${id}" type="ri"/>`, `    <part id="${id}" type="rib"/>`]).join('\n')}\n  </lib>\n`;
    const map = readFileSync(mapFile, 'utf8').replace(new RegExp(`  <lib id="${LIBRARY}"[\\s\\S]*?</lib>\\n`), '').replace(/<\/map>/, `${lib}</map>`);
    // The first version carried weapons as CarryItem params; Wield and Attack take the id as is.
    const actionsFile = join(CONFIGURATIONS, 'AmbreiaAvatarActions.xml');
    const actions = readFileSync(actionsFile, 'utf8').replace(/\n\s*<param id="\d+" value="\d+"\/><!-- ambreia_weapons -->/g, '');

    if(!map.includes(`<lib id="${LIBRARY}"`)) throw new Error('AmbreiaFigureMap.xml not patched: </map> not found');

    console.log(`${ids.length} weapons × ${SWING.length} frames × 8 directions: ${images.length} images, sheet ${sheetWidth}x${sheetHeight}`);

    if(dryRun) return;

    const png = await sharp(pixels, {raw: {width: sheetWidth, height: sheetHeight, channels: 4}}).png().toBuffer();
    const json = {type: 'avatar', name: LIBRARY, assets, spritesheet: {meta: {image: `${LIBRARY}.png`, format: 'RGBA8888', size: {w: sheetWidth, h: sheetHeight}, scale: 1}, frames}};

    writeFileSync(join(outDir, `${LIBRARY}.nitro`), nitro([[`${LIBRARY}.json`, Buffer.from(JSON.stringify(json))], [`${LIBRARY}.png`, png]]));
    writeFileSync(mapFile, map);
    writeFileSync(actionsFile, actions);
    console.log(`wrote ${join(outDir, `${LIBRARY}.nitro`)}, AmbreiaFigureMap.xml`);
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
