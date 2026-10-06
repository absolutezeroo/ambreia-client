import type {ITradingModel} from './ITradingModel';
import {HabboInventoryTrackingEvent} from '../events/HabboInventoryTrackingEvent';
import type {IInventoryModel} from '../IInventoryModel';
import {TradingView} from './TradingView';
import {TradingNameScamDetector} from './namescam/TradingNameScamDetector';
import {TradingNameScamDetectionResult} from './namescam/TradingNameScamDetectionResult';
import {TradingNameScamWarningController} from './namescam/TradingNameScamWarningController';
import {TradingNameScamWarningData} from './namescam/TradingNameScamWarningData';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IAssetLibrary} from '@core/assets';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {TradingStateType} from './TradingState';
import {MAX_ITEMS_TO_TRADE, TradingState} from './TradingState';
import type {HabboInventory} from '../HabboInventory';
import type {IFurniModel} from '../furni/IFurniModel';
import type {GroupItem} from '../items/GroupItem';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import {StringArrayStuffData} from '@habbo/room/object/data/StringArrayStuffData';
import {OrderedMap} from '@core/utils/OrderedMap';
import {Logger} from '@core/utils/Logger';
import {FurnitureCategory} from '../enum';
import {AcceptTradingComposer} from '@habbo/communication/messages/outgoing/inventory/AcceptTradingComposer';
import {AddItemsToTradeComposer} from '@habbo/communication/messages/outgoing/inventory/AddItemsToTradeComposer';
import {AddItemToTradeComposer} from '@habbo/communication/messages/outgoing/inventory/AddItemToTradeComposer';
import {CloseTradingComposer} from '@habbo/communication/messages/outgoing/inventory/CloseTradingComposer';
import {
    ConfirmAcceptTradingComposer
} from '@habbo/communication/messages/outgoing/inventory/ConfirmAcceptTradingComposer';
import {
    ConfirmDeclineTradingComposer
} from '@habbo/communication/messages/outgoing/inventory/ConfirmDeclineTradingComposer';
import {OpenTradingComposer} from '@habbo/communication/messages/outgoing/inventory/OpenTradingComposer';
import {
    RemoveItemFromTradeComposer
} from '@habbo/communication/messages/outgoing/inventory/RemoveItemFromTradeComposer';
import {SilverFeeMessageComposer} from '@habbo/communication/messages/outgoing/inventory/SilverFeeMessageComposer';
import {UnacceptTradingComposer} from '@habbo/communication/messages/outgoing/inventory/UnacceptTradingComposer';
import {TradeOpenFailedEvent} from '@habbo/communication/messages/incoming/inventory/trading/TradeOpenFailedEvent';
import {
    TradeSilverFeeMessageEvent
} from '@habbo/communication/messages/incoming/inventory/trading/TradeSilverFeeMessageEvent';
import {
    TradeSilverSetMessageEvent
} from '@habbo/communication/messages/incoming/inventory/trading/TradeSilverSetMessageEvent';
import {
    TradingAcceptMessageEvent
} from '@habbo/communication/messages/incoming/inventory/trading/TradingAcceptMessageEvent';
import {TradingCloseMessageEvent} from '@habbo/communication/messages/incoming/inventory/trading/TradingCloseMessageEvent';
import {
    TradingCompletedMessageEvent
} from '@habbo/communication/messages/incoming/inventory/trading/TradingCompletedMessageEvent';
import {
    TradingConfirmationMessageEvent
} from '@habbo/communication/messages/incoming/inventory/trading/TradingConfirmationMessageEvent';
import {
    TradingNotOpenMessageEvent
} from '@habbo/communication/messages/incoming/inventory/trading/TradingNotOpenMessageEvent';
import {
    TradingOtherNotAllowedEvent
} from '@habbo/communication/messages/incoming/inventory/trading/TradingOtherNotAllowedEvent';
import {
    TradingYouAreNotAllowedEvent
} from '@habbo/communication/messages/incoming/inventory/trading/TradingYouAreNotAllowedEvent';
import {
    TradeOpenFailedEventParser
} from '@habbo/communication/messages/parser/inventory/trading/TradeOpenFailedEventParser';
import type {
    TradeSilverFeeMessageEventParser
} from '@habbo/communication/messages/parser/inventory/trading/TradeSilverFeeMessageEventParser';
import type {
    TradeSilverSetMessageEventParser
} from '@habbo/communication/messages/parser/inventory/trading/TradeSilverSetMessageEventParser';
import type {
    TradingAcceptMessageParser
} from '@habbo/communication/messages/parser/inventory/trading/TradingAcceptMessageParser';
import type {
    TradingCloseMessageParser
} from '@habbo/communication/messages/parser/inventory/trading/TradingCloseMessageParser';
import type {
    TradingItemListMessageParser
} from '@habbo/communication/messages/parser/inventory/trading/TradingItemListMessageParser';

