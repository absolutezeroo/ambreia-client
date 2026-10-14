import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgDialogueChooseMessage} from '../../../outgoing/rpg/quests/RpgDialogueChooseMessage';

/** Writes RpgDialogueChooseMessage in the order of the server's RpgDialogueChooseMessageParser. */
export class RpgDialogueChooseMessageSerializer implements IOutgoingSerializer<RpgDialogueChooseMessage>
{
    serialize(message: RpgDialogueChooseMessage): unknown[]
    {
        return [message.choice];
    }
}
