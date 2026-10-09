// The RPG chat's pure rules (features/chat, hud/HudPanelsState): what a typed line sends (F3c
// §10.1) and which lines a tab shows (§10.3).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chatSend} from '../src/features/chat/chatSend';
import {chatLinesOf, type IChatLine} from '../src/features/hud/HudPanelsState';

test('the tab decides the channel, unless a command says otherwise', () =>
{
    assert.deepEqual(chatSend('  salut ', 'general', null), {channel: 'general', target: '', text: 'salut'});
    assert.deepEqual(chatSend('salut', 'whisper', 'Arwen'), {channel: 'whisper', target: 'Arwen', text: 'salut'});
    assert.deepEqual(chatSend('salut', 'group', null), {channel: 'group', target: '', text: 'salut'});
    assert.deepEqual(chatSend('/w Boromir on y va ?', 'general', null), {channel: 'whisper', target: 'Boromir', text: 'on y va ?'});
    assert.deepEqual(chatSend('/monde qui pour le donjon ?', 'whisper', 'Arwen'), {channel: 'world', target: '', text: 'qui pour le donjon ?'});
    assert.equal(chatSend('   ', 'general', null), null);
    // A whisper tab with nobody behind it writes in the zone.
    assert.equal(chatSend('salut', 'whisper', null)?.channel, 'general');
});

test('General shows every line; a tab its channel, its whisper and the system lines', () =>
{
    const line = (channel: IChatLine['channel'], message: string, target?: string): IChatLine => ({time: '12:00', channel, author: 'A', message, target});
    const lines = [line('general', 'g'), line('world', 'w'), line('whisper', 'to arwen', 'Arwen'), line('whisper', 'to boromir', 'Boromir'), line('system', 's'), line('group', 'p')];
    const shown = (tab: Parameters<typeof chatLinesOf>[1], whisperWith: string | null = null): string[] => chatLinesOf(lines, tab, whisperWith).map(entry => entry.message);

    assert.deepEqual(shown('general'), ['g', 'w', 'to arwen', 'to boromir', 's', 'p']);
    assert.deepEqual(shown('whisper', 'Arwen'), ['to arwen', 's']);
    assert.deepEqual(shown('group'), ['s', 'p']);
    assert.deepEqual(shown('guild'), ['s']);
});