const log = Logger.getLogger('habbo.inventory.trading.TradingModel');

/**
 * The state of one trade, and the only place that talks to the server about it. It owns the
 * `TradingView` it drives, as AS3 does.
 *
 * One edge is still unported, marked where it belongs: the Trax song title in the view's hover
 * tooltip. AS3 also carries an NFT half of both item lists, which the RPG fork removed; the silver
 * fee that prices such a trade is kept.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/inventory/trading/TradingModel.as
 */
export class TradingModel implements ITradingModel, IInventoryModel
{
    // AS3: .../TradingModel.as::SHOW_NAME_SCAM_WARNING_FOR_SELF_INITIATED_TRADES
    private static readonly SHOW_NAME_SCAM_WARNING_FOR_SELF_INITIATED_TRADES: boolean = true;

    // AS3: .../TradingModel.as::_inventory
    private _inventory: HabboInventory | null;

    // AS3: .../TradingModel.as::_communication
    private _communication: IHabboCommunicationManager | null;

    // AS3: .../TradingModel.as::_localization
    private _localization: IHabboLocalizationManager | null;

    // AS3: .../TradingModel.as::_notifications
    private _notifications: IHabboNotifications | null;

    // AS3: .../TradingModel.as::_view
    private _view: TradingView;

    // AS3: .../TradingModel.as::_nameScamWarning
    // Name DERIVED (`_SafeStr_6149`).
    private _nameScamWarning: TradingNameScamWarningController;

    // AS3: .../src/com/sulake/habbo/inventory/trading/TradingModel.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../TradingModel.as::_tradingOpen
    // Name DERIVED, not recovered (`_SafeStr_5444` in every tree): the flag `startTrading()` raises
    // and `close()` lowers, guarding both `close()` and `subCategorySwitch()`.
    private _tradingOpen: boolean = false;

    // AS3: .../TradingModel.as::_state
    private _state: TradingStateType = TradingState.READY;

    // AS3: .../TradingModel.as::_ownUserId
    private _ownUserId: number = -1;

    // AS3: .../TradingModel.as::_ownUserName
    private _ownUserName: string = '';

    // AS3: .../TradingModel.as::_ownUserItems
    private _ownUserItems: OrderedMap<string, GroupItem> | null = null;

    // AS3: .../TradingModel.as::_ownUserNumItems
    private _ownUserNumItems: number = 0;

    // AS3: .../TradingModel.as::_ownUserNumCredits
    private _ownUserNumCredits: number = 0;

    // AS3: .../TradingModel.as::_ownUserAccepts
    private _ownUserAccepts: boolean = false;

    // AS3: .../TradingModel.as::_ownUserCanTrade
    private _ownUserCanTrade: boolean = false;

    // AS3: .../TradingModel.as::_otherUserId
    private _otherUserId: number = -1;

    // AS3: .../TradingModel.as::_otherUserName
    private _otherUserName: string = '';

    // AS3: .../TradingModel.as::_otherUserItems
    private _otherUserItems: OrderedMap<string, GroupItem> | null = null;

    // AS3: .../TradingModel.as::_otherUserNumItems
    private _otherUserNumItems: number = 0;

    // AS3: .../TradingModel.as::_otherUserNumCredits
    private _otherUserNumCredits: number = 0;

    // AS3: .../TradingModel.as::_otherUserAccepts
    private _otherUserAccepts: boolean = false;

    // AS3: .../TradingModel.as::_otherUserCanTrade
    private _otherUserCanTrade: boolean = false;

    // AS3: .../TradingModel.as::_requiredSilverFee
    private _requiredSilverFee: number = 0;

    // AS3: .../TradingModel.as::_playerSilver
    private _playerSilver: number = 0;

    // AS3: .../TradingModel.as::_otherPlayerSilver
    private _otherPlayerSilver: number = 0;

    // AS3: .../TradingModel.as::TradingModel()
    // AS3 builds both the view and the name-scam warning controller here.
    // AS3 also hands the room engine to the view, for the item icons it renders
    // itself; this port asks the inventory for those (`getItemImage()`).
    constructor(
        inventory: HabboInventory | null,
        windowManager: IHabboWindowManager | null,
        communication: IHabboCommunicationManager | null,
        assets: IAssetLibrary | null,
        localization: IHabboLocalizationManager | null,
        soundManager: IHabboSoundManager | null,
        notifications: IHabboNotifications | null
    )
    {
        this._inventory = inventory;
        this._communication = communication;
        this._localization = localization;
        this._notifications = notifications;
        this._view = new TradingView(this, windowManager, assets, localization, soundManager);
        this._nameScamWarning = new TradingNameScamWarningController(
            windowManager,
            assets,
            localization,
            communication
        );
    }

