import {ColorConverter} from '@room/utils/ColorConverter';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IBadgeImageWidget} from '@habbo/window/widgets/IBadgeImageWidget';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import type {HabboCatalog} from './HabboCatalog';
import type {IPurchasableOffer} from './IPurchasableOffer';
import {ActivityPointTypeEnum} from './purse/ActivityPointTypeEnum';
import {VipBenefitsWindow} from './club/VipBenefitsWindow';

interface IPriceEntry
{
    amount: number;
    unit: number;
}

/**
 * Shared catalog view helpers: price display, product icon assignment, bundle pricing math.
 *
 * @see sources/win63_version/habbo/catalog/HabboCatalogUtils.as
 */
export class HabboCatalogUtils implements IGetImageListener
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::BADGE_CHATSTYLE_WIDGET_NAME
    private static readonly BADGE_CHATSTYLE_WIDGET_NAME = 'HCU_dynamic_badge';

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as — the bare 9032648 both
    // showPriceOnProduct() and getSeasonalCurrencyPriceColor() fall back to. Name DERIVED.
    private static readonly DEFAULT_PRICE_BOX_COLOR = 9032648;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::_catalog
    private _catalog: HabboCatalog | null;

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::_productBitmapWrappers
    private _productBitmapWrappers: Map<number, IBitmapWrapperWindow[]> = new Map();

    // AS3: sources/win63_version/habbo/catalog/HabboCatalogUtils.as::_bundleDiscountFlatPriceSteps
    private _bundleDiscountFlatPriceSteps: number[] = [];

    // Derived name: `_bundleDiscountHighestFlatPriceStep` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/win63_version/habbo/catalog/HabboCatalogUtils.as::_bundleDiscountHighestFlatPriceStep
    private _bundleDiscountHighestFlatPriceStep: number = 0;

    private _vipBenefitsWindow: VipBenefitsWindow | null = null;

    constructor(catalog: HabboCatalog)
    {
        this._catalog = catalog;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::replaceCenteredImage()
    static replaceCenteredImage(target: IBitmapWrapperWindow, source: ImageBitmap, rect: {width: number; height: number} | null = null): void
    {
        const area = rect ?? source;
        const x = Math.round((target.width - area.width) / 2);
        const y = Math.round((target.height - area.height) / 2);

        // TS deviation: AS3 composites `source` into `target.bitmap`'s existing BitmapData at an
        // offset via copyPixels(); ImageBitmap is immutable in the browser, so this port instead
        // assigns the source directly - the wrapper's own fitSize()/centering (see
        // BitmapWrapperController) already reproduces the visual centering AS3 achieves manually.
        void x;
        void y;
        target.bitmap = source;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._catalog = null;
        this._productBitmapWrappers = new Map();
        this._disposed = true;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3 loads this via assets.getAssetByName(name).content + buildFromXML(name, layer, vars);
    // this port pre-compiles window layouts into a named registry instead (see
    // IHabboWindowManager buildWidgetLayout() doc). buildWidgetLayout() also has no `vars`
    // template-substitution parameter, and gains nothing from one: every caller in the port passes
    // vars=null, so it would only ever be threaded through unused.
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::createWindow()
    createWindow(name: string, layer: number = 1, _vars: Map<string, string> | null = null): IWindow | null
    {
        if(this._catalog!.windowManager == null) return null;

        const window = this._catalog!.windowManager.buildWidgetLayout(name, layer);
        const container = window as unknown as IWindowContainer;

        if(container != null && container.groupChildrenWithTag)
        {
            const bitmaps: IWindow[] = [];

            container.groupChildrenWithTag('bitmap', bitmaps, -1);

            for(const child of bitmaps)
            {
                const bitmapWrapper = child as unknown as IBitmapWrapperWindow;

                if(bitmapWrapper)
                {
                    bitmapWrapper.disposesBitmap = false;
                    this.setCatalogItemImage(bitmapWrapper, bitmapWrapper.bitmapAssetName);
                }
            }
        }

        return window;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::showPriceInContainer()
    showPriceInContainer(container: IWindowContainer, offer: IPurchasableOffer, amount: number = 1, showBig: boolean = false, combo: boolean = false): void
    {
        if(offer == null) return;

        const prices = this.getPriceArray(offer, amount, showBig);

        this.renderPriceInContainer(container, prices, showBig, combo);
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::renderPriceInContainer()
    private renderPriceInContainer(container: IWindowContainer, prices: IPriceEntry[], showBig: boolean, combo: boolean): void
    {
        const list = this.createPriceContainer(container);

        if(list == null) return;

        let i = 0;

        for(; i < prices.length; i++)
        {
            this.renderPriceItem(list, i, prices[i], showBig, combo);
        }

        const keep = i * 2;

        while(list.numListItems > keep)
        {
            list.removeListItemAt(keep);
        }

        container.addChild(list as unknown as IWindow);
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::renderPriceItem()
    private renderPriceItem(list: IItemListWindow, index: number, price: IPriceEntry, showBig: boolean, combo: boolean): void
    {
        const amountText = list.getListItemByName('amount_' + index) as unknown as ITextWindow;
        const unit = list.getListItemByName('unit_' + index)!;

        amountText.text = (index > 0 ? '+ ' : '') + price.amount;
        unit.style = ActivityPointTypeEnum.getIconStyleFor(price.unit, this.configuration(), showBig, combo);
        unit.width = (showBig && combo) ? 53 : 22;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::createPriceContainer()
    private createPriceContainer(container: IWindowContainer): IItemListWindow | null
    {
        if(container == null) return null;

        const list = this.createWindow('price_display') as unknown as IItemListWindow | null;

        if(list == null) return null;

        while(container.numChildren > 0)
        {
            container.removeChildAt(0)!.dispose();
        }

        return list;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::getPriceArray()
    private getPriceArray(offer: IPurchasableOffer, amount: number, showSeasonalAsCredits: boolean): IPriceEntry[]
    {
        const prices: IPriceEntry[] = [];

        if(offer.priceInCredits > 0)
        {
            const value = this.calculateBundlePrice(offer.bundlePurchaseAllowed, offer.priceInCredits, amount);
            const unit = showSeasonalAsCredits ? this._catalog!.getSeasonalCurrencyActivityPointType() : -1;

            prices.push({amount: value, unit});
        }

        if(offer.priceInActivityPoints > 0)
        {
            const value = this.calculateBundlePrice(offer.bundlePurchaseAllowed, offer.priceInActivityPoints, amount);

            prices.push({amount: value, unit: offer.activityPointType});
        }

        if(offer.priceInSilver > 0)
        {
            prices.push({amount: offer.priceInSilver, unit: ActivityPointTypeEnum.SILVER});
        }

        if(offer.priceInEmerald > 0)
        {
            prices.push({amount: offer.priceInEmerald, unit: ActivityPointTypeEnum.EMERALD});
        }

        if(prices.length === 0)
        {
            prices.push({amount: 0, unit: -1});
        }

        return prices;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::getPriceMap()
    getPriceMap(offer: IPurchasableOffer, amount: number): Map<string, {amount: number; activityPointType?: number}>
    {
        const prices = new Map<string, {amount: number; activityPointType?: number}>();

        if(offer.priceInCredits > 0)
        {
            const value = this.calculateBundlePrice(offer.bundlePurchaseAllowed, offer.priceInCredits, amount);

            prices.set('credit', {amount: value});
        }

        if(offer.priceInActivityPoints > 0)
        {
            const value = this.calculateBundlePrice(offer.bundlePurchaseAllowed, offer.priceInActivityPoints, amount);

            prices.set('activityPoint', {amount: value, activityPointType: offer.activityPointType});
        }

        if(offer.priceInSilver > 0)
        {
            prices.set('silver', {amount: offer.priceInSilver});
        }

        if(prices.size === 0)
        {
            prices.set('credit', {amount: 0});
        }

        return prices;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::showPriceOnProduct()
    // Positions the price box relative to a room_canvas_container/fallback target and colours it
    // per currency: credits-only, activity-points-only, seasonal, or silver.
    showPriceOnProduct(
        offer: IPurchasableOffer,
        container: IWindowContainer,
        existing: IWindow | null,
        fallbackTarget: IWindow | null,
        xOffset: number,
        alignTop: boolean,
        yOffset: number,
        showBig: boolean = false,
        combo: boolean = false
    ): IWindow | null
    {
        if(existing != null)
        {
            container.removeChild(existing);
            existing.dispose();
        }

        const priceBox = this.createWindow('priceDisplayWidget')!;

        container.addChild(priceBox);

        const priceBoxContainer = container.findChildByName('price_box_new') as unknown as IWindowContainer | null;

        if(priceBoxContainer != null)
        {
            this.showPriceInContainer(priceBoxContainer, offer, 1, showBig, combo);

            let anchor = container.findChildByName('room_canvas_container');

            if(anchor == null)
            {
                anchor = fallbackTarget;
            }

            if(anchor != null)
            {
                priceBox.x = anchor.x + anchor.width + xOffset - priceBox.width;
                priceBox.y = alignTop ? anchor.y + yOffset : anchor.y + anchor.height - (priceBox.height + yOffset);
            }

            if(offer.priceInActivityPoints === 0)
            {
                priceBox.color = 14992765;
            }

            if(offer.priceInCredits === 0)
            {
                if(offer.activityPointType === 0)
                {
                    priceBox.color = 11257559;
                }
                else if(ActivityPointTypeEnum.isSeasonal(offer.activityPointType))
                {
                    priceBox.color = this.getSeasonalCurrencyPriceColor(offer.activityPointType);
                }
                else
                {
                    priceBox.color = HabboCatalogUtils.DEFAULT_PRICE_BOX_COLOR;
                }
            }

            if(offer.priceInSilver > 0)
            {
                priceBox.color = 15790320;
            }
        }

        return priceBox;
    }

    /**
     * AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::getSeasonalCurrencyPriceColor()
     *
     * A seasonal currency's price box takes its colour from the hotel config, resolved in three
     * hops: point type -> currency id -> preset name -> border colour. Each hop falls back to the
     * default box colour when its property is unseeded, which is how a hotel that ships no
     * seasonal config still renders. `getProperty()` returns '' for a missing key, so the `=== ''`
     * tests are AS3's own comparisons unchanged.
     */
    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::getSeasonalCurrencyPriceColor()
    private getSeasonalCurrencyPriceColor(activityPointType: number): number
    {
        if(!ActivityPointTypeEnum.isSeasonal(activityPointType)) return HabboCatalogUtils.DEFAULT_PRICE_BOX_COLOR;

        const currencyId = this._catalog?.getProperty(`seasonalcurrency.id.${activityPointType}`) ?? '';

        if(currencyId === '') return HabboCatalogUtils.DEFAULT_PRICE_BOX_COLOR;

        const preset = this._catalog?.getProperty(`seasonalcurrency.${currencyId}.color`) ?? '';

        if(preset === '') return HabboCatalogUtils.DEFAULT_PRICE_BOX_COLOR;

        return ColorConverter.hexToUint(this._catalog?.getProperty(`seasonalcurrency.preset.${preset}.border`) ?? '');
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::get bundleDiscountFlatPriceSteps()
    get bundleDiscountFlatPriceSteps(): number[]
    {
        return this._bundleDiscountFlatPriceSteps;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::get bundleDiscountHighestFlatPriceStep()
    get bundleDiscountHighestFlatPriceStep(): number
    {
        return this._bundleDiscountHighestFlatPriceStep;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::resolveBundleDiscountFlatPriceSteps()
    resolveBundleDiscountFlatPriceSteps(): void
    {
        this._bundleDiscountFlatPriceSteps = [];
        this._bundleDiscountHighestFlatPriceStep = 0;

        for(let quantity = 0; quantity < 99; quantity++)
        {
            const price = this.calculateBundlePrice(true, 1, quantity);
            const nextPrice = this.calculateBundlePrice(true, 1, quantity + 1);

            if(price === nextPrice)
            {
                this._bundleDiscountFlatPriceSteps.push(quantity);
                this._bundleDiscountHighestFlatPriceStep = quantity;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::getDiscountItemsCount()
    getDiscountItemsCount(quantity: number): number
    {
        let count = this.getBasicBundleDiscountSize(quantity);

        count += this.getBonusBundleDiscountSize(quantity);

        return Math.trunc(count + this.getThresholdBundleDiscountSize(quantity));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::getBasicBundleDiscountSize()
    private getBasicBundleDiscountSize(quantity: number): number
    {
        const ruleset = this._catalog?.bundleDiscountRuleset ?? null;

        if(!ruleset || ruleset.bundleSize <= 0)
        {
            return 0;
        }

        // AS3 assigns `param1 / bundleSize` to an `int` local, which truncates toward zero.
        const bundles = Math.trunc(quantity / ruleset.bundleSize);

        return bundles * ruleset.bundleDiscountSize;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::getBonusBundleDiscountSize()
    private getBonusBundleDiscountSize(quantity: number): number
    {
        const ruleset = this._catalog?.bundleDiscountRuleset ?? null;

        if(!ruleset || ruleset.bundleSize <= 0)
        {
            return 0;
        }

        const bundles = Math.trunc(quantity / ruleset.bundleSize);
        let bonus = 0;

        if(bundles >= ruleset.bonusThreshold)
        {
            const remainder = quantity % ruleset.bundleSize;

            if(remainder === ruleset.bundleSize - 1)
            {
                bonus++;
            }

            bonus += bundles - ruleset.bonusThreshold;
        }

        return bonus;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::getThresholdBundleDiscountSize()
    private getThresholdBundleDiscountSize(quantity: number): number
    {
        const ruleset = this._catalog?.bundleDiscountRuleset ?? null;
        let count = 0;

        if(ruleset)
        {
            for(const threshold of ruleset.additionalBonusDiscountThresholdQuantities)
            {
                if(quantity >= threshold)
                {
                    count++;
                }
            }
        }

        return count;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::spinnerValueChangedEventTrack()
    // TS simplification: AS3 hand-rolls a "log once" boolean flag per method, identical to what
    // HabboTracking.trackEventLogOncePerSession() already generalizes (keyed by type+value+unit) -
    // since one HabboCatalogUtils instance lives exactly as long as one HabboCatalog/session, the
    // two scopes are equivalent here, so this delegates instead of duplicating the flag fields.
    spinnerValueChangedEventTrack(): void
    {
        this._catalog?.tracking?.trackEventLogOncePerSession('Catalog', 'spinnerValueChanged', 'client.bundle.discounts');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::bundlesInfoShownEventTrack()
    bundlesInfoShownEventTrack(): void
    {
        this._catalog?.tracking?.trackEventLogOncePerSession('Catalog', 'bundlesInfoOpened', 'client.bundle.discounts');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::discountShownEventTrack()
    discountShownEventTrack(): void
    {
        this._catalog?.tracking?.trackEventLogOncePerSession('Catalog', 'discountItemShown', 'client.bundle.discounts');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::showVipBenefits()
    showVipBenefits(): void
    {
        if(this._catalog?.getBoolean('catalog.vip.benefits.enabled'))
        {
            if(this._vipBenefitsWindow == null || this._vipBenefitsWindow.disposed)
            {
                this._vipBenefitsWindow = new VipBenefitsWindow(this._catalog);
            }
        }
        else
        {
            this.openLink(this._catalog?.getProperty('link.format.club') ?? '');
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::openLink()
    openLink(url: string): void
    {
        if(url !== '')
        {
            this._catalog?.windowManager?.alert('${catalog.alert.external.link.title}', '${catalog.alert.external.link.desc}', 0, (dialog) => dialog.dispose());
            HabboWebTools.openWebPage(url, 'habboMain');
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::showExtraOnProduct()
    // The two extras a product tile can carry in its corner: a badge (type 4) or a chat-style
    // preview (type 9). `code` is the badge name in the first case, the style id in the second.
    showExtraOnProduct(type: number, code: string, container: IWindowContainer, xOffset: number, yOffset: number, alignTop: boolean = true, alignLeft: boolean = true): void
    {
        let widgetWindow = container.findChildByName(HabboCatalogUtils.BADGE_CHATSTYLE_WIDGET_NAME) as unknown as IWindowContainer | null;

        if(widgetWindow == null)
        {
            widgetWindow = this.createWindow('badgeDisplayWidget') as unknown as IWindowContainer;
            widgetWindow.name = HabboCatalogUtils.BADGE_CHATSTYLE_WIDGET_NAME;
        }

        const assetImage = widgetWindow.findChildByName('asset_image') as unknown as IStaticBitmapWrapperWindow;
        const badgeImageHost = widgetWindow.findChildByName('badge_image') as unknown as IWidgetWindow;
        const chatStyle = widgetWindow.findChildByName('chat_style') as unknown as IBitmapWrapperWindow;

        if(type === 9)
        {
            assetImage.assetUri = 'catalogue_chatstyle_background';
            badgeImageHost.visible = false;
            chatStyle.visible = true;
            // AS3 clones the style's preview because assigning a BitmapData hands its lifetime to
            // the window; the port's wrapper does not own what it is given, so the library's
            // ImageBitmap is passed straight through and survives the window's disposal.
            chatStyle.bitmap = this._catalog?.freeFlowChat?.chatStyleLibrary?.getStyle(parseInt(code))?.selectorPreview ?? null;
        }
        else if(type === 4)
        {
            assetImage.assetUri = 'catalogue_badge_background';
            badgeImageHost.visible = true;
            chatStyle.visible = false;
            (badgeImageHost.widget as IBadgeImageWidget).badgeId = code;
        }

        widgetWindow.width = assetImage.width;
        widgetWindow.height = assetImage.height;
        container.addChild(widgetWindow);
        widgetWindow.x = alignLeft ? xOffset : container.width - widgetWindow.width - xOffset;
        widgetWindow.y = alignTop ? yOffset : container.height - widgetWindow.height - yOffset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::hideExtraFromProduct()
    hideExtraFromProduct(container: IWindowContainer): void
    {
        const widgetWindow = container.findChildByName(HabboCatalogUtils.BADGE_CHATSTYLE_WIDGET_NAME);

        if(widgetWindow != null)
        {
            container.removeChild(widgetWindow);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/HabboCatalogUtils.as::showAssetImageAsBadgeOnProduct()
    showAssetImageAsBadgeOnProduct(assetName: string, container: IWindowContainer, xOffset: number, yOffset: number, alignTop: boolean = true, alignLeft: boolean = true): void
    {
        let widgetWindow = container.findChildByName(HabboCatalogUtils.BADGE_CHATSTYLE_WIDGET_NAME) as unknown as IWindowContainer | null;

        if(widgetWindow == null)
        {
            widgetWindow = this.createWindow('badgeDisplayWidget') as unknown as IWindowContainer;
            widgetWindow.name = HabboCatalogUtils.BADGE_CHATSTYLE_WIDGET_NAME;
        }

        widgetWindow.findChildByName('chat_style')!.visible = false;
        widgetWindow.findChildByName('badge_image')!.visible = false;

        const badgeImage = widgetWindow.findChildByName('badge_image') as unknown as IStaticBitmapWrapperWindow;

        badgeImage.assetUri = assetName;
        widgetWindow.width = badgeImage.width;
        widgetWindow.height = badgeImage.height;
        container.addChild(widgetWindow);
        widgetWindow.x = alignLeft ? xOffset : container.width - widgetWindow.width - xOffset;
        widgetWindow.y = alignTop ? yOffset : container.height - widgetWindow.height - yOffset;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::setCatalogItemImage()
    setCatalogItemImage(target: IBitmapWrapperWindow, assetName: string): void
    {
        if(target == null) return;

        const asset = this._catalog!.assets!.getAssetByName(assetName);

        if(asset == null) return;

        const image = asset.content as ImageBitmap;

        if(image == null) return;

        target.bitmap = image;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::calculateBundlePrice()
    calculateBundlePrice(_bundlePurchaseAllowed: boolean, unitPrice: number, amount: number): number
    {
        return unitPrice * amount;
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::displayProductIcon()
    displayProductIcon(productType: string, classId: number, target: IBitmapWrapperWindow): void
    {
        if(this._catalog == null) return;

        let result = null;

        switch(productType)
        {
            case 's':
                result = this._catalog.roomEngine!.getFurnitureIcon(classId, this);
                break;
            case 'i':
                result = this._catalog.roomEngine!.getWallItemIcon(classId, this);
                break;
            case 'e':
                target.bitmap = this._catalog.getPixelEffectIcon(classId);
                break;
            case 'h':
                target.bitmap = this._catalog.getSubscriptionProductIcon(classId);
                break;
        }

        if(result != null)
        {
            target.bitmap = result.data;

            if(result.id !== 0)
            {
                let pending = this._productBitmapWrappers.get(result.id);

                if(pending == null)
                {
                    pending = [];
                    this._productBitmapWrappers.set(result.id, pending);
                }

                pending.push(target);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::imageReady()
    imageReady(id: number, image: ImageBitmap | null): void
    {
        const pending = this._productBitmapWrappers.get(id);

        if(pending == null) return;

        for(const target of pending)
        {
            target.bitmap = image;
        }

        this._productBitmapWrappers.delete(id);
    }

    // AS3: .../src/com/sulake/habbo/catalog/HabboCatalogUtils.as::imageFailed()
    imageFailed(_id: number): void
    {
    }

    // AS3's HabboCatalog itself doubles as a config accessor (getBoolean/getInteger/getProperty
    // from the shared Component base) - cast narrowly to the subset getIconStyleFor() actually uses.
    private configuration(): IHabboConfigurationManager
    {
        return this._catalog as unknown as IHabboConfigurationManager;
    }
}
