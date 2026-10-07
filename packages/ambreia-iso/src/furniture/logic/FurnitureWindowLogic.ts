/**
 * FurnitureWindowLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureWindowLogic.as
 *
 * Logic for window furniture (plane mask support).
 */
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureWindowLogic extends FurnitureMultiStateLogic
{
    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(data === null)
        {
            return;
        }

        // AS3 reads `<mask type="…"/>` off the logic XML; the Nitro bundle carries the same value
        // as `logic.maskType` (see FurnitureLogic.initialize() for the `logic` nesting). Reading
        // `data.mask` found nothing, so no window ever cut its hole in the wall.
        const maskType = (data as { logic?: { maskType?: string } }).logic?.maskType;

        if(maskType)
        {
            this.object?.getModelController()?.setNumber(RoomObjectVariableEnum.FURNITURE_USES_PLANE_MASK, 1, true);
            this.object?.getModelController()?.setString(RoomObjectVariableEnum.FURNITURE_PLANE_MASK_TYPE, maskType, true);
        }
    }
}
