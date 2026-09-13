import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {ITextFieldWindow} from '@core/window/components/ITextFieldWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {GuestRoomData} from '@habbo/communication/messages/incoming/navigator';
import {AddFavouriteRoomMessageComposer} from '@habbo/communication/messages/outgoing/navigator/AddFavouriteRoomMessageComposer';
import {DeleteFavouriteRoomMessageComposer} from '@habbo/communication/messages/outgoing/navigator/DeleteFavouriteRoomMessageComposer';
import {UpdateHomeRoomMessageComposer} from '@habbo/communication/messages/outgoing/navigator/UpdateHomeRoomMessageComposer';
import {ToggleStaffPickMessageComposer} from '@habbo/communication/messages/outgoing/navigator/ToggleStaffPickMessageComposer';
import {MuteAllInRoomComposer} from '@habbo/communication/messages/outgoing/room/action/MuteAllInRoomComposer';
import {GetExtendedProfileMessageComposer} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import type {IHabboTransitionalNavigator} from '../IHabboTransitionalNavigator';
import {TagRenderer} from '../TagRenderer';
import {GuildInfoCtrl} from '../GuildInfoCtrl';
import {SimpleAlertView} from '../SimpleAlertView';
import {Util} from '../Util';
import {RaidProtectionSettingsController} from '../raidprotection/RaidProtectionSettingsController';
import {UserInfoRegionUtil} from '@habbo/utils/UserInfoRegionUtil';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {PerkType} from '../../communication/enum/PerkType';

/**
 * Room info view controller for displaying room details in-room.
 * Shows room name, owner, category, description, tags, guild info,
 * embed info, and action buttons (favourite, home, settings, report, etc.).
 *
 * @see sources/win63_version/habbo/navigator/inroom/RoomInfoViewCtrl.as
 */
