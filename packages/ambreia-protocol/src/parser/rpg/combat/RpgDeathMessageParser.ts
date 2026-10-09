import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgDeathMessage} from '../../../incoming/rpg/combat/RpgDeathMessage';

/** Reads RpgDeathMessage in the order of the server's RpgDeathMessageComposerSerializer. */
export class RpgDeathMessageParser implements IIncomingParser<RpgDeathMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgDeathMessage
    {
        return new RpgDeathMessage(wrapper.readInt());
    }
}
