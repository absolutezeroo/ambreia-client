import {ComponentDependency, type IContext} from '@core/runtime';
import type {IAssetLibrary} from '@core/assets';
import {imageElementToBitmap} from '@core/utils/BitmapSlot';
import type {ILinkEventTracker} from '@core/runtime/events/ILinkEventTracker';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';

import type {IAvatarImageListener} from '@habbo/avatar/IAvatarImageListener';
import type {IHabboFriendList} from '@habbo/friendlist/IHabboFriendList';
import type {IHabboToolbar} from '@habbo/toolbar/IHabboToolbar';
import {HabboFaceFocuser} from '@habbo/utils/HabboFaceFocuser';
import {SessionDataPreferencesEvent} from '@habbo/session/events/SessionDataPreferencesEvent';
import {RoomEnterEffect} from '@room/utils/RoomEnterEffect';

import {IID_HabboFriendList} from '@iid/IIDHabboFriendList';
import {IID_HabboFriendBarData} from '@iid/IIDHabboFriendBarData';
import {IID_HabboToolbar} from '@iid/IIDHabboToolbar';

import type {IHabboFriendBarData} from '../data/IHabboFriendBarData';
import {FriendBarUpdateEvent} from '../events/FriendBarUpdateEvent';
import {FriendRequestUpdateEvent} from '../events/FriendRequestUpdateEvent';
import {NewMessageEvent} from '../events/NewMessageEvent';
import {NotificationEvent} from '../events/NotificationEvent';
import {FindFriendsNotificationEvent} from '../events/FindFriendsNotificationEvent';
import {ActiveConversationsCountEvent} from '../events/ActiveConversationsCountEvent';
import {FriendBarResizeEvent} from '../events/FriendBarResizeEvent';
import {AbstractView} from './AbstractView';
import type {IHabboFriendBarView} from './IHabboFriendBarView';
import type {ITab} from './tabs/ITab';
import {Tab} from './tabs/Tab';
import {FriendEntityTab} from './tabs/FriendEntityTab';
import {NewFriendEntityTab} from './tabs/NewFriendEntityTab';
import {FriendRequestTab} from './tabs/FriendRequestTab';
import {NewFriendRequestTab} from './tabs/NewFriendRequestTab';
import {FriendRequestsTab} from './tabs/FriendRequestsTab';
import {AddFriendsTab} from './tabs/AddFriendsTab';
import type {OpenMessengerTab} from './tabs/OpenMessengerTab';
import {Token} from './tabs/tokens/Token';
import type {FriendListIcon} from './utils/FriendListIcon';
import type {MessengerIcon} from './utils/MessengerIcon';
import {TextCropper} from './utils/TextCropper';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';

const log = Logger.getLogger('habbo.friendbar.HabboFriendBarView');

/**
 * HabboFriendBarView
 *
 * The friend bar itself: the strip of slots along the bottom of the screen, the tools
 * cluster at its right (messenger, friend list, find friends), the paging arrows, and
 * the collapse animation.
 *
 * The bar is rebuilt, not updated: `populate()` empties the list, recycles every slot
 * and rebuilds from `IHabboFriendBarData`, keeping only the selected friend's id so the
 * same slot can be reselected afterwards.
 *
 * How many slots fit is derived from the width left over by the toolbar — the bar sizes
 * itself to `desktop.width - toolbar.right` and divides what is left by the slot width.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/view/HabboFriendBarView.as
 */
export class HabboFriendBarView extends AbstractView implements IHabboFriendBarView, IAvatarImageListener, ILinkEventTracker
{
    // AS3: .../view/HabboFriendBarView.as::TAB_WIDTH
    private static readonly TAB_WIDTH: number = 127;

    // AS3: .../view/HabboFriendBarView.as::MAIN_WINDOW_RESOURCE
    private static readonly MAIN_WINDOW_RESOURCE: string = 'new_bar_xml';

    // AS3: .../view/HabboFriendBarView.as::TOGGLE_WINDOW_RESOURCE
    private static readonly TOGGLE_WINDOW_RESOURCE: string = 'toggle_xml';

    // AS3: .../view/HabboFriendBarView.as::BORDER
    private static readonly BORDER: string = 'border';

    // AS3: .../view/HabboFriendBarView.as::LIST
    private static readonly LIST: string = 'list';

    // AS3: .../view/HabboFriendBarView.as::PIECES
    private static readonly PIECES: string = 'pieces';

    // AS3: .../view/HabboFriendBarView.as::HEADER
    private static readonly HEADER: string = 'header';

    // AS3: .../view/HabboFriendBarView.as::CANVAS
    private static readonly CANVAS: string = 'canvas';

    // AS3: .../view/HabboFriendBarView.as::TOOLS
    private static readonly TOOLS: string = 'friendtools';

    /** **Name derived** from its value. */
    // AS3: .../view/HabboFriendBarView.as::BUTTON_COLLAPSE_LEFT
    private static readonly BUTTON_COLLAPSE_LEFT: string = 'collapse_left';

    // AS3: .../view/HabboFriendBarView.as::BUTTON_COLLAPSE_RIGHT
    private static readonly BUTTON_COLLAPSE_RIGHT: string = 'collapse_right';

    /** **Name derived** from its value. */
    // AS3: .../view/HabboFriendBarView.as::BUTTON_LEFT
    private static readonly BUTTON_LEFT: string = 'button_left';

    /** **Name derived** from its value. */
    // AS3: .../view/HabboFriendBarView.as::BUTTON_RIGHT
    private static readonly BUTTON_RIGHT: string = 'button_right';

    // AS3: .../view/HabboFriendBarView.as::BUTTON_LEFT_PAGE
    private static readonly BUTTON_LEFT_PAGE: string = 'button_left_page';

    // AS3: .../view/HabboFriendBarView.as::BUTTON_RIGHT_PAGE
    private static readonly BUTTON_RIGHT_PAGE: string = 'button_right_page';

    /** **Name derived** from its value. */
    // AS3: .../view/HabboFriendBarView.as::BUTTON_LEFT_END
    private static readonly BUTTON_LEFT_END: string = 'button_left_end';

    /** **Name derived** from its value. */
    // AS3: .../view/HabboFriendBarView.as::BUTTON_RIGHT_END
    private static readonly BUTTON_RIGHT_END: string = 'button_right_end';

    /** **Name derived** from its value. */
    // AS3: .../view/HabboFriendBarView.as::BUTTON_CLOSE
    private static readonly BUTTON_CLOSE: string = 'button_close';

