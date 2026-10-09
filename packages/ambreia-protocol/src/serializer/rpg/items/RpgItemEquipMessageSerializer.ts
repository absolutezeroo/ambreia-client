import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgItemEquipMessage} from '../../../outgoing/rpg/items/RpgItemEquipMessage';

/** Writes RpgItemEquipMessage in the order of the server's RpgItemEquipMessageParser. */
export class RpgItemEquipMessageSerializer implements IOutgoingSerializer<RpgItemEquipMessage>
{
    serialize(message: RpgItemEquipMessage): unknown[]
    {
        return [message.bagSlot];
    }
}
