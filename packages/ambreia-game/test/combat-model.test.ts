// The fight's state as the client keeps it (spec §3, docs/superpowers/specs/2026-10-13-m1-combat-vertical-slice-design.md):
// one writer per field, deadlines on the monotonic clock, a resync that restores without telling.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {CombatModel} from '../src/features/combat/CombatModel';

const now = 1000;

setPlatform({...BROWSER_PLATFORM, now: () => now});

const WOLF = {objectId: 9, kind: 'monster', name: 'monster.wolf', level: 2, classId: '', rank: 'normal'};

/** A model past its entry burst: the self vitals closed it. */
function fresh(): CombatModel
{
    const model = new CombatModel();

    model.reset(1);
    model.setOwn(1);
    model.setSelfVitals(100, 100, 50, 50, false);

    return model;
}

test('a status deadline is computed from remainingMs on the monotonic clock', () =>
{
    const model = fresh();

    model.setStatuses(1, [{statusId: 'status.focused', remainingMs: 4000, stacks: 1}, {statusId: 'status.shield', remainingMs: -1, stacks: 2}]);

    assert.deepEqual(model.statusesOf(1), [{statusId: 'status.focused', endsAt: 5000, stacks: 1}, {statusId: 'status.shield', endsAt: null, stacks: 2}]);
});

test('health has one writer: a stats maximum never lowers the current health', () =>
{
    const model = fresh();

    model.setVitals(1, 80, 120);

    assert.deepEqual(model.vitalsOf(1), {health: 80, maxHealth: 120, mana: 50, maxMana: 50});
});

test('the death machine: ko, wait, offer, decline, then the vitals stand the player up', () =>
{
    const model = fresh();
    const seen: string[] = [];

    model.events.on('self', self => seen.push(self.death.kind));

    model.setKo(60);
    assert.deepEqual(model.self.death, {kind: 'ko', autoReleaseAt: 61000, waiting: false, offer: null});
    model.setWaiting();
    assert.equal(model.self.death.kind === 'ko' ? model.self.death.autoReleaseAt : -1, null);
    model.setOffer(2, 35, 30000);
    assert.deepEqual(model.self.death.kind === 'ko' ? model.self.death.offer : null, {casterObjectId: 2, healthPercent: 35, expiresAt: 31000});
    model.declineOffer();
    assert.equal(model.self.death.kind === 'ko' ? model.self.death.offer : 'x', null);
    // The server answers an accept with the player's vitals: that is what stands him up.
    model.setVitals(1, 35, 100);
    assert.equal(model.self.death.kind, 'alive');
    assert.deepEqual(seen, ['ko', 'ko', 'ko', 'ko', 'alive']);
});

test('a burst that stands the player up closes ko quietly', () =>
{
    const model = fresh();

    model.setKo(60);

    const logged: string[] = [];

    model.events.on('log', entry => logged.push(entry.kind));
    model.reset(2);
    assert.equal(model.resyncing, true);
    model.setOwn(1);
    model.setVitals(1, 50, 100);
    model.setSelfVitals(50, 100, 10, 50, false);

    assert.equal(model.resyncing, false);
    assert.equal(model.self.death.kind, 'alive');
    assert.deepEqual(logged, []);
});

test('reset then the burst rebuilds the same model as live', () =>
{
    const live = fresh();

    live.setVitals(9, 40, 40);
    live.setStatuses(9, [{statusId: 'status.burn', remainingMs: 3000, stacks: 1}]);
    live.setTargets([{objectId: 9, targetObjectId: 1}]);
    live.setTarget(WOLF);
    live.setThreat(9, 100, true);
    live.setCooldowns(500, [{skillId: 'skill.mage.bolt', remainingMs: 2000}]);

    const resynced = new CombatModel();

    resynced.reset(5);
    resynced.setOwn(1);
    resynced.setVitals(9, 40, 40);
    resynced.setStatuses(9, [{statusId: 'status.burn', remainingMs: 3000, stacks: 1}]);
    resynced.setTargets([{objectId: 9, targetObjectId: 1}]);
    resynced.setTarget(WOLF);
    resynced.setThreat(9, 100, true);
    resynced.setCooldowns(500, [{skillId: 'skill.mage.bolt', remainingMs: 2000}]);
    resynced.setSelfVitals(100, 100, 50, 50, false);

    for(const id of [1, 9]) assert.deepEqual(resynced.vitalsOf(id), live.vitalsOf(id));
    assert.deepEqual(resynced.statusesOf(9), live.statusesOf(9));
    assert.equal(resynced.targetOf(9), live.targetOf(9));
    assert.deepEqual(resynced.target, live.target);
    assert.deepEqual(resynced.threat, live.threat);
    assert.equal(resynced.readyAt('skill.mage.bolt'), live.readyAt('skill.mage.bolt'));
    assert.equal(resynced.globalReadyAt, live.globalReadyAt);
});

test('threat of another monster is ignored, and a target change clears it', () =>
{
    const model = fresh();

    model.setTarget(WOLF);
    model.setThreat(4, 50, false);
    assert.equal(model.threat, null);
    model.setThreat(9, 50, false);
    assert.deepEqual(model.threat, {percent: 50, hasAggro: false});
    model.setTarget(null);
    assert.equal(model.threat, null);
});

