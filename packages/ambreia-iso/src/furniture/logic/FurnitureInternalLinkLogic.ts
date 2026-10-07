/**
 * FurnitureInternalLinkLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureInternalLinkLogic.as
 *
 * Logic for internal link furniture (navigates to internal pages).
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureInternalLinkLogic extends FurnitureLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureInternalLinkLogic.as::_showStateOneOnceRendered
    private _showStateOneOnceRendered: boolean = false;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureInternalLinkLogic.as::_updateCount
    private _updateCount: number = 0;

    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(data === null)
        {
            return;
        }

        const config = data as { action?: { link?: string; startState?: string } };

        if(config.action)
        {
            this.object?.getModelController()?.setString(
                RoomObjectVariableEnum.FURNITURE_INTERNAL_LINK,
                config.action.link ?? ''
            );

            if(config.action.startState === '1')
            {
                this._showStateOneOnceRendered = true;
            }
        }
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

    override update(time: number): void
    {
        super.update(time);

        if(!this._showStateOneOnceRendered)
        {
            return;
        }

        this._updateCount++;

        if(this._showStateOneOnceRendered && this._updateCount === 20)
        {
            this.setAnimationState(1);
        }
    }

    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(event === null)
        {
            return;
        }

        if(event.type === 'doubleClick' && this._showStateOneOnceRendered)
        {
            this.setAnimationState(0);
        }

        super.mouseEvent(event, geometry);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2271.as::setAnimationState()
    // Real name, and `public` as AS3 declares it — its three sibling link/crafting logics already
    // spell it this way. It was `private setAutomaticStateIndex` here until 2026-08-27.
    setAnimationState(index: number): void
    {
        if(this.object === null)
        {
            return;
        }

        const model = this.object.getModelController();

        if(model !== null)
        {
            model.setNumber(RoomObjectVariableEnum.FURNITURE_AUTOMATIC_STATE_INDEX, index, false);
        }
    }
}
