// M1d §4: the target of target, and the aggro on the player shown there (the owner's mock-up: the
// compact frame's line turns red, « Aggro on you »), from the model alone.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {CombatModel} from '../src/features/combat/CombatModel';
import {targetOfTarget} from '../src/features/combat/views/targetOfTarget';

setPlatform({...BROWSER_PLATFORM, now: () => 1000});

const WOLF = {objectId: 9, kind: 'monster', name: 'wolf', level: 2, classId: '', rank: 'normal'};
const NAMES: Record<number, {name: string; level: number | null}> = {1: {name: 'Me', level: 5}, 4: {name: 'Léa', level: null}};
const who = (objectId: number): {name: string; level: number | null} | null => NAMES[objectId] ?? null;

test('no target, or a target aiming at nothing: no frame', () =>
{
    const model = new CombatModel();

    assert.equal(targetOfTarget(model, who), null);
    model.setTarget(WOLF);
    assert.equal(targetOfTarget(model, who), null);
});

test('the frame names whom the target aims at, with its health', () =>
{
    const model = new CombatModel();

    model.setOwn(1);
    model.setTarget(WOLF);
    model.setTargets([{objectId: 9, targetObjectId: 4}]);
    model.setVitals(4, 30, 60);

    assert.deepEqual(targetOfTarget(model, who), {objectId: 4, name: 'Léa', level: null, hp: 30, hpMax: 60, onPlayer: false});
});

test('the target aiming at the player is the aggro on him', () =>
{
    const model = new CombatModel();

    model.setOwn(1);
    model.setTarget(WOLF);
    model.setTargets([{objectId: 9, targetObjectId: 1}]);

    assert.equal(targetOfTarget(model, who)?.onPlayer, true);
});

test('an object not yet named shows nothing until its user data arrives', () =>
{
    const model = new CombatModel();

    model.setTarget(WOLF);
    model.setTargets([{objectId: 9, targetObjectId: 77}]);

    assert.equal(targetOfTarget(model, who), null);
});
