/**
 * "The server says this account may zoom with the wheel" — the client-side half of the MOUSE_ZOOM
 * perk, raised by `RoomUI` when the perk-allowances packet lands and consumed by `RoomDesktop`.
 *
 * It carries the answer, but AS3's consumer does not read it: `RoomDesktop` re-binds the wheel on
 * *any* RDMZEE_ENABLED, whatever the flag says. Transcribed with the field kept, because the flag
 * is what the event is for and a reader looking for it should find it.
 *
 * Not a `RoomWidgetUpdateEvent` — AS3 extends `flash.events.Event` directly here, which is why it
 * goes through `processEvent()` rather than the widget bus.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/events/RoomDesktopMouseZoomEnableEvent.as
 */
export class RoomDesktopMouseZoomEnableEvent
{
    /** Derived name — `_SafeStr_10361`, named from its value. */
    // AS3: RoomDesktopMouseZoomEnableEvent.as::_SafeStr_10361
    public static readonly ENABLED: string = 'RDMZEE_ENABLED';

    // TS-only: AS3 inherits `type` from flash.events.Event; this port's plain object declares it.
    public readonly type: string = RoomDesktopMouseZoomEnableEvent.ENABLED;

    /** Derived name — `_SafeStr_5833`: whether the perk is allowed. */
    // AS3: RoomDesktopMouseZoomEnableEvent.as::_SafeStr_5833
    private _enabled: boolean;

    // AS3: RoomDesktopMouseZoomEnableEvent.as::RoomDesktopMouseZoomEnableEvent()
    constructor(enabled: boolean)
    {
        this._enabled = enabled;
    }

    /** TS-only: AS3 stores the flag and never exposes or reads it. */
    // TS-only: no AS3 counterpart; the field is private and unread there.
    public get enabled(): boolean
    {
        return this._enabled;
    }
}
