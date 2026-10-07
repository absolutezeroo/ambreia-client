import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for guide session ended messages.
 * Contains the reason why the guide session ended.
 *
 * @see source_as_win63/habbo/communication/messages/parser/help/GuideSessionEndedMessageEventParser.as
 */
export class GuideSessionEndedMessageParser implements IMessageParser
{
    private _endReason: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionEndedMessageEventParser.as::get endReason()
    get endReason(): number
    {
        return this._endReason;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionEndedMessageEventParser.as::flush()
    flush(): boolean
    {
        this._endReason = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/help/GuideSessionEndedMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._endReason = wrapper.readInt();

        return true;
    }
}
