import type {ICastEntry} from '../ICombat';

/** The casts under way, by caster (RpgCastStart to RpgCastEnd). */
export class CastBook
{
    private readonly _byCaster = new Map<number, ICastEntry>();

    of(objectId: number): ICastEntry | null
    {
        return this._byCaster.get(objectId) ?? null;
    }

    start(objectId: number, cast: {skillId: string; durationMs: number; channel: boolean; targetObjectId: number}, now: number): ICastEntry
    {
        const entry: ICastEntry = {...cast, startedAt: now};

        this._byCaster.set(objectId, entry);

        return entry;
    }

    end(objectId: number): void
    {
        this._byCaster.delete(objectId);
    }

    clear(): void
    {
        this._byCaster.clear();
    }
}
