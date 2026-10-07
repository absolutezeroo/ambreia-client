import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for is first login of day message
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/IsFirstLoginOfDayEventParser.as
 */
export class IsFirstLoginOfDayMessageParser implements IMessageParser
{
    private _isFirstLoginOfDay: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/IsFirstLoginOfDayEventParser.as::get isFirstLoginOfDay()
    get isFirstLoginOfDay(): boolean
    {
        return this._isFirstLoginOfDay;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/IsFirstLoginOfDayEventParser.as::flush()
    flush(): boolean
    {
        this._isFirstLoginOfDay = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/IsFirstLoginOfDayEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._isFirstLoginOfDay = wrapper.readBoolean();
        return true;
    }
}
