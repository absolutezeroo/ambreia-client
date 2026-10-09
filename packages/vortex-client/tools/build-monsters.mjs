#!/usr/bin/env node
// Compiles monster art (packages/vortex-client/monsters/<id>/monster.json + an .aseprite or a PNG
// grid) into a pet library: <sources>/pets/<id>.nitro, the same two files as every Habbo pet
// (<id>.json + <id>.png), which `build:ambreia` then packs like any pet. A monster stays a pet in
// the client (PetLogic, AnimatedPetVisualization); spec docs/superpowers/specs/2026-10-09-monster-sprites-design.md.
//
//   pnpm --filter vortex-client build:monsters [--sources=C:/laragon/ambreia-sources] [--dry-run] [<id>...]
//
// Animations: idle → posture std, walk → posture mv, death → posture ded (played once), attack →
// gesture atk, hit → gesture hit (played once). One layer, size 64, a generated `sd` shadow, no
// palette (the figure colour still tints it). The pet type id is the id's index in
// `pet.configuration` (legacy.defaults.json): the server's monster figure is "<type> 0 FFFFFF".
import {existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {readAseprite} from './lib/aseprite.mjs';
import {petNames} from './ambreia-families.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MONSTERS = resolve(HERE, '../monsters');
const LEGACY_DEFAULTS = resolve(HERE, '../../ambreia-game/src/configuration/legacy.defaults.json');
const SIZE = 64;
/** FurnitureVisualization.UPDATE_INTERVAL: a pet animation advances one frame per 41 ms. */
export const FRAME_MS = 41;

/** Source animation → pet action. Frame ids are `index * 100 + frame`, as in Habbo's pets. */
export const ANIMATIONS = {
    idle: {index: 0, posture: 'std', loopCount: 0, required: true},
    walk: {index: 1, posture: 'mv', loopCount: 0, required: true},
    attack: {index: 2, gesture: 'atk', loopCount: 1},
    hit: {index: 3, gesture: 'hit', loopCount: 1},
    death: {index: 4, posture: 'ded', loopCount: 1}
};

/** Direction 0-6 mirrored across the screen's vertical axis (3 and 7 face the viewer and away). */
const MIRROR = {0: 6, 1: 5, 2: 4, 4: 2, 5: 1, 6: 0};

const circular = (a, b) => Math.min(Math.abs(a - b), 8 - Math.abs(a - b));

/**
 * Where each of the 8 directions takes its images: a drawn direction, the mirror of one, or else the
 * nearest of those (a tie goes to a drawn one, then to the one closer to facing the viewer).
 * @returns {Map<number, {from: number, flip: boolean}>}
 */
export function resolveDirections(drawn)
{
    const candidates = [];

    for(const d of drawn) candidates.push({dir: d, from: d, flip: false});
    for(const d of drawn) if(d in MIRROR && !drawn.includes(MIRROR[d])) candidates.push({dir: MIRROR[d], from: d, flip: true});

    const result = new Map();

    for(let target = 0; target < 8; target++)
    {
        const best = [...candidates].sort((a, b) =>
            circular(a.dir, target) - circular(b.dir, target) || Number(a.flip) - Number(b.flip) || circular(a.dir, 3) - circular(b.dir, 3))[0];

        result.set(target, {from: best.from, flip: best.flip});
    }

    return result;
}

const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

/** Frame durations (ms) → one frameRepeat and the frame list with each frame repeated to fit. */
export function frameTiming(durations)
{
    const counts = durations.map(ms => Math.max(1, Math.round(ms / FRAME_MS)));
    const repeat = counts.reduce(gcd);

    return {frameRepeat: repeat, counts: counts.map(count => count / repeat)};
}

function fail(id, message)
{
    throw new Error(`monster ${id}: ${message}`);
}

/** Reads a monster folder into `{manifest, frames: Map<animation, Map<dir, {data, ms}[]>>, width, height}`. */
export async function loadSource(folder)
{
    const manifestPath = join(folder, 'monster.json');

    if(!existsSync(manifestPath)) throw new Error(`${folder}: no monster.json`);

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const id = manifest.id;

    if(typeof id !== 'string' || !/^[a-z][a-z0-9_]*$/.test(id)) throw new Error(`${manifestPath}: "id" must be lower-case letters, digits, _`);

    const directions = manifest.directions ?? [2];

    if(!Array.isArray(directions) || !directions.length || directions.some(d => !Number.isInteger(d) || d < 0 || d > 7) || new Set(directions).size !== directions.length)
    {
        fail(id, '"directions" must be distinct integers 0-7');
    }

    if(!Array.isArray(manifest.anchor) || manifest.anchor.length !== 2) fail(id, '"anchor" must be [x, y]');

    const frames = new Map();
    let width, height;

    if(manifest.aseprite)
    {
        const sprite = readAseprite(readFileSync(join(folder, manifest.aseprite)));

        ({width, height} = sprite);

        for(const [name] of Object.entries(ANIMATIONS))
        {
            const perDir = new Map();

            for(const dir of directions)
            {
                const tag = sprite.tags.find(t => t.name === `${name}_${dir}`) ?? (directions.length === 1 ? sprite.tags.find(t => t.name === name) : undefined);

                if(!tag) continue;

                perDir.set(dir, sprite.frames.slice(tag.from, tag.to + 1).map(frame => ({data: frame.data, ms: frame.duration})));
            }

            if(perDir.size && perDir.size !== directions.length) fail(id, `animation ${name} has tags for ${perDir.size} of the ${directions.length} directions`);
            if(perDir.size) frames.set(name, perDir);
        }
    }
    else if(manifest.sheet)
    {
        const [cellW, cellH] = manifest.cell ?? [];

        if(!(cellW > 0 && cellH > 0)) fail(id, '"cell" must be [width, height]');

        const {data: sheet, info} = await sharp(join(folder, manifest.sheet)).ensureAlpha().raw().toBuffer({resolveWithObject: true});

        [width, height] = [cellW, cellH];

        for(const [name, spec] of Object.entries(manifest.animations ?? {}))
        {
            if(!(name in ANIMATIONS)) fail(id, `unknown animation "${name}" (known: ${Object.keys(ANIMATIONS).join(', ')})`);

            const durations = Array.isArray(spec.ms) ? spec.ms : Array(spec.frames).fill(spec.ms ?? 100);

            if(durations.length !== spec.frames) fail(id, `animation ${name}: ${spec.frames} frames but ${durations.length} durations`);

            const perDir = new Map();

            directions.forEach((dir, d) =>
            {
                const row = spec.row + d, list = [];

                for(let f = 0; f < spec.frames; f++)
                {
                    const x0 = (spec.column ?? 0) * cellW + f * cellW, y0 = row * cellH;

                    if(x0 + cellW > info.width || y0 + cellH > info.height) fail(id, `animation ${name}: cell (${f}, ${row}) is outside the ${info.width}×${info.height} sheet`);

                    const data = Buffer.alloc(cellW * cellH * 4);

                    for(let y = 0; y < cellH; y++) sheet.copy(data, y * cellW * 4, ((y0 + y) * info.width + x0) * 4, ((y0 + y) * info.width + x0 + cellW) * 4);

                    list.push({data, ms: durations[f]});
                }

                perDir.set(dir, list);
            });

            frames.set(name, perDir);
        }
    }
    else
    {
        fail(id, 'needs "aseprite" or "sheet" + "cell"');
    }

    for(const [name, spec] of Object.entries(ANIMATIONS)) if(spec.required && !frames.has(name)) fail(id, `animation "${name}" is required`);

    return {manifest: {...manifest, directions, scale: manifest.scale ?? 1}, frames, width, height};
}

/** Nearest-neighbour integer upscale, then the opaque bounding box. Null when nothing is opaque. */
function prepare(data, width, height, scale)
{
    let minX = width, minY = height, maxX = -1, maxY = -1;

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            if(data[(y * width + x) * 4 + 3] === 0) continue;
            if(x < minX) minX = x;
            if(x > maxX) maxX = x;
            if(y < minY) minY = y;
            if(y > maxY) maxY = y;
        }
    }

    if(maxX < 0) return null;

    const w = (maxX - minX + 1) * scale, h = (maxY - minY + 1) * scale, out = Buffer.alloc(w * h * 4);

    for(let y = 0; y < h; y++)
    {
        for(let x = 0; x < w; x++)
        {
            const from = ((minY + Math.floor(y / scale)) * width + minX + Math.floor(x / scale)) * 4;

            data.copy(out, (y * w + x) * 4, from, from + 4);
        }
    }

    return {data: out, w, h, left: minX * scale, top: minY * scale};
}

