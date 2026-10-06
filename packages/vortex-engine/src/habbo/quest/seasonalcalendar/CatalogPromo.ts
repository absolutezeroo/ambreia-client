import type {IDisposable} from '@core/runtime';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IWindow} from '@core/window/IWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IGetImageListener} from '@habbo/room/IGetImageListener';
import type {IProductDataListener} from '@habbo/session/product/IProductDataListener';
import {SeasonalCalendarDailyOfferMessageEvent} from '@habbo/communication/messages/incoming/catalog/SeasonalCalendarDailyOfferMessageEvent';
import {CatalogPublishedMessageEvent} from '@habbo/communication/messages/incoming/catalog/CatalogPublishedMessageEvent';
import {GetSeasonalCalendarDailyComposer} from '@habbo/communication/messages/outgoing/catalog/GetSeasonalCalendarDailyComposer';
import type {ClubOfferProductData} from '@habbo/communication/messages/parser/catalog/ClubOfferProductData';
// AS3 imports `com.sulake.habbo.roomevents.Util`, which went with wired (RPG fork); the navigator's
// `hideChildren()` has the same body.
import {Util} from '@habbo/navigator/Util';
import {Vector3d} from '@room/utils/Vector3d';
import type {HabboQuestEngine} from '../HabboQuestEngine';
import type {MainWindow} from './MainWindow';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.quest.seasonalcalendar.CatalogPromo');

/**
 * The seasonal calendar footer's "today's daily offer" panel: a furni preview, its catalogue
 * price, and a buy button that jumps straight to the catalogue page.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/seasonalcalendar/CatalogPromo.as
 */
export class CatalogPromo implements IDisposable, IGetImageListener, IProductDataListener
{
    // AS3: .../CatalogPromo.as::_questEngine
    private _questEngine: HabboQuestEngine | null;
    // AS3: .../CatalogPromo.as::_window
    private _window: IWindowContainer | null = null;
    // AS3: .../CatalogPromo.as::_SafeStr_4568 (name DERIVED — obfuscated in every available tree).
    private _connection: IConnection | null = null;
    // AS3: .../CatalogPromo.as::_SafeStr_4565 (name DERIVED — obfuscated in every available
    // tree). Stored but never read again after the constructor, matching AS3 exactly.
    private _mainWindow: MainWindow | null;
    // AS3: .../CatalogPromo.as::_SafeStr_6321 (name DERIVED — obfuscated in every available
    // tree). The one product from today's offer this panel previews.
    private _pendingOffer: ClubOfferProductData | null = null;
    // AS3: .../CatalogPromo.as::_offerId
    private _offerId: number = -1;
    // AS3: .../CatalogPromo.as::_SafeStr_7494 (name DERIVED — obfuscated in every available tree).
    private _pageId: number = -1;
    // AS3: .../CatalogPromo.as::_SafeStr_8565 (name DERIVED — obfuscated in every available
    // tree). The offer event received before product data was ready to resolve it; replayed
    // from `productDataReady()`.
    private _pendingOfferEvent: SeasonalCalendarDailyOfferMessageEvent | null = null;
    // AS3: .../CatalogPromo.as::_SafeStr_6664 (name DERIVED — obfuscated in every available tree).
    private _dailyOfferMessageEvent: IMessageEvent | null = null;
    // AS3: .../CatalogPromo.as::_SafeStr_6698 (name DERIVED — obfuscated in every available tree).
    private _catalogPublishedMessageEvent: IMessageEvent | null = null;

    // AS3: .../CatalogPromo.as::CatalogPromo()
    constructor(questEngine: HabboQuestEngine, mainWindow: MainWindow)
    {
        this._questEngine = questEngine;
        this._mainWindow = mainWindow;
    }

    // AS3: .../CatalogPromo.as::dispose()
    dispose(): void
    {
        if(this._connection)
        {
            if(this._dailyOfferMessageEvent)
            {
                this._connection.removeMessageEvent(this._dailyOfferMessageEvent);
                this._dailyOfferMessageEvent = null;
            }

            if(this._catalogPublishedMessageEvent)
            {
                this._connection.removeMessageEvent(this._catalogPublishedMessageEvent);
                this._catalogPublishedMessageEvent = null;
            }

            this._connection = null;
        }

        this._questEngine = null;
    }

    // AS3: .../CatalogPromo.as::get disposed()
    get disposed(): boolean
    {
        return this._questEngine === null;
    }

    // AS3: .../CatalogPromo.as::onActivityPoints()
    onActivityPoints(type: number, amount: number): void
    {
        if(type !== this.getActivityPointType()) return;

        this._questEngine?.localization?.registerParameter('quests.seasonalcalendar.promo.balance', 'amount', String(amount));

        if(this._window !== null) this.refresh();
    }

    // AS3: .../CatalogPromo.as::getActivityPointType()
    private getActivityPointType(): number
    {
        const raw = this._questEngine?.getProperty('seasonalQuestCalendar.currency') ?? '';

        return isNaN(Number(raw)) ? 0 : parseInt(raw, 10);
    }

