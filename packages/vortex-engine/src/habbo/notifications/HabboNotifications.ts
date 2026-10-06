import {EventEmitter} from 'eventemitter3';
import {Component, ComponentDependency, type IContext,} from '@core/runtime';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_RoomSessionManager} from '@iid/IIDRoomSessionManager';
import {IID_HabboInventory} from '@iid/IIDHabboInventory';
import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboHelp} from '@iid/IIDHabboHelp';
import {IID_HabboFreeFlowChat} from '@iid/IIDHabboFreeFlowChat';
import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IRoomSessionManager} from '@habbo/session/IRoomSessionManager';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IRoomEngine} from '@habbo/room';
import {PetImageUtility} from './utils/PetImageUtility';
import {ProductImageUtility} from './utils/ProductImageUtility';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboHelp} from '@habbo/help/IHabboHelp';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IHabboNotifications} from './IHabboNotifications';
import {SingularNotificationController} from './singular/SingularNotificationController';
import {NotificationPopup} from './NotificationPopup';
import {NotificationMessageHandler} from './NotificationMessageHandler';
import {Logger} from '@core/utils/Logger';
import {IID_HabboCommunicationManager} from "@iid/IIDHabboCommunicationManager";
import {GetMOTDMessageComposer} from "@habbo/communication";
import type {IHabboLocalizationManager} from "@habbo/localization";
import {IID_HabboLocalizationManager} from "@iid";
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';

const log = Logger.getLogger('habbo.notifications.HabboNotifications');

/**
 * Events emitted by the notifications component.
 * Used by the UI layer to react to notification state changes.
 * NOTE: This uses a separate EventEmitter (_notificationEvents) to avoid
 * overriding the Component.events getter (see MEMORY.md critical rule).
 */
export interface IHabboNotificationEvents
{
    'showNotification': (type: string, parameters: Map<string, string> | null) => void;
    'disabled': (disabled: boolean) => void;
}

/**
 * Main Habbo notifications component.
 * Extends Component for dependency injection lifecycle.
 * Manages notification bubbles, feed items, and alert dialogs.
 *
 * Dependencies:
 * - IHabboCommunicationManager (required) - for message events
 * - ISessionDataManager (optional) - for user data
 * - IRoomSessionManager (optional) - for room session state
 *
 * @see source_as_win63/habbo/notifications/HabboNotifications.as
 */
export class HabboNotifications extends Component implements IHabboNotifications
{
    private _messageHandler: NotificationMessageHandler | null = null;
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_inventory
    private _inventory: IHabboInventory | null = null;
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_friendList
    private _friendList: IHabboFriendList | null = null;
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_catalog
    private _catalog: IHabboCatalog | null = null;

