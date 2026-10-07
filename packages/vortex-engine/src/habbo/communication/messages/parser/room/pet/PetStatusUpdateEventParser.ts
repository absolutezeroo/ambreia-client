import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * A pet's breed/harvest/revive availability changed (header 2753).
 *
 * SERVER MISMATCH — Revision20260701's PetStatusUpdateMessageComposerSerializer has an empty body
 * (`//`): it writes the header and nothing else, in both Revision20260112 and Revision20260701, so
 * this is unfinished server work rather than a regression. The composer *is* sent (2 call sites),
 * so parse() will throw RangeError('End of buffer') on the first readInt(). SocketConnection
 * catches per message (log + messageParseError, no stream desync), so this surfaces as a visible
 * parse-error log rather than a crash. The read order below follows the AS3, which is the real
 * protocol — see docs/CLIENT-SERVER-ARCHITECTURE.md for the full pet mismatch table.
 *
 * AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as
 */
export class PetStatusUpdateEventParser implements IMessageParser
{
    private _roomIndex: number = 0;

    private _petId: number = 0;

    private _canBreed: boolean = false;

    private _canHarvest: boolean = false;

    private _canRevive: boolean = false;

    private _hasBreedingPermission: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as::get roomIndex()
    get roomIndex(): number
    {
        return this._roomIndex;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as::get petId()
    get petId(): number
    {
        return this._petId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as::get canBreed()
    get canBreed(): boolean
    {
        return this._canBreed;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as::get canHarvest()
    get canHarvest(): boolean
    {
        return this._canHarvest;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as::get canRevive()
    get canRevive(): boolean
    {
        return this._canRevive;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as::get hasBreedingPermission()
    get hasBreedingPermission(): boolean
    {
        return this._hasBreedingPermission;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as::flush()
    // AS3's flush() only returns true without resetting; the fields are reset here to match the
    // sibling parsers in this port and because SocketConnection calls flush() before every parse().
    flush(): boolean
    {
        this._roomIndex = 0;
        this._petId = 0;
        this._canBreed = false;
        this._canHarvest = false;
        this._canRevive = false;
        this._hasBreedingPermission = false;

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetStatusUpdateEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._petId = wrapper.readInt();
        this._canBreed = wrapper.readBoolean();
        this._canHarvest = wrapper.readBoolean();
        this._canRevive = wrapper.readBoolean();
        this._hasBreedingPermission = wrapper.readBoolean();

        return true;
    }
}
