import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {LayerKey} from '@ambreia/map-editor-core/zone/LayerKey';
import type {Category} from '../app/Category';
import {CATEGORY_LAYER} from '../app/CATEGORY_LAYER';
import type {EditorApp} from '../app/EditorApp';
import {Favorites} from '../app/Favorites';
import {EditorShell} from './EditorShell';
import type {EditorTexts} from './EditorTexts';
import {ambienceForm, wallsForm} from './forms/documentForms';
import {elementForm} from './forms/elementForm';
import type {IPanelUi} from './IPanelUi';
import {BottomEditUi} from './panels/BottomEditUi';
import {CATEGORY_LABEL_KEYS} from './panels/CATEGORY_LABEL_KEYS';
import {DecorInspectorUi} from './panels/DecorInspectorUi';
import {DecorPanelUi} from './panels/DecorPanelUi';
import {FloorPanelUi} from './panels/FloorPanelUi';
import {FormPanelUi} from './panels/FormPanelUi';
import {LayerListPanelUi} from './panels/LayerListPanelUi';
import {NpcInspectorUi} from './panels/NpcInspectorUi';
import {SpawnInspectorUi} from './panels/SpawnInspectorUi';
import {SpawnZonePanelUi} from './panels/SpawnZonePanelUi';
import {TileInspectorUi} from './panels/TileInspectorUi';
import {TriggerInspectorUi} from './panels/TriggerInspectorUi';
import type {WindowCanvasHost} from './WindowCanvasHost';

const L = (name: string) => `vortex_map_editor_${name}_xml`;

/**
 * The editor's windows for one open zone: which layout each category shows in the three slots
 * (the owner's where they exist; the editor's form layouts otherwise), and which panel binds
 * each. `layout#category` gives a layout one window per category (left_npcs serves the NPCs and
 * the layers that have no list layout of their own).
 */
export class EditorUi
{
    private static readonly FAVORITES = new Favorites();
    private readonly _shell: EditorShell;

    constructor(private readonly _manager: WindowManager, private readonly _texts: EditorTexts, app: EditorApp, private readonly _host: WindowCanvasHost)
    {
        const build = (layout: string) => _manager.buildWidgetLayout(layout);

        this._shell = new EditorShell(_manager, _texts, app, _host, EditorUi.slots, (key, window) => this.panel(key, window, app, build));
        app.refresh();
    }

    /** Takes the editor's windows off the desktop (back to the zone list). */
    dispose(): void
    {
        (this._manager.getDesktop(1) as IWindowContainer).removeChild(this._shell.window);
        this._shell.window.destroy();
    }

    private static slots(category: Category): {left: string; inspector: string; bottom: string}
    {
        const bottom = L('bottom_edit');

        switch(category)
        {
            case 'decor': return {left: L('left_decor'), inspector: L('inspect_decor'), bottom};
            case 'walls':
            case 'ambience': return {left: `${L('left_form')}#${category}`, inspector: L('inspect_tile'), bottom};
            case 'npcs': return {left: `${L('left_npcs')}#npcs`, inspector: L('inspect_npc'), bottom};
            case 'spawns': return {left: L('left_spawns'), inspector: L('inspect_spawn'), bottom};
            case 'zones': return {left: L('left_spawns'), inspector: `${L('inspect_form')}#zones`, bottom};
            case 'triggers': return {left: `${L('left_triggers')}#triggers`, inspector: L('inspect_trigger'), bottom};
            case 'entries':
            case 'passages':
            case 'resources':
            case 'chests':
            case 'interactives':
            case 'bosses':
            case 'events': return {left: `${L('left_npcs')}#${category}`, inspector: `${L('inspect_form')}#${category}`, bottom};
            default: return {left: L('left_floor'), inspector: L('inspect_tile'), bottom};
        }
    }

    private panel(key: string, window: IWindow, app: EditorApp, build: (layout: string) => IWindow | null): IPanelUi | null
    {
        const [layout, rest] = key.split('#');
        const suffix = (rest ?? null) as Category | null;
        const layer = suffix ? CATEGORY_LAYER[suffix] ?? null : null;
        const texts = this._texts;

        switch(layout)
        {
            case L('left_floor'): return new FloorPanelUi(window, app);
            case L('inspect_tile'): return new TileInspectorUi(window, app, texts);
            case L('left_decor'): return new DecorPanelUi(window, app, texts, EditorUi.FAVORITES, build);
            case L('inspect_decor'): return new DecorInspectorUi(window, app);
            case L('bottom_edit'): return new BottomEditUi(window, app, build);
            case L('inspect_npc'): return new NpcInspectorUi(window, app, texts, build);
            case L('inspect_spawn'): return new SpawnInspectorUi(window, app, texts, build);
            case L('inspect_trigger'): return new TriggerInspectorUi(window, app, texts, build);
            case L('left_spawns'): return new SpawnZonePanelUi(window, app, build);
            case L('left_npcs'):
            case L('left_triggers'):
                return layer ? new LayerListPanelUi(window, app, layer, texts.get(CATEGORY_LABEL_KEYS[suffix!]), build) : null;
            case L('inspect_form'):
                return layer ? new FormPanelUi(window, build, () => elementForm(app, layer as LayerKey)) : null;
            case L('left_form'):
                return new FormPanelUi(window, build, () => suffix === 'walls' ? wallsForm(app) : ambienceForm(app));
            default: return null;
        }
    }
}
