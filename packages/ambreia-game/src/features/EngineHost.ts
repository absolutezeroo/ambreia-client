import type {Renderer} from 'pixi.js';
import type {AssetLibrary} from '@ambreia/common/assets/AssetLibrary';
import type {IAssetDirectories} from '@ambreia/common/assets/pack/AssetDirectories';
import type {IAvatarData} from '@ambreia/avatar/AvatarData';
import type {AvatarRenderManager} from '@ambreia/avatar/AvatarRenderManager';
import type {RoomManager} from '@ambreia/iso/RoomManager';
import type {HabboConfigurationManager} from '../configuration/HabboConfigurationManager';
import type {HabboCommunicationManager} from '../communication/HabboCommunicationManager';
import type {HabboCommunicationDemo} from '../communication/demo/HabboCommunicationDemo';
import type {HabboLocalizationManager} from '../localization/HabboLocalizationManager';
import type {RoomSessionManager} from '../session/RoomSessionManager';
import type {SessionDataManager} from '../session/SessionDataManager';
import type {RoomEngine} from '../room/RoomEngine';
import type {HabboWindowManager} from '../window/HabboWindowManager';
import type {RoomUI} from '../ui/RoomUI';
import type {RoomWidgetRegistry} from '../ui/RoomWidgetRegistry';
import type {RpgCharacterSession} from './character/RpgCharacterSession';
import type {RpgInventorySession} from './inventory/RpgInventorySession';
import type {HudPanelsState} from './hud/HudPanelsState';
import type {RpgInteractionSession} from './interaction/RpgInteractionSession';
import type {RpgChatSession} from './chat/RpgChatSession';
import type {RpgCombatSession} from './combat/RpgCombatSession';
import type {RpgSkillSession} from './skills/RpgSkillSession';
import type {PlayerHudState} from './hud/PlayerHudState';
import type {IInputBindings} from './input/IInputBindings';

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
