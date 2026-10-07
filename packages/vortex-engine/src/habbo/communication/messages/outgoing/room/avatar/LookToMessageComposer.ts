import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Turns the own avatar to face a tile. Sent when a user is selected by clicking their avatar or
 * their chat bubble, unless a click-user wired trigger owns the click.
 *
 * Header 2508, from WIN63's own registry (`habbo/communication/_SafeCls_2046.as:819`). The
 * emulator does NOT corroborate: it maps its own `LookToMessageEvent` to 9103, a placeholder its
 * comment already flags as UNRESOLVED and a pre-existing mismatch. Its parser reads the same two
 * ints in the same order, so only the header is wrong there.
 *
 * `win63_version` is cited only for the readable class name: this message is obfuscated in the
 * primary tree, which is where every member trace below points, because that tree is the
 * authority on behaviour and this one has shipped two bad decompiles today alone.
 *
 * @see sources/win63_version/habbo/communication/messages/outgoing/room/avatar/LookToMessageComposer.as
 */
export class LookToMessageComposer extends MessageComposer<[number, number]>
{
    // TS-only: the port's composers hold one tuple where AS3 holds two int fields (var_3909,
    // var_3957); both are read back only by getMessageArray().
    private _data: [number, number];

    constructor(x: number, y: number)
    {
        super();
        this._data = [x, y];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2424/_SafeCls_3064.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return this._data;
    }
}
