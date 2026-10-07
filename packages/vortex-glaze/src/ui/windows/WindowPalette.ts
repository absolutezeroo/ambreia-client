import type {IWindow} from '@core/window/IWindow';
import type {WindowController} from '@core/window/WindowController';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {TYPE_NAME_TO_CODE} from '@core/window/enum/WindowType';
import {Logger} from '@ambreia/common/utils/Logger';
import {addWidget} from '../../ops/StructuralOps';
import {assertCatalogCoverage, catalogByCategory, type IWidgetSpec} from '../../ops/WidgetCatalog';
import {type EditorState} from '../../state/EditorState';
import {closesOnHeaderButton, fitPopupToDesktop} from './PopupChrome';
import {slotsOf} from '../LayoutSlots';

const log = Logger.getLogger('glaze.ui.windows.WindowPalette');

const PALETTE = slotsOf('glaze_palette_xml');
const PALETTE_ROW = slotsOf('glaze_palette_row_xml');

interface IContainerLike { addChild(child: IWindow): IWindow; }
interface IListLike { addListItem(item: IWindow): IWindow; destroyListItems(): void; }

const PALETTE_LAYER = 3;

/** Category header row: full-width, indented, tinted away from the entries. */
const HEADER_HEIGHT = 18;
const HEADER_COLOR = 0xff7fd4e0;

/**
 * What a pick does.
 *
 * `add` inserts the widget under the selection — the Widgets popup's own job.
 * `pick` reports the chosen spec and inserts nothing, which is how the hierarchy
 * strip's type button reaches all 94 types without a 94-item drop menu (the
 * ported `dropmenu` expands to its full item height, with no scrolling).
 */
export type PaletteMode = 'add' | 'pick';

/**
 * WindowPalette — the widget library, as a popup of live previews.
 *
 * Glaze only ever offered a type dropdown; Clove pairs each entry with a rendered
 * thumbnail so a control is picked by sight. Here the preview needs no snapshot
 * machinery at all: each row builds a **real instance** of the window type inside
 * itself, so what the list shows is the widget as the engine will actually draw it
 * — including the current theme's skin. Clicking a row creates the same spec under
 * the selected node.
 *
 * The list covers every type the layout parser knows, grouped by category; see
 * {@link WIDGET_CATALOG} for the three tags it leaves out and why.
 */
export class WindowPalette
{
    private readonly _state: EditorState;
    private readonly _wm: EditorState['runtime']['windowManager'];
    private _frame: IWindow | null = null;
    private _mode: PaletteMode = 'add';
    private _onPick: ((spec: IWidgetSpec) => void) | null = null;

    public constructor(state: EditorState)
    {
        this._state = state;
        this._wm = state.runtime.windowManager;

        if(import.meta.env.DEV)
        {
            const {missing, unknown} = assertCatalogCoverage();

            if(missing.length > 0) log.warn(`Window types the palette does not offer: ${missing.join(', ')}`);
            if(unknown.length > 0) log.warn(`Palette entries the parser does not know: ${unknown.join(', ')}`);
        }
    }

    /**
     * Opens the library, or closes it if it is already up.
     *
     * @param mode - `add` (default) inserts the picked widget; `pick` reports it.
     * @param onPick - Called with the chosen spec in `pick` mode.
     */
    public toggle(mode: PaletteMode = 'add', onPick: ((spec: IWidgetSpec) => void) | null = null): void
    {
        if(this._frame && !this._frame.disposed)
        {
            const sameMode = this._mode === mode;

            this.close();

            // Re-opening in a different mode is a mode switch, not a toggle-off.
            if(sameMode) return;
        }

        this._mode = mode;
        this._onPick = onPick;
        this.open();
    }

