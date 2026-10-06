import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {HabboCatalog} from '../../HabboCatalog';
import {ActivityPointTypeEnum} from '../../purse/ActivityPointTypeEnum';
import {SelectProductEvent} from './events/SelectProductEvent';
import {CatalogWidgetSpinnerEvent} from './events/CatalogWidgetSpinnerEvent';
import {CatalogWidgetEvent} from './events/CatalogWidgetEvent';
import {CatalogWidgetName} from './CatalogWidgetName';
import {CatalogWidget} from './CatalogWidget';

/**
 * Shows the running total price (credits/activity points, with a struck-through original
 * price when a bundle-quantity discount applies) next to the purchase widget.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/TotalPriceWidget.as
 */
export class TotalPriceCatalogWidget extends CatalogWidget
{
    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/TotalPriceWidget.as::_catalog
    private _catalog: HabboCatalog | null;

    private _priceCredits: number = 0;

    private _priceActivityPoints: number = 0;

    private _priceSilver: number = 0;

    private _activityPointType: number = 0;

    private _quantity: number = 1;

    private _amountTextPrimary: IWindow | null = null;

    private _amountTextSecondary: ITextWindow | null = null;

    private _totalLeft: IWindowContainer | null = null;

    private _totalRight: IWindowContainer | null = null;

    constructor(window: IWindowContainer, catalog: HabboCatalog)
    {
        super(window);
        this._catalog = catalog;
    }

