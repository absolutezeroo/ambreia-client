import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * A pet levelled up (header 3104).
 *
 * SERVER MISMATCH — Revision20260701's PetLevelUpdateMessageComposerSerializer writes only
 * `PetId, Level` (2 ints); the AS3 reads `roomIndex, petId, level` (3 ints). The leading roomIndex
 * is missing, so every field is shifted and the third read runs off the end — parse() throws
 * RangeError('End of buffer'), which SocketConnection catches and logs per message. Identical in
 * Revision20260112. The AS3 order is kept because it is the real protocol; see
 * docs/CLIENT-SERVER-ARCHITECTURE.md for the full pet mismatch table.
 *
 * AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetLevelUpdateEventParser.as
 */
export class PetLevelUpdateEventParser implements IMessageParser
{
    private _roomIndex: number = 0;

    private _petId: number = 0;

    private _level: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetLevelUpdateEventParser.as::get roomIndex()
    get roomIndex(): number
    {
        return this._roomIndex;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetLevelUpdateEventParser.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetLevelUpdateEventParser.as::get level()
    get level(): number
    {
        return this._level;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetLevelUpdateEventParser.as::flush()
    flush(): boolean
    {
        this._roomIndex = 0;
        this._petId = 0;
        this._level = 0;

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetLevelUpdateEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._petId = wrapper.readInt();
        this._level = wrapper.readInt();

        return true;
    }
}
