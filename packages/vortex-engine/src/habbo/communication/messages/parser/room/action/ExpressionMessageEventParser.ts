/**
 * ExpressionMessageEventParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.action.ExpressionMessageEventParser
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export class ExpressionMessageEventParser implements IMessageParser
{
    private _userId: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/ExpressionMessageEventParser.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    private _expressionType: number = -1;

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/ExpressionMessageEventParser.as::get expressionType()
    get expressionType(): number
    {
        return this._expressionType;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/ExpressionMessageEventParser.as::flush()
    flush(): boolean
    {
        this._userId = 0;
        this._expressionType = -1;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/room/action/ExpressionMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._userId = wrapper.readInt();
        this._expressionType = wrapper.readInt();

        return true;
    }
}
