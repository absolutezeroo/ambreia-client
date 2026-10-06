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
import {Tab} from './Tab';
import type {Token} from './tokens/Token';
import {MessengerToken} from './tokens/MessengerToken';
import {RoomEventToken} from './tokens/RoomEventToken';
import {AchievementToken} from './tokens/AchievementToken';
import {QuestToken} from './tokens/QuestToken';

const log = Logger.getLogger('habbo.friendbar.tabs.FriendEntityTab');

/**
 * FriendEntityTab
 *
 * One friend's slot: the head, the name, the notification icons, and — once opened —
 * the real-name piece, the notification messages and the action buttons.
 *
 * Both the tabs and their windows are pooled. `allocate()` takes a recycled instance
 * when there is one, and `recycle()` strips the window back to a blank slot and returns
 * both to their pools. That is why almost nothing here is done in a constructor.
 *
 * Opening resizes the slot upward: the window keeps its bottom edge (`y = HEIGHT -
 * height`) so it grows out of the bar rather than pushing it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/view/tabs/FriendEntityTab.as
 */
export class FriendEntityTab extends Tab
{
    /** **Name derived** from its value; obfuscated in every tree. */
    // AS3: .../view/tabs/FriendEntityTab.as::ENTITY_RESOURCE
    private static readonly ENTITY_RESOURCE: string = 'entity_xml';

    /** **Name derived** from its value; obfuscated in every tree. */
    // AS3: .../view/tabs/FriendEntityTab.as::FACEBOOK_PIECE_RESOURCE
    private static readonly FACEBOOK_PIECE_RESOURCE: string = 'facebook_piece_xml';

    // AS3: .../view/tabs/FriendEntityTab.as::CONTROLS_PIECE_RESOURCE
    private static readonly CONTROLS_PIECE_RESOURCE: string = 'controls_piece_xml';

    // AS3: .../view/tabs/FriendEntityTab.as::PIECES
    protected static readonly PIECES: string = 'pieces';

    /** **Name derived** from its value. */
    // AS3: .../view/tabs/FriendEntityTab.as::ICONS
    protected static readonly ICONS: string = 'icons';

    // AS3: .../view/tabs/FriendEntityTab.as::HEADER
    protected static readonly HEADER: string = 'header';

    // AS3: .../view/tabs/FriendEntityTab.as::PROFILE
    protected static readonly PROFILE: string = 'region_profile';

    /** **Name derived** from its value. */
    // AS3: .../view/tabs/FriendEntityTab.as::FACEBOOK
    protected static readonly FACEBOOK: string = 'facebook';

    // AS3: .../view/tabs/FriendEntityTab.as::CONTROLS
    protected static readonly CONTROLS: string = 'controls';

    // AS3: .../view/tabs/FriendEntityTab.as::CANVAS
    protected static readonly CANVAS: string = 'canvas';

    // AS3: .../view/tabs/FriendEntityTab.as::NAME
    protected static readonly NAME: string = 'name';

    // AS3: .../view/tabs/FriendEntityTab.as::MESSAGE
    protected static readonly MESSAGE: string = 'btn_message';

    // AS3: .../view/tabs/FriendEntityTab.as::MESSAGE_ICON
    protected static readonly MESSAGE_ICON: string = 'icon_message';

    // AS3: .../view/tabs/FriendEntityTab.as::VISIT
    protected static readonly VISIT: string = 'btn_visit';

    // AS3: .../view/tabs/FriendEntityTab.as::ICON
    protected static readonly ICON: string = 'icon';

    // AS3: .../view/tabs/FriendEntityTab.as::LABEL
    protected static readonly LABEL: string = 'label';

    // AS3: .../view/tabs/FriendEntityTab.as::NOTIFICATION
    protected static readonly NOTIFICATION: string = 'notification';

    // AS3: .../view/tabs/FriendEntityTab.as::BTN_PROFILE
    protected static readonly BTN_PROFILE: string = 'button_profile';

