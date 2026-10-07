/**
 * FurnitureRoomBackgroundColorLogic
 *
 * @see source_as_flash/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBackgroundColorLogic.as
 *
 * Logic for room background color furniture (HSL color enable/disable).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import {RoomObjectHSLColorEnableEvent} from '../../scene/events/RoomObjectHSLColorEnableEvent';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import {IntArrayStuffData} from '../../scene/object/data/IntArrayStuffData';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureRoomBackgroundColorLogic extends FurnitureMultiStateLogic
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBackgroundColorLogic.as::_roomColorUpdated
    private _roomColorUpdated: boolean = false;

    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectWidgetRequestEvent.ROWRE_BACKGROUND_COLOR,
            RoomObjectHSLColorEnableEvent.ROOM_BACKGROUND_COLOR
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('state' in message && 'data' in message && dataMessage.data !== null)
        {
            dataMessage.data.writeRoomObjectModel(this.object!.getModelController()!);

            if(this.object!.getModelController()!.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) === 1)
            {
                this.setupObject();
            }
        }
    }

    override dispose(): void
    {
        if(this._roomColorUpdated)
        {
            if(this.eventDispatcher !== null && this.object !== null)
            {
                if(this.object.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) === 1)
                {
                    this.eventDispatcher.emit(
                        RoomObjectHSLColorEnableEvent.ROOM_BACKGROUND_COLOR,
                        new RoomObjectHSLColorEnableEvent(RoomObjectHSLColorEnableEvent.ROOM_BACKGROUND_COLOR, this.object, false, 0, 0, 0)
                    );
                }
            }

            this._roomColorUpdated = false;
        }

        super.dispose();
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
            if(this.eventDispatcher !== null && this.object !== null)
            {
                this.eventDispatcher.emit(
                    RoomObjectWidgetRequestEvent.ROWRE_BACKGROUND_COLOR,
                    new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_BACKGROUND_COLOR, this.object)
                );
            }
            return;
        }

        super.mouseEvent(event, geometry);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/logic/furniture/FurnitureRoomBackgroundColorLogic.as::setupObject()
    private setupObject(): void
    {
        if(this.object === null || this.object.getModelController() === null)
        {
            return;
        }

        const stuffData = new IntArrayStuffData();
        stuffData.initializeFromRoomObjectModel(this.object.getModel());

        const enabled = stuffData.getValue(0);
        const hue = stuffData.getValue(1);
        const saturation = stuffData.getValue(2);
        const lightness = stuffData.getValue(3);

        if(enabled > -1 && hue > -1 && saturation > -1 && lightness > -1)
        {
            this.object.getModelController()!.setNumber(RoomObjectVariableEnum.FURNITURE_ROOM_BACKGROUND_COLOR_HUE, hue);
            this.object.getModelController()!.setNumber(RoomObjectVariableEnum.FURNITURE_ROOM_BACKGROUND_COLOR_SATURATION, saturation);
            this.object.getModelController()!.setNumber(RoomObjectVariableEnum.FURNITURE_ROOM_BACKGROUND_COLOR_LIGHTNESS, lightness);
            this.object.setState(enabled, 0);

            if(this.eventDispatcher !== null && this.object !== null)
            {
                this.eventDispatcher.emit(
                    RoomObjectHSLColorEnableEvent.ROOM_BACKGROUND_COLOR,
                    new RoomObjectHSLColorEnableEvent(RoomObjectHSLColorEnableEvent.ROOM_BACKGROUND_COLOR, this.object, Boolean(enabled), hue, saturation, lightness)
                );
            }

            this._roomColorUpdated = true;
        }
    }
}
