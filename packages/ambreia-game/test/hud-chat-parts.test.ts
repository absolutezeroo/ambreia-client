// The chat's parts (features/hud/chat/): its tabs, its channel menus, its idle fade.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HudPanelsState} from '../src/features/hud/HudPanelsState';
import {ChatChannelMenus} from '../src/features/hud/chat/ChatChannelMenus';
import {ChatFade, IDLE_BLEND} from '../src/features/hud/chat/ChatFade';
import {ChatTabs} from '../src/features/hud/chat/ChatTabs';
import {ALL_TAB, DEFAULT_CHAT_SETTINGS, whisperTab} from '../src/ui/kit/chatModel';
import type {WindowBits} from '../src/ui/kit/WindowBits';
import type {IHabboWindowManager} from '../src/window/IHabboWindowManager';

const BITS = {text: (key: string) => key} as unknown as WindowBits;
const NO_WINDOWS = null as unknown as IHabboWindowManager;

test('a tab opens once and is selected; closing the open one goes back to « Général »', () =>
{
    const state = new HudPanelsState();
    const tabs = new ChatTabs(NO_WINDOWS, BITS, state);
    const arwen = whisperTab('Arwen');

    tabs.open(arwen);
    tabs.open(arwen);
    assert.deepEqual(state.value.chatTabs.map(tab => tab.id), [ALL_TAB.id, arwen.id]);
    assert.equal(state.value.chatTab, arwen.id);

    tabs.close(arwen);
    assert.deepEqual(state.value.chatTabs.map(tab => tab.id), [ALL_TAB.id]);
    assert.equal(state.value.chatTab, ALL_TAB.id);
});

test('« Général » and locked tabs cannot be closed', () =>
{
    const state = new HudPanelsState();
    const tabs = new ChatTabs(NO_WINDOWS, BITS, state);
    const arwen = whisperTab('Arwen');

    tabs.open(arwen);
    state.update({chatSettings: {...DEFAULT_CHAT_SETTINGS, lockTabs: true}});
    tabs.close(arwen);
    tabs.close(ALL_TAB);
    assert.equal(state.value.chatTabs.length, 2);
});

test('the bubble menu ticks where « Général » writes, and picking one writes there', () =>
{
    const state = new HudPanelsState();
    const menus = new ChatChannelMenus(BITS, state, () => {}, () => {});
    const say = menus.sayMenu();

    assert.deepEqual(say.filter(item => item.checked).map(item => item.label), ['vortex.guild.channel.general']);
    say[1].pick();
    assert.equal(state.value.sayChannel, 'general');
});

test('an idle chat fades after its minutes, and comes back on the next wake', () =>
{
    let settings = {...DEFAULT_CHAT_SETTINGS, hideIdle: true, idleMinutes: 1, opacity: 0.8};
    const frame = {blend: 0.8};
    let fire: (() => void) | null = null;
    let delay = 0;
    const fade = new ChatFade(() => settings, () => frame, {
        set: (run, ms) => { fire = run; delay = ms; return 1; },
        clear: () => { fire = null; }
    });

    fade.wake();
    assert.equal(delay, 60_000);
    fire!();
    assert.equal(frame.blend, IDLE_BLEND);
    assert.equal(fade.blend(settings.opacity), IDLE_BLEND);

    settings = {...settings, hideIdle: false};
    fade.wake();
    assert.equal(frame.blend, 0.8);
    assert.equal(fire, null);
});
