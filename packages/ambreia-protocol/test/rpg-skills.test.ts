// M1b §10 (vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-skills-m1b-design.md): each
// parser reads the fields in the order of the server's Serializers/Rpg/Skills, each serializer
// writes them in the order of its Parsers/Rpg/Skills.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgSkillsMessageParser} from '../src/parser/rpg/skills/RpgSkillsMessageParser';
import {RpgSkillResultMessageParser} from '../src/parser/rpg/skills/RpgSkillResultMessageParser';
import {RpgCastStartMessageParser} from '../src/parser/rpg/skills/RpgCastStartMessageParser';
import {RpgCastEndMessageParser} from '../src/parser/rpg/skills/RpgCastEndMessageParser';
import {RpgCooldownsMessageParser} from '../src/parser/rpg/skills/RpgCooldownsMessageParser';
import {RpgStatusesMessageParser} from '../src/parser/rpg/skills/RpgStatusesMessageParser';
import {RpgSkillEventsMessageParser} from '../src/parser/rpg/skills/RpgSkillEventsMessageParser';
import {RpgSkillCastMessage} from '../src/outgoing/rpg/skills/RpgSkillCastMessage';
import {RpgSkillCastMessageSerializer} from '../src/serializer/rpg/skills/RpgSkillCastMessageSerializer';
import {RpgActionBarSetMessage} from '../src/outgoing/rpg/skills/RpgActionBarSetMessage';
import {RpgActionBarSetMessageSerializer} from '../src/serializer/rpg/skills/RpgActionBarSetMessageSerializer';
import {RpgCastCancelMessage} from '../src/outgoing/rpg/skills/RpgCastCancelMessage';
import {RpgCastCancelMessageSerializer} from '../src/serializer/rpg/skills/RpgCastCancelMessageSerializer';

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

test('RpgSkills: the known skills, then the bar with its empty slots', () =>
{
    const message = new RpgSkillsMessageParser().parse(wire(1, 'skill.mage.firebolt', 3, 'skill:skill.mage.firebolt', '', ''));

    assert.deepEqual(message.known, ['skill.mage.firebolt']);
    assert.deepEqual(message.bar, ['skill:skill.mage.firebolt', '', '']);
});

test('RpgSkillResult, RpgCastStart, RpgCastEnd and RpgCooldowns read in the server order', () =>
{
    assert.deepEqual({...new RpgSkillResultMessageParser().parse(wire('skill.mage.firebolt', 'global_cooldown'))}, {skillId: 'skill.mage.firebolt', code: 'global_cooldown'});
    assert.deepEqual(new RpgCastStartMessageParser().parse(wire(1, 3, 'skill.archer.volley', 3000, true, 0, 7, 9)).casts, [
        {casterObjectId: 3, skillId: 'skill.archer.volley', durationMs: 3000, channel: true, targetObjectId: 0, x: 7, y: 9}
    ]);
    assert.deepEqual(new RpgCastEndMessageParser().parse(wire(1, 3, 'skill.mage.firebolt', 'cancelled')).ends, [{casterObjectId: 3, skillId: 'skill.mage.firebolt', reason: 'cancelled'}]);
    assert.deepEqual({...new RpgCooldownsMessageParser().parse(wire(800, 1, 'skill.mage.flame_burst', 9200))}, {globalRemainingMs: 800, skills: [{skillId: 'skill.mage.flame_burst', remainingMs: 9200}]});
});

test('RpgStatuses: each combatant then its whole list, empty included', () =>
{
    assert.deepEqual(new RpgStatusesMessageParser().parse(wire(2, 5, 1, 'status.burning', 4000, 2, 6, 0)).combatants, [
        {objectId: 5, statuses: [{statusId: 'status.burning', remainingMs: 4000, stacks: 2}]},
        {objectId: 6, statuses: []}
    ]);
});

test('RpgSkillEvents: the impacts, then the outcomes', () =>
{
    const message = new RpgSkillEventsMessageParser().parse(wire(1, 1, 'skill.mage.firebolt', 5, -1, -1, 1, 1, 'skill.mage.firebolt', 5, 20, 4, 'crit', 12, 40, false));

    assert.deepEqual(message.impacts, [{casterObjectId: 1, skillId: 'skill.mage.firebolt', targetObjectId: 5, x: -1, y: -1}]);
    assert.deepEqual(message.outcomes, [{
        sourceObjectId: 1, sourceId: 'skill.mage.firebolt', targetObjectId: 5, amount: 20, absorbed: 4, outcome: 'crit', health: 12, maxHealth: 40, killed: false
    }]);
    assert.throws(() => new RpgSkillEventsMessageParser().parse(wire(0)), /past the end/);
});

test('RpgSkillCast, RpgActionBarSet and RpgCastCancel write in the server order', () =>
{
    assert.deepEqual(new RpgSkillCastMessageSerializer().serialize(new RpgSkillCastMessage('skill.mage.firebolt', 5)), ['skill.mage.firebolt', 5, -1, -1]);
    assert.deepEqual(new RpgSkillCastMessageSerializer().serialize(new RpgSkillCastMessage('skill.archer.volley', 0, 7, 9)), ['skill.archer.volley', 0, 7, 9]);
    assert.deepEqual(new RpgActionBarSetMessageSerializer().serialize(new RpgActionBarSetMessage(2, '')), [2, '']);
    assert.deepEqual(new RpgCastCancelMessageSerializer().serialize(new RpgCastCancelMessage()), []);
});
