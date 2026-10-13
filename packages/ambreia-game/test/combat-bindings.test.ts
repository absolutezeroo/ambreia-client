// Spec §3.3: the views read the model; a binding keeps no state of its own and writes one frame.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {CombatModel} from '../src/features/combat/CombatModel';
import {PlayerFrameBinding} from '../src/features/combat/views/PlayerFrameBinding';
import {TargetHealthBinding} from '../src/features/combat/views/TargetHealthBinding';
import type {IHudPanels} from '../src/features/hud/IHud';

setPlatform({...BROWSER_PLATFORM, now: () => 1000});

test('the player frame takes the own vitals and the in-combat state, and nothing once disposed', () =>
{
    const model = new CombatModel();
    const updates: object[] = [];
    const binding = new PlayerFrameBinding(model, {update: values => updates.push(values)});

    model.reset(1);
    model.setSelfVitals(70, 100, 20, 50, true);
    assert.deepEqual(updates.slice(1), [{hp: 70, hpMax: 100, mana: 20, manaMax: 50}, {inCombat: true}]);

    binding.dispose();
    model.setSelfVitals(10, 100, 20, 50, false);
    assert.equal(updates.length, 3);
});

test('the target frame follows its own target\'s health only', () =>
{
    const model = new CombatModel();
    let value: Pick<IHudPanels, 'target'> = {target: {name: 'Wolf', portrait: null, level: 2, info: '', hp: 40, hpMax: 40, debuffs: [], cast: null}};
    const panels = {get value() { return value; }, update: (values: Partial<IHudPanels>) => value = {...value, ...values}};

    new TargetHealthBinding(model, panels);
    model.setTarget({objectId: 9, kind: 'monster', name: 'wolf', level: 2, classId: '', rank: 'normal'});
    model.setVitals(4, 1, 40);
    assert.equal(value.target?.hp, 40, 'not the target');
    model.setVitals(9, 12, 40);
    assert.equal(value.target?.hp, 12);
});
