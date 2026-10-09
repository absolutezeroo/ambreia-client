import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgActionBarSetMessage} from '../../../outgoing/rpg/skills/RpgActionBarSetMessage';

/** Writes RpgActionBarSetMessage in the order of the server's RpgActionBarSetMessageParser. */
export class RpgActionBarSetMessageSerializer implements IOutgoingSerializer<RpgActionBarSetMessage>
{
    serialize(message: RpgActionBarSetMessage): unknown[]
    {
        return [message.slot, message.actionId];
    }
}
