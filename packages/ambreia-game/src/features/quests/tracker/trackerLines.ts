import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IQuestLine} from '../../hud/IHud';
import type {IQuestTexts} from '../IQuestTexts';
import {objectiveIcon, QUEST_READY_ICON} from '../objectiveIcons';
import {objectiveLine, questTitle} from '../questTexts';

const MAX_TRACKED = 5;

/** The HUD tracker's lines (M2a §4.3): the quests under way, each at its first objective not met, or « à rendre ». */
export function trackerLines(entries: readonly IRpgQuestLogEntry[], texts: IQuestTexts): IQuestLine[]
{
    return entries
        .filter(entry => entry.state !== 'done')
        .slice(0, MAX_TRACKED)
        .map(entry =>
        {
            const title = questTitle(texts, entry.questId);
            const next = entry.objectives.findIndex(line => line.current < line.required);

            if(entry.state === 'ready' || next < 0) return {icon: QUEST_READY_ICON, title, objective: texts.text('vortex.quest.ready'), count: ''};

            const line = entry.objectives[next];

            return {icon: objectiveIcon(line.kind), title, objective: objectiveLine(texts, entry.questId, next, line), count: `${line.current} / ${line.required}`};
        });
}
