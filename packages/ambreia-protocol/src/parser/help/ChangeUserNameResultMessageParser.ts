import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for change user name result messages.
 * Contains the result code, name, and suggestions if the change failed.
 *
 * @see source_as_win63/habbo/communication/messages/parser/avatar/ChangeUserNameResultMessageEventParser.as
 */
export class ChangeUserNameResultMessageParser implements IMessageParser
{
    private _resultCode: number = -1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/ChangeUserNameResultMessageEventParser.as::get resultCode()
    get resultCode(): number
    {
        return this._resultCode;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/ChangeUserNameResultMessageEventParser.as::_name
    private _name: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/ChangeUserNameResultMessageEventParser.as::get name()
    get name(): string
    {
        return this._name;
    }

    private _nameSuggestions: string[] = [];

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/ChangeUserNameResultMessageEventParser.as::get nameSuggestions()
    get nameSuggestions(): string[]
    {
        return this._nameSuggestions;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/ChangeUserNameResultMessageEventParser.as::flush()
    flush(): boolean
    {
        this._resultCode = -1;
        this._name = '';
        this._nameSuggestions = [];
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/avatar/ChangeUserNameResultMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._resultCode = wrapper.readInt();
        this._name = wrapper.readString();

        const count = wrapper.readInt();

        this._nameSuggestions = [];

        for(let i = 0; i < count; i++)
        {
            this._nameSuggestions.push(wrapper.readString());
        }

        return true;
    }
}
