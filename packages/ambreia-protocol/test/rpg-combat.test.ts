// M1a §9.2 (vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-combat-m1a-design.md): each
// parser reads the fields in the order of the server's Serializers/Rpg/Combat.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgCombatEventsMessageParser} from '../src/parser/rpg/combat/RpgCombatEventsMessageParser';
import {RpgVitalsMessageParser} from '../src/parser/rpg/combat/RpgVitalsMessageParser';
import {RpgSelfVitalsMessageParser} from '../src/parser/rpg/combat/RpgSelfVitalsMessageParser';
import {RpgDeathMessageParser} from '../src/parser/rpg/combat/RpgDeathMessageParser';
import {RpgCombatResultMessageParser} from '../src/parser/rpg/combat/RpgCombatResultMessageParser';
import {RpgMonsterYellMessageParser} from '../src/parser/rpg/combat/RpgMonsterYellMessageParser';

function wire(...values: Array<number | string | boolean>): IMessageDataWrapper
{
    let at = 0;
    const next = <T>(type: string): T =>
    {
        if(at >= values.length) throw new Error('read past the end');
        if(typeof values[at] !== type) throw new Error(`expected a ${type} at ${at}, got ${typeof values[at]}`);

        return values[at++] as T;
    };

    return {readInt: () => next<number>('number'), readString: () => next<string>('string'), readBoolean: () => next<boolean>('boolean')} as unknown as IMessageDataWrapper;
}

test('RpgCombatEvents: count, then each blow', () =>
{
    assert.deepEqual(new RpgCombatEventsMessageParser().parse(wire(2, 1, 5, 12, 'crit', 28, 40, false, 5, 1, 0, 'miss', 100, 100, false)).hits, [
        {attackerId: 1, targetId: 5, amount: 12, outcome: 'crit', health: 28, maxHealth: 40, killed: false},
        {attackerId: 5, targetId: 1, amount: 0, outcome: 'miss', health: 100, maxHealth: 100, killed: false}
    ]);
});

test('RpgVitals, RpgSelfVitals, RpgDeath and RpgCombatResult read in the server order', () =>
{
    assert.deepEqual(new RpgVitalsMessageParser().parse(wire(1, 5, 40, 40)).combatants, [{objectId: 5, health: 40, maxHealth: 40}]);
    assert.deepEqual({...new RpgSelfVitalsMessageParser().parse(wire(80, 100, 30, 64, true))}, {health: 80, maxHealth: 100, mana: 30, maxMana: 64, inCombat: true});
    assert.equal(new RpgDeathMessageParser().parse(wire(5)).respawnSeconds, 5);
    assert.equal(new RpgCombatResultMessageParser().parse(wire('safe_zone')).code, 'safe_zone');
    assert.throws(() => new RpgSelfVitalsMessageParser().parse(wire(80, 100, 30, 64)), /past the end/);
});

test('RpgMonsterYell: object, text key (M1c §9)', () =>
{
    assert.deepEqual({...new RpgMonsterYellMessageParser().parse(wire(40, 'monster.grove.guardian.phase2'))},
        {objectId: 40, textKey: 'monster.grove.guardian.phase2'});
});
