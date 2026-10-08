import type {Renderer} from 'pixi.js';
import type {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import {RoomManager} from '@ambreia/iso/RoomManager';
import {HabboRoomRendererFactory} from '@ambreia/iso/scene/renderer/HabboRoomRendererFactory';
import {AvatarRenderManager} from '@ambreia/avatar/AvatarRenderManager';
import {Core} from '@ambreia/kernel/Core';
import {HabboConfigurationManager} from '../configuration/HabboConfigurationManager';
import {HabboProperty} from '../configuration/index';
import {HabboCommunicationManager} from '../communication/HabboCommunicationManager';
import {HabboCommunicationDemo} from '../communication/demo/HabboCommunicationDemo';
import {HabboLocalizationManager} from '../localization/HabboLocalizationManager';
import {RoomSessionManager} from '../session/RoomSessionManager';
import {SessionDataManager} from '../session/SessionDataManager';
import {RoomEngine} from '../room/RoomEngine';
import {HabboWindowManager} from '../window/HabboWindowManager';
import {RoomUI} from '../ui/RoomUI';
import type {RoomWidgetRegistry} from '../ui/RoomWidgetRegistry';
import {ObjectLocationRequestHandler} from '../ui/handler/ObjectLocationRequestHandler';
import type {IGameFeature} from './GameFeature';
import {AvatarInfoFeature} from './avatar-info/feature';
import {LoadingBarFeature} from './loading-bar/feature';
import {AssetPacksFeature} from './asset-packs/feature';
import {HudFeature} from './hud/feature';
import {IID_HabboConfigurationManager} from '../iid/IIDHabboConfigurationManager';
import {IID_HabboCommunicationManager} from '../iid/IIDHabboCommunicationManager';
import {IID_HabboLocalizationManager} from '../iid/IIDHabboLocalizationManager';
import {IID_RoomManager} from '../iid/IIDRoomManager';
import {IID_RoomRendererFactory} from '../iid/IIDRoomRendererFactory';
import {IID_RoomSessionManager} from '../iid/IIDRoomSessionManager';
import {IID_SessionDataManager} from '../iid/IIDSessionDataManager';
import {IID_RoomEngine} from '../iid/IIDRoomEngine';
import {IID_AvatarRenderManager} from '../iid/IIDAvatarRenderManager';
import {IID_HabboWindowManager} from '../iid/IIDHabboWindowManager';
import {IID_RoomUI} from '../iid/IIDRoomUI';

/** What the features made, read back by VortexMain for its own wiring after the boot. */
export interface IEngineManagers
{
    configuration: HabboConfigurationManager | null;
    communication: HabboCommunicationManager | null;
    demo: HabboCommunicationDemo | null;
    localization: HabboLocalizationManager | null;
    roomManager: RoomManager | null;
    roomSession: RoomSessionManager | null;
    sessionData: SessionDataManager | null;
    roomEngine: RoomEngine | null;
    avatarRenderer: AvatarRenderManager | null;
    windowManager: HabboWindowManager | null;
    roomUI: RoomUI | null;
}

/** The engine's own objects the features are made with: none of them is configuration. */
export interface IEngineHost
{
    readonly assets: AssetLibrary;
    /** The AS3 embedded text assets (common_configuration_txt…), keyed by asset name. */
    readonly embeddedConfigurations: Readonly<Record<string, string>>;
    /** The `legacy` section (spec §5): old `key=value` properties, applied after the download. */
    readonly legacy: Readonly<Record<string, string>>;
    /** Called with the window manager before it is attached: its skins and layouts go in first. */
    onWindowManager(windowManager: HabboWindowManager): void;
    /** The application's renderer once it exists (screenshots); the game does not own it. */
    renderer(): Renderer | null;
    /** The room widgets the enabled features declare (roomWidgetRegistry()), for RoomUI. */
    readonly roomWidgets: RoomWidgetRegistry;
    readonly made: IEngineManagers;
}

/** Declares a game feature: its host is the engine shell's (IEngineHost). */
const feature = (declaration: IGameFeature): IGameFeature => declaration;

export function emptyManagers(): IEngineManagers
{
    return {
        configuration: null, communication: null, demo: null, localization: null, roomManager: null, roomSession: null,
        sessionData: null, roomEngine: null, avatarRenderer: null, windowManager: null, roomUI: null
    };
}

/**
 * The configuration: the embedded files, then external_variables, then the `legacy` section. It is
 * attached first and its download awaited, as prepareCore() did: every manager after it reads it.
 */
const Configuration = feature({
    id: 'configuration',
    essential: 'every manager after it reads it',
    provides: [IID_HabboConfigurationManager],
    create: ({context, host}) =>
    {
        const manager = new HabboConfigurationManager(context);

        manager.setEmbeddedConfigurationAssets({...host.embeddedConfigurations});
        host.made.configuration = manager;

        return manager;
    },
    afterAttach: async (_product, {app, host}) =>
    {
        const manager = host.made.configuration!;

        // The Component base defers initComponent() to a microtask, and resetAll() in it parses the
        // embedded configurations: the download has to start after it.
        await Promise.resolve();

        if(app.configurationUrl) manager.setProperty(HabboProperty.EXTERNAL_VARIABLES, app.configurationUrl);

        await manager.initConfigurationDownload();

        // After the download, so resetAll() does not clear them.
        for(const [key, value] of Object.entries(host.legacy)) manager.setProperty(key, value);
    }
});

/** The socket: the server from `app.server`, the ticket from `?sso=`. */
const Communication = feature({
    id: 'communication',
    essential: 'the client has no server without it',
    provides: [IID_HabboCommunicationManager],
    create: ({context, host}) =>
    {
        const manager = new HabboCommunicationManager(context);

        host.made.communication = manager;

        return manager;
    },
    afterAttach: (_product, {app, host}) =>
    {
        host.made.communication!.configure({
            host: app.server.host,
            ports: [...app.server.ports],
            ...(app.sso ? {ssoTicket: app.sso} : {})
        });
    }
});

/** The login flow and the incoming messages it handles. */
const CommunicationDemo = feature({
    id: 'communication-demo',
    essential: 'the client logs in through it (Vortex.connect)',
    create: ({context, app, host}) =>
    {
        const demo = new HabboCommunicationDemo(context);

        if(app.sso) demo.ssoTicket = app.sso;
        host.made.demo = demo;

        return demo;
    }
});

const Localization = feature({
    id: 'localization',
    provides: [IID_HabboLocalizationManager],
    create: ({context, host}) =>
    {
        const manager = new HabboLocalizationManager(context);

        host.made.localization = manager;

        return manager;
    },
    afterAttach: (_product, {host}) =>
    {
        const made = host.made;

        made.localization!.setConfigurationManager(made.configuration!);
        made.localization!.setCommunicationManager(made.communication!);
    }
});

/** Plain classes since J4; start() is where AS3 ran initComponent(). */
const Rooms = feature({
    id: 'room-manager',
    provides: [IID_RoomManager],
    create: ({context, host}) =>
    {
        const manager = new RoomManager({
            property: (key: string): string => context.configuration?.getProperty(key) ?? '',
            flag: (key: string): boolean => context.configuration?.getBoolean(key) ?? false
        });

        host.made.roomManager = manager;

        return {instance: manager, attach: {ready: () => manager.start()}};
    }
});

/** AS3: RoomEngine depends on IIDRoomRendererFactory and calls createRenderer(). */
const RoomRenderers = feature({
    id: 'room-renderer-factory',
    provides: [IID_RoomRendererFactory],
    create: () => ({instance: new HabboRoomRendererFactory()})
});

const RoomSessions = feature({
    id: 'room-session',
    provides: [IID_RoomSessionManager],
    create: ({context, host}) => (host.made.roomSession = new RoomSessionManager(context))
});

/** The user's data once authenticated (AS3: HabboSessionDataManagerLib). */
const SessionData = feature({
    id: 'session-data',
    provides: [IID_SessionDataManager],
    create: ({context, host}) => (host.made.sessionData = new SessionDataManager(context))
});

const RoomEngines = feature({
    id: 'room-engine',
    provides: [IID_RoomEngine],
    create: ({context, host}) => (host.made.roomEngine = new RoomEngine(context, host.assets, () => host.renderer()))
});

/**
 * The avatar renderer: a plain class since J2, built from four configuration keys once the
 * configuration is complete and registered then. Nothing requires it, so the boot's dependency
 * check does not wait for it.
 */
const AvatarRenderer = feature({
    id: 'avatar-renderer',
    provides: [IID_AvatarRenderManager],
    create: ({context, host}) =>
    {
        const made = host.made;
        const configuration = made.configuration;
        const start = (): void =>
        {
            if(made.avatarRenderer !== null || configuration === null) return;

            made.avatarRenderer = new AvatarRenderManager({
                assets: host.assets,
                downloadUrl: configuration.getProperty('flash.dynamic.avatar.download.url'),
                downloadNameTemplate: configuration.getProperty('flash.dynamic.avatar.download.name.template'),
                figureMapUrl: configuration.getProperty('flash.dynamic.avatar.download.configuration'),
                figurePartListUrl: configuration.getProperty('external.figurepartlist.txt'),
                onLibraryLoaded: name => Core.instance?.updateLoadingProcess(name, 'complete')
            });
            context.attachInstance(IID_AvatarRenderManager, made.avatarRenderer);
        };

        if(configuration?.isInitialized()) start();
        else configuration?.events.once('complete', start);

        return null;
    }
});

/** Plain since J3: its six services come in as dependencies of the attach. */
const Windows = feature({
    id: 'window-manager',
    provides: [IID_HabboWindowManager],
    create: ({context, host}) =>
    {
        const windowManager = new HabboWindowManager(context, {
            interpolate: (text: string): string => context.configuration?.interpolate(text) ?? text
        });

        host.made.windowManager = windowManager;
        host.onWindowManager(windowManager);

        return {
            instance: windowManager,
            attach: {
                dependencies: windowManager.createDependencies(),
                ready: () => windowManager.initialize(),
                update: (deltaTime: number) => windowManager.update(deltaTime),
                updatePriority: 0
            }
        };
    }
});

const RoomUserInterface = feature({
    id: 'room-ui',
    provides: [IID_RoomUI],
    create: ({context, host}) => (host.made.roomUI = new RoomUI(context, 0, host.assets, host.roomWidgets)),
    // AS3 RWE_LOCATION_WIDGET: a handler and no widget, answering where a room object is on screen.
    roomWidgets: {RWE_LOCATION_WIDGET: {handler: () => new ObjectLocationRequestHandler()}}
});

/**
 * The game's features, in the order prepareCore() attached them (spec §4: a feature is a
 * declaration and a line here). The avatar editor is not one yet: the client builds it after its
 * window layouts are registered (VortexMain.initAvatarEditor()).
 */
export const GAME_FEATURES: readonly IGameFeature[] = [
    Configuration, AssetPacksFeature, Communication, CommunicationDemo, Localization, Rooms, RoomRenderers, RoomSessions,
    SessionData, RoomEngines, AvatarRenderer, Windows, RoomUserInterface,
    AvatarInfoFeature,
    LoadingBarFeature,
    HudFeature
];
