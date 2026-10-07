/**
 * A room as the map editor authors it: the emulator's zone format (`zone.schema.json`), field
 * for field — the floor grid and the furniture on it. Zones, spawns, NPCs and triggers are drawn
 * by the editor over the view, not by iso.
 */
export interface IIsoTile
{
    /** 0..32, in tiles (one tile of height = one floor step). */
    height: number;
    walkable: boolean;
    /** No floor at all: the tile is cut out of the room. */
    hole: boolean;
}

export interface IIsoFloor
{
    width: number;
    /** At most {@link MAX_ROOM_LENGTH}. */
    length: number;
    /** Row by row: the tile at (x, y) is `tiles[y * width + x]`. */
    tiles: IIsoTile[];
    door?: {x: number; y: number} | null;
    doorDirection?: number;
}

export interface IIsoFloorItem
{
    /** The editor's own id ("throne_1") or a number; iso maps it to its internal one. */
    id: string | number;
    /** The furnidata id (Habbo sprite id). */
    definition: number;
    class: string;
    x: number;
    y: number;
    z: number;
    /** 0, 2, 4 or 6. */
    rotation: number;
    state: string;
}

export interface IIsoWallItem
{
    id: string | number;
    definition: number;
    class: string;
    side: 'Left' | 'Right';
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    state: string;
}

export interface IIsoRoomData
{
    floor: IIsoFloor;
    decor: IIsoFloorItem[];
    wallDecor: IIsoWallItem[];
    /** Extra wall height in tiles (the room's `wall_height`); 0 or absent = the default. */
    wallHeight?: number;
    floorType?: string;
    wallType?: string;
    landscapeType?: string;
}

/** The zone format's limit on a floor's length (and the room planes' practical one). */
export const MAX_ROOM_LENGTH = 64;

const ROTATIONS = new Set([0, 2, 4, 6]);

/**
 * Why the data cannot be loaded, naming the field, or null when it can. Checked before anything is
 * built, so a bad zone draws nothing rather than half a room.
 */
export function validateRoomData(data: IIsoRoomData): string | null
{
    const {floor} = data;

    if(!(floor.width > 0) || !(floor.length > 0)) return `floor is ${floor.width} × ${floor.length}`;
    if(floor.length > MAX_ROOM_LENGTH) return `floor.length > ${MAX_ROOM_LENGTH}`;

    const expected = floor.width * floor.length;

    if(floor.tiles.length !== expected) return `floor.tiles has ${floor.tiles.length} tiles, width × length is ${expected}`;

    const door = floor.door;

    if(door && (door.x < 0 || door.y < 0 || door.x >= floor.width || door.y >= floor.length))
    {
        return `floor.door (${door.x}, ${door.y}) is outside the ${floor.width} × ${floor.length} floor`;
    }

    const ids = new Set<string>();
    const checkId = (field: string, id: string | number): string | null =>
    {
        const key = String(id);

        if(ids.has(key)) return `${field}.id ${typeof id === 'string' ? `"${id}"` : id} is used twice`;
        ids.add(key);

        return null;
    };

    for(let i = 0; i < data.decor.length; i++)
    {
        const item = data.decor[i];

        if(!ROTATIONS.has(item.rotation)) return `decor[${i}].rotation ${item.rotation} is not 0, 2, 4 or 6`;

        const duplicate = checkId(`decor[${i}]`, item.id);

        if(duplicate) return duplicate;
    }

    for(let i = 0; i < data.wallDecor.length; i++)
    {
        const item = data.wallDecor[i];

        if(item.side !== 'Left' && item.side !== 'Right') return `wallDecor[${i}].side "${item.side as string}" is not Left or Right`;

        const duplicate = checkId(`wallDecor[${i}]`, item.id);

        if(duplicate) return duplicate;
    }

    return null;
}
