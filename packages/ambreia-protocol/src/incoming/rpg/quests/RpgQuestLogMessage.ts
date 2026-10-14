import type {IRpgQuestLogEntry} from './IRpgQuestLogEntry';

/** The whole quest log: after sign-in and after every change (M2a §3.2). */
export class RpgQuestLogMessage
{
    constructor(
        readonly quests: readonly IRpgQuestLogEntry[]
    ) {}
}
