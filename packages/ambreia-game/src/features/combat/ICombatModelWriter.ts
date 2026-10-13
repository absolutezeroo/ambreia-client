import type {IRpgCombatHit} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import type {IRpgTargetEntry} from '@ambreia/protocol/incoming/rpg/combat/RpgTargetsMessage';
import type {IRpgSkillOutcome} from '@ambreia/protocol/incoming/rpg/skills/RpgSkillEventsMessage';
import type {ICombatModel} from './ICombatModel';
import type {ILevelUp} from './ILevelUp';
import type {IStatusLine} from './model/IStatusLine';
import type {ITargetInfo} from './ITargetInfo';

/**
 * The writing side of the combat model (spec §3.2): what the network sessions call, one writer
 * per field. The interaction session writes the target and the aims, the skills session the
 * statuses, casts, cooldowns and skill outcomes, the combat session everything else.
 */
export interface ICombatModelWriter extends ICombatModel
{
    reset(epoch: number): void;
    setOwn(objectId: number): void;
    setVitals(objectId: number, health: number, maxHealth: number): void;
    setSelfVitals(health: number, maxHealth: number, mana: number, maxMana: number, inCombat: boolean): void;
    setTarget(info: ITargetInfo | null): void;
    setTargets(entries: readonly IRpgTargetEntry[]): void;
    setThreat(monsterObjectId: number, percent: number, hasAggro: boolean): void;
    setStatuses(objectId: number, lines: readonly IStatusLine[]): void;
    setCast(objectId: number, cast: {skillId: string; durationMs: number; channel: boolean; targetObjectId: number}): void;
    endCast(objectId: number, reason: string, skillId: string): void;
    setCooldowns(globalRemainingMs: number, skills: readonly {skillId: string; remainingMs: number}[]): void;
    setAutoAttacking(active: boolean): void;
    setKo(respawnSeconds: number): void;
    setOffer(casterObjectId: number, healthPercent: number, expiresMs: number): void;
    declineOffer(): void;
    setWaiting(): void;
    reportHits(hits: readonly IRpgCombatHit[]): void;
    reportOutcomes(outcomes: readonly IRpgSkillOutcome[]): void;
    levelUp(up: ILevelUp): void;
    refused(code: string, skillId?: string | null): void;
}
