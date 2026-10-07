import type {IWindow} from '@core/window/IWindow';
import type {WindowController} from '@core/window/WindowController';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {TYPE_CODE_TO_NAME, TYPE_NAME_TO_CODE} from '@core/window/enum/WindowType';
import {WindowParam} from '@core/window/enum/WindowParam';
import {signal, computed, effect, type Scope, type SignalReader} from '@ambreia/common/reactive/index';
import {createWindowScope, bind, on, each, type IReconcilableList} from '@core/window/reactive';
import {type EditorState} from '../../state/EditorState';
import {signalsOf, type EditorSignals} from '../../state/EditorSignals';
import {Logger} from '@ambreia/common/utils/Logger';
import {themeNames} from '../../ops/ThemeOps';
import {convertSelected} from '../../ops/StructuralOps';
import {applyVariablesLive} from '../../ops/VariableOps';
import type {WindowColorPicker} from './WindowColorPicker';
import {slotsOf} from '../LayoutSlots';

const log = Logger.getLogger('glaze.ui.windows.WindowProperty');

const GROUP_ROW = slotsOf('glaze_prop_group_xml');
const INPUT_ROW = slotsOf('glaze_prop_input_xml');
const CHECK_ROW = slotsOf('glaze_prop_check_xml');
const DROP_ROW = slotsOf('glaze_prop_drop_xml');
const COLOR_ROW = slotsOf('glaze_prop_color_xml');
const VAR_ROW = slotsOf('glaze_prop_var_xml');
const ADDVAR_ROW = slotsOf('glaze_prop_addvar_xml');

interface IListLike { destroyListItems(): void; }
interface IInputWidget extends IWindow { text: string; }
interface ICheckWidget extends IWindow { isSelected: boolean; }
interface IDropWidget extends IWindow { populate(items: unknown[]): void; selection: number; }
interface IThemeManagerLike
{
    getStyle(themeName: string, elementType: number, intent: string): number;
    getThemeAndIntent(elementType: number, style: number): { theme: string; intent: string };
}

const MIN_LIMIT = -2147483648;
const MAX_LIMIT = 2147483647;

/** Where a check row's box sits, by row kind (see {@link WindowProperty.buildCheck}). */
const CHECK_X_PROPERTY = 132;
const CHECK_X_FLAG = 198;

/** One property row, described as data. `id` is the reconciliation key and its
 *  `kind` prefix guarantees a row window is never asked to change shape. */
type IRowDesc =
    | { id: string; kind: 'group'; label: string }
    | { id: string; kind: 'input'; label: string; type: string; live: boolean; historyKey: string | null;
        read: () => string; write: ((v: string) => void) | null }
    | { id: string; kind: 'check'; label: string; type: string; read: () => boolean; write: (b: boolean) => void }
    | { id: string; kind: 'drop'; label: string; options: string[]; current: () => number;
        onSelect: (index: number) => void }
    | { id: string; kind: 'color'; label: string; historyKey: string; read: () => number; write: (c: number) => void }
    | { id: string; kind: 'var'; label: string; type: string; value: string; key: string; node: string;
        win: WindowController }
    | { id: string; kind: 'addvar'; node: string; win: WindowController };

/** A version signal: read it to depend on it, pulse it to invalidate readers. */
const pulse = (): [SignalReader<number>, () => void] =>
{
    const [read, write] = signal(0);
    let n = 0;

    return [read, (): void => write(++n)];
};

/**
 * WindowProperty — the "Property Editor", rendered as Habbo widget rows.
 *
 * For the selected node it derives a list of row *descriptors* (label+widget
 * kind+read/write closures) as a computed, and reconciles them by id: changing
 * the selection re-uses the standing rows — the `name` input stays the same
 * window, only its value and closures change — instead of destroying and
 * rebuilding the whole panel. Variable rows come and go individually.
 *
 * Every write goes through a `WindowController` setter, and every setter
 * invalidates, so edits redraw the edited window live. Geometry inputs refresh
 * in place on `GEOMETRY_CHANGED`. Event handlers read the *current* descriptor
 * (`row()`) at event time, never the one they were built with.
 */
