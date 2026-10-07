/**
 * AvatarInfoWidgetHandler — handler for the RWE_AVATAR_INFO widget.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as
 *
 * Opens the own-avatar bubble on the toolbar MEMENU click, routes the bubble's
 * dance/expression/posture actions to roomSession.send* (consolidating what AS3 splits across
 * MeMenuWidgetHandler/InfoStandWidgetHandler), and owns the pet side of the widget: the
 * status/level session events, the use-product action the bubbles raise and the room scan that
 * builds the per-pet "use this product on…" bubble set.
 *
 * The RPG fork removed pet breeding and monsterplants: AS3's nest-breeding event, its harvest /
 * revive / compost / request-breed actions and the "breed with…" scan are not ported.
 */
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import {UserNameUpdateEvent} from '@habbo/session/events/UserNameUpdateEvent';
import {FurniListAddOrUpdateMessageEvent} from '@habbo/communication/messages/incoming/inventory/furni/FurniListAddOrUpdateMessageEvent';
import {RoomWidgetAvatarInfoEvent} from '@habbo/ui/widget/events/RoomWidgetAvatarInfoEvent';
import {RoomWidgetUserDataUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetUserDataUpdateEvent';
import {RoomWidgetRoomObjectMessage} from '@habbo/ui/widget/messages/RoomWidgetRoomObjectMessage';
import {RoomSessionUserDataUpdateEvent} from '@habbo/session/events/RoomSessionUserDataUpdateEvent';
import {RoomWidgetInventoryUpdatedMessage} from '@habbo/ui/widget/messages/RoomWidgetInventoryUpdatedMessage';
import type {RoomWidgetMessage} from '@habbo/ui/widget/messages/RoomWidgetMessage';
import type {RoomWidgetUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetUpdateEvent';
import {RoomWidgetDanceMessage} from '@habbo/ui/widget/messages/RoomWidgetDanceMessage';
import {RoomWidgetAvatarExpressionMessage} from '@habbo/ui/widget/messages/RoomWidgetAvatarExpressionMessage';
import {RoomWidgetChangePostureMessage} from '@habbo/ui/widget/messages/RoomWidgetChangePostureMessage';
import {RoomWidgetUserActionMessage} from '@habbo/ui/widget/messages/RoomWidgetUserActionMessage';
import {RoomWidgetUseProductMessage} from '@habbo/ui/widget/messages/RoomWidgetUseProductMessage';
import {RoomWidgetPetStatusUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetStatusUpdateEvent';
import {RoomWidgetPetLevelUpdateEvent} from '@habbo/ui/widget/events/RoomWidgetPetLevelUpdateEvent';
import {UseProductItem} from '@habbo/ui/widget/events/UseProductItem';
import {RoomSessionPetStatusUpdateEvent} from '@habbo/session/events/RoomSessionPetStatusUpdateEvent';
import {RoomSessionPetLevelUpdateEvent} from '@habbo/session/events/RoomSessionPetLevelUpdateEvent';
import {RoomSessionDanceEvent} from '@habbo/session/events/RoomSessionDanceEvent';
import {RoomEngineUseProductEvent} from '@habbo/room/events/RoomEngineUseProductEvent';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {FurnitureCategory} from '@habbo/inventory/enum/FurnitureCategory';
import {HabboToolbarEvent} from '@habbo/toolbar/events/HabboToolbarEvent';
import {HabboToolbarIconEnum} from '@habbo/toolbar/HabboToolbarIconEnum';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IUserData} from '@habbo/session/IUserData';
import type {IRoomObject} from '@room/object/IRoomObject';
import {Logger} from '@core/utils/Logger';
import type {AvatarInfoWidget} from '@habbo/ui/widget/avatarinfo/AvatarInfoWidget';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {
    CustomUserNotificationMessageEvent
} from '@habbo/communication/messages/incoming/room/furniture/CustomUserNotificationMessageEvent';

const logger = Logger.getLogger('habbo.ui.handler.AvatarInfoWidgetHandler');

export class AvatarInfoWidgetHandler implements IRoomWidgetHandler
{
    // IUserData.type for a pet — the literal AS3 passes to getUserDataByType()/its type checks.
    private static readonly USER_TYPE_PET: number = 2;

    // AS3: .../src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as::_disposed
    private _disposed: boolean = false;
    // AS3: .../src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;
    private _widget: AvatarInfoWidget | null = null;

    // AS3: AvatarInfoWidgetHandler.as::_SafeStr_5791
    private _customUserNotificationEvent: IMessageEvent | null = null;

    /** Derived name — `_SafeStr_5885`: the furni-list subscription, kept so it registers once. */
    // AS3: AvatarInfoWidgetHandler.as::_SafeStr_5885
    private _furniListEvent: IMessageEvent | null = null;

    // AS3: AvatarInfoWidgetHandler.as::set widget()
    public set widget(value: AvatarInfoWidget | null)
    {
        this._widget = value;
    }

    // AS3: AvatarInfoWidgetHandler.as::get type()
    public get type(): string
    {
        return 'RWE_AVATAR_INFO';
    }

    // AS3: AvatarInfoWidgetHandler.as::get roomSession()
    public get roomSession()
    {
        return this._container?.roomSession ?? null;
    }

    // AS3: AvatarInfoWidgetHandler.as::get roomEngine()
    public get roomEngine()
    {
        return this._container?.roomEngine ?? null;
    }

    // AS3: AvatarInfoWidgetHandler.as::get friendList()
    public get friendList()
    {
        return this._container?.friendList ?? null;
    }

    // DEVIATION: AS3 also listens for the nest-breeding success event — the RPG fork removed pet
    //   breeding.
    // AS3: AvatarInfoWidgetHandler.as::set container() / get container()
    public set container(value: IRoomWidgetHandlerContainer | null)
    {
        this._container?.toolbar?.toolbarEvents.off(HabboToolbarEvent.TOOLBAR_CLICK, this.onToolbarClicked);
        this._container?.sessionDataManager?.events.off(UserNameUpdateEvent.NAME_UPDATE, this.onUserNameUpdate);

        // AS3 dispatches these on `roomSessionManager.events`; this port routes session events
        // through `sessionEvents` (see CLAUDE.md → Never).
        const previousSessionEvents = this._container?.roomSessionManager?.sessionEvents;

        if(previousSessionEvents)
        {
            previousSessionEvents.off(RoomSessionPetStatusUpdateEvent.PET_STATUS_UPDATE, this.onPetStatusUpdate);
            previousSessionEvents.off(RoomSessionPetLevelUpdateEvent.PET_LEVEL_UPDATE, this.onPetLevelUpdate);
            previousSessionEvents.off(RoomSessionDanceEvent.RSDE_DANCE, this.onDanceEvent);
            previousSessionEvents.off(RoomSessionUserDataUpdateEvent.RSUDUE_USER_DATA_UPDATE, this.onUserDataUpdate);
        }

        this._container = value;

        if(!value) return;

        // AS3: AvatarInfoWidgetHandler.as::set container() — subscribed once, guarded on the
        // event field so a second container does not double-register.
        if(!this._customUserNotificationEvent && value.connection)
        {
            this._customUserNotificationEvent = new CustomUserNotificationMessageEvent(
                this.onCustomUserNotificationMessage.bind(this)
            );

            value.connection.addMessageEvent(this._customUserNotificationEvent);
        }

        // AS3 guards this one the same way as the notification event above, on the field itself.
        if(!this._furniListEvent && value.connection)
        {
            this._furniListEvent = new FurniListAddOrUpdateMessageEvent(this.onFurniListUpdated);

            value.connection.addMessageEvent(this._furniListEvent);
        }

        value.toolbar?.toolbarEvents.on(HabboToolbarEvent.TOOLBAR_CLICK, this.onToolbarClicked);
        value.sessionDataManager?.events.on(UserNameUpdateEvent.NAME_UPDATE, this.onUserNameUpdate);

        const sessionEvents = value.roomSessionManager?.sessionEvents;

        if(sessionEvents)
        {
            sessionEvents.on(RoomSessionPetStatusUpdateEvent.PET_STATUS_UPDATE, this.onPetStatusUpdate);
            sessionEvents.on(RoomSessionPetLevelUpdateEvent.PET_LEVEL_UPDATE, this.onPetLevelUpdate);
            sessionEvents.on(RoomSessionDanceEvent.RSDE_DANCE, this.onDanceEvent);
            sessionEvents.on(RoomSessionUserDataUpdateEvent.RSUDUE_USER_DATA_UPDATE, this.onUserDataUpdate);
        }
    }

    // AS3: .../src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as::get container()
    public get container(): IRoomWidgetHandlerContainer | null
    {
        return this._container;
    }

    /**
     * AS3: AvatarInfoWidgetHandler.as::onCustomUserNotificationMessage()
     *
     * AS3 switches on `code - 4`, i.e. only the two respect-vote failures, and refunds the respect
     * the player just spent. The same message also opens a dialog in
     * `CustomUserNotificationWidgetHandler`; both handlers subscribe it independently.
     */
    // AS3: .../src/com/sulake/habbo/ui/handler/AvatarInfoWidgetHandler.as::onCustomUserNotificationMessage()
    private onCustomUserNotificationMessage(event: IMessageEvent): void
    {
        const parser = (event as CustomUserNotificationMessageEvent).customUserNotificationParser;

        if(!parser) return;

        switch(parser.code)
        {
            case 4:
            case 5:
                this._container?.sessionDataManager?.giveRespectFailed();
        }
    }

    /**
     * Two routes to the same bubble, and the config flag picks. The simple me-menu asks the info
     * stand for the player's own facts over the widget-message round trip; the full one dispatches
     * them straight from the session data it already has. The port took the first branch
     * unconditionally, so a hotel with `simple.memenu.enabled` off got the round trip anyway.
     */
    // AS3: AvatarInfoWidgetHandler.as::onToolbarClicked()
    private onToolbarClicked = (event: HabboToolbarEvent): void =>
    {
        if(event.iconId !== HabboToolbarIconEnum.MEMENU) return;

        if(this._container?.config?.getBoolean('simple.memenu.enabled') ?? false)
        {
            this._widget?.selectOwnAvatar();

            return;
        }

        this.dispatchOwnAvatarInfo();
    };

    /**
     * The player's own identity, straight off the session data manager. Silently does nothing when
     * the player is not in the room's user list yet — AS3 guards on the same lookup.
     */
    // AS3: AvatarInfoWidgetHandler.as::dispatchOwnAvatarInfo()
    private dispatchOwnAvatarInfo(): void
    {
        const container = this._container;
        const session = container?.sessionDataManager ?? null;

        if(container == null || session == null) return;

        const userData = container.roomSession?.userDataManager?.getUserData(session.userId) ?? null;

        if(userData == null) return;

        container.desktopEvents.emit(
            RoomWidgetAvatarInfoEvent.AVATAR_INFO,
            new RoomWidgetAvatarInfoEvent(
                session.userId, session.userName, userData.type, userData.roomObjectId, session.nameChangeAllowed
            )
        );
    }

    /**
     * The room's user list changed. Three things follow, in AS3's order:
     *
     * 1. every newly-arrived user the player has blocked is marked as such on their room object —
     *    the blocked list is per-account and the room object is per-visit, so it has to be applied
     *    to each arrival rather than once;
     * 2. the widget is nudged, which is what makes it ask for the player's own identity the first
     *    time the list settles;
     * 3. **a friend walking in gets a floating name bubble.** This is the automatic
     *    `showUserName()` trigger; the widget's header used to record it as missing, and it was —
     *    the method was complete and callable and nothing called it.
     */
    // AS3: AvatarInfoWidgetHandler.as::processEvent() — case "RSUDUE_USER_DATA_UPDATE"
    private onUserDataUpdate = (event: RoomSessionUserDataUpdateEvent): void =>
    {
        const container = this._container;
        const session = container?.sessionDataManager ?? null;
        const userDataManager = container?.roomSession?.userDataManager ?? null;

        if(container == null || session == null || userDataManager == null) return;

        for(const user of event.addedUsers)
        {
            if(session.isBlocked(user.webID)) userDataManager.markAsBlocked(user.roomObjectId);
        }

        container.desktopEvents.emit(
            RoomWidgetUserDataUpdateEvent.USER_DATA_UPDATED, new RoomWidgetUserDataUpdateEvent()
        );

        const friendNames = this.friendList?.getFriendNames() ?? [];

        for(const user of event.addedUsers)
        {
            if(friendNames.indexOf(user.name) > -1) this._widget?.showUserName(user, user.roomObjectId);
        }
    };

    /** A rename invalidates whatever the bubble is showing, so AS3 simply closes it. */
    // AS3: AvatarInfoWidgetHandler.as::onUserNameUpdate()
    private onUserNameUpdate = (): void =>
    {
        this._widget?.close();
    };

    /**
     * The furni-list echo (3151). The pet-product menu reads the inventory to decide what it can
     * offer, so it has to be told when the inventory moves under it.
     */
    // AS3: AvatarInfoWidgetHandler.as::onFurniListUpdated()
    private onFurniListUpdated = (): void =>
    {
        this._container?.desktopEvents.emit(
            RoomWidgetInventoryUpdatedMessage.INVENTORY_UPDATED,
            new RoomWidgetInventoryUpdatedMessage(RoomWidgetInventoryUpdatedMessage.INVENTORY_UPDATED)
        );
    };

    /**
	 * The server's echo of a dance, which is the only thing that moves the me-menu's dance state.
	 *
	 * AS3 narrows it to the player's own avatar before applying: it resolves its own user through
	 * `userDataManager.getUserData(sessionDataManager.userId)` and compares the event's `userId`
	 * against that record's **room object id** — the event carries a room object id, the session
	 * data manager a web id, so the comparison cannot be made on either one alone.
	 */
    // AS3: AvatarInfoWidgetHandler.as::processEvent() — case "RSDE_DANCE"
    private onDanceEvent = (event: RoomSessionDanceEvent): void =>
    {
        const container = this._container;

        if(!event || !this._widget || !container?.roomSession?.userDataManager) return;

        const ownUserId = container.sessionDataManager?.userId ?? -1;
        const ownUserData = container.roomSession.userDataManager.getUserData(ownUserId);

        if(!ownUserData || event.userId !== ownUserData.roomObjectId) return;

        this._widget.isDancing = event.danceStyle !== 0;
    };

    // The session event carries the pet's webID; the widget event carries its room object id.
    // DEVIATION: AS3 also forwards the breed / harvest / revive / breeding-permission flags — the
    //   RPG fork removed pet breeding and monsterplants.
    // AS3: AvatarInfoWidgetHandler.as::onPetStatusUpdate()
    private onPetStatusUpdate = (event: RoomSessionPetStatusUpdateEvent): void =>
    {
        const container = this._container;

        if(!container) return;

        const petData = this.findPetWithWebId(event.petId);

        if(!petData)
        {
            logger.warn(`Could not find pet with the id: ${event.petId} given by petStatusUpdate`);

            return;
        }

        container.desktopEvents.emit(
            RoomWidgetPetStatusUpdateEvent.PET_STATUS_UPDATE,
            new RoomWidgetPetStatusUpdateEvent(petData.roomObjectId)
        );
    };

    // AS3: AvatarInfoWidgetHandler.as::onPetLevelUpdate()
    private onPetLevelUpdate = (event: RoomSessionPetLevelUpdateEvent): void =>
    {
        const container = this._container;

        if(!container) return;

        const petData = this.findPetWithWebId(event.petId);

        // AS3 dereferences the result without a null check here (unlike onPetStatusUpdate);
        // guarded, since a level update for a pet that has left the room is reachable.
        if(!petData) return;

        container.desktopEvents.emit(
            RoomWidgetPetLevelUpdateEvent.PET_LEVEL_UPDATE,
            new RoomWidgetPetLevelUpdateEvent(petData.roomObjectId, event.level)
        );
    };

    // The dance/expression/posture types are the port's own consolidation of AS3's MeMenu handler.
    // DEVIATION: AS3 also takes REQUEST_BREED_PET, HARVEST_PET, REVIVE_PET and COMPOST_PLANT — the
    //   RPG fork removed pet breeding and monsterplants.
    // AS3: AvatarInfoWidgetHandler.as::getWidgetMessages()
    public getWidgetMessages(): string[]
    {
        return [
            RoomWidgetDanceMessage.DANCE,
            RoomWidgetAvatarExpressionMessage.AVATAR_EXPRESSION,
            RoomWidgetChangePostureMessage.CHANGE_POSTURE,
            RoomWidgetRoomObjectMessage.GET_OWN_CHARACTER_INFO,
            RoomWidgetUserActionMessage.START_NAME_CHANGE,
            RoomWidgetUserActionMessage.REQUEST_PET_UPDATE,
            RoomWidgetUseProductMessage.PET_PRODUCT,
        ];
    }

    // AS3: AvatarInfoWidgetHandler.as::getProcessedEvents()
    // Both triggers are live: FROM_INVENTORY comes out of RoomEngine.showUseProductSelection()
    // (_SafeCls_90.as:4963), reached from the inventory strip's use button; FROM_ROOM out of the
    // ROWRE_PET_PRODUCT_MENU case of handleObjectWidgetRequestEvent() (_SafeCls_1821.as:1479),
    // raised by FurniturePetProductLogic when the product furni is double-clicked in the room.
    public getProcessedEvents(): string[]
    {
        return [
            RoomEngineUseProductEvent.USE_PRODUCT_FROM_INVENTORY,
            RoomEngineUseProductEvent.USE_PRODUCT_FROM_ROOM,
        ];
    }

    // DEVIATION: AS3 also handles harvest, compost, request-breed and revive — the RPG fork removed
    //   pet breeding and monsterplants.
    // AS3: AvatarInfoWidgetHandler.as::processWidgetMessage() (+ MeMenuWidgetHandler action cases)
    public processWidgetMessage(message: RoomWidgetMessage): RoomWidgetUpdateEvent | null
    {
        if(!message || !this._container) return null;

        const roomSession = this._container.roomSession;

        switch(message.type)
        {
            case RoomWidgetDanceMessage.DANCE:
            {
                const style = (message as RoomWidgetDanceMessage).style;

                // AS3 sends and stops there: `isDancing` is set from the server's own RSDE_DANCE
                // echo (see `onDanceEvent`), never from what was sent. The optimistic set this port
                // used instead — while the round trip was unwired — could not see a dance the
                // player did not start, and disagreed with the avatar whenever the server refused.
                roomSession.sendDanceMessage(style);
                break;
            }
            case RoomWidgetAvatarExpressionMessage.AVATAR_EXPRESSION:
                roomSession.sendAvatarExpressionMessage((message as RoomWidgetAvatarExpressionMessage).animation.ordinal);
                break;
            case RoomWidgetChangePostureMessage.CHANGE_POSTURE:
                roomSession.sendChangePostureMessage((message as RoomWidgetChangePostureMessage).posture);
                break;
            case RoomWidgetRoomObjectMessage.GET_OWN_CHARACTER_INFO:
                this.dispatchOwnAvatarInfo();
                break;
            case RoomWidgetUserActionMessage.START_NAME_CHANGE:
                // AS3: AvatarInfoWidgetHandler.as::processWidgetMessage() → habboHelp.startNameChange()
                this._container.habboHelp?.startNameChange();
                break;
            case RoomWidgetUserActionMessage.REQUEST_PET_UPDATE:
                // The infostand asks the server for fresh pet info; the answer must not re-open
                // the bubble, so the widget stops handling RWPIUE_PET_INFO until the next select.
                if(this._widget) this._widget.handlePetInfo = false;
                break;
            case RoomWidgetUseProductMessage.PET_PRODUCT:
            {
                const useProductMessage = message as RoomWidgetUseProductMessage;

                roomSession.useProductForPet(useProductMessage.roomObjectId, useProductMessage.petId);
                break;
            }
        }

        return null;
    }

    // AS3: AvatarInfoWidgetHandler.as::processEvent()
    public processEvent(event: unknown): void
    {
        const useProductEvent = event as RoomEngineUseProductEvent | null;

        if(!useProductEvent) return;

        switch(useProductEvent.type)
        {
            case RoomEngineUseProductEvent.USE_PRODUCT_FROM_INVENTORY:
                this.handleUseProductMenuRequestInventoryItem(useProductEvent.inventoryStripId, useProductEvent.furnitureTypeId);
                break;
            case RoomEngineUseProductEvent.USE_PRODUCT_FROM_ROOM:
                this.handleUseProductMenuRequestRoomObject(useProductEvent.objectId);
                break;
        }
    }

    // AS3: AvatarInfoWidgetHandler.as::getFurniData()
    public getFurniData(object: IRoomObject | null): IFurnitureData | null
    {
        if(!object) return null;

        const typeId = object.getModel().getNumber('furniture_type_id');

        return this._container?.sessionDataManager?.getFloorItemData(typeId) ?? null;
    }

    // AS3: AvatarInfoWidgetHandler.as::handleUseProductMenuRequestInventoryItem()
    private handleUseProductMenuRequestInventoryItem(inventoryStripId: number, furnitureTypeId: number): void
    {
        const container = this._container;

        if(!container?.roomEngine) return;

        const roomId = container.roomSession.roomId;
        const ownUserId = container.sessionDataManager?.userId ?? -1;
        const furniData = container.sessionDataManager?.getFloorItemData(furnitureTypeId) ?? null;

        if(!furniData) return;

        // The product's first custom param is the pet type it applies to; a product with none
        // targets nothing.
        if(this.getProductPetTypeId(furniData) === -1) return;

        this.activateUseProductMenuForPets(roomId, furnitureTypeId, -1, furniData.category, ownUserId, inventoryStripId);
    }

    // AS3: AvatarInfoWidgetHandler.as::handleUseProductMenuRequestRoomObject()
    private handleUseProductMenuRequestRoomObject(objectId: number): void
    {
        const container = this._container;

        if(!container?.roomEngine) return;

        const roomId = container.roomSession.roomId;
        const roomObject = container.roomEngine.getRoomObject(roomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

        if(!roomObject || !container.isOwnerOfFurniture(roomObject)) return;

        const ownerId = container.getFurnitureOwnerId(roomObject);
        const furniData = this.getFurniData(roomObject);

        if(!furniData || this.getProductPetTypeId(furniData) === -1) return;

        this.activateUseProductMenuForPets(roomId, objectId, -1, furniData.category, ownerId);
    }

    // Scans every pet in the room and keeps the ones the product can actually be used on: same
    // owner and same species.
    // DEVIATION: AS3 also filters the three monsterplant products (categories 20-22) on the plant's
    //   growth state — the RPG fork removed monsterplants.
    // AS3: AvatarInfoWidgetHandler.as::activateUseProductMenuForPets()
    private activateUseProductMenuForPets(
        roomId: number,
        requestRoomObjectId: number,
        petTypeId: number,
        category: number,
        ownerId: number,
        inventoryStripId: number = -1
    ): void
    {
        const container = this._container;

        if(!container?.roomEngine) return;

        const items: UseProductItem[] = [];
        const count = container.roomEngine.getRoomObjectCount(roomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

        for(let i = 0; i < count; i++)
        {
            const object = container.roomEngine.getRoomObjectWithIndex(roomId, i, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

            if(!object) continue;

            const userData = container.roomSession.userDataManager.getUserDataByIndex(object.getId());

            if(!userData || userData.type !== AvatarInfoWidgetHandler.USER_TYPE_PET || userData.ownerId !== ownerId) continue;

            // A saddle offered to a pet that already wears one becomes a "replace".
            const replace = userData.hasSaddle && category === FurnitureCategory.PET_SADDLE;

            if(this.getPetTypeId(userData) !== petTypeId) continue;

            items.push(new UseProductItem(
                userData.roomObjectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER, userData.name,
                requestRoomObjectId, object.getId(), inventoryStripId, replace
            ));
        }

        this._widget?.showUseProductMenuForItems(items);
    }

    // AS3: AvatarInfoWidgetHandler.as::findPetWithWebId()
    private findPetWithWebId(webId: number): IUserData | null
    {
        const container = this._container;

        if(!container?.roomEngine) return null;

        const roomId = container.roomSession.roomId;
        const count = container.roomEngine.getRoomObjectCount(roomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

        for(let i = 0; i < count; i++)
        {
            const object = container.roomEngine.getRoomObjectWithIndex(roomId, i, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

            if(!object) continue;

            const userData = container.roomSession.userDataManager.getUserDataByIndex(object.getId());

            if(userData && userData.type === AvatarInfoWidgetHandler.USER_TYPE_PET && userData.webID === webId) return userData;
        }

        return null;
    }

    // AS3: AvatarInfoWidgetHandler.as::activateUseProductMenuForPets() — the `figure.split(" ")[0]`
    // it performs to read a pet's species.
    private getPetTypeId(userData: IUserData): number
    {
        const parts = (userData.figure ?? '').split(' ');

        return parts.length > 0 ? parseInt(parts[0], 10) : -1;
    }

    // AS3: AvatarInfoWidgetHandler.as::handleUseProductMenuRequestInventoryItem()/…RoomObject() —
    // the same split over the product's customParams.
    private getProductPetTypeId(furniData: IFurnitureData): number
    {
        const parts = (furniData.customParams ?? '').split(' ');
        const value = parts.length > 0 ? parseInt(parts[0], 10) : NaN;

        return Number.isNaN(value) ? -1 : value;
    }

    // AS3: AvatarInfoWidgetHandler.as::update()
    public update(): void
    {
    }

    // AS3: AvatarInfoWidgetHandler.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        // AS3 unsubscribes before nulling the container, because the setter drops the reference the
        // connection is reached through.
        if(this._customUserNotificationEvent && this._container?.connection)
        {
            this._container.connection.removeMessageEvent(this._customUserNotificationEvent);
        }

        this.container = null;
        this._widget = null;
        this._customUserNotificationEvent = null;
        this._disposed = true;
    }

    // AS3: AvatarInfoWidgetHandler.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }
}
