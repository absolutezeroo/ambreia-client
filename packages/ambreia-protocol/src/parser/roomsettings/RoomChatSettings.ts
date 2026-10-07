/**
 * RoomChatSettings
 *
 * The room's chat display preferences as the settings dialog holds them.
 *
 * This revision no longer sends mode, bubble width or scroll speed with the room settings —
 * only flood sensitivity travels, and the other three are filled in from AS3's own defaults
 * by `fromFloodSensitivity()`. It is therefore built from plain values, never straight off
 * the wire, which is why there is no wrapper constructor here. The identically-named class
 * under `incoming/navigator/` is a different message and still reads all five fields.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1710/_SafeCls_1709.as
 */
export class RoomChatSettings
{
    // AS3: .../_SafeCls_1709.as::MODE_FREE_FLOW
    static readonly MODE_FREE_FLOW: number = 0;
    // AS3: .../_SafeCls_1709.as::MODE_LINE_BY_LINE
    static readonly MODE_LINE_BY_LINE: number = 1;

    // AS3: .../_SafeCls_1709.as::BUBBLE_WIDTH_NORMAL
    static readonly BUBBLE_WIDTH_NORMAL: number = 0;
    // AS3: .../_SafeCls_1709.as::BUBBLE_WIDTH_THIN
    static readonly BUBBLE_WIDTH_THIN: number = 1;
    // AS3: .../_SafeCls_1709.as::BUBBLE_WIDTH_WIDE
    static readonly BUBBLE_WIDTH_WIDE: number = 2;

    // AS3: .../_SafeCls_1709.as::SCROLL_SPEED_FAST
    static readonly SCROLL_SPEED_FAST: number = 0;
    // AS3: .../_SafeCls_1709.as::SCROLL_SPEED_NORMAL
    static readonly SCROLL_SPEED_NORMAL: number = 1;
    // AS3: .../_SafeCls_1709.as::SCROLL_SPEED_SLOW
    static readonly SCROLL_SPEED_SLOW: number = 2;

    // AS3: .../_SafeCls_1709.as::FLOOD_SENSITIVITY_LOOSE
    static readonly FLOOD_SENSITIVITY_LOOSE: number = 0;
    // AS3: .../_SafeCls_1709.as::FLOOD_SENSITIVITY_NORMAL
    static readonly FLOOD_SENSITIVITY_NORMAL: number = 1;
    // AS3: .../_SafeCls_1709.as::FLOOD_SENSITIVITY_STRICT
    static readonly FLOOD_SENSITIVITY_STRICT: number = 2;

    // AS3: .../_SafeCls_1709.as::_mode
    private _mode: number;

    // AS3: .../_SafeCls_1709.as::_SafeStr_9161
    private _bubbleWidth: number;

    // AS3: .../_SafeCls_1709.as::_SafeStr_8807
    private _scrollSpeed: number;

    // AS3: .../_SafeCls_1709.as::_SafeStr_9678
    private _floodSensitivity: number;

    // AS3: .../_SafeCls_1709.as::_SafeCls_1709()
    constructor(mode: number = 0, bubbleWidth: number = 1, scrollSpeed: number = 1, floodSensitivity: number = 1)
    {
        this._mode = mode;
        this._bubbleWidth = bubbleWidth;
        this._scrollSpeed = scrollSpeed;
        this._floodSensitivity = floodSensitivity;
    }

    /** Free flow, normal width, normal speed — AS3's literals, not a guess. */
    // AS3: .../_SafeCls_1709.as::fromFloodSensitivity()
    static fromFloodSensitivity(floodSensitivity: number): RoomChatSettings
    {
        return new RoomChatSettings(0, 1, 1, floodSensitivity);
    }

    // AS3: .../_SafeCls_1709.as::get mode()
    get mode(): number
    {
        return this._mode;
    }

    // AS3: .../_SafeCls_1709.as::get bubbleWidth()
    get bubbleWidth(): number
    {
        return this._bubbleWidth;
    }

    // AS3: .../_SafeCls_1709.as::get scrollSpeed()
    get scrollSpeed(): number
    {
        return this._scrollSpeed;
    }

    // AS3: .../_SafeCls_1709.as::get floodSensitivity()
    get floodSensitivity(): number
    {
        return this._floodSensitivity;
    }
}
