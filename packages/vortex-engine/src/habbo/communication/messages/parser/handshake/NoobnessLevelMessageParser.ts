import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for noobness level message
 * Indicates user's experience level (new user status)
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/NoobnessLevelMessageEventParser.as
 */
export class NoobnessLevelMessageParser implements IMessageParser
{
    private _noobnessLevel: number = 0;

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/NoobnessLevelMessageEventParser.as::get noobnessLevel()
    get noobnessLevel(): number
    {
        return this._noobnessLevel;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/NoobnessLevelMessageEventParser.as::flush()
    flush(): boolean
    {
        this._noobnessLevel = 0;
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/NoobnessLevelMessageEventParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._noobnessLevel = wrapper.readInt();
        return true;
    }
}
