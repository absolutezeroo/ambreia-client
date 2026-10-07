import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import {ContainerController} from './ContainerController';
import type {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';

/**
 * Controller for activator windows.
 *
 * Manages child activation state: when a child dispatches WE_CHILD_ACTIVATED,
 * the activator deactivates the previous active child and moves the new one
 * to the top of the z-order.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ActivatorController.as
 */
export class ActivatorController extends ContainerController
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/ActivatorController.as::_activeChild
    protected _activeChild: IWindow | null = null;

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
        _dynamicStyle: string = ''
    )
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    /**
	 * Handles child activation events.
	 *
	 * WE_CHILD_ACTIVATED: sets the source as the active child.
	 * WE_PARENT_ACTIVATED: absorbed (returns true without dispatching).
	 */
    public override update(source: WindowController, event: WindowEvent): boolean
    {
        if(event.type === 'WE_CHILD_ACTIVATED')
        {
            this.setActiveChild(source as unknown as IWindow);
        }
        else if(event.type === 'WE_PARENT_ACTIVATED')
        {
            return true;
        }

        return super.update(source, event);
    }

    /**
	 * Returns the currently active child window.
	 */
    // AS3: .../src/com/sulake/core/window/components/ActivatorController.as::getActiveChild()
    public getActiveChild(): IWindow | null
    {
        return this._activeChild;
    }

    /**
	 * Sets the active child window.
	 *
	 * Walks up the parent chain to find a direct child if necessary,
	 * deactivates the previous active child, and moves the new one to the top.
	 *
	 * @returns The previously active child
	 */
    // AS3: .../src/com/sulake/core/window/components/ActivatorController.as::setActiveChild()
    public setActiveChild(window: IWindow): IWindow | null
    {
        let target = window;

        if(target.parent !== (this as unknown as IWindow))
        {
            do
            {
                target = target.parent!;

                if(target === null)
                {
                    throw new Error('Window passed to activator is not a child!');
                }
            }
            while(target.parent !== (this as unknown as IWindow));
        }

        const previous = this._activeChild;

        if(this._activeChild !== target)
        {
            if(this._activeChild !== null)
            {
                if(!this._activeChild.disposed)
                {
                    this._activeChild.deactivate();
                }
            }

            this._activeChild = target;

            if(this.getChildIndex(target) !== this.numChildren - 1)
            {
                this.setChildIndex(target, this.numChildren - 1);
            }
        }

        return previous;
    }
}