export class WindowProperty
{
    private readonly _state: EditorState;
    private readonly _list: IWindow;
    private readonly _wm: EditorState['runtime']['windowManager'];
    private readonly _colorPicker: WindowColorPicker | null;
    private readonly _scope: Scope;

    private readonly _signals: EditorSignals;
    private readonly _varsRev: SignalReader<number>;
    private readonly _bumpVars: () => void;

    public constructor(state: EditorState, list: IWindow, colorPicker: WindowColorPicker | null = null)
    {
        this._state = state;
        this._wm = state.runtime.windowManager;
        this._list = list;
        this._colorPicker = colorPicker;
        this._scope = createWindowScope(list);

        this._signals = signalsOf(state);
        [this._varsRev, this._bumpVars] = pulse();

        const rows = this._scope.run(() => computed((): IRowDesc[] => this.describe()));

        each(this._scope, this._list as unknown as IReconcilableList, rows, {
            key: (row) => row.id,
            create: (row, initial) => this.buildRowWidget(row, initial),
        });
    }

    // ---- Descriptors -------------------------------------------------------

    /** The full row list for the current selection. */
    private describe(): IRowDesc[]
    {
        this._signals.selectionRev();
        this._signals.layoutRev();
        this._varsRev();

        const win = this._state.selected as unknown as WindowController | null;

        if(!win || win.disposed)
        {
            return [];
        }

        return [
            ...this.describeCommon(win),
            ...this.describeFlags(win),
            ...this.describeVariables(win),
        ];
    }

    private describeCommon(win: WindowController): IRowDesc[]
    {
        const out: IRowDesc[] = [];

        out.push({id: 'group:common', kind: 'group', label: 'Common Properties'});
        // Glaze opens on `name`. Retyping a window in place has no row here —
        // it is the hierarchy strip's Convert, on whatever the tree has selected
        // (the layout root included).
        out.push(this.input('name', 'string', () => win.name, (v) => { win.name = v; }));
        out.push(this.input('caption', 'string', () => win.caption, (v) => { win.caption = v; }));
        out.push(this.input('tags', 'string', () => win.tags.join(', '), (v) =>
        {
            win.tags = v.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
        }));
        out.push(this.input('id', 'uint', () => String(win.id), (v) => { const n = Number(v); if(!Number.isNaN(n)) win.id = n; }));

        const tm = this.themeManager();

        if(tm)
        {
            const names = themeNames(this._state);

            out.push({
                id: 'drop:theme',
                kind: 'drop',
                label: 'theme',
                options: names,
                current: () => names.indexOf(tm.getThemeAndIntent(win.type, win.style).theme),
                onSelect: (index) =>
                {
                    const name = names[index];

                    if(name)
                    {
                        win.style = tm.getStyle(name, win.type, tm.getThemeAndIntent(win.type, win.style).intent);
                    }
                },
            });
            out.push(this.input('intent', 'string', () => tm.getThemeAndIntent(win.type, win.style).intent, null));
        }

        out.push(this.input('style', 'uint', () => String(win.style), (v) => { const n = Number(v); if(!Number.isNaN(n)) win.style = n; }));
        out.push(this.input('dynamicStyle', 'string', () => win.dynamicStyle, (v) => { win.dynamicStyle = v; }));
        out.push(this.check('clipping', () => win.clipping, (b) => { win.clipping = b; }));
        out.push(this.check('background', () => win.background, (b) => { win.background = b; }));
        out.push({
            id: 'color:color',
            kind: 'color',
            label: 'color',
            historyKey: 'color:color',
            read: () => win.color >>> 0,
            write: (c) => { win.color = c >>> 0; },
        });
        out.push(this.input('blend', 'number', () => String(win.blend), (v) => { const n = Number(v); if(!Number.isNaN(n)) win.blend = n; }));

        // Glaze has no separate Geometry group — position, size and threshold
        // close out Common Properties, in this order.
        out.push(this.input('x', 'int', () => String(win.x), (v) => this.setNum(v, (n) => { win.x = n; }), true));
        out.push(this.input('y', 'int', () => String(win.y), (v) => this.setNum(v, (n) => { win.y = n; }), true));
        out.push(this.input('width', 'int', () => String(win.width), (v) => this.setNum(v, (n) => { win.width = n; }), true));
        out.push(this.input('width min', 'int', () => this.fmtLimit(win.limits.minWidth, MIN_LIMIT), (v) => this.setLimit(v, MIN_LIMIT, (n) => { win.limits.minWidth = n; })));
        out.push(this.input('width max', 'int', () => this.fmtLimit(win.limits.maxWidth, MAX_LIMIT), (v) => this.setLimit(v, MAX_LIMIT, (n) => { win.limits.maxWidth = n; })));
        out.push(this.input('height', 'int', () => String(win.height), (v) => this.setNum(v, (n) => { win.height = n; }), true));
        out.push(this.input('height min', 'int', () => this.fmtLimit(win.limits.minHeight, MIN_LIMIT), (v) => this.setLimit(v, MIN_LIMIT, (n) => { win.limits.minHeight = n; })));
        out.push(this.input('height max', 'int', () => this.fmtLimit(win.limits.maxHeight, MAX_LIMIT), (v) => this.setLimit(v, MAX_LIMIT, (n) => { win.limits.maxHeight = n; })));
        out.push(this.input('threshold', 'uint', () => String(win.mouseThreshold), (v) => this.setNum(v, (n) => { win.mouseThreshold = n; })));

        return out;
    }

