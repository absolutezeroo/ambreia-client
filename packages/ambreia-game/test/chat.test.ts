// The RPG chat's model (features/hud/chatModel): what a typed line sends (F3c §10.1), which lines a
// tab shows (§10.3), and the settings kept in the browser.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
    ALL_TAB, channelTab, chatLinesOf, chatSend, DEFAULT_CHAT_SETTINGS, EMOTICONS, loadChatSettings, saveChatSettings, splitEmoticons, whisperTab, type IChatLine
} from '../src/features/hud/chatModel';

test('« Général » writes where the bubble says; a tab in its channel; commands win', () =>
{
    assert.deepEqual(chatSend('  salut ', ALL_TAB, 'world'), {channel: 'world', target: '', text: 'salut'});
    assert.deepEqual(chatSend('salut', ALL_TAB, 'general'), {channel: 'general', target: '', text: 'salut'});
    assert.deepEqual(chatSend('salut', channelTab('group'), 'world'), {channel: 'group', target: '', text: 'salut'});
    assert.deepEqual(chatSend('salut', whisperTab('Arwen'), 'world'), {channel: 'whisper', target: 'Arwen', text: 'salut'});
    assert.deepEqual(chatSend('/w Boromir on y va ?', ALL_TAB, 'world'), {channel: 'whisper', target: 'Boromir', text: 'on y va ?'});
    assert.deepEqual(chatSend('/z qui est là ?', whisperTab('Arwen'), 'world'), {channel: 'general', target: '', text: 'qui est là ?'});
    assert.deepEqual(chatSend('/g bonjour', channelTab('guild'), 'general'), {channel: 'world', target: '', text: 'bonjour'});
    assert.equal(chatSend('   ', ALL_TAB, 'world'), null);
});

test('« Général » shows every line (system per the settings); a tab its channel or conversation, and the system lines', () =>
{
    const line = (channel: IChatLine['channel'], message: string, target?: string): IChatLine => ({time: '12:00', channel, author: 'A', message, target});
    const lines = [line('world', 'w'), line('general', 'z'), line('whisper', 'to arwen', 'Arwen'), line('whisper', 'to boromir', 'Boromir'), line('system', 's'), line('group', 'p')];
    const shown = (tab: Parameters<typeof chatLinesOf>[1], system = true): string[] =>
        chatLinesOf(lines, tab, {...DEFAULT_CHAT_SETTINGS, system}).map(entry => entry.message);

    assert.deepEqual(shown(ALL_TAB), ['w', 'z', 'to arwen', 'to boromir', 's', 'p']);
    assert.deepEqual(shown(ALL_TAB, false), ['w', 'z', 'to arwen', 'to boromir', 'p']);
    assert.deepEqual(shown(whisperTab('arwen')), ['to arwen', 's']);
    assert.deepEqual(shown(channelTab('general')), ['z', 's']);
    assert.deepEqual(shown(channelTab('guild')), ['s']);
});

test('the settings come back from storage over the defaults, and a broken or absent storage gives the defaults', () =>
{
    const store = new Map<string, string>();
    const storage = {getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value)};

    saveChatSettings(storage, {...DEFAULT_CHAT_SETTINGS, opacity: 0.5, textSize: 'large'});
    assert.deepEqual(loadChatSettings(storage), {...DEFAULT_CHAT_SETTINGS, opacity: 0.5, textSize: 'large'});

    store.set('ambreia.chat.settings', '{not json');
    assert.deepEqual(loadChatSettings(storage), DEFAULT_CHAT_SETTINGS);
    assert.deepEqual(loadChatSettings(null), DEFAULT_CHAT_SETTINGS);
});

test('a line is cut at the emoticons of the palette, which show as their icons; other text stays text', () =>
{
    const smile = EMOTICONS.find(emoticon => emoticon.text === '🙂')!.icon;
    const thumbsUp = EMOTICONS.find(emoticon => emoticon.text === '👍')!.icon;

    assert.deepEqual(splitEmoticons('merci 🙂 !👍'), [{text: 'merci '}, {icon: smile}, {text: ' !'}, {icon: thumbsUp}]);
    assert.deepEqual(splitEmoticons('🙂'), [{icon: smile}]);
    assert.deepEqual(splitEmoticons('rien de spécial 🎉'), [{text: 'rien de spécial 🎉'}]);
});
