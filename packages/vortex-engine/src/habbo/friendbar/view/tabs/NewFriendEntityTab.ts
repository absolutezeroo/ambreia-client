import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {IInteractiveWindow} from '@core/window/components/IInteractiveWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IBitmapWrapperWindow} from '@core/window/components/IBitmapWrapperWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {Logger} from '@core/utils/Logger';
import {FriendNotification} from '../../data/FriendNotification';
import type {IFriendEntity} from '../../data/IFriendEntity';
import type {IFriendNotification} from '../../data/IFriendNotification';
import {AvatarRenderEvent} from '@habbo/avatar/enum/AvatarRenderEvent';
import {Tab} from './Tab';
import type {Token} from './tokens/Token';
import {RoomEventToken} from './tokens/RoomEventToken';
import {AchievementToken} from './tokens/AchievementToken';
import {QuestToken} from './tokens/QuestToken';

const log = Logger.getLogger('habbo.friendbar.tabs.NewFriendEntityTab');

/**
 * NewFriendEntityTab
 *
 * The new-UI friend slot. A separate class in AS3, not a subclass of `FriendEntityTab`,
 * and kept separate here: the two differ in layout, in which buttons the opened slot
 * carries, and in how they treat an unread message.
 *
 * Four differences carry behaviour:
 *   - it has its own chat button (`btn_chat`) in the controls piece, so an unread
 *     message raises **no** token on the slot — `addNotificationToken()` ignores the
 *     messenger type outright;
 *   - it drops the game-invite icon and its bubble;
 *   - the controls piece is inset by 30px;
 *   - `refresh()` waits for the avatar renderer: if it is not ready the slot subscribes
 *     to `AVATAR_RENDER_READY` once and redraws when it fires, instead of drawing a
 *     head that is not there yet.
 *
 * Both the tabs and their windows are pooled. `allocate()` takes a recycled instance
 * when there is one, and `recycle()` strips the window back to a blank slot and returns
 * both to their pools. That is why almost nothing here is done in a constructor.
 *
 * Opening resizes the slot upward: the window keeps its bottom edge (`y = HEIGHT -
 * height`) so it grows out of the bar rather than pushing it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/view/tabs/NewFriendEntityTab.as
 */
