import {EventEmitter} from 'eventemitter3';
import {platform} from '@ambreia/common/platform/Platform';
import type {IRpgCombatHit} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import type {IRpgSkillOutcome} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillEventsMessage';
import type {IRpgTargetEntry} from '@ambreia/protocol/incoming/rpg/combat/RpgTargetsMessage';
import type {ICastEntry, ICombatModel, ICombatModelEvents, ILevelUp, ILogEntry, ISelf, IStatusEntry, ITargetInfo, IThreat, IVitals, LogKind} from './ICombat';
import {CastBook} from './model/CastBook';
import {CombatLog, type IBlow} from './model/CombatLog';
import {CooldownBook} from './model/CooldownBook';
import {DeathMachine} from './model/DeathMachine';
import {StatusBook, type IStatusLine} from './model/StatusBook';
import {TargetBook} from './model/TargetBook';
import {VitalsBook} from './model/VitalsBook';

/**
 * The zone's fight as the client knows it (spec §3): the parts under `model/` each hold one thing;
 * this composes them, routes what the network sessions write, and announces to the views. One
 * writer per field: the sessions. `reset(epoch)` opens `resyncing` and the first self vitals of the
 * new epoch closes it: the entry burst restores state, it is not news (the log is muted meanwhile).
 */
export class CombatModel implements ICombatModel
{
    readonly events = new EventEmitter<ICombatModelEvents>();
    private readonly _vitals = new VitalsBook();
    private readonly _death = new DeathMachine();
    private readonly _targets = new TargetBook();
    private readonly _statuses = new StatusBook();
    private readonly _casts = new CastBook();
    private readonly _cooldowns = new CooldownBook();
    private readonly _log = new CombatLog(() => this._own);
    private _own = 0;
    private _resyncing = false;
    private _inCombat = false;
    private _autoAttacking = false;

    get resyncing(): boolean
    {
        return this._resyncing;
    }

    get self(): ISelf
    {
        return {inCombat: this._inCombat, autoAttacking: this._autoAttacking, death: this._death.state};
    }

    get target(): ITargetInfo | null
    {
        return this._targets.target;
    }

    get threat(): IThreat | null
    {
        return this._targets.threat;
    }

    get ownObjectId(): number
    {
        return this._own;
    }

    get globalReadyAt(): number
    {
        return this._cooldowns.globalReadyAt;
    }

    get log(): readonly ILogEntry[]
    {
        return this._log.lines;
    }

    vitalsOf(objectId: number): IVitals | null
    {
        return this._vitals.of(objectId);
    }

    targetOf(objectId: number): number
    {
        return this._targets.targetOf(objectId);
    }

    statusesOf(objectId: number): readonly IStatusEntry[]
    {
        return this._statuses.of(objectId);
    }

    castOf(objectId: number): ICastEntry | null
    {
        return this._casts.of(objectId);
    }

    readyAt(skillId: string): number
    {
        return this._cooldowns.readyAt(skillId);
    }

    // --- the writing side: the network sessions ---

    /** A new zone, or a reconnect: everything of the previous one goes; the burst rebuilds it. */
    reset(_epoch: number): void
    {
        this._resyncing = true;
        this._log.muted = true;
        this._vitals.clear();
        this._targets.clear();
        this._statuses.clear();
        this._casts.clear();
        this._cooldowns.clear();
        this._log.clear();
        this._death.reset();
        this._inCombat = false;
        this._autoAttacking = false;
        this.events.emit('self', this.self);
    }

    setOwn(objectId: number): void
    {
        this._own = objectId;
    }

    setVitals(objectId: number, health: number, maxHealth: number): void
    {
        this.events.emit('vitals', objectId, this._vitals.setHealth(objectId, health, maxHealth));
        if(objectId === this._own && health > 0) this.standUp();
    }

    /** The burst's last message (spec §2.3): closes `resyncing`. */
    setSelfVitals(health: number, maxHealth: number, mana: number, maxMana: number, inCombat: boolean): void
    {
        this.events.emit('vitals', this._own, this._vitals.setOwn(this._own, health, maxHealth, mana, maxMana));
        if(health > 0) this.standUp();

        if(this._inCombat !== inCombat)
        {
            this._inCombat = inCombat;
            this.events.emit('self', this.self);
        }

        if(this._resyncing)
        {
            this._resyncing = false;
            this._log.muted = false;
            this.events.emit('resynced');
        }
    }

    setTarget(info: ITargetInfo | null): void
    {
        this._targets.setTarget(info);
        this.events.emit('target', info);
        this.events.emit('threat', null);
    }

    setTargets(entries: readonly IRpgTargetEntry[]): void
    {
        this._targets.setTargets(entries);
        this.events.emit('targets');
    }

    setThreat(monsterObjectId: number, percent: number, hasAggro: boolean): void
    {
        if(this._targets.setThreat(monsterObjectId, percent, hasAggro)) this.events.emit('threat', this._targets.threat);
    }