    // AS3: .../CatalogPromo.as::prepare()
    prepare(container: IWindowContainer): void
    {
        this._window = container.findChildByName('catalog_promo_cont') as unknown as IWindowContainer | null;

        const buyButton = this._window?.findChildByName('buy_button') ?? null;

        buyButton?.disable();

        if(buyButton) buyButton.procedure = this.onBuyButton;

        this._connection = this._questEngine?.communicationManager?.connection ?? null;

        if(this._connection !== null)
        {
            this._dailyOfferMessageEvent = new SeasonalCalendarDailyOfferMessageEvent(this.onDailyOfferMessage);
            this._catalogPublishedMessageEvent = new CatalogPublishedMessageEvent(this.onCatalogPublished);

            this._connection.addMessageEvent(this._dailyOfferMessageEvent);
            this._connection.addMessageEvent(this._catalogPublishedMessageEvent);
            this._connection.send(new GetSeasonalCalendarDailyComposer());
        }
    }

    // AS3: .../CatalogPromo.as::refresh()
    refresh(): void
    {
        if(this._window === null) return;

        const balanceText = this._window.findChildByName('your_balance_txt') as ITextWindow | null;
        const currencyIconContainer = this._window.findChildByName('currency_icon_cont') as unknown as IWindowContainer | null;

        if(balanceText !== null && currencyIconContainer !== null)
        {
            currencyIconContainer.x = balanceText.x + balanceText.width;
            Util.hideChildren(currencyIconContainer);

            const icon = currencyIconContainer.findChildByName(`currency_icon_${this.getActivityPointType()}`);

            if(icon !== null) icon.visible = true;
        }

        if(this._pendingOffer === null) return;

        const roomEngine = this._questEngine?.roomEngine ?? null;
        const direction = new Vector3d(90, 0, 0);

        const result = this._pendingOffer.productType === 'i'
            ? roomEngine?.getWallItemImage(this._pendingOffer.furniClassId, direction, 64, this, 0, this._pendingOffer.extraParam)
            : this._pendingOffer.productType === 's'
                ? roomEngine?.getFurnitureImage(this._pendingOffer.furniClassId, direction, 64, this)
                : null;

        if(result !== null && result !== undefined && result.data !== null) this.setPromoFurniImage(result.data);
    }

    // AS3: .../CatalogPromo.as::imageReady()
    imageReady(_id: number, data: ImageBitmap | null): void
    {
        this.setPromoFurniImage(data);
    }

    // AS3: .../CatalogPromo.as::imageFailed()
    imageFailed(_id: number): void
    {
    }

    // AS3: .../CatalogPromo.as::onBuyButton()
    private onBuyButton = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK) return;

        log.debug('Buy button clicked');

        if(this._offerId !== -1)
        {
            this._questEngine?.catalog?.openCatalogPageById(this._pageId, this._offerId, 'NORMAL');
        }
    };

    // AS3: .../CatalogPromo.as::onDailyOfferMessage()
    private onDailyOfferMessage = (event: IMessageEvent): void =>
    {
        const offerEvent = event as SeasonalCalendarDailyOfferMessageEvent;
        const offer = offerEvent.offer;

        if(offer === null) return;

        const buyButton = this._window?.findChildByName('buy_button') ?? null;

        buyButton?.enable();

        const productData = this._questEngine?.sessionDataManager?.getProductData(offer.localizationId) ?? null;

        if(productData !== null)
        {
            const promoInfo = (this._window?.findChildByName('promo_info') ?? null) as ITextWindow | null;

            if(promoInfo !== null) promoInfo.text = productData.name;

            this._pageId = offerEvent.pageId;
            this._offerId = offer.offerId;

            if(offer.products.length > 0)
            {
                this._pendingOffer = offer.products[0];
                this.refresh();
            }
        }
        else if(this._pendingOfferEvent === null)
        {
            this._pendingOfferEvent = offerEvent;
            this._questEngine?.sessionDataManager?.addProductsReadyEventListener(this);
        }
    };

    // AS3: .../CatalogPromo.as::productDataReady()
    productDataReady(): void
    {
        if(this._pendingOfferEvent !== null) this.onDailyOfferMessage(this._pendingOfferEvent);
    }

    // AS3: .../CatalogPromo.as::setPromoFurniImage()
    //
    // TS deviation: AS3 crops the source `BitmapData` into a freshly allocated one the size of
    // `furni_preview`, centring the crop when the source is larger and centring the placement
    // when it is smaller. A canvas exactly the target size achieves the same result with a single
    // `drawImage()` — anything outside the canvas is clipped, which is exactly what the manual
    // crop math computes by hand.
    private setPromoFurniImage(bitmap: ImageBitmap | null): void
    {
        if(bitmap === null) return;

        const preview = (this._window?.findChildByName('furni_preview') ?? null) as unknown as IBitmapWrapperWindow | null;

        if(preview === null) return;

        const width = Math.max(1, preview.width);
        const height = Math.max(1, preview.height);
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext('2d');

        if(context === null) return;

        context.drawImage(bitmap, Math.trunc((width - bitmap.width) / 2), Math.trunc((height - bitmap.height) / 2));

        preview.bitmap = canvas.transferToImageBitmap();
    }

    // AS3: .../CatalogPromo.as::onCatalogPublished()
    private onCatalogPublished = (_event: IMessageEvent): void =>
    {
        this._connection?.send(new GetSeasonalCalendarDailyComposer());
    };
}
