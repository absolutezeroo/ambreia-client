/**
 * FurnitureCounterClockLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureCounterClockLogic.as
 *
 * Logic for counter clock furniture (start_stop / reset sprite tags).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectStateChangeEvent} from '../../scene/events/RoomObjectStateChangeEvent';

export class FurnitureCounterClockLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE
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
            let stateEvent: RoomObjectStateChangeEvent | null = null;

            switch(event.spriteTag)
            {
                case 'start_stop':
                    stateEvent = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 1);
                    break;

                case 'reset':
                    stateEvent = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 2);
                    break;
            }

            if(this.eventDispatcher !== null && stateEvent !== null)
            {
                this.eventDispatcher.emit(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, stateEvent);
                return;
            }
        }

        super.mouseEvent(event, geometry);
    }

    override useObject(): void
    {
        if(this.object !== null && this.eventDispatcher !== null)
        {
            const stateEvent = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 1);
            this.eventDispatcher.emit(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, stateEvent);
        }
    }
}
