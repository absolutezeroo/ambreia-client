import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for user name changed messages.
 * Contains the user's web ID, room entity ID, and new name.
 *
 * @see source_as_win63/habbo/communication/messages/parser/users/UserNameChangedMessageEventParser.as
 */
export class UserNameChangedMessageParser implements IMessageParser
{
    private _webId: number = -1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/UserNameChangedMessageEventParser.as::get webId()
    get webId(): number
    {
        return this._webId;
    }

    private _id: number = -1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/UserNameChangedMessageEventParser.as::get id()
    get id(): number
    {
        return this._id;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/UserNameChangedMessageEventParser.as::_newName
    private _newName: string = '';

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/UserNameChangedMessageEventParser.as::get newName()
    get newName(): string
    {
        return this._newName;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/UserNameChangedMessageEventParser.as::flush()
    flush(): boolean
    {
        this._webId = -1;
        this._id = -1;
        this._newName = '';
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/UserNameChangedMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._webId = wrapper.readInt();
        this._id = wrapper.readInt();
        this._newName = wrapper.readString();

        return true;
    }
}
