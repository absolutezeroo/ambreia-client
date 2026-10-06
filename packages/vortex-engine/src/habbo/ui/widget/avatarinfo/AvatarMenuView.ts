import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IItemGridWindow} from '@core/window/components/IItemGridWindow';
import type {IInteractiveWindow} from '@core/window/components/IInteractiveWindow';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {RoomObjectCategoryEnum} from '@habbo/room/object/RoomObjectCategoryEnum';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';

import type {RoomWidgetMessage} from '../messages/RoomWidgetMessage';
import {RoomWidgetOpenProfileMessage} from '../messages/RoomWidgetOpenProfileMessage';
import {RoomWidgetUserActionMessage} from '../messages/RoomWidgetUserActionMessage';
import {AvatarContextInfoButtonView} from './AvatarContextInfoButtonView';
import type {AvatarInfoData} from './AvatarInfoData';
import type {AvatarInfoWidget} from './AvatarInfoWidget';

/**
 * The bubble menu for *another* avatar: profile, friend request, respect, whisper, ignore, trade,
 * relationship, report — plus the moderation and ambassador drawers behind their own buttons.
 *
 * It shares the `avatar_menu_widget` layout with the bot and pet menus, and works the same way:
 * every row the layout declares starts hidden and `updateButtons()` switches on the ones the
 * current mode wants. **The mode is the whole design** — "moderate", "ban_with_duration", "mute",
 * "relationship" and "ambassador" do not send anything, they change `_mode` and redraw, and every
 * such drawer carries an "actions" row that goes back to mode 1.
 *
 * Two behaviours in `buttonEventProc()` are worth not tidying:
 *
 * - **Some rows update the data optimistically and never wait for the server.** Ignore/unignore
 *   swap each other's visibility, give/remove rights swap and write `myRoomControllerLevel`, and
 *   respect decrements `respectLeft` before the message goes out. The bubble is gone by the time
 *   any answer arrives, so nothing would ever apply it.
 * - **Respect is the one row that does not close the bubble** — but only while respects remain, so
 *   you can spend all three in a row without reopening it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/avatarinfo/AvatarMenuView.as
 */
export class AvatarMenuView extends AvatarContextInfoButtonView
{
    // AS3: AvatarMenuView.as::MODE_ACTIONS
    protected static readonly MODE_ACTIONS: number = 1;

    // AS3: AvatarMenuView.as::MODE_MODERATE
    protected static readonly MODE_MODERATE: number = 2;

    // AS3: AvatarMenuView.as::MODE_BAN
    protected static readonly MODE_BAN: number = 4;

    // AS3: AvatarMenuView.as::MODE_MUTE
    protected static readonly MODE_MUTE: number = 5;

    // AS3: AvatarMenuView.as::MODE_RELATIONSHIP
    protected static readonly MODE_RELATIONSHIP: number = 6;

    // AS3: AvatarMenuView.as::MODE_AMBASSADOR
    protected static readonly MODE_AMBASSADOR: number = 7;

    /**
     * AS3 keeps the last mode in a static and never reads it back — `setup()` resets `_mode` to
     * MODE_ACTIONS on every open. Transcribed because it is written, not because it does anything.
     */
    // AS3: AvatarMenuView.as::lastViewMode
    protected static _lastViewMode: number = AvatarMenuView.MODE_ACTIONS;

    /** Derived name — `_SafeStr_4556`: the avatar this menu is about. */
    // AS3: AvatarMenuView.as::_SafeStr_4556
    protected _data: AvatarInfoData | null = null;

    // AS3: AvatarMenuView.as::_mode
    protected _mode: number = AvatarMenuView.MODE_ACTIONS;

    /**
     * Derived name — `_SafeStr_5223`. Set when a button only switched drawer, cleared at the end of
     * `updateButtons()`. AS3 never reads it, so it records the redraw rather than driving it.
     */
    // AS3: AvatarMenuView.as::_SafeStr_5223
    protected _modeChanged: boolean = false;

