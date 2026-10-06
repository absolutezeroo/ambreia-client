/**
 * InfoStandFurniView
 *
 * @see sources/win63_version/habbo/ui/widget/infostand/InfoStandFurniView.as
 *
 * Several spots in win63_version are decompiler artifacts (dropped `_loc` refs
 * printed as `null.`, an infinite-loop-shaped `while(0 < list.numListItems)`);
 * those are cross-checked and fixed against win63_2023_version, which decompiled
 * the same logic more completely (see createWindow()'s button loop and
 * setOwnerInfo()).
 */
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IStuffData} from '@habbo/room/object/data/IStuffData';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IHabboCatalog} from '@habbo/catalog/IHabboCatalog';
import type {IHabboTracking} from '@habbo/tracking/IHabboTracking';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {ILimitedItemPreviewOverlayWidget} from '@habbo/window/widgets/ILimitedItemPreviewOverlayWidget';
import type {IRarityItemPreviewOverlayWidget} from '@habbo/window/widgets/IRarityItemPreviewOverlayWidget';
import type {IBadgeImageWidget} from '@habbo/window/widgets/IBadgeImageWidget';
import {FriendlyTime} from '@habbo/utils/FriendlyTime';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {RoomWidgetFurniActionMessage} from '../messages/RoomWidgetFurniActionMessage';
import {RoomWidgetGetBadgeDetailsMessage} from '../messages/RoomWidgetGetBadgeDetailsMessage';
import {RoomWidgetOpenProfileMessage} from '../messages/RoomWidgetOpenProfileMessage';
import type {RoomWidgetFurniInfoUpdateEvent} from '../events/RoomWidgetFurniInfoUpdateEvent';
import type {InfoStandWidget} from './InfoStandWidget';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.ui.widget.infostand.InfoStandFurniView');

export class InfoStandFurniView
{
    private static readonly PICKUP_MODE_NONE = 0;
    private static readonly PICKUP_MODE_EJECT = 1;
    private static readonly PICKUP_MODE_PICKUP = 2;

    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::_window
    protected _window: IItemListWindow | null = null;
    protected _customVariables: IWindowContainer | null = null; // var_459
    protected _variableTemplateItem: IWindow | null = null; // var_4576
    protected _infoBorder: IWindowContainer | null = null; // var_31
    protected _buttonList: IItemListWindow | null = null; // var_34
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::_catalog
    protected _catalog: IHabboCatalog | null;
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::_habboTracking
    protected _habboTracking: IHabboTracking | null;
    protected _catalogButton: IWindow | null = null; // var_350
    protected _rentButton: IWindow | null = null; // var_356
    protected _extendButton: IWindow | null = null; // var_348
    protected _buyoutButton: IWindow | null = null; // var_344
    // AS3: .../src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::_pickupMode
    private _pickupMode: number = InfoStandFurniView.PICKUP_MODE_NONE; // var_570
    private _ownerId: number = 0; // var_1820
    protected _widget: InfoStandWidget; // var_16
    protected _elementList: IItemListWindow | null = null; // var_108

    // NOT from AS3: the Vortex furni-editor button, added once and kept.
    private _furniEditorButton: IWindow | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::InfoStandFurniView()
    constructor(widget: InfoStandWidget, name: string, catalog: IHabboCatalog | null)
    {
        this._widget = widget;
        this._catalog = catalog;
        this._habboTracking = widget.handler.container?.habboTracking ?? null;
        this.createWindow(name);
    }