    private describeFlags(win: WindowController): IRowDesc[]
    {
        const dropOf = (label: string, mask: number, options: { label: string; value: number }[]): IRowDesc => ({
            id: `drop:${label}`,
            kind: 'drop',
            label,
            options: options.map((o) => o.label),
            current: () =>
            {
                const index = options.findIndex((o) => o.value === (win.param & mask));

                return index >= 0 ? index : 0;
            },
            onSelect: (index) =>
            {
                const value = options[index]?.value ?? 0;

                win.setParamFlag(mask, false);

                if(value !== 0) win.setParamFlag(value, true);
            },
        });

        return [
            {id: 'group:flags', kind: 'group', label: 'Flags'},
            // Glaze spells the options out with the flag's own name, not a short
            // form — "relative horizontal scale fixed", never "fixed".
            dropOf('horizontal scaling', WindowParam.RELATIVE_HORIZONTAL_SCALE_MASK, [
                {label: 'relative horizontal scale fixed', value: WindowParam.RELATIVE_HORIZONTAL_SCALE_FIXED},
                {label: 'relative horizontal scale move', value: WindowParam.RELATIVE_HORIZONTAL_SCALE_MOVE},
                {label: 'relative horizontal scale stretch', value: WindowParam.RELATIVE_HORIZONTAL_SCALE_STRETCH},
                {label: 'relative horizontal scale center', value: WindowParam.RELATIVE_HORIZONTAL_SCALE_CENTER}
            ]),
            dropOf('vertical scaling', WindowParam.RELATIVE_VERTICAL_SCALE_MASK, [
                {label: 'relative vertical scale fixed', value: WindowParam.RELATIVE_VERTICAL_SCALE_FIXED},
                {label: 'relative vertical scale move', value: WindowParam.RELATIVE_VERTICAL_SCALE_MOVE},
                {label: 'relative vertical scale stretch', value: WindowParam.RELATIVE_VERTICAL_SCALE_STRETCH},
                {label: 'relative vertical scale center', value: WindowParam.RELATIVE_VERTICAL_SCALE_CENTER}
            ]),
            dropOf('horizontal alignment', 0xC0000, [
                {label: 'on resize align left', value: WindowParam.ON_RESIZE_ALIGN_LEFT},
                {label: 'on resize align right', value: WindowParam.ON_RESIZE_ALIGN_RIGHT},
                {label: 'on resize align center', value: WindowParam.ON_RESIZE_ALIGN_CENTER}
            ]),
            dropOf('vertical alignment', 0x300000, [
                {label: 'on resize align top', value: WindowParam.ON_RESIZE_ALIGN_TOP},
                {label: 'on resize align bottom', value: WindowParam.ON_RESIZE_ALIGN_BOTTOM},
                {label: 'on resize align middle', value: WindowParam.ON_RESIZE_ALIGN_MIDDLE}
            ]),
            this.flag(win, 'use parent graphic context', WindowParam.USE_PARENT_GRAPHIC_CONTEXT),
            this.flag(win, 'reflect horizontal resize to parent', WindowParam.REFLECT_HORIZONTAL_RESIZE_TO_PARENT),
            this.flag(win, 'reflect vertical resize to parent', WindowParam.REFLECT_VERTICAL_RESIZE_TO_PARENT),
            this.flag(win, 'expand to accommodate children', WindowParam.EXPAND_TO_ACCOMMODATE_CHILDREN),
            this.flag(win, 'resize to accommodate children', WindowParam.RESIZE_TO_ACCOMMODATE_CHILDREN),
            this.flag(win, 'input event processor', WindowParam.INPUT_EVENT_PROCESSOR),
            this.flag(win, 'internal event handling', WindowParam.INTERNAL_EVENT_HANDLING),
            this.flag(win, 'route input events to parent', WindowParam.ROUTE_INPUT_EVENTS_TO_PARENT),
            this.flag(win, 'observe parent input events', WindowParam.OBSERVE_PARENT_INPUT_EVENTS),
            this.flag(win, 'bound to parent rect', WindowParam.BOUND_TO_PARENT_RECT),
            this.flag(win, 'force clipping', WindowParam.FORCE_CLIPPING),
            this.flag(win, 'mouse dragging target', WindowParam.MOUSE_DRAGGING_TARGET),
            this.flag(win, 'mouse dragging trigger', WindowParam.MOUSE_DRAGGING_TRIGGER),
            this.flag(win, 'mouse scaling target', WindowParam.MOUSE_SCALING_TARGET),
            this.flag(win, 'mouse scaling trigger', WindowParam.MOUSE_SCALING_TRIGGER),
            this.flag(win, 'inherit caption', WindowParam.INHERIT_CAPTION),
        ];
    }

