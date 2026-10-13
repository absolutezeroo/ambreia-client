import type {IRpgCombatHit} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import type {IRpgSkillImpact, IRpgSkillOutcome} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillEventsMessage';
import type {ICastEntry} from '../ICastEntry';
import type {IVfxPhase, IVfxSet} from '../IVfx';
import type {IChoreographyDeps} from './IChoreographyDeps';

/** Outcomes that touched nothing: no hit visual. */
const MISSED = new Set(['miss', 'dodge', 'immune']);

/**
 * How a blow, a skill and a cast play out on the room (the content's IVfxSet): a cast loops its
 * `cast` on the caster; a blow or a skill plays `release` on the caster, flies its `projectile`,
 * then `area` where it landed and `hit` on each one it touched, the numbers rising with the hit.
 */
export class CombatChoreography
{
    /** A flight's wait, by skill, from its impacts to the outcomes of the same report (they follow at once). */
    private readonly _flights = new Map<string, number>();
    /** What stops each caster's `cast` loop. */
    private readonly _incantations = new Map<number, () => void>();

    constructor(private readonly _deps: IChoreographyDeps) {}

    /** The blows (RpgCombatEvents): the class's basic attack, the numbers; a dead monster leaves. */
    hits(hits: readonly IRpgCombatHit[]): void
    {
        const deps = this._deps;

        for(const hit of hits)
        {
            const set = deps.basicAttackSet(deps.classOf(hit.attackerId));
            const missed = hit.outcome === 'miss';

            deps.gesture(hit.attackerId, 'atk');

            const wait = this.fire(set, hit.attackerId, hit.targetId, () =>
            {
                if(missed) return 0;

                const delay = this.play(set?.hit ?? null, hit.targetId);

                if(!hit.killed) deps.gesture(hit.targetId, 'hit');

                return delay;
            });

            deps.marks()?.hit(hit.targetId, hit.amount, hit.outcome, 0, wait);
            if(hit.killed) this.killed(hit.targetId);
        }
    }

    /** Where skills landed (M1b): their `release`, `projectile` and `area`. */
    impacts(impacts: readonly IRpgSkillImpact[]): void
    {
        for(const impact of impacts)
        {
            const set = this._deps.skillSet(impact.skillId);

            if(!set) continue;

            const cell = {x: impact.x, y: impact.y};
            const wait = this.fire(set, impact.casterObjectId, impact.targetObjectId, () => this.play(set.area, impact.targetObjectId, cell));

            this._flights.set(impact.skillId, Math.max(0, wait - (set.area?.delayMs ?? 0)));
        }
    }

    /** What skills and statuses did (M1b): their `hit` and numbers, after the flight of their impact. */
    outcomes(outcomes: readonly IRpgSkillOutcome[]): void
    {
        const deps = this._deps;

        for(const outcome of outcomes)
        {
            const flight = this._flights.get(outcome.sourceId) ?? 0;
            const hit = MISSED.has(outcome.outcome) ? null : deps.skillSet(outcome.sourceId)?.hit ?? null;
            const delay = flight + (hit?.delayMs ?? 0);

            if(hit) deps.later(() => this.play({...hit, delayMs: 0}, outcome.targetObjectId), delay);
            deps.marks()?.hit(outcome.targetObjectId, outcome.amount, outcome.outcome, outcome.absorbed, delay);
            if(outcome.killed) this.killed(outcome.targetObjectId);
        }

        this._flights.clear();
    }

    /** A skill's `cast` loops on its caster from its RpgCastStart to its RpgCastEnd (null). */
    cast(objectId: number, cast: ICastEntry | null): void
    {
        const deps = this._deps;

        this._incantations.get(objectId)?.();
        this._incantations.delete(objectId);

        if(!cast)
        {
            deps.marks()?.endCast(objectId);

            return;
        }

        deps.marks()?.startCast(objectId, cast.durationMs, cast.channel);

        const phase = deps.skillSet(cast.skillId)?.cast ?? null;
        const sheet = phase ? deps.sheet(phase.sheet) : null;

        if(phase && sheet) this._incantations.set(objectId, deps.vfx.loop(sheet, objectId, phase.attach));
    }

    /** The zone was left: the canvas took the sprites with it, the loops' handles would only hold their closures. */
    clear(): void
    {
        this._incantations.clear();
        this._flights.clear();
    }

    /** A dead monster leaves the room (UserRemove); a dead player stays, as a ghost. */
    private killed(objectId: number): void
    {
        this._deps.forget(objectId);
        if(this._deps.isMonster(objectId)) this._deps.marks()?.remove(objectId);
    }

    /**
     * Plays a phase once on an avatar (or on a tile), `delayMs` after now; returns that delay so
     * what follows it (a number) waits the same. Nothing when the content names no phase, or art
     * the client does not ship.
     */
    private play(phase: IVfxPhase | null, objectId: number, cell: {x: number; y: number} | null = null): number
    {
        const sheet = phase ? this._deps.sheet(phase.sheet) : null;

        if(!phase || !sheet) return 0;

        const go = (): void =>
        {
            if(objectId > 0) this._deps.vfx.burst(sheet, objectId, phase.attach);
            else if(cell) this._deps.vfx.burstAt(sheet, cell.x, cell.y);
        };

        if(phase.delayMs > 0) this._deps.later(go, phase.delayMs);
        else go();

        return phase.delayMs;
    }

    /**
     * A set goes off from a caster: `release` on it, its `projectile` flying to the target; `land`
     * runs when it lands (at once without a projectile) and returns the delay of what lands.
     * Returns when the numbers may rise: the flight and that delay.
     */
    private fire(set: IVfxSet | null, casterId: number, targetId: number, land: () => number): number
    {
        this.play(set?.release ?? null, casterId);

        const sheet = set?.projectile ? this._deps.sheet(set.projectile.sheet) : null;
        const flight = set?.projectile && sheet ? this._deps.vfx.shoot(sheet, set.projectile.speed, casterId, targetId, () => land()) : 0;

        // Without a flight, the landing's own delay is the whole wait; with one, the content's
        // delays run from the landing, and the number follows them.
        return flight > 0 ? flight + (set?.hit?.delayMs ?? 0) : land();
    }
}
