import type {IDropMenuWindow} from '@ambreia/ui/components/IDropMenuWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import {EditorSelection} from '@ambreia/map-editor-core/selection/EditorSelection';
import type {EditorApp} from '../../app/EditorApp';
import {child, onClick, setEnabled} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import type {IPanelUi} from '../IPanelUi';

type Item = readonly [label: string, action: (app: EditorApp) => void];

const ZOOMS = [0.5, 0.75, 1, 1.5, 2] as const;

/**
 * The menu bar of vortex_map_editor_xml: Fichier, Édition, Affichage, Test (drop menus that run
 * an action and fall back to their caption), Tester / Enregistrer / Publier, the zone menu and the
 * zoom menu. The window's caption carries the save state and the last message.
 */
export class MenuBarUi implements IPanelUi
{
    private readonly _app: EditorApp;
    private readonly _caption: string;
    private readonly _zoneCaption: string;

    constructor(private readonly _window: IWindow, app: EditorApp, texts: EditorTexts)
    {
        this._app = app;
        this._caption = texts.get('vortex.mapeditor.title');
        this._zoneCaption = texts.get('vortex.mapeditor.zone_menu', {zone: app.zone.key});

        this.menu('menu_file', [
            ['Zones…', a => void a.leave()],
            ['Enregistrer (Ctrl+S)', a => void a.save()],
            ['Publier', a => void a.publish()],
            ['Vérifier la zone', a => void a.verify()]
        ]);
        this.menu('menu_edit', [
            ['Annuler (Ctrl+Z)', a => a.undo()],
            ['Refaire (Ctrl+Y)', a => a.redo()],
            ['Copier (Ctrl+C)', a => a.copy()],
            ['Coller (Ctrl+V)', a => a.paste()],
            ['Dupliquer (Ctrl+D)', a => a.duplicate()],
            ['Supprimer (Suppr)', a => a.deleteSelection()],
            ['Tout désélectionner (Échap)', a => a.select(EditorSelection.EMPTY)],
            ['Verrouiller / déverrouiller', a => a.toggleLock()]
        ]);
        this.menu('menu_view', [
            ['Grille', a => a.toggleOption('grid')],
            ['Hauteurs des cases', a => a.toggleOption('heights')],
            ['Murs', a => a.toggleOption('walls')],
            ['Vrais mobis', a => a.toggleOption('sprites')],
            ['Niveau inférieur (Pg↓)', a => a.stepLevel(-1)],
            ['Niveau supérieur (Pg↑)', a => a.stepLevel(1)],
            ['Tous les niveaux (Début)', a => a.stepLevel(null)],
            ['Recentrer la vue', a => a.view.fit()]
        ]);
        this.menu('menu_test', [['Tester la zone dans l\'hôtel', a => void a.test()]]);
        this.menu('zone_menu', [
            [`${app.zone.name} (${app.zone.key})`, () => undefined],
            ['Autre zone…', a => void a.leave()]
        ]);
        this.menu('zoom_menu', [
            ...ZOOMS.map((z): Item => [`${z * 100} %`, a => a.view.setZoom(z)]),
            ['Ajuster', a => a.view.fit()]
        ]);

        onClick(_window, 'test_button', () => void app.test());
        onClick(_window, 'save_button', () => void app.save());
        onClick(_window, 'publish_button', () => void app.publish());
    }

    render(): void
    {
        const app = this._app;
        const dirty = app.history.isDirty;
        const version = app.savedVersion === null ? 'jamais enregistrée'
            : `v${app.savedVersion}${app.publishedVersion === app.savedVersion ? ' publiée' : ' brouillon'}`;
        // The Habbo fonts have no long dash or bullet: plain separators.
        const caption = `${this._caption} - ${app.zone.name} - ${dirty ? '(modifié) ' : ''}${version}${app.status ? ` - ${app.status}` : ''}`;

        if(this._window.caption !== caption) this._window.caption = caption;

        const zoneMenu = child<IDropMenuWindow>(this._window, 'zone_menu');

        if(zoneMenu && zoneMenu.caption !== this._zoneCaption) zoneMenu.caption = this._zoneCaption;
        setEnabled(child(this._window, 'save_button'), !app.busy && dirty);
        setEnabled(child(this._window, 'publish_button'), !app.busy);
        setEnabled(child(this._window, 'test_button'), !app.busy);
    }

    onViewChange(): void
    {
        const menu = child<IDropMenuWindow>(this._window, 'zoom_menu');

        if(menu) menu.caption = `Zoom : ${Math.round(this._app.view.zoom * 100)} %`;
    }

    /** A drop menu of actions: picking one runs it, then the menu shows its caption again. */
    private menu(name: string, items: readonly Item[]): void
    {
        const menu = child<IDropMenuWindow>(this._window, name);

        if(!menu) return;

        const labels = items.map(i => i[0]);
        let running = false;

        menu.populate(labels);
        menu.addEventListener('WE_SELECTED', () =>
        {
            const item = items[menu.selection];

            if(running || !item) return;

            running = true;
            item[1](this._app);
            menu.populate(labels);
            running = false;
            this._app.refresh();
        });
    }
}