export class NewFriendEntityTab extends Tab
{
    /** **Name derived** from its value; obfuscated in every tree. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::ENTITY_RESOURCE
    private static readonly ENTITY_RESOURCE: string = 'new_friend_entity_xml';

    /** **Name derived** from its value; obfuscated in every tree. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::FACEBOOK_PIECE_RESOURCE
    private static readonly FACEBOOK_PIECE_RESOURCE: string = 'facebook_piece_xml';

    // AS3: .../view/tabs/NewFriendEntityTab.as::CONTROLS_PIECE_RESOURCE
    private static readonly CONTROLS_PIECE_RESOURCE: string = 'new_controls_piece_xml';

    // AS3: .../view/tabs/NewFriendEntityTab.as::PIECES
    protected static readonly PIECES: string = 'pieces';

    /** **Name derived** from its value. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::ICONS
    protected static readonly ICONS: string = 'icons';

    // AS3: .../view/tabs/NewFriendEntityTab.as::HEADER
    protected static readonly HEADER: string = 'header';

    // AS3: .../view/tabs/NewFriendEntityTab.as::PROFILE
    protected static readonly PROFILE: string = 'region_profile';

    /** **Name derived** from its value. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::FACEBOOK
    protected static readonly FACEBOOK: string = 'facebook';

    // AS3: .../view/tabs/NewFriendEntityTab.as::CONTROLS
    protected static readonly CONTROLS: string = 'controls';

    // AS3: .../view/tabs/NewFriendEntityTab.as::CANVAS
    protected static readonly CANVAS: string = 'canvas';

    // AS3: .../view/tabs/NewFriendEntityTab.as::NAME
    protected static readonly NAME: string = 'name';

    // AS3: .../view/tabs/NewFriendEntityTab.as::MESSAGE
    protected static readonly MESSAGE: string = 'btn_message';

    // AS3: .../view/tabs/NewFriendEntityTab.as::MESSAGE_ICON
    protected static readonly MESSAGE_ICON: string = 'icon_message';

    // AS3: .../view/tabs/NewFriendEntityTab.as::VISIT
    protected static readonly VISIT: string = 'btn_visit';

    // AS3: .../view/tabs/NewFriendEntityTab.as::ICON
    protected static readonly ICON: string = 'icon';

    // AS3: .../view/tabs/NewFriendEntityTab.as::LABEL
    protected static readonly LABEL: string = 'label';

    // AS3: .../view/tabs/NewFriendEntityTab.as::NOTIFICATION
    protected static readonly NOTIFICATION: string = 'notification';

    // AS3: .../view/tabs/NewFriendEntityTab.as::BTN_PROFILE
    protected static readonly BTN_PROFILE: string = 'button_profile';

    // AS3: .../view/tabs/NewFriendEntityTab.as::BTN_GAME
    protected static readonly BTN_GAME: string = 'btn_game';

    // AS3: .../view/tabs/NewFriendEntityTab.as::BTN_MESSENGER
    protected static readonly BTN_MESSENGER: string = 'btn_chat';

    // AS3: .../view/tabs/NewFriendEntityTab.as::BUBBLE
    protected static readonly BUBBLE: string = 'bubble';

    // AS3: .../view/tabs/NewFriendEntityTab.as::BUBBLE_MESSAGE
    protected static readonly BUBBLE_MESSAGE: string = 'bubble_message';

    // AS3: .../view/tabs/NewFriendEntityTab.as::BUBBLE_BUTTON_ACCEPT
    protected static readonly BUBBLE_BUTTON_ACCEPT: string = 'bubble_button_accept';

    /** **Name derived** from its value. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::BUBBLE_BUTTON_CLOSE
    protected static readonly BUBBLE_BUTTON_CLOSE: string = 'bubble_button_close';

    /** **Name derived** from its value. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::BUBBLE_CLICK_REGION_REJECT
    protected static readonly BUBBLE_CLICK_REGION_REJECT: string = 'bubble_click_region_reject';

    // AS3: .../view/tabs/NewFriendEntityTab.as::DEFAULT_COLOR
    private static readonly DEFAULT_COLOR: number = 0x9DBF5A;

    /** **Name derived**: the hovered counterpart of `DEFAULT_COLOR`. */
    private static readonly HOVER_COLOR: number = 0xD3F794;

    // AS3: .../view/tabs/NewFriendEntityTab.as::TOKEN_ICON_TAG_NOTIFY
    private static readonly TOKEN_ICON_TAG_NOTIFY: string = 'icon_tag_notify';

    // AS3: .../view/tabs/NewFriendEntityTab.as::TOKEN_ICON_TAG_MESSAGE
    private static readonly TOKEN_ICON_TAG_MESSAGE: string = 'icon_tag_message';

    /** Recycled tabs. **Name derived**; obfuscated in every tree. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::_TAB_POOL
    private static readonly TAB_POOL: NewFriendEntityTab[] = [];

    /** Recycled slot windows. **Name derived**; obfuscated in every tree. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::_WINDOW_POOL
    private static readonly WINDOW_POOL: IWindowContainer[] = [];

    /**
     * Takes a pooled tab when one is free, points it at `friend`, and rebuilds the
     * badges the friend already carries.
     */
    // AS3: .../view/tabs/NewFriendEntityTab.as::allocate()
    static allocate(friend: IFriendEntity): NewFriendEntityTab
    {
        const tab = NewFriendEntityTab.TAB_POOL.length > 0 ? NewFriendEntityTab.TAB_POOL.pop()! : new NewFriendEntityTab();

        tab._recycled = false;
        tab.friend = friend;

        for(const notification of friend.notifications)
        {
            tab.addNotificationToken(notification);
        }

        return tab;
    }

    /**
     * Strips an opened slot back to a bare one: the real-name and controls pieces are
     * destroyed, but the notification rows are only detached — their windows belong to
     * the tokens, which outlive the open/close.
     */
    // AS3: .../view/tabs/NewFriendEntityTab.as::purgeEntityPieces()
    private static purgeEntityPieces(window: IWindowContainer): void
    {
        const pieces = window.getChildByName(NewFriendEntityTab.PIECES) as IItemListWindow | null;

        if(pieces === null)
        {
            return;
        }

        pieces.getListItemByName(NewFriendEntityTab.FACEBOOK)?.dispose();
        pieces.getListItemByName(NewFriendEntityTab.CONTROLS)?.dispose();

        const notifications: IWindow[] = [];

        pieces.groupListItemsWithTag(NewFriendEntityTab.NOTIFICATION, notifications);

        for(const notification of notifications)
        {
            notification.parent = null;
        }

        window.height = Tab.height;
        window.y = 0;
    }

