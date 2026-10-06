/**
 * FurnitureContextMenuWidget — one widget behind every furniture context bubble and dialog.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/furniture/contextmenu/FurnitureContextMenuWidget.as
 *
 * AS3 keeps one instance of each sub-view alive for the whole room and swaps which one is the
 * "active view", so only one bubble can be on screen at a time. `_activeView` is that slot; the
 * per-frame `update()` is registered only while something occupies it.
 *
 * All eleven sub-views are ported and built here, as AS3 does.
 */
import {Logger} from '@core/utils/Logger';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IUpdateReceiver} from '@core/runtime/IContext';
import type {IHabboLocalizationManager} from '@habbo/localization/IHabboLocalizationManager';
import type {IHabboWindowManager} from '@habbo/window/IHabboWindowManager';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboGroupsManager} from '@habbo/groups/IHabboGroupsManager';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IRoomEngine} from '@habbo/room/IRoomEngine';
import {RoomEngineObjectEvent} from '@habbo/room/events/RoomEngineObjectEvent';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IRoomWidgetHandler} from '@habbo/ui/IRoomWidgetHandler';
import type {IRoomWidgetHandlerContainer} from '@habbo/ui/IRoomWidgetHandlerContainer';
import type {FurnitureContextMenuWidgetHandler} from '@habbo/ui/handler/FurnitureContextMenuWidgetHandler';
import {RoomWidgetBase} from '@habbo/ui/widget/RoomWidgetBase';
import type {ContextInfoView} from '@habbo/ui/widget/contextmenu/ContextInfoView';
import type {IContextMenuParentWidget} from '@habbo/ui/widget/contextmenu/IContextMenuParentWidget';
import {FriendFurniContextMenuView} from '@habbo/ui/widget/furniture/friendfurni/FriendFurniContextMenuView';
import {GenericUsableFurnitureContextMenuView} from './GenericUsableFurnitureContextMenuView';
import {RandomTeleportContextMenuView} from './RandomTeleportContextMenuView';
import {MonsterPlantSeedContextMenuView} from './MonsterPlantSeedContextMenuView';
import {MonsterPlantSeedConfirmationView} from './MonsterPlantSeedConfirmationView';
import {PurchasableClothingConfirmationView} from './PurchasableClothingConfirmationView';
import {EffectBoxOpenDialogView} from '@habbo/ui/widget/furniture/effectbox/EffectBoxOpenDialogView';
import {
    GuildFurnitureContextMenuView
} from '@habbo/ui/widget/furniture/guildfurnicontextmenu/GuildFurnitureContextMenuView';
import {FurnitureContextInfoView} from './FurnitureContextInfoView';

const log = Logger.getLogger('habbo.ui.widget.furniture.contextmenu.FurnitureContextMenuWidget');

export class FurnitureContextMenuWidget extends RoomWidgetBase implements IContextMenuParentWidget, IUpdateReceiver
{
    // AS3: FurnitureContextMenuWidget.as::showFriendFurnitureContextMenu() etc. — the update priority.
    private static readonly UPDATE_RECEIVER_PRIORITY: number = 10;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_4550 (the active view)
    private _activeView: FurnitureContextInfoView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_selectedObject
    private _selectedObject: IRoomObject | null = null;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_5789
    private _guildFurnitureContextMenuView: GuildFurnitureContextMenuView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_5807
    private _friendFurniContextMenuView: FriendFurniContextMenuView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_5639
    private _genericUsableContextMenuView: GenericUsableFurnitureContextMenuView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_6679
    private _randomTeleportContextMenuView: RandomTeleportContextMenuView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_6908
    private _monsterPlantSeedContextMenuView: MonsterPlantSeedContextMenuView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_5512
    private _monsterPlantSeedConfirmationView: MonsterPlantSeedConfirmationView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_6070
    private _purchasableClothingConfirmationView: PurchasableClothingConfirmationView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_SafeStr_6094
    private _effectBoxOpenDialogView: EffectBoxOpenDialogView | null = null;

    // AS3: FurnitureContextMenuWidget.as::_catalog
    private _catalog: IHabboCatalog | null;

    /**
     * AS3 registers on the component that owns the update loop (`_SafeCls_50`, the room UI). This
     * port drives per-frame widget updates off the window manager, same as AvatarInfoWidget.
     */
    private _updateRegistered: boolean = false;

