import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ISelectorWindow} from '@core/window/components/ISelectorWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IPurchasableOffer} from '../../IPurchasableOffer';
import type {IGridItem} from '../IGridItem';
import type {ProductContainer} from '../ProductContainer';
import {SetExtraPurchaseParameterEvent} from './events/SetExtraPurchaseParameterEvent';
import {CatalogWidgetEvent} from './events/CatalogWidgetEvent';
import {CatalogWidgetUpdateRoomPreviewEvent} from './events/CatalogWidgetUpdateRoomPreviewEvent';
import {ItemGridCatalogWidget} from './ItemGridCatalogWidget';

const log = Logger.getLogger('habbo.catalog.viewer.widgets.SpacesNewCatalogWidget');

/**
 * Item grid grouped into wall/floor/landscape categories via a radio selector, driving the
 * "spaces" room preview (walls + floor + landscape shown together).
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/SpacesNewCatalogWidget.as
 */
export class SpacesNewCatalogWidget extends ItemGridCatalogWidget
{
    // Group index 0 = wallpaper/wall, 1 = floor, 2 = landscape - matches switchCategory()'s
    // group.walls/group.floors/group.views mapping.
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/SpacesNewCatalogWidget.as::_groupNames
    private _groupNames: string[] = ['wallpaper', 'floor', 'landscape'];
    private _offersByGroup: IPurchasableOffer[][] = [];
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/SpacesNewCatalogWidget.as::_selectedGroup
    private _selectedGroup: number = 0;
    private _selectedIndexByGroup: number[] = [0, 0, 0];
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/SpacesNewCatalogWidget.as::_categories
    private _categories: string[] = ['group.walls', 'group.floors', 'group.views'];
    private _groupSelector: ISelectorWindow | null = null;

    constructor(window: IWindowContainer, sessionDataManager: ISessionDataManager, catalogType: string)
    {
        super(window, sessionDataManager, catalogType);
    }

    override dispose(): void
    {
        if(this.disposed) return;

        this.events.off(CatalogWidgetEvent.WIDGETS_INITIALIZED, this.onWidgetsInitialized);

        super.dispose();

        this._offersByGroup = [];
    }

    override init(): boolean
    {
        log.debug('Init Item Group Catalog Widget (Spaces New)');

        this.createOfferGroups();

        if(!super.init()) return false;

        this.events.on(CatalogWidgetEvent.WIDGETS_INITIALIZED, this.onWidgetsInitialized);

        this._groupSelector = this.window.findChildByName('groups') as unknown as ISelectorWindow | null;

        if(this._groupSelector)
        {
            for(let i = 0; i < this._groupSelector.numSelectables; i++)
            {
                const selectable = this._groupSelector.getSelectableAt(i);

                selectable?.addEventListener(WindowEvent.WE_SELECTED, this.onSelectGroup);
            }
        }

        this.switchCategory(this._categories[this._selectedGroup]);
        this.updateRoomPreview();

        return true;
    }

    private onWidgetsInitialized = (_event: CatalogWidgetEvent): void =>
    {
        const index = this._selectedIndexByGroup[this._selectedGroup];
        const offer = this._offersByGroup[this._selectedGroup][index];

        this.select(offer.gridItem, false);
    };

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/SpacesNewCatalogWidget.as::selectIndex()
    selectIndex(index: number): void
    {
        if(index > -1 && this._itemGrid && index < this._itemGrid.numGridItems)
        {
            const offer = this._offersByGroup[this._selectedGroup][index];

            this.select(offer.gridItem, false);
        }
    }

