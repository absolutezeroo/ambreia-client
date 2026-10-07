/**
 * FurnitureMultiHeightLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.furniture.FurnitureMultiHeightLogic
 *
 * Logic for furniture with variable height (e.g., stackable furniture).
 */
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';

export class FurnitureMultiHeightLogic extends FurnitureMultiStateLogic
{
    override initialize(data: unknown): void
    {
        super.initialize(data);

        const model = this.object?.getModelController();
        model?.setNumber('furniture_is_variable_height', 1, true);
    }
}
