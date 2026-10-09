import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgCombatResultMessage} from '../../../incoming/rpg/combat/RpgCombatResultMessage';

/** Reads RpgCombatResultMessage in the order of the server's RpgCombatResultMessageComposerSerializer. */
export class RpgCombatResultMessageParser implements IIncomingParser<RpgCombatResultMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCombatResultMessage
    {
        return new RpgCombatResultMessage(wrapper.readString());
    }
}
