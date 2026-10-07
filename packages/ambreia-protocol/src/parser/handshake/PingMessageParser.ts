import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Parser for Ping message (keep-alive)
 * Message ID: 658
 *
 * @see source_as_win63/habbo/communication/messages/parser/handshake/PingMessageEventParser.as
 */
export class PingMessageParser implements IMessageParser
{
    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/PingMessageEventParser.as::flush()
    flush(): boolean
    {
        return true;
    }

    // AS3: sources/win63_version/habbo/communication/messages/parser/handshake/PingMessageEventParser.as::parse()
    parse(_wrapper: IMessageDataWrapper): boolean
    {
        return true;
    }
}