    // AS3: .../TradingModel.as::getGuildFurniType()
    static getGuildFurniType(classId: number, stuffData: IStuffData | null): string
    {
        let key = classId.toString();

        if(!(stuffData instanceof StringArrayStuffData))
        {
            return key;
        }

        for(let i = 1; i < 5; i++)
        {
            key += ',' + stuffData.getValue(i);
        }

        return key;
    }

    // AS3: .../TradingModel.as::get running()
    get running(): boolean
    {
        return this._state !== TradingState.READY;
    }

    // AS3: .../TradingModel.as::get state()
    get state(): TradingStateType
    {
        return this._state;
    }

    // AS3: .../TradingModel.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: .../TradingModel.as::get ownUserId()
    get ownUserId(): number
    {
        return this._ownUserId;
    }

    // AS3: .../TradingModel.as::get ownUserName()
    get ownUserName(): string
    {
        return this._ownUserName;
    }

    // AS3: .../TradingModel.as::get ownUserItems()
    get ownUserItems(): OrderedMap<string, GroupItem> | null
    {
        return this._ownUserItems;
    }

    // AS3: .../TradingModel.as::get ownUserAccepts()
    get ownUserAccepts(): boolean
    {
        return this._ownUserAccepts;
    }

    // AS3: .../TradingModel.as::get ownUserCanTrade()
    get ownUserCanTrade(): boolean
    {
        return this._ownUserCanTrade;
    }

    // AS3: .../TradingModel.as::get ownUserNumItems()
    get ownUserNumItems(): number
    {
        return this._ownUserNumItems;
    }

    // DEVIATION: AS3 also counts the NFT list; the RPG fork removed NFT.
    // AS3: .../TradingModel.as::get ownHasAnyOffer()
    get ownHasAnyOffer(): boolean
    {
        return (this._ownUserItems?.length ?? 0) > 0;
    }

    // DEVIATION: AS3 adds the NFT count; the RPG fork removed NFT.
    // AS3: .../TradingModel.as::get ownUserNumItemsTotal()
    get ownUserNumItemsTotal(): number
    {
        return this._ownUserNumItems;
    }

    // AS3: .../TradingModel.as::get ownUserNumCredits()
    get ownUserNumCredits(): number
    {
        return this._ownUserNumCredits;
    }

    // AS3: .../TradingModel.as::get otherUserId()
    get otherUserId(): number
    {
        return this._otherUserId;
    }

    // AS3: .../TradingModel.as::get otherUserName()
    get otherUserName(): string
    {
        return this._otherUserName;
    }

    // AS3: .../TradingModel.as::get otherUserItems()
    get otherUserItems(): OrderedMap<string, GroupItem> | null
    {
        return this._otherUserItems;
    }

    // AS3: .../TradingModel.as::get otherUserAccepts()
    get otherUserAccepts(): boolean
    {
        return this._otherUserAccepts;
    }

    // AS3: .../TradingModel.as::get otherUserCanTrade()
    get otherUserCanTrade(): boolean
    {
        return this._otherUserCanTrade;
    }

    // AS3: .../TradingModel.as::get otherUserNumItems()
    get otherUserNumItems(): number
    {
        return this._otherUserNumItems;
    }

    // DEVIATION: AS3 also counts the NFT list; the RPG fork removed NFT.
    // AS3: .../TradingModel.as::get otherHasAnyOffer()
    get otherHasAnyOffer(): boolean
    {
        return (this._otherUserItems?.length ?? 0) > 0;
    }

    // DEVIATION: AS3 adds the NFT count; the RPG fork removed NFT.
    // AS3: .../TradingModel.as::get otherUserNumItemsTotal()
    get otherUserNumItemsTotal(): number
    {
        return this._otherUserNumItems;
    }

    // AS3: .../TradingModel.as::get otherUserNumCredits()
    get otherUserNumCredits(): number
    {
        return this._otherUserNumCredits;
    }

    // AS3: .../TradingModel.as::get requiredSilverFee()
    get requiredSilverFee(): number
    {
        return this._requiredSilverFee;
    }

    // AS3: .../TradingModel.as::get playerSilver()
    get playerSilver(): number
    {
        return this._playerSilver;
    }

    // AS3: .../TradingModel.as::get otherPlayerSilver()
    get otherPlayerSilver(): number
    {
        return this._otherPlayerSilver;
    }

