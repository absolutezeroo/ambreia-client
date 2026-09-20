import type {IIlluminaChatBubbleWidget} from './IIlluminaChatBubbleWidget';
import type {IWidgetWindow} from '@core/window/components/IWidgetWindow';
import type {IHabboWindowManager} from '../IHabboWindowManager';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import {PropertyStruct} from '@core/window/utils/PropertyStruct';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IStaticBitmapWrapperWindow} from '@core/window/components/IStaticBitmapWrapperWindow';
import {HabbiconAssetManager} from '@habbo/habbicons/assets/HabbiconAssetManager';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import {ChatBubbleMessage} from './ChatBubbleMessage';
import {Logger} from '@core/utils/Logger';
import {GetExtendedProfileMessageComposer} from '@habbo/communication/messages/outgoing/users/GetExtendedProfileMessageComposer';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import type {IIterator} from '@core/window/utils/IIterator';
import {EmptyIterator} from '@core/window/iterators/EmptyIterator';

const log = Logger.getLogger('habbo.window.widgets.IlluminaChatBubbleWidget');

/**
 * Illumina chat bubble widget.
 *
 * Renders a chat bubble with avatar, username, message list, timestamp,
 * and online status indicator. Supports flipped layout and message
 * confirmation tracking.
 *
 * Each message is its own window in the `message_container` item list, cloned from one of
 * two templates the layout ships: `message_template` for text, `habbicon_template` for a
 * habbicon. The widget used to keep messages as a `string[]` and never clone anything, so
 * nothing a conversation contained was ever drawn.
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

    // AS3: .../IlluminaChatBubbleWidget.as::_SafeStr_11129 (habbicon box side, in pixels)
    private static readonly HABBICON_SIZE: number = 80;

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
    private _habbiconTemplate: IWindowContainer | null = null;
    private _spacedMessageContainer: IWindow | null = null;
    private _userNameLabel: IWindow | null = null;
    private _userAvatarWidget: IWindow | null = null;
    private _bubbleWrapper: IWindowContainer | null = null;
    private _postTimeWidget: IWindow | null = null;
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

            // The *parent* of the avatar, not the avatar: refresh() moves this whole holder
            // from one side of the bubble to the other and measures the wrapper against its
            // width. AS3 reads it as `_loc3_.parent` off the same lookup.
            this._avatarHolder = this._userAvatarWidget?.parent as unknown as IWindow | null ?? null;

            this._bubbleWrapper = root.findChildByName('bubble_wrapper') as IWindowContainer | null;
            this._postTimeWidget = root.findChildByName('post_time');
            this._offlinePlaceholder = root.findChildByName('offline_placeholder');
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

                this._habbiconTemplate = this._messageContainer.getListItemByName('habbicon_template') as IWindowContainer | null;

                if(this._habbiconTemplate !== null)
                {
                    this._messageContainer.removeListItem(this._habbiconTemplate as unknown as IWindow);
                }
            }

            // Disable param flag 1 on message region
            if(this._messageRegion)
            {
                this._messageRegion.setParamFlag(IlluminaChatBubbleWidget.PARAM_FLAG_1, false);
            }

            root.procedure = this._rootProcedureBound;

            // Set rootWindow with param flag 147456
            this._widgetWindow.rootWindow = root as unknown as IWindow;
            (this._widgetWindow as IWindow).setParamFlag(IlluminaChatBubbleWidget.PARAM_FLAG_147456, true);
        }
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::_disposed
    private _disposed: boolean = false;
    // Name DERIVED — obfuscated as `_SafeStr_7758` in the primary tree. One subscription at a
    // time, however many habbicon rows are waiting for the same pack.
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::_awaitingHabbiconAssets
    private _awaitingHabbiconAssets: boolean = false;

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

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::_userName
    private _userName: string = '';

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get userName()
    public get userName(): string
    {
        return this._userName;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set userName()
    public set userName(value: string)
    {
        this._userName = value;
    }

    private _userId: number = 0;

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get userId()
    public get userId(): number
    {
        return this._userId;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set userId()
    public set userId(value: number)
    {
        this._userId = value;
    }

    private _figure: string = '';

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get figure()
    public get figure(): string
    {
        return this._figure;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set figure()
    public set figure(value: string)
    {
        this._figure = value;
    }

    private _timeStamp: number = 0;

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::get timeStamp()
    public get timeStamp(): number
    {
        return this._timeStamp;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::set timeStamp()
    public set timeStamp(value: number)
    {
        this._timeStamp = value;
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
            new PropertyStruct(IlluminaChatBubbleWidget.USER_NAME_KEY, this._userName),
            new PropertyStruct(IlluminaChatBubbleWidget.FIGURE_KEY, this._figure),
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

                if((this._messages[i]?.type ?? ChatBubbleMessage.TYPE_TEXT) === ChatBubbleMessage.TYPE_TEXT)
                {
                    item.width = wrapperWindow.width - IlluminaChatBubbleWidget.TEXT_WIDTH_INSET;
                }
                else
                {
                    item.width = IlluminaChatBubbleWidget.HABBICON_SIZE;
                    item.height = IlluminaChatBubbleWidget.HABBICON_SIZE;
                }
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

    // AS3: .../IlluminaChatBubbleWidget.as::createMessageWindow()
    private createMessageWindow(message: ChatBubbleMessage): IWindow | null
    {
        if(message.type === ChatBubbleMessage.TYPE_HABBICON)
        {
            return this.createHabbiconMessage(message);
        }

        const text = this._messageTemplate?.clone() as ITextWindow | null;

        if(text === null || text === undefined)
        {
            return null;
        }

        text.caption = message.textValue;

        return text as unknown as IWindow;
    }

    // AS3: .../IlluminaChatBubbleWidget.as::createHabbiconMessage()
    private createHabbiconMessage(message: ChatBubbleMessage): IWindow | null
    {
        const window = this._habbiconTemplate?.clone() as IWindowContainer | null;

        if(window === null || window === undefined)
        {
            return null;
        }

        (window as unknown as IWindow).visible = true;
        (window as unknown as IWindow).width = IlluminaChatBubbleWidget.HABBICON_SIZE;
        (window as unknown as IWindow).height = IlluminaChatBubbleWidget.HABBICON_SIZE;

        this.renderHabbicon(window, message.habbiconId);

        return window as unknown as IWindow;
    }

    // AS3: .../IlluminaChatBubbleWidget.as::updateMessageWindow()
    private updateMessageWindow(index: number, message: ChatBubbleMessage): void
    {
        const item = this._messageContainer?.getListItemAt(index) ?? null;

        if(item === null)
        {
            return;
        }

        if(message.type === ChatBubbleMessage.TYPE_HABBICON)
        {
            this.renderHabbicon(item as unknown as IWindowContainer, message.habbiconId);
        }
        else
        {
            item.caption = message.textValue;
        }
    }

    /**
     * Sizes the habbicon box and fills its bitmap.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::renderHabbicon()
    private renderHabbicon(window: IWindowContainer, habbiconId: number): void
    {
        const asWindow = window as unknown as IWindow;

        asWindow.width = IlluminaChatBubbleWidget.HABBICON_SIZE;
        asWindow.height = IlluminaChatBubbleWidget.HABBICON_SIZE;

        const bitmapWindow = window.findChildByName('habbicon_bitmap') as IStaticBitmapWrapperWindow | null;

        if(bitmapWindow === null) return;

        // AS3 sets `disposesBitmap = true` alongside this; the port's wrapper has no such flag
        // because assigning `bitmapData` replaces whatever it held.
        bitmapWindow.bitmapData = this.createHabbiconBitmap(habbiconId);
    }

    /**
	 * The preview is drawn at 2x into an 80x80 surface, mirrored when the habbicon faces the way
	 * the bubble does not. A pack that has not arrived yet gives null once, and the widget
	 * subscribes to `ASSETS_LOADED` to redraw every habbicon row when it does.
	 *
	 * AS3 returns an empty 80x80 `BitmapData` in that case where this returns null; both leave the
	 * box laid out and blank, so a habbicon message occupies its space instead of collapsing.
	 */
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::createHabbiconBitmap()
    private createHabbiconBitmap(habbiconId: number): ImageBitmap | null
    {
        const preview = HabbiconAssetManager.getPreviewBitmap(habbiconId, false);

        if(preview === null)
        {
            if(!this._awaitingHabbiconAssets)
            {
                HabbiconAssetManager.addEventListener(HabbiconAssetManager.ASSETS_LOADED, this.onHabbiconAssetsLoaded);
                this._awaitingHabbiconAssets = true;
            }

            return null;
        }

        const size = IlluminaChatBubbleWidget.HABBICON_SIZE;
        const canvas = new OffscreenCanvas(size, size);
        const context = canvas.getContext('2d');

        if(context === null) return null;

        // AS3's Matrix: scale(-2,2) then translate(width*2,0) for the mirror, scale(2,2) otherwise.
        if(this.shouldMirrorHabbicon(habbiconId)) context.setTransform(-2, 0, 0, 2, preview.width * 2, 0);
        else context.setTransform(2, 0, 0, 2, 0, 0);

        context.drawImage(preview, 0, 0);

        return canvas.transferToImageBitmap();
    }

    /** Mirror only when both directions are known and they disagree. */
    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::shouldMirrorHabbicon()
    private shouldMirrorHabbicon(habbiconId: number): boolean
    {
        // Typed `number`, not the inferred `1 | -1`: AS3's local is an `int` and its `!= 0` test is
        // vacuous there too. Kept verbatim rather than dropped — narrowing it makes TS reject the
        // comparison the AS3 actually writes.
        const bubbleDirection: number = this._flipped ? -1 : 1;
        const habbiconDirection = HabbiconAssetManager.getDirection(habbiconId);

        return bubbleDirection !== 0 && habbiconDirection !== 0 && bubbleDirection !== habbiconDirection;
    }

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::onHabbiconAssetsLoaded()
    private onHabbiconAssetsLoaded = (): void =>
    {
        HabbiconAssetManager.removeEventListener(HabbiconAssetManager.ASSETS_LOADED, this.onHabbiconAssetsLoaded);

        this._awaitingHabbiconAssets = false;

        if(this._disposed) return;

        for(let i = 0; i < this.numMessages; i++)
        {
            const message = this._messages[i];

            if(message?.type !== ChatBubbleMessage.TYPE_HABBICON) continue;

            const item = this._messageContainer?.getListItemAt(i) ?? null;

            if(item !== null) this.renderHabbicon(item as unknown as IWindowContainer, message.habbiconId);
        }
    };

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

    // AS3: .../src/com/sulake/habbo/window/widgets/IlluminaChatBubbleWidget.as::dispose()
    public dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        // AS3 unsubscribes here unconditionally, as this does.
        HabbiconAssetManager.removeEventListener(HabbiconAssetManager.ASSETS_LOADED, this.onHabbiconAssetsLoaded);
        this._awaitingHabbiconAssets = false;

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
                if(this._userId > 0 && window.name === 'user_name_region')
                {
                    this._windowManager?.communication?.connection?.send(new GetExtendedProfileMessageComposer(this._userId));
                }

                break;
        }
    }
}
