import type {IWindowContainer} from '@core/window/IWindowContainer';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {HabboCatalog} from '../../HabboCatalog';
import type {IPurchasableOffer} from '../../IPurchasableOffer';
import type {IProduct} from '../IProduct';
import {SelectProductEvent} from './events/SelectProductEvent';
import {SetExtraPurchaseParameterEvent} from './events/SetExtraPurchaseParameterEvent';
import {CatalogWidgetPurchaseOverrideEvent} from './events/CatalogWidgetPurchaseOverrideEvent';
import {CatalogWidgetInitPurchaseEvent} from './events/CatalogWidgetInitPurchaseEvent';
import {SetRoomPreviewerStuffDataEvent} from './events/SetRoomPreviewerStuffDataEvent';
import {CatalogWidgetSpinnerEvent} from './events/CatalogWidgetSpinnerEvent';
import {CatalogWidgetToggleEvent} from './events/CatalogWidgetToggleEvent';
import type {CatalogWidgetEvent} from './events/CatalogWidgetEvent';
import {RentUtils} from './utils/RentUtils';
import {CatalogWidgetName} from './CatalogWidgetName';
import {CatalogWidget} from './CatalogWidget';

/**
 * The buy/gift button bar for the currently selected offer.
 *
 * **The club-upsell stub is not a gap — it is dead in the 2026 client**, checked 2026-09-05 against
 * the primary tree (this used to carry a marker saying the port owed it). `PurchaseCatalogWidget.as`
 * declares `_SafeStr_6480`, the stub window, and the only three things it ever does with it are
 * *test it for null* (l.130, l.176) and *tear it down* (l.132-135). Nothing assigns it. The XML it
 * would be built from, `purchaseWidgetBuyVipStub`, is loaded into `_stubPurchaseVipXML` at l.110
 * and read by nothing. So `attachStub()` is a husk whose branch cannot fire, `_SafeStr_6480` is
 * permanently null, and `enableBuyButton()`/`enableGiftButton()` take the normal path in Flash for
 * exactly the reason they do here. Same in `win63_version`. Porting the husk would add a method
 * that can only ever no-op.
 *
 * The room-ad half is no longer a gap: `HabboCatalog.roomAdPurchaseData` is a real accessor and is
 * what switches `purchaseProduct()` over to `PurchaseRoomAdMessageComposer`.
 *
 * @see sources/win63_version/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as
 */
export class PurchaseCatalogWidget extends CatalogWidget
{
    private static readonly CWE_EXTRA_PARAM_REQUIRED_FOR_BUY = 'CWE_EXTRA_PARAM_REQUIRED_FOR_BUY';

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::_catalog
    private _catalog: HabboCatalog | null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::_offer
    private _offer: IPurchasableOffer | null = null;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::_additionalParameters
    private _additionalParameters: string = '';

    private _previewStuffData: IStuffData | null = null;

    private _quantity: number = 1;

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::_purchaseCallback
    private _purchaseCallback: ((event: WindowMouseEvent) => void) | null = null;

    private _noGiftOption: boolean = false;

    private _extraParamRequired: boolean = false;

    private _enabled: boolean = true;

    constructor(window: IWindowContainer, catalog: HabboCatalog)
    {
        super(window);
        this._catalog = catalog;
    }

