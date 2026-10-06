import type {TradingModel} from './TradingModel';
import type {IInventoryView} from '../IInventoryView';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IAssetLibrary} from '@core/assets';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IHTMLTextWindow} from '@core/window/components/IHTMLTextWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {AlertDialogCallback} from '@habbo/window/utils/AlertDialog';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {GroupItem} from '../items/GroupItem';
import type {OrderedMap} from '@core/utils/OrderedMap';
import {TradingState} from './TradingState';
import {Util} from '../Util';
import {ItemPopupCtrl} from '../ItemPopupCtrl';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {HabboInventory} from '../HabboInventory';
import {CreditTradingItem} from '../items/CreditTradingItem';
import {FurnitureCategory} from '../enum';
import {Logger} from '@core/utils/Logger';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.inventory.trading.TradingView');

/**
 * The trade window: two item grids, the accept/cancel pair, the countdown, the silver-fee row, the
 * per-side notices and the hover tooltip.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/trading/TradingView.as
 */
export class TradingView implements IInventoryView
{
    // AS3: .../TradingView.as::ALERT_SCAM
    static readonly ALERT_SCAM: number = 0;

    // AS3: .../TradingView.as::ALERT_OTHER_CANCELLED
    static readonly ALERT_OTHER_CANCELLED: number = 1;

    // AS3: .../TradingView.as::ALERT_ALREADY_OPEN
    static readonly ALERT_ALREADY_OPEN: number = 2;

    // AS3: .../TradingView.as::TRADE_UI_SPACING
    private static readonly TRADE_UI_SPACING: number = 7;

    // AS3: .../TradingView.as::COUNTDOWN_SECONDS
    // Name DERIVED: AS3 writes the 3 inline, as `new Timer(1000, 3)` and again in its handler.
    private static readonly COUNTDOWN_SECONDS: number = 3;

    // AS3: .../TradingView.as::_model
    private _model: TradingModel | null;

    // AS3: .../TradingView.as::_windowManager
    private _windowManager: IHabboWindowManager | null;

    // AS3: .../TradingView.as::_localization
    private _localization: IHabboLocalizationManager | null;

    // AS3: .../TradingView.as::_assets
    private _assets: IAssetLibrary | null;

    // AS3: .../src/com/sulake/habbo/inventory/trading/TradingView.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../TradingView.as::_visible
    private _visible: boolean = false;

    // AS3: .../TradingView.as::_window
    private _window: IWindowContainer | null = null;

    // AS3: .../TradingView.as::_windowMin
    private _windowMin: IWindowContainer | null = null;

    // AS3: .../TradingView.as::_countdownTimer
    // Name DERIVED (`_SafeStr_4902`): AS3's `Timer(1000, 3)`, here an interval plus its tick count.
    private _countdownTimer: ReturnType<typeof setInterval> | null = null;

    private _countdownCount: number = 0;

    // AS3: .../TradingView.as::_selectedItem
    private _selectedItem: GroupItem | null = null;

    // AS3: .../TradingView.as::_minimized
    private _minimized: boolean = false;

    // AS3: .../TradingView.as::_itemPopup
    private _itemPopup: ItemPopupCtrl | null = null;

    // AS3: .../TradingView.as::_soundManager
    private _soundManager: IHabboSoundManager | null;

    // DEVIATION: AS3 also listens for song info, to rename a song disk's tooltip after its song
    //   (`_waitingSongInfo`, the song-name getter, `onSongInfoReceivedEvent()`); the RPG fork
    //   removed jukebox music, so a song disk's tooltip shows its furni name.
    // AS3: .../TradingView.as::TradingView()
    // AS3 builds `item_popup_xml` into an `ItemPopupCtrl` here, hidden, and subscribes the sound
    // manager's `SIR_TRAX_SONG_INFO_RECEIVED`.
    constructor(
        model: TradingModel,
        windowManager: IHabboWindowManager | null,
        assets: IAssetLibrary | null,
        localization: IHabboLocalizationManager | null,
        soundManager: IHabboSoundManager | null
    )
    {
        this._model = model;
        this._windowManager = windowManager;
        this._assets = assets;
        this._localization = localization;
        this._soundManager = soundManager;
        this._visible = false;

        const popupWindow = windowManager?.buildWidgetLayout('item_popup_xml') as IWindowContainer | null;

        if(popupWindow !== null && popupWindow !== undefined && assets !== null)
        {
            this._itemPopup = new ItemPopupCtrl(popupWindow, assets, windowManager, model.getInventory());
        }
        else
        {
            log.warn('item_popup_xml did not build — trade thumbs will have no tooltip');
        }
    }

