import type {RpgQuestResultMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgQuestResultMessage';
import type {IToast} from '../../hud/IToast';
import type {IQuestTexts} from '../IQuestTexts';
import {questTitle} from '../questTexts';

const TOAST_MS = 3000;

/** A quest action's answer as a toast (M2a §4.3): taken, handed in, dropped, or why not. */
export function resultToast(texts: IQuestTexts, result: RpgQuestResultMessage): IToast | null
{
    const text = result.questId.length > 0 ? questTitle(texts, result.questId) : '';

    if(result.code !== 'ok')
    {
        return {kind: 'error', title: texts.textOr(`vortex.quest.error.${result.code}`, texts.text('vortex.quest.error.failed')), text, ms: TOAST_MS};
    }

    switch(result.action)
    {
        case 'accepted': return {kind: 'success', title: texts.text('vortex.quest.result.accepted'), text, ms: TOAST_MS};
        case 'completed': return {kind: 'success', title: texts.text('vortex.quest.done.banner'), text, ms: TOAST_MS};
        case 'abandoned': return {kind: 'info', title: texts.text('vortex.quest.result.abandoned'), text, ms: TOAST_MS};
        default: return null;
    }
}