    // DEVIATION: AS3 also builds the mystery-box context menu, the mystery-box open dialog and the
    //   mystery-trophy dialog, with a `show*` method for each; the RPG fork removed mystery boxes.
    // AS3: FurnitureContextMenuWidget.as::FurnitureContextMenuWidget()
    constructor(
        handler: IRoomWidgetHandler,
        windowManager: IHabboWindowManager,
        assets: IAssetLibrary | null,
        localizations: IHabboLocalizationManager | null,
        groupsManager: IHabboGroupsManager | null,
        catalog: IHabboCatalog | null
    )
    {
        super(handler, windowManager, assets, localizations);

        this._catalog = catalog;

        this._guildFurnitureContextMenuView = new GuildFurnitureContextMenuView(this, groupsManager, windowManager);
        this._friendFurniContextMenuView = new FriendFurniContextMenuView(this);
        this._genericUsableContextMenuView = new GenericUsableFurnitureContextMenuView(this);
        this._randomTeleportContextMenuView = new RandomTeleportContextMenuView(this);
        this._monsterPlantSeedContextMenuView = new MonsterPlantSeedContextMenuView(this);
        this._monsterPlantSeedConfirmationView = new MonsterPlantSeedConfirmationView(this);
        this._purchasableClothingConfirmationView = new PurchasableClothingConfirmationView(this);
        this._effectBoxOpenDialogView = new EffectBoxOpenDialogView(this);

        this.handler.widget = this;

        this.handler.roomEngine?.events.on(RoomEngineObjectEvent.REOE_REMOVED, this.onRoomObjectRemoved, this);
    }

    // AS3: FurnitureContextMenuWidget.as::get handler()
    public get handler(): FurnitureContextMenuWidgetHandler
    {
        return this.widgetHandler as FurnitureContextMenuWidgetHandler;
    }

    // AS3: FurnitureContextMenuWidget.as::get container()
    public get container(): IRoomWidgetHandlerContainer | null
    {
        return this.handler?.container ?? null;
    }

    // AS3: FurnitureContextMenuWidget.as::get roomEngine()
    public get roomEngine(): IRoomEngine | null
    {
        return this.container?.roomEngine ?? null;
    }

    // AS3: FurnitureContextMenuWidget.as::get catalog()
    public get catalog(): IHabboCatalog | null
    {
        return this._catalog;
    }

    /**
     * AS3 returns null outright — the furniture menus never need the friend list, but the
     * interface they share with the avatar menu declares it.
     */
    // AS3: FurnitureContextMenuWidget.as::get friendList()
    public get friendList(): IHabboFriendList | null
    {
        return null;
    }

    // AS3: FurnitureContextMenuWidget.as::hideContextMenu()
    public hideContextMenu(object: IRoomObject): void
    {
        if(this._selectedObject !== null && this._selectedObject.getId() === object.getId())
        {
            this.removeView(this._activeView, false);
            this.removeUpdateReceiver();
            this._selectedObject = null;
        }
    }

    /**
     * The only bubble whose caption is not the furni's own name: `setup()`'s third argument
     * carries the guild's, and the view paints it into the layout's `name` field.
     *
     * The four flags land on the view rather than here because `updateButtons()` re-reads them
     * every time the window is rebuilt.
     */
    // AS3: FurnitureContextMenuWidget.as::showGuildFurnitureContextMenu()
    public showGuildFurnitureContextMenu(
        object: IRoomObject,
        guildId: number,
        guildName: string,
        guildHomeRoomId: number,
        userIsMember: boolean,
        guildHasReadableForum: boolean
    ): void
    {
        if(this._guildFurnitureContextMenuView === null) return;

        this._selectedObject = object;

        this._guildFurnitureContextMenuView.guildId = guildId;
        this._guildFurnitureContextMenuView.guildHomeRoomId = guildHomeRoomId;
        this._guildFurnitureContextMenuView.userIsMember = userIsMember;
        this._guildFurnitureContextMenuView.guildHasReadableForum = guildHasReadableForum;

        if(this._activeView !== null) this.removeView(this._activeView, false);

        this._activeView = this._guildFurnitureContextMenuView;

        FurnitureContextInfoView.setup(this._activeView, object, guildName);

        this.registerUpdateReceiver();
    }

