/**
 * RoomEngineObjectEvent
 *
 * Based on AS3: com.sulake.habbo.room.events.RoomEngineObjectEvent
 *
 * Event for room object interactions.
 */
import {RoomEngineEvent} from './RoomEngineEvent';

export class RoomEngineObjectEvent extends RoomEngineEvent
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::_SafeStr_10429
    // AS3 name unrecoverable (obfuscated in every tree) - derived from its value. No "_OBJECT_"
    // infix in any of these: that was an invented naming variant, previously diverging from the
    // real wire/event values (harmless internally since every emitter/listener pair agreed with
    // itself, but a trap for literal-string comparisons or a network dump).
    public static readonly REOE_SELECTED = 'REOE_SELECTED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::DESELECTED
    public static readonly REOE_DESELECTED = 'REOE_DESELECTED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::ADDED
    public static readonly REOE_ADDED = 'REOE_ADDED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::REMOVED
    public static readonly REOE_REMOVED = 'REOE_REMOVED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::_SafeStr_10306
    public static readonly REOE_UPDATED = 'REOE_UPDATED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::PLACED
    public static readonly REOE_PLACED = 'REOE_PLACED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::PLACED_ON_USER
    public static readonly REOE_PLACED_ON_USER = 'REOE_PLACED_ON_USER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::CONTENT_UPDATED
    public static readonly REOE_CONTENT_UPDATED = 'REOE_CONTENT_UPDATED';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::REQUEST_MOVE
    public static readonly REOE_REQUEST_MOVE = 'REOE_REQUEST_MOVE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::REQUEST_ROTATE
    public static readonly REOE_REQUEST_ROTATE = 'REOE_REQUEST_ROTATE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::REQUEST_PICKUP
    // Nothing dispatches this yet. In AS3 it comes from the furniture context menu, by way of
    // `_SafeCls_1821.as:767`, and that widget is the gap — recorded on
    // `RoomEngine.modifyRoomObject()`, not here. The constant itself is complete.
    public static readonly REOE_REQUEST_PICKUP = 'REOE_REQUEST_PICKUP';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::MOUSE_ENTER
    public static readonly REOE_MOUSE_ENTER = 'REOE_MOUSE_ENTER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::MOUSE_LEAVE
    public static readonly REOE_MOUSE_LEAVE = 'REOE_MOUSE_LEAVE';

    // AS3's constructor also takes bubbles/cancelable (forwarded to the Flash Event
    // base class) - this port's event system is a plain EventEmitter with no DOM-style bubbling/
    // cancellation semantics, so there is nothing for those two params to control here; every
    // other RoomEngineEvent subclass has the same simplification.
    constructor(type: string, roomId: number, objectId: number, category: number)
    {
        super(type, roomId);
        this._objectId = objectId;
        this._category = category;
    }

    private _objectId: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::get objectId()
    get objectId(): number
    {
        return this._objectId;
    }

    private _category: number;

    // AS3: .../src/com/sulake/habbo/room/events/RoomEngineObjectEvent.as::get category()
    get category(): number
    {
        return this._category;
    }
}
