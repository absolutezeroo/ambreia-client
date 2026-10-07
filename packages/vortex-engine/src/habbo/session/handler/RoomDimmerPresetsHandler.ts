import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomHandlerListener} from '../IRoomHandlerListener';
import {BaseHandler} from './BaseHandler';

// Message events
import {
    RoomDimmerPresetsMessageEvent
} from '@ambreia/protocol/incoming/room/furniture/RoomDimmerPresetsMessageEvent';

// Parsers
import type {
    RoomDimmerPresetsMessageEventParser
} from '@ambreia/protocol/parser/room/furniture/RoomDimmerPresetsMessageEventParser';

// Events
import {RoomSessionDimmerPresetsEvent} from '../events/RoomSessionDimmerPresetsEvent';

/**
 * Room dimmer presets handler
 *
 * Handles dimmer presets messages and dispatches RoomSessionDimmerPresetsEvent.
 *
 * @see source_as_win63/habbo/session/handler/RoomDimmerPresetsHandler.as
 */
export class RoomDimmerPresetsHandler extends BaseHandler
{
    private _messageEvents: IMessageEvent[] = [];

    constructor(connection: IConnection | null, listener: IRoomHandlerListener)
    {
        super(connection, listener);

        if(connection === null)
        {
            return;
        }

        this.addMessageEvent(connection, new RoomDimmerPresetsMessageEvent(this.onRoomDimmerPresets.bind(this)));
    }

    override dispose(): void
    {
        if(this.connection)
        {
            for(const event of this._messageEvents)
            {
                this.connection.removeMessageEvent(event);
            }
        }
        this._messageEvents = [];

        super.dispose();
    }

    private addMessageEvent(connection: IConnection, event: IMessageEvent): void
    {
        connection.addMessageEvent(event);
        this._messageEvents.push(event);
    }

    // AS3: .../src/com/sulake/habbo/session/handler/RoomDimmerPresetsHandler.as::onRoomDimmerPresets()
    private onRoomDimmerPresets(event: IMessageEvent): void
    {
        const dimmerEvent = event as RoomDimmerPresetsMessageEvent;
        if(dimmerEvent === null || dimmerEvent.parser === null)
        {
            return;
        }

        const parser = dimmerEvent.parser as RoomDimmerPresetsMessageEventParser;

        const session = this.listener.getSession(this.roomId);
        if(session === null)
        {
            return;
        }

        const presetsEvent = new RoomSessionDimmerPresetsEvent(
            RoomSessionDimmerPresetsEvent.ROOM_DIMMER_PRESETS,
            session
        );
        presetsEvent.selectedPresetId = parser.selectedPresetId;
        presetsEvent.itemId = parser.itemId;
        presetsEvent.isOn = parser.isOn;

        for(let i = 0; i < parser.presetCount; i++)
        {
            const preset = parser.getPreset(i);

            if(preset !== null)
            {
                presetsEvent.storePreset(preset.id, preset.type, preset.color, preset.light);
            }
        }

        if(this.listener && this.listener.sessionEvents)
        {
            this.listener.sessionEvents.emit(RoomSessionDimmerPresetsEvent.ROOM_DIMMER_PRESETS, presetsEvent);
        }
    }
}