    /** **Name derived** from its value. */
    // AS3: .../view/HabboFriendBarView.as::BUTTON_OPEN
    private static readonly BUTTON_OPEN: string = 'button_open';

    // AS3: .../view/HabboFriendBarView.as::LINK_FRIEND_LIST
    private static readonly LINK_FRIEND_LIST: string = 'link_friendlist';

    // AS3: .../view/HabboFriendBarView.as::ICON_FIND_FRIENDS
    private static readonly ICON_FIND_FRIENDS: string = 'icon_find_friends';

    // AS3: .../view/HabboFriendBarView.as::ICON_ALL_FRIENDS
    private static readonly ICON_ALL_FRIENDS: string = 'icon_all_friends';

    /** Width the bar keeps on screen while collapsed. */
    // AS3: .../view/HabboFriendBarView.as::COLLAPSED_MARGIN
    private static readonly COLLAPSED_MARGIN: number = 150;

    // AS3: .../view/HabboFriendBarView.as::NEW_BAR_BOTTOM_OFFSET
    private static readonly NEW_BAR_BOTTOM_OFFSET: number = 1;

    // AS3: .../view/HabboFriendBarView.as::NEW_BAR_RIGHT_MARGIN
    private static readonly NEW_BAR_RIGHT_MARGIN: number = 16;

    // AS3: .../view/HabboFriendBarView.as::COLLAPSE_ANIMATION_DURATION_MS
    private static readonly COLLAPSE_ANIMATION_DURATION_MS: number = 140;

    // AS3: .../view/HabboFriendBarView.as::COLLAPSE_ANIMATION_FPS
    private static readonly COLLAPSE_ANIMATION_FPS: number = 60;

    /** Fewest slots the bar will lay out before it stops padding with find-friends. */
    // AS3: .../view/HabboFriendBarView.as::MIN_TABS
    private static readonly MIN_TABS: number = 3;

    // AS3: .../view/HabboFriendBarView.as::HabboFriendBarView()
    constructor(context: IContext, flags: number = 0, assetLibrary: IAssetLibrary | null = null)
    {
        super(context, flags, assetLibrary);

        this._cropper = new TextCropper();
    }

    // AS3: .../view/HabboFriendBarView.as::_friendBarData
    private _friendBarData: IHabboFriendBarData | null = null;

    // AS3: .../view/HabboFriendBarView.as::_friendList
    private _friendList: IHabboFriendList | null = null;

    // AS3: .../view/HabboFriendBarView.as::_toolbar
    private _toolbar: IHabboToolbar | null = null;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_4564
    private _window: IWindowContainer | null = null;

    /** The unseen-item counter on the friend-list icon. */
    // AS3: .../view/HabboFriendBarView.as::_SafeStr_5057
    private _requestCounter: IWindowContainer | null = null;

    /** The collapsed-state toggle window. **Name derived**. */
    // AS3: .../view/HabboFriendBarView.as::_toggleWindow
    private _toggleWindow: IWindowContainer | null = null;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_4623
    private _tabs: ITab[] = [];

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_5098
    private _selectedTab: ITab | null = null;

    /** Id of the friend whose slot is open, or -1. **Name derived**. */
    // AS3: .../view/HabboFriendBarView.as::_selectedFriendId
    private _selectedFriendId: number = -1;

    /** Index of the first friend shown — the paging offset. **Name derived**. */
    // AS3: .../view/HabboFriendBarView.as::_scrollIndex
    private _scrollIndex: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_7197
    private _cropper: TextCropper | null;

    /**
     * Declared, null-checked and disposed in AS3 — and **never constructed**. The new
     * bar drives its lamps through the `icon_messenger` children directly
     * (`notifyMessenger()`), so both icon fields are inert in this build. Kept because
     * the AS3 field is, and because `setFriendListIconNotify()` is part of the view's
     * interface.
     */
    // AS3: .../view/HabboFriendBarView.as::_SafeStr_6465
    private _friendListIcon: FriendListIcon | null = null;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_7022
    private _messengerIcon: MessengerIcon | null = null;

    /** The messenger icon's container in the tools cluster. **Name derived**. */
    // AS3: .../view/HabboFriendBarView.as::_messengerIconWindow
    private _messengerIconWindow: IWindowContainer | null = null;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_10264
    private _openMessengerTab: OpenMessengerTab | null = null;

    /** Whether the find-friends slot is offered. **Name derived**. */
    // AS3: .../view/HabboFriendBarView.as::_showFindFriends
    private _showFindFriends: boolean = true;

    /** The room-enter dimmer's lifetime timer. */
    // AS3: .../view/HabboFriendBarView.as::_SafeStr_5272
    private _dimmerTimerId: ReturnType<typeof setTimeout> | null = null;

    /** True while the bar is collapsed. **Name derived**. */
    // AS3: .../view/HabboFriendBarView.as::_collapsed
    private _collapsed: boolean = false;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_7267
    private _collapseLeftButton: IRegionWindow | null = null;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_7319
    private _collapseRightButton: IRegionWindow | null = null;

    // AS3: .../view/HabboFriendBarView.as::_startingInit
    private _startingInit: boolean = false;

    /** The separator line in the tools cluster. */
    // AS3: .../view/HabboFriendBarView.as::_SafeStr_4854
    private _toolsLine: IStaticBitmapWrapperWindow | null = null;

    /** Messenger icon blink timer. */
    // AS3: .../view/HabboFriendBarView.as::_SafeStr_4902
    private _blinkTimerId: ReturnType<typeof setInterval> | null = null;

    /** Collapse animation timer. */
    // AS3: .../view/HabboFriendBarView.as::_SafeStr_4949
    private _collapseTimerId: ReturnType<typeof setInterval> | null = null;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_7053
    private _collapseElapsed: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_8763
    private _collapseAnimationStartX: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_SafeStr_8742
    private _collapseAnimationTargetX: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_collapseAnimationStartWidth
    private _collapseAnimationStartWidth: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_collapseAnimationTargetWidth
    private _collapseAnimationTargetWidth: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_collapseAnimationStartReservedWidth
    private _collapseAnimationStartReservedWidth: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_collapseAnimationTargetReservedWidth
    private _collapseAnimationTargetReservedWidth: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_currentFriendBarWidth
    private _currentFriendBarWidth: number = 0;

    // AS3: .../view/HabboFriendBarView.as::_notifyMessengerOnStartup
    private _notifyMessengerOnStartup: boolean = false;

