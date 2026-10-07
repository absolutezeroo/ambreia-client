/**
 * ObjectLogicBase
 *
 * Based on AS3: com.sulake.room.object.logic.ObjectLogicBase
 *
 * Base class for room object logic handlers.
 * Provides default implementations for all IRoomObjectEventHandler methods.
 */
import type {EventEmitter} from 'eventemitter3';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {IRoomObjectController} from '../IRoomObjectController';
import type {IRoomObjectEventHandler} from './IRoomObjectEventHandler';

export class ObjectLogicBase implements IRoomObjectEventHandler
{
    private _eventDispatcher: EventEmitter | null = null;

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::get eventDispatcher()
    get eventDispatcher(): EventEmitter | null
    {
        return this._eventDispatcher;
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::set eventDispatcher()
    set eventDispatcher(value: EventEmitter | null)
    {
        this._eventDispatcher = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/object/logic/ObjectLogicBase.as::_object
    private _object: IRoomObjectController | null = null;

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::get object()
    get object(): IRoomObjectController | null
    {
        return this._object;
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::set object()
    set object(value: IRoomObjectController | null)
    {
        if(this._object === value)
        {
            return;
        }

        if(this._object !== null)
        {
            this._object.setEventHandler(null);
        }

        if(value === null)
        {
            this.dispose();
            this._object = null;
        }
        else
        {
            this._object = value;
            this._object.setEventHandler(this);
        }
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::get widget()
    get widget(): string | null
    {
        return null;
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::get contextMenu()
    get contextMenu(): string | null
    {
        return null;
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::getEventTypes()
    getEventTypes(): string[]
    {
        return [];
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::dispose()
    dispose(): void
    {
        this._object = null;
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::mouseEvent()
    mouseEvent(_event: RoomSpriteMouseEvent, _geometry: IRoomGeometry): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::initialize()
    initialize(_data: unknown): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::update()
    update(_time: number): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::processUpdateMessage()
    processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(message !== null)
        {
            if(this._object !== null)
            {
                if(message.loc)
                {
                    this._object.setLocation(message.loc);
                }

                if(message.dir)
                {
                    this._object.setDirection(message.dir);
                }
            }
        }
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::useObject()
    useObject(): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::tearDown()
    tearDown(): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/room/object/logic/ObjectLogicBase.as::getAllEventTypes()
    protected getAllEventTypes(baseTypes: string[], additionalTypes: string[]): string[]
    {
        const result = baseTypes.slice();

        for(const type of additionalTypes)
        {
            if(result.indexOf(type) < 0)
            {
                result.push(type);
            }
        }

        return result;
    }
}
