import {Logger} from '@ambreia/common/utils/Logger';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '../../localization/IHabboLocalizationManager';
import {WindowBits} from '../../ui/kit/WindowBits';
import {HudTooltips} from '../../ui/kit/HudTooltips';
import {ChatPanel} from './chat/ChatPanel';
import {HudMenu} from './HudMenu';
import {HudNavMenus} from './HudNavMenus';
import type {HudPanelsState, IHudPanels} from './HudPanelsState';
import {LAYER} from './hudLayout';
import {EffectIcons} from './panels/EffectIcons';
import type {HudPanel} from './panels/HudPanel';
import {HudPanelTips} from './panels/HudPanelTips';
import {layOutPanels} from './panels/layOutPanels';
import {ListCache} from './panels/ListCache';
import {PartyFramesView} from './panels/PartyFramesView';
import {QuestTrackerView} from './panels/QuestTrackerView';
import {TargetOfTargetView} from './panels/TargetOfTargetView';
import {UnitFrameView} from './panels/UnitFrameView';
import {PopupSlot} from './PopupSlot';

const log = Logger.getLogger('habbo.features.hud.HudPanelsView');

const LAYOUTS: Readonly<Record<HudPanel, string>> = {
    location: 'vortex_hud_location_xml',
    quests: 'vortex_hud_quest_tracker_xml',
    party: 'vortex_hud_party_xml',
    buffs: 'vortex_hud_buffs_xml',
    target: 'vortex_hud_target_xml',
    targetOfTarget: 'vortex_hud_target_compact_xml',
    boss: 'vortex_hud_boss_xml',
    alert: 'vortex_hud_alert_xml',
    chat: 'vortex_hud_chat_xml'
};

/**
 * Everything of the HUD around the player frame and the bottom bar (HudView): place, quest
 * tracker, party, the player's effects, target with its cast and its target, boss, warning and
 * chat, from the mock-ups in vortex-layouts/vortex_hud_* (mockup/glaze/states_hud.png,
 * states_combat.png). This one builds the panels, shows each while its part of HudPanelsState has
 * something and routes their events; each panel's drawing is its own class (panels/, chat/).
 */
export class HudPanelsView
{
    private readonly _panels = new Map<HudPanel, IWindowContainer>();
    private readonly _bits: WindowBits;
    private readonly _lists = new ListCache();
    /** The HUD's popups (its menus, the chat's emoticons and settings): one open at a time. */
    private readonly _popups = new PopupSlot();
    private readonly _menus: HudNavMenus;
    private readonly _chat: ChatPanel;
    private readonly _effects: EffectIcons;
    private readonly _quests: QuestTrackerView;
    private readonly _party: PartyFramesView;
    private readonly _units: UnitFrameView;
    private readonly _targetOfTarget: TargetOfTargetView;
    private readonly _tips: HudTooltips;
    private readonly _describe: HudPanelTips;
    private _disposed = false;

    private readonly _onChange = (value: Readonly<IHudPanels>): void => this.render(value);
    private readonly _onResize = (): void => this.place();

