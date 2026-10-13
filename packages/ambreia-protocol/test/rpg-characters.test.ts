// F3a §6 (vortex-rpg-emulator/docs/superpowers/specs/2026-10-08-rpg-network-characters-design.md):
// each parser reads, and each serializer writes, the fields in the order of the server's
// Serializers/Rpg/Characters and Parsers/Rpg/Characters.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgCharacterListMessageParser} from '../src/parser/rpg/characters/RpgCharacterListMessageParser';
import {RpgClassListMessageParser} from '../src/parser/rpg/characters/RpgClassListMessageParser';
import {RpgCharacterResultMessageParser} from '../src/parser/rpg/characters/RpgCharacterResultMessageParser';
import {RpgCharacterStateMessageParser} from '../src/parser/rpg/characters/RpgCharacterStateMessageParser';
import {RpgCharacterProgressMessageParser} from '../src/parser/rpg/characters/RpgCharacterProgressMessageParser';
import {RpgCharacterStatsMessageParser} from '../src/parser/rpg/characters/RpgCharacterStatsMessageParser';
import {RpgLevelUpMessageParser} from '../src/parser/rpg/characters/RpgLevelUpMessageParser';
import {RpgCharacterListRequestMessage} from '../src/outgoing/rpg/characters/RpgCharacterListRequestMessage';
import {RpgCharacterCreateMessage} from '../src/outgoing/rpg/characters/RpgCharacterCreateMessage';
import {RpgCharacterChooseClassMessage} from '../src/outgoing/rpg/characters/RpgCharacterChooseClassMessage';
import {RpgEnterWorldMessage} from '../src/outgoing/rpg/characters/RpgEnterWorldMessage';
import {RpgCharacterListRequestMessageSerializer} from '../src/serializer/rpg/characters/RpgCharacterListRequestMessageSerializer';
import {RpgCharacterCreateMessageSerializer} from '../src/serializer/rpg/characters/RpgCharacterCreateMessageSerializer';
import {RpgCharacterChooseClassMessageSerializer} from '../src/serializer/rpg/characters/RpgCharacterChooseClassMessageSerializer';
import {RpgEnterWorldMessageSerializer} from '../src/serializer/rpg/characters/RpgEnterWorldMessageSerializer';

/** A wrapper over values in wire order; a read of the wrong type or past the end is an error. */
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

const STATS = [12, 8, 10, 160, 90, 4, 620, 130, 100, 12];
const STAT_BLOCK = {strength: 12, intelligence: 8, agility: 10, maxHealth: 160, maxMana: 90, armor: 4, critBp: 620, dodgeBp: 130, speedPercent: 100, power: 12};

test('RpgCharacterList: max, then each character', () =>
{
    const list = new RpgCharacterListMessageParser().parse(wire(5, 2,
        7, 'Arwen', 'hd-180-1', 'F', 'class.classless', '', 1, true,
        9, 'Boromir', 'hd-185-1', 'M', 'class.warrior', 'spec.warrior.arms', 6, false));

    assert.equal(list.maxCharacters, 5);
    assert.deepEqual(list.characters.map(c => [c.playerId, c.name, c.gender, c.classId, c.level, c.starter]), [[7, 'Arwen', 'F', 'class.classless', 1, true], [9, 'Boromir', 'M', 'class.warrior', 6, false]]);
    assert.equal(list.characters[1].specializationId, 'spec.warrior.arms');
    assert.equal(list.characters[0].figure, 'hd-180-1');
});

test('RpgClassList: each class with its specialisations', () =>
{
    const classes = new RpgClassListMessageParser().parse(wire(2,
        'class.classless', 'none', 1, 'strength', true, 0,
        'class.mage', 'damage', 6, 'intelligence', false, 2, 'spec.mage.fire', 'spec.mage.frost'));

    assert.deepEqual(classes.classes.map(c => [c.id, c.role, c.range, c.primaryStat, c.starter]), [['class.classless', 'none', 1, 'strength', true], ['class.mage', 'damage', 6, 'intelligence', false]]);
    assert.deepEqual(classes.classes[1].specializations, ['spec.mage.fire', 'spec.mage.frost']);
});

test('RpgCharacterResult, State, Progress and Stats read in the server order', () =>
{
    assert.deepEqual({...new RpgCharacterResultMessageParser().parse(wire(1, 'character.name_taken', 0))}, {action: 1, code: 'character.name_taken', playerId: 0});

    const state = new RpgCharacterStateMessageParser().parse(wire(9, 'class.warrior', 'spec.warrior.arms', 6, 20, 120, 400, ...STATS));

    assert.deepEqual([state.playerId, state.classId, state.specializationId, state.level, state.maxLevel, state.xp, state.xpToNext], [9, 'class.warrior', 'spec.warrior.arms', 6, 20, 120, 400]);
    assert.deepEqual(state.stats, STAT_BLOCK);
    assert.deepEqual({...new RpgCharacterProgressMessageParser().parse(wire(7, 15, 450))}, {level: 7, xp: 15, xpToNext: 450});
    assert.deepEqual(new RpgCharacterStatsMessageParser().parse(wire(...STATS)).stats, STAT_BLOCK);
});

test('a State with its stat block cut short fails instead of reading zeros', () =>
{
    assert.throws(() => new RpgCharacterStateMessageParser().parse(wire(9, 'class.warrior', '', 6, 20, 120, 400, ...STATS.slice(0, 9))), /past the end/);
});

test('the four client messages serialize in the order the server parses them', () =>
{
    assert.deepEqual(new RpgCharacterListRequestMessageSerializer().serialize(new RpgCharacterListRequestMessage()), []);
    assert.deepEqual(new RpgCharacterCreateMessageSerializer().serialize(new RpgCharacterCreateMessage('Arwen', 'hd-180-1', 'F')), ['Arwen', 'hd-180-1', 'F']);
    assert.deepEqual(new RpgCharacterChooseClassMessageSerializer().serialize(new RpgCharacterChooseClassMessage(7, 'class.mage')), [7, 'class.mage']);
    assert.deepEqual(new RpgEnterWorldMessageSerializer().serialize(new RpgEnterWorldMessage(7)), [7]);
});

// M1d §2.1: both stat blocks, then the skills learned over the whole gain.
test('RpgLevelUp reads both stat blocks then the skills learned', () =>
{
    const after = [...STATS];

    after[3] = 172;
    const message = new RpgLevelUpMessageParser().parse(wire(3, 4, ...STATS, ...after, 1, 'skill.mage.frost_nova'));

    assert.equal(message.fromLevel, 3);
    assert.equal(message.toLevel, 4);
    assert.deepEqual(message.statsBefore, STAT_BLOCK);
    assert.equal(message.statsAfter.maxHealth, 172);
    assert.deepEqual(message.skillsLearned, ['skill.mage.frost_nova']);
});
