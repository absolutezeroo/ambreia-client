import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgEmoteSendMessage} from '../../../outgoing/rpg/emote/RpgEmoteSendMessage';

/** Writes RpgEmoteSendMessage in the order of the server's RpgEmoteMessageParser. */
export class RpgEmoteSendMessageSerializer implements IOutgoingSerializer<RpgEmoteSendMessage>
{
    serialize(message: RpgEmoteSendMessage): unknown[]
    {
        return [message.key];
    }
}
