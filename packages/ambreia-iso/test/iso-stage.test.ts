import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setPlatform} from '@ambreia/common/platform/Platform';
import {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {nodePlatform} from '../../ambreia-avatar/tools/node-platform.mjs';
import {IsoStage} from '../src/IsoStage';
import {FurnitureDataParser} from '../src/furniture/data/FurnitureDataParser';
import type {IFurnitureData} from '../src/furniture/data/IFurnitureData';
import {RoomObjectCategoryEnum} from '../src/scene/object/RoomObjectCategoryEnum';
import type {IIsoRoomData} from '../src/IIsoRoomData';
import {RoomObjectVariableEnum} from '../src/scene/object/RoomObjectVariableEnum';
import {RoomManager} from '../src/RoomManager';
import {readFileSync} from 'node:fs';
import {Logger, LogLevel} from '@ambreia/common/utils/Logger';
import {ASSET_FAMILIES, openAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';
import type {IAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';
import type {FetchBytes} from '@ambreia/common/assets/pack/AmbreiaDirectory';

// A room loaded out of session against the asset server, as the map editor will (plan D5).
const ASSETS = process.env.AMBREIA_ASSETS?.replace(/\/+$/, '') ?? null;
const SKIP = ASSETS === null && 'set AMBREIA_ASSETS to the asset server (e.g. http://vortex-assets.local)';

/** The client's config.json → asset-packs, `${url.prefix}` at the asset server (as the client reads it). */
function testDirectories(base: string): IAssetDirectories
{
    const config = JSON.parse(readFileSync(new URL('../../vortex-client/public/config.json', import.meta.url), 'utf8')) as {'asset-packs'?: Record<string, string>};

    return openAssetDirectories(config['asset-packs'] ?? {}, text => text.replace('${url.prefix}', base));
}

/** Every family under one fake host, fetched through `fetch`. */
const everyFamily = (host: string, fetch?: FetchBytes): IAssetDirectories =>
    openAssetDirectories(Object.fromEntries(ASSET_FAMILIES.map(family => [family, `${host}/ambreia/${family}/`])), text => text, fetch);

async function furniData(base: string): Promise<IFurnitureData[]>
{
    const floor = new Map<number, IFurnitureData>();
    const wall = new Map<number, IFurnitureData>();
    const parser = new FurnitureDataParser(floor, wall, new Map(), new Map(), null, false);

    await new Promise<void>((resolve, reject) =>
    {
        parser.events.once('FDP_furniture_data_ready', () => resolve());
        parser.events.once('FDP_furniture_data_error', (error: Error) => reject(error));
        parser.loadData(`${base}/gamedata/furnidata_json/1`);
    });

    return [...floor.values(), ...wall.values()];
}

test('a 3×3 room with a floor and a wall furni loads out of session', {skip: SKIP, timeout: 120_000}, async () =>
{
    setPlatform(nodePlatform());

    const base = ASSETS!;
    const data = await furniData(base);
    const chair = data.find(item => item.className === 'chair_polyfon');
    const poster = data.find(item => item.className === 'poster');
    const stage = await IsoStage.create({assets: new AssetLibrary('iso-test'), property: () => '', furniData: data, directories: testDirectories(base)});
    const tiles = Array.from({length: 9}, () => ({height: 0, walkable: true, hole: false}));
    const room: IIsoRoomData = {
        floor: {width: 3, length: 3, tiles},
        decor: [{id: 'chair_1', definition: chair!.id, class: chair!.className, x: 1, y: 1, z: 0, rotation: 2, state: '0'}],
        wallDecor: [{id: 'poster_1', definition: poster!.id, class: 'poster', side: 'Left', x: 0, y: 1, offsetX: 8, offsetY: 30, state: '1'}]
    };
    const instance = await stage.loadRoom('t', room);

    assert.equal(instance.getObjectCount(RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM), 1);
    assert.equal(instance.getObjectCount(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE), 1);
    assert.equal(instance.getObjectCount(RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL), 1);
    assert.equal(instance.getObjects(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)[0].getType(), 'chair_polyfon');

    await assert.rejects(stage.loadRoom('bad', {...room, floor: {...room.floor, length: 65}}), /floor.length > 64/);

    stage.dispose();
});

test('the view projects tiles, follows the camera, and points back at items and tiles', {skip: SKIP, timeout: 120_000}, async () =>
{
    setPlatform(nodePlatform());

    const base = ASSETS!;
    const data = await furniData(base);
    const chair = data.find(item => item.className === 'chair_polyfon')!;
    const stage = await IsoStage.create({assets: new AssetLibrary('iso-view-test'), property: () => '', furniData: data, directories: testDirectories(base)});
    const tiles = Array.from({length: 9}, () => ({height: 0, walkable: true, hole: false}));

    await stage.loadRoom('v', {floor: {width: 3, length: 3, tiles}, decor: [], wallDecor: []});

    const view = stage.createView('v', 400, 300, 64)!;
    const a = view.tileToView(0, 0, 0);
    const b = view.tileToView(1, 0, 0);

    // Habbo's 64-px geometry: one tile along x is +32 across, +16 down.
    assert.deepEqual([Math.round(b.x - a.x), Math.round(b.y - a.y)], [32, 16]);

    view.panX += 10;
    assert.equal(view.tileToView(0, 0, 0).x, a.x + 10);
    view.panX -= 10;

    // The tile under a tile's own centre is that tile, holes included.
    const centre = view.tileToView(1, 1, 0);

    assert.deepEqual(view.pick(centre.x, centre.y).tile, {x: 1, y: 1});

    stage.setTile('v', 1, 1, {height: 0, walkable: false, hole: true});
    assert.deepEqual(view.pick(centre.x, centre.y).tile, {x: 1, y: 1});

    // Editor ids are kept: the same string maps to the same object, and goes away with it.
    await stage.addItem('v', {id: 'throne_1', definition: chair.id, class: chair.className, x: 2, y: 2, z: 0, rotation: 2, state: '0'});
    await stage.updateItem('v', {id: 'throne_1', definition: chair.id, class: chair.className, x: 0, y: 2, z: 0, rotation: 4, state: '0'});

    const instance = stage.getRoom('v')!;

    assert.equal(instance.getObjectCount(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE), 1);
    const moved = instance.getObjects(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)[0].getLocation();

    assert.deepEqual([moved.x, moved.y], [0, 2]);
    stage.removeItem('v', 'throne_1');
    assert.equal(instance.getObjectCount(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE), 0);

    view.dispose();
    stage.dispose();
});

async function emptyStage(base: string, name: string): Promise<IsoStage>
{
    const stage = await IsoStage.create({assets: new AssetLibrary(name), property: () => '', furniData: await furniData(base), directories: testDirectories(base)});

    await stage.loadRoom('r', {floor: {width: 3, length: 3, tiles: Array.from({length: 9}, () => ({height: 0, walkable: true, hole: false}))}, decor: [], wallDecor: []});

    return stage;
}

test('changing a furni to another colour of its class redraws it in that colour', {skip: SKIP, timeout: 120_000}, async () =>
{
    setPlatform(nodePlatform());

    const stage = await emptyStage(ASSETS!, 'iso-colour');
    const chair = {id: 'armchair', definition: 5666001, class: 'mode_gold_armchair*1', x: 1, y: 1, z: 0, rotation: 2, state: '0'};

    await stage.addItem('r', chair);
    await stage.updateItem('r', {...chair, definition: 5666003, class: 'mode_gold_armchair*3'});

    const object = stage.getRoom('r')!.getObjects(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)[0];

    assert.equal(object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_COLOR), 3);
    stage.dispose();
});

test('two furni of a type not loaded yet, added together, both get its content', {skip: SKIP, timeout: 120_000}, async () =>
{
    setPlatform(nodePlatform());

    const stage = await emptyStage(ASSETS!, 'iso-concurrent');
    const cactus = (id: string, x: number): {id: string; definition: number; class: string; x: number; y: number; z: number; rotation: number; state: string} =>
        ({id, definition: 164, class: 'plant_big_cactus', x, y: 1, z: 0, rotation: 0, state: '0'});

    await Promise.all([stage.addItem('r', cactus('a', 0)), stage.addItem('r', cactus('b', 2))]);
    stage.update(16);

    const objects = stage.getRoom('r')!.getObjects(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

    assert.deepEqual(objects.map(o => o.isInitialized()), [true, true]);
    stage.dispose();
});

test('a boot that times out stops pumping the room manager', {timeout: 30_000}, async () =>
{
    setPlatform(nodePlatform());

    // Content that never arrives: every download hangs (no socket left behind when the test ends).
    const originalFetch = globalThis.fetch;
    const original = RoomManager.prototype.update;
    let updates = 0;

    globalThis.fetch = (() => new Promise<Response>(() => {})) as typeof fetch;
    RoomManager.prototype.update = function(this: RoomManager, time: number): void { updates++; original.call(this, time); };

    try
    {
        await assert.rejects(IsoStage.create({
            assets: new AssetLibrary('iso-timeout'),
            property: () => '',
            furniData: [],
            directories: everyFamily('http://content.invalid'),
            bootTimeoutMs: 300
        }), /did not load/);

        const before = updates;

        await new Promise(resolve => setTimeout(resolve, 200));
        assert.equal(updates, before);
    }
    finally
    {
        RoomManager.prototype.update = original;
        globalThis.fetch = originalFetch;
    }
});

test('the room asks the room directory for its own bundles, never a .nitro; a missing one is a loud error', {timeout: 30_000}, async () =>
{
    setPlatform(nodePlatform());

    const asked: string[] = [];
    const errors: string[] = [];
    const directories = everyFamily('http://assets', async (url) =>
    {
        asked.push(url);

        return null;
    });

    Logger.onRecord(record => { if(record.level === LogLevel.ERROR) errors.push(record.args.map(String).join(' ')); });

    try
    {
        // Nothing is served, so the room's bundles never load and create() gives up.
        await assert.rejects(IsoStage.create({assets: new AssetLibrary('iso-room-dirs'), property: () => '', furniData: [], directories, bootTimeoutMs: 500}));
    }
    finally
    {
        Logger.onRecord(null);
    }

    assert.ok(asked.some(url => url.startsWith('http://assets/ambreia/room/')), asked.join(' '));
    assert.ok(asked.every(url => !url.endsWith('.nitro')), asked.join(' '));
    assert.ok(errors.some(message => /critical room content: PlaceHolder\w+ from http:\/\/assets\/ambreia\/room\//.test(message)), errors.join(' | '));
});
