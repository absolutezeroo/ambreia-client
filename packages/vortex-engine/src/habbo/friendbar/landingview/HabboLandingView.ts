import type {IContext} from '@core/runtime';
import {ComponentDependency} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboQuestEngine} from '@habbo/quest/IHabboQuestEngine';
import type {IHabboHelp} from '@habbo/help/IHabboHelp';
import type {IProductData} from '@habbo/session/product/IProductData';
import type {IProductDataListener} from '@habbo/session/product/IProductDataListener';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import {QuitMessageComposer} from '@habbo/communication/messages/outgoing/room/session/QuitMessageComposer';
import {ForwardToARandomPromotedRoomMessageComposer} from '@habbo/communication/messages/outgoing/navigator/ForwardToARandomPromotedRoomMessageComposer';
import {RequestABadgeComposer} from '@habbo/communication/messages/outgoing/inventory/RequestABadgeComposer';
import {CommunityGoalVoteMessageComposer} from '@habbo/communication/messages/outgoing/landingview/votes/CommunityGoalVoteMessageComposer';
import {NavigatorSettingsMessageEvent} from '@habbo/communication/messages/incoming/navigator/NavigatorSettingsMessageEvent';
import type {NavigatorSettingsMessageParser} from '@habbo/communication/messages/parser/navigator/NavigatorSettingsMessageParser';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {CatalogEvent} from '@habbo/catalog/event/CatalogEvent';
import type {IHabboLandingView} from '../IHabboLandingView';
import {AbstractView} from '../view/AbstractView';
import {WidgetContainerLayout} from './layout/WidgetContainerLayout';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_HabboNavigator} from '@iid/IIDHabboNavigator';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import {IID_HabboQuestEngine} from '@iid/IIDHabboQuestEngine';
import {IID_HabboHelp} from '@iid/IIDHabboHelp';
import {IID_HabboAvatarEditor} from '@iid/IIDHabboAvatarEditor';
import type {IHabboAvatarEditor} from '@habbo/avatar/IHabboAvatarEditor';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {HabboToolbarEnum} from '@habbo/toolbar/HabboToolbarEnum';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.friendbar.landingview.HabboLandingView');

/**
 * HabboLandingView
 *
 * The landing view is the first screen shown when entering the hotel.
 * It creates a WidgetContainerLayout that fills the background layer (0)
 * and sets the toolbar to hotel view state.
 *
 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as
 */
