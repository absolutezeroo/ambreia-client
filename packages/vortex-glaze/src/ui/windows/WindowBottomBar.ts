import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {WindowParam} from '@ambreia/ui/enum/WindowParam';
import {Logger} from '@ambreia/common/utils/Logger';
import {type Scope} from '@ambreia/common/reactive/index';
import {createWindowScope, bind, on} from '@ambreia/ui/reactive/index';
import {type EditorState} from '../../state/EditorState';
import {signalsOf, type EditorSignals} from '../../state/EditorSignals';
import type {WindowColorPicker} from './WindowColorPicker';

const log = Logger.getLogger('glaze.ui.windows.WindowBottomBar');

/** The Illumina switch's fixed box (the skin pins height to 21). */
const SWITCH_W = 38;
const SWITCH_H = 21;

interface IContainerLike { addChild(child: IWindow): IWindow; }
interface ICheckWidget extends IWindow { isSelected: boolean; }
interface IDropWidget extends IWindow { populate(items: unknown[]): void; selection: number; }
type ILabelWidget = IWindow & { text: string };

/**
 * WindowBottomBar — Glaze's status bar, as Habbo widgets.
 *
 * Debug-view toggles (Show Tags / Debug Rects / Show scaler), the current
 * selection's colour (swatch + hex), the live mouse coordinates, and a Locales
 * dropdown.
 *
 * Construction is one-shot and stays imperative; what varies is bound. The
 * colour readout follows the tree revision too, so editing the colour from the
 * Property Editor updates the swatch — under the old SELECTION_CHANGED-only
 * refresh it went stale.
 */
export class WindowBottomBar
{
    private readonly _state: EditorState;
    private readonly _wm: EditorState['runtime']['windowManager'];
    private readonly _bar: IWindow;
    private readonly _colorPicker: WindowColorPicker | null;
    private readonly _scope: Scope;
    private readonly _signals: EditorSignals;
    private _x = 12;
    private _coords: ILabelWidget | null = null;
    private _rafId = 0;
    /** Widgets Glaze packs against the right edge, with the x `build()` gave them. */
    private readonly _right: { window: WindowController; x: number }[] = [];
    private _collectRight = false;
    private _rightEnd = 0;
    private _shift = 0;

    public constructor(state: EditorState, bar: IWindow, colorPicker: WindowColorPicker | null = null)
    {
        this._state = state;
        this._wm = state.runtime.windowManager;
        this._bar = bar;
        this._colorPicker = colorPicker;
        this._scope = createWindowScope(bar);
        this._signals = signalsOf(state);

        this._scope.run(() => this.build());
        this.startCoordsLoop();
    }

    /** The selection's current colour, or white when nothing is selected. */
    private selectedColor(): number
    {
        const sel = this._state.selected as unknown as WindowController | null;

        return sel && !sel.disposed ? (sel.color >>> 0) : 0xffffffff;
    }

    /**
     * Packs the readouts against the right edge, which is where Glaze keeps
     * them — only Show Tags stays on the left. Called by the chrome on resize.
     */
    public layout(width: number): void
    {
        const shift = Math.max(0, Math.round(width - 12 - this._rightEnd));

        if(shift === this._shift) return;

        this._shift = shift;

        for(const item of this._right)
        {
            if(!item.window.disposed) item.window.x = item.x + shift;
        }
    }

    private build(): void
    {
        this.toggle('Show Tags', () => this._state.showTags, (v) => { this._state.showTags = v; this._state.notifyDebugChanged(); });

        this._collectRight = true;
        this.toggle('Debug Rects', () => this._state.debugRects, (v) => { this._state.debugRects = v; this._state.notifyDebugChanged(); });
        this.toggle('Show scaler', () => this._state.showScaler, (v) => { this._state.showScaler = v; this._state.notifyDebugChanged(); });

        this._x += 14;
        this.label('Colour', this._x, 7, 44);
        this._x += 48;

        const swatch = this.swatch();

        this._x += 24;

        const colorLabel = this.labelRef('', this._x, 7, 78);

        this._x += 84;

        if(swatch)
        {
            bind(swatch, 'color', () =>
            {
                this._signals.selectionRev();
                this._signals.treeRev();

                return this.selectedColor();
            });
        }

        if(colorLabel)
        {
            bind(colorLabel, 'text', () =>
            {
                this._signals.selectionRev();
                this._signals.treeRev();

                return `0x${this.selectedColor().toString(16).padStart(8, '0')}`;
            });
        }

        this.label('Coords', this._x, 7, 46);
        this._x += 50;
        this._coords = this.labelRef('0, 0', this._x, 7, 80);
        this._x += 86;

        this.label('Locales', this._x, 7, 50);
        this._x += 54;
        this.locales();

        this._x += 14;
        this.label('Selected', this._x, 7, 56);
        this._x += 60;

        const selectionLabel = this.labelRef('1', this._x, 7, 40);

        this._x += 46;

        if(selectionLabel)
        {
            bind(selectionLabel, 'text', () =>
            {
                this._signals.selectionRev();

                return String(this._state.selection.length);
            });
        }

        this._rightEnd = this._x;
        this._collectRight = false;
    }

