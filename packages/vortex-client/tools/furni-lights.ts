#!/usr/bin/env tsx
/**
 * Writes into furni pieces of an .ambreia directory how they light (IFurnitureLightData, read by
 * @ambreia/iso's FurnitureLights): a `lights` entry in the piece's manifest, image by image, so the
 * room lights as the furni is drawn — its direction, its state (a lamp turned off shows no glow
 * image), its animation (a screen flickering, flames burning).
 *
 *   pnpm --filter vortex-client exec tsx tools/furni-lights.ts <ambreia dir> --only=tv_luxus[,…] [--key-file=<file>] [--overrides=<json>]
 *
 * The images that give light are the layers drawn additively (ink ADD: a lamp's halo) and the layers
 * the overrides file names (a screen or flames drawn plain: what an analysis cannot tell from a
 * plain picture). Each of their images gives its colour (its pixels weighted by brightness, raised
 * to full brightness), its level (how bright it is against the brightest image of its direction, 0..1)
 * and where it is, from its offset: the
 * centre of the image, in tiles from the furni's origin, at the height it is drawn.
 *
 * In place, checked: the piece is read back through the client's reader and its manifest compared;
 * the piece as it was is kept in <state-dir>/lights-backup/ first.
 */
import fs from 'node:fs';
import path from 'node:path';
import {compressManifest, encodePiece} from '@ambreia/common/assets/pack/AmbreiaPiece';
import type {IPieceImage} from '@ambreia/common/assets/pack/AmbreiaPiece';
import {openAmbreia} from './lib/ambreia-pieces';
import type {IRgba, Json} from './lib/ambreia-pieces';

interface IOverride
{
    layer?: string;
    radius?: number;
    intensity?: number;
    spread?: number;
    /** The states that give light: only the images their animations show count (a TV: its "on" state). */
    states?: number[];
    none?: boolean;
}

const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const flag = (name: string, fallback: string): string => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const [DIRECTORY] = args;
const ONLY = flag('only', '').split(',').filter(Boolean);
const KEY_FILE = flag('key-file', '');
const STATE_DIR = flag('state-dir', '.ambreia-build');
const OVERRIDES = JSON.parse(fs.readFileSync(flag('overrides', path.join(import.meta.dirname, 'furni-lights.json')), 'utf8')) as Record<string, IOverride>;
/** The size whose images are measured; offsets in tiles do not depend on it. */
const SIZE = 64;
const DEFAULT_RADIUS = 3.5;
const DEFAULT_INTENSITY = 0.75;

if(!DIRECTORY || ONLY.length === 0)
{
    console.error('usage: furni-lights <ambreia dir> --only=<furni>[,<furni>…] [--key-file=<file>] [--overrides=<json>] [--state-dir=.ambreia-build]');
    process.exit(2);
}

const {layout, dictionary, fileOf, readPiece, sheetOf} = await openAmbreia(DIRECTORY, KEY_FILE);

/**
 * The colour a region of the sheet lights with (its pixels weighted by opacity and by the cube of
 * their brightness, raised to full brightness) and how bright it is (0..1); null when it is empty.
 */
function measure(sheet: IRgba, frame: {x: number; y: number; w: number; h: number}): {color: number; level: number} | null
{
    let r = 0;
    let g = 0;
    let b = 0;
    let weight = 0;
    let bright = 0;
    let opaque = 0;

    for(let y = frame.y; y < frame.y + frame.h; y++)
    {
        for(let x = frame.x; x < frame.x + frame.w; x++)
        {
            const i = (y * sheet.width + x) * 4;
            const a = sheet.data[i + 3] / 255;
            const v = Math.max(sheet.data[i], sheet.data[i + 1], sheet.data[i + 2]) / 255;
            const w = a * v * v * v;

            r += sheet.data[i] * w;
            g += sheet.data[i + 1] * w;
            b += sheet.data[i + 2] * w;
            weight += w;
            bright += a * v;
            opaque += a;
        }
    }

    const top = Math.max(r, g, b);

    if(weight === 0 || top === 0 || opaque === 0) return null;

    return {
        color: (Math.round(r / top * 255) << 16) | (Math.round(g / top * 255) << 8) | Math.round(b / top * 255),
        level: Math.round(bright / opaque * 1000) / 1000
    };
}

