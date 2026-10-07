/**
 * FurnitureCrackableLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureCrackableLogic.as
 *
 * Logic for crackable furniture (sets CRACKABLE_FURNI extra param).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureCrackableLogic extends FurnitureLogic
{
    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if(this.object === null)
        {
            return;
        }

        if(this.object.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) === 1)
        {
            this.object.getModelController()!.setString('RWEIEP_INFOSTAND_EXTRA_PARAM', 'RWEIEP_CRACKABLE_FURNI');
        }
    }
}
