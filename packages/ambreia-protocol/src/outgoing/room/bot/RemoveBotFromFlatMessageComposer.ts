import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Pick a rentable bot back up out of the room — the "OBJECT_PICKUP_BOT" gesture.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3108.as
 *
 * Header 2743, from WIN63's registry (`_SafeCls_2046.as::_composers[2743]`). Corroborated by
 * vortex-emulator's `RemoveBotFromFlatMessageEvent = 2743`.
 *
 * Takes the bot's `webID`, not its room-object id — `modifyRoomObject()` resolves the user data
 * first and sends `userData.webID`, mirroring the pet pickup path directly above it.
 *
 * The server acts on it: `RemoveBotFromFlatMessageHandler` takes the bot out of the room and
 * `BotAddedToInventoryEventMessageComposer` hands it back to the inventory. (This note used to say
 * the opposite — vortex-emulator grew bots on 2026-08-08.)
 *
 * The name comes from vortex-emulator; no unobfuscated tree carries this composer.
 */
export class RemoveBotFromFlatMessageComposer extends MessageComposer<[number]>
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3108.as::getMessageArray() backing fields — the
    // constructor-assigned members. Their AS3 identifiers are obfuscated in every available
    // tree, so there is no real name to trace to.
    private _data: [number];

    constructor(webId: number)
    {
        super();
        this._data = [webId];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2136/_SafeCls_3108.as::getMessageArray()
    getMessageArray(): [number]
    {
        return this._data;
    }
}