    // DEVIATION: AS3 takes a second map, the NFT list, appended after the furniture with its
    //   indices continuing on; the RPG fork removed NFT.
    // AS3: .../TradingView.as::updateItemsGrid()
    // Fills a grid from an item map, then blanks whatever tiles are left over.
    static updateItemsGrid(
        grid: IItemGridWindow | null,
        items: OrderedMap<string, GroupItem> | null
    ): void
    {
        if(grid === null || items === null) return;

        let index = 0;

        while(index < items.length)
        {
            const groupItem = items.getWithIndex(index);
            const gridItem = grid.getGridItemAt(index) as IWindowContainer | null;

            if(gridItem !== null && groupItem !== null)
            {
                gridItem.id = index;

                while(gridItem.numChildren > 0)
                {
                    gridItem.removeChildAt(0);
                }

                const itemWindow = groupItem.window;

                if(itemWindow !== null)
                {
                    gridItem.addChild(TradingView.fixItemWindow(itemWindow));
                    itemWindow.id = index;
                }

                groupItem.removeIntervalProcedure();
            }

            index++;
        }

        while(index < grid.numGridItems)
        {
            const gridItem = grid.getGridItemAt(index) as IWindowContainer | null;

            if(gridItem !== null)
            {
                gridItem.id = index;

                if(gridItem.numChildren > 0) gridItem.removeChildAt(0);

                gridItem.invalidate();
            }

            index++;
        }
    }

    // AS3: .../TradingView.as::fixItemWindow()
    // The trade grid's cells are 40x40 whatever the thumb layout says.
    private static fixItemWindow(window: IWindowContainer): IWindowContainer
    {
        window.height = 40;
        window.width = 40;

        for(let i = 0; i < window.numChildren; i++)
        {
            const child = window.getChildAt(i);

            if(child !== null) child.rectangle = {x: 0, y: 0, width: 40, height: 40};
        }

        return window;
    }

    // AS3: .../TradingView.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../TradingView.as::get visible()
    get visible(): boolean
    {
        return this._visible;
    }

    // AS3: .../TradingView.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: .../TradingView.as::setup()
    // Called as the trade opens: a side that may not trade gets its grid replaced by a notice, and
    // if neither side may, the help line says so too.
    setup(_ownUserId: number, ownUserCanTrade: boolean, _otherUserId: number, otherUserCanTrade: boolean): void
    {
        this.setMinimized(false);
        this.hideOwnUserNotification();
        this.hideOtherUserNotification();

        if(!ownUserCanTrade && !otherUserCanTrade)
        {
            this.showInfoMessage('${inventory.trading.warning.both_accounts_disabled}');
            this.showOwnUserNotification('');
            this.showOtherUserNotification('');

            return;
        }

        if(!ownUserCanTrade)
        {
            this.showOwnUserNotification('${inventory.trading.warning.own_account_disabled}');
        }

        if(!otherUserCanTrade)
        {
            this.showOtherUserNotification('${inventory.trading.warning.others_account_disabled}');
        }
    }

    // AS3: .../TradingView.as::getWindowContainer()
    // Both windows are built on first use; which one is returned depends on the minimised flag,
    // and the normal one is resized on the way out.
    getWindowContainer(): IWindowContainer | null
    {
        if(this._window === null)
        {
            this._window = this.createNormalWindow();
            this.showHighlightInfo(null);
        }

        if(this._windowMin === null)
        {
            this._windowMin = this.createMinimizedWindow();
        }

        if(!this._minimized)
        {
            this.resizeWindow(true);

            return this._window;
        }

        return this._windowMin;
    }

    // AS3: .../TradingView.as::setMinimized()
    setMinimized(minimized: boolean = false): void
    {
        this._minimized = minimized;
    }