    /**
     * @param onChat - called with what the player typed in the chat (Enter)
     * @param onPlaced - called after every layout: the bottom bar is laid out against the chat and the target
     * @param onNav - a menu entry asks for a window (`nav_inventory`), as the bar's buttons do
     */
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _state: HudPanelsState,
        localization: IHabboLocalizationManager | null,
        onChat: (text: string) => void,
        private readonly _onPlaced: () => void,
        onNav: (name: string) => void
    )
    {
        const bits = this._bits = new WindowBits(localization);
        const menu = new HudMenu(_windows, bits, this._popups, LAYER);

        this._menus = new HudNavMenus(menu, bits, onNav);
        this._chat = new ChatPanel(_windows, bits, _state, menu, this._popups, LAYER, onChat);
        this._effects = new EffectIcons(_windows, bits, this._lists);
        this._quests = new QuestTrackerView(_windows, bits, this._lists);
        this._party = new PartyFramesView(_windows, bits, _state, this._lists, this._effects);
        this._units = new UnitFrameView(bits, this._effects);
        this._targetOfTarget = new TargetOfTargetView(bits);
        this._tips = new HudTooltips(_windows, LAYER);
        this._describe = new HudPanelTips(bits, this._effects, this._party);
    }

    show(): void
    {
        if(this._disposed || !this.build()) return;

        this._state.events.on('changed', this._onChange);
        this.render(this._state.value);
    }

    hide(): void
    {
        this._state.events.off('changed', this._onChange);
        this._popups.close();
        this._tips.out();

        for(const panel of this._panels.values()) panel.visible = false;
    }

    /** The « plus » menu of the bottom bar (HudView hands its button here). */
    moreMenu(anchor: IWindow): void
    {
        this._menus.more(anchor);
    }

    /** Builds every panel once; false (said once) when one of the layouts is missing. */
    private build(): boolean
    {
        if(this._panels.size > 0) return true;

        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;
        const missing: string[] = [];

        for(const [panel, layout] of Object.entries(LAYOUTS) as [HudPanel, string][])
        {
            const window = this._windows.buildWidgetLayout(layout, LAYER) as IWindowContainer | null;

            if(window) this._panels.set(panel, window);
            else missing.push(layout);
        }

        if(!desktop || missing.length > 0)
        {
            log.warn(`HUD layouts missing (${missing.join(', ') || 'no desktop'}): no HUD panels`);

            for(const window of this._panels.values()) window.destroy();
            this._panels.clear();

            return false;
        }

        for(const window of this._panels.values())
        {
            window.visible = false;
            window.procedure = this._onEvent;
            desktop.addChild(window);
        }

        this._panels.get('location')!.addEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);

        return true;
    }

    private place(): void
    {
        const desktop = this._windows.getDesktop(LAYER) as IWindowContainer | null;

        if(!desktop || this._panels.size === 0) return;

        layOutPanels(desktop, this._panels);
        this._onPlaced();
    }

    private render(value: Readonly<IHudPanels>): void
    {
        const panel = (name: HudPanel): IWindowContainer => this._panels.get(name)!;
        const show = (name: HudPanel, visible: boolean): boolean => (panel(name).visible = visible);

        if(show('location', value.zoneName !== '' || value.zonePlayers !== null))
        {
            this._bits.setText(panel('location'), 'zone_name', value.zoneName);
            this._bits.setText(panel('location'), 'zone_players', value.zonePlayers === null ? '' : this._bits.text('vortex.hud.players_here', 'count', String(value.zonePlayers)));
        }

        if(show('quests', this._quests.shows(value))) this._quests.render(panel('quests'), value);
        if(show('party', value.party.length > 0)) this._party.render(panel('party'), value);
        // Always there: the + button opens the upgrades menu.
        show('buffs', true);
        this._effects.fill(panel('buffs'), 'buff_grid', value.buffs, 'buffs', value.buffTimes, value.buffExpiring, value.buffTips);
        if(show('boss', value.boss !== null)) this._units.render(panel('boss'), 'boss', value.boss!);
        if(show('alert', value.alert !== null)) this._bits.setText(panel('alert'), 'alert_txt', value.alert!);
        if(show('target', value.target !== null)) this._units.render(panel('target'), 'target', value.target!);
        if(show('targetOfTarget', value.target !== null && value.targetOfTarget !== null)) this._targetOfTarget.render(panel('targetOfTarget'), value.targetOfTarget!);

        show('chat', true);
        this._chat.render(panel('chat'), value);

        // After the visibilities: the right column and the warning stack under what is shown.
        this.place();
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(this._tips.handle(event, () => this._describe.describe(window))) return;
        if(this._chat.onEvent(event, window)) return;
        if(event.type !== 'WME_CLICK') return;

        if(WindowBits.ancestor(window, 'close_button') && WindowBits.ancestor(window, 'hud_target'))
        {
            this._state.update({target: null, partySelected: null});

            return;
        }

        if(WindowBits.ancestor(window, 'close_button') && WindowBits.ancestor(window, 'hud_quest_tracker'))
        {
            this._quests.close();
            this.render(this._state.value);

            return;
        }

        const plus = WindowBits.ancestor(window, 'buff_add_button');

        if(plus)
        {
            this._menus.plus(plus);

            return;
        }

        const member = this._party.memberAt(window);

        if(member)
        {
            this._party.select(member);

            return;
        }

        log.debug(`HUD: ${window.name} has nothing to open yet`);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.hide();
        this._chat.dispose();
        this._tips.dispose();
        this._panels.get('location')?.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this._onResize);

        for(const window of this._panels.values()) window.destroy();

        this._panels.clear();
        this._lists.clear();
        this._party.clear();
    }
}