    // AS3: .../view/tabs/FriendEntityTab.as::BTN_GAME
    protected static readonly BTN_GAME: string = 'btn_game';

    // AS3: .../view/tabs/FriendEntityTab.as::BUBBLE
    protected static readonly BUBBLE: string = 'bubble';

    // AS3: .../view/tabs/FriendEntityTab.as::BUBBLE_BUTTON_ACCEPT
    protected static readonly BUBBLE_BUTTON_ACCEPT: string = 'bubble_button_accept';

    /** **Name derived** from its value. */
    // AS3: .../view/tabs/FriendEntityTab.as::BUBBLE_BUTTON_CLOSE
    protected static readonly BUBBLE_BUTTON_CLOSE: string = 'bubble_button_close';

    /** **Name derived** from its value. */
    // AS3: .../view/tabs/FriendEntityTab.as::BUBBLE_CLICK_REGION_REJECT
    protected static readonly BUBBLE_CLICK_REGION_REJECT: string = 'bubble_click_region_reject';

    // AS3: .../view/tabs/FriendEntityTab.as::DEFAULT_COLOR
    private static readonly DEFAULT_COLOR: number = 0x9DBF5A;

    /** **Name derived**: the hovered counterpart of `DEFAULT_COLOR`. */
    private static readonly HOVER_COLOR: number = 0xD3F794;

    // AS3: .../view/tabs/FriendEntityTab.as::TOKEN_ICON_TAG_NOTIFY
    private static readonly TOKEN_ICON_TAG_NOTIFY: string = 'icon_tag_notify';

    // AS3: .../view/tabs/FriendEntityTab.as::TOKEN_ICON_TAG_MESSAGE
    private static readonly TOKEN_ICON_TAG_MESSAGE: string = 'icon_tag_message';

    /** Recycled tabs. **Name derived**; obfuscated in every tree. */
    // AS3: .../view/tabs/FriendEntityTab.as::_TAB_POOL
    private static readonly TAB_POOL: FriendEntityTab[] = [];

    /** Recycled slot windows. **Name derived**; obfuscated in every tree. */
    // AS3: .../view/tabs/FriendEntityTab.as::_WINDOW_POOL
    private static readonly WINDOW_POOL: IWindowContainer[] = [];

    /**
     * Takes a pooled tab when one is free, points it at `friend`, and rebuilds the
     * badges the friend already carries.
     */
    // AS3: .../view/tabs/FriendEntityTab.as::allocate()
    static allocate(friend: IFriendEntity): FriendEntityTab
    {
        const tab = FriendEntityTab.TAB_POOL.length > 0 ? FriendEntityTab.TAB_POOL.pop()! : new FriendEntityTab();

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
    // AS3: .../view/tabs/FriendEntityTab.as::purgeEntityPieces()
    private static purgeEntityPieces(window: IWindowContainer): void
    {
        const pieces = window.getChildByName(FriendEntityTab.PIECES) as IItemListWindow | null;

        if(pieces === null)
        {
            return;
        }

        pieces.getListItemByName(FriendEntityTab.FACEBOOK)?.dispose();
        pieces.getListItemByName(FriendEntityTab.CONTROLS)?.dispose();

        const notifications: IWindow[] = [];

        pieces.groupListItemsWithTag(FriendEntityTab.NOTIFICATION, notifications);

        for(const notification of notifications)
        {
            notification.parent = null;
        }

        window.height = Tab.height;
        window.y = 0;
    }

    // AS3: .../view/tabs/FriendEntityTab.as::_SafeStr_4672
    protected _friend: IFriendEntity | null = null;

    // AS3: .../view/tabs/FriendEntityTab.as::get friend()
    get friend(): IFriendEntity | null
    {
        return this._friend;
    }

    // AS3: .../view/tabs/FriendEntityTab.as::set friend()
    set friend(value: IFriendEntity | null)
    {
        this._friend = value;
        this.refresh();
    }

    // AS3: .../view/tabs/FriendEntityTab.as::_SafeStr_4733
    protected _tokens: Token[] | null = null;

    // AS3: .../view/tabs/FriendEntityTab.as::recycle()
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

        FriendEntityTab.TAB_POOL.push(this);
    }

