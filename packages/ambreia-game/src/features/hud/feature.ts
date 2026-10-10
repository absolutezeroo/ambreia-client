import {RoomSessionEvent} from '../../session/events/RoomSessionEvent';
import {RoomSessionUserDataUpdateEvent} from '../../session/events/RoomSessionUserDataUpdateEvent';
import {UserDataType} from '../../session/UserData';
import type {IGameFeature} from '../GameFeature';
import {HudView} from './HudView';
import {HudPanelsView} from './HudPanelsView';
import {PlayerHudState} from './PlayerHudState';
import {HudPanelsState, type IChatLine} from './HudPanelsState';
import {bindCharacterToHud} from './CharacterHudBridge';
import {ChatPanel} from './ChatPanel';
import {CHAT_ICONS, loadChatSettings} from './chatModel';
import {WindowBits} from '../character/WindowBits';

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
    images: [...CHAT_ICONS, ...DEMO_SKILLS, ...DEMO_ITEMS, ...DEMO_QUESTS, ...DEMO_BUFFS, ...DEMO_DEBUFFS, DEMO_BOSS],
    requires: ['character', 'roomSession'],
    create: ({host, scope}) =>
    {
        const state = new PlayerHudState();
        const panels = new HudPanelsState();

        host.made.hud = panels;
        host.made.hudPlayer = state;
        // The chat settings the player chose on this browser (the cog).
        panels.update({chatSettings: loadChatSettings(ChatPanel.storage())});
        let view: HudView | null = null;
        let panelsView: HudPanelsView | null = null;

        // What is typed goes to the chat feature (F3c), which sends it; the server's copy comes back as a line.
        const chat = (message: string): void => void panels.events.emit('say', message);
        // The camera button: the canvas as it is, saved as a PNG by the browser.
        const screenshot = (): void =>
        {
            const canvas = globalThis.document?.getElementById('vortex-canvas') as HTMLCanvasElement | null;

            canvas?.toBlob(blob =>
            {
                if(!blob) return;

                const link = document.createElement('a');

                link.href = URL.createObjectURL(blob);
                link.download = `ambreia-${Date.now()}.png`;
                link.click();
                URL.revokeObjectURL(link.href);
            });
        };

        const show = (): void =>
        {
            const windows = host.made.windowManager;

            if(!windows) return;

            // The panels first: the chat and the target are laid out above the bottom bar.
            const nav = (name: string): void => void panels.events.emit('nav', name);

            panelsView ??= new HudPanelsView(windows, panels, host.made.localization, chat, () => view?.relayout(), nav);
            view ??= new HudView(windows, state, new WindowBits(host.made.localization), {nav, more: anchor => panelsView?.moreMenu(anchor), screenshot});
            // The played character's name and figure (F3a); the session data's only without a character list.
            const played = host.made.character?.played ?? null;

            state.update({name: played?.name ?? host.made.sessionData?.userName ?? '', figure: played?.figure ?? host.made.sessionData?.figure ?? ''});
            panelsView.show();
            view.show();
            view.setNav(panels.value.navOpen, panels.value.questAlert);
        };
        const hide = (): void =>
        {
            view?.hide();
            panelsView?.hide();
        };
        const countPlayers = (event: RoomSessionEvent): void =>
            panels.update({zonePlayers: event.session.userDataManager.getUserCount(UserDataType.USER)});

        // The played character fills the HUD (F3a): level, XP, and the bars' maxima.
        if(host.made.character) scope.add(bindCharacterToHud(host.made.character, state));
        // The bottom bar marks the button whose window is open, and the quests one with its « ! ».
        scope.bind(panels.events)('changed', value => view?.setNav(value.navOpen, value.questAlert));

        const sessionOn = scope.bind(host.made.roomSession?.sessionEvents);

        sessionOn(RoomSessionEvent.RSE_STARTED, show);
        sessionOn(RoomSessionEvent.RSE_ENDED, hide);
        sessionOn(RoomSessionUserDataUpdateEvent.RSUDUE_USER_DATA_UPDATE, countPlayers);
        scope.add(() =>
        {
            view?.dispose();
            panelsView?.dispose();
            view = null;
            panelsView = null;
            panels.events.removeAllListeners();
            state.events.removeAllListeners();
        });

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
        scope.hook('hud', hook);

        return null;
    }
};
