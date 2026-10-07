import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for login failed hotel closed message
 *
 * @see source_as_win63/habbo/communication/messages/parser/availability/LoginFailedHotelClosedMessageEventParser.as
 */
export class LoginFailedHotelClosedMessageEventParser implements IMessageParser
{
    private _openHour: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/LoginFailedHotelClosedMessageEventParser.as::get openHour()
    get openHour(): number
    {
        return this._openHour;
    }

    private _openMinute: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/LoginFailedHotelClosedMessageEventParser.as::get openMinute()
    get openMinute(): number
    {
        return this._openMinute;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/LoginFailedHotelClosedMessageEventParser.as::flush()
    flush(): boolean
    {
        this._openHour = 0;
        this._openMinute = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/availability/LoginFailedHotelClosedMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._openHour = wrapper.readInt();
        this._openMinute = wrapper.readInt();
        return true;
    }
}
