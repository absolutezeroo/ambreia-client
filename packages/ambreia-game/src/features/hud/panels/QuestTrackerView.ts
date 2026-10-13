import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {drawIcon} from '../hudDraw';
import type {IHudPanels} from '../HudPanelsState';
import type {ListCache} from './ListCache';

/** The quest tracker (vortex_hud_quest_tracker_xml): a row per tracked quest; its cross hides it. */
export class QuestTrackerView
{
    private _closed = false;

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

    render(window: IWindowContainer, value: Readonly<IHudPanels>): void
    {
        const list = this._lists.rebuild<IItemListWindow>(window, 'quest_list', value.quests);

        if(!list) return;

        for(const quest of value.quests)
        {
            const row = this._windows.buildWidgetLayout('vortex_hud_quest_row_xml') as IWindowContainer | null;

            if(!row) return;

            drawIcon(row, 'quest_icon', quest.icon);
            this._bits.setText(row, 'quest_title', quest.title);
            this._bits.setText(row, 'quest_objective', quest.objective);
            this._bits.setText(row, 'quest_count', quest.count);
            list.addListItem(row);
        }
    }
}
