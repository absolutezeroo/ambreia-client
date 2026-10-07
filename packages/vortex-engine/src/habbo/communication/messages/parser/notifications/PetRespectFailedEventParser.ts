import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for pet respect failed event
 *
 * Parses the required days and avatar age in days.
 *
 * @see source_as_win63/habbo/communication/messages/parser/room/pets/PetRespectFailedEventParser.as
 */
export class PetRespectFailedEventParser implements IMessageParser
{
    private _requiredDays: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetRespectFailedEventParser.as::get requiredDays()
    get requiredDays(): number
    {
        return this._requiredDays;
    }

    private _avatarAgeInDays: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetRespectFailedEventParser.as::get avatarAgeInDays()
    get avatarAgeInDays(): number
    {
        return this._avatarAgeInDays;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetRespectFailedEventParser.as::flush()
    flush(): boolean
    {
        this._requiredDays = 0;
        this._avatarAgeInDays = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetRespectFailedEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._requiredDays = wrapper.readInt();
        this._avatarAgeInDays = wrapper.readInt();

        return true;
    }
}
