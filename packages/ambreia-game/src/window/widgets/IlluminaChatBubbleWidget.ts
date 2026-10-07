import type {IIlluminaChatBubbleWidget} from '@ambreia/ui/kit/widgets/IIlluminaChatBubbleWidget';
import type {IWidgetWindow} from '@ambreia/ui/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import {PropertyStruct} from '@ambreia/ui/utils/PropertyStruct';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IAvatarImageWidget} from '@ambreia/ui/kit/widgets/IAvatarImageWidget';
import type {UpdatingTimeStampWidget} from './UpdatingTimeStampWidget';
import {ChatBubbleMessage} from '@ambreia/ui/kit/widgets/ChatBubbleMessage';
import {Logger} from '@ambreia/common/utils/Logger';
import {GetExtendedProfileMessageComposer} from '@ambreia/protocol/outgoing/users/GetExtendedProfileMessageComposer';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IIterator} from '@ambreia/ui/utils/IIterator';
import {EmptyIterator} from '@ambreia/ui/iterators/EmptyIterator';

const log = Logger.getLogger('habbo.window.widgets.IlluminaChatBubbleWidget');

/**
 * Illumina chat bubble widget.
 *
 * Renders a chat bubble with avatar, username, message list, timestamp,
 * and online status indicator. Supports flipped layout and message
 * confirmation tracking.
 *
 * Each message is its own window in the `message_container` item list, cloned from the
 * layout's `message_template`. The widget used to keep messages as a `string[]` and never clone
 * anything, so nothing a conversation contained was ever drawn.
 *
 * DEVIATION: AS3 also draws a habbicon message from the layout's `habbicon_template` (an 80x80
 *   box holding the habbicon's preview, mirrored to face the bubble). The RPG fork removed
 *   Habbicons, so every message is built as text — a habbicon message, which the server no longer
 *   sends, would show as an empty line. The template is still taken out of the list so it does
 *   not linger as a stray item, until Task 10 of the M0 cleanup drops it from the layout.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as
 */
export class IlluminaChatBubbleWidget implements IIlluminaChatBubbleWidget
{
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::TYPE
    public static readonly TYPE: string = 'illumina_chat_bubble';

    private static readonly FLIPPED_KEY: string = 'illumina_chat_bubble:flipped';
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::USER_NAME_KEY
    private static readonly USER_NAME_KEY: string = 'illumina_chat_bubble:user_name';
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::FIGURE_KEY
    private static readonly FIGURE_KEY: string = 'illumina_chat_bubble:figure';
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::MESSAGE_KEY
    private static readonly MESSAGE_KEY: string = 'illumina_chat_bubble:message';

    private static readonly PARAM_FLAG_147456: number = 147456;
    private static readonly PARAM_FLAG_1: number = 1;

    /** **Name derived** from its use in refresh(); obfuscated in every tree. */
    // AS3: .../IlluminaChatBubbleWidget.as::RESIZING_OFFSETS
    private static readonly RESIZING_OFFSETS: number = 10;

    /** The gap refresh() leaves between a text message and the bubble's edge. */
    // AS3: .../IlluminaChatBubbleWidget.as::refresh()
    private static readonly TEXT_WIDTH_INSET: number = 5;

    /** `_offline.height` when the friend is offline; zero collapses the placeholder. */
    // AS3: .../IlluminaChatBubbleWidget.as::set friendOnlineStatus()
    private static readonly OFFLINE_PLACEHOLDER_HEIGHT: number = 16;

    /** Re-entry guard for refresh(); resizing children fires WE_CHILD_RESIZED back at us. */
    // AS3: .../IlluminaChatBubbleWidget.as::_SafeStr_6595
    private _refreshing: boolean = false;

    /** Last wrapper-width bucket refresh() re-widthed the message list for. */
    // AS3: .../IlluminaChatBubbleWidget.as::_SafeStr_8931
    private _lastWidthBucket: number = 0;

