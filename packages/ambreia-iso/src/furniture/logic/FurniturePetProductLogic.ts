/**
 * FurniturePetProductLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurniturePetProductLogic.as
 *
 * Logic for pet product furniture (food, drink, toys).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurniturePetProductLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectWidgetRequestEvent.ROWRE_PET_PRODUCT_MENU
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(event === null || geometry === null)
        {
            return;
        }

        if(this.object === null)
        {
            return;
        }

        if(event.type !== 'doubleClick')
        {
            super.mouseEvent(event, geometry);
        }
        else
        {
            this.useObject();
        }
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if(this.object === null)
        {
            return;
        }

        if(this.object.getModelController()?.getNumber('furniture_real_room_object') === 1)
        {
            this.object.getModelController()!.setString('RWEIEP_INFOSTAND_EXTRA_PARAM', 'RWEIEP_USABLE_PRODUCT');
        }
    }

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_PET_PRODUCT_MENU,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_PET_PRODUCT_MENU, this.object)
            );
        }
    }
}
