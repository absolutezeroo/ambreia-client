import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    RoomPropertyMessageEventParser
} from '../../../parser/room/engine/RoomPropertyMessageEventParser';

/**
 * @see sources/win63_version/habbo/communication/messages/incoming/room/engine/RoomPropertyMessageEvent.as
 */
export class RoomPropertyMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, RoomPropertyMessageEventParser);
    }
}
