import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Place a rentable bot from the inventory into the room.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3369.as
 *
 * Header **2102**, from WIN63's registry (`_SafeCls_2046.as::_composers[2102]`). Corroborated by
 * vortex-emulator's `PlaceBotMessageEvent = 2102`.
 *
 * **RoomEngine's TODO named 1295 for this composer, and 1295 is a different message.** The
 * registry gives 1295 to `_SafeCls_2801`, the user-move composer that the same file's
 * `sendMoveUserObjectMessage()` TODO refers to. Both numbers appeared in RoomEngine.ts; only
 * 2102 belongs here.
 *
 * Selected in `placeObject()` by `category == 100 && typeId == 4`, the branch immediately after
 * the pet one (`typeId == 2`, {@link PlacePetComposer}). Both take the un-negated object id —
 * ghosts carry a negative id so they cannot collide with a real room object.
 *
 * The name comes from vortex-emulator; no unobfuscated tree carries this composer.
 */
export class PlaceBotMessageComposer extends MessageComposer<[number, number, number]>
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3369.as::getMessageArray() backing fields — the
    // constructor-assigned members. Their AS3 identifiers are obfuscated in every available
    // tree, so there is no real name to trace to.
    private _data: [number, number, number];

    constructor(botId: number, x: number, y: number)
    {
        super();
        this._data = [botId, x, y];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3369.as::getMessageArray()
    getMessageArray(): [number, number, number]
    {
        return this._data;
    }
}
