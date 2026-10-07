/**
 * AvatarEffectMessageEvent
 *
 * Based on AS3: com.sulake.habbo.communication.messages.incoming.room.action.AvatarEffectMessageEvent
 */
import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {
    AvatarEffectMessageEventParser
} from '../../../parser/room/action/AvatarEffectMessageEventParser';

export class AvatarEffectMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AvatarEffectMessageEventParser);
    }
}