    /**
     * The selected node's `<variables>`, edited off the source XML — the live
     * window discards them, faithfully, so this is the only place they exist.
     * Complex vars (`Point`/`Rectangle`/`Array`/`Map` sub-trees) are shown but
     * not editable; the serializer re-emits them verbatim.
     */
    private describeVariables(win: WindowController): IRowDesc[]
    {
        const model = this._state.variables;
        const name = win.name;

        if(!model || !name)
        {
            return [];
        }

        const out: IRowDesc[] = [{id: 'group:variables', kind: 'group', label: 'Variables'}];

        for(const entry of model.getVars(name))
        {
            if(entry.complex)
            {
                out.push(this.input(entry.key, entry.type, () => `<${entry.type}>`, null));
                continue;
            }

            out.push({
                id: `var:${entry.key}`,
                kind: 'var',
                label: entry.key,
                type: entry.type,
                value: entry.value,
                key: entry.key,
                node: name,
                win,
            });
        }

        out.push({id: 'addvar', kind: 'addvar', node: name, win});

        return out;
    }

    private input(label: string, type: string, read: () => string, write: ((v: string) => void) | null, live: boolean = false): IRowDesc
    {
        return {id: `input:${label}`, kind: 'input', label, type, live, historyKey: write ? `prop:${label}` : null, read, write};
    }

    /**
     * Retypes the selected window from the `type` field. Accepts the name alone
     * (`container`), the numeric code (`4`), or the field's own display form
     * (`container (4)`) — whatever the field shows has to be valid input, or
     * re-committing it unchanged would be rejected.
     */
    private convertTo(value: string): void
    {
        const text = value.replace(/\(\s*\d+\s*\)\s*$/, '').trim();
        const name = TYPE_NAME_TO_CODE[text] !== undefined ? text : TYPE_CODE_TO_NAME[Number(text)];

        if(!name)
        {
            log.warn(`Unknown window type '${value}'`);

            return;
        }

        convertSelected(this._state, name);
    }

    /** A boolean property: Glaze shows its `boolean` type like any other row. */
    private check(label: string, read: () => boolean, write: (b: boolean) => void): IRowDesc
    {
        return {id: `check:${label}`, kind: 'check', label, type: 'boolean', read, write};
    }

