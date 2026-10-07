/**
 * RoomObjectMouseEvent
 *
 * Based on AS3: com.sulake.room.events.RoomObjectMouseEvent
 *
 * Mouse event for room objects.
 */
import {RoomObjectEvent} from './RoomObjectEvent';
import type {IRoomObject} from '../object/IRoomObject';

export class RoomObjectMouseEvent extends RoomObjectEvent
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::ROE_MOUSE_MOVE
    public static readonly ROE_MOUSE_MOVE = 'ROE_MOUSE_MOVE';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::ROE_MOUSE_CLICK
    public static readonly ROE_MOUSE_CLICK = 'ROE_MOUSE_CLICK';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::ROE_MOUSE_DOUBLE_CLICK
    public static readonly ROE_MOUSE_DOUBLE_CLICK = 'ROE_MOUSE_DOUBLE_CLICK';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::ROE_MOUSE_DOWN
    public static readonly ROE_MOUSE_DOWN = 'ROE_MOUSE_DOWN';
    public static readonly ROE_MOUSE_UP = 'ROE_MOUSE_UP';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::ROE_MOUSE_ENTER
    public static readonly ROE_MOUSE_ENTER = 'ROE_MOUSE_ENTER';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::ROE_MOUSE_LEAVE
    public static readonly ROE_MOUSE_LEAVE = 'ROE_MOUSE_LEAVE';

    constructor(
        type: string,
        object: IRoomObject | null,
        eventId: string = '',
        altKey: boolean = false,
        ctrlKey: boolean = false,
        shiftKey: boolean = false,
        buttonDown: boolean = false
    )
    {
        super(type, object);
        this._eventId = eventId;
        this._altKey = altKey;
        this._ctrlKey = ctrlKey;
        this._shiftKey = shiftKey;
        this._buttonDown = buttonDown;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::_eventId
    private _eventId: string;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get eventId()
    get eventId(): string
    {
        return this._eventId;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::_altKey
    private _altKey: boolean;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get altKey()
    get altKey(): boolean
    {
        return this._altKey;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::_ctrlKey
    private _ctrlKey: boolean;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get ctrlKey()
    get ctrlKey(): boolean
    {
        return this._ctrlKey;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::_shiftKey
    private _shiftKey: boolean;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get shiftKey()
    get shiftKey(): boolean
    {
        return this._shiftKey;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::_buttonDown
    private _buttonDown: boolean;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get buttonDown()
    get buttonDown(): boolean
    {
        return this._buttonDown;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::_localX
    private _localX: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get localX()
    get localX(): number
    {
        return this._localX;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::set localX()
    set localX(value: number)
    {
        this._localX = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::_localY
    private _localY: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get localY()
    get localY(): number
    {
        return this._localY;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::set localY()
    set localY(value: number)
    {
        this._localY = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::_spriteOffsetX
    private _spriteOffsetX: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get spriteOffsetX()
    get spriteOffsetX(): number
    {
        return this._spriteOffsetX;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::set spriteOffsetX()
    set spriteOffsetX(value: number)
    {
        this._spriteOffsetX = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomObjectMouseEvent.as::_spriteOffsetY
    private _spriteOffsetY: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::get spriteOffsetY()
    get spriteOffsetY(): number
    {
        return this._spriteOffsetY;
    }

    // AS3: .../src/com/sulake/room/events/RoomObjectMouseEvent.as::set spriteOffsetY()
    set spriteOffsetY(value: number)
    {
        this._spriteOffsetY = value;
    }
}
