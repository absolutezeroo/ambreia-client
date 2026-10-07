import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for activity points (currencies) message
 *
 * @see source_as_win63/habbo/communication/messages/parser/notifications/ActivityPointsMessageEventParser.as
 */
export class ActivityPointsMessageParser implements IMessageParser
{
    private _points: Map<number, number> = new Map();

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/ActivityPointsMessageEventParser.as::get points()
    get points(): Map<number, number>
    {
        return this._points;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/ActivityPointsMessageEventParser.as::flush()
    flush(): boolean
    {
        this._points = new Map();
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/notifications/ActivityPointsMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            const type = wrapper.readInt();
            const amount = wrapper.readInt();
            this._points.set(type, amount);
        }
        return true;
    }
}
