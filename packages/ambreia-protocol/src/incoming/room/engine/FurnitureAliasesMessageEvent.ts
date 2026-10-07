/**
 * FurnitureAliasesMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.engine.FurnitureAliasesMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    FurnitureAliasesMessageParser
} from '../../../parser/room/engine/FurnitureAliasesMessageParser';

export class FurnitureAliasesMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, FurnitureAliasesMessageParser);
    }
}
