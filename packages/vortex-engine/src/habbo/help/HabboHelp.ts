import type {IContext} from '@core/runtime';
import {Component, ComponentDependency} from '@core/runtime';
import type {IWindow} from '@core/window/IWindow';
import type {IModalDialog} from '@habbo/window/utils/IModalDialog';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {Logger} from '@core/utils/Logger';

import type {IHabboHelp} from './IHabboHelp';
import {ChatRegistry} from './cfh/registry/chat/ChatRegistry';
import {ChatEventHandler} from './cfh/registry/chat/ChatEventHandler';
import {InstantMessageRegistry} from './cfh/registry/instantmessage/InstantMessageRegistry';
import {InstantMessageEventHandler} from './cfh/registry/instantmessage/InstantMessageEventHandler';
import {UserRegistry} from './cfh/registry/user/UserRegistry';
import {CallForHelpManager} from './CallForHelpManager';
import {GuideHelpManager} from './GuideHelpManager';
import {NameChangeController} from './namechange/NameChangeController';
import {HabboWayController} from './HabboWayController';
import {SafetyBookletController} from './SafetyBookletController';
import {HabboWayQuizController} from './HabboWayQuizController';
import {WelcomeScreenController} from './WelcomeScreenController';
import {SanctionInfo} from './SanctionInfo';
import {TopicsFlowHelpController} from './TopicsFlowHelpController';
import {HelpMessageHandler} from './HelpMessageHandler';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_HabboNavigator} from '@iid/IIDHabboNavigator';
import {IID_HabboTracking} from '@iid/IIDHabboTracking';
import {IID_HabboSoundManager} from '@iid/IIDHabboSoundManager';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import {IID_HabboFreeFlowChat} from '@iid/IIDHabboFreeFlowChat';
import {UsersMessageEvent} from '@habbo/communication/messages/incoming/room/engine/UsersMessageEvent';
import {RoomEntryInfoMessageEvent} from '@habbo/communication/messages/incoming/room/engine/RoomEntryInfoMessageEvent';
import {RoomReadyMessageEvent} from '@habbo/communication/messages/incoming/room/session/RoomReadyMessageEvent';
import {GetGuestRoomResultMessageEvent} from '@habbo/communication/messages/incoming/navigator/GetGuestRoomResultMessageEvent';
import type {UsersMessageParser} from '@habbo/communication/messages/parser/room/engine/UsersMessageParser';
import type {RoomEntryInfoMessageParser} from '@habbo/communication/messages/parser/room/engine/RoomEntryInfoMessageParser';
import type {RoomReadyMessageParser} from '@habbo/communication/messages/parser/room/session/RoomReadyMessageParser';
import type {GetGuestRoomResultMessageParser} from '@habbo/communication/messages/parser/navigator/GetGuestRoomResultMessageParser';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IMessageComposer} from '@core';
import {GetMyCfhReportStatusMessageComposer} from '@habbo/communication/messages/outgoing/help/GetMyCfhReportStatusMessageComposer';
import {
    MyCfhReportStatusMessageEvent
} from '@habbo/communication/messages/incoming/callforhelp/MyCfhReportStatusMessageEvent';
import type {
    MyCfhReportStatusMessageEventParser
} from '@habbo/communication/messages/parser/callforhelp/MyCfhReportStatusMessageEventParser';
import {MyReportStatus} from './MyReportStatus';
import type {SanctionRecord} from '@habbo/communication/messages/parser/help/SanctionRecord';
import {GetCfhStatusMessageComposer} from '@habbo/communication/messages/outgoing/help/GetCfhStatusMessageComposer';
import {GetGuideReportingStatusMessageComposer} from '@habbo/communication/messages/outgoing/help/GetGuideReportingStatusMessageComposer';
import {GetPendingCallsForHelpMessageComposer} from '@habbo/communication/messages/outgoing/help/GetPendingCallsForHelpMessageComposer';
import {GuideAdvertisementReadMessageComposer} from '@habbo/communication/messages/outgoing/talent/GuideAdvertisementReadMessageComposer';
import {IgnoreUserMessageComposer} from '@habbo/communication/messages/outgoing/users/IgnoreUserMessageComposer';
import {RemoveFriendMessageComposer} from '@habbo/communication/messages/outgoing/friendlist/RemoveFriendMessageComposer';
import type {CallForHelpDisabledNotifyMessageParser} from '@habbo/communication/messages/parser/help/CallForHelpDisabledNotifyMessageParser';
import type {CallForHelpPendingCallsMessageParser} from '@habbo/communication/messages/parser/help/CallForHelpPendingCallsMessageParser';
import type {CfhTopicsInitMessageParser, ICfhCategory} from '@habbo/communication/messages/parser/help/CfhTopicsInitMessageParser';
import type {GuideReportingStatusMessageParser} from '@habbo/communication/messages/parser/help/GuideReportingStatusMessageParser';

const log = Logger.getLogger('habbo.help.HabboHelp');

/**
 * Main help component
 *
 * Orchestrates all help subsystems including Call For Help (CFH),
 * guide sessions, name changes, sanctions, and report registries.
 * Handles toolbar events, link events, and server message routing.
 *
 * @see source_as_win63/habbo/help/HabboHelp.as
 */