    /** Owner-gated by the handler, not here — AS3 checks before calling. */
    // AS3: FurnitureContextMenuWidget.as::showMonsterPlantSeedContextMenu()
    public showMonsterPlantSeedContextMenu(object: IRoomObject, category: number): void
    {
        this._selectedObject = object;

        if(this._activeView !== null) this.removeView(this._activeView, false);

        if(this._monsterPlantSeedContextMenuView === null)
        {
            this._monsterPlantSeedContextMenuView = new MonsterPlantSeedContextMenuView(this);
        }

        this._monsterPlantSeedContextMenuView.objectCategory = category;

        this._activeView = this._monsterPlantSeedContextMenuView;

        FurnitureContextInfoView.setup(this._activeView, object);

        this.registerUpdateReceiver();
    }

    // AS3: FurnitureContextMenuWidget.as::showEffectBoxOpenDialog()
    public showEffectBoxOpenDialog(object: IRoomObject): void
    {
        this._selectedObject = object;

        if(this._activeView !== null) this.removeView(this._activeView, false);

        if(this._effectBoxOpenDialogView === null)
        {
            this._effectBoxOpenDialogView = new EffectBoxOpenDialogView(this);
        }

        this._effectBoxOpenDialogView.open(object.getId());
    }

    // AS3: FurnitureContextMenuWidget.as::showPurchasableClothingConfirmationDialog()
    public showPurchasableClothingConfirmationDialog(object: IRoomObject): void
    {
        this._selectedObject = object;

        if(this._activeView !== null) this.removeView(this._activeView, false);

        if(this._purchasableClothingConfirmationView === null)
        {
            this._purchasableClothingConfirmationView = new PurchasableClothingConfirmationView(this);
        }

        this._purchasableClothingConfirmationView.open(object.getId());
    }

    /**
     * Not a bubble: the confirmation is its own window, so the active view is dismissed and
     * nothing replaces it.
     */
    // AS3: FurnitureContextMenuWidget.as::showPlantSeedConfirmationDialog()
    public showPlantSeedConfirmationDialog(object: IRoomObject): void
    {
        this._selectedObject = object;

        if(this._activeView !== null) this.removeView(this._activeView, false);

        if(this._monsterPlantSeedConfirmationView === null)
        {
            this._monsterPlantSeedConfirmationView = new MonsterPlantSeedConfirmationView(this);
        }

        this._monsterPlantSeedConfirmationView.open(object.getId());
    }

    // AS3: FurnitureContextMenuWidget.as::showUsableFurnitureContextMenu()
    public showUsableFurnitureContextMenu(object: IRoomObject, category: number): void
    {
        this._selectedObject = object;

        if(this._activeView !== null) this.removeView(this._activeView, false);

        if(this._genericUsableContextMenuView === null)
        {
            this._genericUsableContextMenuView = new GenericUsableFurnitureContextMenuView(this);
        }

        this._genericUsableContextMenuView.show();
        this._genericUsableContextMenuView.objectCategory = category;

        this._activeView = this._genericUsableContextMenuView;

        FurnitureContextInfoView.setup(this._activeView, object);

        this.registerUpdateReceiver();
    }

    /** Unlike its siblings this one never calls `show()` — AS3 does not either. */
    // AS3: FurnitureContextMenuWidget.as::showRandomTeleportContextMenu()
    public showRandomTeleportContextMenu(object: IRoomObject, category: number): void
    {
        this._selectedObject = object;

        if(this._activeView !== null) this.removeView(this._activeView, false);

        if(this._randomTeleportContextMenuView === null)
        {
            this._randomTeleportContextMenuView = new RandomTeleportContextMenuView(this);
        }

        this._randomTeleportContextMenuView.objectCategory = category;

        this._activeView = this._randomTeleportContextMenuView;

        FurnitureContextInfoView.setup(this._activeView, object);

        this.registerUpdateReceiver();
    }

