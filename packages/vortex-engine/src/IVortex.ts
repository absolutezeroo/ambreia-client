import type {CoreComponentContext} from '@core/runtime/CoreComponentContext';
import type {ICoreCommunicationManager} from '@core/communication/ICoreCommunicationManager';
import type {IDisposable} from '@ambreia/common/IDisposable';
import type {Application, Renderer} from 'pixi.js';
import type {IHabboConfigurationManager} from '@habbo/configuration';
import type {HabboCommunicationManager} from '@habbo/communication';
import type {RoomEngine} from '@habbo/room';
import type {IRoomSessionManager, ISessionDataManager} from '@habbo/session';
import type {IHabboLocalizationManager} from '@habbo/localization';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
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