    private open(): void
    {
        const frame = this._wm.buildWidgetLayout('glaze_palette_xml', PALETTE_LAYER);

        if(!frame) return;

        const desktop = this._wm.getDesktop(PALETTE_LAYER);

        if(!frame.parent && desktop)
        {
            (desktop as unknown as IContainerLike).addChild(frame);
        }

        (frame as unknown as WindowController).caption = this._mode === 'pick' ? 'Choose type' : 'Widgets';

        fitPopupToDesktop(frame, desktop, PALETTE.find(frame, 'glaze_palette_list'));
        closesOnHeaderButton(frame, () => this.close());

        this._frame = frame;
        this._state.modalOpen = true;

        const list = PALETTE.findAs<IListLike>(frame, 'glaze_palette_list');

        if(list) this.populate(list);
    }

    private populate(list: IListLike): void
    {
        for(const group of catalogByCategory())
        {
            const offered = group.specs.filter((spec) =>
            {
                if(TYPE_NAME_TO_CODE[spec.type] !== undefined) return true;

                log.warn(`Palette entry "${spec.type}" is not a known window type — skipped`);

                return false;
            });

            if(offered.length === 0) continue;

            this.addHeader(list, group.category);

            for(const spec of offered)
            {
                const row = this._wm.buildWidgetLayout('glaze_palette_row_xml');

                if(!row) continue;

                PALETTE_ROW.setText(row, 'glaze_wrow_label', spec.label);
                PALETTE_ROW.setText(row, 'glaze_wrow_type', spec.type);
                this.buildPreview(PALETTE_ROW.find(row, 'glaze_wrow_preview'), spec);

                (row as unknown as WindowController).procedure = (event: WindowEvent): void =>
                {
                    if(event.type === WindowMouseEvent.CLICK) this.pick(spec);
                };

                list.addListItem(row);
            }
        }
    }

    /** A non-interactive category caption between two runs of entries. */
    private addHeader(list: IListLike, category: string): void
    {
        const header = this._wm.buildWidgetLayout('glaze_label_xml');

        if(!header) return;

        // `glaze_label_xml`'s root IS the text node, so the caption goes on the
        // instance itself — `findChildByName('glaze_lbl')` never matches the root.
        const controller = header as unknown as WindowController;

        controller.caption = category.toUpperCase();
        controller.color = HEADER_COLOR;
        controller.rectangle = {x: 0, y: 0, width: 200, height: HEADER_HEIGHT};
        controller.setParamFlag(1, false);

        list.addListItem(header);
    }

    /** Builds a real instance of the spec inside the row's preview box. */
    private buildPreview(host: IWindow | null, spec: IWidgetSpec): void
    {
        if(!host || host.disposed) return;

        const type = TYPE_NAME_TO_CODE[spec.type];
        const width = Math.min(spec.width, host.width - 8);
        const height = Math.min(spec.height, host.height - 8);

        try
        {
            const preview = host.context.create(
                `preview_${spec.type}`, spec.caption ?? '', type, host.style, spec.params ?? 0,
                {x: 4, y: Math.max(2, Math.round((host.height - height) / 2)), width, height},
                null, host, 0, null, '', null
            );

            if(!preview)
            {
                log.warn(`Preview for "${spec.type}" built nothing — type ${type} has no controller`);

                return;
            }

            // A preview must never react to the mouse: the click belongs to the row.
            (preview as unknown as WindowController).setParamFlag(1, false);
        }
        catch (error)
        {
            log.warn(`Preview for "${spec.type}" failed to build`, error);
        }
    }

    private pick(spec: IWidgetSpec): void
    {
        if(this._mode === 'pick')
        {
            this._onPick?.(spec);
            this.close();

            return;
        }

        const created = addWidget(this._state, spec);

        if(!created)
        {
            log.warn(`Could not add "${spec.type}" — no valid parent selected`);
        }

        this.close();
    }

    private close(): void
    {
        this._frame?.destroy();
        this._frame = null;
        this._state.modalOpen = false;
    }

    public dispose(): void
    {
        this.close();
    }
}
