import type {ILogEntry, LogKind} from '../ICombat';

/** The combat log keeps this many lines; older ones go for good. */
const LOG_LINES = 200;

/** Outcomes that touched nothing. */
const MISSED = new Set(['miss', 'dodge', 'immune']);

/** A blow or a skill outcome, as 9012 and 9024 describe it, source first. */
export interface IBlow
{
    readonly source: number;
    readonly target: number;
    readonly amount: number;
    readonly absorbed: number;
    readonly outcome: string;
    readonly killed: boolean;
    /** The skill or status behind it; null for an auto-attack. */
    readonly sourceId: string | null;
}

/**
 * The bounded, typed combat log (spec §4): text keys and their parameters, resolved by whoever
 * shows them. `muted` while the entry burst restores state: a snapshot is not news. Dealt or taken
 * is decided against the player's own object id, read when the line is written.
 */
export class CombatLog
{
    private readonly _lines: ILogEntry[] = [];
    muted = false;

    constructor(private readonly _own: () => number) {}

    get lines(): readonly ILogEntry[]
    {
        return this._lines;
    }

    /** Returns the entry written, or null when muted. */
    push(kind: LogKind, key: string, params: Record<string, string>, now: number): ILogEntry | null
    {
        if(this.muted) return null;

        const entry: ILogEntry = {at: now, kind, key, params};

        this._lines.push(entry);
        if(this._lines.length > LOG_LINES) this._lines.shift();

        return entry;
    }

    /** A blow: dealt by the player, taken by him, a miss, a heal; a kill of someone else is a death line. */
    blow(blow: IBlow, now: number): ILogEntry[]
    {
        const own = this._own();
        const params = {amount: String(blow.amount), absorbed: String(blow.absorbed), source: String(blow.source), target: String(blow.target), skill: blow.sourceId ?? ''};
        const written: ILogEntry[] = [];
        const add = (entry: ILogEntry | null): void =>
        {
            if(entry) written.push(entry);
        };

        if(blow.outcome === 'heal') add(this.push('heal', 'vortex.combat.log.heal', params, now));
        else if(MISSED.has(blow.outcome)) add(this.push('miss', `vortex.combat.log.${blow.outcome}`, params, now));
        else if(blow.source === own) add(this.push('dealt', `vortex.combat.log.dealt.${blow.outcome}`, params, now));
        else if(blow.target === own) add(this.push('taken', `vortex.combat.log.taken.${blow.outcome}`, params, now));

        if(blow.killed && blow.target !== own) add(this.push('death', 'vortex.combat.log.death.other', {target: String(blow.target)}, now));

        return written;
    }

    clear(): void
    {
        this._lines.length = 0;
    }
}