/** The `lights` entry for a furni, or null when nothing in it gives light. */
async function lightsOf(name: string, manifest: Json, images: IPieceImage[]): Promise<Json | null>
{
    const override = OVERRIDES[name] ?? {};

    if(override.none) return null;

    const visualization = (manifest.visualizations as Json[] | undefined)?.find(v => v.size === SIZE);
    const layers = (visualization?.layers ?? {}) as Record<string, {ink?: string}>;
    const letters = new Set((override.layer ?? '').split('').filter(Boolean));

    for(const [index, layer] of Object.entries(layers))
    {
        if(layer.ink?.toUpperCase() === 'ADD') letters.add(String.fromCharCode(97 + Number(index)));
    }

    if(letters.size === 0) return null;

    // With `states`, the frames those states' animations show, per layer letter: the images a furni
    // shows only when it is off give no light.
    const shown = new Map<string, Set<number>>();
    const animations = (visualization?.animations ?? {}) as Record<string, {layers?: Record<string, {frameSequences?: Record<string, {frames?: Record<string, {id: number}>}>}>}>;

    for(const state of override.states ?? [])
    {
        for(const [index, layer] of Object.entries(animations[String(state)]?.layers ?? {}))
        {
            const letter = String.fromCharCode(97 + Number(index));
            const frames = shown.get(letter) ?? new Set<number>();

            for(const sequence of Object.values(layer.frameSequences ?? {})) for(const frame of Object.values(sequence.frames ?? {})) frames.add(frame.id);

            shown.set(letter, frames);
        }
    }

    const assets = manifest.assets as Record<string, {x?: number; y?: number; source?: string; flipH?: boolean}>;
    const frames = (manifest.spritesheet as {frames: Record<string, {frame: {x: number; y: number; w: number; h: number}}>}).frames;
    const sheet = await sheetOf(images);
    const lights: Record<string, Json> = {};
    const pattern = new RegExp(`^${name}_${SIZE}_([a-z])_\\d+_\\d+$`);

    for(const [key, asset] of Object.entries(assets))
    {
        const match = pattern.exec(key);

        if(!match || !letters.has(match[1])) continue;

        if(override.states && !shown.get(match[1])?.has(Number(key.slice(key.lastIndexOf('_') + 1)))) continue;

        const region = frames[`${name}_${asset.source ?? key}`]?.frame;

        if(!region) continue;

        const measured = measure(sheet, region);

        if(measured === null) continue;

        // The image is drawn with its top-left at (-x, -y) from the furni's origin (mirrored when
        // flipped). Its centre, in tiles: across the screen it moves along x - y, up it rises.
        const left = asset.flipH ? (asset.x ?? 0) - region.w : -(asset.x ?? 0);
        const centreX = left + region.w / 2;
        const centreY = -(asset.y ?? 0) + region.h / 2;

        lights[key] = {
            color: measured.color,
            level: measured.level,
            x: Math.round(centreX / SIZE * 1000) / 1000,
            y: Math.round(-centreX / SIZE * 1000) / 1000,
            z: Math.round(-centreY / (SIZE / 2) * 1000) / 1000
        };
    }

    if(Object.keys(lights).length === 0) return null;

    // A level against the brightest image of the same direction (each is drawn on its own, a
    // direction can be lit brighter than the other): a dim frame gives little, a bright one all.
    const brightest = new Map<string, number>();
    const directionOf = (key: string): string => key.split('_').slice(-2, -1)[0];

    for(const [key, light] of Object.entries(lights)) brightest.set(directionOf(key), Math.max(brightest.get(directionOf(key)) ?? 0, light.level as number));

    for(const [key, light] of Object.entries(lights)) light.level = Math.round((light.level as number) / brightest.get(directionOf(key))! * 1000) / 1000;

    return {
        radius: override.radius ?? DEFAULT_RADIUS,
        intensity: override.intensity ?? DEFAULT_INTENSITY,
        ...(override.spread !== undefined ? {spread: override.spread} : {}),
        frames: lights
    };
}

const backup = path.join(STATE_DIR, 'lights-backup');

fs.mkdirSync(backup, {recursive: true});

for(const name of ONLY)
{
    const file = await fileOf({kind: 'piece', name});

    if(!fs.existsSync(file))
    {
        console.error(`${name}: no piece in ${DIRECTORY}`);
        process.exitCode = 1;
        continue;
    }

    const {manifest, images, dictionaryId} = await readPiece(name);
    const lights = await lightsOf(name, manifest, images);
    // A rerun replaces the furni's lights; they go last, after the keys the .nitro had.
    const updated: Json = Object.fromEntries(Object.entries(manifest).filter(([key]) => key !== 'lights'));

    if(lights !== null) updated.lights = lights;

    if(!fs.existsSync(path.join(backup, `${name}.ambreia`))) fs.copyFileSync(file, path.join(backup, `${name}.ambreia`));

    const bytes = encodePiece({dictionaryId, manifest: compressManifest(updated, dictionary), images}, name);
    const sealed = await layout.seal({kind: 'piece', name}, bytes);

    fs.writeFileSync(`${file}.tmp`, sealed);
    fs.renameSync(`${file}.tmp`, file);

    const check = await readPiece(name);

    if(JSON.stringify(check.manifest) !== JSON.stringify(updated))
    {
        console.error(`${name}: read back differs — restored from ${backup}`);
        fs.copyFileSync(path.join(backup, `${name}.ambreia`), file);
        process.exitCode = 1;
        continue;
    }

    const count = lights === null ? 0 : Object.keys(lights.frames as Json).length;

    console.log(`${name}: ${count === 0 ? 'no light' : `${count} light images`}`);
}
