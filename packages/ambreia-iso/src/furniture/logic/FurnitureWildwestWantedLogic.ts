/**
 * FurnitureWildwestWantedLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureWildwestWantedLogic.as
 *
 * Logic for wild west wanted poster furniture (friend furniture engraving type = 3).
 */
import {FurnitureFriendFurniLogic} from './FurnitureFriendFurniLogic';

export class FurnitureWildwestWantedLogic extends FurnitureFriendFurniLogic
{
    protected override get engravingDialogType(): number
    {
        return 3;
    }
}
