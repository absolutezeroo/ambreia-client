/**
 * RoomObjectRoomAdEvent
 *
 * Based on AS3: com.sulake.habbo.room.events.RoomObjectRoomAdEvent
 *
 * Event dispatched for room advertisement interactions.
 */
import {RoomObjectEvent} from '../../events/RoomObjectEvent';
import type {IRoomObject} from '../../object/IRoomObject';

export class RoomObjectRoomAdEvent extends RoomObjectEvent
{
    /**
     * Asks the engine to fetch the billboard's picture.
     *
     * The only one of the five with no `RoomEngineObjectEvent` behind it: `RoomEngine` turns it
     * into an ad-manager request and answers later through `onRoomAdImageLoaded()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::ROOM_AD_LOAD_IMAGE
    public static readonly ROOM_AD_LOAD_IMAGE = 'RORAE_ROOM_AD_LOAD_IMAGE';
    // The 2016 build names these five after their own values (`RORAE_…`); the 2026 client drops the
    // prefix from the constant and keeps the value. Values are what travels, so nothing moves here.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::ROOM_AD_TOOLTIP_SHOW
    public static readonly ROOM_AD_TOOLTIP_SHOW = 'RORAE_ROOM_AD_TOOLTIP_SHOW';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::ROOM_AD_TOOLTIP_HIDE
    public static readonly ROOM_AD_TOOLTIP_HIDE = 'RORAE_ROOM_AD_TOOLTIP_HIDE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::ROOM_AD_FURNI_CLICK
    public static readonly ROOM_AD_FURNI_CLICK = 'RORAE_ROOM_AD_FURNI_CLICK';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::ROOM_AD_FURNI_DOUBLE_CLICK
    public static readonly ROOM_AD_FURNI_DOUBLE_CLICK = 'RORAE_ROOM_AD_FURNI_DOUBLE_CLICK';

    constructor(type: string, object: IRoomObject | null, imageUrl: string | null = null, clickUrl: string | null = null)
    {
        super(type, object);
        this._imageUrl = imageUrl;
        this._clickUrl = clickUrl;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::_imageUrl
    private _imageUrl: string | null;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::get imageUrl()
    get imageUrl(): string | null
    {
        return this._imageUrl;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::_clickUrl
    private _clickUrl: string | null;

    // AS3: .../src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::get clickUrl()
    get clickUrl(): string | null
    {
        return this._clickUrl;
    }

    /**
     * Copies the event.
     *
     * AS3 overrides `flash.events.Event.clone()`, which the Flash dispatcher calls when an event
     * already in flight is redispatched. `RoomObjectEvent` here is a plain object with no such
     * base and no `bubbles`/`cancelable`, so nothing in the port calls this — it is carried
     * because the member exists, not because a caller was found.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/events/RoomObjectRoomAdEvent.as::clone()
    public clone(): RoomObjectRoomAdEvent
    {
        return new RoomObjectRoomAdEvent(this.type, this.object, this.imageUrl, this.clickUrl);
    }
}
