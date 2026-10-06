import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {HabboCatalog} from '../../HabboCatalog';
import {ExtraInfoItemData} from './bundlepurchaseinfodisplay/ExtraInfoItemData';
import {ExtraInfoViewManager} from './bundlepurchaseinfodisplay/ExtraInfoViewManager';
import type {UpdateableExtraInfoListItem} from './bundlepurchaseinfodisplay/UpdateableExtraInfoListItem';
import {CatalogWidgetBundleDisplayExtraInfoEvent} from './events/CatalogWidgetBundleDisplayExtraInfoEvent';
import {CatalogWidgetSpinnerEvent} from './events/CatalogWidgetSpinnerEvent';
import {CatalogWidget} from './CatalogWidget';

/**
 * Shows the promo/discount/bundle-info overlay rows above the purchase spinner for
 * multi-purchase-enabled catalog offers.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as
 */
export class BundlePurchaseExtraInfoWidget extends CatalogWidget
{
    private static readonly PROMO_ITEM_DROP_DELAY_MS = 4000;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::_catalog
    private _catalog: HabboCatalog | null;

    private _viewManager: ExtraInfoViewManager | null = null;

    private _quantity: number = 1;

    private _priceCredits: number = 0;

    private _priceActivityPoints: number = 0;

    private _activityPointType: number = 0;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::_itemBadgeCode
    private _itemBadgeCode: string | null = null;

    private _promoItemId: number = -1;

    private _discountValueItemId: number = -1;

    private _bundleInfoItemId: number = -1;

    private _promoItemHiddenByFlatPriceStep: boolean = false;

    private _promoItemDropTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(window: IWindowContainer, catalog: HabboCatalog)
    {
        super(window);

        this._catalog = catalog;
    }

    override dispose(): void
    {
        if(this.disposed) return;

        this._viewManager?.dispose();
        this._viewManager = null;
        this._catalog = null;

        if(this._promoItemDropTimer != null)
        {
            clearTimeout(this._promoItemDropTimer);
            this._promoItemDropTimer = null;
        }

        this.events.off(CatalogWidgetBundleDisplayExtraInfoEvent.RESET, this.onResetEvent);
        this.events.off(CatalogWidgetBundleDisplayExtraInfoEvent.HIDE, this.onHideEvent);
        this.events.off(CatalogWidgetSpinnerEvent.VALUE_CHANGED, this.onSpinnerEvent);
        this.events.off(CatalogWidgetBundleDisplayExtraInfoEvent.ITEM_CLICKED, this.onExtraInfoItemClickedEvent);

        super.dispose();
    }

