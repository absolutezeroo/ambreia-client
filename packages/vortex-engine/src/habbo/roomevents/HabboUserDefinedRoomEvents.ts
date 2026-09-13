import {Component, ComponentDependency} from '@core/runtime';
import type {IContext} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets';
import type {IMessageComposer} from '@core';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';

import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboNotifications} from '@iid/IIDHabboNotifications';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_RoomUI} from '@iid/IIDRoomUI';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_WiredMenuController} from '@iid/IIDWiredMenuController';
import {IID_SelfDonationTool} from '@iid/IIDSelfDonationTool';
import {IID_RewardNotificationController} from '@iid/IIDRewardNotificationController';
import {IID_WiredChestController} from '@iid/IIDWiredChestController';
import {IID_TransactionLogsController} from '@iid/IIDTransactionLogsController';
import {IID_TransactionDetailsController} from '@iid/IIDTransactionDetailsController';

import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import {RoomEngineEvent} from '@habbo/room/events/RoomEngineEvent';
import {RoomEngineObjectEvent} from '@habbo/room/events/RoomEngineObjectEvent';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import {RoomSessionEvent} from '@habbo/session/events/RoomSessionEvent';
import type {IRoomUI} from '@habbo/ui/IRoomUI';
import type {IRoomDesktop} from '@habbo/ui/IRoomDesktop';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';

import type {IHabboUserDefinedRoomEvents} from './IHabboUserDefinedRoomEvents';
import type {IUserDefinedRoomEventsCtrl} from './wired_setup/IUserDefinedRoomEventsCtrl';
import {UserDefinedRoomEventsCtrl} from './wired_setup/UserDefinedRoomEventsCtrl';
import {WiredVariablesSynchronizer} from './WiredVariablesSynchronizer';
import {WiredMenuController} from './wired_menu/WiredMenuController';
import {SelfDonationTool} from './misc/SelfDonationTool';
import {RewardNotificationController} from './wired_trading/reward_notification/RewardNotificationController';
import {WiredContractController} from './wired_trading/contracts/WiredContractController';
import {WiredChestController} from './wired_trading/chests/WiredChestController';
import {
    WiredTransactionLogsController
} from './wired_trading/transactions/overview/WiredTransactionLogsController';
import {
    WiredTransactionDetailsController
} from './wired_trading/transactions/details/WiredTransactionDetailsController';
import {WiredEnvironment} from './WiredEnvironment';
import {NewVariablePickerHelper} from './wired_setup/uibuilder/presets/newvariablepicker/NewVariablePickerHelper';
import {IncomingMessages} from './IncomingMessages';
import {WiredClickUserMessageComposer} from '@habbo/communication/messages/outgoing/userdefinedroomevents/WiredClickUserMessageComposer';
import {AssetLibraryVariableFxAssetProvider} from '@habbo/room/object/visualization/variablefx/AssetLibraryVariableFxAssetProvider';
import {VariableFxRendererRegistry} from '@habbo/room/object/visualization/variablefx/VariableFxRendererRegistry';
import type {IVariableFxAssetProvider} from '@habbo/room/object/visualization/variablefx/IVariableFxAssetProvider';

const log = Logger.getLogger('habbo.roomevents.HabboUserDefinedRoomEvents');

/**
 * HabboUserDefinedRoomEvents — the top-level "wired" component. Owns the wired-setup controller
 * (wiredCtrl), the room-events menu (wiredMenu), the WiredEnvironment (room-wide click settings /
 * achievements / click-user), and — in the full client — the incoming-message handler, the variable
 * synchronizer and the wired-trading controllers. Acts as the shared context every wired
 * sub-controller is constructed with.
 *
 * Every sub-controller AS3 builds is built here: wiredCtrl, wiredMenu, WiredEnvironment, the
 * incoming handler (IncomingMessages / _SafeCls_1951), the WiredVariablesSynchronizer, the
 * new-variable-picker helper, and the whole wired-trading set — chest, transaction logs, transaction
 * details, contract, reward-notification and self-donation. **AS3 creates them in the constructor;
 * this port defers creation to initComponent()** so DI dependencies (communication, the window
 * manager) are resolved first — the same pattern as HabboHelp. Several of them subscribe to a
 * server push from their own constructor, which makes constructing them the entire wiring.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as
 */
