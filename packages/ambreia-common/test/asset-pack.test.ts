// .ambreia pieces (plan 2026-10-08-asset-packs, revision): one optimised file per .nitro, images
// shared by several pieces stored once, the manifests through an exactly reversible codec and a
// deflate dictionary read once per directory.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encodeManifest, decodeManifest} from '../src/assets/pack/ManifestCodec';
import {compressManifest, decodePiece, encodePiece} from '../src/assets/pack/AmbreiaPiece';
import {AmbreiaDirectory} from '../src/assets/pack/AmbreiaDirectory';
import type {FetchBytes} from '../src/assets/pack/AmbreiaDirectory';
import {AssetPacks} from '../src/assets/pack/AssetPacks';
import {NitroBundleLoader} from '../src/assets/loaders/NitroBundleLoader';
import {AssetLoaderEventType} from '../src/assets/loaders/AssetLoaderEvent';
import {BROWSER_PLATFORM, setPlatform} from '../src/platform/Platform';

const manifest = (name: string): Record<string, unknown> => ({
    type: 'ca',
    assets: {h_std_ca_1_0_0: {x: 2, y: 62}, h_std_ca_1_1_0: {x: -20, y: 51, flipH: true}},
    name,
    spritesheet: {
        frames: {
            [`${name}_h_std_ca_1_0_0`]: {frame: {x: 0, y: 0, w: 46, h: 60}, rotated: false, trimmed: false, spriteSourceSize: {x: 0, y: 0, w: 46, h: 60}, sourceSize: {w: 46, h: 60}, pivot: {x: 0.5, y: 0.5}},
            [`${name}_h_std_ca_1_1_0`]: {frame: {x: 0, y: 60, w: 10, h: 8}, rotated: false, trimmed: true, spriteSourceSize: {x: 1, y: 2, w: 10, h: 8}, sourceSize: {w: 12, h: 12}}
        },
        meta: {image: `${name}.png`, format: 'RGBA8888', size: {w: 58, h: 108}, scale: '1'}
    },
    visualizations: [{size: 64, layerCount: 1}]
});

const DICTIONARY = new TextEncoder().encode('"spritesheet":{"frames":{"');
const DICTIONARY_ID = '0123456789abcdef';
const SHARED = new Uint8Array([7, 7, 7, 7]);
const SHARED_SHA1 = 'aa'.repeat(20);

test('the manifest codec gives back the same JSON text, unusual frames and keys included', () =>
{
    const m = manifest('shirt_U_test');
    const encoded = encodeManifest(m);

    assert.equal(JSON.stringify(decodeManifest(JSON.parse(JSON.stringify(encoded)))), JSON.stringify(m));
    assert.ok(JSON.stringify(encoded).length < JSON.stringify(m).length);
});

test('a piece file round-trips: dictionary id, manifest, its own image, a shared one under another name', () =>
{
    const own = new Uint8Array([82, 73, 70, 70, 1, 2]);
    const bytes = encodePiece({
        dictionaryId: DICTIONARY_ID,
        manifest: compressManifest(manifest('hat'), DICTIONARY),
        images: [{entryName: 'hat.png', format: 'webp', bytes: own}, {entryName: 'hat_extra.png', format: 'png', shared: SHARED_SHA1}]
    }, 'hat');
    const piece = decodePiece(bytes, 'hat');

    assert.equal(piece.dictionaryId, DICTIONARY_ID);
    assert.deepEqual(piece.images.map(image => [image.entryName, image.format, image.shared ?? null]), [['hat.png', 'webp', null], ['hat_extra.png', 'png', SHARED_SHA1]]);
    assert.deepEqual([...piece.images[0].bytes!], [...own]);
});

/** A served .ambreia directory in memory; records what was requested. */
function directory(pieces: string[], options: {descriptor?: boolean; dictionaryId?: string} = {}): {fetch: FetchBytes; requested: string[]}
{
    const files = new Map<string, Uint8Array>();
    const dir = 'http://assets/ambreia/furniture/';

    if(options.descriptor !== false) files.set(`${dir}ambreia.json`, new TextEncoder().encode(JSON.stringify({v: 1, kind: 'furniture', dictionary: DICTIONARY_ID})));
    files.set(`${dir}dictionary/${DICTIONARY_ID}.bin`, DICTIONARY);
    files.set(`${dir}images/${SHARED_SHA1}.webp`, SHARED);

    for(const name of pieces)
    {
        files.set(`${dir}${name}.ambreia`, encodePiece({
            dictionaryId: options.dictionaryId ?? DICTIONARY_ID,
            manifest: compressManifest(manifest(name), DICTIONARY),
            images: [name.startsWith('shared') ? {entryName: `${name}.png`, format: 'webp', shared: SHARED_SHA1} : {entryName: `${name}.png`, format: 'webp', bytes: new Uint8Array([name.length])}]
        }, name));
    }

    const requested: string[] = [];

    return {requested, fetch: async url => { requested.push(url); return files.get(url) ?? null; }};
}

test('a piece comes back as the files of its .nitro: the same manifest and its image bytes', async () =>
{
    const {fetch} = directory(['throne']);
    const files = await new AmbreiaDirectory('http://assets/ambreia/furniture/', fetch).read('throne');

    assert.ok(files);
    assert.deepEqual(files.map(f => f.name), ['throne.json', 'throne.webp']);
    assert.deepEqual(JSON.parse(new TextDecoder().decode(files[0].data)), manifest('throne'));
    assert.deepEqual([...files[1].data], ['throne'.length]);
});