    private get container()
    {
        return this._widget.handler.container;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::dispose()
    public dispose(): void
    {
        this._catalog = null;
        this._window?.dispose();
        this._window = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::get window()
    public get window(): IItemListWindow | null
    {
        return this._window;
    }

    /**
     * TS-only: the layout each subclass builds from. AS3 has no such seam — InfoStandJukeboxView
     * and InfoStandSongDiskView each override the whole of createWindow() just to swap
     * `getAssetByName("furni_view")` for their own layout, then repeat the same ~50 lines of
     * child lookups verbatim. All three layouts declare the same children, so the override point
     * is the asset name rather than three copies of the body.
     */
    // TS-only: no AS3 counterpart; the override point the two song views build their layout from.
    protected get layoutName(): string
    {
        return 'furni_view';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::createWindow()
    protected createWindow(name: string): void
    {
        const window = this._widget.windowManager.buildWidgetLayout(this.layoutName) as IItemListWindow | null;

        if(!window)
        {
            throw new Error(`Failed to construct window from layout: ${this.layoutName}`);
        }

        this._window = window;
        this._infoBorder = this._window.getListItemByName('info_border') as IWindowContainer | null;
        this._buttonList = this._window.getListItemByName('button_list') as IItemListWindow | null;
        this._customVariables = this._window.getListItemByName('custom_variables') as IWindowContainer | null;

        if(!this.container?.sessionDataManager?.hasSecurity(5))
        {
            this._customVariables?.dispose();
            this._customVariables = null;
        }

        if(this._customVariables)
        {
            this._customVariables.procedure = this.customVarsWindowProcedure;

            const variableList = this._customVariables.findChildByName('variable_list') as IItemListWindow | null;

            this._variableTemplateItem = variableList?.removeListItemAt(0) ?? null;
        }

        if(this._infoBorder)
        {
            this._elementList = this._infoBorder.findChildByName('infostand_element_list') as IItemListWindow | null;
        }

        this._window.name = name;
        this._widget.mainContainer.addChild(this._window);

        const closeButton = this._infoBorder?.findChildByTag('close');

        closeButton?.addEventListener(WindowMouseEvent.CLICK, this.onClose);

        if(this._buttonList)
        {
            for(let i = 0; i < this._buttonList.numListItems; i++)
            {
                this._buttonList.getListItemAt(i)?.addEventListener(WindowMouseEvent.CLICK, this.onButtonClicked);
            }
        }

        this._catalogButton = this._infoBorder?.findChildByTag('catalog') ?? null;
        this._catalogButton?.addEventListener(WindowMouseEvent.CLICK, this.onCatalogButtonClicked);

        // AS3 wires `bc_place_button` to the Builders Club "place more" flow; the RPG fork removed
        // the Builders Club, so the button the layout still carries is only kept hidden.
        const bcPlaceButton = this._infoBorder?.findChildByName('bc_place_button') ?? null;

        if(bcPlaceButton) bcPlaceButton.visible = false;

        this._rentButton = this._infoBorder?.findChildByName('rent_button') ?? null;
        this._rentButton?.addEventListener(WindowMouseEvent.CLICK, this.onRentButtonClicked);

        this._extendButton = this._infoBorder?.findChildByName('extend_button') ?? null;
        this._extendButton?.addEventListener(WindowMouseEvent.CLICK, this.onExtendButtonClicked);

        this._buyoutButton = this._infoBorder?.findChildByName('buyout_button') ?? null;
        this._buyoutButton?.addEventListener(WindowMouseEvent.CLICK, this.onBuyoutButtonClicked);

        const ownerRegion = this._elementList?.getListItemByName('owner_region') as IRegionWindow | null;

        if(ownerRegion)
        {
            ownerRegion.addEventListener(WindowMouseEvent.CLICK, this.onOwnerRegion);
            ownerRegion.addEventListener(WindowMouseEvent.OVER, this.onOwnerRegion);
            ownerRegion.addEventListener(WindowMouseEvent.OUT, this.onOwnerRegion);
        }

        const groupDetailsContainer = this._infoBorder?.findChildByName('group_details_container');

        groupDetailsContainer?.addEventListener(WindowMouseEvent.CLICK, this.onGroupInfoClicked);
    }

    /**
     * Adds the Vortex furni-editor button to the infostand.
     *
     * NOT from AS3 — the furni editor is a Vortex-only staff tool. The button is built from its own
     * authored layout and added as a list item rather than being declared in `furni_view`, because
     * that layout ships verbatim from the dump and is regenerated by tools/build-window-assets.mjs.
     *
     * The editor is reached through the widget container, injected RoomUI -> RoomDesktop like
     * `inventory` and `habboHelp`. It was first read from the root `Vortex` singleton instead, to
     * avoid putting a non-AS3 member on the ported IRoomWidgetHandlerContainer — but that import
     * (widget -> Vortex -> VortexMain -> RoomUI -> widget) closes a cycle, and a cycle here throws
     * inside InfoStandWidget's constructor: no infostand at all, and no log, since the throw
     * precedes the first trace. Traceability purity is not worth that.
     *
     * Adding nothing when the capability is absent is the point — a button that appears and then
     * fails would tell every curious player that the tool exists.
     */
    private createFurniEditorButton(): void
    {
        if(this._furniEditorButton != null) return;

        const furniEditor = this.container?.furniEditor ?? null;

        if(furniEditor == null || !furniEditor.canEdit || !this._elementList)
        {
            // Each of these three reads as "no button" but has a different fix, so say which.
            log.debug(
                'Furni editor button not added: '
                + `editor=${furniEditor != null}, `
                + `canEdit=${furniEditor?.canEdit ?? false}, `
                + `elementList=${this._elementList != null}`
            );

            return;
        }

        const row = this._widget.windowManager.buildWidgetLayout(
            'vortex_furni_editor_button_xml'
        ) as IWindowContainer | null;

        if(!row)
        {
            log.warn('Furni editor button layout "vortex_furni_editor_button_xml" is not registered');

            return;
        }

        row
            .findChildByName('vortex_furni_editor_open')
            ?.addEventListener(WindowMouseEvent.CLICK, this.onFurniEditorButtonClicked);

        this._furniEditorButton = row;

        this._elementList.addListItem(row);
    }

    private onFurniEditorButtonClicked = (_event: WindowMouseEvent): void =>
    {
        const furniEditor = this.container?.furniEditor ?? null;
        const objectId = this._widget.furniData?.id ?? -1;

        if(furniEditor != null && objectId >= 0)
        {
            furniEditor.open(objectId);
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::customVarsWindowProcedure()
    private customVarsWindowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== WindowMouseEvent.CLICK || !this._customVariables) return;

        if(window.name === 'set_values')
        {
            const objectData = new Map<string, string>();
            const variableList = this._customVariables.findChildByName('variable_list') as IItemListWindow | null;

            for(let i = 0; variableList && i < variableList.numListItems; i++)
            {
                const item = variableList.getListItemAt(i) as IWindowContainer | null;
                const value = (item?.findChildByName('value') as IWindow | null)?.caption ?? '';

                if(item) objectData.set(item.name, value);
            }

            this._widget.handler.setObjectData(objectData);
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::onBuyoutButtonClicked()
    protected onBuyoutButtonClicked = (_event: WindowMouseEvent): void =>
    {
        if(this._catalog && this._widget.furniData)
        {
            const furnitureData = this.getFurnitureData(this._widget.furniData);

            if(furnitureData)
            {
                this._catalog.openRentConfirmationWindow(furnitureData, true, this._widget.furniData.id);
            }
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::onExtendButtonClicked()
    protected onExtendButtonClicked = (_event: WindowMouseEvent): void =>
    {
        if(this._catalog && this._widget.furniData)
        {
            const furnitureData = this.getFurnitureData(this._widget.furniData);

            if(furnitureData)
            {
                this._catalog.openRentConfirmationWindow(furnitureData, false, this._widget.furniData.id);
            }
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::getRoomObject()
    private getRoomObject(id: number): IRoomObject | null
    {
        const roomId = this.container!.roomSession.roomId;
        let object = this.container!.roomEngine?.getRoomObject(roomId, id, 10) ?? null;

        if(!object)
        {
            object = this.container!.roomEngine?.getRoomObject(roomId, id, 20) ?? null;
        }

        return object;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::getFurnitureData()
    private getFurnitureData(furniData: {id: number; category: number}): IFurnitureData | null
    {
        const object = this.getRoomObject(furniData.id);

        if(!object) return null;

        const isWallItem = this._widget.furniData?.category === 20;
        const typeId = object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID);

        return isWallItem
            ? this.container!.sessionDataManager?.getWallItemData(typeId) ?? null
            : this.container!.sessionDataManager?.getFloorItemData(typeId) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::onRentButtonClicked()
    protected onRentButtonClicked = (_event: WindowMouseEvent): void =>
    {
        if(this._catalog && this._widget.furniData)
        {
            this._catalog.openCatalogPageByOfferId(this._widget.furniData.rentOfferId, 'NORMAL');
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::onClose()
    protected onClose = (_event: WindowMouseEvent): void =>
    {
        this._widget.close();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::set name()
    public set name(value: string)
    {
        const text = this._elementList?.getListItemByName('name_text') as ITextWindow | null;

        if(!text) return;

        text.text = value;
        text.visible = true;
        text.height = text.textHeight + 5;
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::set furniImage()
    public set furniImage(value: ImageBitmap | null)
    {
        this.setImage(value, 'image');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::setImage()
    private setImage(value: ImageBitmap | null, name: string): void
    {
        const bitmap = this._infoBorder?.findChildByName(name) as IBitmapWrapperWindow | null;

        if(!bitmap) return;

        if(value)
        {
            bitmap.height = Math.min(value.height, 200);
        }

        bitmap.bitmap = value;
        bitmap.visible = true;
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::set description()
    public set description(value: string)
    {
        const text = this._elementList?.getListItemByName('description_text') as ITextWindow | null;

        if(!text) return;

        text.text = value;
        text.height = text.textHeight + 5;
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::setOwnerInfo()
    // AS3 win63_version drops the bcw_icon toggle branch (decompiler artifact);
    // restored from win63_2023_version's fuller decompile of the same method.
    public setOwnerInfo(ownerId: number, ownerName: string): void
    {
        this._ownerId = ownerId;

        if(this._ownerId === 0)
        {
            this.showWindow('owner_region', false);
            this.showWindow('owner_spacer', false);
            this.updateWindow();

            return;
        }

        const ownerRegion = this._elementList?.getListItemByName('owner_region') as (IRegionWindow & IWindowContainer) | null;
        const ownerNameText = ownerRegion?.findChildByName('owner_name') as ITextWindow | null;
        const ownerLink = ownerRegion?.findChildByName('owner_link') ?? null;
        const bcwIcon = ownerRegion?.findChildByName('bcw_icon') ?? null;

        // AS3 shows the Builders Club title and `bcw_icon` instead for a Builders Club item; the
        // RPG fork removed the Builders Club.
        if(ownerNameText) ownerNameText.text = ownerName;

        if(ownerRegion)
        {
            ownerRegion.toolTipCaption = this._widget.localizations?.getLocalization('infostand.profile.link.tooltip', '') ?? '';
            ownerRegion.toolTipDelay = 100;
        }

        if(ownerLink) ownerLink.visible = true;
        if(bcwIcon) bcwIcon.visible = false;

        this.showWindow('owner_region', true);
        this.showWindow('owner_spacer', true);
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::set expiration()
    private set expiration(value: number)
    {
        const text = this._elementList?.getListItemByName('expiration_text') as ITextWindow | null;

        if(!text) return;

        this._widget.localizations?.registerParameter(
            'infostand.rent.expiration', 'time', FriendlyTime.getFriendlyTime(this._widget.localizations, value)
        );
        text.visible = value >= 0 && this._ownerId === this.container?.sessionDataManager?.userId;
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::onButtonClicked()
    // AS3 win63_version's button-list registration loop never advances its index
    // (`while(0 < var_34.numListItems)`) — a decompiler artifact; fixed above in
    // createWindow() using the bounded loop from win63_2023_version.
    protected onButtonClicked = (event: WindowMouseEvent): void =>
    {
        const target = event.target;

        if(!target || !this._widget.furniData) return;

        let type: string | null = null;

        switch(target.name)
        {
            case 'rotate':
                type = RoomWidgetFurniActionMessage.ROTATE;
                break;
            case 'move':
                type = RoomWidgetFurniActionMessage.MOVE;
                break;
            case 'pickup':
                type = this._pickupMode === InfoStandFurniView.PICKUP_MODE_PICKUP
                    ? RoomWidgetFurniActionMessage.PICKUP
                    : RoomWidgetFurniActionMessage.EJECT;
                this._widget.close();
                break;
            case 'save_branding_configuration':
                if(this.container?.sessionDataManager?.hasSecurity(4))
                {
                    type = RoomWidgetFurniActionMessage.SAVE_STUFF_DATA;
                    break;
                }
                // eslint-disable-next-line no-fallthrough
            case 'use':
                type = RoomWidgetFurniActionMessage.USE;
                break;
            case 'wired_inspect':
                type = RoomWidgetFurniActionMessage.WIRED_INSPECT;
                break;
        }

        if(type !== null)
        {
            const objectData = type === RoomWidgetFurniActionMessage.SAVE_STUFF_DATA
                ? this.getVisibleAdFurnitureExtraParams()
                : null;
            const message = new RoomWidgetFurniActionMessage(
                type, this._widget.furniData.id, this._widget.furniData.category,
                this._widget.furniData.purchaseOfferId, objectData
            );

            this._widget.messageListener?.processWidgetMessage(message);
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::onGroupInfoClicked()
    private onGroupInfoClicked = (_event: WindowMouseEvent): void =>
    {
        if(!this._widget.furniData) return;

        this._widget.messageListener?.processWidgetMessage(
            new RoomWidgetGetBadgeDetailsMessage(false, this._widget.furniData.groupId)
        );
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::onCatalogButtonClicked()
    protected onCatalogButtonClicked = (_event: WindowMouseEvent): void =>
    {
        if(this._catalog && this._widget.furniData)
        {
            this._catalog.openCatalogPageByOfferId(this._widget.furniData.purchaseOfferId, 'NORMAL');
            this._habboTracking?.trackGoogle('infostandCatalogButton', 'offer', this._widget.furniData.purchaseOfferId);
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::onOwnerRegion()
    protected onOwnerRegion = (event: WindowMouseEvent): void =>
    {
        if(event.type === WindowMouseEvent.CLICK)
        {
            this._widget.messageListener?.processWidgetMessage(
                new RoomWidgetOpenProfileMessage('RWOPEM_OPEN_USER_PROFILE', this._ownerId, 'infoStand_furniView')
            );
        }

        if(event.type === WindowMouseEvent.OUT || event.type === WindowMouseEvent.OVER)
        {
            const ownerLink = (event.target as (IRegionWindow & IWindowContainer) | null)?.findChildByName('owner_link');

            if(ownerLink) ownerLink.style = event.type === WindowMouseEvent.OUT ? 21 : 22;
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::updateWindow()
    protected updateWindow(): void
    {
        if(!this._elementList || !this._infoBorder || !this._buttonList || !this._window) return;

        // Added here rather than in createWindow(): the view is constructed once, with the rest of
        // InfoStandWidget, and the editor's capability flag may not have arrived yet at that point.
        // updateWindow() runs on every furni shown, so the button appears as soon as the right is
        // known — and a failure here cannot take the widget's constructor down with it.
        this.createFurniEditorButton();

        this._elementList.arrangeListItems();
        this._buttonList.width = this._buttonList.scrollableRegion.width;
        this._elementList.height = this._elementList.scrollableRegion.height;
        this._infoBorder.height = this._elementList.height + 20;
        this._window.width = Math.max(this._infoBorder.width, this._buttonList.width);
        this._window.height = this._window.scrollableRegion.height;

        if(this._infoBorder.width < this._buttonList.width)
        {
            this._infoBorder.x = this._window.width - this._infoBorder.width;
            this._buttonList.x = 0;
        }
        else
        {
            this._buttonList.x = this._window.width - this._buttonList.width;
            this._infoBorder.x = 0;
        }

        if(this._customVariables)
        {
            this._customVariables.x = this._infoBorder.x;
        }

        this._widget.refreshContainer();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::set spacerColor()
    private set spacerColor(color: number)
    {
        if(!this._infoBorder)
        {
            return;
        }

        const spacers = [
            this._infoBorder.findChildByName('images_spacer'),
            this._infoBorder.findChildByName('owner_spacer'),
            this._infoBorder.findChildByName('group_details_spacer'),
            this._infoBorder.findChildByName('furni_details_spacer')
        ];

        for(const spacer of spacers)
        {
            if(spacer) spacer.color = color;
        }
    }

    // DEVIATION: AS3 shows the `nft_indicator` row (with `icon_nft`) for an `nft_` furni through
    //   `set isNft()`; the RPG fork removed NFT, so the row is only collapsed here until Task 10
    //   removes it from the XML.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::update()
    public update(event: RoomWidgetFurniInfoUpdateEvent): void
    {
        // The info_border ships as style 2 ("white borderless" -> border_colorless), a
        // deliberately untinted skin the view colours per furni provenance. Leaving it unset
        // renders the panel white, which is what the element description's 0xffffff colour
        // default gives.
        // (AS3 has two more colours, for the Builders Club and wired-temporary id ranges; the RPG
        // fork removed both.)
        if(this._infoBorder)
        {
            this._infoBorder.color = 4013373;
            this.spacerColor = 4281545523;
        }

        const roomSession = this.container?.roomSession;
        const isPlayTestMode = roomSession?.isGameSession ?? false;

        this.name = event.name;
        this.description = event.description;
        this.furniImage = event.image as ImageBitmap | null;
        this.expiration = event.expiration;

        const nftIndicator = this._elementList?.getListItemByName('nft_indicator') ?? null;

        if(nftIndicator !== null)
        {
            nftIndicator.height = 0;
            nftIndicator.visible = false;
        }

        this.setOwnerInfo(event.ownerId, event.ownerName);

        let showMove = false;
        let showRotate = false;
        let showAdFurniDetails = false;
        let showUse = false;

        if(!isPlayTestMode && (event.roomControllerLevel >= 1 || event.isOwner || event.isRoomOwner || event.isAnyRoomController))
        {
            showMove = true;
            showRotate = !event.isWallItem;
        }

        if(event.isAnyRoomController)
        {
            showAdFurniDetails = true;
        }

        const isController = event.roomControllerLevel >= 1;
        const useButtonEnabled = this._widget.config?.getBoolean('infostand.use.button.enabled') ?? false;

        if(useButtonEnabled)
        {
            if(event.usagePolicy === 2)
            {
                showUse = true;
            }

            if(!isPlayTestMode && (
                (event.usagePolicy === 1 && isController)
				|| (event.extraParam === 'RWEIEP_JUKEBOX' && isController)
				|| (event.extraParam === 'RWEIEP_USABLE_PRODUCT' && isController)
            ))
            {
                showUse = true;
            }
        }

        this.updatePickupMode(event, isPlayTestMode);
        this.showButton('move', showMove);
        this.showButton('rotate', showRotate);
        this.showButton('use', showUse);
        // AS3 asks the wired component (`showInspectButton()`); the RPG fork removed wired.
        this.showButton('wired_inspect', false);
        this.showAdFurnitureDetails(showAdFurniDetails);
        this.showGroupInfo(event.groupId > 0);
        this.updatePurchaseButtonVisibility(
            event.isOwner,
            event.expiration >= 0,
            event.purchaseOfferId >= 0,
            event.rentOfferId >= 0,
            event.purchaseCouldBeUsedForBuyout,
            event.rentCouldBeUsedForBuyout
        );
        this.showLimitedItem((event.stuffData?.uniqueSerialNumber ?? 0) > 0, event.stuffData);
        this.showRarityItem((event.stuffData?.rarityLevel ?? -1) >= 0, event.stuffData);
        this._buttonList!.visible = showMove || showRotate || this._pickupMode !== InfoStandFurniView.PICKUP_MODE_NONE || showUse;
        this.updateCustomVarsWindow();
        this.updateWindow();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::updateCustomVarsWindow()
    private updateCustomVarsWindow(): void
    {
        if(!this._customVariables || !this._widget.furniData) return;

        const object = this.getRoomObject(this._widget.furniData.id);

        if(!object) return;

        const customVariables = object.getModel().getStringArray(RoomObjectVariableEnum.FURNITURE_CUSTOM_VARIABLES);

        this._customVariables.visible = !!customVariables && customVariables.length > 0;

        if(!this._customVariables.visible) return;

        const variableList = this._customVariables.findChildByName('variable_list') as IItemListWindow | null;

        variableList?.destroyListItems();

        const data = object.getModel().getStringToStringMap(RoomObjectVariableEnum.FURNITURE_DATA);

        for(const key of customVariables ?? [])
        {
            const item = this._variableTemplateItem?.clone() as IWindowContainer | null;

            if(!item) continue;

            item.name = key;

            const nameLabel = item.findChildByName('name');
            const valueLabel = item.findChildByName('value');

            if(nameLabel) nameLabel.caption = key;
            if(valueLabel) valueLabel.caption = data.get(key) ?? '';

            variableList?.addListItem(item);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::updatePickupMode()
    private updatePickupMode(event: RoomWidgetFurniInfoUpdateEvent, isPlayTestMode: boolean): void
    {
        this._pickupMode = InfoStandFurniView.PICKUP_MODE_NONE;

        if(!isPlayTestMode)
        {
            if(event.isOwner || event.isAnyRoomController)
            {
                this._pickupMode = InfoStandFurniView.PICKUP_MODE_PICKUP;
            }
            else if(event.isRoomOwner || event.roomControllerLevel >= 3)
            {
                this._pickupMode = InfoStandFurniView.PICKUP_MODE_EJECT;
            }

            if(event.isStickie)
            {
                this._pickupMode = InfoStandFurniView.PICKUP_MODE_NONE;
            }
        }

        this.showButton('pickup', this._pickupMode !== InfoStandFurniView.PICKUP_MODE_NONE);
        this.localizePickupButton(this._pickupMode);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::localizePickupButton()
    private localizePickupButton(mode: number): void
    {
        const button = this._buttonList?.getListItemByName('pickup');

        if(!button) return;

        button.caption = mode === InfoStandFurniView.PICKUP_MODE_EJECT
            ? '${infostand.button.eject}'
            : '${infostand.button.pickup}';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::createAdElement()
    private createAdElement(name: string, value: string): void
    {
        if(!this._elementList) return;

        const element = this._widget.windowManager.buildWidgetLayout('furni_view_branding_element') as IWindowContainer | null;

        if(!element) return;

        const nameWindow = element.findChildByName('element_name');
        const valueWindow = element.findChildByName('element_value');

        if(nameWindow) nameWindow.caption = name;
        if(valueWindow) valueWindow.caption = value;

        // AS3: the "branding_element" tag is already baked into the layout's root node.
        this._infoBorder?.addChild(element);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::getAdFurnitureExtraParams()
    private getAdFurnitureExtraParams(): Map<string, string>
    {
        const result = new Map<string, string>();

        if(!this._widget.furniData) return result;

        const raw = this._widget.furniData.extraParam.substring('RWEIEP_BRANDING_OPTIONS'.length);

        for(const pair of raw.split('\t'))
        {
            const parts = pair.split('=');

            if(parts.length === 2)
            {
                result.set(parts[0], parts[1]);
            }
        }

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::getVisibleAdFurnitureExtraParams()
    private getVisibleAdFurnitureExtraParams(): string
    {
        let result = '';

        if(!this._infoBorder) return result;

        const elements: IWindow[] = [];

        this._infoBorder.groupChildrenWithTag('branding_element', elements, -1);

        for(const element of elements)
        {
            const nameWindow = (element as IWindowContainer).findChildByName('element_name');
            const valueWindow = (element as IWindowContainer).findChildByName('element_value');

            if(nameWindow && valueWindow)
            {
                const name = this.trimAdFurnitureExtraParam(nameWindow.caption);
                const value = this.trimAdFurnitureExtraParam(valueWindow.caption);

                result += `${name}=${value}\t`;
            }
        }

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::trimAdFurnitureExtramParam()
    // "Extram" [sic] — the AS3 spelling, not carried into the port's method name.
    private trimAdFurnitureExtraParam(value: string): string
    {
        return value?.includes('\t') ? value.replace(/\t/g, '') : value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::showAdFurnitureDetails()
    private showAdFurnitureDetails(visible: boolean): void
    {
        if(!this._infoBorder) return;

        const spacer = this._infoBorder.findChildByName('furni_details_spacer');

        if(spacer) spacer.visible = visible;

        const brandingElements: IWindow[] = [];

        this._infoBorder.groupChildrenWithTag('branding_element', brandingElements, -1);

        for(const element of brandingElements)
        {
            this._infoBorder.removeChild(element);
            element.dispose();
        }

        let hasBrandingParams = false;
        const detailsText = this._infoBorder.findChildByName('furni_details_text') as ITextWindow | null;

        if(detailsText)
        {
            detailsText.visible = visible;

            const caption = `id: ${this._widget.furniData?.id ?? 0}`;
            const params = this.getAdFurnitureExtraParams();

            if(params.size > 0)
            {
                hasBrandingParams = true;

                for(const [key, value] of params)
                {
                    this.createAdElement(key, value);
                }
            }

            detailsText.caption = caption;
        }

        this.showButton('save_branding_configuration', hasBrandingParams);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::showGroupInfo()
    private showGroupInfo(visible: boolean): void
    {
        this.showWindow('group_details_spacer', visible);
        this.showWindow('group_details_container', visible);
        this.showWindow('group_badge_image', false);
        this.showWindow('group_name', false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::showWindow()
    private showWindow(name: string, visible: boolean): void
    {
        const window = this._infoBorder?.findChildByName(name);

        if(window) window.visible = visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::showButton()
    protected showButton(name: string, visible: boolean): void
    {
        if(!this._buttonList) return;

        const button = this._buttonList.getListItemByName(name);

        if(button)
        {
            button.visible = visible;
            this._buttonList.arrangeListItems();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::updatePurchaseButtonVisibility()
    private updatePurchaseButtonVisibility(
        isOwner: boolean, hasExpiration: boolean, hasPurchaseOffer: boolean, hasRentOffer: boolean,
        purchaseCouldBeBuyout: boolean, rentCouldBeBuyout: boolean
    ): void
    {
        const isRented = isOwner && hasExpiration;
        const showExtend = isRented && rentCouldBeBuyout;
        const showBuyout = isRented && purchaseCouldBeBuyout;
        const showCatalog = !isRented && hasPurchaseOffer;
        const showRent = !isRented && hasRentOffer;

        let anyVisible = false;

        if(this._catalogButton)
        {
            this._catalogButton.visible = showCatalog;
            anyVisible = anyVisible || showCatalog;
        }

        if(this._rentButton)
        {
            this._rentButton.visible = showRent;
            anyVisible = anyVisible || showRent;
        }

        if(this._extendButton)
        {
            this._extendButton.visible = showExtend;
            anyVisible = anyVisible || showExtend;
        }

        if(this._buyoutButton)
        {
            this._buyoutButton.visible = showBuyout;
            anyVisible = anyVisible || showBuyout;
        }

        const purchaseButtons = this._elementList?.getListItemByName('purchase_buttons') as IItemListWindow | null;

        if(purchaseButtons)
        {
            purchaseButtons.arrangeListItems();
            purchaseButtons.visible = anyVisible;
        }

        this._elementList?.arrangeListItems();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::set groupName()
    public set groupName(value: string)
    {
        const window = this._infoBorder?.findChildByName('group_name');

        if(window)
        {
            window.caption = value;
            window.visible = true;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::showLimitedItem()
    private showLimitedItem(visible: boolean, stuffData: IStuffData | null): void
    {
        const backgroundContainer = this._infoBorder?.findChildByName('unique_item_background_container') as IWindowContainer | null;
        const overlayContainer = this._infoBorder?.findChildByName('unique_item_overlay_container') as IWindowContainer | null;

        if(!backgroundContainer || !overlayContainer) return;

        backgroundContainer.visible = visible;
        overlayContainer.visible = visible;

        if(visible && stuffData)
        {
            const widgetWindow = overlayContainer.findChildByName('unique_item_plaque_widget') as IWidgetWindow | null;
            const widget = widgetWindow?.widget as ILimitedItemPreviewOverlayWidget | null;

            if(widget)
            {
                widget.serialNumber = stuffData.uniqueSerialNumber;
                widget.seriesSize = stuffData.uniqueSeriesSize;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::showRarityItem()
    private showRarityItem(visible: boolean, stuffData: IStuffData | null): void
    {
        const overlayContainer = this._infoBorder?.findChildByName('rarity_item_overlay_container') as IWindowContainer | null;

        if(!overlayContainer) return;

        overlayContainer.visible = visible;

        if(visible && stuffData)
        {
            const widgetWindow = overlayContainer.findChildByName('rarity_item_overlay_widget') as IWidgetWindow | null;
            const widget = widgetWindow?.widget as IRarityItemPreviewOverlayWidget | null;

            if(widget)
            {
                widget.rarityLevel = stuffData.rarityLevel;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/infostand/InfoStandFurniView.as::set groupBadgeId()
    public set groupBadgeId(badgeId: string)
    {
        const widgetWindow = this._infoBorder?.findChildByName('group_badge_image') as IWidgetWindow | null;
        const widget = widgetWindow?.widget as IBadgeImageWidget | null;

        if(widget && widgetWindow)
        {
            widget.badgeId = badgeId;
            widget.groupId = this._widget.furniData?.groupId ?? 0;
            widgetWindow.visible = true;
        }
    }
}
