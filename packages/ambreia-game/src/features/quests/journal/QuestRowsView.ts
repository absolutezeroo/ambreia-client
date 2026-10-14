import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {objectiveIcon, QUEST_READY_ICON} from '../objectiveIcons';
import {questTitle} from '../questTexts';

const SELECTED = 0xffcfe3f4;
const IDLE = 0xfff2f2ec;

/** The journal's quest lists: a vortex_quest_row_xml per quest under way, a vortex_quest_completed_row_xml per quest done; a row's id is its index. */
export class QuestRowsView
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    renderActive(list: IItemListWindow, entries: readonly IRpgQuestLogEntry[], selectedId: string | null, procedure: (event: WindowEvent, window: IWindow) => void): void
    {
        list.destroyListItems();
        if(entries.length === 0) this.empty(list, 'vortex.quest.empty.active');

        entries.forEach((entry, index) =>
        {
            const row = this._windows.buildWidgetLayout('vortex_quest_row_xml') as IWindowContainer | null;

            if(!row) return;

            const ready = entry.state === 'ready';
            const icon = row.findChildByName('quest_icon') as IStaticBitmapWrapperWindow | null;

            row.id = index;
            row.color = entry.questId === selectedId ? SELECTED : IDLE;
            if(icon) icon.assetUri = ready ? QUEST_READY_ICON : objectiveIcon(entry.objectives.find(o => o.current < o.required)?.kind ?? '');
            this._bits.setText(row, 'quest_title', questTitle(this._bits, entry.questId));
            this._bits.setText(row, 'quest_subtitle', ready ? this._bits.text('vortex.quest.ready') : '');
            this._bits.setVisible(row, false, 'selected', 'lock_icon', 'track_button');
            this._bits.setVisible(row, ready, 'turn_in_badge');
            row.procedure = procedure;
            list.addListItem(row);
        });
    }

    renderDone(list: IItemListWindow, entries: readonly IRpgQuestLogEntry[], selectedId: string | null, procedure: (event: WindowEvent, window: IWindow) => void): void
    {
        list.destroyListItems();
        if(entries.length === 0) this.empty(list, 'vortex.quest.empty.done');

        entries.forEach((entry, index) =>
        {
            const row = this._windows.buildWidgetLayout('vortex_quest_completed_row_xml') as IWindowContainer | null;

            if(!row) return;

            row.id = index;
            row.color = entry.questId === selectedId ? SELECTED : IDLE;
            this._bits.setText(row, 'quest_title', questTitle(this._bits, entry.questId));
            // No region nor date on the wire yet.
            this._bits.setText(row, 'quest_region', '');
            this._bits.setText(row, 'completed_date', '');
            this._bits.setVisible(row, false, 'selected');
            row.procedure = procedure;
            list.addListItem(row);
        });
    }

    /** An empty tab says so (vortex_ui_empty_state_xml) rather than showing a blank list. */
    private empty(list: IItemListWindow, key: string): void
    {
        const message = this._windows.buildWidgetLayout('vortex_ui_empty_state_xml') as IWindowContainer | null;

        if(!message) return;

        const icon = message.findChildByName('empty_icon') as IStaticBitmapWrapperWindow | null;

        message.width = list.width;
        // The quest scroll the tracker shows, not the layout's eye.
        if(icon) icon.assetUri = 'rpg/ui-icons/tools_crafting_writing_parchment_scroll_document_icon';
        this._bits.setText(message, 'empty_message', this._bits.text(key));
        list.addListItem(message);
    }
}
