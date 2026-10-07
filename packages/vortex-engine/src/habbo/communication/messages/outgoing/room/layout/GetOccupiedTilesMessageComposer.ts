import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Asks which tiles the room already has furniture on — sent when the floor plan editor is shown
 * and again on Reload, alongside {@link GetRoomEntryTileMessageComposer}.
 *
 * Header 3426, from WIN63's registry (`_SafeCls_2046.as::_composers[3426] = _SafeCls_3777`) and
 * corroborated by vortex-emulator's `GetOccupiedTilesMessageEvent = 3426` (the emulator names
 * client→server messages "...MessageEvent" and server→client ones "...MessageComposer" — the
 * opposite of this client's split — so its name mirrors this class rather than confirming the
 * direction a second time).
 *
 * Empty body. Name recovered from
 * `sources/win63_version/habbo/communication/messages/outgoing/room/layout/GetOccupiedTilesMessageComposer.as`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2581/_SafeCls_3777.as
 */
export class GetOccupiedTilesMessageComposer extends MessageComposer<[]>
{
    // AS3: _SafeCls_3777.as::getMessageArray()
    getMessageArray(): []
    {
        return [];
    }
}