    // DEVIATION: AS3 also takes the optional games manager; the RPG fork removed Snow War and the
    //   games manager.
    // AS3: .../view/HabboFriendBarView.as::get dependencies()
    protected override get dependencies(): Array<ComponentDependency<unknown>>
    {
        return [
            ...super.dependencies,
            new ComponentDependency(IID_HabboFriendList, (friendList: IHabboFriendList | null) =>
            {
                this._friendList = friendList;
            }, true),
            // IIDHabboFriendBarData is declared as IID<unknown> in this port's iid/, so
            // the resolved component is narrowed here rather than at the symbol.
            new ComponentDependency(IID_HabboFriendBarData, (data: unknown) =>
            {
                this._friendBarData = data as IHabboFriendBarData | null;
            }, true),
            new ComponentDependency(IID_HabboToolbar, (toolbar: IHabboToolbar | null) =>
            {
                this._toolbar = toolbar;
            }, true)
        ] as Array<ComponentDependency<unknown>>;
    }

    // AS3: .../view/HabboFriendBarView.as::initComponent()
    protected override initComponent(): void
    {
        this.context.addLinkEventTracker(this);

        const events = this._friendBarData?.events ?? null;

        if(events !== null)
        {
            events.on(FriendBarUpdateEvent.FRIEND_LIST_UPDATED, this.onRefreshView);
            events.on(FindFriendsNotificationEvent.TYPE, this.onFindFriendsNotification);
            events.on(FriendRequestUpdateEvent.FRIEND_REQUEST_UPDATE, this.onFriendRequestUpdate);
            events.on(NewMessageEvent.NEW_INSTANT_MESSAGE, this.onNewInstantMessage);
            events.on(NotificationEvent.FRIEND_NOTIFICATION_EVENT, this.onFriendNotification);
            events.on(ActiveConversationsCountEvent.ACTIVE_MESSENGER_CONVERSATION_EVENT, this.onRefreshMessengerConversations);
        }

        this._sessionDataManager?.events.on(SessionDataPreferencesEvent.PREFERENCES_UPDATED, this.onSessionDataPreferences);
    }

    // AS3: .../view/HabboFriendBarView.as::get visible()
    get visible(): boolean
    {
        return this._window !== null && this._window.visible;
    }

    // AS3: .../view/HabboFriendBarView.as::set visible()
    set visible(value: boolean)
    {
        if(this._window !== null)
        {
            this._window.visible = value;
            this._window.activate();
        }

        // The toggle window is the bar's stand-in while it is hidden, so it shows
        // exactly when the bar does not, at the same position.
        if(this._toggleWindow !== null)
        {
            this._toggleWindow.visible = !value;

            if(this._window !== null)
            {
                this._toggleWindow.x = this._window.x;
                this._toggleWindow.y = this._window.y;
                this._toggleWindow.activate();
            }
        }
    }

    // AS3: .../view/HabboFriendBarView.as::get friendBarWidth()
    get friendBarWidth(): number
    {
        return this._window === null ? 0 : this._currentFriendBarWidth;
    }

    // AS3: .../view/HabboFriendBarView.as::setMessengerIconNotify()
    setMessengerIconNotify(notify: boolean): void
    {
        this._messengerIcon?.notify(notify);

        if(this._messengerIconWindow !== null)
        {
            this.notifyMessenger(notify);
        }
    }

    // AS3: .../view/HabboFriendBarView.as::setFriendListIconNotify()
    setFriendListIconNotify(notify: boolean): void
    {
        this._friendListIcon?.notify(notify);
    }

    // AS3: .../view/HabboFriendBarView.as::getIconLocation()
    getIconLocation(iconName: string): IWindowContainer | null
    {
        return (this._window?.findChildByName(iconName) as IWindowContainer | null) ?? null;
    }

    /**
     * Dims the bar while the room-enter effect is playing, and removes the dimmer when
     * the effect is over.
     */
    // AS3: .../view/HabboFriendBarView.as::addDimmerToFriendBar()
    private addDimmerToFriendBar(): void
    {
        if(this._window === null || this._windowManager === null)
        {
            return;
        }

        const dimmer = this._windowManager.createWindow(
            'bar_dimmer',
            '',
            30,
            1,
            0x80 | 0x0800 | 1,
            {x: 0, y: 0, width: this._window.width, height: this._window.height},
            null,
            0
        );

        dimmer.color = 0;
        dimmer.blend = 0.3;

        this._window.addChild(dimmer);
        this._window.invalidate();

        if(this._dimmerTimerId === null)
        {
            this._dimmerTimerId = setTimeout(() => this.onRemoveDimmer(), RoomEnterEffect.totalRunningTime);
        }
    }

    // AS3: .../view/HabboFriendBarView.as::onRemoveDimmer()
    private onRemoveDimmer(): void
    {
        this._dimmerTimerId = null;

        const dimmer = this._window?.findChildByName('bar_dimmer') ?? null;

        if(dimmer !== null && this._window !== null)
        {
            this._window.removeChild(dimmer);
            this._windowManager?.destroy(dimmer);
        }
    }

    /**
     * Rebuilds every slot from the data. The open slot's friend id is remembered across
     * the rebuild so the same friend is reopened at the end.
     */
    // AS3: .../view/HabboFriendBarView.as::populate()
    populate(): void
    {
        if(this._window === null || this._friendBarData === null)
        {
            return;
        }

        const previouslySelected = this._selectedFriendId;

        this.deSelect(false);

        const list = this._window.findChildByName(HabboFriendBarView.LIST) as IItemListWindow | null;

        if(list === null)
        {
            return;
        }

        list.autoArrangeItems = false;

        for(let i = list.numListItems; i > 0; i--)
        {
            list.removeListItemAt(i - 1);
        }

        while(this._tabs.length > 0)
        {
            this._tabs.pop()?.recycle();
        }

        this.updateFriendRequestCounter(this._friendBarData.numFriendRequests);

        const friendCount = this._friendBarData.numFriends;
        const maxTabs = this.maxNumOfTabsVisible;
        let total = friendCount + (this._showFindFriends ? 1 : 0);
        const visible = Math.min(maxTabs, total);

        // Keep the window of slots inside the list when the list shrank under us.
        if(this._scrollIndex + visible > total)
        {
            this._scrollIndex = Math.max(0, this._scrollIndex - (this._scrollIndex + visible - total));
        }

        const start = this._scrollIndex;

        for(let i = start; i < friendCount + start; i++)
        {
            if(i >= friendCount || this._tabs.length >= maxTabs)
            {
                break;
            }

            const friend = this._friendBarData.getFriendAt(i);

            // Groups (negative ids) get no slot in the bar.
            if(friend !== null && friend.id > 0)
            {
                const tab = NewFriendEntityTab.allocate(friend);

                this._tabs.push(tab);

                if(tab.window !== null)
                {
                    list.addListItem(tab.window);
                }
            }
        }

        if(this._showFindFriends)
        {
            let findFriendsTabs = this.getNumberOfFindFriendsTabs(maxTabs);

            total = friendCount + findFriendsTabs;

            while(findFriendsTabs-- > 0)
            {
                const tab = AddFriendsTab.allocate();

                if(tab.window !== null)
                {
                    list.addListItem(tab.window);
                }

                this._tabs.push(tab);
            }
        }

        list.autoArrangeItems = true;

        if(previouslySelected > -1)
        {
            this.selectFriendEntity(previouslySelected);
        }

        this.setCollapseButtonVisibility();
        this.toggleArrowButtons(
            this._tabs.length < total && total > 0,
            this._scrollIndex !== 0,
            this._scrollIndex + this._tabs.length < total
        );

        // The first pass runs twice: the initial layout changes how many slots fit.
        if(!this._startingInit)
        {
            this._startingInit = true;
            this.resizeAndPopulate(false);
            this.resizeAndPopulate(true);
        }
    }