    // AS3: .../TradingView.as::updateItemList()
    // The id decides which side is being redrawn — anything that is not the other user is us.
    updateItemList(userId: number): void
    {
        if(this._window === null || this._model === null) return;

        const isOtherUser = userId === this._model.otherUserId;
        const items = isOtherUser ? this._model.otherUserItems : this._model.ownUserItems;
        const grid = isOtherUser ? this.getOtherUsersItemGrid() : this.getOwnUsersItemGrid();

        TradingView.updateItemsGrid(grid, items);
        this.updateActionState();
    }

    // AS3: .../TradingView.as::clearItemLists()
    clearItemLists(): void
    {
        for(const grid of [this.getOwnUsersItemGrid(), this.getOtherUsersItemGrid()])
        {
            if(grid === null) continue;

            for(let i = 0; i < grid.numGridItems; i++)
            {
                const gridItem = grid.getGridItemAt(i) as IWindowContainer | null;

                if(gridItem === null) continue;

                gridItem.id = i;

                if(gridItem.numChildren > 0) gridItem.removeChildAt(0);
            }
        }
    }

    // AS3: .../TradingView.as::updateUserInterface()
    updateUserInterface(): void
    {
        if(this._window === null || this._model === null) return;

        this.updateActionState();

        const otherUserName = this._window.findChildByTag('OTHER_USER_NAME') as ITextWindow | null;

        if(otherUserName !== null) otherUserName.text = this._model.otherUserName;

        const ownLock = this._window.findChildByTag('OWN_USER_LOCK') as IStaticBitmapWrapperWindow | null;

        if(ownLock !== null)
        {
            ownLock.assetUri = this._model.ownUserAccepts
                ? 'inventory_trading_trading_locked_icon'
                : 'inventory_trading_trading_unlocked_icon';
        }

        const otherLock = this._window.findChildByTag('OTHER_USER_LOCK') as IStaticBitmapWrapperWindow | null;

        if(otherLock !== null)
        {
            otherLock.assetUri = this._model.otherUserAccepts
                ? 'inventory_trading_trading_locked_icon'
                : 'inventory_trading_trading_unlocked_icon';
        }
    }

    // AS3: .../TradingView.as::updateActionState()
    // The accept button's caption and enabled state are a pure function of the trade's state; an
    // unknown state throws, as it does in the model.
    updateActionState(): void
    {
        if(this._window === null || this._model === null) return;

        const acceptButton = this._window.findChildByName('button_accept');
        const cancelButton = this._window.findChildByName('button_cancel');
        const inventory = this._model.getInventory();

        if(inventory?.getBoolean('trading.warning.enabled'))
        {
            this.showHighlightInfo(
                this._model.isCreditFurniPresent()
                    ? this._localization?.getLocalization(
                        'inventory.trading.warning.credits',
                        'inventory.trading.warning.credits'
                    ) ?? null
                    : null
            );
        }

        this.showSilverFeeInfo(this._model.requiredSilverFee, this._model.playerSilver, this._model.otherPlayerSilver);
        this.showOwnOfferInfo(this._model.ownUserNumItemsTotal, this._model.ownUserNumCredits);
        this.showOtherOfferInfo(this._model.otherUserNumItemsTotal, this._model.otherUserNumCredits);

        const hasAnyOffer = this._model.otherHasAnyOffer || this._model.ownHasAnyOffer;

        if(acceptButton !== null)
        {
            switch(this._model.state)
            {
                case TradingState.READY:
                    Util.disableButton(acceptButton, !(hasAnyOffer && this._model.tradeFeeReached()));
                    acceptButton.caption = '${inventory.trading.accept}';
                    break;

                case TradingState.RUNNING:
                    Util.disableButton(acceptButton, !(hasAnyOffer && this._model.tradeFeeReached()));
                    acceptButton.caption = this._model.ownUserAccepts
                        ? '${inventory.trading.modify}'
                        : '${inventory.trading.accept}';
                    this.showInfoMessage('${inventory.trading.info.add}');
                    break;

                case TradingState.COUNTDOWN:
                    acceptButton.disable();
                    acceptButton.caption = '${inventory.trading.countdown}';
                    this.showInfoMessage('${inventory.trading.info.confirm}');
                    break;

                case TradingState.CONFIRMING:
                    acceptButton.enable();
                    acceptButton.caption = '${inventory.trading.confirm}';
                    this.showInfoMessage('${inventory.trading.info.confirm}');
                    break;

                case TradingState.CONFIRMED:
                    acceptButton.disable();
                    this.showInfoMessage('${inventory.trading.info.waiting}');
                    break;

                case TradingState.COMPLETED:
                    acceptButton.disable();
                    acceptButton.caption = '${inventory.trading.accept}';
                    this.showInfoMessage('${inventory.trading.info.confirm}');
                    break;

                case TradingState.CANCELLED:
                    break;

                default:
                    throw new Error(`Unknown trading progress state: "${this._model.state}"`);
            }
        }

        if(cancelButton !== null)
        {
            Util.disableButton(cancelButton, this._model.isConfirmingWeb3Trade());
        }
    }

