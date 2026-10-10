import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgCombatantStatuses, IRpgStatus} from '../../../incoming/rpg/skills/RpgStatusesMessage';
import {RpgStatusesMessage} from '../../../incoming/rpg/skills/RpgStatusesMessage';
import {readCount} from '../../readCount';

/** Reads RpgStatusesMessage in the order of the server's RpgStatusesMessageComposerSerializer. */
export class RpgStatusesMessageParser implements IIncomingParser<RpgStatusesMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgStatusesMessage
    {
        const combatants: IRpgCombatantStatuses[] = [];

        for(let i = readCount(wrapper); i > 0; i--)
        {
            const objectId = wrapper.readInt();
            const statuses: IRpgStatus[] = [];

            for(let k = readCount(wrapper); k > 0; k--) statuses.push({statusId: wrapper.readString(), remainingMs: wrapper.readInt(), stacks: wrapper.readInt()});
            combatants.push({objectId, statuses});
        }

        return new RpgStatusesMessage(combatants);
    }
}