    /**
     * A nearly-empty bar is padded with find-friends slots up to `MIN_TABS`, so it never
     * looks like a stub with one tile.
     */
    // AS3: .../view/HabboFriendBarView.as::getNumberOfFindFriendsTabs()
    private getNumberOfFindFriendsTabs(maxTabs: number): number
    {
        if(this._tabs.length >= maxTabs)
        {
            return 0;
        }

        let count = 1;

        if(this._tabs.length + count < HabboFriendBarView.MIN_TABS)
        {
            count = Math.min(maxTabs - this._tabs.length, HabboFriendBarView.MIN_TABS - this._tabs.length);
        }

        return count;
    }

    // AS3: .../view/HabboFriendBarView.as::getFriendEntityTabByID()
    private getFriendEntityTabByID(id: number): FriendEntityTab | NewFriendEntityTab | null
    {
        for(const tab of this._tabs)
        {
            if((tab instanceof FriendEntityTab || tab instanceof NewFriendEntityTab) && tab.friend?.id === id)
            {
                return tab;
            }
        }

        return null;
    }

    // AS3: .../view/HabboFriendBarView.as::isUserInterfaceReady()
    private isUserInterfaceReady(): boolean
    {
        return this._window !== null && !this._window.disposed;
    }

    /**
     * Builds the bar. The `Tab`/`Token` statics are filled here, before the first slot
     * exists — every slot reads its collaborators off them.
     */
    // DEVIATION: AS3 also hands the games manager to `Tab.GAMES` / `Token.GAMES`; the RPG fork
    //   removed Snow War and the games manager.
    // AS3: .../view/HabboFriendBarView.as::buildUserInterface()
    private buildUserInterface(): void
    {
        if(this._windowManager === null)
        {
            return;
        }

        Tab.data = this._friendBarData;
        Tab.friends = this._friendList;
        Tab.view = this;
        Tab.assets = this.assets;
        Tab.windowing = this._windowManager;
        Tab.localization = this._localizationManager;
        Tab.cropper = this._cropper;
        Tab.tracking = this._tracking;
        Tab.avatarRenderManager = this._avatarManager;

        Token.WINDOWING = this._windowManager;
        Token.ASSETS = this.assets;

        const window = this._windowManager.buildWidgetLayout(HabboFriendBarView.MAIN_WINDOW_RESOURCE, 1) as IWindowContainer | null;

        if(window === null)
        {
            log.error(`buildUserInterface: layout "${HabboFriendBarView.MAIN_WINDOW_RESOURCE}" is not registered`);

            return;
        }

        this._window = window;
        window.y = (window.parent?.height ?? 0) - (window.height + HabboFriendBarView.NEW_BAR_BOTTOM_OFFSET);
        window.setParamFlag(1024, true);
        window.procedure = this.barWindowEventProc;

        if(RoomEnterEffect.isRunning())
        {
            this.addDimmerToFriendBar();
        }

        const tools = window.findChildByName(HabboFriendBarView.TOOLS) as IWindowContainer | null;

        if(tools !== null)
        {
            this._toolsLine = tools.getChildByName('line') as IStaticBitmapWrapperWindow | null;

            this._messengerIconWindow = tools.findChildByName('icon_messenger') as IWindowContainer | null;

            if(this._messengerIconWindow !== null)
            {
                this._messengerIconWindow.addEventListener(WindowMouseEvent.CLICK, this.onOpenMessenger);
                this._messengerIconWindow.visible = false;
            }

            tools.findChildByName(HabboFriendBarView.ICON_ALL_FRIENDS)?.addEventListener(WindowMouseEvent.CLICK, this.onOpenFriendsList);
            tools.findChildByName(HabboFriendBarView.ICON_FIND_FRIENDS)?.addEventListener(WindowMouseEvent.CLICK, this.onOpenSearchFriends);
        }

        this._collapseLeftButton = window.findChildByName(HabboFriendBarView.BUTTON_COLLAPSE_LEFT) as IRegionWindow | null;
        (this._collapseLeftButton as unknown as IWindow | null)?.addEventListener(WindowMouseEvent.CLICK, this.onCollapseFriendList);

        this._collapseRightButton = window.findChildByName(HabboFriendBarView.BUTTON_COLLAPSE_RIGHT) as IRegionWindow | null;
        (this._collapseRightButton as unknown as IWindow | null)?.addEventListener(WindowMouseEvent.CLICK, this.onCollapseFriendList);

        this._windowManager.getWindowContext(1).getDesktopWindow()?.addEventListener(WindowEvent.WE_RESIZED, this.onDesktopResized);

        this.populate();

        if(this._collapseTimerId === null)
        {
            // Started on demand by startCollapseAnimation(); AS3 creates the timer here
            // and only calls start() there.
            this._collapseTimerId = null;
        }

        if(this._notifyMessengerOnStartup)
        {
            this.notifyMessenger(true);
        }
    }

    // AS3: .../view/HabboFriendBarView.as::getAvatarFaceBitmap()
    getAvatarFaceBitmap(figure: string): ImageBitmap | null
    {
        if(this._avatarManager === null)
        {
            return null;
        }

        const avatarImage = this._avatarManager.createAvatarImage(figure, 'h', '', this, null);

        if(avatarImage === null)
        {
            return null;
        }

        const face = HabboFaceFocuser.focusUserFace(avatarImage, 'head', 2, 1);

        avatarImage.dispose();

        return face;
    }