    // AS3: .../view/tabs/NewFriendEntityTab.as::_SafeStr_4672
    protected _friend: IFriendEntity | null = null;

    // AS3: .../view/tabs/NewFriendEntityTab.as::get friend()
    get friend(): IFriendEntity | null
    {
        return this._friend;
    }

    // AS3: .../view/tabs/NewFriendEntityTab.as::set friend()
    set friend(value: IFriendEntity | null)
    {
        this._friend = value;
        this.refresh();
    }

    // AS3: .../view/tabs/NewFriendEntityTab.as::_SafeStr_4733
    protected _tokens: Token[] | null = null;

    /** True while a redraw is parked on the avatar renderer. **Name derived**. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::_waitingForAvatarRenderer
    private _waitingForAvatarRenderer: boolean = false;

    // AS3: .../view/tabs/NewFriendEntityTab.as::recycle()
    override recycle(): void
    {
        if(this.disposed || this._recycled)
        {
            return;
        }

        if(this._window !== null)
        {
            this.releaseFriendTabWindow(this._window);
            this._window = null;
        }

        if(this._tokens !== null)
        {
            while(this._tokens.length > 0)
            {
                this._tokens.pop()?.dispose();
            }

            this._tokens = null;
        }

        this._friend = null;
        this._recycled = true;

        NewFriendEntityTab.TAB_POOL.push(this);
    }

    /**
     * Builds the opened slot: real name (when the friend has one), one row per
     * notification, then the action buttons.
     */
    // DEVIATION: AS3 swaps the visit button for a game button while the friend is playing a
    //   game-center game; the RPG fork removed Snow War and the games manager, so it stays hidden.
    // AS3: .../view/tabs/NewFriendEntityTab.as::select()
    override select(animate: boolean): void
    {
        if(this.selected || this._window === null || this._friend === null)
        {
            return;
        }

        const pieces = this._window.getChildByName(NewFriendEntityTab.PIECES) as IItemListWindow | null;

        if(pieces === null)
        {
            return;
        }

        let grew = false;

        if(this._friend.realName !== null && this._friend.realName !== '')
        {
            const piece = Tab.windowing?.buildWidgetLayout(NewFriendEntityTab.FACEBOOK_PIECE_RESOURCE) as IWindowContainer | null;

            if(piece !== null)
            {
                piece.name = NewFriendEntityTab.FACEBOOK;

                const nameWindow = piece.getChildByName(NewFriendEntityTab.NAME) as ITextWindow | null;

                if(nameWindow !== null)
                {
                    nameWindow.caption = this._friend.realName;

                    if(!nameWindow.wordWrap)
                    {
                        Tab.cropper?.crop(nameWindow);
                    }
                }

                const icon = piece.getChildByName(NewFriendEntityTab.ICON) as IBitmapWrapperWindow | null;

                if(icon !== null)
                {
                    icon.bitmap = (Tab.assets?.getAssetByName(icon.bitmapAssetName)?.content as ImageBitmap | null) ?? null;

                    if(icon.bitmap !== null)
                    {
                        (icon as unknown as IWindow).width = icon.bitmap.width;
                        (icon as unknown as IWindow).height = icon.bitmap.height;
                    }
                }

                pieces.addListItem(piece);
                grew = true;
            }
        }

        for(const token of this._tokens ?? [])
        {
            const element = token.windowElement;

            if(element !== null)
            {
                pieces.addListItem(element);
                grew = true;
            }
        }

        if(this._friend.online)
        {
            const controls = Tab.windowing?.buildWidgetLayout(NewFriendEntityTab.CONTROLS_PIECE_RESOURCE) as IWindowContainer | null;

            if(controls !== null)
            {
                controls.name = NewFriendEntityTab.CONTROLS;

                controls.getChildByName(NewFriendEntityTab.MESSAGE)?.addEventListener(WindowMouseEvent.CLICK, this.onButtonClick);

                // The game button stays hidden: see the DEVIATION on select().
                const gameButton = controls.getChildByName(NewFriendEntityTab.BTN_GAME);

                if(gameButton !== null)
                {
                    gameButton.visible = false;
                }

                const visitButton = controls.getChildByName(NewFriendEntityTab.VISIT);

                if(visitButton !== null)
                {
                    if(this._friend.allowFollow)
                    {
                        visitButton.visible = true;
                        visitButton.addEventListener(WindowMouseEvent.CLICK, this.onButtonClick);
                    }
                    else
                    {
                        visitButton.visible = false;
                    }
                }

                controls.getChildByName(NewFriendEntityTab.BTN_MESSENGER)?.addEventListener(WindowMouseEvent.CLICK, this.onButtonClick);
                controls.getChildByName(NewFriendEntityTab.BTN_PROFILE)?.addEventListener(WindowMouseEvent.CLICK, this.onButtonClick);

                pieces.addListItem(controls);

                // The new controls piece is inset; the old one sat flush.
                controls.x = 30;
                grew = true;
            }
        }

        // AS3 guards the animated path with `param1 && false && ...` — the `false` makes
        // it unreachable, so the slot always snaps open. Kept verbatim rather than
        // "fixed": the motion it would run has never shipped.
        if(grew)
        {
            this._window.height = (pieces as unknown as IWindow).height;
        }

        this._window.y = Tab.height - this._window.height;

        super.select(animate);

        if(animate)
        {
            Tab.tracking?.trackEventLog('FriendBar', '', 'clicked', '', this._friend.logEventId > 0 ? this._friend.logEventId : 0);
            this._friend.logEventId = -1;
        }
    }

