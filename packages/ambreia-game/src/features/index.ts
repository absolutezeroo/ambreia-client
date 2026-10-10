import type {Renderer} from 'pixi.js';
import type {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import type {IAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';
import {Logger} from '@ambreia/common/utils/Logger';
import {RoomManager} from '@ambreia/iso/RoomManager';
import {HabboRoomRendererFactory} from '@ambreia/iso/scene/renderer/HabboRoomRendererFactory';
import {AvatarRenderManager} from '@ambreia/avatar/AvatarRenderManager';
import type {IAvatarData} from '@ambreia/avatar/AvatarData';
import {Core} from '@ambreia/kernel/Core';
import {HabboConfigurationManager} from '../configuration/HabboConfigurationManager';
import {LEGACY_DEFAULTS} from '../configuration/legacyDefaults';
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
import {CharacterFeature} from './character/feature';
import type {RpgCharacterSession} from './character/RpgCharacterSession';
import {InventoryFeature} from './inventory/feature';
import type {RpgInventorySession} from './inventory/RpgInventorySession';
import type {HudPanelsState} from './hud/HudPanelsState';
import {InteractionFeature} from './interaction/feature';
import type {RpgInteractionSession} from './interaction/RpgInteractionSession';
import {ChatFeature} from './chat/feature';
import type {RpgChatSession} from './chat/RpgChatSession';
import {CombatFeature} from './combat/feature';
import type {RpgCombatSession} from './combat/RpgCombatSession';
import {SkillsFeature} from './skills/feature';
import {InputFeature} from './input/feature';
import type {IInputBindings} from './input/IInputBindings';
import type {RpgSkillSession} from './skills/RpgSkillSession';
import type {PlayerHudState} from './hud/PlayerHudState';
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

const log = Logger.getLogger('habbo.features.GameFeatures');

/** What the features made, read back by VortexMain for its own wiring after the boot. */
export interface IEngineManagers
{
    configuration: HabboConfigurationManager | null;
    /** One .ambreia directory per asset family (features/asset-packs); null until the configuration completes. */
    assetDirectories: IAssetDirectories | null;
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
    /** The account's characters and the played one (features/character, F3a). */
    character: RpgCharacterSession | null;
    /** The HUD's panels (features/hud): its top bar announces `nav` clicks. */
    hud: HudPanelsState | null;
    /** The played character's bag and equipment (features/inventory, Objets §17). */
    inventory: RpgInventorySession | null;
    /** The zone's usable objects and the player's target (features/interaction, F3b). */
    interaction: RpgInteractionSession | null;
    /** The RPG chat (features/chat, F3c). */
    chat: RpgChatSession | null;
    /** The player frame's state (features/hud): combat writes the current HP and mana. */
    hudPlayer: PlayerHudState | null;
    /** The zone's fight: blows, health, death (features/combat, M1a). */
    combat: RpgCombatSession | null;
    /** The player's skills, the bar, cooldowns and statuses (features/skills, M1b). */
    skills: RpgSkillSession | null;
    /** The keyboard: the bindings of the features (features/input). */
    input: IInputBindings | null;
}

/** The engine's own objects the features are made with: none of them is configuration. */
export interface IEngineHost
{
    readonly assets: AssetLibrary;
    /** The avatar's shipped data, for the renderer. */
    readonly avatarData: IAvatarData;
    /** The `legacy` section (spec §5): old `key=value` properties, over legacy.defaults.json. */
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
        configuration: null, assetDirectories: null, communication: null, demo: null, localization: null, roomManager: null, roomSession: null,
        sessionData: null, roomEngine: null, avatarRenderer: null, windowManager: null, roomUI: null, character: null,
        hud: null, inventory: null, interaction: null, chat: null, hudPlayer: null, combat: null, skills: null, input: null
    };
}

/**
 * The configuration: legacy.defaults.json, then the kernel's `legacy` section (config.json, and the
 * page's url.prefix). Loaded as it is made, so it is complete before any manager after it reads it.
 */
const Configuration = feature({
    id: 'configuration',
    essential: 'every manager after it reads it',
    provides: [IID_HabboConfigurationManager],
    create: ({context, host}) =>
    {
        const manager = new HabboConfigurationManager(context);

        manager.load({...LEGACY_DEFAULTS, ...host.legacy});
        host.made.configuration = manager;

        return manager;
    }
});

/** The socket: the server from `app.server`, the ticket from `?sso=`. */
const Communication = feature({
    id: 'communication',
    essential: 'the client has no server without it',
    provides: [IID_HabboCommunicationManager],
    create: ({context, host, scope}) =>
    {
        const manager = new HabboCommunicationManager(context);

        host.made.communication = manager;
        scope.hook('connection', {state: () => manager.lifecycle.describe()});

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
        if(app.server.rsaModulus) demo.rsaModulus = app.server.rsaModulus;
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
    }
});

/** Plain classes since J4; start() is where AS3 ran initComponent(). */
const Rooms = feature({
    id: 'room-manager',
    provides: [IID_RoomManager],
    create: ({context, host}) =>
    {
        // The engine knows no property key: the client's legacy keys are mapped here.
        const manager = new RoomManager({
            externalImageUrl: (): string => context.configuration?.getProperty('stories.image_url_base') ?? '',
            extraDataServiceUrl: (): string => context.configuration?.getProperty('extra_data_service_url') ?? '',
            extraDataBatches: (): boolean => context.configuration?.getBoolean('extra_data_batches_enabled') ?? false
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
    create: ({context, host, scope}) =>
    {
        const manager = new RoomSessionManager(context);

        host.made.roomSession = manager;
        // The session the server knew is gone (a drop, a kick): every room session ends with it, so
        // the HUD, the widgets and the features start clean when the server puts the player back.
        scope.bind(host.made.communication?.lifecycle)('reset', () => manager.disposeAllSessions());

        return manager;
    }
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
    create: ({context, host}) => (host.made.roomEngine = new RoomEngine(context, host.assets, () => host.renderer(), () => host.made.assetDirectories))
});

/**
 * The avatar renderer: a plain class since J2, built from the clothing and effects .ambreia
 * directories (features/asset-packs) once the configuration is complete, and registered then. Nothing requires it, so the boot's dependency
 * check does not wait for it.
 */
const AvatarRenderer = feature({
    id: 'avatar-renderer',
    provides: [IID_AvatarRenderManager],
    create: ({context, host, scope}) =>
    {
        const made = host.made;
        const configuration = made.configuration;
        const start = (): void =>
        {
            const directories = made.assetDirectories;

            if(made.avatarRenderer !== null || configuration === null) return;

            if(directories === null)
            {
                log.error('No .ambreia directories (asset-packs): avatars cannot load');

                return;
            }

            made.avatarRenderer = new AvatarRenderManager({
                assets: host.assets,
                data: host.avatarData,
                clothing: directories.clothing,
                effects: directories.effects,
                onLibraryLoaded: name => Core.instance?.updateLoadingProcess(name, 'complete')
            });
            context.attachInstance(IID_AvatarRenderManager, made.avatarRenderer);
        };

        if(configuration?.isInitialized()) start();
        else scope.bindOnce(configuration?.events)('complete', start);

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
    InputFeature,
    CharacterFeature,
    HudFeature,
    InventoryFeature,
    InteractionFeature,
    ChatFeature,
    CombatFeature,
    SkillsFeature
];
