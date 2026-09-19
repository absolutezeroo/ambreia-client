import type {IWindow} from '@core/window/IWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IMessageComposer} from '@core';
import type {IUpdateReceiver} from '@core/runtime';
import type {IID} from '@core/runtime/IID';
import type {InterfaceCallback} from '@core/runtime/IContext';
import type {IAssetLibrary} from '@core/assets';
import type {IHabboLocalizationManager} from '../../localization/IHabboLocalizationManager';
import type {IHabboTracking} from '../../tracking/IHabboTracking';
import type {IHabboCommunicationManager} from '../../communication/IHabboCommunicationManager';
import type {IHabboToolbar} from '../../toolbar/IHabboToolbar';
import type {IRoomSessionManager} from '../../session/IRoomSessionManager';
import type {ISessionDataManager} from '../../session/ISessionDataManager';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {IHabboHelp} from '../../help/IHabboHelp';
import type {EventCategory, GuestRoomData} from '../../communication/messages/incoming/navigator';
import type {IHabboTransitionalNavigator} from '../IHabboTransitionalNavigator';
import type {ITransitionalMainViewCtrl} from '../mainview/ITransitionalMainViewCtrl';
import type {HabboNewNavigator} from '../HabboNewNavigator';
import type {HabboNavigator} from '../HabboNavigator';
import type {RaidProtectionSettingsController} from '../raidprotection/RaidProtectionSettingsController';
import {EventEmitter} from 'eventemitter3';
import type {NavigatorData} from '../domain';
import {Tabs} from '../domain/Tabs';
import {FakeMainViewCtrl} from './FakeMainViewCtrl';
import {MainViewCtrl} from '../mainview/MainViewCtrl';
import {RoomSettingsCtrl} from '../roomsettings/RoomSettingsCtrl';
import {RoomInfoViewCtrl} from '../inroom/RoomInfoViewCtrl';
import {RoomCreateViewCtrl} from '../roomsettings/RoomCreateViewCtrl';
import {GuestRoomPasswordInput} from '../GuestRoomPasswordInput';
import {GuestRoomDoorbell} from '../GuestRoomDoorbell';
import {OfficialRoomEntryManager} from '../mainview/OfficialRoomEntryManager';
import {RoomEventViewCtrl} from '../inroom/RoomEventViewCtrl';
import {RoomEventInfoCtrl} from '../inroom/RoomEventInfoCtrl';
import {RoomFilterCtrl} from '../roomsettings/RoomFilterCtrl';
import {EnforceCategoryCtrl} from '../roomsettings/EnforceCategoryCtrl';

/**
 * Legacy navigator facade implementing IHabboTransitionalNavigator.
 *
 * Bridges HabboNewNavigator and HabboNavigator, creates and holds all
 * sub-controllers, and delegates calls to the appropriate navigator.
 *
 * @see sources/win63_version/habbo/navigator/transitional/LegacyNavigator.as
 */
