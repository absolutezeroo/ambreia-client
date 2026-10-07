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

// A room loaded out of session against the asset server, as the map editor will (plan D5).
const ASSETS = process.env.AMBREIA_ASSETS?.replace(/\/+$/, '') ?? null;
const SKIP = ASSETS === null && 'set AMBREIA_ASSETS to the asset server (e.g. http://vortex-assets.local)';

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
    const properties: Record<string, string> = {
        'flash.dynamic.download.url': `${base}/dcr/hof_furni/`,
        'flash.dynamic.download.name.template': '%typeid%.nitro',
        'flash.dynamic.icon.download.name.template': 'icons/%typeid%%param%_icon.png',
        'pet.dynamic.download.url': `${base}/gordon/vortex-assets-PRODUCTION-202601121522-867048149/`,
        'pet.dynamic.download.name.template': '%type%.nitro'
    };
    const stage = await IsoStage.create({assets: new AssetLibrary('iso-test'), property: key => properties[key] ?? '', furniData: data});
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
    const properties: Record<string, string> = {
        'flash.dynamic.download.url': `${base}/dcr/hof_furni/`,
        'flash.dynamic.download.name.template': '%typeid%.nitro',
        'pet.dynamic.download.url': `${base}/gordon/vortex-assets-PRODUCTION-202601121522-867048149/`,
        'pet.dynamic.download.name.template': '%type%.nitro'
    };
    const stage = await IsoStage.create({assets: new AssetLibrary('iso-view-test'), property: key => properties[key] ?? '', furniData: data});
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
