/**
 * UserTypingMessageEventParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.chat.UserTypingMessageEventParser
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class UserTypingMessageEventParser implements IMessageParser
{
    private _userId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/chat/UserTypingMessageEventParser.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    private _isTyping: boolean = false;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/chat/UserTypingMessageEventParser.as::get isTyping()
    get isTyping(): boolean
    {
        return this._isTyping;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/chat/UserTypingMessageEventParser.as::flush()
    flush(): boolean
    {
        this._userId = 0;
        this._isTyping = false;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/chat/UserTypingMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._userId = wrapper.readInt();
        this._isTyping = wrapper.readInt() === 1;

        return true;
    }
}
