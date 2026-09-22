import {AvatarEditorIdEnum} from '@habbo/avatar/enum/AvatarEditorIdEnum';
/**
 * AvatarInfoWidget — the RWE_AVATAR_INFO widget, own-avatar slice.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as
 *
 * Owns the own-avatar bubble (OwnAvatarMenuView) and the whole pet side: the two context
 * bubbles (PetMenuView / OwnPetMenuView) opened on RWUIUE_OWN_USER / RWPIUE_PET_INFO, the
 * per-pet use-product and breed-with bubbles, and the five pet dialogs (use-product
 * confirmation, monsterplant breeding confirmation, nest breeding confirmation, breeding
 * result, nest breeding success). It repositions every visible bubble each frame against its
 * pet's on-screen box and owns the three breeding composers.
 *
 * Rentable bots are ported too (RentableBotMenuView plus the `botskills/` configuration views).
 *
 * `UserNameView` (the avatar name bubble) and its base `AvatarContextInfoView` are ported, and
 * `showUserName()`/`showGamePlayerName()` are complete, callable methods (`_avatarNameBubbles`,
 * positioned every frame alongside the other bubbles).
 *
 * The automatic trigger is wired now: a friend walking into the room gets one from
 * `AvatarInfoWidgetHandler`'s RSUDUE arm, and `updatePeerUserView()` drops it again in favour of the
 * full menu on click. `showGamePlayerName()` is reachable end-to-end too, on AS3's own path:
 * `SnowWarEngine` -> `IRoomUI` -> `RoomDesktop` -> here.
 *
 * Every AS3 sibling view is ported now, the two conditional stand-ins for the own-avatar menu
 * included: DecorateModeView (`isUserDecorating`) and NewUserHelpView (`RoomEnterEffect.isRunning()`).
 *
 * Positioning goes through the `RWGOI_MESSAGE_GET_OBJECT_LOCATION` round-trip, as AS3's `update()`
 * does. It used to call `roomEngine.getRoomObjectBoundingRectangle()` directly instead — a
 * deliberate shortcut, noted here as an adaptation — and that shortcut is what stranded the "Admin"
 * nametag in the top-left corner and pushed the avatar menu off the head once fishing gave avatars
 * a wide effect. `ObjectLocationRequestHandler` answers the message, was already ported and correct,
 * and was simply not being asked. See `positionView()`.
 *
 * AS3 adaptation that remains: the per-frame tick uses the window manager's update receiver.
 */