    /**
     * As `HabboFriendList.getSmallGroupBadgeBitmap()`: null while the badge is still downloading,
     * which is what AS3's `getGroupBadgeImage()` returns at that point too.
     */
    // AS3: .../view/HabboFriendBarView.as::getGroupIconBitmap()
    getGroupIconBitmap(badge: string): ImageBitmap | null
    {
        return imageElementToBitmap(this._sessionDataManager?.getGroupBadgeImage(badge) ?? null);
    }

    /**
     * A figure finished downloading: find whoever wears it and repaint their head —
     * first among the friends, then among the pending requests.
     */
    // AS3: .../view/HabboFriendBarView.as::avatarImageReady()
    avatarImageReady(figureString: string): void
    {
        if(this._window === null || this._friendBarData === null)
        {
            return;
        }

        const list = this._window.findChildByName(HabboFriendBarView.LIST) as IItemListWindow | null;
        const friendCount = this._friendBarData.numFriends;

        for(let i = 0; i < friendCount; i++)
        {
            const friend = this._friendBarData.getFriendAt(i);

            if(friend === null || friend.figure !== figureString)
            {
                continue;
            }

            const face = friend.id > 0 ? this.getAvatarFaceBitmap(friend.figure) : this.getGroupIconBitmap(friend.figure);

            if(face !== null && list !== null)
            {
                const slot = list.getListItemByID(friend.id) as IWindowContainer | null;
                const pieces = slot?.getChildByName(HabboFriendBarView.PIECES) as IItemListWindow | null;
                const header = pieces?.getListItemByName(HabboFriendBarView.HEADER) as IWindowContainer | null;
                const canvas = header?.findChildByName(HabboFriendBarView.CANVAS) as IBitmapWrapperWindow | null;

                if(canvas !== null && canvas !== undefined)
                {
                    canvas.bitmap = face;
                    (canvas as unknown as IWindow).width = face.width;
                    (canvas as unknown as IWindow).height = face.height;
                }
            }

            return;
        }

        for(const request of this._friendBarData.getFriendRequestList())
        {
            if(request.figure !== figureString)
            {
                continue;
            }

            for(const tab of this._tabs)
            {
                const face = this.getAvatarFaceBitmap(figureString);

                if(face === null)
                {
                    return;
                }

                if(tab instanceof FriendRequestTab || tab instanceof NewFriendRequestTab || tab instanceof FriendRequestsTab)
                {
                    tab.avatarImageReady(request, face);

                    return;
                }
            }
        }
    }

    // AS3: .../view/HabboFriendBarView.as::selectTab()
    selectTab(tab: ITab, animate: boolean): void
    {
        if(tab.selected)
        {
            return;
        }

        if(this._selectedTab !== null)
        {
            this.deSelect(true);
        }

        tab.select(animate);
        this._selectedTab = tab;

        if(tab instanceof FriendEntityTab || tab instanceof NewFriendEntityTab)
        {
            this._selectedFriendId = tab.friend?.id ?? -1;
        }
    }

    // AS3: .../view/HabboFriendBarView.as::selectFriendEntity()
    selectFriendEntity(friendId: number): void
    {
        if(this._selectedFriendId === friendId)
        {
            return;
        }

        const tab = this.getFriendEntityTabByID(friendId);

        if(tab !== null)
        {
            this.selectTab(tab, false);
            this._selectedFriendId = friendId;
        }
    }

    // AS3: .../view/HabboFriendBarView.as::deSelect()
    deSelect(animate: boolean): void
    {
        if(this._selectedTab !== null)
        {
            this._selectedTab.deselect(animate);
            this._selectedTab = null;
            this._selectedFriendId = -1;
        }
    }

    // AS3: .../view/HabboFriendBarView.as::removeMessengerNotifications()
    removeMessengerNotifications(): void
    {
        for(const tab of this._tabs)
        {
            if(tab instanceof FriendEntityTab || tab instanceof NewFriendEntityTab)
            {
                tab.removeNotificationToken(-1, true);
            }
        }
    }

    /**
     * Shows the pending-request count on the friend-list icon, creating the counter
     * window on first use.
     */
    // AS3: .../view/HabboFriendBarView.as::updateFriendRequestCounter()
    updateFriendRequestCounter(count: number): void
    {
        if(this._requestCounter === null)
        {
            this._requestCounter = this._windowManager?.createUnseenItemCounter() ?? null;
        }

        if(this._requestCounter === null || this._window === null)
        {
            return;
        }

        const icon = this._window.findChildByName(HabboFriendBarView.ICON_ALL_FRIENDS) as IWindowContainer | null;

        if(icon === null)
        {
            return;
        }

        icon.addChild(this._requestCounter);
        this._requestCounter.x = icon.width - this._requestCounter.width - 5;
        this._requestCounter.y = 0;

        if(count > 0)
        {
            this._requestCounter.visible = true;

            const label = this._requestCounter.findChildByName('count');

            if(label !== null)
            {
                label.caption = count.toString();
            }
        }
        else
        {
            this._requestCounter.visible = false;
        }
    }

    // === Event handlers ===

    // AS3: .../view/HabboFriendBarView.as::onRefreshView()
    private onRefreshView = (): void =>
    {
        if(!this.isUserInterfaceReady())
        {
            this.buildUserInterface();
        }
        else
        {
            this.resizeAndPopulate(true);
        }
    };

    // AS3: .../view/HabboFriendBarView.as::onFindFriendsNotification()
    private onFindFriendsNotification = (event: FindFriendsNotificationEvent): void =>
    {
        const title = event.success ? '${friendbar.find.success.title}' : '${friendbar.find.error.title}';
        const text = event.success ? '${friendbar.find.success.text}' : '${friendbar.find.error.text}';

        this._windowManager?.notify(title, text, (dialog) => dialog.dispose(), 16);
    };

    // AS3: .../view/HabboFriendBarView.as::onFriendRequestUpdate()
    private onFriendRequestUpdate = (): void =>
    {
        this._friendListIcon?.notify((this._friendBarData?.numFriendRequests ?? 0) > 0);

        if(this._window !== null)
        {
            this.updateFriendRequestCounter(this._friendBarData?.numFriendRequests ?? 0);
            this.resizeAndPopulate(true);
        }
        else
        {
            this.buildUserInterface();
        }
    };

