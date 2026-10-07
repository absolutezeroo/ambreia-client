/**
 * RoomObjectHeightUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectHeightUpdateMessage
 *
 * Update message for furniture height changes.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IVector3d} from '../../utils/IVector3d';

export class RoomObjectHeightUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(location: IVector3d | null, direction: IVector3d | null, height: number)
    {
        super(location, direction);
        this._height = height;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/messages/RoomObjectHeightUpdateMessage.as::_height
    private _height: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectHeightUpdateMessage.as::get height()
    get height(): number
    {
        return this._height;
    }
}
