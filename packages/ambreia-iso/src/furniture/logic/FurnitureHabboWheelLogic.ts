/**
 * FurnitureHabboWheelLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureHabboWheelLogic.as
 *
 * Logic for Habbo wheel furniture (spin the wheel).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectFurnitureActionEvent} from '../../scene/events/RoomObjectFurnitureActionEvent';

export class FurnitureHabboWheelLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectFurnitureActionEvent.ROFCAE_USE_HABBOWHEEL
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

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectFurnitureActionEvent.ROFCAE_USE_HABBOWHEEL,
                new RoomObjectFurnitureActionEvent(RoomObjectFurnitureActionEvent.ROFCAE_USE_HABBOWHEEL, this.object)
            );
        }
    }
}
