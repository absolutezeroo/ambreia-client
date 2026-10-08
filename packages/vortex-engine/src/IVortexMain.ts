import type {IDisposable} from "@ambreia/game/core/index";
import type {IHabboCommunicationDemo, IHabboCommunicationManager} from "@ambreia/game/communication/index";
import type {IHabboLocalizationManager} from "@ambreia/game/localization/index";
import type {IHabboConfigurationManager} from "@ambreia/game/configuration/index";
import type {IRoomManager} from "@ambreia/iso/IRoomManager";
import type {IRoomSessionManager, ISessionDataManager} from "@ambreia/game/session/index";
import type {IRoomEngine} from "@ambreia/game/room/index";
import type {IVortexConfig} from "./Vortex";
import type {IRoomMessageHandler} from "@ambreia/game/room/IRoomMessageHandler";
import type {IHabboWindowManager} from "@ambreia/game/window/IHabboWindowManager";
import type {IAssetLibrary} from "@ambreia/common/assets/IAssetLibrary";
import type {Application} from 'pixi.js';
import type {HabboAvatarEditorManager} from "@ambreia/game/avatar/HabboAvatarEditorManager";

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
	 * Construct the avatar editor. Must be called AFTER window layouts are registered.
	 */
    initAvatarEditor(): void;
}
