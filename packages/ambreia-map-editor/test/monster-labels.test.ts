import {test} from 'node:test';
import assert from 'node:assert/strict';
import {monsterDetail, monsterName, monsterOptions} from '../src/ui/panels/monsterLabels';

const guardian = {id: 'monster.grove.guardian', rank: 'boss', behavior: 'melee', aggressive: true, figure: '12 0 6A8F3A'};
const wolf = {id: 'monster.forest.wolf', rank: 'normal', behavior: 'melee', aggressive: false, figure: '0 0 FFFFFF'};
const names = new Map([['monster.grove.guardian.name', 'Gardien du bosquet']]);

test('the menu names the served monsters in French, with their rank, and keeps an id the zone still uses', () =>
{
    assert.deepEqual(monsterOptions([guardian, wolf], ['rat', '', 'monster.forest.wolf', 'rat'], names), [
        ['monster.grove.guardian', 'Gardien du bosquet · boss'],
        ['monster.forest.wolf', 'monster.forest.wolf'],
        ['rat', 'rat (inconnu)']
    ]);
});

test('the detail says rank, behaviour and aggressiveness, or that the id plays nothing', () =>
{
    assert.equal(monsterDetail('monster.grove.guardian', guardian), 'boss · mêlée · agressif');
    assert.equal(monsterDetail('monster.forest.wolf', wolf), 'normal · mêlée · passif');
    assert.equal(monsterDetail('rat', null), 'Inconnu du serveur : rien n\'apparaîtra');
    assert.equal(monsterDetail('', null), '');
    assert.equal(monsterName('monster.forest.wolf', names), 'monster.forest.wolf');
});
