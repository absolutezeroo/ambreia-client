/**
 * FurnitureHweenLovelockLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureHweenLovelockLogic.as
 *
 * Logic for Halloween love lock furniture (friend furniture engraving type = 2).
 */
import {FurnitureFriendFurniLogic} from './FurnitureFriendFurniLogic';

export class FurnitureHweenLovelockLogic extends FurnitureFriendFurniLogic
{
    protected override get engravingDialogType(): number
    {
        return 2;
    }
}
