import type {IWindow} from '../IWindow';
import type {IRectLimiter} from './IRectLimiter';

/**
 * Rectangle size limits for a window.
 *
 * Enforces min/max constraints on the owner window's dimensions.
 * Setting a limit that violates the current size will resize the window.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/WindowRectLimits.as
 */
export class WindowRectLimits implements IRectLimiter
{
    private _owner: IWindow;

    constructor(owner: IWindow)
    {
        this._owner = owner;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::_minWidth
    private _minWidth: number = -2147483648;

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::get minWidth()
    public get minWidth(): number
    {
        return this._minWidth;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::set minWidth()
    public set minWidth(value: number)
    {
        this._minWidth = value;

        if(this._minWidth > -2147483648 && !this._owner.disposed && this._owner.width < this._minWidth)
        {
            this._owner.width = this._minWidth;
        }
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::_maxWidth
    private _maxWidth: number = 2147483647;

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::get maxWidth()
    public get maxWidth(): number
    {
        return this._maxWidth;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::set maxWidth()
    public set maxWidth(value: number)
    {
        this._maxWidth = value;

        if(this._maxWidth < 2147483647 && !this._owner.disposed && this._owner.width > this._maxWidth)
        {
            this._owner.width = this._maxWidth;
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/WindowRectLimits.as::_minHeight
    private _minHeight: number = -2147483648;

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::get minHeight()
    public get minHeight(): number
    {
        return this._minHeight;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::set minHeight()
    public set minHeight(value: number)
    {
        this._minHeight = value;

        if(this._minHeight > -2147483648 && !this._owner.disposed && this._owner.height < this._minHeight)
        {
            this._owner.height = this._minHeight;
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/WindowRectLimits.as::_maxHeight
    private _maxHeight: number = 2147483647;

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::get maxHeight()
    public get maxHeight(): number
    {
        return this._maxHeight;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::set maxHeight()
    public set maxHeight(value: number)
    {
        this._maxHeight = value;

        if(this._maxHeight < 2147483647 && !this._owner.disposed && this._owner.height > this._maxHeight)
        {
            this._owner.height = this._maxHeight;
        }
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::get isEmpty()
    public get isEmpty(): boolean
    {
        return (
            this._minWidth === -2147483648 &&
			this._maxWidth === 2147483647 &&
			this._minHeight === -2147483648 &&
			this._maxHeight === 2147483647
        );
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::setEmpty()
    public setEmpty(): void
    {
        this._minWidth = -2147483648;
        this._maxWidth = 2147483647;
        this._minHeight = -2147483648;
        this._maxHeight = 2147483647;
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::limit()
    public limit(): void
    {
        if(!this.isEmpty && this._owner)
        {
            if(this._owner.width < this._minWidth)
            {
                this._owner.width = this._minWidth;
            }
            else if(this._owner.width > this._maxWidth)
            {
                this._owner.width = this._maxWidth;
            }

            if(this._owner.height < this._minHeight)
            {
                this._owner.height = this._minHeight;
            }
            else if(this._owner.height > this._maxHeight)
            {
                this._owner.height = this._maxHeight;
            }
        }
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::assign()
    public assign(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number): void
    {
        this._minWidth = minWidth;
        this._maxWidth = maxWidth;
        this._minHeight = minHeight;
        this._maxHeight = maxHeight;
        this.limit();
    }

    // AS3: .../src/com/sulake/core/window/utils/WindowRectLimits.as::clone()
    public clone(owner?: unknown): WindowRectLimits
    {
        const result = new WindowRectLimits(owner as IWindow);
        result._minWidth = this._minWidth;
        result._maxWidth = this._maxWidth;
        result._minHeight = this._minHeight;
        result._maxHeight = this._maxHeight;

        return result;
    }
}
