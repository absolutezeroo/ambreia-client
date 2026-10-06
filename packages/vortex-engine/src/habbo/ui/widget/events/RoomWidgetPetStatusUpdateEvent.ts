/**
 * RoomWidgetPetStatusUpdateEvent
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomWidgetPetStatusUpdateEvent.as
 */
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

export class RoomWidgetPetStatusUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: .../RoomWidgetPetStatusUpdateEvent.as::PET_STATUS_UPDATE
    public static readonly PET_STATUS_UPDATE: string = 'RWPIUE_PET_STATUS_UPDATE';

    private _petId: number;

    // DEVIATION: AS3 also carries canBreed / canHarvest / canRevive / hasBreedingPermission; the RPG
    //   fork removed pet breeding and monsterplants, so only the pet id is left.
    // AS3: .../RoomWidgetPetStatusUpdateEvent.as::RoomWidgetPetStatusUpdateEvent()
    constructor(petId: number)
    {
        super(RoomWidgetPetStatusUpdateEvent.PET_STATUS_UPDATE);

        this._petId = petId;
    }

    // AS3: .../RoomWidgetPetStatusUpdateEvent.as::get petId()
    get petId(): number
    {
        return this._petId;
    }
}
