/**
 * OpenPetPackageResultMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.furniture.OpenPetPackageResultMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    OpenPetPackageResultMessageEventParser
} from '../../../parser/room/furniture/OpenPetPackageResultMessageEventParser';

export class OpenPetPackageResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, OpenPetPackageResultMessageEventParser);
    }
}
