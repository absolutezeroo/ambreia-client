import type {IDropMenuWindow} from '@ambreia/ui/components/IDropMenuWindow';
import type {ISelectableWindow} from '@ambreia/ui/components/ISelectableWindow';
import type {IStaticBitmapWrapperWindow} from '@ambreia/ui/components/IStaticBitmapWrapperWindow';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';

/*
 * The few ways the editor talks to the owner's layouts, by widget name. Each helper tolerates a
 * missing widget — a layout retouched in Glaze must not crash the editor — and logs it once.
 */

const ENTER = 13;
const missing = new Set<string>();

/** The named child of root, or null (and a one-time warning) when the layout lacks it. */
export function child<T extends IWindow = IWindow>(root: IWindow, name: string): T | null
{
    const found = (root as IWindowContainer).findChildByName?.(name) ?? null;

    if(!found && !missing.has(name))
    {
        missing.add(name);
        // eslint-disable-next-line no-console -- a layout/code mismatch the developer must see
        console.warn(`[map-editor] layout has no widget "${name}"`);
    }

    return found as T | null;
}

export function setText(root: IWindow, name: string, text: string): void
{
    const w = child<ITextWindow>(root, name);

    if(w && w.text !== text) w.text = text;
}

export function setVisible(root: IWindow, name: string, visible: boolean): void
{
    const w = child(root, name);

    if(w && w.visible !== visible) w.visible = visible;
}

export function setEnabled(window: IWindow | null, enabled: boolean): void
{
    if(!window || window.isEnabled() === enabled) return;
    if(enabled) window.enable();
    else window.disable();
}

/** Calls action on a click of the named child (a button, or a border styled as one). */
export function onClick(root: IWindow, name: string, action: (window: IWindow) => void): void
{
    child(root, name)?.addEventListener('WME_CLICK', () => action(child(root, name)!));
}

/** Calls action on a click of window itself. */
export function onWindowClick(window: IWindow, action: () => void): void
{
    window.addEventListener('WME_CLICK', () => action());
}

export function setImage(root: IWindow, name: string, uri: string): void
{
    const w = child<IStaticBitmapWrapperWindow>(root, name);

    if(w && w.assetUri !== uri) w.assetUri = uri;
}

/**
 * A text input: shows value() unless it has the focus, and commits on Enter or when it loses the
 * focus — never on each keystroke, so one edit is one undo step.
 */
export class TextBinding
{
    private readonly _input: ITextFieldWindow | null;

    constructor(root: IWindow, name: string, private readonly _value: () => string, commit: (text: string) => void)
    {
        this._input = child<ITextFieldWindow>(root, name);

        const input = this._input;

        if(!input) return;

        const fire = () =>
        {
            if(input.text !== this._value()) commit(input.text);
        };

        input.addEventListener('WKE_KEY_DOWN', e =>
        {
            if((e as unknown as {keyCode: number}).keyCode === ENTER) fire();
        });
        input.addEventListener('WE_UNFOCUSED', fire);
    }

    render(): void
    {
        if(this._input && !this._input.focused) this._input.text = this._value();
    }
}

/**
 * A number input with the layout's up/down arrows (`<name>_up`, `<name>_down`): Enter, focus
 * loss or an arrow commits; the value is clamped to [min, max].
 */
export class NumberBinding
{
    private readonly _text: TextBinding;

    constructor(
        root: IWindow,
        name: string,
        private readonly _value: () => number,
        private readonly _commit: (value: number) => void,
        private readonly _min = Number.NEGATIVE_INFINITY,
        private readonly _max = Number.POSITIVE_INFINITY,
        step = 1
    )
    {
        this._text = new TextBinding(root, name, () => String(_value()), text =>
        {
            const n = Number(text.replace(',', '.'));

            if(Number.isFinite(n)) this.commit(n);
        });
        onClick(root, `${name}_up`, () => this.commit(this._value() + step));
        onClick(root, `${name}_down`, () => this.commit(this._value() - step));
    }

    render(): void
    {
        this._text.render();
    }

    private commit(value: number): void
    {
        const clamped = Math.min(this._max, Math.max(this._min, value));

        if(clamped !== this._value()) this._commit(clamped);
    }
}

