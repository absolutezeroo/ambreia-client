import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IRpgCharacterListEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgCharacterListEntry';
import type {IHabboWindowManager} from '../../../window/IHabboWindowManager';
import type {WindowBits} from '../../../ui/kit/WindowBits';

const SELECTED = 0xffcfe3f4;
const IDLE = 0xfff2f2ec;

/** The account's characters (character_list), one vortex_character_select_row_xml each, the selected one lit. */
export class CharacterListView
{
    constructor(
        private readonly _windows: IHabboWindowManager,
        private readonly _bits: WindowBits,
        private readonly _className: (entry: IRpgCharacterListEntry) => string,
        private readonly _procedure: (event: WindowEvent, window: IWindow) => void
    ) {}

    render(window: IWindowContainer, characters: readonly IRpgCharacterListEntry[], selectedId: number): void
    {
        const rows = window.findChildByName('character_list') as IItemListWindow | null;

        if(!rows) return;

        rows.destroyListItems();

        for(const entry of characters)
        {
            const row = this._windows.buildWidgetLayout('vortex_character_select_row_xml') as IWindowContainer | null;

            if(!row) break;

            row.id = entry.playerId;
            row.color = entry.playerId === selectedId ? SELECTED : IDLE;
            this._bits.avatar(row, 'avatar_image', entry.figure, 2, true);
            this._bits.setText(row, 'character_name', entry.name);
            this._bits.setText(row, 'character_level', this._bits.text('vortex.ui.level.long', 'level', String(entry.level)));
            this._bits.setText(row, 'character_class', ` · ${this._className(entry)}`);
            this._bits.setText(row, 'character_zone', '');
            this._bits.setVisible(row, false, 'delete_button');
            (row.findChildByName('character_line') as IItemListWindow | null)?.arrangeListItems();
            // A scrollable list answers its items' events itself: the row carries the screen's.
            row.procedure = this._procedure;
            rows.addListItem(row);
        }
    }

    highlight(window: IWindowContainer, selectedId: number): void
    {
        const rows = window.findChildByName('character_list') as IItemListWindow | null;

        for(let i = 0; rows && i < rows.numListItems; i++)
        {
            const row = rows.getListItemAt(i);

            if(row) row.color = row.id === selectedId ? SELECTED : IDLE;
        }
    }
}
