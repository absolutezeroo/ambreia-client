import type {IWindow} from '@ambreia/ui/IWindow';
import type {WindowController} from '@ambreia/ui/WindowController';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import {WindowMouseEvent} from '@ambreia/ui/events/WindowMouseEvent';
import {WindowParam} from '@ambreia/ui/enum/WindowParam';
import {type EditorState} from '../../state/EditorState';
import {closesOnHeaderButton, fitPopupToDesktop} from './PopupChrome';
import {slotsOf} from '../LayoutSlots';

const PICKER = slotsOf('glaze_colorpicker_xml');
const SMALL_INPUT = slotsOf('glaze_smallinput_xml');

interface IContainerLike { addChild(child: IWindow): IWindow; }
interface IInputWidget { text: string; addEventListener(type: string, cb: () => void): void; }

const PICKER_LAYER = 3;
const COLUMNS = 10;
const HUE_ROWS = 5;
const CELL_W = 26;
const CELL_H = 22;
const GRID_TOP = 34;

/**
 * WindowColorPicker — a swatch grid + hex field for any ARGB property.
 *
 * Glaze itself only ever offered the raw hex field the Property Editor still has;
 * this is Clove's colour picker rebuilt out of Habbo widgets. The grid is a
 * greyscale ramp plus a hue × lightness table, generated rather than hard-coded so
 * the whole range is reachable, and the hex field stays authoritative for exact
 * values (alpha included — Habbo colours are 0xAARRGGBB).
 *
 * The popup is shared: opening it again retargets it at the new property.
 */
export class WindowColorPicker
{
    private readonly _state: EditorState;
    private readonly _wm: EditorState['runtime']['windowManager'];
    private _frame: IWindow | null = null;
    private _preview: WindowController | null = null;
    private _input: IInputWidget | null = null;
    private _onPick: ((color: number) => void) | null = null;
    private _current = 0xffffffff;

    public constructor(state: EditorState)
    {
        this._state = state;
        this._wm = state.runtime.windowManager;
    }

    public get isOpen(): boolean
    {
        return this._frame !== null && !this._frame.disposed;
    }

    /**
     * Opens the picker on `initial`, calling `onPick` for every change (swatch
     * click or hex edit) so the edited window updates live.
     */
    public open(caption: string, initial: number, onPick: (color: number) => void): void
    {
        this.close();

        const frame = this._wm.buildWidgetLayout('glaze_colorpicker_xml', PICKER_LAYER);

        if(!frame) return;

        const desktop = this._wm.getDesktop(PICKER_LAYER);

        if(!frame.parent && desktop)
        {
            (desktop as unknown as IContainerLike).addChild(frame);
        }

        const controller = frame as unknown as WindowController;

        controller.caption = caption;
        fitPopupToDesktop(frame, desktop, PICKER.find(frame, 'glaze_cp_body'));
        closesOnHeaderButton(frame, () => this.close());

        this._frame = frame;
        this._onPick = onPick;
        this._current = initial >>> 0;
        this._state.modalOpen = true;

        const body = PICKER.find(frame, 'glaze_cp_body');

        if(body)
        {
            this.buildHeader(body);
            this.buildGrid(body);
        }
    }

    private buildHeader(body: IWindow): void
    {
        this._preview = this.swatch(body, 0, 0, 46, 24, this._current);

        const box = this._wm.buildWidgetLayout('glaze_smallinput_xml');

        if(box)
        {
            (body as unknown as IContainerLike).addChild(box);
            (box as unknown as WindowController).rectangle = {x: 54, y: 1, width: 130, height: 22};

            const input = SMALL_INPUT.findAs<IInputWidget>(box, 'glaze_siinput');

            if(input)
            {
                input.text = this.hex(this._current);
                input.addEventListener('WE_CHANGE', () =>
                {
                    const parsed = this.parseHex(input.text);

                    if(parsed !== null) this.apply(parsed, false);
                });
                this._input = input;
            }
        }

        const close = this._wm.buildWidgetLayout('glaze_button_xml');

        if(close)
        {
            const button = close as unknown as WindowController;

            button.caption = 'Close';
            (body as unknown as IContainerLike).addChild(close);
            button.rectangle = {x: 192, y: 0, width: 62, height: 24};
            button.procedure = (event: WindowEvent): void =>
            {
                if(event.type === WindowMouseEvent.CLICK) this.close();
            };
        }
    }

