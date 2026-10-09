import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgItemUnequipMessage} from '../../../outgoing/rpg/items/RpgItemUnequipMessage';

/** Writes RpgItemUnequipMessage in the order of the server's RpgItemUnequipMessageParser. */
export class RpgItemUnequipMessageSerializer implements IOutgoingSerializer<RpgItemUnequipMessage>
{
    serialize(message: RpgItemUnequipMessage): unknown[]
    {
        return [message.equipmentSlot];
    }
}
