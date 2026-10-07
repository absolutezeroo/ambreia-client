/**
 * FurnitureCreditLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureCreditLogic.as
 *
 * Logic for credit furniture (redeemable coins).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurnitureCreditLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectWidgetRequestEvent.ROWRE_CREDITFURNI
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(data === null)
        {
            return;
        }

        const config = data as { credits?: Array<{ value: number }> };

        if(config.credits && config.credits.length > 0)
        {
            const creditValue = config.credits[0].value;
            this.object?.getModelController()?.setNumber('furniture_credit_value', creditValue);
        }
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
                RoomObjectWidgetRequestEvent.ROWRE_CREDITFURNI,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_CREDITFURNI, this.object)
            );
        }

        super.useObject();
    }
}
