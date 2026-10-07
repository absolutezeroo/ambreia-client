// The world layers (entries, passages, areas, NPCs, spawns, triggers…) edited through one set of
// commands: add a default element, patch it, duplicate it, remove it — each an undo step.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addElement} from '../src/commands/addElement';
import {updateElement} from '../src/commands/updateElement';
import {removeElements} from '../src/commands/removeElements';
import {duplicateElements} from '../src/commands/duplicateElements';
import {newElement} from '../src/zone/newElement';
import {LAYER_KEYS} from '../src/zone/LAYER_KEYS';
import {blankZone} from '../src/zone/blankZone';
import {validateLocally} from '../src/validation/validateLocally';

test('every layer gets a default element that the local validator accepts', () =>
{
    for(const layer of LAYER_KEYS)
    {
        const doc = blankZone('v', 'V', 8, 8);
        const next = addElement(layer, newElement(layer, doc, {x: 3, y: 3})).apply(doc);
        const errors = validateLocally(next, () => ({width: 1, length: 1})).filter(f => f.severity === 'Error');

        assert.equal(next[layer]!.length, 1, layer);
        assert.deepEqual(errors, [], layer);
    }
});

test('default ids are stable, readable and unique per layer', () =>
{
    let doc = blankZone('v', 'V');

    doc = addElement('npcs', newElement('npcs', doc, {x: 1, y: 1})).apply(doc);
    doc = addElement('npcs', newElement('npcs', doc, {x: 2, y: 1})).apply(doc);

    assert.deepEqual(doc.npcs!.map(n => n.id), ['npc_1', 'npc_2']);
});

test('a patch changes one element and an unchanged patch is no history', () =>
{
    let doc = blankZone('v', 'V');

    doc = addElement('spawns', newElement('spawns', doc, {x: 2, y: 2})).apply(doc);

    const command = updateElement('spawns', 'spawn_1', {monster: 'rat', max: 6});
    const next = command.apply(doc);

    assert.equal(command.label, 'Modifier spawn_1');
    assert.deepEqual([next.spawns![0].monster, next.spawns![0].max], ['rat', 6]);
    assert.equal(updateElement('spawns', 'spawn_1', {monster: 'rat'}).apply(next), next);
    assert.equal(updateElement('spawns', 'nobody', {max: 1}).apply(doc), doc);
});

test('duplicate gives fresh ids; remove takes them away', () =>
{
    let doc = blankZone('v', 'V');

    doc = addElement('triggers', newElement('triggers', doc, {x: 0, y: 0})).apply(doc);
    doc = duplicateElements('triggers', ['trigger_1']).apply(doc);

    assert.deepEqual(doc.triggers!.map(t => t.id), ['trigger_1', 'trigger_2']);

    doc = removeElements('triggers', ['trigger_1']).apply(doc);

    assert.deepEqual(doc.triggers!.map(t => t.id), ['trigger_2']);
});
