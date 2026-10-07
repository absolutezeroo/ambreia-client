import {MessageComposer} from '@ambreia/net/messages/MessageComposer';

/**
 * Tells the server an avatar was clicked (a plain, unmodified click)
 *
 * The user-category sibling of `ClickFurniMessageComposer`: `clickRoomObject()` picks one of the
 * three by the clicked object's category, and this is the branch for category 100. The server
 * answers with whatever the avatar's click is worth in the current room (a wired trigger, a
 * game interaction), so nothing here waits on a reply.
 *
 * The name is recovered from `sources/win63_version/habbo/communication/messages/outgoing/room/class_3165.as`, which is
 * unobfuscated; the primary tree carries the same class as `_SafeCls_2770`.
 */
export class ClickCharacterComposer extends MessageComposer<[number]>
{
    private _userId: number;

    constructor(userId: number)
    {
        super();

        this._userId = userId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/messages/outgoing/room/_SafeCls_2770.as::getMessageArray()
    getMessageArray(): [number]
    {
        return [this._userId];
    }
}
