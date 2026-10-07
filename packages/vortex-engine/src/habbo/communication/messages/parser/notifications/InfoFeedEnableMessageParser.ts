import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for info feed enable message
 *
 * @see source_as_win63/habbo/communication/messages/parser/notifications/InfoFeedEnableMessageEventParser.as
 */
export class InfoFeedEnableMessageParser implements IMessageParser
{
    private _enabled: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/InfoFeedEnableMessageEventParser.as::get enabled()
    get enabled(): boolean
    {
        return this._enabled;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/InfoFeedEnableMessageEventParser.as::flush()
    flush(): boolean
    {
        this._enabled = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/InfoFeedEnableMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._enabled = wrapper.readBoolean();
        return true;
    }
}
