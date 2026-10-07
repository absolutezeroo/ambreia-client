import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {GetGuestRoomResultMessageParser} from '../../parser/navigator/GetGuestRoomResultMessageParser';

/**
 * Event handler for GetGuestRoomResult message
 *
 * @see source_as_win63/habbo/communication/messages/incoming/navigator/GetGuestRoomResultEvent.as
 */
export class GetGuestRoomResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, GetGuestRoomResultMessageParser);
    }
}