/** A checkbox: shows value(), commits a user's tick (not the ones render() sets). */
export class CheckBinding
{
    private readonly _box: ISelectableWindow | null;
    private _syncing = false;

    constructor(root: IWindow, name: string, private readonly _value: () => boolean, commit: (checked: boolean) => void)
    {
        this._box = child<ISelectableWindow>(root, name);
        this._box?.addEventListener('WE_SELECTED', () => this._syncing || commit(true));
        this._box?.addEventListener('WE_UNSELECTED', () => this._syncing || commit(false));
    }

    render(): void
    {
        const box = this._box;

        if(!box || box.isSelected === this._value()) return;

        this._syncing = true;
        if(this._value()) box.select();
        else box.unselect();
        this._syncing = false;
    }
}

/** A drop menu over a list of (value, label): shows value(), commits a user's choice. */
export class ChoiceBinding<T>
{
    private readonly _menu: IDropMenuWindow | null;
    private _options: readonly (readonly [T, string])[] = [];
    private _syncing = false;

    constructor(root: IWindow, name: string, private readonly _value: () => T, commit: (value: T) => void)
    {
        this._menu = child<IDropMenuWindow>(root, name);
        this._menu?.addEventListener('WE_SELECTED', () =>
        {
            const option = this._options[this._menu!.selection];

            if(!this._syncing && option && option[0] !== this._value()) commit(option[0]);
        });
    }

    /** Replaces the options (only when they changed: populate resets the menu). */
    options(options: readonly (readonly [T, string])[]): this
    {
        const same = options.length === this._options.length && options.every((o, i) => o[0] === this._options[i][0] && o[1] === this._options[i][1]);

        if(!same && this._menu)
        {
            this._options = options;
            this._menu.populate(options.map(o => o[1]));
        }

        return this;
    }

    render(): void
    {
        const menu = this._menu;

        if(!menu) return;

        const index = this._options.findIndex(o => o[0] === this._value());

        if(index < 0 || index === menu.selection) return;

        this._syncing = true;
        menu.selection = index;
        this._syncing = false;
    }
}

/** Every descendant of root named name, in layout order (rows a layout repeats: `value`, `height_tile`…). */
export function children(root: IWindow, name: string): IWindow[]
{
    const out: IWindow[] = [];
    const walk = (w: IWindow) =>
    {
        const c = w as IWindowContainer;

        for(let i = 0; i < (c.numChildren ?? 0); i++)
        {
            const kid = c.getChildAt(i);

            if(!kid) continue;
            if(kid.name === name) out.push(kid);
            walk(kid);
        }
    };

    walk(root);

    return out;
}

/** Marks the active one of a row of windows by colour (the layouts' rows have no selected state). */
export function highlight(windows: readonly IWindow[], colors: readonly number[], active: number, color = 0xff9cc9f5): void
{
    windows.forEach((w, i) =>
    {
        const wanted = i === active ? color : colors[i];

        if(w.color !== wanted) w.color = wanted;
    });
}

/**
 * A search field whose layout caption is a hint ("Rechercher un mobi…"): the hint clears when the
 * field takes the focus, comes back when it is left empty, and never counts as a query.
 */
export class SearchField
{
    private readonly _input: ITextFieldWindow | null;
    private readonly _hint: string;

    constructor(root: IWindow, name: string, onQuery: (query: string) => void)
    {
        this._input = child<ITextFieldWindow>(root, name);
        this._hint = this._input?.text ?? '';

        const input = this._input;

        if(!input) return;

        let last = '';

        input.addEventListener('WE_FOCUSED', () =>
        {
            if(input.text === this._hint) input.text = '';
        });
        input.addEventListener('WE_UNFOCUSED', () =>
        {
            if(!input.text) input.text = this._hint;
        });
        input.addEventListener('WE_CHANGE', () =>
        {
            const query = this.query;

            if(query === last) return;

            last = query;
            onQuery(query);
        });
    }

    get query(): string
    {
        const text = this._input?.text ?? '';

        return text === this._hint ? '' : text.trim();
    }
}
