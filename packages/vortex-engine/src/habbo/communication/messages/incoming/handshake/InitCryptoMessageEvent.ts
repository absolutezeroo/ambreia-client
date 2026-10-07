import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {InitDiffieHandshakeMessageParser} from '../../parser/handshake/InitCryptoMessageParser';

/**
 * Event handler for InitDiffieHandshake message
 * Message ID: 771
 *
 * @see source_as_win63/habbo/communication/messages/incoming/handshake/InitDiffieHandshakeEvent.as
 */
export class InitDiffieHandshakeMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, InitDiffieHandshakeMessageParser);
    }
}