/** An opaque black ellipse: the client draws a pet's `sd` sprite at alpha 48. */
function shadow(bodyWidth)
{
    const w = Math.max(8, Math.round(bodyWidth * 0.8) & ~1), h = Math.max(4, Math.round(w / 2.2)), data = Buffer.alloc(w * h * 4);

    for(let y = 0; y < h; y++)
    {
        for(let x = 0; x < w; x++)
        {
            const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);

            if(dx * dx + dy * dy <= 1) data.writeUInt32BE(0x000000ff, (y * w + x) * 4);
        }
    }

    return {data, w, h};
}

/**
 * Compiles a loaded source into the pet library's JSON and spritesheet (RGBA).
 * @returns {{id: string, json: object, sheet: {data: Buffer, width: number, height: number}}}
 */
export function compileMonster({manifest, frames, width, height})
{
    const {id, scale, directions} = manifest;
    const [anchorX, anchorY] = manifest.anchor;
    const assets = {}, images = [], byContent = new Map();
    const name = (dir, frameId) => `${id}_${SIZE}_a_${dir}_${frameId}`;

    // Drawn frames: one asset each, identical images share one spritesheet frame (asset `source`).
    for(const [animation, perDir] of frames)
    {
        const counts = new Set([...perDir.values()].map(list => list.length));

        if(counts.size > 1) fail(id, `animation ${animation} has a different frame count per direction (${[...counts].join(', ')})`);

        for(const [dir, list] of perDir)
        {
            list.forEach((frame, f) =>
            {
                const prepared = prepare(frame.data, width, height, scale);

                if(prepared === null) fail(id, `animation ${animation}, direction ${dir}, frame ${f} is empty`);

                const asset = name(dir, ANIMATIONS[animation].index * 100 + f);
                const position = {x: anchorX * scale - prepared.left, y: anchorY * scale - prepared.top};
                const key = `${prepared.w}x${prepared.h}:${prepared.data.toString('base64')}`;
                const same = byContent.get(key);

                if(same !== undefined && assets[same].x === position.x && assets[same].y === position.y)
                {
                    assets[asset] = {source: same, ...position};
                }
                else
                {
                    byContent.set(key, asset);
                    assets[asset] = position;
                    images.push({name: asset, ...prepared});
                }
            });
        }
    }

    const root = asset => assets[asset].source ?? asset;
    const resolved = resolveDirections(directions);
    const animations = {};

    for(const [animation, perDir] of frames)
    {
        const spec = ANIMATIONS[animation];
        const list = perDir.get(directions[0]);

        for(const [target, {from, flip}] of resolved)
        {
            if(perDir.has(target)) continue;

            list.forEach((_, f) =>
            {
                const frameId = spec.index * 100 + f, source = name(from, frameId);

                assets[name(target, frameId)] = {source: root(source), x: assets[source].x, y: assets[source].y, ...(flip ? {flipH: true} : {})};
            });
        }

        // Every direction plays the same frame ids; their timing comes from the first drawn one.
        const {frameRepeat, counts} = frameTiming(list.map(frame => frame.ms));
        const sequence = {};
        let n = 0;

        counts.forEach((count, f) =>
        {
            for(let i = 0; i < count; i++) sequence[n++] = {id: spec.index * 100 + f};
        });

        animations[spec.index] = {layers: {0: {frameRepeat, loopCount: spec.loopCount, frameSequences: {0: {frames: sequence}}}}};
    }

    const idle = images.find(image => image.name === name(directions[0], 0));
    const shade = shadow(idle ? idle.w : 24);

    assets[`${id}_${SIZE}_sd_0_0`] = {x: shade.w / 2, y: shade.h / 2};
    images.push({name: `${id}_${SIZE}_sd_0_0`, ...shade});
    for(let dir = 1; dir < 8; dir++) assets[`${id}_${SIZE}_sd_${dir}_0`] = {source: `${id}_${SIZE}_sd_0_0`, x: shade.w / 2, y: shade.h / 2};

    const actions = Object.entries(ANIMATIONS).filter(([animation]) => frames.has(animation));
    const visualization = {
        angle: 45,
        layerCount: 1,
        size: SIZE,
        directions: Object.fromEntries([...Array(8).keys()].map(dir => [dir, {}])),
        animations,
        postures: {postures: actions.filter(([, spec]) => spec.posture).map(([, spec]) => ({id: spec.posture, animationId: spec.index}))},
        gestures: actions.filter(([, spec]) => spec.gesture).map(([, spec]) => ({id: spec.gesture, animationId: spec.index}))
    };

    // No death drawn: the corpse stands as idle.
    if(!frames.has('death')) visualization.postures.postures.push({id: 'ded', animationId: ANIMATIONS.idle.index});

    const sheet = pack(images);
    const json = {
        name: id,
        logicType: 'pet',
        visualizationType: 'pet_animated',
        assets,
        logic: {model: {dimensions: {x: 1, y: 1, z: 1}, directions: [0, 45, 90, 135, 180, 225, 270, 315]}},
        visualizations: [visualization],
        spritesheet: {
            frames: Object.fromEntries(sheet.placed.map(({name: asset, x, y, w, h}) => [`${id}_${asset}`, {
                frame: {x, y, w, h}, rotated: false, trimmed: false,
                spriteSourceSize: {x: 0, y: 0, w, h}, sourceSize: {w, h}, pivot: {x: 0.5, y: 0.5}
            }])),
            meta: {image: `${id}.png`, format: 'RGBA8888', size: {w: sheet.width, h: sheet.height}, scale: 1}
        }
    };

    return {id, json, sheet};
}

