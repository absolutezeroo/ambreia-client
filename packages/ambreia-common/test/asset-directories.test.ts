// One .ambreia directory per family, and pieces loaded through AssetLibrary.loadPiece (spec
// 2026-10-09-ambreia-everything §2): no .nitro anywhere, a missing piece is one request and an error.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ASSET_FAMILIES, openAssetDirectories} from '../src/assets/pack/AssetDirectories';
import {AmbreiaDirectory} from '../src/assets/pack/AmbreiaDirectory';
import type {FetchBytes} from '../src/assets/pack/AmbreiaDirectory';
import {compressManifest, encodePiece} from '../src/assets/pack/AmbreiaPiece';
import {encodeMasterKey, encryptedLayout, generateMasterKey, plainLayout} from '../src/assets/pack/AmbreiaLayout';
import type {IAmbreiaLayout} from '../src/assets/pack/AmbreiaLayout';
import {AssetLibrary} from '../src/assets/AssetLibrary';
import {AssetLoaderEventType} from '../src/assets/loaders/AssetLoaderEvent';
import {BROWSER_PLATFORM, setPlatform} from '../src/platform/Platform';

const DICTIONARY = new TextEncoder().encode('"spritesheet":{"frames":{"');
const DICTIONARY_ID = '0123456789abcdef';
const DIR = 'http://assets/ambreia/furniture/';
const EVERY_FAMILY = Object.fromEntries(ASSET_FAMILIES.map(family => [family, DIR]));
const manifest = (name: string): Record<string, unknown> => ({
    name,
    type: 'throne',
    assets: {a: {x: 0, y: 0}},
    spritesheet: {
        frames: {[`${name}_a`]: {frame: {x: 0, y: 0, w: 4, h: 4}, rotated: false, trimmed: false, spriteSourceSize: {x: 0, y: 0, w: 4, h: 4}, sourceSize: {w: 4, h: 4}}},
        meta: {image: `${name}.png`, format: 'RGBA8888', size: {w: 4, h: 4}, scale: '1'}
    }
});

/** A served .ambreia directory in memory; records what was requested. */
async function served(pieces: string[], layout: IAmbreiaLayout = plainLayout()): Promise<{fetch: FetchBytes; requested: string[]}>
{
    const files = new Map<string, Uint8Array>();
    const put = async (logical: Parameters<IAmbreiaLayout['path']>[0], bytes: Uint8Array): Promise<void> =>
    {
        files.set(DIR + await layout.path(logical), await layout.seal(logical, bytes));
    };

    files.set(`${DIR}ambreia.json`, new TextEncoder().encode(JSON.stringify({v: 1, kind: 'furniture', dictionary: DICTIONARY_ID, encrypted: layout.encrypted, keyId: layout.keyId})));
    await put({kind: 'dictionary', id: DICTIONARY_ID}, DICTIONARY);

    for(const name of pieces)
    {
        await put({kind: 'piece', name}, encodePiece({dictionaryId: DICTIONARY_ID, manifest: compressManifest(manifest(name), DICTIONARY), images: [{entryName: `${name}.png`, format: 'webp', bytes: new Uint8Array([1])}]}, name));
    }

    const requested: string[] = [];

    return {requested, fetch: async url => { requested.push(url); return files.get(url) ?? null; }};
}

/** True when the piece loads, false when it errors. */
function load(library: AssetLibrary, name: string, directory: AmbreiaDirectory): Promise<boolean>
{
    return new Promise((resolve) =>
    {
        const struct = library.loadPiece(name, directory);

        struct.events.on('event', (event: {type: string}) =>
        {
            if(event.type === AssetLoaderEventType.COMPLETE) resolve(true);
            else if(event.type === AssetLoaderEventType.ERROR) resolve(false);
        });
    });
}

test('every family gets its directory, ${…} resolved; one config.json leaves out is the asset host\'s ambreia/<family>/', () =>
{
    const prefix = (text: string): string => text.replace('${url.prefix}', 'http://assets');
    const directories = openAssetDirectories({pets: '${url.prefix}/elsewhere/pets/'}, prefix);

    assert.equal(directories.pets.url, 'http://assets/elsewhere/pets/');
    assert.equal(directories.furniture.url, 'http://assets/ambreia/furniture/');
    assert.equal(openAssetDirectories({}, prefix).clothing.url, 'http://assets/ambreia/clothing/');
});

test('the icons family defaults like the others; only tools ever read it', () =>
{
    assert.equal(openAssetDirectories({}, text => text.replace('${url.prefix}', 'http://assets')).icons.url, 'http://assets/ambreia/icons/');
});

