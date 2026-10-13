// The combat feature's units outside the model: the zone's timers, the choreography of a blow or a
// skill, the names the log and the frames show.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IScopedTimer} from '@ambreia/kernel/feature/FeatureScope';
import {CombatNames} from '../src/features/combat/CombatNames';
import {CombatChoreography} from '../src/features/combat/stage/CombatChoreography';
import type {IChoreographyDeps} from '../src/features/combat/stage/IChoreographyDeps';
import {ZoneTimers} from '../src/features/combat/stage/ZoneTimers';
import type {IVfxSet} from '../src/features/combat/IVfx';
import {UserDataType} from '../src/session/UserData';

/** Timers run by hand: `flush()` fires every one still active. */
function manualTimers(): {timeout: (run: () => void, ms: number) => IScopedTimer; flush: () => void}
{
    const timers: {run: () => void; active: boolean}[] = [];

    return {
        timeout: run =>
        {
            const timer = {run, active: true, clear(): void { timer.active = false; }};

            timers.push(timer);

            return timer;
        },
        flush: () =>
        {
            for(const timer of timers.splice(0)) if(timer.active) timer.run();
        }
    };
}

test('a delayed effect fired in a zone never plays once the zone is left', () =>
{
    const clock = manualTimers();
    const zone = new ZoneTimers(clock.timeout);
    const played: string[] = [];

    zone.later(() => played.push('old zone'), 100);
    zone.endZone();
    zone.later(() => played.push('new zone'), 100);
    clock.flush();

    assert.deepEqual(played, ['new zone']);
    assert.equal(zone.epoch, 1);
});

const SHEET = {asset: 'a', width: 1, height: 1, columns: 1, frames: 1, ms: 1, anchorX: 0, anchorY: 0};
const BOLT: IVfxSet = {cast: null, release: null, projectile: {sheet: 'bolt', speed: 10}, area: null, hit: {sheet: 'spark', attach: 'body', delayMs: 0}};

function stage(overrides: Partial<IChoreographyDeps> = {}): {choreography: CombatChoreography; numbers: unknown[][]; removed: number[]; forgotten: number[]}
{
    const numbers: unknown[][] = [];
    const removed: number[] = [];
    const forgotten: number[] = [];
    const deps: IChoreographyDeps = {
        vfx: {burst: () => {}, burstAt: () => {}, shoot: (_sheet, _speed, _from, _to, land) => { land(); return 300; }, loop: () => () => {}},
        sheet: () => SHEET,
        marks: () => ({hit: (...args: unknown[]) => { numbers.push(args); }, startCast: () => {}, endCast: () => {}, remove: objectId => { removed.push(objectId); }}),
        later: run => run(),
        forget: objectId => forgotten.push(objectId),
        isMonster: objectId => objectId === 9,
        gesture: () => {},
        classOf: () => '',
        skillSet: skillId => skillId === 'bolt' ? BOLT : null,
        basicAttackSet: () => null,
        ...overrides
    };

    return {choreography: new CombatChoreography(deps), numbers, removed, forgotten};
}

test('a skill\'s number waits for its projectile to land', () =>
{
    const {choreography, numbers} = stage();

    choreography.impacts([{casterObjectId: 1, skillId: 'bolt', targetObjectId: 9, x: 0, y: 0}]);
    choreography.outcomes([{sourceObjectId: 1, sourceId: 'bolt', targetObjectId: 9, amount: 12, absorbed: 0, outcome: 'hit', health: 28, maxHealth: 40, killed: false}]);

    assert.deepEqual(numbers, [[9, 12, 'hit', 0, 300]]);
});

test('a monster killed by a blow loses its bar and its auras; a killed player keeps its bar', () =>
{
    const {choreography, removed, forgotten} = stage();

    choreography.hits([
        {attackerId: 1, targetId: 9, amount: 40, outcome: 'hit', health: 0, maxHealth: 40, killed: true},
        {attackerId: 9, targetId: 1, amount: 50, outcome: 'hit', health: 0, maxHealth: 50, killed: true}
    ]);

    assert.deepEqual(removed, [9]);
    assert.deepEqual(forgotten, [9, 1]);
});

const TEXTS = {text: (key: string) => key, contentName: (key: string, id: string) => `«${id}»`};
const USERS = new Map([[9, {name: 'monster.wolf', type: UserDataType.PET}], [2, {name: 'Alice', type: UserDataType.USER}]]);

test('a monster is named by its content, a player by their name, the player by « you »', () =>
{
    const names = new CombatNames(objectId => USERS.get(objectId) ?? null, () => TEXTS, () => 2);

    assert.equal(names.nameOf(9), '«monster.wolf»');
    assert.equal(names.nameOf(5), null);
    assert.equal(names.name(2), 'vortex.combat.log.you');
    assert.equal(names.name(5), '');
    assert.equal(names.isMonster(9), true);
    assert.equal(names.isMonster(2), false);
});
