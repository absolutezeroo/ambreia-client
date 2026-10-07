/**
 * FurnitureHockeyScoreLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureHockeyScoreLogic.as
 *
 * Logic for hockey score furniture (inc/dec/off via sprite tags).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectStateChangeEvent} from '../../scene/events/RoomObjectStateChangeEvent';

export class FurnitureHockeyScoreLogic extends FurnitureLogic
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

        let stateEvent: RoomObjectStateChangeEvent | null = null;

        switch(event.type)
        {
            case 'doubleClick':
                if(event.spriteTag === 'off')
                {
                    stateEvent = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 3);
                }
                break;

            case 'click':
                switch(event.spriteTag)
                {
                    case 'inc':
                        stateEvent = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 2);
                        break;
                    case 'dec':
                        stateEvent = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 1);
                        break;
                }
                break;
        }

        if(this.eventDispatcher !== null && stateEvent !== null)
        {
            this.eventDispatcher.emit(stateEvent.type, stateEvent);
        }
        else
        {
            super.mouseEvent(event, geometry);
        }
    }

    override useObject(): void
    {
        if(this.object !== null && this.eventDispatcher !== null)
        {
            const event = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 3);
            this.eventDispatcher.emit(event.type, event);
        }
    }
}
