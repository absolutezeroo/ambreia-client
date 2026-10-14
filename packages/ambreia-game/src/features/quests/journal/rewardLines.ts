import type {IQuestDefinition} from '../definitions/IQuestDefinition';
import type {IQuestTexts} from '../IQuestTexts';

/** A quest's rewards as lines: experience, then each item; a kind the client does not draw yet is left out. */
export function rewardLines(texts: IQuestTexts, definition: IQuestDefinition): {name: string; value: string}[]
{
    return definition.rewards.flatMap(reward =>
    {
        if(reward.kind === 'xp') return [{name: texts.text('vortex.quest.reward.xp'), value: String(reward.amount ?? 0)}];
        if(reward.kind === 'items') return (reward.items ?? []).map(line => ({name: texts.contentName(`${line.item}.name`, line.item), value: `×${line.quantity}`}));

        return [];
    });
}
