import type {RpgDialogueMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgDialogueMessage';
import type {RpgNpcsMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgNpcsMessage';
import type {RpgQuestLogMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgQuestLogMessage';
import type {RpgQuestResultMessage} from '@ambreia/protocol/incoming/rpg/quests/RpgQuestResultMessage';

/** What the quests session announces: one event per message the server sends (M2a §3.2). */
export interface IRpgQuestSessionEvents
{
    npcs: [RpgNpcsMessage];
    dialogue: [RpgDialogueMessage];
    dialogueClose: [];
    log: [RpgQuestLogMessage];
    result: [RpgQuestResultMessage];
}
