/**
 * RoomObjectManager
 *
 * Based on AS3: com.sulake.room.RoomObjectManager
 *
 * Manages room objects within a single category.
 * Provides object creation, retrieval, and disposal.
 */
import type {IRoomObject} from './object/IRoomObject';
import type {IRoomObjectController} from './object/IRoomObjectController';
import type {IRoomObjectManager} from './IRoomObjectManager';
import {RoomObject} from './object/RoomObject';

export class RoomObjectManager implements IRoomObjectManager
{
    private _objectsByType: Map<string, Map<string, IRoomObjectController>> = new Map();
    private _cachedValues: IRoomObjectController[] | null = null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/RoomObjectManager.as::_objects
    private _objects: Map<string, IRoomObjectController> = new Map();

    get objects(): IRoomObject[]
    {
        return this.getCachedValues();
    }

    get objectCount(): number
    {
        return this._objects.size;
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::dispose()
    dispose(): void
    {
        this.reset();
        this._objects.clear();
        this._objectsByType.clear();
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::createObject()
    createObject(id: number, stateCount: number, type: string): IRoomObjectController | null
    {
        const object = new RoomObject(id, stateCount, type);

        return this.addObject(String(id), type, object);
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::getObject()
    getObject(id: number): IRoomObject | null
    {
        return this._objects.get(String(id)) ?? null;
    }

    getObjectByIndex(index: number): IRoomObject | null
    {
        const values = this.getCachedValues();

        if(index >= 0 && index < values.length)
        {
            return values[index];
        }

        return null;
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::getObjectCountForType()
    getObjectCountForType(type: string): number
    {
        const typeMap = this.getObjectsForType(type, false);

        if(typeMap !== null)
        {
            return typeMap.size;
        }

        return 0;
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::getObjectWithIndexAndType()
    getObjectWithIndexAndType(index: number, type: string): IRoomObjectController | null
    {
        const typeMap = this.getObjectsForType(type, false);

        if(typeMap !== null)
        {
            let i = 0;

            for(const obj of typeMap.values())
            {
                if(i === index)
                {
                    return obj;
                }

                i++;
            }
        }

        return null;
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::disposeObject()
    disposeObject(id: number): boolean
    {
        const idKey = String(id);
        const object = (this._objects.get(idKey) ?? null) as RoomObject | null;

        if(object !== null)
        {
            const type = object.getType();
            const typeMap = this.getObjectsForType(type, false);

            if(typeMap !== null)
            {
                typeMap.delete(idKey);
            }

            this._objects.delete(idKey);
            this._cachedValues = null;
            object.dispose();

            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::reset()
    reset(): void
    {
        for(const object of this._objects.values())
        {
            object.dispose();
        }

        this._objects.clear();
        this._cachedValues = null;

        for(const typeMap of this._objectsByType.values())
        {
            typeMap.clear();
        }

        this._objectsByType.clear();
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::addObject()
    private addObject(idKey: string, type: string, object: IRoomObjectController): IRoomObjectController | null
    {
        if(this._objects.has(idKey))
        {
            object.dispose();

            return null;
        }

        this._objects.set(idKey, object);
        this._cachedValues = null;

        const typeMap = this.getObjectsForType(type, true)!;
        typeMap.set(idKey, object);

        return object;
    }

    private getCachedValues(): IRoomObjectController[]
    {
        if(this._cachedValues === null)
        {
            this._cachedValues = Array.from(this._objects.values());
        }

        return this._cachedValues;
    }

    // AS3: .../src/com/sulake/room/RoomObjectManager.as::getObjectsForType()
    private getObjectsForType(type: string, createIfMissing: boolean = true): Map<string, IRoomObjectController> | null
    {
        let typeMap = this._objectsByType.get(type);

        if(typeMap === undefined && createIfMissing)
        {
            typeMap = new Map();
            this._objectsByType.set(type, typeMap);
        }

        return typeMap ?? null;
    }
}
