import type {IStatusEntry} from '../ICombat';

/** One status as RpgStatuses lists it. */
export interface IStatusLine
{
    readonly statusId: string;
    /** -1 for a status without end. */
    readonly remainingMs: number;
    readonly stacks: number;
}

/** What changed between two full lists of a combatant: the only signals 9023 gives (spec §4). */
export interface IStatusDiff
{
    readonly applied: string[];
    readonly stacked: {statusId: string; stacks: number}[];
    readonly expired: string[];
}

/** The statuses of every combatant, each with a deadline on the clock handed in. */
export class StatusBook
{
    private readonly _byObject = new Map<number, IStatusEntry[]>();

    of(objectId: number): readonly IStatusEntry[]
    {
        return this._byObject.get(objectId) ?? [];
    }

    /** The full list of one combatant replaces what was known; returns the diff. */
    set(objectId: number, lines: readonly IStatusLine[], now: number): IStatusDiff
    {
        const before = this._byObject.get(objectId) ?? [];
        const after: IStatusEntry[] = lines.map(line => ({statusId: line.statusId, endsAt: line.remainingMs < 0 ? null : now + line.remainingMs, stacks: line.stacks}));
        const diff: IStatusDiff = {applied: [], stacked: [], expired: []};

        for(const entry of after)
        {
            const old = before.find(status => status.statusId === entry.statusId);

            if(!old) diff.applied.push(entry.statusId);
            else if(old.stacks < entry.stacks) diff.stacked.push({statusId: entry.statusId, stacks: entry.stacks});
        }

        for(const old of before)
        {
            if(!after.some(status => status.statusId === old.statusId)) diff.expired.push(old.statusId);
        }

        if(after.length === 0) this._byObject.delete(objectId);
        else this._byObject.set(objectId, after);

        return diff;
    }

    clear(): void
    {
        this._byObject.clear();
    }
}
