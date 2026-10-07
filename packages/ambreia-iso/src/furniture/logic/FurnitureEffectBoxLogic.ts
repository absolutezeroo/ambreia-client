/**
 * FurnitureEffectBoxLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureEffectboxLogic.as
 *
 * Logic for effect box furniture (context menu = EFFECT_BOX).
 */
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurnitureEffectBoxLogic extends FurnitureMultiStateLogic
{
    override get contextMenu(): string | null
    {
        return 'EFFECT_BOX';
    }

    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectWidgetRequestEvent.ROWRE_EFFECTBOX_OPEN_DIALOG
        ]);
    }

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_EFFECTBOX_OPEN_DIALOG,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_EFFECTBOX_OPEN_DIALOG, this.object)
            );
        }
    }
}