    // DEVIATION: AS3 also resets the two NFT lists and their counts; the RPG fork removed NFT.
    // AS3: .../TradingModel.as::startTrading()
    // `selfInitiated` is AS3's last parameter: true when the *other* id in the open message is
    // ours, i.e. we are the one who started the trade. It only feeds the name-scam check.
    startTrading(
        ownUserId: number,
        ownUserName: string,
        ownUserCanTrade: boolean,
        otherUserId: number,
        otherUserName: string,
        otherUserCanTrade: boolean,
        selfInitiated: boolean
    ): void
    {
        this._ownUserId = ownUserId;
        this._ownUserName = ownUserName;
        this._ownUserItems = new OrderedMap<string, GroupItem>();
        this._ownUserAccepts = false;
        this._ownUserCanTrade = ownUserCanTrade;
        this._otherUserId = otherUserId;
        this._otherUserName = otherUserName;
        this._otherUserItems = new OrderedMap<string, GroupItem>();
        this._otherUserAccepts = false;
        this._otherUserCanTrade = otherUserCanTrade;
        this._requiredSilverFee = 0;
        this._playerSilver = 0;
        this._otherPlayerSilver = 0;
        this._ownUserNumItems = 0;
        this._ownUserNumCredits = 0;
        this._otherUserNumItems = 0;
        this._otherUserNumCredits = 0;

        this._nameScamWarning.hide();

        const detection = this.detectNameScam(selfInitiated);
        const warningData = detection.nameScamDetected ? this.createNameScamWarningData(detection) : null;

        this._tradingOpen = true;
        this.state = TradingState.RUNNING;

        this._view.setup(ownUserId, ownUserCanTrade, otherUserId, otherUserCanTrade);
        this._view.updateItemList(this._ownUserId);
        this._view.updateItemList(this._otherUserId);
        this._view.updateUserInterface();
        this._view.clearItemLists();

        this._inventory?.toggleInventoryPage('furni');
        this._inventory?.events.emit(HabboInventoryTrackingEvent.TRADING);

        // AS3 shows the warning last, after the window is up, so it lands on top of it.
        if(warningData !== null) this._nameScamWarning.show(warningData);
    }

    /**
     * AS3: .../TradingModel.as::detectNameScam()
     *
     * The guard AS3 wrote is `if(!param1 && false)`, i.e. dead: the `&& false` disables the
     * early-out entirely, so a self-initiated trade is checked exactly like an invited one. That
     * matches the constant above it — SHOW_NAME_SCAM_WARNING_FOR_SELF_INITIATED_TRADES is true —
     * and it is why the constant is read by nothing. Kept as written rather than "restored" to
     * what the parameter suggests.
     */
    // AS3: .../src/com/sulake/habbo/inventory/trading/TradingModel.as::detectNameScam()
    private detectNameScam(selfInitiated: boolean): TradingNameScamDetectionResult
    {
        if(!selfInitiated && !TradingModel.SHOW_NAME_SCAM_WARNING_FOR_SELF_INITIATED_TRADES)
        {
            return TradingNameScamDetectionResult.NO_MATCHES;
        }

        return TradingNameScamDetector.detect(
            this._otherUserName,
            this.getRoomUserNamesForNameScamDetection(),
            this.getFriendNamesForNameScamDetection()
        );
    }

    // AS3: .../TradingModel.as::createNameScamWarningData()
    // The figure is looked up from the room session, and simply left empty when it is not there.
    private createNameScamWarningData(detection: TradingNameScamDetectionResult): TradingNameScamWarningData
    {
        let figure = '';
        const roomSession = this._inventory?.roomSession;

        if(roomSession?.userDataManager)
        {
            const userData = roomSession.userDataManager.getUserData(this._otherUserId);

            if(userData?.figure) figure = userData.figure;
        }

        return new TradingNameScamWarningData(
            this._otherUserId,
            this._otherUserName,
            figure,
            detection.similarInRoom,
            detection.similarInFriends
        );
    }

    /**
     * AS3: .../TradingModel.as::close()
     *
     * Re-entrant, and deliberately left that way: from CONFIRMING or CONFIRMED, `state = CANCELLED`
     * calls `close()` again from inside the setter, and that inner call still sees a non-READY
     * state, so the cancel composer goes out **twice**. AS3 does exactly this — the second
     * `state = CANCELLED` is the no-op the setter guards on, and the inner call is what actually
     * lands the state on READY. Verified against the source before being left alone.
     */
    // AS3: .../src/com/sulake/habbo/inventory/trading/TradingModel.as::close()
    close(): void
    {
        if(this._tradingOpen)
        {
            if(this._state !== TradingState.READY && this._state !== TradingState.COMPLETED)
            {
                this.requestCancelTrading();
                this.state = TradingState.CANCELLED;
            }

            this.state = TradingState.READY;
            this._inventory?.toggleInventorySubPage('empty');
            this._tradingOpen = false;
        }

        this._nameScamWarning.hide();
        this._view.setMinimized(false);
    }

    // AS3: .../TradingModel.as::getRoomUserNamesForNameScamDetection()
    // Every other user in the room, both trade participants excluded.
    private getRoomUserNamesForNameScamDetection(): string[]
    {
        const roomSession = this._inventory?.roomSession;

        if(!roomSession?.userDataManager)
        {
            return [];
        }

        const names: string[] = [];

        for(const userId of roomSession.userDataManager.getAllUserIds())
        {
            if(userId === this._ownUserId || userId === this._otherUserId) continue;

            const userData = roomSession.userDataManager.getUserData(userId);

            if(!userData?.name || userData.name.length === 0) continue;

            names.push(userData.name);
        }

        return names;
    }

