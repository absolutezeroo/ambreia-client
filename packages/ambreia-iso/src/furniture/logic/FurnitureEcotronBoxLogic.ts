/**
 * FurnitureEcotronBoxLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureEcotronBoxLogic.as
 *
 * Logic for ecotron box furniture.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurnitureEcotronBoxLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectWidgetRequestEvent.ROWRE_ECOTRONBOX
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
                RoomObjectWidgetRequestEvent.ROWRE_ECOTRONBOX,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_ECOTRONBOX, this.object)
            );
        }
    }
}
