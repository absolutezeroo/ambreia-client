import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * One tile the room already has something standing on.
 *
 * AS3 pushes an anonymous `{"x":…,"y":…}` object; this names the shape so callers are not typed
 * against `any`. Both fields are that literal's own keys.
 */
export interface IOccupiedTile
{
    // TS-only: AS3's anonymous object literal in `_SafeCls_4415.as::parse()` has no declared type.
    x: number;

    // TS-only: AS3's anonymous object literal in `_SafeCls_4415.as::parse()` has no declared type.
    y: number;
}

/**
 * Which tiles the floor plan editor must not let you redraw, header 1235.
 *
 * **Ints, not the bytes the height map uses for the same coordinates** — AS3 calls `readInteger`
 * twice per tile, and the emulator's serializer writes it that way and says so at the call site.
 * A room is capped at 64 tiles a side either way, so the width is redundant on both sides; it is
 * matched rather than optimised because the wire is not ours to change.
 *
 * Name recovered from
 * `sources/win63_version/habbo/communication/messages/parser/room/layout/RoomOccupiedTilesMessageEventParser.as`
 * — that tree is obfuscated too, but it is the one where messages keep readable filenames. (The
 * port drops AS3's "Event" infix from parser names, as it does throughout.)
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2875/_SafeCls_4415.as
 */
export class RoomOccupiedTilesMessageParser implements IMessageParser
{
    // AS3: _SafeCls_4415.as::_SafeStr_8614 (backing field of occupiedTiles)
    private _occupiedTiles: IOccupiedTile[] = [];

    // AS3: _SafeCls_4415.as::get occupiedTiles()
    get occupiedTiles(): IOccupiedTile[]
    {
        return this._occupiedTiles;
    }

    // AS3: _SafeCls_4415.as::flush()
    flush(): boolean
    {
        this._occupiedTiles = [];

        return true;
    }

    // AS3: _SafeCls_4415.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._occupiedTiles.push({x: wrapper.readInt(), y: wrapper.readInt()});
        }

        return true;
    }
}
