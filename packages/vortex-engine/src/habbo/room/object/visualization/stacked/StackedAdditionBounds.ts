/**
 * The union rectangle of everything in a stack, accumulated one member at a time.
 *
 * The first `add()` SETS the bounds rather than growing them from zero, which is the whole point:
 * a stack sitting entirely at negative y — which is the normal case, since additions hang above the
 * avatar — would otherwise get a rectangle stretched down to the origin and a bitmap mostly full of
 * nothing.
 *
 * Named for what it is: the AS3 class is `_SafeCls_4515`, internal, and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/stacked/_SafeCls_4515.as
 */
export class StackedAdditionBounds
{
    // AS3: .../visualization/stacked/_SafeCls_4515.as::minX
    minX: number = 0;

    // AS3: .../visualization/stacked/_SafeCls_4515.as::minY
    minY: number = 0;

    // AS3: .../visualization/stacked/_SafeCls_4515.as::maxX
    maxX: number = 0;

    // AS3: .../visualization/stacked/_SafeCls_4515.as::maxY
    maxY: number = 0;

    // AS3: .../visualization/stacked/_SafeCls_4515.as::_initialized (name derived)
    private _initialized: boolean = false;

    // AS3: .../visualization/stacked/_SafeCls_4515.as::get width()
    get width(): number
    {
        return this.maxX - this.minX;
    }

    // AS3: .../visualization/stacked/_SafeCls_4515.as::get height()
    get height(): number
    {
        return this.maxY - this.minY;
    }

    // AS3: .../visualization/stacked/_SafeCls_4515.as::add()
    add(x: number, y: number, width: number, height: number): void
    {
        if(!this._initialized)
        {
            this.minX = x;
            this.minY = y;
            this.maxX = x + width;
            this.maxY = y + height;
            this._initialized = true;

            return;
        }

        this.minX = Math.min(this.minX, x);
        this.minY = Math.min(this.minY, y);
        this.maxX = Math.max(this.maxX, x + width);
        this.maxY = Math.max(this.maxY, y + height);
    }
}
