#!/usr/bin/env tsx
/**
 * Builds an .ambreia directory from a folder of .nitro bundles: one optimised `<name>.ambreia` per
 * bundle (plan docs/superpowers/plans/2026-10-08-asset-packs.md, revision).
 *
 *   pnpm --filter vortex-client build:ambreia <input folder> <output folder> [--key-file=<file>] [--kind=furniture] [--max] [--force] [--workers=2]
 *
 * --key-file encrypts the directory (AES-256-GCM per file, names nobody can guess; AmbreiaLayout). The
 * file holds the 32-byte master key in base64url and is created when missing — keep it out of
 * anything served: whoever has it reads every piece.
 *
 * Lossless, and checked rather than assumed:
 * - every PNG becomes lossless WebP only if the WebP decodes to the same alpha everywhere and the
 *   same colour wherever alpha > 0 (a fully transparent pixel never shows: the renderer
 *   premultiplies). An image that fails stays PNG, byte for byte;
 * - every manifest is decoded back and compared to the source JSON;
 * - every piece written is read back through the client's own reader and compared.
 * Any difference: exit code 1.
 *
 * Incremental: a piece whose .nitro has the same digest as at its last build is kept (and checked
 * again), the directory's dictionary and key are reused, an image already in `images/` is
 * referenced. `--force` rebuilds every piece with a new dictionary; a change of key or of encryption
 * needs an empty output, so nothing readable is left behind. An image used by two pieces or more goes
 * to `images/<sha1>` once; any other lives inside its piece (one request).
 *
 * The build state (`<kind>.sources.json`: digest of each .nitro) and the report (`<kind>.report.json`,
 * with the unreadable bundles) go to --state-dir (default `.ambreia-build/` in the working
 * directory), never into the served output.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {compressManifest, encodePiece, inflateManifest} from '@ambreia/common/assets/pack/AmbreiaPiece';
import type {IPieceImage} from '@ambreia/common/assets/pack/AmbreiaPiece';
import {decodeManifest, encodeManifest} from '@ambreia/common/assets/pack/ManifestCodec';
import type {IEncodedManifest} from '@ambreia/common/assets/pack/ManifestCodec';
import {AmbreiaDirectory} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import type {IAmbreiaDescriptor} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import {decodeMasterKey, encodeMasterKey, encryptedLayout, generateMasterKey, plainLayout} from '@ambreia/common/assets/pack/AmbreiaLayout';
import type {IAmbreiaLayout, LogicalPath} from '@ambreia/common/assets/pack/AmbreiaLayout';

const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const flag = (name: string, fallback: string): string => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const [INPUT, OUTPUT] = args;

if(!INPUT || !OUTPUT)
{
    console.error('usage: build-ambreia <input folder> <output folder> [--key-file=<file>] [--kind=furniture] [--max] [--force] [--workers=2]');
    process.exit(2);
}

const KIND = flag('kind', path.basename(path.resolve(OUTPUT)));
// --max: libwebp's densest lossless setting, ~3 % smaller and ~30x slower. A release build.
const QUALITY = process.argv.includes('--max') ? 100 : 80;
const FORCE = process.argv.includes('--force');
const WORKERS = Number(flag('workers', '2'));
const KEY_FILE = flag('key-file', '');
const STATE_DIR = flag('state-dir', '.ambreia-build');

if(process.argv.includes('--key-file') || process.argv.includes('--state-dir'))
{
    console.error('write --key-file=<file> and --state-dir=<dir>, with "="');
    process.exit(2);
}

if(!(WORKERS >= 1))
{
    console.error('--workers must be 1 or more');
    process.exit(2);
}
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

        const json = files.find(file => file.name.endsWith('.json'));

        if(!json) return 'no manifest in the bundle';

        JSON.parse(json.data.toString('utf8')); // an invalid manifest is a reason, not a crash later

        return files;
    }
    catch (error)
    {
        return (error as Error).message;
    }
}

async function pixels(image: Buffer): Promise<{data: Buffer; width: number; height: number}>
{
    // sRGB, 8 bits, RGBA whatever the source (greyscale, 16 bits): the comparison reads 4 bytes a pixel.
    const {data, info} = await sharp(image, {limitInputPixels: false}).toColourspace('srgb').ensureAlpha().raw({depth: 'uchar'}).toBuffer({resolveWithObject: true});

    if(info.channels !== 4) throw new Error(`${info.channels} channels after conversion`);

    return {data, width: info.width, height: info.height};
}

/** Lossless WebP of `png`, or the PNG itself when the WebP would not show the same pixels. */
async function optimise(png: Buffer): Promise<{bytes: Buffer; format: 'webp' | 'png'}>
{
    try
    {
        const webp = await sharp(png, {limitInputPixels: false}).webp({lossless: true, effort: 6, quality: QUALITY}).toBuffer();
        const [a, b] = await Promise.all([pixels(png), pixels(webp)]);

        if(a.width !== b.width || a.height !== b.height) return {bytes: png, format: 'png'};

        for(let i = 0; i < a.data.length; i += 4)
        {
            if(a.data[i + 3] !== b.data[i + 3]) return {bytes: png, format: 'png'};
            if(a.data[i + 3] !== 0 && (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2])) return {bytes: png, format: 'png'};
        }

        return {bytes: webp, format: 'webp'};
    }
    catch
    {
        return {bytes: png, format: 'png'};
    }
}

