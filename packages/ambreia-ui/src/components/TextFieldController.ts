import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IDesktopWindow} from './IDesktopWindow';
import type {ITextFieldWindow} from './ITextFieldWindow';
import type {WindowController} from '../WindowController';
import {TextController} from './TextController';
import {InteractiveController} from './InteractiveController';
import {WindowEvent} from '../events/WindowEvent';
import {WindowKeyboardEvent} from '../events/WindowKeyboardEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';

/**
 * Controller for editable text field windows.
 *
 * Extends TextController with input-specific functionality:
 * editable state, focus management, keyboard event dispatching,
 * selection, password display, and max length.
 *
 * In AS3 this wraps a native Flash TextField. In TypeScript/web,
 * we use a hidden HTML input element overlaid on the canvas to
 * capture user input, syncing text back to the window.
 *
 * Three AS3 members are deliberately absent. `refreshAutoSize()` grows the window rect to the Flash
 * TextField's measured size; there is no Flash field here, so `TextController.draw()` measures and
 * resizes in one pass and this class has nothing left to refresh. `mouseCursorType` is an override
 * whose setter is empty and whose getter returns 0 in every tree. `_filters` belongs to Flash's
 * `DisplayObject.filters`, which the PixiJS side handles.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextFieldController.as
 */
export class TextFieldController extends TextController implements ITextFieldWindow
{
    private static readonly WORD_DELIMS: RegExp = /[~%&!\\;:"',<>?#\s.\-()=[\]{}^_]/g;

    protected _inputElement: HTMLInputElement | HTMLTextAreaElement | null = null;

    // requestAnimationFrame handle for the per-frame caret position tracking while focused.
    private _caretTrackRaf: number | null = null;
    private _maxLength: number = 0;
    private _focusCapturer: boolean = false;
    private _boundOnInput: EventListener | null = null;
    private _boundOnKeyDown: EventListener | null = null;
    private _boundOnKeyUp: EventListener | null = null;
    private _boundOnFocus: EventListener | null = null;
    private _boundOnBlur: EventListener | null = null;

    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0,
        dynamicStyle: string = ''
    )
    {
        param = (param & ~0x10) | 0x01;
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id, dynamicStyle);

