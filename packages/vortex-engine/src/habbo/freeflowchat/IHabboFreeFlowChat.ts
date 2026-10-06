import type {Container} from 'pixi.js';
import type {EventEmitter} from 'eventemitter3';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IChatStyleLibrary} from '@habbo/freeflowchat/style/IChatStyleLibrary';
import type {IVector3d} from '@room/utils/IVector3d';
import type {IPoint} from '@room/utils/IRoomGeometry';
import type {IUpdateReceiver} from '@core/runtime';
import type {ChatItem} from './data/ChatItem';
import type {ChatBubbleFactory} from './viewer/ChatBubbleFactory';
import type {ChatFlowViewer} from './viewer/ChatFlowViewer';

/**
 * Mirrors AS3's roomChatSettings struct (a preference bundle: bubble display
 * mode, width, scroll speed). AS3 self-initializes this in its constructor
 * (mode=0/free-flow, bubbleWidth=1/normal, scrollSpeed=1/normal) via
 * refreshEffectiveChatSettings() - it is never actually null in practice, and
 * this port matches that (see HabboFreeFlowChat's constructor). The account
 * preferences message (onAccountPreferences()) is the only thing that
 * updates these three away from that default once a real session connects.
 *
 * `floodSensitivity` comes from a different place than the other three: the account preferences
 * carry the display settings, while the sensitivity is the *room's* and arrives with the guest
 * room data or on its own (header 594). Only the chat input reads it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomChatSettings()
 */
export interface IRoomChatSettings
{
    readonly mode: number;
    readonly bubbleWidth: number;
    readonly scrollSpeed: number;
    readonly floodSensitivity: number;
}

/**
 * Minimal shape for the room session manager as needed by the FreeFlowChat handlers.
 * Includes sessionEvents (the correct EventEmitter for session lifecycle events)
 * rather than the Component-inherited events getter, plus getSession() for
 * resolving a room's IUserData (ChatBubbleFactory's user/pet name & figure lookups).
 *
 * @see IRoomSessionManager in @habbo/session/IRoomSessionManager
 * @see IRoomHandlerListener in @habbo/session/IRoomHandlerListener
 */
export interface IFreeFlowChatRoomSessionManager
{
    readonly sessionEvents: EventEmitter;

    getSession(roomId: number): IRoomSession | null;
}

/**
 * Interface for the HabboFreeFlowChat component.
 *
 * Provides methods for chat management, room lifecycle, visibility control,
 * and user preference management for the free-flow chat system.
 *
 * @see source_as_win63/habbo/freeflowchat/class_1809.as
 */
export interface IHabboFreeFlowChat
{
    /**
	 * Whether free flow chat is disabled in user preferences
	 */
    isDisabledInPreferences: boolean;

    /**
	 * The user's preferred chat style ID
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get preferedChatStyle()
    preferedChatStyle: number;

    /**
	 * Reference to the room session manager (used by handlers).
	 * Uses IFreeFlowChatRoomSessionManager to access sessionEvents
	 * (the correct EventEmitter, not the Component.events getter).
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomSessionManager()
    readonly roomSessionManager: IFreeFlowChatRoomSessionManager | null;

    /**
	 * Reference to the session data manager
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get sessionDataManager()
    readonly sessionDataManager: ISessionDataManager | null;

    /**
	 * Asset library used to load chat style catalog/bitmap assets.
	 * Exposed by the Component base class the concrete HabboFreeFlowChat extends.
	 */
    readonly assets: IAssetLibrary | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::getRoomChangeBitmap()
    getRoomChangeBitmap(): ImageBitmap | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::createPreviewBitmap()
    createPreviewBitmap(userName: string, styleId: number): ImageBitmap | null;

    /**
	 * Room engine, used to resolve room objects for pet figures / room-user names.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomEngine()
    readonly roomEngine: IRoomEngine | null;

    /**
	 * Localization manager, used by ChatBubbleFactory to build the special
	 * system chat messages (respect, handitem, mutetime, ping, pet events...).
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get localizations()
    readonly localizations: IHabboLocalizationManager | null;

    /**
	 * Avatar render manager, used by ChatBubbleFactory.getUserImage() to build
	 * the head-only avatar image HabboFaceFocuser crops for a bubble's face slot.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get avatarRenderManager()
    readonly avatarRenderManager: IAvatarRenderManager | null;

    /**
	 * Component.getBoolean() - exposed here since ChatBubbleFactory only ever
	 * holds an IHabboFreeFlowChat reference. AS3's own getUserImage() reads
	 * "zoom.enabled" straight off _SafeStr_4617 (the concrete HabboFreeFlowChat)
	 * the same way.
	 */
    getBoolean(key: string): boolean;

