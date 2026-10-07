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

    private _respectTotal: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get respectTotal()
    get respectTotal(): number
    {
        return this._respectTotal;
    }

    private _respectLeft: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get respectLeft()
    get respectLeft(): number
    {
        return this._respectLeft;
    }

    private _petRespectLeft: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get petRespectLeft()
    get petRespectLeft(): number
    {
        return this._petRespectLeft;
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

    private _accountSafetyLocked: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get accountSafetyLocked()
    get accountSafetyLocked(): boolean
    {
        return this._accountSafetyLocked;
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

    private _respectReplenishesLeft: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get respectReplenishesLeft()
    get respectReplenishesLeft(): number
    {
        return this._respectReplenishesLeft;
    }

    private _maxRespectPerDay: number = 3;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::get maxRespectPerDay()
    get maxRespectPerDay(): number
    {
        return this._maxRespectPerDay;
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
        this._respectTotal = 0;
        this._respectLeft = 0;
        this._petRespectLeft = 0;
        this._streamPublishingAllowed = false;
        this._lastAccessDate = '';
        this._nameChangeAllowed = false;
        this._accountSafetyLocked = false;
        this._accountTradeLocked = false;
        this._nameColor = '';
        this._respectReplenishesLeft = 0;
        this._maxRespectPerDay = 3;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/UserObjectEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._id = wrapper.readInt();
        this._name = wrapper.readString();
        this._figure = wrapper.readString();
        this._sex = wrapper.readString();
        this._customData = wrapper.readString();
        this._realName = wrapper.readString();
        this._directMail = wrapper.readBoolean();
        this._respectTotal = wrapper.readInt();
        this._respectLeft = wrapper.readInt();
        this._petRespectLeft = wrapper.readInt();
        this._streamPublishingAllowed = wrapper.readBoolean();
        this._lastAccessDate = wrapper.readString();
        this._nameChangeAllowed = wrapper.readBoolean();
        this._accountSafetyLocked = wrapper.readBoolean();

        if(wrapper.bytesAvailable > 0)
        {
            this._accountTradeLocked = wrapper.readBoolean();
            this._nameColor = wrapper.readString();
        }

        if(wrapper.bytesAvailable > 0)
        {
            this._respectReplenishesLeft = wrapper.readInt();
            this._maxRespectPerDay = wrapper.readInt();
        }

        return true;
    }
}
