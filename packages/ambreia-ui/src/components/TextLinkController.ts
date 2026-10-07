import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {ITextLinkWindow} from './ITextLinkWindow';
import type {IToolTipWindow} from './IToolTipWindow';
import {TextController} from './TextController';
import {InteractiveController} from './InteractiveController';
import type {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';

/**
 * Controller for text link windows.
 *
 * Extends TextController with interactive features (tooltip, cursor)
 * by delegating to InteractiveController static methods. In AS3, this
 * sets immediateClickMode and mouseThreshold in the constructor and
 * calls InteractiveController.processInteractiveWindowEvents in update().
 *
 * @see sources/win63_version/core/window/components/TextLinkController.as
 */
export class TextLinkController extends TextController implements ITextLinkWindow
{
    protected _mouseCursorMap: Map<number, number> | null = null;

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
        super(name, type, style, (param | 0x01) & ~0x10, context, rect, parent, procedure, tags, properties, id, dynamicStyle);

        const defaults = context.getWindowFactory()?.getThemeManager()?.getPropertyDefaults(style) ?? null;

        this._toolTipDelay = Number(defaults?.getValue('tool_tip_delay') ?? 0);
        this._toolTipCaption = String(defaults?.getValue('tool_tip_caption') ?? '');
        this._toolTipIsDynamic = Boolean(defaults?.getValue('tool_tip_is_dynamic') ?? false);
        this._interactiveCursorDisabled = Boolean(defaults?.getValue('interactive_cursor_disabled') ?? false);
        this.immediateClickMode = true;
        this.mouseThreshold = 0;
    }

    private _toolTipDelay: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::get toolTipDelay()
    public get toolTipDelay(): number
    {
        return this._toolTipDelay;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::set toolTipDelay()
    public set toolTipDelay(value: number)
    {
        this._toolTipDelay = value;
    }

    private _toolTipCaption: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::get toolTipCaption()
    public get toolTipCaption(): string
    {
        return this._toolTipCaption;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::set toolTipCaption()
    public set toolTipCaption(value: string)
    {
        this._toolTipCaption = value == null ? '' : value;
    }

    private _toolTipIsDynamic: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::get toolTipIsDynamic()
    public get toolTipIsDynamic(): boolean
    {
        return this._toolTipIsDynamic;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::set toolTipIsDynamic()
    public set toolTipIsDynamic(value: boolean)
    {
        this._toolTipIsDynamic = value;
    }

    private _interactiveCursorDisabled: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::get interactiveCursorDisabled()
    public get interactiveCursorDisabled(): boolean
    {
        return this._interactiveCursorDisabled;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::set interactiveCursorDisabled()
    public set interactiveCursorDisabled(value: boolean)
    {
        this._interactiveCursorDisabled = value;
    }

    private _link: string = '';

    public get link(): string
    {
        return this._link;
    }

    public set link(value: string)
    {
        this._link = value ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::get mouseCursorType()
    public get mouseCursorType(): number
    {
        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::set mouseCursorType()
    public set mouseCursorType(_value: number)
    {
        // No-op per AS3
    }

    public override get properties(): unknown[]
    {
        return InteractiveController.writeInteractiveWindowProperties(this, super.properties);
    }

    public override set properties(value: unknown[])
    {
        InteractiveController.readInteractiveWindowProperties(this, value);
        super.properties = value;
    }

    /**
	 * Sets a mouse cursor for a specific state.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::setMouseCursorForState()
    public setMouseCursorForState(state: number, cursor: number): number
    {
        if(!this._mouseCursorMap)
        {
            this._mouseCursorMap = new Map();
        }

        const old = this._mouseCursorMap.get(state) ?? 0;

        if(cursor === 0 || cursor === 0xFFFFFFFF)
        {
            this._mouseCursorMap.delete(state);
        }
        else
        {
            this._mouseCursorMap.set(state, cursor);
        }

        return old;
    }

    /**
	 * Gets the mouse cursor for a specific state.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::getMouseCursorByState()
    public getMouseCursorByState(state: number): number
    {
        if(!this._mouseCursorMap) return 0;

        return this._mouseCursorMap.get(state) ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::showToolTip()
    public showToolTip(_toolTip: IToolTipWindow): void
    {
        throw new Error('Unimplemented method!');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/TextLinkController.as::hideToolTip()
    public hideToolTip(): void
    {
        throw new Error('Unimplemented method!');
    }

    /**
	 * Handles events, delegating interactive processing to InteractiveController.
	 *
	 * In AS3, calls super.update() then InteractiveController.processInteractiveWindowEvents()
	 * when the source is this window.
	 */
    public override update(source: WindowController, event: WindowEvent): boolean
    {
        const result = super.update(source, event);

        if(source === (this as unknown as WindowController))
        {
            InteractiveController.processInteractiveWindowEvents(this, event);
        }

        return result;
    }
}
