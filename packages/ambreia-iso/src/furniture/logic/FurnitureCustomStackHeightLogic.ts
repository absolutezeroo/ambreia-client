/**
 * FurnitureCustomStackHeightLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureCustomStackHeightLogic.as
 *
 * Logic for custom stack height furniture (always stackable, widget = CUSTOM_STACK_HEIGHT).
 */
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureCustomStackHeightLogic extends FurnitureMultiStateLogic
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2298.as::get widget()
    override get widget(): string | null
    {
        return 'RWE_CUSTOM_STACK_HEIGHT';
    }

    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(this.object !== null && this.object.getModelController() !== null)
        {
            this.object.getModelController()!.setNumber(RoomObjectVariableEnum.FURNITURE_ALWAYS_STACKABLE, 1);
        }
    }
}
