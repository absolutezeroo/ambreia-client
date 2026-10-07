import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IDropMenuWindow} from './IDropMenuWindow';
import {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {DropBaseController} from './DropBaseController';

/**
 * Controller for drop menu windows.
 *
 * Manages a string-based dropdown menu where items are represented
 * as strings rather than IWindow instances. Creates DropMenuItemController
 * (type 103) children when expanded.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DropMenuController.as
 */
export class DropMenuController extends DropBaseController implements IDropMenuWindow
{
    // AS3: .../src/com/sulake/core/window/components/DropMenuController.as::DROP_MENU_ITEM_MAX_LENGTH
    private static readonly DROP_MENU_ITEM_MAX_LENGTH: number = 200;

    // AS3: .../src/com/sulake/core/window/components/DropMenuController.as::_stringArray
    private _stringArray: string[] = [];

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

    public override get numMenuItems(): number
    {
        return this._stringArray.length;
    }

    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('item_array', this._stringArray));

        return props;
    }

    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'item_array':
                    this.populate(prop.value as unknown[]);
                    break;
            }
        }

        super.properties = value;
    }

    /**
	 * Populates the menu with an array of items.
	 *
	 * Resets selection, copies items as strings, then closes the
	 * expanded view (which will use the updated string array).
	 */
    // AS3: .../src/com/sulake/core/window/components/DropMenuController.as::populate()
    public populate(items: unknown[]): void
    {
        this._selection = -1;
        this._stringArray.length = 0;

        for(let i = 0; i < items.length; i++)
        {
            this._stringArray.push(String(items[i]));
        }

        this._menuIsOpen = true;
        this.closeExpandedMenuView();
    }

    /**
	 * Populates the menu with a string array.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropMenuController.as::populateWithVector()
    public populateWithVector(items: string[]): void
    {
        this._selection = -1;
        this._stringArray.length = 0;

        for(let i = 0; i < items.length; i++)
        {
            this._stringArray.push(items[i]);
        }

        this._menuIsOpen = true;
        this.closeExpandedMenuView();
    }

    /**
	 * Returns a copy of all menu item strings.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropMenuController.as::enumerateSelection()
    public enumerateSelection(): string[]
    {
        const result: string[] = [];

        if(!this._disposed)
        {
            for(let i = 0; i < this._stringArray.length; i++)
            {
                result.push(this._stringArray[i]);
            }
        }

        return result;
    }

    /**
	 * Opens the expanded menu programmatically.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropMenuController.as::openMenu()
    public openMenu(): void
    {
        this.openExpandedMenuView();
    }

    public override dispose(): void
    {
        if(this._disposed) return;

        this._stringArray = [];

        super.dispose();
    }

    /**
	 * Populates the expanded submenu with DropMenuItemController items
	 * created from the string array. Truncates long strings.
	 */
    protected override populateExpandedMenu(items: IWindow[], subMenu: DropBaseController, procedure: ((event: unknown, window: IWindow) => void) | null): void
    {
        if(!subMenu) return;

        const itemList = subMenu.getItemList();

        if(!itemList) return;

        itemList.autoArrangeItems = false;

        const region = subMenu.getRegion();

        if(region)
        {
            (region as unknown as IWindow).visible = false;
        }

        const numItems = this._stringArray.length;
        const listWidth = (itemList as unknown as IWindow).width;
        let maxWidth = listWidth;
        let totalHeight = 0;

        for(let i = 0; i < numItems; i++)
        {
            let text = this._stringArray[i];

            if(text.length > DropMenuController.DROP_MENU_ITEM_MAX_LENGTH)
            {
                text = text.substring(0, DropMenuController.DROP_MENU_ITEM_MAX_LENGTH) + '...';
            }

            const menuItem = this._context.create(
                this._name + '::menuItem[' + i + ']',
                text,
                103,
                this._style,
                0x10 | 0x01,
                null,
                procedure,
                null,
                i,
                ['_EXCLUDE'],
                ''
            );

            if(menuItem)
            {
                this._itemArray.push(menuItem);
                maxWidth = Math.max(maxWidth, menuItem.width);
                totalHeight += menuItem.height;
                menuItem.width = listWidth;
                itemList.addListItem(menuItem);
            }
        }

        if(maxWidth > listWidth)
        {
            (subMenu as unknown as IWindow).width += maxWidth - listWidth;

            for(let i = 0; i < numItems; i++)
            {
                const listItem = itemList.getListItemAt(i);

                if(listItem)
                {
                    listItem.width = maxWidth;
                }
            }
        }

        const padding = this._context.create(
            this._name + '::padding',
            '',
            4,
            this._style,
            0x10,
            {x: 0, y: 0, width: 1, height: 3},
            null,
            null,
            0,
            ['_EXCLUDE'],
            ''
        );

        if(padding)
        {
            itemList.addListItem(padding);
            totalHeight += padding.height;
        }

        itemList.autoArrangeItems = true;

        totalHeight += itemList.spacing * itemList.numListItems;

        const subMenuWin = subMenu as unknown as IWindow;
        subMenuWin.height = Math.max(subMenuWin.height, totalHeight + 4);

        this.fitToDesktop(subMenuWin);
        subMenu.activate();

        (itemList as unknown as IWindow).height = Math.max(
            (itemList as unknown as IWindow).height,
            subMenuWin.height - 4
        );

        if(this._selection > -1 && numItems > 0)
        {
            const selectedListItem = itemList.getListItemAt(this._selection);

            if(selectedListItem)
            {
                selectedListItem.setStateFlag(8, true);
            }
        }
    }

    /**
	 * Closes the expanded menu, disposes created items, and restores
	 * the title label text from the string array.
	 */
    protected override closeExpandedMenuView(): void
    {
        if(this.close())
        {
            if(this._subMenu !== null)
            {
                this._subMenu.destroy();
                this._subMenu = null;
            }

            if(this._menuIsOpen)
            {
                const collapseEvent = WindowEvent.allocate('WE_COLLAPSE', this, null);
                this.update(this as unknown as DropBaseController, collapseEvent);
                collapseEvent.recycle();
            }

            this._menuIsOpen = false;

            while(this._itemArray.length > 0)
            {
                this._itemArray.pop()!.dispose();
            }

            if(!this.disposed)
            {
                const titleLabel = this.getTitleLabel();

                if(titleLabel)
                {
                    (titleLabel as unknown as IWindow).visible = true;
                    titleLabel.text = (this._selection < this._stringArray.length && this._selection > -1)
                        ? this._stringArray[this._selection]
                        : this.caption;
                }
            }
        }
    }
}