test('the descriptor and the dictionary are read once for the whole directory; a piece is one request', async () =>
{
    const {fetch, requested} = directory(['a', 'bb', 'ccc']);
    const dir = new AmbreiaDirectory('http://assets/ambreia/furniture/', fetch);

    await Promise.all(['a', 'bb', 'ccc'].map(name => dir.read(name)));

    assert.equal(requested.filter(url => url.endsWith('ambreia.json')).length, 1);
    assert.equal(requested.filter(url => url.includes('/dictionary/')).length, 1);
    assert.equal(requested.filter(url => url.endsWith('.ambreia')).length, 3);
});

test('an image several pieces use is fetched from images/ by its hash', async () =>
{
    const {fetch, requested} = directory(['shared_red', 'shared_blue']);
    const dir = new AmbreiaDirectory('http://assets/ambreia/furniture/', fetch);
    const red = await dir.read('shared_red');

    await dir.read('shared_blue');

    assert.deepEqual([...red![1].data], [...SHARED]);
    assert.equal(requested.filter(url => url.includes('/images/')).length, 1);
});

test('a piece the directory lacks answers null', async () =>
{
    const {fetch} = directory(['a']);

    assert.equal(await new AmbreiaDirectory('http://assets/ambreia/furniture/', fetch).read('missing'), null);
});

test('a directory without its descriptor is unusable: every piece loads from its .nitro', async () =>
{
    const {fetch} = directory(['a'], {descriptor: false});
    const dir = new AmbreiaDirectory('http://assets/ambreia/furniture/', fetch);

    await assert.rejects(dir.read('a'));
    assert.equal(dir.broken, true);
});

test('a piece built with another dictionary is refused rather than decoded wrong', async () =>
{
    const {fetch} = directory(['a'], {dictionaryId: 'ffffffffffffffff'});

    await assert.rejects(new AmbreiaDirectory('http://assets/ambreia/furniture/', fetch).read('a'), /dictionary/);
});

test('a mounted directory answers for the .nitro URLs of the directory it replaces only', () =>
{
    const dir = new AmbreiaDirectory('http://assets/ambreia/furniture/', async () => null);

    AssetPacks.mount('http://assets/dcr/hof_furni', dir);

    assert.deepEqual(AssetPacks.resolve('http://assets/dcr/hof_furni/throne.nitro?v=3'), {pack: dir, name: 'throne'});
    assert.equal(AssetPacks.resolve('http://assets/dcr/hof_furni/icons/throne_icon.png'), null);
    assert.equal(AssetPacks.resolve('http://assets/dcr/hof_furni/sub/throne.nitro'), null);
    assert.equal(AssetPacks.resolve('http://assets/gordon/hh_human_body.nitro'), null);

    AssetPacks.unmountAll();
    assert.equal(AssetPacks.resolve('http://assets/dcr/hof_furni/throne.nitro'), null);
});

/** Loads `url` with a NitroBundleLoader; records what global fetch was asked and what got decoded. */
async function loadThroughLoader(url: string): Promise<{loader: NitroBundleLoader; fetched: string[]; decoded: string[]; ok: boolean}>
{
    const fetched: string[] = [];
    const decoded: string[] = [];
    const original = globalThis.fetch;

    globalThis.fetch = (async (input: string | URL | Request) => { fetched.push(String(input)); throw new TypeError('network down'); }) as typeof fetch;
    setPlatform({...BROWSER_PLATFORM, decodeImage: async (_bytes, mimeType) => { decoded.push(mimeType); return {width: 58, height: 108} as unknown as CanvasImageSource; }});

    try
    {
        const loader = new NitroBundleLoader('application/x-nitro-bundle');
        const ok = await new Promise<boolean>(resolve =>
        {
            loader.events.once(AssetLoaderEventType.COMPLETE, () => resolve(true));
            loader.events.once(AssetLoaderEventType.ERROR, () => resolve(false));
            loader.load(url);
        });

        return {loader, fetched, decoded, ok};
    }
    finally
    {
        globalThis.fetch = original;
        setPlatform(BROWSER_PLATFORM);
    }
}

test('NitroBundleLoader reads a mounted piece from its .ambreia file, never from the .nitro URL', async () =>
{
    AssetPacks.mount('http://assets/dcr/hof_furni/', new AmbreiaDirectory('http://assets/ambreia/furniture/', directory(['throne']).fetch));

    try
    {
        const {loader, fetched, decoded, ok} = await loadThroughLoader('http://assets/dcr/hof_furni/throne.nitro');

        assert.equal(ok, true);
        assert.deepEqual(fetched, []);
        assert.deepEqual(decoded, ['image/webp']);
        assert.equal(loader.jsonData?.name, 'throne');
        assert.equal(loader.textures.size, 2);
    }
    finally
    {
        AssetPacks.unmountAll();
    }
});

test('a piece missing from the mounted directory loads from its .nitro URL as before', async () =>
{
    AssetPacks.mount('http://assets/dcr/hof_furni/', new AmbreiaDirectory('http://assets/ambreia/furniture/', directory(['throne']).fetch));

    try
    {
        const {fetched} = await loadThroughLoader('http://assets/dcr/hof_furni/chair.nitro');

        // The loader's own retries (`?retry=n`) included: every request is for the .nitro file.
        assert.ok(fetched.length > 0 && fetched.every(url => url.startsWith('http://assets/dcr/hof_furni/chair.nitro')), fetched.join(' '));
    }
    finally
    {
        AssetPacks.unmountAll();
    }
});
