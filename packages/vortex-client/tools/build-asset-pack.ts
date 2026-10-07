#!/usr/bin/env tsx
/**
 * Builds an .ambreia pack from a folder of .nitro bundles (plan docs/superpowers/plans/2026-10-08-asset-packs.md).
 *
 *   pnpm --filter vortex-client build:pack <input folder> <output.ambreia> [--kind=clothing] [--max] [--workers=2]
 *
 * Lossless, and checked rather than assumed:
 * - every PNG becomes lossless WebP only if the WebP decodes to the same alpha everywhere and the
 *   same colour wherever alpha > 0 (a fully transparent pixel never shows: the renderer
 *   premultiplies). An image that fails stays PNG, byte for byte;
 * - every manifest is decoded back from the pack bytes and compared to the source JSON;
 * - at the end the written pack is opened with the client's own reader, every piece read back and
 *   compared. Any difference: exit code 1, and the pack is left as `.failed`.
 *
 * Unreadable bundles (an HTML error page saved as .nitro, a truncated file) are skipped and listed in
 * the report written next to the pack (`<output>.report.json`).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {AssetPackWriter, inflateManifest} from '@ambreia/common/assets/pack/AssetPackFormat';
import type {IPackImageInput} from '@ambreia/common/assets/pack/AssetPackFormat';
import {decodeManifest, encodeManifest} from '@ambreia/common/assets/pack/ManifestCodec';
import type {IEncodedManifest} from '@ambreia/common/assets/pack/ManifestCodec';
import {AssetPack} from '@ambreia/common/assets/pack/AssetPack';

const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const flag = (name: string, fallback: string): string => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const [INPUT, OUTPUT] = args;

if(!INPUT || !OUTPUT)
{
    console.error('usage: build-asset-pack <input folder> <output.ambreia> [--kind=clothing] [--max] [--workers=2]');
    process.exit(2);
}

const KIND = flag('kind', path.basename(OUTPUT).replace(/\.ambreia$/, ''));
// --max: libwebp's densest lossless setting, ~3 % smaller and ~30x slower. A release build.
const QUALITY = process.argv.includes('--max') ? 100 : 80;
const WORKERS = Number(flag('workers', '2'));
const DICTIONARY_SIZE = 32 * 1024;

sharp.cache(false);
sharp.concurrency(1);

interface IBundleFile
{
    name: string;
    data: Buffer;
}

function listBundles(dir: string): string[]
{
    const out: string[] = [];

    for(const entry of fs.readdirSync(dir, {withFileTypes: true}))
    {
        const full = path.join(dir, entry.name);

        if(entry.isDirectory()) out.push(...listBundles(full));
        else if(entry.name.endsWith('.nitro')) out.push(full);
    }

    return out.sort();
}

/** The files of a .nitro (entries are zlib or gzip), or the reason it cannot be read. */
function readBundle(file: string): IBundleFile[] | string
{
    const buffer = fs.readFileSync(file);

    if(buffer.subarray(0, 64).toString('utf8').trimStart().startsWith('<')) return 'an HTML page, not a bundle (failed download)';

    try
    {
        const files: IBundleFile[] = [];
        let offset = 0;
        let count = buffer.readInt16BE(offset);

        offset += 2;

        while(count-- > 0)
        {
            const nameLength = buffer.readInt16BE(offset);
            const name = buffer.toString('utf8', offset + 2, offset + 2 + nameLength);

            offset += 2 + nameLength;

            const dataLength = buffer.readInt32BE(offset);

            files.push({name, data: zlib.unzipSync(buffer.subarray(offset + 4, offset + 4 + dataLength))});
            offset += 4 + dataLength;
        }

        return files;
    }
    catch (error)
    {
        return (error as Error).message;
    }
}

async function pixels(image: Buffer): Promise<{data: Buffer; width: number; height: number}>
{
    const {data, info} = await sharp(image, {limitInputPixels: false}).ensureAlpha().raw().toBuffer({resolveWithObject: true});

    return {data, width: info.width, height: info.height};
}

