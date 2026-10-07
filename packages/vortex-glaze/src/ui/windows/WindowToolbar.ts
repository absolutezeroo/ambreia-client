import type {IWindow} from '@core/window/IWindow';
import type {WindowController} from '@core/window/WindowController';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {Logger} from '@ambreia/common/utils/Logger';
import {effect, type Scope} from '@ambreia/common/reactive/index';
import {createWindowScope, bind} from '@core/window/reactive';
import {ZOOM_STEPS, type EditorState} from '../../state/EditorState';
import {signalsOf, type EditorSignals} from '../../state/EditorSignals';
import {downloadLayout, importLayoutXml, saveLayout} from '../../ops/LayoutSerializer';
import {distributeChildren} from '../../ops/StructuralOps';
import {toggleLocalisation} from '../../ops/LocaliseOps';
import {downloadLayoutPng} from '../../ops/ScreenshotOps';
import type {WindowGallery} from './WindowGallery';
import type {WindowPalette} from './WindowPalette';
import {slotsOf} from '../LayoutSlots';

const log = Logger.getLogger('glaze.ui.windows.WindowToolbar');

const SMALL_INPUT = slotsOf('glaze_smallinput_xml');

interface IContainerLike { addChild(child: IWindow): IWindow; }
interface IDropWidget { populate(items: unknown[]): void; selection: number; addEventListener(type: string, cb: () => void): void; }
interface IInputWidget { text: string; addEventListener(type: string, cb: () => void): void; }
interface ICheckWidget { isSelected: boolean; addEventListener(type: string, cb: () => void): void; }

/** One widget in the flow, with the box the reflow gives it. */
interface IBarItem
{
    window: IWindow;
    width: number;
    height: number;
    /** Starts a new row even when the current one still has room. */
    breakBefore: boolean;
    /** Packed from the right edge of its row instead of the left. */
    alignRight: boolean;
}

/** Cap the layout dropdown so populating doesn't build hundreds of item windows. */
const DROPDOWN_LIMIT = 200;

const EDGE_PADDING = 12;
const ROW_HEIGHT = 26;
const ROW_GAP = 8;
const ITEM_GAP = 5;

/**
 * WindowToolbar — the top action bar, built from Habbo button widgets.
 *
 * Buttons are Illumina `button` widgets; a `dropmenu` selects a registered layout
 * to edit. Actions with a concrete behavior are wired (Open/Import, Reload, Save,
 * Save As/Export, Save Screenshot); the rest log a notice until their subsystem
 * lands.
 *
 * The bar **reflows**: widgets are built once into a flow and {@link layout}
 * packs them into as many rows as the current canvas width needs, returning the
 * height the chrome should give the bar. Fixed rows meant that on anything
 * narrower than ~1700 px the last buttons — Image Gallery, Widgets — were laid out
 * past the right edge and simply could not be clicked.
 */
export class WindowToolbar
{
    private readonly _state: EditorState;
    private readonly _wm: EditorState['runtime']['windowManager'];
    private readonly _bar: IWindow;
    private readonly _items: IBarItem[] = [];
    private readonly _scope: Scope;
    private readonly _signals: EditorSignals;
    private _fileInput: HTMLInputElement | null = null;
    private _breakNext = false;
    private _alignRight = false;
    private readonly _gallery: WindowGallery | null;
    private readonly _palette: WindowPalette | null;

    public constructor(state: EditorState, bar: IWindow, gallery: WindowGallery | null, palette: WindowPalette | null = null)
    {
        this._state = state;
        this._wm = state.runtime.windowManager;
        this._bar = bar;
        this._gallery = gallery;
        this._palette = palette;
        this._scope = createWindowScope(bar);
        this._signals = signalsOf(state);

        this._scope.run(() => this.build());
    }

