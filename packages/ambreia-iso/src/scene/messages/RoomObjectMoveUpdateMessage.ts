/**
 * RoomObjectMoveUpdateMessage
 *
 * Based on AS3: com.sulake.habbo.room.messages.RoomObjectMoveUpdateMessage
 *
 * Update message for moving objects with target location and animation time.
 */
import {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IVector3d} from '../../utils/IVector3d';

export class RoomObjectMoveUpdateMessage extends RoomObjectUpdateMessage
{
    constructor(
        location: IVector3d | null,
        targetLocation: IVector3d | null,
        direction: IVector3d | null,
        animationTime: number = NaN,
        isSlideUpdate: boolean = false,
        skipPositionUpdate: boolean = false,
        overshootAnimationTime: number = NaN,
        curveStrength: number = NaN
    )
    {
        super(location, direction);
        this._targetLoc = targetLocation;
        this._animationTime = animationTime;
        this._isSlideUpdate = isSlideUpdate;
        this._skipPositionUpdate = skipPositionUpdate;
        this._overshootAnimationTime = overshootAnimationTime;
        this._curveStrength = curveStrength;
    }

    private _targetLoc: IVector3d | null;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::get targetLoc()
    get targetLoc(): IVector3d | null
    {
        if(this._targetLoc === null)
        {
            return this.loc;
        }

        return this._targetLoc;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::get realTargetLoc()
    get realTargetLoc(): IVector3d | null
    {
        return this._targetLoc;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::_animationTime
    private _animationTime: number;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::get animationTime()
    get animationTime(): number
    {
        return this._animationTime;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::_isSlideUpdate
    private _isSlideUpdate: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::get isSlideUpdate()
    get isSlideUpdate(): boolean
    {
        return this._isSlideUpdate;
    }

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::_skipPositionUpdate
    private _skipPositionUpdate: boolean;

    // AS3: .../src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::get skipPositionUpdate()
    get skipPositionUpdate(): boolean
    {
        return this._skipPositionUpdate;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::_overshootAnimationTime
    private _overshootAnimationTime: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::get overshootAnimationTime()
    get overshootAnimationTime(): number
    {
        return this._overshootAnimationTime;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::_curveStrength
    private _curveStrength: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/messages/RoomObjectMoveUpdateMessage.as::get curveStrength()
    get curveStrength(): number
    {
        return this._curveStrength;
    }
}
