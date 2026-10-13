import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgThreatMessage} from '../../../incoming/rpg/combat/RpgThreatMessage';

/** Reads RpgThreatMessage in the order of the server's RpgThreatMessageComposerSerializer. */
export class RpgThreatMessageParser implements IIncomingParser<RpgThreatMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgThreatMessage
    {
        return new RpgThreatMessage(wrapper.readInt(), wrapper.readInt(), wrapper.readBoolean());
    }
}