export class HabboHelp extends Component implements IHabboHelp, ILinkEventTracker
{
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::REPORT_TYPE_EMERGENCY
    public static readonly REPORT_TYPE_EMERGENCY: number = 1;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::REPORT_TYPE_GUIDE
    public static readonly REPORT_TYPE_GUIDE: number = 2;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::REPORT_TYPE_IM
    public static readonly REPORT_TYPE_IM: number = 3;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::REPORT_TYPE_ROOM
    public static readonly REPORT_TYPE_ROOM: number = 4;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::REPORT_TYPE_BULLY
    public static readonly REPORT_TYPE_BULLY: number = 6;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::REPORT_TYPE_THREAD
    public static readonly REPORT_TYPE_THREAD: number = 7;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::REPORT_TYPE_MESSAGE
    public static readonly REPORT_TYPE_MESSAGE: number = 8;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::REPORT_TYPE_PHOTO
    public static readonly REPORT_TYPE_PHOTO: number = 9;

    private _communication: IHabboCommunicationManager | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_localizationManager
    private _localizationManager: IHabboLocalizationManager | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_navigator
    private _navigator: IHabboNavigator | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_tracking
    private _tracking: IHabboTracking | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_soundManager
    private _soundManager: IHabboSoundManager | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_friendList
    private _friendList: IHabboFriendList | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_messageEvents
    private _messageEvents: IMessageEvent[] = [];
    private _imRegistry: InstantMessageRegistry;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/help/HabboHelp.as::_chatEventHandler
    private _chatEventHandler: ChatEventHandler | null = null;
    private _imEventHandler: InstantMessageEventHandler | null = null;
    private _cfhManager: CallForHelpManager | null = null;
    private _guideManager: GuideHelpManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/help/HabboHelp.as::_nameChangeController
    private _nameChangeController: NameChangeController | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_sanctionInfo
    private _sanctionInfo: SanctionInfo | null = null;

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_reportStatus
    private _reportStatus: MyReportStatus | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_topicsFlowHelpController
    private _topicsFlow: TopicsFlowHelpController | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_habboWayController
    private _habboWayController: HabboWayController | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_safetyBookletController
    private _safetyBookletController: SafetyBookletController | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_welcomeScreenController
    private _welcomeScreenController: WelcomeScreenController | null = null;
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_habboWayQuizController
    private _quizController: HabboWayQuizController | null = null;
    private _messageHandler: HelpMessageHandler | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/help/HabboHelp.as::_currentRoomId
    private _currentRoomId: number = 0;

