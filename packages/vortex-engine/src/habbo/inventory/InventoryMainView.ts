import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IFrameWindow} from '@core/window/components/IFrameWindow';
import type {ITabButtonWindow} from '@core/window/components/ITabButtonWindow';
import type {ITabContextWindow} from '@core/window/components/ITabContextWindow';
import type {ILabelWindow} from '@core/window/components/ILabelWindow';
import type {IMargins} from '@core/window/utils/IMargins';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {HabboToolbarEvent as HabboToolbarEventClass} from '@habbo/toolbar/events/HabboToolbarEvent';
import type {HabboInventory} from './HabboInventory';
import {WindowToggle} from '@habbo/utils/WindowToggle';
import {Util} from './Util';

/**
 * Inventory main window — the frame, tabs, and category-switching shell that
 * every inventory category (furni, pets, bots, badges, effects, trading)
 * plugs its own window container into.
 *
 * @see sources/win63_version/habbo/inventory/InventoryMainView.as
 */
export class InventoryMainView 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::COUNTER_MARGIN
    private static readonly COUNTER_MARGIN = 3;

    private static readonly DEFAULT_VIEW_LOCATION = {x: 120, y: 150};

    private static readonly LAYOUT_NAME = 'inventory_xml';

    private _habboInventory: HabboInventory;
    private _window: IFrameWindow | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;

    private _currentCategory: string | null = null;
    private _currentSubCategory: string | null = null;
    private _currentCategoryContainer: IWindowContainer | null = null;
    private _currentSubCategoryContainer: IWindowContainer | null = null;

    private _extractedWindows: Map<string, IWindowContainer> = new Map();

    private _furniCounter: IWindowContainer | null = null;
    private _rentablesCounter: IWindowContainer | null = null;
    private _petsCounter: IWindowContainer | null = null;
    private _badgesCounter: IWindowContainer | null = null;
    private _botsCounter: IWindowContainer | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::InventoryMainView()
    // AS3 takes (habboInventory, windowManager, assets) explicitly; this port
    // follows the established View convention (see NavigatorView.ts) of only
    // taking the owning controller and deriving dependencies from it.
    constructor(habboInventory: HabboInventory) 
    {
        this._habboInventory = habboInventory;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::get isVisible()
    get isVisible(): boolean 
    {
        return this._window ? this._window.visible : false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::get isActive()
    get isActive(): boolean 
    {
        return this._window ? this._window.getStateFlag(1) : false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::get emptyContainer()
    get emptyContainer(): IWindowContainer | null 
    {
        if(!this._window) return null;

        return this._window.findChildByName('empty_container') as IWindowContainer | null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::get loadingContainer()
    get loadingContainer(): IWindowContainer | null 
    {
        if(!this._window) return null;

        return this._window.findChildByName('loading_container') as IWindowContainer | null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::get mainContainer()
    get mainContainer(): IWindowContainer | null 
    {
        if(!this._window) return null;

        return this._window.findChildByName('contentArea') as IWindowContainer | null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::dispose()
    dispose(): void 
    {
        this._furniCounter = null;
        this._rentablesCounter = null;
        this._botsCounter = null;
        this._petsCounter = null;
        this._badgesCounter = null;
        this._currentCategoryContainer = null;
        this._currentSubCategoryContainer = null;

        if(this._window) 
        {
            this._window.dispose();
            this._window = null;
        }

        if(this._toolbar) 
        {
            this._toolbar.toolbarEvents.off(HabboToolbarEventClass.TOOLBAR_CLICK, this.onHabboToolbarEvent);
            this._toolbar = null;
        }

        this._extractedWindows.clear();
    }

    // DEVIATION: AS3 also leaves the collectibles tab enabled; the RPG fork removed it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::disableNonTradingTabs()
    disableNonTradingTabs(disabled: boolean): void 
    {
        if(!this._window) return;

        const tabs = this._window.findChildByName('tabs') as ITabContextWindow | null;

        if(tabs === null) return;

        for(let i = 0; i < tabs.numTabItems; i++) 
        {
            const tab = tabs.getTabItemAt(i);

            if(tab !== null && tab.name !== 'furni') 
            {
                Util.disableSection(tab, disabled);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::getCategoryViewId()
    getCategoryViewId(): string | null 
    {
        return this._currentCategory;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::getSubCategoryViewId()
    getSubCategoryViewId(): string | null 
    {
        return this._currentSubCategory;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::hideInventory()
    hideInventory(): void 
    {
        this._habboInventory.closingInventoryView();

        const window = this.getWindow();

        if(window === null) return;

        window.visible = false;
    }

    /**
     * Brings the inventory window to the front. Distinct from `showInventory()`, which makes it
     * visible — a wired trade opening while the window is already up needs the focus, not the flag.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::activate()
    activate(): void
    {
        this.getWindow()?.activate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::showInventory()
    showInventory(): void
    {
        const window = this.getWindow();

        if(window === null) return;

        window.visible = true;
        this._habboInventory.inventoryViewOpened(
            this._currentSubCategory && this._currentSubCategory.length > 0 ? this._currentSubCategory : this._currentCategory!
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::toggleCategoryView()
    toggleCategoryView(category: string, allowHide: boolean = true, forceSwitch: boolean = false): boolean 
    {
        const window = this.getWindow();

        if(window === null) return false;

        if(window.visible) 
        {
            if(this._currentCategory === category) 
            {
                if(allowHide) 
                {
                    if(!WindowToggle.isHiddenByOtherWindows(window)) 
                    {
                        this.hideInventory();

                        return false;
                    }

                    window.activate();
                }
            }
            else 
            {
                this.setViewToCategory(category);
            }
        }
        else 
        {
            if(forceSwitch && this._currentCategory !== null && this._currentCategory !== category) 
            {
                this.setViewToCategory(category);
            }

            window.visible = true;
            window.activate();

            if(category !== this._currentCategory || !this._habboInventory.isInventoryCategoryInit(category)) 
            {
                this.setViewToCategory(category);
            }

            this._habboInventory.inventoryViewOpened(category);
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::toggleSubCategoryView()
    toggleSubCategoryView(category: string, allowHide: boolean = true): void 
    {
        const window = this.getWindow();

        if(window === null) return;

        if(window.visible) 
        {
            if(this._currentSubCategory === category) 
            {
                if(allowHide) 
                {
                    window.visible = false;
                }
            }
            else 
            {
                this.setSubViewToCategory(category);
            }
        }
        else 
        {
            window.visible = true;

            if(category !== this._currentSubCategory) 
            {
                this.setSubViewToCategory(category);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::updateSubCategoryView()
    updateSubCategoryView(): void 
    {
        if(this._currentSubCategory === null) return;

        this.setSubViewToCategory(this._currentSubCategory);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::setToolbar()
    setToolbar(toolbar: IHabboToolbar): void 
    {
        this._toolbar = toolbar;
        this._toolbar.toolbarEvents.on(HabboToolbarEventClass.TOOLBAR_CLICK, this.onHabboToolbarEvent);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::windowEventProc()
    windowEventProc = (event: WindowEvent, window: IWindow): void => 
    {
        if(event.type === 'WE_SELECTED') 
        {
            const tabs = window as unknown as ITabContextWindow;
            const selected = tabs.selector?.getSelected();

            if(selected !== null && selected !== undefined && this._currentCategory !== null) 
            {
                this.resetUnseenCounters(this._currentCategory);
                this._habboInventory.toggleInventoryPage(selected.name);
            }
        }
        else if(event.type === 'WME_CLICK') 
        {
            if(window.name === 'header_button_close') 
            {
                this.hideInventory();
            }

            if(window.name === 'open_catalog_btn') 
            {
                this._habboInventory.catalog?.openCatalog();
            }
        }
        else if(event.type === 'WME_DOUBLE_CLICK') 
        {
            if(window.name === 'titlebar' && this._window) 
            {
                this._window.height = this._window.limits.minHeight;
            }
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::updateUnseenFurniCount()
    updateUnseenFurniCount(count: number): void 
    {
        if(!this._window) return;

        if(!this._furniCounter) 
        {
            this._furniCounter = this.createCounter('furni');
        }

        if(this._furniCounter) this.updateCounter(this._furniCounter, count, 'furni');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::updateUnseenRentedFurniCount()
    updateUnseenRentedFurniCount(count: number): void 
    {
        if(!this._window) return;

        if(!this._rentablesCounter) 
        {
            this._rentablesCounter = this.createCounter('rentables');
        }

        if(this._rentablesCounter) this.updateCounter(this._rentablesCounter, count, 'rentables');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::updateUnseenPetsCount()
    updateUnseenPetsCount(count: number): void 
    {
        if(!this._window) return;

        if(!this._petsCounter) 
        {
            this._petsCounter = this.createCounter('pets');
        }

        if(this._petsCounter) this.updateCounter(this._petsCounter, count, 'pets');
        this._habboInventory.petsModel.updateView();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::updateUnseenBadgeCount()
    updateUnseenBadgeCount(count: number): void 
    {
        if(!this._window) return;

        if(!this._badgesCounter) 
        {
            this._badgesCounter = this.createCounter('badges');
        }

        if(this._badgesCounter) this.updateCounter(this._badgesCounter, count, 'badges');
        this._habboInventory.badgesModel.updateView();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::updateUnseenBotCount()
    updateUnseenBotCount(count: number): void 
    {
        if(!this._window) return;

        if(!this._botsCounter) 
        {
            this._botsCounter = this.createCounter('bots');
        }

        if(this._botsCounter) this.updateCounter(this._botsCounter, count, 'bots');
        this._habboInventory.botsModel.updateView();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::getView()
    getView(name: string): IWindowContainer | null 
    {
        return this._extractedWindows.get(name) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::resizeToFitContents()
    resizeToFitContents(): void 
    {
        if(!this._window) return;

        const subContentArea = this._window.findChildByName('subContentArea') as IWindowContainer | null;

        if(subContentArea === null) return;

        if(subContentArea.visible) 
        {
            subContentArea.height = Util.getLowestPoint(subContentArea);
        }
        else 
        {
            subContentArea.height = 0;
        }

        this._window.resizeToFitContent();
    }

    // DEVIATION: AS3 also maps the collectibles category to the furni view; the RPG fork removed it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::onHabboToolbarEvent()
    onHabboToolbarEvent = (event: HabboToolbarEvent): void => 
    {
        if(event.iconId !== 'HTIE_ICON_INVENTORY') return;

        if(event.type === HabboToolbarEventClass.TOOLBAR_CLICK) 
        {
            switch(this._currentCategory) 
            {
                case 'pets':
                    this.toggleCategoryView('pets');
                    break;
                case 'furni':
                    this.toggleCategoryView('furni');
                    break;
                case 'rentables':
                    this.toggleCategoryView('rentables');
                    break;
                case 'badges':
                    this.toggleCategoryView('badges');
                    break;
                case 'bots':
                    this.toggleCategoryView('bots');
                    break;
                default:
                    this._habboInventory.toggleInventoryPage('furni');
            }
        }
    };

    // DEVIATION: AS3 keeps the collectibles tab aside to re-insert it when a web3 trade opens; the
    //   RPG fork removed collectibles, so the tab is dropped for good and its `collectibles`
    //   container stays extracted, until Task 10 removes both from the XML.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::getWindow()
    private getWindow(): IFrameWindow | null 
    {
        if(!this._window) 
        {
            const windowManager = this._habboInventory.windowManager;

            if(!windowManager) return null;

            const built = windowManager.buildWidgetLayout(InventoryMainView.LAYOUT_NAME) as IFrameWindow | null;

            if(built === null) return null;

            this._window = built;
            this._window.position = InventoryMainView.DEFAULT_VIEW_LOCATION;
            this._window.visible = false;
            this._window.procedure = this.windowEventProc;
            this._window.setParamFlag(65536, this._habboInventory.getBoolean('inventory.allow.scaling'));

            this.extractWindow('furni');
            this.extractWindow('collectibles');
            this.extractWindow('pets');
            this.extractWindow('bots');
            this.extractWindow('badges');

            const tabs = this._window.findChildByName('tabs') as ITabContextWindow | null;

            if(tabs !== null) 
            {
                // AS3's decompiled tab-setup loop is corrupted (`null.numTabItems`,
                // `null.push(null)`, etc.); reconstructed intent: pull every tab out,
                // then re-add it only if its feature flag allows it.
                const extractedTabs: ITabButtonWindow[] = [];

                while(tabs.numTabItems > 0) 
                {
                    const tab = tabs.getTabItemAt(0);

                    if(tab === null) break;

                    extractedTabs.push(tab);
                    tabs.removeTabItem(tab);
                }

                for(const tab of extractedTabs) 
                {
                    switch(tab.name) 
                    {
                        case 'collectibles':
                            break;
                        case 'bots':
                            if(this._habboInventory.getBoolean('inventory.bots.enabled')) 
                            {
                                tabs.addTabItem(tab);
                            }
                            break;
                        case 'rentables':
                            if(!this._habboInventory.mergeRentFurni && this._habboInventory.getBoolean('duckets.enabled')) 
                            {
                                tabs.addTabItem(tab);
                            }
                            break;
                        default:
                            tabs.addTabItem(tab);
                    }
                }
            }

            this._habboInventory.preparingInventoryView();
            this._habboInventory.updateUnseenItemCounts();
        }

        if(this._window.y < 0) 
        {
            this._window.y = 0;
        }

        if(this._window.x < 0) 
        {
            this._window.x = 0;
        }

        return this._window;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::extractWindow()
    private extractWindow(name: string): void 
    {
        const container = this.mainContainer;
        const child = (container?.getChildByName(name) ?? null) as IWindowContainer | null;

        if(child && container)
        {
            container.removeChild(child);
            this._extractedWindows.set(name, child);
        }
    }

    // DEVIATION: AS3 also resets the collectibles model's unseen items; the RPG fork removed it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::resetUnseenCounters()
    private resetUnseenCounters(category: string): void 
    {
        switch(category) 
        {
            case 'furni':
            case 'rentables':
                this._habboInventory.furniModel.resetUnseenItems();
                break;
            case 'pets':
                this._habboInventory.petsModel.resetUnseenItems();
                break;
            case 'badges':
                this._habboInventory.badgesModel.resetUnseenItems();
                break;
            case 'bots':
                this._habboInventory.botsModel.resetUnseenItems();
                break;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::setViewToCategory()
    private setViewToCategory(category: string | null): void 
    {
        if(category === null || category === '') return;

        if(this.emptyContainer) 
        {
            this.emptyContainer.visible = false;
        }

        if(this.loadingContainer) 
        {
            this.loadingContainer.visible = false;
        }

        this._habboInventory.checkCategoryInitilization(category);

        const mainContainer = this.mainContainer;

        if(mainContainer === null) return;

        if(this._currentCategoryContainer) 
        {
            mainContainer.removeChild(this._currentCategoryContainer);
            this._currentCategoryContainer = null;
        }

        // Track the attempted category regardless of whether it has content yet
        // (some categories don't have a ported View — see getCategoryWindowContainer).
        // Otherwise switching away and back would think we're "already there" and
        // never re-add the container.
        this._currentCategory = category;

        const categoryContainer = this._habboInventory.getCategoryWindowContainer(category);

        if(categoryContainer === null) return;

        categoryContainer.visible = true;
        mainContainer.addChild(categoryContainer);
        categoryContainer.height = mainContainer.height;
        this._habboInventory.updateView(category);
        this._currentCategoryContainer = categoryContainer;

        const tabs = this._window?.findChildByName('tabs') as ITabContextWindow | null;

        if(tabs === null || !tabs) return;

        const selectable = tabs.selector?.getSelectableByName(category);

        if(selectable) 
        {
            tabs.selector!.setSelected(selectable);
        }

        this.emptyFurnimaticSlots();
    }

    /**
     * Clears the recycler on every category switch — leaving a tab does not keep your items in the
     * machine.
     *
     * The marker here claimed `habbo/catalog/recycler` was unported. It was not: `IRecycler`,
     * `FurniSlotItem` and `RecyclerLogic` were all present, and `HabboCatalog.getRecycler()`
     * already returned one.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::emptyFurnimaticSlots()
    private emptyFurnimaticSlots(): void
    {
        const recycler = this._habboInventory.catalog?.getRecycler() ?? null;

        if(recycler == null) return;

        for(let slotId = 0; slotId < recycler.numberOfSlots; slotId++)
        {
            if(recycler.getSlotContent(slotId) != null) recycler.releaseSlot(slotId);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::enableScaling()
    private enableScaling(): void 
    {
        if(!this._window) return;

        this._window.height = this._window.limits.minHeight;
        this._window.setParamFlag(65536, true);
        this._window.findChildByName('top_content')?.setParamFlag(2048, true);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::disableScaling()
    private disableScaling(): void 
    {
        if(!this._window) return;

        this._window.height = this._window.limits.minHeight;
        this._window.setParamFlag(65536, false);
        this._window.findChildByName('top_content')?.setParamFlag(2048, false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::setSubViewToCategory()
    private setSubViewToCategory(category: string | null): void 
    {
        if(category === null || category === '' || !this._window) return;

        this._habboInventory.checkCategoryInitilization(category);

        const subContentArea = this._window.findChildByName('subContentArea') as IWindowContainer | null;

        if(subContentArea === null) return;

        while(subContentArea.numChildren > 0) 
        {
            subContentArea.removeChildAt(0);
        }

        const subContainer = this._habboInventory.getCategorySubWindowContainer(category);

        if(subContainer !== null) 
        {
            this.disableScaling();
            subContentArea.visible = true;
            subContainer.visible = true;
            subContentArea.addChild(subContainer);
        }
        else 
        {
            this.enableScaling();
            subContentArea.visible = false;
        }

        const topContent = this._window.findChildByName('top_content');

        if(topContent) 
        {
            subContentArea.y = topContent.rectangle.y + topContent.rectangle.height + 5;
        }

        this.resizeToFitContents();

        if(this._window.parent) 
        {
            const parent = this._window.parent as unknown as { width: number; height: number };

            if(this._window.x + this._window.width > parent.width) 
            {
                this._window.x = parent.width - this._window.width;
            }

            if(this._window.y + this._window.height > parent.height) 
            {
                this._window.y = (parent.height - this._window.height) * 0.5;
            }

            if(this._window.y < 0) 
            {
                this._window.y = 0;
            }
        }

        this._currentSubCategoryContainer = subContainer;
        this._currentSubCategory = category;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::createCounter()
    private createCounter(name: string): IWindowContainer | null 
    {
        if(!this._window) return null;

        const counter = this._habboInventory.windowManager?.createUnseenItemCounter();

        if(!counter) return null;

        const tabContainer = this._window.findChildByName(name) as IWindowContainer | null;

        if(tabContainer)
        {
            // Position before adding, unlike AS3 (which does addChild then set x/y).
            // The counter root is a border whose "999" placeholder reflows it under
            // ON_RESIZE_ALIGN_RIGHT to a transient negative x during buildWidgetLayout.
            // The tab has RESIZE_TO_ACCOMMODATE_CHILDREN, so adding the counter while it
            // sits at that negative x makes scaleToAccommodateChildren() take minX<0 and
            // shove every sibling — including the tab's title label — right by |minX|,
            // knocking the label off-centre. AS3 avoids this only because its font
            // renders "999" inside the authored box so the border never reflows negative;
            // this port's metrics can't guarantee that. Placing the counter at its final
            // (positive) corner first keeps the tab's faithful accommodate from ever
            // seeing the transient negative x.
            counter.x = tabContainer.width - counter.width - InventoryMainView.COUNTER_MARGIN;
            counter.y = InventoryMainView.COUNTER_MARGIN;
            tabContainer.addChild(counter);
        }

        return counter;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/InventoryMainView.as::updateCounter()
    private updateCounter(counter: IWindowContainer, count: number, tabName: string): void 
    {
        const countLabel = counter.findChildByName('count') as ILabelWindow | null;

        if(countLabel) 
        {
            countLabel.caption = count.toString();
        }

        counter.visible = count > 0;

        if(!this._window) return;

        const tabContainer = this._window.findChildByName(tabName) as IWindowContainer | null;

        if(tabContainer) 
        {
            // AS3 win63's text-label windows expose `margins`, but the generic
            // ILabelWindow interface doesn't declare it (TextController.ts, the
            // concrete implementation, does) — cast pragmatically.
            const title = tabContainer.getChildByTag('TITLE') as (ILabelWindow & { margins: IMargins }) | null;

            if(title) 
            {
                if(counter.visible) 
                {
                    title.margins.right = counter.width + 2 * InventoryMainView.COUNTER_MARGIN;
                }
                else 
                {
                    title.margins.right = title.margins.left;
                }

                tabContainer.width = title.width;
                counter.x = tabContainer.width - counter.width - InventoryMainView.COUNTER_MARGIN;
            }
        }
    }
}
