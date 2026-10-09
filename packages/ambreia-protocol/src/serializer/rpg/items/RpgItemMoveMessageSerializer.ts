import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgItemMoveMessage} from '../../../outgoing/rpg/items/RpgItemMoveMessage';

/** Writes RpgItemMoveMessage in the order of the server's RpgItemMoveMessageParser. */
export class RpgItemMoveMessageSerializer implements IOutgoingSerializer<RpgItemMoveMessage>
{
    serialize(message: RpgItemMoveMessage): unknown[]
    {
        return [message.from, message.to];
    }
}