    /**
     * Packs the bar into `width` and returns the height it needs. Called by the
     * chrome on every resize, before it positions the panels below.
     */
    public layout(width: number): number
    {
        const rows: IBarItem[][] = [[]];
        let used = EDGE_PADDING;

        for(const item of this._items)
        {
            const row = rows[rows.length - 1];

            if(row.length && (item.breakBefore || used + item.width > width - EDGE_PADDING))
            {
                rows.push([item]);
                used = EDGE_PADDING + item.width + ITEM_GAP;

                continue;
            }

            row.push(item);
            used += item.width + ITEM_GAP;
        }

        rows.forEach((row, index) => this.layoutRow(row, index, width));

        return ROW_GAP + rows.length * (ROW_HEIGHT + ROW_GAP);
    }

    /**
     * Places one row: left-aligned items run out from the left margin, and the
     * `alignRight` ones are packed back from the right edge — that is where
     * Glaze keeps the align/distribute group.
     */
    private layoutRow(row: IBarItem[], index: number, width: number): void
    {
        const top = ROW_GAP + index * (ROW_HEIGHT + ROW_GAP);
        let left = EDGE_PADDING;
        let right = width - EDGE_PADDING;

        const place = (item: IBarItem, x: number): void =>
        {
            (item.window as unknown as WindowController).rectangle = {
                x,
                y: top + Math.round((ROW_HEIGHT - item.height) / 2),
                width: item.width,
                height: item.height
            };
        };

        for(const item of row)
        {
            if(item.alignRight) continue;

            place(item, left);
            left += item.width + ITEM_GAP;
        }

        for(let i = row.length - 1; i >= 0; i--)
        {
            const item = row[i];

            if(!item.alignRight) continue;

            right -= item.width;
            place(item, right);
            right -= ITEM_GAP;
        }
    }

    /**
     * Row 1 is Glaze's own file/asset strip, in its order; the port's extras
     * (New, Widgets) sit next to the actions they belong with. Row 2 keeps the
     * view tools on the left and the align/distribute group on the right, which
     * is how Glaze lays it out.
     */
    private build(): void
    {
        this.button('New', () => this.newFile());
        this.button('Open', () => this.importFile());
        this.button('Reload', () => this.reload());
        this.button('Save', () => void this.save());
        this.button('Save As', () => downloadLayout(this._state));
        this.button('Import', () => this.importFile());
        this.button('Export', () => downloadLayout(this._state));
        this.button('Refresh Assets', () => this.reload());
        this.button('Localise', () => void toggleLocalisation(this._state));
        this.button('Save Screenshot', () => this.saveScreenshot());
        this.button('Generate Screenshots', () => this.saveScreenshot());
        this.button('Batch Theme Convert', () => log.warn('Batch Theme Convert — batch over the whole asset set, not implemented'));
        this.layoutDropdown();
        this.label('Snap', 34);
        this.snapInput();
        this.button('Background', () => this.toggleBackground());
        this.button('Load Image', () => this.loadImage());
        this.button('Image Gallery', () => this._gallery?.toggle());
        this.button('Canvas Back Color', () => this.cycleBackColor());

        this.rowBreak();
        this.buildViewTools();
    }

    /** The view/geometry strip: it always starts its own row. */
    private buildViewTools(): void
    {
        this.label('Zoom', 36);
        this.zoomDropdown();
        // Sized from the initial caption — button() derives width from it, and
        // the old code froze that width at build time too.
        const modeButton = this.button(this.modeCaption(), () => this.toggleMode());

        // Follows the view revision, so a shortcut toggling the mode keeps the
        // caption honest without the old VIEW_CHANGED refresh handler.
        if(modeButton)
        {
            bind(modeButton, 'caption', () =>
            {
                this._signals.viewRev();

                return this.modeCaption();
            });
        }

        this.label('Guides', 44);
        this.guidesToggle();
        this.button('Widgets', () => this._palette?.toggle());

        this._alignRight = true;
        this.button('Align L', () => this._state.alignSelected('left'));
        this.button('Align R', () => this._state.alignSelected('right'));
        this.button('Align T', () => this._state.alignSelected('top'));
        this.button('Align B', () => this._state.alignSelected('bottom'));
        this.button('Distribute V', () => this.distribute('v'));
        this.button('Distribute H', () => this.distribute('h'));
        this.button('Center V', () => this._state.alignSelected('vmiddle'));
        this.button('Center H', () => this._state.alignSelected('hcenter'));
        this._alignRight = false;
    }

