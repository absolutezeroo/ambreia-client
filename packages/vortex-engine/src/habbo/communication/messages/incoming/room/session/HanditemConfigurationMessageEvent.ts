import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {HanditemConfigurationMessageParser} from '@habbo/communication/messages/parser/room/session/HanditemConfigurationMessageParser';

/**
 * HanditemConfigurationMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.session.HanditemConfigurationMessageEvent
 */
export class HanditemConfigurationMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, HanditemConfigurationMessageParser);
    }
}
