import type {ILinkEventTracker, IUpdateReceiver} from '@core/runtime';
import {Component, ComponentDependency, type IContext,} from '@core/runtime';
import type {IWindow} from '@core/window/IWindow';
import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import {IID_HabboNotifications} from '@iid/IIDHabboNotifications';
import {IID_HabboHelp} from '@iid/IIDHabboHelp';
import {IID_HabboNewNavigator} from '@iid/IIDHabboNewNavigator';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_HabboTracking} from '@iid/IIDHabboTracking';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import {GetQuestsMessageComposer} from '@habbo/communication/messages/outgoing/quest/GetQuestsMessageComposer';
import {
    GetSeasonalQuestsOnlyMessageComposer
} from '@habbo/communication/messages/outgoing/quest/GetSeasonalQuestsOnlyMessageComposer';
import {ActivateQuestMessageComposer} from '@habbo/communication/messages/outgoing/quest/ActivateQuestMessageComposer';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import {Animation} from './Animation';
import {Twinkle} from './Twinkle';
import {TwinkleImages} from './TwinkleImages';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import {ActivityPointTypeEnum} from '@habbo/catalog/purse/ActivityPointTypeEnum';
import type {AchievementCategory} from './AchievementCategory';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {HabboToolbarIconEnum} from '@habbo/toolbar/HabboToolbarIconEnum';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import type {IHabboHelp} from '@habbo/help/IHabboHelp';
import type {IHabboNewNavigator} from '@habbo/navigator/IHabboNewNavigator';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomEngine} from '@habbo/room';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import type {IHabboQuestEngine} from './IHabboQuestEngine';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {QuestMessageData} from '@habbo/communication/messages/parser/quest/QuestMessageData';
import {QuestController} from './QuestController';
import {DailyTasksController} from './dailytasks/DailyTasksController';
import {RewardTrackController} from './rewardtrack/RewardTrackController';
import {IID_DailyTasks} from '@iid/IIDDailyTasks';
import {IID_RewardTrackController} from '@iid/IIDRewardTrackController';
import {AchievementController} from './AchievementController';
import {AchievementsResolutionController} from './AchievementsResolutionController';
import {RoomCompetitionController} from './RoomCompetitionController';
import {QuestMessageHandler} from './QuestMessageHandler';
import {Logger} from '@core/utils/Logger';
import type {IAssetLibrary} from '@core/assets';

const log = Logger.getLogger('habbo.quest.HabboQuestEngine');

/**
 * Main Quest Engine component
 *
 * Coordinates all quest subsystems: quests, achievements, resolutions,
 * and room competitions. Implements ILinkEventTracker for deep linking.
 *
 * @see source_as_win63/habbo/quest/HabboQuestEngine.as
 */
