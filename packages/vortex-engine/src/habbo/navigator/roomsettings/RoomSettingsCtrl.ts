import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import type {FlatCategory} from '@habbo/communication/messages/incoming/navigator/FlatCategory';
import type {RoomSettingsData} from '@habbo/communication/messages/parser/roomsettings/RoomSettingsData';
import type {RoomSettingsController} from '@habbo/communication/messages/parser/roomsettings/RoomSettingsController';
import type {RoomSettingsBannedUser} from '@habbo/communication/messages/parser/roomsettings/RoomSettingsBannedUser';
import {TextFieldManager} from '../TextFieldManager';
import {UserListCtrl} from './UserListCtrl';
import {BanListCtrl} from './BanListCtrl';
import {ConfirmDialogView} from './ConfirmDialogView';
import {GetRoomSettingsMessageComposer} from '@habbo/communication/messages/outgoing/room/settings/GetRoomSettingsMessageComposer';
import {SaveRoomSettingsMessageComposer} from '@habbo/communication/messages/outgoing/room/settings/SaveRoomSettingsMessageComposer';
import {RoomSettingsBuilder} from '@habbo/communication/messages/outgoing/room/settings/RoomSettingsBuilder';
import {DeleteRoomMessageComposer} from '@habbo/communication/messages/outgoing/room/settings/DeleteRoomMessageComposer';
import {GetFlatControllersMessageComposer} from '@habbo/communication/messages/outgoing/room/settings/GetFlatControllersMessageComposer';
import {GetBannedUsersFromRoomMessageComposer} from '@habbo/communication/messages/outgoing/room/settings/GetBannedUsersFromRoomMessageComposer';
import {RemoveAllRightsMessageComposer} from '@habbo/communication/messages/outgoing/room/settings/RemoveAllRightsMessageComposer';
import {UnbanUserFromRoomMessageComposer} from '@habbo/communication/messages/outgoing/room/settings/UnbanUserFromRoomMessageComposer';
import type {IHabboTransitionalNavigator} from '../IHabboTransitionalNavigator';
import type {IRoomSettingsUserData} from './UserListCtrl';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

type IPopulatable = { populate(items: string[]): void; selection: number; enumerateSelection?(): unknown[] };
type ICheckable = { select(): void; unselect(): void; readonly isSelected: boolean };
type ISelectorWindow = { setSelected(window: unknown | null): void; getSelected(): { name: string } | null };
type ITabContextWindow = {
    selector: { setSelected(window: unknown | null): void };
    numTabItems: number;
    getTabItemAt(i: number): { id: number; visible: boolean; width: number } | null;
};

/**
 * Room settings controller - manages 5 tabs of room settings.
 *
 * Tab 1 (Basic): name, description, tags, category, trade mode, max visitors, pets
 * Tab 2 (Access Rights): door mode, password, wall/floor thickness, dyn cats
 * Tab 3 (Room Rights): users with rights, friends list, remove/add
 * Tab 4 (Club & Chat): chat mode, bubble width, scroll speed, flood filter, hear range
 * Tab 5 (Moderation): mute/kick/ban settings, banned users list
 *
 * @see sources/win63_version/habbo/navigator/roomsettings/RoomSettingsCtrl.as
 */
export class RoomSettingsCtrl
{
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::TAB_BASIC
    static readonly TAB_BASIC: number = 1;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::TAB_ACCESS_RIGHTS
    static readonly TAB_ACCESS_RIGHTS: number = 2;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::TAB_ROOM_RIGHTS
    static readonly TAB_ROOM_RIGHTS: number = 3;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::TAB_CLUB_AND_CHAT
    static readonly TAB_CLUB_AND_CHAT: number = 4;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::TAB_MODERATION
    static readonly TAB_MODERATION: number = 5;

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::HC_MAXIMUM_ROOM_VISITORS
    private static readonly HC_MAXIMUM_ROOM_VISITORS: number = 75;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::MAXIMUM_ROOM_VISITORS
    private static readonly MAXIMUM_ROOM_VISITORS: number = 50;

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_flatId
    private _flatId: number = 0;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_groupId
    private _groupId: number = 0;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_navigator
    private _navigator: IHabboTransitionalNavigator | null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_originalData
    private _originalData: RoomSettingsData | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_savedFlatId
    private _savedFlatId: number = 0;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_window
    private _window: IWindowContainer | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_currentTab
    private _currentTab: number = RoomSettingsCtrl.TAB_BASIC;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_populating
    private _populating: boolean = false;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_removeTabsForNavigatorView
    private _removeTabsForNavigatorView: boolean = false;

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_usersWithRightsListCtrl
    private _usersWithRightsListCtrl: UserListCtrl | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_friendsListCtrl
    private _friendsListCtrl: UserListCtrl | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_bannedUsersListCtrl
    private _bannedUsersListCtrl: BanListCtrl | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_confirmDialog
    private _confirmDialog: ConfirmDialogView | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_nameInput
    private _nameInput: TextFieldManager | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_descInput
    private _descInput: TextFieldManager | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_tag1Input
    private _tag1Input: TextFieldManager | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_tag2Input
    private _tag2Input: TextFieldManager | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_passwordInput
    private _passwordInput: TextFieldManager | null = null;
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_passwordConfirmInput
    private _passwordConfirmInput: TextFieldManager | null = null;
    // AS3: sources/win63_version/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_chatFullHearRangeInput
    private _chatFullHearRangeInput: TextFieldManager | null = null;

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::_tabContext
    private _tabContext: ITabContextWindow | null = null;

    private _roomModerationMuteSettings: number[] = [];
    private _roomModerationBanSettings: number[] = [];
    private _roomModerationKickSettings: number[] = [];

