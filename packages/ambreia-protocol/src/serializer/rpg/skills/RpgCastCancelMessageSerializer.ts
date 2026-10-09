import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgCastCancelMessage} from '../../../outgoing/rpg/skills/RpgCastCancelMessage';

/** Writes RpgCastCancelMessage in the order of the server's RpgCastCancelMessageParser. */
export class RpgCastCancelMessageSerializer implements IOutgoingSerializer<RpgCastCancelMessage>
{
    serialize(_message: RpgCastCancelMessage): unknown[]
    {
        return [];
    }
}
