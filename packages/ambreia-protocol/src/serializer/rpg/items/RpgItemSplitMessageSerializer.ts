import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgItemSplitMessage} from '../../../outgoing/rpg/items/RpgItemSplitMessage';

/** Writes RpgItemSplitMessage in the order of the server's RpgItemSplitMessageParser. */
export class RpgItemSplitMessageSerializer implements IOutgoingSerializer<RpgItemSplitMessage>
{
    serialize(message: RpgItemSplitMessage): unknown[]
    {
        return [message.from, message.quantity, message.to];
    }
}
