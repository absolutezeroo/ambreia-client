/**
 * FurniturePetCustomizationLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurniturePetCustomizationLogic.as
 *
 * Logic for pet customization furniture (similar to pet product, sets USABLE_PRODUCT extra param).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurniturePetCustomizationLogic extends FurnitureLogic
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

        if(event.type === 'doubleClick')
        {
            this.useObject();
            return;
        }

        super.mouseEvent(event, geometry);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if(this.object === null)
        {
            return;
        }

        if(this.object.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) === 1)
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
