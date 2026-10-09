import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgTargetSelectMessage} from '../../../outgoing/rpg/interaction/RpgTargetSelectMessage';

/** Writes RpgTargetSelectMessage in the order of the server's RpgTargetSelectMessageParser. */
export class RpgTargetSelectMessageSerializer implements IOutgoingSerializer<RpgTargetSelectMessage>
{
    serialize(message: RpgTargetSelectMessage): unknown[]
    {
        return [message.objectId];
    }
}
