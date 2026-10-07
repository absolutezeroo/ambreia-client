import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for figure update message
 * Sent when user's avatar appearance changes
 *
 * @see source_as_win63/habbo/communication/messages/parser/avatar/FigureUpdateEventParser.as
 */
export class FigureUpdateMessageParser implements IMessageParser
{
    private _figure: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/FigureUpdateEventParser.as::get figure()
    get figure(): string
    {
        return this._figure;
    }

    private _gender: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/FigureUpdateEventParser.as::get gender()
    get gender(): string
    {
        return this._gender;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/FigureUpdateEventParser.as::flush()
    flush(): boolean
    {
        this._figure = '';
        this._gender = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/FigureUpdateEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._figure = wrapper.readString();
        this._gender = wrapper.readString();
        if(this._gender)
        {
            this._gender = this._gender.toUpperCase();
        }
        return true;
    }
}
