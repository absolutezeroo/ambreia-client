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
