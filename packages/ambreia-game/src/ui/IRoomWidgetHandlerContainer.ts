/**
 * IRoomWidgetHandlerContainer
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as
 *
 * Exposes services to widget handlers. Implemented by RoomDesktop.
 */
import type {EventEmitter} from 'eventemitter3';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IRoomEngine} from '../room/IRoomEngine';
import type {IRoomObject} from '@ambreia/iso/object/IRoomObject';
import type {IRoomSession} from '../session/IRoomSession';
import type {IRoomSessionManager} from '../session/IRoomSessionManager';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IHabboLocalizationManager} from '../localization/IHabboLocalizationManager';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import type {IHabboConfigurationManager} from '../configuration/IHabboConfigurationManager';
import type {IHabboAvatarEditor} from '../avatar/IHabboAvatarEditor';
import type {IRoomWidgetFactory} from './IRoomWidgetFactory';
import type {IRoomWidgetHandler} from './IRoomWidgetHandler';
import type {RoomDesktopLayoutManager} from './RoomDesktopLayoutManager';
import type {IUserData} from '../session/IUserData';

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
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get windowManager()
    readonly windowManager: IHabboWindowManager | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get connection()
    readonly connection: IConnection | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get layoutManager()
    readonly layoutManager: RoomDesktopLayoutManager;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get avatarRenderManager()
    readonly avatarRenderManager: IAvatarRenderManager | null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get config()
    readonly config: IHabboConfigurationManager | null;
    // AS3: .../src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get avatarEditor()
    // Provided since `HabboAvatarEditorManager` landed; the me-menu's "clothes" button opens it.
    readonly avatarEditor: IHabboAvatarEditor | null;

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
}
