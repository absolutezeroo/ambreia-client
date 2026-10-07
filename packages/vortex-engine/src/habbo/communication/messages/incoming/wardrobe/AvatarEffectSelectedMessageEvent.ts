import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import {AvatarEffectSelectedMessageParser} from '../../parser/wardrobe/AvatarEffectSelectedMessageParser';

/**
 * "An avatar effect became the selected one." Header **3629**, from WIN63's registry
 * (`_SafeStr_4546[3629] = _SafeCls_3136`).
 *
 * Not to be confused with header **2624**, the room-avatar-effect push already ported as
 * `AvatarEffectMessageEvent`. 3629 was once mistaken for that message and corrected to 2624; both
 * ids are real and carry different payloads — this one a bare effect type, that one a user id and
 * an effect id. Class name DERIVED, after its consumer
 * `AvatarEditorMessageHandler::onAvatarEffectSelected()`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2475/_SafeCls_3136.as
 */
export class AvatarEffectSelectedMessageEvent extends MessageEvent implements IMessageEvent
{
    // AS3: .../src/unknowns/_SafePkg_2475/_SafeCls_3136.as::_SafeCls_3136()
    constructor(callback: MessageEventCallback)
    {
        super(callback, AvatarEffectSelectedMessageParser);
    }
}
