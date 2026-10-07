/**
 * RoomSpriteMouseEvent
 *
 * Based on AS3: com.sulake.room.events.RoomSpriteMouseEvent
 *
 * Mouse event data for room sprite interactions.
 */
export class RoomSpriteMouseEvent
{
    constructor(
        type: string,
        eventId: string,
        canvasId: string,
        spriteTag: string,
        screenX: number,
        screenY: number,
        localX: number = 0,
        localY: number = 0,
        ctrlKey: boolean = false,
        altKey: boolean = false,
        shiftKey: boolean = false,
        buttonDown: boolean = false
    )
    {
        this._type = type;
        this._eventId = eventId;
        this._canvasId = canvasId;
        this._spriteTag = spriteTag;
        this._screenX = screenX;
        this._screenY = screenY;
        this._localX = localX;
        this._localY = localY;
        this._ctrlKey = ctrlKey;
        this._altKey = altKey;
        this._shiftKey = shiftKey;
        this._buttonDown = buttonDown;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_type
    private _type: string = '';

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get type()
    get type(): string
    {
        return this._type;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_eventId
    private _eventId: string = '';

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get eventId()
    get eventId(): string
    {
        return this._eventId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_canvasId
    private _canvasId: string = '';

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get canvasId()
    get canvasId(): string
    {
        return this._canvasId;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_spriteTag
    private _spriteTag: string = '';

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get spriteTag()
    get spriteTag(): string
    {
        return this._spriteTag;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_screenX
    private _screenX: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get screenX()
    get screenX(): number
    {
        return this._screenX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_screenY
    private _screenY: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get screenY()
    get screenY(): number
    {
        return this._screenY;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_localX
    private _localX: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get localX()
    get localX(): number
    {
        return this._localX;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_localY
    private _localY: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get localY()
    get localY(): number
    {
        return this._localY;
    }

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::_ctrlKey
    private _ctrlKey: boolean = false;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get ctrlKey()
    get ctrlKey(): boolean
    {
        return this._ctrlKey;
    }

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::_altKey
    private _altKey: boolean = false;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get altKey()
    get altKey(): boolean
    {
        return this._altKey;
    }

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::_shiftKey
    private _shiftKey: boolean = false;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get shiftKey()
    get shiftKey(): boolean
    {
        return this._shiftKey;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_buttonDown
    private _buttonDown: boolean = false;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get buttonDown()
    get buttonDown(): boolean
    {
        return this._buttonDown;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_spriteOffsetX
    private _spriteOffsetX: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get spriteOffsetX()
    get spriteOffsetX(): number
    {
        return this._spriteOffsetX;
    }

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::set spriteOffsetX()
    set spriteOffsetX(value: number)
    {
        this._spriteOffsetX = value;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/events/RoomSpriteMouseEvent.as::_spriteOffsetY
    private _spriteOffsetY: number = 0;

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::get spriteOffsetY()
    get spriteOffsetY(): number
    {
        return this._spriteOffsetY;
    }

    // AS3: .../src/com/sulake/room/events/RoomSpriteMouseEvent.as::set spriteOffsetY()
    set spriteOffsetY(value: number)
    {
        this._spriteOffsetY = value;
    }
}
