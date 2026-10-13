import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgDeathChoiceMessage} from '../../../outgoing/rpg/combat/RpgDeathChoiceMessage';

/** Writes RpgDeathChoiceMessage in the order of the server's RpgDeathChoiceMessageParser. */
export class RpgDeathChoiceMessageSerializer implements IOutgoingSerializer<RpgDeathChoiceMessage>
{
    serialize(message: RpgDeathChoiceMessage): unknown[]
    {
        return [message.choice];
    }
}