    /** The avatar's parent - what refresh() moves from one side to the other. */
    // AS3: .../IlluminaChatBubbleWidget.as::_SafeStr_6125
    private _avatarHolder: IWindow | null = null;

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::_messages
    private _messages: ChatBubbleMessage[] = [];
    private _confirmationIds: number[] = [];
    private _widgetWindow: IWidgetWindow | null = null;
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;

    private _root: IWindowContainer | null = null;
    private _messageContainer: IItemListWindow | null = null;
    private _messageTemplate: ITextWindow | null = null;
    private _spacedMessageContainer: IWindow | null = null;
    private _userNameLabel: IWindow | null = null;
    private _userAvatarWidget: IWindow | null = null;
    // AS3: .../IlluminaChatBubbleWidget.as::_avatarWidget
    private _avatarWidget: IAvatarImageWidget | null = null;
    private _bubbleWrapper: IWindowContainer | null = null;
    private _postTimeWidget: IWindow | null = null;
    // AS3: .../IlluminaChatBubbleWidget.as::_postTime
    private _postTime: UpdatingTimeStampWidget | null = null;
    private _offlinePlaceholder: IWindow | null = null;
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::_arrowPoint
    private _arrowPoint: IWindow | null = null;
    private _messageRegion: IWindow | null = null;

    private _rootProcedureBound: ((event: WindowEvent, window: IWindow) => void);