    private buildGrid(body: IWindow): void
    {
        // Row 0 — greyscale, then one row per lightness step across the hues.
        for(let column = 0; column < COLUMNS; column++)
        {
            const level = Math.round((column / (COLUMNS - 1)) * 255);

            this.pickable(body, column * CELL_W, GRID_TOP, (0xff << 24 | level << 16 | level << 8 | level) >>> 0);
        }

        for(let row = 0; row < HUE_ROWS; row++)
        {
            const lightness = 0.75 - (row * 0.13);

            for(let column = 0; column < COLUMNS; column++)
            {
                const hue = (column / COLUMNS) * 360;

                this.pickable(body, column * CELL_W, GRID_TOP + (row + 1) * CELL_H, this.hsl(hue, 0.68, lightness));
            }
        }

        // The Habbo UI's own recurring tints, worth one click.
        const presets = [0xffffffff, 0xff000000, 0x00ffffff, 0xffe7e7f4, 0xff33333f, 0xff2b6b78, 0xffef9a9a, 0xff12b5c9, 0xff6c5ce7, 0xfff5a623];

        for(let column = 0; column < presets.length; column++)
        {
            this.pickable(body, column * CELL_W, GRID_TOP + (HUE_ROWS + 1) * CELL_H + 8, presets[column]);
        }
    }

    private pickable(parent: IWindow, x: number, y: number, color: number): void
    {
        const swatch = this.swatch(parent, x, y, CELL_W - 2, CELL_H - 2, color);

        if(!swatch) return;

        // The shared swatch layout is a passive region (`params="0"`); a grid cell
        // has to opt into input events to be clickable at all.
        swatch.setParamFlag(WindowParam.INPUT_EVENT_PROCESSOR, true);
        swatch.procedure = (event: WindowEvent): void =>
        {
            if(event.type === WindowMouseEvent.CLICK) this.apply(color, true);
        };
    }

    private swatch(parent: IWindow, x: number, y: number, width: number, height: number, color: number): WindowController | null
    {
        const win = this._wm.buildWidgetLayout('glaze_swatch_xml');

        if(!win) return null;

        const controller = win as unknown as WindowController;

        (parent as unknown as IContainerLike).addChild(win);
        controller.rectangle = {x, y, width, height};
        controller.color = color >>> 0;

        return controller;
    }

    private apply(color: number, syncInput: boolean): void
    {
        this._current = color >>> 0;

        if(this._preview && !this._preview.disposed)
        {
            this._preview.color = this._current;
        }

        if(syncInput && this._input)
        {
            this._input.text = this.hex(this._current);
        }

        this._onPick?.(this._current);
    }

    /** `0xAARRGGBB`, the form the Property Editor's colour field uses. */
    private hex(color: number): string
    {
        return `0x${(color >>> 0).toString(16).padStart(8, '0')}`;
    }

    private parseHex(text: string): number | null
    {
        const raw = text.trim().replace(/^0x/i, '').replace(/^#/, '');

        if(!/^[0-9a-f]{1,8}$/i.test(raw)) return null;

        const value = parseInt(raw, 16);

        if(Number.isNaN(value)) return null;

        // A 6-digit value is opaque RGB; anything shorter is taken as written.
        return (raw.length <= 6 ? (0xff000000 | value) : value) >>> 0;
    }

    /** HSL → 0xFFRRGGBB, so the grid covers the whole wheel without a table. */
    private hsl(hue: number, saturation: number, lightness: number): number
    {
        const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
        const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = lightness - c / 2;
        const sector = Math.floor(hue / 60) % 6;
        const [r, g, b] = sector === 0 ? [c, x, 0]
            : sector === 1 ? [x, c, 0]
                : sector === 2 ? [0, c, x]
                    : sector === 3 ? [0, x, c]
                        : sector === 4 ? [x, 0, c]
                            : [c, 0, x];

        const to8 = (value: number): number => Math.max(0, Math.min(255, Math.round((value + m) * 255)));

        return (0xff << 24 | to8(r) << 16 | to8(g) << 8 | to8(b)) >>> 0;
    }

    public close(): void
    {
        this._frame?.destroy();
        this._frame = null;
        this._preview = null;
        this._input = null;
        this._onPick = null;
        this._state.modalOpen = false;
    }

    public dispose(): void
    {
        this.close();
    }
}
