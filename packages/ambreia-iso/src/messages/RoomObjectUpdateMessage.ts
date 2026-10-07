/**
 * RoomObjectUpdateMessage
 *
 * Based on AS3: com.sulake.room.messages.RoomObjectUpdateMessage
 *
 * Base class for room object update messages.
 * Contains location and direction information.
 */
import type {IVector3d} from '../utils/IVector3d';

export class RoomObjectUpdateMessage
{
    protected _location: IVector3d | null;
    protected _direction: IVector3d | null;

    constructor(location: IVector3d | null, direction: IVector3d | null)
    {
        this._location = location;
        this._direction = direction;
    }

    // AS3: .../src/com/sulake/room/messages/RoomObjectUpdateMessage.as::get loc()
    get loc(): IVector3d | null
    {
        return this._location;
    }

    // AS3: .../src/com/sulake/room/messages/RoomObjectUpdateMessage.as::get dir()
    get dir(): IVector3d | null
    {
        return this._direction;
    }
}
