import type {IRpgTargetEntry} from '@ambreia/protocol/incoming/rpg/combat/RpgTargetsMessage';
import type {ITargetInfo} from '../ITargetInfo';
import type {IThreat} from '../IThreat';

/** The player's target (RpgTarget), who aims at whom (RpgTargets) and the threat on the target (RpgThreat). */
export class TargetBook
{
    private _target: ITargetInfo | null = null;
    private _threat: IThreat | null = null;
    private readonly _aims = new Map<number, number>();

    get target(): ITargetInfo | null
    {
        return this._target;
    }

    get threat(): IThreat | null
    {
        return this._threat;
    }

    /** The object this one aims at; 0 for none. */
    targetOf(objectId: number): number
    {
        return this._aims.get(objectId) ?? 0;
    }

    /** A new target drops the threat of the old one. */
    setTarget(info: ITargetInfo | null): void
    {
        this._target = info;
        this._threat = null;
    }

    setTargets(entries: readonly IRpgTargetEntry[]): void
    {
        for(const entry of entries)
        {
            if(entry.targetObjectId === 0) this._aims.delete(entry.objectId);
            else this._aims.set(entry.objectId, entry.targetObjectId);
        }
    }

    /** False and ignored unless it is about the current target: a tick can outrun a target change. */
    setThreat(monsterObjectId: number, percent: number, hasAggro: boolean): boolean
    {
        if(this._target?.objectId !== monsterObjectId) return false;

        this._threat = {percent, hasAggro};

        return true;
    }

    /** A unit gone: no aim from or at it; true when it was the target, which goes too. */
    forget(objectId: number): boolean
    {
        this._aims.delete(objectId);

        for(const [aimer, aimed] of this._aims) if(aimed === objectId) this._aims.delete(aimer);

        if(this._target?.objectId !== objectId) return false;

        this.setTarget(null);

        return true;
    }

    clear(): void
    {
        this._target = null;
        this._threat = null;
        this._aims.clear();
    }
}
