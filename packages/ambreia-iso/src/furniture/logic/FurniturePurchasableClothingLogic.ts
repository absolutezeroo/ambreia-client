/**
 * FurniturePurchasableClothingLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurniturePurchasableClothingLogic.as
 *
 * Logic for purchasable clothing furniture (context menu = PURCHASABLE_CLOTHING).
 */
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurniturePurchasableClothingLogic extends FurnitureMultiStateLogic
{
    override get contextMenu(): string | null
    {
        return 'PURCHASABLE_CLOTHING';
    }

    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectWidgetRequestEvent.ROWRE_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG
        ]);
    }

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG, this.object)
            );
        }
    }
}
