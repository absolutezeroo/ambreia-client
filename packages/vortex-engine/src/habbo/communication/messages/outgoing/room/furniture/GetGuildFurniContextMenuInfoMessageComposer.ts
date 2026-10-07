/**
 * GetGuildFurniContextMenuInfoMessageComposer
 *
 * Sent when a guild-customised furni is double-clicked; the reply
 * (`GuildFurniContextMenuInfoMessageEvent`) is what actually opens the bubble.
 * Header 826 in WIN63's own registry (`_composers[826] = _SafeCls_3874`), corroborated by the
 * emulator's `GetGuildFurniContextMenuInfoMessageEvent`.
 *
 * Class name DERIVED — the AS3 composer is `_SafePkg_2609::_SafeCls_3874`, obfuscated in every
 * tree, and named here after the reply it asks for.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2609/_SafeCls_3874.as
 */
import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

export class GetGuildFurniContextMenuInfoMessageComposer extends MessageComposer<[number, number]>
{
    private _data: [number, number];

    // AS3: .../src/unknowns/_SafePkg_2609/_SafeCls_3874.as::_SafeCls_3874()
    constructor(objectId: number, guildId: number)
    {
        super();

        this._data = [objectId, guildId];
    }

    // AS3: .../src/unknowns/_SafePkg_2609/_SafeCls_3874.as::getMessageArray()
    getMessageArray(): [number, number]
    {
        return this._data;
    }
}
