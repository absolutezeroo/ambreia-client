import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AvatarEffectAddedMessageParser} from '../../parser/inventory/AvatarEffectAddedMessageParser';

/**
 * Incoming "avatar effect added" (header 1577). Class name derived — the WIN63
 * event class is obfuscated to `_SafeCls_3453`, registered at id 1577 in
 * com/sulake/habbo/communication/_SafeCls_2046.as; consumed by
 * inventory/_SafeCls_1951.as::onAvatarEffectAdded().
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2475/_SafeCls_3453.as
 */
export class AvatarEffectAddedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AvatarEffectAddedMessageParser);
    }
}
