import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgItemDestroyMessage} from '../../../outgoing/rpg/items/RpgItemDestroyMessage';

/** Writes RpgItemDestroyMessage in the order of the server's RpgItemDestroyMessageParser. */
export class RpgItemDestroyMessageSerializer implements IOutgoingSerializer<RpgItemDestroyMessage>
{
    serialize(message: RpgItemDestroyMessage): unknown[]
    {
        return [message.bagSlot, message.quantity];
    }
}
