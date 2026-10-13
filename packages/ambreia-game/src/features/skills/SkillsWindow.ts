import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IDropMenuWindow} from '@ambreia/ui/components/IDropMenuWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {WindowBits} from '../../ui/kit/WindowBits';
import {buildFrame} from '../../ui/kit/buildFrame';
import type {RpgSkillSession} from './RpgSkillSession';
import {ActiveTabView} from './window/ActiveTabView';
import {EmptyTabs} from './window/EmptyTabs';
import {ShortcutsTabView} from './window/ShortcutsTabView';
import {SkillBarEditor} from './window/SkillBarEditor';
import {BAR_KEYS, SkillBarSlots} from './window/SkillBarSlots';
import {SkillCatalog} from './window/SkillCatalog';
import {SkillDrag} from './window/SkillDrag';
import {SkillDraw} from './window/SkillDraw';
import {SkillPicks} from './window/SkillPicks';
import {filterKey, SKILL_FILTERS} from './window/skillTags';

export {SKILL_WINDOW_IMAGES} from './window/skillStatLines';

type SkillsTab = 'tab_active' | 'tab_passive' | 'tab_specs' | 'tab_shortcuts';

const TABS: readonly SkillsTab[] = ['tab_active', 'tab_passive', 'tab_specs', 'tab_shortcuts'];

const TAB_LAYOUTS: Readonly<Record<SkillsTab, string>> = {
    tab_active: 'vortex_skill_tab_active_xml',
    tab_passive: 'vortex_skill_tab_passive_xml',
    tab_specs: 'vortex_skill_tab_specs_xml',
    tab_shortcuts: 'vortex_skill_tab_shortcuts_xml'
};

/** The extra shortcuts of skills_shortcuts.png. */
const EXTRA_KEYS = ['Q', 'E', 'R'];

/**
 * The skills window (K, vortex_skill_xml), as mockup/glaze/skills_*.png draws it, whole.
 * « Actives »: the class's skills as tiles, filter and search, the selected one's details, the
 * action bar. « Raccourcis »: the learned skills, the main bar, the extra shortcuts, the selected
 * slot's details and the bar's management. A skill dragged (or chosen, then a slot clicked) onto a
 * slot goes there: an RpgActionBarSet, and the window follows the RpgSkills that comes back.
 * This one builds the tabs, keeps the selection, tab, filter and search, and routes the events;
 * each part is its own class (window/).
 *
 * What M1b has no data for is drawn in its empty or maximum state (states_skills.png) and does
 * nothing: each skill has one rank (« Niveau 1 / 1 », « Niveau maximum atteint »), there are no
 * passives nor specialisations, slots 7–8 and Q/E/R wait for the consumables, the settings are off.
 */
export class SkillsWindow
{
    private _window: IWindowContainer | null = null;
    private readonly _tabs = new Map<SkillsTab, IWindowContainer>();
    private _tab: SkillsTab = 'tab_active';
    private _header: IWindowContainer | null = null;
    private _selected: string | null = null;
    private readonly _draw: SkillDraw;
    private readonly _picks = new SkillPicks();
    private readonly _catalog: SkillCatalog;
    private readonly _editor: SkillBarEditor;
    private readonly _bars: SkillBarSlots;
    private readonly _active: ActiveTabView;
    private readonly _shortcuts: ShortcutsTabView;
    private readonly _drag: SkillDrag;
    private _disposed = false;

