/**
 * FurnitureRoomDimmerLogic
 *
 * The moodlight. Its state does not arrive as a widget message: the furni's own
 * `furniture_data` string carries it, and this logic is what turns that string
 * into the event the room and the dimmer widget listen for.
 *
 * The port had only `useObject()`, and it raised `ROWRE_OPEN_WIDGET` where AS3
 * raises `ROWRE_DIMMER`. Everything downstream was already in place and waiting:
 * `RoomObjectDimmerStateUpdateEvent` was ported and dispatched by nobody,
 * `RoomEngineDimmerStateEvent` likewise, and `FurnitureDimmerWidgetHandler`
 * listens for the latter's `CYCLED` on a channel nothing ever emitted on.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2000.as
 */
import {FurnitureLogic} from './FurnitureLogic';
import {RoomObjectWidgetRequestEvent} from '../../scene/events/RoomObjectWidgetRequestEvent';
import {RoomObjectDimmerStateUpdateEvent} from '../../scene/events/RoomObjectDimmerStateUpdateEvent';
import {RoomObjectDataUpdateMessage} from '../../scene/messages/RoomObjectDataUpdateMessage';
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';

export class FurnitureRoomDimmerLogic extends FurnitureLogic
{
    /**
     * Whether a state event has been dispatched for this object.
     *
     * `dispose()` reads it to decide whether the room still believes the light
     * is on: without it, removing a lit moodlight would leave the tint behind.
     */
    // AS3: .../logic/furniture/_SafeCls_2000.as::_SafeStr_7753
    // Name DERIVED: the field is obfuscated in every tree; named for what it records.
    private _stateDispatched: boolean = false;

    constructor()
    {
        super();
        this.widgetType = 'dimmer';
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2000.as::getEventTypes()
    override getEventTypes(): string[]
    {
        return this.getAllEventTypes(super.getEventTypes(), [
            RoomObjectWidgetRequestEvent.ROWRE_DIMMER,
            RoomObjectWidgetRequestEvent.ROWRE_REMOVE_DIMMER,
            RoomObjectDimmerStateUpdateEvent.CYCLED
        ]);
    }

    override initialize(data: unknown): void
    {
        super.initialize(data);

        const model = this.object?.getModelController();

        model?.setNumber('furniture_uses_plane_mask', 0, true);
        model?.setNumber('furniture_plane_mask_type', 1, true);
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2000.as::useObject()
    override useObject(): void
    {
        if(this.object === null || this.eventDispatcher === null) return;

        // AS3 raises ROWRE_DIMMER, not the generic open-widget request: the
        // desktop routes the two differently.
        this.eventDispatcher.emit(
            RoomObjectWidgetRequestEvent.ROWRE_DIMMER,
            new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_DIMMER, this.object)
        );
    }

    /**
     * `state,presetId,effectId,#rrggbb,brightness` out of the furni's data
     * string, dispatched as the room's dimmer state.
     *
     * State 0 is "off", and AS3 forces white at full brightness for it rather
     * than trusting the colour the server sent alongside.
     */
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2000.as::dispatchColorUpdateEvent()
    private dispatchColorUpdateEvent(data: string | null): void
    {
        if(data === null) return;

        const parts = data.split(',');

        if(parts.length < 5) return;

        const state = this.readState(data);
        const presetId = parseInt(parts[1], 10);
        const effectId = parseInt(parts[2], 10);
        let color = parseInt(parts[3].substr(1), 16) >>> 0;
        let brightness = parseInt(parts[4], 10);

        if(state === 0)
        {
            color = 0xFFFFFF;
            brightness = 255;
        }

        if(this.eventDispatcher === null || this.object === null) return;

        this.eventDispatcher.emit(
            RoomObjectDimmerStateUpdateEvent.CYCLED,
            new RoomObjectDimmerStateUpdateEvent(this.object, state, presetId, effectId, color, brightness)
        );

        this._stateDispatched = true;
    }

    /** The leading field, one-based on the wire and zero-based everywhere else. */
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2000.as::readState()
    private readState(data: string | null): number
    {
        if(data === null) return 0;

        const parts = data.split(',');

        if(parts.length >= 5) return parseInt(parts[0], 10) - 1;

        return 0;
    }

    /**
     * The state event goes out BEFORE the message reaches the base class, and
     * the message is then rewritten with the decoded state — AS3 hands the base
     * a new `RoomObjectDataUpdateMessage` rather than the one it received,
     * because the state on the wire is one-based and the visualization expects
     * the decoded value.
     */
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2000.as::processUpdateMessage()
    override processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        const dataMessage = message as RoomObjectDataUpdateMessage;

        if(dataMessage && dataMessage.data)
        {
            const legacy = dataMessage.data.getLegacyString();

            if(this.object?.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) === 1)
            {
                this.dispatchColorUpdateEvent(legacy);
            }

            super.processUpdateMessage(new RoomObjectDataUpdateMessage(this.readState(legacy), dataMessage.data));

            return;
        }

        super.processUpdateMessage(message);
    }

    /**
     * The furni's `furniture_data` is consumed here, not read: AS3 clears the
     * model variable after dispatching, so one state change produces one event
     * however many frames pass before the next.
     */
    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2000.as::update()
    override update(time: number): void
    {
        super.update(time);

        const model = this.object?.getModelController();

        if(!model) return;

        if(model.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) !== 1) return;

        const data = model.getString(RoomObjectVariableEnum.FURNITURE_DATA);

        if(data !== null && data.length > 0)
        {
            model.setString(RoomObjectVariableEnum.FURNITURE_DATA, '');
            this.dispatchColorUpdateEvent(data);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/logic/furniture/_SafeCls_2000.as::dispose()
    override dispose(): void
    {
        if(this._stateDispatched && this.eventDispatcher !== null && this.object !== null)
        {
            if(this.object.getModelController()?.getNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT) === 1)
            {
                // White at full brightness: the room has to be told the light is
                // gone, or the tint outlives the furni that cast it.
                this.eventDispatcher.emit(
                    RoomObjectDimmerStateUpdateEvent.CYCLED,
                    new RoomObjectDimmerStateUpdateEvent(this.object, 0, 1, 1, 0xFFFFFF, 255)
                );
                this.eventDispatcher.emit(
                    RoomObjectWidgetRequestEvent.ROWRE_REMOVE_DIMMER,
                    new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.ROWRE_REMOVE_DIMMER, this.object)
                );
            }

            this._stateDispatched = false;
        }

        super.dispose();
    }
}