    override init(): boolean
    {
        if(!this._catalog!.multiplePurchaseEnabled)
        {
            return true;
        }

        this._viewManager = new ExtraInfoViewManager(this, this._catalog!);

        this.events.on(CatalogWidgetBundleDisplayExtraInfoEvent.RESET, this.onResetEvent);
        this.events.on(CatalogWidgetBundleDisplayExtraInfoEvent.HIDE, this.onHideEvent);
        this.events.on(CatalogWidgetSpinnerEvent.VALUE_CHANGED, this.onSpinnerEvent);
        this.events.on(CatalogWidgetBundleDisplayExtraInfoEvent.ITEM_CLICKED, this.onExtraInfoItemClickedEvent);

        return true;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::createPromoItem()
    private createPromoItem(): void
    {
        const data = new ExtraInfoItemData(ExtraInfoItemData.TYPE_PROMO);

        data.quantity = this._quantity;
        this._promoItemId = this._viewManager!.addItem(data);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::updatePromoItem()
    private updatePromoItem(quantity: number): void
    {
        if(this._promoItemId === -1) return;

        const item = this._viewManager!.getItem(this._promoItemId) as UpdateableExtraInfoListItem;
        const data = item.data;

        data.quantity = quantity;
        item.update(data);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::removePromoItem()
    private removePromoItem(): void
    {
        if(this._promoItemId === -1) return;

        this._viewManager!.removeItem(this._promoItemId);
        this._promoItemId = -1;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::createDiscountValueItem()
    private createDiscountValueItem(): void
    {
        const data = new ExtraInfoItemData(ExtraInfoItemData.TYPE_DISCOUNT_VALUE);

        data.quantity = this._quantity;
        data.priceActivityPoints = this._priceActivityPoints;
        data.activityPointType = this._activityPointType;
        data.priceCredits = this._priceCredits;
        this._discountValueItemId = this._viewManager!.addItem(data);

        this._catalog!.utils.discountShownEventTrack();
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::updateDiscountValueItem()
    private updateDiscountValueItem(quantity: number): void
    {
        if(this._discountValueItemId === -1) return;

        const item = this._viewManager!.getItem(this._discountValueItemId) as UpdateableExtraInfoListItem;
        const data = item.data;

        data.quantity = quantity;
        data.discountPriceCredits = this._catalog!.utils.calculateBundlePrice(true, this._priceCredits, quantity);
        data.discountPriceActivityPoints = this._catalog!.utils.calculateBundlePrice(true, this._priceActivityPoints, quantity);
        item.update(data);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::removeDiscountValueItem()
    private removeDiscountValueItem(): void
    {
        if(this._discountValueItemId === -1) return;

        this._viewManager!.removeItem(this._discountValueItemId);
        this._discountValueItemId = -1;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::createBundleInfoItem()
    private createBundleInfoItem(): void
    {
        const data = new ExtraInfoItemData(ExtraInfoItemData.TYPE_BUNDLES_INFO_SCREEN);

        this._bundleInfoItemId = this._viewManager!.addItem(data);
        this._catalog!.utils.bundlesInfoShownEventTrack();
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::removeBundleInfoItem()
    private removeBundleInfoItem(): void
    {
        if(this._bundleInfoItemId === -1) return;

        this._viewManager!.removeItem(this._bundleInfoItemId);
        this._bundleInfoItemId = -1;
    }

    private onResetEvent = (event: CatalogWidgetBundleDisplayExtraInfoEvent): void =>
    {
        if(this.disposed) return;

        this.window.visible = true;

        const data = event.data!;

        this._priceCredits = data.priceCredits;
        this._priceActivityPoints = data.priceActivityPoints;
        this._activityPointType = data.activityPointType;
        this._itemBadgeCode = data.badgeCode;

        this._viewManager!.clear();
        this._discountValueItemId = -1;
        this._promoItemId = -1;

        if(this._promoItemDropTimer != null) clearTimeout(this._promoItemDropTimer);

        this._promoItemDropTimer = setTimeout(() => this.onPromoItemDropDownTimerEvent(), BundlePurchaseExtraInfoWidget.PROMO_ITEM_DROP_DELAY_MS);
    };

    private onSpinnerEvent = (event: CatalogWidgetSpinnerEvent): void =>
    {
        if(this.disposed) return;

        const catalog = this._catalog!;

        if(!catalog.bundleDiscountEnabled) return;

        if(event.type !== CatalogWidgetSpinnerEvent.VALUE_CHANGED) return;

        if(event.value === this._quantity) return;

        // AS3 dereferences bundleDiscountRuleset unguarded. It is filled by an async message
        // (BundleDiscountRulesetMessageEvent, header 1073), so it is null until that arrives and
        // the guard below covers the window AS3 got away with because Flash's `null.x` on an
        // untyped local threw into a swallowed handler rather than killing the widget.
        const ruleset = catalog.bundleDiscountRuleset;

        if(ruleset != null)
        {
            if(event.value >= ruleset.bundleSize && this._discountValueItemId === -1)
            {
                this.createDiscountValueItem();
            }
            else if(event.value < ruleset.bundleSize)
            {
                this.removeDiscountValueItem();
            }
        }

        this.updatePromoItem(event.value);
        this.updateDiscountValueItem(event.value);
        this._quantity = event.value;
        this.removeBundleInfoItem();

        if(this._quantity >= catalog.utils.bundleDiscountHighestFlatPriceStep)
        {
            this.removePromoItem();
            this._promoItemHiddenByFlatPriceStep = true;
        }
        else if(this._promoItemHiddenByFlatPriceStep)
        {
            this.createPromoItem();
            this._promoItemHiddenByFlatPriceStep = false;
        }

        catalog.utils.spinnerValueChangedEventTrack();
    };

    private onHideEvent = (_event: CatalogWidgetBundleDisplayExtraInfoEvent): void =>
    {
        this.window.visible = false;
    };

    private onExtraInfoItemClickedEvent = (event: CatalogWidgetBundleDisplayExtraInfoEvent): void =>
    {
        if(event.id === this._promoItemId)
        {
            if(this._bundleInfoItemId === -1) this.createBundleInfoItem();
        }
        else if(event.id === this._bundleInfoItemId)
        {
            this.removeBundleInfoItem();
        }
    };

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/BundlePurchaseExtraInfoWidget.as::onPromoItemDropDownTimerEvent()
    private onPromoItemDropDownTimerEvent(): void
    {
        this.createPromoItem();
    }
}
