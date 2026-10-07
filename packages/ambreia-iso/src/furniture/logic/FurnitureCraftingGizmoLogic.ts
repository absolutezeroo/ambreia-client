/**
 * FurnitureCraftingGizmoLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureCraftingGizmoLogic.as
 *
 * Logic for crafting gizmo furniture (widget = CRAFTING).
 */
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureCraftingGizmoLogic extends FurnitureLogic
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2048.as::get widget()
    override get widget(): string | null
    {
        return 'RWE_CRAFTING';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2048.as::useObject()
    override useObject(): void
    {
        super.useObject();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2048.as::setAnimationState()
    // The name is real and readable in the obfuscated class — it was `setAutomaticStateIndex` here
    // until 2026-08-27, invented after the model variable it writes.
    setAnimationState(index: number): void
    {
        if(this.object === null)
        {
            return;
        }

        const model = this.object.getModelController();

        if(model !== null)
        {
            model.setNumber(RoomObjectVariableEnum.FURNITURE_AUTOMATIC_STATE_INDEX, index, false);
        }
    }
}
