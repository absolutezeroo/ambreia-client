import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {IRpgDialogueChoice} from '@ambreia/protocol/incoming/rpg/quests/IRpgDialogueChoice';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {choiceIcon} from './choiceIcons';

/** The dialogue's choices (choice_list), one vortex_npc_choice_row_xml each, its id its position. */
export class ChoiceRows
{
    constructor(private readonly _windows: IHabboWindowManager, private readonly _bits: WindowBits) {}

    fill(list: IItemListWindow, choices: readonly IRpgDialogueChoice[], procedure: (event: WindowEvent, window: IWindow) => void): void
    {
        list.destroyListItems();

        choices.forEach((choice, position) =>
        {
            const row = this._windows.buildWidgetLayout('vortex_npc_choice_row_xml') as IWindowContainer | null;

            if(!row) return;

            row.id = position;
            this._bits.setText(row, 'choice_txt', this._bits.textOr(choice.text, choice.text));
            this._bits.setVisible(row, false, 'selected');

            const icon = row.findChildByName('choice_icon') as IStaticBitmapWrapperWindow | null;

            if(icon) icon.assetUri = choiceIcon(choice.kind);
            // A list answers its items' events itself: the row carries the window's.
            row.procedure = procedure;
            list.addListItem(row);
        });
    }
}