    // AS3: AvatarMenuView.as::AvatarMenuView()
    constructor(widget: AvatarInfoWidget)
    {
        super(widget);

        this._autoHideEnabled = false;
    }

    // AS3: AvatarMenuView.as::setup()
    public static setup(
        view: AvatarMenuView,
        userId: number,
        userName: string,
        roomIndex: number,
        userType: number,
        data: AvatarInfoData
    ): void
    {
        if(!view) return;

        view._data = data;
        view._mode = AvatarMenuView.MODE_ACTIONS;

        AvatarContextInfoButtonView.setupButtonView(view, userId, userName, roomIndex, userType, false);
    }

    // AS3: AvatarMenuView.as::get widget()
    private get widget(): AvatarInfoWidget
    {
        return this._widget as AvatarInfoWidget;
    }

    // AS3: AvatarMenuView.as::get citizenshipTalentTrackEnabled()
    private get citizenshipTalentTrackEnabled(): boolean
    {
        return this.widget.configuration?.getBoolean('talent.track.citizenship.enabled') ?? false;
    }

    // AS3: AvatarMenuView.as::updateWindow()
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
            this._window = this._widget.windowManager.buildWidgetLayout('avatar_menu_widget', 0) as IWindowContainer | null;

            if(!this._window) return;

            this._window.procedure = this.windowProc;

            const minimize = this._window.findChildByName('minimize');

