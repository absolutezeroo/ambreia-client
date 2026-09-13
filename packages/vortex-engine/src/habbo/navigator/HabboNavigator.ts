import {Component, ComponentDependency, type IContext} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboTracking} from '@iid/IIDHabboTracking';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import {IID_HabboHelp} from '@iid/IIDHabboHelp';
import {IID_HabboNewNavigator} from '@iid/IIDHabboNewNavigator';
import type {IWindow} from '@core/window/IWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboNavigator} from './IHabboNavigator';
import type {IHabboNewNavigator} from './IHabboNewNavigator';
import type {RoomInfoViewCtrl} from './inroom/RoomInfoViewCtrl';
import type {ITransitionalMainViewCtrl} from './mainview/ITransitionalMainViewCtrl';
import type {Tabs} from './domain/Tabs';
import type {GuestRoomPasswordInput} from './GuestRoomPasswordInput';
import type {GuestRoomDoorbell} from './GuestRoomDoorbell';
import type {OfficialRoomEntryManager} from './mainview/OfficialRoomEntryManager';
import type {RoomEventViewCtrl} from './inroom/RoomEventViewCtrl';
import type {RoomEventInfoCtrl} from './inroom/RoomEventInfoCtrl';
import type {RoomFilterCtrl} from './roomsettings/RoomFilterCtrl';
import type {EnforceCategoryCtrl} from './roomsettings/EnforceCategoryCtrl';
import {ConvertGlobalRoomIdMessageComposer} from '@habbo/communication/messages/outgoing/navigator/ConvertGlobalRoomIdMessageComposer';
import type {IHabboTransitionalNavigator} from './IHabboTransitionalNavigator';
import type {IRoomSessionManager} from '../session/IRoomSessionManager';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import type {IHabboToolbar} from '../toolbar/IHabboToolbar';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '../localization/IHabboLocalizationManager';
import type {IHabboTracking} from '../tracking/IHabboTracking';
import type {IAvatarRenderManager} from '../avatar/IAvatarRenderManager';
import type {IHabboHelp} from '../help/IHabboHelp';
import {HabboToolbarEvent} from '../toolbar/events/HabboToolbarEvent';
import {HabboToolbarIconEnum} from '../toolbar/HabboToolbarIconEnum';
import {NavigatorData} from './domain';
import {IncomingMessages} from './IncomingMessages';
import type {CompetitionRoomsData, EventCategory, GuestRoomData} from '../communication/messages/incoming/navigator';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import {IID_HabboCommunicationManager} from "@iid/IIDHabboCommunicationManager";
import {Logger} from '@core/utils/Logger';
import {ToolbarHoverCtrl} from './toolbar/ToolbarHoverCtrl';
import {IID_HabboConfigurationManager} from '@iid/IIDHabboConfigurationManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import {RaidProtectionSettingsController} from './raidprotection/RaidProtectionSettingsController';

// Composers
import {
    CreateFlatMessageComposer,
    GetGuestRoomMessageComposer,
    RemoveOwnRoomRightsRoomMessageComposer,
} from '../communication/messages/outgoing/navigator';
import type {IMessageComposer} from "@core";

const log = Logger.getLogger('habbo.navigator.HabboNavigator');

/**
 * Habbo Navigator component
 */