    /**
     * Builds the opened slot: real name (when the friend has one), one row per
     * notification, then the action buttons.
     */
    // DEVIATION: AS3 swaps the visit button for a game button while the friend is playing a
    //   game-center game; the RPG fork removed Snow War and the games manager, so it stays hidden.
    // AS3: .../view/tabs/FriendEntityTab.as::select()
    override select(animate: boolean): void
    {
        if(this.selected || this._window === null || this._friend === null)
        {
            return;
        }

        const pieces = this._window.getChildByName(FriendEntityTab.PIECES) as IItemListWindow | null;

        if(pieces === null)
        {
            return;
        }

        let grew = false;

        if(this._friend.realName !== null && this._friend.realName !== '')
        {
            const piece = Tab.windowing?.buildWidgetLayout(FriendEntityTab.FACEBOOK_PIECE_RESOURCE) as IWindowContainer | null;

            if(piece !== null)
            {
                piece.name = FriendEntityTab.FACEBOOK;

                const nameWindow = piece.getChildByName(FriendEntityTab.NAME) as ITextWindow | null;

                if(nameWindow !== null)
                {
                    nameWindow.caption = this._friend.realName;

                    if(!nameWindow.wordWrap)
                    {
                        Tab.cropper?.crop(nameWindow);
                    }
                }

                const icon = piece.getChildByName(FriendEntityTab.ICON) as IBitmapWrapperWindow | null;

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
            const controls = Tab.windowing?.buildWidgetLayout(FriendEntityTab.CONTROLS_PIECE_RESOURCE) as IWindowContainer | null;

            if(controls !== null)
            {
                controls.name = FriendEntityTab.CONTROLS;

                controls.getChildByName(FriendEntityTab.MESSAGE)?.addEventListener(WindowMouseEvent.CLICK, this.onButtonClick);

                // The game button stays hidden: see the DEVIATION on select().
                const gameButton = controls.getChildByName(FriendEntityTab.BTN_GAME);

                if(gameButton !== null)
                {
                    gameButton.visible = false;
                }

                const visitButton = controls.getChildByName(FriendEntityTab.VISIT);

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

                controls.getChildByName(FriendEntityTab.BTN_PROFILE)?.addEventListener(WindowMouseEvent.CLICK, this.onButtonClick);

                pieces.addListItem(controls);
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
    // AS3: .../view/tabs/FriendEntityTab.as::deselect()
    override deselect(animate: boolean): void
    {
        if(this.selected)
        {
            if(this._window !== null)
            {
                FriendEntityTab.purgeEntityPieces(this._window);

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
        const bubble = this._window?.findChildByName(FriendEntityTab.BUBBLE) ?? null;

        if(bubble !== null)
        {
            bubble.visible = false;
        }
    }

    // AS3: .../view/tabs/FriendEntityTab.as::expose()
    protected override expose(): void
    {
        super.expose();

        this.applyHoverStyle();
    }

    // AS3: .../view/tabs/FriendEntityTab.as::conceal()
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

        this._window.color = this.exposed ? FriendEntityTab.HOVER_COLOR : FriendEntityTab.DEFAULT_COLOR;

        const label = this._window.findChildByTag(FriendEntityTab.LABEL) as ITextWindow | null;

        if(label !== null)
        {
            label.underline = this.exposed;
        }
    }

    // AS3: .../view/tabs/FriendEntityTab.as::refresh()
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

        this._window.id = this._friend.id;

        const pieces = this._window.getChildByName(FriendEntityTab.PIECES) as IItemListWindow | null;
        const header = pieces?.getListItemByName(FriendEntityTab.HEADER) as IWindowContainer | null;

        if(header === null || header === undefined)
        {
            return;
        }

        const nameWindow = header.findChildByName(FriendEntityTab.NAME);

        if(nameWindow !== null)
        {
            nameWindow.caption = this._friend.name;
        }

        const nameText = header.getChildByName(FriendEntityTab.NAME) as ITextWindow | null;

        if(nameText !== null)
        {
            Tab.cropper?.crop(nameText);
        }

        const canvas = header.findChildByName(FriendEntityTab.CANVAS) as IBitmapWrapperWindow | null;

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

    // AS3: .../view/tabs/FriendEntityTab.as::allocateFriendTabWindow()
    private allocateFriendTabWindow(): IWindowContainer | null
    {
        const window = FriendEntityTab.WINDOW_POOL.length > 0
            ? FriendEntityTab.WINDOW_POOL.pop()!
            : Tab.windowing?.buildWidgetLayout(FriendEntityTab.ENTITY_RESOURCE) as IWindowContainer | null;

        if(window === null || window === undefined)
        {
            log.error(`allocateFriendTabWindow: layout "${FriendEntityTab.ENTITY_RESOURCE}" is not registered`);

            return null;
        }

        window.x = 0;
        window.y = 0;
        window.width = Tab.width;
        window.height = Tab.height;

        window.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
        window.addEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
        window.addEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);

        const header = window.findChildByName(FriendEntityTab.HEADER);

        if(header !== null)
        {
            header.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
            header.addEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
            header.addEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);
        }

        const profile = window.findChildByName(FriendEntityTab.PROFILE) as IRegionWindow | null;

        if(profile !== null)
        {
            const interactive = profile as unknown as IInteractiveWindow;

            (profile as unknown as IWindow).addEventListener(WindowMouseEvent.CLICK, this.onProfileMouseEvent);
            interactive.toolTipCaption = Tab.localization?.getLocalization('infostand.profile.link.tooltip', '') ?? '';
            interactive.toolTipDelay = 100;
        }

        const icons = window.findChildByName(FriendEntityTab.ICONS);

        if(icons !== null)
        {
            icons.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
            icons.addEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
            icons.addEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);
        }

        const canvas = window.findChildByName(FriendEntityTab.CANVAS) as IBitmapWrapperWindow | null;

        if(canvas !== null)
        {
            canvas.disposesBitmap = true;
        }

        const bubble = window.findChildByName(FriendEntityTab.BUBBLE);

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
    // AS3: .../view/tabs/FriendEntityTab.as::releaseFriendTabWindow()
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

        const header = window.findChildByName(FriendEntityTab.HEADER);

        if(header !== null)
        {
            header.removeEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
            header.removeEventListener(WindowMouseEvent.OVER, this.onMouseOverEvent);
            header.removeEventListener(WindowMouseEvent.OUT, this.onMouseOutEvent);
        }

        const icons = window.findChildByName(FriendEntityTab.ICONS);

        if(icons !== null)
        {
            icons.removeEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
            icons.removeEventListener(WindowMouseEvent.OVER, this.onMouseClickEvent);
            icons.removeEventListener(WindowMouseEvent.OUT, this.onMouseClickEvent);
        }

        const profile = window.findChildByName(FriendEntityTab.PROFILE);

        if(profile !== null)
        {
            profile.removeEventListener(WindowMouseEvent.CLICK, this.onProfileMouseEvent);
        }

        window.width = Tab.width;
        window.height = Tab.height;
        window.color = FriendEntityTab.DEFAULT_COLOR;

        const canvas = window.findChildByName(FriendEntityTab.CANVAS) as IBitmapWrapperWindow | null;

        if(canvas !== null)
        {
            canvas.bitmap = null;
        }

        const label = window.findChildByTag(FriendEntityTab.LABEL) as ITextWindow | null;

        if(label !== null)
        {
            label.underline = false;
        }

        FriendEntityTab.purgeEntityPieces(window);

        if(FriendEntityTab.WINDOW_POOL.indexOf(window) === -1)
        {
            FriendEntityTab.WINDOW_POOL.push(window);
        }
    }

    // DEVIATION: AS3 also handles the game button / game icon / game-invite icon; the RPG fork
    //   removed Snow War and the games manager.
    // AS3: .../view/tabs/FriendEntityTab.as::onButtonClick()
    private onButtonClick = (event: WindowEvent): void =>
    {
        if(this.disposed || this.recycled)
        {
            return;
        }

        const name = (event as WindowMouseEvent).window?.name ?? '';

        switch(name)
        {
            case FriendEntityTab.MESSAGE:
            case FriendEntityTab.MESSAGE_ICON:
                Tab.view?.removeMessengerNotifications();

                if(Tab.data !== null && this._friend !== null)
                {
                    Tab.data.startConversation(this._friend.id);
                    this.deselect(true);

                    if(name === FriendEntityTab.MESSAGE_ICON)
                    {
                        Tab.view?.setMessengerIconNotify(false);
                    }
                }

                break;

            case FriendEntityTab.VISIT:
                if(Tab.data !== null && this._friend !== null)
                {
                    Tab.data.followToRoom(this._friend.id);
                    this.deselect(true);
                }

                break;

            case FriendEntityTab.BTN_PROFILE:
                if(Tab.data !== null && this._friend !== null)
                {
                    Tab.tracking?.trackGoogle('extendedProfile', 'friendToolbar_friendButton');
                    Tab.data.showProfile(this._friend.id);
                    this.deselect(true);
                }

                break;
        }
    };

    // AS3: .../view/tabs/FriendEntityTab.as::onProfileMouseEvent()
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
    // AS3: .../view/tabs/FriendEntityTab.as::addNotificationToken()
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
            case FriendNotification.TYPE_MESSENGER:
                token = new MessengerToken(this._friend!, notification);

                if(token.iconElement !== null)
                {
                    token.iconElement.name = FriendEntityTab.MESSAGE_ICON;
                    token.iconElement.addEventListener(WindowMouseEvent.CLICK, this.onButtonClick);
                }

                iconTag = FriendEntityTab.TOKEN_ICON_TAG_MESSAGE;
                break;

            case FriendNotification.TYPE_ROOM_EVENT:
                token = new RoomEventToken(this._friend!, notification);
                token.iconElement?.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
                iconTag = FriendEntityTab.TOKEN_ICON_TAG_NOTIFY;
                break;

            case FriendNotification.TYPE_ACHIEVEMENT:
                token = new AchievementToken(this._friend!, notification, Tab.localization!);
                token.iconElement?.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
                iconTag = FriendEntityTab.TOKEN_ICON_TAG_NOTIFY;
                break;

            case FriendNotification.TYPE_QUEST:
                token = new QuestToken(this._friend!, notification);
                token.iconElement?.addEventListener(WindowMouseEvent.CLICK, this.onMouseClickEvent);
                iconTag = FriendEntityTab.TOKEN_ICON_TAG_NOTIFY;
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
                const icons = this._window.findChildByName(FriendEntityTab.ICONS) as IItemListWindow | null;

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
    // AS3: .../view/tabs/FriendEntityTab.as::removeNotificationToken()
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

    // AS3: .../view/tabs/FriendEntityTab.as::bubbleEventProc()
    private bubbleEventProc = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type !== 'WME_CLICK')
        {
            return;
        }

        switch(window.name)
        {
            case FriendEntityTab.BUBBLE_BUTTON_ACCEPT:
            case FriendEntityTab.BUBBLE_BUTTON_CLOSE:
            case FriendEntityTab.BUBBLE_CLICK_REGION_REJECT:
                this.deselect(true);
                break;
        }
    };

    // AS3: .../view/tabs/FriendEntityTab.as::toString()
    toString(): string
    {
        return `FriendEntityTab ${this._friend?.name ?? ''}`;
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
