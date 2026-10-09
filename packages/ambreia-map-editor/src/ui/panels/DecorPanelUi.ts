import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import {catalogPlaces, type CatalogSection, type ICatalogPlace} from '@ambreia/map-editor-core/palette/catalogPlaces';
import type {EditorApp} from '../../app/EditorApp';
import type {Favorites} from '../../app/Favorites';
import {FurnitureSprites} from '../../view/FurnitureSprites';
import {loadFurniData} from '../../view/IsoBackdrop';
import {child, ChoiceBinding, highlight, onClick, onWindowClick, SearchField, setImage, setText} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import type {IPanelUi} from '../IPanelUi';
import {CATALOG_CATEGORIES} from './CATALOG_CATEGORIES';

const PAGE = 60;

type Filter = 'all' | 'favorites' | 'recent';
type Entry = IFurniturePaletteEntry & {readonly place: ICatalogPlace};

const SECTIONS: readonly (readonly [CatalogSection | 'all', string])[] = [
    ['all', 'Tout le catalogue'], ['seasons', 'Saisons'], ['rares', 'Rares'], ['collections', 'Collections'], ['types', 'Par type']
];

/**
 * "Catalogue de mobis" (vortex_map_editor_left_decor_xml): section and group menus (Saisons →
 * Noël 2012…, see catalogPlaces), search, the three filters, a page of furni_tile thumbnails from
 * vortex-imager, the count and the pager.
 */
export class DecorPanelUi implements IPanelUi
{
    private readonly _floor: Entry[];
    private readonly _grid: IItemGridWindow | null;
    private readonly _section: ChoiceBinding<CatalogSection | 'all'>;
    private readonly _group: ChoiceBinding<string>;
    private readonly _filters: IWindow[];
    private readonly _filterColors: number[];
    private _tiles: {window: IWindow; definition: number}[] = [];
    private _tileColor = 0;
    private _sectionValue: CatalogSection | 'all' = 'all';
    private _groupValue = 'all';
    private _filter: Filter = 'all';
    private _page = 0;
    private readonly _search: SearchField;
    /** furnidata's names by full class (`sofa_silo*2`), lower-cased for the search; empty until it loads. */
    private _names = new Map<string, string>();

    constructor(
        private readonly _window: IWindow,
        private readonly _app: EditorApp,
        private readonly _texts: EditorTexts,
        private readonly _favorites: Favorites,
        private readonly _build: (layout: string) => IWindow | null
    )
    {
        // Named classes first: thousands of numeric or empty class names would bury throne & co.
        const named = (e: IFurniturePaletteEntry) => /^[a-z]/i.test(e.class) ? 0 : 1;

        // A furni class is one word (colour variants: `sofa_silo*2`); pets and bots have spaces.
        const floor = _app.palette.filter(e => !e.wall && /^[\w*.-]+$/.test(e.class));
        const places = catalogPlaces(floor.map(e => e.class));

        this._floor = floor
            .map(e => ({...e, place: places.get(e.class)}))
            .filter((e): e is Entry => !!e.place)
            .sort((a, b) => named(a) - named(b) || a.class.localeCompare(b.class));

        this._grid = child<IItemGridWindow>(_window, 'furni_grid');
        this._search = new SearchField(_window, 'search_input', () => this.refill(0));
        this._section = new ChoiceBinding<CatalogSection | 'all'>(_window, 'category_menu', () => this._sectionValue, s =>
        {
            this._sectionValue = s;
            this._groupValue = 'all';
            this._group.options(this.groups());
            this.refill(0);
        }).options(SECTIONS);
        this._group = new ChoiceBinding<string>(_window, 'group_menu', () => this._groupValue, g =>
        {
            this._groupValue = g;
            this.refill(0);
        }).options(this.groups());
        this._filters = ['filter_0', 'filter_1', 'filter_2'].map(n => child(_window, n)).filter((w): w is IWindow => !!w);
        this._filterColors = this._filters.map(f => f.color);

        (['all', 'favorites', 'recent'] as const).forEach((filter, i) => onClick(_window, `filter_${i}`, () =>
        {
            this._filter = filter;
            this.refill(0);
        }));
        onClick(_window, 'prev_button', () => this.refill(this._page - 1));
        onClick(_window, 'next_button', () => this.refill(this._page + 1));

        this.refill(0);

        // The search also matches the furni's name (furnidata's) once it arrives.
        void loadFurniData().then(data =>
        {
            this._names = new Map(data.map(d => [d.fullName, d.localizedName.toLowerCase()]));
            if(this._search.query) this.refill(this._page);
        }).catch(() => undefined);
    }