            if(minimize) minimize.procedure = this.onMinimize;
        }

        this._buttons = this._window.findChildByName('buttons') as IItemListWindow | null;

        if(this._buttons) this._buttons.procedure = this.buttonEventProc;

        const profileLink = this._window.findChildByName('profile_link');

        if(profileLink) profileLink.procedure = this.buttonEventProc;

        const nameWindow = this._window.findChildByName('name') as ITextWindow | null;

        // A blocked user is not named — the bubble says so in italics instead.
        if(nameWindow)
        {
            if(this._data?.isBlocked ?? false)
            {
                nameWindow.italic = true;
                nameWindow.caption = '${infostand.blocked_user}';
            }
            else
            {
                nameWindow.italic = false;
                nameWindow.caption = this._userName;
            }
        }

        this._window.visible = false;
        this.activeView = this._window;

        this.updateButtons();
        this.updateRelationshipStatus();

        // The relationship cells carry their own buttons, and each needs the same procedure as the
        // rows — they are in a grid, so the list's procedure does not reach them.
        const grid = this._window.findChildByName('relationship_grid') as unknown as IItemGridWindow | null;

        if(grid !== null)
        {
            for(let i = 0; i < grid.numGridItems; i++)
            {
                const cell = grid.getGridItemAt(i) as unknown as IWindowContainer | null;
                const button = cell?.findChildByName('button') ?? null;

                if(button !== null) button.procedure = this.buttonEventProc;
            }
        }
    }

    // AS3: AvatarMenuView.as::updateButtons()
    public updateButtons(): void
    {
        const data = this._data;

        if(!this._window || data == null || !this._buttons) return;

        const buttons = this._buttons;

        buttons.procedure = this.buttonEventProc;
        buttons.autoArrangeItems = false;

        const count = buttons.numListItems;

        for(let i = 0; i < count; i++)
        {
            const item = buttons.getListItemAt(i);

            if(item) item.visible = false;
        }

        const blocked = data.isBlocked;

        if(this._mode === AvatarMenuView.MODE_ACTIONS)
        {
            // Note the sense: AS3 passes `blocked` itself, so the profile row is shown *only* for a
            // blocked user. It is the one thing left to do about one.
            this.showButton('open_profile', blocked);
            this.showButton('moderate', this.moderateMenuHasContent());
            this.showButton('friend', data.canBeAskedAsFriend && !blocked);
            this.showButton('ignore', !data.isIgnored && !blocked);
            this.showButton('unignore', data.isIgnored && !blocked);
            this.showButton('report', (this.widget.configuration?.getBoolean('infostand.report.show') ?? false) && !blocked);

            const respectLeft = data.respectLeft;

            this.widget.localizations?.registerParameter('infostand.button.respect', 'count', respectLeft.toString());

            this.showButton('respect', respectLeft > 0 && !blocked);
            this.showButton('replenish_respect', respectLeft <= 0 && data.respectReplenishesLeft > 0 && !blocked);

            const container = this.widget.handler?.container ?? null;
            const safetyLocked = container?.sessionDataManager?.isAccountSafetyLocked() ?? false;

            this.showButton('trade', this.citizenshipTalentTrackEnabled || (!safetyLocked && data.canTrade && !blocked));
            this.applyTradeTooltip(data.canTradeReason);

            this.showButton('whisper', !blocked);

            if((this.widget.configuration?.getBoolean('handitem.give.enabled') ?? false)
                && !(container?.roomEngine?.activeRoomHasHanditemControlBlocked ?? false))
            {
                // "Pass" is offered only while *you* are carrying something, so the check is against
                // your own avatar object, not the one this menu is about.
                const ownRoomId = container?.roomSession?.ownUserRoomId ?? -1;
                const own = container?.roomEngine?.getRoomObject(
                    this.widget.handler?.roomSession?.roomId ?? -1, ownRoomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
                ) ?? null;
                const carried = own?.getModel().getNumber(RoomObjectVariableEnum.AVATAR_CARRY_OBJECT) ?? 0;

                if(carried > 0 && carried < 999999) this.showButton('pass_handitem');
            }

            this.showButton('relationship',
                (this.widget.configuration?.getBoolean('relationship.status.enabled') ?? false) && data.isFriend && !blocked);
            this.showButton('ambassador', this.ambassadorMenuHasContent());
            // AS3 asks the wired component (`showInspectButton()`); the RPG fork removed wired.
            this.showButton('wired_inspect', false);
        }

        if(this._mode === AvatarMenuView.MODE_MODERATE)
        {
            this.showButton('kick', data.canBeKicked);
            this.showButton('ban_with_duration', data.canBeBanned);
            this.showButton('mute', data.canBeMuted);
            this.showButton('give_rights', this.isShowGiveRights());
            this.showButton('remove_rights', this.isShowRemoveRights());
            this.showButton('actions');
        }

        if(this._mode === AvatarMenuView.MODE_BAN)
        {
            this.showButton('ban_hour');
            this.showButton('ban_day');
            this.showButton('perm_ban');
            this.showButton('actions');
        }

        if(this._mode === AvatarMenuView.MODE_MUTE)
        {
            this.showButton('mute_2min');
            this.showButton('mute_5min');
            this.showButton('mute_10min');
            this.showButton('actions');
        }

        if(this._mode === AvatarMenuView.MODE_RELATIONSHIP)
        {
            this.showButtonGrid('relationship_grid');
            this.showButton('no_relationship');
            this.showButton('actions');
        }

        if(this._mode === AvatarMenuView.MODE_AMBASSADOR)
        {
            this.showButton('ambassador_kick');
            this.showButton('ambassador_alert');
            this.showButton('ambassador_mute_15min');
            this.showButton('ambassador_mute_60min');
            this.showButton('ambassador_mute_18hour');
            this.showButton('ambassador_mute_36hour');
            this.showButton('ambassador_mute_72hour');
            this.showButton('ambassador_unmute');
            this.showButton('actions');
        }

        buttons.autoArrangeItems = true;
        (buttons as unknown as IWindow).visible = true;

        AvatarMenuView._lastViewMode = this._mode;
        this._modeChanged = false;
    }

    /**
     * The trade row always exists; only its tooltip says why it is refused. AS3 subtracts 2 from
     * the reason before switching, so 2 and 3 are the two named cases and everything else is blank.
     */
    // AS3: AvatarMenuView.as::updateButtons() — the canTradeReason switch
    private applyTradeTooltip(reason: number): void
    {
        let caption: string;

        switch(reason - 2)
        {
            case 0:
                caption = '${infostand.button.trade.tooltip.shutdown}';
                break;
            case 1:
                caption = '${infostand.button.trade.tooltip.tradingroom}';
                break;
            default:
                caption = '';
        }

        const row = this._buttons?.getListItemByName('trade') as IWindowContainer | null;
        const button = row?.getChildByName('button') ?? null;

        if(button !== null) (button as unknown as IInteractiveWindow).toolTipCaption = caption;
    }

    // AS3: AvatarMenuView.as::ambassadorMenuHasContent()
    private ambassadorMenuHasContent(): boolean
    {
        return this._data?.isAmbassador ?? false;
    }

    // AS3: AvatarMenuView.as::moderateMenuHasContent()
    private moderateMenuHasContent(): boolean
    {
        const data = this._data;

        if(data == null) return false;

        return data.canBeKicked || data.canBeBanned || data.canBeMuted
            || this.isShowGiveRights() || this.isShowRemoveRights();
    }

    // AS3: AvatarMenuView.as::isShowGiveRights()
    private isShowGiveRights(): boolean
    {
        return (this._data?.amIOwner ?? false) && (this._data?.targetRoomControllerLevel ?? 0) < 1;
    }

    // AS3: AvatarMenuView.as::isShowRemoveRights()
    private isShowRemoveRights(): boolean
    {
        return (this._data?.amIOwner ?? false) && (this._data?.targetRoomControllerLevel ?? 0) === 1;
    }

    // AS3: AvatarMenuView.as::buttonEventProc()
    protected override buttonEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(this.disposed || !this._window || this._window.disposed) return;

        if(event.type !== 'WME_CLICK')
        {
            if(event.type === 'WME_OVER' && window.name === 'button') this.trackButtonHover(window.parent?.name ?? '');
            else this.applyButtonHover(event, window);

            return;
        }

        let close = false;
        let message: RoomWidgetMessage | null = null;
        let action: string | null = null;

        if(window.name === 'button')
        {
            close = true;
            action = this.resolveButtonAction(window);

            // A drawer switch is not an action: it redraws and leaves the bubble open.
            if(action === null && !this.applyModeChange(window.parent?.name ?? '')) close = true;
            if(action === null && this._modeChanged) close = false;
        }

        if(window.name === 'profile_link')
        {
            close = true;
            message = new RoomWidgetOpenProfileMessage(
                RoomWidgetOpenProfileMessage.OPEN_USER_PROFILE, this._userId, 'avatarContextMenu'
            );
        }

        if(action !== null)
        {
            message = new RoomWidgetUserActionMessage(action, this._userId);

            this.widget.handler?.container?.habboTracking?.trackEventLog('InfoStand', 'click', action);

            // Respect is the one row that stays open while there are respects left.
            if(action === RoomWidgetUserActionMessage.RESPECT_USER && (this._data?.respectLeft ?? 0) > 0) close = false;
        }

        if(message !== null) this._widget.messageListener?.processWidgetMessage(message);

        this.updateButtons();

        if(close && !this.disposed) this._widget.removeView(this, false);
    };

    /**
     * The rows that send something. Returns null for the drawer switches and for the relationship
     * cells, which call `setRelationship()` on the spot rather than producing a message.
     */
    // AS3: AvatarMenuView.as::buttonEventProc() — the message-producing cases
    private resolveButtonAction(window: IWindow): string | null
    {
        const name = window.parent?.name ?? '';

        switch(name)
        {
            case 'whisper':
                return RoomWidgetUserActionMessage.WHISPER_USER;
            // The row disables itself and the data is updated on the spot: the bubble closes before
            // any answer could arrive, so nothing would apply it later.
            case 'friend':
                window.disable();
                if(this._data != null) this._data.canBeAskedAsFriend = false;

                return RoomWidgetUserActionMessage.SEND_FRIEND_REQUEST;
            case 'respect':
                if(this._data != null)
                {
                    this._data.respectLeft -= 1;

                    this.widget.localizations?.registerParameter(
                        'infostand.button.respect', 'count', this._data.respectLeft.toString()
                    );

                    this.showButton('respect', this._data.respectLeft > 0);
                }

                return RoomWidgetUserActionMessage.RESPECT_USER;
            case 'replenish_respect':
                return RoomWidgetUserActionMessage.REPLENISH_RESPECT;
            case 'wired_inspect':
                return RoomWidgetUserActionMessage.WIRED_INSPECT;
            case 'open_profile':
                return RoomWidgetUserActionMessage.OPEN_PROFILE;
            case 'ignore':
                this.swapRows(window, 'unignore');
                if(this._data != null) this._data.isIgnored = true;

                return RoomWidgetUserActionMessage.IGNORE_USER;
            case 'unignore':
                this.swapRows(window, 'ignore');
                if(this._data != null) this._data.isIgnored = false;

                return RoomWidgetUserActionMessage.UNIGNORE_USER;
            case 'kick':
                return RoomWidgetUserActionMessage.KICK_USER;
            case 'ban_hour':
                return RoomWidgetUserActionMessage.BAN_USER_HOUR;
            case 'ban_day':
                return RoomWidgetUserActionMessage.BAN_USER_DAY;
            case 'perm_ban':
                return RoomWidgetUserActionMessage.BAN_USER_PERM;
            case 'mute_2min':
                return RoomWidgetUserActionMessage.MUTE_USER_2MIN;
            case 'mute_5min':
                return RoomWidgetUserActionMessage.MUTE_USER_5MIN;
            case 'mute_10min':
                return RoomWidgetUserActionMessage.MUTE_USER_10MIN;
            // Rights swap the same way ignore does, and write the level they just asked for.
            case 'give_rights':
                this.swapRows(window, 'remove_rights');
                if(this._data != null) this._data.myRoomControllerLevel = 1;

                return RoomWidgetUserActionMessage.GIVE_RIGHTS;
            case 'remove_rights':
                this.swapRows(window, 'give_rights');
                if(this._data != null) this._data.myRoomControllerLevel = 0;

                return RoomWidgetUserActionMessage.TAKE_RIGHTS;
            case 'trade':
                return RoomWidgetUserActionMessage.START_TRADING;
            // The bubble's own "report" is the CFH-other topic, not the plain report.
            case 'report':
                return RoomWidgetUserActionMessage.REPORT_CFH_OTHER;
            case 'pass_handitem':
                return RoomWidgetUserActionMessage.PASS_CARRY_ITEM;
            case 'ambassador_alert':
                return RoomWidgetUserActionMessage.AMBASSADOR_ALERT_USER;
            case 'ambassador_kick':
                return RoomWidgetUserActionMessage.AMBASSADOR_KICK_USER;
            case 'ambassador_mute_2min':
                return RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_2MIN;
            case 'ambassador_mute_10min':
                return RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_10MIN;
            case 'ambassador_mute_15min':
                return RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_15MIN;
            case 'ambassador_mute_60min':
                return RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_60MIN;
            case 'ambassador_mute_18hour':
                return RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_18HOUR;
            case 'ambassador_mute_36hour':
                return RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_36HOUR;
            case 'ambassador_mute_72hour':
                return RoomWidgetUserActionMessage.AMBASSADOR_MUTE_USER_72HOUR;
            case 'ambassador_unmute':
                return RoomWidgetUserActionMessage.AMBASSADOR_UNMUTE_USER;
            default:
                return null;
        }
    }

    /**
     * The rows that only change drawer, plus the four relationship cells. Returns whether the row
     * was one of them, and sets `_modeChanged` so the caller keeps the bubble open.
     */
    // AS3: AvatarMenuView.as::buttonEventProc() — the mode-switching and relationship cases
    private applyModeChange(name: string): boolean
    {
        switch(name)
        {
            case 'ban_with_duration':
                this._mode = AvatarMenuView.MODE_BAN;
                break;
            case 'mute':
                this._mode = AvatarMenuView.MODE_MUTE;
                break;
            case 'moderate':
                this._mode = AvatarMenuView.MODE_MODERATE;
                break;
            case 'actions':
                this._mode = AvatarMenuView.MODE_ACTIONS;
                break;
            case 'relationship':
                this._mode = AvatarMenuView.MODE_RELATIONSHIP;
                break;
            case 'ambassador':
                this._mode = AvatarMenuView.MODE_AMBASSADOR;
                break;
            // The four relationship cells close the bubble like any other action, and send nothing
            // through the widget — the friend list has its own composer for this.
            case 'relationship_heart':
                this.setRelationship(1);

                return false;
            case 'relationship_smile':
                this.setRelationship(2);

                return false;
            case 'relationship_bobba':
                this.setRelationship(3);

                return false;
            case 'no_relationship':
                this.setRelationship(0);

                return false;
            default:
                return false;
        }

        this._modeChanged = true;

        return true;
    }

    /** TS-only: AS3 repeats "hide me, show my opposite" inline in four cases. */
    // TS-only: no AS3 counterpart; the shared body of ignore/unignore and give/remove rights.
    private swapRows(window: IWindow, otherName: string): void
    {
        const row = window.parent;

        if(row !== null) row.visible = false;

        const other = this._window?.findChildByName(otherName) ?? null;

        if(other !== null) other.visible = true;
    }

    /**
     * AS3 logs these once per session each, from a plain WME_OVER switch over the same rows the
     * click switch handles. Grouped here because four of them share one unit.
     */
    // AS3: AvatarMenuView.as::buttonEventProc() — the WME_OVER arm
    private trackButtonHover(name: string): void
    {
        const tracking = this.widget.handler?.container?.habboTracking ?? null;

        if(tracking === null) return;

        switch(name)
        {
            case 'kick':
                tracking.trackEventLogOncePerSession('InterfaceExplorer', 'hover', 'avatar.kick.hover');
                break;
            case 'perm_ban':
            case 'ban_hour':
            case 'ban_day':
            case 'ban_with_duration':
                tracking.trackEventLogOncePerSession('InterfaceExplorer', 'hover', 'avatar.ban.hover');
                break;
            case 'mute':
            case 'mute_2min':
            case 'mute_5min':
            case 'mute_10min':
                tracking.trackEventLogOncePerSession('InterfaceExplorer', 'hover', 'avatar.mute.hover');
                break;
            case 'unignore':
            case 'ignore':
                tracking.trackEventLogOncePerSession('InterfaceExplorer', 'hover', 'avatar.ignore.hover');
                break;
        }
    }

    // AS3: AvatarMenuView.as::setRelationship()
    private setRelationship(status: number): void
    {
        this.widget.friendList?.setRelationshipStatus(this._userId, status);
    }

    /**
     * TS deviation, the same one every sibling view carries: AS3 adds WME_OVER/WME_OUT listeners to
     * the window, and a window holds a single procedure here — so the hover forwarding and the
     * port's own click-away dismissal share one.
     */
    // AS3: AvatarMenuView.as::AvatarMenuView() — the two window listeners
    private windowProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_CLICK_AWAY')
        {
            this._widget.removeView(this, false);

            return;
        }

        this.onMouseHoverEvent(event, window);
    };

    // AS3: AvatarMenuView.as::dispose()
    public override dispose(): void
    {
        this._data = null;

        super.dispose();
    }
}