    // AS3: .../TradingModel.as::getFriendNamesForNameScamDetection()
    private getFriendNamesForNameScamDetection(): string[]
    {
        return this._inventory?.friendList?.getFriendNames() ?? [];
    }

    // AS3: .../TradingModel.as::isConfirmingWeb3Trade()
    isConfirmingWeb3Trade(): boolean
    {
        return this.isWeb3Trade() && this._state === TradingState.CONFIRMED;
    }

    // DEVIATION: AS3 also counts a trade with an NFT on either side; the RPG fork removed NFT, so
    //   only the silver fee makes one.
    // AS3: .../TradingModel.as::isWeb3Trade()
    isWeb3Trade(): boolean
    {
        return this._requiredSilverFee > 0;
    }

    // DEVIATION: AS3 also keeps the window up on the collectibles tab; the RPG fork removed it.
    // AS3: .../TradingModel.as::categorySwitch()
    // AS3 minimises the trade window on any tab that is not furni, then refreshes the inventory's
    // sub-view.
    categorySwitch(category: string): void
    {
        this._view.setMinimized(category !== 'furni');
        this._inventory?.updateSubView();
    }

    // AS3: .../TradingModel.as::set state()
    // The transition table is AS3's, including which transitions have side effects and which are
    // rejected outright — an unlisted pair throws, as it does there, rather than silently sticking.
    set state(value: TradingStateType)
    {
        log.debug(
            `OLD STATE: ${this._state} NEW STATE: ${value} OWN: ${this._ownUserAccepts} OTHER: ${this._otherUserAccepts}`
        );

        if(this._state === value) return;

        let changed = false;

        switch(this._state)
        {
            case TradingState.READY:
                if(value === TradingState.RUNNING || value === TradingState.COMPLETED)
                {
                    this._state = value;
                    this._inventory?.onTradeActiveChanged();
                    changed = true;
                }

                break;

            case TradingState.RUNNING:
                if(value === TradingState.COUNTDOWN)
                {
                    this._state = value;
                    changed = true;
                    this.startConfirmCountdown();

                    break;
                }

                if(value === TradingState.CANCELLED)
                {
                    this._state = value;
                    this._view.setMinimized(false);
                    changed = true;
                }

                break;

            case TradingState.COUNTDOWN:
                if(value === TradingState.CONFIRMING)
                {
                    this._state = value;
                    changed = true;

                    break;
                }

                if(value === TradingState.CANCELLED)
                {
                    this._state = value;
                    this._view.setMinimized(false);
                    changed = true;

                    break;
                }

                if(value === TradingState.RUNNING)
                {
                    this._state = value;
                    changed = true;
                    this.cancelConfirmCountdown();
                }

                break;

            case TradingState.CONFIRMING:
                if(value === TradingState.CONFIRMED)
                {
                    this._state = value;
                    changed = true;

                    break;
                }

                if(value === TradingState.COMPLETED)
                {
                    this._state = value;
                    changed = true;
                    this.close();

                    break;
                }

                if(value === TradingState.CANCELLED)
                {
                    this._state = value;
                    this._view.setMinimized(false);
                    changed = true;
                    this.close();
                }

                break;

            case TradingState.CONFIRMED:
                if(value === TradingState.COMPLETED || value === TradingState.CANCELLED)
                {
                    this._state = value;
                    this._view.setMinimized(false);
                    changed = true;
                    this.close();
                }

                break;

            case TradingState.COMPLETED:
                if(value === TradingState.READY)
                {
                    this._state = value;
                    this._inventory?.onTradeActiveChanged(true);
                    changed = true;
                }

                break;

            case TradingState.CANCELLED:
                if(value === TradingState.READY)
                {
                    this._state = value;
                    this._inventory?.onTradeActiveChanged();
                    changed = true;

                    break;
                }

                if(value === TradingState.RUNNING)
                {
                    this._state = value;
                    changed = true;
                }

                break;

            default:
                throw new Error(`Unknown trading progress state: "${this._state}"`);
        }

        if(changed)
        {
            this._view.updateUserInterface();

            return;
        }

        throw new Error(
            `Error assigning trading process status! States does not match: (from) ${this._state} (to) ${value}`
        );
    }

    // AS3: .../TradingModel.as::getFurniInventoryModel()
    getFurniInventoryModel(): IFurniModel | null
    {
        return this._inventory?.furniModel ?? null;
    }

    // AS3: .../TradingModel.as::getInventory()
    getInventory(): HabboInventory | null
    {
        return this._inventory;
    }