    private _toolbar: IHabboToolbar | null = null;
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_habboHelp
    private _habboHelp: IHabboHelp | null = null;
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::HabboNotifications()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);

        this._disabled = false;
    }

    /**
	 * Separate notification EventEmitter.
	 * CRITICAL: Do NOT override the `events` getter from Component.
	 * @see MEMORY.md - Component EventEmitter Override Bug
	 */
    private _notificationEvents: EventEmitter<IHabboNotificationEvents> = new EventEmitter();

    /**
	 * Get the notification-specific event emitter.
	 * Use this (NOT `events`) for notification events.
	 */
    get notificationEvents(): EventEmitter<IHabboNotificationEvents>
    {
        return this._notificationEvents;
    }

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_communication
    private _communication: IHabboCommunicationManager | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::get communication()
    get communication(): IHabboCommunicationManager | null
    {
        return this._communication;
    }

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::_roomSessionManager
    private _roomSessionManager: IRoomSessionManager | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::get roomSessionManager()
    get roomSessionManager(): IRoomSessionManager | null
    {
        return this._roomSessionManager;
    }

    private _localizationManager: IHabboLocalizationManager | null = null;

    get localizationManager(): IHabboLocalizationManager | null
    {
        return this._localizationManager;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/notifications/HabboNotifications.as::_singularController
    private _singularController: SingularNotificationController | null = null;

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::get singularController()
    get singularController(): SingularNotificationController | null
    {
        return this._singularController;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get habboHelp()
    get habboHelp(): IHabboHelp | null
    {
        return this._habboHelp;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    /**
     * This component's own asset library — where the notification config, the bubble layouts and
     * the per-type icons live. AS3 exposes `assets` under this name so the singular controller and
     * its view manager can reach it without being handed the component.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get assetLibrary()
    get assetLibrary(): IAssetLibrary | null
    {
        return this.assets;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get catalog()
    get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get toolBar()
    get toolBar(): IHabboToolbar | null
    {
        return this._toolbar;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get freeFlowChat()
    get freeFlowChat(): IHabboFreeFlowChat | null
    {
        return this._freeFlowChat;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::_avatarRenderManager
    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get avatarRenderManager()
    get avatarRenderManager(): IAvatarRenderManager | null
    {
        return this._avatarRenderManager;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/notifications/HabboNotifications.as::_petImageUtility
    // (obfuscated `_SafeStr_6444`; named from the getter that builds it)
    private _petImageUtility: PetImageUtility | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get petImageUtility()
    // Built lazily, and only once the room engine dependency has resolved.
    get petImageUtility(): PetImageUtility | null
    {
        if(!this._roomEngine) return null;

        if(!this._petImageUtility) this._petImageUtility = new PetImageUtility(this._roomEngine);

        return this._petImageUtility;
    }

    /**
     * The notification feed's controller — always null.
     *
     * Dead in AS3 too: the backing field is declared and read only by this getter, and assigned
     * nowhere in either tree, so `notification.feed.enabled`'s `addFeedItem()` branch would
     * null-reference the moment it fired. The getter is ported, returning what AS3's returns, so
     * `NotificationMessageHandler`'s guarded call sites read as the guards they are.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get feedController()
    get feedController(): null
    {
        return null;
    }

    // Name DERIVED: the AS3 field is `_SafeStr_6251` (l.67), obfuscated. Named after the getter
    // that lazily fills it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get productImageUtility()
    private _productImageUtility: ProductImageUtility | null = null;

    /** Built on first use, as `petImageUtility` above is, and for the same reason. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::get productImageUtility()
    get productImageUtility(): ProductImageUtility | null
    {
        if(!this._roomEngine) return null;

        if(!this._productImageUtility)
        {
            this._productImageUtility = new ProductImageUtility(this._roomEngine, this._inventory);
        }

        return this._productImageUtility;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/notifications/HabboNotifications.as::_disabled
    private _disabled: boolean = false;

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::get disabled()
    get disabled(): boolean
    {
        return this._disabled;
    }

    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::set disabled()
    set disabled(value: boolean)
    {
        this._disabled = value;
        this._notificationEvents.emit('disabled', value);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localizationManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboInventory,
                (inventory: IHabboInventory | null) =>
                {
                    this._inventory = inventory;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboFriendList,
                (friendList: IHabboFriendList | null) =>
                {
                    this._friendList = friendList;
                },
                false
            ),
            new ComponentDependency(
                IID_RoomEngine,
                (engine: IRoomEngine | null) =>
                {
                    this._roomEngine = engine;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCatalog,
                (catalog: IHabboCatalog | null) =>
                {
                    this._catalog = catalog;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboToolbar,
                (toolbar: IHabboToolbar | null) =>
                {
                    this._toolbar = toolbar;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboHelp,
                (help: IHabboHelp | null) =>
                {
                    this._habboHelp = help;
                },
                false
            ),
            // Where the chat-style notification gets its preview bitmap from. Optional in AS3
            // too — the notification degrades to no icon rather than not firing.
            new ComponentDependency(
                IID_HabboFreeFlowChat,
                (freeFlowChat: IHabboFreeFlowChat | null) =>
                {
                    this._freeFlowChat = freeFlowChat;
                },
                false
            ),
            // Exposed via avatarRenderManager for callers building preview avatar images
            // (e.g. purchase-confirmation "r" offers) alongside a notification.
            new ComponentDependency(
                IID_AvatarRenderManager,
                (manager: IAvatarRenderManager | null) =>
                {
                    this._avatarRenderManager = manager;
                },
                false
            ),
        ];
    }

    /**
	 * Activate the notifications system.
	 * Called by the NotificationMessageHandler after message events are registered.
	 *
	 * @see source_as_win63/habbo/notifications/HabboNotifications.as activate()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::activate()
    activate(): void
    {
        if(this._communication?.connection)
        {
            this._communication.connection.send(new GetMOTDMessageComposer());
        }
    }

    /**
     * Add a notification item with content, type, and optional icon asset name
     *
     * @param content The notification message text
     * @param type The notification type string
     * @param iconAssetName Optional asset name for the icon
     *
     * @param internalLink
     * @param extraData
     * @param internalLink
     * @param extraData
     * @see source_as_win63/habbo/notifications/HabboNotifications.as addItem()
     */
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::addItem()
    addItem(
        content: string,
        type: string,
        iconAssetName?: string | null,
        internalLink: string | null = null,
        extraData: Record<string, unknown> | null = null
    ): void
    {
        this._singularController?.addItem(content, type, null, iconAssetName ?? null, null, internalLink, extraData);
    }

    /**
	 * Add a notification whose icon is an already-rendered bitmap rather than a named
	 * asset — the friend-online notification cuts a circular head out of the avatar
	 * image and passes it straight in.
	 *
	 * In AS3 this is the sink `addItem()` funnels into once it has resolved its asset
	 * name to a `BitmapData`; here `addItem()` still hands the *name* down to the
	 * singular controller (which takes an icon URI as well), so the two stay separate
	 * entry points.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::addItemWithBitmap()
    addItemWithBitmap(
        content: string,
        type: string,
        iconBitmap: ImageBitmap | null = null,
        internalLink: string | null = null,
        extraData: Record<string, unknown> | null = null
    ): void
    {
        this._singularController?.addItem(content, type, iconBitmap, null, null, internalLink, extraData);
    }

    /**
     * Drop every notification carrying this id — how a toggle-style bubble (the wired
     * click-settings one) takes itself down when the condition that raised it goes away.
     *
     * AS3 forwards straight to the singular controller, as here.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/notifications/HabboNotifications.as::removeNotificationById()
    removeNotificationById(notificationId: string | null): void
    {
        if(notificationId === null) return;

        this._singularController?.removeNotificationById(notificationId);
    }

    /**
	 * Show a notification popup with the given type and parameters
	 *
	 * @param type The notification type key
	 * @param parameters Optional parameters map
	 *
	 * @see source_as_win63/habbo/notifications/HabboNotifications.as showNotification()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::showNotification()
    showNotification(type: string, parameters?: Map<string, string> | null): void
    {
        const params = parameters ?? new Map<string, string>();

        // Check for configuration-defined notification properties
        const configKey = 'notification.' + type;

        if(this.propertyExists(configKey))
        {
            try
            {
                const configJson = this.getProperty(configKey);
                const configObj = JSON.parse(configJson) as Record<string, string>;

                for(const [key, value] of Object.entries(configObj))
                {
                    params.set(key, value);
                }
            }
            catch (e)
            {
                log.error(`Failed to parse notification config for "${configKey}":`, e);
            }
        }

        // Check if this should be displayed as a bubble
        if(params.get('display') === 'BUBBLE')
        {
            const message = this.getNotificationPart(params, type, 'message', true);
            const linkUrl = this.getNotificationPart(params, type, 'linkUrl', false);
            const imageUrl = this.getNotificationImageUrl(params, type);

            let internalLink: string | null = null;

            if(linkUrl != null && linkUrl.substring(0, 6) === 'event:')
            {
                internalLink = linkUrl.substring(6);
            }

            this._singularController?.addItem(
                message ?? '',
                'info',
                null,
                imageUrl,
                null,
                internalLink ?? linkUrl
            );
        }
        else
        {
            // AS3 constructs the popup here and keeps no reference to it — it disposes itself from
            // its own close button. This port used to emit a `'showNotification'` event instead,
            // "for the UI layer", and nothing ever listened: every non-BUBBLE notification the
            // server sent was dropped on the floor. The event is still emitted for the ported
            // consumers that subscribe to `notificationEvents`, but it is no longer what draws it.
            new NotificationPopup(this, type, params);

            this._notificationEvents.emit('showNotification', type, params);
        }
    }

    /**
	 * Add a song playing notification
	 *
	 * @param songName The name of the song
	 * @param songAuthor The author of the song
	 *
	 * @see source_as_win63/habbo/notifications/HabboNotifications.as addSongPlayingNotification()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::addSongPlayingNotification()
    addSongPlayingNotification(songName: string, songAuthor: string): void
    {
        this._singularController?.addSongPlayingNotification(songName, songAuthor);
    }

    /**
	 * Get a part of a notification (message, linkUrl, etc.)
	 * Resolves from parameters map or localization.
	 *
	 * @param params The notification parameters
	 * @param type The notification type
	 * @param part The part key to resolve
	 * @param required Whether the part is required
	 * @returns The resolved string or null
	 *
	 * @see source_as_win63/habbo/notifications/HabboNotifications.as getNotificationPart()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::getNotificationPart()
    getNotificationPart(
        params: Map<string, string>,
        type: string,
        part: string,
        required: boolean
    ): string | null
    {
        if(params.has(part))
        {
            return params.get(part) ?? null;
        }

        const locKey = ['notification', type, part].join('.');

        if(this._localizationManager)
        {
            if(this._localizationManager?.hasLocalization(locKey) || required)
            {
                return this._localizationManager.getLocalizationWithParamMap(locKey, locKey, params);
            }
        }

        if(required)
        {
            return locKey;
        }

        return null;
    }

    /**
	 * Get the notification image URL
	 *
	 * @param params The notification parameters
	 * @param type The notification type
	 * @returns The image URL
	 *
	 * @see source_as_win63/habbo/notifications/HabboNotifications.as getNotificationImageUrl()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::getNotificationImageUrl()
    getNotificationImageUrl(params: Map<string, string>, type: string): string | null
    {
        const image = params.get('image');

        if(image != null)
        {
            return image;
        }

        return '${image.library.url}notifications/' + type.replace(/\./g, '_') + '.png';
    }

    /**
	 * Create a link event (dispatches through the context)
	 *
	 * @param link The link event string
	 *
	 * @see source_as_win63/habbo/notifications/HabboNotifications.as createLinkEvent()
	 */
    // AS3: .../src/com/sulake/habbo/notifications/HabboNotifications.as::createLinkEvent()
    createLinkEvent(link: string): void
    {
        this.context.createLinkEvent(link);
    }

    override dispose(): void
    {
        if(this.disposed) return;

        if(this._messageHandler != null)
        {
            this._messageHandler.dispose();
            this._messageHandler = null;
        }

        if(this._singularController != null)
        {
            this._singularController.dispose();
            this._singularController = null;
        }

        this._notificationEvents.removeAllListeners();

        log.debug('HabboNotifications disposed');

        super.dispose();
    }

    /**
	 * Called when all required dependencies are resolved.
	 * Creates the SingularNotificationController and NotificationMessageHandler.
	 */
    protected override initComponent(): void
    {
        this._singularController = new SingularNotificationController(this);
        this._messageHandler = new NotificationMessageHandler(this, this._communication!);

        log.debug('HabboNotifications initialized');
    }
}
