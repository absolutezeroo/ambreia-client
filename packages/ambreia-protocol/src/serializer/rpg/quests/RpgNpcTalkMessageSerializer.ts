import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgNpcTalkMessage} from '../../../outgoing/rpg/quests/RpgNpcTalkMessage';

/** Writes RpgNpcTalkMessage in the order of the server's RpgNpcTalkMessageParser. */
export class RpgNpcTalkMessageSerializer implements IOutgoingSerializer<RpgNpcTalkMessage>
{
    serialize(message: RpgNpcTalkMessage): unknown[]
    {
        return [message.objectId];
    }
}
