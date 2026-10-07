import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Ask the server for a wall item's item-data — the stickie open path (ROFCAE_STICKIE).
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_2834.as
 *
 * Header **350**, from WIN63's registry (`_SafeCls_2046.as::_composers[350]`).
 *
 * **Known client↔server mismatch — this message currently goes nowhere.** `vortex-emulator`
 * listens for it on **204** (`GetItemDataMessageEvent`), and its own comment there says the
 * constant "matches vortex-client's registry exactly" while being "not found in either official
 * AS3 revision" — i.e. the server was aligned to this port's older number rather than to WIN63.
 * The header source-of-truth order (CLAUDE.md) puts WIN63's registry first and the emulator second,
 * so 350 is what ships here and the emulator is the side that needs correcting. Until it is, a
 * stickie double-click sends 350, the server ignores it, no item-data update comes back, and the
 * widget never opens — silently, since nothing on either side errors.
 */
export class GetItemDataMessageComposer extends MessageComposer<ConstructorParameters<typeof GetItemDataMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetItemDataMessageComposer>;

    constructor(objectId: number)
    {
        super();
        this._data = [objectId];
    }

    // AS3: .../src/unknowns/_SafePkg_2136/_SafeCls_2834.as::getMessageArray()
    getMessageArray()
    {
        return this._data;
    }
}
