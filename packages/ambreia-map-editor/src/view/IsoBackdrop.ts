import {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IIsoFloorItem, IIsoRoomData, IIsoWallItem} from '@ambreia/iso/IIsoRoomData';
import {IsoStage} from '@ambreia/iso/IsoStage';
import type {IIsoView} from '@ambreia/iso/IsoView';
import {FurnitureDataParser} from '@ambreia/iso/furniture/data/FurnitureDataParser';
import type {IFurnitureData} from '@ambreia/iso/furniture/data/IFurnitureData';
import {registerFurniture} from '@ambreia/iso/furniture/registerFurniture';
import {registerScene} from '@ambreia/iso/scene/registerScene';
import type {ZoneDecorObject, ZoneDocument, ZoneTile} from '@ambreia/map-editor-core/zone/Zone.generated';
import {project} from './isoMath';

const log = Logger.getLogger('map-editor.IsoBackdrop');

const ROOM = 'zone';

/** The furni the place tool would put down, an item of the room like the others. */
const GHOST = '__ghost';

/** The view's background colour, opaque on purpose (IsoStage.createOffscreenRenderer). */
const BACKGROUND = 0x10131a;

/** The largest view the renderer draws; a bigger window is drawn at this size. */
const MAX_WIDTH = 2560;
const MAX_HEIGHT = 1600;

/** The hotel's content, on this origin (the dev server proxies them to the asset server). */
const PROPERTIES: Record<string, string> = {
    'flash.dynamic.download.url': '/dcr/hof_furni/',
    'flash.dynamic.download.name.template': '%typeid%.nitro',
    'flash.dynamic.icon.download.name.template': 'icons/%typeid%%param%_icon.png',
    // The room's own content (HabboRoomContent, placeholders, tile cursor) lives beside the pets.
    'pet.dynamic.download.url': '/gordon/vortex-assets-PRODUCTION-202601121522-867048149/',
    'pet.dynamic.download.name.template': '%type%.nitro'
};

/**
 * The room as the game draws it -- floor, walls and every furni through @ambreia/iso -- behind the
 * editor's own overlays. The view stays the editor's: this only answers "what does the room look
 * like through this camera", and which furni is under a pixel.
 */
export class IsoBackdrop
{
    /** New content arrived or an animation moved: the view should draw again. */
    onChange: () => void = () => undefined;

    private _view: IIsoView | null = null;
    private _room: string | null = null;
    private _items = new Map<string, string>();
    /** The ghost wanted under the pointer, and the one the room holds (as JSON). */
    private _ghost: IIsoFloorItem | null = null;
    private _ghostWanted: string | null = null;
    private _ghostShown: string | null = null;
    private _queue: Promise<void> = Promise.resolve();
    private _last = performance.now();

    private constructor(private readonly _stage: IsoStage)
    {
        // Furni load and animate on their own clock: redraw a few times a second while shown.
        setInterval(() => this._view && this.onChange(), 100);
    }

    private static _shared: Promise<IsoBackdrop | null> | null = null;

    /** One room engine for the app's lifetime, whichever zone is open; null when it cannot load. */
    static shared(): Promise<IsoBackdrop | null>
    {
        return (IsoBackdrop._shared ??= IsoBackdrop.create());
    }

    /** Null when the room content cannot load: the editor keeps drawing the room itself. */
    private static async create(): Promise<IsoBackdrop | null>
    {
        try
        {
            const stage = await IsoStage.create({
                assets: new AssetLibrary('map-editor'),
                property: key => PROPERTIES[key] ?? '',
                furniData: await loadFurniData(),
                modules: [registerScene, registerFurniture],
                renderer: await IsoStage.createOffscreenRenderer(MAX_WIDTH, MAX_HEIGHT, BACKGROUND)
            });

            return new IsoBackdrop(stage);
        }
        catch (error)
        {
            log.warn('@ambreia/iso unavailable, drawing the room without it', error);

            return null;
        }
    }

    get ready(): boolean
    {
        return this._view !== null;
    }

    /**
     * Follows the document: a new floor or walls rebuild the room, furni are added, moved or
     * removed. With a `level`, the tiles of any other height are holes and the furni standing on
     * them are left out.
     */
    setDocument(doc: ZoneDocument, level: number | null = null): void
    {
        const {width, tiles} = doc.floor;
        const onLevel = (t: ZoneTile | null): boolean => t !== null && (t.height ?? 0) === level;
        const shown = level === null ? doc : {
            ...doc,
            floor: {...doc.floor, tiles: tiles.map(t => (onLevel(t) ? t : {...t, hole: true}))},
            decor: (doc.decor ?? []).filter(o => onLevel(tiles[o.y * width + o.x] ?? null))
        };

        this._queue = this._queue.then(() => this.sync(shown)).catch(error =>
        {
            // An invalid room names its field; until it is fixed the editor draws the room itself.
            log.warn('@ambreia/iso refused the zone:', error);
            this.drop();
        });
    }

