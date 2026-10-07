import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AvatarEffectExpiredMessageParser} from '../../parser/inventory/AvatarEffectExpiredMessageParser';

/**
 * Incoming "avatar effect expired" (header 2236). Class name derived — the
 * WIN63 event class is obfuscated to `_SafeCls_3414`, registered at id 2236 in
 * com/sulake/habbo/communication/_SafeCls_2046.as; consumed by
 * inventory/_SafeCls_1951.as::onAvatarEffectExpired().
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2475/_SafeCls_3414.as
 */
export class AvatarEffectExpiredMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callback: MessageEventCallback)
    {
        super(callback, AvatarEffectExpiredMessageParser);
    }
}
