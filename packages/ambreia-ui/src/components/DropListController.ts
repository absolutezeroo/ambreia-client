import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IIterator} from '../utils/IIterator';
import type {IDropListWindow} from './IDropListWindow';
import type {WindowEvent} from '../events/WindowEvent';
import {DropBaseController} from './DropBaseController';
import {DropListIterator} from '../iterators/DropListIterator';

/**
 * Controller for drop list windows.
 *
 * Extends DropBaseController with IDropListWindow compliance: menu
 * item management (add, remove, get) with IWindow values.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DropListController.as
 */
export class DropListController extends DropBaseController implements IDropListWindow
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
	 * Returns an iterator over the menu items.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DropListController.as::iterator()
    public iterator(): IIterator
    {
        return new DropListIterator(this);
    }

    /**
	 * Adds a menu item at the end of the list.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropListController.as::addMenuItem()
    public addMenuItem(item: IWindow): IWindow | null
    {
        return this.addMenuItemAt(item, this._itemArray.length);
    }

    /**
	 * Adds a menu item at the specified index.
	 *
	 * In AS3, special named children (_DROPLIST_TITLETEXT, _DROPLIST_ITEMLIST,
	 * _DROPLIST_REGION) are redirected to addChild() instead of the item array.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropListController.as::addMenuItemAt()
    public addMenuItemAt(item: IWindow, _index: number): IWindow | null
    {
        if(item && this._itemArray.indexOf(item) === -1)
        {
            if(!this.getTitleLabel())
            {
                if('text' in item && item.name === '_DROPLIST_TITLETEXT')
                {
                    return this.addChild(item);
                }
            }

            if(!this.getItemList())
            {
                if('addListItem' in item && item.name === '_DROPLIST_ITEMLIST')
                {
                    return this.addChild(item);
                }
            }

            if(!this.getRegion())
            {
                if(item.name === '_DROPLIST_REGION')
                {
                    return this.addChild(item);
                }
            }

            if(this._menuIsOpen)
            {
                this.closeExpandedMenuView();
                this._itemArray.push(item);
                this.openExpandedMenuView();
            }
            else
            {
                this._itemArray.push(item);
            }

            return item;
        }

        return null;
    }

    /**
	 * Returns the menu item at the specified index.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropListController.as::getMenuItemAt()
    public getMenuItemAt(index: number): IWindow | null
    {
        if(this._itemArray && index > -1 && index < this._itemArray.length)
        {
            return this._itemArray[index];
        }

        return null;
    }

    /**
	 * Removes a menu item.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropListController.as::removeMenuItem()
    public removeMenuItem(item: IWindow): IWindow | null
    {
        const index = this._itemArray.indexOf(item);

        if(index > -1)
        {
            if(index === this._selection)
            {
                this._selection = -1;
            }

            this._itemArray.splice(index, 1);

            if(this._menuIsOpen)
            {
                this.closeExpandedMenuView();
                this.openExpandedMenuView();
            }

            return item;
        }

        return null;
    }

    /**
	 * Removes the menu item at the specified index.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropListController.as::removeMenuItemAt()
    public removeMenuItemAt(index: number): IWindow | null
    {
        const item = this._itemArray[index];

        return item ? this.removeMenuItem(item) : null;
    }

    /**
	 * Returns the index of a menu item.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropListController.as::getMenuItemIndex()
    public getMenuItemIndex(item: IWindow): number
    {
        return this._itemArray.indexOf(item);
    }
}