    render(): void
    {
        const chosen = this._app.choice?.definition;

        this._section.render();
        this._group.render();
        highlight(this._filters, this._filterColors, ['all', 'favorites', 'recent'].indexOf(this._filter));
        for(const tile of this._tiles)
        {
            const color = tile.definition === chosen ? 0xffffd66b : this._tileColor;

            if(tile.window.color !== color) tile.window.color = color;
        }
    }

    private matches(): Entry[]
    {
        const q = this._search.query.toLowerCase();
        let hits: Entry[] = this._filter === 'recent'
            ? this._favorites.recent.map(d => this._floor.find(f => f.definition === d)).filter((f): f is Entry => !!f)
            : this._floor;

        if(this._filter === 'favorites') hits = hits.filter(f => this._favorites.isFavorite(f.definition));
        if(this._sectionValue !== 'all') hits = hits.filter(f => f.place.section === this._sectionValue);
        if(this._groupValue !== 'all') hits = hits.filter(f => f.place.group === this._groupValue);
        if(q) hits = hits.filter(f => f.class.toLowerCase().includes(q) || this._names.get(f.class)?.includes(q) || String(f.definition) === q);

        return hits;
    }

    /** The group menu of the current section: seasons and rares by name then year, collections biggest first. */
    private groups(): (readonly [string, string])[]
    {
        const all = ['all', 'Tous les groupes'] as const;

        if(this._sectionValue === 'all') return [all];

        const count = new Map<string, number>();

        for(const f of this._floor) if(f.place.section === this._sectionValue) count.set(f.place.group, (count.get(f.place.group) ?? 0) + 1);

        const groups = [...count.keys()];

        if(this._sectionValue === 'types') return [all, ...CATALOG_CATEGORIES.filter(([c]) => count.has(c as string))] as (readonly [string, string])[];
        if(this._sectionValue === 'collections') return [all, ...groups.sort((a, b) => count.get(b)! - count.get(a)!).map(g => [g, `${g} (${count.get(g)})`] as const)];

        // `Noël:2012` → "Noël 2012"; a season with no year in its names comes first, as "Noël (autres)".
        return [all, ...groups.sort((a, b) => a.localeCompare(b)).map(g => [g, g.includes(':') ? g.replace(':', ' ') : `${g} (autres)`] as const)];
    }

    private refill(page: number): void
    {
        const grid = this._grid;
        const hits = this.matches();
        const pages = Math.max(1, Math.ceil(hits.length / PAGE));

        this._page = Math.min(Math.max(0, page), pages - 1);
        setText(this._window, 'furni_count', this._texts.get('vortex.mapeditor.decor.count', {count: hits.length, total: this._floor.length}));
        setText(this._window, 'page_txt', `${this._page + 1} / ${pages}`);

        if(!grid) return;

        grid.destroyGridItems();
        this._tiles = [];

        for(const entry of hits.slice(this._page * PAGE, (this._page + 1) * PAGE))
        {
            const tile = this._build('vortex_map_editor_furni_tile_xml');

            if(!tile) break;

            tile.name = entry.class;

            this._tileColor ||= tile.color;
            setImage(tile, 'furni_icon', FurnitureSprites.thumbnail(entry.class));
            onWindowClick(tile, () =>
            {
                this._favorites.used(entry.definition);
                this._app.choose(entry);
            });
            this._tiles.push({window: tile, definition: entry.definition});
        }

        // All at once: the grid lays its rows out on populate, not on each add.
        grid.populate(this._tiles.map(t => t.window));

        this.render();
    }
}