/** Shelf packing, tallest first, rows up to 512 px wide; one transparent pixel between images. */
function pack(images)
{
    const sorted = [...images].sort((a, b) => b.h - a.h || b.w - a.w), placed = [];
    const maxWidth = Math.max(512, ...images.map(image => image.w + 1));
    let x = 0, y = 0, rowHeight = 0, width = 0;

    for(const image of sorted)
    {
        if(x + image.w > maxWidth)
        {
            x = 0;
            y += rowHeight + 1;
            rowHeight = 0;
        }

        placed.push({...image, x, y});
        width = Math.max(width, x + image.w);
        rowHeight = Math.max(rowHeight, image.h);
        x += image.w + 1;
    }

    const height = y + rowHeight, data = Buffer.alloc(width * height * 4);

    for(const image of placed)
    {
        for(let row = 0; row < image.h; row++) image.data.copy(data, ((image.y + row) * width + image.x) * 4, row * image.w * 4, (row + 1) * image.w * 4);
    }

    return {placed, width, height, data};
}

/** The .nitro container: int16 count, then per file int16 name length, name, int32 length, zlib data. */
export function encodeNitro(files)
{
    const parts = [];
    const count = Buffer.alloc(2);

    count.writeInt16BE(files.length);
    parts.push(count);

    for(const {name, data} of files)
    {
        const nameBytes = Buffer.from(name, 'utf8'), packed = deflateSync(data), head = Buffer.alloc(2);

        head.writeInt16BE(nameBytes.length);
        parts.push(head, nameBytes);

        const length = Buffer.alloc(4);

        length.writeInt32BE(packed.length);
        parts.push(length, packed);
    }

    return Buffer.concat(parts);
}

