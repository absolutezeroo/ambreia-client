import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {UniqueMachineIdMessageParser} from '../../parser/handshake/UniqueMachineIdMessageParser';

/**
 * Event handler for Unique Machine ID message
 * Message ID: 3974
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/UniqueMachineIDEvent.as
 */
export class UniqueMachineIdMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, UniqueMachineIdMessageParser);
    }
}
