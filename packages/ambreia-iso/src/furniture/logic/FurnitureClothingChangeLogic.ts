/**
 * FurnitureClothingChangeLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureClothingChangeLogic.as
 *
 * Logic for clothing change furniture.
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';

export class FurnitureClothingChangeLogic extends FurnitureLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectWidgetRequestEvent.ROWRE_CLOTHING_CHANGE
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override initialize(data: unknown): void
    {
        super.initialize(data);

        if(this.object === null || this.object.getModel() === null)
        {
            return;
        }

        const furnitureData = this.object.getModel()!.getString('furniture_data');

        if(furnitureData !== null)
        {
            this.updateClothingData(furnitureData);
        }
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('data' in message && dataMessage.data !== null)
        {
            const legacyString = dataMessage.data.getLegacyString();
            this.updateClothingData(legacyString);
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
                RoomObjectWidgetRequestEvent.ROWRE_CLOTHING_CHANGE,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_CLOTHING_CHANGE, this.object)
            );
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/FurnitureClothingChangeLogic.as::updateClothingData()
    private updateClothingData(data: string): void
    {
        if(data !== null && data.length > 0)
        {
            const parts = data.split(',');
            const model = this.object?.getModelController();

            if(model === null || model === undefined)
            {
                return;
            }

            if(parts.length > 0)
            {
                model.setString('furniture_clothing_boy', parts[0]);
            }

            if(parts.length > 1)
            {
                model.setString('furniture_clothing_girl', parts[1]);
            }
        }
    }
}
