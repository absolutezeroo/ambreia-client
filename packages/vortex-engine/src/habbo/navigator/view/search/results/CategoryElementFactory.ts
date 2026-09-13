import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {GuestRoomData} from '@habbo/communication/messages/incoming/navigator/GuestRoomData';
import type {HabboNewNavigator} from '../../../HabboNewNavigator';
import type {BlockResultsView} from './BlockResultsView';
import type {RoomEntryElementFactory} from './RoomEntryElementFactory';
import {NavigatorSearchAction} from '@habbo/communication/messages/incoming/newnavigator/NavigatorSearchResultBlock';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {PerkType} from '../../../../communication/enum/PerkType';

/**
 * Factory for creating category elements in navigator search results.
 *
 * Creates open (expanded), collapsed, and no-results category containers
 * by cloning templates and populating them with room entries.
 *
 * @see sources/win63_version/habbo/navigator/view/search/results/CategoryElementFactory.as
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::CategoryElementFactory
export class CategoryElementFactory
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::MARGIN_LAYOUT_CATEGORY_CONTAINER
    private static readonly MARGIN_LAYOUT_CATEGORY_CONTAINER: number = 13;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::_navigator
    private _navigator: HabboNewNavigator;
    private _roomEntryElementFactory: RoomEntryElementFactory;

    constructor(navigator: HabboNewNavigator, roomEntryElementFactory: RoomEntryElementFactory)
    {
        this._navigator = navigator;
        this._roomEntryElementFactory = roomEntryElementFactory;
    }

    private _blockResultsView: BlockResultsView | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::set blockResultsView()
    set blockResultsView(value: BlockResultsView)
    {
        this._blockResultsView = value;
    }

    private _categoryTemplate: IWindowContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::set categoryTemplate()
    set categoryTemplate(value: IWindowContainer)
    {
        this._categoryTemplate = value;
    }

    private _collapsedCategoryTemplate: IWindowContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::set collapsedCategoryTemplate()
    set collapsedCategoryTemplate(value: IWindowContainer)
    {
        this._collapsedCategoryTemplate = value;
    }

    private _noResultsTemplate: IWindowContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::set noResultsTemplate()
    set noResultsTemplate(value: IWindowContainer)
    {
        this._noResultsTemplate = value;
    }

    /**
	 * Create an open (expanded) category element populated with room entries.
	 *
	 * @param guestRooms - The rooms to display in this category
	 * @param title - The category title text
	 * @param showMoreId - The block index for event callbacks
	 * @param actionAllowed - The action allowed flag (0=none, 1=expand, 2=back)
	 * @param resultMode - Display mode (0=rows, 1=tiles)
	 * @returns A cloned and populated category container
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/CategoryElementFactory.as getOpenCategoryElement()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::getOpenCategoryElement()
    getOpenCategoryElement(
        guestRooms: GuestRoomData[],
        title: string,
        showMoreId: number = -1,
        actionAllowed: number = 0,
        resultMode: number = -1
    ): IWindowContainer
    {
        const safeGuestRooms = Array.isArray(guestRooms) ? guestRooms : [];
        const container = this._categoryTemplate!.clone() as IWindowContainer;

        container.width = this._blockResultsView!.itemListWidth - CategoryElementFactory.MARGIN_LAYOUT_CATEGORY_CONTAINER;
        container.height = 16 + this._roomEntryElementFactory.rowEntryTemplateHeight * (safeGuestRooms.length + 1);

        // Set category name
        const nameEl = container.findChildByName('category_name');

        if(nameEl)
        {
            nameEl.caption = title;
        }

        // Wire back button
        const backEl = container.findChildByName('category_back');

        if(backEl)
        {
            backEl.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryBackClicked(e));
            backEl.visible = actionAllowed === NavigatorSearchAction.GO_BACK;
        }

        // Wire collapse button
        const collapseEl = container.findChildByName('category_collapse');

        if(collapseEl)
        {
            collapseEl.visible = actionAllowed !== NavigatorSearchAction.GO_BACK;
            collapseEl.id = showMoreId;
            collapseEl.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryCollapseClicked(e));
        }

        // Wire category name region (clickable to collapse)
        const nameRegion = container.findChildByName('category_name_region');

        if(nameRegion)
        {
            nameRegion.id = showMoreId;
            nameRegion.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryCollapseClicked(e));
        }

        // Wire show more button
        const showMoreEl = container.findChildByName('category_show_more');

        if(showMoreEl)
        {
            showMoreEl.id = showMoreId;
            showMoreEl.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryShowMoreClicked(e));
            showMoreEl.visible = actionAllowed === NavigatorSearchAction.SHOW_MORE;
        }

        // Wire add quick link button
        const addQuickLink = container.findChildByName('category_add_quick_link');

        if(addQuickLink)
        {
            addQuickLink.id = showMoreId;
            addQuickLink.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryAddQuickLinkClicked(e));

            const searchCode = this._navigator.currentResults?.searchCodeOriginal ?? '';

            addQuickLink.visible = searchCode.indexOf('official_view') === -1;
        }

        // Set background
        const bgEl = container.findChildByName('category_content_background');

        if(bgEl)
        {
            bgEl.background = true;
            bgEl.height = 12 + this._roomEntryElementFactory.rowEntryTemplateHeight * (safeGuestRooms.length + 1);
        }

        // Wire toggle tiles/rows buttons (AS3: only if perk allowed)
        const headerControls = container.findChildByName('category_controls_itemlist') as IItemListWindow | null;

        if(headerControls)
        {
            if(this._navigator.isPerkAllowed(PerkType.NAVIGATOR_ROOM_THUMBNAIL_CAMERA))
            {
                const toggleTiles = headerControls.getListItemByName?.('category_toggle_tiles');
                const toggleRows = headerControls.getListItemByName?.('category_toggle_rows');

                if(toggleTiles)
                {
                    toggleTiles.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryToggleModeClicked(e));
                    toggleTiles.id = showMoreId;
                    toggleTiles.visible = resultMode === 0;
                }

                if(toggleRows)
                {
                    toggleRows.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryToggleModeClicked(e));
                    toggleRows.id = showMoreId;
                    toggleRows.visible = resultMode === 1;
                }
            }
            else
            {
                const toggleTiles = headerControls.getListItemByName?.('category_toggle_tiles');
                const toggleRows = headerControls.getListItemByName?.('category_toggle_rows');

                if(toggleTiles) headerControls.removeListItem(toggleTiles);
                if(toggleRows) headerControls.removeListItem(toggleRows);
            }

            headerControls.arrangeListItems();
        }

        // Populate room list
        const roomList = container.findChildByName('category_content') as IItemListWindow | null;

        if(roomList)
        {
            if(resultMode === 0)
            {
                roomList.spacing = 0;
            }

            const colorMod = 0x8FBFFF;
            let colorModAccumulator = 1;
            let currentTileContainer: IItemListWindow | null = null;

            for(const guestRoom of safeGuestRooms)
            {
                const alternatingColor = colorModAccumulator % 2 === 0 ? -1 : colorMod;

                if(resultMode === 0)
                {
                    roomList.addListItem(this._roomEntryElementFactory.getNewRowElement(guestRoom, alternatingColor));
                    colorModAccumulator++;
                }
                else
                {
                    if(!currentTileContainer)
                    {
                        currentTileContainer = this._roomEntryElementFactory.getNewTileContainerElement();
                        roomList.addListItem(currentTileContainer as unknown as IWindow);
                        currentTileContainer.addEventListener(WindowMouseEvent.WHEEL, (event: WindowEvent) =>
                        {
                            const delta = (event as unknown as { delta?: number }).delta ?? 0;
                            const list = this._blockResultsView?.itemList as unknown as { scrollWithWheel?: (value: number, useHorizontal: boolean) => boolean } | null;

                            list?.scrollWithWheel?.(delta, false);
                        });
                    }

                    currentTileContainer.addListItem(
                        this._roomEntryElementFactory.getNewTileElement(guestRoom, alternatingColor)
                    );

                    if(currentTileContainer.numListItems >= 3)
                    {
                        currentTileContainer = null;
                        colorModAccumulator++;
                    }
                }
            }

            roomList.arrangeListItems();

            if(resultMode !== 0)
            {
                const contentBottom = roomList.y + roomList.height;

                if(bgEl && bgEl.height < contentBottom + 1)
                {
                    bgEl.height = contentBottom + 1;
                }

                if(container.height < contentBottom + 5)
                {
                    container.height = contentBottom + 5;
                }
            }
        }

        return container;
    }

    /**
	 * Create a collapsed category element.
	 *
	 * @param title - The category title text
	 * @param showMoreId - The block index for event callbacks
	 * @param actionAllowed - The action allowed flag
	 * @returns A cloned collapsed category container
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/CategoryElementFactory.as getCollapsedCategoryElement()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::getCollapsedCategoryElement()
    getCollapsedCategoryElement(title: string, showMoreId: number = -1, actionAllowed: number = 0): IWindowContainer
    {
        const container = this._collapsedCategoryTemplate!.clone() as IWindowContainer;

        const nameEl = container.findChildByName('category_name');

        if(nameEl)
        {
            nameEl.caption = title;
        }

        const showMoreEl = container.findChildByName('category_show_more');

        if(showMoreEl)
        {
            showMoreEl.id = showMoreId;
            showMoreEl.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryShowMoreClicked(e));
            showMoreEl.visible = actionAllowed === NavigatorSearchAction.SHOW_MORE;
        }

        const expandEl = container.findChildByName('category_expand');

        if(expandEl)
        {
            expandEl.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryExpandClicked(e));
            expandEl.id = showMoreId;
        }

        const nameRegion = container.findChildByName('category_name_region');

        if(nameRegion)
        {
            nameRegion.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryExpandClicked(e));
            nameRegion.id = showMoreId;
        }

        const addQuickLink = container.findChildByName('category_add_quick_link');

        if(addQuickLink)
        {
            addQuickLink.addEventListener(WindowMouseEvent.CLICK, (e: WindowEvent) => this._blockResultsView?.onCategoryAddQuickLinkClicked(e));
            addQuickLink.id = showMoreId;

            const searchCode = this._navigator.currentResults?.searchCodeOriginal ?? '';

            addQuickLink.visible = searchCode.indexOf('official_view') === -1;
        }

        container.width = this._blockResultsView!.itemListWidth - CategoryElementFactory.MARGIN_LAYOUT_CATEGORY_CONTAINER;

        const controlsList = container.findChildByName('category_controls_itemlist') as IItemListWindow | null;

        if(controlsList)
        {
            controlsList.arrangeListItems();
        }

        return container;
    }

    /**
	 * Create a no-results element.
	 *
	 * @returns A cloned no-results container
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/CategoryElementFactory.as getNoResultsELement()
	 */
    getNoResultsElement(): IWindowContainer
    {
        return this._noResultsTemplate!.clone() as IWindowContainer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/CategoryElementFactory.as::getNoResultsELement()
    getNoResultsELement(): IWindowContainer
    {
        return this.getNoResultsElement();
    }
}
