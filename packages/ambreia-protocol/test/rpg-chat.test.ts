// F3c §10 (vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-chat-design.md): each parser
// reads, and the serializer writes, the fields in the order of the server's Serializers/Rpg/Chat
// and Parsers/Rpg/Chat.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgChatMessageParser} from '../src/parser/rpg/chat/RpgChatMessageParser';
import {RpgChatResultMessageParser} from '../src/parser/rpg/chat/RpgChatResultMessageParser';
import {RpgChatSendMessage} from '../src/outgoing/rpg/chat/RpgChatSendMessage';
import {RpgChatSendMessageSerializer} from '../src/serializer/rpg/chat/RpgChatSendMessageSerializer';

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

test('RpgChatMessage: channel, sender id and name, text, sent at, target', () =>
{
    assert.deepEqual({...new RpgChatMessageParser().parse(wire('whisper', 8, 'Arwen', 'vend [item:item.weapon.rusted_sword]', 1_760_000_000, 'Boromir'))},
        {channel: 'whisper', senderId: 8, senderName: 'Arwen', text: 'vend [item:item.weapon.rusted_sword]', sentAt: 1_760_000_000, target: 'Boromir'});
    assert.throws(() => new RpgChatMessageParser().parse(wire('general', 8, 'Arwen', 'salut', 1_760_000_000)), /past the end/);
});

test('RpgChatResult: channel, then code', () =>
{
    assert.deepEqual({...new RpgChatResultMessageParser().parse(wire('world', 'rate_limited'))}, {channel: 'world', code: 'rate_limited'});
});

test('RpgChatSend writes channel, target, text', () =>
{
    assert.deepEqual(new RpgChatSendMessageSerializer().serialize(new RpgChatSendMessage('whisper', 'Boromir', 'salut')), ['whisper', 'Boromir', 'salut']);
    assert.deepEqual(new RpgChatSendMessageSerializer().serialize(new RpgChatSendMessage('general', '', 'salut')), ['general', '', 'salut']);
});