export class HabboUserDefinedRoomEvents extends Component implements IHabboUserDefinedRoomEvents
{
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_communication
    private _communication: IHabboCommunicationManager | null = null;
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_localization
    private _localization: IHabboLocalizationManager | null = null;
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_notifications
    private _notifications: IHabboNotifications | null = null;
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_roomUI
    private _roomUI: IRoomUI | null = null;
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;

    private _roomSession: IRoomSession | null = null;
    private _roomSessionManager: IRoomSessionManager | null = null;
    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_userName
    private _userName: string = '';

    // Created in initComponent() (see scope note).
    private _wiredCtrl!: UserDefinedRoomEventsCtrl;

    // AS3: HabboUserDefinedRoomEvents.as::_variablesSynchronizer
    private _variablesSynchronizer!: WiredVariablesSynchronizer;
    private _wiredMenu!: WiredMenuController;

    // AS3: HabboUserDefinedRoomEvents.as::_selfDonationTool
    private _selfDonationTool!: SelfDonationTool;

    // AS3: HabboUserDefinedRoomEvents.as::_rewardNotificationController
    private _rewardNotificationController!: RewardNotificationController;

    // AS3: HabboUserDefinedRoomEvents.as::_contractController
    private _contractController!: WiredContractController;

    // AS3: HabboUserDefinedRoomEvents.as::_SafeStr_6781 (name derived: the wired-chest controller)
    private _wiredChest!: WiredChestController;

    // AS3: HabboUserDefinedRoomEvents.as::_SafeStr_6527 (name derived: the paged transaction logs)
    private _transactionLogs!: WiredTransactionLogsController;

    // AS3: HabboUserDefinedRoomEvents.as::_transactionDetails
    private _transactionDetails!: WiredTransactionDetailsController;
    private _wiredEnvironment!: WiredEnvironment;

    // AS3: HabboUserDefinedRoomEvents.as::_variablePickerHelper (shared state for the variable picker).
    private _variablePickerHelper!: NewVariablePickerHelper;

    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::_incomingMessages
    private _incomingMessages: IncomingMessages | null = null;

    /**
	 * Shows or hides a named button inside a container, wiring it on the way in.
	 *
	 * Nothing in any tree calls this one — the `_friendList.refreshButton(...)` sites in
	 * `habbo/friendlist` are `HabboFriendList`'s own same-named member, a different class — but it
	 * is public AS3 API and a caller can arrive, so it ships rather than being left as a note.
	 *
	 * `tooltip` doubles as the asset name when it is omitted, which is why hiding takes the cheap
	 * path and never touches the image.
	 */
    // AS3: HabboUserDefinedRoomEvents.as::refreshButton()
    refreshButton(
        container: IWindowContainer,
        name: string,
        visible: boolean,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null,
        id: number,
        tooltip: string | null = null
    ): void
    {
        const assetName = tooltip ?? name;
        const button = container.findChildByName(name) as IBitmapWrapperWindow | null;

        if(button === null) return;

        if(!visible)
        {
            (button as unknown as IWindow).visible = false;

            return;
        }

        this.prepareButton(button, assetName, procedure, id);
        (button as unknown as IWindow).visible = true;
    }

    /**
	 * The `bitmap != null` early return is what makes this idempotent: a button already carrying
	 * its image keeps it and only has its id and procedure refreshed, so repeated `refreshButton()`
	 * calls do not re-read the asset library on every redraw.
	 */
    // AS3: HabboUserDefinedRoomEvents.as::prepareButton()
    private prepareButton(
        button: IBitmapWrapperWindow,
        assetName: string,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null,
        id: number
    ): void
    {
        const window = button as unknown as IWindow;

        window.id = id;
        window.procedure = procedure;

        if(button.bitmap !== null) return;

        const image = this.getButtonImage(assetName);

        if(image === null) return;

        button.bitmap = image;
        window.width = image.width;
        window.height = image.height;
    }