    /** Alternates the two lit messenger icons — the blink. */
    // AS3: .../view/HabboFriendBarView.as::onTimerEvent()
    private onBlinkTimer = (): void =>
    {
        if(this._messengerIconWindow === null)
        {
            return;
        }

        this._messengerIconWindow.visible = true;

        const first = this._messengerIconWindow.getChildByName('icon_1');
        const second = this._messengerIconWindow.getChildByName('icon_2');

        if(first === null || second === null)
        {
            return;
        }

        if(first.visible)
        {
            first.visible = false;
            second.visible = true;
        }
        else if(second.visible)
        {
            second.visible = false;
            first.visible = true;
        }
    };

    // AS3: .../view/HabboFriendBarView.as::notifyMessenger()
    private notifyMessenger(notify: boolean): void
    {
        if(this._messengerIconWindow === null)
        {
            return;
        }

        const idle = this._messengerIconWindow.getChildByName('icon');
        const first = this._messengerIconWindow.getChildByName('icon_1');

        if(notify)
        {
            if(this._blinkTimerId === null)
            {
                if(idle !== null)
                {
                    idle.visible = false;
                }

                if(first !== null)
                {
                    first.visible = true;
                }

                this._blinkTimerId = setInterval(this.onBlinkTimer, 500);
            }

            return;
        }

        if(this._blinkTimerId !== null)
        {
            clearInterval(this._blinkTimerId);
            this._blinkTimerId = null;
        }

        if(idle !== null)
        {
            idle.visible = true;
        }

        if(first !== null)
        {
            first.visible = false;
        }

        const second = this._messengerIconWindow.getChildByName('icon_2');

        if(second !== null)
        {
            second.visible = false;
        }
    }

    // AS3: .../view/HabboFriendBarView.as::onNewInstantMessage()
    private onNewInstantMessage = (event: NewMessageEvent): void =>
    {
        // Remembered so a message that arrives before the bar exists still lights the
        // icon once it is built.
        if(event.notify)
        {
            this._notifyMessengerOnStartup = true;
        }

        if(this._messengerIconWindow !== null)
        {
            if(event.notify)
            {
                this.notifyMessenger(true);
            }
            else
            {
                this._messengerIconWindow.visible = true;
                this.notifyMessenger(false);
            }
        }

        if(event.notify && this._openMessengerTab?.window !== null && this._openMessengerTab !== null)
        {
            this._openMessengerTab.window!.visible = true;
        }
    };

    // AS3: .../view/HabboFriendBarView.as::onFriendNotification()
    private onFriendNotification = (event: NotificationEvent): void =>
    {
        this.getFriendEntityTabByID(event.friendId)?.addNotificationToken(event.notification);
    };

    // AS3: .../view/HabboFriendBarView.as::onRefreshMessengerConversations()
    private onRefreshMessengerConversations = (event: ActiveConversationsCountEvent): void =>
    {
        if(this._messengerIconWindow !== null)
        {
            this._messengerIconWindow.visible = event.activeConversationsCount !== 0;
            this.notifyMessenger(event.hasUnread);
        }
    };

    /** UI flag bit 1 is "friend bar open", so its absence means collapsed. */
    // AS3: .../view/HabboFriendBarView.as::onSessionDataPreferences()
    private onSessionDataPreferences = (event: SessionDataPreferencesEvent): void =>
    {
        this.setCollapsedState((event.uiFlags & 1) === 0, false, false);
    };

    // AS3: .../view/HabboFriendBarView.as::barWindowEventProc()
    private barWindowEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WME_DOWN')
        {
            let index = this._scrollIndex;
            const total = (this._friendBarData?.numFriends ?? 0)
                + (this._showFindFriends ? 1 : 0)
                + ((this._friendBarData?.numFriendRequests ?? 0) > 0 ? 1 : 0);
            const maxTabs = this.maxNumOfTabsVisible;

            switch(window.name)
            {
                case HabboFriendBarView.BUTTON_LEFT:
                    index = Math.max(0, this._scrollIndex - 1);
                    break;
                case HabboFriendBarView.BUTTON_LEFT_PAGE:
                    index = Math.max(0, this._scrollIndex - maxTabs);
                    break;
                case HabboFriendBarView.BUTTON_LEFT_END:
                    index = 0;
                    break;
                case HabboFriendBarView.BUTTON_RIGHT:
                    index = Math.max(0, Math.min(total - maxTabs, this._scrollIndex + 1));
                    break;
                case HabboFriendBarView.BUTTON_RIGHT_PAGE:
                    index = Math.max(0, Math.min(total - maxTabs, this._scrollIndex + maxTabs));
                    break;
                case HabboFriendBarView.BUTTON_RIGHT_END:
                    index = Math.max(0, total - maxTabs);
                    break;
                case HabboFriendBarView.BUTTON_CLOSE:
                    this.visible = false;
                    break;
                case HabboFriendBarView.BORDER:
                    this.deSelect(true);
                    break;
                case HabboFriendBarView.LINK_FRIEND_LIST:
                    this._friendBarData?.toggleFriendList();
                    break;
            }

            if(index !== this._scrollIndex)
            {
                this.deSelect(true);
                this._scrollIndex = index;
                this.resizeAndPopulate(true);
            }
        }

