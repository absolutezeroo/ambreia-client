import {CatalogWidgetInitPurchaseEvent} from './events/CatalogWidgetInitPurchaseEvent';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {HabboCatalog} from '../../HabboCatalog';
import type {IPurchasableOffer} from '../../IPurchasableOffer';
import type {IGridItem} from '../IGridItem';
import type {IItemGrid} from '../IItemGrid';
import type {IProductContainer} from '../IProductContainer';
import type {IDragAndDropDoneReceiver} from '../IDragAndDropDoneReceiver';
import {BundleProductContainer} from '../BundleProductContainer';
import {ProductContainer} from '../ProductContainer';
import {CatalogWidgetColourIndexEvent} from './events/CatalogWidgetColourIndexEvent';
import {CatalogWidgetColoursEvent} from './events/CatalogWidgetColoursEvent';
import {SelectProductEvent} from './events/SelectProductEvent';
import {SetExtraPurchaseParameterEvent} from './events/SetExtraPurchaseParameterEvent';
import {CatalogWidgetName} from './CatalogWidgetName';
import {CatalogWidget} from './CatalogWidget';

/**
 * Renders the offer grid on a catalog page: lazily loads item icons, drives selection.
 *
 * @see sources/win63_version/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as
 */
export class ItemGridCatalogWidget extends CatalogWidget implements IItemGrid, IDragAndDropDoneReceiver 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::itemColors
    itemColors: Map<string, number[]> = new Map();

    // AS3 loads these via assets.getAssetByName(name).content (raw XML, rebuilt per item via
    // buildFromXML()); this port's compiled window-layout registry only exposes ready-built
    // window instances (buildWidgetLayout()), so these hold one template instance each, cloned
    // per grid item instead - the same clone-a-template pattern CatalogNodeRenderable already
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::chosenItemColorIndex
    chosenItemColorIndex: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::_itemGrid
    protected _itemGrid: IItemGridWindow | null = null;
    // uses for its own item/list templates.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::_gridItemLayout
    protected _gridItemLayout: IWindow | null = null;
    protected _gridItemWithPriceMulti: IWindow | null = null;
    protected _gridItemWithPriceSingle: IWindow | null = null;
    protected _selectedGridItem: IGridItem | null = null;
    protected _graphicsTimer: ReturnType<typeof setInterval> | null = null;
    protected _useTimer: boolean = true;
    protected _sessionDataManager: ISessionDataManager;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::_bundleCounter
    private _bundleCounter: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::_offerInitIndex
    private _offerInitIndex: number = 0;
    private _catalogType: string;

    constructor(window: IWindowContainer, sessionDataManager: ISessionDataManager, catalogType: string) 
    {
        super(window);
        this._sessionDataManager = sessionDataManager;
        this._catalogType = catalogType;
    }

    override dispose(): void 
    {
        if(this._graphicsTimer != null) 
        {
            clearInterval(this._graphicsTimer);
            this._graphicsTimer = null;
        }

        if(this._itemGrid != null) 
        {
            this._itemGrid.destroyGridItems();
            this._itemGrid = null;
        }

        this._gridItemLayout = null;
        this._gridItemWithPriceMulti = null;
        this._gridItemWithPriceSingle = null;
        this._selectedGridItem = null;

        super.dispose();
    }

    override init(): boolean 
    {
        if(!super.init()) return false;

        this.attachWidgetView(CatalogWidgetName.ITEM_GRID);

        const isFixed = this._window.tags.indexOf('FIXED') > -1;

        this._itemGrid = this._window.findChildByName('itemGrid') as unknown as IItemGridWindow;

        if(!isFixed) 
        {
            this._window.getChildAt(0)!.width = this._window.width;
            this._window.getChildAt(0)!.height = this._window.height;
        }

        this._itemGrid.verticalSpacing = 0;

        // TS deviation: AS3 calls buildFromXML() fresh per grid item (a transient, immediately-
        // attached construction every time - see createGridItem()'s own note). This port instead
        // builds one shared instance up front and clones it per item, since buildWidgetLayout()
        // has no equivalent of AS3's raw-XML-template argument.
        this._gridItemLayout = this.page.viewer.catalog.windowManager!.buildWidgetLayout('gridItem');
        this._gridItemWithPriceSingle = this.page.viewer.catalog.windowManager!.buildWidgetLayout('grid_item_with_price_single');
        this._gridItemWithPriceMulti = this.page.viewer.catalog.windowManager!.buildWidgetLayout('grid_item_with_price_multi');

        const loadGraphics = this.populateItemGrid();

        if(this._useTimer) 
        {
            this._graphicsTimer = setInterval(() => this.loadItemGridGraphics(loadGraphics), 25);
        }
        else 
        {
            this.loadItemGridGraphics(loadGraphics);
        }

        this.events.on(CatalogWidgetColourIndexEvent.COLOUR_INDEX, this.onColourIndex.bind(this));

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::select()
    select(item: IGridItem, dispatchColours: boolean): void
    {
        if(this._selectedGridItem != null)
        {
            this._selectedGridItem.deactivate();
        }

        this._selectedGridItem = item;
        item.activate();

        if(item.view) 
        {
            item.view.findChildByName('border_outline')!.color = this._catalogType === 'NORMAL' ? 6538729 : 16758076;
        }

        const container = item as unknown as ProductContainer;

        if(!container) return;

        if(container.isLazy) return;

        const offer = container.offer;

        if(offer != null) 
        {
            this.events.emit(SelectProductEvent.SELECT_PRODUCT, new SelectProductEvent(offer));

            if(offer.product && offer.product.productType === 'i') 
            {
                this.events.emit(
                    SetExtraPurchaseParameterEvent.CWE_SET_EXTRA_PARM,
                    new SetExtraPurchaseParameterEvent(offer.product.extraParam)
                );
            }
        }

        if(dispatchColours) 
        {
            this.events.emit(CatalogWidgetColoursEvent.COLOUR_ARRAY, new CatalogWidgetColoursEvent(
                this.getCurrentItemColors(),
                'ctlg_clr_27x22_1',
                'ctlg_clr_27x22_2',
                'ctlg_clr_27x22_3',
                this.getCurrentItemColourIndex()
            ));
        }
    }

    /**
     * Dragging a grid item into the room. The club-level gate is AS3's own and silent: an offer the
     * user cannot afford in club terms simply never reaches the mover, with no message — and note
     * `true` is returned either way, so the drag itself is always considered started.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::startDragAndDrop()
    startDragAndDrop(item: IGridItem): boolean
    {
        const offer = (item as unknown as ProductContainer).offer;

        if(offer != null && this._sessionDataManager.clubLevel >= offer.clubLevel)
        {
            this.page.viewer.catalog.requestSelectedItemToMover(this, offer);
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::onDragAndDropDone()
    onDragAndDropDone(success: boolean, extraParam: string): void 
    {
        if(this.disposed) return;

        if(success)
        {
            // A drop that landed opens the purchase confirmation, as if Buy had been clicked. The
            // `false` is AS3's own: a drag-placed item cannot be bought as a gift, since it is
            // already standing in the room. `extraParam` carries the receiver's name on the
            // drop-onto-a-user path, which is what makes the gift case reachable at all.
            this.events.emit(
                CatalogWidgetInitPurchaseEvent.INIT_PURCHASE,
                new CatalogWidgetInitPurchaseEvent(false, extraParam)
            );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::stopDragAndDrop()
    stopDragAndDrop(): void 
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::getCurrentItemColors()
    getCurrentItemColors(): number[] 
    {
        let matched: IPurchasableOffer | null = null;

        for(const offer of this.page.offers) 
        {
            if(offer.gridItem === this._selectedGridItem) 
            {
                matched = offer;
            }
        }

        if(!matched || !matched.product!.isColorable) return [];

        const baseName = matched.product!.furnitureData!.fullName.split('*')[0];

        return this.itemColors.get(baseName) ?? [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::populateItemGrid()
    protected populateItemGrid(): IPurchasableOffer[] 
    {
        const groupByColor = this.page.layoutCode === 'default_3x3_color_grouping';
        const groupedOffers: IPurchasableOffer[] = [];
        const groupIndexByBaseName = new Map<string, number>();

        if(groupByColor) 
        {
            for(const offer of this.page.offers) 
            {
                if(!offer.product!.furnitureData || !offer.product!.isColorable) 
                {
                    groupedOffers.push(offer);

                    continue;
                }

                const furnitureData = offer.product!.furnitureData!;
                const baseName = furnitureData.fullName.split('*')[0];
                const colourIndex = parseInt(furnitureData.fullName.split('*')[1], 10);

                if(!this.itemColors.has(baseName)) 
                {
                    this.itemColors.set(baseName, []);
                }

                let lastColour = 16777215;

                if(furnitureData.colours) 
                {
                    for(const colour of furnitureData.colours) 
                    {
                        if(colour !== 16777215) 
                        {
                            lastColour = colour;
                        }
                    }

                    const colours = this.itemColors.get(baseName)!;

                    if(colours.indexOf(lastColour) === -1) 
                    {
                        colours[colourIndex] = lastColour;
                    }
                }

                // (AS3 also lets a white `bc_` Builders Club variant replace its group's head; the
                // RPG fork removed the Builders Club.)
                if(!groupIndexByBaseName.has(baseName)) 
                {
                    groupIndexByBaseName.set(baseName, groupedOffers.length);
                    groupedOffers.push(offer);
                }
            }
        }

        const offersToLoad: IPurchasableOffer[] = [];

        for(const offer of this.page.offers) 
        {
            if(groupByColor && offer.product!.furnitureData && offer.product!.isColorable) 
            {
                if(groupedOffers.indexOf(offer) !== -1) 
                {
                    const view = this.createGridItem(offer.gridItem);

                    offer.gridItem.view = view;
                }
            }
            else 
            {
                const view = this.createGridItem(offer.gridItem);

                offer.gridItem.view = view;
            }

            offer.gridItem.grid = this;

            if(groupedOffers.indexOf(offer) !== -1 || !groupByColor) 
            {
                offersToLoad.push(offer);
            }

            if(offer.pricingModel === 'pricing_model_bundle') 
            {
                this._bundleCounter = this._bundleCounter + 1;

                if(offer.productContainer instanceof BundleProductContainer) 
                {
                    offer.productContainer.setBundleCounter(this._bundleCounter);
                }
            }
        }

        return offersToLoad;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::resetTimer()
    protected resetTimer(): void 
    {
        this._offerInitIndex = 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::loadItemGridGraphics()
    protected loadItemGridGraphics(offers: IPurchasableOffer[] | null = null): void 
    {
        if(this.disposed) return;

        const list = offers ?? this.page.offers;
        const count = list.length;

        if(count > 0) 
        {
            for(let i = 0; i < 3; i++) 
            {
                if(this._offerInitIndex >= 0 && this._offerInitIndex < count) 
                {
                    this.loadGraphics(list[this._offerInitIndex]);
                }

                this._offerInitIndex = this._offerInitIndex + 1;

                if(this._offerInitIndex >= count) 
                {
                    this.resetTimer();

                    if(this._graphicsTimer != null) 
                    {
                        clearInterval(this._graphicsTimer);
                        this._graphicsTimer = null;
                    }

                    break;
                }
            }
        }
    }

    protected createGridItem(gridItem: IGridItem): IWindowContainer 
    {
        const container = gridItem as unknown as IProductContainer;
        const hasPrice = container != null && container.offer != null
            && (container.offer.priceInCredits > 0 || container.offer.priceInActivityPoints > 0 || container.offer.priceInSilver > 0);

        let template: IWindow;

        if(hasPrice) 
        {
            template = (container.offer.priceInCredits > 0 && container.offer.priceInActivityPoints > 0)
                ? this._gridItemWithPriceMulti!
                : this._gridItemWithPriceSingle!;
        }
        else 
        {
            template = this._gridItemLayout!;
        }

        const view = template.clone() as unknown as IWindowContainer;

        this._itemGrid!.addGridItem(view);
        gridItem.view = view;

        if(container instanceof ProductContainer) 
        {
            container.createCurrencyIndicators(this.page.viewer.catalog as HabboCatalog);
        }

        return view;
    }

    // The guild-recolor preview branch (var_3738/StringArrayStuffData.setArray()) is not ported -
    // StringArrayStuffData only supports construction from a room-object model/message wrapper in
    // this port, not the ad-hoc string array AS3 builds here for a not-yet-owned guild furni item.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::loadGraphics()
    protected loadGraphics(offer: IPurchasableOffer): void 
    {
        if(offer != null && !offer.disposed) 
        {
            offer.productContainer.initProductIcon(this.page.viewer.roomEngine, null);
        }

        offer.productContainer.grid = this;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::onColourIndex()
    private onColourIndex(event: CatalogWidgetColourIndexEvent): void 
    {
        let matched: IPurchasableOffer | null = null;

        for(const offer of this.page.offers) 
        {
            if(offer.gridItem === this._selectedGridItem && offer.gridItem.view != null) 
            {
                matched = offer;
            }
        }

        if(!matched || !matched.product!.isColorable) return;

        const view = matched.gridItem.view;

        matched.gridItem.view = null!;

        const targetName = matched.product!.furnitureData!.fullName.split('*')[0] + '*' + (event.index + 1);

        for(const offer of this.page.offers) 
        {
            if(offer.product!.furnitureData!.fullName === targetName) 
            {
                offer.gridItem.view = view;
                this.select(offer.gridItem, false);
                this.loadGraphics(offer);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/ItemGridCatalogWidget.as::getCurrentItemColourIndex()
    private getCurrentItemColourIndex(): number 
    {
        let matched: IPurchasableOffer | null = null;

        for(const offer of this.page.offers) 
        {
            if(offer.gridItem === this._selectedGridItem) 
            {
                matched = offer;
            }
        }

        if(!matched || !matched.product!.isColorable) return 0;

        return Math.max(matched.product!.furnitureData!.colourIndex - 1, 0);
    }
}
