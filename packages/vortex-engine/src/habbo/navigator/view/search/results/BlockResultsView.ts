import type {IWindow} from '@core/window/IWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {HabboNewNavigator} from '../../../HabboNewNavigator';
import type {
    NavigatorSearchResultSet
} from '@habbo/communication/messages/incoming/newnavigator/NavigatorSearchResultSet';
import {ResultsModeEnum} from '../../ResultsModeEnum';
import type {CategoryElementFactory} from './CategoryElementFactory';
import {PerkType} from '../../../../communication/enum/PerkType';

/**
 * Manages the block results list in the navigator.
 *
 * Renders categories (expanded/collapsed) for each result block
 * and handles collapse/expand/toggle/show-more interactions.
 *
 * @see sources/win63_version/habbo/navigator/view/search/results/BlockResultsView.as
 */
export class BlockResultsView
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::_navigator
    private _navigator: HabboNewNavigator;
    /** Maps block index → search code */
    private _blockSearchCodes: Map<number, string> = new Map();
    /** Maps block index → the rendered IWindow */
    private _blockWindows: Map<number, IWindow> = new Map();
    /** Maps block index → view mode */
    private _blockViewModes: Map<number, number> = new Map();

    constructor(navigator: HabboNewNavigator)
    {
        this._navigator = navigator;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::_itemList
    private _itemList: IItemListWindow | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::get itemList()
    get itemList(): IItemListWindow | null
    {
        return this._itemList;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::set itemList()
    set itemList(value: IItemListWindow)
    {
        this._itemList = value;
    }

    private _categoryElementFactory: CategoryElementFactory | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::set categoryElementFactory()
    set categoryElementFactory(value: CategoryElementFactory)
    {
        this._categoryElementFactory = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::get itemListWidth()
    get itemListWidth(): number
    {
        if(!this._itemList) return 0;

        return this._itemList.width;
    }

    /**
	 * Display the current search results by clearing and repopulating the list.
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/BlockResultsView.as displayCurrentResults()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::displayCurrentResults()
    displayCurrentResults(): void
    {
        if(!this._navigator.currentResults || !this._itemList || !this._categoryElementFactory)
        {
            return;
        }

        this._blockSearchCodes.clear();
        this._blockWindows.clear();
        this._blockViewModes.clear();

        this._itemList.destroyListItems();

        const resultSet = this._navigator.currentResults;
        const blocks = Array.isArray(resultSet.blocks) ? resultSet.blocks : [];

        if(blocks.length === 0)
        {
            this._itemList.addListItem(this._categoryElementFactory.getNoResultsELement());
        }
        else
        {
            for(let i = 0; i < blocks.length; i++)
            {
                const block = blocks[i];
                const isExpanded = (!this.isMinimized(block.searchCode) || this.isSingleBlock(resultSet)) && !block.forceClosed;

                const element = this.renderCurrentResultsBlock(i, isExpanded);

                element.id = i;
                this._itemList.addListItem(element);

                this._blockWindows.set(i, element);
                this._blockSearchCodes.set(i, block.searchCode);
                this._blockViewModes.set(i, block.viewMode);
            }
        }

        this._itemList.arrangeItems();
    }

    /**
	 * Handle "show more" click — expand a category by performing a search.
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/BlockResultsView.as onCategoryShowMoreClicked()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::onCategoryShowMoreClicked()
    onCategoryShowMoreClicked(event: WindowEvent): void
    {
        if(!event.window) return;

        const searchCode = this._blockSearchCodes.get(event.window.id);

        if(searchCode)
        {
            this._navigator.performSearch(searchCode, this._navigator.currentResults?.filteringData ?? '');
            this._navigator.trackEventLog('browse.expandsearch', 'Results', this.getEventLogExtra(searchCode));
        }
    }

    /**
	 * Handle "back" click — go back in search history.
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/BlockResultsView.as onCategoryBackClicked()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::onCategoryBackClicked()
    onCategoryBackClicked(_event: WindowEvent): void
    {
        this._navigator.goBack();
    }

    /**
	 * Handle collapse click — collapse a category and persist state.
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/BlockResultsView.as onCategoryCollapseClicked()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::onCategoryCollapseClicked()
    onCategoryCollapseClicked(event: WindowEvent): void
    {
        if(!event.window) return;

        const searchCode = this._blockSearchCodes.get(event.window.id);

        if(searchCode)
        {
            this._navigator.addCollapsedCategory(searchCode);
            this.replaceBlock(event.window.id, false);
            this._navigator.trackEventLog('browse.collapsecategory', 'Results', this.getEventLogExtra(searchCode));
        }
    }

    /**
	 * Handle expand click — expand a collapsed category and persist state.
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/BlockResultsView.as onCategoryExpandClicked()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::onCategoryExpandClicked()
    onCategoryExpandClicked(event: WindowEvent): void
    {
        if(!event.window) return;

        const searchCode = this._blockSearchCodes.get(event.window.id);

        if(searchCode)
        {
            this._navigator.removeCollapsedCategory(searchCode);
            this.replaceBlock(event.window.id, true);
            this._navigator.trackEventLog('browse.uncollapsecategory', 'Results', this.getEventLogExtra(searchCode));
        }
    }

    /**
	 * Handle "add quick link" click — save search as a quick link.
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/BlockResultsView.as onCategoryAddQuickLinkClicked()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::onCategoryAddQuickLinkClicked()
    onCategoryAddQuickLinkClicked(event: WindowEvent): void
    {
        if(!event.window) return;

        const searchCode = this._blockSearchCodes.get(event.window.id);

        if(searchCode)
        {
            this._navigator.addSavedSearch(searchCode, this._navigator.currentResults?.filteringData ?? '');
        }
    }

    /**
	 * Handle toggle mode click — switch between rows and tiles view.
	 *
	 * @see sources/win63_version/habbo/navigator/view/search/results/BlockResultsView.as onCategoryToggleModeClicked()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::onCategoryToggleModeClicked()
    onCategoryToggleModeClicked(event: WindowEvent): void
    {
        if(!event.window) return;

        const blockId = event.window.id;
        const currentMode = this._blockViewModes.get(blockId) ?? ResultsModeEnum.ROWS;
        const newMode = currentMode === ResultsModeEnum.ROWS ? ResultsModeEnum.TILES : ResultsModeEnum.ROWS;

        const searchCode = this._blockSearchCodes.get(blockId);

        if(searchCode)
        {
            this._navigator.toggleSearchCodeViewMode(searchCode, newMode);
        }

        const currentResults = this._navigator.currentResults;

        if(currentResults && currentResults.blocks[blockId])
        {
            currentResults.blocks[blockId].viewMode = newMode;
        }

        this.replaceBlock(blockId, true);
        this._blockViewModes.set(blockId, newMode);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::isMinimized()
    private isMinimized(searchCode: string): boolean
    {
        return this._navigator.isCategoryCollapsed(searchCode);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::isSingleBlock()
    private isSingleBlock(resultSet: NavigatorSearchResultSet): boolean
    {
        return resultSet.blocks.length === 1;
    }

    /**
	 * Render a single block as either expanded or collapsed.
	 *
	 * @param blockIndex - The index of the block in the result set
	 * @param isExpanded - Whether to render in expanded state
	 * @returns The rendered IWindow element
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::renderCurrentResultsBlock()
    private renderCurrentResultsBlock(blockIndex: number, isExpanded: boolean): IWindow
    {
        const resultSet = this._navigator.currentResults;
        const blocks = resultSet ? resultSet.blocks : null;

        if(!resultSet || !blocks || !blocks[blockIndex])
        {
            return this._categoryElementFactory!.getNoResultsELement();
        }

        const block = blocks[blockIndex];
        const title = block.text === '' ? '${navigator.searchcode.title.' + block.searchCode + '}' : block.text;

        if(isExpanded)
        {
            const viewMode = !this._navigator.isPerkAllowed(PerkType.NAVIGATOR_ROOM_THUMBNAIL_CAMERA)
				&& this._navigator.currentResults?.searchCodeOriginal !== 'official_view'
                ? 0
                : block.viewMode;

            return this._categoryElementFactory!.getOpenCategoryElement(
                block.guestRooms,
                title,
                blockIndex,
                block.actionAllowed,
                viewMode
            );
        }

        return this._categoryElementFactory!.getCollapsedCategoryElement(
            title,
            blockIndex,
            block.actionAllowed
        );
    }

    /**
	 * Replace a block at its current position in the list.
	 *
	 * @param blockId - The block index
	 * @param expanded - Whether to render expanded or collapsed
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/view/search/results/BlockResultsView.as::replaceBlock()
    private replaceBlock(blockId: number, expanded: boolean): void
    {
        if(!this._itemList) return;

        const currentWindow = this._blockWindows.get(blockId);

        if(!currentWindow) return;

        const listIndex = this._itemList.getListItemIndex(currentWindow);

        this._itemList.removeListItemAt(listIndex);

        const newElement = this.renderCurrentResultsBlock(blockId, expanded);

        newElement.id = blockId;
        this._itemList.addListItemAt(newElement, listIndex);

        this._blockWindows.set(blockId, newElement);
    }

    private getEventLogExtra(searchCode: string): string
    {
        const filtering = this._navigator.currentResults?.filteringData ?? '';

        return searchCode + (filtering === '' ? '' : ':' + filtering);
    }
}
