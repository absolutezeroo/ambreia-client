import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {CompleteDiffieHandshakeMessageParser} from '../../parser/handshake/GenerateSecretKeyMessageParser';

/**
 * Event handler for CompleteDiffieHandshake message
 * Message ID: 3777
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/CompleteDiffieHandshakeEvent.as
 */
export class CompleteDiffieHandshakeMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, CompleteDiffieHandshakeMessageParser);
    }
}