test('the log derives dealt, taken, miss, heal and status expiry, bounded at 200', () =>
{
    const model = fresh();

    model.setStatuses(9, [{statusId: 'status.burn', remainingMs: 3000, stacks: 1}]);
    model.reportHits([{attackerId: 1, targetId: 9, amount: 12, outcome: 'crit', health: 28, maxHealth: 40, killed: false}]);
    model.reportHits([{attackerId: 9, targetId: 1, amount: 0, outcome: 'miss', health: 100, maxHealth: 100, killed: false}]);
    model.reportOutcomes([{sourceObjectId: 2, sourceId: 'skill.cleric.heal', targetObjectId: 1, amount: 15, absorbed: 0, outcome: 'heal', health: 100, maxHealth: 100, killed: false}]);
    model.setStatuses(9, []);

    assert.deepEqual(model.log.map(entry => entry.kind), ['status', 'dealt', 'miss', 'heal', 'status']);
    assert.equal(model.log[4].key, 'vortex.combat.log.status.expired');
    for(let i = 0; i < 250; i++) model.refused('cooldown');
    assert.equal(model.log.length, 200);
});

test('an empty status list expires everything', () =>
{
    const model = fresh();

    model.setStatuses(9, [{statusId: 'a', remainingMs: 1000, stacks: 1}, {statusId: 'b', remainingMs: -1, stacks: 1}]);
    model.setStatuses(9, []);

    assert.deepEqual(model.statusesOf(9), []);
    assert.equal(model.log.filter(entry => entry.kind === 'status' && entry.key.endsWith('expired')).length, 2);
});

test('auto-attack follows the server state only, and a reset drops it', () =>
{
    const model = fresh();

    model.setAutoAttacking(true);
    assert.equal(model.self.autoAttacking, true);
    model.reset(3);
    assert.equal(model.self.autoAttacking, false);
});

test('a level-up is one event with what rose', () =>
{
    const model = fresh();
    const stats = {strength: 10, intelligence: 12, agility: 5, maxHealth: 100, maxMana: 50, armor: 2, critBp: 500, dodgeBp: 300, speedPercent: 100, power: 20};
    let seen: {fromLevel: number; toLevel: number} | null = null;

    model.events.on('levelUp', up => seen = up);
    model.levelUp({fromLevel: 1, toLevel: 3, statsBefore: stats, statsAfter: {...stats, maxHealth: 130}, skillsLearned: ['skill.a']});

    assert.deepEqual(seen, {fromLevel: 1, toLevel: 3, statsBefore: stats, statsAfter: {...stats, maxHealth: 130}, skillsLearned: ['skill.a']});
    assert.equal(model.log.at(-1)?.kind, 'levelup');
});

test('the own vitals are kept before the own object id is known, then keyed once it is', () =>
{
    const model = new CombatModel();
    const seen: number[] = [];

    model.events.on('ownVitals', vitals => seen.push(vitals.health));
    model.reset(1);
    model.setSelfVitals(70, 100, 20, 50, false);
    assert.deepEqual(model.ownVitals, {health: 70, maxHealth: 100, mana: 20, maxMana: 50});
    assert.equal(model.vitalsOf(0), null, 'no object id yet: nothing keyed');

    model.setOwn(4);
    model.setVitals(4, 60, 100);
    assert.deepEqual(model.ownVitals, {health: 60, maxHealth: 100, mana: 20, maxMana: 50});
    assert.deepEqual(seen, [70, 60]);
});

test('a unit leaving the room is forgotten: its health, statuses, cast, aim, and the target when it was', () =>
{
    const model = fresh();
    const said: string[] = [];

    model.setTarget(WOLF);
    model.setVitals(9, 30, 60);
    model.setStatuses(9, [{statusId: 'status.slow', remainingMs: 4000, stacks: 1}]);
    model.setCast(9, {skillId: 'skill.wolf.howl', durationMs: 1500, channel: false, targetObjectId: 1});
    model.setTargets([{objectId: 9, targetObjectId: 1}]);
    model.events.on('target', info => said.push(`target ${info === null ? 'none' : info.objectId}`));
    model.events.on('cast', (objectId, cast) => said.push(`cast ${objectId} ${cast === null ? 'none' : cast.skillId}`));
    model.events.on('statuses', (objectId, statuses) => said.push(`statuses ${objectId} ${statuses.length}`));

    model.unitLeft(9);

    assert.equal(model.vitalsOf(9), null);
    assert.deepEqual(model.statusesOf(9), []);
    assert.equal(model.castOf(9), null);
    assert.equal(model.targetOf(9), 0);
    assert.equal(model.target, null);
    assert.deepEqual(said, ['statuses 9 0', 'cast 9 none', 'target none']);
});

test('a unit leaving that is not the target leaves the target alone', () =>
{
    const model = fresh();

    model.setTarget(WOLF);
    model.unitLeft(12);

    assert.equal(model.target?.objectId, 9);
});
