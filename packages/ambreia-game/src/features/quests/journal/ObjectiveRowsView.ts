import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IRpgQuestLogEntry} from '@ambreia/protocol/incoming/rpg/quests/IRpgQuestLogEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {objectiveLine} from '../questTexts';

/** A quest's objectives (objective_list), one vortex_quest_objective_row_xml each, checked when met. */
export class ObjectiveRowsView
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    render(list: IItemListWindow, entry: IRpgQuestLogEntry): void
    {
        list.destroyListItems();

        entry.objectives.forEach((line, index) =>
        {
            const row = this._windows.buildWidgetLayout('vortex_quest_objective_row_xml') as IWindowContainer | null;

            if(!row) return;

            this._bits.setText(row, 'label', objectiveLine(this._bits, entry.questId, index, line));
            this._bits.setText(row, 'count', `${line.current}/${line.required}`);
            this._bits.setVisible(row, line.current >= line.required || entry.state === 'done', 'check_icon');
            // No points nor bar on the wire for an objective.
            this._bits.setVisible(row, false, 'progress_slot', 'points');
            list.addListItem(row);
        });
    }
}
