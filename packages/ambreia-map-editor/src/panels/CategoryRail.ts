import {CATEGORIES} from '../app/CATEGORIES';
import type {Category} from '../app/Category';
import type {EditorApp} from '../app/EditorApp';

/** The left rail: Sol, Mobis, PNJ, Spawns, Zones, Triggers, Audio, Paramètres, Validation. */
export class CategoryRail
{
    constructor(private readonly _root: HTMLElement, private readonly _app: EditorApp)
    {
        _root.innerHTML = CATEGORIES.map(c => `
            <button data-category="${c.id}" ${c.ready ? '' : 'disabled title="Arrive avec les calques RPG (lot B)"'}>
                <span class="icon">${c.icon}</span><span>${c.label}</span>
            </button>`).join('');

        _root.addEventListener('click', e =>
        {
            const id = (e.target as HTMLElement).closest<HTMLElement>('[data-category]')?.dataset.category;

            if(id) _app.setCategory(id as Category);
        });
    }

    render(): void
    {
        this._root.querySelectorAll<HTMLElement>('[data-category]').forEach(b =>
            b.classList.toggle('active', b.dataset.category === this._app.category));
    }
}
