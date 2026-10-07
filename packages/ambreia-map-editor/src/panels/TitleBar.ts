import {EditorSelection} from '@ambreia/map-editor-core/selection/EditorSelection';
import type {EditorApp} from '../app/EditorApp';
import type {IViewOptions} from '../view/IViewOptions';
import {$, esc} from './html';

type Item = {readonly cmd: string; readonly label: string; readonly key?: string} | {readonly option: keyof IViewOptions; readonly label: string};

const MENUS: readonly {readonly label: string; readonly items: readonly Item[]}[] = [
    {label: 'Fichier', items: [
        {cmd: 'zones', label: 'Zones…'},
        {cmd: 'save', label: 'Sauvegarder', key: 'Ctrl+S'},
        {cmd: 'publish', label: 'Publier'},
        {cmd: 'verify', label: 'Vérifier la map'}
    ]},
    {label: 'Édition', items: [
        {cmd: 'undo', label: 'Annuler', key: 'Ctrl+Z'},
        {cmd: 'redo', label: 'Refaire', key: 'Ctrl+Y'},
        {cmd: 'copy', label: 'Copier', key: 'Ctrl+C'},
        {cmd: 'paste', label: 'Coller', key: 'Ctrl+V'},
        {cmd: 'duplicate', label: 'Dupliquer', key: 'Ctrl+D'},
        {cmd: 'delete', label: 'Supprimer', key: 'Suppr'},
        {cmd: 'deselect', label: 'Tout désélectionner', key: 'Échap'}
    ]},
    {label: 'Affichage', items: [
        {option: 'grid', label: 'Grille'},
        {option: 'heights', label: 'Hauteurs des cases'},
        {option: 'walls', label: 'Murs'},
        {option: 'sprites', label: 'Vrais mobis (imager)'},
        {cmd: 'fit', label: 'Recentrer la vue'},
        {cmd: 'zoomIn', label: 'Zoom +'},
        {cmd: 'zoomOut', label: 'Zoom −'}
    ]},
    {label: 'Tester', items: [{cmd: 'test', label: 'Tester dans l\'hôtel'}]}
];

/** Title bar and menu bar of the mock-ups: menus, the three big actions, map and zoom. */
export class TitleBar
{
    constructor(private readonly _root: HTMLElement, private readonly _app: EditorApp)
    {
        _root.innerHTML = `
            <div class="title-row">
                <span class="logo">AMBREIA</span>
                <span class="title">Éditeur de cartes — ${esc(_app.zone.name)}</span>
                <button class="close" data-cmd="zones" title="Revenir à la liste des zones">✕</button>
            </div>
            <div class="menu-row">
                ${MENUS.map(m => `
                    <div class="menu" tabindex="-1">
                        <button class="menu-button">${m.label} ▾</button>
                        <div class="menu-items">${m.items.map(i => 'option' in i
                            ? `<button data-option="${i.option}"><span class="check"></span>${i.label}</button>`
                            : `<button data-cmd="${i.cmd}">${i.label}<kbd>${i.key ?? ''}</kbd></button>`).join('')}</div>
                    </div>`).join('')}
                <button class="big" data-cmd="test">▶ Tester dans l'hôtel</button>
                <button class="big primary" data-cmd="save">💾 Sauvegarder</button>
                <button class="big" data-cmd="publish">✎ Publier</button>
                <span class="status"></span>
                <span class="chip">Map : <b>${esc(_app.zone.key)}</b></span>
                <span class="chip zoom"></span>
            </div>`;

        _root.addEventListener('click', e =>
        {
            const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cmd], [data-option]');

            if(!target) return;

            (document.activeElement as HTMLElement | null)?.blur();
            if(target.dataset.option) _app.toggleOption(target.dataset.option as keyof IViewOptions);
            else this.run(target.dataset.cmd!);
        });
    }

    render(): void
    {
        const app = this._app;
        const dirty = app.history.isDirty;
        const version = app.savedVersion === null ? 'jamais enregistrée'
            : `v${app.savedVersion}${app.publishedVersion === app.savedVersion ? ' publiée' : ' brouillon'}`;

        $<HTMLButtonElement>(this._root, '.big[data-cmd=save]').disabled = app.busy || !dirty;
        $<HTMLButtonElement>(this._root, '.big[data-cmd=publish]').disabled = app.busy;
        this._root.querySelectorAll<HTMLButtonElement>('[data-cmd=undo]').forEach(b => b.disabled = !app.history.canUndo);
        this._root.querySelectorAll<HTMLButtonElement>('[data-cmd=redo]').forEach(b => b.disabled = !app.history.canRedo);
        this._root.querySelectorAll<HTMLButtonElement>('[data-cmd=paste]').forEach(b => b.disabled = !app.canPaste);
        this._root.querySelectorAll<HTMLElement>('[data-option]').forEach(b =>
            b.querySelector('.check')!.textContent = app.options[b.dataset.option as keyof IViewOptions] ? '✓' : '');
        $(this._root, '.status').textContent = `${dirty ? '● modifié · ' : ''}${version}${app.status ? ` — ${app.status}` : ''}`;
        $(this._root, '.zoom').textContent = `Zoom : ${Math.round(app.view.zoom * 100)} %`;
    }

    private run(cmd: string): void
    {
        const app = this._app;
        const actions: Record<string, () => void> = {
            'zones': () => void app.leave(),
            'save': () => void app.save(),
            'publish': () => void app.publish(),
            'verify': () => void app.verify(),
            'test': () => void app.test(),
            'undo': () => app.undo(),
            'redo': () => app.redo(),
            'copy': () => app.copy(),
            'paste': () => app.paste(),
            'duplicate': () => app.duplicate(),
            'delete': () => app.deleteSelection(),
            'deselect': () => app.select(EditorSelection.EMPTY),
            'fit': () => app.view.fit(),
            zoomIn: () => app.view.setZoom(app.view.zoom * 1.25),
            zoomOut: () => app.view.setZoom(app.view.zoom / 1.25)
        };

        actions[cmd]?.();
        app.refresh();
    }
}
