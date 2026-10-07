/**
 * RoomObjectFactory
 *
 * Based on AS3: com.sulake.habbo.room.RoomObjectFactory
 *
 * Factory for creating room object logic instances and object managers.
 * Visualization creation is handled by RoomObjectVisualizationFactory.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as
 */
import {EventEmitter} from 'eventemitter3';
import type {IRoomObjectFactory} from '@room/IRoomObjectFactory';
import type {IRoomObjectEventHandler} from '@room/object/logic/IRoomObjectEventHandler';
import type {IRoomObjectManager} from '@room/IRoomObjectManager';
import {RoomObjectManager} from '@room/RoomObjectManager';
import type {RoomObjectLogicRegistry} from '@room/object/RoomObjectLogicRegistry';

export class RoomObjectFactory implements IRoomObjectFactory
{
    private _registeredTypes: Map<string, boolean>;
    // AS3: .../src/com/sulake/habbo/room/RoomObjectFactory.as::_trackedEventTypes
    private _trackedEventTypes: Map<string, boolean>;
    // AS3: .../src/com/sulake/habbo/room/RoomObjectFactory.as::_objectEventListeners
    private _objectEventListeners: Array<(event: unknown) => void>;

    private readonly _logics: RoomObjectLogicRegistry;

    constructor(logics: RoomObjectLogicRegistry)
    {
        this._logics = logics;
        this._events = new EventEmitter();
        this._registeredTypes = new Map();
        this._trackedEventTypes = new Map();
        this._objectEventListeners = [];
    }

    private _events: EventEmitter;

    get events(): EventEmitter
    {
        return this._events;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::addObjectEventListener()
    addObjectEventListener(callback: (event: unknown) => void): void
    {
        if(this._objectEventListeners.indexOf(callback) < 0)
        {
            this._objectEventListeners.push(callback);

            if(callback !== null)
            {
                for(const eventType of this._trackedEventTypes.keys())
                {
                    this._events.on(eventType, callback);
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::removeObjectEventListener()
    removeObjectEventListener(callback: (event: unknown) => void): void
    {
        const index = this._objectEventListeners.indexOf(callback);

        if(index >= 0)
        {
            this._objectEventListeners.splice(index, 1);

            if(callback !== null)
            {
                for(const eventType of this._trackedEventTypes.keys())
                {
                    this._events.off(eventType, callback);
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::createRoomObjectLogic()
    // DEVIATION: AS3 switches over the types here; the registry passed in holds them since J4, and
    //   an unregistered type gets no event handler, as an unknown one did in the switch.
    createRoomObjectLogic(type: string): IRoomObjectEventHandler | null
    {
        const logic = this._logics.create(type);

        if(logic !== null)
        {
            logic.eventDispatcher = this._events;

            if(!this._registeredTypes.has(type))
            {
                this._registeredTypes.set(type, true);

                const eventTypes = logic.getEventTypes();

                for(const eventType of eventTypes)
                {
                    this.addTrackedEventType(eventType);
                }
            }

            return logic;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::createRoomObjectManager()
    createRoomObjectManager(): IRoomObjectManager
    {
        return new RoomObjectManager();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/RoomObjectFactory.as::addTrackedEventType()
    private addTrackedEventType(eventType: string): void
    {
        if(!this._trackedEventTypes.has(eventType))
        {
            this._trackedEventTypes.set(eventType, true);

            for(const listener of this._objectEventListeners)
            {
                if(listener !== null)
                {
                    this._events.on(eventType, listener);
                }
            }
        }
    }
}
