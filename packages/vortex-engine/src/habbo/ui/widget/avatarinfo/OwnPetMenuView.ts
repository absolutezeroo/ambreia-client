/**
 * OwnPetMenuView — the bubble menu shown next to one of your own pets.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/OwnPetMenuView.as
 *
 * Same four modes as PetMenuView (normal / saddled-up / riding / monsterplant) but with the
 * owner-only actions: train, saddle off, riding + breeding permission checkboxes, breed,
 * revive, compost and the two catalog shortcuts (buy saddle / revive potion), built on the
 * `own_pet_menu` layout.
 *
 * AS3 adaptation: the window's WME_OVER/WME_OUT listeners become one `procedure` (a window
 * carries a single procedure in this port), which also handles click-away dismissal.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IRoomObject} from '@room/object/IRoomObject';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import type {RoomWidgetMessage} from '../messages/RoomWidgetMessage';
import {RoomWidgetUserActionMessage} from '../messages/RoomWidgetUserActionMessage';
import {RoomWidgetOpenProfileMessage} from '../messages/RoomWidgetOpenProfileMessage';
import {RoomWidgetPetCommandMessage} from '../messages/RoomWidgetPetCommandMessage';
import {AvatarContextInfoButtonView} from './AvatarContextInfoButtonView';
import type {PetInfoData} from './PetInfoData';
import type {AvatarInfoWidget} from './AvatarInfoWidget';

export class OwnPetMenuView extends AvatarContextInfoButtonView
{
    // AS3: OwnPetMenuView.as::MODE_NORMAL
    private static readonly MODE_NORMAL: number = 0;

    private static readonly MODE_SADDLED_UP: number = 1;

    private static readonly MODE_RIDING: number = 2;

    private static readonly MODE_MONSTERPLANT: number = 3;

    // Pet type ids AS3 tests inline. Names derived from the config keys guarding each branch
    // (`nest.breeding.<species>.enabled`) and from the saddle lookup — the ids themselves are
    // literals in the source with no named constant in any tree.
    private static readonly PET_TYPE_DOG: number = 0;

    private static readonly PET_TYPE_CAT: number = 1;

    private static readonly PET_TYPE_TERRIER: number = 3;

    private static readonly PET_TYPE_BEAR: number = 4;

    private static readonly PET_TYPE_PIG: number = 5;

    private static readonly PET_TYPE_HORSE: number = 15;

    private static readonly PET_TYPE_MONSTERPLANT: number = 16;

    // Furniture categories AS3 passes to findFurnitureData(): 16 = saddle, 20 = revive potion.
    private static readonly FURNI_CATEGORY_SADDLE: number = 16;

    private static readonly FURNI_CATEGORY_MONSTERPLANT_REVIVE: number = 20;

    // AS3: OwnPetMenuView.as::_petData (obfuscated `_SafeStr_4556`)
    private _petData: PetInfoData | null = null;
    // AS3: OwnPetMenuView.as::_mode
    private _mode: number = OwnPetMenuView.MODE_NORMAL;
    // AS3: OwnPetMenuView.as::_saddleFurnitureData (obfuscated `_SafeStr_6269`; named from the
    // findFurnitureData(16, 15) that fills it and the buy_saddle button that reads it)
    private _saddleFurnitureData: IFurnitureData | null = null;
    // AS3: OwnPetMenuView.as::_reviveFurnitureData (obfuscated `_SafeStr_8187`; named from the
    // findFurnitureData(20, 16) that fills it and the revive button that reads it)
    private _reviveFurnitureData: IFurnitureData | null = null;

    // AS3: OwnPetMenuView.as::_catalog
    protected _catalog: IHabboCatalog | null;
    // AS3: OwnPetMenuView.as::_habboTracking
    protected _habboTracking: IHabboTracking | null;

    // AS3: OwnPetMenuView.as::OwnPetMenuView()
    constructor(widget: AvatarInfoWidget, catalog: IHabboCatalog | null)
    {
        super(widget);

        this._autoHideEnabled = false;
        // AS3 pulls the singleton via HabboTracking.getInstance(); the port hands it down the
        // widget handler's container instead.
        this._habboTracking = widget.handler?.container?.habboTracking ?? null;
        this._catalog = catalog;
    }

    // AS3: OwnPetMenuView.as::setup()
    public static setup(
        view: OwnPetMenuView,
        userId: number,
        userName: string,
        roomIndex: number,
        userType: number,
        petData: PetInfoData
    ): void
    {
        if(!view) return;

        view._petData = petData;

        const hasFreeSaddle = view.widget.hasFreeSaddle;
        const isRiding = view.widget.isRiding;

        if(view.widget.isMonsterPlant())
        {
            view._mode = OwnPetMenuView.MODE_MONSTERPLANT;
        }
        else if(hasFreeSaddle && !isRiding)
        {
            view._mode = OwnPetMenuView.MODE_SADDLED_UP;
        }
        else if(isRiding)
        {
            view._mode = OwnPetMenuView.MODE_RIDING;
        }
        else
        {
            view._mode = OwnPetMenuView.MODE_NORMAL;
        }

        AvatarContextInfoButtonView.setupButtonView(view, userId, userName, roomIndex, userType, false);
    }

    // AS3: OwnPetMenuView.as::get widget()
    public get widget(): AvatarInfoWidget
    {
        return this._widget as AvatarInfoWidget;
    }

    // AS3: OwnPetMenuView.as::get petId()
    public get petId(): number
    {
        return this.userId;
    }

    // AS3: OwnPetMenuView.as::updateWindow()
    protected override updateWindow(): void
    {
        if(!this._widget.assets || !this._widget.windowManager) return;

        if(this.minimized)
        {
            const minimizedView = this.getMinimizedView();

            if(minimizedView) this.activeView = minimizedView;

            return;
        }

        if(!this._window)
        {
            this._window = this._widget.windowManager.buildWidgetLayout('own_pet_menu', 0) as IWindowContainer | null;

            if(!this._window) return;

            this._window.procedure = this.windowProc;

            const minimize = this._window.findChildByName('minimize');

            if(minimize) minimize.procedure = this.onMinimize;
        }

        this._buttons = this._window.findChildByName('buttons') as IItemListWindow | null;

        if(this._buttons) this._buttons.procedure = this.buttonEventProc;

        const nameWindow = this._window.findChildByName('name') as ITextWindow | null;

        if(nameWindow) nameWindow.caption = this._userName;

        this._window.visible = false;
        this.activeView = this._window;
        this.updateButtons();
    }

    // AS3: OwnPetMenuView.as::updateButtons()
    public updateButtons(): void
    {
        if(!this._window || !this._petData || !this._buttons) return;

        this._buttons.autoArrangeItems = false;

        const count = this._buttons.numListItems;

        for(let i = 0; i < count; i++)
        {
            const item = this._buttons.getListItemAt(i);

            if(item) item.visible = false;
        }

        this._saddleFurnitureData = null;

        const handler = this.widget.handler;
        const container = handler?.container ?? null;
        const config = this.widget.configuration;

        switch(this._mode)
        {
            case OwnPetMenuView.MODE_NORMAL:
                this.showButton('respect', this._petData.petRespectLeft > 0);
                this.showButton('train');
                this.showButton('pick_up');

                if(this._petData.petType === OwnPetMenuView.PET_TYPE_HORSE)
                {
                    this._saddleFurnitureData = this.findFurnitureData(OwnPetMenuView.FURNI_CATEGORY_SADDLE, OwnPetMenuView.PET_TYPE_HORSE);

                    if(this._saddleFurnitureData) this.showButton('buy_saddle');
                }

                // AS3 tests each species against its own config flag, one branch per species.
                if(config?.getBoolean('nest.breeding.bear.enabled') && this._petData.petType === OwnPetMenuView.PET_TYPE_BEAR)
                {
                    this.showButton('breed');
                }

                if(config?.getBoolean('nest.breeding.terrier.enabled') && this._petData.petType === OwnPetMenuView.PET_TYPE_TERRIER)
                {
                    this.showButton('breed');
                }

                if(config?.getBoolean('nest.breeding.cat.enabled') && this._petData.petType === OwnPetMenuView.PET_TYPE_CAT)
                {
                    this.showButton('breed');
                }

                if(config?.getBoolean('nest.breeding.dog.enabled') && this._petData.petType === OwnPetMenuView.PET_TYPE_DOG)
                {
                    this.showButton('breed');
                }

                if(config?.getBoolean('nest.breeding.pig.enabled') && this._petData.petType === OwnPetMenuView.PET_TYPE_PIG)
                {
                    this.showButton('breed');
                }
                break;
            case OwnPetMenuView.MODE_SADDLED_UP:
                this.showButton('mount');

                if(config?.getBoolean('sharedhorseriding.enabled'))
                {
                    this.showButton('toggle_riding_permission');
                    this.enableCheckbox('toggle_riding_permission', this._petData.accessRights === 1);
                }

                this.showButton('respect', this._petData.petRespectLeft > 0);
                this.showButton('train');
                this.showButton('pick_up');
                this.showButton('saddle_off');
                break;
            case OwnPetMenuView.MODE_RIDING:
                this.showButton('dismount');
                this.showButton('respect', this._petData.petRespectLeft > 0);
                break;
            case OwnPetMenuView.MODE_MONSTERPLANT:
                this.showButton('pick_up');

                if(this._petData.canRevive)
                {
                    this._reviveFurnitureData = this.findFurnitureData(OwnPetMenuView.FURNI_CATEGORY_MONSTERPLANT_REVIVE, OwnPetMenuView.PET_TYPE_MONSTERPLANT);
                    this.showButton('revive');

                    if(config?.getBoolean('monsterplants.composting.enabled') && container?.roomSession?.isRoomOwner)
                    {
                        this.showButton('compost');
                    }

                    break;
                }

                this.showButton('treat', true, (this._petData.energy / this._petData.energyMax) < 0.98);

                if(this._petData.level === this._petData.levelMax && this._petData.canBreed)
                {
                    this.showButton('toggle_breeding_permission');
                    this.enableCheckbox('toggle_breeding_permission', this._petData.hasBreedingPermission);
                    this.showButton('breed');
                }
                break;
        }

        if(config?.getBoolean('handitem.give.pet.enabled') && container?.roomEngine && container.roomSession)
        {
            const ownRoomIndex = container.roomSession.ownUserRoomId;
            const ownObject = container.roomEngine.getRoomObject(
                container.roomSession.roomId, ownRoomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
            );

            if(ownObject)
            {
                const carryId = ownObject.getModel().getNumber('figure_carry_object');

                if(carryId > 0 && carryId < 999999) this.showButton('pass_handitem');
            }
        }

        // AS3 asks the wired component (`showInspectButton()`); the RPG fork removed wired.
        this.showButton('wired_inspect', false);

        this._widget.localizations?.registerParameter(
            'infostand.button.petrespect', 'count', this._petData.petRespectLeft.toString()
        );

        this._buttons.autoArrangeItems = true;
        this._buttons.visible = true;
    }

    // AS3: OwnPetMenuView.as::findFurnitureData()
    private findFurnitureData(category: number, customParam: number): IFurnitureData | null
    {
        const items = this.widget.handler?.container?.sessionDataManager?.getFloorItemsDataByCategory(category) ?? [];

        for(const item of items)
        {
            const params = (item.customParams ?? '').split(' ');
            const value = params.length >= 1 ? parseInt(params[0], 10) : -1;

            if(value === customParam) return item;
        }

        return null;
    }

    // AS3: OwnPetMenuView.as::openCatalogPage()
    private openCatalogPage(furnitureData: IFurnitureData | null): boolean
    {
        if(!this._catalog || !furnitureData || furnitureData.purchaseOfferId < 0) return false;

        this._catalog.openCatalogPageByOfferId(furnitureData.purchaseOfferId, 'NORMAL');

        // AS3 also guards on `!_habboTracking.disposed`; IHabboTracking exposes no such flag
        // in this port, so the null check is the whole guard.
        this._habboTracking?.trackGoogle('infostandCatalogButton', 'offer', furnitureData.purchaseOfferId);

        return true;
    }

    // AS3: OwnPetMenuView.as::findRoomObject()
    // Declared but never called in AS3 either; kept so the class stays complete.
    private findRoomObject(furnitureData: IFurnitureData | null): IRoomObject | null
    {
        if(!furnitureData) return null;

        const container = this.widget.handler?.container ?? null;

        if(!container) return null;

        const roomEngine = container.roomEngine;

        if(!roomEngine) return null;

        const roomId = container.roomSession.roomId;
        const count = roomEngine.getRoomObjectCount(roomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

        for(let i = 0; i < count; i++)
        {
            const object = roomEngine.getRoomObjectWithIndex(roomId, i, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

            if(object && object.getModel().getNumber('furniture_type_id') === furnitureData.id) return object;
        }

        return null;
    }

    // AS3: OwnPetMenuView.as::enableCheckbox()
    private enableCheckbox(name: string, selected: boolean): void
    {
        const checkbox = this.getCheckbox(name);

        if(!checkbox) return;

        if(selected) checkbox.select();
        else checkbox.unselect();
    }

    // AS3: OwnPetMenuView.as::getCheckbox()
    private getCheckbox(name: string): ISelectableWindow | null
    {
        if(!this._buttons) return null;

        const row = this._buttons.getListItemByName(name) as IWindowContainer | null;

        if(!row) return null;

        return row.findChildByName(`${name}_checkbox`) as ISelectableWindow | null;
    }

    // AS3: OwnPetMenuView.as::buttonEventProc()
    protected override buttonEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(this.disposed || !this._window || this._window.disposed) return;

        let close = false;
        let message: RoomWidgetMessage | null = null;

        if(event.type === 'WME_CLICK')
        {
            if(window.name === 'button')
            {
                close = true;

                switch(window.parent?.name)
                {
                    case 'respect':
                        // AS3 decrements before the server confirms, so the button hides on click.
                        if(this._petData) this._petData.petRespectLeft -= 1;
                        this.updateButtons();
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.RESPECT_PET, this.petId);
                        break;
                    case 'treat':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.TREAT_PET, this.petId);
                        break;
                    case 'pass_handitem':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.GIVE_CARRY_ITEM_TO_PET, this.petId);
                        break;
                    case 'wired_inspect':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.WIRED_INSPECT_PET, this.petId);
                        break;
                    case 'train':
                        this.widget.openTrainingView();
                        break;
                    case 'pick_up':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.PICK_UP_PET, this.petId);
                        this.widget.closeTrainingView();
                        break;
                    case 'mount':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.MOUNT_PET, this.petId);
                        break;
                    case 'toggle_riding_permission':
                    {
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.TOGGLE_PET_RIDING_PERMISSION, this.petId);

                        const checkbox = this.getCheckbox('toggle_riding_permission');

                        if(checkbox) this.enableCheckbox('toggle_riding_permission', !checkbox.isSelected);
                        break;
                    }
                    case 'toggle_breeding_permission':
                    {
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.TOGGLE_PET_BREEDING_PERMISSION, this.petId);

                        const checkbox = this.getCheckbox('toggle_breeding_permission');

                        if(checkbox) this.enableCheckbox('toggle_breeding_permission', !checkbox.isSelected);
                        break;
                    }
                    case 'dismount':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.DISMOUNT_PET, this.petId);
                        break;
                    case 'saddle_off':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.SADDLE_OFF, this.petId);
                        break;
                    case 'breed':
                        // Normal pets breed by *saying* the localised breed command (id 46) — there is
                        // no breeding packet for them. Monsterplants use the real negotiation instead.
                        if(this._mode === OwnPetMenuView.MODE_NORMAL && this._petData)
                        {
                            const key = `pet.command.${RoomWidgetPetCommandMessage.BREED_TRAIN_COMMAND_ID}`;
                            const command = this._widget.localizations?.getLocalization(key) ?? '';

                            message = new RoomWidgetPetCommandMessage(
                                RoomWidgetPetCommandMessage.PET_COMMAND, this._petData.id, `${this._petData.name} ${command}`
                            );
                        }
                        else if(this._mode === OwnPetMenuView.MODE_MONSTERPLANT)
                        {
                            message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.REQUEST_BREED_PET, this.petId);
                        }
                        break;
                    case 'harvest':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.HARVEST_PET, this.petId);
                        break;
                    case 'revive':
                        // AS3 opens the potion's catalog page and sends the revive action either way.
                        this.openCatalogPage(this._reviveFurnitureData);
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.REVIVE_PET, this.petId);
                        break;
                    case 'compost':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.COMPOST_PLANT, this.petId);
                        break;
                    case 'buy_saddle':
                        this.openCatalogPage(this._saddleFurnitureData);
                        break;
                }
            }
            else if(window.name === 'profile_link')
            {
                message = new RoomWidgetOpenProfileMessage(
                    RoomWidgetOpenProfileMessage.OPEN_USER_PROFILE, this.petId, 'ownPetContextMenu'
                );
            }
            else if(window.name === 'toggle_riding_permission_checkbox')
            {
                close = true;
                message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.TOGGLE_PET_RIDING_PERMISSION, this.petId);
            }
            else if(window.name === 'toggle_breeding_permission_checkbox')
            {
                close = true;
                message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.TOGGLE_PET_BREEDING_PERMISSION, this.petId);
            }

            if(message) this._widget.messageListener?.processWidgetMessage(message);
        }
        else
        {
            this.applyButtonHover(event, window);
        }

        if(close && !this.disposed)
        {
            this._widget.removeView(this, false);
        }
    };

    // AS3: OwnPetMenuView.as::updateWindow() — the WME_OVER/WME_OUT listeners on _window,
    // plus the port's click-away dismissal.
    private windowProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK_AWAY')
        {
            this._widget.removeView(this, false);

            return;
        }

        this.onMouseHoverEvent(event, window);
    };

    // AS3: OwnPetMenuView.as::changeMode()
    private changeMode(mode: number): void
    {
        this._mode = mode;
        this.updateButtons();
    }

    // AS3: OwnPetMenuView.as::dispose()
    public override dispose(): void
    {
        this._petData = null;
        this._saddleFurnitureData = null;
        this._reviveFurnitureData = null;
        this._catalog = null;
        this._habboTracking = null;

        super.dispose();
    }
}
