/**
 * RoomDesktop
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as
 *
 * Per-room desktop instance. Manages the room view, canvas, layout, widgets,
 * color transitions, and mouse event routing for a single room session.
 *
 * NOT a Component — created and managed by RoomUI.
 * Implements IRoomDesktop, IRoomWidgetMessageListener, IRoomWidgetHandlerContainer.
 */
import {EventEmitter} from 'eventemitter3';
import {Logger} from '@core/utils/Logger';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IDisplayObjectWrapper} from '@core/window/components/IDisplayObjectWrapper';
import type {Container} from 'pixi.js';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {WindowEvent} from '@core/window/events/WindowEvent';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import type {IHabboFurniEditor} from '@habbo/vortex/furnieditor/IHabboFurniEditor';
import type {IHabboHelp} from '@habbo/help/IHabboHelp';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IHabboGroupsManager} from '@habbo/groups/IHabboGroupsManager';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import type {IHabboNavigator} from '@habbo/navigator/IHabboNavigator';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {IHabboModeration} from '@habbo/moderation/IHabboModeration';
import type {IDesktopWindow} from '@core/window/components/IDesktopWindow';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IUserData} from '@habbo/session/IUserData';
import type {IToolTipWindow} from '@core/window/components/IToolTipWindow';
import {WindowType} from '@core/window/enum/WindowType';
import {WindowStyle} from '@core/window/enum/WindowStyle';
import {WindowParam} from '@core/window/enum/WindowParam';
import {HabboWebTools} from '@habbo/utils/HabboWebTools';
import {RoomEngineRoomAdEvent} from '@habbo/room/events/RoomEngineRoomAdEvent';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {RoomObjectOperationEnum} from '@habbo/room/object/RoomObjectOperationEnum';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import type {IRoomDesktop} from './IRoomDesktop';
import type {IRoomWidgetMessageListener} from './IRoomWidgetMessageListener';
import type {IRoomWidgetHandlerContainer} from './IRoomWidgetHandlerContainer';
import type {IRoomWidgetFactory} from './IRoomWidgetFactory';
import type {IRoomWidgetHandler} from './IRoomWidgetHandler';
import {RoomDesktopLayoutManager} from './RoomDesktopLayoutManager';
import {ColorTransitioner} from '@room/utils/ColorTransitioner';
import {RoomEngineEvent} from '@habbo/room/events/RoomEngineEvent';
import {RoomEngineObjectEvent} from '@habbo/room/events/RoomEngineObjectEvent';
import {RoomWidgetRoomObjectUpdateEvent} from './widget/events/RoomWidgetRoomObjectUpdateEvent';
import {RoomWidgetRoomViewUpdateEvent} from './widget/events/RoomWidgetRoomViewUpdateEvent';
import type {RoomEngineObjectPlacedEvent} from '@habbo/room/events/RoomEngineObjectPlacedEvent';
import {RoomWidgetRoomObjectPlaceEvent} from './widget/events/RoomWidgetRoomObjectPlaceEvent';
import {RoomDesktopMouseZoomEnableEvent} from './widget/events/RoomDesktopMouseZoomEnableEvent';
import {PerkAllowancesMessageEvent} from '@habbo/communication/messages/incoming/perk/PerkAllowancesMessageEvent';
import type {PerkAllowancesMessageEventParser} from '@habbo/communication/messages/parser/perk/PerkAllowancesMessageEventParser';
import {PerkType} from '@habbo/communication/enum/PerkType';
import {InfoStandWidgetHandler} from './handler/InfoStandWidgetHandler';
import {RoomToolsWidgetHandler} from './handler/RoomToolsWidgetHandler';
import {EffectsWidgetHandler} from './handler/EffectsWidgetHandler';
import {AvatarInfoWidgetHandler} from './handler/AvatarInfoWidgetHandler';
import type {AvatarInfoWidget} from './widget/avatarinfo/AvatarInfoWidget';
import {CustomUserNotificationWidgetHandler} from './handler/CustomUserNotificationWidgetHandler';
import {RentableSpaceWidgetHandler} from './handler/RentableSpaceWidgetHandler';
import {CraftingWidgetHandler} from './handler/CraftingWidgetHandler';
// Vortex-only: the fishing handler lives under src/vortex/, not in the ported tree.
import type {HabboFishing} from '@habbo/vortex/fishing/HabboFishing';
import {FishingSignWidgetHandler} from '@habbo/vortex/fishing/ui/FishingSignWidgetHandler';
import {FishingSpotWidgetHandler} from '@habbo/vortex/fishing/ui/FishingSpotWidgetHandler';
import {YoutubeDisplayWidgetHandler} from './handler/YoutubeDisplayWidgetHandler';
import {VimeoDisplayWidgetHandler} from './handler/VimeoDisplayWidgetHandler';
import {ChatInputWidgetHandler} from './handler/ChatInputWidgetHandler';

import {FurnitureTrophyWidgetHandler} from './handler/FurnitureTrophyWidgetHandler';
import {FurnitureStickieWidgetHandler} from './handler/FurnitureStickieWidgetHandler';
import {SpamWallPostItWidgetHandler} from './handler/SpamWallPostItWidgetHandler';
import {FurnitureDimmerWidgetHandler} from './handler/FurnitureDimmerWidgetHandler';
import {FurniturePresentWidgetHandler} from './handler/FurniturePresentWidgetHandler';
import {MannequinWidgetHandler} from './handler/MannequinWidgetHandler';
import {FriendFurniEngravingWidgetHandler} from './handler/FriendFurniEngravingWidgetHandler';
import {FriendFurniConfirmWidgetHandler} from './handler/FriendFurniConfirmWidgetHandler';
import {CustomStackHeightWidgetHandler} from './handler/CustomStackHeightWidgetHandler';
import {FurnitureRoomLinkHandler} from './handler/FurnitureRoomLinkHandler';
import {FurnitureClothingChangeWidgetHandler} from './handler/FurnitureClothingChangeWidgetHandler';
import {PlaceholderWidgetHandler} from './handler/PlaceholderWidgetHandler';
import {FurnitureBackgroundColorWidgetHandler} from './handler/FurnitureBackgroundColorWidgetHandler';
import {FurnitureCreditWidgetHandler} from './handler/FurnitureCreditWidgetHandler';
import {FurnitureEcotronBoxWidgetHandler} from './handler/FurnitureEcotronBoxWidgetHandler';
import {PetPackageFurniWidgetHandler} from './handler/PetPackageFurniWidgetHandler';
import {DoorbellWidgetHandler} from './handler/DoorbellWidgetHandler';
import {InternalLinkWidgetHandler} from './handler/InternalLinkWidgetHandler';
import {LoadingBarWidgetHandler} from './handler/LoadingBarWidgetHandler';
import {FurnitureAreaHideWidgetHandler} from './handler/FurnitureAreaHideWidgetHandler';
import {ConversionPointWidgetHandler} from './handler/ConversionPointWidgetHandler';
import type {IHabboSoundManager} from '@habbo/sound/IHabboSoundManager';
import type {IHabboQuestEngine} from '@habbo/quest/IHabboQuestEngine';
import type {IAdManager} from '@habbo/advertisement/IAdManager';
import type {IHabboAvatarEditor} from '@habbo/avatar/IHabboAvatarEditor';
import type {IHabboMessenger} from '@habbo/messenger/IHabboMessenger';
import {ExternalImageWidgetHandler} from './handler/ExternalImageWidgetHandler';
import {UiHelpBubbleWidgetHandler} from './handler/UiHelpBubbleWidgetHandler';
import {MeMenuWidgetHandler} from './handler/MeMenuWidgetHandler';
import {PollWidgetHandler} from './handler/PollWidgetHandler';
import {ObjectLocationRequestHandler} from './handler/ObjectLocationRequestHandler';
import {FriendRequestWidgetHandler} from './handler/FriendRequestWidgetHandler';
import {HighScoreDisplayWidgetHandler} from './handler/HighScoreDisplayWidgetHandler';
import {WordQuizWidgetHandler} from './handler/WordQuizWidgetHandler';
import {UserChooserWidgetHandler} from './handler/UserChooserWidgetHandler';
import {FurniChooserWidgetHandler} from './handler/FurniChooserWidgetHandler';
import {FurnitureBadgeDisplayWidgetHandler} from './handler/FurnitureBadgeDisplayWidgetHandler';
import {FriendRequestEvent} from '@habbo/friendlist/events/FriendRequestEvent';
import {RoomQueueWidgetHandler} from './handler/RoomQueueWidgetHandler';
import {FurnitureContextMenuWidgetHandler} from './handler/FurnitureContextMenuWidgetHandler';
import {RoomWidgetFurniToWidgetMessage} from './widget/messages/RoomWidgetFurniToWidgetMessage';
import {RoomEngineToWidgetEvent} from '@habbo/room/events/RoomEngineToWidgetEvent';
import type {IRoomWidget} from './widget/IRoomWidget';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {
    BotSkillListUpdateEvent
} from '@habbo/communication/messages/incoming/room/bot/BotSkillListUpdateEvent';
import {
    BotForceOpenContextMenuEvent
} from '@habbo/communication/messages/incoming/room/bot/BotForceOpenContextMenuEvent';
import type {
    BotSkillListUpdateParser
} from '@habbo/communication/messages/parser/room/bot/BotSkillListUpdateParser';
import type {
    BotForceOpenContextMenuParser
} from '@habbo/communication/messages/parser/room/bot/BotForceOpenContextMenuParser';
import {
    RoomWidgetRentableBotSkillListUpdateEvent
} from './widget/events/RoomWidgetRentableBotSkillListUpdateEvent';
import {RoomWidgetRoomEngineUpdateEvent} from './widget/events/RoomWidgetRoomEngineUpdateEvent';
import {
    RoomWidgetRentableBotForceOpenContextMenuEvent
} from './widget/events/RoomWidgetRentableBotForceOpenContextMenuEvent';

const log = Logger.getLogger('habbo.ui.RoomDesktop');

export class RoomDesktop implements IRoomDesktop, IRoomWidgetMessageListener, IRoomWidgetHandlerContainer 
{
    // DEVIATION: AS3's list also holds the photo camera; the RPG fork removed photos.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as:71 (var_4627)
    private static readonly REUSABLE_WIDGET_TYPES = new Set([
        'RWE_INFOSTAND', 'RWE_CHAT_INPUT_WIDGET', 'RWE_ME_MENU',
        'RWE_EXTERNAL_IMAGE', 'RWE_ROOM_TOOLS', 'RWE_FURNITURE_CONTEXT_MENU',
    ]);

