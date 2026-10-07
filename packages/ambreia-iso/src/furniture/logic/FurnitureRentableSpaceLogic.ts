/**
 * FurnitureRentableSpaceLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureRentableSpaceLogic.as
 *
 * Logic for rentable space furniture (widget = RENTABLESPACE, requests current user ID).
 */
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectDataRequestEvent} from '../../scene/events/RoomObjectDataRequestEvent';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureRentableSpaceLogic extends FurnitureLogic
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2164.as::get widget()
    override get widget(): string | null
    {
        return 'RWE_RENTABLESPACE';
    }

    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectDataRequestEvent.CURRENT_USER_ID
        ]);
    }

    override update(time: number): void
    {
        super.update(time);

        if(this.object === null)
        {
            return;
        }

        if(!this.object.getModel().hasNumber(RoomObjectVariableEnum.SESSION_CURRENT_USER_ID))
        {
            this.eventDispatcher?.emit(
                RoomObjectDataRequestEvent.CURRENT_USER_ID,
                new RoomObjectDataRequestEvent(RoomObjectDataRequestEvent.CURRENT_USER_ID, this.object)
            );
        }

        const model = this.object.getModel();
        const renterIdStr = model.getStringToStringMap(RoomObjectVariableEnum.FURNITURE_DATA)?.get('renterId') ?? null;
        const currentUserId = model.getNumber(RoomObjectVariableEnum.SESSION_CURRENT_USER_ID);

        if(renterIdStr !== null)
        {
            if(Number(renterIdStr) === currentUserId)
            {
                this.object.setState(2, 0);
            }
            else
            {
                this.object.setState(1, 0);
            }
        }
        else
        {
            this.object.setState(0, 0);
        }
    }
}
