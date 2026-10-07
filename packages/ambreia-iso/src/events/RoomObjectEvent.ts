/**
 * RoomObjectEvent
 *
 * Based on AS3: com.sulake.room.events.RoomObjectEvent
 *
 * Event emitted by room objects.
 */
import type {IRoomObject} from '../object/IRoomObject';

export class RoomObjectEvent
{
    constructor(type: string, object: IRoomObject | null)
    {
        this._type = type;
        this._object = object;
    }

    private _type: string;

    get type(): string
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectEvent.as::_object
    private _object: IRoomObject | null;

    // AS3: .../src/com/sulake/room/events/RoomObjectEvent.as::get object()
    get object(): IRoomObject | null
    {
        return this._object;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectEvent.as::get objectId()
    get objectId(): number
    {
        if(this._object !== null)
        {
            return this._object.getId();
        }

        return -1;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectEvent.as::get objectType()
    get objectType(): string | null
    {
        if(this._object !== null)
        {
            return this._object.getType();
        }

        return null;
    }
}
