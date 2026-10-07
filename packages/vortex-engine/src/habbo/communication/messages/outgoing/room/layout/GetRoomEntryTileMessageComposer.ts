import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Asks where the room's door tile is and which way it faces — sent when the floor plan editor is
 * shown and again on Reload, alongside {@link GetOccupiedTilesMessageComposer}.
 *
 * Header 880, from WIN63's registry (`_SafeCls_2046.as::_composers[880] = _SafeCls_2600`) and
 * corroborated by vortex-emulator's `GetRoomEntryTileMessageEvent = 880`.
 *
 * The answer is `RoomEntryTileMessageEvent` (2792), which this port already had — for
 * `RoomMessageHandler`, which reads the door position for the room itself. The editor is the only
 * thing that ever *asks* for it.
 *
 * Empty body. Name recovered from
 * `sources/win63_version/habbo/communication/messages/outgoing/room/layout/GetRoomEntryTileMessageComposer.as`.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2581/_SafeCls_2600.as
 */
export class GetRoomEntryTileMessageComposer extends MessageComposer<[]>
{
    // AS3: _SafeCls_2600.as::getMessageArray()
    getMessageArray(): []
    {
        return [];
    }
}