    override select(item: IGridItem, _dispatchColours: boolean): void
    {
        if(item == null) return;

        super.select(item, false);

        const offer = (item as unknown as ProductContainer).offer;

        if(offer == null) return;

        this.events.emit(
            SetExtraPurchaseParameterEvent.CWE_SET_EXTRA_PARM,
            new SetExtraPurchaseParameterEvent(offer.product!.extraParam)
        );

        this._selectedIndexByGroup[this._selectedGroup] = this._offersByGroup[this._selectedGroup].indexOf(offer);

        this.updateRoomPreview();
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/SpacesNewCatalogWidget.as::updateRoomPreview()
    private updateRoomPreview(): void
    {
        const wallIndex = this._selectedIndexByGroup[0];
        const floorIndex = this._selectedIndexByGroup[1];
        const landscapeIndex = this._selectedIndexByGroup[2];

        const wallOffer = this._offersByGroup[0]?.length > wallIndex ? this._offersByGroup[0][wallIndex] : null;
        const floorOffer = this._offersByGroup[1]?.length > floorIndex ? this._offersByGroup[1][floorIndex] : null;
        const landscapeOffer = this._offersByGroup[2]?.length > landscapeIndex ? this._offersByGroup[2][landscapeIndex] : null;

        if(!floorOffer || !wallOffer || !landscapeOffer) return;

        this.events.emit(
            CatalogWidgetUpdateRoomPreviewEvent.UPDATE_ROOM_PREVIEW,
            new CatalogWidgetUpdateRoomPreviewEvent(
                floorOffer.product!.extraParam,
                wallOffer.product!.extraParam,
                landscapeOffer.product!.extraParam,
                64
            )
        );
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/SpacesNewCatalogWidget.as::createOfferGroups()
    private createOfferGroups(): void
    {
        for(const offer of this.page.offers)
        {
            if(offer.pricingModel !== 'pricing_model_single' && offer.pricingModel !== 'pricing_model_multi') continue;

            const product = offer.product;

            if(product == null) continue;

            if(product.productType !== 'i' && product.productType !== 's') continue;

            if(product.furnitureData == null) continue;

            const className = product.furnitureData.className;
            const groupIndex = this._groupNames.indexOf(className);

            if(groupIndex === -1)
            {
                this._groupNames.push(className);
            }

            while(this._offersByGroup.length < this._groupNames.length)
            {
                this._offersByGroup.push([]);
            }

            switch(className)
            {
                case 'floor':
                case 'wallpaper':
                case 'landscape':
                    this._offersByGroup[groupIndex].push(offer);
                    break;
                default:
                    log.warn(`[Spaces Catalog Widget] : ${className}`);
            }
        }

        this.page.replaceOffers([], false);
    }

    private onSelectGroup = (event: WindowEvent): void =>
    {
        const selectable = event.target as unknown as ISelectableWindow | null;

        if(selectable)
        {
            const index = this._groupSelector!.getSelectableIndex(selectable);

            log.debug(`select: ${[selectable.name, index]}`);
            this.switchCategory(selectable.name);
        }
    };

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/SpacesNewCatalogWidget.as::switchCategory()
    private switchCategory(name: string): void
    {
        if(this.disposed) return;

        if(!this._groupSelector) return;

        const selectable = this._groupSelector.getSelectableByName(name);

        if(selectable) this._groupSelector.setSelected(selectable);

        let group: number;

        switch(name)
        {
            case 'group.walls':
                group = 0;

                break;
            case 'group.floors':
                group = 1;

                break;
            case 'group.views':
                group = 2;

                break;
            default:
                group = -1;
        }

        if(group > -1)
        {
            if(this._selectedGridItem != null) this._selectedGridItem.deactivate();

            this._selectedGridItem = null;
            this._selectedGroup = group;

            this._itemGrid?.destroyGridItems();

            const groupOffers = this._offersByGroup[this._selectedGroup] ?? [];

            this.page.replaceOffers(groupOffers, false);
            this.resetTimer();

            const loadGraphics = this.populateItemGrid();

            this.loadItemGridGraphics(loadGraphics);

            // TS deviation: AS3 resumes a persistent flash.utils.Timer whose fire-closure is
            // bound once in init() to that call's offer list (empty, since createOfferGroups()
            // clears page.offers first) - restarting it after a category switch keeps ticking on
            // that dead list forever instead of the new category's offers, so in the original
            // client only the first 3 items of any category with more than 3 offers ever get
            // their icons loaded (confirmed by reading ItemGridCatalogWidget.as's
            // init()/loadItemGridGraphics() closures directly - readable code, not decompiler
            // corruption). This port's timer is a plain setInterval created fresh wherever needed
            // (see ItemGridCatalogWidget.ts::init()) rather than one persistent Timer object with
            // a fixed closure, so there is no equivalent stale-list quirk to reproduce - starting
            // a fresh interval over the CURRENT offer list here instead achieves the obviously
            // intended behavior (progressively load every item in the selected category).
            // The interval init() started runs over the empty list createOfferGroups() left, and
            // loadItemGridGraphics() only clears a timer once it reaches the end of a NON-empty
            // list — so it never stops, `_graphicsTimer` is never null, and a `== null` guard here
            // meant the fresh interval never started: only the direct call's 3 tiles got icons.
            if(this._graphicsTimer != null)
            {
                clearInterval(this._graphicsTimer);
                this._graphicsTimer = null;
            }

            if(this._useTimer)
            {
                this._graphicsTimer = setInterval(() => this.loadItemGridGraphics(loadGraphics), 25);
            }

            this.selectIndex(this._selectedIndexByGroup[this._selectedGroup]);
        }
    }
}