        if(event.type === 'WE_DEACTIVATED')
        {
            this.deSelect(true);
        }
    };

    // AS3: .../view/HabboFriendBarView.as::setCollapseButtonVisibility()
    private setCollapseButtonVisibility(): void
    {
        const left = this._collapseLeftButton as unknown as IWindow | null;
        const right = this._collapseRightButton as unknown as IWindow | null;

        if(left !== null)
        {
            left.visible = this._collapsed;
        }

        if(right !== null)
        {
            right.visible = !this._collapsed;
        }
    }

    /** What the rest of the UI must keep clear for the bar. */
    // AS3: .../view/HabboFriendBarView.as::getReservedFriendBarWidth()
    private getReservedFriendBarWidth(): number
    {
        if(this._window === null)
        {
            return 0;
        }

        return this._collapsed ? HabboFriendBarView.COLLAPSED_MARGIN : this._window.width;
    }

    // AS3: .../view/HabboFriendBarView.as::dispatchFriendBarResize()
    private dispatchFriendBarResize(): void
    {
        this.events.emit(FriendBarResizeEvent.FRIENDBAR_RESIZE_EVENT, new FriendBarResizeEvent());
    }

    // AS3: .../view/HabboFriendBarView.as::applyCollapseAnimationFrame()
    private applyCollapseAnimationFrame(x: number, width: number, reservedWidth: number): void
    {
        if(this._window === null)
        {
            return;
        }

        this._window.x = x;
        this._window.width = width;
        this._currentFriendBarWidth = reservedWidth;
        this._window.invalidate();

        this.dispatchFriendBarResize();
    }

    // AS3: .../view/HabboFriendBarView.as::startCollapseAnimation()
    private startCollapseAnimation(
        startX: number,
        targetX: number,
        startWidth: number,
        targetWidth: number,
        startReserved: number,
        targetReserved: number
    ): void
    {
        this._collapseElapsed = 0;
        this._collapseAnimationStartX = startX;
        this._collapseAnimationTargetX = targetX;
        this._collapseAnimationStartWidth = startWidth;
        this._collapseAnimationTargetWidth = targetWidth;
        this._collapseAnimationStartReservedWidth = startReserved;
        this._collapseAnimationTargetReservedWidth = targetReserved;

        this.applyCollapseAnimationFrame(startX, startWidth, startReserved);

        if(this._collapseTimerId !== null)
        {
            clearInterval(this._collapseTimerId);
        }

        this._collapseTimerId = setInterval(this.onCollapseAnimationTimer, 1000 / HabboFriendBarView.COLLAPSE_ANIMATION_FPS);
    }

    /** Cubic ease-out over `COLLAPSE_ANIMATION_DURATION_MS`. */
    // AS3: .../view/HabboFriendBarView.as::onCollapseAnimationTimer()
    private onCollapseAnimationTimer = (): void =>
    {
        if(this._window === null || this._collapseTimerId === null)
        {
            return;
        }

        this._collapseElapsed += 1000 / HabboFriendBarView.COLLAPSE_ANIMATION_FPS;

        const progress = Math.min(1, this._collapseElapsed / HabboFriendBarView.COLLAPSE_ANIMATION_DURATION_MS);
        const eased = 1 - Math.pow(1 - progress, 3);

        const x = Math.round(this._collapseAnimationStartX + (this._collapseAnimationTargetX - this._collapseAnimationStartX) * eased);
        const width = Math.round(this._collapseAnimationStartWidth + (this._collapseAnimationTargetWidth - this._collapseAnimationStartWidth) * eased);
        const reserved = Math.round(this._collapseAnimationStartReservedWidth + (this._collapseAnimationTargetReservedWidth - this._collapseAnimationStartReservedWidth) * eased);

        this.applyCollapseAnimationFrame(x, width, reserved);

        if(progress >= 1)
        {
            clearInterval(this._collapseTimerId);
            this._collapseTimerId = null;
            this.applyCollapseAnimationFrame(this._collapseAnimationTargetX, this._collapseAnimationTargetWidth, this._collapseAnimationTargetReservedWidth);
        }
    };

    // AS3: .../view/HabboFriendBarView.as::onCollapseFriendList()
    private onCollapseFriendList = (): void =>
    {
        this.toggleCollapsedState();
    };

    // AS3: .../view/HabboFriendBarView.as::toggleCollapsedState()
    private toggleCollapsedState(): void
    {
        this.setCollapsedState(!this._collapsed, true, true);
    }

    /**
     * Collapses or expands. The before/after geometry is measured around a relayout and
     * then animated between, rather than computed — the layout decides the end state.
     */
    // AS3: .../view/HabboFriendBarView.as::setCollapsedState()
    private setCollapsedState(collapsed: boolean, persist: boolean, animate: boolean): void
    {
        if(this._collapsed === collapsed)
        {
            return;
        }

        const startX = this._window?.x ?? 0;
        const startWidth = this._window?.width ?? 0;
        const startReserved = this._currentFriendBarWidth;

        this._collapsed = collapsed;

        if(persist)
        {
            this._sessionDataManager?.setFriendBarState(!this._collapsed);
        }

        if(this._collapseTimerId !== null)
        {
            clearInterval(this._collapseTimerId);
            this._collapseTimerId = null;
        }

        this.deSelect(true);
        this.resizeAndPopulate(true);
        this.setCollapseButtonVisibility();

        // Expanding needs a second pass: the first one changes how many slots fit.
        if(!this._collapsed)
        {
            this.resizeAndPopulate(true);
        }

        const targetX = this._window?.x ?? 0;
        const targetWidth = this._window?.width ?? 0;
        const targetReserved = this.getReservedFriendBarWidth();

        if(animate)
        {
            this.startCollapseAnimation(startX, targetX, startWidth, targetWidth, startReserved, targetReserved);
        }
        else
        {
            this.applyCollapseAnimationFrame(targetX, targetWidth, targetReserved);
        }
    }

    // AS3: .../view/HabboFriendBarView.as::onOpenMessenger()
    private onOpenMessenger = (): void =>
    {
        this._friendBarData?.toggleMessenger();
        this.notifyMessenger(false);
    };

    // AS3: .../view/HabboFriendBarView.as::onOpenFriendsList()
    private onOpenFriendsList = (): void =>
    {
        this._friendBarData?.toggleFriendList();
    };

    // AS3: .../view/HabboFriendBarView.as::onOpenSearchFriends()
    private onOpenSearchFriends = (): void =>
    {
        this._friendBarData?.openUserTextSearch();
    };

    /** Paging arrows: hidden when everything fits, dimmed at either end. */
    // AS3: .../view/HabboFriendBarView.as::toggleArrowButtons()
    private toggleArrowButtons(visible: boolean, canScrollLeft: boolean, canScrollRight: boolean): void
    {
        if(this._window === null)
        {
            return;
        }

        const left = this._window.findChildByName(HabboFriendBarView.BUTTON_LEFT_PAGE);
        const right = this._window.findChildByName(HabboFriendBarView.BUTTON_RIGHT_PAGE);

        for(const [button, enabled] of [[left, canScrollLeft], [right, canScrollRight]] as Array<[IWindow | null, boolean]>)
        {
            if(button === null)
            {
                continue;
            }

            button.visible = visible;

            if(enabled)
            {
                button.enable();
                button.blend = 1;
            }
            else
            {
                button.disable();
                button.blend = 0.2;
            }
        }

        this.arrangeWindows();
    }

    /**
     * Sizes the bar to the space the toolbar leaves, and repopulates when the number of
     * slots that fit has actually changed.
     */
    // AS3: .../view/HabboFriendBarView.as::resizeAndPopulate()
    private resizeAndPopulate(force: boolean = false): void
    {
        if(this.disposed || this._window === null || this._friendBarData === null)
        {
            return;
        }

        const toolbarRect = this._toolbar?.getRect() ?? {x: 0, y: 0, width: 0, height: 0};

        this._window.width = (this._window.parent?.width ?? 0) - (toolbarRect.x + toolbarRect.width);

        if(this._toolsLine !== null)
        {
            (this._toolsLine as unknown as IWindow).visible = !this._collapsed;
        }

        if(!force)
        {
            const maxTabs = this.maxNumOfTabsVisible;

            if(maxTabs < this._tabs.length)
            {
                force = true;
            }
            else if(maxTabs > this._tabs.length)
            {
                if(this._tabs.length < HabboFriendBarView.MIN_TABS)
                {
                    force = true;
                }
                else if(this._tabs.length < this._friendBarData.numFriends + (this._showFindFriends ? 1 : 0))
                {
                    force = true;
                }
                else if(this.numFriendEntityTabsVisible < this._friendBarData.numFriends)
                {
                    force = true;
                }
            }
        }

        if(force)
        {
            this.populate();
            this.arrangeWindows();
        }

        const desktopWidth = this._window.desktop?.width ?? 0;

        if(this._collapsed)
        {
            this._window.x = desktopWidth - HabboFriendBarView.COLLAPSED_MARGIN;
        }
        else
        {
            this._window.x = desktopWidth - this._window.width;

            if(this._toolsLine !== null)
            {
                (this._toolsLine as unknown as IWindow).x = 1;
            }
        }

        this._currentFriendBarWidth = this.getReservedFriendBarWidth();
    }

    /** Lays the bar's visible children left to right and shrinks the bar to fit them. */
    // AS3: .../view/HabboFriendBarView.as::arrangeWindows()
    private arrangeWindows(): void
    {
        if(this._window === null)
        {
            return;
        }

        const iterator = this._window.iterator();

        if(iterator === null)
        {
            return;
        }

        let x = 0;

        for(let child = iterator.next(); child !== null; child = iterator.next())
        {
            if(child.visible)
            {
                child.x = x;
                x += child.width;
            }
        }

        this._window.width = x;
    }

    /**
     * AS3 counts the same vector twice here and returns double the real number. Kept
     * verbatim: `resizeAndPopulate()` only compares it against the friend count, and an
     * inflated value there means "do not repopulate", which is the behaviour that
     * shipped.
     */
    // AS3: .../view/HabboFriendBarView.as::get numFriendEntityTabsVisible()
    private get numFriendEntityTabsVisible(): number
    {
        let count = 0;

        for(let pass = 0; pass < 2; pass++)
        {
            for(const tab of this._tabs)
            {
                if(tab instanceof FriendEntityTab || tab instanceof NewFriendEntityTab)
                {
                    count++;
                }
            }
        }

        return count;
    }

    // AS3: .../view/HabboFriendBarView.as::get maxNumOfTabsVisible()
    private get maxNumOfTabsVisible(): number
    {
        if(this._window === null)
        {
            return 0;
        }

        const list = this._window.findChildByName(HabboFriendBarView.LIST) as IItemListWindow | null;
        const tools = this._window.findChildByName(HabboFriendBarView.TOOLS);

        if(list === null || tools === null)
        {
            return 0;
        }

        return Math.floor(
            (this._window.width - tools.width - HabboFriendBarView.NEW_BAR_RIGHT_MARGIN)
            / (HabboFriendBarView.TAB_WIDTH + list.spacing)
        );
    }

    // AS3: .../view/HabboFriendBarView.as::onDesktopResized()
    private onDesktopResized = (): void =>
    {
        this.resizeAndPopulate(true);
    };

    // AS3: .../view/HabboFriendBarView.as::get linkPattern()
    get linkPattern(): string
    {
        return 'friendbar/';
    }

    // AS3: .../view/HabboFriendBarView.as::linkReceived()
    linkReceived(link: string): void
    {
        const parts = link.split('/');

        if(parts.length < 2)
        {
            return;
        }

        switch(parts[1])
        {
            case 'findfriends':
                this._friendBarData?.findNewFriends();
                break;

            case 'user':
                if(parts.length > 2)
                {
                    this._friendBarData?.showProfileByName(parts[2]!);
                }

                break;

            default:
                log.warn(`HabboFriendBarView unknown link-type received: ${parts[1]}`);
        }
    }

    // AS3: .../view/HabboFriendBarView.as::dispose()
    override dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        if(this._blinkTimerId !== null)
        {
            clearInterval(this._blinkTimerId);
            this._blinkTimerId = null;
        }

        if(this._collapseTimerId !== null)
        {
            clearInterval(this._collapseTimerId);
            this._collapseTimerId = null;
        }

        if(this._dimmerTimerId !== null)
        {
            clearTimeout(this._dimmerTimerId);
            this._dimmerTimerId = null;
        }

        this._messengerIcon?.dispose();
        this._messengerIcon = null;

        this._friendListIcon?.dispose();
        this._friendListIcon = null;

        this._toggleWindow?.dispose();
        this._toggleWindow = null;

        this._window?.dispose();
        this._window = null;

        this._requestCounter?.dispose();
        this._requestCounter = null;

        while(this._tabs.length > 0)
        {
            this._tabs.pop()?.dispose();
        }

        const events = this._friendBarData?.events ?? null;

        if(events !== null)
        {
            events.off(FriendBarUpdateEvent.FRIEND_LIST_UPDATED, this.onRefreshView);
            events.off(FindFriendsNotificationEvent.TYPE, this.onFindFriendsNotification);
            events.off(FriendRequestUpdateEvent.FRIEND_REQUEST_UPDATE, this.onFriendRequestUpdate);
            events.off(NewMessageEvent.NEW_INSTANT_MESSAGE, this.onNewInstantMessage);
            events.off(NotificationEvent.FRIEND_NOTIFICATION_EVENT, this.onFriendNotification);
            events.off(ActiveConversationsCountEvent.ACTIVE_MESSENGER_CONVERSATION_EVENT, this.onRefreshMessengerConversations);
        }

        this._sessionDataManager?.events.off(SessionDataPreferencesEvent.PREFERENCES_UPDATED, this.onSessionDataPreferences);
        this._windowManager?.getWindowContext(1).getDesktopWindow()?.removeEventListener(WindowEvent.WE_RESIZED, this.onDesktopResized);

        this.context.removeLinkEventTracker(this);

        this._cropper?.dispose();
        this._cropper = null;

        super.dispose();
    }
}
