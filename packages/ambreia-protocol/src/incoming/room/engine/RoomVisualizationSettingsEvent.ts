import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    RoomVisualizationSettingsEventParser
} from '../../../parser/room/engine/RoomVisualizationSettingsEventParser';

/**
 * @see sources/win63_version/habbo/communication/messages/incoming/room/engine/RoomVisualizationSettingsEvent.as
 */
export class RoomVisualizationSettingsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, RoomVisualizationSettingsEventParser);
    }
}
