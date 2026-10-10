import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgCombatHit} from '../../../incoming/rpg/combat/RpgCombatEventsMessage';
import {RpgCombatEventsMessage} from '../../../incoming/rpg/combat/RpgCombatEventsMessage';
import {readCount} from '../../readCount';

/** Reads RpgCombatEventsMessage in the order of the server's RpgCombatEventsMessageComposerSerializer. */
export class RpgCombatEventsMessageParser implements IIncomingParser<RpgCombatEventsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgCombatEventsMessage
    {
        const count = readCount(wrapper);
        const hits: IRpgCombatHit[] = [];

        for(let i = 0; i < count; i++)
        {
            hits.push({
                attackerId: wrapper.readInt(),
                targetId: wrapper.readInt(),
                amount: wrapper.readInt(),
                outcome: wrapper.readString(),
                health: wrapper.readInt(),
                maxHealth: wrapper.readInt(),
                killed: wrapper.readBoolean()
            });
        }

        return new RpgCombatEventsMessage(hits);
    }
}