    // AS3: .../TradingModel.as::updateItemGroupMaps()
    // The parser's *first* user is not necessarily us — AS3 decides by id which side each list
    // belongs to, and both accept flags drop because the offer changed.
    updateItemGroupMaps(
        parser: TradingItemListMessageParser,
        firstUserItems: OrderedMap<string, GroupItem>,
        secondUserItems: OrderedMap<string, GroupItem>
    ): void
    {
        if(this._inventory === null) return;

        this._ownUserItems?.dispose();
        this._otherUserItems?.dispose();

        if(parser.firstUserId === this._ownUserId)
        {
            this._ownUserItems = firstUserItems;
            this._ownUserNumItems = parser.firstUserNumItems;
            this._ownUserNumCredits = parser.firstUserNumCredits;
            this._otherUserItems = secondUserItems;
            this._otherUserNumItems = parser.secondUserNumItems;
            this._otherUserNumCredits = parser.secondUserNumCredits;
        }
        else
        {
            this._ownUserItems = secondUserItems;
            this._ownUserNumItems = parser.secondUserNumItems;
            this._ownUserNumCredits = parser.secondUserNumCredits;
            this._otherUserItems = firstUserItems;
            this._otherUserNumItems = parser.firstUserNumItems;
            this._otherUserNumCredits = parser.firstUserNumCredits;
        }

        this._ownUserAccepts = false;
        this._otherUserAccepts = false;

        this._view.updateItemList(this._ownUserId);
        this._view.updateItemList(this._otherUserId);
        this._view.updateUserInterface();

        this._inventory.furniModel?.updateItemLocks();
    }

    // AS3: .../TradingModel.as::getOwnItemIdsInTrade()
    getOwnItemIdsInTrade(): number[]
    {
        const ids: number[] = [];

        if(this._ownUserItems === null || this._ownUserItems.disposed) return ids;

        for(let i = 0; i < this._ownUserItems.length; i++)
        {
            const groupItem = this._ownUserItems.getWithIndex(i);

            if(groupItem === null) continue;

            for(let j = 0; j < groupItem.getTotalCount(); j++)
            {
                const item = groupItem.getAt(j);

                if(item !== null) ids.push(item.ref);
            }
        }

        return ids;
    }

    // AS3: .../TradingModel.as::getWindowContainer()
    getWindowContainer(): IWindowContainer | null
    {
        return this._view.getWindowContainer();
    }

    // AS3: .../TradingModel.as::requestInitialization()
    // Empty in AS3 too — the trade arrives unsolicited, so there is nothing to request.
    requestInitialization(): void
    {
    }

    // AS3: .../TradingModel.as::subCategorySwitch()
    // Leaving the trading sub-page while a trade is live cancels it.
    subCategorySwitch(_category: string): void
    {
        if(this._tradingOpen && this._state !== TradingState.READY)
        {
            this.requestCancelTrading();
        }
    }

    // AS3: .../TradingModel.as::closingInventoryView()
    // A web3 trade waiting on confirmation is not cancelled by closing the inventory — it is
    // minimised, and the user is told so.
    closingInventoryView(): void
    {
        if(!this._tradingOpen) return;

        if(this.isConfirmingWeb3Trade())
        {
            this._notifications?.addItem(
                this._localization?.getLocalization('tradingdialog.minimize_web3') ?? '',
                'info',
                'icon_curator_stamp_large_png'
            );
        }
        else
        {
            this.close();
        }
    }

    // AS3: .../TradingModel.as::startConfirmCountdown()
    startConfirmCountdown(): void
    {
        this._view.startConfirmCountdown();
    }

    // AS3: .../TradingModel.as::cancelConfirmCountdown()
    cancelConfirmCountdown(): void
    {
        this._view.cancelConfirmCountdown();
    }

    // AS3: .../TradingModel.as::confirmCountdownReady()
    confirmCountdownReady(): void
    {
        if(this._state === TradingState.COUNTDOWN)
        {
            this.state = TradingState.CONFIRMING;
        }
    }

