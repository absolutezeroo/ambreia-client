import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgCombatantVitals} from '../../../incoming/rpg/combat/RpgVitalsMessage';
import {RpgVitalsMessage} from '../../../incoming/rpg/combat/RpgVitalsMessage';
import {readCount} from '../../readCount';

/** Reads RpgVitalsMessage in the order of the server's RpgVitalsMessageComposerSerializer. */
export class RpgVitalsMessageParser implements IIncomingParser<RpgVitalsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgVitalsMessage
    {
        const count = readCount(wrapper);
        const combatants: IRpgCombatantVitals[] = [];

        for(let i = 0; i < count; i++) combatants.push({objectId: wrapper.readInt(), health: wrapper.readInt(), maxHealth: wrapper.readInt()});

        return new RpgVitalsMessage(combatants);
    }
}
