/**
 * RoomWidgetChatUpdateEvent
 *
 * @see sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as
 * (primary win63_version copy has decompiler corruption; cross-checked here)
 */
import type {IChatLink} from '@habbo/communication/messages/parser/room/chat/ChatMessageEventParser';
import {RoomWidgetUpdateEvent} from './RoomWidgetUpdateEvent';

export class RoomWidgetChatUpdateEvent extends RoomWidgetUpdateEvent
{
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::WIDGET_UPDATE_EVENT_CHAT
    public static readonly WIDGET_UPDATE_EVENT_CHAT: string = 'RWCUE_EVENT_CHAT';

    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_SPEAK
    public static readonly CHAT_TYPE_SPEAK: number = 0;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_WHISPER
    public static readonly CHAT_TYPE_WHISPER: number = 1;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_SHOUT
    public static readonly CHAT_TYPE_SHOUT: number = 2;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_RESPECT
    public static readonly CHAT_TYPE_RESPECT: number = 3;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_PETRESPECT
    public static readonly CHAT_TYPE_PETRESPECT: number = 4;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_NOTIFY
    public static readonly CHAT_TYPE_NOTIFY: number = 5;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_PETTREAT
    public static readonly CHAT_TYPE_PETTREAT: number = 6;
    // 7, 8 and 9 were the monsterplant supplement bubbles (revive, rebreed, speed); the RPG fork
    // removed monsterplants. Not renumbered: these are AS3's values.
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_BOT_SPEAK
    public static readonly CHAT_TYPE_BOT_SPEAK: number = 10;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_BOT_SHOUT
    public static readonly CHAT_TYPE_BOT_SHOUT: number = 11;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::CHAT_TYPE_BOT_WHISPER
    public static readonly CHAT_TYPE_BOT_WHISPER: number = 12;

    private _userId: number;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::_text
    private _text: string;
    private _chatType: number;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::_userName
    private _userName: string;
    private _userCategory: number;
    private _userType: number;
    private _petType: number;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get links()
    private _links: IChatLink[] | null;
    private _userX: number;
    private _userY: number;
    private _userImage: ImageBitmap | null;
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::_userColor
    private _userColor: number;
    private _roomId: number;
    private _styleId: number;

    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::RoomWidgetChatUpdateEvent()
    constructor(
        type: string, userId: number, text: string, userName: string, userCategory: number,
        userType: number, petType: number, userX: number, userY: number, userImage: ImageBitmap | null,
        userColor: number, roomId: number, chatType: number = 0, styleId: number = 0, links: IChatLink[] | null = null
    )
    {
        super(type);

        this._userId = userId;
        this._text = text;
        this._chatType = chatType;
        this._userName = userName;
        this._userCategory = userCategory;
        this._userType = userType;
        this._petType = petType;
        this._links = links;
        this._userX = userX;
        this._userY = userY;
        this._userImage = userImage;
        this._userColor = userColor;
        this._roomId = roomId;
        this._styleId = styleId;
    }

    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get userId()
    public get userId(): number { return this._userId; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get text()
    public get text(): string { return this._text; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get chatType()
    public get chatType(): number { return this._chatType; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get userName()
    public get userName(): string { return this._userName; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get userCategory()
    public get userCategory(): number { return this._userCategory; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get userType()
    public get userType(): number { return this._userType; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get petType()
    public get petType(): number { return this._petType; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get links()
    public get links(): IChatLink[] | null { return this._links; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get userX()
    public get userX(): number { return this._userX; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get userY()
    public get userY(): number { return this._userY; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get userImage()
    public get userImage(): ImageBitmap | null { return this._userImage; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get userColor()
    public get userColor(): number { return this._userColor; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get roomId()
    public get roomId(): number { return this._roomId; }
    // AS3: sources/win63_version/habbo/ui/widget/events/RoomWidgetChatUpdateEvent.as::get styleId()
    public get styleId(): number { return this._styleId; }
}
