import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgAutoAttackMessage} from '../../../outgoing/rpg/combat/RpgAutoAttackMessage';

/** Writes RpgAutoAttackMessage in the order of the server's RpgAutoAttackMessageParser. */
export class RpgAutoAttackMessageSerializer implements IOutgoingSerializer<RpgAutoAttackMessage>
{
    serialize(message: RpgAutoAttackMessage): unknown[]
    {
        return [message.active];
    }
}
