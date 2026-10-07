import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for open pet package result message
 *
 * @see source_as_win63/habbo/communication/messages/parser/room/furniture/OpenPetPackageResultMessageEventParser.as
 */
export class OpenPetPackageResultMessageEventParser implements IMessageParser
{
    private _objectId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageResultMessageEventParser.as::get objectId()
    get objectId(): number
    {
        return this._objectId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageResultMessageEventParser.as::_nameValidationStatus
    private _nameValidationStatus: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageResultMessageEventParser.as::get nameValidationStatus()
    get nameValidationStatus(): number
    {
        return this._nameValidationStatus;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageResultMessageEventParser.as::_nameValidationInfo
    private _nameValidationInfo: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageResultMessageEventParser.as::get nameValidationInfo()
    get nameValidationInfo(): string
    {
        return this._nameValidationInfo;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageResultMessageEventParser.as::flush()
    flush(): boolean
    {
        this._objectId = 0;
        this._nameValidationStatus = 0;
        this._nameValidationInfo = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/furniture/OpenPetPackageResultMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._objectId = wrapper.readInt();
        this._nameValidationStatus = wrapper.readInt();
        this._nameValidationInfo = wrapper.readString();

        return true;
    }
}