    /** Closing consumes every one-shot badge. */
    // AS3: .../view/tabs/NewFriendEntityTab.as::deselect()
    override deselect(animate: boolean): void
    {
        if(this.selected)
        {
            if(this._window !== null)
            {
                NewFriendEntityTab.purgeEntityPieces(this._window);

                if(this._tokens !== null)
                {
                    for(let i = this._tokens.length - 1; i > -1; i--)
                    {
                        const token = this._tokens[i]!;

                        if(token.viewOnce)
                        {
                            this.removeNotificationToken(token.typeCode, animate);
                        }
                    }
                }
            }

            super.deselect(animate);
        }

        // Outside the `selected` guard in AS3 too: the bubble is hidden even when the
        // slot was already closed.
        const bubble = this._window?.findChildByName(NewFriendEntityTab.BUBBLE) ?? null;

        if(bubble !== null)
        {
            bubble.visible = false;
        }
    }

    // AS3: .../view/tabs/NewFriendEntityTab.as::expose()
    protected override expose(): void
    {
        super.expose();

        this.applyHoverStyle();
    }

    // AS3: .../view/tabs/NewFriendEntityTab.as::conceal()
    protected override conceal(): void
    {
        super.conceal();

        this.applyHoverStyle();
    }

    private applyHoverStyle(): void
    {
        if(this._window === null)
        {
            return;
        }

        this._window.color = this.exposed ? NewFriendEntityTab.HOVER_COLOR : NewFriendEntityTab.DEFAULT_COLOR;

        const label = this._window.findChildByTag(NewFriendEntityTab.LABEL) as ITextWindow | null;

        if(label !== null)
        {
            label.underline = this.exposed;
        }
    }

    /**
     * Called when the renderer finishes loading: drops the subscription and draws the
     * head that could not be drawn before.
     */
    // AS3: .../view/tabs/NewFriendEntityTab.as::onAvatarRendererReady()
    private onAvatarRendererReady = (): void =>
    {
        this._waitingForAvatarRenderer = false;
        Tab.avatarRenderManager?.events.off(AvatarRenderEvent.AVATAR_RENDER_READY, this.onAvatarRendererReady);
        this.refresh();
    };

