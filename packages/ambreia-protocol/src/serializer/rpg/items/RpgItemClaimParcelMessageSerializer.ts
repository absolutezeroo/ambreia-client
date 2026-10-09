import type {IOutgoingSerializer} from '@ambreia/net/style/MessageMap';
import type {RpgItemClaimParcelMessage} from '../../../outgoing/rpg/items/RpgItemClaimParcelMessage';

/** Writes RpgItemClaimParcelMessage in the order of the server's RpgItemClaimParcelMessageParser. */
export class RpgItemClaimParcelMessageSerializer implements IOutgoingSerializer<RpgItemClaimParcelMessage>
{
    serialize(message: RpgItemClaimParcelMessage): unknown[]
    {
        return [message.parcel];
    }
}
