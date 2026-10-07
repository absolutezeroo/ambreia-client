/**
 * FurnitureTrophyLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.furniture.FurnitureTrophyLogic
 *
 * Logic for trophy furniture.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurnitureTrophyLogic extends FurnitureLogic
{
    // AS3: FurnitureTrophyLogic.as::getEventTypes()
    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [RoomObjectWidgetRequestEvent.ROWRE_TROPHY]);
    }

    /**
     * AS3: FurnitureTrophyLogic.as::mouseEvent()
     *
     * A trophy opens on double-click only; every other mouse event goes to the base logic.
     * This override was missing entirely, so a double-click fell through to FurnitureLogic's
     * generic handling and never reached useObject().
     */
    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(event === null || geometry === null) return;

        if(this.object === null) return;

        if(event.type !== 'doubleClick')
        {
            super.mouseEvent(event, geometry);
        }
        else
        {
            this.useObject();
        }
    }

    /**
     * AS3: FurnitureTrophyLogic.as::useObject()
     *
     * AS3 raises ROWRE_TROPHY, not ROWRE_OPEN_WIDGET. The port previously emitted the latter,
     * which is the generic "this furni has a widget" request — the trophy handler claims the
     * former, so the engraving never reached it. The invented `widgetType = 'trophy'` field the
     * old constructor set has no AS3 counterpart and is gone with it.
     */
    override useObject(): void
    {
        if(this.object === null || this.eventDispatcher === null)
        {
            return;
        }

        this.eventDispatcher.emit(
            RoomObjectWidgetRequestEvent.ROWRE_TROPHY,
            new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_TROPHY, this.object)
        );
    }
}