    // AS3: .../TradingModel.as::handleMessageEvent()
    // One entry point for every trading answer except the open and the item list, which the
    // inventory's message handler unpacks itself before calling startTrading()/updateItemGroupMaps().
    handleMessageEvent(event: IMessageEvent): void
    {
        if(event instanceof TradeOpenFailedEvent)
        {
            log.debug('TRADING::TradeOpenFailedEvent');

            const parser = event.parser as TradeOpenFailedEventParser | null;
            const reason = parser?.reason ?? 0;

            if(reason === TradeOpenFailedEventParser.REASON_OWN_TRADING_DISABLED
                || reason === TradeOpenFailedEventParser.REASON_OTHER_TRADING_DISABLED)
            {
                this._view.alertPopup(TradingView.ALERT_ALREADY_OPEN);
            }
            else
            {
                this._view.alertTradeOpenFailed(reason, parser?.otherUserName ?? '');
            }

            return;
        }

        if(event instanceof TradingAcceptMessageEvent)
        {
            log.debug('TRADING::TradingAcceptEvent');

            const parser = event.parser as TradingAcceptMessageParser | null;

            if(parser === null) return;

            if(parser.userId === this._ownUserId)
            {
                this._ownUserAccepts = parser.accepted;
            }
            else
            {
                this._otherUserAccepts = parser.accepted;
            }

            this._view.updateUserInterface();

            return;
        }

        if(event instanceof TradingConfirmationMessageEvent)
        {
            log.debug('TRADING::TradingConfirmationEvent');
            this.state = TradingState.COUNTDOWN;

            return;
        }

        if(event instanceof TradingCompletedMessageEvent)
        {
            log.debug('TRADING::TradingCompletedEvent');

            if(this.isConfirmingWeb3Trade())
            {
                this._notifications?.addItem(
                    this._localization?.getLocalization('tradingdialog.done_messsage') ?? '',
                    'info',
                    'icon_curator_stamp_large_png'
                );
            }

            this.state = TradingState.COMPLETED;

            return;
        }

        if(event instanceof TradingCloseMessageEvent)
        {
            log.debug('TRADING::TradingCloseEvent');

            if(!this._tradingOpen)
            {
                log.debug('Received TradingCloseEvent, but trading already stopped!!!');

                return;
            }

            const parser = event.parser as TradingCloseMessageParser | null;

            if(parser?.reason === 1)
            {
                if(this._inventory?.getBoolean('trading.commiterror.enabled'))
                {
                    this._view.windowManager?.simpleAlert(
                        '${inventory.trading.notification.title}',
                        '${inventory.trading.notification.commiterror.caption}',
                        '${inventory.trading.notification.commiterror.info}'
                    );
                }
            }
            else if(parser !== null && parser.userId !== this._ownUserId)
            {
                this._view.alertPopup(TradingView.ALERT_OTHER_CANCELLED);
            }

            this.close();

            return;
        }

        if(event instanceof TradingNotOpenMessageEvent)
        {
            // AS3 logs and does nothing else.
            log.debug('TRADING::TradingNotOpenEvent');

            return;
        }

        if(event instanceof TradingOtherNotAllowedEvent)
        {
            this._view.showOtherUserNotification('${inventory.trading.warning.others_account_disabled}');

            return;
        }

        if(event instanceof TradingYouAreNotAllowedEvent)
        {
            this._view.showOwnUserNotification('${inventory.trading.warning.own_account_disabled}');

            return;
        }

        if(event instanceof TradeSilverSetMessageEvent)
        {
            const parser = event.parser as TradeSilverSetMessageEventParser | null;

            if(parser === null) return;

            this._playerSilver = parser.playerSilver;
            this._otherPlayerSilver = parser.otherPlayerSilver;

            this._view.updateUserInterface();

            return;
        }

        if(event instanceof TradeSilverFeeMessageEvent)
        {
            const parser = event.parser as TradeSilverFeeMessageEventParser | null;

            if(parser === null) return;

            this._requiredSilverFee = parser.silverFee;

            this._view.updateUserInterface();

            return;
        }

        log.warn(`TRADING/Unknown message event: ${event}`);
    }

    // AS3: .../TradingModel.as::tradeFeeReached()
    tradeFeeReached(): boolean
    {
        return this._playerSilver + this._otherPlayerSilver >= this._requiredSilverFee;
    }

    // AS3: .../TradingModel.as::requestFurniViewOpen()
    requestFurniViewOpen(): void
    {
        this._inventory?.toggleInventoryPage('furni');
    }

    // AS3: .../TradingModel.as::requestOpenTrading()
    requestOpenTrading(userId: number): void
    {
        this._communication?.connection?.send(new OpenTradingComposer(userId));
    }

    // AS3: .../TradingModel.as::requestAddItemsToTrading()
    // Two AS3 quirks kept as they are:
    //  - a non-groupable item takes the single-item composer and skips `canAddItemToTrade()`
    //    entirely, so the server is the only gate on it;
    //  - the filter loop calls `canAddItemToTrade()` with the *group's* description on every
    //    iteration, not the individual item's, so it is the same answer each time. It still
    //    matters, because the answer changes as items land: it is the "is there room" check.
    requestAddItemsToTrading(
        itemIds: number[],
        isWallItem: boolean,
        classId: number,
        category: number,
        isGroupable: boolean,
        stuffData: IStuffData | null
    ): void
    {
        const ids = [...itemIds];

        if(!isGroupable && ids.length > 0)
        {
            this._communication?.connection?.send(new AddItemToTradeComposer(ids.pop()!));

            return;
        }

        const accepted: number[] = [];

        for(const itemId of ids)
        {
            if(this.canAddItemToTrade(isWallItem, classId, category, isGroupable, stuffData))
            {
                accepted.push(itemId);
            }
        }

        if(accepted.length === 0) return;

        if(accepted.length === 1)
        {
            this._communication?.connection?.send(new AddItemToTradeComposer(accepted.pop()!));

            return;
        }

        this._communication?.connection?.send(new AddItemsToTradeComposer(accepted));
    }