    /** Positions one widget and, while collecting, records it for the right pack. */
    private place(win: IWindow, x: number, y: number, width: number, height: number): void
    {
        const controller = win as unknown as WindowController;

        controller.rectangle = {x, y, width, height};

        if(this._collectRight) this._right.push({window: controller, x});
    }

    /**
     * Glaze's switches are the red/green Illumina switch, not a checkbox — the
     * `checkbox intent="switch" style="100"` element description, which draws
     * from `illumina_light_switch.png`.
     */
    private toggle(text: string, read: () => boolean, write: (v: boolean) => void): void
    {
        const width = text.length * 7 + 4;

        this.label(text, this._x, 7, width);
        this._x += width;

        const chk = this._wm.buildWidgetLayout('glaze_switch_xml');

        if(!chk) return;

        (this._bar as unknown as IContainerLike).addChild(chk);
        this.place(chk, this._x, 3, SWITCH_W, SWITCH_H);
        this._x += SWITCH_W + 8;

        const widget = chk as unknown as ICheckWidget;

        // Follows the debug revision so a toggle flipped elsewhere (a shortcut,
        // another panel) is reflected here too.
        bind(widget, 'isSelected', () =>
        {
            this._signals.debugRev();

            return read();
        });
        on(widget, 'WE_SELECTED', () => write(true));
        on(widget, 'WE_UNSELECTED', () => write(false));
    }

    private label(text: string, x: number, y: number, width: number): void
    {
        const lbl = this._wm.buildWidgetLayout('glaze_label_xml');

        if(!lbl) return;

        (lbl as unknown as { text: string }).text = text;
        (this._bar as unknown as IContainerLike).addChild(lbl);
        this.place(lbl, x, y, width, 16);
    }

    private labelRef(text: string, x: number, y: number, width: number): ILabelWidget | null
    {
        const lbl = this._wm.buildWidgetLayout('glaze_label_xml');

        if(!lbl) return null;

        (lbl as unknown as { text: string }).text = text;
        (this._bar as unknown as IContainerLike).addChild(lbl);
        this.place(lbl, x, y, width, 16);

        return lbl as unknown as ILabelWidget;
    }

    /** The selection's colour, and the shortcut into the colour picker. */
    private swatch(): WindowController | null
    {
        const sw = this._wm.buildWidgetLayout('glaze_swatch_xml');

        if(!sw) return null;

        const controller = sw as unknown as WindowController;

        (this._bar as unknown as IContainerLike).addChild(sw);
        this.place(sw, this._x, 5, 18, 18);
        // The swatch layout is a passive region — opt it into input events so the
        // picker can be opened from here as well as from the Property Editor.
        controller.setParamFlag(WindowParam.INPUT_EVENT_PROCESSOR, true);
        controller.procedure = (event: WindowEvent): void =>
        {
            if(event.type !== WindowMouseEvent.CLICK) return;

            const selected = this._state.selected as unknown as WindowController | null;

            if(!selected || selected.disposed || !this._colorPicker) return;

            this._colorPicker.open('color', selected.color >>> 0, (color) =>
            {
                this._state.pushHistory('color:bottombar');
                selected.color = color >>> 0;
                // notifyTreeChanged pulses treeRev — the swatch and hex binds
                // above pick the new colour up from there.
                this._state.notifyTreeChanged();
            });
        };

        return controller;
    }

    private locales(): void
    {
        const dd = this._wm.buildWidgetLayout('glaze_dropdown_xml');

        if(!dd) return;

        (this._bar as unknown as IContainerLike).addChild(dd);
        this.place(dd, this._x, 3, 120, 22);

        const drop = dd as unknown as IDropWidget;
        const locales = ['en', 'fr', 'de', 'es', 'it', 'nl', 'pt', 'fi'];

        drop.populate(locales);
        on(drop, 'WE_SELECTED', () => log.info(`Locale: ${locales[drop.selection]} — not applied (Glaze editor)`));
    }

    /**
     * The coords readout stays a rAF poll: `state.mouse` is mutated per-frame
     * by the canvas layer without any event, so a signal would change nothing —
     * it would still be written every frame. Equality-guarded, like before.
     */
    private startCoordsLoop(): void
    {
        const loop = (): void =>
        {
            if(this._coords)
            {
                const label = `${this._state.mouse.x}, ${this._state.mouse.y}`;

                if(this._coords.text !== label)
                {
                    this._coords.text = label;
                }
            }

            this._rafId = requestAnimationFrame(loop);
        };

        this._rafId = requestAnimationFrame(loop);
    }

    public dispose(): void
    {
        if(this._rafId) cancelAnimationFrame(this._rafId);

        this._scope.dispose();
    }
}