import {RoomWidgetBase} from '@habbo/ui/widget/RoomWidgetBase';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IUpdateReceiver} from '@core/runtime/IContext';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {RoomEngineObjectEvent} from '@habbo/room/events/RoomEngineObjectEvent';
import {RoomWidgetRoomObjectMessage} from '@habbo/ui/widget/messages/RoomWidgetRoomObjectMessage';
import {RoomWidgetUserInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetUserInfoUpdateEvent';
import {RoomWidgetPetCommandsUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetCommandsUpdateEvent';
import {RoomWidgetRoomObjectUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetRoomObjectUpdateEvent';
import {RoomWidgetFurniInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetFurniInfoUpdateEvent';
import {RoomWidgetRoomObjectNameEvent} from '@habbo/ui/widget/events/RoomWidgetRoomObjectNameEvent';
import {RoomWidgetPetInfoUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetInfoUpdateEvent';
import {RoomWidgetPetStatusUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetStatusUpdateEvent';
import {RoomWidgetPetLevelUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetLevelUpdateEvent';
import {RoomWidgetUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetUpdateEvent';
import {HabboInventoryEffectsEvent} from '@habbo/inventory/events/HabboInventoryEffectsEvent';
import {WiredUserClickHandledEvent} from '@habbo/roomevents/events/WiredUserClickHandledEvent';
import type {IContextMenuParentWidget} from '../contextmenu/IContextMenuParentWidget';
import type {ContextInfoView} from '../contextmenu/ContextInfoView';
import {AvatarContextInfoButtonView} from './AvatarContextInfoButtonView';
import {AvatarInfoData} from './AvatarInfoData';
import {AvatarMenuView} from './AvatarMenuView';
import {DecorateModeView} from './DecorateModeView';
import {NewUserHelpView} from './NewUserHelpView';
import {RoomEnterEffect} from '@room/utils/RoomEnterEffect';
import {RoomWidgetGetObjectLocationMessage} from '../messages/RoomWidgetGetObjectLocationMessage';
import type {RoomWidgetUserLocationUpdateEvent} from '../events/RoomWidgetUserLocationUpdateEvent';
import {RoomWidgetAvatarInfoEvent} from '../events/RoomWidgetAvatarInfoEvent';
import type {EventEmitter} from 'eventemitter3';
import {RoomWidgetUserDataUpdateEvent} from '../events/RoomWidgetUserDataUpdateEvent';
import {RoomWidgetInventoryUpdatedMessage} from '../messages/RoomWidgetInventoryUpdatedMessage';
import {OwnAvatarMenuView} from './OwnAvatarMenuView';
import {PetInfoData} from './PetInfoData';
import {PetMenuView} from './PetMenuView';
import {RentableBotMenuView} from './RentableBotMenuView';
import {RentableBotInfoData} from './RentableBotInfoData';
import {BotSkillEnum} from './botskills/BotSkillEnum';
import {BotChangeNameConfiguration} from './botskills/BotChangeNameConfiguration';
import {BotChatterMarkovConfiguration} from './botskills/BotChatterMarkovConfiguration';
import type {IBotSkillConfigurationView} from './botskills/IBotSkillConfigurationView';
import {
    RoomWidgetRentableBotInfoUpdateEvent
} from '../events/RoomWidgetRentableBotInfoUpdateEvent';
import {
    RoomWidgetRentableBotSkillListUpdateEvent
} from '../events/RoomWidgetRentableBotSkillListUpdateEvent';
import {
    RoomWidgetRentableBotForceOpenContextMenuEvent
} from '../events/RoomWidgetRentableBotForceOpenContextMenuEvent';
import type {BotSkillData} from '@habbo/communication/messages/parser/room/bot/BotSkillData';
import {OwnPetMenuView} from './OwnPetMenuView';
import {UseProductView} from './UseProductView';
import {BreedPetView} from './BreedPetView';
import {UseProductConfirmationView} from './UseProductConfirmationView';
import {BreedMonsterPlantsConfirmationView} from './BreedMonsterPlantsConfirmationView';
import {ConfirmPetBreedingView} from './ConfirmPetBreedingView';
import {BreedPetsResultView} from './BreedPetsResultView';
import {BreedPetsResultData} from './BreedPetsResultData';
import {NestBreedingSuccessView} from './NestBreedingSuccessView';
import {UserNameView} from './UserNameView';
import {RoomWidgetPetBreedingEvent} from '@habbo/ui/widget/events/RoomWidgetPetBreedingEvent';
import {RoomWidgetPetBreedingResultEvent} from '@habbo/ui/widget/events/RoomWidgetPetBreedingResultEvent';
import {RoomWidgetConfirmPetBreedingEvent} from '@habbo/ui/widget/events/RoomWidgetConfirmPetBreedingEvent';
import {RoomWidgetConfirmPetBreedingResultEvent} from '@habbo/ui/widget/events/RoomWidgetConfirmPetBreedingResultEvent';
import {BreedPetsMessageComposer} from '@habbo/communication/messages/outgoing/room/pet/BreedPetsMessageComposer';
import {ConfirmPetBreedingComposer} from '@habbo/communication/messages/outgoing/inventory/pets/ConfirmPetBreedingComposer';
import {CancelPetBreedingComposer} from '@habbo/communication/messages/outgoing/inventory/pets/CancelPetBreedingComposer';
import type {UseProductItem} from '@habbo/ui/widget/events/UseProductItem';
import type {ConfirmPetBreedingPetData} from '@habbo/ui/widget/events/ConfirmPetBreedingPetData';
import type {BreedingRarityCategoryData} from '@habbo/ui/widget/events/BreedingRarityCategoryData';
import type {IUserData} from '@habbo/session/IUserData';
import type {IConfirmDialog} from '@habbo/window/utils/ConfirmDialog';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {AvatarInfoWidgetHandler} from '@habbo/ui/handler/AvatarInfoWidgetHandler';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.ui.widget.avatarinfo.AvatarInfoWidget');

export class AvatarInfoWidget extends RoomWidgetBase implements IContextMenuParentWidget, IUpdateReceiver
{
    // figure_effect ids that mean "in water" / "riding" (AvatarInfoWidget.as).
    private static readonly SWIM_EFFECTS: number[] = [29, 30, 185];

    private static readonly RIDE_EFFECT: number = 77;

    // IUserData.type for a pet — the literal AS3 passes to PetMenuView.setup()/getUserDataByType().
    private static readonly USER_TYPE_PET: number = 2;

    // AS3: AvatarInfoWidget.as::updateRentableBotView() compares `userType != 4` directly — the
    // `rentable_bot` slot of RoomObjectUserTypes, the same literal BotsModel places with.
    private static readonly USER_TYPE_RENTABLE_BOT: number = 4;

    // PetInfoData.petType for a monsterplant (AvatarInfoWidget.as::isMonsterPlant()).
    private static readonly PET_TYPE_MONSTERPLANT: number = 16;

    private _config: IHabboConfigurationManager | null;
    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::_catalog
    private _catalog: IHabboCatalog | null;
    private _data: AvatarInfoData = new AvatarInfoData();
    // AS3: AvatarInfoWidget.as::_activeView (obfuscated `_SafeStr_4550`; named from removeView(),
    // which clears it, and updatePetView(), which tests what it currently is)
    private _activeView: AvatarContextInfoButtonView | null = null;

    private _cachedOwnMenu: OwnAvatarMenuView | null = null;

    /** Derived name — `_SafeStr_5648`: the peer-avatar menu, kept between opens like its siblings. */
    // AS3: AvatarInfoWidget.as::_SafeStr_5648
    private _cachedAvatarMenu: AvatarMenuView | null = null;

    /** Derived name — `_SafeStr_4755`: whether the own-avatar identity has been seen once. */
    // AS3: AvatarInfoWidget.as::_SafeStr_4755
    private _ownAvatarInfoSeen: boolean = false;

    /**
     * Derived name — `_SafeStr_6130`: set when the bubble was opened by the toolbar's me-menu
     * rather than by a click on the avatar.
     *
     * It reads it twice, in the roll-over and roll-out arms (`AvatarInfoWidget.as` l.600 and
     * l.611) — this comment used to say AS3 read it nowhere, which was true only because those
     * two arms had never been ported.
     */
    // AS3: AvatarInfoWidget.as::_SafeStr_6130
    private _openedFromMemenu: boolean = false;

    /**
     * The object the pointer is currently over, so roll-out only dismisses the name it raised.
     *
     * Derived name — AS3's `_SafeStr_7543`.
     */
    // AS3: AvatarInfoWidget.as::_SafeStr_7543
    private _rolledOverObjectId: number = -1;

    /** Derived name — `_SafeStr_5843`: the small name bubble, kept between opens. */
    // AS3: AvatarInfoWidget.as::_SafeStr_5843
    private _contextInfoButtonView: AvatarContextInfoButtonView | null = null;

    /** Derived name — `_SafeStr_6774`: the room-entry hint that stands in for the me-menu. */
    // AS3: AvatarInfoWidget.as::_SafeStr_6774
    private _newUserHelpView: NewUserHelpView | null = null;

    /** Derived name — `_SafeStr_4895`: the decorate-mode "done" button, built once per room. */
    // AS3: AvatarInfoWidget.as::_SafeStr_4895
    private _decorateModeView: DecorateModeView | null = null;

    /** Derived name — `_SafeStr_6159`: the five-second hint timer. */
    // AS3: AvatarInfoWidget.as::_SafeStr_6159
    private _avatarHighlightTimer: ReturnType<typeof setTimeout> | null = null;
    private _isDancing: boolean = false;
    private _ownRoomIndex: number = -1;
    private _updateRegistered: boolean = false;

    // AS3: AvatarInfoWidget.as::_petData (obfuscated `_SafeStr_5133`) — the pet state kept
    // between RWPIUE_PET_INFO events; both pet bubbles read it.
    private _petData: PetInfoData = new PetInfoData();
    // AS3: AvatarInfoWidget.as::_cachedOwnPetMenu (obfuscated `_SafeStr_6484`; the AS3 sibling
    // `_cachedOwnAvatarMenu` is readable and names the pattern)
    private _cachedOwnPetMenu: OwnPetMenuView | null = null;
    // AS3: AvatarInfoWidget.as::_cachedPetMenu (obfuscated `_SafeStr_5550`)
    private _cachedPetMenu: PetMenuView | null = null;

    // AS3: AvatarInfoWidget.as::_SafeStr_4824 — the rentable-bot state both the menu and the skill
    // list update write into, kept across events the way `_petData` is for pets.
    private _rentableBotData: RentableBotInfoData | null = null;
    // AS3: AvatarInfoWidget.as::_SafeStr_5587
    private _cachedRentableBotMenu: RentableBotMenuView | null = null;
    // AS3: AvatarInfoWidget.as::_SafeStr_5434 — one editor per skill id, built on first use and
    // reused afterwards (each keeps its own message subscription).
    private _botSkillConfigurationViews: Map<number, IBotSkillConfigurationView> = new Map();
    // AS3: AvatarInfoWidget.as::_SafeStr_5950 — the last skill list seen per bot id. AS3 keys it by
    // `webID.toString()`; a numeric key is the same lookup here.
    private _botSkillsByBotId: Map<number, BotSkillData[]> = new Map();

    // AS3: AvatarInfoWidget.as::_handlePetInfo
    private _handlePetInfo: boolean = true;

    // AS3: AvatarInfoWidget.as::_pendingMenuRoomIndex (obfuscated `_SafeStr_5652`) — with
    // _buttonsSetup below, the menu build deferred until the wired click handler has had its
    // say (setupMenuView()).
    private _pendingMenuRoomIndex: number = -1;
    // AS3: AvatarInfoWidget.as::_buttonsSetup
    private _buttonsSetup: (() => void) | null = null;

    // AS3: AvatarInfoWidget.as::_useProductBubbles — one bubble per candidate pet, keyed on its
    // webID (AS3 keys its own map by the same string).
    private _useProductBubbles: Map<string, UseProductView> = new Map();
    // AS3: AvatarInfoWidget.as::_breedPetBubbles
    private _breedPetBubbles: Map<string, BreedPetView> = new Map();
    // AS3: AvatarInfoWidget.as::_avatarNameBubbles — one bubble per named avatar (friend or game
    // player), keyed on its display name (AS3 keys its own map by the same string).
    private _avatarNameBubbles: Map<string, UserNameView> = new Map();

    // The five modal pet dialogs, each at most one at a time.
    // AS3: AvatarInfoWidget.as::_useProductConfirmationView (obfuscated `_SafeStr_4966`)
    private _useProductConfirmationView: UseProductConfirmationView | null = null;
    // AS3: AvatarInfoWidget.as::_breedMonsterPlantsConfirmationView (obfuscated `_SafeStr_4972`)
    private _breedMonsterPlantsConfirmationView: BreedMonsterPlantsConfirmationView | null = null;
    // AS3: AvatarInfoWidget.as::_confirmPetBreedingView (obfuscated `_SafeStr_5284`)
    private _confirmPetBreedingView: ConfirmPetBreedingView | null = null;
    // AS3: AvatarInfoWidget.as::_breedPetsResultView (obfuscated `_SafeStr_4888`)
    private _breedPetsResultView: BreedPetsResultView | null = null;
    // AS3: AvatarInfoWidget.as::_nestBreedingSuccessView (obfuscated `_SafeStr_8360`)
    private _nestBreedingSuccessView: NestBreedingSuccessView | null = null;

    // AS3: AvatarInfoWidget.as::_breedingConfirmationAlert
    private _breedingConfirmationAlert: IConfirmDialog | null = null;
    // AS3: AvatarInfoWidget.as::_breedingAlertRequestObjectId (obfuscated `_SafeStr_7960`; named
    // from showBreedingPetsWaitingConfirmationAlert(), which stores the pair the alert can cancel)
    private _breedingAlertRequestObjectId: number = -1;
    // AS3: AvatarInfoWidget.as::_breedingAlertTargetObjectId (obfuscated `_SafeStr_6730`)
    private _breedingAlertTargetObjectId: number = -1;

    // AS3: AvatarInfoWidget.as::AvatarInfoWidget()
    constructor(
        handler: IRoomWidgetHandler,
        windowManager: IHabboWindowManager,
        assets: IAssetLibrary | null,
        localizations: IHabboLocalizationManager | null,
        config: IHabboConfigurationManager | null,
        catalog: IHabboCatalog | null
    )
    {
        super(handler, windowManager, assets, localizations);

        this._config = config;
        this._catalog = catalog;
        this.handler.widget = this;

        for(const [type, handler] of this.desktopEventBindings())
        {
            this.container?.desktopEvents.on(type, handler);
            // AS3's `checkUpdateNeed()` tail, reproduced on the emitter: eventemitter3 calls
            // listeners in registration order, so this always runs after the case above.
            this.container?.desktopEvents.on(type, this.onDesktopEventHandled);
        }

        this.container?.inventory?.events.on(HabboInventoryEffectsEvent.HIEE_EFFECTS_CHANGED, this.onEffectsChanged);
        this.container?.userDefinedRoomEvents?.events.on(
            WiredUserClickHandledEvent.WIRED_USER_CLICK_HANDLED, this.onUserClickHandledEvent
        );

        // AS3: AvatarInfoWidget.as:167-168 — these two are on the ROOM ENGINE's emitter, not the
        // desktop's, because they fire for every room object appearing and disappearing rather
        // than for a widget message.
        this.container?.roomEngine?.events.on(RoomEngineObjectEvent.REOE_ADDED, this.onRoomObjectAdded);
        this.container?.roomEngine?.events.on(RoomEngineObjectEvent.REOE_REMOVED, this.onRoomObjectRemoved);
    }

    // AS3: AvatarInfoWidget.as::get handler()
    public get handler(): AvatarInfoWidgetHandler
    {
        return this.widgetHandler as AvatarInfoWidgetHandler;
    }

    // DEVIATION: not exposed. AS3 returns the raw `Component`/IContext the widget was constructed
    //   with, used internally for registerUpdateReceiver()/removeUpdateReceiver() and externally
    //   (RentableBotMenuView.as) as `widget.component.context.createLinkEvent(...)`. This port's
    //   RoomWidgetBase carries no such reference: register/removeUpdateReceiver already go through
    //   `windowManager` (see this.windowManager.registerUpdateReceiver() below), and the one
    //   external caller reaches the link bus through the room engine's context instead — see
    //   RentableBotMenuView.ts's createLinkEvent() header note. An accessor here would have to
    //   return an object no code in this port actually models.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::get component()

    /**
	 * A friend walked into view — put their name bubble up
	 *
	 * Only avatars (category 100), and only names already on the friend list: this is what makes a
	 * friend's nameplate appear on its own, without anyone clicking. A non-friend gets nothing.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::onRoomObjectAdded()
    private onRoomObjectAdded = (event: RoomEngineObjectEvent): void =>
    {
        if(event.category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) return;

        const container = this.container;

        if(container === null) return;

        const userData = container.roomSession?.userDataManager.getUserDataByIndex(event.objectId) ?? null;
        const friendList = this.friendList;

        if(userData === null || friendList === null) return;

        if(friendList.getFriendNames().indexOf(userData.name) > -1) this.showUserName(userData, event.objectId);
    };

    /**
	 * ...and drop it again when they leave
	 *
	 * Keyed by name in `_avatarNameBubbles`, so the match has to go through the view's objectId.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::onRoomObjectRemoved()
    private onRoomObjectRemoved = (event: RoomEngineObjectEvent): void =>
    {
        if(event.category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) return;

        // AS3 closes the open bubble too (`RWROUE_USER_REMOVED`, l.806-809), and the port only
        // did the name-bubble loop below — so a user who walked out left their info bubble
        // standing over an empty tile, still offering to trade with them.
        if(this._activeView !== null && this._activeView.roomIndex === event.objectId)
        {
            this.removeView(this._activeView, false);
        }

        for(const view of [...this._avatarNameBubbles.values()])
        {
            if(view.objectId === event.objectId) this.removeView(view, false);
        }
    };

    /**
     * The avatar-name bubble shown over a friend's avatar, put up automatically by
     * onRoomObjectAdded() above when a friend enters the room.
     */
    // AS3: AvatarInfoWidget.as::showUserName()
    public showUserName(userData: IUserData, objectId: number): void
    {
        if(this._avatarNameBubbles.has(userData.name)) return;

        // TS-only: both callers gate on `getFriendNames().indexOf(name) > -1`, so a nametag over
        // one's *own* avatar means the player is in their own friend list — a data fault the AS3
        // would reproduce identically, and one nothing else in the client would ever surface.
        // The bubble is placed by `userId`, not by `objectId`, so the pair is worth seeing too:
        // two bubbles landing on the same avatar means the engine resolved one webId to the
        // other's room object. AS3 has no counterpart; this is a diagnostic, like reportUnlocatable().
        const ownUserId = this.container?.sessionDataManager?.userId ?? -1;

        if(userData.webID === ownUserId)
        {
            log.warn(
                `Name bubble for the player's own avatar ("${userData.name}", webId ${userData.webID}, `
				+ `object ${objectId}): the friend list contains the player themselves.`
            );
        }
        else
        {
            log.debug(`Name bubble for "${userData.name}" (webId ${userData.webID}, object ${objectId})`);
        }

        const view = new UserNameView(this);

        UserNameView.setup(
            view, userData.webID, userData.name, -1, 1, objectId,
            UserNameView.DEFAULT_BG_COLOR, UserNameView.DEFAULT_FADE_DELAY_MS, userData.isBlocked
        );

        this._avatarNameBubbles.set(userData.name, view);
        this.checkUpdateNeed();
    }

    /**
     * The avatar-name bubble shown over a game NPC/player — the end of the chain
     * `SnowWarEngine` -> `RoomUI.showGamePlayerName()` -> `RoomDesktop` -> here.
     */
    // AS3: AvatarInfoWidget.as::showGamePlayerName()
    public showGamePlayerName(objectId: number, name: string, color: number, fadeDelayMs: number): void
    {
        if(this._avatarNameBubbles.has(name)) return;

        const view = new UserNameView(this, true);

        UserNameView.setup(view, objectId, name, objectId, 1, objectId, color, fadeDelayMs);

        this._avatarNameBubbles.set(name, view);
        this.checkUpdateNeed();
    }

    private get container(): IRoomWidgetHandlerContainer | null
    {
        return this.handler?.container ?? null;
    }

    // --- IContextMenuParentWidget ---

    // AS3: AvatarInfoWidget.as::get configuration()
    public get configuration(): IHabboConfigurationManager | null
    {
        return this._config;
    }

    // AS3: AvatarInfoWidget.as::get catalog()
    public get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::get friendList()
    public get friendList(): IHabboFriendList | null
    {
        return this.container?.friendList ?? null;
    }

    // AS3: AvatarInfoWidget.as::removeView()
    // The menu bubbles are cached and only hidden; the per-pet use-product/breed bubbles are
    // one-shot, so they leave their map and are disposed outright.
    public removeView(view: ContextInfoView, animate: boolean): void
    {
        view.hide(animate);

        if(view === this._activeView)
        {
            this._activeView = null;
        }

        if(view instanceof UserNameView)
        {
            this._avatarNameBubbles.delete(view.userName);
            view.dispose();
        }

        if(view instanceof UseProductView)
        {
            this._useProductBubbles.delete(view.userId.toString());
            view.dispose();
        }

        if(view instanceof BreedPetView)
        {
            this._breedPetBubbles.delete(view.userId.toString());
            view.dispose();
        }

        this.checkUpdateNeed();
    }

    // AS3: AvatarInfoWidget.as::close()
    public close(): void
    {
        if(this._activeView) this.removeView(this._activeView, false);
    }

    // --- open flow ---

    // AS3: AvatarInfoWidget.as::selectOwnAvatar()
    // AS3 adaptation: roomEngine.selectAvatar isn't exposed in the port, so we
    // send GET_OBJECT_INFO for the own avatar directly — the InfoStand handler
    // answers with a RWUIUE_OWN_USER event we consume in onUserInfoUpdate.
    public selectOwnAvatar(): void
    {
        const container = this.container;

        if(!container || !container.sessionDataManager) return;

        const userId = container.sessionDataManager.userId;
        const userData = container.roomSession.userDataManager.getUserData(userId);

        if(!userData) return;

        this._ownRoomIndex = userData.roomObjectId;

        container.processWidgetMessage(
            new RoomWidgetRoomObjectMessage(RoomWidgetRoomObjectMessage.GET_OBJECT_INFO, userData.roomObjectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        );
    }

    // AS3: AvatarInfoWidget.as::updateEventHandler (RWUIUE_OWN_USER case) + updateUserView()
    private onUserInfoUpdate = (event: RoomWidgetUserInfoUpdateEvent): void =>
    {
        if(event.type === RoomWidgetUserInfoUpdateEvent.PEER)
        {
            this.updatePeerUserView(event);

            return;
        }

        if(event.type !== RoomWidgetUserInfoUpdateEvent.OWN_USER) return;

        this._data.populate(event);

        // Resolve the own room-object id here too — this event also fires when the
        // user clicks their own avatar directly (not only via selectOwnAvatar), and
        // the bubble needs the id to position itself. Without this, clicking your
        // avatar did nothing until the toolbar me-menu had been opened once.
        const container = this.container;
        const userId = container?.sessionDataManager?.userId ?? -1;
        const userData = userId >= 0 ? (container?.roomSession.userDataManager.getUserData(userId) ?? null) : null;

        if(userData) this._ownRoomIndex = userData.roomObjectId;

        // AS3 runs `updateUserView()`'s prologue before it reaches the own-user arm, so the view
        // already on screen — here, the name bubble the same click raised — comes down first. The
        // room index compared is `_ownRoomIndex` rather than the event's `userRoomId` because that
        // is what `OwnAvatarMenuView.setup()` below installs, and the comparison has to be against
        // the value a second click will find on the view.
        if(!this.prepareUserView(event.webID, event.name, this._ownRoomIndex, this._data.allowNameChange, true)) return;

        // AS3: AvatarInfoWidget.as::updateUserView() — the own-user arm's two substitutions, both
        // *instead of* the me-menu rather than alongside it. Decorate mode has its own floating
        // "done" button and wants nothing else on screen; the room-entry effect shows the new-user
        // hint for as long as it runs.
        if(this.isUserDecorating) return;

        if(RoomEnterEffect.isRunning())
        {
            if(!this._newUserHelpView) this._newUserHelpView = new NewUserHelpView(this);

            this._activeView = this._newUserHelpView;

            NewUserHelpView.setup(this._newUserHelpView, event.webID, event.name, this._ownRoomIndex, 1);

            this.checkUpdateNeed();

            return;
        }

        if(!this._cachedOwnMenu)
        {
            this._cachedOwnMenu = new OwnAvatarMenuView(this);
        }

        this._activeView = this._cachedOwnMenu;

        OwnAvatarMenuView.setup(this._cachedOwnMenu, event.webID, event.name, this._ownRoomIndex, 1, this._data);

        this.checkUpdateNeed();
    };

    /**
     * The me-menu's non-simple route: the toolbar handler hands the player's own identity straight
     * over rather than going through the info-stand round trip.
     *
     * `allowNameChange` reroutes it: AS3 flips `useMinimizedOwnAvatarMenu` on and calls
     * `selectOwnAvatar()`, so the name-change page of the own menu is what opens instead. And
     * `_ownAvatarInfoSeen` is set at the end either way — it is what stops the user-data-update
     * case below from asking again on every subsequent list change.
     */
    // AS3: AvatarInfoWidget.as::updateEventHandler() — case "RWAIE_AVATAR_INFO"
    private onAvatarInfo = (event: RoomWidgetAvatarInfoEvent): void =>
    {
        this._openedFromMemenu = !this._ownAvatarInfoSeen
            && this.container?.roomSession != null
            && event.roomIndex === this.container.roomSession.ownUserRoomId;

        if(event.allowNameChange)
        {
            this.useMinimizedOwnAvatarMenu = true;
            this.selectOwnAvatar();
        }
        else
        {
            this.showContextInfoButton(event);
        }

        this._ownAvatarInfoSeen = true;
    };

    /**
     * AS3: AvatarInfoWidget.as::updateUserView() — the `data == null` arm.
     *
     * With no `AvatarInfoData` there is no menu to build, so AS3 puts up the small
     * `AvatarContextInfoButtonView` instead: a name bubble that opens the real menu when clicked.
     * That is the classic two-step me-menu, and it is the *normal* path for a hotel with
     * `simple.memenu.enabled` off — `allowNameChange` is the exception, not this.
     *
     * The bubble is auto-hiding for anyone else and sticky for yourself, and the first time it is
     * yours it also arms the client's "avatar" hint. The five-second timer that takes the highlight
     * back down is skipped for a new player, who is being walked through the UI anyway.
     */
    // AS3: AvatarInfoWidget.as::updateUserView()
    private showContextInfoButton(event: RoomWidgetAvatarInfoEvent): void
    {
        const container = this.container;

        // `showAvatarContextMenu` is AS3's `data != null`, and this is the arm where it is false:
        // the first guard (drop a non-menu view) is skipped, the rest still runs. AS3 checks
        // `isDecorateMode` on the branch itself, after the prologue, so the order below is its own.
        if(!this.prepareUserView(event.userId, event.userName, event.roomIndex, event.allowNameChange, false)) return;

        if(container?.roomEngine?.isDecorateMode ?? false) return;

        if(!this._contextInfoButtonView) this._contextInfoButtonView = new AvatarContextInfoButtonView(this);

        this._activeView = this._contextInfoButtonView;

        const blocked = container?.sessionDataManager?.isBlocked(event.userId) ?? false;
        const isOwnUser = (container?.sessionDataManager?.userId ?? -1) === event.userId;

        AvatarContextInfoButtonView.setupButtonView(
            this._contextInfoButtonView, event.userId, event.userName, event.roomIndex, event.userType,
            event.allowNameChange, !isOwnUser, blocked
        );

        if(!isOwnUser || !this._openedFromMemenu) return;

        const window = this._contextInfoButtonView.window;

        if(window !== null)
        {
            this.windowManager.registerHintWindow('avatar', window);
            this.windowManager.showHint('avatar');
        }

        if(!(container?.sessionDataManager?.isNoob ?? false)) this.setAvatarHighlightTimer();
    }

    /**
     * Five seconds, then the hint comes down. AS3 uses a Flash `Timer`; a timeout is the same thing
     * for a one-shot, and `removeAvatarHighlightTimer()` is idempotent either way.
     */
    // AS3: AvatarInfoWidget.as::setAvatarHightlightTimer()
    private setAvatarHighlightTimer(): void
    {
        this.removeAvatarHighlightTimer();

        this._avatarHighlightTimer = setTimeout(() => this.removeAvatarHighlightTimer(), 5000);
    }

    // AS3: AvatarInfoWidget.as::removeAvatarHighlightTimer()
    private removeAvatarHighlightTimer(): void
    {
        this._openedFromMemenu = false;

        this.windowManager.unregisterHintWindow('avatar');

        if(this._avatarHighlightTimer === null) return;

        clearTimeout(this._avatarHighlightTimer);
        this._avatarHighlightTimer = null;
    }

    /** Asks once, the first time the room's user list settles — and never again. */
    // AS3: AvatarInfoWidget.as::updateEventHandler() — case "rwudue_user_data_updated"
    private onUserDataUpdated = (): void =>
    {
        if(this._ownAvatarInfoSeen) return;

        this.messageListener?.processWidgetMessage(
            new RoomWidgetRoomObjectMessage(RoomWidgetRoomObjectMessage.GET_OWN_CHARACTER_INFO, 0, 0)
        );
    };

    /** The breed-result view offers "place in room" per pet, and that depends on the inventory. */
    // AS3: AvatarInfoWidget.as::updateEventHandler() — case "RWIUM_INVENTORY_UPDATED"
    private onInventoryUpdated = (): void =>
    {
        this._breedPetsResultView?.updatePlacingButtons();
    };

    /**
     * AS3: AvatarInfoWidget.as::updateUserView() — the `else` arm, for somebody who is not you.
     *
     * Two details that are AS3's and look like oversights:
     *
     * - **spectator mode hands `null` data through**, and `showAvatarContextMenu` is exactly
     *   `data != null` — so a spectator gets no menu at all, not a menu with everything greyed out.
     * - **the name bubble for this avatar is dropped**, if one is up. Clicking a friend replaces
     *   their floating name with the full menu rather than stacking the two.
     *
     * The build itself is deferred through `_buttonsSetup`, as the pet path already is: a wired
     * handler gets first refusal on the click, and `maybeSetupMenuView()` runs it if nothing took it.
     */
    /**
	 * The head of AS3's `updateUserView()`, before it branches on who was clicked.
	 *
	 * AS3 has one method for all three outcomes — the own menu, a peer's menu, and the plain
	 * `AvatarContextInfoButtonView` name bubble — so this prologue runs for every one of them: it
	 * takes down whatever is currently on screen before the caller puts something else up. This
	 * port split that method into three entry points and copied the prologue into only one of
	 * them, so clicking your own avatar installed the me-menu on top of the name bubble the click
	 * had just raised, and the bubble stayed there with nothing left holding a reference to it.
	 *
	 * Returns whether the caller should go on to install a view. False means AS3's `else` arm
	 * already did the work — the same menu was open for the same user, so the click closes it —
	 * or the room is in game mode, where no view opens at all.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::updateUserView()
    private prepareUserView(
        userId: number,
        userName: string,
        roomIndex: number,
        allowNameChange: boolean,
        showAvatarContextMenu: boolean
    ): boolean
    {
        // A view that is not one of the five context menus is in the way and goes first.
        if(showAvatarContextMenu
            && this._activeView
            && !(this._activeView instanceof AvatarMenuView
                || this._activeView instanceof OwnAvatarMenuView
                || this._activeView instanceof PetMenuView
                || this._activeView instanceof OwnPetMenuView
                || this._activeView instanceof RentableBotMenuView))
        {
            this.removeView(this._activeView, false);
        }

        this.removeUseProductViews();

        // AS3 re-opens on any mismatch, and `allowNameChange` forces it even on a match.
        if(this._activeView === null
            || this._activeView.userId !== userId
            || this._activeView.userName !== userName
            || this._activeView.roomIndex !== roomIndex
            || this._activeView.userType !== 1
            || allowNameChange)
        {
            // `removeView()` clears `_activeView` when it is the one going, exactly as AS3's does,
            // which is what lets the caller install into a clean slot.
            if(this._activeView) this.removeView(this._activeView, false);

            return !this.isGameMode();
        }

        // Everything matched: a second click on the avatar whose menu is already open closes it.
        if((this._activeView instanceof AvatarMenuView || this._activeView instanceof OwnAvatarMenuView)
            && this._activeView.userName === userName)
        {
            this.removeView(this._activeView, false);
        }

        return false;
    }

    // AS3: AvatarInfoWidget.as::updateUserView()
    private updatePeerUserView(event: RoomWidgetUserInfoUpdateEvent): void
    {
        this._data.populate(event);

        if(event.isSpectatorMode) return;

        const userId = event.webID;
        const userName = event.name;
        const roomIndex = event.userRoomId;
        const data = this._data;

        if(!this.prepareUserView(userId, userName, roomIndex, data.allowNameChange, true)) return;

        this._pendingMenuRoomIndex = roomIndex;

        if(!this._cachedAvatarMenu) this._cachedAvatarMenu = new AvatarMenuView(this);

        this._buttonsSetup = (): void =>
        {
            const view = this._cachedAvatarMenu;

            if(!view) return;

            this._activeView = view;
            AvatarMenuView.setup(view, userId, userName, roomIndex, event.userType, data);
        };

        for(const [name, bubble] of this._avatarNameBubbles)
        {
            if(bubble.userId !== userId) continue;

            this.removeView(bubble, false);
            this._avatarNameBubbles.delete(name);

            break;
        }

        this.maybeSetupMenuView(roomIndex);
    }

    // AS3: AvatarInfoWidget.as::updateEventHandler (RWROUE_OBJECT_DESELECTED case)
    // — the bubble is dismissed when the avatar/selection is deselected, which the
    // room engine now emits for an unhandled (floor/empty-space) click.
    private onObjectDeselected = (): void =>
    {
        this.close();
        this.removeUseProductViews();
        this.removeBreedPetViews();
    };

    /**
     * Clicking a furni closes whatever this widget has open.
     *
     * The infostand raises `RWFIUE_FURNI` for the furni it is about to describe; deselection does
     * not fire in that case, because a furni click *is* a selection. Without this arm an avatar
     * bubble stayed up next to the furni's infostand, still offering to trade with someone the
     * player had stopped pointing at.
     */
    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWFIUE_FURNI case)
    private onFurniInfoUpdate = (): void =>
    {
        this.close();
        this.removeUseProductViews();
        this.removeBreedPetViews();
    };

    /**
     * The answer to the `GET_OBJECT_NAME` the roll-over above asks for: the room replies with the
     * object's name and this raises the tag.
     *
     * Without it the request went out and nothing consumed the reply, which is the other half of
     * why hovering showed nothing. AS3 restricts it to users (category 100); furni names come back
     * on the same event and are the infostand's business, not the bubble's.
     */
    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWONE_TYPE case)
    private onObjectName = (event: RoomWidgetRoomObjectNameEvent): void =>
    {
        if(event.category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) return;

        // AS3 passes `false` for allowNameChange and `null` for the user data: a hover raises the
        // name only, never the context menu that a click raises.
        this.prepareUserView(event.userId, event.userName, event.roomIndex, false, false);
    };

    /**
     * Whether a menu is open on the bubble, in which case hovering another object must not
     * disturb it.
     *
     * AS3 spells this as five `is` tests; it is the same list, and it is the reason a hover does
     * not steal the bubble from an open avatar or pet menu.
     */
    // AS3: AvatarInfoWidget.as::updateEventHandler() (the shared guard of both roll arms)
    private hasMenuView(): boolean
    {
        return this._activeView instanceof AvatarMenuView
            || this._activeView instanceof OwnAvatarMenuView
            || this._activeView instanceof OwnPetMenuView
            || this._activeView instanceof NewUserHelpView
            || this._activeView instanceof RentableBotMenuView;
    }

    /**
     * The pointer entered an object: ask the room for its name, which comes back as
     * `RoomWidgetRoomObjectNameEvent` and raises the small name tag.
     *
     * Neither this nor its roll-out counterpart was ported, and the desktop never translated
     * `REOE_MOUSE_ENTER` either, so hovering a user or a furni showed nothing at all.
     */
    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWROUE_OBJECT_ROLL_OVER case)
    private onObjectRollOver = (event: RoomWidgetRoomObjectUpdateEvent): void =>
    {
        if(this._openedFromMemenu || this.hasMenuView()) return;

        this._rolledOverObjectId = event.id;

        this.messageListener?.processWidgetMessage(
            new RoomWidgetRoomObjectMessage(
                RoomWidgetRoomObjectMessage.GET_OBJECT_NAME,
                event.id,
                event.category
            )
        );
    };

    /**
     * The pointer left: dismiss the name, but only the one this hover raised, and only while the
     * view is not the own-avatar one whose name is editable.
     */
    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWROUE_OBJECT_ROLL_OUT case)
    private onObjectRollOut = (event: RoomWidgetRoomObjectUpdateEvent): void =>
    {
        if(this._openedFromMemenu || this.hasMenuView()) return;

        if(event.id !== this._rolledOverObjectId) return;

        if(this._activeView !== null && !this._activeView.allowNameChange)
        {
            this.removeView(this._activeView, false);
            this._rolledOverObjectId = -1;
        }
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWROUE_OBJECT_SELECTED case)
    // Selecting a unit re-arms pet-info handling, which RWUAM_REQUEST_PET_UPDATE turned off so
    // the infostand's own refresh would not re-open the bubble. Without this the bubble stops
    // opening for the rest of the session after the first refresh.
    private onObjectSelected = (event: RoomWidgetRoomObjectUpdateEvent): void =>
    {
        if(event.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) this._handlePetInfo = true;

        this.removeBreedPetViews();
    };

    // AS3: AvatarInfoWidget.as::onEffectsChanged()
    private onEffectsChanged = (): void =>
    {
        if(this._activeView instanceof OwnAvatarMenuView) this._activeView.updateButtons();
    };

    // --- pets ---

    // AS3: AvatarInfoWidget.as::set handlePetInfo()
    // Cleared by the RWUAM_REQUEST_PET_UPDATE action so the refresh the infostand asks for
    // does not re-open the bubble; RWROUE_OBJECT_SELECTED sets it back.
    public set handlePetInfo(value: boolean)
    {
        this._handlePetInfo = value;
    }

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWPIUE_PET_INFO case)
    private onPetInfoUpdate = (event: RoomWidgetPetInfoUpdateEvent): void =>
    {
        if(!this._handlePetInfo) return;

        this._petData.populate(event);
        this.updatePetView(event.id, event.name, event.roomIndex, this._petData);
        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWPIUE_PET_STATUS_UPDATE case)
    // The bubble's buttons are decided at setup time, so a status change closes it rather
    // than re-rendering — the next click rebuilds it from the fresh data.
    private onPetStatusUpdate = (event: RoomWidgetPetStatusUpdateEvent): void =>
    {
        if(this._activeView instanceof OwnPetMenuView) this.closeIfSamePet(event.petId);

        this.removeBreedPetViewsWithId(event.petId);
        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWPLUE_PET_LEVEL_UPDATE case)
    private onPetLevelUpdate = (event: RoomWidgetPetLevelUpdateEvent): void =>
    {
        if(this._activeView instanceof OwnPetMenuView) this.closeIfSamePet(event.petId);

        this.removeBreedPetViewsWithId(event.petId);
        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() — the shared body of the two cases above.
    // The event carries the pet's *room index*; the open bubble is keyed on its webID.
    private closeIfSamePet(roomIndex: number): void
    {
        const userData = this.container?.roomSession.userDataManager.getUserDataByIndex(roomIndex) ?? null;

        if(userData && userData.webID === this._petData.id && this._activeView)
        {
            this.removeView(this._activeView, true);
        }
    }

    // AS3: AvatarInfoWidget.as::updatePetView()
    private updatePetView(petId: number, userName: string, roomIndex: number, petData: PetInfoData): void
    {
        if(!petData) return;

        const active = this._activeView;

        if(active && !(active instanceof OwnAvatarMenuView || active instanceof PetMenuView || active instanceof OwnPetMenuView))
        {
            this.removeView(active, false);
        }

        if(!this._activeView
            || this._activeView.userId !== petId
            || this._activeView.userName !== userName
            || this._activeView.roomIndex !== roomIndex
            || this._activeView.userType !== AvatarInfoWidget.USER_TYPE_PET)
        {
            if(this._activeView) this.removeView(this._activeView, false);

            if(this.isGameMode()) return;

            this._pendingMenuRoomIndex = roomIndex;

            if(petData.isOwnPet)
            {
                if(!this._cachedOwnPetMenu) this._cachedOwnPetMenu = new OwnPetMenuView(this, this._catalog);

                this._buttonsSetup = (): void =>
                {
                    const view = this._cachedOwnPetMenu;

                    if(!view) return;

                    this._activeView = view;
                    OwnPetMenuView.setup(view, petId, userName, roomIndex, AvatarInfoWidget.USER_TYPE_PET, petData);
                };
            }
            else
            {
                if(!this._cachedPetMenu) this._cachedPetMenu = new PetMenuView(this);

                this._buttonsSetup = (): void =>
                {
                    const view = this._cachedPetMenu;

                    if(!view) return;

                    this._activeView = view;
                    PetMenuView.setup(view, petId, userName, roomIndex, AvatarInfoWidget.USER_TYPE_PET, petData);
                };
            }

            this.maybeSetupMenuView(roomIndex);
        }
        else if(this._activeView instanceof OwnAvatarMenuView && this._activeView.userName === userName)
        {
            this.removeView(this._activeView, false);
        }
    }

    /**
     * AS3: AvatarInfoWidget.as::updateEventHandler() (RWRBIUE_RENTABLE_BOT case)
     *
     * The click panel's info event also drives the bubble. The skill list is not on it — AS3 reads
     * the last one seen off the room session's user data (`getRentableBotUserData().botSkillData`),
     * which is what `BotSkillListUpdate` fills in.
     */
    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWRBIUE_RENTABLE_BOT case)
    private onRentableBotInfoUpdate = (event: RoomWidgetRentableBotInfoUpdateEvent): void =>
    {
        if(this._rentableBotData === null) this._rentableBotData = new RentableBotInfoData();

        this._rentableBotData.populate(event);

        const roomId = this.container?.roomEngine?.activeRoomId ?? -1;
        const session = this.container?.roomSessionManager?.getSession(roomId) ?? null;

        if(session === null) return;

        const userData = session.userDataManager.getRentableBotUserData(event.webID);

        if(userData === null) return;

        const skills = userData.botSkillData;

        this._botSkillsByBotId.set(event.webID, skills);

        if(skills.length > 0) this._rentableBotData.cloneAndSetSkillsWithCommands(skills);

        this.updateRentableBotView(
            event.webID, event.name, event.userRoomId, this._rentableBotData
        );
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWRBSLUE_SKILL_LIST case)
    // `keepClosed` is true here: a skill list arriving on its own refreshes an open bubble but must
    // not pop one open.
    private onRentableBotSkillListUpdate = (event: RoomWidgetRentableBotSkillListUpdateEvent): void =>
    {
        this._botSkillsByBotId.set(event.botId, event.botSkillsWithCommands);

        const data = this._rentableBotData;

        if(data === null) return;

        data.cloneAndSetSkillsWithCommands(event.botSkillsWithCommands);
        this.updateRentableBotView(data.id, data.name, data.roomIndex, data, true);
    };

    /**
     * AS3: AvatarInfoWidget.as::updateEventHandler() (RWRBFOCME_OPEN case)
     *
     * With a bot already selected the bubble is simply forced open. Without one, the panel has
     * never been asked for this bot, so the request goes the long way round: ask for the object
     * info and select the avatar, which brings the info event back through the case above.
     */
    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWRBFOCME_OPEN case)
    private onRentableBotForceOpenContextMenu = (event: RoomWidgetRentableBotForceOpenContextMenuEvent): void =>
    {
        const data = this._rentableBotData;

        if(data !== null)
        {
            this.updateRentableBotView(data.id, data.name, data.roomIndex, data, false, true);

            return;
        }

        const roomId = this.container?.roomEngine?.activeRoomId ?? -1;
        const session = this.container?.roomSessionManager?.getSession(roomId) ?? null;
        const userData = session?.userDataManager.getUserDataByType(event.botId, AvatarInfoWidget.USER_TYPE_RENTABLE_BOT) ?? null;

        if(userData === null) return;

        this.messageListener?.processWidgetMessage(
            new RoomWidgetRoomObjectMessage(
                RoomWidgetRoomObjectMessage.GET_OBJECT_INFO,
                userData.roomObjectId,
                RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
            )
        );

        // The object-info message above is what fills the panel; this is the room-side half —
        // it highlights the bot and drops the selection arrow onto it.
        this.container?.roomEngine?.selectAvatar(roomId, userData.roomObjectId);
    };

    /**
     * AS3: AvatarInfoWidget.as::updateRentableBotView()
     *
     * The pet-view sibling, with three differences that all come from the AS3: the bubble is gated
     * on the `menu.bot.enabled` config; `keepClosed` suppresses opening a bubble that is not
     * already up (the skill-list path); and `forceOpen` overrides both.
     */
    // AS3: AvatarInfoWidget.as::updateRentableBotView()
    private updateRentableBotView(
        botId: number,
        userName: string,
        roomIndex: number,
        data: RentableBotInfoData | null,
        keepClosed: boolean = false,
        forceOpen: boolean = false
    ): void
    {
        if(data === null) return;

        const showBotContextMenu = this._config?.getBoolean('menu.bot.enabled') ?? false;
        const doNotOpen = forceOpen ? false : keepClosed && this._activeView === null;
        const active = this._activeView;

        if(showBotContextMenu
            && active
            && !(active instanceof OwnAvatarMenuView
                || active instanceof PetMenuView
                || active instanceof OwnPetMenuView
                || active instanceof RentableBotMenuView))
        {
            this.removeView(active, false);
        }

        this.removeUseProductViews();

        const current = this._activeView;
        const isSameBubble = current !== null
            && current.userId === botId
            && current.userName === userName
            && current.roomIndex === roomIndex
            && current.userType === AvatarInfoWidget.USER_TYPE_RENTABLE_BOT;

        // AS3's condition verbatim: a click on the bot already showing (and not keepClosed) rebuilds
        // the bubble, which is what makes a second click on the same bot close it below.
        if(forceOpen
            || (current !== null && current.userId === botId && !keepClosed)
            || current === null
            || !isSameBubble)
        {
            if(current !== null) this.removeView(current, false);

            if(this.isGameMode()) return;

            if(!this._cachedRentableBotMenu) this._cachedRentableBotMenu = new RentableBotMenuView(this);

            if(doNotOpen) return;

            this._pendingMenuRoomIndex = roomIndex;

            this._buttonsSetup = (): void =>
            {
                const view = this._cachedRentableBotMenu;

                if(!view) return;

                this._activeView = view;
                RentableBotMenuView.setup(view, botId, userName, roomIndex, AvatarInfoWidget.USER_TYPE_RENTABLE_BOT, data);
            };

            this.maybeSetupMenuView(roomIndex);
        }
        else if(current instanceof RentableBotMenuView && current.userName === userName)
        {
            this.removeView(current, false);
        }
    }

    /**
     * AS3: AvatarInfoWidget.as::openBotSkillConfigurationView()
     *
     * Only two skills have an editor; anything else returns without opening one, which is why the
     * AS3 switch has a `default: return`.
     */
    // AS3: AvatarInfoWidget.as::openBotSkillConfigurationView()
    public openBotSkillConfigurationView(botId: number, skillType: number, position: {x: number; y: number} | null = null): void
    {
        if(!this._botSkillConfigurationViews.has(skillType))
        {
            switch(skillType)
            {
                case BotSkillEnum.CHATTER_MARKOV:
                    this._botSkillConfigurationViews.set(skillType, new BotChatterMarkovConfiguration(this));
                    break;
                case BotSkillEnum.CHANGE_NAME:
                    this._botSkillConfigurationViews.set(skillType, new BotChangeNameConfiguration(this));
                    break;
                default:
                    return;
            }
        }

        this._botSkillConfigurationViews.get(skillType)?.open(botId, position);
    }

    // AS3: AvatarInfoWidget.as::maybeSetupMenuView()
    // A room whose wired handles user clicks decides whether the menu opens: the click goes to
    // the server first, and only the WIRED_USER_CLICK_HANDLED reply below says whether the menu
    // may still open. With no wired on the click, the menu opens immediately.
    private maybeSetupMenuView(roomIndex: number): void
    {
        if(this.container?.userDefinedRoomEvents?.hasClickUserWired() ?? false) return;

        this.setupMenuView(roomIndex);
    }

    // AS3: AvatarInfoWidget.as::onUserClickHandledEvent()
    private onUserClickHandledEvent = (event: WiredUserClickHandledEvent): void =>
    {
        if(this.disposed || !event.openMenu || this._buttonsSetup === null) return;

        this.setupMenuView(event.index);
        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::setupMenuView()
    private setupMenuView(roomIndex: number): void
    {
        if(this._pendingMenuRoomIndex === roomIndex && this._buttonsSetup !== null)
        {
            this._buttonsSetup();
            this._pendingMenuRoomIndex = -1;
            this._buttonsSetup = null;
        }
    }

    // AS3: AvatarInfoWidget.as::isGameMode()
    private isGameMode(): boolean
    {
        return this.container?.roomEngine?.getActiveRoomIsPlayingGame() ?? false;
    }

    // --- use-product / breed-with bubbles ---

    // AS3: AvatarInfoWidget.as::showUseProductMenuForItems()
    public showUseProductMenuForItems(items: UseProductItem[]): void
    {
        this.removeUseProductViews();
        this.removeUseProductConfirmationView();
        this.removeBreedMonsterPlantsConfirmationView();

        const userDataManager = this.container?.roomSession.userDataManager ?? null;

        for(const item of items)
        {
            const userData = userDataManager?.getUserDataByIndex(item.id) ?? null;

            if(userData) this.showUseProductMenu(userData, item);
        }
    }

    // AS3: AvatarInfoWidget.as::showBreedPetMenuForItems()
    public showBreedPetMenuForItems(items: UseProductItem[]): void
    {
        this.removeBreedPetViews();
        this.removeUseProductConfirmationView();
        this.removeBreedMonsterPlantsConfirmationView();

        const userDataManager = this.container?.roomSession.userDataManager ?? null;

        for(const item of items)
        {
            const userData = userDataManager?.getUserDataByIndex(item.id) ?? null;

            if(userData) this.showBreedPetMenu(userData, item);
        }
    }

    // AS3: AvatarInfoWidget.as::showUseProductMenu()
    private showUseProductMenu(userData: IUserData, item: UseProductItem): void
    {
        const key = userData.webID.toString();

        if(this._useProductBubbles.has(key)) return;

        const view = new UseProductView(this);

        UseProductView.setup(view, userData.webID, userData.name, -1, AvatarInfoWidget.USER_TYPE_PET, item);
        this._useProductBubbles.set(key, view);
        this.checkUpdateNeed();
    }

    // AS3: AvatarInfoWidget.as::showBreedPetMenu()
    private showBreedPetMenu(userData: IUserData, item: UseProductItem): void
    {
        const key = userData.webID.toString();

        if(this._breedPetBubbles.has(key)) return;

        const view = new BreedPetView(this);

        BreedPetView.setup(view, userData.webID, userData.name, -1, AvatarInfoWidget.USER_TYPE_PET, item, userData.canBreed);
        this._breedPetBubbles.set(key, view);
        this.checkUpdateNeed();
    }

    // AS3: AvatarInfoWidget.as::removeUseProductViews()
    public removeUseProductViews(): void
    {
        for(const view of this._useProductBubbles.values()) view.dispose();

        this._useProductBubbles.clear();
        this.checkUpdateNeed();
    }

    // AS3: AvatarInfoWidget.as::removeBreedPetViews()
    public removeBreedPetViews(): void
    {
        for(const view of this._breedPetBubbles.values()) view.dispose();

        this._breedPetBubbles.clear();
        this.checkUpdateNeed();
    }

    // AS3: AvatarInfoWidget.as::removeBreedPetViewsWithId()
    // Both the bubble's own pet and the pet that raised the round are matched, so a status
    // change on either end clears the offer.
    private removeBreedPetViewsWithId(objectId: number): void
    {
        const doomed: BreedPetView[] = [];

        for(const view of this._breedPetBubbles.values())
        {
            if(view.objectId === objectId || view.requestRoomObjectId === objectId) doomed.push(view);
        }

        for(const view of doomed) this.removeView(view, false);
    }

    // --- breeding ---

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWPPBE_PET_BREEDING_ case)
    private onPetBreeding = (event: RoomWidgetPetBreedingEvent): void =>
    {
        const requestObjectId = this.findPetRoomObjectIdByWebId(event.ownPetId);
        const targetObjectId = this.findPetRoomObjectIdByWebId(event.otherPetId);

        switch(event.state)
        {
            case RoomWidgetPetBreedingEvent.TYPE_START:
                this.showBreedMonsterPlantsConfirmationView(requestObjectId, targetObjectId, false);
                break;
            case RoomWidgetPetBreedingEvent.TYPE_CANCEL:
                this.cancelBreedingPets(requestObjectId, targetObjectId);
                break;
            case RoomWidgetPetBreedingEvent.TYPE_ACCEPT:
                this.acceptBreedingPets(requestObjectId, targetObjectId);
                break;
            case RoomWidgetPetBreedingEvent.TYPE_REQUEST:
                this.showBreedMonsterPlantsConfirmationView(requestObjectId, targetObjectId, true);
                break;
        }

        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWPBRE_PET_BREEDING_RESULT case)
    private onPetBreedingResult = (event: RoomWidgetPetBreedingResultEvent): void =>
    {
        const first = new BreedPetsResultData();

        first.stuffId = event.resultData.stuffId;
        first.classId = event.resultData.classId;
        first.productCode = event.resultData.productCode;
        first.userId = event.resultData.userId;
        first.userName = event.resultData.userName;
        first.rarityLevel = event.resultData.rarityLevel;
        first.hasMutation = event.resultData.hasMutation;

        const second = new BreedPetsResultData();

        second.stuffId = event.resultData2.stuffId;
        second.classId = event.resultData2.classId;
        second.productCode = event.resultData2.productCode;
        second.userId = event.resultData2.userId;
        second.userName = event.resultData2.userName;
        second.rarityLevel = event.resultData2.rarityLevel;
        second.hasMutation = event.resultData2.hasMutation;

        this.showBreedPetsResultView(first, second);
        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWPPBE_CONFIRM_PET_BREEDING_ case)
    private onConfirmPetBreeding = (event: RoomWidgetConfirmPetBreedingEvent): void =>
    {
        this.showConfirmPetBreedingView(event.pet1, event.pet2, event.nestId, event.rarityCategories, event.resultPetTypeId);
        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWPPBE_CONFIRM_PET_BREEDING_RESULT case)
    private onConfirmPetBreedingResult = (event: RoomWidgetConfirmPetBreedingResultEvent): void =>
    {
        switch(event.result)
        {
            case RoomWidgetConfirmPetBreedingResultEvent.SUCCESS:
                this.removeConfirmPetBreedingView();
                break;
            case RoomWidgetConfirmPetBreedingResultEvent.NO_NEST_FOUND:
                this.windowManager.simpleAlert(
                    '${breedpets.confirmation.alert.title}',
                    '${breedpets.confirmation.alert.nonest.head}',
                    '${breedpets.confirmation.alert.nonest.desc}'
                );
                this.removeConfirmPetBreedingView();
                break;
            case RoomWidgetConfirmPetBreedingResultEvent.PETS_MISSING:
                this.windowManager.simpleAlert(
                    '${breedpets.confirmation.alert.title}',
                    '${breedpets.confirmation.alert.petsmissing.head}',
                    '${breedpets.confirmation.alert.petsmissing.desc}'
                );
                this.removeConfirmPetBreedingView();
                break;
            case RoomWidgetConfirmPetBreedingResultEvent.INVALID_NAME:
                // The dialog stays up so the name can be corrected.
                this.windowManager.simpleAlert(
                    '${breedpets.confirmation.alert.title}',
                    '${breedpets.confirmation.alert.name.invalid.head}',
                    '${breedpets.confirmation.alert.name.invalid.desc}'
                );
                this._confirmPetBreedingView?.enable();
                break;
        }

        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::updateEventHandler() (RWROUE_FURNI_ADDED case)
    // The result dialog's place/pick pair depends on where the seed currently is.
    private onFurniAdded = (event: RoomWidgetRoomObjectUpdateEvent): void =>
    {
        if(event.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        {
            this._breedPetsResultView?.roomObjectAdded(event.id);
        }
    };

    // AS3: AvatarInfoWidget.as::findPetRoomObjectIdByWebId()
    private findPetRoomObjectIdByWebId(webId: number): number
    {
        const container = this.container;

        if(!container?.roomEngine) return -1;

        const roomId = container.roomSession.roomId;
        const count = container.roomEngine.getRoomObjectCount(roomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

        for(let i = 0; i < count; i++)
        {
            const object = container.roomEngine.getRoomObjectWithIndex(roomId, i, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

            if(!object) continue;

            const userData = container.roomSession.userDataManager.getUserDataByIndex(object.getId());

            if(userData && userData.type === AvatarInfoWidget.USER_TYPE_PET && userData.webID === webId) return object.getId();
        }

        return -1;
    }

    // AS3: AvatarInfoWidget.as::showUseProductConfirmation()
    public showUseProductConfirmation(objectId: number, targetRoomObjectId: number, inventoryStripId: number): void
    {
        if(!this._useProductConfirmationView)
        {
            this._useProductConfirmationView = new UseProductConfirmationView(this);
        }

        this._useProductConfirmationView.open(objectId, targetRoomObjectId, inventoryStripId);
    }

    // AS3: AvatarInfoWidget.as::removeUseProductConfirmationView()
    private removeUseProductConfirmationView(): void
    {
        this._useProductConfirmationView?.dispose();
        this._useProductConfirmationView = null;
    }

    // AS3: AvatarInfoWidget.as::showBreedingPetsWaitingConfirmationAlert()
    public showBreedingPetsWaitingConfirmationAlert(requestObjectId: number, targetObjectId: number): void
    {
        this.removeBreedingPetsWaitingConfirmationAlert();

        this._breedingConfirmationAlert = this.windowManager.confirm(
            '${breedpets.confirmation.notification.title}',
            '${breedpets.confirmation.notification.text}',
            0,
            this.onWaitingConfirmationAlert
        );

        this._breedingAlertRequestObjectId = requestObjectId;
        this._breedingAlertTargetObjectId = targetObjectId;
    }

    // AS3: AvatarInfoWidget.as::onWaitingConfirmationAlert()
    // Cancelling the wait cancels the breeding request itself; WE_OK just closes the alert.
    public onWaitingConfirmationAlert = (_dialog: IDisposable, event: WindowEvent): void =>
    {
        if(event.type === 'WE_CANCEL' && this._breedingAlertTargetObjectId !== -1)
        {
            this.cancelBreedPets(this._breedingAlertRequestObjectId, this._breedingAlertTargetObjectId);
        }

        this.removeBreedingPetsWaitingConfirmationAlert();
    };

    // AS3: AvatarInfoWidget.as::removeBreedingPetsWaitingConfirmationAlert()
    private removeBreedingPetsWaitingConfirmationAlert(): void
    {
        if(this._breedingConfirmationAlert)
        {
            this._breedingConfirmationAlert.dispose();
            this._breedingConfirmationAlert = null;
            this._breedingAlertRequestObjectId = -1;
            this._breedingAlertTargetObjectId = -1;
        }
    }

    // AS3: AvatarInfoWidget.as::acceptBreedingPets()
    public acceptBreedingPets(requestObjectId: number, targetObjectId: number): void
    {
        if(this._breedMonsterPlantsConfirmationView
            && this._breedMonsterPlantsConfirmationView.requestRoomObjectId === requestObjectId
            && this._breedMonsterPlantsConfirmationView.targetRoomObjectId === targetObjectId)
        {
            this.removeBreedMonsterPlantsConfirmationView();
        }

        this._breedingConfirmationAlert?.dispose();
    }

    // AS3: AvatarInfoWidget.as::cancelBreedingPets()
    public cancelBreedingPets(requestObjectId: number, targetObjectId: number): void
    {
        if(this._breedMonsterPlantsConfirmationView
            && this._breedMonsterPlantsConfirmationView.requestRoomObjectId === requestObjectId
            && this._breedMonsterPlantsConfirmationView.targetRoomObjectId === targetObjectId)
        {
            this.removeBreedMonsterPlantsConfirmationView();
        }

        this.removeBreedingPetsWaitingConfirmationAlert();
        this.windowManager.alert(
            '${breedpets.cancel.notification.title}',
            '${breedpets.cancel.notification.text}',
            0,
            this.onBreedingAlert
        );
    }

    // AS3: AvatarInfoWidget.as::onBreedingAlert()
    public onBreedingAlert = (dialog: IDisposable, event: WindowEvent): void =>
    {
        if(event.type === 'WE_OK' || event.type === 'WE_CANCEL') dialog.dispose();
    };

    // AS3: AvatarInfoWidget.as::showBreedMonsterPlantsConfirmationView()
    public showBreedMonsterPlantsConfirmationView(requestObjectId: number, targetObjectId: number, requested: boolean): void
    {
        if(!this._breedMonsterPlantsConfirmationView)
        {
            this._breedMonsterPlantsConfirmationView = new BreedMonsterPlantsConfirmationView(this);
        }

        this._breedMonsterPlantsConfirmationView.open(requestObjectId, targetObjectId, requested);
    }

    // AS3: AvatarInfoWidget.as::showConfirmPetBreedingView()
    public showConfirmPetBreedingView(
        pet1: ConfirmPetBreedingPetData,
        pet2: ConfirmPetBreedingPetData,
        nestId: number,
        rarityCategories: BreedingRarityCategoryData[],
        resultPetTypeId: number
    ): void
    {
        if(!this._confirmPetBreedingView)
        {
            this._confirmPetBreedingView = new ConfirmPetBreedingView(this);
        }

        const requestObjectId = this.findPetRoomObjectIdByWebId(pet1.webId);
        const targetObjectId = this.findPetRoomObjectIdByWebId(pet2.webId);

        this._confirmPetBreedingView.open(
            requestObjectId, targetObjectId, nestId, rarityCategories, resultPetTypeId, pet1.level, pet2.level
        );
    }

    // AS3: AvatarInfoWidget.as::removeBreedMonsterPlantsConfirmationView()
    private removeBreedMonsterPlantsConfirmationView(): void
    {
        this._breedMonsterPlantsConfirmationView?.dispose();
        this._breedMonsterPlantsConfirmationView = null;
    }

    // AS3: AvatarInfoWidget.as::removeConfirmPetBreedingView()
    private removeConfirmPetBreedingView(): void
    {
        this._confirmPetBreedingView?.dispose();
        this._confirmPetBreedingView = null;
    }

    // AS3: AvatarInfoWidget.as::showBreedPetsResultView()
    public showBreedPetsResultView(first: BreedPetsResultData, second: BreedPetsResultData): void
    {
        if(!this._breedPetsResultView)
        {
            this._breedPetsResultView = new BreedPetsResultView(this);
        }

        this._breedPetsResultView.open(first, second);
    }

    // AS3: AvatarInfoWidget.as::removeBreedPetsResultView()
    public removeBreedPetsResultView(view: BreedPetsResultView | null): void
    {
        if(!view) return;

        if(view === this._breedPetsResultView)
        {
            this._breedPetsResultView.dispose();
            this._breedPetsResultView = null;
        }
        else
        {
            view.dispose();
        }
    }

    // AS3: AvatarInfoWidget.as::showNestBreedingSuccess()
    public showNestBreedingSuccess(petId: number, rarityCategory: number): void
    {
        if(!this._nestBreedingSuccessView)
        {
            this._nestBreedingSuccessView = new NestBreedingSuccessView(this);
        }

        this._nestBreedingSuccessView.open(this.findPetRoomObjectIdByWebId(petId), rarityCategory);
    }

    // AS3: AvatarInfoWidget.as::breedPets()
    // The three monsterplant negotiation steps are the same composer with a different state.
    public breedPets(requestObjectId: number, targetObjectId: number): void
    {
        this.sendBreedPets(BreedPetsMessageComposer.STATE_REQUEST, requestObjectId, targetObjectId);
    }

    // AS3: AvatarInfoWidget.as::cancelBreedPets()
    public cancelBreedPets(requestObjectId: number, targetObjectId: number): void
    {
        this.sendBreedPets(BreedPetsMessageComposer.STATE_CANCEL, requestObjectId, targetObjectId);
    }

    // AS3: AvatarInfoWidget.as::acceptBreedPets()
    public acceptBreedPets(requestObjectId: number, targetObjectId: number): void
    {
        this.sendBreedPets(BreedPetsMessageComposer.STATE_ACCEPT, requestObjectId, targetObjectId);
    }

    // AS3: AvatarInfoWidget.as::breedPets()/cancelBreedPets()/acceptBreedPets() — the shared body.
    // The views address the plants by room index; the wire wants their webIDs.
    private sendBreedPets(state: number, requestObjectId: number, targetObjectId: number): void
    {
        const container = this.container;
        const userDataManager = container?.roomSession.userDataManager ?? null;
        const first = userDataManager?.getUserDataByIndex(requestObjectId) ?? null;
        const second = userDataManager?.getUserDataByIndex(targetObjectId) ?? null;

        if(first && second)
        {
            container?.connection?.send(new BreedPetsMessageComposer(state, first.webID, second.webID));
        }
    }

    // AS3: AvatarInfoWidget.as::cancelPetBreeding()
    public cancelPetBreeding(nestId: number): void
    {
        this.container?.connection?.send(new CancelPetBreedingComposer(nestId));
    }

    // AS3: AvatarInfoWidget.as::confirmPetBreeding()
    public confirmPetBreeding(nestId: number, name: string, petId1: number, petId2: number): void
    {
        this.container?.connection?.send(new ConfirmPetBreedingComposer(nestId, name, petId1, petId2));
    }

    // --- per-frame positioning ---

    // AS3: AvatarInfoWidget.as::checkUpdateNeed()
    private checkUpdateNeed(): void
    {
        const needed = this._activeView !== null || this._avatarNameBubbles.size > 0
            || this._useProductBubbles.size > 0 || this._breedPetBubbles.size > 0;

        if(needed && !this._updateRegistered)
        {
            this.windowManager.registerUpdateReceiver(this, 10);
            this._updateRegistered = true;
        }
        else if(!needed && this._updateRegistered)
        {
            this.windowManager.removeUpdateReceiver(this);
            this._updateRegistered = false;
        }
    }

    /**
	 * The cases of AS3's `updateEventHandler()` switch, as an emitter binding table.
	 *
	 * One list, read by both the constructor and `dispose()`, so a case can never be registered
	 * without its `checkUpdateNeed()` tail — or torn down without it. That pairing is the whole
	 * point: see `onDesktopEventHandled()`.
	 *
	 * The handlers each take a different event type, so the table is typed with the emitter's own
	 * `ListenerFn` — `desktopEvents` is an untyped eventemitter3, and that is the type `.on()`/
	 * `.off()` actually accept.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::updateEventHandler()
    private desktopEventBindings(): readonly (readonly [string, EventEmitter.ListenerFn])[]
    {
        return [
            [RoomWidgetUserInfoUpdateEvent.OWN_USER, this.onUserInfoUpdate],
            [RoomWidgetUserInfoUpdateEvent.PEER, this.onUserInfoUpdate],
            [RoomWidgetAvatarInfoEvent.AVATAR_INFO, this.onAvatarInfo],
            [RoomWidgetUserDataUpdateEvent.USER_DATA_UPDATED, this.onUserDataUpdated],
            [RoomWidgetInventoryUpdatedMessage.INVENTORY_UPDATED, this.onInventoryUpdated],
            [RoomWidgetRoomObjectUpdateEvent.OBJECT_DESELECTED, this.onObjectDeselected],
            [RoomWidgetRoomObjectUpdateEvent.OBJECT_SELECTED, this.onObjectSelected],
            [RoomWidgetRoomObjectUpdateEvent.OBJECT_ROLL_OVER, this.onObjectRollOver],
            [RoomWidgetRoomObjectUpdateEvent.OBJECT_ROLL_OUT, this.onObjectRollOut],
            [RoomWidgetRoomObjectNameEvent.OBJECT_NAME, this.onObjectName],
            [RoomWidgetPetInfoUpdateEvent.PET_INFO, this.onPetInfoUpdate],
            [RoomWidgetPetStatusUpdateEvent.PET_STATUS_UPDATE, this.onPetStatusUpdate],
            [RoomWidgetPetLevelUpdateEvent.PET_LEVEL_UPDATE, this.onPetLevelUpdate],
            [RoomWidgetPetBreedingEvent.PET_BREEDING, this.onPetBreeding],
            [RoomWidgetPetBreedingResultEvent.PET_BREEDING_RESULT, this.onPetBreedingResult],
            [RoomWidgetConfirmPetBreedingEvent.CONFIRM_PET_BREEDING, this.onConfirmPetBreeding],
            [RoomWidgetConfirmPetBreedingResultEvent.CONFIRM_PET_BREEDING_RESULT, this.onConfirmPetBreedingResult],
            [RoomWidgetRentableBotInfoUpdateEvent.RENTABLE_BOT, this.onRentableBotInfoUpdate],
            [RoomWidgetRentableBotSkillListUpdateEvent.SKILL_LIST, this.onRentableBotSkillListUpdate],
            [RoomWidgetRentableBotForceOpenContextMenuEvent.OPEN, this.onRentableBotForceOpenContextMenu],
            [RoomWidgetRoomObjectUpdateEvent.FURNI_ADDED, this.onFurniAdded],
            [RoomWidgetFurniInfoUpdateEvent.FURNI, this.onFurniInfoUpdate],
        ];
    }

    /**
	 * `updateEventHandler()`'s last statement, which sits outside its switch.
	 *
	 * AS3 gets this for free: one method, one switch, `checkUpdateNeed()` after it
	 * (AvatarInfoWidget.as l.820), so every case is followed by it whether the case remembers or
	 * not. Splitting the switch into per-event listeners dropped the tail along with the method,
	 * and the obligation silently became per-branch — five of the nine `_activeView` assignments
	 * had no `checkUpdateNeed()` anywhere near them. An unregistered update receiver means
	 * `update()` never runs, so `positionView()` never runs; the view is on screen regardless,
	 * because `buildFromXML()` parents a root window straight to the desktop
	 * (`WindowContext.createWindow()`: `parent ?? _desktop`). It just sits at (0, 0) forever. That
	 * was the avatar name bubble stranded in the top-left corner, with the pet, rentable-bot and
	 * peer-avatar menus one click behind it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::updateEventHandler()
    private onDesktopEventHandled = (): void =>
    {
        this.checkUpdateNeed();
    };

    // AS3: AvatarInfoWidget.as::update() (IUpdateReceiver)
    public update(deltaTime: number): void
    {
        if(this._activeView) this.positionView(this._activeView, deltaTime);

        for(const view of this._avatarNameBubbles.values()) this.positionView(view, deltaTime);
        for(const view of this._useProductBubbles.values()) this.positionView(view, deltaTime);
        for(const view of this._breedPetBubbles.values()) this.positionView(view, deltaTime);
    }

    /**
     * The per-view body of `update()`'s four loops: asks the engine where an object is and hands
     * the answer to the view.
     *
     * **This asks; it does not work it out.** AS3's `update()` sends
     * `RWGOI_MESSAGE_GET_OBJECT_LOCATION` (or the `_GAME_` variant for a game-room nametag) and
     * passes the returned `rectangle` and `screenLocation` straight into `view.update()`. That
     * message is answered by `ObjectLocationRequestHandler`, which is ported, correct, and was
     * being bypassed: this method used to resolve the room index itself, call
     * `getRoomObjectBoundingRectangle()`, and *invent* the anchor as the box's
     * `(left + width / 2, bottom)`.
     *
     * Both halves of that invention were wrong, in ways that took three patches to stop treating as
     * separate bugs:
     *
     * - The box covers every sprite an avatar draws, so a wide effect moves the anchor. The fishing
     *   rod's float, ripple and line pushed the name bubble and the whole avatar menu off the head.
     *   The handler uses `getRoomObjectScreenLocation()`, the object's own projected position,
     *   which no effect can move.
     * - `userData.roomObjectId` is 0 for a user the room has no object for, and 0 is an id the
     *   engine resolves rather than refuses — so the bubble was anchored to the room's origin and
     *   re-anchored there every frame. The handler answers `rectangle: null` for that case, and
     *   `ContextInfoView.update()` returns on a null rectangle without showing anything, which is
     *   how AS3 has always kept an unplaceable bubble off the screen.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::update()
    private positionView(view: AvatarContextInfoButtonView | UserNameView, deltaTime: number): void
    {
        const gameRoomMode = view instanceof UserNameView && view.isGameRoomMode;
        const location = this.messageListener?.processWidgetMessage(
            new RoomWidgetGetObjectLocationMessage(
                gameRoomMode
                    ? RoomWidgetGetObjectLocationMessage.GET_GAME_OBJECT_LOCATION
                    : RoomWidgetGetObjectLocationMessage.GET_OBJECT_LOCATION,
                view.userId,
                view.userType
            )
        ) as RoomWidgetUserLocationUpdateEvent | null ?? null;

        // AS3 hands `screenLocation` straight through; the port declares it nullable on the event
        // and non-null on `update()`, so the pair is applied only when both arrived.
        //
        // TS-only: returning here is silent, and silence is expensive. `buildFromXML()` parents a
        // root window straight to the desktop (WindowContext.createWindow(): `parent ?? _desktop`),
        // so the bubble is on screen from the moment it is built — `update()` is the ONLY thing
        // that ever moves it off (0, 0). In Flash an unanswered location lasts a frame; here it
        // strands the bubble in the top-left corner for good. Say which part came back empty.
        //
        // `rectangle` is in the test for the same reason: `ContextInfoView.update()` opens with
        // `if(!rect) return;`, so a null rectangle is a *third* silent exit, and the two fields
        // come from independent engine calls — `getRoomObjectBoundingRectangle()` needs the
        // object's rendered sprites where `getRoomObjectScreenLocation()` only needs its projected
        // position, so one can answer while the other does not. Hoisting the check changes nothing:
        // AS3 does nothing on a null rectangle either.
        if(location === null || location.screenLocation === null || location.rectangle === null)
        {
            AvatarInfoWidget.reportUnlocatable(view, location);

            return;
        }

        view.update(location.rectangle, location.screenLocation, deltaTime);
    }

    // TS-only: rate limit for reportUnlocatable() below — views already named, so the warning fires
    // once per stranded bubble rather than once a frame. No AS3 counterpart; AS3 does not warn here.
    private static readonly REPORTED_UNLOCATABLE: Set<string> = new Set();

    /**
	 * Names the part of the location round-trip that came back empty, once per view.
	 *
	 * The three cases need opposite fixes, which is why they are told apart rather than being one
	 * "no location" line: a null event means the message never reached
	 * `ObjectLocationRequestHandler` (no handler registered, or no room session / user-data
	 * manager); a missing `screenLocation` means the handler ran and `getUserDataByType()` or
	 * `getRoomObjectScreenLocation()` found nothing; a missing `rectangle` alone means the object
	 * *is* placed but `getRoomObjectBoundingRectangle()` has no rendered bounds for it.
	 */
    // TS-only: diagnostic for the silent return above; AS3 has no counterpart.
    private static reportUnlocatable(
        view: AvatarContextInfoButtonView | UserNameView,
        location: RoomWidgetUserLocationUpdateEvent | null
    ): void
    {
        const key = `${view.userType}:${view.userId}`;

        if(AvatarInfoWidget.REPORTED_UNLOCATABLE.has(key)) return;

        AvatarInfoWidget.REPORTED_UNLOCATABLE.add(key);

        log.warn(
            `No location for "${view.userName}" (userId ${view.userId}, userType ${view.userType}): `
			+ (location === null
			    ? 'RWGOI_MESSAGE_GET_OBJECT_LOCATION went unanswered — no handler, or no room session.'
			    : location.screenLocation === null
			        ? 'the handler answered with no screenLocation — the user is not in userDataManager, '
						+ 'or its roomObjectId names nothing on the first canvas.'
			        : 'the handler answered with a screenLocation but no rectangle — '
						+ 'getRoomObjectBoundingRectangle() has no rendered bounds for that object.')
			+ ' The bubble stays parked at (0, 0) until this resolves.'
        );
    }

    // --- state getters read by OwnAvatarMenuView ---

    // AS3: AvatarInfoWidget.as::get/set isDancing()
    public get isDancing(): boolean
    {
        return this._isDancing;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::set isDancing()
    public set isDancing(value: boolean)
    {
        this._isDancing = value;
    }

    // AS3: AvatarInfoWidget.as::get hasClub()
    public get hasClub(): boolean
    {
        return this.container?.sessionDataManager?.hasClub ?? false;
    }

    // AS3: AvatarInfoWidget.as::get hasVip()
    public get hasVip(): boolean
    {
        return this.container?.sessionDataManager?.hasVip ?? false;
    }

    // AS3: AvatarInfoWidget.as::get hasEffectOn()
    public get hasEffectOn(): boolean
    {
        const effects = this.container?.inventory?.getActivatedAvatarEffects() ?? [];

        return effects.some(e => e.isInUse);
    }

    // AS3: AvatarInfoWidget.as::get ownAvatarPosture()
    public get ownAvatarPosture(): string
    {
        return this.getOwnModelString('figure_posture', 'std');
    }

    // AS3: AvatarInfoWidget.as::get canStandUp()
    public get canStandUp(): boolean
    {
        return this.getOwnModelNumber('figure_can_stand_up') > 0;
    }

    // AS3: AvatarInfoWidget.as::get isSwimming()
    public get isSwimming(): boolean
    {
        return AvatarInfoWidget.SWIM_EFFECTS.indexOf(this.getOwnModelNumber('figure_effect')) !== -1;
    }

    // AS3: AvatarInfoWidget.as::get isCurrentUserRiding()
    public get isCurrentUserRiding(): boolean
    {
        return this.getOwnModelNumber('figure_effect') === AvatarInfoWidget.RIDE_EFFECT;
    }

    // AS3: AvatarInfoWidget.as::get hasFreeSaddle()
    public get hasFreeSaddle(): boolean
    {
        return this._petData.hasFreeSaddle;
    }

    // AS3: AvatarInfoWidget.as::get isRiding()
    public get isRiding(): boolean
    {
        return this._petData.isRiding;
    }

    // AS3: AvatarInfoWidget.as::isMonsterPlant()
    public isMonsterPlant(): boolean
    {
        return this._petData.petType === AvatarInfoWidget.PET_TYPE_MONSTERPLANT;
    }

    // AS3: AvatarInfoWidget.as::openTrainingView()
    // The pet-training window belongs to the infostand widget, which listens for this on the
    // shared desktop bus.
    public openTrainingView(): void
    {
        this.container?.desktopEvents.emit(RoomWidgetPetCommandsUpdateEvent.OPEN_PET_TRAINING, new RoomWidgetUpdateEvent(RoomWidgetPetCommandsUpdateEvent.OPEN_PET_TRAINING));
    }

    // AS3: AvatarInfoWidget.as::closeTrainingView()
    public closeTrainingView(): void
    {
        this.container?.desktopEvents.emit(RoomWidgetPetCommandsUpdateEvent.CLOSE_PET_TRAINING, new RoomWidgetUpdateEvent(RoomWidgetPetCommandsUpdateEvent.CLOSE_PET_TRAINING));
    }

    // AS3: AvatarInfoWidget.as::get/set useMinimizedOwnAvatarMenu()
    public get useMinimizedOwnAvatarMenu(): boolean
    {
        return this.container?.config?.getBoolean('use_minimized_own_avatar_menu') ?? false;
    }

    // AS3: .../src/com/sulake/habbo/ui/widget/avatarinfo/AvatarInfoWidget.as::set useMinimizedOwnAvatarMenu()
    public set useMinimizedOwnAvatarMenu(value: boolean)
    {
        this.container?.config?.setProperty('use_minimized_own_avatar_menu', value ? '1' : '0');
    }

    // --- action helpers ---

    // AS3: AvatarInfoWidget.as::sendSignRequest()
    public sendSignRequest(id: number): void
    {
        this.container?.roomSession.sendSignMessage(id);
    }

    // AS3: AvatarInfoWidget.as::openAvatarEditor()
    // The own-avatar bubble's "change looks" button. Same pair as the me-menu's clothes button —
    // open on the main id, then load the user's own figure.
    public openAvatarEditor(): void
    {
        const editor = this.handler?.container?.avatarEditor ?? null;

        if(editor === null) return;

        editor.openEditor(AvatarEditorIdEnum.MAIN_EDITOR, null, null, true);
        editor.loadOwnAvatarInEditor(AvatarEditorIdEnum.MAIN_EDITOR);
    }

    // AS3: AvatarInfoWidget.as::get isUserDecorating()
    public get isUserDecorating(): boolean
    {
        return this.handler?.roomSession?.isUserDecorating ?? false;
    }

    /**
     * AS3: AvatarInfoWidget.as::set isUserDecorating()
     *
     * The room session owns the flag; this only puts the "done decorating" button up or takes it
     * down. Note it is `hide(false)`, not a dispose: the view is built once and toggled thereafter
     * — see DecorateModeView's own header for why its `activeView` setter does not reparent.
     */
    // AS3: AvatarInfoWidget.as::set isUserDecorating()
    public set isUserDecorating(value: boolean)
    {
        const session = this.handler?.roomSession ?? null;

        if(session === null) return;

        session.isUserDecorating = value;

        if(!value)
        {
            this._decorateModeView?.hide(false);

            return;
        }

        const container = this.container;
        const userId = container?.sessionDataManager?.userId ?? -1;

        if(!this._decorateModeView)
        {
            this._decorateModeView = new DecorateModeView(
                this,
                userId,
                container?.sessionDataManager?.userName ?? '',
                container?.roomSession?.ownUserRoomId ?? -1
            );
        }

        this._decorateModeView.show();

        const location = this.messageListener?.processWidgetMessage(
            new RoomWidgetGetObjectLocationMessage(RoomWidgetGetObjectLocationMessage.GET_OBJECT_LOCATION, userId, 1)
        ) as RoomWidgetUserLocationUpdateEvent | null ?? null;

        // AS3 hands `screenLocation` straight through; this port declares it nullable on the event
        // and non-null on update(), so the pair is only applied when both are there.
        if(location?.screenLocation != null)
        {
            this._decorateModeView.update(location.rectangle, location.screenLocation, 0);
        }
    }

    // --- helpers ---

    private getOwnModelString(key: string, fallback: string): string
    {
        const model = this.getOwnModel();

        return model?.getString(key) ?? fallback;
    }

    private getOwnModelNumber(key: string): number
    {
        const model = this.getOwnModel();

        return model?.getNumber(key) ?? 0;
    }

    private getOwnModel(): { getString(key: string): string; getNumber(key: string): number } | null
    {
        const container = this.container;

        if(!container || !container.roomEngine || this._ownRoomIndex < 0) return null;

        const roomId = container.roomSession.roomId;
        const object = container.roomEngine.getRoomObject(roomId, this._ownRoomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) ?? null;

        return object?.getModel() ?? null;
    }

    // AS3: AvatarInfoWidget.as::dispose()
    public override dispose(): void
    {
        if(this.disposed) return;

        this.container?.roomEngine?.events.off(RoomEngineObjectEvent.REOE_ADDED, this.onRoomObjectAdded);
        this.container?.roomEngine?.events.off(RoomEngineObjectEvent.REOE_REMOVED, this.onRoomObjectRemoved);
        for(const [type, handler] of this.desktopEventBindings())
        {
            this.container?.desktopEvents.off(type, handler);
            this.container?.desktopEvents.off(type, this.onDesktopEventHandled);
        }

        this.container?.inventory?.events.off(HabboInventoryEffectsEvent.HIEE_EFFECTS_CHANGED, this.onEffectsChanged);
        this.container?.userDefinedRoomEvents?.events.off(
            WiredUserClickHandledEvent.WIRED_USER_CLICK_HANDLED, this.onUserClickHandledEvent
        );

        if(this._updateRegistered)
        {
            this.windowManager.removeUpdateReceiver(this);
            this._updateRegistered = false;
        }

        this._cachedOwnMenu?.dispose();
        this._cachedOwnMenu = null;
        this._cachedAvatarMenu?.dispose();
        this._cachedAvatarMenu = null;
        this.removeAvatarHighlightTimer();
        this._contextInfoButtonView?.dispose();
        this._contextInfoButtonView = null;
        this._newUserHelpView?.dispose();
        this._newUserHelpView = null;
        this._decorateModeView?.dispose();
        this._decorateModeView = null;
        this._cachedOwnPetMenu?.dispose();
        this._cachedOwnPetMenu = null;
        this._cachedPetMenu?.dispose();
        this._cachedPetMenu = null;
        this._cachedRentableBotMenu?.dispose();
        this._cachedRentableBotMenu = null;

        // AS3: AvatarInfoWidget.as::dispose() disposes every built skill editor — each holds a
        // connection subscription that would otherwise outlive the widget.
        for(const view of this._botSkillConfigurationViews.values())
        {
            view.dispose();
        }

        this._botSkillConfigurationViews.clear();
        this._botSkillsByBotId.clear();
        this._buttonsSetup = null;
        this._activeView = null;

        for(const view of this._avatarNameBubbles.values())
        {
            view.dispose();
        }

        this._avatarNameBubbles.clear();

        this.removeUseProductViews();
        this.removeBreedPetViews();
        this.removeUseProductConfirmationView();
        this.removeBreedMonsterPlantsConfirmationView();
        this.removeConfirmPetBreedingView();
        this.removeBreedingPetsWaitingConfirmationAlert();
        this._breedPetsResultView?.dispose();
        this._breedPetsResultView = null;
        this._nestBreedingSuccessView?.dispose();
        this._nestBreedingSuccessView = null;

        super.dispose();
    }
}
