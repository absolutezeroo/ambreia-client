import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import type {IRpgQuestLogEntry} from '../../../incoming/rpg/quests/IRpgQuestLogEntry';
import type {IRpgQuestObjectiveLine} from '../../../incoming/rpg/quests/IRpgQuestObjectiveLine';
import {RpgQuestLogMessage} from '../../../incoming/rpg/quests/RpgQuestLogMessage';
import {readCount} from '../../readCount';

/** Reads RpgQuestLogMessage in the order of the server's RpgQuestLogMessageComposerSerializer. */
export class RpgQuestLogMessageParser implements IIncomingParser<RpgQuestLogMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgQuestLogMessage
    {
        const count = readCount(wrapper, 8);
        const quests: IRpgQuestLogEntry[] = [];

        for(let i = 0; i < count; i++)
        {
            const questId = wrapper.readString();
            const state = wrapper.readString();
            const lines = readCount(wrapper, 10);
            const objectives: IRpgQuestObjectiveLine[] = [];

            for(let j = 0; j < lines; j++) objectives.push({kind: wrapper.readString(), current: wrapper.readInt(), required: wrapper.readInt()});

            quests.push({questId, state, objectives});
        }

        return new RpgQuestLogMessage(quests);
    }
}