    // AS3: FurnitureContextMenuWidget.as::showFriendFurnitureContextMenu()
    public showFriendFurnitureContextMenu(object: IRoomObject): void
    {
        this._selectedObject = object;

        if(this._activeView !== null) this.removeView(this._activeView, false);

        if(this._friendFurniContextMenuView === null)
        {
            this._friendFurniContextMenuView = new FriendFurniContextMenuView(this);
        }

        this._friendFurniContextMenuView.show();

        this._activeView = this._friendFurniContextMenuView;

        FurnitureContextInfoView.setup(this._activeView, object);

        this.registerUpdateReceiver();
    }

    // AS3: FurnitureContextMenuWidget.as::removeView()
    public removeView(view: ContextInfoView | null, animate: boolean): void
    {
        if(!view) return;

        view.hide(animate);

        if(view === this._activeView)
        {
            this._activeView = null;
        }
    }

    /**
     * AS3 registers this widget as an update receiver only while a view is up, and the view does
     * the actual positioning from the object's on-screen rectangle.
     */
    // AS3: FurnitureContextMenuWidget.as::update()
    public update(time: number): void
    {
        if(this._activeView === null || this._selectedObject === null) return;

        const objectId = this._selectedObject.getId();
        const screenLocation = this.handler.getObjectScreenLocation(objectId);

        if(screenLocation === null) return;

        this._activeView.update(this.handler.getObjectRectangle(objectId), screenLocation, time);
    }

    // AS3: FurnitureContextMenuWidget.as::onRoomObjectRemoved()
    private onRoomObjectRemoved(event: RoomEngineObjectEvent): void
    {
        if(event.category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) return;

        if(this._selectedObject !== null && this._selectedObject.getId() === event.objectId)
        {
            this.removeView(this._activeView, false);
            this.removePlantSeedConfirmationView();
            this.removeUpdateReceiver();
            this._selectedObject = null;
        }
    }

    /**
     * The seed confirmation is a window, not a bubble, so `removeView()` does not reach it — it
     * has to be closed by name when the furni it belongs to leaves the room.
     */
    // AS3: FurnitureContextMenuWidget.as::removePlantSeedConfirmationView()
    private removePlantSeedConfirmationView(): void
    {
        this._monsterPlantSeedConfirmationView?.close();
    }

    private registerUpdateReceiver(): void
    {
        if(this._updateRegistered) return;

        this.windowManager.registerUpdateReceiver(this, FurnitureContextMenuWidget.UPDATE_RECEIVER_PRIORITY);
        this._updateRegistered = true;
    }

    private removeUpdateReceiver(): void
    {
        if(!this._updateRegistered) return;

        this.windowManager.removeUpdateReceiver(this);
        this._updateRegistered = false;
    }

    // AS3: FurnitureContextMenuWidget.as::release()
    public override release(): void
    {
        if(this._selectedObject !== null)
        {
            this.hideContextMenu(this._selectedObject);
        }

        if(this._activeView !== null)
        {
            this.removeView(this._activeView, false);
        }

        super.release();
    }

    // AS3: FurnitureContextMenuWidget.as::dispose()
    public override dispose(): void
    {
        if(this.disposed) return;

        this.handler?.roomEngine?.events.off(RoomEngineObjectEvent.REOE_REMOVED, this.onRoomObjectRemoved, this);

        this.removeUpdateReceiver();
        this.removeView(this._activeView, false);

        // AS3 disposes all eleven sub-views here; the port used to drop only three of them, so
        // the other eight kept their windows and listeners for the life of the page.
        this._guildFurnitureContextMenuView?.dispose();
        this._guildFurnitureContextMenuView = null;

        this._randomTeleportContextMenuView?.dispose();
        this._randomTeleportContextMenuView = null;

        this._monsterPlantSeedContextMenuView?.dispose();
        this._monsterPlantSeedContextMenuView = null;

        this._monsterPlantSeedConfirmationView?.dispose();
        this._monsterPlantSeedConfirmationView = null;

        this._friendFurniContextMenuView?.dispose();
        this._friendFurniContextMenuView = null;

        this._genericUsableContextMenuView?.dispose();
        this._genericUsableContextMenuView = null;

        this._effectBoxOpenDialogView?.dispose();
        this._effectBoxOpenDialogView = null;

        this._purchasableClothingConfirmationView?.dispose();
        this._purchasableClothingConfirmationView = null;

        this._catalog = null;
        this._selectedObject = null;

        log.debug('Furniture context menu widget disposed');

        super.dispose();
    }
}
