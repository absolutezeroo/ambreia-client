import type {IWindow} from '../IWindow';

/**
 * A read-only line of text the player can select and copy, laid over a window.
 *
 * The canvas cannot offer selection: text painted into it is pixels, and a browser has nothing to
 * select. Where Flash simply dropped a `TextField` into a display-object wrapper and let the player
 * drag across it, this puts a real DOM element over the same rectangle — the same technique
 * `TextFieldController` uses to carry a caret and an IME, minus the input half.
 *
 * It is deliberately small: no editing, no focus handling, no per-frame ticker of its own.
 * {@link sync} is called by whoever owns it, when the window it tracks may have moved.
 */
// TS-only: no AS3 counterpart — Flash's `TextField` is selectable on its own, so nothing like this
//   had to exist there. See `ExternalImageWidget._staffNameField`, its first consumer.
export class SelectableTextOverlay
{
    /** Above the canvas, below the DOM input bridge's 9999 — a caret must never be occluded. */
    // TS-only: the bridge in `TextFieldController` picks 9999; this sits under it.
    private static readonly Z_INDEX: string = '9990';

    // TS-only: the DOM element itself, which AS3 has no counterpart for — see the class note.
    private _element: HTMLElement | null = null;
    // TS-only: the window whose rectangle the element tracks.
    private _window: IWindow | null = null;
    // TS-only: mirrors the `text` a Flash TextField would carry.
    private _text: string = '';
    // TS-only: mirrors `TextField.textColor`.
    private _color: number = 0;
    // TS-only: the element is hidden rather than removed, so this is kept rather than read back
    //   off `style.display`.
    private _visible: boolean = false;

    /**
     * Points the overlay at a window, creating the element on first use.
     *
     * A null window detaches it — the element is hidden rather than destroyed, since the same
     * overlay is re-pointed every time the widget reopens.
     */
    // TS-only: see the class note.
    public attachTo(window: IWindow | null): void
    {
        this._window = window;

        if(window === null)
        {
            this.setVisible(false);

            return;
        }

        this.ensureElement();
        this.sync();
    }

    // TS-only: see the class note.
    public get text(): string
    {
        return this._text;
    }

    /**
     * Empty text hides the overlay outright: an empty selectable region over a window would still
     * swallow the pointer where the window expects it.
     */
    // TS-only: see the class note.
    public set text(value: string)
    {
        this._text = value;

        if(this._element !== null) this._element.textContent = value;

        this.setVisible(value.length > 0);
        this.sync();
    }

    // TS-only: mirrors the `textColor` Flash sets on the TextField this replaces.
    public get textColor(): number
    {
        return this._color;
    }

    // TS-only: see the class note.
    public set textColor(value: number)
    {
        this._color = value;

        if(this._element !== null)
        {
            this._element.style.color = `#${(value & 0xFFFFFF).toString(16).padStart(6, '0')}`;
        }
    }

    /**
     * Moves the element over the window's current rectangle.
     *
     * Positions relative to the canvas' own bounding rect, as the input bridge does: the canvas is
     * not necessarily at the page origin, and a window's global position is in canvas space.
     */
    // TS-only: see the class note.
    public sync(): void
    {
        const element = this._element;
        const window = this._window;

        if(element === null || window === null || !this._visible) return;

        const position = {x: 0, y: 0};

        window.getGlobalPosition(position);

        const canvas = document.querySelector('canvas');
        const rect = canvas !== null ? canvas.getBoundingClientRect() : {left: 0, top: 0};

        element.style.left = `${rect.left + position.x}px`;
        element.style.top = `${rect.top + position.y}px`;
        element.style.width = `${window.width}px`;
        element.style.height = `${window.height}px`;
    }

    // TS-only: see the class note.
    public dispose(): void
    {
        this._element?.remove();
        this._element = null;
        this._window = null;
        this._visible = false;
    }

    // TS-only: see the class note.
    private setVisible(visible: boolean): void
    {
        this._visible = visible;

        if(this._element !== null) this._element.style.display = visible ? '' : 'none';
    }

    /**
     * `user-select: text` and `pointer-events: auto` are the two that matter — everything else is
     * there to stop the element looking like anything. It carries no background and no border, so
     * what the player sees is still the window's own painted text; this only makes the same glyphs
     * selectable on top of them.
     */
    // TS-only: see the class note.
    private ensureElement(): void
    {
        if(this._element !== null || typeof document === 'undefined') return;

        const element = document.createElement('div');

        element.textContent = this._text;
        element.style.position = 'absolute';
        element.style.zIndex = SelectableTextOverlay.Z_INDEX;
        element.style.margin = '0';
        element.style.padding = '0';
        element.style.border = 'none';
        element.style.background = 'transparent';
        element.style.whiteSpace = 'pre';
        element.style.overflow = 'hidden';
        element.style.userSelect = 'text';
        element.style.pointerEvents = 'auto';
        element.style.cursor = 'text';
        // Transparent: the window paints the glyphs, this only carries the selection. Painting them
        // twice would double-strike the text at whatever font the page happens to have.
        element.style.color = 'transparent';
        element.style.display = 'none';

        document.body.appendChild(element);

        this._element = element;
        this.textColor = this._color;
    }
}