    // AS3: .../TradingView.as::showInfoMessage()
    showInfoMessage(message: string): void
    {
        const helpText = this._window?.findChildByName('help_text') as ITextWindow | null;

        if(helpText === null || helpText === undefined) return;

        helpText.text = message;
        helpText.visible = true;
    }

    // AS3: .../TradingView.as::showHighlightInfo()
    // Null hides the highlighted row rather than blanking it.
    private showHighlightInfo(message: string | null): void
    {
        if(this._window === null) return;

        const border = this._window.findChildByName('info_border_highlighted');

        if(border !== null) border.visible = message !== null;

        const text = this._window.findChildByName('info_text_highlighted') as ITextWindow | null;

        if(text !== null)
        {
            text.visible = message !== null;

            if(message !== null) text.text = message;
        }

        this.resizeWindow();
    }

    // AS3: .../TradingView.as::showSilverFeeInfo()
    // The progress line is HTML because AS3 colours the total red until the fee is covered.
    private showSilverFeeInfo(requiredFee: number, playerSilver: number, otherPlayerSilver: number): void
    {
        const container = this.silverFeeContainer;

        if(container === null || this._model === null) return;

        container.visible = this._model.isWeb3Trade();

        const yourSilver = container.findChildByName('your_silver') as ITextWindow | null;
        const otherSilver = container.findChildByName('other_silver') as ITextWindow | null;

        if(yourSilver !== null) yourSilver.text = String(playerSilver);
        if(otherSilver !== null) otherSilver.text = String(otherPlayerSilver);

        const staked = playerSilver + otherPlayerSilver;
        const colour = requiredFee <= staked ? '000000' : 'AC232A';
        const progress = container.findChildByName('silver_progress_html') as IHTMLTextWindow | null;

        if(progress !== null)
        {
            progress.text = `<font color="#${colour}">${staked}</font>/${requiredFee}`;
        }

        const canStake = this._model.state === TradingState.READY || this._model.state === TradingState.RUNNING;
        const minusButton = container.findChildByName('silver_minus_button');
        const plusButton = container.findChildByName('silver_plus_button');
        const silverBalance = this._model.getInventory()?.catalog?.getPurse()?.silverBalance ?? 0;

        if(minusButton !== null) Util.disableButton(minusButton, playerSilver <= 0 || !canStake);

        if(plusButton !== null)
        {
            Util.disableButton(
                plusButton,
                staked >= requiredFee || playerSilver >= silverBalance || !canStake
            );
        }

        if(this._model.isWeb3Trade())
        {
            const key = requiredFee <= 0
                ? 'inventory.trading.note_silver_fee_free_temporarily'
                : 'inventory.trading.note_silver_fee';
            const infoText = container.findChildByName('silver_fee_info_text') as ITextWindow | null;

            if(infoText !== null) infoText.text = this._localization?.getLocalization(key) ?? '';
        }

        this.resizeWindow();
    }

    // AS3: .../TradingView.as::resizeWindow()
    // Restacks the window's rows, trims it to its content and lets the inventory window follow.
    private resizeWindow(fromTop: boolean = true): void
    {
        if(this._window === null) return;

        Util.moveAllChildrenToColumn(this._window, TradingView.TRADE_UI_SPACING, !fromTop);
        this._window.height = Util.getLowestPoint(this._window);
        this._model?.getInventory()?.view?.resizeToFitContents();
    }

