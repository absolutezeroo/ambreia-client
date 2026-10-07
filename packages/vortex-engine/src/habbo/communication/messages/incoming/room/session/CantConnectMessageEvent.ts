import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {CantConnectMessageParser} from '@habbo/communication/messages/parser/room/session/CantConnectMessageParser';

/**
 * CantConnectMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.CantConnectMessageEvent
 */
export class CantConnectMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, CantConnectMessageParser);
    }
}