    // AS3: .../view/tabs/NewFriendEntityTab.as::refresh()
    protected refresh(): void
    {
        if(this._window === null)
        {
            this._window = this.allocateFriendTabWindow();
        }

        if(this._window === null || this._friend === null)
        {
            return;
        }

        // No head can be cut before the figure data is loaded; subscribe once and let
        // the callback redraw.
        if(!(Tab.avatarRenderManager?.isReady ?? false))
        {
            if(!this._waitingForAvatarRenderer)
            {
                Tab.avatarRenderManager?.events.on(AvatarRenderEvent.AVATAR_RENDER_READY, this.onAvatarRendererReady);
                this._waitingForAvatarRenderer = true;
            }

            return;
        }

        this._window.id = this._friend.id;

        const pieces = this._window.getChildByName(NewFriendEntityTab.PIECES) as IItemListWindow | null;
        const header = pieces?.getListItemByName(NewFriendEntityTab.HEADER) as IWindowContainer | null;

        if(header === null || header === undefined)
        {
            return;
        }

        const nameWindow = header.findChildByName(NewFriendEntityTab.NAME);

        if(nameWindow !== null)
        {
            nameWindow.caption = this._friend.name;
        }

        const nameText = header.getChildByName(NewFriendEntityTab.NAME) as ITextWindow | null;

        if(nameText !== null)
        {
            Tab.cropper?.crop(nameText);
        }

        const canvas = header.findChildByName(NewFriendEntityTab.CANVAS) as IBitmapWrapperWindow | null;

        if(canvas === null)
        {
            return;
        }

        // Negative ids are groups, which show a badge instead of a head.
        canvas.bitmap = this._friend.id > 0
            ? Tab.view?.getAvatarFaceBitmap(this._friend.figure) ?? null
            : Tab.view?.getGroupIconBitmap(this._friend.figure) ?? null;

        if(canvas.bitmap !== null)
        {
            (canvas as unknown as IWindow).width = canvas.bitmap.width;
            (canvas as unknown as IWindow).height = canvas.bitmap.height;
        }
    }

    // AS3: .../view/tabs/NewFriendEntityTab.as::allocateFriendTabWindow()
    private allocateFriendTabWindow(): IWindowContainer | null
    {
        const window = NewFriendEntityTab.WINDOW_POOL.length > 0
            ? NewFriendEntityTab.WINDOW_POOL.pop()!
            : Tab.windowing?.buildWidgetLayout(NewFriendEntityTab.ENTITY_RESOURCE) as IWindowContainer | null;

        if(window === null || window === undefined)
        {
            log.error(`allocateFriendTabWindow: layout "${NewFriendEntityTab.ENTITY_RESOURCE}" is not registered`);

            return null;
        }

        window.x = 0;
        window.y = 0;
        window.width = Tab.width;
        window.height = Tab.height;

        window.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
        window.addEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
        window.addEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);

        const header = window.findChildByName(NewFriendEntityTab.HEADER);