    public static readonly ROOM_VIEW_CREATED = 'ROOM_VIEW_CREATED';
    public static readonly ROOM_BACKGROUND_COLOR_CHANGED = 'ROOM_BACKGROUND_COLOR_CHANGED';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/RoomDesktop.as::_session
    private _session: IRoomSession;
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_assets
    private _assets: IAssetLibrary;
    private _colorTransitioner: ColorTransitioner;
    private _bgColorTransitioner: ColorTransitioner;
    private _widgetFactory: IRoomWidgetFactory | null = null;
    // Widget management
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::STATE_UNDEFINED
    public static readonly STATE_UNDEFINED: number = -1;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/RoomDesktop.as::_widgets
    private _widgets: Map<string, unknown> = new Map();
    // AS3 keys these on an array of handlers per type, not one handler: every handler
    // registers for RETWE_OPEN_WIDGET/RETWE_CLOSE_WIDGET, so a single-handler map let
    // only the last-registered widget ever receive an open/close.
    private _widgetMessageHandlers: Map<string, IRoomWidgetHandler[]> = new Map();
    private _widgetEventHandlers: Map<string, IRoomWidgetHandler[]> = new Map();
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_updateListeners
    private _updateListeners: IRoomWidgetHandler[] = [];
    // Canvas state
    private _canvasIds: number[] = [];
    private _canvasWrapper: IWindow | null = null;
    private _roomViewWindow: IWindow | null = null;
    private _roomCanvasDisplayObject: Container | null = null;
    // Color state
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_roomColor
    private _roomColor: number = 0xFFFFFF;
    // Zoom state
    private _zoomMomentum: number = 0;
    private _zoomPivotX: number = 0;
    private _zoomPivotY: number = 0;
    private _zoomInProgress: boolean = false;
    private _disposed: boolean = false;

    constructor(session: IRoomSession, assets: IAssetLibrary, connection: IConnection | null) 
    {
        this._desktopEvents = new EventEmitter();
        this._session = session;
        this._assets = assets;
        this._connection = connection;

        this._widgets = new Map();
        this._widgetMessageHandlers = new Map();
        this._widgetEventHandlers = new Map();

        this._layoutManager = new RoomDesktopLayoutManager();
        this._colorTransitioner = new ColorTransitioner();
        this._bgColorTransitioner = new ColorTransitioner(0x000000, 0);

        // AS3: RoomDesktop.as:228-231 — the two rentable-bot messages the desktop itself owns (the
        // rest of the bot traffic belongs to a widget or to RoomUsersHandler). Both are translated
        // into widget events for AvatarInfoWidget.
        if(connection !== null)
        {
            this._botSkillListEvent = new BotSkillListUpdateEvent(this.onBotSkillListUpdateEvent);
            this._botForceOpenContextMenuEvent = new BotForceOpenContextMenuEvent(this.onBotForceOpenContextMenuEvent);

            connection.addMessageEvent(this._botSkillListEvent);
            connection.addMessageEvent(this._botForceOpenContextMenuEvent);

            // TS deviation: AS3 subscribes this on `RoomUI` and forwards the event to whichever
            // desktop is current, guarded on its `_isInRoom`. This port's RoomUI has no connection
            // of its own, and a RoomDesktop only exists for a session that is in a room — so the
            // guard is structural here and the two are equivalent.
            this._perkAllowancesEvent = new PerkAllowancesMessageEvent(this.onPerkAllowances);

            connection.addMessageEvent(this._perkAllowancesEvent);
        }
    }

    /**
     * AS3: RoomUI.as::onPerkAllowances()
     *
     * Wheel zoom is a *perk*: the server decides per account, and the client only binds the wheel
     * once told it may. AS3's other half of that method — the 250ms timer that re-attaches
     * free-flow chat to the stage — is not ported; this port parents the chat display once.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::onPerkAllowances()
    private onPerkAllowances = (event: IMessageEvent): void =>
    {
        const parser = event.parser as PerkAllowancesMessageEventParser | null;

        if(parser == null) return;

        this.processEvent(new RoomDesktopMouseZoomEnableEvent(parser.isPerkAllowed(PerkType.MOUSE_ZOOM)));
    };

    // AS3: RoomDesktop.as::_SafeStr_6316
    private _botSkillListEvent: IMessageEvent | null = null;
    // AS3: RoomDesktop.as::_SafeStr_6270
    private _botForceOpenContextMenuEvent: IMessageEvent | null = null;

    // TS-only: AS3 keeps this subscription on RoomUI — see onPerkAllowances() above.
    private _perkAllowancesEvent: IMessageEvent | null = null;

    /**
     * Whether the account may zoom with the wheel. AS3 has no such field: it re-binds the wheel
     * listener on any RDMZEE_ENABLED and never reads the flag the event carries, which means the
     * wheel is armed by the packet arriving rather than by what it says. A flag is the same thing
     * in this port, where the binding lives in the client and cannot be attached and detached from
     * here — and it does read the flag, so a `false` answer really does refuse.
     */
    // AS3: RoomDesktop.as::checkAndEnableMouseZoomEvent() — the state that call implies
    private _mouseZoomEnabled: boolean = false;

    /** Derived name — `_lastZoomScrollMillis` is AS3's own, unobfuscated. */
    // AS3: RoomDesktop.as::_lastZoomScrollMillis
    private _lastZoomScrollMillis: number = 0;

