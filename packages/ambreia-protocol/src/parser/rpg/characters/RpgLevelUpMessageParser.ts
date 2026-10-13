import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IIncomingParser} from '@ambreia/net/style/MessageMap';
import {RpgLevelUpMessage} from '../../../incoming/rpg/characters/RpgLevelUpMessage';
import {readCount} from '../../readCount';
import {readRpgStatBlock} from './RpgStatBlockReader';

/** Reads RpgLevelUpMessage in the order of the server's RpgLevelUpMessageComposerSerializer. */
export class RpgLevelUpMessageParser implements IIncomingParser<RpgLevelUpMessage>
{
    parse(wrapper: IMessageDataWrapper): RpgLevelUpMessage
    {
        const fromLevel = wrapper.readInt();
        const toLevel = wrapper.readInt();
        const statsBefore = readRpgStatBlock(wrapper);
        const statsAfter = readRpgStatBlock(wrapper);
        const count = readCount(wrapper, 2);
        const skillsLearned: string[] = [];

        for(let i = 0; i < count; i++) skillsLearned.push(wrapper.readString());

        return new RpgLevelUpMessage(fromLevel, toLevel, statsBefore, statsAfter, skillsLearned);
    }
}
