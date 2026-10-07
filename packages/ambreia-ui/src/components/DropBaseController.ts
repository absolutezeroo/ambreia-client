import type {ITouchAwareWindow} from '../utils/tablet/ITouchAwareWindow';
import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {ILabelWindow} from './ILabelWindow';
import type {IItemListWindow} from './IItemListWindow';
import type {IRegionWindow} from './IRegionWindow';
import type {IDropListItemWindow} from './IDropListItemWindow';
import type {WindowController} from '../WindowController';
import {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {InteractiveController} from './InteractiveController';
import {WindowMouseEvent} from '../events/WindowMouseEvent';

/**
 * Base controller for dropdown windows.
 *
 * Provides open/close behavior, expanded menu popup management,
 * and menu item management shared by DropListController and DropMenuController.
 *
 * In AS3 the expanded menu is a child DropBaseController created at the desktop
 * level via context.create(). Items are wrapped in DropListItemController instances
 * inside an IItemListWindow.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DropBaseController.as
 */
export class DropBaseController extends InteractiveController implements ITouchAwareWindow
{
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::CAPTION_BLEND_CHANGE
    protected static readonly CAPTION_BLEND_CHANGE: number = 0.5;
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::TEXT_FIELD_NAME
    protected static readonly TEXT_FIELD_NAME: string = '_DROPLIST_TITLETEXT';
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::ITEM_LIST_NAME
    protected static readonly ITEM_LIST_NAME: string = '_DROPLIST_ITEMLIST';
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::REGION_NAME
    protected static readonly REGION_NAME: string = '_DROPLIST_REGION';
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::SUB_WINDOW_MAX_DESKTOP_PADDING
    private static readonly SUB_WINDOW_MAX_DESKTOP_PADDING: number = 30;

    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::_itemArray
    protected _itemArray: IWindow[] = [];
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::_menuIsOpen
    protected _menuIsOpen: boolean = false;
    protected _justOpened: boolean = false;
    protected _subMenu: DropBaseController | null = null;
    private _openUpward: boolean = false;
    private _keepOpenOnDeactivate: boolean = false;
    private readonly _menuItemEventHandlerBound: (event: WindowEvent) => void;
    private readonly _subMenuEventProcBound: (event: unknown, window: IWindow) => void;

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

        this._menuItemEventHandlerBound = this._menuItemEventHandler.bind(this);
        this._subMenuEventProcBound = this.subMenuEventProc.bind(this) as (event: unknown, window: IWindow) => void;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/DropBaseController.as::DropBaseController()
    // getRegion() reads a named child built by buildLayoutChildren(), which only runs
    // later via completeConstruction() (see WindowController.ts's phase-split) - at
    // constructor time no children exist yet, so this can't run there anymore.
    protected override finalize(): void
    {
        super.finalize();

        const region = this.getRegion();

        if(region)
        {
            (region as unknown as IWindow).addEventListener(WindowMouseEvent.DOWN, this._menuItemEventHandlerBound);
        }
    }

    protected _selection: number = -1;

    /**
	 * The current selection index.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::get selection()
    public get selection(): number
    {
        return this._selection;
    }

    /**
	 * Sets the current selection, dispatches WE_SELECT/WE_SELECTED events,
	 * and closes the expanded menu.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::set selection()
    public set selection(value: number)
    {
        if(value > this.numMenuItems - 1)
        {
            throw new Error('Menu selection index out of range!');
        }

        const selectEvent = WindowEvent.allocate('WE_SELECT', this, null, true);
        this.update(this as unknown as WindowController, selectEvent);

        if(!selectEvent.isWindowOperationPrevented())
        {
            selectEvent.recycle();
            this._selection = value;
            this.closeExpandedMenuView();

            const selectedEvent = WindowEvent.allocate('WE_SELECTED', this, null);
            this.update(this as unknown as WindowController, selectedEvent);
            selectedEvent.recycle();
        }
        else
        {
            selectEvent.recycle();
        }
    }

    public override get caption(): string
    {
        return super.caption;
    }

    /**
	 * Sets the caption and updates the title label text.
	 */
    public override set caption(value: string)
    {
        super.caption = value;

        const titleLabel = this.getTitleLabel();

        if(titleLabel)
        {
            titleLabel.text = value;
        }
    }

    /**
	 * The number of menu items.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::get numMenuItems()
    public get numMenuItems(): number
    {
        return this._itemArray.length;
    }

    /**
	 * Whether the dropdown menu is currently open.
	 */
    public get opened(): boolean
    {
        return this._menuIsOpen;
    }

    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('open_upward', this._openUpward));
        props.push(this.createProperty('keep_open_on_deactivate', this._keepOpenOnDeactivate));

        return props;
    }

    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'open_upward':
                    this._openUpward = prop.value as boolean;
                    break;
                case 'keep_open_on_deactivate':
                    this._keepOpenOnDeactivate = prop.value as boolean;
                    break;
            }
        }

        super.properties = value;
    }

    /**
	 * Returns the title label child window.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::getTitleLabel()
    public getTitleLabel(): ILabelWindow | null
    {
        return this.getChildByName('_DROPLIST_TITLETEXT') as unknown as ILabelWindow | null;
    }

    /**
	 * Returns the item list child window.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::getItemList()
    public getItemList(): IItemListWindow | null
    {
        return this.getChildByName('_DROPLIST_ITEMLIST') as unknown as IItemListWindow | null;
    }

    /**
	 * Returns the clickable region child window.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::getRegion()
    public getRegion(): IRegionWindow | null
    {
        return this.getChildByName('_DROPLIST_REGION') as unknown as IRegionWindow | null;
    }

    /**
	 * Opens the dropdown (state flag 0).
	 *
	 * Dispatches WE_OPEN before opening and WE_OPENED after.
	 *
	 * @returns True if the open succeeded
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::open()
    public open(): boolean
    {
        if(this.getStateFlag(0))
        {
            return true;
        }

        const openEvent = WindowEvent.allocate('WE_OPEN', this, null);
        this.update(this as unknown as WindowController, openEvent);

        if(openEvent.isDefaultPrevented())
        {
            openEvent.recycle();
            return false;
        }

        openEvent.recycle();
        this.visible = true;

        const openedEvent = WindowEvent.allocate('WE_OPENED', this, null);
        this.update(this as unknown as WindowController, openedEvent);
        openedEvent.recycle();

        return true;
    }

    /**
	 * Closes the dropdown (clears state flag 0).
	 *
	 * Dispatches WE_CLOSE before closing and WE_CLOSED after.
	 *
	 * @returns True if the close succeeded
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::close()
    public close(): boolean
    {
        if(!this.getStateFlag(0))
        {
            return true;
        }

        const closeEvent = WindowEvent.allocate('WE_CLOSE', this, null);
        this.update(this as unknown as WindowController, closeEvent);

        if(closeEvent.isDefaultPrevented())
        {
            closeEvent.recycle();
            return false;
        }

        closeEvent.recycle();
        this.visible = false;

        const closedEvent = WindowEvent.allocate('WE_CLOSED', this, null);
        this.update(this as unknown as WindowController, closedEvent);
        closedEvent.recycle();

        return true;
    }

    /**
	 * Prevents activation while the menu is open.
	 */
    public override activate(): boolean
    {
        if(this._menuIsOpen)
        {
            return true;
        }

        return super.activate();
    }

    /**
	 * Replaces the item array with the given items.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::populate()
    public populate(items: IWindow[]): void
    {
        this._menuIsOpen = true;
        this.closeExpandedMenuView();
        this._selection = -1;

        while(this._itemArray.length > 0)
        {
            const old = this._itemArray.pop()!;

            if(items.indexOf(old) === -1)
            {
                old.dispose();
            }
        }

        for(let i = 0; i < items.length; i++)
        {
            this._itemArray.push(items[i]);
        }
    }

    public override update(source: WindowController, event: WindowEvent): boolean
    {
        switch(event.type)
        {
            case 'WME_DOWN':
                if(this._menuIsOpen)
                {
                    if(this._keepOpenOnDeactivate)
                    {
                        this.closeExpandedMenuView();
                    }
                }
                else
                {
                    this.openExpandedMenuView();
                }
                break;
            case 'WE_ENABLED':
                try
                {
                    const region = this.getChildByName('_DROPLIST_REGION');
                    const titleText = this.getChildByName('_DROPLIST_TITLETEXT');

                    if(region) region.visible = true;
                    if(titleText) titleText.blend = titleText.blend + DropBaseController.CAPTION_BLEND_CHANGE;
                }
                catch (_e)
                {
                    // ignore
                }
                break;
            case 'WE_DISABLED':
                try
                {
                    const regionD = this.getChildByName('_DROPLIST_REGION');
                    const titleTextD = this.getChildByName('_DROPLIST_TITLETEXT');

                    if(regionD) regionD.visible = false;
                    if(titleTextD) titleTextD.blend = titleTextD.blend - DropBaseController.CAPTION_BLEND_CHANGE;
                }
                catch (_e)
                {
                    // ignore
                }
                break;
        }

        return super.update(source, event);
    }

    public override dispose(): void
    {
        if(this._disposed) return;

        const region = this.getRegion();

        if(region)
        {
            (region as unknown as IWindow).removeEventListener(WindowMouseEvent.DOWN, this._menuItemEventHandlerBound);
        }

        if(this._subMenu !== null && !this._subMenu.disposed)
        {
            this._subMenu.destroy();
            this._subMenu = null;
        }

        for(const item of this._itemArray)
        {
            item.dispose();
        }

        this._itemArray = [];

        super.dispose();
    }

    /**
	 * Opens the expanded menu popup.
	 *
	 * Creates the submenu window via context.create(), populates it with
	 * the current items, and dispatches WE_EXPANDED.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::openExpandedMenuView()
    protected openExpandedMenuView(): void
    {
        if(!this._menuIsOpen)
        {
            if(this.open())
            {
                const expandedEvent = WindowEvent.allocate('WE_EXPANDED', this, null);
                this.update(this as unknown as WindowController, expandedEvent);
                expandedEvent.recycle();

                if(this.numMenuItems > 0)
                {
                    this._menuIsOpen = true;
                    this._justOpened = true;
                    this.populateExpandedMenu(this._itemArray, this.getExpandedMenuView(), this._subMenuEventProcBound);
                }
            }
        }
    }

    /**
	 * Closes the expanded menu popup.
	 *
	 * Destroys the submenu, restores the selected item into the collapsed
	 * view, and dispatches WE_COLLAPSE.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::closeExpandedMenuView()
    protected closeExpandedMenuView(): void
    {
        if(this.close())
        {
            if(this._subMenu !== null)
            {
                const itemList = this._subMenu.getItemList();

                if(itemList)
                {
                    itemList.autoArrangeItems = false;

                    for(let i = 0; i < itemList.numListItems; i++)
                    {
                        const listItem = itemList.getListItemAt(i);
                        const dropItem = listItem as unknown as IDropListItemWindow | null;

                        if(dropItem && 'value' in dropItem)
                        {
                            const value = dropItem.value;

                            if(value && this._itemArray.indexOf(value) > -1)
                            {
                                dropItem.value = null;
                                value.setParamFlag(3, false);
                            }
                        }
                    }
                }

                this._subMenu.destroy();
                this._subMenu = null;
            }

            if(this._menuIsOpen)
            {
                const collapseEvent = WindowEvent.allocate('WE_COLLAPSE', this, null);
                this.update(this as unknown as WindowController, collapseEvent);
                collapseEvent.recycle();
            }

            this._menuIsOpen = false;

            if(!this.disposed)
            {
                const titleLabel = this.getTitleLabel();
                const itemList = this.getItemList();

                if(itemList)
                {
                    while(itemList.numListItems > 0)
                    {
                        itemList.removeListItemAt(0);
                    }

                    if(this._selection < this.numMenuItems && this._selection > -1)
                    {
                        const selectedItem = this._itemArray[this._selection];
                        selectedItem.x = 0;
                        selectedItem.y = 0;
                        itemList.addListItem(selectedItem);
                        (itemList as unknown as IWindow).height = selectedItem.height;

                        if(titleLabel)
                        {
                            (titleLabel as unknown as IWindow).visible = false;
                        }
                    }
                    else
                    {
                        if(titleLabel)
                        {
                            (titleLabel as unknown as IWindow).visible = true;
                        }
                    }
                }
            }
        }
    }

    /**
	 * Populates the expanded menu with item windows.
	 *
	 * Wraps each item in a DropListItemController, adds it to the submenu's
	 * item list, and adjusts sizing.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::populateExpandedMenu()
    protected populateExpandedMenu(items: IWindow[], subMenu: DropBaseController, procedure: ((event: unknown, window: IWindow) => void) | null): void
    {
        const itemList = subMenu.getItemList();

        if(!itemList) return;

        itemList.autoArrangeItems = false;

        const region = subMenu.getRegion();

        if(region)
        {
            (region as unknown as IWindow).visible = false;
        }

        const numItems = items.length;
        const listWidth = (itemList as unknown as IWindow).width;
        let maxWidth = listWidth;
        let totalHeight = 0;

        for(let i = 0; i < numItems; i++)
        {
            const item = items[i];

            const menuItem = this._context.create(
                this._name + '::menuItem[' + i + ']',
                '',
                106,
                this._style,
                0x10 | 0x01,
                null,
                procedure,
                null,
                i,
                ['_EXCLUDE'],
                ''
            ) as unknown as IDropListItemWindow;

            item.x = 0;
            item.y = 0;
            item.setParamFlag(3, true);

            if(menuItem)
            {
                menuItem.value = item;

                const menuItemWin = menuItem as unknown as IWindow;
                menuItemWin.width = item.width;
                menuItemWin.height = item.height;
                menuItemWin.limits.minWidth = listWidth;

                maxWidth = Math.max(maxWidth, menuItemWin.width);
                totalHeight += menuItemWin.height;

                itemList.addListItem(menuItemWin);
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
                    listItem.limits.minWidth = maxWidth;
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

        if(this._param & 0x20)
        {
            this.fitToParent(subMenuWin);
        }
        else
        {
            this.fitToDesktop(subMenuWin);
        }

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
	 * Fits the submenu within the parent's bounds.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::fitToParent()
    protected fitToParent(subMenu: IWindow): void
    {
        const subRect = {x: 0, y: 0, width: 0, height: 0};
        subMenu.getGlobalRectangle(subRect);

        const parentRect = {x: 0, y: 0, width: 0, height: 0};

        if(this.parent)
        {
            this.parent.getGlobalRectangle(parentRect);
        }

        if(subRect.height > parentRect.height)
        {
            subMenu.offset(0, parentRect.y - subRect.y);
            subMenu.scale(0, parentRect.height - subRect.height);
            subMenu.getGlobalRectangle(subRect);
        }

        if(subRect.y + subRect.height > parentRect.y + parentRect.height)
        {
            subMenu.offset(0, (parentRect.y + parentRect.height) - (subRect.y + subRect.height));
        }
        else if(subRect.y < parentRect.y)
        {
            subMenu.offset(0, subRect.y - parentRect.y);
        }

        if(subRect.x < parentRect.x)
        {
            subMenu.offset(subRect.x - parentRect.x, 0);
        }
        else if(subRect.x + subRect.width > parentRect.x + parentRect.width)
        {
            subMenu.offset((parentRect.x + parentRect.width) - (subRect.x + subRect.width), 0);
        }
    }

    /**
	 * Fits the submenu within the desktop bounds.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::fitToDesktop()
    protected fitToDesktop(subMenu: IWindow): void
    {
        const subRect = {x: 0, y: 0, width: 0, height: 0};
        subMenu.getGlobalRectangle(subRect);

        const desktopWin = this.desktop;

        if(!desktopWin) return;

        if(subRect.y + subRect.height > desktopWin.bottom)
        {
            subMenu.offset(0, desktopWin.bottom - (subRect.y + subRect.height));
        }
        else if(subRect.y < desktopWin.top)
        {
            subMenu.offset(0, subRect.y - desktopWin.top);
        }

        if(subRect.x < desktopWin.left)
        {
            subMenu.offset(subRect.x - desktopWin.left, 0);
        }
        else if(subRect.x + subRect.width > desktopWin.right)
        {
            subMenu.offset(desktopWin.right - (subRect.x + subRect.width), 0);
        }

        if(subRect.height > desktopWin.height - DropBaseController.SUB_WINDOW_MAX_DESKTOP_PADDING)
        {
            subMenu.height = desktopWin.height - DropBaseController.SUB_WINDOW_MAX_DESKTOP_PADDING;
            subMenu.y = DropBaseController.SUB_WINDOW_MAX_DESKTOP_PADDING;
        }
    }

    /**
	 * Maps a window to its item array index.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::resolveSelection()
    protected resolveSelection(window: IWindow): number
    {
        let index = this._itemArray.indexOf(window);

        if(index === -1)
        {
            if('value' in window)
            {
                const dropItem = window as unknown as IDropListItemWindow;
                index = this._itemArray.indexOf(dropItem.value!);
            }
        }

        if(index === -1)
        {
            return this._selection;
        }

        return index;
    }

    /**
	 * Gets or creates the expanded submenu window.
	 */
    // AS3: .../src/com/sulake/core/window/components/DropBaseController.as::getExpandedMenuView()
    private getExpandedMenuView(): DropBaseController
    {
        const rect = {x: 0, y: 0, width: 0, height: 0};
        this.getGlobalRectangle(rect);

        if(this._subMenu === null || this._subMenu.disposed)
        {
            const paramFlags = 0x20000 | (this._openUpward ? 0x100000 : 0);

            this._subMenu = this._context.create(
                this._name + '::subMenu',
                '',
                this._type,
                this._style,
                paramFlags,
                rect,
                this._subMenuEventProcBound,
                null,
                0,
                ['_EXCLUDE'],
                ''
            ) as unknown as DropBaseController;
        }
        else
        {
            this._subMenu.setGlobalRectangle(rect);
        }

        this._subMenu.activate();
        return this._subMenu;
    }

    /**
	 * Handles click events on the dropdown region.
	 */
    private _menuItemEventHandler(event: WindowEvent): void
    {
        if(this.getStateFlag(32))
        {
            return;
        }

        if(event.type === 'WME_DOWN')
        {
            if(!this._menuIsOpen)
            {
                this.openExpandedMenuView();
            }
        }
    }

    /**
	 * Handles events from the expanded submenu items.
	 */
    protected subMenuEventProc(event: WindowEvent, window: IWindow): void
    {
        switch(event.type)
        {
            case 'WME_UP':
                if('value' in window)
                {
                    if(!this._justOpened)
                    {
                        this.selection = this.resolveSelection(window);
                    }

                    this._justOpened = false;
                }
                break;
            case 'WME_DOWN':
                this.selection = this.resolveSelection(window);
                break;
            case 'WE_DEACTIVATED':
                if(window === (this._subMenu as unknown as IWindow))
                {
                    if(!(this._keepOpenOnDeactivate && this._menuIsOpen))
                    {
                        this.closeExpandedMenuView();
                    }
                }
                break;
        }
    }
}