    /** A param flag: Glaze prints no type for these, and the box sits further right. */
    private flag(win: WindowController, label: string, flagBit: number): IRowDesc
    {
        return {
            id: `check:${label}`,
            kind: 'check',
            label,
            type: '',
            read: () => win.testParamFlag(flagBit),
            write: (b) => { win.setParamFlag(flagBit, b); },
        };
    }

    private themeManager(): IThemeManagerLike | null
    {
        const wm = this._wm as unknown as { getThemeManager?: () => IThemeManagerLike };

        return wm.getThemeManager ? wm.getThemeManager() : null;
    }

    // ---- Row widgets -------------------------------------------------------

    /** Builds the widget for a descriptor; runs once per row lifetime. */
    private buildRowWidget(row: SignalReader<IRowDesc>, initial: IRowDesc): IWindow | null
    {
        switch(initial.kind)
        {
            case 'group': return this.buildGroup(row);
            case 'input': return this.buildInput(row);
            case 'check': return this.buildCheck(row);
            case 'drop': return this.buildDrop(row);
            case 'color': return this.buildColor(row);
            case 'var': return this.buildVar(row);
            case 'addvar': return this.buildAddVar(row);
        }
    }

    private buildGroup(row: SignalReader<IRowDesc>): IWindow | null
    {
        const widget = this._wm.buildWidgetLayout('glaze_prop_group_xml');

        if(!widget) return null;

        const label = GROUP_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_group_label');

        if(label) bind(label, 'text', () => { const d = row(); return d.kind === 'group' ? d.label : ''; });

        return widget;
    }

    private buildInput(row: SignalReader<IRowDesc>): IWindow | null
    {
        const widget = this._wm.buildWidgetLayout('glaze_prop_input_xml');

        if(!widget) return null;

        const label = INPUT_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_prow_label');
        const typeEl = INPUT_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_prow_type');
        const input = INPUT_ROW.findAs<IInputWidget>(widget, 'glaze_prow_input');

        if(label) bind(label, 'text', () => { const d = row(); return d.kind === 'input' ? d.label : ''; });
        if(typeEl) bind(typeEl, 'text', () => { const d = row(); return d.kind === 'input' ? d.type : ''; });

        if(input)
        {
            // The value follows the descriptor (selection/layout changes) and,
            // for live rows, the geometry revision. Deliberately NOT the tree
            // revision: typing must never be overwritten under the caret.
            bind(input, 'text', () =>
            {
                const d = row();

                if(d.kind !== 'input') return '';

                if(d.live) this._signals.geometryRev();

                return d.read();
            });

            on(input, 'WE_CHANGE', () =>
            {
                const d = row();

                if(d.kind !== 'input' || !d.write) return;

                // Coalesce per-field so typing several chars = one undo step. A
                // null key means the write pushes its own restore point.
                if(d.historyKey !== null) this._state.pushHistory(d.historyKey);

                d.write(input.text);
                this._state.notifyTreeChanged();
            });
        }

        return widget;
    }

    private buildCheck(row: SignalReader<IRowDesc>): IWindow | null
    {
        const widget = this._wm.buildWidgetLayout('glaze_prop_check_xml');

        if(!widget) return null;

        const label = CHECK_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_crow_label');
        const typeEl = CHECK_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_crow_type');
        const check = CHECK_ROW.findAs<ICheckWidget>(widget, 'glaze_crow_check');

        if(label) bind(label, 'text', () => { const d = row(); return d.kind === 'check' ? d.label : ''; });
        if(typeEl) bind(typeEl, 'text', () => { const d = row(); return d.kind === 'check' ? d.type : ''; });

        if(check)
        {
            // A property's box lines up with the value column; a flag's, which
            // has no type beside it, sits where Glaze puts it — further right.
            bind(check as unknown as WindowController, 'x', () =>
            {
                const d = row();

                return d.kind === 'check' && d.type ? CHECK_X_PROPERTY : CHECK_X_FLAG;
            });
            bind(check, 'isSelected', () => { const d = row(); return d.kind === 'check' ? d.read() : false; });

            const commit = (value: boolean): void =>
            {
                const d = row();

                if(d.kind !== 'check' || d.read() === value) return;

                this._state.pushHistory();
                d.write(value);
                this._state.notifyTreeChanged();
            };

            on(check, 'WE_SELECTED', () => commit(true));
            on(check, 'WE_UNSELECTED', () => commit(false));
        }

        return widget;
    }