export class RoomInfoViewCtrl
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::_navigator
    private _navigator: IHabboTransitionalNavigator | null;
    private _guildInfoCtrl: GuildInfoCtrl;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::_window
    private _window: IWindowContainer | null = null;
    private _tagRenderer: TagRenderer;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::_embedExpanded
    private _embedExpanded: boolean = false;
    private _visible: boolean = false;

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::_raidProtectionSettingsController
    //   Name derived: the AS3 field is `_SafeStr_5588`; named for the class it holds.
    private _raidProtection: RaidProtectionSettingsController | null = null;

    constructor(navigator: IHabboTransitionalNavigator)
    {
        this._navigator = navigator;
        this._guildInfoCtrl = new GuildInfoCtrl(navigator);
        this._tagRenderer = new TagRenderer(navigator);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::toggle()
    toggle(): void
    {
        if(this._visible)
        {
            this._visible = false;

            if(this._window !== null)
            {
                (this._window as unknown as { dispose(): void }).dispose();
                this._window = null;
            }
        }
        else
        {
            this._visible = true;
            this.refresh();

            if(this._window !== null)
            {
                (this._window as unknown as { activate(): void }).activate?.();
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::close()
    close(): void
    {
        if(this._window !== null)
        {
            (this._window as unknown as { dispose(): void }).dispose();
            this._window = null;
        }

        this._visible = false;

        this._navigator?.events.emit('HABBO_ROOM_SETTINGS_TRACKING_EVENT_CLOSED');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::reload()
    reload(): void
    {
        if(this._visible)
        {
            this.refresh();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::refreshButtons()
    refreshButtons(roomData: GuestRoomData): void
    {
        if(!this._navigator || this._navigator.data.enteredGuestRoom === null || this._window === null) return;

        const nav = this._navigator;

        this._find('room_settings_button').visible = nav.data.canEditRoomSettings;
        this._find('room_filter_button').visible =
            nav.data.canEditRoomSettings && nav.getBoolean('room.custom.filter.enabled');

        if(!nav.getBoolean('room.report.enabled'))
        {
            const reportBtn = this._window.findChildByName('room_report_button');

            if(reportBtn !== null) reportBtn.visible = false;
        }

        this._refreshStaffPick();

        const muteBtn = this._find('room_muteall_button');
        muteBtn.visible = roomData.canMute && nav.getBoolean('room_moderation.mute_all.enabled');
        muteBtn.caption = roomData.allInRoomMuted
            ? '${navigator.muteall_on}'
            : '${navigator.muteall_off}';

        const session = nav.roomSessionManager?.getSession(roomData.flatId) ?? null;
        this._find('floor_plan_editor_button').visible = session !== null && session.roomControllerLevel >= 1;

        this._refreshRaidProtectionButton(roomData);

        const btnsCont = this._window.findChildByName('buttons_cont') as IWindowContainer | null;

        if(btnsCont !== null)
        {
            const btnNames = [
                'room_settings_button',
                'raid_protection_settings_button',
                'room_filter_button',
                'floor_plan_editor_button',
                'staff_pick_button',
                'room_report_button',
                'room_muteall_button',
            ];

            Util.moveChildrenToColumn(btnsCont, btnNames, 0, 3);
            btnsCont.visible = Util.hasVisibleChildren(btnsCont);
            btnsCont.height = Util.getLowestPoint(btnsCont);
        }
    }

    /**
     * Looked up rather than `_find()`-ed because the button is not in the WIN63 dump — raid
     * protection postdates it. It reaches the client because `build-window-assets.mjs` takes
     * `iro_room_details_framed_xml` from the AIR source instead (its `AIR_PREFERRED` set, which
     * exists for this one button). Build the assets with `--no-air` and this becomes a no-op
     * rather than a crash, and the window is still reachable through its
     * `navigator/raidprotection/<flatId>` link.
     */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::refreshRaidProtectionButton()
    private _refreshRaidProtectionButton(roomData: GuestRoomData): void
    {
        const button = this._window?.findChildByName('raid_protection_settings_button') ?? null;

        if(button === null) return;

        button.visible = this._raidProtection !== null
            && this._raidProtection.isFeatureEnabled
            && this._raidProtection.canManage(roomData.flatId);
    }

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::onRaidProtectionStateChanged()
    private _onRaidProtectionStateChanged = (): void =>
    {
        const roomData = this._navigator?.data.enteredGuestRoom ?? null;

        if(this._window === null || roomData === null) return;

        this.refreshButtons(roomData);
    };

    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::onRaidProtectionSettingsClick()
    private _onRaidProtectionSettingsClick = (): void =>
    {
        const roomData = this._navigator?.data.enteredGuestRoom ?? null;

        if(roomData === null) return;

        const ctx = (this._navigator?.windowManager as unknown as {
            context?: {createLinkEvent(link: string): void};
        })?.context;

        ctx?.createLinkEvent(`navigator/raidprotection/${roomData.flatId}`);
        this.close();
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::dispose()
    dispose(): void
    {
        this._tagRenderer.dispose();
        this._guildInfoCtrl.dispose();

        if(this._raidProtection)
        {
            this._raidProtection.off(
                RaidProtectionSettingsController.STATE_CHANGED,
                this._onRaidProtectionStateChanged
            );
            this._raidProtection = null;
        }

        if(this._window !== null)
        {
            (this._window as unknown as { dispose(): void }).dispose();
            this._window = null;
        }

        this._navigator = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::refresh()
    private refresh(): void
    {
        if(!this._navigator) return;

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData === null) return;

        this._tagRenderer.useHashTags = true;
        this._prepareWindow();

        if(this._window === null) return;

        const content = (this._window as unknown as { content: IWindowContainer }).content;

        Util.hideChildren(content);
        this._refreshRoomDetails(roomData);
        this._refreshEmbed();
        this._guildInfoCtrl.refresh(content, roomData);
        this.refreshButtons(roomData);

        Util.moveChildrenToColumn(
            content,
            ['room_details', 'public_space_details', 'guild_info', 'embed_info', 'buttons_cont'],
            0,
            3
        );

        const guildInfo = content.findChildByName('guild_info');

        if(guildInfo !== null) guildInfo.x = 11;

        this._window.height = Util.getLowestPoint(content) + 45;
    }

    private _isHome(roomData: GuestRoomData): boolean
    {
        return roomData !== null && roomData.flatId === this._navigator!.data.homeRoomId;
    }

    private _refreshEmbed(): void
    {
        if(this._window === null || !this._navigator) return;

        const embedInfo = this._window.findChildByName('embed_info') as IWindowContainer | null;

        if(embedInfo === null) return;

        const hasRoom = this._navigator.data.enteredGuestRoom !== null;
        const showEmbed = this._navigator.getBoolean('embed.showInRoomInfo');

        if(hasRoom && showEmbed)
        {
            const embedTxt = embedInfo.findChildByName('embed_info_txt') as ITextWindow | null;
            const embedSrc = embedInfo.findChildByName('embed_src_txt') as ITextFieldWindow | null;
            const embedRegion = embedInfo.findChildByName('embed_info_region');

            if(this._embedExpanded && embedSrc !== null)
            {
                embedSrc.text = this._getEmbedData();
            }

            if(embedTxt !== null) embedTxt.visible = this._embedExpanded;

            if(embedSrc !== null) embedSrc.visible = this._embedExpanded;

            if(embedRegion !== null) embedRegion.visible = false;

            embedInfo.visible = true;
            embedInfo.height = Util.getLowestPoint(embedInfo) + 5;

            if(embedRegion !== null)
            {
                embedRegion.visible = true;
                embedRegion.height = this._embedExpanded && embedSrc !== null
                    ? (embedSrc as unknown as { y: number }).y
                    : embedInfo.height;
            }
        }
        else
        {
            embedInfo.visible = false;
        }
    }

    private _refreshRoomDetails(roomData: GuestRoomData): void
    {
        if(this._window === null || !this._navigator) return;

        const roomDetailsContainer = this._find('room_details') as IWindowContainer;
        const roomName = this._find('room_name') as unknown as ITextWindow;
        roomName.text = roomData.roomName;
        roomName.height = (roomName as unknown as { textHeight: number }).textHeight + 5;

        const ownerNameEl = this._find('owner_name') as unknown as ITextWindow;

        if(roomData.showOwner && roomData.ownerId > 0)
        {
            this._find('owner_name_cont').visible = true;
            ownerNameEl.visible = true;
            ownerNameEl.text = roomData.ownerName;

            // Resets the profile eye to its idle image; AS3 does this on every refresh so a
            // hover left over from the previous room's card does not persist.
            UserInfoRegionUtil.setUserInfoState(false, roomDetailsContainer);
        }
        else
        {
            this._find('owner_name_cont').visible = false;
        }

        const descEl = this._find('room_desc') as unknown as ITextWindow;
        descEl.text = roomData.description;

        this._tagRenderer.refreshTags(roomDetailsContainer, roomData.tags);

        descEl.visible = false;

        if(roomData.description !== '')
        {
            descEl.height = (descEl as unknown as { textHeight: number }).textHeight + 5;
            descEl.visible = true;
        }

        this._find('rating_region').visible = this._navigator.data.canRate;
        (this._find('rating_txt') as unknown as ITextWindow).text = '' + this._navigator.data.currentRoomRating;

        const ratingTxt = this._window.findChildByName('rating_txt');
        const ratingRegion = this._window.findChildByName('rating_region');

        if(ratingTxt !== null && ratingRegion !== null)
        {
            ratingRegion.x = ratingTxt.x + ratingTxt.width + 5;
        }

        this._find('ranking_cont').visible = roomData.ranking > 0;
        (this._find('ranking_txt') as unknown as ITextWindow).text = '' + roomData.ranking;

        this._navigator.refreshButton(
            roomDetailsContainer as unknown as Parameters<typeof this._navigator.refreshButton>[0],
            'home',
            this._isHome(roomData),
            () => {},
            0
        );

        this._window.findChildByName('make_home_region')!.visible = !this._isHome(roomData);
        this._window.findChildByName('make_favourite_region')!.visible =
            !this._navigator.data.currentRoomOwner && !this._navigator.data.isCurrentRoomFavourite();
        this._window.findChildByName('favourite_region')!.visible =
            !this._navigator.data.currentRoomOwner && this._navigator.data.isCurrentRoomFavourite();
        this._window.findChildByName('floor_plan_editor_button')!.visible =
            this._navigator.data.canEditRoomSettings;

        Util.moveChildrenToColumn(
            roomDetailsContainer,
            ['room_name', 'owner_name_cont', 'rating_cont', 'ranking_cont', 'padding_cont', 'tags', 'room_desc', 'thumbnail_container'],
            (roomName as unknown as { y: number }).y,
            0
        );

        roomDetailsContainer.visible = true;
        roomDetailsContainer.height = Util.getLowestPoint(roomDetailsContainer);
    }

    private _refreshStaffPick(toggleCaption: boolean = false): void
    {
        if(this._window === null || !this._navigator) return;

        const staffPickBtn = this._window.findChildByName('staff_pick_button');

        if(staffPickBtn === null) return;

        if(!this._navigator.data.roomPicker)
        {
            staffPickBtn.visible = false;
            return;
        }

        staffPickBtn.visible = true;

        const isStaffPick = this._navigator.data.currentRoomIsStaffPick;

        if(toggleCaption)
        {
            staffPickBtn.caption = this._navigator.getText(
                !isStaffPick ? 'navigator.staffpicks.unpick' : 'navigator.staffpicks.pick'
            );
        }
        else
        {
            staffPickBtn.caption = this._navigator.getText(
                isStaffPick ? 'navigator.staffpicks.unpick' : 'navigator.staffpicks.pick'
            );
        }
    }

    private _prepareWindow(): void
    {
        this._visible = true;

        // Subscribed before the early return below, exactly as AS3 does: the controller may only
        // have been built after this view's first window, and leaving/entering a room changes the
        // answer without the window being rebuilt.
        if(this._raidProtection === null)
        {
            this._raidProtection = this._navigator?.raidProtectionSettingsController ?? null;
            this._raidProtection?.on(
                RaidProtectionSettingsController.STATE_CHANGED,
                this._onRaidProtectionStateChanged
            );
        }

        if(this._window !== null) return;

        if(!this._navigator) return;

        const win = this._navigator.getXmlWindow('iro_room_details_framed') as IWindowContainer | null;

        if(win === null) return;

        this._window = win;

        (win as unknown as { center(): void }).center?.();

        this._addClick('make_favourite_region', this._onAddFavouriteClick);
        this._addClick('favourite_region', this._onRemoveFavouriteClick);
        this._addClick('room_settings_button', this._onRoomSettingsClick);
        this._addClick('raid_protection_settings_button', this._onRaidProtectionSettingsClick);
        this._addClick('room_filter_button', this._onRoomFilterButtonClick);
        this._addClick('floor_plan_editor_button', this._onFloorPlanEditorButtonClick);
        this._addClick('room_muteall_button', this._onMuteAllClick);
        this._addClick('make_home_region', this._onMakeHomeClick);
        this._addClick('remove_rights_region', this._onRemoveRights);
        this._addClick('embed_src_txt', this._onEmbedSrcClick);
        this._addClick('staff_pick_button', this._onStaffPick);
        this._addClick('room_report_button', this._onRoomReport);

        const closeBtn = win.findChildByTag('close');

        if(closeBtn !== null)
        {
            closeBtn.addEventListener(WindowMouseEvent.CLICK, this._onCloseButtonClick);
        }

        const removeRightsRegion = this._find('remove_rights_region');

        this._navigator.refreshButton(
            removeRightsRegion as unknown as Parameters<typeof this._navigator.refreshButton>[0],
            'remove_rights',
            this._navigator.hasRoomRightsButIsNotOwner(this._navigator.data.enteredGuestRoom?.flatId ?? 0),
            () => {},
            0
        );

        this._navigator.refreshButton(
            this._find('make_home_region') as unknown as Parameters<typeof this._navigator.refreshButton>[0],
            'make_home',
            true,
            () => {},
            0
        );

        this._navigator.refreshButton(
            this._find('favourite_region') as unknown as Parameters<typeof this._navigator.refreshButton>[0],
            'favourite',
            true,
            () => {},
            0
        );

        this._navigator.refreshButton(
            this._find('make_favourite_region') as unknown as Parameters<typeof this._navigator.refreshButton>[0],
            'make_favourite',
            true,
            () => {},
            0
        );

        const ownerNameCont = win.findChildByName('owner_name_cont') as IWindowContainer | null;

        if(ownerNameCont !== null)
        {
            Util.layoutChildrenInArea(ownerNameCont, 1000, 10, 2, 5);
            ownerNameCont.addEventListener(WindowMouseEvent.CLICK, this._onOwnerNameClick);
            ownerNameCont.addEventListener(WindowMouseEvent.OVER, this._onOwnerNameOver);
            ownerNameCont.addEventListener(WindowMouseEvent.OUT, this._onOwnerNameOut);
        }

        this._setupLabelAndValue('rating_cont', 'rating_caption', 'rating_txt');
        this._setupLabelAndValue('ranking_cont', 'ranking_caption', 'ranking_txt');

        const embedInfo = win.findChildByName('embed_info') as IWindowContainer | null;

        if(embedInfo !== null)
        {
            this._navigator.refreshButton(
                embedInfo as unknown as Parameters<typeof this._navigator.refreshButton>[0],
                'icon_weblink',
                true,
                () => {},
                0
            );

            const embedInfoTxt = embedInfo.findChildByName('embed_info_txt') as ITextWindow | null;

            if(embedInfoTxt !== null)
            {
                embedInfoTxt.height = (embedInfoTxt as unknown as { textHeight: number }).textHeight + 5;
            }

            Util.moveChildrenToColumn(embedInfo, ['embed_info_txt', 'embed_src_txt'],
                embedInfoTxt !== null ? (embedInfoTxt as unknown as { y: number }).y : 0, 2);

            embedInfo.height = Util.getLowestPoint(embedInfo) + 5;

            const embedInfoRegion = embedInfo.findChildByName('embed_info_region');

            if(embedInfoRegion !== null)
            {
                embedInfoRegion.addEventListener(WindowMouseEvent.CLICK, this._onEmbedInfoClick);
            }
        }

        if(this._navigator.sessionData?.isPerkAllowed(PerkType.NAVIGATOR_ROOM_THUMBNAIL_CAMERA))
        {
            const addThumbRegion = win.findChildByName('add_thumbnail_region');

            if(addThumbRegion !== null)
            {
                addThumbRegion.visible = this._navigator.data.canEditRoomSettings;

                if(this._navigator.data.canEditRoomSettings)
                {
                    addThumbRegion.addEventListener(WindowMouseEvent.CLICK, this._onAddRoomThumbnail);
                }
            }
        }
        else
        {
            const thumbContainer = win.findChildByName('thumbnail_container');

            if(thumbContainer !== null) thumbContainer.visible = false;
        }
    }

    private _setupLabelAndValue(containerName: string, labelName: string, valueName: string): void
    {
        if(this._window === null) return;

        const container = this._window.findChildByName(containerName) as IWindowContainer | null;

        if(container === null) return;

        const label = container.findChildByName(labelName) as ITextWindow | null;

        if(label !== null)
        {
            label.width = (label as unknown as { textWidth: number }).textWidth;
            Util.moveChildrenToRow(
                container,
                [labelName, valueName],
                (label as unknown as { x: number }).x,
                (label as unknown as { y: number }).y,
                3
            );
        }
    }

    private _addClick(childName: string, handler: (e: WindowEvent) => void): void
    {
        if(this._window === null) return;

        const child = this._window.findChildByName(childName);

        if(child !== null)
        {
            child.addEventListener(WindowMouseEvent.CLICK, handler);
        }
    }

    private _find(name: string): IWindowContainer
    {
        if(this._window === null) throw new Error('Window not ready: ' + name);

        const child = this._window.findChildByName(name);

        if(child === null) throw new Error('Window element not found: ' + name);

        return child as unknown as IWindowContainer;
    }

    private _getEmbedData(): string
    {
        if(!this._navigator) return '';

        const roomData = this._navigator.data.enteredGuestRoom;
        const roomType = roomData !== null ? 'private' : null;
        const roomId = roomData !== null ? '' + roomData.flatId : null;

        this._navigator.registerParameter('navigator.embed.src', 'roomType', roomType ?? '');
        this._navigator.registerParameter('navigator.embed.src', 'embedCode', this._navigator.getProperty('user.hash'));
        this._navigator.registerParameter('navigator.embed.src', 'roomId', roomId ?? '');

        return this._navigator.getText('navigator.embed.src');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::onAddFavouriteClick()
    private _onAddFavouriteClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData === null) return;

        if(this._navigator.data.isFavouritesFull())
        {
            const alert = new SimpleAlertView(
                this._navigator,
                '${navigator.favouritesfull.title}',
                '${navigator.favouritesfull.body}'
            );
            alert.show();
        }
        else
        {
            this._navigator.trackGoogle('roomInfo', 'addFavourite');
            this._navigator.send(new AddFavouriteRoomMessageComposer(roomData.flatId));
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::onRemoveFavouriteClick()
    private _onRemoveFavouriteClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData === null) return;

        this._navigator.trackGoogle('roomInfo', 'removeFavourite');
        this._navigator.send(new DeleteFavouriteRoomMessageComposer(roomData.flatId));
    };

    private _onRoomSettingsClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData === null) return;

        this._navigator.trackGoogle('roomInfo', 'editRoomSettings');
        this._navigator.roomSettingsCtrl?.startRoomSettingsEdit(roomData.flatId);
        this.close();
    };

    private _onRoomFilterButtonClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData === null) return;

        this._navigator.trackGoogle('roomInfo', 'editRoomFilter');
        this._navigator.roomFilterCtrl?.startRoomFilterEdit(roomData.flatId);
        this.close();
    };

    private _onFloorPlanEditorButtonClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        this._navigator.trackGoogle('roomInfo', 'floorPlanEditor');
        this._navigator.windowManager?.displayFloorPlanEditor();
        this.close();
    };

    private _onMuteAllClick = (_event: WindowEvent): void =>
    {
        this._navigator?.send(new MuteAllInRoomComposer());
    };

    private _onMakeHomeClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData === null) return;

        this._navigator.trackGoogle('roomInfo', 'makeHome');
        this._navigator.send(new UpdateHomeRoomMessageComposer(roomData.flatId));
    };

    private _onCloseButtonClick = (_event: WindowEvent): void =>
    {
        if(this._window !== null)
        {
            (this._window as unknown as { dispose(): void }).dispose();
            this._window = null;
        }

        this._visible = false;
    };

    private _onRemoveRights = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        const roomData = this._navigator.enteredGuestRoomData;

        if(roomData === null) return;

        this._navigator.removeRoomRights(roomData.flatId);

        const removeRegion = this._window?.findChildByName('remove_rights_region');

        if(removeRegion !== null && removeRegion !== undefined) removeRegion.visible = false;
    };

    private _onStaffPick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        this._refreshStaffPick(true);

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData !== null)
        {
            this._navigator.send(
                new ToggleStaffPickMessageComposer(roomData.flatId, this._navigator.data.currentRoomIsStaffPick)
            );
        }
    };

    private _onRoomReport = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        this._navigator.trackGoogle('roomInfo', 'reportRoom');

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData !== null)
        {
            this._navigator.habboHelp?.reportRoom(roomData.flatId, roomData.roomName, roomData.description);
        }

        this.close();
    };

    private _onEmbedSrcClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator || !this._window) return;

        const embedSrc = this._window.findChildByName('embed_src_txt') as ITextFieldWindow | null;

        if(embedSrc !== null)
        {
            (embedSrc as unknown as { setSelection(start: number, end: number): void }).setSelection(0, embedSrc.text.length);
        }

        this._navigator.trackGoogle('roomInfo', 'embedSrc');
    };

    private _onAddRoomThumbnail = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        const ctx = (this._navigator.windowManager as unknown as { context?: { createLinkEvent(link: string): void } })?.context;

        ctx?.createLinkEvent('roomThumbnailCamera/open');
        this.close();

        this._navigator.trackGoogle('roomInfo', 'addThumbnail');
    };

    private _onEmbedInfoClick = (_event: WindowEvent): void =>
    {
        this._embedExpanded = !this._embedExpanded;
        this.refresh();
    };

    private _onOwnerNameClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        this._navigator.trackGoogle('roomInfo', 'extendedProfile');
        this._navigator.trackGoogle('extendedProfile', 'navigator_roomInfo');

        const roomData = this._navigator.data.enteredGuestRoom;

        if(roomData !== null)
        {
            this._navigator.send(new GetExtendedProfileMessageComposer(roomData.ownerId));
        }
    };

    /**
	 * AS3 binds one `procedure` to `owner_name_cont` and routes click, over and out through it;
	 * this port splits them into three listeners, so both hover halves land here. `onEntry()`
	 * swaps the eye pair on the *parent* of the window it is given — `room_details`, the same
	 * container `_refreshRoomDetails()` resets — which is why the container itself is passed and
	 * not the event target.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::onOwnerName()
    private _onOwnerNameOver = (event: WindowEvent): void =>
    {
        UserInfoRegionUtil.onEntry(event, this._find('owner_name_cont') as unknown as IWindow);
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/inroom/RoomInfoViewCtrl.as::onOwnerName()
    private _onOwnerNameOut = (event: WindowEvent): void =>
    {
        UserInfoRegionUtil.onEntry(event, this._find('owner_name_cont') as unknown as IWindow);
    };
}
