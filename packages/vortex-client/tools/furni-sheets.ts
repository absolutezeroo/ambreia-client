#!/usr/bin/env tsx
/**
 * Writes out furni pieces of an .ambreia directory as a spritesheet and the list of its images, for
 * tools that work image by image (furni-normals/height_normals.py --sheets): every frame of every
 * layer and direction, so an animated furni gets maps for each of its frames.
 *
 *   pnpm --filter vortex-client exec tsx tools/furni-sheets.ts <ambreia dir> <out dir> --only=tv_luxus[,…] [--key-file=<file>]
 *
 * <out dir>/<furni>/sheet.png is the piece's sheet as it is; frames.json lists each image's place in
 * it, and `skip` for those that are no surface: the shadow (`sd`) and the layers drawn additively (a
 * glow).
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {openAmbreia} from './lib/ambreia-pieces';
import type {Json} from './lib/ambreia-pieces';

const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const flag = (name: string, fallback: string): string => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const [DIRECTORY, OUT] = args;
const ONLY = flag('only', '').split(',').filter(Boolean);

if(!DIRECTORY || !OUT || ONLY.length === 0)
{
    console.error('usage: furni-sheets <ambreia dir> <out dir> --only=<furni>[,<furni>…] [--key-file=<file>]');
    process.exit(2);
}

const {fileOf, readPiece, sheetOf} = await openAmbreia(DIRECTORY, flag('key-file', ''));

for(const name of ONLY)
{
    if(!fs.existsSync(await fileOf({kind: 'piece', name})))
    {
        console.error(`${name}: no piece in ${DIRECTORY}`);
        process.exitCode = 1;
        continue;
    }

    const {manifest, images} = await readPiece(name);
    const sheet = await sheetOf(images);
    const frames = (manifest.spritesheet as {frames: Record<string, {frame: {x: number; y: number; w: number; h: number}}>}).frames;
    const assets = manifest.assets as Record<string, {source?: string}>;
    const inks = new Map<string, string>();

    for(const visualization of (manifest.visualizations as Json[] | undefined) ?? [])
    {
        for(const [index, layer] of Object.entries((visualization.layers ?? {}) as Record<string, {ink?: string}>))
        {
            inks.set(`${String(visualization.size)}_${String.fromCharCode(97 + Number(index))}`, layer.ink?.toUpperCase() ?? '');
        }
    }

    // <name>_<size>_<layer>_<direction>_<frame>: the layer says what the image is.
    const pattern = new RegExp(`^${name}_(\\d+)_([a-z]+)_\\d+_\\d+$`);
    const out: {name: string; x: number; y: number; w: number; h: number; skip: boolean}[] = [];

    for(const [key, asset] of Object.entries(assets))
    {
        const match = pattern.exec(key);
        const region = frames[`${name}_${asset.source ?? key}`]?.frame;

        if(!match || !region) continue;

        out.push({name: key, ...region, skip: match[2] === 'sd' || inks.get(`${match[1]}_${match[2]}`) === 'ADD'});
    }

    const folder = path.join(OUT, name);

    fs.mkdirSync(folder, {recursive: true});
    await sharp(sheet.data, {raw: {width: sheet.width, height: sheet.height, channels: 4}}).png().toFile(path.join(folder, 'sheet.png'));
    fs.writeFileSync(path.join(folder, 'frames.json'), JSON.stringify(out, null, 1));
    console.log(`${name}: ${out.length} images, ${out.filter(frame => frame.skip).length} skipped`);
}
