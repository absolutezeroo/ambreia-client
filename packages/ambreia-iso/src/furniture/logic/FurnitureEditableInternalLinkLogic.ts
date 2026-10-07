/**
 * FurnitureEditableInternalLinkLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureEditableInternalLinkLogic.as
 *
 * Logic for furniture with editable internal links (teleport to page).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';

export class FurnitureEditableInternalLinkLogic extends FurnitureLogic
{
    private _startState: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureEditableInternalLinkLogic.as::_updateCount
    private _updateCount: number = 0;

    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(data === null)
        {
            return;
        }

        const config = data as { action?: { startState?: string } };

        if(config.action?.startState === '1')
        {
            this._startState = true;
        }
    }

    override update(time: number): void
    {
        super.update(time);

        if(!this._startState)
        {
            return;
        }

        this._updateCount++;

        if(this._startState && this._updateCount > 20)
        {
            this.setAnimationState(1);
            this._startState = false;
        }
    }

    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(event === null)
        {
            return;
        }

        if(event.type === 'doubleClick')
        {
            this.setAnimationState(0);
        }

        super.mouseEvent(event, geometry);
    }

    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectWidgetRequestEvent.ROWRE_INTERNAL_LINK
        ]);
    }

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_INTERNAL_LINK,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_INTERNAL_LINK, this.object)
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
