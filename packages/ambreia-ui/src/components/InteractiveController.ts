import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IInteractiveWindow} from './IInteractiveWindow';
import {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';

/**
 * Base controller for interactive windows with tooltip and cursor support.
 *
 * Extends WindowController with IInteractiveWindow functionality: tooltip,
 * mouse cursor per state, and interactive event processing.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/InteractiveController.as
 */
export class InteractiveController extends WindowController implements IInteractiveWindow
{
    protected _mouseCursors: Map<number, number> | null = null;

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
        id: number = 0
    )
    {
        param = param | 0x01;

        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/InteractiveController.as::InteractiveController()
    protected override finalize(): void
    {
        super.finalize();

        this._toolTipDelay ??= 500;
    }

    // Declared without an initializer: WindowController's applyProperties()
    // phase dispatches to our `set properties()` override (via
    // readInteractiveWindowProperties()) before finalize() runs, so a
    // non-default initializer here would clobber a value already applied
    // from `properties`. Default primed with `??=` in finalize() instead.
    protected _toolTipDelay: number | null = null;

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::get toolTipDelay()
    public get toolTipDelay(): number
    {
        return this._toolTipDelay ?? 500;
    }

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::set toolTipDelay()
    public set toolTipDelay(value: number)
    {
        this._toolTipDelay = value;
    }

    protected _toolTipCaption: string = '';

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::get toolTipCaption()
    public get toolTipCaption(): string
    {
        return this._toolTipCaption;
    }

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::set toolTipCaption()
    public set toolTipCaption(value: string)
    {
        this._toolTipCaption = value ?? '';
    }

    protected _toolTipIsDynamic: boolean = false;

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::get toolTipIsDynamic()
    public get toolTipIsDynamic(): boolean
    {
        return this._toolTipIsDynamic;
    }

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::set toolTipIsDynamic()
    public set toolTipIsDynamic(value: boolean)
    {
        this._toolTipIsDynamic = value;
    }

    protected _interactiveCursorDisabled: boolean = false;

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::get interactiveCursorDisabled()
    public get interactiveCursorDisabled(): boolean
    {
        return this._interactiveCursorDisabled;
    }

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::set interactiveCursorDisabled()
    public set interactiveCursorDisabled(value: boolean)
    {
        this._interactiveCursorDisabled = value;
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
	 * Processes tooltip events for an interactive window.
	 */
    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::processInteractiveWindowEvents()
    public static processInteractiveWindowEvents(window: IInteractiveWindow, event: WindowEvent): void
    {
        // Wired 2026-08-27. These five branches were empty comments, so `WindowToolTipAgent` — 262
        // lines, constructed by every `ServiceManager` — was never called once and no tooltip in
        // this client had ever appeared.
        const toolTips = window.context?.getWindowServices()?.getToolTipAgentService() ?? null;

        if(toolTips === null) return;

        if(window.toolTipIsDynamic)
        {
            if(event.type === 'WME_OVER')
            {
                toolTips.begin(window);
            }
            else if(event.type === 'WME_MOVE')
            {
                toolTips.updateCaption(window);
            }
            else if(event.type === 'WME_OUT')
            {
                toolTips.end(window);
            }
        }
        else
        {
            // A static tooltip with no caption has nothing to show, so AS3 does not even start the
            // timer for it — the `else` is guarded, not the branches inside.
            if(window.toolTipCaption != null && window.toolTipCaption.length > 0)
            {
                if(event.type === 'WME_OVER')
                {
                    toolTips.begin(window);
                }
                else if(event.type === 'WME_OUT')
                {
                    toolTips.end(window);
                }
            }
        }
    }

    /**
	 * Reads interactive window properties from an array of PropertyStructs.
	 */
    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::readInteractiveWindowProperties()
    public static readInteractiveWindowProperties(window: IInteractiveWindow, props: unknown[]): void
    {
        for(const item of props)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'tool_tip_caption':
                    if(prop.value !== window.toolTipCaption)
                    {
                        window.toolTipCaption = prop.value as string;
                    }
                    break;
                case 'tool_tip_delay':
                    if(prop.value !== window.toolTipDelay)
                    {
                        window.toolTipDelay = prop.value as number;
                    }
                    break;
                case 'tool_tip_is_dynamic':
                    if(prop.value !== window.toolTipIsDynamic)
                    {
                        window.toolTipIsDynamic = prop.value as boolean;
                    }
                    break;
                case 'interactive_cursor_disabled':
                    if(prop.value !== window.interactiveCursorDisabled)
                    {
                        window.interactiveCursorDisabled = prop.value as boolean;
                    }
                    break;
            }
        }
    }

    /**
	 * Writes interactive window properties into a properties array.
	 */
    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::writeInteractiveWindowProperties()
    public static writeInteractiveWindowProperties(window: IInteractiveWindow, props: unknown[]): unknown[]
    {
        props.push(window.createProperty('tool_tip_caption', window.toolTipCaption));
        props.push(window.createProperty('tool_tip_delay', window.toolTipDelay));
        props.push(window.createProperty('tool_tip_is_dynamic', window.toolTipIsDynamic));
        props.push(window.createProperty('interactive_cursor_disabled', window.interactiveCursorDisabled));

        return props;
    }

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::setMouseCursorForState()
    public setMouseCursorForState(state: number, cursor: number): number
    {
        if(this.testStateFlag(32))
        {
            return 1;
        }

        if(!this._mouseCursors)
        {
            this._mouseCursors = new Map();
        }

        const previous = this._mouseCursors.get(state) ?? 0;

        if(cursor === 0 || cursor === 0xFFFFFFFF)
        {
            this._mouseCursors.delete(state);
        }
        else
        {
            this._mouseCursors.set(state, cursor);
        }

        return previous;
    }

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::getMouseCursorByState()
    public getMouseCursorByState(state: number): number
    {
        if(!this._mouseCursors)
        {
            return 0;
        }

        return this._mouseCursors.get(state) ?? 0;
    }

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::showToolTip()
    public showToolTip(_tooltip: unknown): void
    {
        // Override in subclass
    }

    // AS3: .../src/com/sulake/core/window/components/InteractiveController.as::hideToolTip()
    public hideToolTip(): void
    {
        // Override in subclass
    }

    public override update(source: WindowController, event: WindowEvent): boolean
    {
        if(source === this)
        {
            InteractiveController.processInteractiveWindowEvents(this, event);
        }

        return super.update(source, event);
    }
}
