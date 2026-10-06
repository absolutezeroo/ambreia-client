import type {IDisposable} from '@core/runtime/IDisposable';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {Logger} from '@core/utils/Logger';

import type {IIlluminaChatBubbleWidget} from '@habbo/window/widgets/IIlluminaChatBubbleWidget';
import type {IIlluminaInputWidget} from '@habbo/window/widgets/IIlluminaInputWidget';
import type {IIlluminaInputHandler} from '@habbo/window/widgets/IIlluminaInputHandler';
import type {IAvatarImageWidget} from '@habbo/window/widgets/IAvatarImageWidget';
import type {IBadgeImageWidget} from '@habbo/window/widgets/IBadgeImageWidget';
import {ChatBubbleMessage} from '@habbo/window/widgets/ChatBubbleMessage';

import {
    FollowFriendMessageComposer
} from '@habbo/communication/messages/outgoing/friendlist/FollowFriendMessageComposer';
import {SendMsgMessageComposer} from '@habbo/communication/messages/outgoing/friendlist/SendMsgMessageComposer';
import {
    GetMessengerHistoryComposer
} from '@habbo/communication/messages/outgoing/friendlist/GetMessengerHistoryComposer';
import {
    GetExtendedProfileMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import {
    GetHabboGroupDetailsMessageComposer
} from '@habbo/communication/messages/outgoing/users/GetHabboGroupDetailsMessageComposer';
import {EventLogMessageComposer} from '@habbo/communication/messages/outgoing/tracking/EventLogMessageComposer';

import {ChatEntry} from './ChatEntry';
import type {HabboMessenger} from './HabboMessenger';
import type {HistoryMessageEntry} from '@habbo/communication/messages/parser/friendlist/ConsoleMessageHistoryEventParser';

const log = Logger.getLogger('habbo.messenger.MainView');

/**
 * The messenger window: the avatar strip along the top, the conversation below it, and the
 * input row at the bottom.
 *
 * One window serves every conversation. `_chatEntries` holds them all keyed by chat id — a
 * positive id is a friend, a negative one a group — and `_selectedChatId` decides which is
 * on screen. Switching conversations throws the item list away and rebuilds it from the
 * back, which is what `scrollBack()` does.
 *
 * Two details are load-bearing and easy to mistake for noise. Conversations are never
 * removed, only tagged `HIDDEN`: `hideConversation()` tags, and every count in this class
 * walks the strip counting untagged children rather than reading a length. And an outgoing
 * message is shown before the server has seen it, carrying a client-side id that
 * `onConfirmOwnChatMessage()` later swaps for the real one — so the same message must not
 * be recorded twice, which is what `_seenMessageIds` guards.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/messenger/MainView.as
 */
export class MainView implements IDisposable, IIlluminaInputHandler
{
    // AS3: .../messenger/MainView.as::HIDDEN
    private static readonly HIDDEN: string = 'HIDDEN';

    // AS3: .../messenger/MainView.as::NO_CONVERSATION
    private static readonly NO_CONVERSATION: number = -1;

    // AS3: .../messenger/MainView.as::NOTIFICATION_ICON_WIDTH
    private static readonly NOTIFICATION_ICON_WIDTH: number = 55;

    // AS3: .../messenger/MainView.as::SCROLL_TRIGGER_HEIGHT
    private static readonly SCROLL_TRIGGER_HEIGHT: number = 150;

    /** Two messages further apart than this never merge into one bubble. */
    // AS3: .../messenger/MainView.as::COMBINE_MESSAGING_THRESHOLD
    private static readonly COMBINE_MESSAGING_THRESHOLD: number = 600000;

    // AS3: .../messenger/MainView.as::CHAT_ITEM_RENDER_MAX_BUNDLE_SIZE
    private static readonly CHAT_ITEM_RENDER_MAX_BUNDLE_SIZE: number = 3;

    // AS3: .../messenger/MainView.as::CHAT_ITEM_RENDER_MAX_MESSAGES_SIZE
    private static readonly CHAT_ITEM_RENDER_MAX_MESSAGES_SIZE: number = 7;

    // AS3: .../messenger/MainView.as::CHAT_ITEM_INITIAL_MULTIPLIER
    private static readonly CHAT_ITEM_INITIAL_MULTIPLIER: number = 3;

    /**
     * Fetch more history once fewer than this many entries remain above the rendered
     * window. **Name derived**; obfuscated in every tree.
     */
    // AS3: .../messenger/MainView.as::HISTORY_PREFETCH_THRESHOLD
    private static readonly HISTORY_PREFETCH_THRESHOLD: number = 40;

    /**
     * Do not re-ask for the same history page inside this many milliseconds.
     * **Name derived**; obfuscated in every tree.
     */
    // AS3: .../messenger/MainView.as::HISTORY_REFETCH_INTERVAL
    private static readonly HISTORY_REFETCH_INTERVAL: number = 4000;

    /** The close button's style id, applied to the frame's header button. */
    // AS3: .../messenger/MainView.as::MainView()
    private static readonly CLOSE_BUTTON_STYLE: number = 102;

    /**
     * The instant-message failures the window turns into a notification line. AS3 keys a
     * Dictionary by the wire's error code; anything not listed is dropped in silence.
     */
    // AS3: .../messenger/MainView.as::ERROR_MESSAGES
    private static readonly ERROR_MESSAGES: ReadonlyMap<number, string> = new Map<number, string>([
        [3, '${messenger.error.receivermuted}'],
        [4, '${messenger.error.sendermuted}'],
        [5, '${messenger.error.offline}'],
        [6, '${messenger.error.notfriend}'],
        [7, '${messenger.error.busy}'],
        [8, '${messenger.error.receiverhasnochat}'],
        [9, '${messenger.error.senderhasnochat}'],
        [10, '${messenger.error.offline_failed}'],
        [11, '${messenger.error.not_group_member}'],
        [12, '${messenger.error.not_group_admin}'],
        [13, '${messenger.error.sender_im_unavailable}'],
        [14, '${messenger.error.recipient_im_unavailable}']
    ]);

    // DEVIATION: AS3 shows the `habbicon_button` that opens the habbicon picker; the RPG fork
    //   removed Habbicons, so the button is hidden.
    // AS3: .../messenger/MainView.as::MainView()
    constructor(messenger: HabboMessenger)
    {
        this._messenger = messenger;

        const window = messenger.getXmlWindow('messenger') as IWindowContainer | null;

        if(window === null)
        {
            log.error('MainView: the "messenger" layout is not registered - the chat window cannot be built');

            return;
        }

        this._window = window;
        this._frame = window.getChildByName('frame') as IWindowContainer | null;

        (window as unknown as IWindow).visible = false;
        (window as unknown as IWindow).procedure = this._windowProcedure;

        const frame = this._frame;

        if(frame === null)
        {
            log.error('MainView: the "messenger" layout has no "frame" child');

            return;
        }

        // The RPG fork removed Habbicons; the layout still ships the picker's button until Task 10
        // of the M0 cleanup takes it out of the zip.
        const habbiconButton = frame.findChildByName('habbicon_button');

        if(habbiconButton !== null) habbiconButton.visible = false;

        const close = frame.findChildByName('header_button_close');

        if(close !== null)
        {
            close.style = MainView.CLOSE_BUTTON_STYLE;
        }

        this._avatarList = frame.findChildByName('avatar_list') as IWindowContainer | null;

        // The strip ships with one avatar in it. That child is the template every later
        // conversation is cloned from, so it comes straight back out of the strip.
        if(this._avatarList !== null && this._avatarList.numChildren > 0)
        {
            this._avatarTemplate = this._avatarList.getChildAt(0) as IWindowContainer | null;

            if(this._avatarTemplate !== null)
            {
                this._avatarList.removeChild(this._avatarTemplate as unknown as IWindow);
            }
        }

        this._firstVisibleAvatar = 0;

        const conversation = frame.findChildByName('conversation') as IItemListWindow | null;

        this._conversation = conversation;

        if(conversation !== null)
        {
            // Four row templates, one per ChatEntry type. AS3 keeps the references and
            // clears the list, rather than removing them one at a time.
            this._normalTemplate = conversation.getListItemByName('msg_normal') as IWidgetWindow | null;
            this._notificationTemplate = conversation.getListItemByName('msg_notification') as IWindowContainer | null;
            this._invitationTemplate = conversation.getListItemByName('msg_invitation') as IWindowContainer | null;
            this._infoTemplate = conversation.getListItemByName('msg_info') as IWindowContainer | null;

            conversation.removeListItems();
        }

        this._renderedFrom = -1;

        const input = frame.findChildByName('input_widget') as IWidgetWindow | null;
        const inputWidget = input?.widget as IIlluminaInputWidget | null ?? null;

        if(inputWidget !== null)
        {
            inputWidget.submitHandler = this;
        }
    }

    // AS3: .../messenger/MainView.as::_messenger
    private _messenger: HabboMessenger | null = null;

    // AS3: .../messenger/MainView.as::_SafeStr_5010
    private _window: IWindowContainer | null = null;

    // AS3: .../messenger/MainView.as::_frame
    private _frame: IWindowContainer | null = null;

    /** The conversation's item list. **Name derived**; obfuscated in every tree. */
    // AS3: .../messenger/MainView.as::_conversation
    private _conversation: IItemListWindow | null = null;

    /** The avatar strip along the top. **Name derived**; obfuscated in every tree. */
    // AS3: .../messenger/MainView.as::_avatarList
    private _avatarList: IWindowContainer | null = null;

    /** The avatar entry the strip shipped with, cloned per conversation. **Name derived**. */
    // AS3: .../messenger/MainView.as::_avatarTemplate
    private _avatarTemplate: IWindowContainer | null = null;

    /** Index of the leftmost avatar drawn; the strip scrolls by entry, not by pixel. */
    // AS3: .../messenger/MainView.as::_firstVisibleAvatar
    private _firstVisibleAvatar: number = 0;

    /** True when the strip ran out of width before the last avatar. **Name derived**. */
    // AS3: .../messenger/MainView.as::_avatarsOverflow
    private _avatarsOverflow: boolean = false;

    // AS3: .../messenger/MainView.as::_chatEntries
    private _chatEntries: Map<number, ChatEntry[]> = new Map<number, ChatEntry[]>();

    // AS3: .../messenger/MainView.as::_SafeStr_4622
    private _selectedChatId: number = MainView.NO_CONVERSATION;

    /** Row templates, one per ChatEntry type. **Names derived** from the list item names. */
    // AS3: .../messenger/MainView.as::_normalTemplate
    private _normalTemplate: IWidgetWindow | null = null;

    // AS3: .../messenger/MainView.as::_notificationTemplate
    private _notificationTemplate: IWindowContainer | null = null;

    // AS3: .../messenger/MainView.as::_invitationTemplate
    private _invitationTemplate: IWindowContainer | null = null;

    // AS3: .../messenger/MainView.as::_infoTemplate
    private _infoTemplate: IWindowContainer | null = null;

    /** Set while this class is the one moving the scroll, to ignore its own relocations. */
    // AS3: .../messenger/MainView.as::_SafeStr_5989
    private _scrollingSelf: boolean = false;

    /** The moderation blurb is inserted once per session, not once per conversation. */
    // AS3: .../messenger/MainView.as::_SafeStr_9566
    private _moderationInfoShown: boolean = false;

    /** Client-side id stamped on an outgoing message until the server echoes it back. */
    // AS3: .../messenger/MainView.as::_SafeStr_6222
    private _nextClientMessageId: number = 1;

    // AS3: .../messenger/MainView.as::_awaitConfirmationEntries
    private _awaitConfirmationEntries: Map<number, ChatEntry> = new Map<number, ChatEntry>();

    /** Index into the selected conversation of the oldest entry currently rendered. */
    // AS3: .../messenger/MainView.as::_SafeStr_5040
    private _renderedFrom: number = -1;

    // AS3: .../messenger/MainView.as::_historyFetchesTimestamps
    private _historyFetchesTimestamps: Map<number, {messageId: string; time: number}> =
        new Map<number, {messageId: string; time: number}>();

    /** Every message id already recorded, so a confirmation cannot duplicate its message. */
    // AS3: .../messenger/MainView.as::_SafeStr_6230
    private _seenMessageIds: Set<string> = new Set<string>();

    /**
     * A conversation is hidden by tagging its avatar, never by removing it — the entries
     * stay in `_chatEntries` and the tab comes back the moment a message arrives.
     */
    // AS3: .../messenger/MainView.as::avatarVisible()
    private static avatarVisible(window: IWindow | null): boolean
    {
        return window !== null && window.tags.indexOf(MainView.HIDDEN) < 0;
    }

    // AS3: .../messenger/MainView.as::setAvatarVisibilityTag()
    private static setAvatarVisibilityTag(window: IWindow | null, visible: boolean): void
    {
        if(window === null)
        {
            return;
        }

        const currentlyVisible = MainView.avatarVisible(window);

        if(currentlyVisible && !visible)
        {
            window.tags.push(MainView.HIDDEN);
        }
        else if(!currentlyVisible && visible)
        {
            window.tags.splice(window.tags.indexOf(MainView.HIDDEN), 1);
        }
    }

    /**
     * A message that opens with `${` would be read as a localization key by the caption
     * layer and replaced with a text the player never typed. A leading space stops the
     * lookup without changing what they see.
     */
    // AS3: .../messenger/MainView.as::escapeExternalKeys()
    private static escapeExternalKeys(text: string): string
    {
        return text.search(/\$\{/) === 0 ? ` ${text}` : text;
    }

    // AS3: .../messenger/MainView.as::isWindowInTree()
    private static isWindowInTree(window: IWindow | null, root: IWindow | null): boolean
    {
        let current = window;

        while(current !== null)
        {
            if(current === root)
            {
                return true;
            }

            current = current.parent as unknown as IWindow | null;
        }

        return false;
    }

    // AS3: .../messenger/MainView.as::get disposed()
    get disposed(): boolean
    {
        return this._messenger === null;
    }

    // AS3: .../messenger/MainView.as::get isOpen()
    get isOpen(): boolean
    {
        return this._window !== null && (this._window as unknown as IWindow).visible;
    }

    // AS3: .../messenger/MainView.as::toggle()
    toggle(): void
    {
        if(this.isOpen)
        {
            this.hide();
        }
        else
        {
            this.show();
        }
    }

    /**
     * `force` is what a click on a friend passes: without it the window refuses to open on
     * an empty avatar strip, which is what stops an incoming message from popping a window
     * for a conversation the player closed.
     */
    // AS3: .../messenger/MainView.as::show()
    show(force: boolean = false): void
    {
        if(this._window === null)
        {
            return;
        }

        if(force || this.visibleAvatarCount > 0)
        {
            (this._window as unknown as IWindow).visible = true;
            this._window.activate();
        }

        if(this._selectedChatId !== MainView.NO_CONVERSATION)
        {
            this.setChatIndicatorVisibility(this._selectedChatId, false);
        }
    }

    // DEVIATION: AS3 also hides the habbicon picker; the RPG fork removed Habbicons.
    // AS3: .../messenger/MainView.as::hide()
    hide(): void
    {
        if(this._window !== null)
        {
            (this._window as unknown as IWindow).visible = false;
        }
    }

    // DEVIATION: AS3 hides the habbicon picker here, the only transient selector the messenger
    //   has; the RPG fork removed Habbicons, so nothing is left to hide.
    // AS3: .../messenger/MainView.as::hideTransientSelectors()
    hideTransientSelectors(): void
    {
    }

    /**
     * Opens a conversation, building its avatar tab the first time it is asked for.
     *
     * `chatEntry` is only read when the friend is not on the friend list — a staff member,
     * or someone who wrote first — in which case the messenger builds a DummyFriend out of
     * the entry's sender fields.
     */
    // AS3: .../messenger/MainView.as::startConversation()
    startConversation(chatId: number, select: boolean = true, chatEntry: ChatEntry | null = null): void
    {
        if(!this._chatEntries.has(chatId))
        {
            this._chatEntries.set(chatId, []);

            if(!this._moderationInfoShown)
            {
                this.recordNotificationMessage(chatId, '${messenger.moderationinfo}');
                this._moderationInfoShown = true;
            }

            const friend = this._messenger?.getFriend(chatId, chatEntry) ?? null;

            if(friend === null)
            {
                log.warn(`startConversation: no friend and no sender data for chat ${chatId} - the conversation cannot be opened`);

                return;
            }

            if(!friend.online)
            {
                this.recordNotificationMessage(chatId, '${messenger.notification.persisted_messages}');
            }

            const entry = this._avatarTemplate?.clone() as IWindowContainer | null;

            if(entry === null || entry === undefined)
            {
                log.warn('startConversation: the avatar strip shipped no template to clone');

                return;
            }

            const entryWindow = entry as unknown as IWindow;

            MainView.setAvatarVisibilityTag(entryWindow, true);
            entryWindow.blend = 0;
            entryWindow.id = chatId;

            // A group's id is negative, and `getChildByID` would not tell two of them
            // apart from the sign alone, so the name carries it as well.
            if(chatId < 0)
            {
                entryWindow.name = String(chatId);
            }

            const avatarImage = entry.findChildByName('avatar_image') as IWidgetWindow | null;
            const groupBadge = entry.findChildByName('group_badge_image') as IWidgetWindow | null;

            if(friend.id > 0)
            {
                const avatar = avatarImage?.widget as IAvatarImageWidget | null ?? null;

                if(avatar !== null)
                {
                    avatar.figure = friend.figure;
                }

                if(groupBadge !== null)
                {
                    (groupBadge as unknown as IWindow).visible = false;
                }

                if(avatarImage !== null)
                {
                    (avatarImage as unknown as IWindow).visible = true;
                }
            }
            else
            {
                // A group conversation reuses `figure` to carry the badge code.
                const badge = groupBadge?.widget as IBadgeImageWidget | null ?? null;

                if(badge !== null)
                {
                    badge.badgeId = friend.figure;
                    badge.groupId = friend.id;
                }

                if(groupBadge !== null)
                {
                    (groupBadge as unknown as IWindow).visible = true;
                }

                if(avatarImage !== null)
                {
                    (avatarImage as unknown as IWindow).visible = false;
                }
            }

            const region = entry.findChildByName('avatar_click_region') as IRegionWindow | null;

            if(region !== null)
            {
                region.toolTipCaption = friend.name;
            }

            this._avatarList?.addChild(entryWindow);
            this.refreshAvatarList();
        }

        if(select || !this.isOpen)
        {
            this.selectConversation(chatId);
        }

        this.refreshChatCount(select);
    }

    /**
     * Parameter order is AS3's — `secondsSinceSent` fifth and `senderId` eighth, which is
     * the order `HabboMessenger.onNewConsoleMessage()` reads them off the parser in.
     */
    // AS3: .../messenger/MainView.as::addConsoleMessage()
    addConsoleMessage(
        chatId: number,
        messageType: number,
        message: string,
        habbiconId: number,
        secondsSinceSent: number,
        messageId: string,
        clientMessageId: number,
        senderId: number,
        senderName: string,
        senderFigure: string
    ): void
    {
        const bubble = MainView.createBubbleMessage(messageType, message, habbiconId);

        if(clientMessageId > 0)
        {
            this.onConfirmOwnChatMessage(messageId, bubble, clientMessageId);
        }
        else
        {
            this.recordChatMessage(chatId, bubble, true, secondsSinceSent, senderId, senderName, senderFigure, messageId);
        }
    }

    // AS3: .../messenger/MainView.as::addRoomInvite()
    addRoomInvite(senderId: number, text: string): void
    {
        const prefix = this._messenger?.getText('messenger.invitation') ?? '';

        this.recordInvitationMessage(senderId, `${prefix} ${text}`, true);
    }

    /**
     * Only the strip needs redrawing: the follow button lives in it and its enabled state
     * is read at arrange time.
     */
    // AS3: .../messenger/MainView.as::setFollowingAllowed()
    setFollowingAllowed(userId: number, _allowed: boolean): void
    {
        if(userId === this._selectedChatId)
        {
            this.refreshButtons();
        }
    }

    /**
     * The error text goes in as a token, except when the server sent a detail to append —
     * then the braces are stripped and the key resolved here, because a token cannot carry
     * a suffix.
     */
    // AS3: .../messenger/MainView.as::onInstantMessageError()
    onInstantMessageError(chatId: number, errorCode: number, detail: string): void
    {
        const token = MainView.ERROR_MESSAGES.get(errorCode);

        if(token === undefined)
        {
            log.warn(`onInstantMessageError: no text for messenger error code ${errorCode} - the failure is not shown to the player`);

            return;
        }

        if(detail.length > 0)
        {
            const key = token.replace(/[${}]/g, '');

            this.recordNotificationMessage(chatId, `${this._messenger?.getText(key) ?? key}: ${detail}`);
        }
        else
        {
            this.recordNotificationMessage(chatId, token);
        }
    }

    // AS3: .../messenger/MainView.as::setOnlineStatus()
    setOnlineStatus(chatId: number, online: boolean): void
    {
        if(this._chatEntries.has(chatId))
        {
            this.recordInfoMessage(
                chatId,
                online ? '${messenger.notification.online}' : '${messenger.notification.offline}'
            );
        }
    }

    /**
     * History arrives oldest-first and is prepended, so an entry already recorded from the
     * live stream must not come back — hence the `_seenMessageIds` filter before anything
     * is built. `_renderedFrom` is an index into the conversation, so prepending shifts it.
     */
    // AS3: .../messenger/MainView.as::loadMessageHistory()
    loadMessageHistory(chatId: number, fragment: HistoryMessageEntry[]): void
    {
        const ownId = this._messenger?.sessionDataManager?.userId ?? 0;
        const fresh: ChatEntry[] = [];

        for(const item of fragment)
        {
            if(this._seenMessageIds.has(item.messageId))
            {
                continue;
            }

            fresh.push(new ChatEntry(
                item.senderId === ownId ? ChatEntry.TYPE_OWN_CHAT : ChatEntry.TYPE_OTHER_CHAT,
                chatId,
                MainView.createBubbleMessage(item.messageType, item.message, item.habbiconId),
                item.secondsSinceSent,
                item.senderId,
                item.senderName,
                item.senderFigure,
                item.messageId
            ));
        }

        if(fresh.length === 0)
        {
            return;
        }

        const existing = this._chatEntries.get(chatId) ?? [];

        this._chatEntries.set(chatId, fresh.concat(existing));

        if(chatId === this._selectedChatId)
        {
            if(this._renderedFrom !== -1)
            {
                this._renderedFrom += fresh.length;
            }

            this.addMissingChatEntries();
        }
    }

    // AS3: .../messenger/MainView.as::hideConversation()
    hideConversation(chatId: number): void
    {
        const wrapper = this.getAvatarWrapper(chatId);

        if(wrapper !== null)
        {
            MainView.setAvatarVisibilityTag(wrapper, false);
        }

        if(this.visibleAvatarCount === 0)
        {
            this.selectConversation(MainView.NO_CONVERSATION);
            this.hide();
        }
        else
        {
            for(const child of this.avatarChildren())
            {
                if(MainView.avatarVisible(child))
                {
                    this._firstVisibleAvatar = 0;
                    this.selectConversation(child.id);

                    break;
                }
            }
        }

        this.refreshChatCount();
    }

    /**
     * Submitted text from the input row.
     *
     * The message is recorded locally before the server has acknowledged it, carrying the
     * client id the confirmation will arrive with.
     */
    // AS3: .../messenger/MainView.as::onInput()
    onInput(widget: IWidgetWindow, message: string): void
    {
        if(message === '' || this._messenger === null)
        {
            return;
        }

        const clientMessageId = this._nextClientMessageId;

        this._nextClientMessageId += 1;

        this._messenger.send(new SendMsgMessageComposer(this._selectedChatId, message, clientMessageId));

        const input = widget.widget as IIlluminaInputWidget | null ?? null;

        if(input !== null)
        {
            input.message = '';
        }
        else
        {
            log.warn(`onInput: submitting widget "${widget.name}" carries no input widget - the box will not clear`);
        }

        this.playSendSoundIfConversationIsEmpty();

        const session = this._messenger.sessionDataManager;

        this.recordChatMessage(
            this._selectedChatId,
            ChatBubbleMessage.text(MainView.escapeExternalKeys(message)),
            false,
            0,
            session?.userId ?? 0,
            session?.userName ?? '',
            session?.figure ?? '',
            '',
            clientMessageId
        );
    }

    // AS3: .../messenger/MainView.as::selectConversation()
    private selectConversation(chatId: number): void
    {
        this._selectedChatId = chatId;

        MainView.setAvatarVisibilityTag(this.getAvatarWrapper(chatId), true);
        this.setChatIndicatorVisibility(chatId, false);
        this.refreshConversationList();
        this.refreshAvatarList();

        const friend = this._messenger?.getFriend(this._selectedChatId) ?? null;
        const name = friend !== null ? friend.name : '';
        const separator = this._frame?.findChildByName('separator_label') ?? null;

        if(separator !== null)
        {
            separator.visible = this._selectedChatId < 0 || friend !== null;
        }

        const localization = this._messenger?.localization ?? null;

        localization?.registerParameter('messenger.window.separator', 'friend_name', name);
        localization?.registerParameter('messenger.window.input.default', 'friend_name', name);

        (this._frame as unknown as IWindow | null)?.invalidate();
    }

    // AS3: .../messenger/MainView.as::refreshChatCount()
    private refreshChatCount(suppressUnread: boolean = false): void
    {
        const count = this.visibleAvatarCount;

        this._messenger?.localization?.registerParameter('messenger.window.title', 'open_chat_count', String(count));
        this._messenger?.conversationCountUpdated(count, this.hasUnreadChat && !suppressUnread);
    }

    // AS3: .../messenger/MainView.as::createBubbleMessage()
    private static createBubbleMessage(messageType: number, text: string, habbiconId: number): ChatBubbleMessage
    {
        return messageType === ChatBubbleMessage.TYPE_HABBICON
            ? ChatBubbleMessage.habbicon(habbiconId)
            : ChatBubbleMessage.text(text);
    }

    // AS3: .../messenger/MainView.as::recordChatMessage()
    private recordChatMessage(
        chatId: number,
        message: ChatBubbleMessage,
        fromOther: boolean,
        secondsSinceSent: number,
        senderId: number,
        senderName: string | null,
        senderFigure: string | null,
        messageId: string = '',
        clientMessageId: number = 0
    ): void
    {
        if(fromOther)
        {
            this.recordChatEntry(
                chatId,
                new ChatEntry(ChatEntry.TYPE_OTHER_CHAT, chatId, message, secondsSinceSent, senderId, senderName, senderFigure, messageId),
                true
            );

            return;
        }

        const entry = new ChatEntry(
            ChatEntry.TYPE_OWN_CHAT, chatId, message, secondsSinceSent, senderId, senderName, senderFigure, messageId, clientMessageId
        );

        if(clientMessageId > 0)
        {
            this._awaitConfirmationEntries.set(clientMessageId, entry);
        }

        this.recordChatEntry(chatId, entry);
    }

    /**
     * The server echoed one of our own messages back with its real id. The optimistic entry
     * takes that id, and the bubble already on screen is found by walking every rendered
     * row for the client id it was stamped with — the row index is not tracked anywhere.
     */
    // AS3: .../messenger/MainView.as::onConfirmOwnChatMessage()
    private onConfirmOwnChatMessage(messageId: string, message: ChatBubbleMessage, clientMessageId: number): void
    {
        const entry = this._awaitConfirmationEntries.get(clientMessageId) ?? null;

        if(entry === null)
        {
            return;
        }

        entry.isConfirmed(message, messageId);
        this._seenMessageIds.add(messageId);

        const list = this._conversation;

        if(list !== null)
        {
            let done = false;

            for(let i = 0; i < list.numListItems && !done; i++)
            {
                const bubble = (list.getListItemAt(i) as IWidgetWindow | null)?.widget as IIlluminaChatBubbleWidget | null ?? null;

                if(bubble === null)
                {
                    continue;
                }

                for(let m = 0; m < bubble.numMessages; m++)
                {
                    if(bubble.getAwaitingConfirmationId(m) === clientMessageId)
                    {
                        bubble.clearAwaitingConfirmationId(m);
                        bubble.setMessage(m, message);
                        done = true;

                        break;
                    }
                }
            }
        }

        this._awaitConfirmationEntries.delete(clientMessageId);
    }

    // AS3: .../messenger/MainView.as::recordNotificationMessage()
    private recordNotificationMessage(chatId: number, text: string): void
    {
        this.recordChatEntry(chatId, new ChatEntry(ChatEntry.TYPE_NOTIFICATION, 0, ChatBubbleMessage.text(text), 0));
    }

    // AS3: .../messenger/MainView.as::recordInfoMessage()
    private recordInfoMessage(chatId: number, text: string, notify: boolean = false): void
    {
        this.recordChatEntry(chatId, new ChatEntry(ChatEntry.TYPE_INFO, 0, ChatBubbleMessage.text(text), 0), notify);
    }

    // AS3: .../messenger/MainView.as::recordInvitationMessage()
    private recordInvitationMessage(chatId: number, text: string, notify: boolean = false): void
    {
        this.recordChatEntry(chatId, new ChatEntry(ChatEntry.TYPE_INVITATION, 0, ChatBubbleMessage.text(text), 0), notify);
    }

    /**
     * The one place an entry enters a conversation.
     *
     * A message with an id is recorded once and never again — the same message reaches this
     * client twice, once live and once in a history page. Generated entries carry no id and
     * are exempt.
     */
    // AS3: .../messenger/MainView.as::recordChatEntry()
    private recordChatEntry(chatId: number, entry: ChatEntry, notify: boolean = false): void
    {
        if(this._messenger === null)
        {
            return;
        }

        if(entry.messageId !== '')
        {
            if(this._seenMessageIds.has(entry.messageId))
            {
                return;
            }

            this._seenMessageIds.add(entry.messageId);
        }

        if(!this._chatEntries.has(chatId))
        {
            // A generated notice for a conversation that does not exist has nowhere to go.
            if(chatId <= 0)
            {
                return;
            }

            this.startConversation(chatId, false, entry.type === ChatEntry.TYPE_OTHER_CHAT ? entry : null);
        }

        const entries = this._chatEntries.get(chatId);

        if(entries === undefined)
        {
            return;
        }

        const previous = entries.length > 0 ? entries[entries.length - 1]! : null;

        entries.push(entry);

        const wrapper = this.getAvatarWrapper(chatId);

        if(wrapper !== null)
        {
            MainView.setAvatarVisibilityTag(wrapper, true);
            this.refreshAvatarList();
        }

        if(chatId === this._selectedChatId)
        {
            this.addToConversationAndCombine(entry, previous);
            this._conversation?.arrangeListItems();

            if(this._conversation !== null)
            {
                this._conversation.scrollV = 1;
            }

            if(!this.isOpen && notify)
            {
                this.setChatIndicatorVisibility(chatId, true);
            }
        }
        else
        {
            if(notify)
            {
                this.setChatIndicatorVisibility(chatId, true);
            }

            // The first conversation to arrive selects itself; later ones do not steal focus.
            if(this.visibleAvatarCount === 1)
            {
                this.selectConversation(chatId);
            }
        }

        this.refreshChatCount();
    }

    /**
     * Two consecutive messages merge into one bubble when they are the same kind, from the
     * same side, and close enough in time.
     *
     * A group conversation adds a condition a one-to-one does not need: the sender must
     * also match, because several people write into the same chat.
     */
    // AS3: .../messenger/MainView.as::shouldCombineWithPreviousEntry()
    private shouldCombineWithPreviousEntry(chatId: number, entry: ChatEntry, previous: ChatEntry): boolean
    {
        const entries = this._chatEntries.get(chatId);

        if(entries === undefined || entries.length === 0)
        {
            return false;
        }

        const withinWindow = entry.sentTimeStamp() < previous.sentTimeStamp() + MainView.COMBINE_MESSAGING_THRESHOLD;

        if(!withinWindow || entry.type !== previous.type)
        {
            return false;
        }

        if(chatId > 0)
        {
            return entry.type === ChatEntry.TYPE_OWN_CHAT || entry.type === ChatEntry.TYPE_OTHER_CHAT;
        }

        const sameSender = entry.type === ChatEntry.TYPE_OTHER_CHAT && previous.senderId === entry.senderId;

        return entry.type === ChatEntry.TYPE_OWN_CHAT || sameSender;
    }

    // AS3: .../messenger/MainView.as::getAvatarWrapper()
    private getAvatarWrapper(chatId: number): IWindow | null
    {
        return this._avatarList?.getChildByID(chatId) ?? null;
    }

    // AS3: .../messenger/MainView.as::setChatIndicatorVisibility()
    private setChatIndicatorVisibility(chatId: number, visible: boolean): void
    {
        const wrapper = this.getAvatarWrapper(chatId) as unknown as IWindowContainer | null;
        const indicator = wrapper?.findChildByName('chat_indicator') ?? null;

        if(indicator !== null)
        {
            indicator.visible = visible;
        }
    }

    /**
     * Builds the row for one entry. The four templates differ in more than their skin: a
     * chat row is a widget window carrying a bubble, the other three are plain containers
     * whose `content` child is captioned directly.
     */
    // AS3: .../messenger/MainView.as::createChatItem()
    private createChatItem(entry: ChatEntry, prepending: boolean = false): IWindow | null
    {
        switch(entry.type)
        {
            case ChatEntry.TYPE_OWN_CHAT:
                return this.createOwnChatItem(entry, prepending);

            case ChatEntry.TYPE_OTHER_CHAT:
                return this.createOtherChatItem(entry);

            case ChatEntry.TYPE_NOTIFICATION:
                return this.createInsetItem(this._notificationTemplate, entry);

            case ChatEntry.TYPE_INFO:
                return this.createInfoItem(entry);

            case ChatEntry.TYPE_INVITATION:
                return this.createInsetItem(this._invitationTemplate, entry);

            default:
                log.warn(`createChatItem: no row template for chat entry type ${entry.type}`);

                return null;
        }
    }

    // AS3: .../messenger/MainView.as::createChatItem() (own-chat branch)
    private createOwnChatItem(entry: ChatEntry, prepending: boolean): IWindow | null
    {
        const item = this._normalTemplate?.clone() as IWidgetWindow | null;
        const bubble = item?.widget as IIlluminaChatBubbleWidget | null ?? null;

        if(item === null || item === undefined || bubble === null)
        {
            return null;
        }

        (item as unknown as IWindow).width = this.conversationItemWidth;

        bubble.flipped = false;
        bubble.appendMessage(entry.message, false, entry.awaitConfirmationId);
        bubble.timeStamp = entry.sentTimeStamp();
        bubble.figure = this._messenger?.sessionDataManager?.figure ?? '';
        bubble.userName = this._messenger?.sessionDataManager?.userName ?? '';

        // Only shown while catching up on the live stream: the strip that says the friend
        // will read this later is meaningless on a history page, hence the `prepending`
        // guard, and it only applies to friends who can receive offline messages at all.
        const friend = this._messenger?.getFriend(this._selectedChatId) ?? null;

        if(!prepending && friend !== null && !friend.online && (friend.persistedMessageUser || friend.pocketHabboUser))
        {
            bubble.friendOnlineStatus = false;
        }

        return item as unknown as IWindow;
    }

    // AS3: .../messenger/MainView.as::createChatItem() (other-chat branch)
    private createOtherChatItem(entry: ChatEntry): IWindow | null
    {
        const item = this._normalTemplate?.clone() as IWidgetWindow | null;
        const bubble = item?.widget as IIlluminaChatBubbleWidget | null ?? null;

        if(item === null || item === undefined || bubble === null)
        {
            return null;
        }

        (item as unknown as IWindow).width = this.conversationItemWidth;

        bubble.flipped = true;
        bubble.appendMessage(entry.message);
        bubble.timeStamp = entry.sentTimeStamp();

        // The sender's identity is only stamped on the bubble once the strip is confirmed
        // to hold the conversation this entry belongs to. A group's tab is matched by name
        // as well as id, because its id is negative.
        for(const child of this.avatarChildren())
        {
            let matches = child.id === this._selectedChatId;

            if(!matches && this._selectedChatId < 0)
            {
                matches = Number(child.name) === this._selectedChatId;
            }

            if(matches)
            {
                bubble.figure = entry.senderFigure ?? '';
                bubble.userId = entry.senderId;
                bubble.userName = entry.senderName ?? '';

                break;
            }
        }

        return item as unknown as IWindow;
    }

    /**
     * The notification and invitation rows leave room for their icon, so their content is
     * narrower than the row.
     */
    // AS3: .../messenger/MainView.as::createChatItem() (notification/invitation branches)
    private createInsetItem(template: IWindowContainer | null, entry: ChatEntry): IWindow | null
    {
        const item = template?.clone() as IWindowContainer | null;

        if(item === null || item === undefined)
        {
            return null;
        }

        const content = item.findChildByName('content');

        if(content !== null)
        {
            content.width = this.conversationItemWidth - MainView.NOTIFICATION_ICON_WIDTH;
            content.caption = entry.messageText;
        }

        return item as unknown as IWindow;
    }

    /**
     * An info line has no icon and is pinned to the full width both ways, so its text
     * centres instead of hugging its content.
     */
    // AS3: .../messenger/MainView.as::createChatItem() (info branch)
    private createInfoItem(entry: ChatEntry): IWindow | null
    {
        const item = this._infoTemplate?.clone() as IWindowContainer | null;

        if(item === null || item === undefined)
        {
            return null;
        }

        const content = item.findChildByName('content');

        if(content !== null)
        {
            content.limits.minWidth = this.conversationItemWidth;
            content.limits.maxWidth = this.conversationItemWidth;
            content.caption = entry.messageText;
        }

        return item as unknown as IWindow;
    }

    // AS3: .../messenger/MainView.as::appendChatEntry()
    private appendChatEntry(entry: ChatEntry): IWindow | null
    {
        const item = this.createChatItem(entry);

        if(item !== null)
        {
            this._conversation?.addListItem(item);
        }

        return item;
    }

    /**
     * Re-widths every row after the frame is resized. The info row is pinned both ways, the
     * inset rows leave their icon gutter, and a chat row lets its bubble handle itself.
     */
    // AS3: .../messenger/MainView.as::adjustListItemWidths()
    private adjustListItemWidths(): void
    {
        const list = this._conversation;

        if(list === null)
        {
            return;
        }

        for(let i = 0; i < list.numListItems; i++)
        {
            const item = list.getListItemAt(i);

            if(item === null)
            {
                continue;
            }

            switch(item.name)
            {
                case 'msg_notification':
                {
                    const content = (item as unknown as IWindowContainer).findChildByName('content');

                    if(content !== null)
                    {
                        content.width = this.conversationItemWidth - MainView.NOTIFICATION_ICON_WIDTH;
                    }

                    break;
                }

                case 'msg_info':
                {
                    const content = (item as unknown as IWindowContainer).findChildByName('content');

                    if(content !== null)
                    {
                        content.limits.minWidth = this.conversationItemWidth;
                        content.limits.maxWidth = this.conversationItemWidth;
                    }

                    break;
                }

                // AS3 lists `msg_normal` with an empty body: a chat row takes the width
                // below like the others, and its bubble lays its own contents out.
                case 'msg_normal':
                    break;
            }

            item.width = this.conversationItemWidth;
        }

        list.arrangeListItems();
        (this._frame as unknown as IWindow | null)?.invalidate();
    }

    /** The frame's width less the scrollbar and padding. */
    // AS3: .../messenger/MainView.as::get conversationItemWidth()
    private get conversationItemWidth(): number
    {
        return ((this._frame as unknown as IWindow | null)?.width ?? 0) - 27;
    }

    // AS3: .../messenger/MainView.as::refreshButtons()
    private refreshButtons(): void
    {
        (this._frame?.findChildByName('button_strip') as IItemListWindow | null)?.arrangeListItems();
    }

    /**
     * Asks for the page of history before the oldest entry held.
     *
     * The timestamp guard is not a nicety: `scrollBack()` calls this on every render pass,
     * and without it a conversation short enough to stay under the prefetch threshold would
     * ask the server for the same page on every scroll event.
     */
    // AS3: .../messenger/MainView.as::requestHistory()
    private requestHistory(chatId: number): void
    {
        const entries = this._chatEntries.get(chatId);

        if(entries === undefined || this._messenger === null)
        {
            return;
        }

        const oldestId = entries.length > 0 ? entries[0]!.messageId : '';
        const now = performance.now();
        const previous = this._historyFetchesTimestamps.get(chatId);

        if(previous !== undefined && previous.messageId === oldestId && previous.time + MainView.HISTORY_REFETCH_INTERVAL > now)
        {
            return;
        }

        this._historyFetchesTimestamps.set(chatId, {messageId: oldestId, time: now});
        this._messenger.send(new GetMessengerHistoryComposer(chatId, oldestId));
    }

    // AS3: .../messenger/MainView.as::refreshConversationList()
    private refreshConversationList(): void
    {
        this._scrollingSelf = true;

        this._conversation?.destroyListItems();
        this._renderedFrom = -1;

        this.scrollBack(true);
        this._conversation?.arrangeListItems();

        if(this._conversation !== null)
        {
            this._conversation.scrollV = 1;
        }

        this._scrollingSelf = false;
    }

    /**
     * Adds an entry to the rendered list, merging it into the neighbouring bubble when the
     * two belong together. Returns whether it merged.
     */
    // AS3: .../messenger/MainView.as::addToConversationAndCombine()
    private addToConversationAndCombine(entry: ChatEntry, neighbour: ChatEntry | null, prepend: boolean = false): boolean
    {
        let combined = false;

        if(neighbour !== null && this.shouldCombineWithPreviousEntry(this._selectedChatId, entry, neighbour))
        {
            const index = prepend ? 0 : (this._conversation?.numListItems ?? 0) - 1;

            if(index >= 0)
            {
                const bubble = (this._conversation?.getListItemAt(index) as IWidgetWindow | null)?.widget as IIlluminaChatBubbleWidget | null ?? null;

                if(bubble !== null)
                {
                    bubble.appendMessage(entry.message, prepend, entry.awaitConfirmationId);

                    // Prepending an older message must not move the bubble's clock: the
                    // stamp belongs to its newest line.
                    if(!prepend)
                    {
                        bubble.timeStamp = entry.sentTimeStamp();
                    }

                    combined = true;
                }
            }
        }

        if(!combined)
        {
            if(prepend)
            {
                const item = this.createChatItem(entry, true);

                if(item !== null)
                {
                    this._conversation?.addListItemAt(item, 0);
                }
            }
            else
            {
                this.appendChatEntry(entry);
            }
        }

        return combined;
    }

    /**
     * Renders another page of older entries when the view is near the top, keeping the
     * player's position: the scroll is re-derived from the height the list grew by.
     */
    // AS3: .../messenger/MainView.as::addMissingChatEntries()
    private addMissingChatEntries(): void
    {
        const list = this._conversation;

        if(list === null || -list.scrollableRegion.y > MainView.SCROLL_TRIGGER_HEIGHT)
        {
            return;
        }

        this._scrollingSelf = true;

        const previousScroll = list.scrollV;
        const previousHeight = list.scrollableRegion.height;

        this.scrollBack();
        list.arrangeListItems();

        list.scrollV = previousHeight <= list.height
            ? 1
            : 1 - previousHeight * (1 - previousScroll) / list.scrollableRegion.height;

        this._scrollingSelf = false;
    }

    /**
     * Walks backwards from the oldest rendered entry, prepending rows until a page is full.
     *
     * "Full" is two independent budgets, both scaled up on the first pass so a freshly
     * opened conversation is not one short line: at most `CHAT_ITEM_RENDER_MAX_BUNDLE_SIZE`
     * new bubbles, and at most `CHAT_ITEM_RENDER_MAX_MESSAGES_SIZE` entries. The bundle
     * budget only stops the walk at a point where the next entry would start a new bubble,
     * so a run of merged messages is never cut in half.
     */
    // AS3: .../messenger/MainView.as::scrollBack()
    private scrollBack(initial: boolean = false): void
    {
        const entries = this._chatEntries.get(this._selectedChatId);

        if(entries === undefined)
        {
            this.requestHistory(this._selectedChatId);

            return;
        }

        const from = this._renderedFrom === -1 ? entries.length : this._renderedFrom;
        const multiplier = initial ? MainView.CHAT_ITEM_INITIAL_MULTIPLIER : 1;

        let bundles = 0;
        let budgetSpent = false;
        let rendered = 0;
        let neighbour: ChatEntry | null = this._renderedFrom === -1 ? null : entries[this._renderedFrom] ?? null;

        for(let i = from - 1; i >= 0; i--)
        {
            const entry = entries[i]!;

            if(budgetSpent && (neighbour === null || !this.shouldCombineWithPreviousEntry(this._selectedChatId, entry, neighbour)))
            {
                break;
            }

            if(!this.addToConversationAndCombine(entry, neighbour, true))
            {
                bundles += 1;
            }

            neighbour = entry;
            rendered += 1;
            this._renderedFrom = i;

            if(bundles >= MainView.CHAT_ITEM_RENDER_MAX_BUNDLE_SIZE * multiplier)
            {
                budgetSpent = true;
            }

            if(rendered >= MainView.CHAT_ITEM_RENDER_MAX_MESSAGES_SIZE * multiplier)
            {
                break;
            }
        }

        if(this._renderedFrom < MainView.HISTORY_PREFETCH_THRESHOLD)
        {
            this.requestHistory(this._selectedChatId);
        }
    }

    /**
     * Lays the avatar strip out and decides which scroll arrows are needed.
     *
     * Everything before `_firstVisibleAvatar` is skipped, and the first entry that does not
     * fit ends the row and turns the right arrow on. The selected tab is forced visible
     * first, so selecting a conversation cannot leave it scrolled out of sight.
     */
    // AS3: .../messenger/MainView.as::refreshAvatarList()
    private refreshAvatarList(): void
    {
        const strip = this._avatarList;

        if(strip === null)
        {
            return;
        }

        const stripWidth = (strip as unknown as IWindow).width;

        this._avatarsOverflow = false;

        let x = 0;
        let seen = 0;

        for(const child of this.avatarChildren())
        {
            let selected = child.id === this._selectedChatId;

            if(!selected && child.name.length > 0)
            {
                selected = Number(child.name) === this._selectedChatId;
            }

            if(selected)
            {
                MainView.setAvatarVisibilityTag(child, true);
            }

            const visible = MainView.avatarVisible(child);

            if(seen < this._firstVisibleAvatar || !visible || this._avatarsOverflow)
            {
                child.visible = false;
            }
            else if(x + child.width > stripWidth)
            {
                child.visible = false;
                this._avatarsOverflow = true;
            }
            else
            {
                child.visible = true;
                child.blend = selected ? 1 : 0;
                child.x = x;
                x += child.width;
            }

            if(visible)
            {
                seen++;
            }
        }

        const left = this._frame?.findChildByName('avatars_scroll_left') ?? null;
        const right = this._frame?.findChildByName('avatars_scroll_right') ?? null;

        if(left !== null)
        {
            left.visible = this._firstVisibleAvatar > 0;
        }

        if(right !== null)
        {
            right.visible = this._avatarsOverflow;
        }
    }

    /** Every child of the avatar strip, hidden ones included. */
    // AS3: .../messenger/MainView.as::_SafeStr_5142.iterator
    private avatarChildren(): IWindow[]
    {
        const strip = this._avatarList;

        if(strip === null)
        {
            return [];
        }

        const out: IWindow[] = [];

        for(let i = 0; i < strip.numChildren; i++)
        {
            const child = strip.getChildAt(i);

            if(child !== null)
            {
                out.push(child);
            }
        }

        return out;
    }

    // AS3: .../messenger/MainView.as::get visibleAvatarCount()
    private get visibleAvatarCount(): number
    {
        let count = 0;

        for(const child of this.avatarChildren())
        {
            if(MainView.avatarVisible(child))
            {
                count++;
            }
        }

        return count;
    }

    // AS3: .../messenger/MainView.as::get hasUnreadChat()
    private get hasUnreadChat(): boolean
    {
        for(const child of this.avatarChildren())
        {
            if(!MainView.avatarVisible(child))
            {
                continue;
            }

            const indicator = (child as unknown as IWindowContainer).findChildByName('chat_indicator');

            if(indicator !== null && indicator.visible)
            {
                return true;
            }
        }

        return false;
    }

    // DEVIATION: AS3 also handles WME_CLICK_AWAY, to close the habbicon picker; the RPG fork
    //   removed Habbicons.
    // AS3: .../messenger/MainView.as::messengerWindowProcedure()
    private _windowProcedure = (event: WindowEvent, window: IWindow): void =>
    {
        switch(event.type)
        {
            case 'WE_RESIZE':
                if((window as unknown as IWindowContainer) === this._frame)
                {
                    this.adjustListItemWidths();
                    this.refreshAvatarList();
                }

                break;

            // The list relocating its own container means the player scrolled; when this
            // class did the scrolling, the flag stops it reacting to itself.
            case 'WE_RELOCATED':
                if(window.name === '_CONTAINER' && !this._scrollingSelf)
                {
                    this.addMissingChatEntries();
                }

                break;

            case 'WME_CLICK':
                this.onWindowClick(window);
                break;
        }
    };

    // DEVIATION: AS3 also toggles the habbicon picker on `habbicon_button` and closes it on any
    //   other click; the RPG fork removed Habbicons.
    // AS3: .../messenger/MainView.as::messengerWindowProcedure() (WME_CLICK branch)
    private onWindowClick(window: IWindow): void
    {
        switch(window.name)
        {
            case 'avatar_click_region':
                this.selectConversation((window.parent as unknown as IWindow | null)?.id ?? MainView.NO_CONVERSATION);
                break;

            case 'avatars_scroll_left':
                if(this._firstVisibleAvatar > 0)
                {
                    this._firstVisibleAvatar -= 1;
                    this.refreshAvatarList();
                }

                break;

            case 'avatars_scroll_right':
                if(this._avatarsOverflow)
                {
                    this._firstVisibleAvatar += 1;
                    this.refreshAvatarList();
                }

                break;

            case 'close_conversation_button':
                this.hideConversation(this._selectedChatId);
                break;

            case 'follow_button':
                this.onFollowClick();
                break;

            case 'profile_button':
                this.onProfileClick();
                break;

            case 'report_button':
                this._messenger?.reportUser(this._selectedChatId);
                break;

            case 'header_button_close':
                this.hide();
                break;
        }
    }

    /**
     * Follow the other side into their room. A group conversation goes through the group's
     * own room instead, and sets a flag the messenger reads when the room opens.
     */
    // AS3: .../messenger/MainView.as::messengerWindowProcedure() (follow_button)
    private onFollowClick(): void
    {
        if(this._messenger === null)
        {
            return;
        }

        if(this._selectedChatId > 0)
        {
            this._messenger.send(new FollowFriendMessageComposer(this._selectedChatId));
            this._messenger.send(new EventLogMessageComposer('Navigation', 'IM', 'go.im'));

            return;
        }

        this._messenger.followingToGroupRoom = true;
        this._messenger.send(new GetHabboGroupDetailsMessageComposer(Math.abs(this._selectedChatId), false));
    }

    // AS3: .../messenger/MainView.as::messengerWindowProcedure() (profile_button)
    private onProfileClick(): void
    {
        if(this._messenger === null)
        {
            return;
        }

        if(this._selectedChatId > 0)
        {
            this._messenger.send(new GetExtendedProfileMessageComposer(this._selectedChatId));
        }
        else
        {
            this._messenger.send(new GetHabboGroupDetailsMessageComposer(Math.abs(this._selectedChatId), true));
        }

        this._messenger.trackGoogle('extendedProfile', 'messenger_conversation');
    }

    /**
     * The send sound only plays when the conversation was empty — opening one and writing
     * the first line is worth a sound, a reply in an ongoing chat is not. The moderation
     * blurb does not count as content.
     */
    // AS3: .../messenger/MainView.as::onInput()
    private playSendSoundIfConversationIsEmpty(): void
    {
        const entries = this._chatEntries.get(this._selectedChatId) ?? [];
        const onlyModerationInfo = entries.length === 1 && entries[0]!.type === ChatEntry.TYPE_NOTIFICATION;

        if(entries.length === 0 || onlyModerationInfo)
        {
            this._messenger?.playSendSound();
        }
    }

    // AS3: .../messenger/MainView.as::get inputWidget()
    private get inputWidget(): IWidgetWindow | null
    {
        return this._frame?.findChildByName('input_widget') as IWidgetWindow | null ?? null;
    }

    // AS3: .../messenger/MainView.as::dispose()
    dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        this._conversation = null;
        this._avatarList = null;

        if(this._window !== null)
        {
            this._window.dispose();
            this._window = null;
            this._frame = null;
        }

        this._normalTemplate?.dispose();
        this._normalTemplate = null;

        this._notificationTemplate?.dispose();
        this._notificationTemplate = null;

        this._invitationTemplate?.dispose();
        this._invitationTemplate = null;

        this._infoTemplate?.dispose();
        this._infoTemplate = null;

        this._avatarTemplate?.dispose();
        this._avatarTemplate = null;

        this._chatEntries.clear();
        this._awaitConfirmationEntries.clear();
        this._historyFetchesTimestamps.clear();
        this._seenMessageIds.clear();

        this._messenger = null;
    }
}
