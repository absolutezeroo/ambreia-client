import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {Category} from '../../app/Category';
import type {EditorApp} from '../../app/EditorApp';
import {child, onWindowClick, SearchField, setEnabled, setImage, setText, setVisible} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import type {IPanelUi} from '../IPanelUi';
import {CATEGORY_LABEL_KEYS} from './CATEGORY_LABEL_KEYS';
import {libraryRows} from './contentLabels';

const ICON: Readonly<Partial<Record<Category, [uri: string, color: number]>>> = {
    items: ['rpg/ui-icons/rpg_item_weapon_sword_attack_melee_slashing_damage_icon', 0x8a94a0],
    vfx: ['rpg/ui-icons/rpg_magic_sparkles_enchantment_icon', 0xb060e0],
    sfx: ['rpg/ui-icons/media_audio_sound_volume_3_icon', 0x2a8fd6],
    quests: ['rpg/ui-icons/software_speech_bubble_exclaimation_mark_quest_new_icon', 0xe0a020]
};

/**
 * The library of a content kind (left_library, « Contenu » rail): its documents by name, searched
 * and selected. The server serves the quests' ids today; items, VFX and SFX have no route yet, so
 * their library stays empty, and Ajouter / Dupliquer / Supprimer wait for the content write routes.
 * The category grid stays empty until a kind has categories to sort by.
 */
export class ContentLibraryUi implements IPanelUi
{
    private readonly _list: IItemListWindow | null;
    private readonly _search: SearchField;
    private readonly _rows = new Map<string, IWindow>();
    private _shownKey = '';
    private _selected: string | null = null;

    constructor(
        private readonly _window: IWindow,
        private readonly _app: EditorApp,
        private readonly _category: Category,
        texts: EditorTexts,
        private readonly _build: (layout: string) => IWindow | null
    )
    {
        const title = child<ITextWindow>(_window, 'library_title');

        if(title) title.text = texts.get(CATEGORY_LABEL_KEYS[_category]);

        this._list = child<IItemListWindow>(_window, 'library_list');
        this._search = new SearchField(_window, 'search_input', () => this.render());

        for(let i = 0; i < 3; i++) setEnabled(child(_window, `list_button_${i}`), false);

        this.render();
    }

    render(): void
    {
        const list = this._list;
        const rows = libraryRows(this.ids(), this._app.texts, this._search.query);
        const key = rows.map(r => r.id).join('\n');

        if(list && key !== this._shownKey)
        {
            this._shownKey = key;
            list.destroyListItems();
            this._rows.clear();

            for(const r of rows)
            {
                const row = this._build('vortex_map_editor_library_row_xml');

                if(!row) break;

                setText(row, 'item_title', r.title);
                setText(row, 'item_sub', r.sub);
                setText(row, 'item_meta', '');
                setVisible(row, 'status_dot', false);
                this.icon(row, 'item_icon');
                onWindowClick(row, () =>
                {
                    this._selected = r.id;
                    this.render();
                });
                list.addListItem(row);
                this._rows.set(r.id, row);
            }
        }

        for(const [id, row] of this._rows) setVisible(row, 'selected', id === this._selected);
    }

    private ids(): readonly string[]
    {
        return this._category === 'quests' ? this._app.quests : [];
    }

    private icon(root: IWindow, name: string): void
    {
        const icon = ICON[this._category];
        const bitmap = child(root, name);

        if(!icon || !bitmap) return;

        setImage(root, name, icon[0]);
        bitmap.color = icon[1];
    }
}
