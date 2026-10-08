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
const stage = await IsoStage.create({assets: new AssetLibrary('iso-sandbox'), property: key => PROPERTIES[key] ?? '', furniData: await furniData(), modules, renderer});

await stage.loadRoom('zone', zone as IIsoRoomData);

const view: IIsoView = stage.createView('zone', width, height, 64)!;
const centre = view.tileToView(zone.floor.width / 2, zone.floor.length / 2, 0);

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

(window as unknown as {sandbox: unknown}).sandbox = {stage, view, modules: modules.length, host: canvasHost ? 'canvas' : 'pixi'};
