// M2a §3.1–3.2 (docs/superpowers/specs/2026-10-13-m2a-npc-dialogue-quests-design.md): each parser reads the
// fields in the order of the server's Serializers/Rpg/Quests; each serializer writes what its Parsers/Rpg/Quests reads.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgNpcsMessageParser} from '../src/parser/rpg/quests/RpgNpcsMessageParser';
import {RpgDialogueMessageParser} from '../src/parser/rpg/quests/RpgDialogueMessageParser';
import {RpgDialogueCloseMessageParser} from '../src/parser/rpg/quests/RpgDialogueCloseMessageParser';
import {RpgQuestLogMessageParser} from '../src/parser/rpg/quests/RpgQuestLogMessageParser';
import {RpgQuestResultMessageParser} from '../src/parser/rpg/quests/RpgQuestResultMessageParser';
import {RpgNpcTalkMessage} from '../src/outgoing/rpg/quests/RpgNpcTalkMessage';
import {RpgDialogueChooseMessage} from '../src/outgoing/rpg/quests/RpgDialogueChooseMessage';
import {RpgQuestAbandonMessage} from '../src/outgoing/rpg/quests/RpgQuestAbandonMessage';
import {RpgNpcTalkMessageSerializer} from '../src/serializer/rpg/quests/RpgNpcTalkMessageSerializer';
import {RpgDialogueChooseMessageSerializer} from '../src/serializer/rpg/quests/RpgDialogueChooseMessageSerializer';
import {RpgQuestAbandonMessageSerializer} from '../src/serializer/rpg/quests/RpgQuestAbandonMessageSerializer';

function wire(...values: Array<number | string | boolean>): IMessageDataWrapper & {left: () => number}
{
    let at = 0;
    const next = <T>(type: string): T =>
    {
        if(at >= values.length) throw new Error('read past the end');
        if(typeof values[at] !== type) throw new Error(`expected a ${type} at ${at}, got ${typeof values[at]}`);

        return values[at++] as T;
    };

    return {readInt: () => next<number>('number'), readString: () => next<string>('string'), readBoolean: () => next<boolean>('boolean'), left: () => values.length - at} as unknown as IMessageDataWrapper & {left: () => number};
}

test('RpgNpcs: count, then object id and marker', () =>
{
    const data = wire(2, 5, 'available', 6, '');

    assert.deepEqual(new RpgNpcsMessageParser().parse(data).npcs, [{objectId: 5, marker: 'available'}, {objectId: 6, marker: ''}]);
    assert.equal(data.left(), 0);
});

test('RpgDialogue: npc, speaker, text, then each choice; RpgDialogueClose reads nothing', () =>
{
    const data = wire(5, 'dialogue.camp.elder.name', 'dialogue.camp.elder.offer', 1, 'dialogue.common.accept', 'accept');
    const message = new RpgDialogueMessageParser().parse(data);

    assert.equal(message.npcObjectId, 5);
    assert.equal(message.speaker, 'dialogue.camp.elder.name');
    assert.equal(message.text, 'dialogue.camp.elder.offer');
    assert.deepEqual(message.choices, [{text: 'dialogue.common.accept', kind: 'accept'}]);
    assert.equal(data.left(), 0);

    const empty = wire();

    new RpgDialogueCloseMessageParser().parse(empty);
    assert.equal(empty.left(), 0);
});

test('RpgQuestLog: count, then each quest, its state and objective lines', () =>
{
    const data = wire(1, 'quest.camp.wolves', 'active', 1, 'kill', 1, 3);

    assert.deepEqual(new RpgQuestLogMessageParser().parse(data).quests, [
        {questId: 'quest.camp.wolves', state: 'active', objectives: [{kind: 'kill', current: 1, required: 3}]}
    ]);
    assert.equal(data.left(), 0);
});

test('RpgQuestResult: action, code, quest', () =>
{
    const data = wire('accepted', 'ok', 'quest.camp.wolves');
    const result = new RpgQuestResultMessageParser().parse(data);

    assert.deepEqual([result.action, result.code, result.questId], ['accepted', 'ok', 'quest.camp.wolves']);
    assert.equal(data.left(), 0);
});

test('the three sends write what the server parsers read', () =>
{
    assert.deepEqual(new RpgNpcTalkMessageSerializer().serialize(new RpgNpcTalkMessage(42)), [42]);
    assert.deepEqual(new RpgDialogueChooseMessageSerializer().serialize(new RpgDialogueChooseMessage(1)), [1]);
    assert.deepEqual(new RpgQuestAbandonMessageSerializer().serialize(new RpgQuestAbandonMessage('quest.camp.wolves')), ['quest.camp.wolves']);
});
