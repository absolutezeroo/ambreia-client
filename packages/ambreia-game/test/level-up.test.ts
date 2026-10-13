// M1d §4: the level-up panel lists only what rose, in the stat block's order, as the owner's mock-up.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {levelUpRows} from '../src/features/combat/views/levelUpRows';

const BEFORE = {strength: 10, intelligence: 12, agility: 5, maxHealth: 100, maxMana: 50, armor: 2, critBp: 500, dodgeBp: 300, speedPercent: 100, power: 20};

test('only the stats that rose, with their text key and their icon', () =>
{
    const rows = levelUpRows(BEFORE, {...BEFORE, maxHealth: 130, maxMana: 70, strength: 12, critBp: 620});

    assert.deepEqual(rows.map(row => [row.key, row.delta]), [
        ['vortex.stat.strength', '+2'],
        ['vortex.stat.health', '+30'],
        ['vortex.stat.mana', '+20'],
        ['vortex.stat.critical_chance', '+1.2 %']
    ]);
    assert.ok(rows.every(row => row.icon.startsWith('rpg/ui-icons/')));
});

test('nothing rose: no row; a stat that fell is not a gain', () =>
{
    assert.deepEqual(levelUpRows(BEFORE, BEFORE), []);
    assert.deepEqual(levelUpRows(BEFORE, {...BEFORE, armor: 1}), []);
});