const sha1 = (data: Uint8Array): string => crypto.createHash('sha1').update(data).digest('hex');
const canonical = (json: Buffer): string => JSON.stringify(JSON.parse(json.toString('utf8')));
const megabytes = (bytes: number): string => `${(bytes / 1e6).toFixed(1)} MB`;
const writeAtomic = (file: string, bytes: Uint8Array): void => { fs.writeFileSync(`${file}.tmp`, bytes); fs.renameSync(`${file}.tmp`, file); };

const started = Date.now();
const bundles = listBundles(INPUT);
const report = {
    kind: KIND, input: INPUT, output: OUTPUT, quality: QUALITY,
    bundles: bundles.length, written: 0, upToDate: 0, sharedImages: 0, inputBytes: 0, outputBytes: 0,
    pngKept: [] as string[], unreadable: [] as Array<{file: string; reason: string}>, duplicateNames: [] as string[], seconds: 0
};

fs.mkdirSync(path.join(OUTPUT, 'images'), {recursive: true});
fs.mkdirSync(path.join(OUTPUT, 'dictionary'), {recursive: true});

/** The master key in KEY_FILE, created when the file does not exist — never inside the output. */
function masterKey(): Uint8Array
{
    const relative = path.relative(path.resolve(OUTPUT), path.resolve(KEY_FILE));

    // Inside: empty, or a relative path that does not climb out (another drive gives an absolute one).
    if(relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`)))
    {
        console.error(`--key-file must not be inside ${OUTPUT}: the key would be served with the files it protects`);
        process.exit(2);
    }

    if(fs.existsSync(KEY_FILE)) return decodeMasterKey(fs.readFileSync(KEY_FILE, 'utf8'));

    const key = generateMasterKey();

    fs.mkdirSync(path.dirname(path.resolve(KEY_FILE)), {recursive: true});
    fs.writeFileSync(KEY_FILE, `${encodeMasterKey(key)}\n`, {mode: 0o600});
    console.log(`new master key written to ${KEY_FILE}`);

    return key;
}

const layout: IAmbreiaLayout = KEY_FILE ? await encryptedLayout(masterKey()) : plainLayout();
const fileOf = async (logical: LogicalPath): Promise<string> => path.join(OUTPUT, ...(await layout.path(logical)).split('/'));
const writeSealed = async (logical: LogicalPath, bytes: Uint8Array): Promise<void> => writeAtomic(await fileOf(logical), await layout.seal(logical, bytes));
const readOpened = async (logical: LogicalPath): Promise<Buffer | null> =>
{
    const file = await fileOf(logical);

    return fs.existsSync(file) ? Buffer.from(await layout.open(logical, new Uint8Array(fs.readFileSync(file)))) : null;
};

const descriptorPath = path.join(OUTPUT, 'ambreia.json');
const existing = fs.existsSync(descriptorPath) ? JSON.parse(fs.readFileSync(descriptorPath, 'utf8')) as IAmbreiaDescriptor : null;
const previous = FORCE ? null : existing;

// Over a build with another key (or none), the old files would stay served next to the new ones:
// readable, under guessable names. Not even with --force: an empty output, or the same key.
if(existing && (Boolean(existing.encrypted) !== layout.encrypted || (existing.keyId ?? null) !== layout.keyId))
{
    console.error(`${OUTPUT} was built ${existing.encrypted ? `with key ${existing.keyId}` : 'without a key'}, this run ${layout.encrypted ? `uses key ${layout.keyId}` : 'has none'}: `
        + 'build into an empty folder (and delete the old one once the new one is served)');
    process.exit(2);
}

// The digest of each .nitro at its last build: what "up to date" means (a copy keeps old mtimes).
fs.mkdirSync(STATE_DIR, {recursive: true});

const statePath = path.join(STATE_DIR, `${KIND}.sources.json`);
const state = !FORCE && fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) as {keyId: string | null; dictionary: string; sources: Record<string, string>} : null;
const sources: Record<string, string> = {};
const digests = new Map<string, string>();

// 1. Count the uses of every image (shared ones go to images/), and sample manifests for the dictionary.
const uses = new Map<string, number>();
const sample: string[] = [];
const sampleEvery = Math.max(1, Math.floor(bundles.length / 400));

for(const [i, file] of bundles.entries())
{
    digests.set(file, sha1(fs.readFileSync(file)));

    const files = readBundle(file);

    if(typeof files === 'string') continue;

    for(const image of files.filter(entry => entry.name.endsWith('.png'))) uses.set(sha1(image.data), (uses.get(sha1(image.data)) ?? 0) + 1);

    if(!previous && i % sampleEvery === 0) sample.push(JSON.stringify(encodeManifest(JSON.parse(files.find(entry => entry.name.endsWith('.json'))!.data.toString('utf8')))));
}


// 2. The manifests' dictionary: kept from the previous build, or the tail of a spread sample.
let dictionaryId: string;
let dictionary: Uint8Array;

if(previous)
{
    dictionaryId = previous.dictionary;
    const stored = await readOpened({kind: 'dictionary', id: dictionaryId});

    if(!stored)
    {
        console.error(`${OUTPUT}: the dictionary ${dictionaryId} named by ambreia.json is missing — rebuild with --force`);
        process.exit(1);
    }

    dictionary = new Uint8Array(stored);
}
else
{
    dictionary = new Uint8Array(Buffer.from(sample.join('')).subarray(-DICTIONARY_SIZE));
    dictionaryId = sha1(dictionary).slice(0, 16);
    await writeSealed({kind: 'dictionary', id: dictionaryId}, dictionary);
}

// Format and digest only: a piece points at a shared image, it never carries its bytes.
const sharedImages = new Map<string, Promise<{format: 'webp' | 'png'; digest: string}>>();

/** A shared image already in images/ (from an earlier build), its format read off its bytes. */
async function storedImage(key: string): Promise<{format: 'webp' | 'png'; digest: string} | null>
{
    for(const format of ['webp', 'png'] as const)
    {
        const bytes = await readOpened({kind: 'image', sha1: key, format});

        if(bytes) return {format: bytes.subarray(0, 4).toString('latin1') === 'RIFF' ? 'webp' : 'png', digest: sha1(bytes)};
        if(layout.encrypted) break; // one name whatever the format
    }

    return null;
}

/** One conversion per shared image, whichever worker meets it first; reused from images/ if there. */
const sharedImage = (key: string, png: Buffer, where: string): Promise<{format: 'webp' | 'png'; digest: string}> =>
{
    let pending = sharedImages.get(key);

    if(!pending)
    {
        pending = storedImage(key).then(stored => stored ?? optimise(png).then(async (result) =>
        {
            await writeSealed({kind: 'image', sha1: key, format: result.format}, result.bytes);
            report.sharedImages++;
            if(result.format === 'png') report.pngKept.push(where);

            return {format: result.format, digest: sha1(result.bytes)};
        }));
        sharedImages.set(key, pending);
    }

    return pending;
};

// Written now, not at the end: a run that is stopped resumes from what it wrote, with this dictionary.
writeAtomic(descriptorPath, Buffer.from(JSON.stringify({v: 1, kind: KIND, dictionary: dictionaryId, encrypted: layout.encrypted, keyId: layout.keyId} satisfies IAmbreiaDescriptor)));

// 3. The pieces, a few bundles' images converted at a time (each conversion holds two decoded images).
const seen = new Set<string>();
const written: Array<{name: string; manifest: string; images: Map<string, string>}> = [];
const kept: Array<{name: string; file: string}> = [];
let failures = 0;

for(let start = 0; start < bundles.length; start += WORKERS * 4)
{
    const batch = bundles.slice(start, start + WORKERS * 4);

    await Promise.all(Array.from({length: WORKERS}, async (_, worker) =>
    {
        for(let i = worker; i < batch.length; i += WORKERS)
        {
            const file = batch[i];
            const name = path.basename(file, '.nitro');
            const target = await fileOf({kind: 'piece', name});
            const relative = path.relative(INPUT, file);

            report.inputBytes += fs.statSync(file).size;

            if(seen.has(name))
            {
                report.duplicateNames.push(relative);
                continue;
            }

            seen.add(name);

            const fresh = state !== null && state.keyId === layout.keyId && state.dictionary === dictionaryId && state.sources[name] === digests.get(file);

            if(fresh && fs.existsSync(target))
            {
                sources[name] = digests.get(file)!;
                report.upToDate++;
                kept.push({name, file});
                continue;
            }

            const files = readBundle(file);

            if(typeof files === 'string')
            {
                report.unreadable.push({file: relative, reason: files});
                continue;
            }

            const json = files.find(entry => entry.name.endsWith('.json'))!;
            const images: IPieceImage[] = [];
            const expected = new Map<string, string>();

            for(const image of files.filter(entry => entry.name.endsWith('.png')))
            {
                const key = sha1(image.data);
                const shared = (uses.get(key) ?? 0) > 1 || sharedImages.has(key) || (await storedImage(key)) !== null;
                if(shared)
                {
                    const {format, digest} = await sharedImage(key, image.data, `${name}/${image.name}`);

                    images.push({entryName: image.name, format, shared: key});
                    expected.set(image.name, digest);
                    continue;
                }

                const {format, bytes} = await optimise(image.data);

                if(format === 'png') report.pngKept.push(`${name}/${image.name}`);

                images.push({entryName: image.name, format, bytes});
                expected.set(image.name, sha1(bytes));
            }

            const compressed = compressManifest(JSON.parse(json.data.toString('utf8')), dictionary);
            const back = JSON.stringify(decodeManifest(JSON.parse(new TextDecoder().decode(inflateManifest(compressed, dictionary))) as IEncodedManifest));

            if(back !== canonical(json.data))
            {
                failures++;
                console.error(`manifest of ${name} does not survive the encoding`);
                continue;
            }

            await writeSealed({kind: 'piece', name}, encodePiece({dictionaryId, manifest: compressed, images}, name));
            sources[name] = digests.get(file)!;
            written.push({name, manifest: sha1(Buffer.from(back)), images: expected});
            report.written++;
        }
    }));

    if(Math.floor(start / 5000) !== Math.floor((start + WORKERS * 4) / 5000)) console.log(`${Math.min(start + WORKERS * 4, bundles.length)}/${bundles.length}`);
}


// 4. Read every piece written back through the client's reader.
const reader = new AmbreiaDirectory(path.resolve(OUTPUT), async url =>
{
    const file = decodeURIComponent(url);

    return fs.existsSync(file) ? new Uint8Array(fs.readFileSync(file)) : null;
}, layout);

for(const piece of written)
{
    const files = await reader.read(piece.name).catch((error: unknown) =>
    {
        console.error(`read-back: ${piece.name}: ${String((error as Error | null)?.message ?? error)}`);

        return null;
    });

    if(!files || sha1(files[0].data) !== piece.manifest)
    {
        failures++;
        console.error(`read-back: manifest of ${piece.name} differs`);
        continue;
    }

    for(const file of files.slice(1))
    {
        const entry = file.name.replace(/\.webp$/, '.png');

        if(piece.images.get(entry) !== sha1(file.data))
        {
            failures++;
            console.error(`read-back: image ${piece.name}/${entry} differs`);
        }
    }
}

// Kept pieces: they must still open with this key and dictionary and give their source's manifest.
for(const piece of kept)
{
    const source = readBundle(piece.file);
    const json = typeof source === 'string' ? null : source.find(entry => entry.name.endsWith('.json'));

    try
    {
        const files = await reader.read(piece.name);

        if(!files || !json || new TextDecoder().decode(files[0].data) !== canonical(json.data)) throw new Error('manifest differs');
    }
    catch (error)
    {
        failures++;
        console.error(`read-back: kept piece ${piece.name}: ${(error as Error).message}`);
    }
}

const sizeOf = (dir: string): number => fs.readdirSync(dir, {withFileTypes: true}).reduce((total, entry) => total + (entry.isDirectory() ? sizeOf(path.join(dir, entry.name)) : fs.statSync(path.join(dir, entry.name)).size), 0);

report.outputBytes = sizeOf(OUTPUT);
report.seconds = Math.round((Date.now() - started) / 1000);
fs.writeFileSync(path.join(STATE_DIR, `${KIND}.report.json`), JSON.stringify(report, null, 1));

// Only a run without differences records its sources: a failed piece is rebuilt next time.
if(failures === 0) fs.writeFileSync(statePath, JSON.stringify({keyId: layout.keyId, dictionary: dictionaryId, sources}));

console.log(`${KIND}: ${report.written} written, ${report.upToDate} up to date, ${report.sharedImages} shared images, ${megabytes(report.inputBytes)} of .nitro → ${megabytes(report.outputBytes)} `
    + `(${((1 - report.outputBytes / report.inputBytes) * 100).toFixed(1)} % smaller), ${report.pngKept.length} kept as PNG, ${report.unreadable.length} unreadable, ${report.seconds} s`);

if(failures > 0)
{
    console.error(`${failures} difference(s)`);
    process.exit(1);
}
