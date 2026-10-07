/**
 * FurnitureStickieLogic
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/FurnitureStickieLogic.as
 *
 * A sticky note opens in two steps, which is why this logic raises two different events. The
 * double-click raises `ROFCAE_STICKIE`, an action that asks the server for the note's item-data;
 * the reply arrives as a `RoomObjectItemDataUpdateMessage`, and *that* is what raises
 * `ROWRE__STICKIE` to open the widget.
 *
 * The previous port collapsed both into a single `ROWRE_OPEN_WIDGET` from `useObject()` — the
 * generic "this furni has a widget" request, which the stickie handler does not claim, so neither
 * step worked. It also carried an invented `widgetType = 'stickie'` field with no AS3 counterpart.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {RoomSpriteMouseEvent} from '../../events/RoomSpriteMouseEvent';
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectFurnitureActionEvent} from '../../scene/events/RoomObjectFurnitureActionEvent';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import {RoomObjectItemDataUpdateMessage} from '../../scene/messages/RoomObjectItemDataUpdateMessage';

export class FurnitureStickieLogic extends FurnitureLogic
{
    /**
    * AS3: FurnitureStickieLogic.as::setColorIndexFromItemData()
    *
    * The eight authored note colours, in the order the widget's colour buttons use.
    */
    private static readonly STICKIE_COLORS: readonly string[] = ['9CCEFF', 'FF9CFF', '9CFF9C', 'FFFF33', 'FFFFFF', 'FF9C9C', 'FFCC66', '9CFFFF'];

    // AS3: FurnitureStickieLogic.as::getEventTypes()
    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectWidgetRequestEvent.ROWRE_STICKIE,
            RoomObjectFurnitureActionEvent.ROFCAE_STICKIE
        ]);
    }

    /**
     * AS3: FurnitureStickieLogic.as::initialize()
     *
     * `furniture_is_stickie` is set to the empty string, not a boolean — the room engine's
     * placement path tests for the key's presence, not its value.
     */
    override initialize(data: unknown): void
    {
        super.initialize(data);

        this.setColorIndexFromItemData();

        this.object?.getModelController()?.setString('furniture_is_stickie', '');
    }

    /**
     * AS3: FurnitureStickieLogic.as::processUpdateMessage()
     *
     * The item-data reply is what opens the widget — see the class note.
     */
    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if(message instanceof RoomObjectItemDataUpdateMessage)
        {
            this.eventDispatcher?.emit(
                RoomObjectWidgetRequestEvent.ROWRE_STICKIE,
                new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_STICKIE, this.object)
            );
        }

        this.setColorIndexFromItemData();
    }

    /**
     * Drives the note's rendered colour from its data. An unrecognised colour falls back to index
     * 3 (yellow), and the model stores the index **plus one** — which is why the widget's
     * `normalize(color - 1)` subtracts it again.
     */
    // AS3: FurnitureStickieLogic.as::setColorIndexFromItemData()
    protected setColorIndexFromItemData(): void
    {
        if(this.object === null) return;

        const color = this.object.getModel().getString('furniture_data');
        let index = FurnitureStickieLogic.STICKIE_COLORS.indexOf(color);

        if(index < 0)
        {
            index = 3;
        }

        this.object.getModelController()?.setNumber('furniture_color', index + 1);
    }

    // AS3: FurnitureStickieLogic.as::mouseEvent()
    override mouseEvent(event: RoomSpriteMouseEvent, geometry: IRoomGeometry): void
    {
        if(event === null || geometry === null) return;

        if(this.object === null) return;

        if(event.type !== 'doubleClick')
        {
            super.mouseEvent(event, geometry);
        }
        else
        {
            this.useObject();
        }
    }

    // AS3: FurnitureStickieLogic.as::useObject()
    override useObject(): void
    {
        if(this.object === null || this.eventDispatcher === null)
        {
            return;
        }

        this.eventDispatcher.emit(
            RoomObjectFurnitureActionEvent.ROFCAE_STICKIE,
            new RoomObjectFurnitureActionEvent(RoomObjectFurnitureActionEvent.ROFCAE_STICKIE, this.object)
        );
    }
}
