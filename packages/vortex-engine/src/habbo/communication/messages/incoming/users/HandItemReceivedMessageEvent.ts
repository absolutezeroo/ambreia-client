import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {HandItemReceivedMessageParser} from '../../parser/users/HandItemReceivedMessageParser';

/**
 * HandItemReceivedMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.users.HandItemReceivedMessageEvent
 */
export class HandItemReceivedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, HandItemReceivedMessageParser);
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/HandItemReceivedMessageEvent.as::get giverUserId()
    get giverUserId(): number
    {
        return (this._parser as HandItemReceivedMessageParser).giverUserId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/incoming/users/HandItemReceivedMessageEvent.as::get handItemType()
    get handItemType(): number
    {
        return (this._parser as HandItemReceivedMessageParser).handItemType;
    }
}
