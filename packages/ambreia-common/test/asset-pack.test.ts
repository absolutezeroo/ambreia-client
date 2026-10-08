// .ambreia packs (plan 2026-10-08-asset-packs): many .nitro bundles in one file, read a piece at a
// time with HTTP Range, the manifests through an exactly reversible codec.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encodeManifest, decodeManifest} from '../src/assets/pack/ManifestCodec';
import {AssetPackWriter, PACK_PREFIX_LENGTH} from '../src/assets/pack/AssetPackFormat';
import {AssetPack, PackRangeUnsupportedError} from '../src/assets/pack/AssetPack';
import type {RangeFetch} from '../src/assets/pack/AssetPack';
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

test('the manifest codec gives back the same JSON text, unusual frames and keys included', () =>
{
    const m = manifest('shirt_U_test');
    const encoded = encodeManifest(m);

    assert.equal(JSON.stringify(decodeManifest(JSON.parse(JSON.stringify(encoded)))), JSON.stringify(m));
    assert.ok(JSON.stringify(encoded).length < JSON.stringify(m).length);
});

/** A pack in memory and a fetch that serves Range from it, counting requests. */
function memoryPack(items: Array<{name: string; image: Uint8Array; shareWith?: string}>): {bytes: Uint8Array; requests: Array<[number, number]>; fetch: RangeFetch}
{
    const chunks: Uint8Array[] = [];
    const writer = new AssetPackWriter('clothing', new TextEncoder().encode('"spritesheet":{"frames":'), chunk => chunks.push(chunk));
    const keys = new Map<string, string>();

    for(const item of items)
    {
        const key = item.shareWith ?? item.name;

        keys.set(item.name, key);
        writer.addItem(item.name, manifest(item.name), [{entryName: `${item.name}.png`, key, ext: 'webp', bytes: () => item.image}]);
    }

    const head = writer.finish();
    const bytes = new Uint8Array(head.length + chunks.reduce((n, c) => n + c.length, 0));
    let at = 0;

    for(const part of [head, ...chunks]) { bytes.set(part, at); at += part.length; }

    const requests: Array<[number, number]> = [];

    return {bytes, requests, fetch: async (_url, start, end) => { requests.push([start, end]); return bytes.slice(start, end + 1); }};
}

test('a piece comes back as the files of its .nitro: the same manifest and its image bytes', async () =>
{
    const image = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4, 5]);
    const {fetch} = memoryPack([{name: 'hat_U_party7', image}, {name: 'shirt_M_tee', image: new Uint8Array([9, 9])}]);
    const files = await new AssetPack('mem://clothing.ambreia', fetch).read('hat_U_party7');

    assert.ok(files);
    assert.deepEqual(files.map(f => f.name), ['hat_U_party7.json', 'hat_U_party7.webp']);
    assert.deepEqual(JSON.parse(new TextDecoder().decode(files[0].data)), manifest('hat_U_party7'));
    assert.deepEqual([...files[1].data], [...image]);
});

test('a piece whose image follows its manifest is one request after the index', async () =>
{
    const {fetch, requests} = memoryPack([{name: 'a', image: new Uint8Array([1])}, {name: 'b', image: new Uint8Array([2])}]);
    const pack = new AssetPack('mem://p', fetch);

    await pack.read('a');
    const before = requests.length;

    await pack.read('b');

    assert.equal(requests.length - before, 1);
});

test('the index is sharded: reading one piece of many fetches a small part of it, not all of it', async () =>
{
    const items = Array.from({length: 3000}, (_, i) => ({name: `furni_${i}`, image: new Uint8Array([i % 256])}));
    const {fetch, requests, bytes} = memoryPack(items);
    const pack = new AssetPack('mem://p', fetch);

    assert.equal((await pack.read('furni_1234'))![0].name, 'furni_1234.json');

    // Everything read before the piece itself is index: it must not grow with the pack.
    const index = requests.slice(0, -1).reduce((total, [start, end]) => total + end - start + 1, 0);

    assert.ok(requests.length <= 3, `requests ${requests.length}`);
    // The fixed first read (head, shard table, dictionary) plus one shard: the furniture pack's
    // whole index was 1.65 MB before it was sharded.
    assert.ok(index < PACK_PREFIX_LENGTH + 8 * 1024, `index bytes read ${index} (pack ${bytes.length})`);
});

test('an image shared by two pieces is stored once and read for both', async () =>
{
    const image = new Uint8Array([7, 7, 7, 7]);
    const {fetch, bytes} = memoryPack([{name: 'red', image}, {name: 'blue', image, shareWith: 'red'}]);
    const blue = await new AssetPack('mem://p', fetch).read('blue');

    assert.deepEqual([...blue![1].data], [...image]);
    assert.equal([...bytes].join(',').split('7,7,7,7').length - 1, 1);
});

test('a piece the pack does not hold answers null', async () =>
{
    const {fetch} = memoryPack([{name: 'a', image: new Uint8Array([1])}]);

    assert.equal(await new AssetPack('mem://p', fetch).read('missing'), null);
});

test('a server that ignores Range makes the pack unusable instead of downloading it whole', async () =>
{
    const pack = new AssetPack('mem://p', async () => { throw new PackRangeUnsupportedError('mem://p', 200); });

    await assert.rejects(pack.read('a'), PackRangeUnsupportedError);
    assert.equal(pack.broken, true);
});

test('a mounted pack answers for the .nitro URLs of its directory only', () =>
{
    const pack = new AssetPack('http://assets/packs/furniture.ambreia', async () => new Uint8Array());

    AssetPacks.mount('http://assets/dcr/hof_furni', pack);

    assert.deepEqual(AssetPacks.resolve('http://assets/dcr/hof_furni/throne.nitro?v=3'), {pack, name: 'throne'});
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

test('NitroBundleLoader reads a mounted piece from its pack, never from the .nitro URL', async () =>
{
    const {fetch} = memoryPack([{name: 'hat_U_party7', image: new Uint8Array([1, 2, 3])}]);

    AssetPacks.mount('http://assets/gordon/', new AssetPack('mem://clothing.ambreia', fetch));

    try
    {
        const {loader, fetched, decoded, ok} = await loadThroughLoader('http://assets/gordon/hat_U_party7.nitro');

        assert.equal(ok, true);
        assert.deepEqual(fetched, []);
        assert.deepEqual(decoded, ['image/webp']);
        assert.equal(loader.jsonData?.name, 'hat_U_party7');
        assert.equal(loader.textures.size, 2);
    }
    finally
    {
        AssetPacks.unmountAll();
    }
});

test('a piece missing from the mounted pack loads from its .nitro URL as before', async () =>
{
    const {fetch} = memoryPack([{name: 'hat_U_party7', image: new Uint8Array([1])}]);

    AssetPacks.mount('http://assets/gordon/', new AssetPack('mem://clothing.ambreia', fetch));

    try
    {
        const {fetched} = await loadThroughLoader('http://assets/gordon/shirt_M_absent.nitro');

        // The loader's own retries (`?retry=n`) included: every request is for the .nitro file.
        assert.ok(fetched.length > 0 && fetched.every(url => url.startsWith('http://assets/gordon/shirt_M_absent.nitro')), fetched.join(' '));
    }
    finally
    {
        AssetPacks.unmountAll();
    }
});