export async function buildMonster(folder)
{
    const {id, json, sheet} = compileMonster(await loadSource(folder));
    const png = await sharp(sheet.data, {raw: {width: sheet.width, height: sheet.height, channels: 4}}).png().toBuffer();

    return {id, nitro: encodeNitro([{name: `${id}.json`, data: Buffer.from(JSON.stringify(json))}, {name: `${id}.png`, data: png}])};
}

async function main()
{
    const args = process.argv.slice(2);
    const flag = (key, fallback) => args.find(arg => arg.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
    const sources = flag('sources', 'C:/laragon/ambreia-sources');
    const dryRun = args.includes('--dry-run');
    const wanted = args.filter(arg => !arg.startsWith('--'));
    const ids = wanted.length ? wanted : readdirSync(MONSTERS, {withFileTypes: true}).filter(entry => entry.isDirectory()).map(entry => entry.name);
    const pets = petNames(JSON.parse(readFileSync(LEGACY_DEFAULTS, 'utf8')));
    let failed = 0;

    for(const folder of ids)
    {
        try
        {
            const {id, nitro} = await buildMonster(join(MONSTERS, folder));
            const out = join(sources, 'pets', `${id}.nitro`);
            const type = pets.indexOf(id);

            if(!dryRun)
            {
                mkdirSync(dirname(out), {recursive: true});
                writeFileSync(out, nitro);
            }

            console.log(`${dryRun ? '(dry run) ' : ''}${id}: ${out} (${nitro.length} bytes)`);
            console.log(type < 0
                ? `  not in pet.configuration yet: append "${id}" to it in ${LEGACY_DEFAULTS}`
                : `  pet type ${type}: the monster figure is "${type} 0 FFFFFF"`);
        }
        catch(error)
        {
            failed++;
            console.error(`${folder}: ${error.message}`);
        }
    }

    if(!dryRun && ids.length > failed) console.log('next: pnpm --filter vortex-client build:ambreia:all (or build:ambreia on the pets family)');
    if(failed) process.exit(1);
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
