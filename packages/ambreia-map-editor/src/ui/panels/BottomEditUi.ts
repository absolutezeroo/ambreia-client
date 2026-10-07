import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {LayerState} from '@ambreia/map-editor-core/layers/LayerState';
import {EditorSelection} from '@ambreia/map-editor-core/selection/EditorSelection';
import type {IZoneFinding} from '@ambreia/map-editor-core/validation/IZoneFinding';
import type {EditorApp} from '../../app/EditorApp';
import {CheckBinding, child, children, onClick, onWindowClick, setText} from '../bind';
import type {IPanelUi} from '../IPanelUi';
import {LAYER_COLORS} from './LAYER_COLORS';
import {MiniMapUi} from './MiniMapUi';

const ON = 0xffffffff;
const OFF = 0xff7d7d7d;

/**
 * The bottom strip in edit mode (vortex_map_editor_bottom_edit_xml): mini-map with zoom and grid,
 * layers (visible, locked), the zone's figures, and validation with "Vérifier la zone".
 */
export class BottomEditUi implements IPanelUi
{
    private readonly _miniMap: MiniMapUi | null;
    private readonly _grid: CheckBinding;
    private readonly _layerRows: IWindow[];
    private readonly _values: IWindow[];
    private readonly _issues: IItemListWindow | null;
    private _shownFindings = '';

    constructor(private readonly _window: IWindow, private readonly _app: EditorApp, private readonly _build: (layout: string) => IWindow | null)
    {
        const app = _app;
        const slot = child<IWindowContainer>(_window, 'minimap_slot');

        this._miniMap = slot ? new MiniMapUi(slot, _build, app) : null;
        onClick(_window, 'zoom_in', () => app.view.setZoom(app.view.zoom * 1.25));
        onClick(_window, 'zoom_out', () => app.view.setZoom(app.view.zoom / 1.25));
        this._grid = new CheckBinding(_window, 'show_grid', () => app.options.grid, () => app.toggleOption('grid'));

        // One row per layer, in LayerState.NAMES order: floor, decor, NPCs, spawns, zones, triggers, ambience.
        this._layerRows = children(_window, 'layer_row').slice(0, LayerState.NAMES.length);
        this._layerRows.forEach((row, i) =>
        {
            const layer = LayerState.NAMES[i];
            const swatch = (row as IWindowContainer).findChildByName('layer_swatch');

            if(swatch) swatch.color = LAYER_COLORS[layer];
            onClick(row, 'visibility_button', () =>
            {
                app.layers.setVisible(layer, !app.layers.isVisible(layer));
                app.refresh();
            });
            onClick(row, 'lock_button', () =>
            {
                app.layers.setLocked(layer, !app.layers.isLocked(layer));
                app.refresh();
            });
        });

        this._values = children(child(_window, 'infos') ?? _window, 'value');
        this._issues = child<IItemListWindow>(_window, 'issue_list');
        onClick(_window, 'validate_button', () => void app.verify());
    }

    render(): void
    {
        const app = this._app;
        const doc = app.doc;
        const floor = doc.floor;
        const used = floor.tiles.filter(t => !t.hole);

        this._miniMap?.draw();
        this._grid.render();

        this._layerRows.forEach((row, i) =>
        {
            const layer = LayerState.NAMES[i];
            const c = row as IWindowContainer;
            const eye = c.findChildByName('visibility_button');
            const lock = c.findChildByName('lock_button');

            if(eye) eye.color = app.layers.isVisible(layer) ? ON : OFF;
            if(lock) lock.color = app.layers.isLocked(layer) ? ON : OFF;
        });

        [
            `${floor.width} × ${floor.length}`,
            `${used.length} / ${floor.tiles.length}`,
            String(used.reduce((m, t) => Math.max(m, t.height ?? 0), 0)),
            String((doc.decor ?? []).length + (doc.wallDecor ?? []).length),
            String((doc.zones ?? []).length),
            String((doc.spawns ?? []).length),
            String((doc.triggers ?? []).length)
        ].forEach((text, i) =>
        {
            const value = (this._values[i] ?? null) as ITextWindow | null;

            if(value && value.text !== text) value.text = text;
        });

        this.renderIssues();
    }

    onViewChange(): void
    {
        this._miniMap?.draw();
    }

    private renderIssues(): void
    {
        const list = this._issues;

        if(!list) return;

        const local = this._app.localFindings;
        const findings: IZoneFinding[] = [
            ...local,
            ...this._app.serverFindings.filter(s => !local.some(l => l.code === s.code && l.elementId === s.elementId))
        ];
        const key = JSON.stringify(findings);

        // Rebuilt only when the findings change: rows are windows, not cheap.
        if(key === this._shownFindings) return;
        this._shownFindings = key;
        list.destroyListItems();

        for(const finding of findings.length ? findings : [null])
        {
            const row = this._build('vortex_map_editor_issue_row_xml');

            if(!row) return;

            const text = (row as IWindowContainer).findChildByName('issue_txt') as ITextWindow | null;

            if(text)
            {
                text.text = finding ? finding.message : 'Aucun problème : la zone est jouable.';
                text.textColor = !finding ? 0x2e7d32 : finding.severity === 'Error' ? 0xc62828 : 0xb26a00;
            }
            setText(row, 'issue_count', finding ? (finding.severity === 'Error' ? '⛔' : '⚠') : '✓');
            if(finding?.elementId) onWindowClick(row, () => this.focus(finding.elementId!));
            list.addListItem(row);
        }
    }

    /** Click-to-focus (S§50.3): the element is selected and the view centres on it. */
    private focus(id: string): void
    {
        const o = this._app.doc.decor?.find(d => d.id === id);

        if(!o) return;

        this._app.setCategory('decor');
        this._app.view.centerOn(o.x, o.y);
        this._app.select(EditorSelection.of(o.id));
    }
}