    /** The room through the editor's camera: corner (0, 0) of the floor at (ox, oy), at zoom. */
    render(width: number, height: number, zoom: number, ox: number, oy: number): HTMLCanvasElement | null
    {
        const view = this._view;

        if(!view) return null;

        view.resize(Math.min(width, MAX_WIDTH), Math.min(height, MAX_HEIGHT));
        view.scale = zoom;

        // iso puts a tile's centre on its integer coordinates, the editor its corner.
        const [cx, cy] = project(0.5, 0.5, 0);
        const at = view.tileToView(0, 0, 0);

        view.panX += ox + cx * zoom - at.x;
        view.panY += oy + cy * zoom - at.y;

        const now = performance.now();

        this._stage.update(now - this._last);
        this._last = now;

        return view.render();
    }

    /** Tile (x, y)'s floor as the room draws it (IsoStage.tileSurface); null for none or no room. */
    tileSurface(x: number, y: number): number[] | null
    {
        return this._view ? this._stage.tileSurface(ROOM, x, y) : null;
    }

    /** The game's tile cursor on the hovered tile; null hides it. */
    setCursor(tile: {x: number; y: number} | null): void
    {
        if(this._view) this._stage.setCursor(ROOM, tile);
    }

    /**
     * The furni the place tool would put down, drawn by the room itself so it looks the way it
     * will once placed; null removes it.
     */
    setGhost(object: Omit<ZoneDecorObject, 'id'> | null): void
    {
        const item = object && floorItem({...object, id: GHOST});
        const json = item && JSON.stringify(item);

        if(json === this._ghostWanted) return;

        this._ghost = item;
        this._ghostWanted = json;
        this._queue = this._queue.then(() => this.syncGhost()).catch(error => log.warn('The ghost could not be shown:', error));
    }

    /** The editor id of the topmost furni under a view pixel, by sprite alpha. */
    pick(x: number, y: number): string | null
    {
        const id = this._view?.pick(x, y).itemId;

        return id === null || id === undefined || id === GHOST ? null : String(id);
    }

    /** Queued like sync(): brings the room's ghost to the one last asked for. */
    private async syncGhost(): Promise<void>
    {
        const item = this._ghost;
        const json = this._ghostWanted;

        if(!this._view || json === this._ghostShown) return;

        if(!item) this._stage.removeItem(ROOM, GHOST);
        else if(this._ghostShown === null) await this._stage.addItem(ROOM, item);
        else await this._stage.updateItem(ROOM, item);
        this._ghostShown = json;
        this.onChange();
    }

    private async sync(doc: ZoneDocument): Promise<void>
    {
        const room = JSON.stringify({floor: doc.floor, walls: doc.walls?.height ?? 0});
        const items = new Map<string, IIsoFloorItem | IIsoWallItem>([
            ...(doc.decor ?? []).map(o => [o.id, floorItem(o)] as const),
            ...(doc.wallDecor ?? []).map(o => [o.id, wallItem(o)] as const)
        ]);

        if(room !== this._room)
        {
            this.drop();
            await this._stage.loadRoom(ROOM, roomData(doc));
            this._view = this._stage.createView(ROOM, 800, 600, 64);
            this._room = room;
            this._items = new Map([...items].map(([id, item]) => [id, JSON.stringify(item)]));
            await this.syncGhost();
            this.onChange();

            return;
        }

        for(const id of [...this._items.keys()].filter(id => !items.has(id)))
        {
            this._stage.removeItem(ROOM, id);
            this._items.delete(id);
        }

        for(const [id, item] of items)
        {
            const json = JSON.stringify(item);
            const known = this._items.get(id);

            if(known === json) continue;

            if(known === undefined) await this._stage.addItem(ROOM, item);
            else await this._stage.updateItem(ROOM, item);
            this._items.set(id, json);
        }

        this.onChange();
    }

    private drop(): void
    {
        this._view?.dispose();
        this._view = null;

        if(this._room !== null) this._stage.disposeRoom(ROOM);
        this._room = null;
        this._items.clear();
        this._ghostShown = null;
    }
}

function roomData(doc: ZoneDocument): IIsoRoomData
{
    return {
        floor: {
            width: doc.floor.width,
            length: doc.floor.length,
            tiles: doc.floor.tiles.map(t => ({height: t.height ?? 0, walkable: t.walkable ?? true, hole: t.hole ?? false})),
            door: doc.floor.door ? {x: doc.floor.door.x ?? 0, y: doc.floor.door.y ?? 0} : null,
            doorDirection: doc.floor.doorDirection
        },
        decor: (doc.decor ?? []).map(floorItem),
        wallDecor: (doc.wallDecor ?? []).map(wallItem),
        wallHeight: doc.walls?.height ?? 0
    };
}

function floorItem(o: ZoneDecorObject): IIsoFloorItem
{
    return {id: o.id, definition: o.definition, class: o.class, x: o.x, y: o.y, z: o.z ?? 0, rotation: o.rotation ?? 0, state: String(o.state ?? 0)};
}

function wallItem(o: NonNullable<ZoneDocument['wallDecor']>[number]): IIsoWallItem
{
    return {
        id: o.id,
        definition: o.definition,
        class: o.class,
        side: o.side,
        x: o.x,
        y: o.y,
        offsetX: o.offsetX ?? 0,
        offsetY: o.offsetY ?? 0,
        state: String(o.state ?? 0)
    };
}

let _furniData: Promise<IFurnitureData[]> | null = null;

/** The hotel's furnidata (≈ 25 MB), fetched once for the room engine and the catalogue's names. */
export function loadFurniData(): Promise<IFurnitureData[]>
{
    return (_furniData ??= furniData());
}

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
