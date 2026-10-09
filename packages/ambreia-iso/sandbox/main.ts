import {Application} from 'pixi.js';
import {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {AmbreiaDirectory, httpBytes} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import {decodeMasterKey, encryptedLayout} from '@ambreia/common/assets/pack/AmbreiaLayout';
import {AssetPacks} from '@ambreia/common/assets/pack/AssetPacks';
import {IsoStage} from '../src/IsoStage';
import type {IIsoView} from '../src/IsoView';
import type {IIsoRoomData} from '../src/IIsoRoomData';
import type {IsoModule} from '../src/object/IIsoRegistries';
import {FurnitureDataParser} from '../src/furniture/data/FurnitureDataParser';
import type {IFurnitureData} from '../src/furniture/data/IFurnitureData';
import {registerScene} from '../src/scene/registerScene';
import {registerFurniture} from '../src/furniture/registerFurniture';
import {registerAvatars} from '../src/avatar/registerAvatars';
import {registerEffects} from '../src/effects/registerEffects';
import {AvatarRenderManager} from '@ambreia/avatar/AvatarRenderManager';
import {readAvatarData} from '@ambreia/avatar/AvatarData';
import {AvatarRenderEvent} from '@ambreia/avatar/enum/AvatarRenderEvent';
import {Vector3d} from '../src/utils/Vector3d';
import {RoomObjectAvatarUpdateMessage} from '../src/scene/messages/RoomObjectAvatarUpdateMessage';
import {RoomObjectAvatarFigureUpdateMessage} from '../src/scene/messages/RoomObjectAvatarFigureUpdateMessage';
import {RoomObjectVariableEnum} from '../src/scene/object/RoomObjectVariableEnum';
import type {IRoomObjectController} from '../src/object/IRoomObjectController';
import {RoomLighting} from '../src/scene/renderer/RoomLighting';
import {FurnitureLights} from '../src/furniture/FurnitureLights';
import zone from './zone.json';

// ?modules=scene,furniture,avatars (no effects) and ?host=canvas (drawn into a plain 2D canvas,
// the map editor's case) exercise the two seams J4 adds.
const params = new URLSearchParams(location.search);
const MODULES: Record<string, IsoModule> = {scene: registerScene, furniture: registerFurniture, avatars: registerAvatars, effects: registerEffects};
const modules = (params.get('modules') ?? 'scene,furniture,avatars,effects').split(',').map(name => MODULES[name]).filter(Boolean);
const canvasHost = params.get('host') === 'canvas';

// ?pack=1: the furniture comes from /ambreia/furniture/*.ambreia instead of /dcr/hof_furni/*.nitro —
// the same room either way (plan 2026-10-08-asset-packs). ?key= gives an encrypted directory its
// master key (local testing only: a key in a URL is a key given away).
const key = params.get('key');

if(params.get('pack') === '1') AssetPacks.mount('/dcr/hof_furni/', new AmbreiaDirectory('/ambreia/furniture/', httpBytes, key ? encryptedLayout(decodeMasterKey(key)) : null));

// The hotel's properties the room content needs, on this origin (vite proxies them).
const PROPERTIES: Record<string, string> = {
    'flash.dynamic.download.url': '/dcr/hof_furni/',
    'flash.dynamic.download.name.template': '%typeid%.nitro',
    'flash.dynamic.icon.download.name.template': 'icons/%typeid%%param%_icon.png',
    'pet.dynamic.download.url': '/gordon/vortex-assets-PRODUCTION-202601121522-867048149/',
    'pet.dynamic.download.name.template': '%type%.nitro'
};

async function furniData(): Promise<IFurnitureData[]>
{
    const floor = new Map<number, IFurnitureData>();
    const wall = new Map<number, IFurnitureData>();
    const parser = new FurnitureDataParser(floor, wall, new Map(), new Map(), null, false);

    await new Promise<void>((resolve, reject) =>
    {
        parser.events.once('FDP_furniture_data_ready', () => resolve());
        parser.events.once('FDP_furniture_data_error', (error: Error) => reject(error));
        parser.loadData('/gamedata/furnidata_json/1');
    });

    return [...floor.values(), ...wall.values()];
}

const host = document.getElementById('host')!;
const pickLabel = document.getElementById('pick')!;
const width = innerWidth;
const height = innerHeight;
const app = canvasHost ? null : new Application();

if(app) await app.init({width, height, background: '#20242c', antialias: false});

const renderer = app ? app.renderer : await IsoStage.createOffscreenRenderer(width, height, 0x20242c);
// ?avatars=1: avatars drawn by @ambreia/avatar, set down with sandbox.addAvatar(x, y, own), to look at
// how a player sorts against raised floor and furni and what hides them (updateOcclusion()).
const CONFIGURATIONS = import.meta.glob('../../vortex-client/src/assets/configurations/*', {query: '?raw', import: 'default', eager: true}) as Record<string, string>;

async function avatarRenderer(): Promise<AvatarRenderManager | null>
{
    if(params.get('avatars') !== '1') return null;

    const manager = new AvatarRenderManager({
        assets: new AssetLibrary('iso-sandbox-avatars'),
        data: readAvatarData(file => CONFIGURATIONS[`../../vortex-client/src/assets/configurations/${file}`] ?? null),
        downloadUrl: PROPERTIES['pet.dynamic.download.url'],
        downloadNameTemplate: '%libname%.nitro'
    });

    if(!manager.isReady) await new Promise(done => manager.events.once(AvatarRenderEvent.AVATAR_RENDER_READY, done));

    return manager;
}

const stage = await IsoStage.create({assets: new AssetLibrary('iso-sandbox'), property: key => PROPERTIES[key] ?? '', furniData: await furniData(), modules, renderer, avatarRenderer: await avatarRenderer()});

// ?zone=stairs: stairs, a raised landing and a walkway, to look at how heights read (solid sides).
// ?zone=big&furni=2000: a 64 × 64 floor (the format's limit) with the sample zone's furniture
// scattered over it, for measuring a room far larger than the screen.
const bigZone = (count: number): IIsoRoomData =>
{
    const size = 64;
    const tile = {height: 0, walkable: true, hole: false};
    const decor = Array.from({length: count}, (_, i) =>
    {
        const sample = zone.decor[i % zone.decor.length];
        const at = (i * 7919) % (size * size);

        return {...sample, id: `big_${i}`, x: at % size, y: Math.floor(at / size), z: 0};
    });

    return {...zone, floor: {width: size, length: size, tiles: Array.from({length: size * size}, () => tile), door: null}, decor, wallDecor: []} as IIsoRoomData;
};

const normals = params.get('normals') === '1' ? await import('./normals') : null;
const room = (normals ? normals.normalsZone() : params.get('zone') === 'stairs' ? (await import('./zone-stairs.json')).default
    : params.get('zone') === 'big' ? bigZone(Number(params.get('furni') ?? 2000)) : zone) as IIsoRoomData;

await stage.loadRoom('zone', room);

const view: IIsoView = stage.createView('zone', width, height, 64)!;
const centre = view.tileToView(room.floor.width / 2, room.floor.length / 2, 0);

view.panX += width / 2 - centre.x;
view.panY += height / 2 - centre.y;

if(app)
{
    host.appendChild(app.canvas);
    app.stage.addChild(view.container);
    app.ticker.add(ticker => stage.update(ticker.deltaMS));
}
else
{
    // The map editor's case: no PixiJS stage, the view drawn into a 2D canvas every frame.
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    let last = performance.now();

    canvas.width = width;
    canvas.height = height;
    host.appendChild(canvas);

    const frame = (now: number): void =>
    {
        stage.update(now - last);
        last = now;
        context.clearRect(0, 0, width, height);
        context.drawImage(view.render(), 0, 0);
        requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
}

host.addEventListener('mousemove', (event) =>
{
    const picked = view.pick(event.clientX, event.clientY);

    pickLabel.textContent = `tile ${picked.tile ? `${picked.tile.x},${picked.tile.y}` : '—'} · item ${picked.itemId ?? '—'}`;
});

// ?light=night: the room by night, two torches, a blue light on the landing, a lamp up the back
// stairs; with ?avatars=1 the player's own avatar carries a lantern.
// ?light=furni: the same night with no light set by hand: the glowing furni light the room alone.
if(params.get('light') === 'night' || params.get('light') === 'furni')
{
    const lighting = new RoomLighting();

    lighting.ambient = 0x2b3150;
    lighting.lights = params.get('light') === 'furni' ? [] : [
        {x: 1, y: 6, z: 0, color: 0xff9a3c, radius: 4.5, intensity: 1, height: 1.3, flicker: 0.3},
        {x: 13, y: 9, z: 0, color: 0xff8a30, radius: 4, intensity: 0.95, height: 1.3, flicker: 0.3},
        {x: 12, y: 6, z: 7, color: 0x5aa0ff, radius: 3.5, intensity: 0.9, height: 0.8},
        {x: 1, y: 2, z: 3, color: 0xffe2a8, radius: 3, intensity: 0.8, height: 1}
    ];
    lighting.lantern = {color: 0xffd9a0, radius: 3, intensity: 0.85, flicker: 0.05};
    // The floor the light falls on and is cut by: a hole or the void is no floor.
    lighting.floor = {
        width: room.floor.width,
        length: room.floor.length,
        heightAt: (x, y) =>
        {
            const tile = room.floor.tiles[y * room.floor.width + x];

            return x < 0 || y < 0 || x >= room.floor.width || !tile || tile.hole ? -1 : tile.height;
        }
    };
    view.lighting = lighting;
}

let nextAvatar = 1;

/** Sets a player down on tile (x, y), facing the viewer; `own` makes it the player's own avatar. */
function addAvatar(x: number, y: number, own: boolean = false, figure: string = 'hd-180-2.hr-828-31.ch-255-1408.lg-280-110.sh-305-62'): void
{
    const object = stage.getRoom('zone')?.createRoomObject(nextAvatar++, 'user', 100) as IRoomObjectController | null;
    const handler = object?.getEventHandler() ?? null;

    if(!object || handler === null) return;

    object.getModelController().setNumber(RoomObjectVariableEnum.AVATAR_OWN_USER, own ? 1 : 0);
    handler.processUpdateMessage(new RoomObjectAvatarUpdateMessage(new Vector3d(x, y, room.floor.tiles[y * room.floor.width + x]?.height ?? 0), null, new Vector3d(90), 90, false, 0));
    handler.processUpdateMessage(new RoomObjectAvatarFigureUpdateMessage(figure, ''));
}

if(normals && app) void normals.showNormals(app, view, stage);

(window as unknown as {sandbox: unknown}).sandbox = {addAvatar, furnitureLights: FurnitureLights, stage, view, app, modules: modules.length, host: canvasHost ? 'canvas' : 'pixi'};
