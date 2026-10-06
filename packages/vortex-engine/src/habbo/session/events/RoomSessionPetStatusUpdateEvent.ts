import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session pet status update event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionPetStatusUpdateEvent.as
 */
export class RoomSessionPetStatusUpdateEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetStatusUpdateEvent.as::PET_STATUS_UPDATE
    public static readonly PET_STATUS_UPDATE = 'RSPFUE_PET_STATUS_UPDATE';

    // DEVIATION: AS3 also carries canBreed / canHarvest / canRevive / hasBreedingPermission; the RPG
    //   fork removed pet breeding and monsterplants, so only the pet id is left.
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetStatusUpdateEvent.as::RoomSessionPetStatusUpdateEvent()
    constructor(session: IRoomSession, petId: number)
    {
        super(RoomSessionPetStatusUpdateEvent.PET_STATUS_UPDATE, session);
        this._petId = petId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionPetStatusUpdateEvent.as::_petId
    private _petId: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionPetStatusUpdateEvent.as::get petId()
    get petId(): number
    {
        return this._petId;
    }
}