    /**
     * AS3: RoomDesktop.as::onBotSkillListUpdateEvent()
     *
     * The list is written back onto the bot's own user data *before* the widget event goes out, so
     * a later info event (which reads `botSkillData`) sees the same skills. AS3 copies the array
     * rather than sharing it.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::onBotSkillListUpdateEvent()
    private onBotSkillListUpdateEvent = (event: IMessageEvent): void =>
    {
        const parser = event.parser as BotSkillListUpdateParser | null;

        if(parser === null) return;

        const userData = this._session?.userDataManager?.getRentableBotUserData(parser.botId) ?? null;

        if(userData !== null) userData.botSkillData = parser.skillList.slice();

        this._desktopEvents.emit(
            RoomWidgetRentableBotSkillListUpdateEvent.SKILL_LIST,
            new RoomWidgetRentableBotSkillListUpdateEvent(parser.botId, parser.skillList)
        );
    };

    // AS3: RoomDesktop.as::onBotForceOpenContextMenuEvent()
    private onBotForceOpenContextMenuEvent = (event: IMessageEvent): void =>
    {
        const parser = event.parser as BotForceOpenContextMenuParser | null;

        if(parser === null) return;

        this._desktopEvents.emit(
            RoomWidgetRentableBotForceOpenContextMenuEvent.OPEN,
            new RoomWidgetRentableBotForceOpenContextMenuEvent(parser.botId)
        );
    };

    private _desktopEvents: EventEmitter;

    public get desktopEvents(): EventEmitter 
    {
        return this._desktopEvents;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/RoomDesktop.as::_connection
    private _connection: IConnection | null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get connection()
    public get connection(): IConnection | null 
    {
        return this._connection;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/RoomDesktop.as::_layoutManager
    private _layoutManager: RoomDesktopLayoutManager;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get layoutManager()
    public get layoutManager(): RoomDesktopLayoutManager 
    {
        return this._layoutManager;
    }

    // Manager references (injected via setters)
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get windowManager()
    public get windowManager(): IHabboWindowManager | null 
    {
        return this._windowManager;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set windowManager()
    public set windowManager(value: IHabboWindowManager | null) 
    {
        this._windowManager = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::ROOM_ZOOM_SCALES
    private static readonly ROOM_ZOOM_SCALES: readonly number[] = [0.5, 1, 2, 4, 8, 16];

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_pendingZoomScale
    // Name DERIVED (`_SafeStr_5890`): NaN when no zoom is in flight. `update()` eases the canvas
    // toward it and clears it on arrival.
    private _pendingZoomScale: number = NaN;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_pendingZoomPoint
    // Name DERIVED (`_SafeStr_6244`): the anchor the zoom is centred on, null for the toolbar
    // buttons and set by the mouse-wheel path.
    private _pendingZoomPoint: {x: number; y: number} | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get roomEngine()
    public get roomEngine(): IRoomEngine | null 
    {
        return this._roomEngine;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set roomEngine()
    public set roomEngine(value: IRoomEngine | null) 
    {
        this._roomEngine = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get sessionDataManager()
    public get sessionDataManager(): ISessionDataManager | null 
    {
        return this._sessionDataManager;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set sessionDataManager()
    public set sessionDataManager(value: ISessionDataManager | null) 
    {
        this._sessionDataManager = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get roomSessionManager()
    public get roomSessionManager(): IRoomSessionManager | null 
    {
        return this._roomSessionManager;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set roomSessionManager()
    public set roomSessionManager(value: IRoomSessionManager | null) 
    {
        this._roomSessionManager = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_config
    private _config: IHabboConfigurationManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get config()
    public get config(): IHabboConfigurationManager | null 
    {
        return this._config;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set config()
    public set config(value: IHabboConfigurationManager | null) 
    {
        this._config = value;
    }

    // The hover tooltip of a room ad, at most one at a time.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::roomAdTooltip
    private _roomAdTooltip: IToolTipWindow | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_localization
    private _localization: IHabboLocalizationManager | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get localization()
    public get localization(): IHabboLocalizationManager | null 
    {
        return this._localization;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set localization()
    public set localization(value: IHabboLocalizationManager | null) 
    {
        this._localization = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::toolbar
    private _toolbar: IHabboToolbar | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::get toolbar()
    public get toolbar(): IHabboToolbar | null 
    {
        return this._toolbar;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::set toolbar()
    public set toolbar(value: IHabboToolbar | null) 
    {
        if(this._toolbar) 
        {
            this._toolbar.toolbarEvents.off(HabboToolbarEvent.ICON_ZOOM, this.onToolbarEvent);
        }

        this._toolbar = value;

        if(this._toolbar) 
        {
            this._toolbar.toolbarEvents.on(HabboToolbarEvent.ICON_ZOOM, this.onToolbarEvent);
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_catalog
    private _catalog: IHabboCatalog | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get avatarRenderManager()
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get avatarRenderManager()
    public get avatarRenderManager(): IAvatarRenderManager | null
    {
        return this._avatarRenderManager;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set avatarRenderManager()
    public set avatarRenderManager(value: IAvatarRenderManager | null)
    {
        this._avatarRenderManager = value;
    }

    // TS-only: Vortex-only fishing system. Pushed by RoomUI beside `catalog` and `inventory`.
    private _fishing: HabboFishing | null = null;

    // TS-only: Vortex-only fishing system — no AS3 counterpart.
    public get fishing(): HabboFishing | null
    {
        return this._fishing;
    }

    // TS-only: Vortex-only fishing system — no AS3 counterpart.
    public set fishing(value: HabboFishing | null)
    {
        this._fishing = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get catalog()
    public get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set catalog()
    public set catalog(value: IHabboCatalog | null)
    {
        this._catalog = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_inventory
    private _inventory: IHabboInventory | null = null;

    // NOT from AS3: Vortex-only furni editor. Consumed by InfoStandFurniView to decide whether to
    // offer its button. See IRoomWidgetHandlerContainer for why it is injected rather than imported.
    private _furniEditor: IHabboFurniEditor | null = null;

    public get furniEditor(): IHabboFurniEditor | null
    {
        return this._furniEditor;
    }

    public set furniEditor(value: IHabboFurniEditor | null)
    {
        this._furniEditor = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get inventory()
    // Consumed by the effects widget (container.inventory.getAvatarEffects(), setEffectSelected/Deselected).
    public get inventory(): IHabboInventory | null
    {
        return this._inventory;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set inventory()
    public set inventory(value: IHabboInventory | null)
    {
        this._inventory = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_habboHelp
    private _habboHelp: IHabboHelp | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get habboHelp()
    // Consumed by the own-avatar bubble's "change name" button.
    public get habboHelp(): IHabboHelp | null
    {
        return this._habboHelp;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set habboHelp()
    public set habboHelp(value: IHabboHelp | null)
    {
        this._habboHelp = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_questEngine
    private _questEngine: IHabboQuestEngine | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get questEngine()
    public get questEngine(): IHabboQuestEngine | null
    {
        return this._questEngine;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set questEngine()
    public set questEngine(value: IHabboQuestEngine | null)
    {
        this._questEngine = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_soundManager
    private _soundManager: IHabboSoundManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get soundManager()
    public get soundManager(): IHabboSoundManager | null
    {
        return this._soundManager;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set soundManager()
    public set soundManager(value: IHabboSoundManager | null)
    {
        this._soundManager = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_messenger
    private _messenger: IHabboMessenger | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get messenger()
    public get messenger(): IHabboMessenger | null
    {
        return this._messenger;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set messenger()
    public set messenger(value: IHabboMessenger | null)
    {
        this._messenger = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_avatarEditor
    private _avatarEditor: IHabboAvatarEditor | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get avatarEditor()
    public get avatarEditor(): IHabboAvatarEditor | null
    {
        return this._avatarEditor;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set avatarEditor()
    public set avatarEditor(value: IHabboAvatarEditor | null)
    {
        this._avatarEditor = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_habboTracking
    private _habboTracking: IHabboTracking | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get habboTracking()
    public get habboTracking(): IHabboTracking | null 
    {
        return this._habboTracking;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set habboTracking()
    public set habboTracking(value: IHabboTracking | null) 
    {
        this._habboTracking = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_habboGroupsManager
    private _habboGroupsManager: IHabboGroupsManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get habboGroupsManager()
    public get habboGroupsManager(): IHabboGroupsManager | null 
    {
        return this._habboGroupsManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::set habboGroupsManager()
    public set habboGroupsManager(value: IHabboGroupsManager | null) 
    {
        this._habboGroupsManager = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::friendList
    private _friendList: IHabboFriendList | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::get friendList()
    public get friendList(): IHabboFriendList | null 
    {
        return this._friendList;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomWidgetHandlerContainer.as::set friendList()
    // AS3: RoomDesktop.as:430-437 — the setter also subscribes. This is the *only* route by
    // which FRE_ACCEPTED/FRE_DECLINED reach a widget handler: they come off the friend-list
    // component's own bus, not the room session's, so `RoomUI`'s session-event table cannot
    // carry them. `FriendRequestWidgetHandler` claims both.
    public set friendList(value: IHabboFriendList | null)
    {
        if(this._friendList !== null)
        {
            this._friendList.events.off(FriendRequestEvent.ACCEPTED, this.processEvent, this);
            this._friendList.events.off(FriendRequestEvent.DECLINED, this.processEvent, this);
        }

        this._friendList = value;

        if(this._friendList !== null)
        {
            this._friendList.events.on(FriendRequestEvent.ACCEPTED, this.processEvent, this);
            this._friendList.events.on(FriendRequestEvent.DECLINED, this.processEvent, this);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::get freeFlowChat()
    public get freeFlowChat(): IHabboFreeFlowChat | null 
    {
        return this._freeFlowChat;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::set freeFlowChat()
    public set freeFlowChat(value: IHabboFreeFlowChat | null) 
    {
        this._freeFlowChat = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_navigator
    private _navigator: IHabboNavigator | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get navigator()
    public get navigator(): IHabboNavigator | null 
    {
        return this._navigator;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::_navigator (private field, not part of IRoomWidgetHandlerContainer)
    public set navigator(value: IHabboNavigator | null) 
    {
        this._navigator = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_communicationManager
    private _communicationManager: IHabboCommunicationManager | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get communicationManager()
    public get communicationManager(): IHabboCommunicationManager | null 
    {
        return this._communicationManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::_communicationManager (private field, not part of IRoomWidgetHandlerContainer)
    public set communicationManager(value: IHabboCommunicationManager | null) 
    {
        this._communicationManager = value;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::_roomBackgroundColor
    private _roomBackgroundColor: number = 0x000000;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get roomBackgroundColor()
    public get roomBackgroundColor(): number 
    {
        return this._roomBackgroundColor;
    }

    private _visible: boolean = true;

    public get visible(): boolean 
    {
        return this._visible;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set visible()
    public set visible(value: boolean) 
    {
        this._visible = value;

        if(this._layoutManager.layoutContainer) 
        {
            this._layoutManager.layoutContainer.visible = value;
        }

        this.syncRoomCanvasDisplayObject();
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get roomSession()
    public get roomSession(): IRoomSession 
    {
        return this._session;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get roomWidgetFactory()
    public get roomWidgetFactory(): IRoomWidgetFactory | null 
    {
        return this._widgetFactory;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set roomWidgetFactory()
    public set roomWidgetFactory(value: IRoomWidgetFactory | null) 
    {
        this._widgetFactory = value;
    }

    // AS3 declares `moderation` on IRoomWidgetHandlerContainer; RoomUI DI-resolves the component
    // and injects it into every desktop.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::get moderation()
    private _moderation: IHabboModeration | null = null;

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::get moderation()
    public get moderation(): IHabboModeration | null
    {
        return this._moderation;
    }

    // AS3: RoomDesktop.as::set moderation()
    public set moderation(value: IHabboModeration | null)
    {
        this._moderation = value;
    }

    /**
     * Whether the point a mouse event happened at is covered by more than one input-accepting
     * window - i.e. something (a context menu, a dialog) sits over the room canvas there.
     *
     * AS3 counts the windows under the point and tests `> 1` rather than `> 0`: the desktop itself
     * is always the first hit, so one hit means nothing is over the room.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::mouseEventPositionHasInputEventWindow()
    public mouseEventPositionHasInputEventWindow(event: { global: { x: number; y: number } }, contextLayer: number): boolean
    {
        const desktop = this._windowManager?.getDesktop(contextLayer) as IDesktopWindow | null;

        if(!desktop) return false;

        const result: IWindow[] = [];

        desktop.groupParameterFilteredChildrenUnderPoint({x: event.global.x, y: event.global.y}, result, 1);

        return result.length > 1;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::set layout()
    public set layout(layoutName: string) 
    {
        this._layoutManager.setLayout(layoutName, this._windowManager!, this._config);
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getFirstCanvasId()
    public getFirstCanvasId(): number 
    {
        return this._canvasIds.length > 0 ? this._canvasIds[0] : 1;
    }

    /**
	 * The state a widget is currently in, or STATE_UNDEFINED when there is no such widget
	 *
	 * Widgets are created lazily, so asking for one that does not exist is ordinary rather than
	 * exceptional — AS3 logs it and answers -1 instead of throwing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::getWidgetState()
    public getWidgetState(type: string): number
    {
        const widget = (this._widgets.get(type) ?? null) as IRoomWidget | null;

        if(widget === null)
        {
            log.debug(`Requested the state of an unknown widget ${type}`);

            return RoomDesktop.STATE_UNDEFINED;
        }

        return widget.state;
    }

    /**
	 * Drops the spectator overlay once the player joins the room for real
	 *
	 * The container is built into the room view rather than being a widget, so it is removed by
	 * name and disposed here rather than through disposeWidget().
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::enterAfterSpectate()
    public enterAfterSpectate(): void
    {
        const roomView = this._layoutManager.getRoomView() as IWindowContainer | null;

        if(roomView === null) return;

        const container = roomView.findChildByName('spectator_mode_container');

        if(container === null) return;

        roomView.removeChild(container);
        container.dispose();
    }

    /** Write-only in AS3 too: the desktop holds it solely to answer `requestInterstitial()`. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::_adManager
    private _adManager: IAdManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::set adManager()
    public set adManager(value: IAdManager | null)
    {
        this._adManager = value;
    }

    /**
	 * Asks the ad manager to run a full-screen interstitial.
	 *
	 * Does nothing without one, as AS3 does — a hotel with no ad subsystem simply never shows one.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::requestInterstitial()
    public requestInterstitial(): void
    {
        this._adManager?.showInterstitial();
    }

    /**
	 * Shows the name bubble over a game NPC or player
	 *
	 * A pure forward: the widget owns the bubble and its fade. Returns silently when the avatar-info
	 * widget has not been built yet, which is AS3's own guard — the widget is created lazily and a
	 * game can ask before a room has one.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::showGamePlayerName()
    public showGamePlayerName(objectId: number, name: string, color: number, fadeDelayMs: number): void
    {
        const widget = (this._widgets.get('RWE_AVATAR_INFO') ?? null) as AvatarInfoWidget | null;

        widget?.showGamePlayerName(objectId, name, color, fadeDelayMs);
    }

    // DEVIATION: reads camera_init_x/y/z off the room and hands them to
    //   `RoomEngine.updateRoomCamera()`, which this port does not expose — its cameras are driven
    //   from inside the engine's own update.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::initCameraLocation()

    // DEVIATION: `addListenerToStage()` and `removeListenerFromStage()` attach a weak listener to
    //   the Flash `stage` through the room canvas's DisplayObject. There is no stage here; the
    //   equivalent is the browser document, and nothing in the port asks RoomDesktop to reach it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::addListenerToStage()

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getRoomViewRect()
    public getRoomViewRect(): { x: number; y: number; width: number; height: number } | null 
    {
        return this._layoutManager.roomViewRect;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::processEvent()
    public processEvent(event: unknown): void 
    {
        const eventType = (event as { type?: string } | null)?.type;

        if(!eventType) return;

        if(eventType === 'RWZTM_ZOOM_TOGGLE')
        {
            this.toggleZoom();
        }

        // AS3: RoomDesktop.as::processEvent() — the RDMZEE_ENABLED arm, which calls
        // checkAndEnableMouseZoomEvent() to (re)bind the wheel listener.
        if(eventType === RoomDesktopMouseZoomEnableEvent.ENABLED)
        {
            this._mouseZoomEnabled = (event as RoomDesktopMouseZoomEnableEvent).enabled;
        }

        const handlers = this._widgetEventHandlers.get(eventType);

        if(!handlers) return;

        const isOpenClose = eventType === 'RETWE_OPEN_WIDGET' || eventType === 'RETWE_CLOSE_WIDGET';
        const targetWidget = isOpenClose ? ((event as { widget?: string | null }).widget ?? null) : null;

        for(const handler of handlers)
        {
            // AS3: an open/close-widget event is delivered only to the handler whose type
            // matches the event's target widget; every other event goes to all handlers.
            if(isOpenClose && handler.type !== targetWidget)
            {
                continue;
            }

            handler.processEvent(event);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::processWidgetMessage()
    public processWidgetMessage(message: unknown): unknown
    {
        const messageType = (message as { type?: string } | null)?.type;

        if(!messageType) return null;

        const handlers = this._widgetMessageHandlers.get(messageType);

        if(!handlers) return null;

        // AS3 returns the first non-null result across the handlers registered for this
        // message type.
        for(const handler of handlers)
        {
            const result = handler.processWidgetMessage(message);

            if(result !== null && result !== undefined)
            {
                return result;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::isOwnerOfFurniture()
    public isOwnerOfFurniture(object: IRoomObject): boolean
    {
        const ownerId = object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_OWNER_ID);

        return ownerId === this._sessionDataManager?.userId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::getFurnitureOwnerId()
    public getFurnitureOwnerId(object: IRoomObject): number
    {
        const ownerId = object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_OWNER_ID);

        return !isNaN(ownerId) ? ownerId : -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::isOwnerOfPet()
    public isOwnerOfPet(pet: IUserData | null): boolean
    {
        if(pet === null) return false;

        return pet.ownerId === this._sessionDataManager?.userId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::checkFurniManipulationRights()
    // Gates the modifier-click move/rotate shortcuts: room controller, any-room controller,
    // owner of the furniture, or a room in free-furni-movements mode.
    private checkFurniManipulationRights(roomId: number, objectId: number, category: number): boolean
    {
        if(this.roomSession.roomControllerLevel >= 1) return true;
        if(this._sessionDataManager?.isAnyRoomController) return true;

        const object = this._roomEngine?.getRoomObject(roomId, objectId, category) ?? null;

        if(object !== null && this.isOwnerOfFurniture(object)) return true;

        return this._roomEngine?.activeRoomHasFreeFurniMovementsMode ?? false;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::addUpdateListener()
    public addUpdateListener(handler: IRoomWidgetHandler): void 
    {
        if(this._updateListeners.indexOf(handler) < 0) 
        {
            this._updateListeners.push(handler);
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::removeUpdateListener()
    public removeUpdateListener(handler: IRoomWidgetHandler): void 
    {
        const index = this._updateListeners.indexOf(handler);

        if(index >= 0) 
        {
            this._updateListeners.splice(index, 1);
        }
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::init()
     *
     * The loading bar has no trigger, and that is faithful. AS3's mechanism is a pending-resource
     * list: `init()` fills `_pendingResources`, and while it is non-empty it clears
     * `_resourcesReady` and dispatches `RoomWidgetLoadingBarUpdateEvent.SHOW`;
     * `onRoomContentLoaded()` removes each content type as it arrives and, once the list empties,
     * calls `checkInterrupts()`, which dispatches HIDE.
     *
     * Nothing ever fills that list. `init()` reads `_pendingResources = []` immediately followed by
     * `if(_pendingResources.length > 0)`, so the branch cannot be entered — and this is not the
     * 2026 decompiler dropping a statement: `PRODUCTION-201601012205-226667486/.../RoomDesktop.as`
     * lines 689-690 are `this._pendingResources = new Array();` then the same
     * `if (this._pendingResources.length > 0)`, in a tree with no obfuscation at all. Two
     * independent builds, ten years apart, agree. The bar never shows in the real client either,
     * so there is nothing here to port — the widget and its `RWE_LOADINGBAR` handler are ported and
     * ready should a caller ever appear.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::init()
    public init(): void
    {
        log.debug(`RoomDesktop initialized for room ${this._session.roomId}`);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createRoomView()
    // The room DisplayObject is local to room_canvas_wrapper. Pixi renders it on
    // the root stage, so keep the root-stage container at the wrapper's global
    /**
     * Creates the room view and canvas for rendering.
     * Called when the room engine signals REE_INITIALIZED.
     *
     * @param canvasId - The canvas ID to create (typically 1)
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::createRoomView()
    public createRoomView(canvasId: number): void 
    {
        // Guard against double initialization (server can send height map twice)
        if(this._canvasIds.includes(canvasId)) 
        {
            log.debug(`Room view already created for canvas ${canvasId}, skipping`);

            return;
        }

        if(!this._roomEngine || !this._windowManager) 
        {
            log.warn('Cannot create room view — missing roomEngine or windowManager');

            return;
        }

        const roomId = this._session.roomId;
        const viewRect = this._layoutManager.roomViewRect;

        if(!viewRect) 
        {
            log.warn('Cannot create room view — no room view rect');

            return;
        }

        const width = viewRect.width;
        const height = viewRect.height;
        const scale = this._session.isGameSession ? 32 : 64;

        // Create the room canvas via the engine
        const canvasDisplayObject = this._roomEngine.createRoomCanvas(roomId, canvasId, width, height, scale);

        if(!canvasDisplayObject) 
        {
            log.warn('Failed to create room canvas');

            return;
        }

        this._canvasIds.push(canvasId);

        // Build the room_view_container window tree
        const roomViewContainer = this._windowManager.buildWidgetLayout('room_view_container_xml');

        if(roomViewContainer) 
        {
            const containerWindow = roomViewContainer as IWindowContainer;

            // Resize to match room view rect
            containerWindow.width = viewRect.width;
            containerWindow.height = viewRect.height;

            // AS3: room_view_container.findChildByName("room_canvas_wrapper")
            this._canvasWrapper = containerWindow.findChildByName('room_canvas_wrapper')
                ?? containerWindow.findChildByTag('room_canvas_wrapper')
                ?? null;

            if(this._canvasWrapper) 
            {
                this._canvasWrapper.x = 0;
                this._canvasWrapper.y = 0;
                this._canvasWrapper.width = viewRect.width;
                this._canvasWrapper.height = viewRect.height;
                this._canvasWrapper.addEventListener(WindowMouseEvent.CLICK, this.canvasWindowEventHandler);
                this._canvasWrapper.addEventListener(WindowMouseEvent.DOUBLE_CLICK, this.canvasWindowEventHandler);
                this._canvasWrapper.addEventListener(WindowMouseEvent.MOVE, this.canvasWindowEventHandler);
                this._canvasWrapper.addEventListener(WindowMouseEvent.DOWN, this.canvasWindowEventHandler);
                this._canvasWrapper.addEventListener(WindowMouseEvent.UP, this.canvasWindowEventHandler);
                this._canvasWrapper.addEventListener(WindowMouseEvent.UP_OUTSIDE, this.canvasWindowEventHandler);
                this._canvasWrapper.addEventListener(WindowEvent.WE_RESIZED, this.roomViewGeometryEventHandler);
                this._canvasWrapper.addEventListener(WindowEvent.WE_RELOCATED, this.roomViewGeometryEventHandler);
                this._canvasWrapper.addEventListener(WindowEvent.WE_PARENT_RESIZED, this.roomViewGeometryEventHandler);
                this._canvasWrapper.addEventListener(WindowEvent.WE_PARENT_RELOCATED, this.roomViewGeometryEventHandler);

                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createRoomView()
                // var_174.setDisplayObject(_loc17_)
                const displayObjectWrapper = this._canvasWrapper as unknown as IDisplayObjectWrapper;

                if(typeof displayObjectWrapper.setDisplayObject === 'function') 
                {
                    displayObjectWrapper.setDisplayObject(canvasDisplayObject);
                }

                this._roomEngine.setRoomCanvasMask(roomId, canvasId, true);
            }

            // Store reference to the room view window
            this._roomViewWindow = containerWindow;
            this._roomCanvasDisplayObject = canvasDisplayObject;

            // Add to layout
            this._layoutManager.addRoomView(containerWindow);
            this.syncRoomCanvasDisplayObject();
        }

        log.info(`Room view created for room ${roomId}, canvas ${canvasId} (${width}x${height})`);

        // Emit event so the client can position the PixiJS canvas
        this._desktopEvents.emit(RoomDesktop.ROOM_VIEW_CREATED, {
            roomId,
            canvasId,
            viewRect,
            container: canvasDisplayObject
        });
    }

    /**
     * Creates a widget by type code.
     *
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createWidget()
     *
     * Builds the handler, then hands it to RoomWidgetFactory.
     */
    // DEVIATION: AS3 also builds the handlers for the photo camera, the room-thumbnail camera and
    //   the jukebox playlist editor; the RPG fork removed photos and jukebox music.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createWidget()
    public createWidget(type: string): void 
    {
        if(this._widgets.has(type)) 
        {
            log.debug(`Widget already exists: ${type}`);

            return;
        }

        let handler: IRoomWidgetHandler;

        switch(type) 
        {
            case 'RWE_INFOSTAND':
                // DEVIATION: AS3 passes `_soundManager.musicController`, for the jukebox and song-disk
                //   views; the RPG fork removed jukebox music.
                handler = new InfoStandWidgetHandler();
                break;
            case 'RWE_ROOM_TOOLS': {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:885-890
                const roomToolsHandler = new RoomToolsWidgetHandler();

                roomToolsHandler.communicationManager = this._communicationManager;
                roomToolsHandler.navigator = this._navigator;
                handler = roomToolsHandler;
                break;
            }
            case 'RWE_CHAT_INPUT_WIDGET':
                handler = new ChatInputWidgetHandler();
                break;

            case 'RWE_EFFECTS':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:848
                handler = new EffectsWidgetHandler();
                break;
            case 'RWE_AVATAR_INFO':
                // Derived name: `createWidgetHandler` is declared in no AS3 tree — the trace points
                // at the class it belongs to, but the identifier itself is this port's.
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createWidgetHandler()
                handler = new AvatarInfoWidgetHandler();
                break;
            case 'RWE_FURNI_TROPHY_WIDGET':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:792
                handler = new FurnitureTrophyWidgetHandler();
                break;
            case 'RWE_CUSTOM_USER_NOTIFICATION':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:870
                handler = new CustomUserNotificationWidgetHandler();
                break;
            case 'RWE_CRAFTING':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:921-922
                handler = new CraftingWidgetHandler(this);
                break;

            // TS-only: Vortex-only fishing system — no AS3 counterpart.
            //   See docs/vortex-original/fishing.md §2.3.
            case 'RWE_FISHING_SPOT':
                handler = new FishingSpotWidgetHandler();
                break;

            // TS-only: Vortex-only fishing system — the sign. It builds no widget of its own; the
            //   handler opens the book `HabboFishing` owns. See fishing.md §1 and §15.
            case 'RWE_FISHING_SIGN':
                handler = new FishingSignWidgetHandler();
                break;
            case 'RWE_YOUTUBE':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:897-898
                handler = new YoutubeDisplayWidgetHandler();
                break;
            case 'RWE_RENTABLESPACE':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:900
                handler = new RentableSpaceWidgetHandler();
                break;
            case 'RWE_VIMEO':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:903-904
                handler = new VimeoDisplayWidgetHandler();
                break;
            // AS3: RoomDesktop.as::createWidgetHandler() "RWE_ROOM_QUEUE"
            case 'RWE_ROOM_QUEUE':
                handler = new RoomQueueWidgetHandler();
                break;
            // AS3: RoomDesktop.as::createWidgetHandler() "RWE_DOORBELL"
            case 'RWE_DOORBELL':
                handler = new DoorbellWidgetHandler();
                break;
            // AS3: RoomDesktop.as:886-888 "RWE_INTERNAL_LINK". The factory has no case for this
            // type in AS3 either — the handler is the whole feature, see InternalLinkWidgetHandler.
            case 'RWE_INTERNAL_LINK':
                handler = new InternalLinkWidgetHandler();
                break;
            // AS3: RoomDesktop.as:867-869 "RWE_AREA_HIDE"
            case 'RWE_AREA_HIDE':
                handler = new FurnitureAreaHideWidgetHandler();
                break;
            // AS3: RoomDesktop.as:807-809 "RWE_LOADINGBAR"
            case 'RWE_LOADINGBAR':
                handler = new LoadingBarWidgetHandler();
                break;
            // AS3: RoomDesktop.as:873-875 "RWE_FURNI_ACHIEVEMENT_RESOLUTION_ENGRAVING"
            case 'RWE_FURNI_ACHIEVEMENT_RESOLUTION_ENGRAVING':
                handler = new FurnitureBadgeDisplayWidgetHandler();
                break;
            // AS3: RoomDesktop.as:816-818 "RWE_FURNI_CHOOSER"
            case 'RWE_FURNI_CHOOSER':
                handler = new FurniChooserWidgetHandler();
                break;
            // AS3: RoomDesktop.as:819-821 "RWE_USER_CHOOSER"
            case 'RWE_USER_CHOOSER':
                handler = new UserChooserWidgetHandler();
                break;
            // AS3: RoomDesktop.as:813-815 "RWE_WORD_QUIZZ"
            case 'RWE_WORD_QUIZZ':
                handler = new WordQuizWidgetHandler();
                break;
            // AS3: RoomDesktop.as:883-885 "RWE_HIGH_SCORE_DISPLAY"
            case 'RWE_HIGH_SCORE_DISPLAY':
                handler = new HighScoreDisplayWidgetHandler();
                break;
            // AS3: RoomDesktop.as::createWidgetHandler() "RWE_FRIEND_REQUEST"
            case 'RWE_FRIEND_REQUEST':
                handler = new FriendRequestWidgetHandler();
                break;
            // AS3: RoomDesktop.as:858-860 "RWE_LOCATION_WIDGET". No widget behind it — the
            // handler answers a message synchronously and is the whole feature.
            case 'RWE_LOCATION_WIDGET':
                handler = new ObjectLocationRequestHandler();
                break;
            // AS3: RoomDesktop.as:810-812 "RWE_ROOM_POLL"
            case 'RWE_ROOM_POLL':
                handler = new PollWidgetHandler();
                break;
            // AS3: RoomDesktop.as:912-914 "RWE_EXTERNAL_IMAGE"
            case 'RWE_EXTERNAL_IMAGE':
                handler = new ExternalImageWidgetHandler();
                break;
            // AS3: RoomDesktop.as::createWidgetHandler() "RWE_ME_MENU"
            case 'RWE_ME_MENU':
                handler = new MeMenuWidgetHandler();
                break;
            // AS3: RoomDesktop.as:915-917 "RWE_UI_HELP_BUBBLE"
            case 'RWE_UI_HELP_BUBBLE':
                handler = new UiHelpBubbleWidgetHandler();
                break;
            // AS3: RoomDesktop.as::createWidgetHandler() "RWE_CONVERSION_TRACKING"
            case 'RWE_CONVERSION_TRACKING':
                handler = new ConversionPointWidgetHandler();
                break;
            case 'RWE_FURNI_PET_PACKAGE_WIDGET':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:798
                handler = new PetPackageFurniWidgetHandler();
                break;
            case 'RWE_FURNI_ECOTRONBOX_WIDGET':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:795
                handler = new FurnitureEcotronBoxWidgetHandler();
                break;
            case 'RWE_FURNI_CREDIT_WIDGET':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:783
                handler = new FurnitureCreditWidgetHandler();
                break;
            case 'RWE_ROOM_BACKGROUND_COLOR':
                // Derived name: `createWidgetHandler` is declared in no AS3 tree — the trace points
                // at the class it belongs to, but the identifier itself is this port's.
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createWidgetHandler()
                handler = new FurnitureBackgroundColorWidgetHandler();
                break;
            case 'RWE_FURNI_PLACEHOLDER':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:780
                handler = new PlaceholderWidgetHandler();
                break;
            case 'RWE_FURNI_STICKIE_WIDGET':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:786
                handler = new FurnitureStickieWidgetHandler();
                break;
            case 'RWE_SPAMWALL_POSTIT_WIDGET':
            {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:843
                // This one owns a message event, so it needs the connection the moment it is
                // built - the open request is a server push, not a room-engine translation.
                const spamWallHandler = new SpamWallPostItWidgetHandler();

                spamWallHandler.connection = this._connection;
                handler = spamWallHandler;
                break;
            }
            case 'RWE_ROOM_DIMMER':
                // Derived name: `createWidgetHandler` is declared in no AS3 tree — the trace points
                // at the class it belongs to, but the identifier itself is this port's.
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createWidgetHandler()
                handler = new FurnitureDimmerWidgetHandler();
                break;
            case 'RWE_FURNI_PRESENT_WIDGET':
                // Derived name: `createWidgetHandler` is declared in no AS3 tree — the trace points
                // at the class it belongs to, but the identifier itself is this port's.
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createWidgetHandler()
                handler = new FurniturePresentWidgetHandler();
                break;
            case 'RWE_MANNEQUIN':
                // Derived name: `createWidgetHandler` is declared in no AS3 tree — the trace points
                // at the class it belongs to, but the identifier itself is this port's.
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createWidgetHandler()
                handler = new MannequinWidgetHandler();
                break;
            case 'RWE_FRIEND_FURNI_ENGRAVING':
                // Derived name: `createWidgetHandler` is declared in no AS3 tree — the trace points
                // at the class it belongs to, but the identifier itself is this port's.
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::createWidgetHandler()
                handler = new FriendFurniEngravingWidgetHandler();
                break;
            case 'RWE_CLOTHING_CHANGE':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:828-830
                handler = new FurnitureClothingChangeWidgetHandler();
                break;
            case 'RWE_CUSTOM_STACK_HEIGHT':
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:894-895
                handler = new CustomStackHeightWidgetHandler();
                break;
            case 'RWE_ROOM_LINK': {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:889-891
                // — handed the communication manager on construction, which is where it
                // registers its GetGuestRoomResult listener.
                const roomLinkHandler = new FurnitureRoomLinkHandler();

                roomLinkHandler.communicationManager = this._communicationManager;
                handler = roomLinkHandler;
                break;
            }
            case 'RWE_FRIEND_FURNI_CONFIRM': {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:876-878
                // — this one is handed the connection at construction, because it registers its
                // three incoming messages itself rather than waiting on a room-engine event.
                const confirmHandler = new FriendFurniConfirmWidgetHandler();

                confirmHandler.connection = this._connection;
                handler = confirmHandler;
                break;
            }
            case 'RWE_FURNITURE_CONTEXT_MENU': {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as:853-857
                const contextMenuHandler = new FurnitureContextMenuWidgetHandler();

                contextMenuHandler.connection = this._connection;
                handler = contextMenuHandler;
                break;
            }
            default:
                log.debug(`Widget creation requested: ${type} (stub)`);

                return;
        }

        handler.container = this;

        // Null-tolerant for the same reason as getProcessedEvents() below — see IRoomWidgetHandler.
        for(const messageType of (handler.getWidgetMessages() ?? []))
        {
            let list = this._widgetMessageHandlers.get(messageType);

            if(!list)
            {
                list = [];
                this._widgetMessageHandlers.set(messageType, list);
            }

            list.push(handler);
        }

        // `getProcessedEvents()` may be null — AS3 returns a null Array from handlers that process
        // no room events at all (CustomUserNotificationWidgetHandler), distinct from the `[]` the
        // others return. Both mean the same thing here.
        for(const eventType of [...(handler.getProcessedEvents() ?? []), 'RETWE_OPEN_WIDGET', 'RETWE_CLOSE_WIDGET'])
        {
            let list = this._widgetEventHandlers.get(eventType);

            if(!list)
            {
                list = [];
                this._widgetEventHandlers.set(eventType, list);
            }

            list.push(handler);
        }

        const widget = (this._widgetFactory?.createWidget(type, handler) ?? null) as IRoomWidget | null;

        if(!widget)
        {
            // AS3: RoomDesktop.as:985-988 returns here and does **not** dispose the handler — it
            // stays in the two tables it was just added to. That is not an oversight: a
            // widget-less type like RWE_INTERNAL_LINK is a handler and nothing else, and disposing
            // it here would null its container while leaving it subscribed, so it would keep being
            // called and keep doing nothing.
            log.debug(`No widget for ${type} — the handler stays registered on its own`);

            return;
        }

        widget.messageListener = this;
        widget.registerUpdateEvents(this._desktopEvents);
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as:71 (var_4627) marks these widget
        // types reusable across room transitions via a caller-side instance cache in
        // RoomUI.createDesktopWidget() (var_1358) that calls widget.reuse(newDesktop)
        // instead of reconstructing. That cross-room caching isn't ported yet — this
        // only sets the flag correctly per AS3 (currently inert since nothing reads it
        // besides this assignment) so it's ready when that follow-up lands.
        widget.reusable = RoomDesktop.REUSABLE_WIDGET_TYPES.has(type);
        widget.widgetType = type;

        this._widgets.set(type, widget);
        this.addUpdateListener(handler);

        if(widget.mainWindow)
        {
            this._layoutManager.addWidgetWindow(type, widget.mainWindow);
        }

        // The chat input is the one widget that changes how much of the screen the room gets, so
        // AS3 announces the new rectangle after adding it — and only after that one.
        //
        // Nothing listens for it, in this port or in the AS3: `RWRVUE_ROOM_VIEW_SIZE_CHANGED`
        // appears in `RoomDesktop.as` and in the event class and nowhere else. It is dispatched
        // because the desktop's event bus is public and a widget may subscribe; leaving the
        // dispatch out is what made `RoomWidgetRoomViewUpdateEvent` a class nothing could reach.
        if(type === 'RWE_CHAT_INPUT_WIDGET')
        {
            const viewRect = this._layoutManager.roomViewRect;

            if(viewRect)
            {
                this._desktopEvents.emit(
                    RoomWidgetRoomViewUpdateEvent.ROOM_VIEW_SIZE_CHANGED,
                    new RoomWidgetRoomViewUpdateEvent(RoomWidgetRoomViewUpdateEvent.ROOM_VIEW_SIZE_CHANGED, viewRect)
                );
            }
        }

        log.debug(`Widget created: ${type}`);
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::disposeWidget()
    public disposeWidget(type: string): void 
    {
        const widget = this._widgets.get(type);

        if(!widget) return;

        this._widgets.delete(type);
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getWidget()
    public getWidget(type: string): unknown | null 
    {
        return this._widgets.get(type) ?? null;
    }

    /**
     * Handles mouse events forwarded from the client UI layer.
     * Converts window coordinates to engine coordinates and forwards to RoomEngine.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::canvasMouseHandler()
    public canvasMouseHandler(x: number, y: number, type: string, altKey: boolean, ctrlKey: boolean, shiftKey: boolean, buttonDown: boolean): void 
    {
        if(!this._roomEngine || this._canvasIds.length === 0) return;

        const canvasId = this._canvasIds[0];
        const roomId = this._session.roomId;
        const globalPosition = {x: 0, y: 0};

        if(this._canvasWrapper) 
        {
            this._canvasWrapper.getGlobalPosition(globalPosition);
        }

        this._roomEngine.setActiveRoom(roomId);

        this._roomEngine.handleRoomCanvasMouseEvent(
            canvasId,
            x - globalPosition.x,
            y - globalPosition.y,
            type,
            altKey,
            ctrlKey,
            shiftKey,
            buttonDown
        );
    }

    /**
     * AS3: RoomDesktop.as::mouseWheelHandler() — the ctrl-wheel zoom arm.
     *
     * Two guards AS3 has and this port did not. It is gated on the **MOUSE_ZOOM perk** — the wheel
     * listener is only bound after the server says so, which is what `_mouseZoomEnabled` stands in
     * for here. And it is **throttled**: a wheel with `|delta| >= 2` always passes, a smaller one
     * only once every 400ms, so a trackpad's stream of tiny deltas steps the zoom once instead of
     * running it to the end of the table.
     *
     * The modifier test lives at the client's binding (`App.ts`), which is where AS3's
     * `shouldRotateActiveFurnitureWithScroll()` arm lives too.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::mouseWheelHandler()
    public handleMouseWheel(deltaY: number, x: number, y: number): void 
    {
        if(this._roomEngine === null || this._canvasIds.length === 0) return;
        if(!this._mouseZoomEnabled || deltaY === 0) return;

        const now = Date.now();

        if(!this.shouldProcessZoomScroll(deltaY, now)) return;

        const current = this.getCurrentRoomCanvasZoomScale();
        const next = RoomDesktop.getNextZoomScale(current, deltaY < 0 ? 1 : -1);

        if(Math.abs(next - current) <= 0.001) return;

        this.animateRoomCanvasScale(next, {x, y});

        this._lastZoomScrollMillis = now;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::shouldProcessZoomScroll()
    private shouldProcessZoomScroll(delta: number, now: number): boolean
    {
        if(Math.abs(delta) >= 2) return true;

        return this._lastZoomScrollMillis <= 0 || now - this._lastZoomScrollMillis > 400;
    }

    /**
     * Sets the room view foreground color (tint overlay).
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::setRoomViewColor()
    public setRoomViewColor(color: number, brightness: number): void 
    {
        const time = Date.now();

        this._colorTransitioner.startTransition(color, brightness, time);
    }

    /**
     * Sets the room background color (CSS div behind canvas).
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::setRoomBackgroundColor()
    public setRoomBackgroundColor(h: number, s: number, l: number): void 
    {
        const time = Date.now();

        // Convert HSL to packed value for the background transitioner
        const hslPacked = ((h & 0xFF) << 16) | ((s & 0xFF) << 8) | (l & 0xFF);

        this._bgColorTransitioner.startTransition(hslPacked, l, time);

        this._desktopEvents.emit(RoomDesktop.ROOM_BACKGROUND_COLOR_CHANGED, {h, s, l});
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::roomObjectEventHandler()
    public roomObjectEventHandler(event: RoomEngineObjectEvent): void 
    {
        let translatedType: string | null = null;

        switch(event.type)
        {
            // AS3: RoomDesktop.as::processRoomObjectEvent() (lines 1222-1236) — the
            // furniture-manipulation requests dispatched by RoomObjectEventHandler on a
            // modifier-held click. MOVE/ROTATE are gated by checkFurniManipulationRights;
            // PICKUP is not (the server validates ownership).
            case RoomEngineObjectEvent.REOE_REQUEST_MOVE:
                if(this.checkFurniManipulationRights(event.roomId, event.objectId, event.category))
                {
                    this._roomEngine?.modifyRoomObject(event.objectId, event.category, RoomObjectOperationEnum.OBJECT_MOVE);
                }

                return;
            case RoomEngineObjectEvent.REOE_REQUEST_ROTATE:
                if(this.checkFurniManipulationRights(event.roomId, event.objectId, event.category))
                {
                    this._roomEngine?.modifyRoomObject(event.objectId, event.category, RoomObjectOperationEnum.OBJECT_ROTATE_POSITIVE);
                }

                return;
            case RoomEngineObjectEvent.REOE_REQUEST_PICKUP:
                this._roomEngine?.modifyRoomObject(event.objectId, event.category, RoomObjectOperationEnum.OBJECT_PICKUP);

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_TROPHY" (line 1249) —
            // the engine says a trophy was used; turn it into the widget message the trophy
            // handler claims.
            case RoomEngineToWidgetEvent.REQUEST_TROPHY:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_TROPHY_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_ECOTRONBOX" (line 1257)
            case RoomEngineToWidgetEvent.REQUEST_ECOTRONBOX:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_ECOTRONBOX_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_CREDITFURNI" (line 1237)
            case RoomEngineToWidgetEvent.REQUEST_CREDITFURNI:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_CREDITFURNI_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_PLACEHOLDER" (line 1265)
            case RoomEngineToWidgetEvent.REQUEST_PLACEHOLDER:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_PLACEHOLDER_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // others this one is not translated into a widget message: the mannequin handler
            // subscribes to the engine event itself (`getProcessedEvents()`), so it only has to
            // reach the handler list, which the generic path below does.
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_CLOTHING_CHANGE" (line 1277)
            case RoomEngineToWidgetEvent.REQUEST_CLOTHING_CHANGE:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_CLOTHING_CHANGE_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_PRESENT"
            case RoomEngineToWidgetEvent.REQUEST_PRESENT:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_PRESENT_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_DIMMER" (line 1261)
            case RoomEngineToWidgetEvent.REQUEST_DIMMER:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_DIMMER_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_STICKIE" (line 1241)
            case RoomEngineToWidgetEvent.REQUEST_STICKIE:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_STICKIE_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RERAE_FURNI_CLICK" (line 1269)
            case RoomEngineRoomAdEvent.FURNI_CLICK:
            case RoomEngineRoomAdEvent.FURNI_DOUBLE_CLICK:
                this.handleRoomAdClick(event);

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RERAE_TOOLTIP_SHOW" (line 1273)
            case RoomEngineRoomAdEvent.TOOLTIP_SHOW:
            case RoomEngineRoomAdEvent.TOOLTIP_HIDE:
                this.handleRoomAdTooltip(event);

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_TEASER" (line 1253)
            case RoomEngineToWidgetEvent.REQUEST_TEASER:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_TEASER_WIDGET,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING" (line 1285)
            case RoomEngineToWidgetEvent.REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_BADGE_DISPLAY_ENGRAVING" (line 1289)
            case RoomEngineToWidgetEvent.REQUEST_BADGE_DISPLAY_ENGRAVING:
                this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                    RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_BADGE_DISPLAY_ENGRAVING,
                    event.objectId, event.category, event.roomId
                ));

                return;
            // Only the owner is told the engraving failed — the others just see the unresolved
            // badge. This is the one arm of the group with a guard.
            // AS3: RoomDesktop.as::processRoomObjectEvent() "RETWE_REQUEST_ACHIEVEMENT_RESOLUTION_FAILED" (line 1293)
            case RoomEngineToWidgetEvent.REQUEST_ACHIEVEMENT_RESOLUTION_FAILED:
            {
                const object = this._roomEngine?.getRoomObject(event.roomId, event.objectId, event.category) ?? null;

                if(object !== null
                    && object.getModel().getNumber('furniture_owner_id') === this._sessionDataManager?.userId)
                {
                    this.processWidgetMessage(new RoomWidgetFurniToWidgetMessage(
                        RoomWidgetFurniToWidgetMessage.WIDGET_MESSAGE_REQUEST_ACHIEVEMENT_RESOLUTION_FAILED,
                        event.objectId, event.category, event.roomId
                    ));
                }

                return;
            }
            case RoomEngineObjectEvent.REOE_SELECTED:
                // AS3 only builds the update event when selection is allowed; when it is disabled
                // the local stays null and nothing is dispatched.
                if(!this.isFurnitureSelectionDisabled(event))
                {
                    translatedType = RoomWidgetRoomObjectUpdateEvent.OBJECT_SELECTED;
                }

                // Selecting an avatar in the room is what arms the mod tool's "User info" button.
                // AS3 runs this outside the selection-disabled guard above, and `type == 1` skips
                // bots and pets, whose webID the moderation tool cannot look up.
                if(this._moderation !== null && event.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
                {
                    const selectedUser = this._session?.userDataManager?.getUserDataByIndex(event.objectId) ?? null;

                    if(selectedUser !== null && selectedUser.type === 1)
                    {
                        this._moderation.userSelected(selectedUser.webID, selectedUser.name);
                    }
                }

                break;
            case RoomEngineObjectEvent.REOE_DESELECTED:
                translatedType = RoomWidgetRoomObjectUpdateEvent.OBJECT_DESELECTED;
                break;
            // AS3: RoomDesktop.as::processRoomObjectEvent() l.1216-1221. The engine has emitted
            // REOE_MOUSE_ENTER/LEAVE all along and nothing translated them, so
            // RWROUE_OBJECT_ROLL_OVER and _ROLL_OUT were declared constants that no code raised
            // and none listened for — and hovering a user or a furni showed no name.
            case RoomEngineObjectEvent.REOE_MOUSE_ENTER:
                translatedType = RoomWidgetRoomObjectUpdateEvent.OBJECT_ROLL_OVER;
                break;
            case RoomEngineObjectEvent.REOE_MOUSE_LEAVE:
                translatedType = RoomWidgetRoomObjectUpdateEvent.OBJECT_ROLL_OUT;
                break;
            // AS3: RoomDesktop.as::processRoomObjectEvent() ("REOE_PLACED") — the one arm of this
            // switch that builds a *subclass* of the update event, because where the thing landed
            // and who started the drag do not fit the four fields the base carries.
            case RoomEngineObjectEvent.REOE_PLACED:
            {
                const placed = event as RoomEngineObjectPlacedEvent;
                const placeEvent = new RoomWidgetRoomObjectPlaceEvent(
                    RoomWidgetRoomObjectPlaceEvent.OBJECT_PLACED,
                    event.objectId, event.category, event.roomId,
                    placed.wallLocation, placed.x, placed.y, placed.z, placed.direction,
                    placed.placedInRoom, placed.placedOnFloor, placed.placedOnWall,
                    placed.instanceData, placed.placementSource
                );

                this._desktopEvents.emit(placeEvent.type, placeEvent);

                return;
            }
            case RoomEngineObjectEvent.REOE_ADDED:
                translatedType = event.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
                    ? RoomWidgetRoomObjectUpdateEvent.USER_ADDED
                    : RoomWidgetRoomObjectUpdateEvent.FURNI_ADDED;
                break;
            case RoomEngineObjectEvent.REOE_REMOVED:
                translatedType = event.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
                    ? RoomWidgetRoomObjectUpdateEvent.USER_REMOVED
                    : RoomWidgetRoomObjectUpdateEvent.FURNI_REMOVED;
                break;
        }

        if(translatedType) 
        {
            const translated = new RoomWidgetRoomObjectUpdateEvent(translatedType, event.objectId, event.category, event.roomId);

            this._desktopEvents.emit(translated.type, translated);

            return;
        }

        const handlers = this._widgetEventHandlers.get(event.type);

        if(!handlers) return;

        // Open/close carry the name of the widget they are for, and go only to the handler whose
        // `type` matches — the same rule `processEvent()` applies, and for the same reason: every
        // widget handler registers for these two ids, so an unfiltered dispatch would open all of
        // them on any furni click.
        const isOpenClose = event.type === RoomEngineToWidgetEvent.REQUEST_OPEN_WIDGET
            || event.type === RoomEngineToWidgetEvent.REQUEST_CLOSE_WIDGET;
        const targetWidget = isOpenClose ? (event as RoomEngineToWidgetEvent).widget : null;

        for(const handler of handlers)
        {
            if(isOpenClose && handler.type !== targetWidget)
            {
                continue;
            }

            handler.processEvent(event);
        }
    }

    /**
     * Turns the room engine's own mode switch into the widget event the widgets listen for.
     *
     * The note this replaces said "will route to appropriate handling when widgets are ported".
     * They are — all 47 of them — and this was the last thing standing between the engine saying
     * "this room is now a game" and any widget hearing it.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::roomEngineEventHandler()
    public roomEngineEventHandler(event: RoomEngineEvent): void
    {
        let update: RoomWidgetRoomEngineUpdateEvent | null = null;

        if(event.type === RoomEngineEvent.REE_NORMAL_MODE)
        {
            update = new RoomWidgetRoomEngineUpdateEvent(RoomWidgetRoomEngineUpdateEvent.NORMAL_MODE, event.roomId);
        }
        else if(event.type === RoomEngineEvent.REE_GAME_MODE)
        {
            update = new RoomWidgetRoomEngineUpdateEvent(RoomWidgetRoomEngineUpdateEvent.GAME_MODE, event.roomId);
        }

        if(update === null) return;

        this._desktopEvents.emit(update.type, update);
    }

    /**
     * Called each frame by RoomUI.update().
     * Updates color transitions, widget handlers, and zoom momentum.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::update()
    public update(elapsed: number = 0): void 
    {
        if(this._disposed) return;

        this.updateRoomCanvasZoomAnimation(elapsed);

        const time = Date.now();

        // Update color transitions
        if(this._colorTransitioner.updateColor(time)) 
        {
            this._roomColor = this._colorTransitioner.color;
        }

        if(this._bgColorTransitioner.updateColor(time)) 
        {
            this._roomBackgroundColor = this._bgColorTransitioner.color;
        }

        // Update widget handlers
        for(const listener of this._updateListeners) 
        {
            listener.update();
        }
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::update()
     *
     * The head of AS3's `update()`: one eased step of a zoom in flight, taken in log2 space so the
     * canvas moves at a constant *perceptual* rate rather than a constant number of pixels. Within
     * 0.01 of the target it snaps, applies the exact target and clears the pending state.
     *
     * Every call passes `allowFractionalScale` — the intermediate scales are fractional, and
     * `setRoomCanvasScale()` would otherwise snap each one back to a whole step and freeze the
     * animation where it started.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::update()
    private updateRoomCanvasZoomAnimation(elapsed: number): void
    {
        if(Number.isNaN(this._pendingZoomScale)) return;
        if(this._roomEngine === null) return;

        const roomId = this._session.roomId;
        const canvasId = this.getFirstCanvasId();
        const current = RoomDesktop.scaleToZoomAnimationValue(
            this._roomEngine.getRoomCanvasScale(roomId, canvasId)
        );
        const target = RoomDesktop.scaleToZoomAnimationValue(this._pendingZoomScale);
        const difference = target - current;

        if(Math.abs(difference) <= 0.01)
        {
            this._roomEngine.setRoomCanvasScale(
                roomId, canvasId, this._pendingZoomScale, this._pendingZoomPoint, null, false, true
            );

            this._pendingZoomScale = Number.NaN;

            return;
        }

        const step = RoomDesktop.getZoomAnimationStep(current, target, elapsed);
        const next = current + (difference < 0 ? -Math.min(step, -difference) : Math.min(step, difference));

        this._roomEngine.setRoomCanvasScale(
            roomId, canvasId, RoomDesktop.zoomLevelToScale(next), this._pendingZoomPoint, null, false, true
        );
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::animateRoomCanvasScale()
     *
     * Does not scale anything itself — it records the target, clamped to the scale table, and
     * `update()` walks the canvas there over the following frames.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::animateRoomCanvasScale()
    public animateRoomCanvasScale(scale: number, point: {x: number; y: number} | null = null): void
    {
        if(this._roomEngine === null || Number.isNaN(scale) || !this.canUseAnimatedRoomZoom()) return;

        this._pendingZoomScale = RoomDesktop.clampRoomCanvasZoomScale(scale);
        this._pendingZoomPoint = point;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getCurrentRoomCanvasZoomScale()
    // Snapped to the nearest table entry, so a canvas mid-animation still reports a whole step.
    public getCurrentRoomCanvasZoomScale(): number
    {
        const scale = this.getCurrentControllableRoomCanvasScale();

        return Number.isNaN(scale) ? 1 : RoomDesktop.getNearestZoomScale(scale);
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::canZoomRoomCanvas()
    // False at either end of the table — which is what greys the toolbar's +/- buttons out.
    public canZoomRoomCanvas(direction: number): boolean
    {
        if(!this.canUseAnimatedRoomZoom() || direction === 0) return false;

        const current = this.getCurrentRoomCanvasZoomScale();

        return Math.abs(RoomDesktop.getNextZoomScale(current, direction) - current) > 0.001;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::zoomRoomCanvas()
    public zoomRoomCanvas(direction: number): void
    {
        if(!this.canUseAnimatedRoomZoom() || direction === 0) return;

        const current = this.getCurrentRoomCanvasZoomScale();
        const next = RoomDesktop.getNextZoomScale(current, direction);

        if(Math.abs(next - current) <= 0.001) return;

        this.animateRoomCanvasScale(next);
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getNextZoomScale()
     *
     * The next entry strictly past the current one, with a 0.001 tolerance so a scale sitting on a
     * table value does not match itself. Returns the input unchanged at either end.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getNextZoomScale()
    private static getNextZoomScale(scale: number, direction: number): number
    {
        const scales = RoomDesktop.ROOM_ZOOM_SCALES;

        if(Number.isNaN(scale) || direction === 0) return scale;

        if(direction > 0)
        {
            if(scale >= scales[scales.length - 1] - 0.001) return scale;

            for(const candidate of scales)
            {
                if(candidate > scale + 0.001) return candidate;
            }

            return scales[scales.length - 1];
        }

        if(scale <= scales[0] + 0.001) return scale;

        for(let index = scales.length - 1; index >= 0; index--)
        {
            if(scales[index] < scale - 0.001) return scales[index];
        }

        return scales[0];
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::canUseAnimatedRoomZoom()
    // Gated on the hotel's `zoom.enabled` flag, so a hotel with it off has no zoom controls at all.
    private canUseAnimatedRoomZoom(): boolean
    {
        if(this._roomEngine === null) return false;

        // AS3 reads the flag through the room engine (`(_roomEngine as Component).getBoolean`);
        // here it comes off the same configuration manager, which RoomDesktop already holds.
        return this._config?.getBoolean('zoom.enabled') === true;
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getCurrentControllableRoomCanvasScale()
     *
     * The **pending** target wins over the canvas's actual scale, so pressing + twice quickly steps
     * twice rather than fighting the running animation.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getCurrentControllableRoomCanvasScale()
    private getCurrentControllableRoomCanvasScale(): number
    {
        if(!this.canUseAnimatedRoomZoom()) return Number.NaN;

        if(!Number.isNaN(this._pendingZoomScale)) return this._pendingZoomScale;

        return this._roomEngine?.getRoomCanvasScale(this._session.roomId, this.getFirstCanvasId()) ?? Number.NaN;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::clampRoomCanvasZoomScale()
    private static clampRoomCanvasZoomScale(scale: number): number
    {
        const scales = RoomDesktop.ROOM_ZOOM_SCALES;

        return Math.max(scales[0], Math.min(scales[scales.length - 1], scale));
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getNearestZoomScale()
    private static getNearestZoomScale(scale: number): number
    {
        const scales = RoomDesktop.ROOM_ZOOM_SCALES;
        let nearest = scales[0];
        let distance = Math.abs(scale - nearest);

        for(const candidate of scales)
        {
            const candidateDistance = Math.abs(scale - candidate);

            if(candidateDistance < distance)
            {
                nearest = candidate;
                distance = candidateDistance;
            }
        }

        return nearest;
    }

    /**
     * AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getZoomAnimationStep()
     *
     * The step is taken in **log2 space**, so every doubling takes the same wall-clock time. The
     * frame delta is capped at 50ms so a stalled frame does not jump the zoom.
     */
    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::getZoomAnimationStep()
    private static getZoomAnimationStep(from: number, to: number, elapsed: number): number
    {
        const remaining = Math.abs(to - from);
        const frame = elapsed > 0 ? Math.min(elapsed, 50) : 1000 / 60;

        return Math.min(remaining, 0.14 * frame / (1000 / 60));
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::scaleToZoomAnimationValue()
    private static scaleToZoomAnimationValue(scale: number): number
    {
        return Math.log(scale) / Math.LN2;
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::zoomLevelToScale()
    private static zoomLevelToScale(level: number): number
    {
        return Math.pow(2, level);
    }

    // AS3: .../src/com/sulake/habbo/ui/RoomDesktop.as::dispose()
    public dispose(): void 
    {
        if(this._disposed) return;

        this._disposed = true;

        log.debug(`Disposing RoomDesktop for room ${this._session.roomId}`);

        if(this._toolbar)
        {
            this._toolbar.toolbarEvents.off(HabboToolbarEvent.ICON_ZOOM, this.onToolbarEvent);
            this._toolbar = null;
        }

        if(this._roomAdTooltip !== null)
        {
            this._roomAdTooltip.dispose();
            this._roomAdTooltip = null;
        }

        // Dispose all widgets
        for(const widget of this._widgets.values()) 
        {
            if(widget && typeof (widget as any).dispose === 'function') 
            {
                (widget as any).dispose();
            }
        }

        if(this._connection !== null)
        {
            if(this._botSkillListEvent !== null) this._connection.removeMessageEvent(this._botSkillListEvent);

            if(this._botForceOpenContextMenuEvent !== null)
            {
                this._connection.removeMessageEvent(this._botForceOpenContextMenuEvent);
            }
        }

        this._botSkillListEvent = null;
        this._botForceOpenContextMenuEvent = null;

        this._widgets.clear();
        this._widgetMessageHandlers.clear();
        this._widgetEventHandlers.clear();
        this._updateListeners.length = 0;

        // AS3: RoomDesktop.as:633-638 — the other half of the friendList setter's subscription.
        if(this._friendList !== null)
        {
            this._friendList.events.off(FriendRequestEvent.ACCEPTED, this.processEvent, this);
            this._friendList.events.off(FriendRequestEvent.DECLINED, this.processEvent, this);
            this._friendList = null;
        }

        if(this._canvasWrapper) 
        {
            this._canvasWrapper.removeEventListener(WindowMouseEvent.CLICK, this.canvasWindowEventHandler);
            this._canvasWrapper.removeEventListener(WindowMouseEvent.DOUBLE_CLICK, this.canvasWindowEventHandler);
            this._canvasWrapper.removeEventListener(WindowMouseEvent.MOVE, this.canvasWindowEventHandler);
            this._canvasWrapper.removeEventListener(WindowMouseEvent.DOWN, this.canvasWindowEventHandler);
            this._canvasWrapper.removeEventListener(WindowMouseEvent.UP, this.canvasWindowEventHandler);
            this._canvasWrapper.removeEventListener(WindowMouseEvent.UP_OUTSIDE, this.canvasWindowEventHandler);
            this._canvasWrapper.removeEventListener(WindowEvent.WE_RESIZED, this.roomViewGeometryEventHandler);
            this._canvasWrapper.removeEventListener(WindowEvent.WE_RELOCATED, this.roomViewGeometryEventHandler);
            this._canvasWrapper.removeEventListener(WindowEvent.WE_PARENT_RESIZED, this.roomViewGeometryEventHandler);
            this._canvasWrapper.removeEventListener(WindowEvent.WE_PARENT_RELOCATED, this.roomViewGeometryEventHandler);

            const displayObjectWrapper = this._canvasWrapper as unknown as IDisplayObjectWrapper;

            if(typeof displayObjectWrapper.setDisplayObject === 'function') 
            {
                displayObjectWrapper.setDisplayObject(null);
            }
        }

        // Dispose layout
        this._layoutManager.dispose();

        // Clear references
        this._desktopEvents.removeAllListeners();
        this._windowManager = null;
        this._roomEngine = null;
        this._sessionDataManager = null;
        this._roomSessionManager = null;
        this._config = null;
        this._localization = null;
        this._toolbar = null;
        this._widgetFactory = null;
        this._canvasWrapper = null;
        this._roomViewWindow = null;
        this._roomCanvasDisplayObject = null;
    }

    /**
     * Translates room-engine object events (REOE_*) into widget-facing
     * RoomWidgetRoomObjectUpdateEvents (RWROUE_*) and dispatches them on
     * `desktopEvents`, where widgets (e.g. InfoStandWidget) listen for them.
     *
     * AS3: sources/win63_version/habbo/ui/RoomDesktop.as::roomObjectEventHandler()
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::isFurnitureSelectionDisabled()
    private isFurnitureSelectionDisabled(event: RoomEngineObjectEvent): boolean 
    {
        let disabled = false;

        const roomObject = this._roomEngine?.getRoomObject(event.roomId, event.objectId, event.category) ?? null;

        if(roomObject !== null) 
        {
            const model = roomObject.getModel();

            if(model !== null) 
            {
                if(model.getNumber(RoomObjectVariableEnum.FURNITURE_SELECTION_DISABLE) === 1) 
                {
                    disabled = true;

                    if(this._sessionDataManager?.isAnyRoomController) 
                    {
                        disabled = false;
                    }
                }
            }
        }

        return disabled;
    }

    /**
     * Opens a room ad's target page.
     *
     * The two arms are exclusive: a plain visitor opens it on a single click, a room controller
     * only on a double click — so that moving the furniture around does not fire the ad.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::handleRoomAdClick()
    private handleRoomAdClick(event: RoomEngineObjectEvent): void
    {
        const object = this._roomEngine?.getRoomObject(event.roomId, event.objectId, event.category) ?? null;

        if(object === null) return;

        const url = object.getModel().getString(RoomObjectVariableEnum.FURNITURE_AD_URL);

        if(url === null || url.indexOf('http') !== 0) return;

        const isController = (this.roomSession?.roomControllerLevel ?? 0) >= 1
            || (this._sessionDataManager?.isAnyRoomController ?? false);

        if(event.type === RoomEngineRoomAdEvent.FURNI_CLICK)
        {
            if(isController) return;
        }
        else if(!isController)
        {
            return;
        }

        HabboWebTools.openWebPage(url);
    }

    /**
     * Shows or hides the hover tooltip of a room ad: the furniture's own `.tooltip` text, or the
     * ad URL itself when it has none.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::handleRoomAdTooltip()
    private handleRoomAdTooltip(event: RoomEngineObjectEvent): void
    {
        if(event.type === RoomEngineRoomAdEvent.TOOLTIP_HIDE)
        {
            if(this._roomAdTooltip === null) return;

            this._roomAdTooltip.dispose();
            this._roomAdTooltip = null;

            return;
        }

        if(this._roomAdTooltip !== null || this._windowManager === null) return;

        const object = this._roomEngine?.getRoomObject(event.roomId, event.objectId, event.category) ?? null;

        if(object === null) return;

        // AS3 asks for `<type>.tooltip` with `${ads.roomad.tooltip}` as the fallback, then tests
        // the result for null — `getLocalization()` returning the fallback is the normal outcome,
        // and the URL branch below only runs when even that is missing.
        let text: string | null = this._localization?.getLocalization(object.getType() + '.tooltip', '${ads.roomad.tooltip}') ?? null;

        if(text === null || text === '')
        {
            const url = object.getModel().getString(RoomObjectVariableEnum.FURNITURE_AD_URL);

            if(url !== null && url.indexOf('http') === 0) text = url;
        }

        if(text === null || text === '') return;

        this._roomAdTooltip = this._windowManager.createWindow(
            'room_ad_tooltip', text, WindowType.TOOLTIP, WindowStyle.DEFAULT, WindowParam.BOUND_TO_PARENT_RECT
        ) as IToolTipWindow | null;

        if(this._roomAdTooltip === null) return;

        this._roomAdTooltip.setParamFlag(WindowParam.INPUT_EVENT_PROCESSOR, false);
        this._roomAdTooltip.visible = true;
        this._roomAdTooltip.center();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::onRoomViewResized()
    // TS deviation: one handler bound to all four resize/relocate event types
    // (WE_RESIZED/WE_RELOCATED/WE_PARENT_RESIZED/WE_PARENT_RELOCATED) instead of
    // separate AS3 listener methods, since they all just re-sync canvas geometry.
    private readonly roomViewGeometryEventHandler = (_event: unknown): void => 
    {
        this.syncRoomCanvasDisplayObject();

        if(!this._roomEngine || !this._canvasWrapper || this._canvasIds.length === 0) 
        {
            return;
        }

        this._roomEngine.modifyRoomCanvas(
            this._session.roomId,
            this._canvasIds[0],
            this._canvasWrapper.width,
            this._canvasWrapper.height
        );
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::mouseEventHandler()
    private readonly canvasWindowEventHandler = (event: unknown): void => 
    {
        const mouseEvent = event as WindowMouseEvent;
        let type: string;

        switch(mouseEvent.type) 
        {
            case WindowMouseEvent.CLICK:
                type = 'click';
                break;
            case WindowMouseEvent.DOUBLE_CLICK:
                type = 'doubleClick';
                break;
            case WindowMouseEvent.DOWN:
                type = 'mouseDown';
                break;
            case WindowMouseEvent.UP:
            case WindowMouseEvent.UP_OUTSIDE:
                type = 'mouseUp';
                break;
            case WindowMouseEvent.MOVE:
                type = 'mouseMove';
                break;
            default:
                return;
        }

        this.canvasMouseHandler(
            mouseEvent.stageX,
            mouseEvent.stageY,
            type,
            mouseEvent.altKey,
            mouseEvent.ctrlKey,
            mouseEvent.shiftKey,
            mouseEvent.buttonDown
        );
    };

    // position to preserve the same coordinate space.
    private syncRoomCanvasDisplayObject(): void 
    {
        if(!this._roomCanvasDisplayObject || !this._canvasWrapper) 
        {
            return;
        }

        const globalPosition = {x: 0, y: 0};

        this._canvasWrapper.getGlobalPosition(globalPosition);

        this._roomCanvasDisplayObject.x = globalPosition.x;
        this._roomCanvasDisplayObject.y = globalPosition.y;
        this._roomCanvasDisplayObject.visible = this._visible && this._canvasWrapper.visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::onToolbarEvent()
    private onToolbarEvent = (event: HabboToolbarEvent): void => 
    {
        if(event.type === HabboToolbarEvent.ICON_ZOOM) 
        {
            this.toggleZoom();
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomDesktop.as::toggleZoom()
    private toggleZoom(): void 
    {
        if(!this._roomEngine || this._canvasIds.length === 0) return;

        const roomId = this._roomEngine.activeRoomId;
        const canvasId = this.getFirstCanvasId();
        const currentScale = this._roomEngine.getRoomCanvasScale(roomId, canvasId);
        const newScale = currentScale === 1 ? 0.5 : 1;

        this._roomEngine.setRoomCanvasScale(roomId, canvasId, newScale);
    }
}
