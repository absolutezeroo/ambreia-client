/**
 * FurnitureMultiStateLogic
 *
 * Based on AS3: com.sulake.habbo.room.object.logic.furniture.FurnitureMultiStateLogic
 *
 * Logic for furniture with multiple interactive states (e.g., doors, switches).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectFurnitureActionEvent} from '../../scene/events/RoomObjectFurnitureActionEvent';

export class FurnitureMultiStateLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_BUTTON,
            RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_ARROW
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

        switch(event.type)
        {
            case 'rollOver':
                this.eventDispatcher?.emit(
                    RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_BUTTON,
                    new RoomObjectFurnitureActionEvent(RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_BUTTON, this.object)
                );
                break;

            case 'rollOut':
                this.eventDispatcher?.emit(
                    RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_ARROW,
                    new RoomObjectFurnitureActionEvent(RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_ARROW, this.object)
                );
                break;
        }

        super.mouseEvent(event, geometry);
    }
}