    /**
     * Distributes the selection when three or more nodes are picked, and falls
     * back to spreading the selected container's own children otherwise — the
     * behaviour Glaze's toolbar had before multi-selection existed.
     */
    private distribute(axis: 'h' | 'v'): void
    {
        if(!this._state.distributeSelected(axis))
        {
            distributeChildren(this._state, axis);
        }
    }

    private modeCaption(): string
    {
        return this._state.mode === 'edit' ? 'Mode: Edit' : 'Mode: Preview';
    }

    /**
     * Preview hands the canvas centre back to the edited layout, so its buttons,
     * tabs and lists can be clicked for real; Edit takes it back for selection.
     */
    private toggleMode(): void
    {
        this._state.mode = this._state.mode === 'edit' ? 'preview' : 'edit';
    }

    private toggleBackground(): void
    {
        const bg = this._state.canvasBg;

        bg.image = null;
        bg.mode = bg.mode === 'checker' ? 'solid' : 'checker';
    }

    private cycleBackColor(): void
    {
        const palette = [0xffe7e7f4, 0xffffffff, 0xffcfd2e0, 0xff33333f, 0xff2b6b78];
        const bg = this._state.canvasBg;
        const i = palette.indexOf(bg.color >>> 0);

        bg.image = null;
        bg.mode = 'solid';
        bg.color = palette[(i + 1) % palette.length];
    }

    private loadImage(): void
    {
        const input = document.createElement('input');

        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (): void =>
        {
            const file = input.files?.[0];

            if(!file) return;

            const url = URL.createObjectURL(file);
            const img = new Image();

            img.onload = (): void => { this._state.canvasBg.image = img; };
            img.src = url;
        };
        input.click();
    }

    // ---- Flow builders -----------------------------------------------------

    /** Marks the next widget as the start of a new row. */
    private rowBreak(): void
    {
        this._breakNext = true;
    }

    private add(window: IWindow | null, width: number, height: number): void
    {
        if(!window) return;

        (this._bar as unknown as IContainerLike).addChild(window);
        this._items.push({window, width, height, breakBefore: this._breakNext, alignRight: this._alignRight});
        this._breakNext = false;
    }

    private label(text: string, width: number): void
    {
        const lbl = this._wm.buildWidgetLayout('glaze_label_xml');

        if(!lbl) return;

        // The layout root IS the text element.
        (lbl as unknown as { text: string }).text = text;
        this.add(lbl, width, 16);
    }

    private snapInput(): void
    {
        const box = this._wm.buildWidgetLayout('glaze_smallinput_xml');

        if(!box) return;

        const input = SMALL_INPUT.findAs<IInputWidget>(box, 'glaze_siinput');

        this.add(box, 54, 22);

        if(input)
        {
            input.text = String(this._state.snap);
            input.addEventListener('WE_CHANGE', () => { this._state.snap = Number(input.text) || 0; });
        }
    }

    private layoutDropdown(): void
    {
        const dd = this._wm.buildWidgetLayout('glaze_dropdown_xml');

        if(!dd)
        {
            return;
        }

        this.add(dd, 210, 24);

        const drop = dd as unknown as IDropWidget;
        const names = this._state.getLayoutNames().slice(0, DROPDOWN_LIMIT);

        drop.populate(names);
        drop.addEventListener('WE_SELECTED', () =>
        {
            const name = names[drop.selection];

            if(name)
            {
                this._state.openLayout(name);
            }
        });
    }

