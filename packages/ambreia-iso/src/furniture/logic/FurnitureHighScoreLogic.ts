/**
 * FurnitureHighScoreLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureHighScoreLogic.as
 *
 * Logic for high score display furniture.
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureHighScoreLogic extends FurnitureLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureHighScoreLogic.as::SHOW_WIDGET_IN_STATE
    private static readonly SHOW_WIDGET_IN_STATE = 1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureHighScoreLogic.as::_state
    private _state: number = -1;

    override getEventTypes(): string[]
    {
        return [
            RoomObjectWidgetRequestEvent.ROWRE_HIGH_SCORE_DISPLAY,
            RoomObjectWidgetRequestEvent.ROWRE_HIDE_HIGH_SCORE_DISPLAY
        ];
    }

    override tearDown(): void
    {
        if(this.object?.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) === 1)
        {
            this.eventDispatcher?.emit(
                RoomObjectWidgetRequestEvent.ROWRE_HIDE_HIGH_SCORE_DISPLAY,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_HIDE_HIGH_SCORE_DISPLAY, this.object)
            );
        }

        super.tearDown();
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if(this.object?.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) !== 1)
        {
            return;
        }

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && typeof dataMessage.state === 'number')
        {
            if(dataMessage.state === FurnitureHighScoreLogic.SHOW_WIDGET_IN_STATE)
            {
                this.eventDispatcher?.emit(
                    RoomObjectWidgetRequestEvent.ROWRE_HIGH_SCORE_DISPLAY,
                    new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_HIGH_SCORE_DISPLAY, this.object)
                );
            }
            else
            {
                this.eventDispatcher?.emit(
                    RoomObjectWidgetRequestEvent.ROWRE_HIDE_HIGH_SCORE_DISPLAY,
                    new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_HIDE_HIGH_SCORE_DISPLAY, this.object)
                );
            }

            this._state = dataMessage.state;
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

        if(event.type === 'doubleClick')
        {
            this.useObject();
            return;
        }

        super.mouseEvent(event, geometry);
    }
}
