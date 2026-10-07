/**
 * RoomToObjectOwnAvatarMoveEvent
 *
 * @see source_as_win63/habbo/room/events/RoomToObjectOwnAvatarMoveEvent.as
 *
 * Event dispatched to move the user's own avatar to a target location.
 */
import {RoomToObjectEvent} from '../../events/RoomToObjectEvent';
import type {IVector3d} from '../../utils/IVector3d';

export class RoomToObjectOwnAvatarMoveEvent extends RoomToObjectEvent
{
    // AS3: .../src/com/sulake/habbo/room/events/RoomToObjectOwnAvatarMoveEvent.as::MOVE_TO
    public static readonly MOVE_TO = 'ROAME_MOVE_TO';

    constructor(type: string, targetLoc: IVector3d)
    {
        super(type);
        this._targetLoc = targetLoc;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomToObjectOwnAvatarMoveEvent.as::_targetLoc
    private _targetLoc: IVector3d;

    // AS3: .../src/com/sulake/habbo/room/events/RoomToObjectOwnAvatarMoveEvent.as::get targetLoc()
    get targetLoc(): IVector3d
    {
        return this._targetLoc;
    }
}
