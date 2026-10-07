import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {ISelectableWindow} from './ISelectableWindow';
import type {ISelectorWindow} from './ISelectorWindow';
import type {WindowController} from '../WindowController';
import {WindowEvent} from '../events/WindowEvent';
import {ButtonController} from './ButtonController';

/**
 * Controller for selectable button windows.
 *
 * Extends ButtonController with select/unselect behavior and
 * optional integration with a parent ISelectorWindow for mutual exclusion.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/SelectableButtonController.as
 */
export class SelectableButtonController extends ButtonController implements ISelectableWindow
{
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
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    /**
	 * Finds the nearest ancestor ISelectorWindow.
	 */
    // AS3: .../src/com/sulake/core/window/components/SelectableButtonController.as::get selector()
    public get selector(): ISelectorWindow | null
    {
        if(this._parent)
        {
            let current: IWindow | null = this._parent as unknown as IWindow;

            while(current)
            {
                if('getSelected' in current && 'setSelected' in current)
                {
                    return current as unknown as ISelectorWindow;
                }

                current = current.parent;
            }
        }

        return null;
    }

    /**
	 * Whether this window is currently selected (state flag 8).
	 */
    // AS3: .../src/com/sulake/core/window/components/SelectableButtonController.as::get isSelected()
    public get isSelected(): boolean
    {
        return this.testStateFlag(8);
    }

    // AS3: .../src/com/sulake/core/window/components/SelectableButtonController.as::set isSelected()
    public set isSelected(value: boolean)
    {
        this.setStateFlag(8, value);
    }

    public override update(source: WindowController, event: WindowEvent): boolean
    {
        if(event.type === 'WE_ACTIVATED')
        {
            if(this._parent)
            {
                if(!('getSelected' in this._parent))
                {
                    let ancestor = this._parent.parent as WindowController | null;

                    while(ancestor)
                    {
                        if('getSelected' in ancestor && 'setSelected' in ancestor)
                        {
                            const childEvent = WindowEvent.allocate('WE_CHILD_ACTIVATED', this, null);
                            ancestor.update(this as unknown as WindowController, childEvent);
                            childEvent.recycle();
                            break;
                        }

                        ancestor = ancestor.parent as WindowController | null;
                    }
                }
            }
        }

        return super.update(source, event);
    }

    /**
	 * Selects this window, dispatching WE_SELECT and WE_SELECTED events.
	 *
	 * @returns True if the selection succeeded
	 */
    // AS3: .../src/com/sulake/core/window/components/SelectableButtonController.as::select()
    public select(): boolean
    {
        if(this.getStateFlag(8))
        {
            return true;
        }

        const selectEvent = WindowEvent.allocate('WE_SELECT', this, null, true);
        this.update(this as unknown as WindowController, selectEvent);

        if(selectEvent.isDefaultPrevented())
        {
            selectEvent.recycle();
            return false;
        }

        selectEvent.recycle();
        this.setStateFlag(8, true);

        const selectedEvent = WindowEvent.allocate('WE_SELECTED', this, null);
        this.update(this as unknown as WindowController, selectedEvent);
        selectedEvent.recycle();

        return true;
    }

    /**
	 * Unselects this window, dispatching WE_UNSELECT and WE_UNSELECTED events.
	 *
	 * @returns True if the unselection succeeded
	 */
    // AS3: .../src/com/sulake/core/window/components/SelectableButtonController.as::unselect()
    public unselect(): boolean
    {
        if(!this.getStateFlag(8))
        {
            return true;
        }

        const unselectEvent = WindowEvent.allocate('WE_UNSELECT', this, null, true);
        this.update(this as unknown as WindowController, unselectEvent);

        if(unselectEvent.isDefaultPrevented())
        {
            unselectEvent.recycle();
            return false;
        }

        unselectEvent.recycle();
        this.setStateFlag(8, false);

        const unselectedEvent = WindowEvent.allocate('WE_UNSELECTED', this, null);
        this.update(this as unknown as WindowController, unselectedEvent);
        unselectedEvent.recycle();

        return true;
    }
}
