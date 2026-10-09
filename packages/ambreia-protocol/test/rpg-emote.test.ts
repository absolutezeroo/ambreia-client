// F3c §16 (vortex-rpg-emulator/docs/superpowers/specs/2026-10-09-rpg-chat-design.md): the RP
// action, read and written in the order of the server's Serializers/Rpg/Emote and Parsers/Rpg/Emote.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RpgEmoteMessageParser} from '../src/parser/rpg/emote/RpgEmoteMessageParser';
import {RpgEmoteSendMessage} from '../src/outgoing/rpg/emote/RpgEmoteSendMessage';
import {RpgEmoteSendMessageSerializer} from '../src/serializer/rpg/emote/RpgEmoteSendMessageSerializer';

function wire(...values: Array<number | string>): IMessageDataWrapper
{
    let at = 0;
    const next = <T>(type: string): T =>
    {
        if(at >= values.length) throw new Error('read past the end');
        if(typeof values[at] !== type) throw new Error(`expected a ${type} at ${at}, got ${typeof values[at]}`);

        return values[at++] as T;
    };

    return {readInt: () => next<number>('number'), readString: () => next<string>('string')} as unknown as IMessageDataWrapper;
}

test('RpgEmote: the avatar, then the action key; the client sends the key alone', () =>
{
    assert.deepEqual({...new RpgEmoteMessageParser().parse(wire(4, 'dance'))}, {objectId: 4, key: 'dance'});
    assert.deepEqual(new RpgEmoteSendMessageSerializer().serialize(new RpgEmoteSendMessage('wave')), ['wave']);
});
