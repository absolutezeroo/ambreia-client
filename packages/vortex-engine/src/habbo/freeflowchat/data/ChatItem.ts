import type {RoomSessionChatEvent} from '@habbo/session/events/RoomSessionChatEvent';
import type {IChatLink} from '@habbo/communication/messages/parser/room/chat/ChatMessageEventParser';
import type {IVector3d} from '@room/utils/IVector3d';
import {Vector3d} from '@room/utils/Vector3d';

/**
 * Chat message data model. Contains all the data for a single chat message
 * including the user, room, text, style, and optional forced rendering parameters.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/data/ChatItem.as
 */
export class ChatItem
{
    /**
	 * Creates a new ChatItem from a room session chat event.
	 *
	 * @param event The room session chat event
	 * @param timeStamp The timestamp (from getTimer / performance.now)
	 * @param userLocation Optional 3D location of the user in the room
	 * @param extraParam Optional extra parameter
	 * @param forcedScreenLocation Optional forced screen location for rendering
	 * @param forcedColor Optional forced text colour
	 * @param forcedFigure Optional forced avatar figure string
	 * @param forcedUserName Optional forced user name string
	 */
    constructor(
        event: RoomSessionChatEvent,
        timeStamp: number,
        userLocation: IVector3d | null = null,
        extraParam: number = 0,
        forcedScreenLocation: unknown = null,
        forcedColor: number | null = null,
        forcedFigure: string | null = null,
        forcedUserName: string | null = null
    )
    {
        this._timeStamp = timeStamp;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/data/ChatItem.as::ChatItem()
        // Must copy: RoomObject.getLocation() hands back a single shared _locationCache per object,
        // reassigned on every call — holding the reference makes every bubble track the live avatar.
        this._userLocation = userLocation !== null
            ? new Vector3d(userLocation.x, userLocation.y, userLocation.z)
            : null;

        this._userId = event.userId;

        if(event.session)
        {
            this._roomId = event.session.roomId;
        }
        else
        {
            this._roomId = 1;
        }

        this._text = event.text;
        this._chatType = event.chatType;
        this._style = event.styleId;
        this._links = event.links ?? [];
        this._forcedColor = forcedColor;
        this._forcedScreenLocation = forcedScreenLocation;
        this._forcedFigure = forcedFigure;
        this._forcedUserName = forcedUserName;
        this._extraParam = extraParam;
    }

    private _timeStamp: number = 0;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get timeStamp()
    get timeStamp(): number
    {
        return this._timeStamp;
    }

    private _userId: number = 0;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    private _roomId: number = 0;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get roomId()
    get roomId(): number
    {
        return this._roomId;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::_text
    private _text: string = '';

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get text()
    get text(): string
    {
        return this._text;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::set text()
    set text(value: string)
    {
        this._text = value;
    }

    private _chatType: number = 0;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get chatType()
    get chatType(): number
    {
        return this._chatType;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::_style
    private _style: number = 0;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get style()
    get style(): number
    {
        return this._style;
    }

    // Overridden for special system messages (handitem, mutetime, pet events, …) by
    // `ChatBubbleFactory.applySpecialChatContent()`, which this used to be traced to by mistake.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/data/ChatItem.as::set style()
    set style(value: number)
    {
        this._style = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/freeflowchat/data/ChatItem.as::links
    // Was `string[]` (display text only) — widened to the full parsed IChatLink[]
    // (url/displayText/isTrusted) since ChatBubble/PooledChatBubble need the real url to
    // build a clickable link, and RoomSessionChatEvent already carries it unmodified.
    private _links: IChatLink[];

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get links()
    get links(): IChatLink[]
    {
        return this._links;
    }

    private _userLocation: IVector3d | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get userLocation()
    get userLocation(): IVector3d | null
    {
        return this._userLocation;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::_forcedColor
    private _forcedColor: number | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get forcedColor()
    get forcedColor(): number | null
    {
        return this._forcedColor;
    }

    private _forcedScreenLocation: unknown = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get forcedScreenLocation()
    get forcedScreenLocation(): unknown
    {
        return this._forcedScreenLocation;
    }

    private _forcedFigure: string | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get forcedFigure()
    get forcedFigure(): string | null
    {
        return this._forcedFigure;
    }

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::_forcedUserName
    private _forcedUserName: string | null = null;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get forcedUserName()
    get forcedUserName(): string | null
    {
        return this._forcedUserName;
    }

    private _extraParam: number = 0;

    // AS3: .../src/com/sulake/habbo/freeflowchat/data/ChatItem.as::get extraParam()
    get extraParam(): number
    {
        return this._extraParam;
    }
}
