/**
 * RoomObject
 *
 * Based on AS3: com.sulake.room.object.RoomObject
 *
 * Base implementation of a room object.
 * Manages position, direction, state, model, visualization, and logic.
 */
import type {IVector3d} from '../utils/IVector3d';
import {Vector3d} from '../utils/Vector3d';
import type {IRoomObjectController} from './IRoomObjectController';
import type {IRoomObjectModel} from './IRoomObjectModel';
import type {IRoomObjectModelController} from './IRoomObjectModelController';
import type {IRoomObjectEventHandler} from './logic/IRoomObjectEventHandler';
import type {IRoomObjectMouseHandler} from './logic/IRoomObjectMouseHandler';
import type {IRoomObjectVisualization} from './visualization/IRoomObjectVisualization';
import {RoomObjectModel} from './RoomObjectModel';

export class RoomObject implements IRoomObjectController
{
    private static _instanceCounter: number = 0;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/RoomObject.as::_id
    private _id: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/RoomObject.as::_type
    private _type: string = '';
    private _location: Vector3d;
    private _direction: Vector3d;
    private _locationCache: Vector3d;
    private _directionCache: Vector3d;
    private _states: number[];
    private _model: RoomObjectModel;
    // AS3: .../src/com/sulake/room/object/RoomObject.as::_visualization
    private _visualization: IRoomObjectVisualization | null = null;
    private _eventHandler: IRoomObjectEventHandler | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/RoomObject.as::_updateID
    private _updateID: number = 0;
    // AS3: .../src/com/sulake/room/object/RoomObject.as::_avatarLibraryAssetName
    private _avatarLibraryAssetName: string | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/RoomObject.as::_instanceId
    private _instanceId: number = 0;
    private _initialized: boolean = false;

    constructor(id: number, stateCount: number, type: string)
    {
        this._id = id;
        this._location = new Vector3d();
        this._direction = new Vector3d();
        this._locationCache = new Vector3d();
        this._directionCache = new Vector3d();
        this._states = new Array(stateCount);

        for(let i = stateCount - 1; i >= 0; i--)
        {
            this._states[i] = 0;
        }

        this._type = type;
        this._model = new RoomObjectModel();
        this._instanceId = RoomObject._instanceCounter++;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::dispose()
    dispose(): void
    {
        this._avatarLibraryAssetName = null;
        this.setVisualization(null);
        this.setEventHandler(null);

        if(this._model !== null)
        {
            this._model.dispose();
        }
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::setInitialized()
    setInitialized(value: boolean): void
    {
        this._initialized = value;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::isInitialized()
    isInitialized(): boolean
    {
        return this._initialized;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getId()
    getId(): number
    {
        return this._id;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getInstanceId()
    getInstanceId(): number
    {
        return this._instanceId;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getType()
    getType(): string
    {
        return this._type;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getLocation()
    getLocation(): IVector3d
    {
        this._locationCache.assign(this._location);

        return this._locationCache;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getDirection()
    getDirection(): IVector3d
    {
        this._directionCache.assign(this._direction);

        return this._directionCache;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getModel()
    getModel(): IRoomObjectModel
    {
        return this._model;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getModelController()
    getModelController(): IRoomObjectModelController
    {
        return this._model;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getState()
    getState(index: number): number
    {
        if(index >= 0 && index < this._states.length)
        {
            return this._states[index];
        }

        return -1;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getVisualization()
    getVisualization(): IRoomObjectVisualization | null
    {
        return this._visualization;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::setLocation()
    setLocation(location: IVector3d): void
    {
        if(location === null)
        {
            return;
        }

        if(this._location.x !== location.x || this._location.y !== location.y || this._location.z !== location.z)
        {
            this._location.x = location.x;
            this._location.y = location.y;
            this._location.z = location.z;
            this._updateID++;
        }
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::setDirection()
    setDirection(direction: IVector3d): void
    {
        if(direction === null)
        {
            return;
        }

        if(this._direction.x !== direction.x || this._direction.y !== direction.y || this._direction.z !== direction.z)
        {
            this._direction.x = ((direction.x % 360) + 360) % 360;
            this._direction.y = ((direction.y % 360) + 360) % 360;
            this._direction.z = ((direction.z % 360) + 360) % 360;
            this._updateID++;
        }
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::setState()
    setState(state: number, index: number): boolean
    {
        if(index >= 0 && index < this._states.length)
        {
            if(this._states[index] !== state)
            {
                this._states[index] = state;
                this._updateID++;
            }

            return true;
        }

        return false;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::setVisualization()
    setVisualization(visualization: IRoomObjectVisualization | null): void
    {
        if(visualization !== this._visualization)
        {
            if(this._visualization !== null)
            {
                this._visualization.dispose();
            }

            this._visualization = visualization;

            if(this._visualization !== null)
            {
                this._visualization.object = this;
            }
        }
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::setEventHandler()
    setEventHandler(handler: IRoomObjectEventHandler | null): void
    {
        if(handler === this._eventHandler)
        {
            return;
        }

        const oldHandler = this._eventHandler;

        if(oldHandler !== null)
        {
            this._eventHandler = null;
            oldHandler.object = null;
        }

        this._eventHandler = handler;

        if(this._eventHandler !== null)
        {
            this._eventHandler.object = this;
        }
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getEventHandler()
    getEventHandler(): IRoomObjectEventHandler | null
    {
        return this._eventHandler;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getUpdateID()
    getUpdateID(): number
    {
        return this._updateID;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getMouseHandler()
    getMouseHandler(): IRoomObjectMouseHandler | null
    {
        return this.getEventHandler();
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::getAvatarLibraryAssetName()
    getAvatarLibraryAssetName(): string
    {
        if(!this._avatarLibraryAssetName)
        {
            this._avatarLibraryAssetName = `avatar_${this.getId()}`;
        }

        return this._avatarLibraryAssetName;
    }

    // AS3: .../src/com/sulake/room/object/RoomObject.as::tearDown()
    tearDown(): void
    {
        if(this._eventHandler)
        {
            this._eventHandler.tearDown();
        }
    }
}