/** Lossless WebP of `png`, or null when it would not show the same pixels. */
async function toWebp(png: Buffer): Promise<Buffer | null>
{
    try
    {
        const webp = await sharp(png, {limitInputPixels: false}).webp({lossless: true, effort: 6, quality: QUALITY}).toBuffer();
        const [a, b] = await Promise.all([pixels(png), pixels(webp)]);

        if(a.width !== b.width || a.height !== b.height) return null;

        for(let i = 0; i < a.data.length; i += 4)
        {
            if(a.data[i + 3] !== b.data[i + 3]) return null;
            if(a.data[i + 3] !== 0 && (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2])) return null;
        }

        return webp;
    }
    catch
    {
        return null;
    }
}

const sha1 = (data: Buffer): string => crypto.createHash('sha1').update(data).digest('hex');
const canonical = (json: Buffer): string => JSON.stringify(JSON.parse(json.toString('utf8')));
const megabytes = (bytes: number): string => `${(bytes / 1e6).toFixed(1)} MB`;

const started = Date.now();
const bundles = listBundles(INPUT);
const report = {
    kind: KIND, input: INPUT, output: OUTPUT, quality: QUALITY,
    bundles: bundles.length, pieces: 0, images: 0, imagesShared: 0, inputBytes: 0, outputBytes: 0,
    webpBytes: 0, pngKept: [] as string[], unreadable: [] as Array<{file: string; reason: string}>,
    duplicateNames: [] as string[], seconds: 0
};

// 1. The manifests' deflate dictionary: the tail of a spread sample (zlib favours the end of it).
const sample: string[] = [];

for(let i = 0; i < bundles.length; i += Math.max(1, Math.floor(bundles.length / 400)))
{
    const files = readBundle(bundles[i]);
    const json = typeof files === 'string' ? null : files.find(file => file.name.endsWith('.json'));

    if(json) sample.push(JSON.stringify(encodeManifest(JSON.parse(json.data.toString('utf8')))));
}

const dictionary = new Uint8Array(Buffer.from(sample.join('')).subarray(-DICTIONARY_SIZE));

// 2. The data, written as it is produced; the head goes in front at the end.
const dataPath = `${OUTPUT}.data.tmp`;

fs.mkdirSync(path.dirname(path.resolve(OUTPUT)), {recursive: true});

const dataFd = fs.openSync(dataPath, 'w');
const writer = new AssetPackWriter(KIND, dictionary, chunk => { fs.writeSync(dataFd, chunk); report.outputBytes += chunk.length; });
const sourceManifests = new Map<string, string>(); // name → sha1 of the canonical JSON, for the read-back
const sourceImages = new Map<string, string>(); // `${name}/${entry}` → sha1 of what the pack must return
const converted = new Map<string, Promise<{bytes: Buffer; ext: 'webp' | 'png'}>>();
const seenNames = new Set<string>();
let failures = 0;

const convert = (key: string, png: Buffer): Promise<{bytes: Buffer; ext: 'webp' | 'png'}> =>
{
    let pending = converted.get(key);

    if(!pending)
    {
        pending = toWebp(png).then(webp => (webp ? {bytes: webp, ext: 'webp' as const} : {bytes: png, ext: 'png' as const}));
        converted.set(key, pending);
    }

    return pending;
};

