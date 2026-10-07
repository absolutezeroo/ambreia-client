import type {EditorApp} from '../app/EditorApp';

const BUTTONS: readonly {readonly id: string; readonly icon: string; readonly label: string; readonly title: string}[] = [
    {id: 'select', icon: '⬚', label: 'Sélection', title: 'Sélection (S) — clic, Maj+clic, glisser'},
    {id: 'move', icon: '✥', label: 'Déplacer', title: 'Déplacer (M) — glisser un mobi'},
    {id: 'rotate', icon: '⟳', label: 'Rotation', title: 'Tourner (R)'},
    {id: 'copy', icon: '📄', label: 'Copier', title: 'Copier (Ctrl+C)'},
    {id: 'paste', icon: '📋', label: 'Coller', title: 'Coller sous le pointeur (Ctrl+V)'},
    {id: 'delete', icon: '✖', label: 'Supprimer', title: 'Supprimer (Suppr)'},
    {id: 'duplicate', icon: '⧉', label: 'Dupliquer', title: 'Dupliquer (Ctrl+D)'},
    {id: 'lock', icon: '🔒', label: 'Verrouiller', title: 'Verrouiller la position'}
];

/** "Outils de l'éditeur" above the view (mock-up 2), for the Mobis category. */
export class ViewToolbar
{
    constructor(private readonly _root: HTMLElement, private readonly _app: EditorApp)
    {
        _root.innerHTML = `<span class="viewbar-title">Outils de l'éditeur</span>${BUTTONS.map(b => `
            <button data-act="${b.id}" title="${b.title}"><span class="icon">${b.icon}</span><span>${b.label}</span></button>`).join('')}`;

        _root.addEventListener('click', e =>
        {
            const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
            const actions: Record<string, () => void> = {
                select: () => _app.setTool('select'),
                move: () => _app.setTool('move'),
                rotate: () => _app.rotateSelection(),
                copy: () => _app.copy(),
                paste: () => _app.paste(),
                delete: () => _app.deleteSelection(),
                duplicate: () => _app.duplicate(),
                lock: () => _app.toggleLock()
            };

            if(act) actions[act]();
        });
    }

    render(): void
    {
        const app = this._app;
        const none = app.selection.ids.size === 0;

        this._root.hidden = app.category !== 'decor';
        this._root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach(b =>
        {
            const act = b.dataset.act!;

            b.classList.toggle('active', act === app.tool);
            b.disabled = act === 'paste' ? !app.canPaste : !['select', 'move'].includes(act) && none;
        });
    }
}
