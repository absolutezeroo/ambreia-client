/**
 * RoomObjectAvatarDirectionUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarDirectionUpdateMessage
 *
 * Update message for an avatar turning on the spot: the body direction rides on the base
 * RoomObjectUpdateMessage (which the logic's super.processUpdateMessage applies), the head
 * direction is this class's own field.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IVector3d} from '../../utils/IVector3d';

export class RoomObjectAvatarDirectionUpdateMessage extends RoomObjectUpdateMessage
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectAvatarDirectionUpdateMessage.as::RoomObjectAvatarDirectionUpdateMessage()
    constructor(location: IVector3d | null, direction: IVector3d | null, dirHead: number)
    {
        super(location, direction);
        this._dirHead = dirHead;
    }

    private _dirHead: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectAvatarDirectionUpdateMessage.as::get dirHead()
    get dirHead(): number
    {
        return this._dirHead;
    }
}