test('loadPiece registers the piece under its name, its textures parsed, never fetching a .nitro', async () =>
{
    const {fetch, requested} = await served(['throne']);
    const library = new AssetLibrary('pieces');

    setPlatform({...BROWSER_PLATFORM, decodeImage: async () => ({width: 4, height: 4}) as unknown as CanvasImageSource});

    try
    {
        assert.equal(await load(library, 'throne', new AmbreiaDirectory(DIR, fetch)), true);
        assert.equal(library.hasAsset('throne'), true);
        assert.ok(requested.every(url => !url.endsWith('.nitro')), requested.join(' '));
    }
    finally
    {
        setPlatform(BROWSER_PLATFORM);
    }
});

test('a piece can be registered under another asset name (the room type `room` is the piece HabboRoomContent)', async () =>
{
    const {fetch} = await served(['HabboRoomContent']);
    const library = new AssetLibrary('aliased');

    setPlatform({...BROWSER_PLATFORM, decodeImage: async () => ({width: 4, height: 4}) as unknown as CanvasImageSource});

    try
    {
        const loaded = await new Promise<boolean>((resolve) =>
        {
            library.loadPiece('room', new AmbreiaDirectory(DIR, fetch), 'HabboRoomContent').events.on('event', (event: {type: string}) =>
            {
                if(event.type === AssetLoaderEventType.COMPLETE) resolve(true);
                else if(event.type === AssetLoaderEventType.ERROR) resolve(false);
            });
        });

        assert.equal(loaded, true);
        assert.equal(library.hasAsset('room'), true);
        assert.equal(library.hasAsset('HabboRoomContent'), false);
    }
    finally
    {
        setPlatform(BROWSER_PLATFORM);
    }
});

test('a request that fails once while the directory opens is not fatal: the loader\'s retry loads the piece', async () =>
{
    const {fetch} = await served(['throne']);
    let failures = 1;
    const flaky: FetchBytes = async (url) =>
    {
        if(url.endsWith('ambreia.json') && failures-- > 0) throw new TypeError('network down');

        return fetch(url);
    };
    const directory = new AmbreiaDirectory(DIR, flaky);

    setPlatform({...BROWSER_PLATFORM, decodeImage: async () => ({width: 4, height: 4}) as unknown as CanvasImageSource});

    try
    {
        assert.equal(await load(new AssetLibrary('flaky'), 'throne', directory), true);
        assert.equal(directory.broken, false);
    }
    finally
    {
        setPlatform(BROWSER_PLATFORM);
    }
});

test('a directory with no descriptor stays broken: that is not going to change by asking again', async () =>
{
    const directory = new AmbreiaDirectory(DIR, async () => null);

    await assert.rejects(directory.read('throne'), /not an \.ambreia directory/);
    assert.equal(directory.broken, true);
});

test('without WebCrypto (http on a LAN address) the key is refused with the reason, not a TypeError', async () =>
{
    const key = generateMasterKey();
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto')!;

    Object.defineProperty(globalThis, 'crypto', {value: undefined, configurable: true});

    try
    {
        await assert.rejects(encryptedLayout(key), /WebCrypto is unavailable.*https or localhost/);
    }
    finally
    {
        Object.defineProperty(globalThis, 'crypto', original);
    }
});

test('a piece the directory lacks is an error after one request, not three', async () =>
{
    const {fetch, requested} = await served(['throne']);

    assert.equal(await load(new AssetLibrary('missing'), 'chair', new AmbreiaDirectory(DIR, fetch)), false);
    assert.equal(requested.filter(url => url.endsWith('.ambreia')).length, 1);
});

test('a key that cannot be used makes the family unreadable: an error, no retry loop', async () =>
{
    const {fetch, requested} = await served(['throne'], await encryptedLayout(generateMasterKey()));
    const withoutKey = openAssetDirectories(EVERY_FAMILY, text => text, fetch);
    const wrongKey = openAssetDirectories({...EVERY_FAMILY, key: encodeMasterKey(generateMasterKey())}, text => text, fetch);

    assert.equal(await load(new AssetLibrary('nokey'), 'throne', withoutKey.furniture), false);
    assert.equal(await load(new AssetLibrary('wrongkey'), 'throne', wrongKey.furniture), false);
    assert.equal(withoutKey.furniture.broken && wrongKey.furniture.broken, true);
    assert.equal(requested.filter(url => url.endsWith('ambreia.json')).length, 2, requested.join(' '));
});
