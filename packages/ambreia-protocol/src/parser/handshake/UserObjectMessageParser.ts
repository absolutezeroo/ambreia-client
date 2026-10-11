import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for user object data
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/UserObjectEventParser.as
 */
export class UserObjectMessageParser implements IMessageParser
{
    private _id: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::_name
    private _name: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get name()
    get name(): string
    {
        return this._name;
    }

    private _figure: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get figure()
    get figure(): string
    {
        return this._figure;
    }

    private _sex: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get sex()
    get sex(): string
    {
        return this._sex;
    }

    private _customData: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get customData()
    get customData(): string
    {
        return this._customData;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::_realName
    private _realName: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get realName()
    get realName(): string
    {
        return this._realName;
    }

    private _directMail: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get directMail()
    get directMail(): boolean
    {
        return this._directMail;
    }

    private _streamPublishingAllowed: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get streamPublishingAllowed()
    get streamPublishingAllowed(): boolean
    {
        return this._streamPublishingAllowed;
    }

    private _lastAccessDate: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get lastAccessDate()
    get lastAccessDate(): string
    {
        return this._lastAccessDate;
    }

    private _nameChangeAllowed: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get nameChangeAllowed()
    get nameChangeAllowed(): boolean
    {
        return this._nameChangeAllowed;
    }

    private _accountTradeLocked: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get accountTradeLocked()
    get accountTradeLocked(): boolean
    {
        return this._accountTradeLocked;
    }

    private _nameColor: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get nameColor()
    get nameColor(): string
    {
        return this._nameColor;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::flush()
    flush(): boolean
    {
        this._id = 0;
        this._name = '';
        this._figure = '';
        this._sex = '';
        this._customData = '';
        this._realName = '';
        this._directMail = false;
        this._streamPublishingAllowed = false;
        this._lastAccessDate = '';
        this._nameChangeAllowed = false;
        this._accountTradeLocked = false;
        this._nameColor = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::parse()
    // DEVIATION: AS3 reads an account-safety-locked flag after nameChangeAllowed; the RPG server has
    // no safety lock and no longer writes it.
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._id = wrapper.readInt();
        this._name = wrapper.readString();
        this._figure = wrapper.readString();
        this._sex = wrapper.readString();
        this._customData = wrapper.readString();
        this._realName = wrapper.readString();
        this._directMail = wrapper.readBoolean();
        // Legacy Habbo respect counters are still present on the wire for compatibility.
        // Ambreia has no Respect product system, so consume them without retaining state.
        wrapper.readInt();
        wrapper.readInt();
        wrapper.readInt();
        this._streamPublishingAllowed = wrapper.readBoolean();
        this._lastAccessDate = wrapper.readString();
        this._nameChangeAllowed = wrapper.readBoolean();

        if(wrapper.bytesAvailable > 0)
        {
            this._accountTradeLocked = wrapper.readBoolean();
            this._nameColor = wrapper.readString();
        }

        if(wrapper.bytesAvailable > 0)
        {
            // Same compatibility tail: consume the two retired Respect allowance fields.
            wrapper.readInt();
            wrapper.readInt();
        }

        return true;
    }
}
