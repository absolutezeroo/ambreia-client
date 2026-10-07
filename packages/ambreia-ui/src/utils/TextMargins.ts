import type {IMargins} from './IMargins';

/**
 * Text margin implementation with change callback support.
 *
 * When any margin value is modified via setters, the registered
 * callback is invoked with this instance.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/TextMargins.as
 */
export class TextMargins implements IMargins
{
    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::_callback
    private _callback: ((margins: IMargins) => void) | null;

    constructor(left: number = 0, top: number = 0, right: number = 0, bottom: number = 0, callback: ((margins: IMargins) => void) | null = null)
    {
        this._left = left;
        this._top = top;
        this._right = right;
        this._bottom = bottom;
        this._callback = callback ?? TextMargins.nullCallback;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextMargins.as::_left
    private _left: number;

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::get left()
    public get left(): number
    {
        return this._left;
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::set left()
    public set left(value: number)
    {
        this._left = value;

        if(this._callback)
        {
            this._callback(this);
        }
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::_top
    private _top: number;

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::get top()
    public get top(): number
    {
        return this._top;
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::set top()
    public set top(value: number)
    {
        this._top = value;

        if(this._callback)
        {
            this._callback(this);
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextMargins.as::_right
    private _right: number;

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::get right()
    public get right(): number
    {
        return this._right;
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::set right()
    public set right(value: number)
    {
        this._right = value;

        if(this._callback)
        {
            this._callback(this);
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/TextMargins.as::_bottom
    private _bottom: number;

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::get bottom()
    public get bottom(): number
    {
        return this._bottom;
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::set bottom()
    public set bottom(value: number)
    {
        this._bottom = value;

        if(this._callback)
        {
            this._callback(this);
        }
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * Returns true if all margins are zero.
	 */
    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::get isZeroes()
    public get isZeroes(): boolean
    {
        return this._left === 0 && this._right === 0 && this._top === 0 && this._bottom === 0;
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::nullCallback()
    private static nullCallback(_margins: IMargins): void
    {
        // No-op
    }

    /**
	 * Reassigns all margins and the callback.
	 */
    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::assign()
    public assign(left: number, top: number, right: number, bottom: number, callback: ((margins: IMargins) => void) | null = null): void
    {
        this._left = left;
        this._top = top;
        this._right = right;
        this._bottom = bottom;
        this._callback = callback ?? TextMargins.nullCallback;
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::clone()
    public clone(callback: ((margins: IMargins) => void) | null = null): TextMargins
    {
        return new TextMargins(this._left, this._top, this._right, this._bottom, callback);
    }

    // AS3: .../src/com/sulake/core/window/utils/TextMargins.as::dispose()
    public dispose(): void
    {
        this._callback = null;
        this._disposed = true;
    }
}
