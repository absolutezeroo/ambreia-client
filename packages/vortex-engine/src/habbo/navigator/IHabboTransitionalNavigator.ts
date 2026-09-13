import type { EventEmitter } from 'eventemitter3';
import type { IUpdateReceiver } from '@core/runtime';
import type { IAssetLibrary } from '@core/assets';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {IHabboToolbar} from '../toolbar/IHabboToolbar';
import type {IRoomSessionManager} from '../session/IRoomSessionManager';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IHabboHelp} from '../help/IHabboHelp';
import type {RaidProtectionSettingsController} from './raidprotection/RaidProtectionSettingsController';
import type {IMessageComposer} from '@core';
import type {IHabboNavigator} from './IHabboNavigator';
import type {NavigatorData} from './domain';
import type {Tabs} from './domain/Tabs';
import type {ITransitionalMainViewCtrl} from './mainview/ITransitionalMainViewCtrl';
import type {RoomInfoViewCtrl} from './inroom/RoomInfoViewCtrl';
import type {RoomCreateViewCtrl} from './roomsettings/RoomCreateViewCtrl';
import type {RoomSettingsCtrl} from './roomsettings/RoomSettingsCtrl';
import type {RoomEventViewCtrl} from './inroom/RoomEventViewCtrl';
import type {RoomEventInfoCtrl} from './inroom/RoomEventInfoCtrl';
import type {RoomFilterCtrl} from './roomsettings/RoomFilterCtrl';
import type {EnforceCategoryCtrl} from './roomsettings/EnforceCategoryCtrl';
import type {GuestRoomPasswordInput} from './GuestRoomPasswordInput';
import type {GuestRoomDoorbell} from './GuestRoomDoorbell';
import type {OfficialRoomEntryManager} from './mainview/OfficialRoomEntryManager';

/**
 * Transitional navigator interface bridging old and new navigator systems.
 *
 * Extends IHabboNavigator with access to all sub-controllers and utility methods
 * needed by the legacy navigator UI components.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as
 */
export interface IHabboTransitionalNavigator extends IHabboNavigator
{
    readonly disposed: boolean;
    readonly events: EventEmitter;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::get assets()
    readonly assets: IAssetLibrary | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::get windowManager()
    readonly windowManager: IHabboWindowManager | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::get data()
    readonly data: NavigatorData;
    readonly sessionData: ISessionDataManager | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::get tabs()
    readonly tabs: Tabs;
    readonly mainViewCtrl: ITransitionalMainViewCtrl | null;
    /**
	 * TS-only: the legacy navigator window itself. AS3 keeps it as `HabboNavigator`'s own field
	 * and this port keeps it on `LegacyNavigator` with the rest of them, so the component has to
	 * reach it back through the wrapper — see `LegacyNavigator.realMainViewCtrl`.
	 */
    // TS-only: AS3 keeps this controller on `HabboNavigator` itself, so no interface declares it.
    readonly realMainViewCtrl: ITransitionalMainViewCtrl | null;
    readonly roomInfoViewCtrl: RoomInfoViewCtrl | null;
    readonly roomCreateViewCtrl: RoomCreateViewCtrl | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::get communication()
    readonly communication: IHabboCommunicationManager;
    readonly roomSettingsCtrl: RoomSettingsCtrl | null;
    readonly passwordInput: GuestRoomPasswordInput | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::get doorbell()
    readonly doorbell: GuestRoomDoorbell | null;
    readonly roomEventViewCtrl: RoomEventViewCtrl | null;
    readonly officialRoomEntryManager: OfficialRoomEntryManager | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::get toolbar()
    readonly toolbar: IHabboToolbar | null;
    readonly habboHelp: IHabboHelp | null;
    readonly roomEventInfoCtrl: RoomEventInfoCtrl | null;
    readonly roomFilterCtrl: RoomFilterCtrl | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::get roomSessionManager()
    readonly roomSessionManager: IRoomSessionManager | null;
    readonly enforceCategoryCtrl: EnforceCategoryCtrl | null;

    registerUpdateReceiver(receiver: IUpdateReceiver, priority: number): void;

    removeUpdateReceiver(receiver: IUpdateReceiver): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::send()
    send(composer: IMessageComposer<unknown[]>): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::getXmlWindow()
    getXmlWindow(xmlFileName: string, style?: number): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::getText()
    getText(key: string): string;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::registerParameter()
    registerParameter(key: string, param: string, value: string): string;

    getButton(assetName: string, stateSuffix: string, callback: (event: WindowEvent, window: IWindow) => void, x?: number, y?: number, index?: number): IWindowContainer | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::refreshButton()
    refreshButton(container: IWindowContainer, name: string, visible: boolean, callback: (event: WindowEvent, window: IWindow) => void, index: number, tooltip?: string | null): void;

    getButtonImage(assetName: string, suffix?: string): unknown | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::openCatalogClubPage()
    openCatalogClubPage(source: string): void;

    openCatalogRoomAdsPage(): void;

    openCatalogRoomAdsExtendPage(eventName: string, eventDesc: string, eventDate: Date, eventCatId: number): void;

    showFavouriteRooms(): void;

    showHistoryRooms(): void;

    showFrequentRooms(): void;

    goToMainView(): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::goToRoom()
    goToRoom(roomId: number, closeNavigator: boolean, password?: string, roomCategory?: number, skipOpc?: boolean): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::isPerkAllowed()
    isPerkAllowed(perkCode: string): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::trackGoogle()
    trackGoogle(category: string, action: string, value?: number): void;

    trackNavigationDataPoint(category: string, action: string, label?: string, value?: number): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::getBoolean()
    getBoolean(key: string): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::getInteger()
    getInteger(key: string, defaultValue: number): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/navigator/IHabboTransitionalNavigator.as::getProperty()
    getProperty(key: string, params?: Record<string, string>): string;

    /**
     * Null when the old navigator has not been built yet, or when the client was compiled without
     * the feature — every caller has to check.
     */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/navigator/_SafeCls_94.as::get raidProtectionSettingsController()
    readonly raidProtectionSettingsController: RaidProtectionSettingsController | null;
}
