/**
 * FurnitureMannequinLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.furniture.FurnitureMannequinLogic
 *
 * Logic for mannequin furniture.
 */
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurnitureMannequinLogic extends FurnitureMultiStateLogic
{
    constructor()
    {
        super();
        this.widgetType = 'mannequin';
    }

    override useObject(): void
    {
        if(this.object === null || this.eventDispatcher === null)
        {
            return;
        }

        // Open mannequin widget
        this.eventDispatcher.emit(
            RoomObjectWidgetRequestEvent.ROWRE_OPEN_WIDGET,
            new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_OPEN_WIDGET, this.object)
        );
    }
}
