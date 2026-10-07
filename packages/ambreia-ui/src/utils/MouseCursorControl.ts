/**
 * Static utility class for cursor management.
 *
 * In AS3 this manipulated the Flash Stage's Mouse cursor, supporting
 * custom DisplayObject cursors and standard cursor types. In TypeScript,
 * this maps cursor types to CSS cursor values, which the client applies to
 * the canvas element hosting the window system.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/MouseCursorControl.as
 */
export class MouseCursorControl
{
    private static _dirty: boolean = true;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/MouseCursorControl.as::_type
    private static _type: number = 0;

    /**
	 * Gets the current cursor type.
	 */
    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::get type()
    public static get type(): number
    {
        return MouseCursorControl._type;
    }

    /**
	 * Sets the cursor type. Only marks dirty if the type actually changes.
	 *
	 * @param value - The cursor type constant
	 */
    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::set type()
    public static set type(value: number)
    {
        if(MouseCursorControl._type !== value)
        {
            MouseCursorControl._type = value;
            MouseCursorControl._dirty = true;
        }
    }

    private static _visible: boolean = true;

    /**
	 * Gets cursor visibility.
	 */
    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::get visible()
    public static get visible(): boolean
    {
        return MouseCursorControl._visible;
    }

    /**
	 * Sets cursor visibility.
	 *
	 * @param value - Whether the cursor should be visible
	 */
    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::set visible()
    public static set visible(value: boolean)
    {
        MouseCursorControl._visible = value;

        if(value)
        {
            document.body.style.cursor = '';
        }
        else
        {
            document.body.style.cursor = 'none';
        }
    }

    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::_disposed
    private static _disposed: boolean = false;

    /**
	 * Whether the cursor control has been disposed.
	 */
    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::get disposed()
    public static get disposed(): boolean
    {
        return MouseCursorControl._disposed;
    }

    /**
	 * Disposes the cursor control.
	 */
    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::dispose()
    public static dispose(): void
    {
        if(!MouseCursorControl._disposed)
        {
            MouseCursorControl._disposed = true;
        }
    }

    /**
	 * Applies the current cursor type by mapping it to a CSS cursor.
	 * Only updates the DOM if the cursor type has changed.
	 */
    // AS3 also declares `defineCustomCursorType(uint, DisplayObject)`, which registers a Flash
    // `DisplayObject` to be drawn as the cursor and followed to the mouse in `onStageMouseMove()`.
    // Nothing calls it — `grep -rn defineCustomCursorType sources/` finds only the declaration —
    // and there is no display list to draw into here: this port maps the cursor type to a CSS
    // `cursor` value on the canvas, so a custom cursor would be an image URL, not an object.
    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::defineCustomCursorType()
    // AS3: .../src/com/sulake/core/window/utils/MouseCursorControl.as::change()
    public static change(): void
    {
        if(!MouseCursorControl._dirty)
        {
            return;
        }

        MouseCursorControl._dirty = false;

        let cssCursor: string;

        switch(MouseCursorControl._type)
        {
            case 0:
            case 1:
                cssCursor = 'auto';
                break;
            case 2:
                cssCursor = 'pointer';
                break;
            case 5:
            case 6:
                cssCursor = 'grab';
                break;
            case 7:
                cssCursor = 'ns-resize';
                break;
            case 8:
                cssCursor = 'ew-resize';
                break;
            case 9:
                cssCursor = 'ns-resize';
                break;
            case 10:
                cssCursor = 'ew-resize';
                break;
            case 11:
                cssCursor = 'nwse-resize';
                break;
            case 12:
                cssCursor = 'not-allowed';
                break;
            case 13:
                cssCursor = 'wait';
                break;
            case 0xFFFFFFFE:
                cssCursor = 'none';
                break;
            default:
                cssCursor = 'auto';
                break;
        }

        document.body.style.cursor = cssCursor;
    }

    /**
	 * Returns the CSS cursor string for the current type.
	 *
	 * @returns The CSS cursor value
	 */
    public static getCursor(): string
    {
        return document.body.style.cursor || 'auto';
    }
}
