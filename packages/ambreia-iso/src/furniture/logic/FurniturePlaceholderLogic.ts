/**
 * FurniturePlaceholderLogic
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/FurniturePlaceholderLogic.as
 *
 * Logic for placeholder furniture — a furni the client has no visualization for. Double-clicking
 * one opens the placeholder window explaining that.
 *
 * The previous port had this backwards: `getEventTypes()` returned an empty array, dropping the
 * base logic's own types along with `ROWRE_PLACEHOLDER`, and `useObject()` was an empty stub
 * commented "Placeholder furniture can't be used". AS3 does the opposite of both.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurniturePlaceholderLogic extends FurnitureLogic
{
    // AS3: FurniturePlaceholderLogic.as::getEventTypes()
    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [RoomObjectWidgetRequestEvent.ROWRE_PLACEHOLDER]);
    }

    // AS3: FurniturePlaceholderLogic.as::mouseEvent()
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

    // AS3: FurniturePlaceholderLogic.as::useObject()
    override useObject(): void
    {
        if(this.object === null || this.eventDispatcher === null)
        {
            return;
        }

        this.eventDispatcher.emit(
            RoomObjectWidgetRequestEvent.ROWRE_PLACEHOLDER,
            new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_PLACEHOLDER, this.object)
        );
    }
}
