import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgChatSendMessage} from '../../../outgoing/rpg/chat/RpgChatSendMessage';

/** Writes RpgChatSendMessage in the order of the server's RpgChatSendMessageParser. */
export class RpgChatSendMessageSerializer implements IOutgoingSerializer<RpgChatSendMessage>
{
    serialize(message: RpgChatSendMessage): unknown[]
    {
        return [message.channel, message.target, message.text];
    }
}