    // AS3: .../TradingView.as::showOwnOfferInfo()
    private showOwnOfferInfo(itemCount: number, creditCount: number): void
    {
        this.showOfferInfo('content_text_1_a', itemCount, 'content_text_1_b', creditCount);
    }

    // AS3: .../TradingView.as::showOtherOfferInfo()
    private showOtherOfferInfo(itemCount: number, creditCount: number): void
    {
        this.showOfferInfo('content_text_2_a', itemCount, 'content_text_2_b', creditCount);
    }

    // AS3: .../TradingView.as::showOfferInfo()
    // AS3's last parameter (`isOwnUser`) is read by nothing; dropped rather than carried as a lie.
    private showOfferInfo(itemNameId: string, itemCount: number, creditNameId: string, creditCount: number): void
    {
        if(!this._model?.getInventory()?.getBoolean('trading.warning.enabled')) return;

        if(this._window === null) return;

        const itemText = this._window.findChildByName(itemNameId) as ITextWindow | null;

        if(itemText !== null)
        {
            this._localization?.registerParameter('inventory.trading.info.itemcount', 'value', itemCount.toString());
            itemText.text = this._localization?.getLocalization('inventory.trading.info.itemcount') ?? '';
        }

        const creditText = this._window.findChildByName(creditNameId) as ITextWindow | null;

        if(creditText !== null)
        {
            this._localization?.registerParameter(
                'inventory.trading.info.creditvalue',
                'value',
                creditCount.toString()
            );
            creditText.text = this._localization?.getLocalization('inventory.trading.info.creditvalue') ?? '';
        }
    }

    // AS3: .../TradingView.as::showOwnUserNotification()
    // The notice replaces the grid rather than sitting beside it.
    showOwnUserNotification(message: string): void
    {
        this.toggleUserNotification('info_text_0', 'item_grid_0', message);
    }

    // AS3: .../TradingView.as::hideOwnUserNotification()
    hideOwnUserNotification(): void
    {
        this.toggleUserNotification('info_text_0', 'item_grid_0', null);
    }

    // AS3: .../TradingView.as::showOtherUserNotification()
    showOtherUserNotification(message: string): void
    {
        this.toggleUserNotification('info_text_1', 'item_grid_1', message);
    }

    // AS3: .../TradingView.as::hideOtherUserNotification()
    hideOtherUserNotification(): void
    {
        this.toggleUserNotification('info_text_1', 'item_grid_1', null);
    }

    // AS3: .../TradingView.as::showOwnUserNotification()/hideOwnUserNotification() and their
    // "other" twins — four AS3 methods that differ only in the two window names and whether the
    // text is set. One helper here; the four public members above are AS3's.
    private toggleUserNotification(textName: string, gridName: string, message: string | null): void
    {
        if(this._window === null) return;

        const text = this._window.findChildByName(textName) as ITextWindow | null;

        if(text !== null)
        {
            if(message !== null) text.text = message;

            text.visible = message !== null;
        }

        const grid = this._window.findChildByName(gridName) as unknown as IItemGridWindow | null;

        if(grid !== null) grid.visible = message === null;
    }

    // AS3: .../TradingView.as::alertTradeOpenFailed()
    // The reason code selects the message key, and the other user's name is registered against it.
    alertTradeOpenFailed(reason: number, otherUserName: string): void
    {
        const key = `inventory.trading.openfail.${reason}`;

        this._windowManager?.registerLocalizationParameter(key, 'otherusername', otherUserName);
        this._windowManager?.simpleAlert(
            '${inventory.trading.openfail.title}',
            '${inventory.trading.openfail.caption}',
            `\${${key}}`
        );
    }

    // AS3: .../TradingView.as::alertPopup()
    alertPopup(alertType: number): void
    {
        switch(alertType)
        {
            case TradingView.ALERT_SCAM:
                this._windowManager?.alert(
                    '${inventory.trading.notification.title}',
                    '${inventory.trading.warning.other_not_offering}',
                    0,
                    this.onTradingAlert
                );
                break;

            case TradingView.ALERT_OTHER_CANCELLED:
                this._windowManager?.alert(
                    '${inventory.trading.notification.title}',
                    '${inventory.trading.info.closed}',
                    0,
                    this.onTradingAlert
                );
                break;

            case TradingView.ALERT_ALREADY_OPEN:
                this._windowManager?.alert(
                    '${inventory.trading.notification.title}',
                    '${inventory.trading.info.already_open}',
                    0,
                    this.onTradingAlert
                );
                break;
        }
    }

