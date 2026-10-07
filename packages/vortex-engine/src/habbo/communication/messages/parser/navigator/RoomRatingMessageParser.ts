import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for room rating message
 *
 * @see source_as_win63/habbo/communication/messages/parser/navigator/RoomRatingEventParser.as
 */
export class RoomRatingMessageParser implements IMessageParser
{
    private _rating: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/RoomRatingEventParser.as::get rating()
    get rating(): number
    {
        return this._rating;
    }

    private _canRate: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/RoomRatingEventParser.as::get canRate()
    get canRate(): boolean
    {
        return this._canRate;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/RoomRatingEventParser.as::flush()
    flush(): boolean
    {
        this._rating = 0;
        this._canRate = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/navigator/RoomRatingEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._rating = wrapper.readInt();
        this._canRate = wrapper.readBoolean();
        return true;
    }
}
