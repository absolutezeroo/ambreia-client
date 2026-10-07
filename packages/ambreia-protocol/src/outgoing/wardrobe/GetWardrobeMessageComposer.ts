import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * "Send me my saved outfits." No payload — the server answers with `WardrobeMessageEvent`.
 *
 * Header **2210**, from WIN63's registry (`_composers[2210] = _SafeCls_3280`); the emulator
 * corroborates it as `GetWardrobeMessageEvent`, which is where the name comes from. Class name
 * DERIVED — the AS3 composer is obfuscated.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2781/_SafeCls_3280.as
 */
export class GetWardrobeMessageComposer extends MessageComposer<[]>
{
    // AS3: .../src/unknowns/_SafePkg_2781/_SafeCls_3280.as::getMessageArray()
    // AS3 never initialises its array field, so this returns the empty payload by construction.
    getMessageArray(): []
    {
        return [];
    }
}