    constructor(window: IWidgetWindow, windowManager: IHabboWindowManager)
    {
        this._widgetWindow = window;
        this._windowManager = windowManager;

        this._rootProcedureBound = this.rootProcedure.bind(this);

        const root = this._windowManager.buildWidgetLayout('illumina_chat_bubble_xml') as IWindowContainer | null;

        if(root)
        {
            this._root = root;

            this._messageContainer = root.findChildByName('message_container') as IItemListWindow | null;
            this._spacedMessageContainer = root.findChildByName('spaced_message_container');
            this._userNameLabel = root.findChildByName('user_name');
            this._userAvatarWidget = root.findChildByName('user_avatar');

            // The bubble owns no figure/userId of its own: AS3's accessors are pure
            // pass-throughs to the avatar widget living inside `user_avatar`. Keeping
            // them in private fields — as this did — left every bubble on the avatar
            // widget's default figure, whatever MainView assigned.
            this._avatarWidget = (this._userAvatarWidget as unknown as IWidgetWindow | null)?.widget as IAvatarImageWidget | null ?? null;

            if(this._avatarWidget === null)
            {
                log.warn('illumina_chat_bubble_xml has no "user_avatar" widget - every bubble keeps the default figure');
            }

            // The *parent* of the avatar, not the avatar: refresh() moves this whole holder
            // from one side of the bubble to the other and measures the wrapper against its
            // width. AS3 reads it as `_loc3_.parent` off the same lookup.
            this._avatarHolder = this._userAvatarWidget?.parent as unknown as IWindow | null ?? null;

            this._bubbleWrapper = root.findChildByName('bubble_wrapper') as IWindowContainer | null;
            this._postTimeWidget = root.findChildByName('post_time');
            this._postTime = (this._postTimeWidget as unknown as IWidgetWindow | null)?.widget as UpdatingTimeStampWidget | null ?? null;

            this._offlinePlaceholder = root.findChildByName('offline_placeholder');

            // The layout authors the strip at its full 16px with the "offline message
            // sent" caption already in it, so a bubble that never hears from
            // `friendOnlineStatus` shows it. AS3 collapses it here and the setter is the
            // only thing that ever opens it again.
            if(this._offlinePlaceholder !== null)
            {
                this._offlinePlaceholder.height = 0;
            }
            this._arrowPoint = root.findChildByName('arrow_point');
            this._messageRegion = root.findChildByName('message_region');

            // Both templates come out of the list by name and are taken out of it, so the
            // bubble starts empty and every later message is a clone of one of them. Taking
            // `getChildAt(0)` instead — as this did — picks whichever the XML happens to
            // declare first and leaves the other in the list as a permanent stray item.
            if(this._messageContainer !== null)
            {
                this._messageTemplate = this._messageContainer.getListItemByName('message_template') as ITextWindow | null;

                if(this._messageTemplate !== null)
                {
                    this._messageContainer.removeListItem(this._messageTemplate as unknown as IWindow);
                }
                else
                {
                    log.warn('illumina_chat_bubble_xml has no "message_template" list item - text messages cannot be built');
                }

                const habbiconTemplate = this._messageContainer.getListItemByName('habbicon_template');

                if(habbiconTemplate !== null)
                {
                    this._messageContainer.removeListItem(habbiconTemplate);
                }
            }

            // Disable param flag 1 on message region
            if(this._messageRegion)
            {
                this._messageRegion.setParamFlag(IlluminaChatBubbleWidget.PARAM_FLAG_1, false);
            }

            root.procedure = this._rootProcedureBound;

            // The layout ships a placeholder "USER:" caption and the avatar widget its own
            // default figure; AS3 clears both here, so a bubble nobody names shows neither.
            this.userName = '';
            this.figure = '';

            // Set rootWindow with param flag 147456
            this._widgetWindow.rootWindow = root as unknown as IWindow;
            (this._widgetWindow as IWindow).setParamFlag(IlluminaChatBubbleWidget.PARAM_FLAG_147456, true);
        }
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    private _flipped: boolean = false;

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get flipped()
    public get flipped(): boolean
    {
        return this._flipped;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set flipped()
    public set flipped(value: boolean)
    {
        this._flipped = value;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get userName()
    public get userName(): string
    {
        return (this._userNameLabel?.caption ?? '').slice(0, -1);
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set userName()
    public set userName(value: string)
    {
        if(this._userNameLabel !== null)
        {
            this._userNameLabel.caption = value + ':';
        }
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get userId()
    public get userId(): number
    {
        return this._avatarWidget?.userId ?? 0;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set userId()
    public set userId(value: number)
    {
        if(this._avatarWidget !== null)
        {
            this._avatarWidget.userId = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get figure()
    public get figure(): string
    {
        return this._avatarWidget?.figure ?? '';
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set figure()
    public set figure(value: string)
    {
        if(this._avatarWidget !== null)
        {
            this._avatarWidget.figure = value;
        }
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get timeStamp()
    public get timeStamp(): number
    {
        return this._postTime?.timeStamp ?? 0;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set timeStamp()
    public set timeStamp(value: number)
    {
        if(this._postTime !== null)
        {
            this._postTime.timeStamp = value;
        }
    }

    private _friendOnline: boolean = true;

    public get friendOnline(): boolean
    {
        return this._friendOnline;
    }

    /**
     * AS3 keeps no flag: the setter *is* the placeholder's height, and a zero-height
     * placeholder is what "online" looks like. Storing a boolean and never touching the
     * window left the offline strip permanently collapsed.
     */
    // AS3: .../IlluminaChatBubbleWidget.as::set friendOnlineStatus()
    public set friendOnlineStatus(value: boolean)
    {
        this._friendOnline = value;

        if(this._offlinePlaceholder !== null)
        {
            this._offlinePlaceholder.height = value ? 0 : IlluminaChatBubbleWidget.OFFLINE_PLACEHOLDER_HEIGHT;
        }
    }

    // AS3: .../IlluminaChatBubbleWidget.as::get numMessages()
    public get numMessages(): number
    {
        return this._messages.length;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get properties()
    public get properties(): PropertyStruct[]
    {
        if(this._disposed) return [];

        return [
            new PropertyStruct(IlluminaChatBubbleWidget.FLIPPED_KEY, this._flipped),
            new PropertyStruct(IlluminaChatBubbleWidget.USER_NAME_KEY, this.userName),
            new PropertyStruct(IlluminaChatBubbleWidget.FIGURE_KEY, this.figure),
            new PropertyStruct(IlluminaChatBubbleWidget.MESSAGE_KEY, this.getSerializedMessages().join('\t')),
        ];
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set properties()
    public set properties(values: PropertyStruct[])
    {
        for(const prop of values)
        {
            switch(prop.key)
            {
                case IlluminaChatBubbleWidget.FLIPPED_KEY:
                    this.flipped = Boolean(prop.value);
                    break;
                case IlluminaChatBubbleWidget.USER_NAME_KEY:
                    this.userName = String(prop.value);
                    break;
                case IlluminaChatBubbleWidget.FIGURE_KEY:
                    this.figure = String(prop.value);
                    break;
                case IlluminaChatBubbleWidget.MESSAGE_KEY:
                    this.setMessages(IlluminaChatBubbleWidget.getMessagesFromProperty(String(prop.value)));
                    break;
            }
        }
    }

    /**
	 * Parse messages from a tab-separated property string.
	 */
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::getMessagesFromProperty()
    public static getMessagesFromProperty(value: string): string[]
    {
        const parts = value.split('\t');

        if(parts.length === 1 && parts[0] === '')
        {
            return [];
        }

        return parts;
    }

    /**
     * Drops every message window and rebuilds the list from plain strings. Only the
     * property round-trip uses this, which is why it re-enters with text messages: the
     * serialized form carries no habbicons.
     */
    // AS3: .../IlluminaChatBubbleWidget.as::setMessages()
    private setMessages(messages: string[]): void
    {
        this._messageContainer?.destroyListItems();
        this._messages = [];
        this._confirmationIds = [];

        for(const message of messages)
        {
            this.appendMessage(ChatBubbleMessage.text(message));
        }
    }

    // AS3: .../IlluminaChatBubbleWidget.as::getMessages()
    public getMessages(): string[]
    {
        return this.getSerializedMessages();
    }

    /** A habbicon serializes as the empty string - the property carries text only. */
    // AS3: .../IlluminaChatBubbleWidget.as::getSerializedMessages()
    private getSerializedMessages(): string[]
    {
        const out: string[] = [];

        for(let i = 0; i < this.numMessages; i++)
        {
            const message = this.getMessage(i);

            out.push(message !== null && message.type === ChatBubbleMessage.TYPE_TEXT ? message.textValue : '');
        }

        return out;
    }

    /**
     * Lays the bubble out: fixes the root's width, puts the avatar on the side `flipped`
     * asks for, points the arrow at it, and re-widths every message.
     *
     * The re-width is gated on a coarse bucket of the wrapper width rather than the width
     * itself, so dragging the frame a few pixels does not walk the whole message list on
     * every resize event. `_refreshing` guards re-entry, because resizing the children
     * fires WE_CHILD_RESIZED straight back at us.
     */
    // DEVIATION: AS3 also handles habbicon messages here; the RPG fork removed Habbicons (see the
    //   class comment).
    // AS3: .../IlluminaChatBubbleWidget.as::refresh()
    public refresh(): void
    {
        if(this._refreshing || this._disposed)
        {
            return;
        }

        const root = this._root;
        const wrapper = this._bubbleWrapper;
        const avatarHolder = this._avatarHolder;

        if(root === null || wrapper === null || avatarHolder === null)
        {
            return;
        }

        this._refreshing = true;

        const rootWindow = root as unknown as IWindow;
        const wrapperWindow = wrapper as unknown as IWindow;

        rootWindow.limits.minWidth = rootWindow.width;
        rootWindow.limits.maxWidth = rootWindow.width;
        rootWindow.height = wrapperWindow.y + wrapperWindow.height;
        wrapperWindow.width = rootWindow.width - avatarHolder.width;

        const bucket = Math.floor(wrapperWindow.width / IlluminaChatBubbleWidget.RESIZING_OFFSETS);

        if(bucket !== this._lastWidthBucket && this._messageContainer !== null)
        {
            for(let i = 0; i < this._messageContainer.numListItems; i++)
            {
                const item = this._messageContainer.getListItemAt(i);

                if(item === null)
                {
                    continue;
                }

                item.width = wrapperWindow.width - IlluminaChatBubbleWidget.TEXT_WIDTH_INSET;
            }

            this._lastWidthBucket = bucket;
        }

        if(this._messageContainer !== null)
        {
            (this._messageContainer as unknown as IWindow).width = wrapperWindow.width;
        }

        if(this._spacedMessageContainer !== null)
        {
            this._spacedMessageContainer.width = wrapperWindow.width;
        }

        if(this._flipped)
        {
            avatarHolder.x = rootWindow.width - avatarHolder.width;
            wrapperWindow.x = 0;

            if(this._arrowPoint !== null)
            {
                this._arrowPoint.x = avatarHolder.x;
            }
        }
        else
        {
            avatarHolder.x = 0;
            wrapperWindow.x = avatarHolder.x + avatarHolder.width;

            if(this._arrowPoint !== null)
            {
                this._arrowPoint.x = avatarHolder.x + avatarHolder.width - this._arrowPoint.width;
            }
        }

        // Releases the min/max pin taken at the top of this method, so the next layout pass can
        // resize the bubble again.
        //
        // This was `limits.assign(0, 0, 0, 0)`, on the reading that AS3's `Rectangle.setEmpty()`
        // zeroes the four bounds and that `IRectLimiter` had no counterpart. Both halves are
        // wrong. `IRectLimiter.setEmpty()` exists, and "empty" here means the four *int extremes*
        // (`isEmpty` tests exactly that), not zeroes: `assign()` ends in `limit()`, so a maxWidth
        // and maxHeight of 0 clamped the bubble's root to 0x0 on the spot and the pin kept it
        // there. The root then handed `bubble_wrapper` a width of `0 - avatarHolder.width`, and
        // every itemlist under it inherited a zero-width clip -- which is why the messenger drew
        // laid-out, correctly measured text that nobody could see.
        rootWindow.limits.setEmpty();
        this._arrowPoint?.invalidate();

        this._refreshing = false;
    }

    // AS3: .../IlluminaChatBubbleWidget.as::getMessage()
    public getMessage(index: number): ChatBubbleMessage | null
    {
        return this._messages[index] ?? null;
    }

    /**
     * Replacing a message with one of a different kind cannot reuse its window — a text
     * window cannot draw a habbicon — so AS3 destroys the old item and builds a new one at
     * the same index, and only edits in place when the kind is unchanged. The confirmation
     * id is read before the swap and re-applied after, because rebuilding the window drops
     * the pending-blend it was carrying.
     */
    // AS3: .../IlluminaChatBubbleWidget.as::setMessage()
    public setMessage(index: number, message: ChatBubbleMessage | string): void
    {
        const normalized = IlluminaChatBubbleWidget.normalizeMessage(message);

        while(index >= this.numMessages)
        {
            const filler = ChatBubbleMessage.text('');

            this._messages.push(filler);
            this._messageContainer?.addListItem(this.createMessageWindow(filler)!);
            this._confirmationIds.push(0);
        }

        const confirmationId = this._confirmationIds[index] ?? 0;
        const previous = this._messages[index]!;

        this._messages[index] = normalized;

        if(previous.type !== normalized.type)
        {
            this._messageContainer?.removeListItemAt(index)?.dispose();

            const rebuilt = this.createMessageWindow(normalized);

            if(rebuilt !== null)
            {
                this._messageContainer?.addListItemAt(rebuilt, index);
            }
        }
        else
        {
            this.updateMessageWindow(index, normalized);
        }

        this.setAwaitingConfirmationId(index, confirmationId);
    }

    // AS3: .../IlluminaChatBubbleWidget.as::appendMessage()
    public appendMessage(message: ChatBubbleMessage | string, prepend: boolean = false, confirmationId: number = 0): void
    {
        const normalized = IlluminaChatBubbleWidget.normalizeMessage(message);
        const window = this.createMessageWindow(normalized);
        let index: number;

        if(prepend)
        {
            index = 0;
            this._messages.splice(0, 0, normalized);
            this._confirmationIds.splice(0, 0, confirmationId);

            if(window !== null)
            {
                this._messageContainer?.addListItemAt(window, 0);
            }
        }
        else
        {
            index = this.numMessages;
            this._messages.push(normalized);
            this._confirmationIds.push(confirmationId);

            if(window !== null)
            {
                this._messageContainer?.addListItem(window);
            }
        }

        this.setAwaitingConfirmationId(index, confirmationId);
    }

    /**
     * AS3 types the message parameters `*` and accepts a bare string, which the property
     * round-trip below relies on. Kept, rather than tightened: `setMessages()` feeds it
     * strings straight out of the serialized property.
     */
    // AS3: .../IlluminaChatBubbleWidget.as::normalizeMessage()
    private static normalizeMessage(value: ChatBubbleMessage | string | null): ChatBubbleMessage
    {
        if(value instanceof ChatBubbleMessage)
        {
            return value;
        }

        return ChatBubbleMessage.text(value ?? '');
    }

    // DEVIATION: AS3 also handles habbicon messages here; the RPG fork removed Habbicons (see the
    //   class comment).
    // AS3: .../IlluminaChatBubbleWidget.as::createMessageWindow()
    private createMessageWindow(message: ChatBubbleMessage): IWindow | null
    {
        const text = this._messageTemplate?.clone() as ITextWindow | null;

        if(text === null || text === undefined)
        {
            return null;
        }

        text.caption = message.textValue;

        return text as unknown as IWindow;
    }

    // DEVIATION: AS3 also handles habbicon messages here; the RPG fork removed Habbicons (see the
    //   class comment).
    // AS3: .../IlluminaChatBubbleWidget.as::updateMessageWindow()
    private updateMessageWindow(index: number, message: ChatBubbleMessage): void
    {
        const item = this._messageContainer?.getListItemAt(index) ?? null;

        if(item === null)
        {
            return;
        }

        item.caption = message.textValue;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::setAwaitingConfirmationId()
    public setAwaitingConfirmationId(messageIndex: number, confirmationId: number): void
    {
        if(messageIndex < this._confirmationIds.length)
        {
            this._confirmationIds[messageIndex] = confirmationId;
        }
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::clearAwaitingConfirmationId()
    public clearAwaitingConfirmationId(messageIndex: number): void
    {
        if(messageIndex < this._confirmationIds.length)
        {
            this._confirmationIds[messageIndex] = 0;
        }
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::getAwaitingConfirmationId()
    public getAwaitingConfirmationId(messageIndex: number): number
    {
        return this._confirmationIds[messageIndex] ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get iterator()
    public iterator(): IIterator
    {
        return EmptyIterator.INSTANCE;
    }

    // DEVIATION: AS3 also handles habbicon messages here; the RPG fork removed Habbicons (see the
    //   class comment).
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        if(this._root)
        {
            this._root.procedure = null;
            this._root.dispose();
            this._root = null;
        }

        if(this._messageTemplate)
        {
            this._messageTemplate.dispose();
            this._messageTemplate = null;
        }

        this._messageContainer = null;
        this._spacedMessageContainer = null;
        this._userNameLabel = null;
        this._userAvatarWidget = null;
        this._bubbleWrapper = null;
        this._postTimeWidget = null;
        this._offlinePlaceholder = null;
        this._arrowPoint = null;
        this._messageRegion = null;

        if(this._widgetWindow)
        {
            this._widgetWindow.rootWindow = null;
        }

        this._widgetWindow = null;
        this._windowManager = null;
        this._messages = [];
        this._confirmationIds = [];
    }

    /**
	 * Root procedure for handling window events on the chat bubble tree.
	 *
	 * @param event - The window event
	 * @param window - The source window
	 */
    /**
     * Nothing called `refresh()` before, because there was nothing to lay out — the whole
     * body was a comment saying the client handled it. Both resize events drive it in AS3,
     * and the bubble does not size itself without them.
     */
    // AS3: .../IlluminaChatBubbleWidget.as::rootProcedure()
    private rootProcedure(event: WindowEvent, window: IWindow): void
    {
        if(this._disposed)
        {
            return;
        }

        switch(event.type)
        {
            case 'WE_RESIZED':
            case 'WE_CHILD_RESIZED':
                this.refresh();
                break;

            case 'WME_CLICK':
                // Clicking the name opens that user's profile. Guarded on a positive id
                // because a group conversation carries a negative one, and on the region's
                // name because the whole bubble shares this procedure.
                if(this.userId > 0 && window.name === 'user_name_region')
                {
                    this._windowManager?.communication?.connection?.send(new GetExtendedProfileMessageComposer(this.userId));
                }

                break;
        }
    }
}
