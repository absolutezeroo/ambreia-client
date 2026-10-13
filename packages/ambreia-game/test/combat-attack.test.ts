// M1d §2.3: selecting is not attacking. The attack is an act: the button, the T key, or a second
// click on the selected monster; the button shows what the server says, never the click.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'eventemitter3';
import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {CombatModel} from '../src/features/combat/CombatModel';
import {AttackBinding} from '../src/features/combat/views/AttackBinding';
import {DoubleSelect} from '../src/features/combat/views/DoubleSelect';

setPlatform({...BROWSER_PLATFORM, now: () => 1000});

const WOLF = {objectId: 9, kind: 'monster', name: 'wolf', level: 2, classId: '', rank: 'normal'};

function binding(): {model: CombatModel; sent: boolean[]; states: string[]; attack: AttackBinding}
{
    const model = new CombatModel();
    const sent: boolean[] = [];
    const states: string[] = [];
    const attack = new AttackBinding(model, {update: values => values.attack && states.push(values.attack)}, active => sent.push(active));

    return {model, sent, states, attack};
}

test('the toggle asks the server, the button follows the answer', () =>
{
    const {model, sent, states, attack} = binding();

    attack.toggle();
    assert.deepEqual(sent, [], 'no monster target: nothing sent');

    model.setTarget(WOLF);
    attack.toggle();
    assert.deepEqual(sent, [true]);
    assert.equal(states.at(-1), 'idle', 'not active until the server says so');

    model.setAutoAttacking(true);
    assert.equal(states.at(-1), 'active');
    attack.toggle();
    assert.deepEqual(sent, [true, false]);
});

test('a KO player cannot attack, and a player target is no attack target', () =>
{
    const {model, sent, attack} = binding();

    model.setTarget({...WOLF, kind: 'player'});
    attack.toggle();
    model.setTarget(WOLF);
    model.setKo(60);
    attack.toggle();

    assert.deepEqual(sent, []);
});

test('a second click on the same monster within the window attacks; a slow one or another object does not', () =>
{
    const double = new DoubleSelect(400);

    assert.equal(double.select(9, 1000), false);
    assert.equal(double.select(9, 1300), true);
    assert.equal(double.select(9, 1350), false, 'a third click starts again');
    assert.equal(double.select(9, 2000), false);
    assert.equal(double.select(4, 2100), false);
    assert.equal(double.select(9, 2200), false, 'another object in between breaks the pair');
});

test('the binding attacks on a double selection of a monster only', () =>
{
    const {model, sent, attack} = binding();

    model.setTarget(WOLF);
    attack.selected(9, true, 1000);
    attack.selected(9, true, 1200);
    assert.deepEqual(sent, [true]);

    attack.selected(4, false, 2000);
    attack.selected(4, false, 2100);
    assert.deepEqual(sent, [true]);
});

test('disposed, the binding writes nothing more', () =>
{
    const model = new CombatModel();
    const states: string[] = [];
    const attack = new AttackBinding(model, {update: values => values.attack && states.push(values.attack)}, () => undefined);

    attack.dispose();
    model.setAutoAttacking(true);
    assert.deepEqual(states, []);
    void EventEmitter;
});
