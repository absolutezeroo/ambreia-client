/**
 * FurnitureContextMenuWidgetHandler — the room-side half of the furniture context-menu widget.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/handler/FurnitureContextMenuWidgetHandler.as
 *
 * It turns room-engine events into calls on the widget's `show*` methods. AS3 also owns the
 * mystery-box toolbar tracker here and routes the mystery-box / mystery-trophy flows; the RPG fork
 * removed mystery boxes.
 *
 * Ported for the guild-furni, purchasable-clothing and monsterplant flows, including every other
 * request AS3 subscribes to.
 *
 * **Purchasable clothing arrives by two different routes and they are not interchangeable.** A
 * context menu (`RETWE_OPEN_FURNI_CONTEXT_MENU` carrying `PURCHASABLE_CLOTHING`) opens the generic
 * *use* menu; the widget request `ROWRE_REQUEST_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG`, raised by
 * a double click, opens the *confirmation dialog* and is owner-gated. This port had them collapsed
 * into one — the context-menu case called the dialog, and the widget request was left unsubscribed
 * on the grounds that nothing raised it, which was true only because `RoomEngine` had left its own
 * case unmapped on the grounds that nothing listened.
 */
import type {IConnection} from '@core/communication/connection/IConnection';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import type {IRoomObject} from '@room/object/IRoomObject';
import {RoomEngineToWidgetEvent} from '@habbo/room/events/RoomEngineToWidgetEvent';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import {RoomWidgetUseProductMessage} from '@habbo/ui/widget/messages/RoomWidgetUseProductMessage';
import type {IMessageEvent} from '@core/communication/messages/IMessageEvent';
import {FigureSetIdsMessageEvent} from '@habbo/communication/messages/incoming/inventory/FigureSetIdsMessageEvent';
import {
    GuildFurniContextMenuInfoMessageEvent
} from '@habbo/communication/messages/incoming/room/furniture/GuildFurniContextMenuInfoMessageEvent';
import type {
    GuildFurniContextMenuInfoParser
} from '@habbo/communication/messages/parser/room/furniture/GuildFurniContextMenuInfoParser';
import {
    JoinHabboGroupMessageComposer
} from '@habbo/communication/messages/outgoing/users/JoinHabboGroupMessageComposer';
import type {
    FigureSetIdsMessageParser
} from '@habbo/communication/messages/parser/inventory/FigureSetIdsMessageParser';
import {
    RedeemPurchasableClothingMessageComposer
} from '@habbo/communication/messages/outgoing/room/furniture/RedeemPurchasableClothingMessageComposer';
import {
    UpdateFigureDataMessageComposer
} from '@habbo/communication/messages/outgoing/avatar/UpdateFigureDataMessageComposer';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import type {FurnitureContextMenuWidget} from '@habbo/ui/widget/furniture/contextmenu/FurnitureContextMenuWidget';

export class FurnitureContextMenuWidgetHandler implements IRoomWidgetHandler
{
    /**
    * AS3: FurnitureContextMenuWidgetHandler.as::PENDING_PURCHASABLE_CLOTHING_TIMEOUT_MS
    *
    * Kept even though the clothing flow is a stub — the constant is readable in AS3 and belongs with
    * the fields it guards.
    */
    private static readonly PENDING_PURCHASABLE_CLOTHING_TIMEOUT_MS: number = 5000;

    /**
    * AS3: FurnitureContextMenuWidgetHandler.as::processEvent() — the `contextMenu` names a furniture
    * logic returns from `get contextMenu()`, which is what the widget switches on.
    */
    private static readonly CONTEXT_MENU_FRIEND_FURNITURE: string = 'FRIEND_FURNITURE';

    private static readonly CONTEXT_MENU_MONSTERPLANT_SEED: string = 'MONSTERPLANT_SEED';

    private static readonly CONTEXT_MENU_RANDOM_TELEPORT: string = 'RANDOM_TELEPORT';

    private static readonly CONTEXT_MENU_PURCHASABLE_CLOTHING: string = 'PURCHASABLE_CLOTHING';

    // AS3: .../src/com/sulake/habbo/ui/handler/FurnitureContextMenuWidgetHandler.as::_disposed
    private _disposed: boolean = false;

    // AS3: FurnitureContextMenuWidgetHandler.as::_container
    private _container: IRoomWidgetHandlerContainer | null = null;

