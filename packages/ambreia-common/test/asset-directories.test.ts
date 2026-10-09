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

test('every family gets its directory, ${…} resolved; a family left out is named', () =>
{
    const urls = Object.fromEntries(ASSET_FAMILIES.map(family => [family, `\${url.prefix}/ambreia/${family}/`]));
    const directories = openAssetDirectories(urls, text => text.replace('${url.prefix}', 'http://assets'));

    assert.equal(directories.pets.url, 'http://assets/ambreia/pets/');
    assert.equal(directories.furniture.url, 'http://assets/ambreia/furniture/');
    assert.throws(() => openAssetDirectories({...urls, effects: undefined}), /effects/);
});

test('the icons family is optional: opened when configured, null otherwise', () =>
{
    assert.equal(openAssetDirectories(EVERY_FAMILY).icons, null);
    assert.equal(openAssetDirectories({...EVERY_FAMILY, icons: '${url.prefix}/ambreia/icons/'}, text => text.replace('${url.prefix}', 'http://assets')).icons?.url, 'http://assets/ambreia/icons/');
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