export class HabboQuestEngine extends Component implements IHabboQuestEngine, ILinkEventTracker, IUpdateReceiver
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::_SafeStr_9135
    private static readonly QUESTS_WITH_PROMPTS: string[] = [
        'MOVEITEM', 'ENTEROTHERSROOM', 'CHANGEFIGURE', 'FINDLIFEGUARDTOWER', 'SCRATCHAPET'
    ];

    private _resolutionController: AchievementsResolutionController | null = null;
    private _competitionController: RoomCompetitionController | null = null;
    private _messageHandler: QuestMessageHandler | null = null;
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_localization
    private _localization: IHabboLocalizationManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/quest/HabboQuestEngine.as::_configuration
    private _configuration: IHabboConfigurationManager | null = null;
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;
    // AS3: HabboQuestEngine.as::_catalog
    private _catalog: IHabboCatalog | null = null;
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_notifications
    private _notifications: IHabboNotifications | null = null;

    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get notifications()
    get notifications(): IHabboNotifications | null
    {
        return this._notifications;
    }

    // AS3: HabboQuestEngine.as::_SafeStr_8473
    private _dailyTasksController: DailyTasksController | null = null;

    // AS3: HabboQuestEngine.as::get dailyTasks()
    get dailyTasksController(): DailyTasksController | null
    {
        return this._dailyTasksController;
    }

    // AS3: HabboQuestEngine.as::_rewardTrack
    private _rewardTrack: RewardTrackController | null = null;

    // AS3: HabboQuestEngine.as::get rewardTrack()
    get rewardTrack(): RewardTrackController | null
    {
        return this._rewardTrack;
    }

    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_habboHelp
    private _habboHelp: IHabboHelp | null = null;
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_navigator
    private _navigator: IHabboNewNavigator | null = null;
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_tracking
    private _tracking: IHabboTracking | null = null;

    // AS3: HabboQuestEngine.as::onHabboToolbarEvent() — the achievements bottom-bar icon
    // dispatches HTE_TOOLBAR_CLICK directly (independent of any me-menu popup); this is
    // the toolbar's primary path into the achievements panel.
    private readonly onHabboToolbarEvent = (event: HabboToolbarEvent): void =>
    {
        if(event.iconId === HabboToolbarIconEnum.ACHIEVEMENTS)
        {
            this._achievementController?.onToolbarClick();
        }
    };

    /**
     * Same omission as HabboNavigator had: AS3 takes `(context, flags,
     * assetLibrary)` and this port dropped the last two, leaving
     * `Component.assets` null. Everything downstream reads through it —
     * getAssetByName() below, and the two controllers built in
     * initialize() are handed `this.assets` directly — so all of it
     * resolved to nothing without a word.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::HabboQuestEngine()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    private _communicationManager: IHabboCommunicationManager | null = null;

    /**
	 * Get the communication manager
	 */
    get communicationManager(): IHabboCommunicationManager | null
    {
        return this._communicationManager;
    }

    // The controllers build their panel windows through this (AS3's controllers hold a
    // windowManager reference directly).
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: HabboQuestEngine.as::localization
    get localization(): IHabboLocalizationManager | null
    {
        return this._localization;
    }

    /**
	 * Build one of the quest module's layouts by name.
	 *
	 * **The name is used verbatim — no `_xml` suffix.** Other components' `getXmlWindow()` append one
	 * because their layouts ship as `<name>_xml.xml`; the quest layouts ship
	 * as `AchievementsResolutions.xml`, and the asset key is the filename without its extension
	 * either way (`App.ts` → `key.slice('window-layouts/'.length, -'.xml'.length)`). Appending here
	 * would look up a name that does not exist, and a missing layout returns null silently.
	 *
	 * AS3 wraps the whole thing in try/catch and returns null on any failure; kept, because a layout
	 * this port has not shipped should not take the quest engine down with it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getXmlWindow()
    getXmlWindow(name: string, layer: number = 1): IWindow | null
    {
        try
        {
            const asset = this.assets?.getAssetByName(name) ?? null;

            if(asset === null) return null;

            return this._windowManager?.buildFromXML(asset.content as unknown as string, layer) ?? null;
        }
        catch (_error)
        {
            return null;
        }
    }

    // AS3: HabboQuestEngine.as::configuration
    get configuration(): IHabboConfigurationManager | null
    {
        return this._configuration;
    }

    // AS3: HabboQuestEngine.as::getProperty()
    getProperty(key: string): string
    {
        return this._configuration?.getProperty(key) ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::get toolbar()
    get toolbar(): IHabboToolbar | null
    {
        return this._toolbar;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::get roomEngine()
    get roomEngine(): IRoomEngine | null
    {
        return this._roomEngine;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::get catalog()
    get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::get habboHelp()
    get habboHelp(): IHabboHelp | null
    {
        return this._habboHelp;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::get navigator()
    get navigator(): IHabboNewNavigator | null
    {
        return this._navigator;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::get tracking()
    get tracking(): IHabboTracking | null
    {
        return this._tracking;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/quest/HabboQuestEngine.as::_questController
    private _questController: QuestController | null = null;

    /**
	 * Get the quest controller
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get questController()
    get questController(): QuestController | null
    {
        return this._questController;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/quest/HabboQuestEngine.as::_achievementController
    private _achievementController: AchievementController | null = null;

    /**
	 * Get the achievement controller
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get achievementController()
    get achievementController(): AchievementController | null
    {
        return this._achievementController;
    }

    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::_currentlyInRoom
    private _currentlyInRoom: boolean = false;

    /**
	 * Whether the user is currently in a room
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get currentlyInRoom()
    get currentlyInRoom(): boolean
    {
        return this._currentlyInRoom;
    }

    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::set currentlyInRoom()
    set currentlyInRoom(value: boolean)
    {
        this._currentlyInRoom = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/quest/HabboQuestEngine.as::_isFirstLoginOfDay
    private _isFirstLoginOfDay: boolean = false;

    /**
	 * Whether this is the first login of the day
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get isFirstLoginOfDay()
    get isFirstLoginOfDay(): boolean
    {
        return this._isFirstLoginOfDay;
    }

    /**
	 * Get the achievements resolution controller
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get achievementsResolutionController()
    get achievementsResolutionController(): AchievementsResolutionController | null
    {
        return this._resolutionController;
    }

    /**
	 * Get the room competition controller
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get roomCompetitionController()
    get roomCompetitionController(): RoomCompetitionController | null
    {
        return this._competitionController;
    }

    /**
	 * The link pattern for the ILinkEventTracker interface
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::get linkPattern()
    get linkPattern(): string
    {
        return 'questengine/';
    }

    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communicationManager = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localization = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (config: IHabboConfigurationManager | null) =>
                {
                    this._configuration = config;
                }
            ),
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) =>
                {
                    this._toolbar = toolbar;
                    this._toolbar?.toolbarEvents.on(HabboToolbarEvent.TOOLBAR_CLICK, this.onHabboToolbarEvent);
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCatalog,
                (catalog: IHabboCatalog | null) =>
                {
                    this._catalog = catalog;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboNotifications,
                (notifications: IHabboNotifications | null) =>
                {
                    this._notifications = notifications;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboHelp,
                (help: IHabboHelp | null) =>
                {
                    this._habboHelp = help;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboNewNavigator,
                (navigator: IHabboNewNavigator | null) =>
                {
                    this._navigator = navigator;
                },
                false
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) =>
                {
                    this._sessionDataManager = manager;
                }
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
                IID_HabboTracking,
                (tracking: IHabboTracking | null) =>
                {
                    this._tracking = tracking;
                },
                false
            ),
        ];
    }

    /**
	 * Set the first login of day flag
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::setIsFirstLoginOfDay()
    setIsFirstLoginOfDay(value: boolean): void
    {
        this._isFirstLoginOfDay = value;
    }

    /**
	 * Handle a link event matching the "questengine/" pattern
	 *
	 * @param link The full link string
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::linkReceived()
    linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2)
        {
            return;
        }

        switch(parts[1])
        {
            case 'gotorooms':
                this.goToQuestRooms();
                break;

            case 'achievements':
                if(parts.length === 3)
                {
                    // Deep link to specific category: questengine/achievements/{category}
                    this._achievementController?.show();
                    this._achievementController?.selectCategoryInternalLink(parts[2]);
                    break;
                }

                this.showAchievements();
                break;

            case 'calendar':
                this._questController?.seasonalCalendarWindow?.onToolbarClick();
                break;

            case 'quests':
                this._questController?.onToolbarClick();
                break;

            default:
                log.warn(`QuestEngine unknown link-type received: ${parts[1]}`);
        }
    }

    /**
	 * Send a message through the communication manager
	 *
	 * @param composer The message composer to send
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::send()
    send(composer: IMessageComposer<unknown[]>): void
    {
        const connection = this._communicationManager?.connection;

        if(connection)
        {
            connection.send(composer);
        }
    }

    /**
	 * Request all quests from the server
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::requestQuests()
    requestQuests(): void
    {
        // The composer exists; the "once available" comment was stale, so this sent nothing.
        this.send(new GetQuestsMessageComposer());
    }

    /**
	 * Request seasonal quests from the server
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::requestSeasonalQuests()
    requestSeasonalQuests(): void
    {
        this.send(new GetSeasonalQuestsOnlyMessageComposer());
    }

    /**
	 * Activate a quest by its ID
	 *
	 * @param questId The quest ID to activate
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::activateQuest()
    activateQuest(questId: number): void
    {
        this.send(new ActivateQuestMessageComposer(questId));
    }

    /**
	 * Show the quests panel (toggles it if already open, matching onToolbarClick()).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::showQuests()
    showQuests(): void
    {
        if(this._questController !== null && !this._questController.questsList.isVisible())
        {
            this._questController.onToolbarClick();
        }
    }

    /**
	 * Show the achievements panel
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::showAchievements()
    showAchievements(): void
    {
        // AS3 (HabboQuestEngine.as:514) calls achievementController.show(). The old
        // emit('showAchievements') targeted a UI layer this port never had.
        this._achievementController?.show();
    }

    /**
	 * Ensure achievements data has been requested from the server
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::ensureAchievementsInitialized()
    ensureAchievementsInitialized(): void
    {
        if(this._achievementController)
        {
            this._achievementController.ensureAchievementsInitialized();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::reenableRoomCompetitionWindow()
    reenableRoomCompetitionWindow(): void
    {
        if(this._competitionController)
        {
            this._competitionController.dontShowAgain = false;
        }
    }

    /**
	 * Get the user's achievement level for a given category and badge
	 *
	 * @param category The achievement category code
	 * @param badge The badge identifier
	 * @returns The user's level for the achievement, or 0 if not found
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::getAchievementLevel()
    getAchievementLevel(category: string, badge: string): number
    {
        if(this._achievementController)
        {
            return this._achievementController.getAchievementLevel(category, badge);
        }

        return 0;
    }

    /**
	 * Whether the current seasonal campaign has any quest room IDs configured.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::hasQuestRoomsIds()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::hasQuestRoomsIds()
    hasQuestRoomsIds(): boolean
    {
        const ids = this.getQuestRoomIds();

        return ids !== null && ids !== '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getQuestRoomIds()
    private getQuestRoomIds(): string
    {
        return this._localization?.getLocalization(`quests.${this.getSeasonalCampaignCodePrefix()}.roomids`) ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getSeasonalCampaignCodePrefix()
    getSeasonalCampaignCodePrefix(): string
    {
        return this.getProperty('seasonalQuestCalendar.campaignPrefix');
    }

    /**
	 * Navigate to a random quest room from the current seasonal campaign's
	 * comma-separated room-id list.
	 *
	 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::goToQuestRooms()
	 */
    // AS3: .../src/com/sulake/habbo/quest/HabboQuestEngine.as::goToQuestRooms()
    goToQuestRooms(): void
    {
        if(!this.hasQuestRoomsIds()) return;

        const ids = this.getQuestRoomIds().split(',');

        if(ids.length === 0) return;

        const index = Math.max(0, Math.min(ids.length - 1, Math.floor(Math.random() * ids.length)));
        const roomId = parseInt(ids[index], 10);

        log.debug(`Forwarding to a guest room: ${roomId}`);
        this._navigator?.goToRoom(roomId);
    }

    /**
	 * Localized display name for an achievement category code.
	 */
    // AS3: HabboQuestEngine.as::getAchievementCategoryName()
    getAchievementCategoryName(code: string): string
    {
        const key = `quests.${code}.name`;

        return this._localization?.getLocalizationWithParams(key, key) ?? key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getQuestRowTitle()
    getQuestRowTitle(quest: QuestMessageData): string
    {
        const key = quest.waitPeriodSeconds < 1 ? `${quest.getQuestLocalizationKey()}.name` : 'quests.list.questdelayed';

        return this._localization?.getLocalizationWithParams(key, key) ?? key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getQuestName()
    getQuestName(quest: QuestMessageData): string
    {
        const key = `${quest.getQuestLocalizationKey()}.name`;

        return this._localization?.getLocalizationWithParams(key, key) ?? key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getQuestDesc()
    getQuestDesc(quest: QuestMessageData): string
    {
        const key = `${quest.getQuestLocalizationKey()}.desc`;

        return this._localization?.getLocalizationWithParams(key, key) ?? key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getQuestHint()
    getQuestHint(quest: QuestMessageData): string
    {
        const key = `${quest.getQuestLocalizationKey()}.hint`;

        return this._localization?.getLocalizationWithParams(key, key) ?? key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getCampaignNameByCode()
    getCampaignNameByCode(code: string): string
    {
        const key = `${code}.name`;

        return this._localization?.getLocalizationWithParams(key, key) ?? key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getCampaignName()
    getCampaignName(quest: QuestMessageData): string
    {
        return this.getCampaignNameByCode(quest.getCampaignLocalizationKey());
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::hasLocalizedValue()
    hasLocalizedValue(key: string): boolean
    {
        return (this._localization?.getLocalizationWithParams(key, '') ?? '') !== '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::isQuestWithPrompts()
    isQuestWithPrompts(quest: QuestMessageData): boolean
    {
        return HabboQuestEngine.QUESTS_WITH_PROMPTS.indexOf(quest.localizationCode) > -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::isSeasonalCalendarEnabled()
    isSeasonalCalendarEnabled(): boolean
    {
        return this._configuration?.getBoolean('seasonalQuestCalendar.enabled') ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::isSeasonalQuest()
    isSeasonalQuest(quest: QuestMessageData): boolean
    {
        const prefix = this.getSeasonalCampaignCodePrefix();

        return prefix !== '' && quest.campaignCode.indexOf(prefix) === 0;
    }

    /**
	 * Open the quest's catalog page, or the catalog root if it has none.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::openCatalog()
    openCatalog(quest: QuestMessageData): void
    {
        const pageName = quest.catalogPageName;

        if(pageName !== '')
        {
            log.debug(`Questing->Open Catalog: ${pageName}`);
            this._catalog?.openCatalogPage(pageName);
        }
        else
        {
            log.debug('Questing->Open Catalog: Quest Catalog page name not defined');
            this._catalog?.openCatalog();
        }
    }

    /**
	 * Open the navigator with the quest's (or its campaign's) search tag.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::openNavigator()
    openNavigator(quest: QuestMessageData): void
    {
        const questTagKey = `${quest.getQuestLocalizationKey()}.searchtag`;
        const key = this.hasLocalizedValue(questTagKey) ? questTagKey : `${quest.getCampaignLocalizationKey()}.searchtag`;
        const tag = this._localization?.getLocalizationWithParams(key, '') ?? '';

        log.debug(`Questing->Open Navigator: ${tag}`);
        this._navigator?.performTagSearch(tag);
    }

    /**
	 * Set a quest's `quest_pic_bitmap` child to its artwork
	 * ("<campaignCode>_<localizationCode><imageVersion>[_a if it has in-room prompts]",
	 * or a generic "quest_timer_questionmark" while it's still delayed).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::setupQuestImage()
    setupQuestImage(container: IWindowContainer, quest: QuestMessageData): void
    {
        const bitmap = container.findChildByName('quest_pic_bitmap') as unknown as IStaticBitmapWrapperWindow | null;

        if(bitmap === null) return;

        const name = quest.waitPeriodSeconds > 0
            ? 'quest_timer_questionmark'
            : `${quest.campaignCode}_${quest.localizationCode}${quest.imageVersion}${this.isQuestWithPrompts(quest) ? '_a' : ''}`.toLowerCase();

        bitmap.assetUri = '${image.library.questing.url}' + name + '.png';
    }

    /**
	 * Set one of the tracker's `prompt_pic_<frame>` children ("a"/"b"/"c"/"d") to the
	 * matching in-room-prompt frame of the quest's artwork.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::setupPromptFrameImage()
    setupPromptFrameImage(container: IWindowContainer, quest: QuestMessageData, frame: string): void
    {
        const bitmap = container.findChildByName(`prompt_pic_${frame}`) as unknown as IStaticBitmapWrapperWindow | null;

        if(bitmap === null) return;

        const name = `${quest.campaignCode}_${quest.localizationCode}${quest.imageVersion}_${frame}`.toLowerCase();

        bitmap.assetUri = '${image.library.questing.url}' + name + '.png';
    }

    /**
	 * Set a `campaign_pic_bitmap` child to the quest's campaign artwork, or hide it.
	 * Seasonal quests share one campaign image per seasonal prefix instead of per code.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::setupCampaignImage()
    setupCampaignImage(container: IWindowContainer, quest: QuestMessageData, visible: boolean): void
    {
        const bitmap = container.findChildByName('campaign_pic_bitmap') as unknown as IStaticBitmapWrapperWindow | null;

        if(bitmap === null) return;

        if(!visible)
        {
            bitmap.visible = false;

            return;
        }

        bitmap.visible = true;

        const name = this.isSeasonalQuest(quest) ? `${this.getSeasonalCampaignCodePrefix()}_campaign_icon` : quest.campaignCode;

        bitmap.assetUri = '${image.library.questing.url}' + name + '.png';
    }

    /**
	 * The quest-completed celebration: fifteen twinkles scattered over the dialog, each starting
	 * 300 ms after the last so the sparkle rolls rather than flashing all at once.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::getTwinkleAnimation()
    getTwinkleAnimation(container: IWindowContainer): Animation
    {
        if(this._twinkleImages === null)
        {
            this._twinkleImages = new TwinkleImages(this);
        }

        const animation = new Animation(
            container.findChildByName('twinkle_bitmap') as IBitmapWrapperWindow | null
        );

        let startDelayMs = HabboQuestEngine.TWINKLE_FIRST_DELAY_MS;

        for(let index = 0; index < HabboQuestEngine.TWINKLE_COUNT; index++)
        {
            animation.addObject(new Twinkle(this._twinkleImages, startDelayMs));

            startDelayMs += HabboQuestEngine.TWINKLE_DELAY_STEP_MS;
        }

        return animation;
    }

    /** AS3's literal `800` — how long after the dialog opens the first twinkle starts. */
    // AS3: .../habbo/quest/HabboQuestEngine.as::getTwinkleAnimation()
    private static readonly TWINKLE_FIRST_DELAY_MS: number = 800;

    /** AS3's literal `300` — the gap between one twinkle starting and the next. */
    // AS3: .../habbo/quest/HabboQuestEngine.as::getTwinkleAnimation()
    private static readonly TWINKLE_DELAY_STEP_MS: number = 300;

    /** AS3's literal `15`. */
    // AS3: .../habbo/quest/HabboQuestEngine.as::getTwinkleAnimation()
    private static readonly TWINKLE_COUNT: number = 15;

    // AS3: .../habbo/quest/HabboQuestEngine.as::_twinkleImages
    private _twinkleImages: TwinkleImages | null = null;

    /**
	 * Set a category's `category_pic_bitmap` child to its category image
	 * ("ach_category_<code>" for the big grid-cell picture, "achicon_<code>" for the small
	 * header icon).
	 *
	 * This used to append the 2016 PRODUCTION build's `_active`/`_inactive` ternary, on the
	 * theory that both 2026 trees had lost it to literal corruption. They had not: 2016 asks
	 * for a different asset family entirely (`achcategory_`, no underscore), and the two 2026
	 * trees agree on a bare `ach_category_`. The tile geometry settles it — `ach_category_
	 * identity.png` is 90x55 and, centred in the layout's 86x72 `category_pic_bitmap` box at
	 * y=27, puts its green ribbon on rows 71..86 of the tile, exactly under `completion_txt`
	 * (y=70, height 14). The `_active` variants are 68x64, which drops the ribbon 6px and
	 * leaves the counter floating above it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/quest/HabboQuestEngine.as::setupAchievementCategoryImage()
    setupAchievementCategoryImage(container: IWindowContainer, category: AchievementCategory, big: boolean): void
    {
        const bitmap = container.findChildByName('category_pic_bitmap') as unknown as
            IStaticBitmapWrapperWindow | null;

        if(bitmap === null) return;

        const name = big
            ? `ach_category_${category.code}`
            : `achicon_${category.code}`;

        bitmap.assetUri = '';
        bitmap.assetUri = '${image.library.questing.url}' + name + '.png';
    }

    /**
	 * Show/hide + populate an achievement's reward caption/amount/currency-icon row.
	 */
    // AS3: HabboQuestEngine.as::refreshReward()
    refreshReward(visible: boolean, container: IWindowContainer, pointType: number, points: number): void
    {
        const shown = pointType < 0 || points < 1 ? false : visible;

        const caption = container.findChildByName('reward_caption_txt');
        const amount = container.findChildByName('reward_amount_txt');
        const icon = container.findChildByName('currency_icon');

        if(caption === null || amount === null || icon === null) return;

        amount.visible = shown;
        caption.visible = shown;
        icon.visible = shown;

        if(!shown) return;

        amount.caption = String(points);
        HabboQuestEngine.moveChildrenToRow(container, ['reward_caption_txt', 'reward_amount_txt', 'currency_icon'], caption.x, 3);
        this.setupRewardImage(container, pointType);
    }

    /**
	 * Lay out a row of named children left-to-right starting at `startX`, skipping
	 * hidden ones, with `spacing` between each.
	 */
    // AS3: HabboQuestEngine.as::moveChildrenToRow()
    static moveChildrenToRow(container: IWindowContainer, names: string[], startX: number, spacing: number): void
    {
        let x = startX;

        for(const name of names)
        {
            const child = container.getChildByName(name);

            if(child !== null && child.visible)
            {
                child.x = x;
                x += child.width + spacing;
            }
        }
    }

    /**
	 * Style the `currency_icon` child for the given activity point type.
	 */
    // AS3: HabboQuestEngine.as::setupRewardImage()
    setupRewardImage(container: IWindowContainer, pointType: number): void
    {
        const icon = container.findChildByName('currency_icon');

        if(icon === null || this._configuration === null) return;

        icon.style = ActivityPointTypeEnum.getIconStyleFor(pointType, this._configuration, true);
    }

    /**
	 * Dispose of this engine and all controllers
	 */
    override dispose(): void
    {
        if(this.disposed) return;

        this._toolbar?.toolbarEvents.off(HabboToolbarEvent.TOOLBAR_CLICK, this.onHabboToolbarEvent);

        this.removeUpdateReceiver(this);

        // Remove link event tracker
        this.context.removeLinkEventTracker(this);

        // Dispose message handler
        if(this._messageHandler)
        {
            this._messageHandler.dispose();
            this._messageHandler = null;
        }

        // Dispose controllers
        if(this._questController)
        {
            this._questController.dispose();
            this._questController = null;
        }

        if(this._achievementController)
        {
            this._achievementController.dispose();
            this._achievementController = null;
        }

        if(this._resolutionController)
        {
            this._resolutionController.dispose();
            this._resolutionController = null;
        }

        if(this._competitionController)
        {
            this._competitionController.dispose();
            this._competitionController = null;
        }

        if(this._rewardTrack)
        {
            this._rewardTrack.dispose();
            this._rewardTrack = null;
        }

        log.debug('HabboQuestEngine disposed');

        super.dispose();
    }

    /**
	 * Called when all required dependencies are available.
	 * Creates all controllers and the message handler, registers link event tracker.
	 */
    protected override initComponent(): void
    {
        // Create controllers
        this._questController = new QuestController(this);
        // AS3: HabboQuestEngine.as:134 — `new DailyTasksController(this, param1, 0, param3)`
        // followed by `param1.attachComponent(..., [new IIDDailyTasks()])`. AS3 does both in its
        // constructor; this port builds every quest controller here in initComponent(), and the
        // daily-tasks one follows its siblings rather than being the single exception.
        this._dailyTasksController = new DailyTasksController(this, this.context!, 0, this.assets);
        this.context?.attachComponent(this._dailyTasksController, [IID_DailyTasks]);
        // AS3: HabboQuestEngine.as:136-137 — built and attached under IIDRewardTrackController,
        // alongside the daily-tasks controller above.
        this._rewardTrack = new RewardTrackController(this, this.context!, 0, this.assets);
        this.context?.attachComponent(this._rewardTrack, [IID_RewardTrackController]);
        this._achievementController = new AchievementController(this);
        this._resolutionController = new AchievementsResolutionController(this);
        this._competitionController = new RoomCompetitionController(this);

        // Create message handler (registers all message events)
        this._messageHandler = new QuestMessageHandler(this);

        // Register link event tracker
        this.context.addLinkEventTracker(this);

        // AS3's engine-wide per-frame ticker calls HabboQuestEngine.update() directly;
        // this port has no equivalent global hook, so register through the same
        // IUpdateReceiver mechanism other per-frame-animated managers use instead.
        this.registerUpdateReceiver(this, 10);

        log.debug('HabboQuestEngine initialized');
    }

    /**
	 * Per-frame tick. Forwards to the sub-controllers AS3 drives from here.
	 */
    // AS3: HabboQuestEngine.as::update()
    update(deltaTime: number): void
    {
        this._questController?.update(deltaTime);
        this._achievementController?.update(deltaTime);
        this._dailyTasksController?.update(deltaTime);
        this._rewardTrack?.update(deltaTime);
    }
}