    private readonly _onSkills = (): void => this.render();

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _session: RpgSkillSession,
        /** The played character's class: which skills it has and will have. */
        private readonly _classId: () => string
    )
    {
        this._draw = new SkillDraw(_bits, _session);
        this._catalog = new SkillCatalog(_session, skillId => this._draw.name(skillId));
        this._editor = new SkillBarEditor(_session);
        this._bars = new SkillBarSlots(_windows, _bits, this._draw, this._onEvent);
        this._active = new ActiveTabView(_windows, _bits, _session, this._draw, this._picks, this._onEvent);
        this._shortcuts = new ShortcutsTabView(_windows, _bits, this._draw, this._picks, this._onEvent);
        this._drag = new SkillDrag(_windows, _bits, this._draw, () => this._window?.parent as IWindowContainer | null, (skillId, x, y) =>
        {
            const slot = this._bars.slotAt(this._tab, x, y);

            if(slot >= 0) this._editor.drop(slot, skillId);
        });
        _session.events.on('skills', this._onSkills);
    }

    get visible(): boolean
    {
        return this._window?.visible ?? false;
    }

    toggle(): void
    {
        if(this.visible) this.hide();
        else this.show();
    }

    show(): void
    {
        if(this._disposed || !this.build()) return;

        this._window!.visible = true;
        this._window!.activate();
        this.render();
    }

    hide(): void
    {
        this._drag.end();
        if(this._window) this._window.visible = false;
    }

    /** The definitions arrived: the stats and the locked skills follow. */
    refresh(): void
    {
        this.render();
    }

    private build(): boolean
    {
        if(this._window) return true;

        const window = buildFrame(this._windows, 'vortex_skill_xml', this._onEvent);
        const content = window?.findChildByName('tab_content') as IWindowContainer | null;

        if(!window || !content) return false;

        for(const tab of TABS)
        {
            const built = this._windows.buildWidgetLayout(TAB_LAYOUTS[tab]) as IWindowContainer | null;

            if(!built)
            {
                window.destroy();
                this._tabs.clear();

                return false;
            }

            this._tabs.set(tab, built);
            content.addChild(built);
        }

        this._window = window;

        const tab = (name: SkillsTab): IWindowContainer => this._tabs.get(name)!;
        const empty = new EmptyTabs(this._windows, this._bits);

        this._header = this.addHeader('tab_active');
        empty.passives(tab('tab_passive'), this.addHeader('tab_passive'));
        empty.specs(tab('tab_specs'), this.addHeader('tab_specs'));
        this.buildFilters();
        this._bars.build('tab_active', tab('tab_active'), 'action_bar_slots', BAR_KEYS);
        this._bars.build('tab_shortcuts', tab('tab_shortcuts'), 'main_bar_slots', BAR_KEYS);
        this._bars.build('tab_shortcuts', tab('tab_shortcuts'), 'extra_slots', EXTRA_KEYS);
        this._active.build(tab('tab_active'));
        this._shortcuts.build(tab('tab_shortcuts'));

        const tabs = window.findChildByName('tab_context') as ITabContextWindow | null;
        const first = tabs?.getTabItemByName(this._tab);

        if(tabs?.selector && first) tabs.selector.setSelected(first);
        this.showTab();

        return true;
    }

    /** A vortex_skill_header_xml in the tab's skill_header_slot. */
    private addHeader(tab: SkillsTab): IWindowContainer | null
    {
        const slot = this._tabs.get(tab)?.findChildByName('skill_header_slot') as IWindowContainer | null;
        const header = slot ? this._windows.buildWidgetLayout('vortex_skill_header_xml') as IWindowContainer | null : null;

        if(slot && header) slot.addChild(header);

        return header;
    }

    private buildFilters(): void
    {
        const menus = [...this._tabs.values()].map(tab => tab.findChildByName('type_filter') as IDropMenuWindow | null);

        // All filled before any is set: setting one tells the others (onSelected()).
        for(const menu of menus) menu?.populate(SKILL_FILTERS.map(filter => this._bits.text(filterKey(filter))));
        for(const menu of menus) if(menu) menu.selection = 0;
    }

    private showTab(): void
    {
        for(const [name, tab] of this._tabs) tab.visible = name === this._tab;
    }

    private render(): void
    {
        if(!this._window?.visible) return;

        const entries = this._catalog.entries(this._classId());
        const slot = this._editor.slot;

        if(this._selected === null || !entries.some(entry => entry.skillId === this._selected)) this._selected = entries[0]?.skillId ?? null;

        this._picks.clear();
        this._active.render(this._tabs.get('tab_active')!, this._header, entries, this._selected);
        this._shortcuts.render(this._tabs.get('tab_shortcuts')!, entries.filter(entry => entry.learned), this._selected, slot, this._editor.skillAt(slot));
        this._bars.render(this._session.bar, 'tab_shortcuts', slot);
    }

    private onSelected(window: IWindow): void
    {
        // From the tab button or from its context, depending on who dispatches it.
        const name = window.name === 'tab_context' ? (window as ITabContextWindow).selector?.getSelected()?.name ?? '' : window.name;

        if(TABS.includes(name as SkillsTab) && name !== this._tab)
        {
            this._tab = name as SkillsTab;
            this.showTab();
            this.render();

            return;
        }

        if(window.name !== 'type_filter') return;

        const selection = (window as IDropMenuWindow).selection;

        this._catalog.filter = SKILL_FILTERS[selection] ?? null;

        // Every tab's menu says the same.
        for(const tab of this._tabs.values())
        {
            const menu = tab.findChildByName('type_filter') as IDropMenuWindow | null;

            // Only on a change: the other menus' own events come back here.
            if(menu && menu !== window && menu.selection !== selection && selection < menu.numMenuItems) menu.selection = selection;
        }

        this.render();
    }

    private onSearch(event: WindowEvent, input: ITextFieldWindow): void
    {
        const placeholder = this._bits.text('vortex.skill.search');

        // The field opens with its placeholder as its text: a click clears it, left empty it comes back.
        if(event.type === 'WME_CLICK' && input.text === placeholder) input.text = '';
        else if(event.type === 'WE_UNFOCUSED' && input.text.trim() === '') input.text = placeholder;
        else if(event.type === 'WKE_KEY_UP')
        {
            this._catalog.search = input.text.trim().toLowerCase();
            this.render();
        }
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_SELECTED')
        {
            this.onSelected(window);

            return;
        }

        if(window.name === 'search_input')
        {
            this.onSearch(event, window as ITextFieldWindow);

            return;
        }

        // A learned skill pressed may be dragged; its release, over a slot or not, ends the drag.
        if(event.type === 'WME_DOWN' || event.type === 'WME_UP' || event.type === 'WME_UP_OUTSIDE')
        {
            const mouse = event as WindowMouseEvent;
            const skillId = this._picks.of(window);

            if(event.type !== 'WME_DOWN') this._drag.release(mouse.stageX, mouse.stageY);
            else if(skillId !== null && this._session.known.includes(skillId)) this._drag.start(skillId, mouse.stageX, mouse.stageY);

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        switch(window.name)
        {
            case 'header_button_close': this.hide(); return;
            case 'reset_bar_button':
            case 'reset_shortcuts_button':
            case 'restore_defaults_button': this._editor.restoreDefaults(); return;
            case 'clear_all_button': this._editor.clearAll(); return;
            case 'unassign_button': this._editor.unassign(); return;
        }

        const skillId = this._picks.of(window);

        if(skillId !== null)
        {
            this._selected = skillId;
            this.render();

            return;
        }

        const slot = this._bars.slotOf(this._tab, window);

        if(slot >= 0 && this._editor.click(slot, this._selected, this._tab === 'tab_shortcuts')) this.render();
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._drag.end();
        this._session.events.off('skills', this._onSkills);
        this._window?.destroy();
        this._window = this._header = null;
        this._tabs.clear();
        this._picks.clear();
        this._bars.clear();
    }
}
