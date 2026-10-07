import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {NoobnessLevelMessageParser} from '../../parser/handshake/NoobnessLevelMessageParser';

/**
 * Event handler for noobness level message
 * Indicates user's experience level (new user status)
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/NoobnessLevelMessageEvent.as
 */
export class NoobnessLevelMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, NoobnessLevelMessageParser);
    }
}
