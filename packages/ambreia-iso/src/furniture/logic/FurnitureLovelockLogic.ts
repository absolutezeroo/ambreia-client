/**
 * FurnitureLovelockLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureLovelockLogic.as
 *
 * Logic for love lock furniture (friend furniture engraving type = 1).
 */
import {FurnitureFriendFurniLogic} from './FurnitureFriendFurniLogic';

export class FurnitureLovelockLogic extends FurnitureFriendFurniLogic
{
    protected override get engravingDialogType(): number
    {
        return 1;
    }
}
