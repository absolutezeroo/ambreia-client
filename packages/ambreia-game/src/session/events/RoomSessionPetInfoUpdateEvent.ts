import type {IRoomSession} from '../IRoomSession';
import type {IPetInfo} from '../IPetInfo';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session pet info update event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionPetInfoUpdateEvent.as
 */
export class RoomSessionPetInfoUpdateEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetInfoUpdateEvent.as::PET_INFO
    public static readonly PET_INFO = 'RSPIUE_PET_INFO';

    constructor(session: IRoomSession, petInfo: IPetInfo)
    {
        super(RoomSessionPetInfoUpdateEvent.PET_INFO, session);
        this._petInfo = petInfo;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetInfoUpdateEvent.as::_petInfo
    private _petInfo: IPetInfo;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetInfoUpdateEvent.as::get petInfo()
    get petInfo(): IPetInfo
    {
        return this._petInfo;
    }
}