    // AS3: .../TradingModel.as::canAddItemToTrade()
    // Past MAX_ITEMS_TO_TRADE groups an item can still be added, but only onto an existing group
    // of the same category-specific key — that is what the key rules below are for.
    canAddItemToTrade(
        isWallItem: boolean,
        classId: number,
        category: number,
        isGroupable: boolean,
        stuffData: IStuffData | null
    ): boolean
    {
        if(this._ownUserAccepts) return false;

        if(this._ownUserItems === null) return false;

        if(this._ownUserItems.length < MAX_ITEMS_TO_TRADE) return true;

        if(!isGroupable) return false;

        let key: string;

        if(category === FurnitureCategory.POSTER)
        {
            key = String(classId) + 'poster' + (stuffData?.getLegacyString() ?? '');
        }
        else if(category === FurnitureCategory.GUILD_FURNI)
        {
            key = TradingModel.getGuildFurniType(classId, stuffData);
        }
        else
        {
            key = (isWallItem ? 'I' : 'S') + String(classId);
        }

        return this._ownUserItems.getValue(key) !== null;
    }

    // DEVIATION: in AS3 an index past `ownUserItems.length` addresses the NFT list; the RPG fork
    //   removed NFT, so such an index finds no group and nothing is sent.
    // AS3: .../TradingModel.as::requestRemoveItemFromTrading()
    requestRemoveItemFromTrading(index: number): void
    {
        if(this._ownUserAccepts) return;

        const groupItem = this._ownUserItems?.getWithIndex(index) ?? null;

        if(groupItem === null) return;

        const item = groupItem.peek();

        if(item === null) return;

        this._communication?.connection?.send(new RemoveItemFromTradeComposer(item.id));
    }

    // AS3: .../TradingModel.as::requestAcceptTrading()
    requestAcceptTrading(): void
    {
        this._communication?.connection?.send(new AcceptTradingComposer());
    }

    // AS3: .../TradingModel.as::requestUnacceptTrading()
    requestUnacceptTrading(): void
    {
        this._communication?.connection?.send(new UnacceptTradingComposer());
    }

    // AS3: .../TradingModel.as::requestConfirmAcceptTrading()
    // AS3 moves the state *before* sending, so the window is already in its confirmed shape when
    // the server answers.
    requestConfirmAcceptTrading(): void
    {
        this.state = TradingState.CONFIRMED;
        this._communication?.connection?.send(new ConfirmAcceptTradingComposer());
    }

    // AS3: .../TradingModel.as::requestConfirmDeclineTrading()
    requestConfirmDeclineTrading(): void
    {
        this._communication?.connection?.send(new ConfirmDeclineTradingComposer());
    }

    // AS3: .../TradingModel.as::requestCancelTrading()
    // A web3 trade at the confirmation step cannot be cancelled from here — the send is skipped
    // entirely, not just ignored.
    requestCancelTrading(): void
    {
        if(this.isConfirmingWeb3Trade()) return;

        this._communication?.connection?.send(new CloseTradingComposer());
    }

    // AS3: .../TradingModel.as::addSilverFee()
    addSilverFee(addFee: boolean): void
    {
        this._communication?.connection?.send(new SilverFeeMessageComposer(addFee));
    }

    // AS3: .../TradingModel.as::isCreditFurniPresent()
    isCreditFurniPresent(): boolean
    {
        return this._ownUserNumCredits > 0 || this._otherUserNumCredits > 0;
    }

    // AS3: .../TradingModel.as::get citizenshipTalentTrackEnabled()
    // Read by nothing in the dump either — kept so the member list matches.
    private get citizenshipTalentTrackEnabled(): boolean
    {
        return this._inventory?.getBoolean('talent.track.citizenship.enabled') ?? false;
    }

    // AS3: .../TradingModel.as::updateView()
    // Empty in AS3: the model pushes to the view, the view never pulls.
    updateView(): void
    {
    }

    // AS3: .../TradingModel.as::selectItemById()
    selectItemById(_itemId: string): void
    {
        log.debug('NOT SUPPORTED: TRADING VIEW SELECT BY ID');
    }

    // AS3: .../TradingModel.as::dispose()
    // AS3 disposes its two views and nulls its references — it deliberately never sends a cancel
    // from here.
    dispose(): void
    {
        if(this._disposed) return;

        if(!this._view.disposed) this._view.dispose();

        if(!this._nameScamWarning.disposed) this._nameScamWarning.dispose();

        this._inventory = null;
        this._communication = null;
        this._localization = null;
        this._notifications = null;
        this._disposed = true;
    }
}