    private zoomDropdown(): void
    {
        const dd = this._wm.buildWidgetLayout('glaze_dropdown_xml');

        if(!dd) return;

        this.add(dd, 76, 22);

        const drop = dd as unknown as IDropWidget;
        const labels = ZOOM_STEPS.map((step) => `${Math.round(step * 100)}%`);

        drop.populate(labels);

        // The dropdown's `selection` setter dispatches WE_SELECTED, so the
        // programmatic sync (zoom changed by a shortcut) must not read back as
        // a user pick.
        let syncing = false;

        effect(() =>
        {
            this._signals.viewRev();

            const index = ZOOM_STEPS.indexOf(this._state.zoom);

            if(index >= 0 && drop.selection !== index && !(drop as unknown as IWindow).disposed)
            {
                syncing = true;

                try
                {
                    drop.selection = index;
                }
                finally
                {
                    syncing = false;
                }
            }
        });

        drop.addEventListener('WE_SELECTED', () =>
        {
            if(syncing) return;

            const step = ZOOM_STEPS[drop.selection];

            if(step) this._state.zoom = step;
        });
    }

    /**
     * Glaze's switches are the red/green Illumina switch, not a checkbox — the
     * `checkbox intent="switch" style="100"` element description.
     */
    private guidesToggle(): void
    {
        const chk = this._wm.buildWidgetLayout('glaze_switch_xml');

        if(!chk) return;

        this.add(chk, 38, 21);

        const widget = chk as unknown as ICheckWidget;

        widget.isSelected = this._state.smartGuides;
        widget.addEventListener('WE_SELECTED', () => { this._state.smartGuides = true; });
        widget.addEventListener('WE_UNSELECTED', () => { this._state.smartGuides = false; });
    }

    private button(caption: string, onClick: () => void): WindowController | null
    {
        const btn = this._wm.buildWidgetLayout('glaze_button_xml');

        if(!btn)
        {
            return null;
        }

        const bc = btn as unknown as WindowController;

        bc.caption = caption;
        bc.procedure = (event: WindowEvent): void =>
        {
            if(event.type === WindowMouseEvent.CLICK)
            {
                onClick();
            }
        };
        // The caption setter auto-sizes the button to its text; the old
        // `length * 7` estimate ran ~40 % wide and pushed row 1 onto a third row.
        this.add(btn, Math.max(40, bc.width), ROW_HEIGHT);

        return bc;
    }

    private reload(): void
    {
        const name = this._state.currentLayoutName;

        if(name)
        {
            this._state.openLayout(name);
        }
    }

    private async save(): Promise<void>
    {
        const result = await saveLayout(this._state);

        log.info(`Save: ${result.message}`);
    }

    private saveScreenshot(): void
    {
        void downloadLayoutPng(this._state);
    }

    /**
     * Starts an empty layout — no root, nothing on the canvas. The name is the
     * file Save writes, so it is held to the same `[A-Za-z0-9_]` charset the
     * save middleware accepts.
     */
    private newFile(): void
    {
        const name = (window.prompt('New layout name', 'my_layout') ?? '').replace(/[^A-Za-z0-9_]/g, '_');

        if(!name || name === '_')
        {
            return;
        }

        this._state.newBlankLayout(name);
    }

    private importFile(): void
    {
        if(!this._fileInput)
        {
            this._fileInput = document.createElement('input');
            this._fileInput.type = 'file';
            this._fileInput.accept = '.xml';
            this._fileInput.style.display = 'none';
            document.body.appendChild(this._fileInput);
        }

        const input = this._fileInput;

        input.value = '';
        input.onchange = (): void =>
        {
            const file = input.files?.[0];

            if(!file)
            {
                return;
            }

            const reader = new FileReader();

            reader.onload = (): void =>
            {
                const xml = String(reader.result ?? '');
                const name = `imported_${file.name.replace(/\.xml$/i, '').replace(/[^A-Za-z0-9_]/g, '_')}`;

                if(!importLayoutXml(this._state, xml, name))
                {
                    log.warn('Import failed');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    public dispose(): void
    {
        this._scope.dispose();
        this._fileInput?.remove();
        this._fileInput = null;
    }
}