    // AS3: FurnitureContextMenuWidgetHandler.as::_SafeStr_4549 (the widget)
    private _widget: FurnitureContextMenuWidget | null = null;

    // AS3: FurnitureContextMenuWidgetHandler.as::_SafeStr_4568 (the connection)
    private _connection: IConnection | null = null;

    // AS3: FurnitureContextMenuWidgetHandler.as::_pendingPurchasableClothingFurniName
    private _pendingPurchasableClothingFurniName: string | null = null;

    // AS3: FurnitureContextMenuWidgetHandler.as::_SafeStr_7014
    private _pendingPurchasableClothingFigure: string | null = null;

    // AS3: FurnitureContextMenuWidgetHandler.as::_SafeStr_7270
    private _pendingPurchasableClothingGender: string | null = null;

    // AS3: FurnitureContextMenuWidgetHandler.as::_SafeStr_6275
    private _figureSetIdsEvent: IMessageEvent | null = null;

    // AS3: FurnitureContextMenuWidgetHandler.as::_SafeStr_6438
    private _guildFurniContextMenuInfoEvent: IMessageEvent | null = null;

    // AS3: FurnitureContextMenuWidgetHandler.as::_SafeStr_7268 (request timestamp, -1 = none)
    private _pendingPurchasableClothingTime: number = -1;

    // DEVIATION: AS3 builds the mystery-box toolbar tracker here (`_SafeStr_6714`); the RPG fork
    //   removed mystery boxes, so the handler has nothing to construct.
    // AS3: FurnitureContextMenuWidgetHandler.as::FurnitureContextMenuWidgetHandler()

