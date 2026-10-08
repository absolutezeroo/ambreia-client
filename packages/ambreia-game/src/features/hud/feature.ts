import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import type {IGameFeature} from '../GameFeature';
import {HudView} from './HudView';
import {PlayerHudState} from './PlayerHudState';
import {bindCharacterToHud} from './CharacterHudBridge';

// The demo's icons: read by name (static_bitmap asset_uri set at run time), so declared to be
// decoded at load (IGameFeature.images). The server's skills will come with their own list.
const DEMO_SKILLS = [1, 2, 3, 4].map(i => `rpg/skills/warrior_skill_icon_${i}`);
const DEMO_ITEMS = ['rpg/consumables-potions/icon_00', 'rpg/consumables-potions/icon_01', 'rpg/consumables-potions/icon_02', 'rpg/consumables-potions/icon_03'];

/** What `globalThis.__ambreia.hud` offers until the server sends the player's stats (RPG network, F3). */
export interface IHudDevHook
{
    state: PlayerHudState;
    show(): void;
    hide(): void;
    /** Sample values, icons and two running cooldowns, to see the HUD move. */
    demo(): void;
    /** Where the HUD windows are (null before the first show). */
    inspect(): Record<string, unknown> | null;
}

/**
 * The player's HUD (RPG spec §16.3, the mock-ups in vortex-layouts/vortex_hud_*): the player frame
 * and the action bar, shown while in a room. The values come from PlayerHudState, which the RPG
 * network will fill; until then only the name and portrait (the session's) are known, and the
 * dev hook `__ambreia.hud.demo()` fills the rest.
 */
export const HudFeature: IGameFeature = {
    id: 'hud',
    images: [...DEMO_SKILLS, ...DEMO_ITEMS],
    create: ({host}) =>
    {
        const state = new PlayerHudState();
        let view: HudView | null = null;

        const show = (): void =>
        {
            const windows = host.made.windowManager;

            if(!windows) return;

            view ??= new HudView(windows, state);
            state.update({name: host.made.sessionData?.userName ?? '', figure: host.made.sessionData?.figure ?? ''});
            view.show();
        };
        const hide = (): void => view?.hide();

        // The played character fills the HUD (F3a): level, XP, and the bars' maxima.
        if(host.made.character) bindCharacterToHud(host.made.character, state);

        host.made.roomSession?.sessionEvents.on(RoomSessionEvent.RSE_STARTED, show);
        host.made.roomSession?.sessionEvents.on(RoomSessionEvent.RSE_ENDED, hide);

        const hook: IHudDevHook = {
            state,
            show,
            hide,
            inspect: () => view?.describe() ?? null,
            demo: () =>
            {
                state.update({level: 12, hp: 84, hpMax: 120, mana: 45, manaMax: 80, xp: 340, xpMax: 1000});
                DEMO_SKILLS.forEach((icon, i) => state.setSlot('skills', i, {icon}));
                DEMO_ITEMS.forEach((icon, i) => state.setSlot('items', i, {icon, count: i + 2}));
                state.startCooldown('skills', 1, 6_000);
                state.startCooldown('items', 0, 12_000);
            }
        };
        const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

        root.__ambreia = {...(root.__ambreia ?? {}), hud: hook};

        return null;
    }
};
