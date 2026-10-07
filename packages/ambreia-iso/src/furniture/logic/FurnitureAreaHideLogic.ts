/**
 * FurnitureAreaHideLogic
 *
 * @see source_as_win63/habbo/room/object/logic/furniture/FurnitureAreaHideLogic.as
 *
 * Logic for area hide furniture (hides parts of the room).
 */
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import {FurnitureMultiStateLogic} from './FurnitureMultiStateLogic';
import {RoomObjectStateChangeEvent} from '../../scene/events/RoomObjectStateChangeEvent';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import type {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';

export class FurnitureAreaHideLogic extends FurnitureMultiStateLogic
{
    override getEventTypes(): string[]
    {
        const types = [
            RoomObjectWidgetRequestEvent.ROWRE_HIDE_AREA
        ];

        return this.getAllEventTypes(super.getEventTypes(), types);
    }

    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        const dataMessage = message as unknown as RoomObjectDataUpdateMessage;

        if('data' in message && dataMessage.data !== null)
        {
            dataMessage.data.writeRoomObjectModel(this.object!.getModelController()!);

            if(this.object?.getModelController()?.getNumber('furniture_real_room_object') === 1)
            {
                this.setupObject();
            }
        }
    }

    override useObject(): void
    {
        if(this.eventDispatcher !== null && this.object !== null)
        {
            this.eventDispatcher.emit(
                RoomObjectWidgetRequestEvent.ROWRE_HIDE_AREA,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_HIDE_AREA, this.object)
            );
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
            if(event.spriteTag === 'turn_on' || event.spriteTag === 'turn_off')
            {
                this.eventDispatcher?.emit(
                    RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE,
                    new RoomObjectStateChangeEvent(RoomObjectStateChangeEvent.ROSCE_STATE_CHANGE, this.object)
                );
            }
            else if(this.eventDispatcher !== null && this.object !== null)
            {
                this.eventDispatcher.emit(
                    RoomObjectWidgetRequestEvent.ROWRE_HIDE_AREA,
                    new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_HIDE_AREA, this.object)
                );
            }
        }
    }

    private setupObject(): void
    {
        if(this.object === null || this.object.getModelController() === null)
        {
            return;
        }

        const model = this.object.getModelController()!;
        const stuffData = model.getString('furniture_data');

        if(stuffData === null)
        {
            return;
        }

        // IntArrayStuffData values: state, rootX, rootY, width, length, invisibility, wallitems, invert
        const state = model.getNumber('stuffdata_val_0') ?? 0;
        const rootX = model.getNumber('stuffdata_val_1') ?? 0;
        const rootY = model.getNumber('stuffdata_val_2') ?? 0;
        const width = model.getNumber('stuffdata_val_3') ?? 0;
        const length = model.getNumber('stuffdata_val_4') ?? 0;
        const invisibility = (model.getNumber('stuffdata_val_5') ?? 0) === 1;
        const wallitems = (model.getNumber('stuffdata_val_6') ?? 0) === 1;
        const invert = (model.getNumber('stuffdata_val_7') ?? 0) === 1;

        model.setNumber('furniture_area_hide_root_x', rootX);
        model.setNumber('furniture_area_hide_root_y', rootY);
        model.setNumber('furniture_area_hide_width', width);
        model.setNumber('furniture_area_hide_length', length);
        model.setNumber('furniture_area_hide_invisibility', invisibility ? 1 : 0);
        model.setNumber('furniture_area_hide_wallitems', wallitems ? 1 : 0);
        model.setNumber('furniture_area_hide_invert', invert ? 1 : 0);

        this.object.setState(state, 0);
    }
}