    constructor(context: IContext)
    {
        super(context);

        this._userRegistry = new UserRegistry();
        this._chatRegistry = new ChatRegistry();
        this._imRegistry = new InstantMessageRegistry();
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_chatRegistry
    private _chatRegistry: ChatRegistry;

    /**
	 * The chat registry for CFH reports
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get chatRegistry()
    get chatRegistry(): ChatRegistry
    {
        return this._chatRegistry;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_userRegistry
    private _userRegistry: UserRegistry;

    // --- Getters ---

    /**
	 * The user registry for CFH reports
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get userRegistry()
    get userRegistry(): UserRegistry
    {
        return this._userRegistry;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_outsideRoom
    private _outsideRoom: boolean = false;

    /**
	 * Whether the user is outside a room
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get outsideRoom()
    get outsideRoom(): boolean
    {
        return this._outsideRoom;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::set outsideRoom()
    set outsideRoom(value: boolean)
    {
        this._outsideRoom = value;
    }

    /**
	 * The instant message registry for CFH reports
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get instantMessageRegistry()
    get instantMessageRegistry(): InstantMessageRegistry
    {
        return this._imRegistry;
    }

    /**
	 * The Call For Help manager
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get callForHelpManager()
    get callForHelpManager(): CallForHelpManager | null
    {
        return this._cfhManager;
    }

    /**
	 * The guide help manager
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get guideHelpManager()
    get guideHelpManager(): GuideHelpManager | null
    {
        return this._guideManager;
    }

    /**
	 * The communication manager
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get communicationManager()
    get communicationManager(): IHabboCommunicationManager | null
    {
        return this._communication;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get localization()
    get localization(): IHabboLocalizationManager | null
    {
        return this._localizationManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get toolbar()
    get toolbar(): IHabboToolbar | null
    {
        return this._toolbar;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get roomSessionManager()
    get roomSessionManager(): IRoomSessionManager | null
    {
        return this._roomSessionManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get navigator()
    get navigator(): IHabboNavigator | null
    {
        return this._navigator;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get soundManager()
    get soundManager(): IHabboSoundManager | null
    {
        return this._soundManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get tracking()
    get tracking(): IHabboTracking | null
    {
        return this._tracking;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get friendList()
    get friendList(): IHabboFriendList | null
    {
        return this._friendList;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::get freeFlowChat()
    get freeFlowChat(): IHabboFreeFlowChat | null
    {
        return this._freeFlowChat;
    }

    /**
	 * Build one of this component's XML window layouts by name
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::getXmlWindow()
    getXmlWindow(name: string, layer: number = 1): IWindow | null
    {
        return this._windowManager?.buildWidgetLayout(this.resolveLayoutName(name), layer) ?? null;
    }

    /**
	 * Turn a caller's short layout name into the key the layout registry actually holds
	 *
	 * AS3 appends `"_xml"` before every lookup — `assets.getAssetByName(name + "_xml")` — because
	 * an asset's real name is its `*Com.as` field name, and those end in `_xml`. This port
	 * registers layouts under the shipped file's basename, so `chat_report_xml.xml` is keyed
	 * `chat_report_xml` and a bare `chat_report` finds nothing. Every window this component opens
	 * was missing for exactly that reason: the lookup returned null, the guard logged, and no
	 * window appeared.
	 *
	 * The bare name is tried as a fallback because a handful of shipped layouts are named without
	 * the suffix (`club_required.xml`), which is why `HabboGroupsManager.getXmlWindow()` works
	 * while passing its name straight through.
	 */
    // TS-only: AS3 needs no such reconciliation — its asset library has one naming convention.
    private resolveLayoutName(name: string): string
    {
        const suffixed = `${name}_xml`;

        if(this._windowManager?.hasWidgetLayout(suffixed)) return suffixed;

        return name;
    }

    /**
	 * Hand a toolbar event to the two controllers that care about one
	 *
	 * AS3 registers this callback three times over on the toolbar dependency — once per event type
	 * — and forwards every one of them to both controllers unfiltered; each decides for itself.
	 * The welcome bubble follows the toolbar on RESIZED and closes on either click, and the guide
	 * manager is what opens the help window when the purse area's help button is pressed.
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::onHabboToolbarEvent()
    private onHabboToolbarEvent = (event: HabboToolbarEvent): void =>
    {
        this._welcomeScreenController?.onHabboToolbarEvent(event);
        this._guideManager?.onHabboToolbarEvent(event);
    };

    // TS-only: the three types AS3 lists inline on its toolbar ComponentDependency, kept in one
    // place so subscribe and unsubscribe cannot drift apart.
    private static readonly TOOLBAR_EVENTS: readonly string[] = [
        HabboToolbarEvent.TOOLBAR_CLICK,
        HabboToolbarEvent.GROUP_ROOM_INFO_CLICK,
        HabboToolbarEvent.RESIZED
    ];

    // TS-only: AS3 unregisters through the component framework when the dependency is released.
    private unbindToolbarEvents(): void
    {
        if(!this._toolbar) return;

        for(const type of HabboHelp.TOOLBAR_EVENTS) this._toolbar.toolbarEvents.off(type, this.onHabboToolbarEvent);
    }

    /**
	 * Toggle the new-flow help window
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::toggleNewHelpWindow()
    toggleNewHelpWindow(): void
    {
        this._topicsFlow?.toggleWindow();
    }

    /**
	 * The new call-for-help flow
	 */
    // TS-only: AS3 keeps `_topicsFlowHelpController` private and reaches it only through the
    // methods below. Exposed because `HelpMessageHandler` owns the pending-calls-deleted
    // subscription AS3 makes on the component itself, and has to resume the submit through it.
    get topicsFlowHelpController(): TopicsFlowHelpController | null
    {
        return this._topicsFlow;
    }

    /**
	 * Build one of this component's XML layouts as a modal dialog
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::getModalXmlWindow()
    // AS3 fetches the asset and calls `buildModalDialogFromXML()`; `buildModalWidgetLayout()` is
    // this port's name for that pair, as `getXmlWindow()`/`buildWidgetLayout()` are for the
    // non-modal one.
    getModalXmlWindow(name: string): IModalDialog | null
    {
        return this._windowManager?.buildModalWidgetLayout(this.resolveLayoutName(name)) ?? null;
    }

    /**
	 * Open the emergency help request form
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::startEmergencyRequest()
    startEmergencyRequest(): void
    {
        this._cfhManager?.openEmergencyHelpRequest();
    }

    /**
	 * Forward a Google tracking event
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::trackGoogle()
    trackGoogle(category: string, action: string, label: number = -1): void
    {
        this._tracking?.trackGoogle(category, action, label);
    }

    /**
	 * Open the CFH FAQ in a new tab
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::openCfhFaq()
    openCfhFaq(): void
    {
        const url = this.context.configuration?.getProperty('cfh.faq.url') ?? '';

        // AS3 guards with `StringUtil.isEmpty()`; `getProperty()` returns '' for a missing key
        // here rather than null, so the emptiness test is the one that matters.
        if(url === '') return;

        window.open(url, '_blank');
    }

    /**
	 * The own user name (from name change controller)
	 */
    get ownUserName(): string
    {
        return this._nameChangeController?.ownUserName ?? '';
    }

    /**
	 * The own user ID (from name change controller)
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get ownUserId()
    get ownUserId(): number
    {
        return this._nameChangeController?.ownUserId ?? 0;
    }

    /**
	 * ILinkEventTracker - link pattern prefix
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get linkPattern()
    get linkPattern(): string
    {
        return 'help/';
    }

    // --- Dependencies ---

    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                }
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) =>
                {
                    this._sessionDataManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communication = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) =>
                {
                    this.unbindToolbarEvents();

                    this._toolbar = toolbar;

                    if(toolbar)
                    {
                        for(const type of HabboHelp.TOOLBAR_EVENTS) toolbar.toolbarEvents.on(type, this.onHabboToolbarEvent);
                    }
                },
                false
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localizationManager = manager;
                }
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager = manager;
                }
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
                IID_HabboTracking,
                (tracking: IHabboTracking | null) =>
                {
                    this._tracking = tracking;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboSoundManager,
                (soundManager: IHabboSoundManager | null) =>
                {
                    this._soundManager = soundManager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboFriendList,
                (friendList: IHabboFriendList | null) =>
                {
                    this._friendList = friendList;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboFreeFlowChat,
                (freeFlowChat: IHabboFreeFlowChat | null) =>
                {
                    this._freeFlowChat = freeFlowChat;
                },
                false
            ),
        ];
    }

    // --- Initialization ---

    /**
	 * Report a bully
	 *
	 * @param userId The user ID to report
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::reportBully()
    reportBully(userId: number): void
    {
        if(this._cfhManager)
        {
            this._cfhManager.reportBully(userId, this._currentRoomId);
            log.debug('Report bully - userId:', userId);
        }
    }

    // --- IHabboHelp methods ---

    /**
	 * Report a user
	 *
	 * @param userId The user ID to report
	 * @param roomId The room ID where the incident occurred
	 * @param userName The user name
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::startPhotoReportingInNewCfhFlow()
    startPhotoReportingInNewCfhFlow(userId: number, userName: string, extraDataId: string, roomObjectId: number): void
    {
        if(!this._cfhManager) return;

        this._cfhManager.reportedRoomId = this._currentRoomId;
        this._cfhManager.reportedUserId = userId;
        this._cfhManager.reportedUserName = userName;
        this._cfhManager.reportedRoomObjectId = roomObjectId;
        this._cfhManager.reportedExtraDataId = extraDataId;

        this._topicsFlow?.openReportingContentReasonCategory(HabboHelp.REPORT_TYPE_PHOTO);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::reportUserName()
    reportUserName(userId: number, userName: string): void
    {
        if(this._cfhManager)
        {
            this._cfhManager.reportedUserId = userId;
            this._cfhManager.reportedUserName = userName;
            this._cfhManager.reportedRoomId = -1;

            this._topicsFlow?.openReportingUserName();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::reportUserFromIM()
    reportUserFromIM(userId: number): void
    {
        if(this._cfhManager)
        {
            this._cfhManager.reportedUserId = userId;

            this._topicsFlow?.openReportingIMSelection();
        }
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::reportUser()
    // AS3 ignores its second and third arguments here — the room is resolved from the chat lines
    // the reporter picks, and the name from the user registry.
    reportUser(userId: number, _roomId: number, _userName: string): void
    {
        if(this._cfhManager)
        {
            this._cfhManager.reportedUserId = userId;

            this._topicsFlow?.openReportingChatLineSelection();
        }
    }

    /**
	 * Report a room
	 *
	 * @param roomId The room ID
	 * @param roomName The room name
	 * @param roomDescription The room description
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::reportRoom()
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::reportRoom()
    // AS3 sets the fields directly and opens the new flow; it does not call the manager's own
    // `reportRoom()`, which is the older pending-calls route. `roomDescription` has no field on
    // the manager in AS3 either — only the older flow's room panel reads one.
    reportRoom(roomId: number, roomName: string, _roomDescription: string): void
    {
        if(this._cfhManager)
        {
            this._cfhManager.reportedRoomId = roomId;
            this._cfhManager.reportedRoomName = roomName;
            this._cfhManager.reportedUserId = -1;
            this._cfhManager.reportedUserName = '';

            this._topicsFlow?.openReportingContentReasonCategory(HabboHelp.REPORT_TYPE_ROOM);
        }
    }

    /**
	 * Report a forum thread
	 *
	 * @param groupId The group ID
	 * @param threadId The thread ID
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::reportThread()
    reportThread(groupId: number, threadId: number): void
    {
        if(this._cfhManager)
        {
            this._cfhManager.reportedGroupId = groupId;
            this._cfhManager.reportedThreadId = threadId;

            this._topicsFlow?.openReportingContentReasonCategory(HabboHelp.REPORT_TYPE_THREAD);
        }
    }

    /**
	 * Report a forum message
	 *
	 * @param groupId The group ID
	 * @param threadId The thread ID
	 * @param messageId The message ID
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::reportMessage()
    reportMessage(groupId: number, threadId: number, messageId: number): void
    {
        if(this._cfhManager)
        {
            this._cfhManager.reportedGroupId = groupId;
            this._cfhManager.reportedThreadId = threadId;
            this._cfhManager.reportedMessageId = messageId;

            this._topicsFlow?.openReportingContentReasonCategory(HabboHelp.REPORT_TYPE_MESSAGE);
        }
    }

    /**
	 * Report a selfie
	 *
	 * @param extraDataId The selfie's extra data id (its share URL)
	 * @param message The free-text report message
	 * @param roomId The room the selfie was reported from
	 * @param photoAuthorId The user who took the selfie — the reported user
	 * @param roomObjectId The selfie furniture's room object id
	 * @returns Whether the report was submitted
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::reportSelfie()
    reportSelfie(extraDataId: string, message: string, roomId: number, photoAuthorId: number, roomObjectId: number): boolean
    {
        if(this._cfhManager)
        {
            if(message.length < this.getInteger('help.cfh.length.minimum', 15))
            {
                // AS3 alerts rather than logging: refusing the report silently leaves the user
                // staring at a form that did nothing.
                this._windowManager?.alert('${generic.alert.title}', '${help.cfh.error.msgtooshort}', 0, null);

                return false;
            }

            this._cfhManager.reportSelfie(extraDataId, message, roomId, photoAuthorId, roomObjectId);

            return true;
        }

        return false;
    }

    /**
	 * Report a photo
	 *
	 * @param extraDataId The photo's extra data id
	 * @param topicId The selected CFH topic id
	 * @param roomId The room the photo was reported from
	 * @param photoAuthorId The user who took the photo — the reported user
	 * @param roomObjectId The photo furniture's room object id
	 * @returns Whether the report was submitted
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::reportPhoto()
    reportPhoto(extraDataId: string, topicId: number, roomId: number, photoAuthorId: number, roomObjectId: number): boolean
    {
        if(this._cfhManager)
        {
            if(topicId === 0)
            {
                this._windowManager?.alert('${generic.alert.title}', '${help.cfh.error.notopic}', 0, null);

                return false;
            }

            this._cfhManager.reportPhoto(extraDataId, topicId, roomId, photoAuthorId, roomObjectId);

            return true;
        }

        return false;
    }

    // --- CFH request pipeline ---

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_pendingReportType
    // Name derived: obfuscated as `_SafeStr_4910` in every tree. It holds the `REPORT_TYPE_*` that
    // the pending-calls reply is to proceed with, which is what the name records.
    private _pendingReportType: number = 0;

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_reportMessage
    private _reportMessage: IMessageComposer<any> | null = null;

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_guideReportingType
    // Name derived (`_SafeStr_6147`). Write-only in AS3 too: `queryForGuideReportingStatus()`
    // stores its argument and nothing reads it back. Kept so the member is not silently missing.
    private _guideReportingType: number = -1;

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::_callForHelpCategories
    private _callForHelpCategories: ICfhCategory[] = [];

    /**
	 * The CFH topic tree, as sent by the server at login
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get callForHelpCategories()
    get callForHelpCategories(): ICfhCategory[]
    {
        return this._callForHelpCategories;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get guardiansEnabled()
    get guardiansEnabled(): boolean
    {
        return this.getBoolean('guardians.enabled');
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get newUserTourEnabled()
    get newUserTourEnabled(): boolean
    {
        return this.getBoolean('guide.help.new.user.tour.enabled');
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get newIdentity()
    get newIdentity(): boolean
    {
        return this.getInteger('new.identity', 0) > 0;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get citizenshipEnabled()
    get citizenshipEnabled(): boolean
    {
        return this.getBoolean('talent.track.citizenship.enabled');
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get safetyQuizDisabled()
    get safetyQuizDisabled(): boolean
    {
        return this.getBoolean('safety_quiz.disabled');
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get reportedUserId()
    get reportedUserId(): number
    {
        return this._cfhManager?.reportedUserId ?? -1;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::set reportedUserId()
    set reportedUserId(value: number)
    {
        if(this._cfhManager) this._cfhManager.reportedUserId = value;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get reportedUserName()
    get reportedUserName(): string
    {
        return this._cfhManager?.reportedUserName ?? '';
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get reportedRoomId()
    get reportedRoomId(): number
    {
        return this._cfhManager?.reportedRoomId ?? -1;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::set reportedRoomId()
    set reportedRoomId(value: number)
    {
        if(this._cfhManager) this._cfhManager.reportedRoomId = value;
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get reportedExtraDataId()
    get reportedExtraDataId(): string
    {
        return this._cfhManager?.reportedExtraDataId ?? '';
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::get reportedRoomObjectId()
    get reportedRoomObjectId(): number
    {
        return this._cfhManager?.reportedRoomObjectId ?? -1;
    }

    /**
	 * Park a report composer until the pending-calls reply clears it for sending
	 *
	 * The photo report is the one that uses this: it must not go out before the server has said
	 * how many reports the user already has open.
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::setReportMessage()
    setReportMessage(composer: IMessageComposer<any> | null): void
    {
        this._reportMessage = composer;
    }

    /**
	 * Ask the server how many reports this user already has open
	 *
	 * Every report route funnels through here: the reply decides whether the report form opens
	 * (`proceedWithReporting()`) or the user is shown their existing reports instead.
	 *
	 * @param reportType The `REPORT_TYPE_*` to proceed with once the reply lands
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::queryForPendingCallsForHelp()
    queryForPendingCallsForHelp(reportType: number): void
    {
        this._pendingReportType = reportType;

        this.sendMessage(new GetPendingCallsForHelpMessageComposer());
    }

    /**
	 * Ask the server whether the guide-reporting route is open to this user
	 *
	 * @param reportType The report type the answer applies to
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::queryForGuideReportingStatus()
    queryForGuideReportingStatus(reportType: number): void
    {
        this._guideReportingType = reportType;

        // Both, in this order — asking about guide reporting also marks the guide advertisement
        // as read.
        this.sendMessage(new GuideAdvertisementReadMessageComposer());
        this.sendMessage(new GetGuideReportingStatusMessageComposer());
    }

    /**
	 * Ignore, and unfriend, whoever the pending report is filed against
	 *
	 * Called once a report is submitted.
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::ignoreAndUnfriendReportedUser()
    ignoreAndUnfriendReportedUser(): void
    {
        const userId = this._cfhManager?.reportedUserId ?? -1;

        if(userId <= 0) return;

        this.sendMessage(new IgnoreUserMessageComposer(userId));

        // `getFriendById()` is this port's name for AS3's `getFriend()`.
        if(this._friendList?.getFriendById(userId))
        {
            this.sendMessage(new RemoveFriendMessageComposer(userId));
        }
    }

    /**
     * Opens the sanction-information window on the server's answer.
     *
     * The controller is rebuilt when the previous one was disposed, which is what lets the window
     * be re-opened after the player closes it.
     */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::onMySanctionStatusMessageEvent()
    openSanctionInfo(sanctions: SanctionRecord[] | null): void
    {
        if(this._sanctionInfo === null || this._sanctionInfo.disposed)
        {
            this._sanctionInfo = new SanctionInfo(this);
        }

        this._sanctionInfo.openWindow(sanctions);
    }

    /**
     * Opens the report list on the server's answer.
     *
     * AS3 calls straight through to `openWindow()`, which disposes and rebuilds the controller's
     * window every time — so unlike `openSanctionInfo()` above there is no disposed-check here.
     */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::onMyCfhReportStatusMessageEvent()
    private onMyCfhReportStatusMessageEvent(event: IMessageEvent): void
    {
        const parser = event.parser as MyCfhReportStatusMessageEventParser;

        if(parser == null) return;

        this._reportStatus?.openWindow(parser);
    }

    /**
	 * Request the user's own sanction status
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::requestSanctionInfo()
    // AS3 takes the flag and ignores it; kept so the two call sites (login sampling and the
    // flow's sanction link) read the same as the source.
    requestSanctionInfo(_showOnLogin: boolean = false): void
    {
        this.sendMessage(new GetCfhStatusMessageComposer());
    }

    /**
	 * Request the user's own report history
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::requestReportsStatus()
    // Reached from the flow's "my reports" link, which is hidden unless `my.reports.status.enabled`
    // is set.
    requestReportsStatus(): void
    {
        this.sendMessage(new GetMyCfhReportStatusMessageComposer());
    }

    /**
	 * Handle the server's pending-calls answer
	 *
	 * With nothing open the report proceeds; otherwise the user is shown what they already have
	 * open and asked to keep or discard it. A photo report (type 9) is allowed to stack up to
	 * three, which is the one asymmetry in the rule.
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::onPendingCallsForHelp()
    handlePendingCallsForHelp(parser: CallForHelpPendingCallsMessageParser): void
    {
        if(parser.callCount === 0 || (this._pendingReportType === HabboHelp.REPORT_TYPE_PHOTO && parser.callCount < 3))
        {
            this.proceedWithReporting();

            return;
        }

        const calls = parser.calls;
        let message = '';

        for(let i = 0; i < calls.length && i < 10; i++)
        {
            message += calls[i].message;

            if(i < calls.length - 1 && i < 9) message += '\n';
        }

        this._cfhManager?.showPendingRequest(message);
    }

    /**
	 * Open whatever the stored report type calls for, now that the server has cleared it
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::proceedWithReporting()
    private proceedWithReporting(): void
    {
        switch(this._pendingReportType)
        {
            case HabboHelp.REPORT_TYPE_EMERGENCY:
            case HabboHelp.REPORT_TYPE_IM:
            case HabboHelp.REPORT_TYPE_ROOM:
            case HabboHelp.REPORT_TYPE_THREAD:
            case HabboHelp.REPORT_TYPE_MESSAGE:
                this._cfhManager?.showEmergencyHelpRequest(this._pendingReportType);
                break;

            case HabboHelp.REPORT_TYPE_GUIDE:
                this._guideManager?.openReportWindow();
                break;

            case HabboHelp.REPORT_TYPE_PHOTO:
                // The photo report was parked by `CallForHelpManager.reportPhoto()`; this is the
                // only place it goes out.
                if(this._reportMessage)
                {
                    this.sendMessage(this._reportMessage);
                    this._reportMessage = null;
                }
                break;
        }

        this._pendingReportType = 0;
    }

    /**
	 * Handle the guide-reporting status answer
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::onGuideReportingStatus()
    handleGuideReportingStatus(parser: GuideReportingStatusMessageParser): void
    {
        switch(parser.statusCode)
        {
            case 0:
                this.toggleNewHelpWindow();
                break;

            case 1:
                this._guideManager?.showPendingTicket(parser.pendingTicket);
                break;

            default:
                this._guideManager?.showFeedback(parser.localizationCode);
                break;
        }
    }

    /**
	 * Store the CFH topic tree the server sends at login
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::onCfhTopics()
    handleCfhTopics(parser: CfhTopicsInitMessageParser): void
    {
        this._callForHelpCategories = parser.callForHelpCategories;
    }

    /**
	 * Tell the user that calling for help has been disabled for them
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::onCallForHelpDisabledNotify()
    handleCallForHelpDisabledNotify(parser: CallForHelpDisabledNotifyMessageParser): void
    {
        this._windowManager?.simpleAlert(
            '${help.emergency.global_mute.caption}',
            '${help.emergency.global_mute.subtitle}',
            '${help.emergency.global_mute.message}',
            '${help.emergency.global_mute.link}',
            parser.infoUrl
        );
    }

    /**
	 * Request a guide
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::requestGuide()
    requestGuide(): void
    {
        if(this.getBoolean('guides.enabled') && this._guideManager)
        {
            this._guideManager.createHelpRequest(0);
        }
    }

    /**
	 * Start the name change flow
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::startNameChange()
    startNameChange(): void
    {
        if(this._nameChangeController)
        {
            this._nameChangeController.showView();
        }
    }

    /**
	 * Show the welcome screen
	 *
	 * @param title The title text
	 * @param body The body text
	 * @param position The position (0=left, 1=right)
	 * @param imageName Optional image name
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::showWelcomeScreen()
    // Rebuilt whenever the previous one has been disposed: the bubble disposes itself on close,
    // so a second one needs a fresh controller.
    showWelcomeScreen(iconId: string, textKey: string, position: number, windowToOpen?: string | null): void
    {
        if(this._welcomeScreenController === null || this._welcomeScreenController.disposed)
        {
            this._welcomeScreenController = new WelcomeScreenController(this);
        }

        this._welcomeScreenController.showWelcomeScreen(iconId, textKey, position, windowToOpen ?? null);
    }

    /**
	 * Show the Habbo Way booklet
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::showHabboWay()
    // AS3 builds the controller lazily on first use rather than in initComponent(), so a player
    // who never opens it never pays for it.
    showHabboWay(): void
    {
        if(!this._habboWayController) this._habboWayController = new HabboWayController(this);

        this._habboWayController.showHabboWay();
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::closeHabboWay()
    closeHabboWay(): void
    {
        this._habboWayController?.closeWindow();
    }

    /**
	 * Show the safety booklet
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::showSafetyBooklet()
    showSafetyBooklet(): void
    {
        if(!this._safetyBookletController) this._safetyBookletController = new SafetyBookletController(this);

        this._safetyBookletController.openSafetyBooklet();
    }

    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::closeSafetyBooklet()
    closeSafetyBooklet(): void
    {
        this._safetyBookletController?.closeWindow();
    }

    /**
	 * Show the Habbo Way quiz
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::showHabboWayQuiz()
    showHabboWayQuiz(): void
    {
        this.requireQuizController().showHabboWayQuiz();
    }

    /**
	 * Show the safety quiz
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::showSafetyQuiz()
    showSafetyQuiz(): void
    {
        this.requireQuizController().showSafetyQuiz();
    }

    /**
	 * The quiz controller, rebuilt if the previous one was disposed
	 */
    // AS3: both `showHabboWayQuiz()` and `showSafetyQuiz()` open with the same
    // `if(_quizController == null || _quizController.disposed)` guard; extracted so it exists once.
    private requireQuizController(): HabboWayQuizController
    {
        if(this._quizController === null || this._quizController.disposed)
        {
            this._quizController = new HabboWayQuizController(this);
        }

        return this._quizController;
    }

    /**
	 * The quiz controller, when one has been built
	 */
    // TS-only: AS3 keeps it private and reaches it only through the two methods above. Exposed
    // because `HelpMessageHandler` owns the two quiz subscriptions AS3 makes inside the controller
    // itself, and has to route their payloads back.
    get quizController(): HabboWayQuizController | null
    {
        return this._quizController;
    }

    /**
	 * Show the tour popup
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::showTourPopup()
    showTourPopup(): void
    {
        if(this._guideManager)
        {
            this._guideManager.openTourPopup();
        }
    }

    /**
	 * Handle a link event
	 *
	 * Handles links like "help/tour", "help/report/room/{id}/{name}", etc.
	 *
	 * @param link The full link string
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::linkReceived()
    linkReceived(link: string): void
    {
        if(link === 'help/tour')
        {
            this.requestGuide();
        }

        if(link.indexOf('help/report/room/') === 0)
        {
            const parts = link.split('/');

            if(parts.length >= 5)
            {
                const roomId = parseInt(parts[3]);
                const roomName = decodeURIComponent(parts.slice(4).join('/'));

                this.reportRoom(roomId, roomName, '');
            }
        }
    }

    // --- ILinkEventTracker ---

    /**
	 * Send a message through the communication manager
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::sendMessage()
    sendMessage(composer: IMessageComposer<any>): void
    {
        if(this._communication?.connection)
        {
            this._communication.connection.send(composer);
        }
    }

    // --- Registry feeds ---

    /**
	 * Register every real user in the room into the CFH user registry
	 *
	 * Own avatar and non-user entities (pets, bots) are skipped, as in AS3.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::onUsers()
    private onUsers(event: IMessageEvent): void
    {
        const parser = event.parser as UsersMessageParser | null;

        if(!parser) return;

        for(let i = 0; i < parser.userCount; i++)
        {
            const user = parser.getUser(i);

            if(!user) continue;

            if(user.webID !== this.ownUserId && user.userType === 1)
            {
                this._userRegistry.registerUser(user.webID, user.name, user.figure);
            }
        }
    }

    /**
	 * Register the room being entered, before its name is known
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::onRoomReady()
    private onRoomReady(event: IMessageEvent): void
    {
        const parser = event.parser as RoomReadyMessageParser | null;

        if(!parser) return;

        this._userRegistry.registerRoom(parser.roomId, '');
    }

    /**
	 * Fill in the room name once the guest-room data arrives
	 *
	 * `registerRoom()` back-fills it onto the users registered by `onRoomReady()`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::onGuestRoomResult()
    private onGuestRoomResult(event: IMessageEvent): void
    {
        const parser = event.parser as GetGuestRoomResultMessageParser | null;
        const data = parser?.data ?? null;

        if(!data) return;

        this._userRegistry.registerRoom(data.flatId, data.roomName);
    }

    /**
	 * Track the room the user is in — the room id every report is filed against
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::onRoomEnter()
    private onRoomEnter(event: IMessageEvent): void
    {
        const parser = event.parser as RoomEntryInfoMessageParser | null;

        if(!parser) return;

        this._currentRoomId = parser.guestRoomId;
    }

    // --- Utility methods ---

    /**
	 * Add a message event to the communication manager
	 *
	 * @param event The message event to register
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::addMessageEvent()
    addMessageEvent(event: IMessageEvent): void
    {
        if(this._communication)
        {
            this._communication.addMessageEvent(event);
            this._messageEvents.push(event);
        }
    }

    /**
	 * Dispose of this component and all sub-managers
	 */
    // AS3: .../src/com/sulake/habbo/help/HabboHelp.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        // Remove link event tracker
        this.context.removeLinkEventTracker(this);

        // AS3: HabboHelp.dispose() unregisters its own `_messageEvents` vector — the four
        // registry feeds above plus the two InstantMessageEventHandler registers through
        // addMessageEvent(). HelpMessageHandler owns (and removes) its own set separately.
        if(this._communication)
        {
            for(const event of this._messageEvents)
            {
                this._communication.removeMessageEvent(event);
            }
        }

        this._messageEvents = [];

        // Dispose message handler
        if(this._messageHandler)
        {
            this._messageHandler.dispose();
            this._messageHandler = null;
        }

        // Dispose sub-managers
        if(this._cfhManager)
        {
            this._cfhManager.dispose();
            this._cfhManager = null;
        }

        if(this._guideManager)
        {
            this._guideManager.dispose();
            this._guideManager = null;
        }

        if(this._nameChangeController)
        {
            this._nameChangeController.dispose();
            this._nameChangeController = null;
        }

        if(this._sanctionInfo)
        {
            this._sanctionInfo.dispose();
            this._sanctionInfo = null;
        }

        if(this._topicsFlow)
        {
            this._topicsFlow.dispose();
            this._topicsFlow = null;
        }

        if(this._habboWayController)
        {
            this._habboWayController.dispose();
            this._habboWayController = null;
        }

        if(this._safetyBookletController)
        {
            this._safetyBookletController.dispose();
            this._safetyBookletController = null;
        }

        if(this._welcomeScreenController)
        {
            this._welcomeScreenController.dispose();
            this._welcomeScreenController = null;
        }

        if(this._quizController)
        {
            this._quizController.dispose();
            this._quizController = null;
        }

        // Dispose registry handlers
        if(this._chatEventHandler)
        {
            this._chatEventHandler.dispose();
            this._chatEventHandler = null;
        }

        if(this._imEventHandler)
        {
            this._imEventHandler.dispose();
            this._imEventHandler = null;
        }

        this.unbindToolbarEvents();
        this._toolbar = null;

        this._communication = null;

        super.dispose();

        log.debug('HabboHelp disposed');
    }

