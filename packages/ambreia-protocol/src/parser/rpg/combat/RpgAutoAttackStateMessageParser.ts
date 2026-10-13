import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgAutoAttackStateMessage} from '../../../incoming/rpg/combat/RpgAutoAttackStateMessage';

/** Reads RpgAutoAttackStateMessage in the order of the server's RpgAutoAttackStateMessageComposerSerializer. */
export class RpgAutoAttackStateMessageParser implements IIncomingParser<RpgAutoAttackStateMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgAutoAttackStateMessage
    {
        return new RpgAutoAttackStateMessage(wrapper.readBoolean());
    }
}