        if(header !== null)
        {
            header.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
            header.addEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
            header.addEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);
        }

        const profile = window.findChildByName(NewFriendEntityTab.PROFILE) as IRegionWindow | null;

        if(profile !== null)
        {
            const interactive = profile as unknown as IInteractiveWindow;

            (profile as unknown as IWindow).addEventListener(WindowMouseEvent.CLICK, this.onProfileMouseEvent);
            interactive.toolTipCaption = Tab.localization?.getLocalization('infostand.profile.link.tooltip', '') ?? '';
            interactive.toolTipDelay = 100;
        }

        const icons = window.findChildByName(NewFriendEntityTab.ICONS);

        if(icons !== null)
        {
            icons.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
            icons.addEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
            icons.addEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);
        }

        const canvas = window.findChildByName(NewFriendEntityTab.CANVAS) as IBitmapWrapperWindow | null;

        if(canvas !== null)
        {
            canvas.disposesBitmap = true;
        }

        const bubble = window.findChildByName(NewFriendEntityTab.BUBBLE);

        if(bubble !== null)
        {
            bubble.procedure = this.bubbleEventProc;
            bubble.y = -(bubble.height + 5);
            bubble.visible = false;
        }

        return window;
    }

    /**
     * Returns a slot window to the pool, blanked. AS3 removes the `icons` listeners
     * with the wrong handler (`onMouseClick` for all three, where two were added as
     * over/out) — kept verbatim: "fixing" it would detach handlers AS3 leaves attached,
     * and the pooled window is reused with them still in place.
     */
    // AS3: .../view/tabs/NewFriendEntityTab.as::releaseFriendTabWindow()
    private releaseFriendTabWindow(window: IWindowContainer): void
    {
        if(window.disposed)
        {
            return;
        }

        window.procedure = null;
        window.removeEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
        window.removeEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
        window.removeEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);

        const header = window.findChildByName(NewFriendEntityTab.HEADER);

        if(header !== null)
        {
            header.removeEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
            header.removeEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
            header.removeEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);
        }

        const icons = window.findChildByName(NewFriendEntityTab.ICONS);

        if(icons !== null)
        {
            icons.removeEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
            icons.removeEventListener(WindowMouseEvent.OVER, this.onMouseClickEvent);
            icons.removeEventListener(WindowMouseEvent.OUT, this.onMouseClickEvent);
        }

        const profile = window.findChildByName(NewFriendEntityTab.PROFILE);

        if(profile !== null)
        {
            profile.removeEventListener(WindowMouseEvent.CLICK, this.onProfileMouseEvent);
        }

        window.width = Tab.width;
        window.height = Tab.height;
        window.color = NewFriendEntityTab.DEFAULT_COLOR;

        const canvas = window.findChildByName(NewFriendEntityTab.CANVAS) as IBitmapWrapperWindow | null;

        if(canvas !== null)
        {
            canvas.bitmap = null;
        }

        const label = window.findChildByTag(NewFriendEntityTab.LABEL) as ITextWindow | null;

        if(label !== null)
        {
            label.underline = false;
        }

        NewFriendEntityTab.purgeEntityPieces(window);

        if(NewFriendEntityTab.WINDOW_POOL.indexOf(window) === -1)
        {
            NewFriendEntityTab.WINDOW_POOL.push(window);
        }
    }

    // DEVIATION: AS3 also handles the game button / game icon; the RPG fork
    //   removed Snow War and the games manager.
    // AS3: .../view/tabs/NewFriendEntityTab.as::onButtonClick()
    private onButtonClick = (event: WindowEvent): void =>
    {
        if(this.disposed || this.recycled)
        {
            return;
        }

        const name = (event as WindowMouseEvent).window?.name ?? '';

        switch(name)
        {
            case NewFriendEntityTab.MESSAGE:
            case NewFriendEntityTab.MESSAGE_ICON:
                Tab.view?.removeMessengerNotifications();

                if(Tab.data !== null && this._friend !== null)
                {
                    Tab.data.startConversation(this._friend.id);
                    this.deselect(true);

                    if(name === NewFriendEntityTab.MESSAGE_ICON)
                    {
                        Tab.view?.setMessengerIconNotify(false);
                    }
                }

                break;

            case NewFriendEntityTab.VISIT:
                if(Tab.data !== null && this._friend !== null)
                {
                    Tab.data.followToRoom(this._friend.id);
                    this.deselect(true);
                }

                break;

            case NewFriendEntityTab.BTN_PROFILE:
                if(Tab.data !== null && this._friend !== null)
                {
                    Tab.tracking?.trackGoogle('extendedProfile', 'friendToolbar_friendButton');
                    Tab.data.showProfile(this._friend.id);
                    this.deselect(true);
                }

                break;

            case NewFriendEntityTab.BTN_MESSENGER:
                if(Tab.data !== null && this._friend !== null)
                {
                    Tab.data.startConversation(this._friend.id);
                    this.deselect(true);
                }

                break;
        }
    };

    // AS3: .../view/tabs/NewFriendEntityTab.as::onProfileMouseEvent()
    protected onProfileMouseEvent = (event: WindowEvent): void =>
    {
        if(event.type !== 'WME_CLICK' || this._friend === null)
        {
            return;
        }

        Tab.tracking?.trackGoogle('extendedProfile', 'friendBar_friendAvatar');
        Tab.data?.showProfile(this._friend.id);
        this.deselect(true);
    };

    /**
     * One badge per type: an incoming one of the same type replaces the old. A slot that
     * is open is closed and reopened around the change so the piece list is rebuilt —
     * the token vector is stashed across that close so `deselect()` cannot consume it.
     */
    // DEVIATION: AS3 hangs a "playing" game token on the tab (and drops it on FINISHED_GAME); the
    //   RPG fork removed Snow War and the games manager, so both types are ignored rather than
    //   falling through to the unknown-type throw.
    // AS3: .../view/tabs/NewFriendEntityTab.as::addNotificationToken()
    addNotificationToken(notification: IFriendNotification): void
    {
        this.removeNotificationToken(notification.typeCode, false);

        if(this._tokens === null)
        {
            this._tokens = [];
        }

        const wasSelected = this.selected;

        if(wasSelected)
        {
            const stashed = this._tokens;

            this._tokens = null;
            this.deselect(false);
            this._tokens = stashed;
        }

        let token: Token | null;
        let iconTag: string | null;

        switch(notification.typeCode)
        {
            // The new slot has its own chat button, so an unread message raises no
            // token at all. AS3 keeps the case and lets it fall straight through.
            case FriendNotification.TYPE_MESSENGER:
                token = null;
                iconTag = null;
                break;

            case FriendNotification.TYPE_ROOM_EVENT:
                token = new RoomEventToken(this._friend!, notification);
                token.iconElement?.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
                iconTag = NewFriendEntityTab.TOKEN_ICON_TAG_NOTIFY;
                break;

            case FriendNotification.TYPE_ACHIEVEMENT:
                token = new AchievementToken(this._friend!, notification, Tab.localization!);
                token.iconElement?.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
                iconTag = NewFriendEntityTab.TOKEN_ICON_TAG_NOTIFY;
                break;

            case FriendNotification.TYPE_QUEST:
                token = new QuestToken(this._friend!, notification);
                token.iconElement?.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
                iconTag = NewFriendEntityTab.TOKEN_ICON_TAG_NOTIFY;
                break;

            // Ignored: see the DEVIATION on addNotificationToken().
            case FriendNotification.TYPE_PLAYING_GAME:
            case FriendNotification.TYPE_FINISHED_GAME:
                return;

            default:
                throw new Error(`Unknown friend notification type: ${notification.typeCode}!`);
        }

        if(token !== null)
        {
            this._tokens.push(token);

            if(iconTag !== null && this._window !== null)
            {
                const icons = this._window.findChildByName(NewFriendEntityTab.ICONS) as IItemListWindow | null;

                if(icons !== null && icons.getListItemByTag(iconTag) === null)
                {
                    const iconElement = token.iconElement;

                    if(iconElement !== null)
                    {
                        if(iconElement.tags.indexOf(iconTag) === -1)
                        {
                            iconElement.tags.push(iconTag);
                        }

                        icons.addListItemAt(iconElement, 0);
                    }
                }
            }
        }

        if(wasSelected)
        {
            this.select(false);
        }
    }

    /**
     * `alsoFromFriend` additionally drops the notification from the friend's own list —
     * that is what makes a consumed badge stay gone across a recycle.
     */
    // AS3: .../view/tabs/NewFriendEntityTab.as::removeNotificationToken()
    removeNotificationToken(typeCode: number, alsoFromFriend: boolean): void
    {
        if(this._tokens === null)
        {
            return;
        }

        for(let i = this._tokens.length - 1; i > -1; i--)
        {
            const token = this._tokens[i]!;

            if(token.typeCode === typeCode)
            {
                this._tokens.splice(i, 1);

                if(alsoFromFriend && this._friend !== null && token.notification !== null)
                {
                    const index = this._friend.notifications.indexOf(token.notification);

                    if(index !== -1)
                    {
                        this._friend.notifications.splice(index, 1);
                    }
                }

                token.dispose();

                return;
            }
        }
    }

    // AS3: .../view/tabs/NewFriendEntityTab.as::bubbleEventProc()
    private bubbleEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK')
        {
            return;
        }

        switch(window.name)
        {
            case NewFriendEntityTab.BUBBLE_BUTTON_ACCEPT:
            case NewFriendEntityTab.BUBBLE_BUTTON_CLOSE:
            case NewFriendEntityTab.BUBBLE_CLICK_REGION_REJECT:
                this.deselect(true);
                break;
        }
    };

    // AS3: .../view/tabs/NewFriendEntityTab.as::toString()
    toString(): string
    {
        return `NewFriendEntityTab ${this._friend?.name ?? ''}`;
    }

    // Listener-shaped wrappers: AS3 passes the protected `onMouseClick`/`onMouseOver`/
    // `onMouseOut` of Tab straight to addEventListener, which takes a one-argument
    // handler here.
    private onMouseClickEvent = (event: WindowEvent): void =>
    {
        this.onMouseClick(event as WindowMouseEvent);
    };

    private onMouseOverEvent = (event: WindowEvent): void =>
    {
        this.onMouseOver(event as WindowMouseEvent);
    };

    private onMouseOutEvent = (event: WindowEvent): void =>
    {
        this.onMouseOut(event as WindowMouseEvent);
    };
}