    override dispose(): void
    {
        if(this.disposed) return;

        this.events.off(SelectProductEvent.SELECT_PRODUCT, this.onSelectProduct);
        this.events.off(SetExtraPurchaseParameterEvent.CWE_SET_EXTRA_PARM, this.onSetParameter);
        this.events.off(CatalogWidgetPurchaseOverrideEvent.PURCHASE_OVERRIDE, this.onPurchaseOverride);
        this.events.off(SetRoomPreviewerStuffDataEvent.CWE_SET_PREVIEWER_STUFFDATA, this.onSetPreviewerStuffData);
        this.events.off(CatalogWidgetToggleEvent.CWE_TOGGLE, this.onToggleWidget);
        this._catalog = null;
        super.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::onToggleWidget()
    private onToggleWidget = (event: CatalogWidgetToggleEvent): void =>
    {
        if(event.widgetId === 'purchaseWidget')
        {
            this._enabled = event.enabled;
            this.window.visible = this._enabled;
        }
    };

    override init(): boolean
    {
        if(!super.init()) return false;

        this.attachWidgetView(CatalogWidgetName.PURCHASE);
        this.window.findChildByName('selection_information')!.visible = true;
        this.window.findChildByName('default_buttons')!.visible = false;
        this._noGiftOption = false;

        if(this.window.tags.indexOf('ROOM_INITIATE_PURCHASE') > -1)
        {
            this._catalog!.sendRoomAdPurchaseInitiatedEvent();
        }

        this.window.findChildByName('buy_button')!.addEventListener(WindowMouseEvent.CLICK, this.onPurchase);

        const giftButton = this.window.findChildByName('gift_button');

        if(this.window.tags.indexOf('NO_GIFT_OPTION') > -1)
        {
            this._noGiftOption = true;
            giftButton!.visible = false;
        }

        giftButton!.addEventListener(WindowMouseEvent.CLICK, this.onGift);
        giftButton!.disable();

        this.events.on(SelectProductEvent.SELECT_PRODUCT, this.onSelectProduct);
        this.events.on(SetExtraPurchaseParameterEvent.CWE_SET_EXTRA_PARM, this.onSetParameter);
        this.events.on(CatalogWidgetPurchaseOverrideEvent.PURCHASE_OVERRIDE, this.onPurchaseOverride);
        this.events.on(CatalogWidgetInitPurchaseEvent.INIT_PURCHASE, this.initPurchase);
        this.events.on(SetRoomPreviewerStuffDataEvent.CWE_SET_PREVIEWER_STUFFDATA, this.onSetPreviewerStuffData);
        this.events.on(CatalogWidgetSpinnerEvent.VALUE_CHANGED, this.onSpinnerValueChanged);
        this.events.on(PurchaseCatalogWidget.CWE_EXTRA_PARAM_REQUIRED_FOR_BUY, this.onExtraParamRequired);
        this.events.on(CatalogWidgetToggleEvent.CWE_TOGGLE, this.onToggleWidget);

        return true;
    }

    private onPurchaseOverride = (event: CatalogWidgetPurchaseOverrideEvent): void =>
    {
        this._purchaseCallback = event.callback as ((event: WindowMouseEvent) => void) | null;
    };

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::get extraParamRequirementsMet()
    private get extraParamRequirementsMet(): boolean
    {
        return !(this._extraParamRequired && this._additionalParameters === '');
    }

    // DEVIATION: AS3 also refuses an already-owned habbicon offer; the RPG fork removed Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::get canPurchaseSelectedOffer()
    private get canPurchaseSelectedOffer(): boolean
    {
        return this.extraParamRequirementsMet;
    }

    // DEVIATION: AS3 captions an already-owned habbicon offer `${generic.owned}`; the RPG fork
    //   removed Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::updatePurchaseLabel()
    private updatePurchaseLabel(): void
    {
        const label = this.window.findChildByName('purchase_label');

        if(label == null) return;

        RentUtils.updateBuyCaption(this._offer, label);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::onSelectProduct()
    private onSelectProduct = (event: SelectProductEvent): void =>
    {
        this._quantity = 1;
        this._offer = event.offer;
        this.window.findChildByName('selection_information')!.visible = false;
        this.window.findChildByName('default_buttons')!.visible = true;
        this._catalog!.purchaseWillBeGift(false);

        this.enableBuyButton(this.canPurchaseSelectedOffer);
        this.enableGiftButton(this.canPurchaseSelectedOffer);
        this.updatePurchaseLabel();

        const giftButton = this.window.findChildByName('gift_button');

        if(giftButton != null)
        {
            giftButton.visible = !this._offer.isRentOffer && !this._noGiftOption;
        }

        if(!this._offer.giftable)
        {
            this.enableGiftButton(false);
        }

        if(this.isSoldOut(this._offer))
        {
            this.enableBuyButton(false);
            this.enableGiftButton(false);
        }

        this.window.visible = this._enabled;
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::isSoldOut()
    private isSoldOut(offer: IPurchasableOffer): boolean
    {
        if(offer.pricingModel !== 'pricing_model_single') return false;

        const product: IProduct | null = offer.product;

        if(product == null || !product.isUniqueLimitedItem) return false;

        return product.uniqueLimitedItemsLeft === 0;
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::enableBuyButton()
    private enableBuyButton(enabled: boolean): void
    {
        if(this._catalog!.sessionDataManager?.isAccountSafetyLocked())
        {
            enabled = false;
        }

        this.enableButton('buy_button', enabled);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::enableGiftButton()
    private enableGiftButton(enabled: boolean): void
    {
        if(this._catalog!.sessionDataManager?.isAccountSafetyLocked())
        {
            enabled = false;
        }

        this.enableButton('gift_button', enabled);
    }

    // AS3: .../src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::enableButton()
    private enableButton(name: string, enabled: boolean): void
    {
        const button = this.window.findChildByName(name);

        if(button == null) return;

        if(enabled)
        {
            button.enable();
            button.blend = 1;
        }
        else
        {
            button.disable();
            button.blend = 0.5;
        }
    }

    private onSetParameter = (event: SetExtraPurchaseParameterEvent): void =>
    {
        this._additionalParameters = event.parameter;
        this.enableBuyButton(this.canPurchaseSelectedOffer);
        this.enableGiftButton(this._offer != null && this._offer.giftable && this.canPurchaseSelectedOffer && this._quantity === 1);
    };

    // DEVIATION: AS3 first refuses an already-owned habbicon offer; the RPG fork removed Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::onPurchase()
    private onPurchase = (event: WindowMouseEvent, isGift: boolean = false): void =>
    {
        if(this._offer == null) return;

        if(!this._catalog!.verifyClubLevel(this._offer.clubLevel))
        {
            this._catalog!.openClubCenter();

            return;
        }

        this._catalog!.purchaseWillBeGift(isGift);

        if(this._purchaseCallback == null)
        {
            const roomAdPurchaseData = this._catalog!.roomAdPurchaseData;

            if(roomAdPurchaseData != null && roomAdPurchaseData.offerId === this._offer.offerId)
            {
                if(roomAdPurchaseData.flatId === 0)
                {
                    this._catalog!.windowManager!.alert('${roomad.error.title}', '${roomad.alert.no.available.room}', 0, (dialog) =>
                    {
                        dialog.dispose();
                    });

                    return;
                }

                if(roomAdPurchaseData.name == null || roomAdPurchaseData.name.length < 5 || roomAdPurchaseData.name.substring(0, 1) === ' ')
                {
                    this._catalog!.windowManager!.alert('${roomad.error.title}', '${roomad.alert.name.empty}', 0, (dialog) =>
                    {
                        dialog.dispose();
                    });

                    return;
                }
            }

            this._catalog!.showPurchaseConfirmation(this._offer, this.page.pageId, this._additionalParameters, this._quantity, this._previewStuffData, null);
        }
        else
        {
            this._purchaseCallback(event);
        }
    };

    private onGift = (event: WindowMouseEvent): void =>
    {
        this.onPurchase(event, true);

        // AS3 reaches the tracking singleton; this port has no singleton, and the catalog that
        // owns the widget already holds the same component (`HabboCatalog.tracking`).
        this._catalog?.tracking?.trackEventLog('Catalog', 'click', 'client.buy_as_gift.clicked');
    };

    // DEVIATION: AS3 first refuses an already-owned habbicon offer; the RPG fork removed Habbicons.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::initPurchase()
    private initPurchase = (_event: CatalogWidgetInitPurchaseEvent): void =>
    {
        if(this._offer != null)
        {
            this._catalog!.showPurchaseConfirmation(this._offer, this.page.pageId, this._additionalParameters, this._quantity, this._previewStuffData, null);
        }
    };

    /**
     * Wired to nothing, here and in AS3: the handler exists but no `addEventListener` for it does,
     * in either tree. Kept so the member is present if a layout ever grows the button.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/viewer/widgets/PurchaseCatalogWidget.as::onBuyClub()
    private onBuyClub = (_event: WindowMouseEvent): void =>
    {
        this._catalog!.rememberPageDuringVipPurchase(this.page.pageId);
        this._catalog!.openClubCenter();
        this._catalog!.tracking?.trackEventLog('Catalog', 'click', 'BUY_CLUB');
    };

    private onSetPreviewerStuffData = (event: SetRoomPreviewerStuffDataEvent): void =>
    {
        this._previewStuffData = event.stuffData;
    };

    private onSpinnerValueChanged = (event: CatalogWidgetSpinnerEvent): void =>
    {
        this._quantity = event.value;

        if(this._quantity > 1)
        {
            this.enableGiftButton(false);
        }
        else if(this._offer != null && this.extraParamRequirementsMet)
        {
            this.enableGiftButton(this._offer.giftable && this.canPurchaseSelectedOffer);
        }
    };

    private onExtraParamRequired = (_event: CatalogWidgetEvent): void =>
    {
        this._extraParamRequired = true;
        this.enableBuyButton(this.canPurchaseSelectedOffer);
        this.enableGiftButton(this._offer != null && this.canPurchaseSelectedOffer && this._quantity === 1);
    };
}