    override dispose(): void
    {
        if(this.disposed) return;

        this._catalog = null;
        this.events.off(CatalogWidgetSpinnerEvent.VALUE_CHANGED, this.onSpinnerValueChanged);
        this.events.off(SelectProductEvent.SELECT_PRODUCT, this.onSelectProduct);
        this.clear();
        super.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/TotalPriceWidget.as::init()
    override init(): boolean
    {
        if(!super.init()) return false;

        this.attachWidgetView(CatalogWidgetName.TOTAL_PRICE);
        this.window.visible = false;

        if(!this._catalog!.multiplePurchaseEnabled) return true;

        this.events.on(CatalogWidgetSpinnerEvent.VALUE_CHANGED, this.onSpinnerValueChanged);
        this.events.on(SelectProductEvent.SELECT_PRODUCT, this.onSelectProduct);
        this.events.emit('TOTAL_PRICE_WIDGET_INITIALIZED', new CatalogWidgetEvent('TOTAL_PRICE_WIDGET_INITIALIZED'));

        return true;
    }

    private onSpinnerValueChanged = (event: CatalogWidgetSpinnerEvent): void =>
    {
        this._quantity = event.value;
        this.updateCurrencyIndicators();
    };

    private onSelectProduct = (event: SelectProductEvent): void =>
    {
        this.window.visible = event.offer.bundlePurchaseAllowed;
        this._priceCredits = event.offer.priceInCredits;
        this._priceActivityPoints = event.offer.priceInActivityPoints;
        this._priceSilver = event.offer.priceInSilver;
        this._activityPointType = event.offer.activityPointType;
        this._quantity = 1;
        this.clear();
        this.createCurrencyIndicators();
        this.updateCurrencyIndicators();
    };

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/TotalPriceWidget.as::clear()
    private clear(): void
    {
        this._amountTextPrimary = null;
        this._amountTextSecondary = null;
        this._totalLeft = null;
        this._totalRight = null;
        this.window.findChildByName('plus')!.visible = false;
        this.window.findChildByName('amount_text_left')!.visible = false;

        const totalLeft = this.window.findChildByName('total_left');

        if(totalLeft != null) totalLeft.visible = false;

        const totalRight = this.window.findChildByName('total_right');

        if(totalRight != null) totalRight.visible = false;

        this.window.findChildByName('currency_indicator_bitmap_left')!.visible = false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/TotalPriceWidget.as::updateCurrencyIndicators()
    private updateCurrencyIndicators(): void
    {
        const catalog = this._catalog!;
        const creditsTotal = this._quantity * this._priceCredits;
        const activityPointsTotal = this._quantity * this._priceActivityPoints;
        const silverTotal = this._quantity * this._priceSilver;

        let discountedCredits = creditsTotal;
        let discountedActivityPoints = activityPointsTotal;
        let discountedSilver = silverTotal;

        if(catalog.bundleDiscountEnabled)
        {
            discountedCredits = catalog.utils.calculateBundlePrice(true, this._priceCredits, this._quantity);
            discountedActivityPoints = catalog.utils.calculateBundlePrice(true, this._priceActivityPoints, this._quantity);
            discountedSilver = catalog.utils.calculateBundlePrice(true, this._priceSilver, this._quantity);
        }

        if(this._amountTextPrimary != null)
        {
            this._amountTextPrimary.caption = (catalog.bundleDiscountEnabled ? discountedCredits : creditsTotal).toString();
        }

        if(this._amountTextSecondary != null)
        {
            this._amountTextSecondary.caption = this._priceSilver > 0
                ? (catalog.bundleDiscountEnabled ? discountedSilver : silverTotal).toString()
                : (catalog.bundleDiscountEnabled ? discountedActivityPoints : activityPointsTotal).toString();
        }

        if(this._totalLeft != null)
        {
            this._totalLeft.visible = creditsTotal !== discountedCredits;

            const text = this._totalLeft.findChildByName('text')!;

            text.caption = this._totalLeft.visible ? creditsTotal.toString() : '0';
            this._totalLeft.findChildByName('strike')!.width = text.width;
        }

        if(this._totalRight != null)
        {
            if(this._priceSilver > 0)
            {
                this._totalRight.visible = silverTotal !== discountedSilver;

                const text = this._totalRight.findChildByName('text')!;

                text.caption = this._totalRight.visible ? silverTotal.toString() : '0';
                this._totalRight.findChildByName('strike')!.width = text.width;
            }
            else
            {
                this._totalRight.visible = activityPointsTotal !== discountedActivityPoints;

                const text = this._totalRight.findChildByName('text')!;

                text.caption = this._totalRight.visible ? activityPointsTotal.toString() : '0';
                this._totalRight.findChildByName('strike')!.width = text.width;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/TotalPriceWidget.as::createCurrencyIndicators()
    private createCurrencyIndicators(): void
    {
        const catalog = this._catalog!;
        const configuration = catalog as unknown as IHabboConfigurationManager;

        if(this._priceCredits > 0)
        {
            let indicator: IWindow;

            if(this._priceActivityPoints > 0 || this._priceSilver > 0)
            {
                this._amountTextPrimary = this.window.findChildByName('amount_text_left');
                this._amountTextPrimary!.visible = true;
                this._totalLeft = this.window.findChildByName('total_left') as unknown as IWindowContainer | null;

                if(this._totalLeft != null) this._totalLeft.visible = false;

                indicator = this.window.findChildByName('currency_indicator_bitmap_left')!;
                indicator.visible = true;
                this.window.findChildByName('plus')!.visible = true;
            }
            else
            {
                this._amountTextPrimary = this.window.findChildByName('amount_text_right');
                this._totalRight = this.window.findChildByName('total_right') as unknown as IWindowContainer | null;

                if(this._totalRight != null) this._totalRight.visible = false;

                indicator = this.window.findChildByName('currency_indicator_bitmap_right')!;
            }

            if(this.page.acceptSeasonCurrencyAsCredits)
            {
                indicator.style = ActivityPointTypeEnum.getIconStyleFor(catalog.getSeasonalCurrencyActivityPointType(), configuration, true, true);
                indicator.width = 53;
            }
            else
            {
                indicator.style = ActivityPointTypeEnum.getIconStyleFor(-1, configuration, true);
                indicator.width = 22;
            }
        }

        if(this._priceActivityPoints > 0)
        {
            this._amountTextSecondary = this.window.findChildByName('amount_text_right') as unknown as ITextWindow;
            this._totalRight = this.window.findChildByName('total_left') as unknown as IWindowContainer | null;

            if(this._totalRight != null) this._totalRight.visible = false;

            const indicator = this.window.findChildByName('currency_indicator_bitmap_right')!;

            indicator.style = ActivityPointTypeEnum.getIconStyleFor(this._activityPointType, configuration, true);
        }
        else if(this._priceSilver > 0)
        {
            this._amountTextSecondary = this.window.findChildByName('amount_text_right') as unknown as ITextWindow;
            this._totalRight = this.window.findChildByName('total_left') as unknown as IWindowContainer | null;

            if(this._totalRight != null) this._totalRight.visible = false;

            const indicator = this.window.findChildByName('currency_indicator_bitmap_right')!;

            indicator.style = ActivityPointTypeEnum.getIconStyleFor(ActivityPointTypeEnum.SILVER, configuration, true);
        }

        (this.window.findChildByName('totalprice_container') as unknown as IItemListWindow).arrangeListItems();
    }
}
