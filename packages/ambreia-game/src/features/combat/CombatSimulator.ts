import {RpgCombatEventsMessage} from '@ambreia/protocol/incoming/rpg/combat/RpgCombatEventsMessage';
import type {RpgCombatSession} from './RpgCombatSession';

/**
 * Dev hook `__ambreia.combat.simulate(objectId)`: three blows of the player on an avatar as the
 * server would send them (the player's class's basicAttack visuals included); `simulate(objectId,
 * 'cast', skillId)` loops that skill's cast visual on the object for two seconds; `simulate(objectId,
 * 'skill', skillId)` lands that skill on it.
 */
export class CombatSimulator
{
    constructor(private readonly _session: RpgCombatSession, private readonly _self: () => number, private readonly _later: (run: () => void, delayMs: number) => void) {}

    simulate(objectId: number, what = 'blows', skillId = 'skill.mage.flame_burst'): void
    {
        const session = this._session;
        const self = this._self();

        if(what === 'cast')
        {
            session.model.setCast(objectId, {durationMs: 2000, channel: false, skillId, targetObjectId: 0});
            this._later(() => session.model.endCast(objectId, 'done', skillId), 2000);

            return;
        }

        if(what === 'skill')
        {
            const outcomes = [{sourceObjectId: self, sourceId: skillId, targetObjectId: objectId, amount: 9, absorbed: 0, outcome: 'hit', health: 20, maxHealth: 40, killed: false}];

            session.model.reportOutcomes(outcomes);
            session.report(outcomes, [{casterObjectId: self, skillId, targetObjectId: objectId, x: 0, y: 0}]);

            return;
        }

        ['hit', 'crit', 'miss'].forEach((outcome, i) => this._later(() =>
        {
            const blows = new RpgCombatEventsMessage([{attackerId: self, targetId: objectId, amount: 7 * (i + 1), outcome, health: 28 - 7 * i, maxHealth: 40, killed: false}]);

            session.model.reportHits(blows.hits);
            session.events.emit('hits', blows);
        }, i * 700));
    }
}
