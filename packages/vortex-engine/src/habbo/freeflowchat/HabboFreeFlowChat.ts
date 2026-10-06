import {EventEmitter} from 'eventemitter3';
import {NineSliceSprite, type Container, type Rectangle, Texture} from 'pixi.js';
import {Component, ComponentDependency, type IContext} from '@core/runtime';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_RoomUI} from '@iid/IIDRoomUI';
import type {IRoomUI} from '@habbo/ui/IRoomUI';
import {IID_HabboModeration} from '@iid/IIDHabboModeration';
import type {IHabboModeration} from '@habbo/moderation/IHabboModeration';
import {RoomWidgetRoomObjectMessage} from '@habbo/ui/widget/messages/RoomWidgetRoomObjectMessage';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import type {IAssetLibrary} from '@core/assets';
import {AssetBitmap} from '@core/assets/AssetBitmap';
import {Logger} from '@core/utils/Logger';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {RoomChatSettingsMessageEvent} from '@habbo/communication/messages/incoming/roomsettings/RoomChatSettingsMessageEvent';
import {GetGuestRoomResultMessageEvent} from '@habbo/communication/messages/incoming/navigator/GetGuestRoomResultMessageEvent';
import type {GetGuestRoomResultMessageParser} from '@habbo/communication/messages/parser/navigator/GetGuestRoomResultMessageParser';
import type {RoomChatSettingsMessageParser} from '@habbo/communication/messages/parser/roomsettings/RoomChatSettingsMessageParser';
import {AccountPreferencesEvent} from '@habbo/communication/messages/incoming/preferences/AccountPreferencesEvent';
import {
    RoomEntryInfoMessageEvent
} from '@habbo/communication/messages/incoming/room/engine/RoomEntryInfoMessageEvent';
import type {AccountPreferencesParser} from '@habbo/communication/messages/parser/preferences/AccountPreferencesParser';
import {SetChatStylePreferenceComposer} from '@habbo/communication/messages/outgoing/preferences/SetChatStylePreferenceComposer';
import {
    SetChatPreferencesMessageComposer
} from '@habbo/communication/messages/outgoing/room/chat/SetChatPreferencesMessageComposer';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IChatStyleLibrary} from '@habbo/freeflowchat/style/IChatStyleLibrary';
import type {IVector3d} from '@room/utils/IVector3d';
import type {IPoint} from '@room/utils/IRoomGeometry';
import type {IFreeFlowChatRoomSessionManager, IHabboFreeFlowChat, IRoomChatSettings} from './IHabboFreeFlowChat';
import {ChatEventHandler} from './data/ChatEventHandler';
import {RoomSessionEventHandler} from './data/RoomSessionEventHandler';
import {ChatHistoryBuffer} from './history/ChatHistoryBuffer';
import {ChatHistoryScrollView} from './history/visualization/ChatHistoryScrollView';
import {ChatHistoryTray} from './history/visualization/ChatHistoryTray';
import {ChatItem} from './data/ChatItem';
import {ChatBubble} from './viewer/visualization/ChatBubble';
import {RoomSessionChatEvent} from '@habbo/session/events/RoomSessionChatEvent';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import {IID_HabboCommunicationManager} from "@iid/IIDHabboCommunicationManager";
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import {ManualNineSliceSprite} from './viewer/visualization/ManualNineSliceSprite';
import {ChatBubbleFactory} from './viewer/ChatBubbleFactory';
import {ChatFlowViewer} from './viewer/ChatFlowViewer';
import {ChatFlowStage} from './viewer/simulation/ChatFlowStage';
import {ChatViewController} from './ChatViewController';
import {ChatMarkup} from './viewer/enum/ChatMarkup';
import type {IChatStyleInternal} from './viewer/visualization/style/IChatStyleInternal';

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = Logger.getLogger('habbo.freeflowchat.HabboFreeFlowChat');

/**
 * Events emitted by HabboFreeFlowChat for the UI layer.
 */
export interface IHabboFreeFlowChatEvents
{
    'chatInserted': (item: ChatItem) => void;
    'roomEntered': () => void;
    'roomLeft': () => void;
    'visibilityToggled': () => void;
}

/**
 * Main free flow chat component. Extends Component and implements IHabboFreeFlowChat.
 *
 * Manages the chat history buffer, event handlers for room chat and session lifecycle,
 * and user chat preferences. The ported chat windows listen to the `chatEvents` emitter for
 * updates.
 *
 * Dependencies:
 * - IHabboCommunicationManager (required)
 * - ISessionDataManager (optional)
 * - IRoomSessionManager (optional - accessed as IFreeFlowChatRoomSessionManager for sessionEvents)
 *
 * @see source_as_win63/habbo/freeflowchat/HabboFreeFlowChat.as
 */
