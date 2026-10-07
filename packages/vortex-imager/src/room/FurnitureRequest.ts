/**
 * Turns the furniture and room query strings into the calls the room pipeline takes.
 *
 * Same shape as `avatar/AvatarRequest.ts`, and for the same reason: the URL is a public
 * contract, so the translation from it to engine constants lives in one place and nothing
 * downstream has to know what a query string looks like.
 *
 * The parameter names follow the avatar route's where they mean the same thing (`size`,
 * `direction`, `frame`), because a CMS that already builds one of these URLs should not have
 * to learn a second vocabulary.
 */
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';

export type ImagerQuery = Partial<Record<string, string | string[]>>;

/** A malformed or unanswerable request — answered 400. */
export class RoomRequestError extends Error
{}

/** A well-formed request for something that is not there — answered 404. */
export class RoomNotFoundError extends RoomRequestError
{}

export interface IFurnitureRequest
{
    /**
	 * The furni's class name — what the `.nitro` bundle is called and what
	 * `RoomContentLoader` keys everything on. Either given directly or resolved from `id`.
	 */
    type: string;

    /** `RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE` or `…_WALL`. */
    category: number;

    /** `furniture_color` — the palette index, not an RGB value. */
    colorIndex: number;

    /** Degrees, as the engine reads them: the tile rotation times 45. */
    direction: number;

    /** Room geometry scale: 64 is the room's own, 32 the half-scale asset set. */
    scale: number;

    /** Resize applied to the finished image. */
    zoom: number;

    /** Visualization state, or -1 to leave the object at its default. */
    state: number;

    /** Extra `visualization.update()` passes, to advance an animation. */
    frame: number;

    /** `furniture_extras`. Selects the variant of a multi-sprite furni. */
    extra: string | null;

    /** `0xAARRGGBB`; 0 leaves the canvas transparent. */
    backgroundColor: number;
}

export interface IPetRequest
{
    /** The pet's own `.nitro` bundle name — `dog`, `monsterplant`, … — from `pet.configuration`. */
    type: string;

    /**
	 * `RoomEngine.getPetImage()`'s payload, verbatim:
	 * `<typeId> <paletteId> <colorHex>[ head][ <count> <layer> <part> <palette>…]`.
	 *
	 * Kept as the string rather than as fields because that is what the wire carries, what the
	 * database stores, and what `PetFigureData` takes — composing it here means the renderer
	 * parses exactly what a room would have parsed.
	 */
    figure: string;

    /** Degrees, as the engine reads them: the tile rotation times 45. */
    direction: number;

    /** Degrees too. Ignored for the pets whose `isAllowedToTurnHead` is false. */
    headDirection: number;

    scale: number;
    zoom: number;

    /** Extra `visualization.update()` passes, to advance an animation. */
    frame: number;

    /**
	 * `figure_posture` / `figure_gesture`, or null to leave them unset.
	 *
	 * Null is the default because it is the catalog's: `RoomEngine.getPetImage()` takes a
	 * `posture` argument and every pet widget leaves it null, so the resting pose is what a
	 * preview has always shown. A pet's postures are its own library's — `std`, `lay`, `sit`,
	 * `eat`, `ded`, … — and one it has no animation for resolves to the resting one rather
	 * than failing.
	 */
    posture: string | null;
    gesture: string | null;

    backgroundColor: number;
}

export interface IRoomRequest
{
    roomId: number;
    scale: number;
    zoom: number;
    backgroundColor: number;

    /** Draw the wall planes. `hide_walls` on the room row wins when it is set. */
    walls: boolean;

    /** Draw the placed furniture. Off renders the bare model, like `getRoomImage()` does. */
    furniture: boolean;

    /**
	 * Extra `visualization.update()` passes, advancing every animated furni by that many frames.
	 *
	 * A still image has to pick one frame of an animation, and 0 — the resting frame — is the
	 * only deterministic choice. This is how you get a different one: the same knob the
	 * furniture route's `frame` is, applied to the whole room at once.
	 */
    frame: number;