export class LegacyNavigator implements IHabboTransitionalNavigator
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::_newNavigator
    private _newNavigator: HabboNewNavigator | null;
    private _oldNavigator: HabboNavigator | null;
    private _fakeMainViewCtrl: FakeMainViewCtrl;
    private _mainViewCtrl: MainViewCtrl;
    private readonly _events: EventEmitter = new EventEmitter();
    private _tabs: Tabs;

    constructor(newNavigator: HabboNewNavigator, oldNavigator: HabboNavigator)
    {
        this._newNavigator = newNavigator;
        this._oldNavigator = oldNavigator;
        this._tabs = new Tabs(this);
        this._fakeMainViewCtrl = new FakeMainViewCtrl(newNavigator, oldNavigator);
        this._mainViewCtrl = new MainViewCtrl(this);
        this._roomSettingsCtrl = new RoomSettingsCtrl(this);
        this._roomInfoViewCtrl = new RoomInfoViewCtrl(this);
        this._roomCreateViewCtrl = new RoomCreateViewCtrl(this);
        this._passwordInput = new GuestRoomPasswordInput(this);
        this._doorbell = new GuestRoomDoorbell(this);
        this._officialRoomEntryManager = new OfficialRoomEntryManager(this);
        this._roomEventViewCtrl = new RoomEventViewCtrl(this);
        this._roomEventInfoCtrl = new RoomEventInfoCtrl(this);
        this._roomFilterCtrl = new RoomFilterCtrl(this);
        this._enforceCategoryCtrl = new EnforceCategoryCtrl(this);
    }

    private _roomSettingsCtrl: RoomSettingsCtrl;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get roomSettingsCtrl()
    get roomSettingsCtrl(): RoomSettingsCtrl
    {
        return this._roomSettingsCtrl;
    }

    private _roomInfoViewCtrl: RoomInfoViewCtrl;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get roomInfoViewCtrl()
    get roomInfoViewCtrl(): RoomInfoViewCtrl
    {
        return this._roomInfoViewCtrl;
    }

    private _roomCreateViewCtrl: RoomCreateViewCtrl;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get roomCreateViewCtrl()
    get roomCreateViewCtrl(): RoomCreateViewCtrl
    {
        return this._roomCreateViewCtrl;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::_passwordInput
    private _passwordInput: GuestRoomPasswordInput;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get passwordInput()
    get passwordInput(): GuestRoomPasswordInput
    {
        return this._passwordInput;
    }

    private _doorbell: GuestRoomDoorbell;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get doorbell()
    get doorbell(): GuestRoomDoorbell
    {
        return this._doorbell;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::_officialRoomEntryManager
    private _officialRoomEntryManager: OfficialRoomEntryManager;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get officialRoomEntryManager()
    get officialRoomEntryManager(): OfficialRoomEntryManager
    {
        return this._officialRoomEntryManager;
    }

    private _roomEventViewCtrl: RoomEventViewCtrl;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get roomEventViewCtrl()
    get roomEventViewCtrl(): RoomEventViewCtrl
    {
        return this._roomEventViewCtrl;
    }

    private _roomEventInfoCtrl: RoomEventInfoCtrl;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get roomEventInfoCtrl()
    get roomEventInfoCtrl(): RoomEventInfoCtrl
    {
        return this._roomEventInfoCtrl;
    }

    private _roomFilterCtrl: RoomFilterCtrl;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get roomFilterCtrl()
    get roomFilterCtrl(): RoomFilterCtrl
    {
        return this._roomFilterCtrl;
    }

    private _enforceCategoryCtrl: EnforceCategoryCtrl;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get enforceCategoryCtrl()
    get enforceCategoryCtrl(): EnforceCategoryCtrl
    {
        return this._enforceCategoryCtrl;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get disposed()
    get disposed(): boolean
    {
        return this._oldNavigator === null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get events()
    get events(): EventEmitter
    {
        return this._events;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get assets()
    get assets(): IAssetLibrary | null
    {
        return (this._oldNavigator as unknown as { assets?: IAssetLibrary })?.assets ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get sessionData()
    get sessionData(): ISessionDataManager | null
    {
        return (this._oldNavigator as unknown as { _sessionData?: ISessionDataManager })?._sessionData ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get tabs()
    get tabs(): Tabs
    {
        return this._tabs;
    }

    get context(): { configuration: { getBoolean(key: string): boolean } }
    {
        return { configuration: { getBoolean: (key: string) => this.getBoolean(key) } };
    }

    registerUpdateReceiver(receiver: IUpdateReceiver, priority: number): void
    {
        (this._oldNavigator as unknown as { registerUpdateReceiver?(r: IUpdateReceiver, p: number): void })
            ?.registerUpdateReceiver?.(receiver, priority);
    }

    removeUpdateReceiver(receiver: IUpdateReceiver): void
    {
        (this._oldNavigator as unknown as { removeUpdateReceiver?(r: IUpdateReceiver): void })
            ?.removeUpdateReceiver?.(receiver);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._newNavigator?.windowManager ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get data()
    get data(): NavigatorData
    {
        return this._oldNavigator!.data;
    }

    /**
     * The controller lives on the old navigator; everything that reaches for it — the room-info
     * view, and the new navigator's `navigator/raidprotection/<flatId>` link — goes through here.
     */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get raidProtectionSettingsController()
    get raidProtectionSettingsController(): RaidProtectionSettingsController | null
    {
        return this._oldNavigator?.raidProtectionSettingsController ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get mainViewCtrl()
    get mainViewCtrl(): ITransitionalMainViewCtrl
    {
        return this._fakeMainViewCtrl;
    }

    /**
	 * TS-only: the legacy navigator window itself, which AS3 keeps as `HabboNavigator`'s own field
	 * (`HabboNavigator.as:127`, `new MainViewCtrl(this)`). This port moved that whole set of fields
	 * here — see `roomSettingsCtrl` and the rest above — so `HabboNavigator.mainViewCtrl` reaches
	 * the real controller through this accessor while `mainViewCtrl` above keeps handing the new
	 * navigator its `FakeMainViewCtrl`, exactly as AS3's two classes do.
	 *
	 * The distinction is not cosmetic: `FakeMainViewCtrl.searchInput` delegates to
	 * `_oldNavigator.mainViewCtrl.searchInput`, so with both accessors answering the fake, that
	 * getter called itself.
	 */
    // TS-only: AS3 keeps this controller on `HabboNavigator` itself (`HabboNavigator.as:127`).
    get realMainViewCtrl(): MainViewCtrl
    {
        return this._mainViewCtrl;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get communication()
    get communication(): IHabboCommunicationManager
    {
        return this._oldNavigator!.communication;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get toolbar()
    get toolbar(): IHabboToolbar | null
    {
        return (this._oldNavigator as any)?._toolbar ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get habboHelp()
    get habboHelp(): IHabboHelp | null
    {
        return (this._oldNavigator as any)?.habboHelp ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get roomSessionManager()
    get roomSessionManager(): IRoomSessionManager | null
    {
        return (this._oldNavigator as any)?._roomSessionManager ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get homeRoomId()
    get homeRoomId(): number
    {
        return this._oldNavigator?.homeRoomId ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get enteredGuestRoomData()
    get enteredGuestRoomData(): GuestRoomData | null
    {
        return this._oldNavigator?.enteredGuestRoomData ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get visibleEventCategories()
    get visibleEventCategories(): EventCategory[]
    {
        return this._oldNavigator?.data.visibleEventCategories ?? [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::send()
    send(composer: IMessageComposer<unknown[]>): void
    {
        this._oldNavigator?.send(composer);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::getXmlWindow()
    getXmlWindow(xmlFileName: string, style: number = 1): IWindow | null
    {
        return this._oldNavigator?.getXmlWindow(xmlFileName, style) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::getText()
    getText(key: string): string
    {
        return this._oldNavigator?.getText(key) ?? key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::registerParameter()
    registerParameter(key: string, param: string, value: string): string
    {
        return this._oldNavigator?.registerParameter(key, param, value) ?? key;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::getButton()
    getButton(assetName: string, stateSuffix: string, callback: ((event: WindowEvent, window: IWindow) => void) | null, x: number = 0, y: number = 0, index: number = 0): IWindowContainer | null
    {
        return this._oldNavigator?.getButton(assetName, stateSuffix, callback, x, y, index) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::refreshButton()
    refreshButton(container: IWindowContainer, name: string, visible: boolean, callback: ((event: WindowEvent, window: IWindow) => void) | null, index: number, tooltip: string | null = null): void
    {
        this._oldNavigator?.refreshButton(container, name, visible, callback, index, tooltip);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::getButtonImage()
    getButtonImage(assetName: string, suffix: string = '_png'): ImageBitmap | null
    {
        return this._oldNavigator?.getButtonImage(assetName, suffix) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::openCatalogClubPage()
    openCatalogClubPage(source: string): void
    {
        this._oldNavigator?.openCatalogClubPage(source);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::openCatalogRoomAdsPage()
    openCatalogRoomAdsPage(): void
    {
        this._oldNavigator?.openCatalogRoomAdsPage();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::openCatalogRoomAdsExtendPage()
    openCatalogRoomAdsExtendPage(eventName: string, eventDesc: string, eventDate: Date, eventCatId: number): void
    {
        this._oldNavigator?.openCatalogRoomAdsExtendPage(eventName, eventDesc, eventDate, eventCatId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::showFavouriteRooms()
    showFavouriteRooms(): void
    {
        this._newNavigator?.performSearch('favorites');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::showHistoryRooms()
    showHistoryRooms(): void
    {
        this._newNavigator?.performSearch('history');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::showFrequentRooms()
    showFrequentRooms(): void
    {
        this._newNavigator?.performSearch('history_freq');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::goToMainView()
    goToMainView(): void
    {
        this._roomCreateViewCtrl.hide();
    }

    /** The `-1` here discarded the room's rank in the list it was clicked from; AS3 forwards it. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::goToRoom()
    goToRoom(roomId: number, closeNavigator: boolean, password: string = '', roomCategory: number = -1, skipOpc: boolean = false): void
    {
        this._oldNavigator?.goToRoom(roomId, false, password, roomCategory, skipOpc);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::isPerkAllowed()
    isPerkAllowed(perkCode: string): boolean
    {
        return this._oldNavigator?.isPerkAllowed(perkCode) ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::trackGoogle()
    trackGoogle(category: string, action: string, value: number = -1): void
    {
        this._oldNavigator?.trackGoogle(category, action, value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::trackNavigationDataPoint()
    trackNavigationDataPoint(category: string, action: string, label: string = '', value: number = 0): void
    {
        this._oldNavigator?.trackNavigationDataPoint(category, action, label, value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::getBoolean()
    getBoolean(key: string): boolean
    {
        return this._oldNavigator?.getBoolean(key) ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::getInteger()
    getInteger(key: string, defaultValue: number): number
    {
        return this._oldNavigator?.getInteger(key, defaultValue) ?? defaultValue;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::getProperty()
    getProperty(key: string, params?: Record<string, string>): string
    {
        return this._oldNavigator?.getProperty(key, params) ?? '';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::goToHomeRoom()
    goToHomeRoom(): boolean
    {
        this._newNavigator?.goToHomeRoom();

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::performTagSearch()
    performTagSearch(tag: string): void
    {
        this._newNavigator?.performTagSearch(tag);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::performTextSearch()
    performTextSearch(text: string): void
    {
        this._newNavigator?.performTextSearch(text);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::performGuildBaseSearch()
    performGuildBaseSearch(): void
    {
        this._newNavigator?.performSearch('groups');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::performCompetitionRoomsSearch()
    performCompetitionRoomsSearch(_goalId: number, _pageIndex: number): void
    {
        this._newNavigator?.performSearch('competition');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::showOwnRooms()
    showOwnRooms(): void
    {
        this._newNavigator?.performSearch('myworld_view');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::goToPrivateRoom()
    goToPrivateRoom(roomId: number): void
    {
        this._newNavigator?.goToRoom(roomId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::hasRoomRightsButIsNotOwner()
    hasRoomRightsButIsNotOwner(roomId: number): boolean
    {
        return this._oldNavigator?.hasRoomRightsButIsNotOwner(roomId) ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::removeRoomRights()
    removeRoomRights(roomId: number): void
    {
        this._oldNavigator?.removeRoomRights(roomId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::goToRoomNetwork()
    goToRoomNetwork(roomId: number, useHomeRoom: boolean): void
    {
        this._oldNavigator?.goToRoomNetwork(roomId, useHomeRoom);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::startRoomCreation()
    startRoomCreation(): void
    {
        (this._newNavigator as any)?.createRoom?.();
    }

    createRoom(name: string, description: string, model: string, categoryId: number, maxUsers: number, tradeMode: number): void
    {
        this._oldNavigator?.createRoom(name, description, model, categoryId, maxUsers, tradeMode);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::openNavigator()
    openNavigator(): void
    {
        this._newNavigator?.open();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::closeNavigator()
    closeNavigator(): void
    {
        this._newNavigator?.close();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::toggleRoomInfoVisibility()
    toggleRoomInfoVisibility(): void
    {
        this._roomInfoViewCtrl?.toggle();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::canRateRoom()
    canRateRoom(): boolean
    {
        return this._oldNavigator?.canRateRoom() ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::isRoomFavorite()
    isRoomFavorite(roomId: number): boolean
    {
        return this._oldNavigator?.isRoomFavorite(roomId) ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::isRoomHome()
    isRoomHome(roomId: number): boolean
    {
        return this._oldNavigator?.isRoomHome(roomId) ?? false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get localization()
    get localization(): IHabboLocalizationManager | null
    {
        return this._oldNavigator?.localization ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get tracking()
    get tracking(): IHabboTracking | null
    {
        return this._oldNavigator?.tracking ?? null;
    }

    /**
	 * The same controller `roomSettingsCtrl` returns
	 *
	 * AS3 has both names because the wrapper answers one from the old navigator's field and the
	 * other from its own; here they are the same object either way.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::get roomSettingsControl()
    get roomSettingsControl(): RoomSettingsCtrl
    {
        return this._roomSettingsCtrl;
    }

    /**
	 * Enters a room the website asked to have reported
	 *
	 * The report flag rides along with the entry request rather than being a separate message —
	 * see HabboNavigator.enterRoomWebRequest().
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::reportRoomFromWeb()
    reportRoomFromWeb(globalRoomId: string, reportedName: string | null = null): void
    {
        this._oldNavigator?.enterRoomWebRequest(globalRoomId, true, reportedName);
    }

    /**
	 * Both are empty in AS3 too
	 *
	 * The toolbar hover they were meant to drive is handled by the toolbar itself; the wrapper
	 * keeps the pair only because `IHabboTransitionalNavigator` declares it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::showToolbarHover()
    showToolbarHover(_position: {x: number; y: number}): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::hideToolbarHover()
    hideToolbarHover(_immediate: boolean): void
    {
    }

    /**
	 * The component-framework pair, forwarded to the new navigator that actually owns them
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::queueInterface()
    queueInterface<T>(iid: IID<T>, callback?: InterfaceCallback<T>): T | null
    {
        return this._newNavigator?.queueInterface(iid, callback) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::release()
    release<T>(iid: IID<T>): number
    {
        return this._newNavigator?.release(iid) ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/transitional/LegacyNavigator.as::dispose()
    dispose(): void
    {
        this._mainViewCtrl.dispose();
        this._roomSettingsCtrl.dispose();
        this._roomInfoViewCtrl.dispose();
        this._roomCreateViewCtrl.dispose();
        this._passwordInput.dispose();
        this._doorbell.dispose();
        this._officialRoomEntryManager.dispose();
        this._roomEventViewCtrl.dispose();
        this._roomEventInfoCtrl.dispose();
        this._roomFilterCtrl.dispose();
        this._enforceCategoryCtrl.dispose();
        this._oldNavigator = null;
        this._newNavigator = null;
    }
}
