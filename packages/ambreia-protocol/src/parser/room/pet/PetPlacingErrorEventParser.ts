import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Placing a pet in the room failed (header 3195) — errorCode selects the localized alert.
 *
 * Read order matches Revision20260701's PetPlacingErrorMessageComposerSerializer exactly
 * (a single WriteInteger(ErrorCode)); one of only two pet messages where client and server agree.
 *
 * AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetPlacingErrorEventParser.as
 */
export class PetPlacingErrorEventParser implements IMessageParser
{
    private _errorCode: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetPlacingErrorEventParser.as::get errorCode()
    get errorCode(): number
    {
        return this._errorCode;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetPlacingErrorEventParser.as::flush()
    flush(): boolean
    {
        this._errorCode = 0;

        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/pets/PetPlacingErrorEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._errorCode = wrapper.readInt();

        return true;
    }
}