    // AS3: .../TradingView.as::showAlertNotification()
    // Without a callback AS3 supplies one that just disposes the dialog.
    showAlertNotification(title: string, description: string, callback: AlertDialogCallback | null): void
    {
        this._windowManager?.alert(title, description, 0, callback ?? ((dialog: IDisposable) => dialog.dispose()));
    }

    // AS3: .../TradingView.as::startConfirmCountdown()
    // Three ticks, one a second, counting the caption down; the last one tells the model.
    startConfirmCountdown(): void
    {
        this.cancelConfirmCountdown();

        this._countdownCount = 0;
        this._windowManager?.registerLocalizationParameter(
            'inventory.trading.countdown',
            'counter',
            String(TradingView.COUNTDOWN_SECONDS)
        );

        this._countdownTimer = setInterval(() =>
        {
            this._countdownCount++;
            this._windowManager?.registerLocalizationParameter(
                'inventory.trading.countdown',
                'counter',
                String(TradingView.COUNTDOWN_SECONDS - this._countdownCount)
            );

            if(this._countdownCount === TradingView.COUNTDOWN_SECONDS)
            {
                this._model?.confirmCountdownReady();
                this.cancelConfirmCountdown();
            }
        }, 1000);

        this.updateUserInterface();
    }

    // AS3: .../TradingView.as::cancelConfirmCountdown()
    cancelConfirmCountdown(): void
    {
        if(this._countdownTimer !== null)
        {
            clearInterval(this._countdownTimer);
            this._countdownTimer = null;
        }

        this._countdownCount = 0;
    }

    // AS3: .../TradingView.as::imageReady()
    // A furniture icon arriving late repaints whichever side was waiting on it.
    imageReady(callbackId: number, image: ImageBitmap | null): void
    {
        if(this._model === null) return;

        for(const [items, userId] of [
            [this._model.ownUserItems, this._model.ownUserId] as const,
            [this._model.otherUserItems, this._model.otherUserId] as const
        ])
        {
            if(items === null) continue;

            let matched = false;

            for(let i = 0; i < items.length; i++)
            {
                const groupItem = items.getWithIndex(i);

                if(groupItem !== null && groupItem.iconCallbackId === callbackId)
                {
                    groupItem.iconImage = image;
                    matched = true;
                }
            }

            if(matched) this.updateItemList(userId);
        }
    }

    // AS3: .../TradingView.as::imageFailed()
    // Empty in AS3 too.
    imageFailed(_callbackId: number): void
    {
    }

    // AS3: .../TradingView.as::setSelection()
    setSelection(groupItem: GroupItem | null): void
    {
        this.removeSelection();

        if(groupItem !== null)
        {
            this._selectedItem = groupItem;
            this._selectedItem.isSelected = true;
        }
    }

    // AS3: .../TradingView.as::removeSelection()
    removeSelection(): void
    {
        if(this._selectedItem !== null)
        {
            this._selectedItem.isSelected = false;
            this._selectedItem = null;
        }
    }

    // AS3: .../TradingView.as::onTradingAlert()
    // The port's `AlertDialogCallback` hands back an `IDisposable`, not the dialog itself, which
    // is all this needs: AS3 only calls dispose() on it.
    private onTradingAlert = (dialog: IDisposable, event: WindowEvent): void =>
    {
        if(event.type === 'WE_OK') dialog.dispose();
    };

    // AS3: .../TradingView.as::getOwnUsersItemGrid()
    protected getOwnUsersItemGrid(): IItemGridWindow | null
    {
        return (this._window?.findChildByTag('OWN_USER_GRID') as unknown as IItemGridWindow) ?? null;
    }

