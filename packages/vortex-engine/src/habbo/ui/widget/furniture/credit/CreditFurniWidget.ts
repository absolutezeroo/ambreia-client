/**
 * CreditFurniWidget
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/credit/CreditFurniWidget.as
 *
 * The "exchange this furni for credits" confirmation. AS3 has a second wording for an NFT credit
 * furni, which the RPG fork removed with NFT.
 */
import type {EventEmitter} from 'eventemitter3';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import {RoomWidgetBase} from '@habbo/ui/widget/RoomWidgetBase';
import {RoomWidgetCreditFurniUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetCreditFurniUpdateEvent';
import {RoomWidgetCreditFurniRedeemMessage} from '@habbo/ui/widget/messages/RoomWidgetCreditFurniRedeemMessage';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';

export class CreditFurniWidget extends RoomWidgetBase
{
    /**
    * AS3: CreditFurniWidget.as::_SafeStr_10523 / _SafeStr_10928
    *
    * Both obfuscated and both 100 — the x and y AS3 passes to `createWindow()`'s Rectangle. Names
    * DERIVED from that call site, same pair as StickieFurniWidget's.
    */
    private static readonly WINDOW_X: number = 100;

    private static readonly WINDOW_Y: number = 100;

    // AS3: CreditFurniWidget.as::showInterface() — the window's own name and background tint.
    private static readonly WINDOW_NAME: string = 'creditfurniui_container';

    private static readonly WINDOW_COLOR: number = 33554431;

    // AS3: CreditFurniWidget.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: CreditFurniWidget.as::_SafeStr_6493
    private _objectId: number = -1;

    // AS3: CreditFurniWidget.as::_SafeStr_8218
    private _creditValue: number = 0;

    // AS3: CreditFurniWidget.as::CreditFurniWidget()
    constructor(
        // AS3: CreditFurniWidget.as::CreditFurniWidget() param1
        handler: IRoomWidgetHandler,
        // AS3: CreditFurniWidget.as::CreditFurniWidget() param2
        windowManager: IHabboWindowManager,
        // AS3: CreditFurniWidget.as::CreditFurniWidget() param3
        assets: IAssetLibrary | null,
        // AS3: CreditFurniWidget.as::CreditFurniWidget() param4
        localizations: IHabboLocalizationManager | null
    )
    {
        super(handler, windowManager, assets, localizations);
    }

    // AS3: CreditFurniWidget.as::registerUpdateEvents()
    public override registerUpdateEvents(dispatcher: EventEmitter): void
    {
        if(!dispatcher) return;

        dispatcher.on(RoomWidgetCreditFurniUpdateEvent.UPDATE_CREDIT_FURNI, this.onObjectUpdate, this);

        super.registerUpdateEvents(dispatcher);
    }

    // AS3: CreditFurniWidget.as::unregisterUpdateEvents()
    public override unregisterUpdateEvents(dispatcher: EventEmitter): void
    {
        if(!dispatcher) return;

        dispatcher.off(RoomWidgetCreditFurniUpdateEvent.UPDATE_CREDIT_FURNI, this.onObjectUpdate, this);
    }

    // AS3: CreditFurniWidget.as::onObjectUpdate()
    private onObjectUpdate(event: RoomWidgetCreditFurniUpdateEvent): void
    {
        this.hideInterface();

        this._objectId = event.objectId;
        this._creditValue = event.creditValue;

        this.showInterface();
    }

    /**
     * Rebuilds the window every time rather than reusing it — the caption depends on the furni,
     * so a second exchange dialog must not inherit the first one's text.
     *
     * AS3 creates the window itself and calls `buildFromXML()`; this port's window manager owns
     * both steps, so that becomes `buildWidgetLayout('credit_redeem')` plus the properties AS3
     * sets afterwards.
     */
    // DEVIATION: AS3 words an NFT credit furni differently, appends a prompt and hides the info
    //   link for it; the RPG fork removed NFT.
    // AS3: CreditFurniWidget.as::showInterface()
    private showInterface(): void
    {
        if(this._objectId === -1) return;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        const valueText = this.localizations?.getLocalizationWithParams(
            'widgets.furniture.credit.redeem.value', '', 'value', String(this._creditValue)
        ) ?? '';

        this._window = this.windowManager.buildWidgetLayout('credit_redeem') as IWindowContainer | null;

        if(this._window === null) return;

        this._window.name = CreditFurniWidget.WINDOW_NAME;
        this._window.x = CreditFurniWidget.WINDOW_X;
        this._window.y = CreditFurniWidget.WINDOW_Y;
        this._window.background = true;
        this._window.color = CreditFurniWidget.WINDOW_COLOR;

        const exchangeText = this._window.findChildByName('exchange_text');

        if(exchangeText !== null)
        {
            exchangeText.caption = valueText;
        }

        const cancel = this._window.findChildByName('cancel');

        if(cancel !== null) cancel.procedure = this.onMouseEvent;

        const exchange = this._window.findChildByName('exchange');

        if(exchange !== null) exchange.procedure = this.onMouseEvent;

        const link = this._window.findChildByName('link');

        if(link !== null)
        {
            link.visible = true;
            link.procedure = this.onMouseEvent;
        }

        // AS3 finds the close button by tag while dispatching on name, as the stickie does.
        const close = this._window.findChildByTag('close');

        if(close !== null) close.procedure = this.onWindowClose;

        this._window.procedure = this.onMouseEvent;
    }

    // AS3: CreditFurniWidget.as::hideInterface()
    private hideInterface(): void
    {
        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
        }

        this._objectId = -1;
        this._creditValue = 0;
    }

    /**
     * Closes only after the message is handed off, so a missing listener leaves the dialog open
     * rather than silently swallowing the exchange.
     */
    // AS3: CreditFurniWidget.as::sendRedeemMessage()
    private sendRedeemMessage(): void
    {
        if(this._objectId === -1) return;

        if(this.messageListener !== null)
        {
            this.messageListener.processWidgetMessage(
                new RoomWidgetCreditFurniRedeemMessage(RoomWidgetCreditFurniRedeemMessage.REDEEM, this._objectId)
            );

            this.hideInterface();
        }
    }

    /**
     * The link is only followed when the localized value really is a URL — AS3 checks the `http`
     * prefix, so an unresolved localization key never reaches the browser.
     */
    // AS3: CreditFurniWidget.as::onMouseEvent()
    private onMouseEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        switch(window.name)
        {
            case 'link': {
                const url = this.localizations?.getLocalization('widget.furni.info.url') ?? '';

                if(url.indexOf('http') === 0)
                {
                    HabboWebTools.navigateToURL(url, 'habboMain');
                }
                break;
            }
            case 'exchange':
                this.sendRedeemMessage();
                break;
            case 'cancel':
            case 'close':
                this.hideInterface();
                break;
        }
    };

    // AS3: CreditFurniWidget.as::onWindowClose()
    private onWindowClose = (event: WindowEvent, _window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        this.hideInterface();
    };

    // AS3: CreditFurniWidget.as::dispose()
    public override dispose(): void
    {
        this.hideInterface();

        super.dispose();
    }
}
