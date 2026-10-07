import type {CoreComponentContext} from '@ambreia/kernel/runtime/CoreComponentContext';
import type {ICoreCommunicationManager} from '@ambreia/game/core/communication/ICoreCommunicationManager';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {Application, Renderer} from 'pixi.js';
import type {IHabboConfigurationManager} from '@ambreia/game/configuration/index';
import type {HabboCommunicationManager} from '@ambreia/game/communication/index';
import type {RoomEngine} from '@ambreia/game/room/index';
import type {IRoomSessionManager, ISessionDataManager} from '@ambreia/game/session/index';
import type {IHabboLocalizationManager} from '@ambreia/game/localization/index';
import type {IHabboWindowManager} from '@ambreia/game/window/IHabboWindowManager';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IVortexConfig} from './Vortex';
import type {IVortexLoadingScreen} from './IVortexLoadingScreen';

export interface IVortex extends IDisposable
{
    readonly context: CoreComponentContext;
    readonly application: Application<Renderer>;
    readonly communication: ICoreCommunicationManager;
    readonly isReady: boolean;
    readonly configuration: IHabboConfigurationManager;
    readonly habboCommunication: HabboCommunicationManager;
    readonly roomEngine: RoomEngine;
    readonly sessionDataManager: ISessionDataManager;
    readonly roomSessionManager: IRoomSessionManager;
    readonly localization: IHabboLocalizationManager;
    readonly windowManager: IHabboWindowManager;
    readonly assets: IAssetLibrary;

    /**
	 * Construct the avatar editor. Must be called AFTER window layouts are registered.
	 */
    initAvatarEditor(): void;

    /**
	 * Open the avatar editor (dev entry point until the RPG HUD exists).
	 */
    openAvatarEditor(): void;

    /**
	 * Connect to the Habbo server
	 */
    connect(): Promise<void>;

    /**
	 * Disconnect from the server
	 */
    disconnect(): void;

    /**
	 * Initialize the application
	 */
    init(config?: IVortexConfig, loadingScreen?: IVortexLoadingScreen): Promise<void>;
}