export class HabboLandingView extends AbstractView implements IHabboLandingView
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::positionAfterAndStretch()
    public static positionAfterAndStretch(container: IWindowContainer, afterName: string, targetName: string): void
    {
        const afterWindow = container.findChildByName(afterName);
        const targetWindow = container.findChildByName(targetName);

        if(!afterWindow || !targetWindow) return;

        const originalRight = targetWindow.x;

        targetWindow.x = afterWindow.x + afterWindow.width + 5;
        targetWindow.width += originalRight - targetWindow.x;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_landingViewLayout
    private _landingViewLayout: WidgetContainerLayout | null = null;
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;
    private _initialized: boolean = false;

    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_communicationManager
    private _communicationManager: IHabboCommunicationManager | null = null;

    /**
	 * The communication manager
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get communicationManager()
    get communicationManager(): IHabboCommunicationManager | null
    {
        return this._communicationManager;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_navigator
    private _navigator: IHabboNavigator | null = null;

    /**
	 * The navigator
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get navigator()
    get navigator(): IHabboNavigator | null
    {
        return this._navigator;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;

    /**
	 * The room engine
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get roomEngine()
    get roomEngine(): IRoomEngine | null
    {
        return this._roomEngine;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_catalog
    private _catalog: IHabboCatalog | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get catalog()
    get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_questEngine
    private _questEngine: IHabboQuestEngine | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get questEngine()
    get questEngine(): IHabboQuestEngine | null
    {
        return this._questEngine;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_habboHelp
    private _habboHelp: IHabboHelp | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get habboHelp()
    get habboHelp(): IHabboHelp | null
    {
        return this._habboHelp;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_avatarEditor
    // Provided since `HabboAvatarEditorManager` landed.
    private _avatarEditor: IHabboAvatarEditor | null = null;

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get avatarEditor()
    get avatarEditor(): IHabboAvatarEditor | null
    {
        return this._avatarEditor;
    }

    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::_errorLayout
    private _errorLayout: IWindow | null = null;

    /**
	 * Whether the landing view is currently visible
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get isLandingViewVisible()
    get isLandingViewVisible(): boolean
    {
        return this._landingViewLayout != null
			&& this._landingViewLayout.window != null
			&& this._landingViewLayout.window.visible;
    }

    /**
	 * Whether this is a new identity user
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get newIdentity()
    get newIdentity(): boolean
    {
        return this.getInteger('new.identity', 0) > 0;
    }

    /**
	 * Left pane width for dynamic layout
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get dynamicLayoutLeftPaneWidth()
    get dynamicLayoutLeftPaneWidth(): number
    {
        return this.getInteger('landing.view.dynamic.leftPaneWidth', 500);
    }

    /**
	 * Right pane width for dynamic layout
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get dynamicLayoutRightPaneWidth()
    get dynamicLayoutRightPaneWidth(): number
    {
        return this.getInteger('landing.view.dynamic.rightPaneWidth', 250);
    }

    /**
	 * The window manager
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    /**
	 * The localization manager
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get localizationManager()
    get localization(): IHabboLocalizationManager | null
    {
        return this._localizationManager;
    }

    /**
	 * The session data manager
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get sessionDataManager()
    get sessionData(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get tracking()
    get tracking(): IHabboTracking | null
    {
        return this._tracking;
    }

    // DEVIATION: AS3 also takes the games manager (stored and never read);
    //   the RPG fork removed Snow War and the games manager.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            ...super.dependencies,
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communicationManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboConfigurationManager,
                null,
                true
            ),
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) =>
                {
                    this._toolbar = toolbar;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboNavigator,
                (navigator: IHabboNavigator | null) =>
                {
                    this._navigator = navigator;
                },
                false
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (engine: IRoomEngine | null) =>
                {
                    this._roomEngine = engine;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCatalog,
                (catalog: IHabboCatalog | null) =>
                {
                    this._catalog = catalog;
                }
            ),
            new ComponentDependency(
                IID_HabboQuestEngine,
                (questEngine: IHabboQuestEngine | null) =>
                {
                    this._questEngine = questEngine;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboHelp,
                (habboHelp: IHabboHelp | null) =>
                {
                    this._habboHelp = habboHelp;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboAvatarEditor,
                (avatarEditor: unknown) =>
                {
                    this._avatarEditor = (avatarEditor as IHabboAvatarEditor | null) ?? null;
                },
                false
            ),
        ];
    }

    /**
	 * Create the landing view layout and activate it.
	 *
	 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as initialize()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::initialize()
    public initialize(): void
    {
        this._initialized = true;

        const desktop = (this._windowManager?.getDesktop(0) ?? null) as IWindowContainer | null;
        const welcomeWindow = desktop?.getChildByName('hotel_view_welcome_window') ?? null;

        if(welcomeWindow && desktop)
        {
            desktop.removeChild(welcomeWindow);
            welcomeWindow.dispose();
        }

        if(this.newIdentity && this.getBoolean('landing.view.new_identity_override_enabled'))
        {
            const newIdentityWidgets = this.getProperty('landing.view.new_identity_widgets').split(',');

            for(let slot = 1; slot <= 6; slot++)
            {
                const slotPrefix = `landing.view.dynamic.slot.${slot}.`;

                if(slot === 1 || slot === 6)
                {
                    this.setProperty(slotPrefix + 'widget', '');
                }
                else
                {
                    this.setProperty(slotPrefix + 'widget', 'widgetcontainer');
                    this.setProperty(slotPrefix + 'conf', '2001-01-01 00:00,' + newIdentityWidgets[slot - 2]);
                }
            }

            this.setProperty('landing.view.dynamic.leftPaneWidth', '400');
            this.setProperty('landing.view.dynamic.rightPaneWidth', '400');
        }

        this._landingViewLayout = new WidgetContainerLayout(this);
        this.activate();
    }

    /**
	 * Activate the landing view.
	 *
	 * Sets the toolbar to hotel view state and activates the layout.
	 *
	 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as activate()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::activate()
    public activate(): void
    {
        if(!this._initialized)
        {
            this.tryInitialize();
        }

        if(this._toolbar)
        {
            this._toolbar.setToolbarState(HabboToolbarEnum.TOOLBAR_STATE_HOTEL_VIEW);
        }

        if(this._landingViewLayout != null)
        {
            this._landingViewLayout.activate();
        }
        else
        {
            log.error('Landing view layout is not initialized and cannot be activated');
        }
    }

    /**
	 * Disable the landing view (hide it).
	 *
	 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as disable()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::disable()
    public disable(): void
    {
        if(this._landingViewLayout != null)
        {
            this._landingViewLayout.disable();
        }
    }

    /**
	 * Build a window from a registered widget layout.
	 *
	 * @param name - Layout name
	 * @param layer - Window context layer (0 = background, 1 = default)
	 * @returns The built window, or null
	 *
	 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as getXmlWindow()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::getXmlWindow()
    public getXmlWindow(name: string, layer: number = 1): IWindow | null
    {
        if(!this._windowManager)
        {
            log.error(`Cannot build window '${name}': window manager not available`);
            return null;
        }

        try
        {
            return this._windowManager.buildWidgetLayout(name + '_xml', layer);
        }
        catch (e)
        {
            log.error(`Failed to build window '${name}':`, e);
            return null;
        }
    }

    /**
	 * Send a message composer via the communication manager.
	 *
	 * @param composer - The message composer to send
	 *
	 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as send()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::send()
    public send(composer: IMessageComposer<unknown[]>): void
    {
        if(this._communicationManager?.connection)
        {
            this._communicationManager.connection.send(composer);
        }
    }

    /**
	 * Forward the user into a random room from a promoted room category.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::goToRoom()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::goToRoom()
    public goToRoom(category: string | null = null): void
    {
        const roomCategory = category ?? this.getProperty('landing.view.roomcategory');

        if(roomCategory)
        {
            this.send(new ForwardToARandomPromotedRoomMessageComposer(roomCategory));
        }
    }

    /**
	 * Request a specific badge be granted to the current user.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::requestBadge()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::requestBadge()
    public requestBadge(badgeCode: string): void
    {
        this.send(new RequestABadgeComposer(badgeCode));
    }

    /**
	 * Cast a vote for one of the two sides of a "versus" community goal.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::communityGoalVote()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::communityGoalVote()
    public communityGoalVote(voteOption: number): void
    {
        this.send(new CommunityGoalVoteMessageComposer(voteOption));
    }

    /**
	 * Load and return product data for a given product code.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::getProductData()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::getProductData()
    public getProductData(productCode: string, listener: IProductDataListener): IProductData | null
    {
        if(this._sessionDataManager?.loadProductData(listener))
        {
            return this._sessionDataManager.getProductData(productCode);
        }

        return null;
    }

    /**
	 * Dispose the landing view and all its resources.
	 *
	 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as dispose()
	 */
    override dispose(): void
    {
        if(this._disposed) return;

        this._initialized = false;

        if(this._landingViewLayout)
        {
            this._landingViewLayout.dispose();
            this._landingViewLayout = null;
        }

        if(this._toolbar)
        {
            this._toolbar.toolbarEvents.off(HabboToolbarEvent.TOOLBAR_CLICK, this.onToolbarClick);
        }

        if(this._catalog)
        {
            this._catalog.events.off(CatalogEvent.CATALOG_INVISIBLE_PAGE_VISITED, this.onExpiredLinkClick);
        }

        if(this._errorLayout)
        {
            this._errorLayout.dispose();
            this._errorLayout = null;
        }

        this._communicationManager = null;
        this._roomSessionManager = null;
        this._toolbar = null;
        this._navigator = null;
        this._roomEngine = null;
        this._catalog = null;
        this._questEngine = null;
        this._habboHelp = null;
        this._avatarEditor = null;

        super.dispose();
    }

    /**
	 * Called when all required dependencies are resolved.
	 *
	 * Registers toolbar event listeners and triggers initialization.
	 *
	 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as initComponent()
	 */
    protected override initComponent(): void
    {
        // Register toolbar click listener
        if(this._toolbar)
        {
            this._toolbar.toolbarEvents.on(HabboToolbarEvent.TOOLBAR_CLICK, this.onToolbarClick);
        }

        if(this._catalog)
        {
            this._catalog.events.on(CatalogEvent.CATALOG_INVISIBLE_PAGE_VISITED, this.onExpiredLinkClick);
        }

        this._communicationManager?.addHabboConnectionMessageEvent(new NavigatorSettingsMessageEvent(this.onNavigatorSettings));

        // No tryInitialize() here: AS3's initComponent() only registers these three listeners,
        // and lets onNavigatorSettings() (roomIdToEnter <= 0) do the one initialization — which
        // is right, since a session that auto-enters a room should never build a landing view
        // at all. Calling it here as well built the whole thing twice: initialize() assigns a
        // fresh WidgetContainerLayout without disposing the previous one, so the second pass
        // saw a null window and rebuilt every widget.
    }

    /**
	 * Initialize with error handling, showing an `initialization_error`
	 * fallback window if construction throws.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::tryInitialize()
	 */
    // AS3: .../src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::tryInitialize()
    private tryInitialize(): void
    {
        this._errorLayout = this.getXmlWindow('initialization_error');

        if(this._errorLayout)
        {
            this._errorLayout.visible = false;
        }

        try
        {
            this.initialize();

            if(this._errorLayout?.parent)
            {
                (this._errorLayout.parent as IWindowContainer).removeChild(this._errorLayout);
            }
        }
        catch (e)
        {
            log.error('Landing view initialization failed:', e);

            if(this._landingViewLayout)
            {
                this._landingViewLayout.dispose();
                this._landingViewLayout = null;
            }

            if(this._errorLayout && this._windowManager)
            {
                const desktop = this._windowManager.getDesktop(0) as IWindowContainer | null;

                desktop?.addChild(this._errorLayout);
                this._errorLayout.center();
                this._errorLayout.visible = true;
            }
        }
    }

    /**
	 * Re-activates the landing view when an expired/invisible catalog page
	 * link is clicked while the landing view is visible.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::onExpiredLinkClick()
	 */
    private onExpiredLinkClick = (): void =>
    {
        if(this._initialized && this._landingViewLayout?.window?.visible)
        {
            this.activate();
        }
    };

    /**
	 * Re-initializes the landing view when the server sends navigator
	 * settings with no room to auto-enter.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::onNavigatorSettings()
	 */
    private onNavigatorSettings = (event: IMessageEvent): void =>
    {
        const parser = event.parser as NavigatorSettingsMessageParser | null;

        if(parser && parser.roomIdToEnter <= 0)
        {
            this.tryInitialize();
        }
    };

    /**
	 * Handle toolbar icon clicks.
	 *
	 * When the reception icon is clicked, quit the room and show the landing view.
	 *
	 * @see sources/win63_version/habbo/friendbar/landingview/HabboLandingView.as onToolbarClick()
	 */
    // DEVIATION: AS3 also steps the landing view aside on `HTIE_ICON_GAMES` when `game.center.enabled`;
    //   the RPG fork removed Snow War, the games manager and the games icon.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/landingview/HabboLandingView.as::onToolbarClick()
    private onToolbarClick = (event: HabboToolbarEvent): void =>
    {
        switch(event.iconId)
        {
            case 'HTIE_ICON_RECEPTION':
            {
                // AS3 keys every room session under the same hard-coded slot, so its
                // `getSession(-1)`/`disposeSession(-1)` really mean "the current
                // session, whichever it is". This port keys sessions by their real
                // room id (`room_${roomId}`, to support multiple concurrent sessions),
                // so -1 never matches anything — use the room engine's active room
                // id instead to find the actual current session.
                const activeRoomId = this._roomEngine?.activeRoomId ?? -1;

                if(this._roomSessionManager?.getSession(activeRoomId))
                {
                    this.send(new QuitMessageComposer());
                    this._roomSessionManager.disposeSession(activeRoomId);
                }

                break;
            }
        }
    };
}
