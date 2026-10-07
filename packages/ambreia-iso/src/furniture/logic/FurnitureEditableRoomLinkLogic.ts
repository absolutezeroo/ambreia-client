/**
 * FurnitureEditableRoomLinkLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureEditableRoomLinkLogic.as
 *
 * Logic for furniture with editable room links (teleport to room).
 */
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurnitureEditableRoomLinkLogic extends FurnitureLogic
{
    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(data === null)
        {
            return;
        }

        const config = data as { action?: { link?: string } };

        if(config.action?.link)
        {
            this.object?.getModelController()?.setString('furniture_internal_link', config.action.link);
        }
    }

    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectWidgetRequestEvent.ROWRE_ROOM_LINK
        ]);
    }

    override useObject(): void
    {
        this.setAnimationState(1);

        setTimeout(() => this.setAnimationState(0), 2500);

        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_ROOM_LINK,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_ROOM_LINK, this.object)
            );
        }
    }

    setAnimationState(state: number): void
    {
        if(this.object === null)
        {
            return;
        }

        const model = this.object.getModelController();

        if(model !== null)
        {
            model.setNumber('furniture_automatic_state_index', state, false);
        }
    }
}
