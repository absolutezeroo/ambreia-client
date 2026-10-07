import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {CatalogCategory} from '@ambreia/map-editor-core/palette/CatalogCategory';
import {furnitureCategory} from '@ambreia/map-editor-core/palette/furnitureCategory';
import type {EditorApp} from '../app/EditorApp';
import {Favorites} from '../app/Favorites';
import {FurnitureSprites} from '../view/FurnitureSprites';
import {$, esc} from './html';

const PAGE = 42;
const CATEGORIES: readonly {readonly id: CatalogCategory | 'all'; readonly icon: string; readonly label: string}[] = [
    {id: 'all', icon: '📦', label: 'Tous'},
    {id: 'seats', icon: '🛋️', label: 'Sièges'},
    {id: 'tables', icon: '🪵', label: 'Tables'},
    {id: 'decor', icon: '🗿', label: 'Décorations'},
    {id: 'plants', icon: '🌿', label: 'Plantes'},
    {id: 'lights', icon: '💡', label: 'Lumières'},
    {id: 'floors', icon: '🟫', label: 'Sols'},
    {id: 'rares', icon: '⭐', label: 'Rares'},
    {id: 'misc', icon: '🧰', label: 'Divers'}
];

type Tab = 'all' | 'favorites' | 'recent';

/** "Catalogue de mobis" (mock-up 2): categories, tabs, search, a page of real thumbnails. */
export class CatalogPanel
{
    static readonly FAVORITES = new Favorites();

    private readonly _floor: (IFurniturePaletteEntry & {readonly category: CatalogCategory})[];
    private _category: CatalogCategory | 'all' = 'all';
    private _tab: Tab = 'all';
    private _page = 0;

    constructor(readonly element: HTMLElement, private readonly _app: EditorApp)
    {
        // Named classes first: thousands of numeric or empty class names would bury throne & co.
        const named = (e: IFurniturePaletteEntry) => /^[a-z]/i.test(e.class) ? 0 : 1;

        this._floor = _app.palette
            .filter(e => !e.wall && e.class)
            .map(e => ({...e, category: furnitureCategory(e.class)}))
            .sort((a, b) => named(a) - named(b) || a.class.localeCompare(b.class));

        element.innerHTML = `
            <h2 class="panel-title">Catalogue de mobis</h2>
            <div class="catalog">
                <div class="cat-list">${CATEGORIES.map(c => `
                    <button data-cat="${c.id}"><span class="icon">${c.icon}</span>${c.label}</button>`).join('')}
                </div>
                <div class="cat-main">
                    <input class="search" type="search" placeholder="Rechercher un mobi (classe ou id)…">
                    <div class="tabs">
                        <button data-tab="all">Tous</button><button data-tab="favorites">★ Favoris</button><button data-tab="recent">Récents</button>
                    </div>
                    <div class="grid"></div>
                    <div class="pager"><button data-page="-1">◀</button><span class="page"></span><button data-page="1">▶</button></div>
                </div>
            </div>`;

        $<HTMLInputElement>(element, '.search').addEventListener('input', () =>
        {
            this._page = 0;
            this.fill();
        });
        element.addEventListener('click', e =>
        {
            const target = e.target as HTMLElement;
            const cat = target.closest<HTMLElement>('[data-cat]')?.dataset.cat;
            const tab = target.closest<HTMLElement>('[data-tab]')?.dataset.tab;
            const page = target.closest<HTMLElement>('[data-page]')?.dataset.page;
            const def = target.closest<HTMLElement>('[data-def]')?.dataset.def;

            if(cat) this._category = cat as CatalogCategory | 'all';
            if(tab) this._tab = tab as Tab;
            if(cat || tab) this._page = 0;
            if(page) this._page += Number(page);
            if(def)
            {
                const entry = this._floor.find(f => f.definition === Number(def));

                if(!entry) return;
                CatalogPanel.FAVORITES.used(entry.definition);
                _app.choose(entry);
            }
            if(cat || tab || page || def) this.fill();
        });
        this.fill();
    }

    render(): void
    {
        this.element.querySelectorAll<HTMLElement>('[data-def]').forEach(b =>
            b.classList.toggle('chosen', Number(b.dataset.def) === this._app.choice?.definition));
    }

    private fill(): void
    {
        const q = $<HTMLInputElement>(this.element, '.search').value.trim().toLowerCase();
        const favorites = CatalogPanel.FAVORITES;
        let hits = this._tab === 'recent'
            ? favorites.recent.map(d => this._floor.find(f => f.definition === d)).filter(f => !!f)
            : this._floor;

        if(this._tab === 'favorites') hits = hits.filter(f => favorites.isFavorite(f.definition));
        if(this._category !== 'all') hits = hits.filter(f => f.category === this._category);
        if(q) hits = hits.filter(f => f.class.toLowerCase().includes(q) || String(f.definition) === q);

        const pages = Math.max(1, Math.ceil(hits.length / PAGE));

        this._page = Math.min(Math.max(0, this._page), pages - 1);
        $(this.element, '.grid').innerHTML = hits.slice(this._page * PAGE, (this._page + 1) * PAGE).map(f => `
            <button data-def="${f.definition}" title="${esc(f.class)} · #${f.definition} · ${f.width}×${f.length}">
                <img loading="lazy" alt="" src="${FurnitureSprites.thumbnail(f.class)}" onerror="if(!this.dataset.retry){this.dataset.retry=1;setTimeout(()=>this.src=this.src+'&r=1',3000)}else{this.style.visibility='hidden'}">
                <span>${esc(f.class)}</span>
            </button>`).join('') || '<p class="muted pad">Aucun mobi.</p>';
        $(this.element, '.page').textContent = `${this._page + 1} / ${pages} · ${hits.length.toLocaleString('fr-FR')}`;
        this.element.querySelectorAll<HTMLElement>('[data-cat]').forEach(b => b.classList.toggle('active', b.dataset.cat === this._category));
        this.element.querySelectorAll<HTMLElement>('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === this._tab));
        this.render();
    }
}
