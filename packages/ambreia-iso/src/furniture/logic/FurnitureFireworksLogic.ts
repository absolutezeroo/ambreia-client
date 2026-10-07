/**
 * FurnitureFireworksLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureFireworksLogic.as
 *
 * Logic for fireworks furniture (start/stop/reset via sprite tags).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectStateChangeEvent} from '../../scene/events/RoomObjectStateChangeEvent';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureFireworksLogic extends FurnitureLogic
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

        if(event.type === 'doubleClick')
        {
            switch(event.spriteTag)
            {
                case 'start_stop':
                    stateEvent = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 1);
                    break;
                case 'reset':
                    stateEvent = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 2);
                    break;
            }
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
            const event = new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object, 0);
            this.eventDispatcher.emit(event.type, event);
        }
    }

    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(data === null)
        {
            return;
        }

        // The bundle nests the furni's logic config under a `logic` key, as `FurnitureLogic`'s own
        // `initialize()` note sets out — this read was one level too high and at the Flash name
        // (`particlesystems`), so it never found anything and the visualization had no definition
        // to read. The bundle spells it `logic.particleSystems`, an array of objects; AS3 stores
        // the definition on the model as text and the visualization parses it back, so the array
        // travels as JSON.
        const config = data as {logic?: {particleSystems?: unknown[]}};
        const particleSystems = config.logic?.particleSystems;

        if(Array.isArray(particleSystems) && particleSystems.length > 0)
        {
            this.object?.getModelController()?.setString(
                RoomObjectVariableEnum.FURNITURE_FIREWORKS_DATA,
                JSON.stringify(particleSystems)
            );
        }
    }
}