    // AS3: .../TradingView.as::getOtherUsersItemGrid()
    protected getOtherUsersItemGrid(): IItemGridWindow | null
    {
        return (this._window?.findChildByTag('OTHER_USER_GRID') as unknown as IItemGridWindow) ?? null;
    }

    // AS3: .../TradingView.as::createNormalWindow()
    // Each grid cell gets its index as its id — that index is what the click handler sends back to
    // the model as the item to remove.
    private createNormalWindow(): IWindowContainer | null
    {
        const window = this._windowManager?.buildWidgetLayout('inventory_trading_xml') as IWindowContainer | null;

        if(!window)
        {
            log.warn('inventory_trading_xml did not build — the trade window cannot be shown');

            return null;
        }

        this.prepareGrid(window.findChildByTag('OWN_USER_GRID') as unknown as IItemGridWindow | null, this.ownThumbEventProc);
        this.prepareGrid(
            window.findChildByTag('OTHER_USER_GRID') as unknown as IItemGridWindow | null,
            this.othersThumbEventProc
        );

        window.procedure = this.windowEventProc;

        return window;
    }

    // AS3: .../TradingView.as::createNormalWindow() — the per-grid half, written twice there.
    private prepareGrid(grid: IItemGridWindow | null, procedure: (event: WindowEvent, window: IWindow) => void): void
    {
        if(grid === null) return;

        for(let i = 0; i < grid.numGridItems; i++)
        {
            const gridItem = grid.getGridItemAt(i);

            if(gridItem === null) continue;

            gridItem.id = i;
            gridItem.procedure = procedure;
            gridItem.addEventListener(WindowMouseEvent.OVER, procedure);
            gridItem.addEventListener(WindowMouseEvent.OUT, procedure);
        }
    }

    // AS3: .../TradingView.as::createMinimizedWindow()
    private createMinimizedWindow(): IWindowContainer | null
    {
        const window = this._windowManager?.buildWidgetLayout(
            'inventory_trading_minimized_xml'
        ) as IWindowContainer | null;

        if(!window)
        {
            log.warn('inventory_trading_minimized_xml did not build');

            return null;
        }

        window.procedure = this.windowMinimizedEventProc;

        return window;
    }

    // AS3: .../TradingView.as::windowMininizedEventProc()
    // (AS3's own spelling of "minimized" has the typo; the port does not.)
    private windowMinimizedEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK') return;

