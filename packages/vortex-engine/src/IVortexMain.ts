import type {IDisposable} from "@core";
import type {IHabboCommunicationDemo, IHabboCommunicationManager} from "@habbo/communication";
import type {IHabboLocalizationManager} from "@habbo/localization";
import type {IHabboConfigurationManager} from "@habbo/configuration";
import type {IRoomManager} from "@ambreia/iso/IRoomManager";
import type {IRoomSessionManager, ISessionDataManager} from "@habbo/session";
import type {IRoomEngine} from "@habbo/room";
import type {IVortexConfig} from "./Vortex";
import type {IRoomMessageHandler} from "@habbo/room/IRoomMessageHandler";
import type {IHabboWindowManager} from "@habbo/window/IHabboWindowManager";
import type {IAssetLibrary} from "@ambreia/common/assets/IAssetLibrary";
import type {Application} from 'pixi.js';
import type {HabboAvatarEditorManager} from "@habbo/avatar/HabboAvatarEditorManager";

export interface IVortexMain extends IDisposable
{
    readonly configurationManager: IHabboConfigurationManager;
    readonly communicationDemo: IHabboCommunicationDemo;
    readonly roomManager: IRoomManager;
    readonly roomMessageHandler: IRoomMessageHandler;
    readonly roomSessionManager: IRoomSessionManager;
    readonly localization: IHabboLocalizationManager;
    readonly roomEngine: IRoomEngine;
    readonly sessionDataManager: ISessionDataManager;
    readonly habboCommunication: IHabboCommunicationManager;
    readonly windowManager: IHabboWindowManager;
    readonly assets: IAssetLibrary;
    readonly avatarEditor: HabboAvatarEditorManager | null;

    /**
	 * Initialize the engine orchestrator.
	 *
	 * @param application - The PixiJS Application (created by Vortex shell)
	 * @param config - Optional Vortex configuration
	 *
	 * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as prepareCore()
	 */
    init(application: Application, config?: IVortexConfig): Promise<void>;

    /**
	 * Create Core and prepare all components.
	 *
	 * Order follows AS3 HabboAirMain.as prepareCore() sequence:
	 * Config → Communication → Demo → Localization → RoomManager → RoomSessionManager
	 * → SessionDataManager → RoomEngine → RoomMessageHandler
	 *
	 * @see sources/WIN63-202607011411-782849652/src/binaryData/HabboAir.as prepareCore()
	 */
    prepareCore(config?: IVortexConfig): Promise<void>;

    /**
	 * Initialize localization
	 */
    initLocalization(): void;

    /**
	 * Construct the avatar editor. Must be called AFTER window layouts are registered.
	 */
    initAvatarEditor(): void;
}