    /**
     * The asset library is not optional decoration: AS3's third constructor argument is forwarded
     * verbatim to WiredMenuController, WiredChestController, WiredTransactionLogsController,
     * WiredTransactionDetailsController and RewardNotificationController, and those read their
     * layouts straight out of it — `WiredChestWrapperView` opens with
     * `assets.getAssetByName("chest_generic_xml")`. Dropped, `Component.assets` stays null and the
     * chest window is never built at all.
     */
    // AS3: HabboUserDefinedRoomEvents.as::HabboUserDefinedRoomEvents()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    // AS3: HabboUserDefinedRoomEvents.as::get dependencies()
    // The base Component's dependency-eventListener list attaches to the resolved instance's `events`
    // emitter. Audited per emitter:
    //   - RSE_* : RoomSessionManager emits on `sessionEvents` (not `events`, per rule 20-architecture
    //     #4) → the list never fired; now subscribed on sessionEvents in the resolve callback below.
    //   - HTE_TOOLBAR_CLICK : HabboToolbar emits on `toolbarEvents` → same fix (subscribed below);
    //     its handler (wiredMenu.toggleView) is still a wired_menu-bloc stub, so currently inert.
    //   - REOE_ADDED : RoomEngine DOES emit on `events`, so the list form works — kept as-is.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- variance: typed ComponentDependency<T> is contravariant in T
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) => { this._communication = manager; }
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) => { this._windowManager = manager; }
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) => { this._localization = manager; }
            ),
            new ComponentDependency(
                IID_HabboNotifications,
                (manager: IHabboNotifications | null) => { this._notifications = manager; }
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (engine: IRoomEngine | null) => { this._roomEngine = engine; },
                true,
                [{ type: RoomEngineObjectEvent.REOE_ADDED, callback: (e: unknown) => this.roomObjectAddedHandler(e) }]
            ),
            // AS3 registers the RSE_* listeners through the dependency's event-listener list, which the
            // port attaches to the resolved instance's `events` emitter. RoomSessionManager emits RSE_*
            // on `sessionEvents` (the port keeps `events` for the DI system, rule 20-architecture #4),
            // so those listeners never fired and _roomSession stayed null (→ roomId 0). Subscribe on
            // sessionEvents in the resolve callback instead — the same pattern HabboCatalog/HabboInventory use.
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_CREATED, this._onRoomSessionEvent);
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this._onRoomSessionEvent);
                    this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this._onRoomSessionEvent);

                    this._roomSessionManager = manager;

                    manager?.sessionEvents.on(RoomSessionEvent.RSE_CREATED, this._onRoomSessionEvent);
                    manager?.sessionEvents.on(RoomSessionEvent.RSE_STARTED, this._onRoomSessionEvent);
                    manager?.sessionEvents.on(RoomSessionEvent.RSE_ENDED, this._onRoomSessionEvent);
                },
                false
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) => { this._sessionDataManager = manager; }
            ),
            new ComponentDependency(
                IID_RoomUI,
                (ui: IRoomUI | null) => { this._roomUI = ui; },
                false
            ),
            // Same emitter mismatch as RSE_* above: HabboToolbar dispatches TOOLBAR_CLICK on its
            // dedicated `toolbarEvents` emitter, not `events`, so the dependency's event-listener list
            // never fired. Subscribe on toolbarEvents in the resolve callback. (Its handler target,
            // wiredMenu.toggleView(), is still a wired_menu-bloc stub, so this is currently inert — but
            // now correctly wired for when that bloc lands.)
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) =>
                {
                    this._toolbar?.toolbarEvents.off(HabboToolbarEvent.TOOLBAR_CLICK, this._onToolbarEvent);
                    this._toolbar = toolbar;
                    toolbar?.toolbarEvents.on(HabboToolbarEvent.TOOLBAR_CLICK, this._onToolbarEvent);
                },
                false
            )
        ];
    }

    /**
	 * **AS3 builds all eleven sub-controllers in its constructor; this port builds them here**, where
	 * `context` and `assets` are resolved. The *order within the block is AS3's, exactly*, and it is
	 * load-bearing: `UserDefinedRoomEventsCtrl` comes first because it owns the wired-style table,
	 * and `UbuntuPresetManager` — which the contract controller, the reward notification and the
	 * self-donation tool each build in their own constructor — reads `wiredCtrl.getStyleByName()`.
	 * Building any of those three first throws, and the throw happens inside `initComponent()`, so
	 * the whole component is left half-constructed with no wired UI at all.
	 *
	 * The attach calls come after the constructors, as AS3 does — a component that resolves a
	 * dependency during `attachComponent` must not find a half-built parent.
	 *
	 * AS3's own `initComponent()` holds only the last two statements.
	 */
    // AS3: HabboUserDefinedRoomEvents.as::HabboUserDefinedRoomEvents() + initComponent()
    protected override initComponent(): void
    {
        this._wiredCtrl = new UserDefinedRoomEventsCtrl(this);
        this._variablesSynchronizer = new WiredVariablesSynchronizer(this);
        this._wiredEnvironment = new WiredEnvironment(this);
        this._wiredMenu = new WiredMenuController(this, this.context, 0, this.assets);

        // The chest window and the two transaction windows. None of them opens itself: each
        // subscribes to a server push from its own constructor — "open chest N", a page of logs, one
        // transaction's breakdown — so constructing them is the entire wiring.
        this._wiredChest = new WiredChestController(this, this.context, 0, this.assets);
        this._transactionLogs = new WiredTransactionLogsController(this, this.context, 0, this.assets);
        this._transactionDetails = new WiredTransactionDetailsController(this, this.context, 0, this.assets);

        this._variablePickerHelper = new NewVariablePickerHelper(this);

        // A plain object rather than a DI component — it takes only `roomEvents` and reaches
        // communication through it, so there is no IID and no attachComponent.
        this._contractController = new WiredContractController(this);

        this._rewardNotificationController = new RewardNotificationController(this, this.context, 0, this.assets);

        // No toolbar entry and no caller: the only way in is its own `selfdonation/open` link
        // tracker, registered from its own initComponent(). It is built unconditionally, exactly as
        // AS3 does, and refuses outside a sandbox environment at `open()` rather than by not existing.
        this._selfDonationTool = new SelfDonationTool(this, this.context, 0, this.assets);

        this.context.attachComponent(this._wiredMenu, [IID_WiredMenuController]);
        this.context.attachComponent(this._wiredChest, [IID_WiredChestController]);
        this.context.attachComponent(this._transactionLogs, [IID_TransactionLogsController]);
        this.context.attachComponent(this._transactionDetails, [IID_TransactionDetailsController]);
        this.context.attachComponent(this._rewardNotificationController, [IID_RewardNotificationController]);
        this.context.attachComponent(this._selfDonationTool, [IID_SelfDonationTool]);

        // AS3's initComponent() proper.
        this._incomingMessages = new IncomingMessages(this);
        this._roomEngine?.events.on(RoomEngineEvent.REE_DISPOSED, this._onRoomEngineEvent);

        log.debug('HabboUserDefinedRoomEvents initialized');
    }

    // --- Getters ---

    // AS3: HabboUserDefinedRoomEvents.as::get communication()
    get communication(): IHabboCommunicationManager | null
    {
        return this._communication;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get localization()
    get localization(): IHabboLocalizationManager
    {
        return this._localization!;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get notifications()
    get notifications(): IHabboNotifications
    {
        return this._notifications!;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get roomEngine()
    get roomEngine(): IRoomEngine | null
    {
        return this._roomEngine;
    }

    /**
     * The Variable FX services the wired editor's preview renders with.
     *
     * Deliberately its OWN provider and registry, not the room's: AS3 builds a second pair here
     * too. A preview is not in a room, has no room configs, and must keep working while no room is
     * loaded at all — sharing the visualization factory's pair would tie the editor's lifetime to a
     * room instance's.
     *
     * DEVIATION: AS3 builds them in `setRoomObjectVisualizationFactory()`, off the factory's asset
     *   library, because its factory is a Component. This port's factory is a plain class with no
     *   IID, so there is nothing to depend on — built lazily off this component's own asset
     *   library instead, which is the same library by the time either is asked for.
     * AS3: HabboUserDefinedRoomEvents.as::setRoomObjectVisualizationFactory()
     */
    private _variableFxAssetProvider: IVariableFxAssetProvider | null = null;

    // AS3: HabboUserDefinedRoomEvents.as::_variableFxRendererRegistry
    private _variableFxRendererRegistry: VariableFxRendererRegistry | null = null;

    // AS3: HabboUserDefinedRoomEvents.as::get variableFxAssetProvider()
    get variableFxAssetProvider(): IVariableFxAssetProvider | null
    {
        const assets = this.assets;

        if(this._variableFxAssetProvider === null && assets !== null)
        {
            this._variableFxAssetProvider = new AssetLibraryVariableFxAssetProvider(assets);
        }

        return this._variableFxAssetProvider;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get variableFxRendererRegistry()
    get variableFxRendererRegistry(): VariableFxRendererRegistry | null
    {
        const provider = this.variableFxAssetProvider;

        if(this._variableFxRendererRegistry === null && provider !== null)
        {
            this._variableFxRendererRegistry = VariableFxRendererRegistry.createDefault(provider);
        }

        return this._variableFxRendererRegistry;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get wiredCtrl()
    get wiredCtrl(): IUserDefinedRoomEventsCtrl
    {
        return this._wiredCtrl;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get variablesSynchronizer()
    get variablesSynchronizer(): WiredVariablesSynchronizer
    {
        return this._variablesSynchronizer;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get wiredMenu()
    get wiredMenu(): WiredMenuController
    {
        return this._wiredMenu;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get wiredChest()
    get wiredChest(): WiredChestController
    {
        return this._wiredChest;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get transactionLogs()
    get transactionLogs(): WiredTransactionLogsController
    {
        return this._transactionLogs;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get transactionDetails()
    get transactionDetails(): WiredTransactionDetailsController
    {
        return this._transactionDetails;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get rewardNotificationController()
    get rewardNotificationController(): RewardNotificationController
    {
        return this._rewardNotificationController;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get selfDonationTool()
    get selfDonationTool(): SelfDonationTool
    {
        return this._selfDonationTool;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get variablePickerHelper()
    get variablePickerHelper(): NewVariablePickerHelper
    {
        return this._variablePickerHelper;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get roomUI()
    get roomUI(): IRoomUI | null
    {
        return this._roomUI;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get roomDesktop()
    get roomDesktop(): IRoomDesktop | null
    {
        return this._roomUI?.desktop ?? null;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get roomId()
    get roomId(): number
    {
        return this._roomSession ? this._roomSession.roomId : 0;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get roomSession()
    get roomSession(): IRoomSession | null
    {
        return this._roomSession;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get userName()
    get userName(): string
    {
        return this._userName;
    }

    // AS3: HabboUserDefinedRoomEvents.as::set userName()
    set userName(value: string)
    {
        this._userName = value;
    }

    // --- IHabboUserDefinedRoomEvents ---

    // AS3: HabboUserDefinedRoomEvents.as::stuffSelected()
    stuffSelected(id: number): void
    {
        // A furni that has just been placed is not a wired selection — the click that dropped it
        // would otherwise open the wired picker on it. Clearing the record consumes the placement,
        // so the next click on the same furni does select it.
        const placed = this._roomEngine?.getPlacedObjectData(this.roomId) ?? null;

        if(placed !== null && placed.id === -id)
        {
            this._roomEngine?.setPlacedObjectData(this.roomId, null);

            return;
        }

        this._wiredCtrl.stuffSelected(id);
        this._wiredMenu.furniSelected(id);
    }

    // AS3: HabboUserDefinedRoomEvents.as::userSelected()
    userSelected(id: number): void
    {
        if(this.hasClickUserWired())
        {
            this.send(new WiredClickUserMessageComposer(id));
        }
        this._wiredMenu.userSelected(id);
    }

    // AS3: HabboUserDefinedRoomEvents.as::showInspectButton()
    showInspectButton(): boolean
    {
        return this._wiredMenu.isEnabled && this._wiredMenu.hasReadPermission && this._wiredMenu.wiredInspectButton;
    }

    // AS3: HabboUserDefinedRoomEvents.as::showToolbarMenuButton()
    showToolbarMenuButton(): boolean
    {
        return this._wiredMenu.isEnabled && this._wiredMenu.hasReadPermission && this._wiredMenu.wiredMenuButton;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get wiredWhisperDisabled()
    get wiredWhisperDisabled(): boolean
    {
        return this._wiredMenu.wiredWhisperDisabled;
    }

    // AS3: HabboUserDefinedRoomEvents.as::set wiredWhisperDisabled()
    set wiredWhisperDisabled(value: boolean)
    {
        this._wiredMenu.wiredWhisperDisabled = value;
    }

    // AS3: HabboUserDefinedRoomEvents.as::hasClickUserWired()
    hasClickUserWired(): boolean
    {
        return this._wiredEnvironment.hasClickUserWired;
    }

    // AS3: HabboUserDefinedRoomEvents.as::get achievementsInRoom()
    get achievementsInRoom(): string[] | null
    {
        return this._wiredEnvironment ? this._wiredEnvironment.achievements : null;
    }

    // AS3: HabboUserDefinedRoomEvents.as::switchPlayTestMode()
    switchPlayTestMode(): void
    {
        this._wiredMenu.setPlayTestMode(!this._wiredMenu.playTestMode, true, true);
    }

    // AS3: HabboUserDefinedRoomEvents.as::resetCache()
    resetCache(): void
    {
        this._wiredCtrl.clearCache();
    }

    // AS3: HabboUserDefinedRoomEvents.as::hasWiredUIOpen()
    hasWiredUIOpen(): boolean
    {
        return this._wiredCtrl.hasUIOpen() || this._wiredMenu.hasUIOpen();
    }

    // AS3: HabboUserDefinedRoomEvents.as::get isGameMode()
    get isGameMode(): boolean
    {
        return this._wiredEnvironment.clickUserOption === 1;
    }

    // AS3: HabboUserDefinedRoomEvents.as::send()
    send(composer: IMessageComposer<unknown[]>): void
    {
        this._communication?.connection?.send(composer);
    }

    // AS3: HabboUserDefinedRoomEvents.as::getXmlWindow()
    getXmlWindow(name: string): IWindow | null
    {
        try
        {
            // AS3: assets.getAssetByName(name + "_xml") → _windowManager.buildFromXML(content).
            // In this port, window layouts are not held in a per-component asset library; every
            // window-layouts/*.xml is registered once in the window manager's widget-layout registry
            // (App.ts → registerWidgetLayout, keyed by the *Com.as field name, i.e. name + "_xml").
            // buildWidgetLayout(name + "_xml") is the exact equivalent: fetch that stored XML and
            // buildFromXML() a fresh window — the same path ClubCenterView/CatalogPage/etc. use.
            return this.windowManager?.buildWidgetLayout(name + '_xml') ?? null;
        }
        catch (_e)
        {
            return null;
        }
    }

    /**
     * 🐛 The `suffix` used to default to `'_png'` and be concatenated, exactly as AS3 writes it —
     * and every lookup answered null. AS3 asks for `<name>_png` because that is the *field name* in
     * the component's `*Com.as`; this port registers images under the bare file basename, so
     * `icon_source_context_png` finds nothing where `icon_source_context` is on disk. The only
     * caller is `SourceTypeOption`, so the wired input-source picker's four icons were blank, with
     * no error and no log — the same suffix trap `HabboFriendList.getButtonImage()` and
     * `HabboGroupsManager.getButtonImage()` already document.
     *
     * Resolved the way `HabboNavigator.getButtonImage()` already does it — bare name first, the
     * suffixed one as a fallback — so a library that really does key an asset the AS3 way still
     * works. The parameter keeps AS3's signature.
     */
    // AS3: HabboUserDefinedRoomEvents.as::getButtonImage()
    getButtonImage(name: string, suffix: string = '_png'): ImageBitmap | null
    {
        // AS3 resolves a BitmapDataAsset and returns a clone() of its BitmapData; the port's image
        // assets are ImageBitmaps consumed read-only by the caller, so the content is returned directly.
        const asset = this.assets?.getAssetByName(name) ?? this.assets?.getAssetByName(name + suffix) ?? null;

        if(asset === null)
        {
            log.warn(`GETTING ASSET: ${name} (nor ${name}${suffix}) - not in the library`);

            return null;
        }

        return (asset.content as ImageBitmap | null) ?? null;
    }

    // --- Event handlers ---

    /**
	 * AS3 dereferences `_SafeStr_5997` unguarded, and can: it is assigned in the constructor, so the
	 * REOE_ADDED listener cannot outrun it. This port builds it in `initComponent()`, which runs
	 * *after* each dependency's listeners are attached — so a furni added between RoomEngine
	 * resolving and initComponent running reaches here with nothing to tell. The room previewer
	 * behind the inventory is the path that actually does it.
	 */
    // AS3: HabboUserDefinedRoomEvents.as::roomObjectAddedHandler()
    private roomObjectAddedHandler(event: unknown): void
    {
        if(this._wiredCtrl == null) return;

        // AS3 param is RoomEngineObjectEvent (objectId + category).
        const e = event as { objectId: number; category: number };
        switch(e.category - 10)
        {
            case 0:
                this._wiredCtrl.stuffAdded(e.objectId);
                break;
            case 10:
                this._wiredCtrl.stuffAdded(-e.objectId);
                break;
        }
    }

    // Bound entry point for sessionEvents.on/off (preserves `this`; see the RoomSessionManager
    // dependency). Delegates to the AS3-named handler below.
    private _onRoomSessionEvent = (event: RoomSessionEvent): void =>
    {
        this.roomSessionStateEventHandler(event);
    };

    // AS3: HabboUserDefinedRoomEvents.as::roomSessionStateEventHandler()
    private roomSessionStateEventHandler(event: unknown): void
    {
        if(this._roomEngine == null) return;

        // AS3 param is RoomSessionEvent (type + session).
        const e = event as { type: string; session: IRoomSession };
        switch(e.type)
        {
            case 'RSE_CREATED':
                this._roomSession = e.session;
                break;
            case 'RSE_STARTED':
                this._roomSession = e.session;
                break;
            case 'RSE_ENDED':
                this._roomSession = e.session;
                this._wiredEnvironment.leaveRoom();
                break;
        }
    }

    // AS3: HabboUserDefinedRoomEvents.as::onHabboToolbarEvent()
    // Bound entry point for toolbarEvents.on/off (preserves `this`; see the HabboToolbar dependency).
    private _onToolbarEvent = (event: unknown): void =>
    {
        this.onHabboToolbarEvent(event);
    };

    // AS3: .../src/com/sulake/habbo/roomevents/HabboUserDefinedRoomEvents.as::onHabboToolbarEvent()
    private onHabboToolbarEvent(event: unknown): void
    {
        // AS3 param is HabboToolbarEvent (type + iconId).
        const e = event as { type: string; iconId: string };
        if(e.type !== 'HTE_TOOLBAR_CLICK') return;
        if(e.iconId === 'HTIE_ICON_WIRED_MENU')
        {
            this._wiredMenu.toggleView();
        }
    }

    // AS3: HabboUserDefinedRoomEvents.as::onRoomEngineEvent()
    private _onRoomEngineEvent = (event: unknown): void =>
    {
        const e = event as { type: string } | null;
        if(e == null) return;
        if(e.type === RoomEngineEvent.REE_DISPOSED)
        {
            // AS3's order, kept: the variable cache, the room-wide click settings, the setup dialog,
            // then the contract editors. The synchronizer goes first because the other three can
            // still read variables while tearing down.
            this._variablesSynchronizer.clear();
            this._wiredEnvironment.clear();
            this._wiredCtrl.close();
            this._contractController.clear();
        }
    };

    // AS3: HabboUserDefinedRoomEvents.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._roomEngine?.events.off(RoomEngineEvent.REE_DISPOSED, this._onRoomEngineEvent);
        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_CREATED, this._onRoomSessionEvent);
        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_STARTED, this._onRoomSessionEvent);
        this._roomSessionManager?.sessionEvents.off(RoomSessionEvent.RSE_ENDED, this._onRoomSessionEvent);
        this._toolbar?.toolbarEvents.off(HabboToolbarEvent.TOOLBAR_CLICK, this._onToolbarEvent);

        if(this._incomingMessages != null)
        {
            this._incomingMessages.dispose();
            this._incomingMessages = null;
        }

        if(this._variablesSynchronizer)
        {
            this._variablesSynchronizer.dispose();
        }

        if(this._wiredEnvironment)
        {
            this._wiredEnvironment.dispose();
        }

        // AS3 disposes the chest controller here by hand, even though the context would reach it on
        // detach — it is transcribed rather than left to the context, because the wrapper view it
        // owns sends a close message on the way down and the order matters.
        this._wiredChest?.dispose();
        this._transactionLogs?.dispose();
        this._transactionDetails?.dispose();

        super.dispose();

        log.debug('HabboUserDefinedRoomEvents disposed');
    }
}