        switch(window.name)
        {
            case 'button_continue':
                this._model?.requestFurniViewOpen();
                break;

            case 'button_cancel':
                this._model?.requestCancelTrading();
                break;
        }
    };

    // DEVIATION: AS3's scam check also requires the other side's NFT list to be empty; the RPG fork
    //   removed NFT.
    // AS3: .../TradingView.as::windowEventProc()
    // AS3 switches on `state - 1`, so case 0 is RUNNING and case 2 is CONFIRMING; every other
    // state ignores both buttons. Written out here rather than kept as arithmetic.
    private windowEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK' || this._model === null) return;

        switch(window.name)
        {
            case 'button_accept':
                if(this._model.state === TradingState.RUNNING)
                {
                    const otherOffersNothing = (this._model.otherUserItems?.length ?? 0) === 0;

                    if(otherOffersNothing && !this._model.ownUserAccepts)
                    {
                        this.alertPopup(TradingView.ALERT_SCAM);
                    }

                    if(this._model.ownUserAccepts)
                    {
                        this._model.requestUnacceptTrading();
                    }
                    else
                    {
                        this._model.requestAcceptTrading();
                    }
                }
                else if(this._model.state === TradingState.CONFIRMING)
                {
                    window.disable();
                    this._model.requestConfirmAcceptTrading();
                }

                break;

            case 'button_cancel':
                if(this._model.state === TradingState.RUNNING)
                {
                    this._model.requestCancelTrading();
                }
                else if(this._model.state === TradingState.CONFIRMING)
                {
                    this._model.requestConfirmDeclineTrading();
                }

                break;

            case 'silver_minus_button':
                this._model.addSilverFee(false);
                break;

            case 'silver_plus_button':
                this._model.addSilverFee(true);
                break;
        }
    };

    // AS3: .../TradingView.as::ownThumbEventProc()
    private ownThumbEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        this.thumbEventProc(event, window, true);
    };

    // AS3: .../TradingView.as::othersThumbEventProc()
    private othersThumbEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        this.thumbEventProc(event, window, false);
    };

    /**
     * AS3: .../TradingView.as::thumbEventProc()
     *
     * Clicking one of *your* tiles takes it back out of the trade; the id carried by the cell is
     * the index the model expects. Hovering either side's tile opens the tooltip beside it.
     */
    // DEVIATION: AS3's version is `static`, takes both sides' maps (the collectibles view calls it
    //   too), and gives an NFT tile its own tooltip named by the collector hub; the RPG fork
    //   removed collectibles and NFT, so this is an instance method over the furniture list only.
    // AS3: .../src/com/sulake/habbo/inventory/trading/TradingView.as::thumbEventProc()
    private thumbEventProc(event: WindowEvent, window: IWindow, isOwnUser: boolean): void
    {
        if(isOwnUser && event.type === 'WME_CLICK')
        {
            this._model?.requestRemoveItemFromTrading(window.id);
        }

        if(event.type === 'WME_OUT')
        {
            this._itemPopup?.hideDelayed();

            return;
        }

        if(event.type !== 'WME_OVER' || this._model === null || this._itemPopup === null) return;

        const items = isOwnUser ? this._model.ownUserItems : this._model.otherUserItems;
        const groupItem = items?.getWithIndex(window.id) ?? null;

        if(groupItem === null) return;

        // The credits tile carries its own text and icon rather than resolving furni data.
        if(groupItem instanceof CreditTradingItem)
        {
            if(!isOwnUser)
            {
                this._itemPopup.updateContent(
                    window as unknown as IWindowContainer,
                    groupItem.getItemTooltipText(),
                    groupItem.getItemIcon(),
                    null,
                    ItemPopupCtrl.LOCATION_RIGHT,
                    false
                );
                this._itemPopup.show();
            }

            return;
        }

        const item = groupItem.peek();

        if(item === null) return;

        const inventory = this._model.getInventory();
        const image = inventory?.getItemImage(item) ?? null;
        let name = item.isWallItem
            ? `\${wallItem.name.${item.type}}`
            : `\${roomItem.name.${item.type}}`;

        if(item.category === FurnitureCategory.POSTER)
        {
            name = `\${poster_${item.stuffData?.getLegacyString() ?? ''}_name}`;
        }

        // An Ecotron box shows its name with the date it was made.
        if(item.category === FurnitureCategory.ECOTRON_BOX)
        {
            const created = new Date(item.creationYear, item.creationMonth - 1, item.creationDay);

            name = `${this._localization?.getLocalization(`roomItem.name.${item.type}`) ?? ''} `
                + created.toLocaleDateString();
        }

        this._itemPopup.updateContent(
            window as unknown as IWindowContainer,
            name,
            image,
            item.stuffData,
            ItemPopupCtrl.LOCATION_RIGHT,
            TradingView.isExternalImageType(inventory, item.type)
        );
        this._itemPopup.show();
    }

    // AS3: .../TradingView.as::isExternalImagetype()
    // AS3's own static helper — the flag lives on the furniture data, not on the item.
    private static isExternalImageType(inventory: HabboInventory | null, type: number): boolean
    {
        if(inventory === null) return false;

        const furnitureData = inventory.getFurnitureData(type, 'i');

        return furnitureData !== null && furnitureData.isExternalImageType;
    }

    // AS3: .../TradingView.as::get silverFeeContainer()
    private get silverFeeContainer(): IWindowContainer | null
    {
        return (this._window?.findChildByName('silver_container') as IWindowContainer) ?? null;
    }

    // AS3: .../TradingView.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        if(this._window !== null && !this._window.disposed)
        {
            this._window.dispose();
            this._window = null;
        }

        if(this._windowMin !== null && !this._windowMin.disposed)
        {
            this._windowMin.dispose();
            this._windowMin = null;
        }

        this.cancelConfirmCountdown();

        this._soundManager = null;

        this._itemPopup?.dispose();
        this._itemPopup = null;

        this._model = null;
        this._windowManager = null;
        this._localization = null;
        this._assets = null;
        this._selectedItem = null;
        this._visible = false;
        this._disposed = true;
    }
}
