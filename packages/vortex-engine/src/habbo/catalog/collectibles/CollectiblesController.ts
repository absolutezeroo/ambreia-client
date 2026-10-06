import {Component} from '@core/runtime/Component';
import {ComponentDependency} from '@core/runtime/ComponentDependency';
import type {IContext} from '@core/runtime/IContext';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import type {IMessageComposer} from '@core/communication/messages/IMessageComposer';
import {Logger} from '@core/utils/Logger';

import type {IHabboCommunicationManager} from '@habbo/communication/IHabboCommunicationManager';
import type {ISessionDataManager} from '@habbo/session/ISessionDataManager';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboNotifications} from '@habbo/notifications/IHabboNotifications';
import type {IProductDisplayInfo} from '@habbo/window/widgets/IProductDisplayInfo';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {HabboCatalog} from '@habbo/catalog/HabboCatalog';
import {PurseEvent} from '@habbo/catalog/purse/PurseEvent';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import type {IHabboFreeFlowChat} from '@habbo/freeflowchat/IHabboFreeFlowChat';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboInventory} from '@habbo/inventory/IHabboInventory';
import {HabboInventoryCategoryInitializeEvent} from '@habbo/inventory/events/HabboInventoryCategoryInitializeEvent';
import {ImageResult} from '@habbo/room/ImageResult';
import {Vector3d} from '@room/utils/Vector3d';
import {RedeemNftLootBoxStateMessageEvent} from '@habbo/communication/messages/incoming/collectibles/RedeemNftLootBoxStateMessageEvent';
import {RedeemNftLootBoxResultMessageEvent} from '@habbo/communication/messages/incoming/collectibles/RedeemNftLootBoxResultMessageEvent';
import type {RedeemNftLootBoxStateMessageParser} from '@habbo/communication/messages/parser/collectibles/RedeemNftLootBoxStateMessageParser';
import type {RedeemNftLootBoxResultMessageParser} from '@habbo/communication/messages/parser/collectibles/RedeemNftLootBoxResultMessageParser';

import {IID_HabboCommunicationManager} from '@iid/IIDHabboCommunicationManager';
import {IID_SessionDataManager} from '@iid/IIDSessionDataManager';
import {IID_HabboLocalizationManager} from '@iid/IIDHabboLocalizationManager';
import {IID_HabboNotifications} from '@iid/IIDHabboNotifications';
import {IID_RoomEngine} from '@iid/IIDRoomEngine';
import {IID_HabboCatalog} from '@iid/IIDHabboCatalog';
import {IID_AvatarRenderManager} from '@iid/IIDAvatarRenderManager';
import {IID_HabboFreeFlowChat} from '@iid/IIDHabboFreeFlowChat';
import {IID_HabboWindowManager} from '@iid/IIDHabboWindowManager';
import {IID_HabboInventory} from '@iid/IIDHabboInventory';

import type {ICollectorHub} from './ICollectorHub';
import type {ICollectibleProductPreviewer} from './ICollectibleProductPreviewer';
import {BaseItemWrapper} from './renderer/model/BaseItemWrapper';
import {CollectibleRarity} from './util/CollectibleRarity';
import {CollectiblesRewardBoxView} from './CollectiblesRewardBoxView';
import {CollectiblesView} from './CollectiblesView';

const log = Logger.getLogger('habbo.catalog.collectibles.CollectiblesController');

/**
 * The collectibles hub: the `ICollectorHub` the rest of the client talks to, and the owner of the
 * collectibles *catalog* tab.
 *
 * What is ported here is the hub half — product naming, product previewing, the two reward-box
 * messages (including the reward popup they raise), and the send/subscribe plumbing the tabs will
 * need. The *hub window* is not: `CollectiblesView` (582 l.) and its five tabs are the bulk of
 * `habbo/catalog/collectibles`, and `linkReceived()` below says so rather than pretending.
 *
 * `_freeFlowChat` is held and not yet read: both chat-style preview branches are TODO, because the
 * port's `IChatStyleLibrary` exposes no `selectorPreview` and AS3's large preview renders a whole
 * chat bubble to a BitmapData. The dependency is declared now so those two branches are a body
 * change rather than a dependency change.
 *
 * Registering it matters even without the views. `HabboCatalog.collectorHub` returned null, so
 * `getProductName()`/`getProductType()` had no implementation and the inventory's collectibles tab
 * was falling back to raw product codes.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/collectibles/CollectiblesController.as
 */
