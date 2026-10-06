/**
 * IRoomWidgetHandlerContainer
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as
 *
 * Exposes services to widget handlers. Implemented by RoomDesktop.
 */
import type {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {HabboFishing} from '@habbo/vortex/fishing/HabboFishing';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IHabboHelp} from '@habbo/help/IHabboHelp';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IHabboGroupsManager} from '@habbo/groups/IHabboGroupsManager';
import type {IHabboModeration} from '@habbo/moderation/IHabboModeration';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IHabboFurniEditor} from '@habbo/vortex/furnieditor/IHabboFurniEditor';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {IHabboQuestEngine} from '@habbo/quest/IHabboQuestEngine';
import type {IHabboAvatarEditor} from '@habbo/avatar/IHabboAvatarEditor';
import type {IHabboMessenger} from '@habbo/messenger/IHabboMessenger';
import type {IRoomWidgetFactory} from './IRoomWidgetFactory';
import type {IRoomWidgetHandler} from './IRoomWidgetHandler';
import type {RoomDesktopLayoutManager} from './RoomDesktopLayoutManager';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IUserData} from '@habbo/session/IUserData';

export interface IRoomWidgetHandlerContainer
{
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get roomSession()
    readonly roomSession: IRoomSession;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get sessionDataManager()
    readonly sessionDataManager: ISessionDataManager | null;
    readonly desktopEvents: EventEmitter;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get roomEngine()
    readonly roomEngine: IRoomEngine | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get roomSessionManager()
    readonly roomSessionManager: IRoomSessionManager | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get roomWidgetFactory()
    readonly roomWidgetFactory: IRoomWidgetFactory | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get localization()
    readonly localization: IHabboLocalizationManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get toolbar()
    readonly toolbar: IHabboToolbar | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get windowManager()
    readonly windowManager: IHabboWindowManager | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get connection()
    readonly connection: IConnection | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get layoutManager()
    readonly layoutManager: RoomDesktopLayoutManager;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get catalog()
    readonly catalog: IHabboCatalog | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get inventory()
    readonly inventory: IHabboInventory | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get avatarRenderManager()
    readonly avatarRenderManager: IAvatarRenderManager | null;
    // TS-only: Vortex-only fishing system — no AS3 counterpart. Reached the same way `catalog` and
    // `inventory` are, so the chat handler's `:fishpedia` can open the Fish-O-Pedia.
    readonly fishing: HabboFishing | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get habboHelp()
    readonly habboHelp: IHabboHelp | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get config()
    readonly config: IHabboConfigurationManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get questEngine()
    // The me-menu's achievements button is its only consumer here.
    readonly questEngine: IHabboQuestEngine | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get soundManager()
    // The me-menu's settings tab reads and writes the three volumes through this.
    readonly soundManager: IHabboSoundManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get messenger()
    // Only its event bus is used from here — the me-menu relays the two mini-mail notifications.
    readonly messenger: IHabboMessenger | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get avatarEditor()
    // Provided since `HabboAvatarEditorManager` landed; the me-menu's "clothes" button opens it.
    readonly avatarEditor: IHabboAvatarEditor | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get habboTracking()
    readonly habboTracking: IHabboTracking | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get habboGroupsManager()
    readonly habboGroupsManager: IHabboGroupsManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get friendList()
    readonly friendList: IHabboFriendList | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get freeFlowChat()
    readonly freeFlowChat: IHabboFreeFlowChat | null;
    // NOT from AS3: the furni editor is a Vortex-only staff tool with no counterpart in
    // IRoomWidgetHandlerContainer.as. It is exposed here rather than reached through the root
    // Vortex module because that import (widget -> Vortex -> VortexMain -> RoomUI -> widget) is a
    // cycle, and a cycle here takes the whole InfoStand widget down with it.
    readonly furniEditor: IHabboFurniEditor | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get moderation()
    readonly moderation: IHabboModeration | null;

    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::setRoomViewColor()
    setRoomViewColor(color: number, brightness: number): void;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::setRoomBackgroundColor()
    setRoomBackgroundColor(h: number, s: number, l: number): void;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::getFirstCanvasId()
    getFirstCanvasId(): number;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::getRoomViewRect()
    getRoomViewRect(): { x: number; y: number; width: number; height: number } | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::processWidgetMessage()
    processWidgetMessage(message: unknown): unknown;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::addUpdateListener()
    addUpdateListener(handler: IRoomWidgetHandler): void;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::removeUpdateListener()
    removeUpdateListener(handler: IRoomWidgetHandler): void;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::isOwnerOfFurniture()
    isOwnerOfFurniture(object: IRoomObject): boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::getFurnitureOwnerId()
    getFurnitureOwnerId(object: IRoomObject): number;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::isOwnerOfPet()
    isOwnerOfPet(pet: IUserData | null): boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get navigator()
    readonly navigator: IHabboNavigator | null;
}
