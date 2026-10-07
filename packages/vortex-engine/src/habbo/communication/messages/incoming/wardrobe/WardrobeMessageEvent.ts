import {MessageEvent} from '@ambreia/net/messages/MessageEvent';
import type {IMessageEvent, MessageEventCallback} from '@ambreia/net/messages/IMessageEvent';
import type {WardrobeOutfit} from '../../parser/wardrobe/WardrobeOutfit';
import {WardrobeMessageParser} from '../../parser/wardrobe/WardrobeMessageParser';

/**
 * The user's saved outfits, pushed in answer to `GetWardrobeMessageComposer`.
 *
 * Header **1484**, from WIN63's registry (`_SafeStr_4546[1484] = _SafeCls_3703`); the emulator
 * corroborates it as `WardrobeMessageComposer`, which is also where the name comes from. Class
 * name DERIVED — the AS3 event class is obfuscated and exists in no other tree.
 *
 * Unusually, this event exposes the parser's two fields directly rather than making the caller
 * reach through `getParser()` — AS3 declares `getParser()` **private** here, the only avatar-editor
 * event that does.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1759/_SafeCls_3703.as
 */
export class WardrobeMessageEvent extends MessageEvent implements IMessageEvent
{
    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_3703.as::STATE_OK
    // Name DERIVED (`_SafeStr_11604`): the 0 of the pair declared on this class. Its meaning is
    // not recoverable from the client — nothing here reads either constant.
    public static readonly STATE_OK: number = 0;

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_3703.as::STATE_SAVED
    // Name DERIVED (`_SafeStr_11446`): the 1 of the same pair, likewise unread.
    public static readonly STATE_SAVED: number = 1;

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_3703.as::_SafeCls_3703()
    constructor(callback: MessageEventCallback)
    {
        super(callback, WardrobeMessageParser);
    }

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_3703.as::get outfits()
    get outfits(): WardrobeOutfit[]
    {
        return (this.parser as WardrobeMessageParser | null)?.outfits ?? [];
    }

    // AS3: .../src/unknowns/_SafePkg_1759/_SafeCls_3703.as::get state()
    get state(): number
    {
        return (this.parser as WardrobeMessageParser | null)?.state ?? 0;
    }
}
