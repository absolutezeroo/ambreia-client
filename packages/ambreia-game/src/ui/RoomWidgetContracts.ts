import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
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
import type {RoomDesktopLayoutManager} from './RoomDesktopLayoutManager';
import type {IUserData} from '../session/IUserData';

/** Mutually-referential room-widget contracts live together to keep the module graph acyclic. */
export interface IRoomWidgetUIHost
{
    readonly windowManager: IHabboWindowManager | null;

    readonly assets: IAssetLibrary | null;

    readonly localization: IHabboLocalizationManager | null;

    readonly config: IHabboConfigurationManager | null;
}

export interface IRoomWidgetHandler extends IDisposable
{
    readonly type: string;

    set container(value: IRoomWidgetHandlerContainer | null);

    getWidgetMessages(): string[] | null;

    processWidgetMessage(message: unknown): unknown;

    getProcessedEvents(): string[] | null;

    processEvent(event: unknown): void;

    update(): void;
}

export interface IRoomWidgetFactory extends IDisposable
{
    createWidget(type: string, handler: IRoomWidgetHandler): unknown | null;

    createHandler(type: string): IRoomWidgetHandler | null;
}

export interface IRoomWidgetHandlerContainer
{
    readonly roomSession: IRoomSession;

    readonly sessionDataManager: ISessionDataManager | null;

    readonly desktopEvents: EventEmitter;

    readonly roomEngine: IRoomEngine | null;

    readonly roomSessionManager: IRoomSessionManager | null;

    readonly roomWidgetFactory: IRoomWidgetFactory | null;

    readonly localization: IHabboLocalizationManager | null;

    readonly windowManager: IHabboWindowManager | null;

    readonly connection: IConnection | null;

    readonly layoutManager: RoomDesktopLayoutManager;

    readonly avatarRenderManager: IAvatarRenderManager | null;

    readonly config: IHabboConfigurationManager | null;

    readonly avatarEditor: IHabboAvatarEditor | null;

    setRoomViewColor(color: number, brightness: number): void;

    setRoomBackgroundColor(h: number, s: number, l: number): void;

    getFirstCanvasId(): number;

    getRoomViewRect(): { x: number; y: number; width: number; height: number } | null;

    processWidgetMessage(message: unknown): unknown;

    addUpdateListener(handler: IRoomWidgetHandler): void;

    removeUpdateListener(handler: IRoomWidgetHandler): void;

    isOwnerOfFurniture(object: IRoomObject): boolean;

    getFurnitureOwnerId(object: IRoomObject): number;

    isOwnerOfPet(pet: IUserData | null): boolean;
}
