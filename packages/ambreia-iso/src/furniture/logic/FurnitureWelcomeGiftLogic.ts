/**
 * FurnitureWelcomeGiftLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureWelcomeGiftLogic.as
 *
 * Logic for welcome gift furniture.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectStateChangeEvent} from '../../scene/events/RoomObjectStateChangeEvent';

export class FurnitureWelcomeGiftLogic extends FurnitureMultiStateLogic
{
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
            if(this.eventDispatcher !== null)
            {
                this.eventDispatcher.emit(
                    RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE,
                    new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object)
                );
            }
        }

        super.mouseEvent(event, geometry);
    }
}
