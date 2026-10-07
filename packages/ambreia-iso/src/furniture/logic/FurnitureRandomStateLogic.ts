/**
 * FurnitureRandomStateLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureRandomStateLogic.as
 *
 * Logic for random state furniture (e.g. dice-like with random result).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectStateChangeEvent} from '../../scene/events/RoomObjectStateChangeEvent';

export class FurnitureRandomStateLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectStateChangeEvent.ROSCE_STATE_RANDOM
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
                RoomObjectStateChangeEvent.ROSCE_STATE_RANDOM,
                new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_RANDOM, this.object)
            );
        }
    }
}
