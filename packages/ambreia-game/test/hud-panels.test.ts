// The HUD panels' parts (features/hud/panels/): the list cache, the party selection, the layout.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {HudPanelsState, type IPartyMember} from '../src/features/hud/HudPanelsState';
import {GAP, MARGIN} from '../src/features/hud/hudLayout';
import type {EffectIcons} from '../src/features/hud/panels/EffectIcons';
import type {HudPanel} from '../src/features/hud/panels/HudPanel';
import {layOutPanels} from '../src/features/hud/panels/layOutPanels';
import {ListCache} from '../src/features/hud/panels/ListCache';
import {PartyFramesView} from '../src/features/hud/panels/PartyFramesView';
import type {WindowBits} from '../src/ui/kit/WindowBits';
import type {IHabboWindowManager} from '../src/window/IHabboWindowManager';
import {trackerHeight} from '../src/features/hud/panels/trackerHeight';

test('a list is rebuilt only when its array changed', () =>
{
    let emptied = 0;
    const list = {destroyListItems: () => { emptied++; }};
    const window = {findChildByName: () => list} as unknown as IWindowContainer;
    const cache = new ListCache();
    const quests = [{}];

    assert.equal(cache.rebuild(window, 'quest_list', quests), list);
    assert.equal(cache.rebuild(window, 'quest_list', quests), null);
    assert.equal(cache.rebuild(window, 'quest_list', [...quests]), list);
    assert.equal(emptied, 2);
});

test('a party member\'s frame selects them into the target frame, and a second click lets go', () =>
{
    const state = new HudPanelsState();
    const bits = {text: () => 'Niv. 4'} as unknown as WindowBits;
    const party = new PartyFramesView(null as unknown as IHabboWindowManager, bits, state, new ListCache(), null as unknown as EffectIcons);
    const arwen: IPartyMember = {name: 'Arwen', figure: 'hd-1', level: 4, hp: 30, hpMax: 50, dead: false, buffs: []};

    party.select(arwen);
    assert.equal(state.value.partySelected, 'Arwen');
    assert.equal(state.value.target?.name, 'Arwen');
    assert.equal(state.value.target?.info, 'Niv. 4');

    party.select(arwen);
    assert.equal(state.value.partySelected, null);
    assert.equal(state.value.target, null);
});

test('the chat sits bottom left and the target bottom right, both above the bar; the target of target left of the target', () =>
{
    const box = (width: number, height: number, visible = true): IWindowContainer => ({x: 0, y: 0, width, height, visible} as unknown as IWindowContainer);
    const bar = box(600, 80);
    const desktop = {width: 1280, height: 800, findChildByName: (name: string) => name === 'hud_action_bar' ? bar : null} as unknown as IWindowContainer;
    const panels = new Map<HudPanel, IWindowContainer>(
        (['location', 'quests', 'party', 'buffs', 'target', 'targetOfTarget', 'boss', 'alert', 'chat'] as HudPanel[]).map(name => [name, box(100, 50)])
    );

    panels.set('chat', box(500, 220));
    panels.set('target', box(360, 210));
    layOutPanels(desktop, panels);

    const bottom = 800 - MARGIN - 80 - GAP;
    const chat = panels.get('chat')!;
    const target = panels.get('target')!;
    const targetOfTarget = panels.get('targetOfTarget')!;

    assert.deepEqual([chat.x, chat.y], [MARGIN, bottom - 220]);
    assert.deepEqual([target.x, target.y], [1280 - 360 - MARGIN, bottom - 210]);
    assert.deepEqual([targetOfTarget.x, targetOfTarget.y], [target.x - 100 - GAP, bottom - 50]);
});

test('the quest tracker fits its rows, and folds down to its title bar', () =>
{
    // Header to the list's top (34), the rows and their spacing, the bottom padding (8).
    assert.equal(trackerHeight([40, 40, 40], 2, false), 34 + 124 + 8);
    assert.equal(trackerHeight([40], 2, false), 34 + 40 + 8);
    assert.equal(trackerHeight([], 2, false), 34 + 8);
    assert.equal(trackerHeight([40, 40], 2, true), 32);
});
