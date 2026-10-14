import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITabContextWindow} from '@ambreia/ui/components/ITabContextWindow';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import {WindowBits} from '../../../ui/kit/WindowBits';
import {buildFrame} from '../../../ui/kit/buildFrame';
import type {IQuestDefinition} from '../definitions/IQuestDefinition';
import {questTitle} from '../questTexts';
import type {JournalTab} from './JournalTab';
import {QuestDetailView} from './QuestDetailView';
import {QuestRowsView} from './QuestRowsView';

const TAB_LAYOUTS: Readonly<Record<JournalTab, string>> = {
    tab_main: 'vortex_quest_tab_active_xml',
    tab_done: 'vortex_quest_tab_done_xml'
};

/**
 * The quest journal (J, vortex_quest_xml, M2a §4.3): the quests under way and the quests done, the
 * selected one in detail, Abandon after a confirmation. This one builds the tabs, keeps the tab and
 * the selection, and routes the events; the rows and the detail are their own units.
 */
export class QuestJournal
{
    private _window: IWindowContainer | null = null;
    private readonly _tabs = new Map<JournalTab, IWindowContainer>();
    private _tab: JournalTab = 'tab_main';
    private _selected: string | null = null;
    private _shown: readonly IRpgQuestLogEntry[] = [];
    private readonly _rows: QuestRowsView;
    private readonly _detail: QuestDetailView;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _log: {active(): readonly IRpgQuestLogEntry[]; done(): readonly IRpgQuestLogEntry[]},
        private readonly _definition: (questId: string) => IQuestDefinition | null,
        private readonly _abandon: (questId: string) => void,
        /** Opened or closed, by J, the bottom bar or its close button. */
        private readonly _visibility: (visible: boolean) => void
    )
    {
        this._rows = new QuestRowsView(_windows, _bits);
        this._detail = new QuestDetailView(_windows, _bits);
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
        this._visibility(true);
    }

    hide(): void
    {
        if(!this._window?.visible) return;

        this._window.visible = false;
        this._visibility(false);
    }

    /** The log changed (or the definitions arrived): what is shown follows. */
    render(): void
    {
        if(!this._window?.visible) return;

        const tab = this._tabs.get(this._tab)!;
        const done = this._tab === 'tab_done';

        this._shown = done ? this._log.done() : this._log.active();
        if(!this._shown.some(entry => entry.questId === this._selected)) this._selected = this._shown[0]?.questId ?? null;

        const list = tab.findChildByName('quest_list') as IItemListWindow | null;

        if(list)
        {
            if(done) this._rows.renderDone(list, this._shown, this._selected, this._onEvent);
            else this._rows.renderActive(list, this._shown, this._selected, this._onEvent);
        }

        if(done) this._bits.setText(tab, 'done_count', this._bits.text('vortex.quest.done.title', 'count', String(this._shown.length)));

        const selected = this._shown.find(entry => entry.questId === this._selected) ?? null;

        this._detail.render(tab, selected, selected ? this._definition(selected.questId) : null, !done);
    }

    private build(): boolean
    {
        if(this._window) return true;

        const window = buildFrame(this._windows, 'vortex_quest_xml', this._onEvent);
        const content = window?.findChildByName('tab_content') as IWindowContainer | null;

        if(!window || !content) return false;

        for(const [tab, layout] of Object.entries(TAB_LAYOUTS) as [JournalTab, string][])
        {
            const built = this._windows.buildWidgetLayout(layout) as IWindowContainer | null;

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
        const tabs = window.findChildByName('tab_context') as ITabContextWindow | null;

        // No side or daily quests yet (M2a): their tabs leave the bar rather than hide, so the
        // selector packs the done tab next to the main one instead of leaving their gap.
        for(const name of ['tab_side', 'tab_daily'])
        {
            const tab = tabs?.getTabItemByName(name);

            if(!tab) continue;

            tabs!.removeTabItem(tab);
            tab.destroy();
        }
        const first = tabs?.getTabItemByName(this._tab);

        if(tabs?.selector && first) tabs.selector.setSelected(first);
        this.showTab();

        return true;
    }

    private showTab(): void
    {
        for(const [name, tab] of this._tabs) tab.visible = name === this._tab;
    }

    private confirmAbandon(questId: string): void
    {
        const title = questTitle(this._bits, questId);

        this._windows.confirm(this._bits.text('vortex.quest.abandon'), this._bits.text('vortex.quest.abandon.confirm', 'quest', title), 0, (dialog, event) =>
        {
            dialog.dispose();
            if(event.type === 'WE_OK') this._abandon(questId);
        });
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_SELECTED')
        {
            const name = window.name === 'tab_context' ? (window as ITabContextWindow).selector?.getSelected()?.name ?? '' : window.name;

            if((name !== 'tab_main' && name !== 'tab_done') || name === this._tab) return;

            this._tab = name;
            this._selected = null;
            this.showTab();
            this.render();

            return;
        }

        if(event.type !== 'WME_CLICK') return;

        const row = WindowBits.ancestor(window, 'quest_row') ?? WindowBits.ancestor(window, 'completed_row');

        if(row)
        {
            this._selected = this._shown[row.id]?.questId ?? this._selected;
            this.render();

            return;
        }

        if(window.name === 'header_button_close') this.hide();
        else if(window.name === 'abandon_button' && this._selected) this.confirmAbandon(this._selected);
    };

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._window?.destroy();
        this._window = null;
        this._tabs.clear();
    }
}
