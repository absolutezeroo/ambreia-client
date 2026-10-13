import type {IRoomSession} from '../IRoomSession';
import type {IChatLink} from '@ambreia/protocol/parser/room/chat/ChatMessageEventParser';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session chat event
 *
 * Based on AS3: com.sulake.habbo.session.events.RoomSessionChatEvent
 */
export class RoomSessionChatEvent extends RoomSessionEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::ROOM_SESSION_CHAT_EVENT
    public static readonly RSCE_CHAT_EVENT = 'RSCE_CHAT_EVENT';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::ROOM_SESSION_FLOODCONTROL_EVENT
    public static readonly RSCE_FLOOD_EVENT = 'RSCE_FLOOD_EVENT';

    // Chat types
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::CHAT_TYPE_SPEAK
    public static readonly CHAT_TYPE_SPEAK = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::CHAT_TYPE_WHISPER
    public static readonly CHAT_TYPE_WHISPER = 1;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::CHAT_TYPE_SHOUT
    public static readonly CHAT_TYPE_SHOUT = 2;
    // 5 was the hand-item bubble, 7, 8 and 9 were the monsterplant supplement bubbles (revive, rebreed, speed); the RPG fork
    // removed monsterplants. Not renumbered: these are AS3's values.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::CHAT_TYPE_MUTE_REMAINING
    public static readonly CHAT_TYPE_MUTE_REMAINING = 10;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::CHAT_TYPE_PING
    public static readonly CHAT_TYPE_PING = 11;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::CHAT_TYPE_SPECIAL_SYSTEM
    public static readonly CHAT_TYPE_SPECIAL_SYSTEM = 12;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::RoomSessionChatEvent()
    // `links` passes the parser's raw link objects straight through, matching
    // AS3 (RoomChatHandler.as never transforms them either).
    constructor(
        type: string,
        session: IRoomSession,
        userId: number,
        text: string,
        chatType: number,
        styleId: number,
        links: IChatLink[] | null = null,
        extraParam: number = -1
    )
    {
        super(type, session);
        this._userId = userId;
        this._text = text;
        this._chatType = chatType;
        this._styleId = styleId;
        this._links = links;
        this._extraParam = extraParam;
    }

    private _userId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::_text
    private _text: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::get text()
    get text(): string
    {
        return this._text;
    }

    private _chatType: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::get chatType()
    get chatType(): number
    {
        return this._chatType;
    }

    private _styleId: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::get style()
    get styleId(): number
    {
        return this._styleId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::get links()
    private _links: IChatLink[] | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::get links()
    get links(): IChatLink[] | null
    {
        return this._links;
    }

    private _extraParam: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/events/RoomSessionChatEvent.as::get extraParam()
    get extraParam(): number
    {
        return this._extraParam;
    }
}