    private buildDrop(row: SignalReader<IRowDesc>): IWindow | null
    {
        const widget = this._wm.buildWidgetLayout('glaze_prop_drop_xml');

        if(!widget) return null;

        const label = DROP_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_drow_label');
        const drop = DROP_ROW.findAs<IDropWidget>(widget, 'glaze_drow_drop');

        if(label) bind(label, 'text', () => { const d = row(); return d.kind === 'drop' ? d.label : ''; });

        if(drop)
        {
            // The dropdown's `selection` setter dispatches WE_SELECTED, so the
            // programmatic sync below must not be mistaken for a user pick.
            let syncing = false;

            effect(() =>
            {
                const d = row();

                if(d.kind !== 'drop' || drop.disposed) return;

                syncing = true;

                try
                {
                    drop.populate(d.options);

                    const index = d.current();

                    drop.selection = index >= 0 ? index : 0;
                }
                finally
                {
                    syncing = false;
                }
            });

            on(drop, 'WE_SELECTED', () =>
            {
                if(syncing) return;

                const d = row();

                if(d.kind !== 'drop') return;

                this._state.pushHistory();
                d.onSelect(drop.selection);
                this._state.notifyTreeChanged();
            });
        }

        return widget;
    }

    /**
     * A colour property: a clickable swatch that opens the picker, plus the hex
     * field Glaze always had (still authoritative for exact ARGB values).
     */
    private buildColor(row: SignalReader<IRowDesc>): IWindow | null
    {
        const widget = this._wm.buildWidgetLayout('glaze_prop_color_xml');

        if(!widget) return null;

        const label = COLOR_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_korow_label');
        const swatch = COLOR_ROW.findAs<WindowController>(widget, 'glaze_korow_swatch');
        const input = COLOR_ROW.findAs<IInputWidget>(widget, 'glaze_korow_input');
        const hex = (color: number): string => `0x${(color >>> 0).toString(16).padStart(8, '0')}`;

        if(label) bind(label, 'text', () => { const d = row(); return d.kind === 'color' ? d.label : ''; });
        if(swatch) bind(swatch, 'color', () => { const d = row(); return d.kind === 'color' ? d.read() >>> 0 : 0; });
        if(input) bind(input, 'text', () => { const d = row(); return d.kind === 'color' ? hex(d.read()) : ''; });

        const commit = (color: number, syncInput: boolean): void =>
        {
            const d = row();

            if(d.kind !== 'color') return;

            d.write(color);

            if(swatch && !swatch.disposed) swatch.color = color >>> 0;
            if(syncInput && input && !input.disposed) input.text = hex(color);

            this._state.notifyTreeChanged();
        };

        if(swatch)
        {
            swatch.procedure = (event: WindowEvent): void =>
            {
                const d = row();

                if(event.type !== WindowMouseEvent.CLICK || !this._colorPicker || d.kind !== 'color') return;

                this._colorPicker.open(d.label, d.read(), (color) =>
                {
                    this._state.pushHistory(d.historyKey);
                    commit(color, true);
                });
            };
        }

        if(input)
        {
            on(input, 'WE_CHANGE', () =>
            {
                const d = row();

                if(d.kind !== 'color') return;

                const parsed = parseInt(input.text.replace(/^0x/i, '').replace(/^#/, ''), 16);

                if(Number.isNaN(parsed)) return;

                this._state.pushHistory(d.historyKey);
                commit(parsed >>> 0, false);
            });
        }

        return widget;
    }

    /** One editable `<var>`: its value, and the button that drops it. */
    private buildVar(row: SignalReader<IRowDesc>): IWindow | null
    {
        const widget = this._wm.buildWidgetLayout('glaze_prop_var_xml');

        if(!widget) return null;

        const label = VAR_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_vrow_label');
        const typeEl = VAR_ROW.findAs<WindowController & { text: string }>(widget, 'glaze_vrow_type');
        const input = VAR_ROW.findAs<IInputWidget>(widget, 'glaze_vrow_input');
        const remove = VAR_ROW.findAs<WindowController>(widget, 'glaze_vrow_remove');

        if(label) bind(label, 'text', () => { const d = row(); return d.kind === 'var' ? d.label : ''; });
        if(typeEl) bind(typeEl, 'text', () => { const d = row(); return d.kind === 'var' ? d.type : ''; });

        if(input)
        {
            bind(input, 'text', () => { const d = row(); return d.kind === 'var' ? d.value : ''; });

            on(input, 'WE_CHANGE', () =>
            {
                const d = row();
                const model = this._state.variables;

                if(d.kind !== 'var' || !model) return;

                this._state.pushHistory(`var:${d.key}`);
                model.setVarValue(d.node, d.key, input.text);
                applyVariablesLive(d.win as unknown as IWindow, model.getVars(d.node));
                this._state.notifyTreeChanged();
            });
        }

        if(remove)
        {
            remove.procedure = (event: WindowEvent): void =>
            {
                const d = row();
                const model = this._state.variables;

                if(event.type !== WindowMouseEvent.CLICK || d.kind !== 'var' || !model) return;

                this._state.pushHistory();
                model.removeVar(d.node, d.key);
                this._state.notifyTreeChanged();
                this._bumpVars();
            };
        }

        return widget;
    }

    /**
     * The "add variable" row. A palette-created node starts with no `<variables>`
     * block at all, so without this the vars the Flash layouts rely on
     * (`text_style`, `asset_uri`, `auto_size`…) could never be given to it.
     */
    private buildAddVar(row: SignalReader<IRowDesc>): IWindow | null
    {
        const widget = this._wm.buildWidgetLayout('glaze_prop_addvar_xml');

        if(!widget) return null;

        const keyInput = ADDVAR_ROW.findAs<IInputWidget>(widget, 'glaze_arow_key');
        const valueInput = ADDVAR_ROW.findAs<IInputWidget>(widget, 'glaze_arow_value');
        const add = ADDVAR_ROW.findAs<WindowController>(widget, 'glaze_arow_add');

        if(add)
        {
            add.procedure = (event: WindowEvent): void =>
            {
                const d = row();
                const model = this._state.variables;

                if(event.type !== WindowMouseEvent.CLICK || d.kind !== 'addvar' || !model) return;

                const key = (keyInput?.text ?? '').trim();

                if(!key) return;

                const value = valueInput?.text ?? '';

                this._state.pushHistory();

                if(model.addVar(d.node, key, this.guessVarType(value), value))
                {
                    applyVariablesLive(d.win as unknown as IWindow, model.getVars(d.node));
                    this._state.notifyTreeChanged();
                    this._bumpVars();

                    // The old full rebuild recreated these empty; keep that UX.
                    if(keyInput && !keyInput.disposed) keyInput.text = '';
                    if(valueInput && !valueInput.disposed) valueInput.text = '';
                }
            };
        }

        return widget;
    }

    /** Types a new var from what was typed — the three forms `<var>` really uses. */
    private guessVarType(value: string): string
    {
        const raw = value.trim().toLowerCase();

        if(raw === 'true' || raw === 'false') return 'Boolean';
        if(raw !== '' && !Number.isNaN(Number(raw))) return Number.isInteger(Number(raw)) ? 'int' : 'Number';

        return 'String';
    }

    private setNum(v: string, apply: (n: number) => void): void
    {
        const n = Number(v);

        if(!Number.isNaN(n)) apply(n);
    }

    private setLimit(v: string, sentinel: number, apply: (n: number) => void): void
    {
        const raw = v.trim();

        if(raw === '') { apply(sentinel); return; }

        const n = Number(raw);

        if(!Number.isNaN(n)) apply(n);
    }

    private fmtLimit(value: number, sentinel: number): string
    {
        return value === sentinel ? '' : String(value);
    }

    public dispose(): void
    {
        this._scope.dispose();
        (this._list as unknown as IListLike).destroyListItems();
    }
}
