import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {GAP, MARGIN} from '../hudLayout';
import type {HudPanel} from './HudPanel';

/**
 * Where the HUD's panels go, as the mock-ups lay them out: the place and quests top right, the boss
 * centred at the top, the chat bottom left and the target bottom right, both above the bottom bar
 * (found by name: HudView builds it, and the player frame).
 */
export function layOutPanels(desktop: IWindowContainer, panels: ReadonlyMap<HudPanel, IWindowContainer>): void
{
    const at = (panel: HudPanel, x: number, y: number): IWindowContainer =>
    {
        const window = panels.get(panel)!;

        window.x = Math.round(x);
        window.y = Math.round(y);

        return window;
    };
    const below = (window: IWindow, fallback: number): number => window.visible ? window.y + window.height + GAP : fallback;
    const width = (panel: HudPanel): number => panels.get(panel)!.width;
    const height = (panel: HudPanel): number => panels.get(panel)!.height;
    const {width: w, height: h} = desktop;

    const top = MARGIN;
    const player = desktop.findChildByName('hud_player');
    const bar = desktop.findChildByName('hud_action_bar');
    const playerRight = player ? MARGIN + player.width + GAP : MARGIN;
    const playerBottom = player ? top + player.height + GAP : top;
    const bottom = h - MARGIN - (bar?.visible ? bar.height + GAP : 0);

    const buffs = at('buffs', playerRight, top);

    at('party', MARGIN, playerBottom);

    const location = at('location', w - width('location') - MARGIN, top);

    at('quests', w - width('quests') - MARGIN, below(location, top));

    // Centred, unless that would cover the player's effects.
    const boss = at('boss', Math.max((w - width('boss')) / 2, buffs.visible ? buffs.x + buffs.width + GAP : 0), top);

    at('alert', boss.x + (boss.width - width('alert')) / 2, below(boss, top));
    const target = at('target', w - width('target') - MARGIN, bottom - height('target'));

    at('targetOfTarget', target.x - width('targetOfTarget') - GAP, bottom - height('targetOfTarget'));
    at('chat', MARGIN, bottom - height('chat'));
}
