import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * Parser for block/unblock update.
 *
 * @see sources/win63_version/habbo/communication/messages/parser/users/BlockUserUpdateMessageEventParser.as
 */
export class BlockUserUpdateMessageParser implements IMessageParser
{
    private _result: number = -1;
    private _userId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/BlockUserUpdateMessageEventParser.as::get result()
    get result(): number
    {
        return this._result;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/BlockUserUpdateMessageEventParser.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/BlockUserUpdateMessageEventParser.as::flush()
    flush(): boolean
    {
        this._result = -1;
        this._userId = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/users/BlockUserUpdateMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._result = wrapper.readInt();
        this._userId = wrapper.readInt();
        return true;
    }
}
