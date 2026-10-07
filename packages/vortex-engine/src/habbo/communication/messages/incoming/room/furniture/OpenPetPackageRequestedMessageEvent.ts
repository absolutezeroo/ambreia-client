/**
 * OpenPetPackageRequestedMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.furniture.OpenPetPackageRequestedMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    OpenPetPackageRequestedMessageEventParser
} from '@habbo/communication/messages/parser/room/furniture/OpenPetPackageRequestedMessageEventParser';

export class OpenPetPackageRequestedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, OpenPetPackageRequestedMessageEventParser);
    }
}