    // --- Dispose ---

    protected override initComponent(): void
    {
        // AS3 registers these six in initComponent() itself, ahead of the sub-managers, because
        // they feed the CFH registries the report flow reads back.
        // DEVIATION: the sixth, `onGameStageStarting()`, registered the players of a snow-war arena
        //   as reportable users; the RPG fork removed Snow War, so five remain.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/help/HabboHelp.as::onGameStageStarting()
        this.addMessageEvent(new UsersMessageEvent(this.onUsers.bind(this)));
        this.addMessageEvent(new RoomReadyMessageEvent(this.onRoomReady.bind(this)));
        this.addMessageEvent(new GetGuestRoomResultMessageEvent(this.onGuestRoomResult.bind(this)));
        this.addMessageEvent(new RoomEntryInfoMessageEvent(this.onRoomEnter.bind(this)));
        // AS3: HabboHelp.as:485 — answers requestReportsStatus() and opens the report list.
        this.addMessageEvent(new MyCfhReportStatusMessageEvent(this.onMyCfhReportStatusMessageEvent.bind(this)));

        // Create sub-managers
        // AS3 passes itself: the manager sends every report through `HabboHelp.sendMessage()` and
        // reads `guardiansEnabled` off it.
        this._cfhManager = new CallForHelpManager(this);
        this._guideManager = new GuideHelpManager(this);
        this._nameChangeController = new NameChangeController(this);
        this._sanctionInfo = new SanctionInfo(this);
        this._reportStatus = new MyReportStatus(this);
        this._topicsFlow = new TopicsFlowHelpController(this);

        // Create registry handlers — both take the component, as AS3 does: they subscribe
        // themselves (room chat / the two IM events) rather than waiting to be called.
        this._chatEventHandler = new ChatEventHandler(this);
        this._imEventHandler = new InstantMessageEventHandler(this);

        // Create message handler (registers all help events)
        this._messageHandler = new HelpMessageHandler(this, this._communication!);

        // Register link event tracker
        this.context.addLinkEventTracker(this);

        log.debug('HabboHelp initialized');
    }
}
