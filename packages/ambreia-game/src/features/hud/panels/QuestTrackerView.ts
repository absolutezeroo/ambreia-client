import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {drawIcon} from '../hudDraw';
import type {IHudPanels} from '../HudPanelsState';
import type {ListCache} from './ListCache';
import {rowsHeight, trackerHeight} from './trackerHeight';

/**
 * The quest tracker (vortex_hud_quest_tracker_xml): a row per tracked quest, as tall as its rows;
 * its minus folds it to its title bar and back, its cross hides it.
 */
export class QuestTrackerView
{
    private _closed = false;
    private _folded = false;

    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits, private readonly _lists: ListCache) {}

    /** Shown while there are quests and the player did not close it. */
    shows(value: Readonly<IHudPanels>): boolean
    {
        return value.quests.length > 0 && !this._closed;
    }

    close(): void
    {
        this._closed = true;
    }

    toggleFold(): void
    {
        this._folded = !this._folded;
    }

    render(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const list = this._lists.rebuild<IItemListWindow>(window, 'quest_list', value.quests);

        if(list)
        {
            for(const quest of value.quests)
            {
                const row = this._windows.buildWidgetLayout('vortex_hud_quest_row_xml') as IWindowContainer | null;

                if(!row) break;

                drawIcon(row, 'quest_icon', quest.icon);
                this._bits.setText(row, 'quest_title', quest.title);
                this._bits.setText(row, 'quest_objective', quest.objective);
                this._bits.setText(row, 'quest_count', quest.count);
                list.addListItem(row);
            }
        }

        this.fit(window);
    }

    /** As tall as its rows (the layout's 180 px fits five), or its title bar alone when folded. */
    private fit(window: IWindowContainer): void
    {
        const list = window.findChildByName('quest_list') as IItemListWindow | null;
        const frame = window.findChildByName('quest_tracker');

        if(!list || !frame) return;

        const rows: number[] = [];

        for(let index = 0; index < list.numListItems; index++) rows.push(list.getListItemAt(index)?.height ?? 0);

        const height = trackerHeight(rows, list.spacing, this._folded);

        list.visible = !this._folded;
        list.height = rowsHeight(rows, list.spacing);
        frame.height = height;
        window.height = height;
    }
}
