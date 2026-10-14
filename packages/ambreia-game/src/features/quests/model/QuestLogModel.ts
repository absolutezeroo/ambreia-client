import {EventEmitter} from 'eventemitter3';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';

/** The player's quest log as the server last sent it (RpgQuestLog, M2a §3.2): the whole log each time. */
export class QuestLogModel
{
    readonly events = new EventEmitter<{changed: []}>();
    private _entries: readonly IRpgQuestLogEntry[] = [];

    get entries(): readonly IRpgQuestLogEntry[]
    {
        return this._entries;
    }

    set(entries: readonly IRpgQuestLogEntry[]): void
    {
        this._entries = entries;
        this.events.emit('changed');
    }

    /** Under way: active or ready to hand in. */
    active(): IRpgQuestLogEntry[]
    {
        return this._entries.filter(entry => entry.state !== 'done');
    }

    done(): IRpgQuestLogEntry[]
    {
        return this._entries.filter(entry => entry.state === 'done');
    }

    of(questId: string): IRpgQuestLogEntry | null
    {
        return this._entries.find(entry => entry.questId === questId) ?? null;
    }

    /** A zone left: the next entry pushes the log again. */
    clear(): void
    {
        this.set([]);
    }
}
