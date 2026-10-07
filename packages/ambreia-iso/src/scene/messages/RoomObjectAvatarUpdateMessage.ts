/**
 * RoomObjectAvatarUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectAvatarUpdateMessage
 *
 * Update message for avatar with head direction and vertical offset.
 */
import {RoomObjectMoveUpdateMessage} from './RoomObjectMoveUpdateMessage';
import type {IVector3d} from '../../utils/IVector3d';

export class RoomObjectAvatarUpdateMessage extends RoomObjectMoveUpdateMessage
{
    constructor(
        location: IVector3d | null,
        targetLocation: IVector3d | null,
        direction: IVector3d | null,
        dirHead: number,
        canStandUp: boolean,
        baseY: number,
        animationTime: number = NaN,
        skipPositionUpdate: boolean = false,
        jumpingPower: number = NaN
    )
    {
        super(location, targetLocation, direction, animationTime, false, skipPositionUpdate);
        this._dirHead = dirHead;
        this._canStandUp = canStandUp;
        this._baseY = baseY;
        this._jumpingPower = jumpingPower;
    }

    private _dirHead: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarUpdateMessage.as::get dirHead()
    get dirHead(): number
    {
        return this._dirHead;
    }

    private _canStandUp: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarUpdateMessage.as::get canStandUp()
    get canStandUp(): boolean
    {
        return this._canStandUp;
    }

    private _baseY: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectAvatarUpdateMessage.as::get baseY()
    get baseY(): number
    {
        return this._baseY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectAvatarUpdateMessage.as::get jumpingPower()
    private _jumpingPower: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectAvatarUpdateMessage.as::get jumpingPower()
    get jumpingPower(): number
    {
        return this._jumpingPower;
    }
}
