// F3 character messages (docs/superpowers/specs/2026-10-08-f3-character-messages.md): the parsers
// read the fields in the order the server's serializers write them.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {rpgCharacterLevelUpParser, rpgCharacterSnapshotParser, rpgCharacterStatsParser, rpgCharacterXpParser} from '../src/rpg/RpgCharacterMessages';

/** A wrapper over values in wire order; reading past the end is an error, not a 0. */
function wire(...values: Array<number | string>): IMessageDataWrapper
{
    let at = 0;
    const next = <T>(type: string): T =>
    {
        if(at >= values.length) throw new Error('read past the end');
        if(typeof values[at] !== type) throw new Error(`expected a ${type} at ${at}, got ${typeof values[at]}`);

        return values[at++] as T;
    };

    return {readInt: () => next<number>('number'), readString: () => next<string>('string'), get bytesAvailable() { return at < values.length; }} as unknown as IMessageDataWrapper;
}

const STATS = [12, 8, 10, 160, 90, 4, 52, 13, 100, 12];

test('the snapshot reads class, level, XP, then the ten stats', () =>
{
    const snapshot = rpgCharacterSnapshotParser.parse(wire('class.warrior', 'spec.warrior.arms', 7, 20, 120, 400, ...STATS));

    assert.equal(snapshot.classId, 'class.warrior');
    assert.equal(snapshot.specializationId, 'spec.warrior.arms');
    assert.deepEqual([snapshot.level, snapshot.maxLevel, snapshot.xp, snapshot.xpToNext], [7, 20, 120, 400]);
    assert.deepEqual(snapshot.stats, {strength: 12, intelligence: 8, agility: 10, maxHealth: 160, maxMana: 90, armor: 4, critPermille: 52, dodgePermille: 13, speedPercent: 100, power: 12});
});

test('XP, level-up and stats read their fields in order', () =>
{
    assert.deepEqual({...rpgCharacterXpParser.parse(wire(35, 8, 15, 450))}, {gained: 35, level: 8, xp: 15, xpToNext: 450});
    assert.deepEqual({...rpgCharacterLevelUpParser.parse(wire(7, 8))}, {oldLevel: 7, newLevel: 8});
    assert.equal(rpgCharacterStatsParser.parse(wire(...STATS)).stats.maxMana, 90);
});

test('a snapshot with a field missing fails instead of reading zeros', () =>
{
    assert.throws(() => rpgCharacterSnapshotParser.parse(wire('class.warrior', '', 7, 20, 120, 400, ...STATS.slice(0, 9))), /past the end/);
});