    /**
	 * Decoration ids overriding the room's own, for previewing a repaint. `null` keeps what
	 * the room is painted with.
	 */
    floorType: string | null;
    wallType: string | null;
    landscapeType: string | null;
}

/** `size=` → the geometry scale to build at, and how the finished image is resized. */
const SIZE_MAP: Record<string, { scale: number; zoom: number }> = {
    s: {scale: 32, zoom: 1},
    m: {scale: 64, zoom: 1},
    l: {scale: 64, zoom: 2},
    b: {scale: 64, zoom: 3}
};

/**
 * Direction 2 is the default because it is the one the catalog previews every floor item at,
 * and it is the direction most furni have art for — `getDirectionValue()` falls back to the
 * nearest available one, so a wrong default is silently a different-looking item.
 */
const DEFAULT_DIRECTION = 2;

export function parseFurnitureRequest(
    query: ImagerQuery,
    resolve: (query: ImagerQuery) => { type: string; category: number; colorIndex: number } | null
): IFurnitureRequest
{
    const resolved = resolve(query);

    if(resolved === null)
    {
        throw new RoomRequestError('Give a furni to render: `class=<name>` or `id=<sprite id>`');
    }

    const size = SIZE_MAP[readSingle(query, 'size')?.toLowerCase() ?? 'm'] ?? SIZE_MAP.m;
    const colorOverride = readNumber(query, 'color', -1);

    return {
        type: resolved.type,
        category: resolved.category,
        colorIndex: colorOverride >= 0 ? colorOverride : resolved.colorIndex,
        direction: (((readNumber(query, 'direction', DEFAULT_DIRECTION) % 8) + 8) % 8) * 45,
        scale: size.scale,
        zoom: readZoom(query, size.zoom),
        state: readNumber(query, 'state', -1),
        frame: Math.max(0, readNumber(query, 'frame', readNumber(query, 'frame_num', 0))),
        extra: readSingle(query, 'extra'),
        backgroundColor: readColor(query, 'bg')
    };
}

/**
 * Builds a pet request. `resolve` maps the `type=` the URL names — a pet's own name, or the
 * numeric type id the wire and the database carry — onto both, since the payload needs the id
 * and the content loader needs the name.
 */
export function parsePetRequest(
    query: ImagerQuery,
    resolve: (query: ImagerQuery) => { type: string; typeId: number } | null
): IPetRequest
{
    const resolved = resolve(query);

    if(resolved === null)
    {
        throw new RoomRequestError('Give a pet to render: `type=<name>` or `type=<type id>`');
    }

    const size = SIZE_MAP[readSingle(query, 'size')?.toLowerCase() ?? 'm'] ?? SIZE_MAP.m;
    const direction = readNumber(query, 'direction', DEFAULT_DIRECTION);

    return {
        type: resolved.type,
        figure: readSingle(query, 'figure') ?? buildPetFigure(resolved.typeId, query),
        direction: (((direction % 8) + 8) % 8) * 45,
        headDirection: (((readNumber(query, 'head_direction', direction) % 8) + 8) % 8) * 45,
        scale: size.scale,
        zoom: readZoom(query, size.zoom),
        frame: Math.max(0, readNumber(query, 'frame', readNumber(query, 'frame_num', 0))),
        posture: readSingle(query, 'posture'),
        gesture: readSingle(query, 'gesture'),
        backgroundColor: readColor(query, 'bg')
    };
}

/**
 * `RoomEngine.getPetImage()`'s payload, built from the loose parameters.
 *
 * The colour is hex and unprefixed because that is how `PetFigureData.parseColor()` reads it
 * back (`parseInt(part, 16)`), and the `head` marker has to sit in position 4 or the custom
 * part count is read off the wrong index — see `PetFigureData.parseCustomData()`.
 */
