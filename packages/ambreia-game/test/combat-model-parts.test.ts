// The parts of the combat model (spec §3), each on its own: a death machine, the statuses with
// their deadlines and their diff, the cooldowns, the bounded log. No clock inside them: `now` is
// handed in, so a test never waits.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DeathMachine} from '../src/features/combat/model/DeathMachine';
import {StatusBook} from '../src/features/combat/model/StatusBook';
import {CooldownBook} from '../src/features/combat/model/CooldownBook';
import {CombatLog} from '../src/features/combat/model/CombatLog';
import {TargetBook} from '../src/features/combat/model/TargetBook';

test('DeathMachine: alive, ko with its auto-release, wait, offer, decline, stand up', () =>
{
    const death = new DeathMachine();

    assert.deepEqual(death.state, {kind: 'alive'});
    death.ko(60, 1000);
    assert.deepEqual(death.state, {kind: 'ko', autoReleaseAt: 61000, waiting: false, offer: null});
    death.wait();
    assert.deepEqual(death.state, {kind: 'ko', autoReleaseAt: null, waiting: true, offer: null});
    death.offer({casterObjectId: 2, healthPercent: 35, expiresMs: 30000}, 1000);
    assert.deepEqual(death.state.kind === 'ko' ? death.state.offer : null, {casterObjectId: 2, healthPercent: 35, expiresAt: 31000});
    death.decline();
    assert.equal(death.state.kind === 'ko' ? death.state.offer : 'x', null);
    assert.equal(death.standUp(), true, 'a stand-up from ko is a change');
    assert.equal(death.standUp(), false, 'alive stays alive');
    assert.deepEqual(death.state, {kind: 'alive'});
});

test('DeathMachine: ko with 0 seconds is a wait already chosen, and an offer needs a ko', () =>
{
    const death = new DeathMachine();

    death.offer({casterObjectId: 2, healthPercent: 35, expiresMs: 30000}, 1000);
    assert.deepEqual(death.state, {kind: 'alive'});
    death.ko(0, 1000);
    assert.deepEqual(death.state, {kind: 'ko', autoReleaseAt: null, waiting: true, offer: null});
});

test('StatusBook: deadlines from remainingMs, and the diff between two full lists', () =>
{
    const book = new StatusBook();

    let diff = book.set(9, [{statusId: 'a', remainingMs: 4000, stacks: 1}, {statusId: 'b', remainingMs: -1, stacks: 1}], 1000);

    assert.deepEqual(book.of(9), [{statusId: 'a', endsAt: 5000, stacks: 1}, {statusId: 'b', endsAt: null, stacks: 1}]);
    assert.deepEqual(diff, {applied: ['a', 'b'], stacked: [], expired: []});

    diff = book.set(9, [{statusId: 'b', remainingMs: -1, stacks: 3}], 2000);
    assert.deepEqual(diff, {applied: [], stacked: [{statusId: 'b', stacks: 3}], expired: ['a']});

    diff = book.set(9, [], 3000);
    assert.deepEqual(diff, {applied: [], stacked: [], expired: ['b']});
    assert.deepEqual(book.of(9), []);
    assert.deepEqual(book.of(4), []);
});

test('CooldownBook: a complete list, a skill missing from it is ready', () =>
{
    const book = new CooldownBook();

    book.set(500, [{skillId: 'a', remainingMs: 2000}], 1000);
    assert.equal(book.readyAt('a'), 3000);
    assert.equal(book.readyAt('b'), 0);
    assert.equal(book.globalReadyAt, 1500);
    book.set(0, [], 4000);
    assert.equal(book.readyAt('a'), 0);
});

test('TargetBook: the target, who aims at whom, and a threat only for the current target', () =>
{
    const book = new TargetBook();
    const wolf = {objectId: 9, kind: 'monster', name: 'w', level: 1, classId: '', rank: 'normal'};

    book.setTargets([{objectId: 9, targetObjectId: 1}, {objectId: 3, targetObjectId: 9}]);
    assert.equal(book.targetOf(9), 1);
    book.setTargets([{objectId: 9, targetObjectId: 0}]);
    assert.equal(book.targetOf(9), 0);

    book.setTarget(wolf);
    assert.equal(book.setThreat(4, 50, false), false, 'another monster');
    assert.equal(book.setThreat(9, 50, false), true);
    assert.deepEqual(book.threat, {percent: 50, hasAggro: false});
    book.setTarget(null);
    assert.equal(book.threat, null);
});

test('CombatLog: a blow is dealt, taken or a miss by who gave it; bounded at 200; muted while resyncing', () =>
{
    const log = new CombatLog(() => 1);

    log.blow({source: 1, target: 9, amount: 12, absorbed: 0, outcome: 'crit', killed: false, sourceId: null}, 1000);
    log.blow({source: 9, target: 1, amount: 0, absorbed: 0, outcome: 'miss', killed: false, sourceId: null}, 1000);
    log.blow({source: 9, target: 1, amount: 5, absorbed: 0, outcome: 'hit', killed: false, sourceId: null}, 1000);
    log.blow({source: 2, target: 1, amount: 15, absorbed: 0, outcome: 'heal', killed: false, sourceId: 'skill.cleric.heal'}, 1000);
    log.blow({source: 1, target: 9, amount: 30, absorbed: 0, outcome: 'hit', killed: true, sourceId: null}, 1000);

    assert.deepEqual(log.lines.map(line => line.kind), ['dealt', 'miss', 'taken', 'heal', 'dealt', 'death']);
    assert.equal(log.lines[0].key, 'vortex.combat.log.dealt.crit');

    log.muted = true;
    log.push('refused', 'vortex.combat.error.cooldown', {}, 1000);
    assert.equal(log.lines.length, 6, 'nothing while resyncing');
    log.muted = false;
    for(let i = 0; i < 250; i++) log.push('refused', 'vortex.combat.error.cooldown', {}, 1000);
    assert.equal(log.lines.length, 200);
});