export class CollectiblesController extends Component implements ICollectorHub, ILinkEventTracker
{
    // AS3: CollectiblesController.as::_communicationManager
    private _communicationManager: IHabboCommunicationManager | null = null;
    // AS3: CollectiblesController.as::_localizationManager
    private _localizationManager: IHabboLocalizationManager | null = null;
    // AS3: CollectiblesController.as::_sessionDataManager
    private _sessionDataManager: ISessionDataManager | null = null;
    // AS3: CollectiblesController.as::_notifications
    private _notifications: IHabboNotifications | null = null;
    // AS3: CollectiblesController.as::_roomEngine
    private _roomEngine: IRoomEngine | null = null;
    // AS3: CollectiblesController.as::_catalog
    private _catalog: IHabboCatalog | null = null;
    // AS3: CollectiblesController.as::_avatarRenderManager
    private _avatarRenderManager: IAvatarRenderManager | null = null;
    // AS3: CollectiblesController.as::_freeFlowChat
    private _freeFlowChat: IHabboFreeFlowChat | null = null;
    // AS3: CollectiblesController.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    // AS3: CollectiblesController.as::_inventory
    private _inventory: IHabboInventory | null = null;
    // AS3: CollectiblesController.as::_SafeStr_6959 (the reward-box window)
    private _rewardBoxView: CollectiblesRewardBoxView | null = null;
    // AS3: CollectiblesController.as::_SafeStr_4550 (the hub window)
    private _hubView: CollectiblesView | null = null;
    // AS3: CollectiblesController.as::_SafeStr_5769 (the disposed flag)
    private _controllerDisposed: boolean = false;

    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);
    }

    /**
     * AS3 takes ten; the nine below are the ones something here reads. The one left out is the
     * inventory, which only the unported mint tab uses.
     *
     * **Only the communication manager is required**, exactly as in AS3 — everything else is
     * optional. That is not tidiness: a hard dependency on an IID nothing provides locks the
     * component forever with no log, and `IID_HabboCatalog` is a genuine cycle here, since
     * `HabboCatalog`'s own constructor is what builds this component.
     */
    // AS3: CollectiblesController.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<any>>
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (manager: IHabboCommunicationManager | null) =>
                {
                    this._communicationManager = manager;
                },
                true
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (manager: ISessionDataManager | null) =>
                {
                    this._sessionDataManager = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboLocalizationManager,
                (manager: IHabboLocalizationManager | null) =>
                {
                    this._localizationManager = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboNotifications,
                (notifications: IHabboNotifications | null) =>
                {
                    this._notifications = notifications;
                }
            ),
            // AS3 marks this one optional explicitly (`false`); the rest take the default, which is
            // also optional.
            new ComponentDependency(
                IID_RoomEngine,
                (roomEngine: IRoomEngine | null) =>
                {
                    this._roomEngine = roomEngine;
                },
                false
            ),
            new ComponentDependency(
                IID_HabboCatalog,
                (catalog: IHabboCatalog | null) =>
                {
                    this._catalog = catalog;
                }
            ),
            new ComponentDependency(
                IID_AvatarRenderManager,
                (manager: IAvatarRenderManager | null) =>
                {
                    this._avatarRenderManager = manager;
                }
            ),
            new ComponentDependency(
                IID_HabboWindowManager,
                (manager: IHabboWindowManager | null) =>
                {
                    this._windowManager = manager;
                }
            ),
            /**
              * AS3 marks this optional too and attaches a `HABBO_INVENTORY_CATEGORY_INITIALIZED`
              * listener to the dependency itself; the port subscribes in the setter, which is the
              * first moment the emitter exists.
              */
            new ComponentDependency(
                IID_HabboInventory,
                (inventory: IHabboInventory | null) =>
                {
                    this._inventory?.events.off(
                        HabboInventoryCategoryInitializeEvent.HABBO_INVENTORY_CATEGORY_INITIALIZED,
                        this.onInventoryInitialize
                    );

                    this._inventory = inventory;

                    inventory?.events.on(
                        HabboInventoryCategoryInitializeEvent.HABBO_INVENTORY_CATEGORY_INITIALIZED,
                        this.onInventoryInitialize
                    );
                },
                false
            ),
            new ComponentDependency(
                IID_HabboFreeFlowChat,
                (chat: IHabboFreeFlowChat | null) =>
                {
                    this._freeFlowChat = chat;
                }
            ),
        ];
    }

    // AS3: CollectiblesController.as::initComponent()
    protected override initComponent(): void
    {
        this.context?.addLinkEventTracker(this);

        this.addMessageEvent(new RedeemNftLootBoxStateMessageEvent(this.onRedeemLootBoxStateEvent));
        this.addMessageEvent(new RedeemNftLootBoxResultMessageEvent(this.onRedeemLootBoxResultEvent));

        // The hub prints both balances in its header; without these two the numbers only ever
        // showed what the purse held when the window was built.
        this._catalog?.events.on(PurseEvent.EMERALD_BALANCE, this.onPurseBalance);
        this._catalog?.events.on(PurseEvent.SILVER_BALANCE, this.onPurseBalance);
    }

    // AS3: CollectiblesController.as::onEmeraldBalance() / onSilverBalance()
    // Two identically-bodied handlers in AS3 (`updateView()` each); one here, registered twice.
    private onPurseBalance = (): void =>
    {
        this.updateView();
    };

    /**
     * The chat style library's own selector swatch for a style id, wrapped as an `ImageResult`.
     *
     * TS-only helper: AS3 writes the same lookup out at both preview sites. The id arrives as a
     * string because `IProductDisplayInfo.itemTypeId` is one for every product type.
     */
    private static chatStyleSwatch(catalog: IHabboCatalog | null, itemTypeId: string): ImageResult
    {
        const result = new ImageResult();

        // Cast for the same reason PurchaseConfirmationDialog and PrizeGridItem cast: the chat
        // library hangs off the concrete catalog, and AS3's IHabboCatalog does not declare it
        // either.
        const chat = (catalog as HabboCatalog | null)?.freeFlowChat ?? null;

        result.data = chat?.chatStyleLibrary?.getStyle(parseInt(itemTypeId, 10))?.selectorPreview ?? null;

        return result;
    }

    // AS3: CollectiblesController.as::get localizationManager()
    get localizationManager(): IHabboLocalizationManager | null
    {
        return this._localizationManager;
    }

    // AS3: CollectiblesController.as::get inventory()
    get inventory(): IHabboInventory | null
    {
        return this._inventory;
    }

    // AS3: CollectiblesController.as::onInventoryInitialize()
    private onInventoryInitialize = (event: HabboInventoryCategoryInitializeEvent): void =>
    {
        this._hubView?.mintInventoryListWidget?.onInventoryInitialize(event.category);
    };

    // AS3: CollectiblesController.as::get catalog()
    get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: CollectiblesController.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: CollectiblesController.as::get avatarRenderManager()
    get avatarRenderManager(): IAvatarRenderManager | null
    {
        return this._avatarRenderManager;
    }

    // AS3: CollectiblesController.as::get notifications()
    get notifications(): IHabboNotifications | null
    {
        return this._notifications;
    }

    // AS3: CollectiblesController.as::send()
    send(composer: IMessageComposer<unknown[]>): void
    {
        this._communicationManager?.connection?.send(composer);
    }

    // AS3: CollectiblesController.as::addMessageEvent()
    addMessageEvent(event: IMessageEvent): void
    {
        if(this._communicationManager === null) return;

        this._communicationManager.addMessageEvent(event);
    }

    // AS3: CollectiblesController.as::removeMessageEvent()
    removeMessageEvent(event: IMessageEvent): void
    {
        if(this._communicationManager === null) return;

        this._communicationManager.removeMessageEvent(event);
    }

    /**
     * Somebody, somewhere in the hotel, opened an NFT reward box.
     *
     * `start` is skipped outright — only the reveal is acted on. If it was us, AS3 opens the reward
     * window; if it was someone else, a "someone opened X" notification goes up carrying the
     * product and its rarity colour so the bubble can theme itself.
     */
    // AS3: CollectiblesController.as::onRedeemLootBoxStateEvent()
    private onRedeemLootBoxStateEvent = (event: IMessageEvent): void =>
    {
        const parser = event.parser as RedeemNftLootBoxStateMessageParser | null;

        if(parser === null || parser.reward === null) return;

        if(parser.start) return;

        const isOwnUser = this._sessionDataManager?.userId === parser.openerAvatarId;
        const product = new BaseItemWrapper(parser.reward);

        if(isOwnUser)
        {
            this.showLootBoxReward(product);

            return;
        }

        const localization = this._localizationManager;
        const someone = localization?.getLocalization('generic.someone') ?? '';
        const text = localization?.getLocalizationWithParams(
            'collectibles.reward_box.notif.desc',
            '',
            'name', someone,
            'item', this.getProductName(product)
        ) ?? '';

        this._notifications?.addItem(text, 'nft_opening', null, null, {
            product,
            rarity: parser.reward.rarity,
            rarity_color: CollectibleRarity.getRarityColor(parser.reward.rarity),
        });
    };

    /**
     * Note both branches are `if`, not `else if` — AS3's. A result that is somehow both a failure
     * and a wrong-wallet raises two notifications; the codes are mutually exclusive on the wire, so
     * it never happens.
     */
    // AS3: CollectiblesController.as::onRedeemLootBoxResultEvent()
    private onRedeemLootBoxResultEvent = (event: IMessageEvent): void =>
    {
        const parser = event.parser as RedeemNftLootBoxResultMessageParser | null;

        if(parser === null) return;

        if(parser.fail)
        {
            this._notifications?.addItem(
                this._localizationManager?.getLocalization('generic.error') ?? '',
                'info',
                'icon_curator_stamp_large_png'
            );
        }

        if(parser.notInStarDustWallet)
        {
            this._notifications?.addItem(
                this._localizationManager?.getLocalization('collectibles.reward_box.wrong_wallet') ?? '',
                'info',
                'icon_curator_stamp_large_png'
            );
        }
    };

    /**
     * AS3: CollectiblesController.as::showLootBoxReward()
     *
     * The `showImmediate` argument is `true` only when the window is being built for the first
     * time, and `false` afterwards — which is what makes a second box queue behind the one on
     * screen instead of replacing it. See `CollectiblesRewardBoxView.showReward()`.
     */
    // AS3: CollectiblesController.as::showLootBoxReward()
    private showLootBoxReward(product: BaseItemWrapper): void
    {
        if(this._windowManager === null)
        {
            log.warn('No window manager: the reward box opened without showing what came out.');

            return;
        }

        if(this._rewardBoxView === null || this._rewardBoxView.disposed)
        {
            this._rewardBoxView = new CollectiblesRewardBoxView(this, this._windowManager);
            this._rewardBoxView.showReward(product, true);

            return;
        }

        this._rewardBoxView.showReward(product, false);
    }

    /**
     * The localized product *category*.
     *
     * The seven cases are AS3's, and the default is the literal string "Unknown" — not a
     * localization key, and capitalised differently from the `"unknown"` that `getProductName()`
     * returns for a null product. Both spellings are AS3's.
     */
    // AS3: CollectiblesController.as::getProductType()
    getProductType(product: IProductDisplayInfo | null): string
    {
        if(product === null) return 'unknown';

        const localization = this._localizationManager;

        switch(product.productTypeId)
        {
            case 0:
                return localization?.getLocalization('product.type.wall') ?? '';
            case 1:
                return localization?.getLocalization('product.type.room') ?? '';
            case 2:
                return localization?.getLocalization('product.type.effect') ?? '';
            case 4:
                return localization?.getLocalization('product.type.badge') ?? '';
            case 9:
                return localization?.getLocalization('product.type.chatstyle') ?? '';
            case 10:
                return localization?.getLocalization('product.type.pets') ?? '';
            case 11:
                return localization?.getLocalization('product.type.clothing') ?? '';
            default:
                return 'Unknown';
        }
    }

    /**
     * The product's display name.
     *
     * AS3 switches on `productTypeId - -1`, i.e. `productTypeId + 1`, so every case label here is
     * one higher than the type id it matches — a decompiler artefact of a switch the compiler
     * rebased, not a different set of ids from `getProductType()` above. The `+ 1` is kept rather
     * than folded away so the two files still line up when read side by side.
     *
     * Note the two type ids that share a branch: 1 (wall, case 2) and 11 (case 12) both resolve
     * against floor-item data. That is AS3's, and it is why a clothing collectible can come back
     * as "(missing floor item)".
     */
    // AS3: CollectiblesController.as::getProductName()
    getProductName(product: IProductDisplayInfo | null): string
    {
        if(product === null) return 'unknown';

        const localization = this._localizationManager;
        const session = this._sessionDataManager;

        switch(product.productTypeId + 1)
        {
            case 0:
                return 'unknown';
            case 1:
            {
                const data = session?.getWallItemData(parseInt(product.itemTypeId, 10)) ?? null;

                if(data === null) return '(missing wall item)';

                return data.localizedName;
            }
            case 2:
            case 12:
            {
                const data = session?.getFloorItemData(parseInt(product.itemTypeId, 10)) ?? null;

                if(data === null) return '(missing floor item)';

                return data.localizedName;
            }
            case 3:
                return localization?.getLocalization(`fx_${product.itemTypeId}`) ?? '';
            case 5:
                return localization?.getBadgeName(product.itemTypeId) ?? '';
            case 10:
                return localization?.getLocalization('product.type.chatstyle') ?? '';
            case 11:
                return localization?.getLocalization(`pet.type.${product.itemTypeId}`) ?? '';
            default:
                log.warn(`Can not yet handle this type of product: ${product.productTypeId}`);

                return '(missing)';
        }
    }

    /**
     * Draws the *small* icon for a product into a preview surface.
     *
     * The `+ 1` on the switch is the same decompiler rebase `getProductName()` carries — see the
     * note there. Icons and images differ in more than size: an icon asks the room engine for the
     * cached `getFurnitureIcon`/`getWallItemIcon`, while `previewImage()` below asks for a real
     * render at a direction and scale.
     *
     * The wall branch is gated on `tempCategoryMapping()`, so most wall items fall through to a
     * cleared previewer rather than showing an icon. That gate is AS3's, name included.
     */
    // AS3: CollectiblesController.as::previewIcon()
    previewIcon(product: IProductDisplayInfo | null, previewer: ICollectibleProductPreviewer): void
    {
        if(product === null)
        {
            previewer.setUnknownImage();

            return;
        }

        const session = this._sessionDataManager;

        switch(product.productTypeId + 1)
        {
            case 0:
                previewer.setUnknownImage();
                break;
            case 1:
            {
                const data = session?.getWallItemData(parseInt(product.itemTypeId, 10)) ?? null;

                if(data === null || this._roomEngine === null)
                {
                    previewer.clearPreviewer();
                    break;
                }

                if(CollectiblesController.tempCategoryMapping('I', data.id) === 1)
                {
                    previewer.imageResult = this._roomEngine.getWallItemIcon(data.id, previewer);
                    break;
                }

                previewer.clearPreviewer();
                break;
            }
            case 2:
            case 12:
            {
                const data = session?.getFloorItemData(parseInt(product.itemTypeId, 10)) ?? null;

                if(data === null || this._roomEngine === null)
                {
                    previewer.clearPreviewer();
                    break;
                }

                previewer.imageResult = this._roomEngine.getFurnitureIcon(data.id, previewer);
                break;
            }
            case 3:
            {
                const result = new ImageResult();

                result.data = this._catalog?.getPixelEffectIcon(parseInt(product.itemTypeId, 10)) ?? null;
                previewer.imageResult = result;
                break;
            }
            case 5:
                previewer.badgeResult = product.itemTypeId;
                break;
            case 10:
                previewer.imageResult = CollectiblesController.chatStyleSwatch(this._catalog, product.itemTypeId);
                break;
            case 11:
                previewer.petResult = product.petFigureString;
                break;
            default:
                log.warn(`Can not yet handle this type of product: ${product.productTypeId}`);
                previewer.clearPreviewer();
                break;
        }
    }

    /**
     * Draws the *large* image for a product.
     *
     * Differs from `previewIcon()` in five of its eight branches: furni is rendered at direction 90
     * and scale 64 rather than icon-cached, effects go to the avatar previewer instead of a pixel
     * icon, and type 11 (case 12) resolves an avatar figure out of the product's figure set rather
     * than falling in with the floor items.
     */
    // AS3: CollectiblesController.as::_lastEasterEggProductTypeId
    // Name DERIVED (`_SafeStr_9633`): obfuscated in every tree, named for what it remembers.
    private _lastEasterEggProductTypeId: number = -1;

    // AS3: CollectiblesController.as::_lastEasterEggItemTypeId
    // Name DERIVED (`_SafeStr_9632`).
    private _lastEasterEggItemTypeId: string = '';

    // AS3: CollectiblesController.as::_easterEggRepeatCount
    // Name DERIVED (`_SafeStr_5413`).
    private _easterEggRepeatCount: number = 0;

    /**
     * Preview the same chat style enough times in a row and it starts speaking under a different
     * name — the same seven thresholds `ProductImageWidget` carries.
     *
     * This copy has one thing that one does not: at 22 previews of item type 1020 it sends a
     * `wf15` developer command carrying "Wac" five times over. That looks arbitrary until the
     * condition is read literally — AS3 tests `name.indexOf("red") == 8`, and of the seven names
     * only "Wacky Wired" has "red" at index 8. So the send fires on exactly one name, at exactly
     * one count, on exactly one product, which is what an easter egg is.
     *
     * Returning true means the preview is done; false lets the normal switch run.
     */
    // AS3: CollectiblesController.as::handlePreviewImageEasterEgg()
    private handlePreviewImageEasterEgg(product: IProductDisplayInfo, previewer: ICollectibleProductPreviewer): boolean
    {
        if(product.productTypeId === this._lastEasterEggProductTypeId
            && product.itemTypeId === this._lastEasterEggItemTypeId)
        {
            this._easterEggRepeatCount += 1;
        }
        else
        {
            this._easterEggRepeatCount = 1;
        }

        this._lastEasterEggProductTypeId = product.productTypeId;
        this._lastEasterEggItemTypeId = product.itemTypeId;

        if(product.productTypeId !== 9) return false;

        let name = '';

        switch(this._easterEggRepeatCount)
        {
            case 7: name = 'Evil Frank'; break;
            case 10: name = 'Bonne Blonde'; break;
            case 15: name = 'Furni fairy'; break;
            case 22: name = 'Wacky Wired'; break;
            case 35: name = 'Quacky duck'; break;
            case 70: name = 'Pixel poo'; break;
            case 100: name = 'Bobba filtered'; break;
        }

        if(name === '') return false;

        const bubble = this.createChatItemPreview(parseInt(product.itemTypeId, 10), name);

        if(bubble === null) return false;

        const result = new ImageResult();

        result.data = bubble;
        previewer.imageResult = result;

        // AS3 then sends a wired debug command ("wf15") for one of these names; the RPG fork
        // removed wired, and this whole controller goes with the collectibles.

        return true;
    }

    /**
     * One chat bubble in the given style, with `name` — or the player's own — as its text.
     */
    // AS3: CollectiblesController.as::createChatItemPreview()
    private createChatItemPreview(styleId: number, name: string | null = null): ImageBitmap | null
    {
        const userName = name ?? this._sessionDataManager?.userName ?? '';
        // Cast for the same reason `chatStyleSwatch()` below casts: the chat component hangs off
        // the concrete catalog, and AS3's IHabboCatalog does not declare it either.
        const chat = (this._catalog as HabboCatalog | null)?.freeFlowChat ?? null;

        return chat?.createPreviewBitmap(userName, styleId) ?? null;
    }

    // AS3: CollectiblesController.as::previewImage()
    previewImage(product: IProductDisplayInfo | null, previewer: ICollectibleProductPreviewer): void
    {
        if(product === null)
        {
            previewer.setUnknownImage();

            return;
        }

        if(this.handlePreviewImageEasterEgg(product, previewer)) return;

        const session = this._sessionDataManager;

        switch(product.productTypeId + 1)
        {
            case 0:
                previewer.setUnknownImage();
                break;
            case 1:
            {
                const data = session?.getWallItemData(parseInt(product.itemTypeId, 10)) ?? null;

                if(data === null || this._roomEngine === null)
                {
                    previewer.clearPreviewer();
                    break;
                }

                if(CollectiblesController.tempCategoryMapping('I', data.id) === 1)
                {
                    previewer.imageResult = this._roomEngine.getWallItemImage(
                        data.id, new Vector3d(90), 64, previewer
                    );
                    break;
                }

                previewer.clearPreviewer();
                break;
            }
            case 2:
            {
                const data = session?.getFloorItemData(parseInt(product.itemTypeId, 10)) ?? null;

                if(data === null || this._roomEngine === null)
                {
                    previewer.clearPreviewer();
                    break;
                }

                previewer.imageResult = this._roomEngine.getFurnitureImage(
                    data.id, new Vector3d(90, 0, 0), 64, previewer
                );
                break;
            }
            case 3:
                if(product.itemTypeId === '')
                {
                    previewer.clearPreviewer();
                    break;
                }

                previewer.setEffectResult(session?.figure ?? '', parseInt(product.itemTypeId, 10));
                break;
            case 5:
                previewer.badgeResult = product.itemTypeId;
                break;
            case 10:
            {
                // The *large* preview is a different thing from the swatch: a whole bubble with the
                // player's name in it, not the style's own selector thumbnail. It falls back to the
                // swatch when the bubble cannot be rendered, which is the right style either way.
                const bubble = this.createChatItemPreview(parseInt(product.itemTypeId, 10));

                if(bubble === null)
                {
                    previewer.imageResult = CollectiblesController.chatStyleSwatch(this._catalog, product.itemTypeId);
                    break;
                }

                const result = new ImageResult();

                result.data = bubble;
                previewer.imageResult = result;
                break;
            }
            case 11:
                previewer.petResult = product.petFigureString;
                break;
            case 12:
            {
                const figure = this._avatarRenderManager?.getFigureStringWithFigureIds(
                    session?.figure ?? '',
                    session?.gender ?? '',
                    product.figureSetIds
                ) ?? '';

                previewer.avatarResult = figure;
                break;
            }
            default:
                log.warn(`Can not yet handle this type of product: ${product.productTypeId}`);
                previewer.clearPreviewer();
                break;
        }
    }

    /**
     * AS3's name, and AS3's shape: a hard-coded table standing in for a real category lookup.
     * `"S"` is always 1; `"I"` is 2, 3 or 4 for three specific wall-item ids and 1 otherwise;
     * anything else is 1. Only the `"I"` path is ever called, and only its `=== 1` result is
     * tested — so the three special ids are exactly the wall items that do *not* get a preview.
     */
    // AS3: CollectiblesController.as::tempCategoryMapping()
    private static tempCategoryMapping(kind: string, itemTypeId: number): number
    {
        if(kind === 'S') return 1;

        if(kind === 'I')
        {
            if(itemTypeId === 3001) return 2;
            if(itemTypeId === 3002) return 3;
            if(itemTypeId === 4057) return 4;

            return 1;
        }

        return 1;
    }

    /**
     * Both hooks do the same thing in AS3 — the mint tab only cares that the count changed, not
     * which way — and both are null-guarded, so they are no-ops until the hub window has been
     * opened at least once.
     *
     * Note the first parameter is named `productTypeId` after AS3's own signature but is passed
     * `item.type` by `FurniModel`; the mint tab reads only the second and third.
     */
    // DEVIATION: AS3 hands `amountChangedForItem()` its FIRST argument; this hands it the second,
    //   for the reason set out just above — the port's caller (`FurniModel`) feeds `item.type`
    //   into the first, so passing it on would key the mint tab's count by the wrong number.
    // AS3: CollectiblesController.as::itemAddedToInventory()
    itemAddedToInventory(_productTypeId: number, itemTypeId: number, isWallItem: boolean): void
    {
        this._hubView?.mintInventoryListWidget?.amountChangedForItem('furni', itemTypeId, isWallItem);
    }

    // DEVIATION: the same argument swap as `itemAddedToInventory()` above, for the same reason.
    // AS3: CollectiblesController.as::itemRemovedFromInventory()
    itemRemovedFromInventory(_productTypeId: number, itemTypeId: number, isWallItem: boolean): void
    {
        this._hubView?.mintInventoryListWidget?.amountChangedForItem('furni', itemTypeId, isWallItem);
    }

    // AS3: CollectiblesController.as::get linkPattern()
    get linkPattern(): string
    {
        return 'collectibles/';
    }

    // AS3: CollectiblesController.as::linkReceived()
    linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2) return;

        if(parts[1] === 'open') this.showCollectibleHub();
    }

    // AS3: CollectiblesController.as::showCollectibleHub()
    private showCollectibleHub(): void
    {
        if(this._windowManager === null)
        {
            log.warn('No window manager: the collectibles hub cannot be opened.');

            return;
        }

        if(this._hubView === null || this._hubView.disposed)
        {
            this._hubView = new CollectiblesView(this, this._windowManager);
            this.updateView();

            return;
        }

        this._hubView.showWindow();
    }

    /**
     * AS3: CollectiblesController.as::updateView() — its whole body is
     * `_view.updateBalances(_catalog.getPurse())`, called on first build and on every purse event.
     */
    // AS3: CollectiblesController.as::updateView()
    private updateView(): void
    {
        if(this._hubView === null) return;

        const purse = this._catalog?.getPurse() ?? null;

        if(purse !== null) this._hubView.updateBalances(purse);
    }

    // AS3: CollectiblesController.as::dispose()
    override dispose(): void
    {
        if(this._controllerDisposed)
        {
            super.dispose();

            return;
        }

        this._controllerDisposed = true;

        this._catalog?.events.off(PurseEvent.EMERALD_BALANCE, this.onPurseBalance);
        this._catalog?.events.off(PurseEvent.SILVER_BALANCE, this.onPurseBalance);

        if(this._rewardBoxView !== null)
        {
            this._rewardBoxView.dispose();
            this._rewardBoxView = null;
        }

        if(this._hubView !== null)
        {
            this._hubView.dispose();
            this._hubView = null;
        }

        this._inventory?.events.off(
            HabboInventoryCategoryInitializeEvent.HABBO_INVENTORY_CATEGORY_INITIALIZED,
            this.onInventoryInitialize
        );

        this._communicationManager = null;
        this._windowManager = null;
        this._inventory = null;
        this._sessionDataManager = null;
        this._localizationManager = null;
        this._notifications = null;

        super.dispose();
    }
}
