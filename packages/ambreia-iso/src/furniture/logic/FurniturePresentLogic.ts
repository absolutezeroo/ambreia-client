/**
 * FurniturePresentLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.furniture.FurniturePresentLogic
 *
 * Logic for gift/present furniture.
 */
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurniturePresentLogic extends FurnitureLogic
{
    constructor()
    {
        super();
        this.widgetType = 'present';
    }

    override useObject(): void
    {
        if(this.object === null || this.eventDispatcher === null)
        {
            return;
        }

        // Open present widget
        this.eventDispatcher.emit(
            RoomObjectWidgetRequestEvent.ROWRE_OPEN_WIDGET,
            new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_OPEN_WIDGET, this.object)
        );
    }
}
