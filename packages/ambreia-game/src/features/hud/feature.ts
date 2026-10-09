import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import {RoomSessionUserDataUpdateEvent} from '../../session/events/RoomSessionUserDataUpdateEvent';
import {UserDataType} from '../../session/UserData';
import type {IGameFeature} from '../GameFeature';
import {HudView} from './HudView';
import {HudPanelsView} from './HudPanelsView';
import {PlayerHudState} from './PlayerHudState';
import {HudPanelsState, type IChatLine} from './HudPanelsState';
import {bindCharacterToHud} from './CharacterHudBridge';

// The demo's icons: read by name (static_bitmap asset_uri set at run time), so declared to be
// decoded at load (IGameFeature.images). The server's skills, quests and effects will come with
// their own lists.
const DEMO_SKILLS = [1, 2, 3, 4].map(i => `rpg/skills/warrior_skill_icon_${i}`);
const DEMO_ITEMS = ['rpg/consumables-potions/icon_00', 'rpg/consumables-potions/icon_01', 'rpg/consumables-potions/icon_02', 'rpg/consumables-potions/icon_03'];
const DEMO_QUESTS = ['rpg/materials/icon_00', 'rpg/materials/icon_01', 'rpg/gems-materials/icon_00'];
const DEMO_BUFFS = ['rpg/status-effects/icon_00', 'rpg/status-effects/icon_01', 'rpg/status-effects/icon_02', 'rpg/status-effects/icon_03'];
const DEMO_DEBUFFS = ['rpg/status-effects/icon_10', 'rpg/status-effects/icon_11', 'rpg/status-effects/icon_12'];
const DEMO_BOSS = 'rpg/dungeon-objects/icon_00';

/** What `globalThis.__ambreia.hud` offers until the server sends the player's stats (RPG network, F3). */
export interface IHudDevHook
{
    state: PlayerHudState;
    panels: HudPanelsState;
    show(): void;
    hide(): void;
    /** Sample values everywhere (mockup/glaze/hud_*.png), to see the whole HUD. */
    demo(): void;
    /** Where the HUD windows are (null before the first show). */
    inspect(): Record<string, unknown> | null;
}

const clock = (date: Date): string => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/**
 * The player's HUD (RPG spec §16.3, the mock-ups in vortex-layouts/vortex_hud_*): the player frame
 * and the action bar (HudView), and around them the top bar, place, quests, party, effects,
 * target, boss and chat (HudPanelsView), shown while in a room. What the server sends fills it: the
 * played character (CharacterHudBridge) and the room's player count. The rest has no message yet;
 * the dev hook `__ambreia.hud.demo()` fills it meanwhile, and a panel with nothing stays hidden.
 */
export const HudFeature: IGameFeature = {
    id: 'hud',
    images: [...DEMO_SKILLS, ...DEMO_ITEMS, ...DEMO_QUESTS, ...DEMO_BUFFS, ...DEMO_DEBUFFS, DEMO_BOSS],
    create: ({host}) =>
    {
        const state = new PlayerHudState();
        const panels = new HudPanelsState();

        host.made.hud = panels;
        let view: HudView | null = null;
        let panelsView: HudPanelsView | null = null;

        // No chat message exists on the wire yet (RPG network, F3): what is typed shows here only.
        const chat = (message: string): void => panels.addChatLine({time: clock(new Date()), channel: 'general', author: state.value.name, message});

        const show = (): void =>
        {
            const windows = host.made.windowManager;

            if(!windows) return;

            // The panels first: the frame and the bar are laid out around the top bar and the chat.
            panelsView ??= new HudPanelsView(windows, panels, host.made.localization, chat, () => view?.relayout());
            view ??= new HudView(windows, state);
            state.update({name: host.made.sessionData?.userName ?? '', figure: host.made.sessionData?.figure ?? ''});
            panelsView.show();
            view.show();
        };
        const hide = (): void =>
        {
            view?.hide();
            panelsView?.hide();
        };
        const countPlayers = (event: RoomSessionEvent): void =>
            panels.update({zonePlayers: event.session.userDataManager.getUserCount(UserDataType.USER)});

        // The played character fills the HUD (F3a): level, XP, and the bars' maxima.
        if(host.made.character) bindCharacterToHud(host.made.character, state);

        const sessionEvents = host.made.roomSession?.sessionEvents;

        sessionEvents?.on(RoomSessionEvent.RSE_STARTED, show);
        sessionEvents?.on(RoomSessionEvent.RSE_ENDED, hide);
        sessionEvents?.on(RoomSessionUserDataUpdateEvent.RSUDUE_USER_DATA_UPDATE, countPlayers);

        const hook: IHudDevHook = {
            state,
            panels,
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

                const figure = state.value.figure;
                const now = new Date();
                const line = (minutesAgo: number, channel: IChatLine['channel'], author: string, message: string): IChatLine =>
                    ({time: clock(new Date(now.getTime() - minutesAgo * 60_000)), channel, author, message});
                const boss = {name: 'Gorzug le Brise-crâne', portrait: DEMO_BOSS, level: 35, info: 'Niv. 35 · Boss', hp: 38_520, hpMax: 52_000, debuffs: DEMO_DEBUFFS};

                panels.update({
                    gold: 12_450, gems: 120, tokens: 0, questAlert: true,
                    zoneName: 'Ville d\'Ambre',
                    quests: [
                        {icon: DEMO_QUESTS[0], title: 'Un nouveau départ', objective: 'Parler à l\'intendant de la ville', count: '0 / 1'},
                        {icon: DEMO_QUESTS[1], title: 'Ressources locales', objective: 'Collecter 5 Bois d\'Ambre', count: '2 / 5'},
                        {icon: DEMO_QUESTS[2], title: 'Un forgeron occupé', objective: 'Rapporter 10 Minerais de Fer', count: '0 / 10'}
                    ],
                    party: [
                        {name: 'Marek', figure, level: 32, hp: 1650, hpMax: 1650, buffs: DEMO_BUFFS.slice(0, 3), dead: false},
                        {name: 'Léa', figure, level: 32, hp: 980, hpMax: 980, buffs: DEMO_BUFFS.slice(1, 4), dead: false},
                        {name: 'Aiko', figure, level: 32, hp: 420, hpMax: 1120, buffs: DEMO_BUFFS.slice(0, 2), dead: false},
                        {name: 'Sofia', figure, level: 32, hp: 0, hpMax: 1010, buffs: [], dead: true}
                    ],
                    buffs: DEMO_BUFFS,
                    boss,
                    alert: 'Frappe sismique dans 3 seconde(s) !',
                    target: {...boss, cast: {icon: DEMO_SKILLS[0], name: 'Frappe sismique', elapsed: 3, duration: 4}},
                    chat: [
                        line(3, 'general', 'Léo', 'quelqu\'un pour donjon ?'),
                        line(2, 'guild', 'Aiko', 'go !'),
                        line(2, 'system', '', 'Vous avez collecté 1 Bois d\'Ambre.'),
                        line(1, 'general', 'Marek', 'vend [Minerai de Fer] x10'),
                        line(0, 'system', '', 'Nouvelle quête : Un nouveau départ'),
                        line(0, 'guild', 'Naya', 'quelqu\'un pour HC ?')
                    ]
                });
            }
        };
        const root = globalThis as unknown as {__ambreia?: Record<string, unknown>};

        root.__ambreia = {...(root.__ambreia ?? {}), hud: hook};

        return null;
    }
};
