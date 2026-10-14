import type {IRpgQuestObjectiveLine} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestObjectiveLine';
import type {IQuestTexts} from './IQuestTexts';

/** A quest's name from the content texts, or its id made readable until they arrive. */
export function questTitle(texts: IQuestTexts, questId: string): string
{
    return texts.contentName(`${questId}.name`, questId);
}

export function questDescription(texts: IQuestTexts, questId: string): string
{
    return texts.textOr(`${questId}.description`, '');
}

/** `Loups des bois tués : 1/3`; without its text, the kind and the count. */
export function objectiveLine(texts: IQuestTexts, questId: string, index: number, line: IRpgQuestObjectiveLine): string
{
    const template = texts.textOr(`${questId}.objective.${index}`, '');

    return template.length > 0
        ? template.replace('%current%', String(line.current)).replace('%required%', String(line.required))
        : `${line.kind} ${line.current}/${line.required}`;
}
