import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session pet level update event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionPetLevelUpdateEvent.as
 */
export class RoomSessionPetLevelUpdateEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetLevelUpdateEvent.as::PET_LEVEL_UPDATE
    public static readonly PET_LEVEL_UPDATE = 'RSPLUE_PET_LEVEL_UPDATE';

    constructor(session: IRoomSession, petId: number, level: number)
    {
        super(RoomSessionPetLevelUpdateEvent.PET_LEVEL_UPDATE, session);
        this._petId = petId;
        this._level = level;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetLevelUpdateEvent.as::_petId
    private _petId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetLevelUpdateEvent.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetLevelUpdateEvent.as::_level
    private _level: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetLevelUpdateEvent.as::get level()
    get level(): number
    {
        return this._level;
    }
}