    // AS3: FurnitureContextMenuWidgetHandler.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::get type()
    public get type(): string
    {
        return '';
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::get roomEngine()
    public get roomEngine(): IRoomEngine | null
    {
        return this._container ? this._container.roomEngine : null;
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::get roomSession()
    public get roomSession(): IRoomSession | null
    {
        return this._container ? this._container.roomSession : null;
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::get container()
    public get container(): IRoomWidgetHandlerContainer | null
    {
        return this._container;
    }

    // DEVIATION: AS3 also subscribes to the mystery-box and mystery-trophy open-dialog requests;
    //   the RPG fork removed mystery boxes.
    // AS3: FurnitureContextMenuWidgetHandler.as::set container()
    public set container(value: IRoomWidgetHandlerContainer | null)
    {
        this.unsetContainer();

        this._container = value;

        if(value === null) return;

        const events = value.roomEngine?.events;

        if(!events) return;

        events.on(
            RoomEngineToWidgetEvent.REQUEST_MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG,
            this.onMonsterPlantSeedPlantConfirmationDialogRequested,
            this
        );
        events.on(
            RoomEngineToWidgetEvent.REQUEST_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG,
            this.onPurchasableClothingConfirmationDialogRequested,
            this
        );
        events.on(RoomEngineToWidgetEvent.REQUEST_EFFECTBOX_OPEN_DIALOG, this.onEffectBoxOpenDialogRequested, this);
    }

    // DEVIATION: AS3 also unsubscribes the mystery-box and mystery-trophy requests; the RPG fork
    //   removed mystery boxes.
    // AS3: FurnitureContextMenuWidgetHandler.as::unsetContainer()
    private unsetContainer(): void
    {
        const events = this._container?.roomEngine?.events;

        if(events)
        {
            events.off(
                RoomEngineToWidgetEvent.REQUEST_MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG,
                this.onMonsterPlantSeedPlantConfirmationDialogRequested,
                this
            );
            events.off(
                RoomEngineToWidgetEvent.REQUEST_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG,
                this.onPurchasableClothingConfirmationDialogRequested,
                this
            );
            events.off(RoomEngineToWidgetEvent.REQUEST_EFFECTBOX_OPEN_DIALOG, this.onEffectBoxOpenDialogRequested, this);
        }

        this._container = null;
    }

    // DEVIATION: AS3 also creates the mystery-box toolbar tracker's window here, gated on the
    //   tracker's config switch; the RPG fork removed mystery boxes.
    // AS3: FurnitureContextMenuWidgetHandler.as::set widget()
    public set widget(value: FurnitureContextMenuWidget | null)
    {
        this._widget = value;
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::get widget()
    public get widget(): FurnitureContextMenuWidget | null
    {
        return this._widget;
    }

    /**
     * Both of the handler's own incoming messages are registered here rather than in the
     * constructor, because the connection is handed over after construction.
     */
    // AS3: FurnitureContextMenuWidgetHandler.as::set connection()
    public set connection(value: IConnection | null)
    {
        this._connection = value;

        if(this._connection !== null && this._figureSetIdsEvent === null)
        {
            this._figureSetIdsEvent = new FigureSetIdsMessageEvent(this.onFigureSetIds);

            this._connection.addMessageEvent(this._figureSetIdsEvent);
        }

        if(this._connection !== null && this._guildFurniContextMenuInfoEvent === null)
        {
            this._guildFurniContextMenuInfoEvent = new GuildFurniContextMenuInfoMessageEvent(
                this.onGuildFurniContextMenuInfo
            );

            this._connection.addMessageEvent(this._guildFurniContextMenuInfoEvent);
        }
    }

    public get connection(): IConnection | null
    {
        return this._connection;
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::getWidgetMessages()
    public getWidgetMessages(): string[]
    {
        return [RoomWidgetUseProductMessage.MONSTERPLANT_SEED];
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::processWidgetMessage()
    public processWidgetMessage(message: unknown): unknown
    {
        const widgetMessage = message as RoomWidgetUseProductMessage | null;

        if(widgetMessage === null) return null;

        if(widgetMessage.type === RoomWidgetUseProductMessage.MONSTERPLANT_SEED)
        {
            this._container?.roomSession?.plantSeed(widgetMessage.roomObjectId);
        }

        return null;
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::getProcessedEvents()
    public getProcessedEvents(): string[]
    {
        return [
            RoomEngineToWidgetEvent.REQUEST_OPEN_FURNI_CONTEXT_MENU,
            RoomEngineToWidgetEvent.REQUEST_CLOSE_FURNI_CONTEXT_MENU
        ];
    }

    /** The floor-item data behind a room object — the confirmation dialogs read name and category off it. */
    // AS3: FurnitureContextMenuWidgetHandler.as::getFurniData()
    public getFurniData(roomObject: IRoomObject | null): {id: number; category: number; localizedName: string; customParams: string} | null
    {
        if(roomObject === null) return null;

        const typeId = roomObject.getModel()?.getNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID) ?? 0;

        return (this._container?.sessionDataManager?.getFloorItemData(typeId) ?? null) as
            {id: number; category: number; localizedName: string; customParams: string} | null;
    }

    // DEVIATION: AS3 also routes the MYSTERY_BOX context menu to the mystery-box bubble; the RPG
    //   fork removed mystery boxes.
    // AS3: FurnitureContextMenuWidgetHandler.as::processEvent()
    public processEvent(event: unknown): void
    {
        if(this._widget === null) return;

        const widgetEvent = event as RoomEngineToWidgetEvent | null;

        if(!widgetEvent) return;

        const object = this.getRoomObject(widgetEvent.objectId);

        if(object === null) return;

        switch(widgetEvent.type)
        {
            case RoomEngineToWidgetEvent.REQUEST_OPEN_FURNI_CONTEXT_MENU:
                switch(widgetEvent.contextMenu)
                {
                    case FurnitureContextMenuWidgetHandler.CONTEXT_MENU_FRIEND_FURNITURE:
                        this._widget.showFriendFurnitureContextMenu(object);
                        break;
                    case FurnitureContextMenuWidgetHandler.CONTEXT_MENU_RANDOM_TELEPORT:
                        this._widget.showRandomTeleportContextMenu(object, widgetEvent.category);
                        break;
                    case FurnitureContextMenuWidgetHandler.CONTEXT_MENU_MONSTERPLANT_SEED:
                        // AS3 gates this one on ownership: a visitor gets no seed menu.
                        if(this._container?.isOwnerOfFurniture(object) ?? false)
                        {
                            this._widget.showMonsterPlantSeedContextMenu(object, widgetEvent.category);
                        }
                        break;
                    // AS3 opens the *generic usable* menu here, not the confirmation dialog — that
                    // one belongs to the double-click path below. AS3 also leaves this case without
                    // a `break`; it is last in the switch, so it falls out either way.
                    case FurnitureContextMenuWidgetHandler.CONTEXT_MENU_PURCHASABLE_CLOTHING:
                        this._widget.showUsableFurnitureContextMenu(object, widgetEvent.category);
                        break;
                }
                break;
            case RoomEngineToWidgetEvent.REQUEST_CLOSE_FURNI_CONTEXT_MENU:
                this._widget.hideContextMenu(object);
                break;
        }
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::update()
    public update(): void
    {
    }

    /**
     * AS3 returns the engine rectangle as-is because the Flash room canvas sits at the desktop
     * origin. Here the canvas is a child of the room view, so the view's own offset is added —
     * the same adaptation AvatarInfoWidget.update() makes for the avatar bubble.
     */
    // AS3: FurnitureContextMenuWidgetHandler.as::getObjectRectangle()
    public getObjectRectangle(objectId: number): {
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number
    } | null
    {
        const container = this._container;

        if(!container?.roomEngine) return null;

        const rect = container.roomEngine.getRoomObjectBoundingRectangle(
            container.roomSession.roomId,
            objectId,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE,
            container.getFirstCanvasId()
        );

        if(!rect) return null;

        const viewRect = container.getRoomViewRect();
        const offsetX = viewRect?.x ?? 0;
        const offsetY = viewRect?.y ?? 0;

        return {
            left: rect.left + offsetX,
            top: rect.top + offsetY,
            right: rect.right + offsetX,
            bottom: rect.bottom + offsetY,
            width: rect.width,
            height: rect.height
        };
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::getObjectScreenLocation()
    public getObjectScreenLocation(objectId: number): { x: number; y: number } | null
    {
        const container = this._container;

        if(!container?.roomEngine) return null;

        const point = container.roomEngine.getRoomObjectScreenLocation(
            container.roomSession.roomId,
            objectId,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE,
            container.getFirstCanvasId()
        );

        if(!point) return null;

        const viewRect = container.getRoomViewRect();

        return {
            x: point.x + (viewRect?.x ?? 0),
            y: point.y + (viewRect?.y ?? 0)
        };
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::sendGoToHomeRoomMessage()
    public sendGoToHomeRoomMessage(roomId: number): void
    {
        this._container?.navigator?.goToPrivateRoom(roomId);
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::sendJoinToGroupMessage()
    public sendJoinToGroupMessage(groupId: number): void
    {
        this._connection?.send(new JoinHabboGroupMessageComposer(groupId));
    }

    /**
     * The server's answer to the guild-furni double click. AS3 drops it silently when the object
     * has already left the room, which is why the bubble is opened from the object and not from
     * the id in the message.
     */
    // AS3: FurnitureContextMenuWidgetHandler.as::onGuildFurniContextMenuInfo()
    private onGuildFurniContextMenuInfo = (event: IMessageEvent): void =>
    {
        if(this._widget === null) return;

        const parser = event.parser as GuildFurniContextMenuInfoParser | null;

        if(parser === null) return;

        const object = this.getRoomObject(parser.objectId);

        if(object === null) return;

        this._widget.showGuildFurnitureContextMenu(
            object,
            parser.guildId,
            parser.guildName,
            parser.guildHomeRoomId,
            parser.userIsMember,
            parser.guildHasReadableForum
        );
    };

    /**
     * First half of the outfit purchase: ask the server to redeem the furni, and remember what
     * to wear if it says yes. The figure is *not* applied here — `onFigureSetIds()` does that
     * once the reply names this furni, within PENDING_PURCHASABLE_CLOTHING_TIMEOUT_MS.
     */
    // AS3: FurnitureContextMenuWidgetHandler.as::redeemPurchasableClothing()
    public redeemPurchasableClothing(objectId: number, furniName: string, figure: string, gender: string): void
    {
        if(this._connection === null) return;

        this._pendingPurchasableClothingFurniName = furniName;
        this._pendingPurchasableClothingFigure = figure;
        this._pendingPurchasableClothingGender = gender;
        this._pendingPurchasableClothingTime = performance.now();

        this._connection.send(new RedeemPurchasableClothingMessageComposer(objectId));
    }

    /**
     * Second half: the reply lists every furni whose figure sets the player owns. The outfit is
     * applied only if the one just redeemed is in it — otherwise the redeem failed and the
     * pending request is dropped.
     */
    // AS3: FurnitureContextMenuWidgetHandler.as::onFigureSetIds()
    private onFigureSetIds = (event: IMessageEvent): void =>
    {
        const isFresh = this.hasFreshPendingPurchasableClothingRequest();

        if(this._connection === null || !isFresh)
        {
            if(!isFresh) this.clearPendingPurchasableClothingRequest();

            return;
        }

        const boundNames = (event.parser as FigureSetIdsMessageParser).boundFurnitureNames;

        if(boundNames === null || boundNames.indexOf(this._pendingPurchasableClothingFurniName ?? '') === -1) return;

        this._connection.send(new UpdateFigureDataMessageComposer(
            this._pendingPurchasableClothingFigure ?? '',
            this._pendingPurchasableClothingGender ?? ''
        ));

        this.clearPendingPurchasableClothingRequest();
    };

    // AS3: FurnitureContextMenuWidgetHandler.as::hasFreshPendingPurchasableClothingRequest()
    private hasFreshPendingPurchasableClothingRequest(): boolean
    {
        if(this._pendingPurchasableClothingTime < 0 || this._pendingPurchasableClothingFurniName === null)
        {
            return false;
        }

        return (performance.now() - this._pendingPurchasableClothingTime) <= FurnitureContextMenuWidgetHandler.PENDING_PURCHASABLE_CLOTHING_TIMEOUT_MS;
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::clearPendingPurchasableClothingRequest()
    private clearPendingPurchasableClothingRequest(): void
    {
        this._pendingPurchasableClothingFurniName = null;
        this._pendingPurchasableClothingFigure = null;
        this._pendingPurchasableClothingGender = null;
        this._pendingPurchasableClothingTime = -1;
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::getRoomObject()
    private getRoomObject(objectId: number): IRoomObject | null
    {
        const container = this._container;

        if(container === null || !container.roomEngine) return null;

        return container.roomEngine.getRoomObject(
            container.roomSession.roomId,
            objectId,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
        );
    }

    /**
     * The seed's other way in. Its context bubble reaches `showPlantSeedConfirmationDialog()`
     * through the Use button, but a double click skips the bubble entirely: the logic raises
     * ROWRE_MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG and the room engine forwards it here.
     * Owner-only, the same gate the bubble itself gets in processEvent().
     */
    // AS3: FurnitureContextMenuWidgetHandler.as::onMonsterPlantSeedPlantConfirmationDialogRequested()
    private onMonsterPlantSeedPlantConfirmationDialogRequested(event: RoomEngineToWidgetEvent): void
    {
        if(this._widget === null) return;

        const object = this.getRoomObject(event.objectId);

        if(object === null) return;

        if(!this._container?.isOwnerOfFurniture(object)) return;

        this._widget.showPlantSeedConfirmationDialog(object);
    }

    /**
	 * Double-clicking a purchasable-clothing furni. The context menu reaches the same furni through
	 * `showUsableFurnitureContextMenu()`; this path skips it and asks straight for the confirmation.
	 * Owner-only, like its monsterplant sibling.
	 */
    // AS3: FurnitureContextMenuWidgetHandler.as::onPurchasableClothingConfirmationDialogRequested()
    private onPurchasableClothingConfirmationDialogRequested(event: RoomEngineToWidgetEvent): void
    {
        if(this._widget === null) return;

        const object = this.getRoomObject(event.objectId);

        if(object === null) return;

        if(!this._container?.isOwnerOfFurniture(object)) return;

        this._widget.showPurchasableClothingConfirmationDialog(object);
    }

    /** Owner-only: an effect box is opened by whoever owns it. */
    // AS3: FurnitureContextMenuWidgetHandler.as::onEffectBoxOpenDialogRequested()
    private onEffectBoxOpenDialogRequested(event: RoomEngineToWidgetEvent): void
    {
        if(this._widget === null) return;

        const object = this.getRoomObject(event.objectId);

        if(object === null) return;

        if(!this._container?.isOwnerOfFurniture(object)) return;

        this._widget.showEffectBoxOpenDialog(object);
    }

    // AS3: FurnitureContextMenuWidgetHandler.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this.unsetContainer();

        // AS3 unregisters both of its message events here; the port kept them subscribed to a
        // connection it then dropped.
        if(this._connection !== null && this._guildFurniContextMenuInfoEvent !== null)
        {
            this._connection.removeMessageEvent(this._guildFurniContextMenuInfoEvent);
            this._guildFurniContextMenuInfoEvent = null;
        }

        if(this._connection !== null && this._figureSetIdsEvent !== null)
        {
            this._connection.removeMessageEvent(this._figureSetIdsEvent);
            this._figureSetIdsEvent = null;
        }

        this._connection = null;
        this._widget = null;

        this.clearPendingPurchasableClothingRequest();

        this._disposed = true;
    }
}
