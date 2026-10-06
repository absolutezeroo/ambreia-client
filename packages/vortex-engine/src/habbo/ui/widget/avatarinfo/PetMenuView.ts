/**
 * PetMenuView — the bubble menu shown next to somebody else's pet.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/PetMenuView.as
 *
 * Mode-driven button set (normal / saddled-up / riding / monsterplant), built on the
 * `pet_menu` layout. OwnPetMenuView is the richer sibling shown for your own pets.
 *
 * AS3 adaptation: the window's WME_OVER/WME_OUT listeners become one `procedure`
 * (a window carries a single procedure in this port), which also handles the
 * click-away dismissal OwnAvatarMenuView uses in place of RWROUE_OBJECT_DESELECTED.
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import type {RoomWidgetMessage} from '../messages/RoomWidgetMessage';
import {RoomWidgetUserActionMessage} from '../messages/RoomWidgetUserActionMessage';
import {RoomWidgetOpenProfileMessage} from '../messages/RoomWidgetOpenProfileMessage';
import {AvatarContextInfoButtonView} from './AvatarContextInfoButtonView';
import type {PetInfoData} from './PetInfoData';
import type {AvatarInfoWidget} from './AvatarInfoWidget';

export class PetMenuView extends AvatarContextInfoButtonView
{
    // AS3: PetMenuView.as::MODE_NORMAL
    private static readonly MODE_NORMAL: number = 0;

    private static readonly MODE_SADDLED_UP: number = 1;

    private static readonly MODE_RIDING: number = 2;

    private static readonly MODE_MONSTER_PLANT: number = 3;

    // AS3: PetMenuView.as::_petData (obfuscated `_SafeStr_4556`)
    private _petData: PetInfoData | null = null;
    // AS3: PetMenuView.as::_mode
    private _mode: number = PetMenuView.MODE_NORMAL;

    // AS3: PetMenuView.as::PetMenuView()
    constructor(widget: AvatarInfoWidget)
    {
        super(widget);
        this._autoHideEnabled = false;
    }

    // AS3: PetMenuView.as::setup()
    public static setup(
        view: PetMenuView,
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
            view._mode = PetMenuView.MODE_MONSTER_PLANT;
        }
        else if(hasFreeSaddle && !isRiding)
        {
            view._mode = PetMenuView.MODE_SADDLED_UP;
        }
        else if(isRiding)
        {
            view._mode = PetMenuView.MODE_RIDING;
        }
        else
        {
            view._mode = PetMenuView.MODE_NORMAL;
        }

        AvatarContextInfoButtonView.setupButtonView(view, userId, userName, roomIndex, userType, false);
    }

    // AS3: PetMenuView.as::get widget()
    private get widget(): AvatarInfoWidget
    {
        return this._widget as AvatarInfoWidget;
    }

    // AS3: PetMenuView.as::updateWindow()
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
            this._window = this._widget.windowManager.buildWidgetLayout('pet_menu', 0) as IWindowContainer | null;

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

    // AS3: PetMenuView.as::updateButtons()
    public updateButtons(): void
    {
        if(!this._window || !this._petData || !this._buttons) return;

        this._buttons.procedure = this.buttonEventProc;
        this._buttons.autoArrangeItems = false;

        const count = this._buttons.numListItems;

        for(let i = 0; i < count; i++)
        {
            const item = this._buttons.getListItemAt(i);

            if(item) item.visible = false;
        }

        const handler = this.widget.handler;
        const container = handler?.container ?? null;
        const roomSession = container?.roomSession ?? null;
        const sessionDataManager = container?.sessionDataManager ?? null;

        // AS3 offers "pick up" to anyone with rights over the room, not just the owner.
        if(roomSession?.isRoomOwner || sessionDataManager?.isAnyRoomController || (roomSession?.roomControllerLevel ?? 0) >= 1)
        {
            this.showButton('pick_up');
        }

        switch(this._mode)
        {
            case PetMenuView.MODE_NORMAL:
                this.showButton('respect', this._petData.petRespectLeft > 0);
                break;
            case PetMenuView.MODE_SADDLED_UP:
                if(this.widget.configuration?.getBoolean('sharedhorseriding.enabled'))
                {
                    this.showButton('mount');
                }
                this.showButton('respect', this._petData.petRespectLeft > 0);
                break;
            case PetMenuView.MODE_RIDING:
                if(this.widget.configuration?.getBoolean('sharedhorseriding.enabled'))
                {
                    this.showButton('dismount');
                }
                this.showButton('respect', this._petData.petRespectLeft > 0);
                break;
            case PetMenuView.MODE_MONSTER_PLANT:
                if(!this._petData.canRevive)
                {
                    this.showButton('respect', false);
                    this.showButton('treat', true, (this._petData.energy / this._petData.energyMax) < 0.98);
                }
                break;
        }

        this._widget.localizations?.registerParameter(
            'infostand.button.petrespect', 'count', this._petData.petRespectLeft.toString()
        );

        // The hand item can only be passed to a pet while the user is actually carrying one.
        if(this.widget.configuration?.getBoolean('handitem.give.pet.enabled') && container?.roomEngine && roomSession)
        {
            const ownRoomIndex = roomSession.ownUserRoomId;
            const ownObject = container.roomEngine.getRoomObject(roomSession.roomId, ownRoomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

            if(ownObject)
            {
                const carryId = ownObject.getModel().getNumber('figure_carry_object');

                if(carryId > 0 && carryId < 999999) this.showButton('pass_handitem');
            }
        }

        // AS3 asks the wired component (`showInspectButton()`); the RPG fork removed wired.
        this.showButton('wired_inspect', false);

        this._buttons.autoArrangeItems = true;
        this._buttons.visible = true;
    }

    // AS3: PetMenuView.as::buttonEventProc()
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
                    case 'mount':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.MOUNT_PET, this.userId);
                        break;
                    case 'dismount':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.DISMOUNT_PET, this.userId);
                        break;
                    case 'respect':
                        // AS3 decrements before the server confirms, so the button hides on click.
                        if(this._petData) this._petData.petRespectLeft -= 1;
                        this.updateButtons();
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.RESPECT_PET, this.userId);
                        break;
                    case 'treat':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.TREAT_PET, this.userId);
                        break;
                    case 'pass_handitem':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.GIVE_CARRY_ITEM_TO_PET, this.userId);
                        break;
                    case 'pick_up':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.PICK_UP_PET, this.userId);
                        break;
                    case 'wired_inspect':
                        message = new RoomWidgetUserActionMessage(RoomWidgetUserActionMessage.WIRED_INSPECT_PET, this.userId);
                        break;
                }
            }

            if(window.name === 'profile_link')
            {
                message = new RoomWidgetOpenProfileMessage(
                    RoomWidgetOpenProfileMessage.OPEN_USER_PROFILE, this.userId, 'petContextMenu'
                );
            }

            if(message) this._widget.messageListener?.processWidgetMessage(message);

            this.updateButtons();
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

    // AS3: PetMenuView.as::updateWindow() — the WME_OVER/WME_OUT listeners on _window,
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

    // AS3: PetMenuView.as::dispose()
    public override dispose(): void
    {
        this._petData = null;
        super.dispose();
    }
}