function buildPetFigure(typeId: number, query: ImagerQuery): string
{
    const palette = Math.max(0, readNumber(query, 'palette', 0));
    const raw = (readSingle(query, 'color') ?? '').replace(/^#/, '');
    const color = /^[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : 'ffffff';

    let figure = `${typeId} ${palette} ${color}`;

    if(readFlag(query, 'head', false)) figure += ' head';

    return figure;
}

export function parseRoomRequest(roomId: number, query: ImagerQuery): IRoomRequest
{
    if(!Number.isFinite(roomId) || roomId <= 0)
    {
        throw new RoomRequestError('Room id must be a positive number');
    }

    const size = SIZE_MAP[readSingle(query, 'size')?.toLowerCase() ?? 'm'] ?? SIZE_MAP.m;

    return {
        roomId,
        scale: size.scale,
        zoom: readZoom(query, size.zoom),
        backgroundColor: readColor(query, 'bg'),
        walls: readFlag(query, 'walls', true),
        furniture: readFlag(query, 'furni', true),

        // Capped: every extra pass re-runs every visualization in the room, so an unbounded
        // value is a request that renders one frame per CPU-second.
        frame: Math.min(600, Math.max(0, readNumber(query, 'frame', 0))),
        floorType: readSingle(query, 'floor'),
        wallType: readSingle(query, 'wall'),
        landscapeType: readSingle(query, 'landscape')
    };
}

/** Cache key for a furniture render. Every field that changes the pixels has to be in it. */
export function furnitureCacheKey(request: IFurnitureRequest): string
{
    return [
        request.type,
        request.category,
        request.colorIndex,
        request.direction,
        request.scale,
        request.zoom,
        request.state,
        request.frame,
        request.extra ?? '',
        request.backgroundColor
    ].join(':');
}

/** Cache key for a pet render. Immutable for its URL, exactly like a furni's. */
export function petCacheKey(request: IPetRequest): string
{
    return [
        request.type,
        request.figure,
        request.direction,
        request.headDirection,
        request.scale,
        request.zoom,
        request.frame,
        request.posture ?? '',
        request.gesture ?? '',
        request.backgroundColor
    ].join(':');
}

/**
 * Cache key for a room render.
 *
 * Deliberately does *not* include the room's contents: a room changes every time someone moves
 * a chair, and the imager has no way to hear about it. The TTL is what keeps this honest —
 * see `IMAGER_ROOM_CACHE_TTL_MS`, which is short for exactly this reason.
 */
export function roomCacheKey(request: IRoomRequest): string
{
    return [
        request.roomId,
        request.scale,
        request.zoom,
        request.backgroundColor,
        request.walls ? 1 : 0,
        request.furniture ? 1 : 0,
        request.frame,
        request.floorType ?? '',
        request.wallType ?? '',
        request.landscapeType ?? ''
    ].join(':');
}

export {RoomObjectCategoryEnum};

function readSingle(query: ImagerQuery, key: string): string | null
{
    const value = query[key];
    const single = Array.isArray(value) ? value[0] : value;

    return single === undefined || single === '' ? null : single;
}

function readNumber(query: ImagerQuery, key: string, fallback: number): number
{
    const raw = readSingle(query, key);

    if(raw === null) return fallback;

    const parsed = Number(raw);

    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function readFlag(query: ImagerQuery, key: string, fallback: boolean): boolean
{
    const raw = readSingle(query, key);

    if(raw === null) return fallback;

    return raw !== '0' && raw.toLowerCase() !== 'false';
}

function readZoom(query: ImagerQuery, fallback: number): number
{
    const raw = readSingle(query, 'zoom') ?? readSingle(query, 'scale');

    if(raw === null) return fallback;

    const parsed = Number(raw);

    // Capped because the caller controls it and the output is allocated at that size: a room
    // at zoom 20 is a several-hundred-megabyte canvas.
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(4, parsed) : fallback;
}

/**
 * `bg=` accepts `RRGGBB`, `AARRGGBB` and the `#` forms. A six-digit value is taken as fully
 * opaque, since asking for a background and getting a transparent one is never what was meant.
 */
function readColor(query: ImagerQuery, key: string): number
{
    const raw = readSingle(query, key);

    if(raw === null) return 0;

    const cleaned = raw.replace(/^#/, '');

    if(!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(cleaned)) return 0;

    const value = Number.parseInt(cleaned, 16);

    return cleaned.length === 6 ? (0xFF000000 | value) >>> 0 : value >>> 0;
}