export class HabboNavigator extends Component implements IHabboNavigator 
{
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_incomingMessages
    private _incomingMessages: IncomingMessages | null = null;
    /**
     * The new navigator, resolved optionally so this component can still start without
     * it. AS3's HabboNavigator implements the transitional interface itself and owns its
     * own RoomInfoViewCtrl; this port put that half on `LegacyNavigator`, which the new
     * navigator builds and holds — so the controller has to be reached through it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::_SafeStr_5440 (owned directly there)
    private _newNavigator: IHabboNewNavigator | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get roomSessionManager()
    get roomSessionManager(): IRoomSessionManager | null
    {
        return this._roomSessionManager;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_toolbarHoverCtrl
    // Name DERIVED: the AS3 field is `_SafeStr_5581`; named for the class it holds.
    // Built on first hover, exactly as AS3 does — the room list it shows is not worth a window
    // for a session that never hovers the navigator button.
    private _toolbarHover: ToolbarHoverCtrl | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_configuration
    private _configuration: IHabboConfigurationManager | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_raidProtectionSettingsController
    //   Name derived: the AS3 field is `_SafeStr_5588`; named for the class it holds.
    private _raidProtectionSettingsController: RaidProtectionSettingsController | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get raidProtectionSettingsController()
    get raidProtectionSettingsController(): RaidProtectionSettingsController | null
    {
        return this._raidProtectionSettingsController;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_localization
    private _localization: IHabboLocalizationManager | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_tracking
    private _tracking: IHabboTracking | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_catalog
    private _catalog: IHabboCatalog | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_avatarManager
    private _avatarManager: IAvatarRenderManager | null = null;

    /**
     * AS3 takes `(context, flags, assetLibrary)` like every other component, and
     * this port dropped the last two. Nothing noticed until `getButtonImage()`
     * was implemented: `Component.assets` stayed null, so every navigator button
     * resolved to no image — silently, since a null bitmap just leaves the
     * window empty.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::HabboNavigator()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
        this._data = new NavigatorData(this);
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_sessionData
    private _sessionData: ISessionDataManager | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get sessionData()
    get sessionData(): ISessionDataManager | null 
    {
        return this._sessionData;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_habboHelp
    private _habboHelp: IHabboHelp | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get habboHelp()
    get habboHelp(): IHabboHelp | null 
    {
        return this._habboHelp;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::_communication
    private _communication: IHabboCommunicationManager | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get communication()
    get communication(): IHabboCommunicationManager 
    {
        if(!this._communication) 
        {
            throw new Error('[HabboNavigator] Communication not available');
        }
        return this._communication;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/HabboNavigator.as::_data
    private _data: NavigatorData;

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get data()
    get data(): NavigatorData 
    {
        return this._data;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get homeRoomId()
    get homeRoomId(): number 
    {
        return this._data.homeRoomId;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get enteredGuestRoomData()
    get enteredGuestRoomData(): GuestRoomData | null 
    {
        return this._data.enteredGuestRoom;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::get visibleEventCategories()
    get visibleEventCategories(): EventCategory[] 
    {
        return this._data.visibleEventCategories;
    }

    protected override get dependencies(): Array<ComponentDependency<any>> 
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) => 
                {
                    this._communication = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (manager: IHabboConfigurationManager | null) =>
                {
                    this._configuration = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) => 
                {
                    // Unsubscribe from previous toolbar
                    if(this._toolbar) 
                    {
                        this._toolbar.toolbarEvents.off(
                            HabboToolbarEvent.TOOLBAR_CLICK,
                            this.onHabboToolbarEvent
                        );
                    }

                    this._toolbar = toolbar;

                    // Subscribe to new toolbar's custom event emitter
                    // (toolbarEvents, NOT Component.events — see MEMORY.md)
                    if(toolbar) 
                    {
                        toolbar.toolbarEvents.on(
                            HabboToolbarEvent.TOOLBAR_CLICK,
                            this.onHabboToolbarEvent
                        );
                    }
                },
                false
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
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) => 
                {
                    this._sessionData = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboTracking,
                (tracking: IHabboTracking | null) => 
                {
                    this._tracking = tracking;
                }
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
                IID_AvatarRenderManager,
                (manager: IAvatarRenderManager | null) => 
                {
                    this._avatarManager = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboNewNavigator,
                (navigator: IHabboNewNavigator | null) =>
                {
                    this._newNavigator = navigator;
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
        ];
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::goToHomeRoom()
    goToHomeRoom(): boolean 
    {
        if(this._data.homeRoomId < 1) 
        {
            log.warn('No home room set');

            return false;
        }

        this.goToRoom(this._data.homeRoomId, true);

        return true;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::goToPrivateRoom()
    goToPrivateRoom(roomId: number): void 
    {
        this.send(new GetGuestRoomMessageComposer(roomId, false, true));
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::goToRoomNetwork()
    goToRoomNetwork(roomId: number, useHomeRoom: boolean): void 
    {
        this.closeRoomInfo();

        let homeRoomId = 0;

        if(useHomeRoom && this._data.homeRoomId > 0) 
        {
            homeRoomId = this._data.homeRoomId;
        }

        // Would call room session manager here
        log.debug(`Go to room network: ${roomId}, homeRoom=${homeRoomId}`);
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::goToRoom()
    goToRoom(roomId: number, closeNavigator: boolean = true, password: string = '', _roomCategory: number = -1, skipOpc: boolean = false): void 
    {
        log.info(`Going to room: ${roomId}`);

        if(closeNavigator) 
        {
            this.closeNavigator();
        }

        if(!this._roomSessionManager) 
        {
            log.error('RoomSessionManager not available');
            return;
        }

        this._roomSessionManager.gotoRoom(roomId, password, '', skipOpc);
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::performTagSearch()
    performTagSearch(tag: string): void
    {
        const mainViewCtrl = this.mainViewCtrl;

        if(mainViewCtrl === null) return;

        let searchTag = tag;

        if(searchTag.indexOf(' ') !== -1)
        {
            searchTag = '"' + searchTag + '"';
        }

        mainViewCtrl.startSearch(5, 9, searchTag);
        this.trackNavigationDataPoint('Search', 'search.tag', searchTag);
        mainViewCtrl.mainWindow?.activate();
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::performTextSearch()
    performTextSearch(searchText: string): void
    {
        const mainViewCtrl = this.mainViewCtrl;

        if(mainViewCtrl === null) return;

        mainViewCtrl.startSearch(5, 8, searchText);
        this.trackNavigationDataPoint('Search', 'search', searchText);
        mainViewCtrl.mainWindow?.activate();
        mainViewCtrl.searchInput?.searchStr?.setText(searchText);
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::performGuildBaseSearch()
    performGuildBaseSearch(): void
    {
        const mainViewCtrl = this.mainViewCtrl;

        if(mainViewCtrl === null) return;

        mainViewCtrl.startSearch(5, 14, '');
        mainViewCtrl.mainWindow?.activate();
        mainViewCtrl.searchInput?.searchStr?.setText('');
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::performCompetitionRoomsSearch()
    performCompetitionRoomsSearch(goalId: number, pageIndex: number): void
    {
        const mainViewCtrl = this.mainViewCtrl;

        if(mainViewCtrl === null || this._data.isLoading())
        {
            return;
        }

        // The search itself carries no ids: `MainViewCtrl.getSearchMsg()` reads them back off
        // `competitionRoomsData`, which is why this is set before startSearch() and not after.
        this._data.competitionRoomsData = {
            goalId,
            pageIndex,
            pageCount: 0,
        } as CompetitionRoomsData;

        mainViewCtrl.startSearch(5, 15, '');
        mainViewCtrl.mainWindow?.activate();
        mainViewCtrl.searchInput?.searchStr?.setText('');
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::showOwnRooms()
    showOwnRooms(): void
    {
        const mainViewCtrl = this.mainViewCtrl;

        if(mainViewCtrl === null) return;

        mainViewCtrl.startSearch(3, 5);
        this.tabs?.getTab(3)?.tabPageDecorator.tabSelected();
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::hasRoomRightsButIsNotOwner()
    hasRoomRightsButIsNotOwner(roomId: number): boolean 
    {
        // Would check with room session manager
        log.debug(`Checking room rights for: ${roomId}`);

        return false;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::removeRoomRights()
    removeRoomRights(roomId: number): void 
    {
        this.send(new RemoveOwnRoomRightsRoomMessageComposer(roomId));
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::startRoomCreation()
    startRoomCreation(): void 
    {
        log.debug('Starting room creation');
    }

    createRoom(name: string, description: string, model: string, categoryId: number, maxUsers: number, tradeMode: number): void 
    {
        this.send(new CreateFlatMessageComposer(name, description, model, categoryId, maxUsers, tradeMode));
    }

    /**
     * AS3's body is *empty* — the navigator window is opened from elsewhere and this entry point
     * has been hollowed out, `position` included. The port keeps its own open-state bookkeeping,
     * which is a deviation predating this note; `position` is accepted and dropped, exactly as in
     * the source.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::openNavigator()
    /**
	 * Empty in AS3 too — the parameter is read by nobody and the body has no statements. The way
	 * the legacy window actually opens is `mainViewCtrl.open()` / `onNavigatorToolBarIconClick()`,
	 * and the new navigator's is `HabboNewNavigator.open()`. This port had it flipping an `_isOpen`
	 * flag that nothing else read, which made three callers look like they were opening something.
	 */
    openNavigator(_position: {x: number; y: number} | null = null): void
    {
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::closeNavigator()
    closeNavigator(): void
    {
        this.mainViewCtrl?.close();
    }

    /**
     * AS3 guards this on `roomCreateViewCtrl` — a different controller — rather than on
     * the room-info one it then toggles. Both are built together and nulled together in
     * dispose(), so the test means "not disposed"; preserved as written.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::toggleRoomInfoVisibility()
    toggleRoomInfoVisibility(): void
    {
        const wrapper = this._newNavigator?.legacyWrapper ?? null;

        if(wrapper === null)
        {
            log.warn('toggleRoomInfoVisibility: no legacy navigator wrapper - the room info window cannot open');

            return;
        }

        if(wrapper.roomCreateViewCtrl !== null) wrapper.roomInfoViewCtrl?.toggle();
    }

    /**
     * TS-only: the transitional half of AS3's HabboNavigator, which this port put on
     * `LegacyNavigator`. AS3 reaches `roomSettingsCtrl` and friends as its own fields
     * (HabboNavigator.as::get roomSettingsCtrl(), line 180); everything holding only this
     * component — `IncomingMessages` above all — has to come back through here.
     */
    get transitionalNavigator(): IHabboTransitionalNavigator | null
    {
        return this._newNavigator?.legacyWrapper ?? null;
    }

    /**
	 * TS-only, and the same shape as `transitionalNavigator` above: AS3's navigator message handler
	 * (`_SafeCls_2208`) holds a `HabboNewNavigator` field of its own, where this port's
	 * `IncomingMessages` holds only this component. Members that live on the new navigator itself
	 * rather than on the legacy wrapper — `onGroupDetails()` — come back through here.
	 */
    get newNavigator(): IHabboNewNavigator | null
    {
        return this._newNavigator;
    }

    /**
     * AS3 holds the controller as its own field and returns it straight
     * (`return _SafeStr_5440`). This port keeps it on the new navigator, so the same
     * accessor reaches it through `legacyWrapper` instead.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get localization()
    get localization(): IHabboLocalizationManager | null
    {
        return this._localization;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get tracking()
    get tracking(): IHabboTracking | null
    {
        return this._tracking;
    }

    /**
	 * The nine controllers AS3 holds as its own fields
	 *
	 * They live on `LegacyNavigator` in this port (see `transitionalNavigator` above), so each is
	 * a hop through the wrapper rather than a field read. Null while the wrapper is not attached —
	 * AS3 cannot express that because the fields are constructed with the component.
	 */
    /**
	 * AS3 returns its own `MainViewCtrl` field here — the legacy navigator window — where
	 * `LegacyNavigator.mainViewCtrl` returns the `FakeMainViewCtrl` that forwards to the new
	 * navigator. They are two different objects and this accessor is the first of the pair, so it
	 * goes to `realMainViewCtrl`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get mainViewCtrl()
    get mainViewCtrl(): ITransitionalMainViewCtrl | null
    {
        return this.transitionalNavigator?.realMainViewCtrl ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get tabs()
    get tabs(): Tabs | null
    {
        return this.transitionalNavigator?.tabs ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get passwordInput()
    get passwordInput(): GuestRoomPasswordInput | null
    {
        return this.transitionalNavigator?.passwordInput ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get doorbell()
    get doorbell(): GuestRoomDoorbell | null
    {
        return this.transitionalNavigator?.doorbell ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get roomEventViewCtrl()
    get roomEventViewCtrl(): RoomEventViewCtrl | null
    {
        return this.transitionalNavigator?.roomEventViewCtrl ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get officialRoomEntryManager()
    get officialRoomEntryManager(): OfficialRoomEntryManager | null
    {
        return this.transitionalNavigator?.officialRoomEntryManager ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get roomEventInfoCtrl()
    get roomEventInfoCtrl(): RoomEventInfoCtrl | null
    {
        return this.transitionalNavigator?.roomEventInfoCtrl ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get roomFilterCtrl()
    get roomFilterCtrl(): RoomFilterCtrl | null
    {
        return this.transitionalNavigator?.roomFilterCtrl ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get enforceCategoryCtrl()
    get enforceCategoryCtrl(): EnforceCategoryCtrl | null
    {
        return this.transitionalNavigator?.enforceCategoryCtrl ?? null;
    }

    /**
	 * Enters a room the website asked for, by its global id string
	 *
	 * The two flags travel with the request rather than with the reply: the server answers with an
	 * ordinary room entry, so `webRoomReport` and `webRoomReportedName` are what let the room-info
	 * path tell an ordinary entry from one opened to report a room.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::enterRoomWebRequest()
    enterRoomWebRequest(globalRoomId: string, report: boolean = false, reportedName: string | null = null): void
    {
        this._webRoomReport = report;
        this._webRoomReportedName = reportedName;

        this.send(new ConvertGlobalRoomIdMessageComposer(globalRoomId));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::_SafeStr_9205 (name derived: read by get webRoomReport())
    private _webRoomReport: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::_webRoomReportedName
    private _webRoomReportedName: string | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get webRoomReport()
    get webRoomReport(): boolean
    {
        return this._webRoomReport;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get webRoomReportedName()
    get webRoomReportedName(): string | null
    {
        return this._webRoomReportedName;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::get roomInfoViewCtrl()
    private get roomInfoViewCtrl(): RoomInfoViewCtrl | null
    {
        return this._newNavigator?.legacyWrapper?.roomInfoViewCtrl ?? null;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::canRateRoom()
    canRateRoom(): boolean 
    {
        return this._data.canRate;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::isRoomFavorite()
    isRoomFavorite(roomId: number): boolean 
    {
        return this._data.isRoomFavourite(roomId);
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::isRoomHome()
    isRoomHome(roomId: number): boolean 
    {
        return this._data.isRoomHome(roomId);
    }

    /**
     * Sends a message composer.
     * Made public for transitional navigator access.
     *
     * @param composer - The message composer to send
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::send()
    public send(composer: IMessageComposer<unknown[]>): void 
    {
        const connection = this._communication?.connection;

        if(connection) 
        {
            connection.send(composer);
        }
    }

    /**
     * Builds a window from a registered widget layout.
     *
     * @param jsonFileName - The XML layout name
     * @param layer - Window context layer
     * @returns The window, or null
     * @see source_as_win63/habbo/navigator/HabboNavigator.as getXmlWindow()
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::getXmlWindow()
    getXmlWindow(xmlFileName: string, layer: number = 1): IWindow | null 
    {
        if(!this._windowManager) 
        {
            log.error(`Cannot build window '${xmlFileName}': window manager not available`);
            return null;
        }

        try 
        {
            return this._windowManager.buildWidgetLayout(xmlFileName + '_xml', layer);
        }
        catch (e) 
        {
            log.error(`Failed to build window '${xmlFileName}':`, e);
            return null;
        }
    }

    /**
     * Gets a localized text string.
     *
     * @param key - The localization key
     * @returns The localized text, or the key itself as fallback
     * @see source_as_win63/habbo/navigator/HabboNavigator.as getText()
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::getText()
    getText(key: string): string 
    {
        if(!this._localization) return key;

        return this._localization.getLocalization(key, key);
    }

    /**
     * Registers a localization parameter replacement.
     *
     * @param key - The localization key
     * @param param - Parameter name
     * @param value - Parameter value
     * @returns The modified string
     * @see source_as_win63/habbo/navigator/HabboNavigator.as registerParameter()
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::registerParameter()
    registerParameter(key: string, param: string, value: string): string 
    {
        if(!this._localization) return key;

        return this._localization.registerParameter(key, param, value);
    }

    /**
     * Gets a button image wrapper window.
     * Stub — returns null until asset system is wired.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::getButton()
    getButton(_assetName: string, _stateSuffix: string, _callback: (event: WindowEvent, window: IWindow) => void, _x: number = 0, _y: number = 0, _index: number = 0): IWindowContainer | null
    {
        return null;
    }

    /**
     * Shows or hides one of a navigator view's icon buttons, and fills it the
     * first time it is shown.
     *
     * This was a `// Stub` with a "no-op until window system is wired" note,
     * long after the window system was wired. It is the single function behind
     * every icon in the in-room room-info view — the web-link icon, the
     * make-home and remove-rights markers, the favourite pair, the rating
     * thumb — so all seven were empty windows at the right size, drawable,
     * with nothing in them.
     *
     * `assetName` defaults to the child's own name, which is what every caller
     * relies on.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::refreshButton()
    refreshButton(container: IWindowContainer, name: string, visible: boolean, callback: ((event: WindowEvent, window: IWindow) => void) | null, index: number, assetName: string | null = null): void
    {
        const child = container.findChildByName(name) as unknown as IBitmapWrapperWindow | null;

        if(!child)
        {
            // AS3 logs this and then dereferences the null anyway, which throws
            // one line later. Returning instead keeps a missing icon a missing
            // icon rather than taking the whole view down with it.
            log.warn(`Could not locate button in navigator: ${name}`);

            return;
        }

        if(!visible)
        {
            child.visible = false;

            return;
        }

        this.prepareButton(child, assetName ?? name, callback, index);
        child.visible = true;
    }

    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::prepareButton()
    private prepareButton(window: IBitmapWrapperWindow, assetName: string, callback: ((event: WindowEvent, window: IWindow) => void) | null, index: number): void
    {
        window.id = index;

        if(callback) window.procedure = callback;

        // AS3 bails here rather than re-fetching: the bitmap is shared with the
        // asset library (disposesBitmap false below), so refreshing a view must
        // not swap it out from under another button holding the same one.
        if(window.bitmap != null) return;

        const bitmap = this.getButtonImage(assetName);

        if(!bitmap)
        {
            // Two very different failures, and one message for both is what made
            // the first round of this unreadable: no library at all (the
            // component was constructed without one) against a library that
            // does not carry the name.
            if(!this.assets) log.warn(`No asset library on the navigator when filling "${assetName}"`);
            else log.warn(`Navigator button "${assetName}" is not in the asset library`);

            return;
        }

        window.bitmap = bitmap;
        window.disposesBitmap = false;
        window.width = bitmap.width;
        window.height = bitmap.height;
    }

    /**
     * The bitmap behind a navigator button.
     *
     * AS3 appends `_png` because that is what the Flash embed identifier
     * carried; this port ships its images under the bare name. The suffix is
     * still tried as a fallback rather than dropped, because guessing wrong
     * here returns null in silence and renders nothing — which is exactly how
     * these seven icons went unnoticed.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::getButtonImage()
    getButtonImage(assetName: string, suffix: string = '_png'): ImageBitmap | null
    {
        const library = this.assets;

        if(!library) return null;

        const asset = library.getAssetByName(assetName) ?? library.getAssetByName(assetName + suffix);

        return (asset?.content ?? null) as ImageBitmap | null;
    }

    /**
     * Opens the catalog club page.
     * Stub — no-op until catalog is wired.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::openCatalogClubPage()
    openCatalogClubPage(_source: string): void 
    {
        log.debug('openCatalogClubPage');
    }

    /**
     * Opens the catalog room ads page.
     * Stub — no-op until catalog is wired.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::openCatalogRoomAdsPage()
    openCatalogRoomAdsPage(): void
    {
        this._catalog?.openCatalogPage('room_ad');
    }

    /**
     * Opens the room-ad catalog page pre-filled with the current room's event, for extending it.
     *
     * The room name comes from the navigator's own copy of the entered room rather than from the
     * caller — the in-room event panel that triggers this knows the event, not the room.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::openCatalogRoomAdsExtendPage()
    openCatalogRoomAdsExtendPage(eventName: string, eventDesc: string, eventDate: Date, eventCatId: number): void
    {
        if(this._catalog == null) return;

        const roomName = this._data.enteredGuestRoom?.roomName ?? '';

        this._catalog.openRoomAdCatalogPageInExtendedMode('room_ad', eventName, eventDesc, roomName, eventDate, eventCatId);
    }

    /**
     * Shows favourite rooms in the navigator.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::showFavouriteRooms()
    showFavouriteRooms(): void
    {
        this.showMeTab(6);
    }

    /**
	 * The "me" tab is tab 3 for all three of these; the search type is what its decorator then
	 * highlights as the sub-selection, so the list and the little sub-tab stay in step.
	 */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::showMeTab()
    private showMeTab(searchType: number): void
    {
        const mainViewCtrl = this.mainViewCtrl;

        if(mainViewCtrl === null) return;

        mainViewCtrl.startSearch(3, searchType);
        this.tabs?.getTab(3)?.tabPageDecorator.setSubSelection(searchType);
    }

    /**
     * Shows room visit history.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::showHistoryRooms()
    showHistoryRooms(): void
    {
        this.showMeTab(7);
    }

    /**
     * Shows frequently visited rooms.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::showFrequentRooms()
    showFrequentRooms(): void
    {
        this.showMeTab(23);
    }

    /**
     * Returns to the navigator main view.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::goToMainView()
    goToMainView(): void
    {
        const wrapper = this.transitionalNavigator;

        wrapper?.roomCreateViewCtrl?.hide();
        wrapper?.roomInfoViewCtrl?.close();
    }

    /**
     * Checks if a perk is allowed for the current user.
     *
     * @param perkCode - The perk code to check
     * @returns Whether the perk is allowed
     * @see sources/win63_version/habbo/navigator/HabboNavigator.as isPerkAllowed()
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::isPerkAllowed()
    isPerkAllowed(perkCode: string): boolean 
    {
        if(this._sessionData) 
        {
            return this._sessionData.isPerkAllowed(perkCode);
        }

        return false;
    }

    /**
     * Get the current user's name from the session data.
     *
     * @returns The user name, or empty string if not available
     */
    getCurrentUserName(): string 
    {
        return this._sessionData?.userName ?? '';
    }

    /**
     * Tracks a Google Analytics event.
     *
     * @param category - The event category
     * @param action - The event action
     * @param value - Optional numeric value
     * @see sources/win63_version/habbo/navigator/HabboNavigator.as trackGoogle()
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::trackGoogle()
    trackGoogle(category: string, action: string, value: number = -1): void 
    {
        if(this._tracking) 
        {
            this._tracking.trackGoogle(category, action, value);
        }
    }

    /**
     * Tracks a navigation data point via the event log.
     *
     * @param category - The event category
     * @param action - The event action
     * @param label - Optional label
     * @param value - Optional numeric value
     * @see sources/win63_version/habbo/navigator/HabboNavigator.as trackNavigationDataPoint()
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::trackNavigationDataPoint()
    trackNavigationDataPoint(category: string, action: string, label: string = '', value: number = 0): void 
    {
        if(this._tracking) 
        {
            this._tracking.trackEventLog('Navigation', category, action, label, value);
        }
    }

    /**
     * Handles incoming navigation links.
     *
     * @param link - The link URL to handle
     * @see sources/win63_version/habbo/navigator/HabboNavigator.as linkReceived()
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::linkReceived()
    linkReceived(link: string): void 
    {
        log.trace(`Link received: ${link}`);

        const parts = link.split('/');

        if(parts.length < 2) return;

        switch(parts[1])
        {
            case 'raidprotection':
                this._raidProtectionSettingsController?.openFromLink(parts.length === 3 ? parts[2]! : null);
                break;
            case 'goto':
                if(parts.length >= 3) 
                {
                    const roomId = parseInt(parts[2], 10);

                    if(!isNaN(roomId)) 
                    {
                        this.goToRoom(roomId, true);
                    }
                }
                break;
            case 'search':
                if(parts.length >= 3) 
                {
                    this.performTextSearch(parts[2]);
                }
                break;
            case 'tag':
                if(parts.length >= 3) 
                {
                    this.performTagSearch(parts[2]);
                }
                break;
        }
    }

    /**
     * The toolbar's navigator-button hover.
     *
     * This used to be an empty body under a comment saying it was "empty in every AS3
     * implementor — the toolbar drives its own hover". It is not: `HabboNavigator.as` l.855-860
     * builds a `ToolbarHoverCtrl` on first use and shows it, and the controller was ported in
     * full and reachable from nothing.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::showToolbarHover()
    showToolbarHover(point: { readonly x: number; readonly y: number } | number, y: number = 0): void
    {
        if(this._toolbarHover === null) this._toolbarHover = new ToolbarHoverCtrl(this);

        this._toolbarHover.show(
            typeof point === 'number' ? point : point.x,
            typeof point === 'number' ? y : point.y
        );
    }

    /**
     * AS3's argument is unnamed and selects `hideDelayed()` when true, so it reads as "let it
     * linger", not "hide it now" — which is what the port's old `_immediate` name implied.
     */
    // AS3: .../src/com/sulake/habbo/navigator/HabboNavigator.as::hideToolbarHover()
    hideToolbarHover(delayed: boolean = false): void
    {
        if(this._toolbarHover === null) return;

        if(delayed) this._toolbarHover.hideDelayed();
        else this._toolbarHover.hide();
    }

    override dispose(): void
    {
        if(this.disposed) return;

        // Built lazily by showToolbarHover(), so it owns a window only if the
        // navigator button was ever hovered.
        if(this._toolbarHover !== null)
        {
            this._toolbarHover.dispose();
            this._toolbarHover = null;
        }

        // Unsubscribe from toolbar events
        if(this._toolbar) 
        {
            this._toolbar.toolbarEvents.off(
                HabboToolbarEvent.TOOLBAR_CLICK,
                this.onHabboToolbarEvent
            );
            this._toolbar = null;
        }

        this._incomingMessages?.dispose();
        this._raidProtectionSettingsController?.dispose();
        this._raidProtectionSettingsController = null;
        this._data.dispose();

        log.debug('Navigator disposed');
        super.dispose();
    }

    protected override initComponent(): void
    {
        this._incomingMessages = new IncomingMessages(this);
        this._raidProtectionSettingsController = new RaidProtectionSettingsController(this, this._configuration);

        log.debug('Navigator initialized');
    }

    /**
     * Handle toolbar click events.
     *
     * Switches on the icon ID to perform the appropriate navigator action.
     * @param event The toolbar event
     * @see sources/win63_version/habbo/navigator/HabboNavigator.as onHabboToolbarEvent()
     */
    private onHabboToolbarEvent = (event: HabboToolbarEvent): void => 
    {
        if(event.type !== HabboToolbarEvent.TOOLBAR_CLICK) return;

        switch(event.iconId) 
        {
            case HabboToolbarIconEnum.ROOMINFO:
                this.toggleRoomInfoVisibility();
                break;
            case HabboToolbarIconEnum.NAVIGATOR_ME_TAB:
                this.showOwnRooms();
                break;
            case HabboToolbarIconEnum.GAMES:
                if(this.getBoolean('game.center.enabled')) 
                {
                    this.closeNavigator();
                }
                break;
            case HabboToolbarIconEnum.HOME:
                this.goToHomeRoom();
                break;
        }
    };

    /**
     * AS3 has no open/close pair of its own — it closes the controller directly, from
     * `goToRoomNetwork()` among other places (HabboNavigator.as lines 404, 558, 742).
     * Kept as one method because that is what this port's call sites already use.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/HabboNavigator.as::goToRoomNetwork() (the _SafeStr_5440.close() call)
    private closeRoomInfo(): void
    {
        this.roomInfoViewCtrl?.close();
    }
}
