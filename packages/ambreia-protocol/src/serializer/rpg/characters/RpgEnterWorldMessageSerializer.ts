import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgEnterWorldMessage} from '../../../outgoing/rpg/characters/RpgEnterWorldMessage';

/** Writes RpgEnterWorldMessage in the order of the server's RpgEnterWorldMessageParser. */
export class RpgEnterWorldMessageSerializer implements IOutgoingSerializer<RpgEnterWorldMessage>
{
    serialize(message: RpgEnterWorldMessage): unknown[]
    {
        return [message.playerId];
    }
}
