/**
 * TileObjectMap
 *
 * @see source_as_flash/com/sulake/habbo/room/utils/TileObjectMap.as
 *
 * 2D spatial index mapping tiles to room objects.
 * Enables fast O(1) lookup of which object occupies a given tile.
 */
import type {IRoomObject} from '../../object/IRoomObject';
import {RoomObjectVariableEnum} from '../object/RoomObjectVariableEnum';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.room.utils.TileObjectMap');

export class TileObjectMap
{
    private _map: (IRoomObject | null)[];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/TileObjectMap.as::_width
    private _width: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/TileObjectMap.as::_height
    private _height: number;

    constructor(width: number, height: number)
    {
        this._width = width;
        this._height = height;
        this._map = new Array(width * height).fill(null);
    }

    /**
	 * Get the room object occupying a tile.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/TileObjectMap.as::getObjectInTile()
    getObjectInTile(x: number, y: number): IRoomObject | null
    {
        if(x < 0 || x >= this._width || y < 0 || y >= this._height)
        {
            return null;
        }

        return this._map[y * this._width + x];
    }

    /**
	 * Set a room object in a tile.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/TileObjectMap.as::setObjectInTile()
    setObjectInTile(x: number, y: number, object: IRoomObject | null): void
    {
        // AS3 refuses (and logs) an object that isn't initialised: its getLocation()
        // is already valid, so it would win the hit-test and mask a real object.
        if(object === null)
        {
            return;
        }

        if(!object.isInitialized())
        {
            log.warn('Assigning non initialized object to tile object map!');

            return;
        }

        if(x < 0 || x >= this._width || y < 0 || y >= this._height)
        {
            return;
        }

        this._map[y * this._width + x] = object;
    }

    /**
	 * Add a room object to the map, considering its footprint (size and rotation).
	 * Based on AS3 TileObjectMap.addRoomObject()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/TileObjectMap.as::addRoomObject()
    addRoomObject(object: IRoomObject): void
    {
        // AS3 bails on a null/model-less/uninitialised object (the null check is dead
        // here since the type is non-null, but the model and isInitialized guards are
        // not: an uninitialised object has a valid location and would mask a real one).
        const model = object.getModel();

        if(model === null || !object.isInitialized())
        {
            return;
        }

        const location = object.getLocation();

        if(location === null)
        {
            return;
        }

        const direction = object.getDirection();

        if(direction === null)
        {
            return;
        }

        let sizeX = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_X);
        let sizeY = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Y);

        if(sizeX < 1) sizeX = 1;
        if(sizeY < 1) sizeY = 1;

        // AS3: (int(direction.x + 45)) % 360 / 90 -> {0,1,2,3}
        const dir = Math.trunc((Math.trunc(direction.x + 45) % 360) / 90);

        if(dir === 1 || dir === 3)
        {
            const temp = sizeX;
            sizeX = sizeY;
            sizeY = temp;
        }

        // AS3 compares raw z only — furniture_size_z is not involved: overwrite when
        // the tile is empty, or the occupant is a *different* object whose z is <= this
        // object's z. At equal z the last-added object wins (the port previously added
        // size_z on both sides and flipped <= to >, so the tallest won instead — the
        // wrong object came back from the tile hit-test on click).
        for(let iy = Math.trunc(location.y); iy < location.y + sizeY; iy++)
        {
            for(let ix = Math.trunc(location.x); ix < location.x + sizeX; ix++)
            {
                const occupant = this.getObjectInTile(ix, iy);

                if(occupant === null || (occupant !== object && (occupant.getLocation()?.z ?? 0) <= location.z))
                {
                    this.setObjectInTile(ix, iy, object);
                }
            }
        }
    }

    /**
	 * Clear all tiles.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/TileObjectMap.as::clear()
    clear(): void
    {
        this._map.fill(null);
    }

    /**
	 * Rebuild the whole map from scratch from a fresh object list.
	 * Based on AS3 TileObjectMap.populate()
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/TileObjectMap.as::populate()
    populate(objects: readonly IRoomObject[]): void
    {
        this.clear();

        for(const object of objects) this.addRoomObject(object);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/utils/TileObjectMap.as::dispose()
    dispose(): void
    {
        // AS3 also zeroes the dimensions: leaving them set while _map is empty keeps
        // getObjectInTile()'s bounds check passing, so it reads undefined out of an
        // empty array instead of returning null.
        this._map = [];
        this._width = 0;
        this._height = 0;
    }
}