    /** The full list of a combatant (9023): what appears, stacks or goes is logged. */
    setStatuses(objectId: number, lines: readonly IStatusLine[]): void
    {
        const now = platform().now();
        const diff = this._statuses.set(objectId, lines, now);

        for(const statusId of diff.applied) this.logLine('status', 'vortex.combat.log.status.applied', {status: statusId, target: String(objectId)}, now);
        for(const stacked of diff.stacked) this.logLine('status', 'vortex.combat.log.status.stacked', {status: stacked.statusId, stacks: String(stacked.stacks)}, now);
        for(const statusId of diff.expired) this.logLine('status', 'vortex.combat.log.status.expired', {status: statusId, target: String(objectId)}, now);

        this.events.emit('statuses', objectId, this._statuses.of(objectId));
    }

    setCast(objectId: number, cast: {skillId: string; durationMs: number; channel: boolean; targetObjectId: number}): void
    {
        this.events.emit('cast', objectId, this._casts.start(objectId, cast, platform().now()));
    }

    endCast(objectId: number, reason: string, skillId: string): void
    {
        this._casts.end(objectId);
        if(objectId === this._own && (reason === 'interrupted' || reason === 'failed')) this.logLine('cast', `vortex.combat.log.cast.${reason}`, {skill: skillId}, platform().now());
        this.events.emit('cast', objectId, null);
    }

    setCooldowns(globalRemainingMs: number, skills: readonly {skillId: string; remainingMs: number}[]): void
    {
        this._cooldowns.set(globalRemainingMs, skills, platform().now());
        this.events.emit('cooldowns', this._cooldowns.globalReadyAt, this._cooldowns.all);
    }

    setAutoAttacking(active: boolean): void
    {
        if(this._autoAttacking === active) return;

        this._autoAttacking = active;
        this.events.emit('self', this.self);
    }

    /** KO (RpgDeath): the attack stops with it. */
    setKo(respawnSeconds: number): void
    {
        const now = platform().now();

        this._death.ko(respawnSeconds, now);
        this._autoAttacking = false;
        this.events.emit('self', this.self);
        this.logLine('death', 'vortex.combat.log.death.self', {}, now);
    }

    setOffer(casterObjectId: number, healthPercent: number, expiresMs: number): void
    {
        if(this._death.state.kind !== 'ko') return;

        const now = platform().now();

        this._death.offer({casterObjectId, healthPercent, expiresMs}, now);
        this.events.emit('self', this.self);
        this.logLine('resurrect', 'vortex.combat.log.resurrect.offered', {caster: String(casterObjectId)}, now);
    }

    declineOffer(): void
    {
        if(this._death.state.kind !== 'ko') return;

        this._death.decline();
        this.events.emit('self', this.self);
    }

    setWaiting(): void
    {
        if(this._death.state.kind !== 'ko') return;

        this._death.wait();
        this.events.emit('self', this.self);
    }

    reportHits(hits: readonly IRpgCombatHit[]): void
    {
        for(const hit of hits)
        {
            this.setVitals(hit.targetId, hit.health, hit.maxHealth);
            this.blow({source: hit.attackerId, target: hit.targetId, amount: hit.amount, absorbed: 0, outcome: hit.outcome, killed: hit.killed, sourceId: null});
        }
    }

    reportOutcomes(outcomes: readonly IRpgSkillOutcome[]): void
    {
        for(const outcome of outcomes)
        {
            this.setVitals(outcome.targetObjectId, outcome.health, outcome.maxHealth);
            this.blow({source: outcome.sourceObjectId, target: outcome.targetObjectId, amount: outcome.amount, absorbed: outcome.absorbed, outcome: outcome.outcome, killed: outcome.killed, sourceId: outcome.sourceId});
        }
    }

    levelUp(up: ILevelUp): void
    {
        this.logLine('levelup', 'vortex.combat.log.levelup', {level: String(up.toLevel)}, platform().now());
        this.events.emit('levelUp', up);
    }

    /** A refusal (RpgCombatResult, RpgSkillResult): one log line, under the skill's key when there is one. */
    refused(code: string, skillId: string | null = null): void
    {
        this.logLine('refused', skillId === null ? `vortex.combat.error.${code}` : `vortex.skill.error.${code}`, skillId === null ? {} : {skill: skillId}, platform().now());
    }

    private standUp(): void
    {
        if(!this._death.standUp()) return;

        this.events.emit('self', this.self);
        this.logLine('resurrect', 'vortex.combat.log.resurrect.up', {}, platform().now());
    }

    private blow(blow: IBlow): void
    {
        for(const entry of this._log.blow(blow, platform().now())) this.events.emit('log', entry);
    }

    private logLine(kind: LogKind, key: string, params: Record<string, string>, now: number): void
    {
        const entry = this._log.push(kind, key, params, now);

        if(entry) this.events.emit('log', entry);
    }

    dispose(): void
    {
        this.events.removeAllListeners();
    }
}
