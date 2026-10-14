import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgQuestAbandonMessage} from '../../../outgoing/rpg/quests/RpgQuestAbandonMessage';

/** Writes RpgQuestAbandonMessage in the order of the server's RpgQuestAbandonMessageParser. */
export class RpgQuestAbandonMessageSerializer implements IOutgoingSerializer<RpgQuestAbandonMessage>
{
    serialize(message: RpgQuestAbandonMessage): unknown[]
    {
        return [message.questId];
    }
}