export class HabboFreeFlowChat extends Component implements IHabboFreeFlowChat
{
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_communication
    private _communication: IHabboCommunicationManager | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatEventHandler
    private _chatEventHandler: ChatEventHandler | null = null;
    private _roomSessionEventHandler: RoomSessionEventHandler | null = null;
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_isInRoom
    private _isInRoom: boolean = false;
    private _isInitialized: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::HabboFreeFlowChat()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);

        this.refreshEffectiveChatSettings();
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_roomSessionManager
    private _roomSessionManager: IFreeFlowChatRoomSessionManager | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomSessionManager()
    get roomSessionManager(): IFreeFlowChatRoomSessionManager | null
    {
        return this._roomSessionManager;
    }

    private _chatHistory: ChatHistoryBuffer | null = null;

    get chatHistory(): ChatHistoryBuffer | null
    {
        return this._chatHistory;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_roomUI
    private _roomUI: IRoomUI | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_moderation
    private _moderation: IHabboModeration | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomEngine()
    get roomEngine(): IRoomEngine | null
    {
        return this._roomEngine;
    }

    private _localizations: IHabboLocalizationManager | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get localizations()
    get localizations(): IHabboLocalizationManager | null
    {
        return this._localizations;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get avatarRenderManager()
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get avatarRenderManager()
    get avatarRenderManager(): IAvatarRenderManager | null
    {
        return this._avatarRenderManager;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatBubbleFactory
    private _chatBubbleFactory: ChatBubbleFactory | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatStyleLibrary()
    get chatStyleLibrary(): IChatStyleLibrary | null
    {
        return this._chatBubbleFactory?.chatStyleLibrary ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatBubbleFactory()
    get chatBubbleFactory(): ChatBubbleFactory | null
    {
        return this._chatBubbleFactory;
    }

    // The AS3 field is obfuscated (`_SafeStr_7026`); this name is DERIVED from the readable
    // accessor `get chatHistoryScrollView()` that returns it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatHistoryScrollView
    private _chatHistoryScrollView: ChatHistoryScrollView | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatHistoryPulldown
    private _chatHistoryPulldown: ChatHistoryTray | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatHistoryScrollView()
    get chatHistoryScrollView(): ChatHistoryScrollView | null
    {
        return this._chatHistoryScrollView;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::set visible()
    set visible(value: boolean)
    {
        if(this._chatHistoryPulldown !== null) this._chatHistoryPulldown.visible = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::isNotificationStyle()
    // (declared on _SafeCls_70.as, the IHabboFreeFlowChat-equivalent interface). AS3 casts the
    // narrowed IChatStyleLibrary result back to the concrete ChatStyle to read `isNotification` -
    // IChatStyle's public contract doesn't carry the flag, only IChatStyleInternal does - the same
    // cast createPreviewBitmap() above already uses.
    isNotificationStyle(styleId: number): boolean
    {
        const style = this.chatStyleLibrary?.getStyle(styleId) ?? null;

        return style !== null && (style as unknown as IChatStyleInternal).isNotification;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get toolbar()
    get toolbar(): IHabboToolbar | null
    {
        return this._toolbar;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomChatBorderLimited()
    get roomChatBorderLimited(): boolean
    {
        return this._roomChatSettings?.mode === 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatMode
    private _chatMode: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatBubbleWidth
    private _chatBubbleWidth: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get/set chatScrollSpeed() (backing field, "_-51u")
    private _chatScrollSpeed: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomChatSettings()
    // Built by refreshEffectiveChatSettings() from _chatMode/_chatBubbleWidth/_chatScrollSpeed,
    // which the constructor already calls once (matching AS3's own constructor) - so this is
    // never actually null in practice, same as AS3. onAccountPreferences() (below) is the only
    // thing that ever changes these three away from their built-in defaults (mode=0/free-flow,
    // bubbleWidth=1/normal, scrollSpeed=1/normal -> ChatFlowStage's 6000ms tier, not the
    // 10000ms "no settings at all" fallback ChatFlowStage.ts falls back to if this were null).
    private _roomChatSettings: IRoomChatSettings | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get roomChatSettings()
    get roomChatSettings(): IRoomChatSettings | null
    {
        return this._roomChatSettings;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::refreshEffectiveChatSettings()
    private refreshEffectiveChatSettings(): void
    {
        this._roomChatSettings = {
            mode: this._chatMode,
            bubbleWidth: this._chatBubbleWidth,
            scrollSpeed: this._chatScrollSpeed,
            floodSensitivity: this._floodSensitivity,
        };
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_SafeStr_7573
    // Name DERIVED: obfuscated in every tree; `fromFloodSensitivity()` is what identifies it.
    // Starts at 1 (normal), which is also what a room that sends no chat settings leaves it at.
    private _floodSensitivity: number = 1;

    /**
     * Entering a room brings its chat settings along with everything else about it.
     *
     * Only the sensitivity is taken, and only when the message carries settings at all — a room
     * result without them leaves the current value alone, which is the opposite of what
     * `onRoomChatSettings()` does with an empty message. Both asymmetries are AS3's.
     *
     * It is also where the history gets its "you moved room" divider — once per room, because this
     * message arrives again on every room-info refresh and each one would otherwise draw another
     * separator. `onRoomEnter()` is what re-arms the flag.
     */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::onGuestRoomData()
    private onGuestRoomData(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as GetGuestRoomResultMessageParser | null;
        const chatSettings = parser?.chatSettings ?? null;

        if(this._chatHistory !== null && !this._roomChangeInserted)
        {
            this._chatHistory.insertRoomChange(parser?.data ?? null);
        }

        this._roomChangeInserted = true;

        if(chatSettings !== null)
        {
            this._floodSensitivity = chatSettings.floodSensitivity;

            this.refreshEffectiveChatSettings();
        }

        this._chatFlowStage?.refreshSettings();
    }

    /**
	 * Entering a room throws the previous room's bubbles away.
	 *
	 * It also re-arms the "room-change divider already inserted" flag, so the next room-info result
	 * draws one separator and the ones after it do not — see `onGuestRoomData()` above.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::onRoomEnter()
    private onRoomEnter(): void
    {
        this._roomChangeInserted = false;

        this.clear();
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_roomChangeInserted
    // Name DERIVED: `_SafeStr_7938` is obfuscated in every tree. The two lines that read and write
    // it — the guard in onGuestRoomData() and the reset in onRoomEnter() — are what name it.
    private _roomChangeInserted: boolean = false;

    /**
     * The room pushed a new flood sensitivity.
     *
     * A message with no settings resets to 1 rather than keeping the previous room's — AS3 writes
     * that fallback out, and it matters because this arrives per room.
     */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::onRoomChatSettings()
    private onRoomChatSettings(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as RoomChatSettingsMessageParser | null;

        this._floodSensitivity = parser?.chatSettings?.floodSensitivity ?? 1;

        this.refreshEffectiveChatSettings();

        if(this._isInRoom) this._chatFlowStage?.refreshSettings();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::sanitizeChatMode()
    private sanitizeChatMode(value: number): number
    {
        return value === 0 || value === 1 ? value : 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::sanitizeChatBubbleWidth()
    private sanitizeChatBubbleWidth(value: number): number
    {
        return value === 0 || value === 1 || value === 2 ? value : 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::sanitizeChatScrollSpeed()
    private sanitizeChatScrollSpeed(value: number): number
    {
        return value === 0 || value === 1 || value === 2 ? value : 1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::clampChatFontSizeMode()
    private clampChatFontSizeMode(value: number): number
    {
        return value < 0 ? 0 : (value > 4 ? 4 : value);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatMode()
    get chatMode(): number
    {
        return this._chatMode;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::set chatMode()
    set chatMode(value: number)
    {
        this.updateChatPreferences(value, this._chatBubbleWidth, this._chatScrollSpeed);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatBubbleWidth()
    get chatBubbleWidth(): number
    {
        return this._chatBubbleWidth;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::set chatBubbleWidth()
    set chatBubbleWidth(value: number)
    {
        this.updateChatPreferences(this._chatMode, value, this._chatScrollSpeed);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatScrollSpeed()
    get chatScrollSpeed(): number
    {
        return this._chatScrollSpeed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::set chatScrollSpeed()
    set chatScrollSpeed(value: number)
    {
        this.updateChatPreferences(this._chatMode, this._chatBubbleWidth, value);
    }

    /**
	 * Apply the three room-chat display preferences together.
	 *
	 * The three setters above all route through here with the other two unchanged — none of them
	 * sends on its own. Sanitising happens *before* the equality check, so a value that sanitises
	 * back to the current one is correctly treated as no change and sends nothing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::updateChatPreferences()
    updateChatPreferences(chatMode: number, chatBubbleWidth: number, chatScrollSpeed: number): void
    {
        chatMode = this.sanitizeChatMode(chatMode);
        chatBubbleWidth = this.sanitizeChatBubbleWidth(chatBubbleWidth);
        chatScrollSpeed = this.sanitizeChatScrollSpeed(chatScrollSpeed);

        if(this._chatMode === chatMode && this._chatBubbleWidth === chatBubbleWidth && this._chatScrollSpeed === chatScrollSpeed)
        {
            return;
        }

        this._chatMode = chatMode;
        this._chatBubbleWidth = chatBubbleWidth;
        this._chatScrollSpeed = chatScrollSpeed;

        this.refreshEffectiveChatSettings();
        this.refreshChatSettings();
        this.sendChatPreferences();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::refreshChatSettings()
    private refreshChatSettings(): void
    {
        if(this._isInRoom) this._chatFlowStage?.refreshSettings();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::sendChatPreferences()
    private sendChatPreferences(): void
    {
        this._communication?.connection?.send(
            new SetChatPreferencesMessageComposer(this._chatMode, this._chatBubbleWidth, this._chatScrollSpeed)
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::onAccountPreferences()
    // The account's own three display settings; the room's flood sensitivity comes in through
    // onRoomChatSettings() instead, and both end up in refreshEffectiveChatSettings().
    private onAccountPreferences(event: IMessageEvent): void
    {
        if(!event) return;

        const parser = event.parser as AccountPreferencesParser;

        if(!parser) return;

        this._preferedChatStyle = parser.preferedChatStyle;
        this._chatFontSizeMode = this.clampChatFontSizeMode(parser.chatSizePreference);
        this._chatMode = this.sanitizeChatMode(parser.chatMode);
        this._chatBubbleWidth = this.sanitizeChatBubbleWidth(parser.chatBubbleWidth);
        this._chatScrollSpeed = this.sanitizeChatScrollSpeed(parser.chatScrollSpeed);

        this.refreshEffectiveChatSettings();

        if(this._isInRoom) this._chatFlowStage?.refreshSettings();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatFontSizeMode
    private _chatFontSizeMode: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatFontSizeMode()
    get chatFontSizeMode(): number
    {
        return this._chatFontSizeMode;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::set chatFontSizeMode()
    set chatFontSizeMode(value: number)
    {
        this._chatFontSizeMode = this.clampChatFontSizeMode(value);

        this._communication?.connection?.send(new SetChatStylePreferenceComposer(this._preferedChatStyle, this._chatFontSizeMode));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatFontSizeScale()
    get chatFontSizeScale(): number
    {
        switch(this._chatFontSizeMode - 1)
        {
            case 0: return 1.15;
            case 1: return 1.3;
            case 2: return 1.5;
            case 3: return 1.75;
            default: return 1;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get displayObject()
    // Set by roomEntered() once the ChatViewController exists (see viewer/ChatViewController.ts).
    private _displayObject: Container | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get displayObject()
    get displayObject(): Container | null
    {
        return this._displayObject;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::getScreenPointFromRoomLocation()
    // `geometry.getScreenPoint()` returns a point relative to the isometric
    // camera's own centre, not the canvas's top-left - AS3 recentres it onto
    // the Flash stage (stage.stageWidth/stageHeight / 2) before adding the
    // scaled raw point and the pan offset. An earlier version of this method
    // dropped that recentring term, reasoning that ChatFlowViewer.rootDisplayObject
    // shares the room's own coordinate space directly - wrong: it's mounted
    // into a window-system container (RoomDesktopLayoutManager.getChatContainer()),
    // a *separate* display tree from the room canvas, exactly like AS3's
    // "separate DisplayObject tree" case this method exists to handle. Confirmed
    // via live diagnostic: every bubble was landing at a large negative x/y
    // (e.g. x=-534 for a valid, on-screen avatar position) until this term was
    // restored. `stage.stageWidth/stageHeight` has no direct equivalent here
    // (this port has one PixiJS canvas, not per-room Flash sub-stages); using
    // window.innerWidth/innerHeight instead, matching the same stand-in
    // PooledChatBubble.ts already uses for AS3's stage.stageWidth elsewhere in
    // this same feature (the canvas is resized to the window by default - see
    // Vortex.ts's `resizeTo: config?.resizeTo ?? window`).
    getScreenPointFromRoomLocation(roomId: number, location: IVector3d): IPoint
    {
        const zero: IPoint = {x: 0, y: 0};

        if(!this._roomEngine) return zero;

        const geometry = this._roomEngine.getRoomCanvasGeometry(roomId);
        const canvasScale = this._roomEngine.getRoomCanvasScale(roomId);
        const stageWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        const stageHeight = typeof window !== 'undefined' ? window.innerHeight : 0;

        let x = (stageWidth * canvasScale) / 2;
        let y = (stageHeight * canvasScale) / 2;

        if(geometry)
        {
            const point = geometry.getScreenPoint(location);

            if(point)
            {
                x += point.x * canvasScale;
                y += point.y * canvasScale;

                const offset = this._roomEngine.getRoomCanvasScreenOffset(roomId);

                if(offset)
                {
                    x += offset.x;
                    y += offset.y;
                }
            }
        }

        return {x, y};
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::clickHasToPropagate()
    clickHasToPropagate(event: { global: { x: number; y: number } }): boolean
    {
        return this._roomUI ? this._roomUI.mouseEventPositionHasContextMenu(event) : false;
    }

    /**
	 * Tells the room engine to swallow mouse events left of `x`, so the chat-history column
	 * does not click through to the room behind it. 0 clears the threshold.
	 *
	 * Its only AS3 callers are in `history/visualization/ChatHistoryTray.as`, which this port
	 * has not got yet — the tray, its scroll bar and its scroll view are all unported.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::disableRoomMouseEventsLeftOfX()
    public disableRoomMouseEventsLeftOfX(x: number): void
    {
        if(this._roomEngine) this._roomEngine.mouseEventsDisabledLeftToX = x;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::selectAvatarWithChatItem()
    selectAvatarWithChatItem(item: ChatItem): void
    {
        this.selectAvatar(item.roomId, item.userId);
    }

    /**
	 * Both branches of AS3's `onTextLinkEvent()`, moved off the bubble — see the DEVIATION note on
	 * `IHabboFreeFlowChat.chatLinkClicked()` for why the bubble reports instead of acting.
	 *
	 * `highlight/<text>` is not a client link: it shows the rest of the string as a hint at the
	 * cursor, uppercased, which is how a chat bubble annotates a word. Anything else is a real
	 * link and goes to the link trackers.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/viewer/visualization/PooledChatBubble.as::onTextLinkEvent()
    chatLinkClicked(url: string, at: {x: number; y: number}): void
    {
        if(url.length === 0) return;

        const marker = 'highlight/';
        const index = url.indexOf(marker);

        if(index > -1)
        {
            const hint = url.substring(index + marker.length);

            this._windowManager?.hideHint();
            this._windowManager?.showHint(hint.toLocaleUpperCase(), {x: at.x, y: at.y, width: 0, height: 0});

            return;
        }

        this.context.createLinkEvent(url);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::selectAvatar()
    selectAvatar(roomId: number, userId: number): void
    {
        if(this._roomUI == null) return;

        this._roomUI.desktop?.processWidgetMessage(
            new RoomWidgetRoomObjectMessage(RoomWidgetRoomObjectMessage.GET_OBJECT_INFO, userId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        );

        this._roomEngine?.selectAvatar(roomId, userId);

        const session = this._roomSessionManager?.getSession(roomId);

        if(session)
        {
            // AS3 reads the same user twice into two locals and then uses one's webID with the
            // other's name. Both come from the same lookup, so this is one read here.
            const userData = session.userDataManager?.getUserDataByIndex(userId);

            if(userData && this._moderation)
            {
                this._moderation.userSelected(userData.webID, userData.name);
            }
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_preferedChatStyle
    private _preferedChatStyle: number = 1;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get preferedChatStyle()
    get preferedChatStyle(): number
    {
        return this._preferedChatStyle;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::set preferedChatStyle()
    set preferedChatStyle(value: number)
    {
        this._preferedChatStyle = value;

        this._communication?.connection?.send(new SetChatStylePreferenceComposer(this._preferedChatStyle, this._chatFontSizeMode));
    }

    private _isDisabledInPreferences: boolean = false;

    // AS3: sources/win63_version/habbo/freeflowchat/HabboFreeFlowChat.as::get isDisabledInPreferences()
    get isDisabledInPreferences(): boolean
    {
        return this._isDisabledInPreferences;
    }

    /**
	 * Note this deliberately sends nothing. The TODO that used to sit here claimed
	 * SetChatPreferencesMessageComposer belonged in this setter, taking the boolean — it does not.
	 * That composer carries (chatMode, chatBubbleWidth, chatScrollSpeed) and is only ever sent
	 * from updateChatPreferences(); AS3 has no wire traffic on this flag at all.
	 */
    // AS3: sources/win63_version/habbo/freeflowchat/HabboFreeFlowChat.as::set isDisabledInPreferences()
    set isDisabledInPreferences(value: boolean)
    {
        this._isDisabledInPreferences = value;
    }

    /**
	 * Event emitter for UI bridge. Uses a separate emitter name (_chatEvents)
	 * to avoid conflicting with the Component base class's _events / events getter.
	 *
	 * @see MEMORY.md - NEVER override the events getter in Component subclasses
	 */
    private _chatEvents: EventEmitter<IHabboFreeFlowChatEvents> = new EventEmitter();

    /**
	 * Event emitter for the UI layer to listen to chat events.
	 * Named chatEvents to avoid conflicting with Component.events.
	 */
    get chatEvents(): EventEmitter<IHabboFreeFlowChatEvents>
    {
        return this._chatEvents;
    }

    /**
	 * Component dependencies.
	 */
    // DEVIATION: AS3 also takes the optional games manager for snow-war chat;
    //   the RPG fork removed Snow War and the games manager.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::dependencies
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communication = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) =>
                {
                    this._sessionDataManager = manager;
                },
                false
            ),
            // AS3 (HabboFreeFlowChat.as:200) passes no required flag, so this defaults to required.
            // It has to be: initComponent() builds ChatEventHandler, whose constructor subscribes to
            // roomSessionManager's RSCE_CHAT_EVENT straight away. Optional here means initComponent()
            // can run before the manager lands, and the subscription is then never made at all.
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: any | null) =>
                {
                    // Cast to IFreeFlowChatRoomSessionManager to access sessionEvents
                    // (the correct EventEmitter for session lifecycle events, not Component.events)
                    this._roomSessionManager = manager as IFreeFlowChatRoomSessionManager | null;
                },
                true
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (manager: IRoomEngine | null) =>
                {
                    this._roomEngine = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_RoomUI,
                (roomUI: IRoomUI | null) =>
                {
                    this._roomUI = roomUI;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboModeration,
                (moderation: IHabboModeration | null) =>
                {
                    this._moderation = moderation;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localizations = manager;
                },
                false
            ),
            // AS3 declares this optional too. Nothing in this class reads it — the bubbles are
            // drawn onto the room canvas, not into toolbar windows — but `get toolbar()` is part
            // of the class's surface and other components reach the toolbar through it.
            // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::dependencies (IIDHabboToolbar)
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) =>
                {
                    this._toolbar = toolbar;
                },
                false
            ),
            new ComponentDependency(
                IID_AvatarRenderManager,
                (manager: IAvatarRenderManager | null) =>
                {
                    this._avatarRenderManager = manager;
                },
                false
            ),
            // Optional, and read live rather than cached: the window manager attaches after several
            // other components, and the only thing that needs it is the history tray's ignore
            // confirmation, which cannot run before somebody has opened the tray and clicked a row.
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                },
                false
            ),
        ];
    }

    /**
	 * Get a formatted timestamp string for the current time.
	 *
	 * @returns A string in HH:MM:SS format
	 */
    /**
     * One chat bubble rendered on its own, for a preview: the catalog's chat-style swatches ask for
     * this.
     *
     * The bubble is built from a *synthetic* chat item — an empty RoomSessionChatEvent, no session,
     * user id -1 — because there is no message and no speaker here, only a style being shown off.
     * The user name doubles as the bubble's text, which is AS3's own trick: a style preview reads
     * as the player saying their own name.
     */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::createPreviewBitmap()
    createPreviewBitmap(userName: string, styleId: number): ImageBitmap | null
    {
        const style = this.chatStyleLibrary?.getStyle(styleId) ?? null;

        if(style === null) return null;

        const event = new RoomSessionChatEvent('RSCE_CHAT_EVENT', null as unknown as IRoomSession, -1, '', 0, styleId);
        const item = new ChatItem(event, Date.now(), null, 0, null, null, null, userName);
        // The library hands back the public `IChatStyle`; the bubble needs the internal view of the
        // same object, which is what ChatBubbleFactory casts to as well.
        const bubble = new ChatBubble(item, style as unknown as IChatStyleInternal, null, userName, 0, this);

        try
        {
            return bubble.toImageBitmapSync();
        }
        finally
        {
            bubble.dispose();
        }
    }

    /**
     * The little "you moved room" separator drawn between two rooms' history.
     *
     * Shipped as `room_change.png`; the asset build strips the `_png` linkage suffix AS3's own
     * `getAssetByName("room_change")` already omits, so the name is the same on both sides.
     */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::getRoomChangeBitmap()
    getRoomChangeBitmap(): ImageBitmap | null
    {
        return AssetBitmap.resolveSync(this.assets?.getAssetByName('room_change')?.content ?? null);
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::getTimeStampNow()
    static getTimeStampNow(): string
    {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const hStr = hours < 10 ? '0' + hours : hours.toString();
        const mStr = minutes < 10 ? '0' + minutes : minutes.toString();
        const sStr = seconds < 10 ? '0' + seconds : seconds.toString();

        return hStr + ':' + mStr + ':' + sStr;
    }

    /**
	 * Builds a resizable nine-slice display object from a background bitmap and
	 * its scale9 grid — the "live" variant (AS3 built this via a real Flash
	 * `Sprite.scale9Grid`, which PixiJS's own `NineSliceSprite` reproduces
	 * natively on the GPU without needing a per-resize CPU bake).
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::create9SliceSprite()
	 */
    static createNineSliceSprite(scale9Grid: Rectangle, background: ImageBitmap): Container
    {
        return new NineSliceSprite({
            texture: Texture.from(background),
            leftWidth: scale9Grid.x,
            topHeight: scale9Grid.y,
            rightWidth: background.width - scale9Grid.right,
            bottomHeight: background.height - scale9Grid.bottom,
            width: background.width,
            height: background.height,
        });
    }

    /**
	 * AS3's "pixel perfect" variant delegated to `ManualNineSliceSprite`, which
	 * manually re-composited BitmapData patches into a single bitmap on every
	 * resize instead of relying on Flash's live `scale9Grid` — a CPU-side
	 * optimization for a renderer that had to recompute it on the fly.
	 * PixiJS's `NineSliceSprite` above already renders both variants
	 * identically on the GPU, but `ManualNineSliceSprite` is ported as-is for
	 * fidelity in case a caller depends on its baked-bitmap semantics.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::createPixelPerfect9SliceSprite()
	 */
    static createPixelPerfectNineSliceSprite(scale9Grid: Rectangle, background: ImageBitmap): Container
    {
        return new ManualNineSliceSprite(scale9Grid, background);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatFlowStage
    private _chatFlowStage: ChatFlowStage | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatFlowViewer
    private _chatFlowViewer: ChatFlowViewer | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::_chatViewController
    private _chatViewController: ChatViewController | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::get chatFlowViewer()
    get chatFlowViewer(): ChatFlowViewer | null
    {
        return this._chatFlowViewer;
    }

    /**
	 * Called when a room session is created/entered.
	 *
	 * Builds all four pieces AS3 builds, in AS3's order: the flow stage and viewer for the live
	 * bubbles, then the history scroll view and the tray that slides it in, then the controller
	 * whose one container holds the viewer and the tray side by side.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::roomEntered()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::roomEntered()
    roomEntered(): void
    {
        this._isInRoom = true;

        if(this._isInitialized && this._chatBubbleFactory && this._chatHistory)
        {
            this._chatFlowStage = new ChatFlowStage(this);
            this._chatFlowViewer = new ChatFlowViewer(this, this._chatFlowStage);
            this._chatHistoryScrollView = new ChatHistoryScrollView(this, this._chatHistory);
            this._chatHistoryPulldown = new ChatHistoryTray(this, this._chatHistoryScrollView);
            this._chatViewController = new ChatViewController(this._chatFlowViewer, this._chatHistoryPulldown);

            const rootDisplayObject = this._chatViewController.rootDisplayObject;

            this._displayObject = rootDisplayObject;

            // TS-only, see RoomEngine.ts::addStageChild(). RoomUI.ts also calls
            // getChatContainer()?.setDisplayObject(this._displayObject) so
            // WindowComposite punches a transparent hole for it at the right
            // screen rect, but that alone never puts this container on the
            // actual PixiJS stage - it's only bookkeeping for the window
            // system's own (separately Canvas2D-composited) tree. Without this
            // call every bubble renders into a display object that's never
            // part of any rendered scene at all.
            if(rootDisplayObject) this._roomEngine?.addStageChild(rootDisplayObject);

            this._chatEvents.emit('roomEntered');

            log.debug('Room entered');
        }
    }

    /**
	 * Called when a room session has ended/left.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::roomLeft()
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::roomLeft()
    roomLeft(): void
    {
        if(this._displayObject) this._roomEngine?.removeStageChild(this._displayObject);

        this._chatHistoryPulldown?.dispose();
        this._chatHistoryPulldown = null;

        // AS3 nulls `_chatHistoryPulldown` a second time here instead of `_chatHistoryScrollView`
        // — a copy-paste slip that leaks the view for the life of the session. Corrected, and noted
        // rather than transcribed: the tray is already gone one branch up.
        this._chatHistoryScrollView?.dispose();
        this._chatHistoryScrollView = null;

        this._chatViewController?.dispose();
        this._chatViewController = null;

        this._chatFlowViewer?.dispose();
        this._chatFlowViewer = null;

        this._chatFlowStage?.dispose();
        this._chatFlowStage = null;

        this._displayObject = null;
        this._isInRoom = false;
        this._chatEvents.emit('roomLeft');
        log.debug('Room left');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::fixHtml()
    // Escapes raw HTML if the style doesn't allow it, then applies ChatMarkup's
    // [tag]/@color@ shorthand - see ChatTextLayout.ts's parseInlineMarkup() for how the
    // resulting <b>/<i>/<u>/<font color> tags get turned into styled runs (no real HTML
    // text component in this port).
    private fixHtml(item: ChatItem, style: IChatStyleInternal): void
    {
        if(!style.allowHTML)
        {
            item.text = item.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            item.text = item.text.replace(/&#[0-9]+;/g, '');
            item.text = item.text.replace(/&#x[0-9]+;/g, '');
        }

        const color = style.textFormat?.color ?? 0;

        if(style.isNotification)
        {
            item.text = ChatMarkup.applyToElements(item.text, color);
        }

        item.text = ChatMarkup.applyColourToChat(item.text, color);
    }

    /**
	 * Insert a chat item into the chat system: adds it to the history buffer,
	 * builds a live PooledChatBubble for it, places it via the (currently
	 * minimal - see ChatFlowStage.ts) chat flow stage, and hands it to the
	 * viewer to display.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::insertChat()
	 *
	 * @param item The chat item to insert
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::insertChat()
    insertChat(item: ChatItem): void
    {
        if(!this._isInitialized || !this._chatHistory || this._isDisabledInPreferences || !this._chatFlowStage || !this._chatFlowViewer || !this._chatBubbleFactory)
        {
            return;
        }

        const style = this._chatBubbleFactory.chatStyleLibrary?.getStyle(item.style);

        if(style) this.fixHtml(item, style);

        this._chatHistory.insertChat(item);
        this._chatEvents.emit('chatInserted', item);

        const bubble = this._chatBubbleFactory.getNewChatBubble(item);

        if(!bubble) return;

        const position = this._chatFlowStage.insertBubble(bubble);

        this._chatFlowViewer.insertBubble(bubble, position);
    }

    /**
	 * Clear the current chat flow — AS3 is `if(_chatFlowStage) _chatFlowStage.clear()`.
	 *
	 * This used to emit a `cleared` event on the TS-only bus instead, and nothing anywhere listened
	 * for it, so clearing the chat did nothing at all. The stage's own `clear()` was ported and
	 * reachable the whole time.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::clear()
    clear(): void
    {
        this._chatFlowStage?.clear();
    }

    /**
	 * Slides the chat-history tray in or out. This is what the room tools' `button_chat_history`
	 * reaches, and until the tray was built it emitted an event nobody listened for.
	 *
	 * AS3 gates on the perk flag, which this port stands in for with `_isInitialized`, as
	 * everywhere else in this class.
	 */
    // AS3: .../src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::toggleVisibility()
    toggleVisibility(): void
    {
        // AS3 returns in silence here. The room-tools button is the only caller, so a silent return
        // is a button that does nothing for a reason nobody can see — the same trade the fishing
        // refusals were given a voice for. `warn`, because each of the three means a real gap:
        // no tray built (roomEntered() has not run, or ran before the buffer existed), the component
        // never initialised, or the feature switched off in preferences.
        if(this._isDisabledInPreferences || !this._isInitialized || this._chatHistoryPulldown === null)
        {
            log.warn('Chat history toggle ignored — '
                + `disabledInPreferences=${this._isDisabledInPreferences}, `
                + `initialized=${this._isInitialized}, `
                + `tray=${this._chatHistoryPulldown !== null}`);

            return;
        }

        this._chatHistoryPulldown.toggleHistoryVisibility();
        this._chatEvents.emit('visibilityToggled');
    }

    /**
	 * Dispose of the component, all handlers, and the chat history.
	 */
    override dispose(): void
    {
        if(this.disposed) return;

        if(this._chatEventHandler)
        {
            this._chatEventHandler.dispose();
            this._chatEventHandler = null;
        }

        if(this._roomSessionEventHandler)
        {
            this._roomSessionEventHandler.dispose();
            this._roomSessionEventHandler = null;
        }

        if(this._chatHistory)
        {
            this._chatHistory.dispose();
            this._chatHistory = null;
        }

        if(this._chatBubbleFactory)
        {
            this._chatBubbleFactory.dispose();
            this._chatBubbleFactory = null;
        }

        this._chatEvents.removeAllListeners();

        this._communication = null;
        this._sessionDataManager = null;
        this._roomSessionManager = null;
        this._roomEngine = null;
        this._localizations = null;
        this._isInitialized = false;

        super.dispose();
    }

    /**
	 * Called when all required dependencies have been injected.
	 * Creates the chat event handler and room session event handler.
	 *
	 * DEVIATION: AS3 builds these four lazily, from `onPerkAllowances()` — a fifth subscription
	 *   (`PerkAllowancesMessageEvent`, 1535) this port deliberately does not register. The check
	 *   that makes it a deviation and not a gap is in the AS3 body itself: `_SafeStr_6406` (the
	 *   latch that gates `roomEntered()`, `addChat()` and the history pulldown) is assigned `true`
	 *   and nothing else, ever, so the handler's `else if(_loc2_ && !_SafeStr_6406)` disposal branch
	 *   is unreachable. What the message actually does is delay construction until the first perk
	 *   packet; the end state is identical, and building eagerly means chat is not dead if the
	 *   server ever stops sending it. `PerkManager` reads 1535 for the allowances themselves.
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/HabboFreeFlowChat.as::onPerkAllowances()
	 */
    protected override initComponent(): void
    {
        this._chatHistory = new ChatHistoryBuffer(this);
        this._chatEventHandler = new ChatEventHandler(this);
        this._roomSessionEventHandler = new RoomSessionEventHandler(this);
        this._chatBubbleFactory = new ChatBubbleFactory(this);
        this._isInitialized = true;

        this._communication?.addHabboConnectionMessageEvent(new AccountPreferencesEvent(this.onAccountPreferences.bind(this)));
        this._communication?.addHabboConnectionMessageEvent(new RoomEntryInfoMessageEvent(this.onRoomEnter.bind(this)));
        this._communication?.addHabboConnectionMessageEvent(new RoomChatSettingsMessageEvent(this.onRoomChatSettings.bind(this)));
        this._communication?.addHabboConnectionMessageEvent(new GetGuestRoomResultMessageEvent(this.onGuestRoomData.bind(this)));

        log.debug('HabboFreeFlowChat initialized');

        // If we were already in a room when initialization completed, enter now
        if(this._isInRoom)
        {
            this.roomEntered();
        }
    }
}