for(let start = 0; start < bundles.length; start += WORKERS * 8)
{
    const batch = bundles.slice(start, start + WORKERS * 8).map(file => ({file, name: path.basename(file, '.nitro'), files: readBundle(file)}));
    const queue: Array<() => Promise<unknown>> = [];

    for(const bundle of batch)
    {
        if(typeof bundle.files === 'string') continue;

        for(const image of bundle.files.filter(file => file.name.endsWith('.png')))
        {
            const key = sha1(image.data);

            if(!converted.has(key)) queue.push(() => convert(key, image.data));
        }
    }

    // A few conversions at a time: each holds two decoded images in memory.
    for(let i = 0; i < queue.length; i += WORKERS) await Promise.all(queue.slice(i, i + WORKERS).map(run => run()));

    for(const bundle of batch)
    {
        report.inputBytes += fs.statSync(bundle.file).size;

        if(typeof bundle.files === 'string')
        {
            report.unreadable.push({file: path.relative(INPUT, bundle.file), reason: bundle.files});
            continue;
        }

        if(seenNames.has(bundle.name))
        {
            report.duplicateNames.push(path.relative(INPUT, bundle.file));
            continue;
        }

        const json = bundle.files.find(file => file.name.endsWith('.json'));

        if(!json)
        {
            report.unreadable.push({file: path.relative(INPUT, bundle.file), reason: 'no manifest in the bundle'});
            continue;
        }

        seenNames.add(bundle.name);

        const images: IPackImageInput[] = [];

        for(const image of bundle.files.filter(file => file.name.endsWith('.png')))
        {
            const key = sha1(image.data);
            const done = await convert(key, image.data);
            const fresh = !writer.hasImage(key);

            if(fresh)
            {
                report.images++;
                if(done.ext === 'webp') report.webpBytes += done.bytes.length;
                else report.pngKept.push(`${bundle.name}/${image.name}`);
            }
            else report.imagesShared++;

            images.push({entryName: image.name, key, ext: done.ext, bytes: () => new Uint8Array(done.bytes)});
            sourceImages.set(`${bundle.name}/${image.name}`, sha1(done.bytes));
        }

        const manifest = JSON.parse(json.data.toString('utf8')) as Record<string, unknown>;
        const compressed = writer.addItem(bundle.name, manifest, images);
        const back = JSON.stringify(decodeManifest(JSON.parse(new TextDecoder().decode(inflateManifest(compressed, dictionary))) as IEncodedManifest));

        if(back !== canonical(json.data))
        {
            failures++;
            console.error(`manifest of ${bundle.name} does not survive the pack`);
        }

        sourceManifests.set(bundle.name, sha1(Buffer.from(back)));
        report.pieces++;
    }

    if(Math.floor(start / 2000) !== Math.floor((start + WORKERS * 8) / 2000)) console.log(`${Math.min(start + WORKERS * 8, bundles.length)}/${bundles.length}  ${megabytes(report.outputBytes)} so far`);

    // The conversions of this batch are written: drop them, keep only that their key was seen.
    for(const key of [...converted.keys()]) if(writer.hasImage(key)) converted.delete(key);
}

fs.closeSync(dataFd);

// 3. Head in front of the data.
const head = writer.finish();
const output = fs.openSync(`${OUTPUT}.tmp`, 'w');

fs.writeSync(output, head);

const chunk = Buffer.alloc(8 * 1024 * 1024);
const dataIn = fs.openSync(dataPath, 'r');

for(let read; (read = fs.readSync(dataIn, chunk, 0, chunk.length, null)) > 0;) fs.writeSync(output, chunk, 0, read);

fs.closeSync(dataIn);
fs.closeSync(output);
fs.rmSync(dataPath);
report.outputBytes += head.length;

// 4. Read every piece back through the client's reader.
const packFd = fs.openSync(`${OUTPUT}.tmp`, 'r');
const pack = new AssetPack(OUTPUT, async (_url, from, to) =>
{
    const bytes = Buffer.alloc(to - from + 1);

    fs.readSync(packFd, bytes, 0, bytes.length, from);

    return new Uint8Array(bytes);
});

for(const [name, manifestHash] of sourceManifests)
{
    const files = await pack.read(name);

    if(!files || sha1(Buffer.from(files[0].data)) !== manifestHash)
    {
        failures++;
        console.error(`read-back: manifest of ${name} differs`);
        continue;
    }

    for(const file of files.slice(1))
    {
        const entry = file.name.replace(/\.webp$/, '.png');

        if(sourceImages.get(`${name}/${entry}`) !== sha1(Buffer.from(file.data)))
        {
            failures++;
            console.error(`read-back: image ${name}/${entry} differs`);
        }
    }
}

fs.closeSync(packFd);
fs.renameSync(`${OUTPUT}.tmp`, failures > 0 ? `${OUTPUT}.failed` : OUTPUT);

report.seconds = Math.round((Date.now() - started) / 1000);
fs.writeFileSync(`${OUTPUT}.report.json`, JSON.stringify(report, null, 1));

console.log(`${KIND}: ${report.pieces} pieces, ${report.images} images (${report.imagesShared} shared), ${megabytes(report.inputBytes)} → ${megabytes(report.outputBytes)} `
    + `(${((1 - report.outputBytes / report.inputBytes) * 100).toFixed(1)} % smaller), ${report.pngKept.length} kept as PNG, ${report.unreadable.length} unreadable, ${report.seconds} s`);

if(failures > 0)
{
    console.error(`${failures} difference(s): the pack is left as ${OUTPUT}.failed`);
    process.exit(1);
}
