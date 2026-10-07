import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AvatarEffectActivatedMessageParser} from '../../parser/inventory/AvatarEffectActivatedMessageParser';

/**
 * Incoming "avatar effect activated" (header 3814). Class name derived — the
 * WIN63 event class is obfuscated to `_SafeCls_2624`, registered at id 3814 in
 * com/sulake/habbo/communication/_SafeCls_2046.as; consumed by
 * inventory/_SafeCls_1951.as::onAvatarEffectActivated().
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2475/_SafeCls_2624.as
 */
export class AvatarEffectActivatedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AvatarEffectActivatedMessageParser);
    }
}
