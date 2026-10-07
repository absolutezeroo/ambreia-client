import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import {$, esc} from './html';

const SHOWN = 300;

/**
 * The real Habbo furniture, searchable by class name or definition id. Floor items only in the
 * first editor: wall items need the wall tool.
 */
export class PalettePanel
{
    onChoose: (entry: IFurniturePaletteEntry) => void = () => undefined;

    private readonly _floor: IFurniturePaletteEntry[];
    private _chosen: number | null = null;

    constructor(private readonly _root: HTMLElement, entries: readonly IFurniturePaletteEntry[])
    {
        // Named classes first: thousands of numeric or empty class names would bury throne & co.
        const named = (e: IFurniturePaletteEntry) => /^[a-z]/i.test(e.class) ? 0 : 1;

        this._floor = entries
            .filter(e => !e.wall && e.class)
            .sort((a, b) => named(a) - named(b) || a.class.localeCompare(b.class));
        _root.innerHTML = `
            <input class="search" type="search" placeholder="Rechercher (nom de classe ou id)…">
            <div class="count muted"></div>
            <ul class="items"></ul>`;

        $<HTMLInputElement>(_root, '.search').addEventListener('input', () => this.render());
        $(_root, '.items').addEventListener('click', e =>
        {
            const li = (e.target as HTMLElement).closest<HTMLElement>('[data-def]');
            const entry = li && this._floor.find(f => f.definition === Number(li.dataset.def));

            if(!entry) return;

            this._chosen = entry.definition;
            this.onChoose(entry);
            this.render();
        });
        this.render();
    }

    private render(): void
    {
        const q = $<HTMLInputElement>(this._root, '.search').value.trim().toLowerCase();
        const hits = q
            ? this._floor.filter(f => f.class.toLowerCase().includes(q) || String(f.definition) === q)
            : this._floor;

        $(this._root, '.count').textContent = `${hits.length.toLocaleString('fr-FR')} meubles${hits.length > SHOWN ? ` — ${SHOWN} affichés` : ''}`;
        $(this._root, '.items').innerHTML = hits.slice(0, SHOWN).map(f => `
            <li data-def="${f.definition}" class="${f.definition === this._chosen ? 'chosen' : ''}" title="${esc(f.class)} #${f.definition}">
                <span class="name">${esc(f.class)}</span>
                <span class="meta">#${f.definition} · ${f.width}×${f.length}${f.states > 1 ? ` · ${f.states} états` : ''}</span>
            </li>`).join('');
    }
}