    /**
	 * Whether the room chat text field should be width-limited/bordered.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomChatBorderLimited()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomChatBorderLimited()
    readonly roomChatBorderLimited: boolean;

    /**
	 * The chat bubble style catalog, once the internal ChatBubbleFactory has built it.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatStyleLibrary()
    readonly chatStyleLibrary: IChatStyleLibrary | null;

    /**
	 * The bubble/history-entry factory (also owns the recycle pool consumed by
	 * ChatFlowViewer once a bubble is flagged readyToRecycle).
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatBubbleFactory()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatBubbleFactory()
    readonly chatBubbleFactory: ChatBubbleFactory | null;

    /**
	 * The live bubble display-list owner - null until roomEntered() builds it.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatFlowViewer()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatFlowViewer()
    readonly chatFlowViewer: ChatFlowViewer | null;

    /**
	 * The server-synced chat display preferences (bubble mode/width/scroll speed).
	 * Null until a real preferences message populates it - see IRoomChatSettings.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomChatSettings()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomChatSettings()
    readonly roomChatSettings: IRoomChatSettings | null;

    /**
	 * The user's font-size preference for chat bubbles (0-4, S/M/L/XL/XXL).
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get/set chatFontSizeMode()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatFontSizeMode()
    chatFontSizeMode: number;

    /**
	 * The text-scale multiplier for chatFontSizeMode's current value.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatFontSizeScale()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatFontSizeScale()
    readonly chatFontSizeScale: number;

    /**
	 * The root display object every chat bubble/history element is mounted
	 * into - RoomUI mounts this into the room's "room_new_chat" layout slot.
	 * Null until roomEntered() has built the ChatViewController.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get displayObject()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get displayObject()
    readonly displayObject: Container | null;

    /**
	 * Converts a room-space location to absolute stage/screen coordinates -
	 * how a chat bubble's pointer tracks its speaker's on-screen position.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::getScreenPointFromRoomLocation()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::getScreenPointFromRoomLocation()
    getScreenPointFromRoomLocation(roomId: number, location: IVector3d): IPoint;

    /**
	 * Whether a click on a chat bubble should propagate to a context menu
	 * instead of selecting the speaker's avatar.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::clickHasToPropagate()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::clickHasToPropagate()
    clickHasToPropagate(event: { global: { x: number; y: number } }): boolean;

    /**
	 * Selects the avatar that sent a chat item (bubble click handler).
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::selectAvatarWithChatItem()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::selectAvatarWithChatItem()
    selectAvatarWithChatItem(item: ChatItem): void;

    /**
	 * Selects an avatar by room and user id: tells the desktop to fetch its info, highlights it in
	 * the room engine, and reports the selection to moderation.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::selectAvatar()
    selectAvatar(roomId: number, userId: number): void;

    /**
	 * A link inside a chat bubble was clicked. `at` is where, in global coordinates, for the hint.
	 *
	 * DEVIATION: AS3 puts this in the bubble itself — `onTextLinkEvent()` reaches through
	 *   `chatFlow.context.createLinkEvent()` and `chatFlow.windowManager.showHint()`. This
	 *   interface deliberately exposes neither (see the note on `registerUpdateReceiver` below:
	 *   the views work through the chatFlow reference rather than getting their own component
	 *   access), and handing a bubble the context would hand it the whole client. So the bubble
	 *   reports the click and the component, which already holds both, acts on it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/visualization/PooledChatBubble.as::onTextLinkEvent()
    chatLinkClicked(url: string, at: {x: number; y: number}): void;

    /**
	 * Per-frame tick registration, inherited in AS3 from the component interface HabboFreeFlowChat
	 * implements — ChatFlowViewer/ChatFlowStage register themselves through the chatFlow reference
	 * they are constructed with rather than needing their own Component/context access.
	 *
	 * The citation here used to read `_SafeCls_47.as (IUpdateOwner-equivalent)`. That class is
	 * `IDisposable` — it declares `dispose()` and `get disposed()`, nothing else. The two methods
	 * below come from `_SafeCls_54`, which is where AS3 declares them.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::registerUpdateReceiver()
    registerUpdateReceiver(receiver: IUpdateReceiver, priority: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_54.as::removeUpdateReceiver()
    removeUpdateReceiver(receiver: IUpdateReceiver): void;

    /**
	 * The three chat display preferences, as the settings window reads and writes them.
	 * Each setter funnels through updateChatPreferences(), so writing one keeps the other
	 * two - which is why ChatSettingsView writes all three at once instead.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/_SafeCls_70.as::get/set chatMode()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatMode()
    chatMode: number;

    /**
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/_SafeCls_70.as::get/set chatBubbleWidth()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatBubbleWidth()
    chatBubbleWidth: number;

    /**
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/_SafeCls_70.as::get/set chatScrollSpeed()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatScrollSpeed()
    chatScrollSpeed: number;

    /**
	 * Commits all three preferences at once and tells the server.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/_SafeCls_70.as::updateChatPreferences()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::updateChatPreferences()
    updateChatPreferences(chatMode: number, chatBubbleWidth: number, chatScrollSpeed: number): void;

    /**
	 * Clear the current chat flow stage
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::clear()
    clear(): void;

    /**
	 * Toggle the chat history visibility
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::toggleVisibility()
    toggleVisibility(): void;

    /**
	 * Show or hide the whole chat flow.
	 *
	 * AS3 declares only the setter on this interface; TypeScript has no set-only interface member,
	 * so it is a property here and `HabboFreeFlowChat` still implements only the write half.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/_SafeCls_70.as::set visible()
    visible: boolean;

    /**
	 * Insert a chat item into the chat system.
	 * Adds to history buffer and (in VIEW layer) creates the visual bubble.
	 *
	 * @param item The chat item to insert
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::insertChat()
    insertChat(item: ChatItem): void;

    /**
	 * Called when a room session has been created/entered
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::roomEntered()
    roomEntered(): void;

    /**
	 * Called when a room session has ended/left
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::roomLeft()
    roomLeft(): void;

    /**
	 * Whether a style id is a "notification" style (its markup applies special
	 * elements, e.g. the recycle-bot notification bubbles) rather than a
	 * regular user-facing chat skin.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/_SafeCls_70.as::isNotificationStyle()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::isNotificationStyle()
    isNotificationStyle(styleId: number): boolean;
}
