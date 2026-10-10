import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgSkillImpact, IRpgSkillOutcome} from '../../../incoming/rpg/skills/RpgSkillEventsMessage';
import {RpgSkillEventsMessage} from '../../../incoming/rpg/skills/RpgSkillEventsMessage';
import {readCount} from '../../readCount';

/** Reads RpgSkillEventsMessage in the order of the server's RpgSkillEventsMessageComposerSerializer. */
export class RpgSkillEventsMessageParser implements IIncomingParser<RpgSkillEventsMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgSkillEventsMessage
    {
        const impacts: IRpgSkillImpact[] = [];
        const outcomes: IRpgSkillOutcome[] = [];

        for(let i = readCount(wrapper); i > 0; i--)
        {
            impacts.push({casterObjectId: wrapper.readInt(), skillId: wrapper.readString(), targetObjectId: wrapper.readInt(), x: wrapper.readInt(), y: wrapper.readInt()});
        }

        for(let i = readCount(wrapper); i > 0; i--)
        {
            outcomes.push({
                sourceObjectId: wrapper.readInt(),
                sourceId: wrapper.readString(),
                targetObjectId: wrapper.readInt(),
                amount: wrapper.readInt(),
                absorbed: wrapper.readInt(),
                outcome: wrapper.readString(),
                health: wrapper.readInt(),
                maxHealth: wrapper.readInt(),
                killed: wrapper.readBoolean()
            });
        }

        return new RpgSkillEventsMessage(impacts, outcomes);
    }
}
