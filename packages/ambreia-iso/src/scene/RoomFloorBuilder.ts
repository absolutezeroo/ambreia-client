import {Vector3d} from '../utils/Vector3d';
import type {RoomGeometry} from '../utils/RoomGeometry';
import type {IRoomObjectController} from '../object/IRoomObjectController';
import {RoomPlaneParser} from './object/RoomPlaneParser';
import {RoomObjectVariableEnum} from './object/RoomObjectVariableEnum';
import {RoomObjectRoomMaskUpdateMessage} from './messages/RoomObjectRoomMaskUpdateMessage';
import {LegacyWallGeometry} from './utils/LegacyWallGeometry';
import type {IIsoFloor} from '../IIsoRoomData';

// The room steps of RoomEngine.initializeRoom() and RoomMessageHandler.onFloorHeightMap(), from a
// floor grid instead of a heightmap message. Lifted from the imager (RoomRenderService), which
// built rooms out of session the same way before J4.

/** RoomPlaneParser's "no floor here". */
export const TILE_BLOCKED = -110;

const DOOR_DIR_LEFT = 90;
const DOOR_DIR_BACK = 180;

/** Where the door is cut: its half-tile position on the wall, its height, and which wall. */
export interface IRoomDoor
{
    x: number;
    y: number;
    z: number;
    dir: number;
    tileX: number;
    tileY: number;
}

/** Tile heights, row by row, with holes blocked. */
export function floorHeights(floor: IIsoFloor): number[]
{
    return floor.tiles.map(tile => (tile.hole ? TILE_BLOCKED : tile.height));
}

/**
 * The door, read off the floor's door tile the way AS3 finds it: a tile in the left wall (blocked
 * above, left and below) or in the back wall (blocked above, left and right). Null when the tile
 * is in neither, which leaves the walls closed.
 */
export function findDoor(floor: IIsoFloor, heights: readonly number[]): IRoomDoor | null
{
    const door = floor.door;

    if(!door) return null;

    const heightAt = (x: number, y: number): number =>
        (x < 0 || x >= floor.width || y < 0 || y >= floor.length ? TILE_BLOCKED : heights[y * floor.width + x]);
    const {x, y} = door;
    const height = heightAt(x, y);

    // AS3's own guard: an edge tile in *both* axes cannot be a door.
    if(!(y > 0 && y < floor.length - 1 || x > 0 && x < floor.width - 1) || height === TILE_BLOCKED) return null;

    if(heightAt(x, y - 1) === TILE_BLOCKED && heightAt(x - 1, y) === TILE_BLOCKED && heightAt(x, y + 1) === TILE_BLOCKED)
    {
        return {x: x + 0.5, y, z: height, dir: DOOR_DIR_LEFT, tileX: x, tileY: y};
    }

    if(heightAt(x, y - 1) === TILE_BLOCKED && heightAt(x - 1, y) === TILE_BLOCKED && heightAt(x + 1, y) === TILE_BLOCKED)
    {
        return {x, y: y + 0.5, z: height, dir: DOOR_DIR_BACK, tileX: x, tileY: y};
    }

    return null;
}

/**
 * The floor and wall planes. The two setTileHeight() calls around initializeFromTileData() are
 * onFloorHeightMap()'s and both matter: the first makes the door tile solid so a floor plane is
 * generated under it, the second raises it by a wall's height so the doorway is cut through.
 */
export function buildPlaneParser(floor: IIsoFloor, heights: readonly number[], wallHeight: number, door: IRoomDoor | null): RoomPlaneParser
{
    const parser = new RoomPlaneParser();

    parser.reset();
    parser.initializeTileMap(floor.width, floor.length);

    for(let y = 0; y < floor.length; y++)
    {
        for(let x = 0; x < floor.width; x++) parser.setTileHeight(x, y, heights[y * floor.width + x]);
    }

    if(door !== null) parser.setTileHeight(door.tileX, door.tileY, door.z);

    parser.initializeFromTileData(wallHeight, door === null ? undefined : {x: door.tileX, y: door.tileY});

    if(door !== null) parser.setTileHeight(door.tileX, door.tileY, door.z + parser.wallHeight);

    return parser;
}

/** Wall item positions: the same geometry RoomMessageHandler reads a `:w=x,y l=dx,dy r` through. */
export function buildWallGeometry(floor: IIsoFloor, heights: readonly number[], wallHeight: number, scale: number): LegacyWallGeometry
{
    const geometry = new LegacyWallGeometry();

    geometry.initialize(floor.width, floor.length, wallHeight);
    geometry.scale = scale;

    for(let y = 0; y < floor.length; y++)
    {
        for(let x = 0; x < floor.width; x++) geometry.setTileHeight(x, y, heights[y * floor.width + x]);
    }

    return geometry;
}

/**
 * Cuts the doorway out of the wall. The mask goes at the door's half-tile position, where the
 * wall plane is (an integer tile centre matches no plane and the mask is silently dropped); the
 * ROOM_DOOR_* variables take that offset back off, which is AS3's own asymmetry.
 */
export function applyDoorMask(object: IRoomObjectController, door: IRoomDoor | null): void
{
    if(door === null) return;

    const model = object.getModelController();

    object.getEventHandler()?.processUpdateMessage(new RoomObjectRoomMaskUpdateMessage(
        RoomObjectRoomMaskUpdateMessage.ADD_MASK,
        'door_0',
        RoomObjectRoomMaskUpdateMessage.MASK_TYPE_DOOR,
        new Vector3d(door.x, door.y, door.z),
        RoomObjectRoomMaskUpdateMessage.MASK_CATEGORY_HOLE
    ));

    model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_X, door.dir === DOOR_DIR_LEFT ? door.x - 0.5 : door.x, true);
    model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_Y, door.dir === DOOR_DIR_BACK ? door.y - 0.5 : door.y, true);
    model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_Z, door.z, true);
    model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_DIR, door.dir, true);
}

/** Pushes everything outside the doorway away, as RoomEngine.applyRoomCanvasGeometry() does. */
export function applyDoorDisplacement(geometry: RoomGeometry, door: IRoomDoor | null): void
{
    if(door === null) return;

    geometry.setDisplacement(
        new Vector3d(door.dir === DOOR_DIR_LEFT ? door.x - 0.5 : door.x, door.dir === DOOR_DIR_BACK ? door.y - 0.5 : door.y, door.z),
        door.dir === DOOR_DIR_LEFT ? new Vector3d(-2000, 0, 0) : new Vector3d(0, -2000, 0)
    );
}