        this._editable = true;
        this.createInputElement();
    }

    private _editable: boolean = true;

    /**
	 * Whether the field accepts user input.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get editable()
    public get editable(): boolean
    {
        return this._editable;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::set editable()
    public set editable(value: boolean)
    {
        this._editable = value;

        if(this._inputElement)
        {
            this._inputElement.readOnly = !value;
        }
    }

    private _selectable: boolean = true;

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get selectable()
    public get selectable(): boolean
    {
        return this._selectable;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::set selectable()
    public set selectable(value: boolean)
    {
        this._selectable = value;
    }

    private _displayAsPassword: boolean = false;

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get displayAsPassword()
    public get displayAsPassword(): boolean
    {
        return this._displayAsPassword;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::set displayAsPassword()
    public set displayAsPassword(value: boolean)
    {
        this._displayAsPassword = value;

        if(this._inputElement && this._inputElement instanceof HTMLInputElement)
        {
            this._inputElement.type = value ? 'password' : 'text';
            // The layout's `display_as_password` var lands here, after createInputElement() has
            // already chosen an autocomplete hint from the (still false) initial value.
            this._inputElement.autocomplete = value ? 'new-password' : 'off';
        }
    }

    /**
	 * Whether the field currently has focus.
	 *
	 * In AS3, this checks `_field.stage.focus == _field`.
	 * Here we check if our hidden input is the active element.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get focused()
    public get focused(): boolean
    {
        if(this._inputElement)
        {
            return document.activeElement === this._inputElement;
        }

        return false;
    }

    private _selectionBeginIndex: number = 0;

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get selectionBeginIndex()
    public get selectionBeginIndex(): number
    {
        if(this._inputElement)
        {
            return this._inputElement.selectionStart ?? this._selectionBeginIndex;
        }

        return this._selectionBeginIndex;
    }

    private _selectionEndIndex: number = 0;

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get selectionEndIndex()
    public get selectionEndIndex(): number
    {
        if(this._inputElement)
        {
            return this._inputElement.selectionEnd ?? this._selectionEndIndex;
        }

        return this._selectionEndIndex;
    }

    private _interactiveCursorDisabled: boolean = false;

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get interactiveCursorDisabled()
    public get interactiveCursorDisabled(): boolean
    {
        return this._interactiveCursorDisabled;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::set interactiveCursorDisabled()
    public set interactiveCursorDisabled(value: boolean)
    {
        this._interactiveCursorDisabled = value;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get displayRaw()
    public get displayRaw(): boolean
    {
        return this._displayRaw;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::set displayRaw()
    public set displayRaw(value: boolean)
    {
        this._displayRaw = value;
    }

    // textBackground, textBackgroundColor, scrollH, scrollV
    // inherited from TextController

    private _toolTipCaption: string = '';

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get toolTipCaption()
    public get toolTipCaption(): string
    {
        return this._toolTipCaption;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::set toolTipCaption()
    public set toolTipCaption(value: string)
    {
        this._toolTipCaption = value ?? '';
    }

    private _toolTipDelay: number = 500;

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get toolTipDelay()
    public get toolTipDelay(): number
    {
        return this._toolTipDelay;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::set toolTipDelay()
    public set toolTipDelay(value: number)
    {
        this._toolTipDelay = value;
    }

    private _toolTipIsDynamic: boolean = false;

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::get toolTipIsDynamic()
    public get toolTipIsDynamic(): boolean
    {
        return this._toolTipIsDynamic;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::set toolTipIsDynamic()
    public set toolTipIsDynamic(value: boolean)
    {
        this._toolTipIsDynamic = value;
    }

    // bold, italic, underline, fontFace, fontSize, length, numLines,
    // textHeight, textWidth inherited from TextController

    public override get properties(): unknown[]
    {
        const props = InteractiveController.writeInteractiveWindowProperties(this, super.properties);

        props.push(this.createProperty('editable', this._editable));
        props.push(this.createProperty('focus_capturer', this._focusCapturer));
        props.push(this.createProperty('selectable', this._selectable));
        props.push(this.createProperty('display_as_password', this._displayAsPassword));
        props.push(this.createProperty('display_raw', this._displayRaw));

        return props;
    }

    public override set properties(value: unknown[])
    {
        InteractiveController.readInteractiveWindowProperties(this, value);

        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'focus_capturer':
                    this._focusCapturer = !!prop.value;
                    break;
                case 'selectable':
                    this._selectable = !!prop.value;
                    break;
                case 'editable':
                    this._editable = !!prop.value;
                    break;
                case 'display_as_password':
                    this._displayAsPassword = !!prop.value;
                    break;
                case 'display_raw':
                    this._displayRaw = !!prop.value;
                    break;
            }
        }

        super.properties = value;
    }

    public override get text(): string
    {
        return super.text;
    }

    /**
	 * Sets the text and refreshes auto-sizing.
	 */
    public override set text(value: string)
    {
        super.text = value;

        if(this._inputElement)
        {
            this._inputElement.value = this._text;
        }
    }

    public override get background(): boolean
    {
        return this._background;
    }

    /**
	 * Sets the background flag and syncs visual state.
	 */
    public override set background(value: boolean)
    {
        this._background = value;
        this._fillColor = this._background
            ? this._fillColor | this._alphaColor
            : this._fillColor & 0xFFFFFF;
    }

    // maxScrollH, maxScrollV, visibleRegion, scrollableRegion inherited from TextController

    /**
	 * Returns word boundary positions for the given text.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::getWordPositions()
    public static getWordPositions(text: string): number[]
    {
        const positions: number[] = [0];
        let match: RegExpExecArray | null;

        TextFieldController.WORD_DELIMS.lastIndex = 0;

        while((match = TextFieldController.WORD_DELIMS.exec(text)) !== null)
        {
            if(match.index < text.length)
            {
                positions.push(match.index + 1);
            }
        }

        return positions;
    }

    /**
	 * Enables the text field, making it editable.
	 */
    public override enable(): boolean
    {
        if(super.enable())
        {
            this._editable = true;

            if(this._inputElement)
            {
                this._inputElement.readOnly = false;
            }

            return true;
        }

        this._editable = false;

        if(this._inputElement)
        {
            this._inputElement.readOnly = true;
        }

        return false;
    }

    /**
	 * Disables the text field, making it non-editable.
	 */
    public override disable(): boolean
    {
        if(super.disable())
        {
            this._editable = false;

            if(this._inputElement)
            {
                this._inputElement.readOnly = true;
            }

            return true;
        }

        this._editable = true;

        if(this._inputElement)
        {
            this._inputElement.readOnly = false;
        }

        return false;
    }

    /**
     * A text field's hit area is its BOX, never the pixels of its glyphs.
     *
     * The base implementation alpha-tests the window's own draw buffer, and in Flash that buffer
     * was opaque wherever the field was: the AS3 class builds its own `GraphicContext` and
     * overrides `set background`, so the TextField's background fill lives in the very bitmap the
     * test samples. This port has no Flash TextField — `TextSkinRenderer` paints glyphs and
     * nothing else — so the same test samples a fully transparent buffer whenever the field is
     * empty, and the default threshold for this window type is 10, not 0
     * (`registerTextRenderersMissingFromElementDescription` registers `new DefaultAttStruct()`,
     * whose threshold defaults to 10, and the element description declares no entry of its own).
     *
     * An empty field was therefore unreachable by the mouse: `passMouseEvent` rejected the point,
     * so no WME_DOWN arrived, `focus()` never ran, the DOM bridge never took focus and nothing
     * could be typed. Every empty input in the client was dead this way, and a field that did hold
     * text was clickable only on the letters themselves.
     */
    // DEVIATION: AS3 leaves this to WindowController, whose alpha test reads a bitmap that carried
    //   the field's background; this port's buffer holds glyph coverage only, so the literal port
    //   of that test answers the opposite question. Bounds are what Flash's TextField hit area was.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextFieldController.as::getGraphicContext()
    public override validateLocalPointIntersection(point: { x: number; y: number }, _drawBuffer: unknown): boolean
    {
        return this.isInWindowBounds(point);
    }

    /**
	 * Focuses the text field.
	 *
	 * In AS3, calls super.focus() then sets Flash stage focus to the TextField.
	 * Here we focus the hidden HTML input element.
	 */
    public override focus(): boolean
    {
        const result = super.focus();

        if(result)
        {
            if(this._inputElement)
            {
                this.positionInputElement();
                this._inputElement.style.display = '';
                this._inputElement.value = this._text;
                this._inputElement.focus();
                this.startInputPositionTracking();
            }
        }

        return result;
    }

    /**
     * Keeps the (transparent-text) input — and therefore its native caret — glued to the field
     * while it has focus, so the caret follows the window when its frame is dragged.
     *
     * An event would be cleaner, but WE_PARENT_RELOCATED is only delivered to a moved window's
     * DIRECT children (WindowController.notifyChildren) and is not re-cascaded, so a field nested
     * inside a border inside the frame — the common case — never receives it. Polling per frame
     * while focused sidesteps that; only one field is focused at a time and the sync is a cheap
     * position read, so the cost is negligible. Stops on blur/dispose.
     */
    private startInputPositionTracking(): void
    {
        if(typeof requestAnimationFrame === 'undefined') return;

        this.stopInputPositionTracking();

        const tick = (): void =>
        {
            if(!this._inputElement || document.activeElement !== this._inputElement)
            {
                this._caretTrackRaf = null;

                return;
            }

            // The window that owns the field can go away under it — a frame hidden by its
            // close button, a parent disposed — and none of those paths reaches the field,
            // so the DOM bridge kept its focus and the browser kept blinking a caret over
            // an empty canvas. Checked here because this is the one place that already
            // runs every frame for exactly as long as a caret exists.
            if(!this.isEffectivelyVisible())
            {
                this.unfocus();

                return;
            }

            this.syncInputPosition();
            this.syncCaretVisibility();
            this._caretTrackRaf = requestAnimationFrame(tick);
        };

        this._caretTrackRaf = requestAnimationFrame(tick);
    }

    // TS-only: no AS3 counterpart. Flash hid a TextField with its parent for free; the DOM
    // bridge behind this port's fields is a sibling of the canvas and is hidden by nothing,
    // so its visibility has to be derived from the window chain by hand.
    private isEffectivelyVisible(): boolean
    {
        const desktop = this.desktop;
        let window: IWindow | null = this as unknown as IWindow;

        while(window !== null)
        {
            if(window.disposed || !window.visible) return false;
            if(window === desktop) return true;

            window = window.parent;
        }

        // The walk has to *reach the desktop*, not merely run out of parents. Detaching a window
        // from its parent is how most of this client closes one (see the catalog's misnamed
        // `hideMainWindow()`), and `WindowRenderer.invalidate()` only ever walks down from the
        // desktop, so anything off that tree is not drawn. Stopping at `parent === null` therefore
        // called a closed window visible, the bridge kept its focus, and the browser went on
        // blinking a caret over the room — above every window, since the element sits on top of
        // the canvas at z-index 9999.
        //
        // A null desktop means the context is not wired up yet; that stays visible rather than
        // killing every caret in the client.
        return desktop === null;
    }

    /**
     * Hides the bridge's caret — and only the caret — while another window is drawn over the field.
     *
     * Flash needed no equivalent: the TextField and its caret lived in the same display list as
     * every window, so a window in front simply painted over them. The bridge is a DOM element
     * sitting on top of the canvas at z-index 9999, so it has no z-order relative to the windows at
     * all and the caret blinked through anything opened over the field.
     *
     * `caret-color` is what goes transparent, not the element: blurring or hiding it would take the
     * keystrokes and the IME with it, and the field is still the focused one — it is merely behind
     * something. Restoring the colour is a plain re-derivation from `_textColor`, the same one
     * `positionInputElement()` makes.
     */
    // TS-only: Flash's caret was part of the display list, so nothing had to test for occlusion.
    private syncCaretVisibility(): void
    {
        if(!this._inputElement) return;

        const color = this._textColor & 0xFFFFFF;

        this._inputElement.style.caretColor = this.isCoveredByAnotherWindow()
            ? 'transparent'
            : '#' + color.toString(16).padStart(6, '0');
    }

    /**
     * Deliberately narrow, and it fails open — the only window that can hide a caret is the
     * desktop's *active* one, stacked above the field's own and covering it.
     *
     * The tempting version scans every desktop child above the field's window, and that is what
     * makes it dangerous: plenty of them are full-screen layout containers that paint nothing, and
     * one of those sitting above the chat bar would kill its caret permanently for no visible
     * reason. A window has to have been activated to cover anything here, which is exactly the case
     * being fixed — a dialog opened over a window whose field still holds focus.
     *
     * Only the desktop's own children are compared; windows *inside* the field's window are not
     * consulted, since a border or an icon drawn after the field is part of it, not on top of it.
     * The sampled point is the field's left edge at mid-height: that is where the caret sits in an
     * empty field, and for a whole window dropped on top it gives the same answer the caret's real
     * x would. Measuring that x exactly would mean re-measuring the text every frame.
     */
    // TS-only: see syncCaretVisibility().
    private isCoveredByAnotherWindow(): boolean
    {
        const desktop = this.desktop as IDesktopWindow | null;

        if(!desktop) return false;

        const active = desktop.getActiveWindow();

        if(active === (desktop as unknown as IWindow) || !active.visible) return false;

        let top: IWindow = this as unknown as IWindow;

        while(top.parent !== null && top.parent !== (desktop as unknown as IWindow))
        {
            top = top.parent;
        }

        // The field's own window being the active one is the normal case, not an occlusion.
        if(top === active || desktop.getChildIndex(active) < desktop.getChildIndex(top)) return false;

        const position = {x: 0, y: 0};

        this.getGlobalPosition(position);

        const rect = active.rectangle;
        const x = position.x;
        const y = position.y + this._height / 2;

        return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
    }

    private stopInputPositionTracking(): void
    {
        if(this._caretTrackRaf !== null && typeof cancelAnimationFrame !== 'undefined')
        {
            cancelAnimationFrame(this._caretTrackRaf);
        }

        this._caretTrackRaf = null;
    }

    /**
	 * Unfocuses the text field.
	 *
	 * In AS3, clears Flash stage focus then calls super.unfocus().
	 * Here we blur the hidden HTML input element.
	 */
    public override unfocus(): boolean
    {
        this.stopInputPositionTracking();

        if(this._inputElement)
        {
            if(document.activeElement === this._inputElement)
            {
                this._inputElement.blur();
            }

            this._inputElement.style.display = 'none';
        }

        return super.unfocus();
    }

    /**
	 * Handles window events for the text field.
	 *
	 * In AS3, WE_ACTIVATED and WME_DOWN trigger focus(),
	 * WE_RESIZED syncs the field dimensions, and interactive
	 * events are processed for tooltips.
	 */
    public override update(source: WindowController, event: WindowEvent): boolean
    {
        const result = super.update(source, event);

        switch(event.type)
        {
            case 'WE_ACTIVATED':
            case 'WME_DOWN':
                this.focus();
                break;
            case 'WE_RESIZED':
                if(source === (this as unknown as WindowController))
                {
                    this.positionInputElement();
                }
                break;
        }

        if(source === (this as unknown as WindowController))
        {
            InteractiveController.processInteractiveWindowEvents(this, event);
        }

        return result;
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::appendText()
    public appendText(text: string): void
    {
        this._text += text;

        if(this._inputElement)
        {
            this._inputElement.value = this._text;
        }
    }

    // AS3: .../src/com/sulake/core/window/components/TextController.as::replaceText()
    public replaceText(beginIndex: number, endIndex: number, newText: string): void
    {
        this._text = this._text.substring(0, beginIndex) + newText + this._text.substring(endIndex);

        if(this._inputElement)
        {
            this._inputElement.value = this._text;
        }
    }

    /**
	 * Sets the selection range on the input element.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::setSelection()
    public setSelection(beginIndex: number, endIndex: number): void
    {
        this._selectionBeginIndex = beginIndex;
        this._selectionEndIndex = endIndex;

        if(this._inputElement)
        {
            this._inputElement.setSelectionRange(beginIndex, endIndex);
        }
    }

    /**
	 * Programmatically triggers a change event.
	 *
	 * In AS3, this calls onChangeEvent(null) which dispatches WE_CHANGE.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::requestChangeEvent()
    public requestChangeEvent(): void
    {
        this.onChangeEvent();
    }

    /**
	 * Gets the word at the given pixel position.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::getWordAt()
    public getWordAt(_x: number, _y: number): string
    {
        return '';
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::showToolTip()
    public showToolTip(_toolTip: unknown): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::hideToolTip()
    public hideToolTip(): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::setMouseCursorForState()
    public setMouseCursorForState(_state: number, _cursor: number): number
    {
        return 0;
    }

    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::getMouseCursorByState()
    public getMouseCursorByState(_state: number): number
    {
        return 0;
    }

    public override dispose(): void
    {
        if(this._disposed) return;

        this._focusCapturer = false;
        this.stopInputPositionTracking();

        if(this.focused) this.unfocus();

        this.destroyInputElement();

        super.dispose();
    }

    /**
	 * Detaches the DOM bridge and drops every listener bound to it.
	 *
	 * Split out of dispose() because the element is also thrown away and rebuilt
	 * mid-life, when the field turns out to be multi-line (see
	 * ensureInputElementKind()).
	 */
    /** The field behind each DOM bridge, for the host's click-away blur (TextFieldController.fieldOf()). */
    // TS-only: Flash's stage knew which TextField had focus; the DOM only knows the element.
    private static readonly FIELDS = new WeakMap<Element, TextFieldController>();

    /** The text field whose DOM bridge `element` is, if it is one. */
    public static fieldOf(element: Element | null): TextFieldController | null
    {
        return element ? TextFieldController.FIELDS.get(element) ?? null : null;
    }

    private destroyInputElement(): void
    {
        if(this._inputElement)
        {
            TextFieldController.FIELDS.delete(this._inputElement);
            if(this._boundOnInput) this._inputElement.removeEventListener('input', this._boundOnInput);
            if(this._boundOnKeyDown) this._inputElement.removeEventListener('keydown', this._boundOnKeyDown);
            if(this._boundOnKeyUp) this._inputElement.removeEventListener('keyup', this._boundOnKeyUp);
            if(this._boundOnFocus) this._inputElement.removeEventListener('focus', this._boundOnFocus);
            if(this._boundOnBlur) this._inputElement.removeEventListener('blur', this._boundOnBlur);

            if(this._inputElement.parentNode)
            {
                this._inputElement.parentNode.removeChild(this._inputElement);
            }

            this._inputElement = null;
        }

        this._boundOnInput = null;
        this._boundOnKeyDown = null;
        this._boundOnKeyUp = null;
        this._boundOnFocus = null;
        this._boundOnBlur = null;
    }

    /**
	 * Creates and sets up the hidden HTML input element for text capture.
	 */
    private createInputElement(): void
    {
        if(typeof document === 'undefined') return;

        const el = this.usesMultipleLines
            ? document.createElement('textarea')
            : document.createElement('input');

        if(el instanceof HTMLInputElement)
        {
            el.type = this._displayAsPassword ? 'password' : 'text';
        }

        // TS-only: no AS3 counterpart — Flash had no browser autofill to defend against.
        // The password manager treats any `input[type=password]` on the page as a login form and
        // fills the paired text input with the saved account name; the room-settings Access tab
        // builds two such fields, so a plain field elsewhere in the client (the rights filter, the
        // room name) got the user's e-mail written into it. That is not merely wrong data: the
        // `:-webkit-autofill` UA rule overrides `color: transparent` and `background: transparent`
        // with its own, so the bridge element — which exists only to carry the caret and IME while
        // the canvas paints the glyphs — becomes visible, and paints an e-mail address over the UI.
        // `off` alone is honoured inconsistently for text inputs; the per-type values below are the
        // ones Chrome actually respects.
        el.autocomplete = this._displayAsPassword ? 'new-password' : 'off';
        el.spellcheck = false;
        el.setAttribute('autocorrect', 'off');
        el.setAttribute('autocapitalize', 'off');

        // The visible text is painted on the canvas (TextSkinRenderer), not by this element — but a
        // fully transparent input (opacity:0) hides its native caret too, which is why editable
        // fields had no blinking cursor. Instead keep the element visible with TRANSPARENT text and
        // only its caret coloured (caret-color, set per-field in positionInputElement). The canvas
        // still draws the glyphs; the browser contributes just the blinking caret, its arrow-key
        // movement and IME — for free, and pixel-aligned because the canvas is 1:1 CSS pixels (no
        // DPR scaling, see App.resizeCanvas) and this element is positioned over the field in the
        // same coordinate space with a matching font.
        el.style.position = 'absolute';
        el.style.opacity = '1';
        el.style.color = 'transparent';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '9999';
        el.style.display = 'none';
        el.style.padding = '0';
        el.style.margin = '0';
        el.style.border = 'none';
        el.style.outline = 'none';
        el.style.background = 'transparent';
        el.style.boxSizing = 'border-box';

        if(el instanceof HTMLTextAreaElement)
        {
            // Soft-wrapped, no scrollbar and no resize grip: the visible lines are
            // the canvas's, this only has to break in the same places so the caret
            // lands on the line the renderer drew.
            el.wrap = 'soft';
            el.style.overflow = 'hidden';
            el.style.resize = 'none';
            el.style.whiteSpace = 'pre-wrap';
        }

        this._boundOnInput = ((e: Event) => this.onInputEvent(e)) as EventListener;
        this._boundOnKeyDown = ((e: Event) => this.onKeyDownEvent(e as KeyboardEvent)) as EventListener;
        this._boundOnKeyUp = ((e: Event) => this.onKeyUpEvent(e as KeyboardEvent)) as EventListener;
        this._boundOnFocus = ((e: Event) => this.onFocusInEvent(e as FocusEvent)) as EventListener;
        this._boundOnBlur = ((e: Event) => this.onFocusOutEvent(e as FocusEvent)) as EventListener;

        el.addEventListener('input', this._boundOnInput);
        el.addEventListener('keydown', this._boundOnKeyDown);
        el.addEventListener('keyup', this._boundOnKeyUp);
        el.addEventListener('focus', this._boundOnFocus);
        el.addEventListener('blur', this._boundOnBlur);

        document.body.appendChild(el);
        this._inputElement = el;
        TextFieldController.FIELDS.set(el, this);
    }

    /**
	 * Positions the hidden input element over the window's global position.
	 */
    /**
     * Light per-frame update: only the screen position, so the input (and its caret) tracks the
     * field as its window moves. The heavier font/margin/caret-colour setup stays in
     * positionInputElement, which runs on focus and resize.
     */
    private syncInputPosition(): void
    {
        if(!this._inputElement) return;

        const pos = {x: 0, y: 0};
        this.getGlobalPosition(pos);

        const canvas = document.querySelector('canvas');
        const rect = canvas ? canvas.getBoundingClientRect() : {left: 0, top: 0};

        // The element covers the field's TEXT BOX, not the whole field — see
        // positionInputElement() for why — so it starts where TextSkinRenderer
        // starts drawing glyphs: the margins plus Flash's gutters.
        const left = (rect.left + pos.x + this._marginLeft + TextController.FLASH_TEXT_FIELD_LEFT_GUTTER) + 'px';
        const top = (rect.top + pos.y + this._marginTop + TextController.FLASH_TEXT_FIELD_TOP_GUTTER) + 'px';

        if(this._inputElement.style.left !== left) this._inputElement.style.left = left;
        if(this._inputElement.style.top !== top) this._inputElement.style.top = top;
    }

    /**
	 * Whether the field lays its text out over more than one line.
	 *
	 * Flash's TextField wraps on `wordWrap` alone — `multiline` only decides
	 * whether the *user* may add line breaks — and TextSkinRenderer paints it that
	 * way, so both have to put a `<textarea>` behind the field.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextController.as::setWordWrap()
    private get usesMultipleLines(): boolean
    {
        return this._multiline || this._wordWrap;
    }

    /**
	 * Rebuilds the DOM bridge as an `<input>` or a `<textarea>` to match the
	 * field's current line mode.
	 *
	 * The constructor cannot decide this: `multiline`/`word_wrap` arrive from the
	 * layout's `<variables>` block, which the window system applies *after*
	 * construction — so every field, including the 80px-tall wrapped ones, was
	 * built as a single-line `<input>`. Its caret then ran off horizontally along
	 * one line while the canvas painted the text wrapped over four, and Enter did
	 * nothing.
	 */
    private ensureInputElementKind(): void
    {
        if(!this._inputElement) return;

        const wantsTextArea = this.usesMultipleLines;

        if(wantsTextArea === (this._inputElement instanceof HTMLTextAreaElement)) return;

        const wasFocused = this.focused;
        const value = this._inputElement.value;
        const selectionStart = this._inputElement.selectionStart;
        const selectionEnd = this._inputElement.selectionEnd;

        this.destroyInputElement();
        this.createInputElement();

        if(!this._inputElement) return;

        this._inputElement.value = value;

        if(wasFocused)
        {
            this._inputElement.style.display = '';
            this._inputElement.focus();

            if(selectionStart !== null && selectionEnd !== null)
            {
                this._inputElement.setSelectionRange(selectionStart, selectionEnd);
            }
        }
    }

    /**
	 * Sizes and styles the DOM bridge so its native caret lands exactly on the
	 * glyphs the canvas paints.
	 *
	 * The element used to be laid over the whole field with the field's own
	 * height, which put the caret in the wrong place twice over. A single-line
	 * `<input>` centres its editor vertically in its content box no matter what
	 * `line-height` says, so a 9px line inside a 26px field sat ~7px below the
	 * painted text — and inside an 80px description box, halfway down it.
	 * `font-family` made it worse: assigning the raw `fontFace` produced invalid
	 * CSS for any quoted family (`Volter (Goldfish)` — parentheses), the browser
	 * dropped the declaration and measured the caret's advances in its default
	 * font while the canvas drew Volter.
	 *
	 * So: cover the text box only (origin = where the renderer starts drawing,
	 * height = exactly one line unless the field wraps), and take the font string
	 * from the same builder the measuring/drawing path uses.
	 */
    private positionInputElement(): void
    {
        this.ensureInputElementKind();

        const element = this._inputElement;

        if(!element) return;

        this.syncInputPosition();

        const lineHeight = this.getLineHeight();
        const textWidth = Math.max(0, this._width - this._marginLeft - this._marginRight - TextController.FLASH_TEXT_FIELD_LEFT_GUTTER);
        const textHeight = this.usesMultipleLines
            ? Math.max(lineHeight, this._height - this._marginTop - this._marginBottom - TextController.FLASH_TEXT_FIELD_TOP_GUTTER)
            : lineHeight;

        element.style.width = textWidth + 'px';
        element.style.height = textHeight + 'px';
        element.style.font = this.buildCanvasFontString();
        element.style.lineHeight = lineHeight + 'px';

        // maxChars is a layout property too, so it lands after construction as well.
        if(this._maxChars > 0) element.maxLength = this._maxChars;
        else element.removeAttribute('maxlength');

        const color = this._textColor & 0xFFFFFF;

        element.style.caretColor = '#' + color.toString(16).padStart(6, '0');
    }

    /**
	 * Handles text input from the hidden HTML element.
	 */
    private onInputEvent(_e: Event): void
    {
        if(!this._inputElement) return;

        // The `restrict` mask filters typing, so it belongs here and not on any of the paths
        // that assign text in code. Rejected characters are spliced back out of the DOM value,
        // which moves the caret to the end — so it is put back where it was, minus however many
        // characters were dropped before it.
        const raw = this._inputElement.value;
        let filtered = this.applyRestrict(raw);

        // Flash: `multiline` is what decides whether the USER may put a line break in the field,
        // and a single-line TextField simply swallows Enter. The DOM bridge is a `<textarea>`
        // whenever the field *wraps* (see usesMultipleLines), and a textarea always takes the
        // key — so every `word_wrap="true"` single-line input collected a "\n" the moment its
        // handler submitted on Enter, and kept it as the head of the next message. In the
        // messenger that newline went out with the text (an empty first line in every bubble,
        // 12px taller each) and pushed what the user typed next onto a second line, below a box
        // one line high: typing was invisible while the message still sent correctly.
        if(!this._multiline) filtered = filtered.replace(/[\r\n]/g, '');

        if(filtered !== raw)
        {
            const caret = this._inputElement.selectionStart ?? filtered.length;
            const dropped = raw.length - filtered.length;

            this._inputElement.value = filtered;
            this._inputElement.setSelectionRange(Math.max(0, caret - dropped), Math.max(0, caret - dropped));
        }

        this._text = this._inputElement.value;
        this._caption = this._text;
        this._context.invalidate(this, null, 1);
        this.onChangeEvent();
    }

    /**
	 * Resolves a DOM `KeyboardEvent` to a Flash-style `charCode`.
	 *
	 * `KeyboardEvent.key` is the actual typed character for printable keys
	 * (correctly case-sensitive/layout-aware, e.g. `'a'`/`'A'`/`' '`), but for
	 * non-printable keys it's a multi-character name (`'Enter'`, `'Backspace'`,
	 * `'Tab'`, ...) - naively taking `.charCodeAt(0)` of that name silently
	 * produced the first letter's code instead (`'Enter'` -> `'E'` -> 69, not
	 * 13), so e.g. RoomChatInputView's `charCode === 13` send-on-Enter check
	 * never matched. Falls back to the legacy `keyCode` for those, which still
	 * carries the expected control-character values (Enter=13, Backspace=8,
	 * Tab=9, ...).
	 */
    private static resolveCharCode(e: KeyboardEvent): number
    {
        return e.key?.length === 1 ? e.key.charCodeAt(0) : (e.keyCode ?? 0);
    }

    /**
	 * Dispatches a WKE_KEY_DOWN event through the window system.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::onKeyDownEvent()
    private onKeyDownEvent(e: KeyboardEvent): void
    {
        try
        {
            this._caption = this._inputElement?.value ?? this._text;
            this._text = this._caption;
            this._context.invalidate(this, null, 1);

            const wke = WindowKeyboardEvent.allocateKeyboard(
                WindowKeyboardEvent.KEY_DOWN,
                e.keyCode ?? 0,
                TextFieldController.resolveCharCode(e),
                this,
                null,
                e.altKey,
                e.ctrlKey,
                e.shiftKey,
                e.location
            );

            this.update(this as unknown as WindowController, wke);

            if(this.disposed) return;

            for(const tracker of this._context.inputEventTrackers)
            {
                tracker.eventReceived(wke, this);
            }

            wke.recycle();
        }
        catch (err)
        {
            this._context.handleError(5, err instanceof Error ? err : new Error(String(err)));
        }
    }

    /**
	 * Dispatches a WKE_KEY_UP event through the window system.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::onKeyUpEvent()
    private onKeyUpEvent(e: KeyboardEvent): void
    {
        try
        {
            this._caption = this._inputElement?.value ?? this._text;
            this._text = this._caption;
            this._context.invalidate(this, null, 1);

            const wke = WindowKeyboardEvent.allocateKeyboard(
                WindowKeyboardEvent.KEY_UP,
                e.keyCode ?? 0,
                TextFieldController.resolveCharCode(e),
                this,
                null,
                e.altKey,
                e.ctrlKey,
                e.shiftKey,
                e.location
            );

            this.update(this as unknown as WindowController, wke);

            if(this.disposed) return;

            for(const tracker of this._context.inputEventTrackers)
            {
                tracker.eventReceived(wke, this);
            }

            wke.recycle();
        }
        catch (err)
        {
            this._context.handleError(5, err instanceof Error ? err : new Error(String(err)));
        }
    }

    /**
	 * Dispatches a WE_CHANGE event through the window system.
	 */
    // AS3: .../src/com/sulake/core/window/components/TextFieldController.as::onChangeEvent()
    private onChangeEvent(): void
    {
        try
        {
            const changeEvent = WindowEvent.allocate('WE_CHANGE', this, null);
            this.update(this as unknown as WindowController, changeEvent);
            changeEvent.recycle();
        }
        catch (err)
        {
            this._context.handleError(5, err instanceof Error ? err : new Error(String(err)));
        }
    }

    /**
	 * Handles native focus-in: sets the window focus state.
	 */
    private onFocusInEvent(_e: FocusEvent): void
    {
        try
        {
            if(!this.getStateFlag(2))
            {
                this.focus();
            }
        }
        catch (err)
        {
            this._context.handleError(5, err instanceof Error ? err : new Error(String(err)));
        }
    }

    /**
	 * Handles native focus-out: clears the window focus state.
	 */
    private onFocusOutEvent(_e: FocusEvent): void
    {
        try
        {
            // `this.unfocus()`, not `super.unfocus()`: the override is what hides the DOM bridge
            // and stops the caret-tracking frame loop. Going straight to super left the element at
            // `display: ''` after every native blur — clicking anywhere else on the canvas — so it
            // outlived its own window and its tab, which is how an autofilled field ended up
            // floating over the room-settings dialog. Re-entry is safe: unfocus() only calls
            // blur() when the element still is document.activeElement, which it no longer is here.
            if(this.getStateFlag(2))
            {
                this.unfocus();
            }
            else if(this._inputElement)
            {
                this._inputElement.style.display = 'none';
            }
        }
        catch (err)
        {
            this._context.handleError(5, err instanceof Error ? err : new Error(String(err)));
        }
    }
}