    constructor(navigator: IHabboTransitionalNavigator)
    {
        this._navigator = navigator;
        this._usersWithRightsListCtrl = new UserListCtrl(navigator, false);
        this._friendsListCtrl = new UserListCtrl(navigator, true);
        this._bannedUsersListCtrl = new BanListCtrl(navigator);
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::get disposed()
    get disposed(): boolean
    {
        return this._navigator === null;
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::startRoomSettingsEdit()
    startRoomSettingsEdit(flatId: number): void
    {
        this.close();

        if(!this._navigator) return;

        this._flatId = flatId;
        this._groupId = this._navigator.data.enteredGuestRoom?.habboGroupId ?? 0;
        this._navigator.send(new GetRoomSettingsMessageComposer(flatId));
        this._navigator.events.emit('HABBO_ROOM_SETTINGS_TRACKING_EVENT_DEFAULT');
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::startRoomSettingsEditFromNavigator()
    startRoomSettingsEditFromNavigator(flatId: number, groupId: number): void
    {
        this.close();

        if(!this._navigator) return;

        this._flatId = flatId;
        this._groupId = groupId;
        this._navigator.send(new GetRoomSettingsMessageComposer(flatId));
        this._navigator.events.emit('HABBO_ROOM_SETTINGS_TRACKING_EVENT_DEFAULT');
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::onRoomSettings()
    onRoomSettings(data: RoomSettingsData): void
    {
        if(!this._navigator) return;

        if(data.roomId !== this._flatId) return;

        this._originalData = data;
        this.refresh();
        this.populateForm();

        if(this._window !== null)
        {
            this._window.visible = true;
            (this._window as unknown as { invalidate?(): void }).invalidate?.();
            (this._window as unknown as { activate?(): void }).activate?.();
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::onFlatControllers()
    onFlatControllers(flatId: number, controllers: RoomSettingsController[]): void
    {
        if(!this._isAcceptFlatControllerUpdate(flatId)) return;

        for(const ctrl of controllers)
        {
            this._originalData!.setFlatController(ctrl.userId, ctrl);
        }

        this._checkFlatControllerRefresh();
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::onFlatControllerAdded()
    onFlatControllerAdded(flatId: number, ctrl: RoomSettingsController): void
    {
        if(!this._isAcceptFlatControllerUpdate(flatId)) return;

        this._originalData!.setFlatController(ctrl.userId, ctrl);
        this._checkFlatControllerRefresh();
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::onFlatControllerRemoved()
    onFlatControllerRemoved(flatId: number, userId: number): void
    {
        if(!this._isAcceptFlatControllerUpdate(flatId)) return;

        this._originalData!.controllersById.delete(userId);
        this._checkFlatControllerRefresh();
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::onBannedUsersFromRoom()
    onBannedUsersFromRoom(flatId: number, banned: RoomSettingsBannedUser[]): void
    {
        if(!this._isAcceptBannedUsersUpdate(flatId)) return;

        for(const user of banned)
        {
            this._originalData!.setBannedUser(user.userId, user);
        }

        this._checkBannedUsersFromRoomRefresh();
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::onUserUnbannedFromRoom()
    onUserUnbannedFromRoom(flatId: number, userId: number): void
    {
        if(!this._isAcceptBannedUsersUpdate(flatId)) return;

        this._originalData!.bannedUsersById.delete(userId);
        this._checkBannedUsersFromRoomRefresh();
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::onFriendListUpdate()
    onFriendListUpdate(): void
    {
        this._checkFlatControllerRefresh();
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::onRoomSettingsSaveError()
    onRoomSettingsSaveError(roomId: number, errorCode: number, info: string): void
    {
        if(roomId !== this._flatId || this._savedFlatId < 1) return;

        this._savedFlatId = 0;

        if(errorCode === 7)
        {
            this._switchToTab(RoomSettingsCtrl.TAB_BASIC);
            this._nameInput?.displayError('${navigator.roomsettings.roomnameismandatory}');
        }
        else if(errorCode === 8)
        {
            this._switchToTab(RoomSettingsCtrl.TAB_BASIC);
            this._nameInput?.displayError('${navigator.roomsettings.unacceptablewords}');
        }
        else if(errorCode === 10)
        {
            this._switchToTab(RoomSettingsCtrl.TAB_BASIC);
            this._descInput?.displayError('${navigator.roomsettings.unacceptablewords}');
        }
        else if(errorCode === 11)
        {
            this._switchToTab(RoomSettingsCtrl.TAB_BASIC);
            this._setTagError(this._tag1Input, info, '${navigator.roomsettings.unacceptablewords}');
            this._setTagError(this._tag2Input, info, '${navigator.roomsettings.unacceptablewords}');
        }
        else if(errorCode === 12)
        {
            this._switchToTab(RoomSettingsCtrl.TAB_BASIC);
            this._setTagError(this._tag1Input, info, '${navigator.roomsettings.nonuserchoosabletag}');
            this._setTagError(this._tag2Input, info, '${navigator.roomsettings.nonuserchoosabletag}');
        }
        else if(errorCode === 5)
        {
            this._switchToTab(RoomSettingsCtrl.TAB_ACCESS_RIGHTS);
            this._passwordInput?.displayError('${navigator.roomsettings.passwordismandatory}');
        }
        else if(errorCode === 13)
        {
            this._switchToTab(RoomSettingsCtrl.TAB_BASIC);
            this._setTagError(this._tag1Input, info, '${navigator.roomsettings.toomanycharacters}');
            this._setTagError(this._tag2Input, info, '${navigator.roomsettings.toomanycharacters}');
        }
        else
        {
            this._switchToTab(RoomSettingsCtrl.TAB_BASIC);
            this._nameInput?.displayError('Update failed: error ' + errorCode);
        }

        this.refresh();
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::refresh()
    refresh(): void
    {
        if(!this._navigator) return;

        this._prepareWindow();

        if(this._window === null) return;

        const contentContainer = this._window.findChildByName('content_container') as IWindowContainer | null;

        if(contentContainer !== null)
        {
            for(let i = 0; i < contentContainer.numChildren; i++)
            {
                const child = contentContainer.getChildAt(i);

                if(child !== null) child.visible = false;
            }

            const tabContainer = this._window.findChildByName('tab_container_' + this._currentTab) as IWindowContainer | null;

            if(tabContainer !== null) tabContainer.visible = true;
        }

        this._refreshNavigatorTabs();
        this._resizeTabs();
        this._refreshFlatControllers();
        this._refreshBannedUsers();
        this._refreshGroupMemberDisclaimer();
        this._showDeleteButton();

        (this._window as unknown as { invalidate?(): void }).invalidate?.();
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::close()
    close(): void
    {
        this._flatId = 0;
        this._groupId = 0;
        this._originalData = null;
        this._savedFlatId = 0;

        if(this._window !== null)
        {
            (this._window as unknown as { dispose(): void }).dispose();
            this._window = null;
        }

        if(this._confirmDialog !== null)
        {
            this._confirmDialog.dispose();
            this._confirmDialog = null;
        }
    }

    /**
     * The link prefix this controller would answer to, if anything registered it.
     *
     * Dead in AS3 too: the class implements `ILinkEventTracker`, but neither HabboNavigator nor
     * LegacyNavigator ever calls `addLinkEventTracker()` on the instance they construct — only
     * the navigator registers, under `"navigator/"`. `linkReceived()` below is empty in AS3 as
     * well, so even a registered call would do nothing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::get linkPattern()
    get linkPattern(): string
    {
        return 'roomsettings/';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::linkReceived()
    linkReceived(_link: string): void
    {
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        this._originalData = null;

        if(this._window !== null)
        {
            (this._window as unknown as { dispose(): void }).dispose();
            this._window = null;
        }

        this._usersWithRightsListCtrl?.dispose();
        this._usersWithRightsListCtrl = null;
        this._friendsListCtrl?.dispose();
        this._friendsListCtrl = null;
        this._bannedUsersListCtrl?.dispose();
        this._bannedUsersListCtrl = null;
        this._confirmDialog?.dispose();
        this._confirmDialog = null;

        this._nameInput = null;
        this._descInput = null;
        this._tag1Input = null;
        this._tag2Input = null;
        this._passwordInput = null;
        this._passwordConfirmInput = null;
        this._chatFullHearRangeInput = null;
        this._tabContext = null;

        this._navigator = null;
    }

    private _isAcceptFlatControllerUpdate(flatId: number): boolean
    {
        return flatId === this._flatId && this._originalData !== null;
    }

    private _isAcceptBannedUsersUpdate(flatId: number): boolean
    {
        return flatId === this._flatId && this._originalData !== null;
    }

    private _checkFlatControllerRefresh(): void
    {
        if(this._window !== null && this._window.visible && this._currentTab === RoomSettingsCtrl.TAB_ROOM_RIGHTS)
        {
            this.refresh();
        }
    }

    private _checkBannedUsersFromRoomRefresh(): void
    {
        if(this._window !== null && this._window.visible && this._currentTab === RoomSettingsCtrl.TAB_MODERATION)
        {
            this.refresh();
        }
    }

    private _switchToTab(tab: number): void
    {
        this._currentTab = tab;

        if(this._tabContext !== null && this._window !== null)
        {
            const tabEl = this._window.findChildByName('tab_' + tab);
            this._tabContext.selector.setSelected(tabEl);
        }
    }

    private _prepareWindow(): void
    {
        if(this._window !== null || !this._navigator) return;

        const win = this._navigator.getXmlWindow('ros_room_settings') as IWindowContainer | null;

        if(win === null) return;

        this._window = win;

        if(this._originalData !== null)
        {
            this._removeTabsForNavigatorView = !this._navigator.data.enteredGuestRoom ||
                this._navigator.data.enteredGuestRoom.flatId !== this._originalData.roomId;
        }

        const tab1 = win.findChildByName('tab_1');
        const tab2 = win.findChildByName('tab_2');
        const tab3 = win.findChildByName('tab_3');
        const tab4 = win.findChildByName('tab_4');
        const tab5 = win.findChildByName('tab_5');

        if(tab1) tab1.addEventListener(WindowMouseEvent.CLICK, this._onTabClick);
        if(tab2) tab2.addEventListener(WindowMouseEvent.CLICK, this._onTabClick);
        if(tab3) tab3.addEventListener(WindowMouseEvent.CLICK, this._onTabClick);
        if(tab4) tab4.addEventListener(WindowMouseEvent.CLICK, this._onTabClick);
        if(tab5) tab5.addEventListener(WindowMouseEvent.CLICK, this._onTabClick);

        const buildersBtn = win.findChildByName('builders_faq_button');
        if(buildersBtn) buildersBtn.addEventListener(WindowMouseEvent.CLICK, this._onBuildersClubFaqClick);

        const doormodePwEl = win.findChildByName('doormode_password');
        if(doormodePwEl)
        {
            doormodePwEl.addEventListener(WindowEvent.WE_SELECT, this._onDoorModePasswordSelect);
            doormodePwEl.addEventListener(WindowEvent.WE_UNSELECT, this._onDoorModePasswordUnselect);
        }

        const closeBtn = win.findChildByTag('close');
        if(closeBtn) closeBtn.addEventListener(WindowMouseEvent.CLICK, this._onClose);

        const removeAllBtn = win.findChildByName('remove_all_flat_ctrls');
        if(removeAllBtn) removeAllBtn.addEventListener(WindowMouseEvent.CLICK, this._onRemoveAllFlatCtrlsClick);

        const filterInput = win.findChildByName('filter_users_input');
        if(filterInput) filterInput.addEventListener(WindowEvent.WE_CHANGE, this._onUserFilterChange);

        const removeLinkRegion = win.findChildByName('remove_link_region');
        if(removeLinkRegion)
        {
            if(this._removeTabsForNavigatorView)
            {
                removeLinkRegion.visible = false;
            }
            else
            {
                removeLinkRegion.addEventListener(WindowMouseEvent.CLICK, this._onDeleteButtonClick);
            }
        }

        const nameEl = win.findChildByName('room_name');
        const descEl = win.findChildByName('description');
        const tag1El = win.findChildByName('tag1');
        const tag2El = win.findChildByName('tag2');
        const pwEl = win.findChildByName('password');
        const pwConfEl = win.findChildByName('password_confirm');
        const hearRangeEl = win.findChildByName('chat_settings_hearing_distance');

        if(nameEl) this._nameInput = new TextFieldManager(this._navigator, nameEl as never, 60);
        if(descEl) this._descInput = new TextFieldManager(this._navigator, descEl as never, 255);
        if(tag1El) this._tag1Input = new TextFieldManager(this._navigator, tag1El as never, 30);
        if(tag2El) this._tag2Input = new TextFieldManager(this._navigator, tag2El as never, 30);
        if(pwEl) this._passwordInput = new TextFieldManager(this._navigator, pwEl as never, 30);
        if(pwConfEl) this._passwordConfirmInput = new TextFieldManager(this._navigator, pwConfEl as never, 30);
        if(hearRangeEl) this._chatFullHearRangeInput = new TextFieldManager(this._navigator, hearRangeEl as never, 2);

        const textInputManagers = [
            this._nameInput, this._descInput, this._tag1Input, this._tag2Input,
            this._passwordInput, this._passwordConfirmInput, this._chatFullHearRangeInput,
        ];

        for(const mgr of textInputManagers)
        {
            if(mgr) (mgr as unknown as { input: { addEventListener(e: string, cb: unknown): void } }).input?.addEventListener(WindowEvent.WE_UNFOCUSED, this._onUnfocus);
        }

        const selectableNames = [
            'categories', 'maxvisitors', 'tradesettings',
            'allow_pets_checkbox', 'allow_foodconsume_checkbox', 'allow_walk_through_checkbox',
            'allow_dyncats_checkbox', 'hide_walls_checkbox',
            'wall_thickness', 'floor_thickness',
            'chat_bubbles_width', 'chat_mode', 'chat_scroll_speed', 'chat_flood_sensitivity',
        ];

        for(const name of selectableNames)
        {
            const el = win.findChildByName(name);
            if(el)
            {
                el.addEventListener(WindowEvent.WE_SELECTED, this._onUnfocus);
                el.addEventListener(WindowEvent.WE_UNSELECTED, this._onUnfocus);
            }
        }

        for(const name of ['doormode_open', 'doormode_doorbell', 'doormode_password', 'doormode_invisible'])
        {
            const el = win.findChildByName(name);
            if(el) el.addEventListener(WindowEvent.WE_SELECTED, this._onUnfocus);
        }

        for(const name of [
            'moderation_mute_none', 'moderation_mute_rights',
            'moderation_kick_none', 'moderation_kick_rights', 'moderation_kick_all',
            'moderation_ban_none', 'moderation_ban_rights',
        ])
        {
            const el = win.findChildByName(name);
            if(el) el.addEventListener(WindowEvent.WE_SELECT, this._onUnfocus);
        }

        const unbanBtn = win.findChildByName('moderation_unban_btn');
        if(unbanBtn) unbanBtn.addEventListener(WindowMouseEvent.CLICK, this._onUnbanClick);

        const pwContainer = win.findChildByName('password_container');
        if(pwContainer) pwContainer.visible = false;

        const tradeLbl = win.findChildByName('tradesettings_label');
        if(tradeLbl) tradeLbl.visible = true;

        const tradeEl = win.findChildByName('tradesettings');
        if(tradeEl) tradeEl.visible = true;

        const dynCatsCb = win.findChildByName('allow_dyncats_checkbox');
        if(dynCatsCb) dynCatsCb.visible = true;

        const dynCatsTxt = win.findChildByName('allow_dyncats_text');
        if(dynCatsTxt) dynCatsTxt.visible = true;

        this._tabContext = win.findChildByName('tab_context') as unknown as ITabContextWindow | null;

        (win as unknown as { center?(): void }).center?.();
        this._switchToTab(RoomSettingsCtrl.TAB_BASIC);
    }

    private _refreshNavigatorTabs(): void
    {
        if(this._tabContext === null || this._window === null) return;

        // Tabs 2 (access rights) and 3 (room rights) only apply while you are standing in the room
        // you are editing; opened from the navigator they are hidden. This loop was missing, so all
        // five stayed visible.
        for(let index = 0; index < this._tabContext.numTabItems; index++)
        {
            const tab = this._tabContext.getTabItemAt(index);

            if(tab === null) continue;

            const removed = this._removeTabsForNavigatorView && (tab.id === 2 || tab.id === 3);

            tab.visible = !removed;
        }

        const tabEl = this._window.findChildByName('tab_' + this._currentTab);
        this._tabContext.selector.setSelected(tabEl);
    }

    /**
     * Divides the window's width across the *visible* tabs, one pixel short so the strip never
     * exceeds its selector, and collapses the hidden ones to zero.
     *
     * **Without this the tabs keep whatever the auto-size cascade left them.** A tab button fits
     * itself to its label through `resizeToAccommodateChildren()`, and when a caption shrinks the
     * label re-centres against the *pre-shrink* button width before that fit runs — so the stale
     * left offset is baked into the width. Measured on the three visible tabs: 116/120/119 instead
     * of 112 each, which is `floor(oldWidth / 2) + floor(label / 2)` to the pixel. Three of them
     * came to 358 in a 338-wide selector, and the last one was clipped.
     *
     * Nothing in the window engine is wrong there — every piece of that cascade is a faithful port.
     * AS3 simply never lets it decide: it sets the widths explicitly, here.
     */
    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::resizeTabs()
    private _resizeTabs(): void
    {
        if(this._tabContext === null || this._window === null) return;

        let visibleCount = 0;

        for(let index = 0; index < this._tabContext.numTabItems; index++)
        {
            if(this._tabContext.getTabItemAt(index)?.visible) visibleCount++;
        }

        if(visibleCount === 0) return;

        // AS3 assigns into an `int`, which truncates, then takes one more pixel off.
        const tabWidth = Math.trunc(this._window.width / visibleCount) - 1;

        for(let index = 0; index < this._tabContext.numTabItems; index++)
        {
            const tab = this._tabContext.getTabItemAt(index);

            if(tab === null) continue;

            const removed = this._removeTabsForNavigatorView && (tab.id === 2 || tab.id === 3);

            tab.width = removed ? 0 : tabWidth;
        }
    }

    private _showDeleteButton(): void
    {
        if(!this._navigator || !this._window) return;

        const isLocked = (this._navigator.sessionData as unknown as { isAccountSafetyLocked?(): boolean })?.isAccountSafetyLocked?.() ?? false;
        const removeLinkRegion = this._window.findChildByName('remove_link_region') as IWindowContainer | null;
        const removeLink = this._window.findChildByName('remove_link');
        const removeIcon = this._window.findChildByName('remove_icon');

        if(isLocked)
        {
            if(removeLinkRegion) (removeLinkRegion as unknown as { disable?(): void }).disable?.();
            if(removeLink) (removeLink as unknown as { blend?: number }).blend = 0.5;
            if(removeIcon) (removeIcon as unknown as { blend?: number }).blend = 0.5;
        }
        else
        {
            if(removeLinkRegion) (removeLinkRegion as unknown as { enable?(): void }).enable?.();
            if(removeLink) (removeLink as unknown as { blend?: number }).blend = 1;
            if(removeIcon) (removeIcon as unknown as { blend?: number }).blend = 1;
        }
    }

    private _vipFeaturesAllowed(): boolean
    {
        return (this._navigator?.sessionData as unknown as { hasVip?: boolean })?.hasVip ?? false;
    }

    private _getThicknessSelectionIndex(value: number): number
    {
        switch(value + 2)
        {
            case 0: return 0;
            case 1: return 1;
            case 3: return 3;
            default: return 2;
        }
    }

    private _clearErrors(): void
    {
        this._nameInput?.clearErrors();
        this._descInput?.clearErrors();
        this._tag1Input?.clearErrors();
        this._tag2Input?.clearErrors();
        this._passwordInput?.clearErrors();
        this._passwordConfirmInput?.clearErrors();
    }

    private _setTagError(mgr: TextFieldManager | null, matchText: string, errorKey: string): void
    {
        if(mgr === null) return;

        const text = mgr.getText();

        if(matchText === text.toLowerCase())
        {
            mgr.displayError(errorKey);
        }
    }

    // AS3: .../src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::populateForm()
    private populateForm(): void
    {
        if(!this._navigator || !this._originalData || !this._window) return;

        const data = this._originalData;
        this._populating = true;

        this._nameInput?.setText(data.name);
        this._descInput?.setText(data.description);
        this._passwordInput?.setText('');
        this._passwordConfirmInput?.setText('');

        if(this._navigator.data.enteredGuestRoom)
        {
            const doormodeSel = this._window.findChildByName('doormode') as unknown as ISelectorWindow | null;

            if(doormodeSel)
            {
                let doormodeEl: string;

                switch(data.doorMode)
                {
                    case 1: doormodeEl = 'doormode_doorbell'; break;
                    case 2: doormodeEl = 'doormode_password'; break;
                    case 3: doormodeEl = 'doormode_invisible'; break;
                    default: doormodeEl = 'doormode_open'; break;
                }

                doormodeSel.setSelected(this._window.findChildByName(doormodeEl));
            }

            const overrideInfo = this._window.findChildByName('doormode_override_info');

            if(overrideInfo)
            {
                overrideInfo.visible = data.hiddenByBc &&
                    !((this._navigator.sessionData as unknown as { hasSecurity?(level: number): boolean })?.hasSecurity?.(4) ?? false);
            }

            this._changePasswordField(data.doorMode === 2);
        }

        this._setCategorySelection(data.categoryId);
        this._setTradeModeSelection(data.tradeMode);
        this._refreshMaxVisitors(data);

        const tag1Text = data.tags[0] ? '#' + data.tags[0] : '';
        const tag2Text = data.tags[1] ? '#' + data.tags[1] : '';

        (this._tag1Input as unknown as { setText?(v: string): void })?.setText?.(tag1Text);
        (this._tag2Input as unknown as { setText?(v: string): void })?.setText?.(tag2Text);

        const allowPetsCb = this._window.findChildByName('allow_pets_checkbox') as unknown as ICheckable | null;
        if(allowPetsCb)
        {
            if(data.allowPets) allowPetsCb.select();
            else allowPetsCb.unselect();
        }

        const allowFoodCb = this._window.findChildByName('allow_foodconsume_checkbox') as unknown as ICheckable | null;
        if(allowFoodCb)
        {
            if(data.allowFoodConsume) allowFoodCb.select();
            else allowFoodCb.unselect();
        }

        const allowWalkCb = this._window.findChildByName('allow_walk_through_checkbox') as unknown as ICheckable | null;
        if(allowWalkCb)
        {
            if(data.allowWalkThrough) allowWalkCb.select();
            else allowWalkCb.unselect();
        }

        const allowDynCatsCb = this._window.findChildByName('allow_dyncats_checkbox') as unknown as ICheckable | null;
        if(allowDynCatsCb)
        {
            if(data.allowNavigatorDynamicCats) allowDynCatsCb.select();
            else allowDynCatsCb.unselect();
        }

        const vip = this._vipFeaturesAllowed();
        const hideWallsCb = this._window.findChildByName('hide_walls_checkbox') as unknown as ICheckable | null;
        const hideWallsTxt = this._window.findChildByName('hide_walls_text');
        const wallDropEl = this._window.findChildByName('wall_thickness') as unknown as (IWindowContainer & IPopulatable) | null;
        const floorDropEl = this._window.findChildByName('floor_thickness') as unknown as (IWindowContainer & IPopulatable) | null;

        const disableEl = (el: unknown): void =>
        {
            if(el === null || el === undefined) return;
            (el as { disable?(): void }).disable?.();
            (el as { blend?: number }).blend = 0.5;
        };

        const enableEl = (el: unknown): void =>
        {
            if(el === null || el === undefined) return;
            (el as { enable?(): void }).enable?.();
            (el as { blend?: number }).blend = 1;
        };

        if(!vip)
        {
            disableEl(hideWallsCb);
            disableEl(wallDropEl);
            disableEl(floorDropEl);
            disableEl(hideWallsTxt);
        }
        else
        {
            enableEl(hideWallsCb);
            enableEl(wallDropEl);
            enableEl(floorDropEl);
            enableEl(hideWallsTxt);
        }

        if(hideWallsCb)
        {
            if(data.hideWalls) hideWallsCb.select();
            else hideWallsCb.unselect();
        }

        if(data.chatSettings)
        {
            const chatModeEl = this._window.findChildByName('chat_mode') as unknown as IPopulatable | null;
            if(chatModeEl) chatModeEl.selection = data.chatSettings.mode;

            const chatBubbleEl = this._window.findChildByName('chat_bubbles_width') as unknown as IPopulatable | null;
            if(chatBubbleEl) chatBubbleEl.selection = data.chatSettings.bubbleWidth;

            const chatScrollEl = this._window.findChildByName('chat_scroll_speed') as unknown as IPopulatable | null;
            if(chatScrollEl) chatScrollEl.selection = data.chatSettings.scrollSpeed;

            // No `fullHearRange` control: this revision dropped the field. `_SafeCls_1709.as`
            // carries mode, bubble width, scroll speed and flood sensitivity and nothing else,
            // and RoomSettingsCtrl.as:851 reads flood sensitivity straight after scroll speed —
            // so the four drawn here are the four that exist.
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::populate()

            const floodEl = this._window.findChildByName('chat_flood_sensitivity') as unknown as IPopulatable | null;
            if(floodEl) floodEl.selection = data.chatSettings.floodSensitivity;
        }

        if(wallDropEl) wallDropEl.selection = this._getThicknessSelectionIndex(data.wallThickness);
        if(floorDropEl) floorDropEl.selection = this._getThicknessSelectionIndex(data.floorThickness);

        this._populateRoomModerationSettings(data);
        this._clearErrors();
        this._populating = false;
    }

    private _populateRoomModerationSettings(data: RoomSettingsData): void
    {
        if(!this._window) return;

        const hasGroup = this._groupId > 0;

        this._roomModerationMuteSettings = hasGroup ? [0, 1, 4, 5] : [0, 1];
        this._roomModerationBanSettings = hasGroup ? [0, 1, 4, 5] : [0, 1];
        this._roomModerationKickSettings = hasGroup ? [0, 1, 2, 4, 5] : [0, 1, 2];

        const muteDropEl = this._window.findChildByName('moderation_mute_dropdown') as unknown as IPopulatable | null;

        if(muteDropEl && data.roomModerationSettings)
        {
            muteDropEl.populate(this._localizeItems(this._roomModerationMuteSettings));
            muteDropEl.selection = this._normalizeSelection(this._roomModerationMuteSettings, data.roomModerationSettings.whoCanMute);
            const el = this._window.findChildByName('moderation_mute_dropdown');
            if(el)
            {
                el.addEventListener(WindowEvent.WE_SELECTED, this._onUnfocus);
                el.addEventListener(WindowEvent.WE_UNSELECTED, this._onUnfocus);
            }
        }

        const banDropEl = this._window.findChildByName('moderation_ban_dropdown') as unknown as IPopulatable | null;

        if(banDropEl && data.roomModerationSettings)
        {
            banDropEl.populate(this._localizeItems(this._roomModerationBanSettings));
            banDropEl.selection = this._normalizeSelection(this._roomModerationBanSettings, data.roomModerationSettings.whoCanBan);
            const el = this._window.findChildByName('moderation_ban_dropdown');
            if(el)
            {
                el.addEventListener(WindowEvent.WE_SELECTED, this._onUnfocus);
                el.addEventListener(WindowEvent.WE_UNSELECTED, this._onUnfocus);
            }
        }

        const kickDropEl = this._window.findChildByName('moderation_kick_dropdown') as unknown as IPopulatable | null;

        if(kickDropEl && data.roomModerationSettings)
        {
            kickDropEl.populate(this._localizeItems(this._roomModerationKickSettings));
            kickDropEl.selection = this._normalizeSelection(this._roomModerationKickSettings, data.roomModerationSettings.whoCanKick);
            const el = this._window.findChildByName('moderation_kick_dropdown');
            if(el)
            {
                el.addEventListener(WindowEvent.WE_SELECTED, this._onUnfocus);
                el.addEventListener(WindowEvent.WE_UNSELECTED, this._onUnfocus);
            }
        }
    }

    private _normalizeSelection(options: number[], value: number): number
    {
        for(let i = 0; i < options.length; i++)
        {
            if(options[i] === value) return i;
        }

        return 0;
    }

    private _localizeItems(options: number[]): string[]
    {
        return options.map((opt) =>
        {
            switch(opt)
            {
                case 0: return '${navigator.roomsettings.moderation.none}';
                case 1: return '${navigator.roomsettings.moderation.rights}';
                case 2: return '${navigator.roomsettings.moderation.all}';
                case 4: return '${navigator.roomsettings.moderation.group_admins}';
                case 5: return '${navigator.roomsettings.moderation.group_admins_and_rights}';
                default: return '';
            }
        });
    }

    private _refreshMaxVisitors(data: RoomSettingsData): void
    {
        if(!this._window) return;

        const max = this._vipFeaturesAllowed()
            ? RoomSettingsCtrl.HC_MAXIMUM_ROOM_VISITORS
            : RoomSettingsCtrl.MAXIMUM_ROOM_VISITORS;

        const items: string[] = [];
        let selIdx = -1;
        let idx = 0;

        for(let count = 10; count <= max; count += 5)
        {
            items.push('' + count);

            if(count === data.maximumVisitors) selIdx = idx;

            idx++;
        }

        if(data.maximumVisitors > max)
        {
            items.push('' + max);
            selIdx = idx;
        }

        const maxVisitorsEl = this._window.findChildByName('maxvisitors') as unknown as IPopulatable | null;

        if(maxVisitorsEl)
        {
            maxVisitorsEl.populate(items);
            maxVisitorsEl.selection = selIdx > -1 ? selIdx : 0;
        }
    }

    private _setCategorySelection(categoryId: number): void
    {
        if(!this._navigator || !this._window) return;

        const items: string[] = [];
        let selIdx = 0;
        let idx = 0;

        for(const cat of this._navigator.data.allCategories)
        {
            if((cat.visible || categoryId === cat.nodeId) && !cat.automatic)
            {
                items.push(cat.visibleName);

                if(categoryId === cat.nodeId) selIdx = idx;

                idx++;
            }
        }

        const catEl = this._window.findChildByName('categories') as unknown as IPopulatable | null;

        if(catEl)
        {
            catEl.populate(items);
            catEl.selection = selIdx;
        }
    }

    private _setTradeModeSelection(tradeMode: number): void
    {
        if(!this._window) return;

        const tradeEl = this._window.findChildByName('tradesettings') as unknown as IPopulatable | null;

        if(tradeEl)
        {
            tradeEl.populate([
                '${navigator.roomsettings.trade_not_allowed}',
                '${navigator.roomsettings.trade_not_with_Controller}',
                '${navigator.roomsettings.trade_allowed}',
            ]);
            tradeEl.selection = tradeMode;
        }
    }

    private _getFlatCategoryByIndex(currentCategoryId: number, index: number): FlatCategory | null
    {
        if(!this._navigator) return null;

        let idx = 0;

        for(const cat of this._navigator.data.allCategories)
        {
            if((cat.visible || currentCategoryId === cat.nodeId) && !cat.automatic)
            {
                if(index === idx) return cat;

                idx++;
            }
        }

        return null;
    }

    private _changePasswordField(visible: boolean): void
    {
        if(!this._window) return;

        const pwContainer = this._window.findChildByName('password_container');

        if(pwContainer !== null) pwContainer.visible = visible;
    }

    private _refreshGroupMemberDisclaimer(): void
    {
        if(!this._navigator || !this._window) return;

        if(this._currentTab !== RoomSettingsCtrl.TAB_ACCESS_RIGHTS) return;

        if(!this._navigator.data.enteredGuestRoom) return;

        const hasGroup = this._navigator.data.enteredGuestRoom.habboGroupId;
        const disclaimer = this._window.findChildByName('guild_access_disclaimer');

        if(disclaimer) disclaimer.visible = hasGroup > 0;
    }

    private _refreshFlatControllers(): void
    {
        if(!this._navigator || !this._window || !this._originalData) return;

        if(this._currentTab !== RoomSettingsCtrl.TAB_ROOM_RIGHTS) return;

        if(!this._navigator.data.enteredGuestRoom) return;

        let controllers: IRoomSettingsUserData[];

        if(!this._originalData.controllersRequested)
        {
            this._originalData.controllersRequested = true;
            this._navigator.send(new GetFlatControllersMessageComposer(this._originalData.roomId));
            controllers = [];
        }
        else
        {
            controllers = this._originalData.controllerList;
        }

        const filterEl = this._window.findChildByName('filter_users_input');
        const filter = filterEl?.caption?.toLowerCase() ?? '';
        const friendsWithNoRights = this._getFriendsWithNoRights();

        const rightsList = this._window.findChildByName('users_with_rights_item_list') as unknown as IItemListWindow | null;
        const friendsList = this._window.findChildByName('friends_item_list') as unknown as IItemListWindow | null;

        if(rightsList && this._usersWithRightsListCtrl)
        {
            this._usersWithRightsListCtrl.refresh(rightsList, controllers, filter, 0);
        }

        if(friendsList && this._friendsListCtrl)
        {
            this._friendsListCtrl.refresh(friendsList, friendsWithNoRights, filter, 0);
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/roomsettings/RoomSettingsCtrl.as::refreshFlatControllers()
        // Both column headers are `...(%displayed%/%total%)` in the locale; without these four
        // registrations the placeholders were rendered verbatim. `displayed` is the post-filter
        // row count each list controller actually laid out, `total` the unfiltered array length.
        this._navigator.registerParameter('navigator.flatctrls.userswithrights', 'displayed', String(this._usersWithRightsListCtrl?.userCount ?? 0));
        this._navigator.registerParameter('navigator.flatctrls.friends', 'displayed', String(this._friendsListCtrl?.userCount ?? 0));
        this._navigator.registerParameter('navigator.flatctrls.userswithrights', 'total', String(controllers.length));
        this._navigator.registerParameter('navigator.flatctrls.friends', 'total', String(friendsWithNoRights.length));
    }

    private _refreshBannedUsers(): void
    {
        if(!this._navigator || !this._window || !this._originalData) return;

        if(this._currentTab !== RoomSettingsCtrl.TAB_MODERATION) return;

        let banned: IRoomSettingsUserData[];

        if(!this._originalData.bannedUsersRequested)
        {
            this._originalData.bannedUsersRequested = true;
            this._navigator.send(new GetBannedUsersFromRoomMessageComposer(this._originalData.roomId));
            banned = [];
        }
        else
        {
            banned = this._originalData.bannedUsersList;
        }

        const bannedList = this._window.findChildByName('moderation_banned_users') as unknown as IItemListWindow | null;

        if(bannedList && this._bannedUsersListCtrl)
        {
            this._bannedUsersListCtrl.refresh(bannedList, banned, '', 0);
        }
    }

    private _getFriendsWithNoRights(): IRoomSettingsUserData[]
    {
        if(!this._navigator || !this._originalData) return [];

        const controllers = this._originalData.controllersById;

        // AS3 reads `_navigator.data.friendList.list` — the manager NavigatorData already holds
        // here — and guards on `controllersById.length` first. That collection is a `Dictionary`,
        // which has no `length`, so the guard never fires in Flash; reproducing it literally
        // against a `Map` would empty the friends tab for every room that has no rights holders
        // yet, which is the common case.
        return this._navigator.data.friendList.list.filter((friend) => !controllers.has(friend.userId));
    }

    private _save(): void
    {
        if(!this._navigator || !this._originalData || !this._window) return;

        if((this._window as unknown as { disposed?: boolean }).disposed) return;

        const builder = new RoomSettingsBuilder();
        builder.roomId = this._originalData.roomId;

        builder.name = this._nameInput?.getText() ?? '';
        builder.description = this._descInput?.getText() ?? '';

        const doormodeSel = this._window.findChildByName('doormode') as unknown as ISelectorWindow | null;
        const selected = doormodeSel?.getSelected();

        if(selected === null || selected === undefined)
        {
            builder.doorMode = this._originalData.doorMode;
        }
        else
        {
            switch(selected.name)
            {
                case 'doormode_doorbell': builder.doorMode = 1; break;
                case 'doormode_password': builder.doorMode = 2; break;
                case 'doormode_invisible': builder.doorMode = 3; break;
                default: builder.doorMode = 0; break;
            }
        }

        if(builder.doorMode === 2)
        {
            const pw = this._passwordInput?.getText() ?? '';
            const pwConfirm = this._passwordConfirmInput?.getText() ?? '';

            if(pw !== pwConfirm)
            {
                this._passwordInput?.clearErrors();
                this._switchToTab(RoomSettingsCtrl.TAB_ACCESS_RIGHTS);
                this._passwordConfirmInput?.displayError('${navigator.roomsettings.invalidconfirm}');
                return;
            }

            if(pw !== '') builder.password = pw;
        }

        const catEl = this._window.findChildByName('categories') as unknown as IPopulatable | null;

        if(catEl)
        {
            const cat = this._getFlatCategoryByIndex(this._originalData.categoryId, catEl.selection);
            builder.categoryId = cat?.nodeId ?? this._originalData.categoryId;
        }

        const tradeEl = this._window.findChildByName('tradesettings') as unknown as IPopulatable | null;
        if(tradeEl) builder.tradeMode = tradeEl.selection;

        const maxVisEl = this._window.findChildByName('maxvisitors') as unknown as IPopulatable | null;

        if(maxVisEl)
        {
            const enumerated = maxVisEl.enumerateSelection?.();
            builder.maximumVisitors = enumerated
                ? Number(enumerated[maxVisEl.selection]) || 25
                : (maxVisEl.selection + 2) * 5 + 10;
        }

        const allowPetsCb = this._window.findChildByName('allow_pets_checkbox') as unknown as ICheckable | null;
        if(allowPetsCb) builder.allowPets = allowPetsCb.isSelected;

        const allowFoodCb = this._window.findChildByName('allow_foodconsume_checkbox') as unknown as ICheckable | null;
        if(allowFoodCb) builder.allowFoodConsume = allowFoodCb.isSelected;

        const allowWalkCb = this._window.findChildByName('allow_walk_through_checkbox') as unknown as ICheckable | null;
        if(allowWalkCb) builder.allowWalkThrough = allowWalkCb.isSelected;

        const dynCatsCb = this._window.findChildByName('allow_dyncats_checkbox') as unknown as ICheckable | null;
        if(dynCatsCb) builder.allowNavigatorDynCats = dynCatsCb.isSelected;

        const hideWallsCb = this._window.findChildByName('hide_walls_checkbox') as unknown as ICheckable | null;
        if(hideWallsCb) builder.hideWalls = hideWallsCb.isSelected;

        const wallDropEl = this._window.findChildByName('wall_thickness') as unknown as IPopulatable | null;
        if(wallDropEl) builder.wallThickness = wallDropEl.selection - 2;

        const floorDropEl = this._window.findChildByName('floor_thickness') as unknown as IPopulatable | null;
        if(floorDropEl) builder.floorThickness = floorDropEl.selection - 2;

        builder.tags = [];

        const tag1Text = this._tag1Input?.getText() ?? '';
        const tag2Text = this._tag2Input?.getText() ?? '';

        if(tag1Text !== '')
        {
            builder.tags.push(tag1Text.startsWith('#') ? tag1Text.substring(1) : tag1Text);
        }

        if(tag2Text !== '')
        {
            builder.tags.push(tag2Text.startsWith('#') ? tag2Text.substring(1) : tag2Text);
        }

        this._setModeratorSettings(builder);

        const chatModeEl = this._window.findChildByName('chat_mode') as unknown as IPopulatable | null;
        if(chatModeEl) builder.chatMode = chatModeEl.selection;

        const chatBubbleEl = this._window.findChildByName('chat_bubbles_width') as unknown as IPopulatable | null;
        if(chatBubbleEl) builder.chatBubbleSize = chatBubbleEl.selection;

        const chatScrollEl = this._window.findChildByName('chat_scroll_speed') as unknown as IPopulatable | null;
        if(chatScrollEl) builder.chatScrollUpFrequency = chatScrollEl.selection;

        const hearRangeText = this._chatFullHearRangeInput?.getText() ?? '';
        const parsedHearRange = parseInt(hearRangeText, 10);
        builder.chatFullHearRange = Number.isNaN(parsedHearRange) ? 0 : parsedHearRange;

        const floodEl = this._window.findChildByName('chat_flood_sensitivity') as unknown as IPopulatable | null;
        if(floodEl) builder.chatFloodSensitivity = floodEl.selection;

        this._clearErrors();
        this._savedFlatId = builder.roomId;
        this._navigator.send(new SaveRoomSettingsMessageComposer(builder));
    }

    private _setModeratorSettings(builder: RoomSettingsBuilder): void
    {
        if(!this._window) return;

        const muteEl = this._window.findChildByName('moderation_mute_dropdown') as unknown as IPopulatable | null;
        if(muteEl) builder.whoCanMute = this._roomModerationMuteSettings[muteEl.selection] ?? 0;

        const banEl = this._window.findChildByName('moderation_ban_dropdown') as unknown as IPopulatable | null;
        if(banEl) builder.whoCanBan = this._roomModerationBanSettings[banEl.selection] ?? 0;

        const kickEl = this._window.findChildByName('moderation_kick_dropdown') as unknown as IPopulatable | null;
        if(kickEl) builder.whoCanKick = this._roomModerationKickSettings[kickEl.selection] ?? 0;
    }

    private _onTabClick = (event: WindowEvent): void =>
    {
        const target = event.target as IWindowContainer;
        this._currentTab = target.id;
        this.refresh();
    };

    private _onClose = (_event: WindowEvent): void =>
    {
        this.close();
    };

    private _onUnfocus = (_event: WindowEvent): void =>
    {
        if(!this._populating)
        {
            this._save();
        }
    };

    private _onDoorModePasswordSelect = (_event: WindowEvent): void =>
    {
        this._changePasswordField(true);
    };

    private _onDoorModePasswordUnselect = (_event: WindowEvent): void =>
    {
        this._changePasswordField(false);
    };

    private _onUserFilterChange = (_event: WindowEvent): void =>
    {
        this._refreshFlatControllers();
    };

    private _onRemoveAllFlatCtrlsClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        if(this._confirmDialog !== null)
        {
            this._confirmDialog.dispose();
        }

        this._confirmDialog = new ConfirmDialogView(
            this._navigator,
            this._onRemoveAllFlatCtrlsConfirm,
            '${navigator.flatctrls.removeconfirm.title}',
            '${navigator.flatctrls.removeconfirm.info}'
        );
    };

    private _onRemoveAllFlatCtrlsConfirm = (): void =>
    {
        if(!this._navigator) return;

        this._navigator.send(new RemoveAllRightsMessageComposer(this._flatId));
    };

    private _onDeleteButtonClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator || !this._originalData) return;

        if(this._flatId === this._navigator.data.homeRoomId)
        {
            const wm = this._navigator.windowManager as unknown as { alert?(title: string, body: string, type: number, cb: unknown): void } | null;
            wm?.alert?.(
                '${navigator.delete.homeroom.title}',
                '${navigator.delete.homeroom.body}',
                0,
                (win: unknown) => (win as { dispose?(): void }).dispose?.()
            );
            return;
        }

        if(this._groupId > 0)
        {
            const wm = this._navigator.windowManager as unknown as { alert?(title: string, body: string, type: number, cb: unknown): void } | null;
            wm?.alert?.(
                '${group.deletebase.title}',
                '${group.deletebase.body}',
                0,
                (win: unknown) => (win as { dispose?(): void }).dispose?.()
            );
            return;
        }

        if(this._confirmDialog !== null)
        {
            this._confirmDialog.dispose();
        }

        this._navigator.registerParameter('navigator.roomsettings.deleteroom.confirm.message', 'room_name', this._originalData.name);

        this._confirmDialog = new ConfirmDialogView(
            this._navigator,
            this._onConfirmRoomDelete,
            '${navigator.roomsettings}',
            '${navigator.roomsettings.deleteroom.confirm.message}'
        );
    };

    private _onConfirmRoomDelete = (): void =>
    {
        if(!this._navigator || !this._originalData) return;

        this._navigator.send(new DeleteRoomMessageComposer(this._originalData.roomId));

        const searchResults = this._navigator.data.guestRoomSearchResults;
        this.close();

        if(searchResults !== null)
        {
            const selectedTab = this._navigator.tabs.getSelected();

            if(selectedTab !== null)
            {
                this._navigator.mainViewCtrl?.startSearch(
                    selectedTab.id,
                    searchResults.searchType,
                    searchResults.searchParam
                );
            }
        }
    };

    private _onUnbanClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator || !this._window || !this._bannedUsersListCtrl) return;

        if(this._bannedUsersListCtrl.selectedRow < 0) return;

        const bannedList = this._window.findChildByName('moderation_banned_users') as unknown as IItemListWindow | null;

        if(bannedList === null) return;

        const row = bannedList.getListItemAt(this._bannedUsersListCtrl.selectedRow) as IWindowContainer | null;

        if(row === null) return;

        const infoRegion = row.findChildByName('user_info_region') as IWindowContainer | null;

        if(infoRegion === null) return;

        this._navigator.send(new UnbanUserFromRoomMessageComposer(infoRegion.id, this._flatId));
    };

    private _onBuildersClubFaqClick = (_event: WindowEvent): void =>
    {
        if(!this._navigator) return;

        const wm = this._navigator.windowManager as unknown as { context?: { createLinkEvent?(link: string): void } } | null;
        wm?.context?.createLinkEvent?.('habbopages/builders-club/faq');
    };
}
