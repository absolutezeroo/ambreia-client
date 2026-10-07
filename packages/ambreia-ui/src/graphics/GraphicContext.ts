import type {IGraphicContext} from './IGraphicContext';

/**
 * Graphic context implementation.
 *
 * In AS3 this extends `Sprite`: the context *is* a display-list node, holding
 * one display object (a `Bitmap` for `GC_TYPE_BITMAP`, a `TextField`, a `Shape`
 * …) plus a lazily created child container for nested contexts. The port has no
 * Flash display list — `WindowComposite` walks the window tree and blits each
 * buffer onto one 2D canvas — so the child contexts live in a plain array and
 * the `Bitmap`'s `BitmapData` becomes an `OffscreenCanvas`.
 *
 * What the context still owns, exactly as AS3 does, is the **draw buffer**:
 * `GC_TYPE_BITMAP` allocates one, `fetchDrawBuffer()` hands it out, and
 * `WindowController.testLocalPointHitAgainstAlpha()` reads its pixels for the
 * per-pixel mouse test. That ownership is why the buffer lives here and not in
 * `WindowRendererItem`, which asks for it through `allocateDrawBuffer()`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as
 */
export class GraphicContext implements IGraphicContext
{
    public static readonly GC_TYPE_NULL: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::GC_TYPE_BITMAP
    public static readonly GC_TYPE_BITMAP: number = 1;
    public static readonly GC_TYPE_TEXT: number = 2;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::GC_TYPE_CONTAINER
    public static readonly GC_TYPE_CONTAINER: number = 4;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::GC_TYPE_SHAPE
    public static readonly GC_TYPE_SHAPE: number = 8;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::GC_TYPE_MORPH_SHAPE
    public static readonly GC_TYPE_MORPH_SHAPE: number = 16;
    public static readonly GC_TYPE_METADATA: number = 0x100;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get numGraphicContexts()
    // The backing field is obfuscated (_SafeStr_5069) in every tree; only the
    // getter carries a real name.
    private static _instanceCount: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get allocatedByteCount()
    // Backing field obfuscated (_SafeStr_5750); the getter is the readable name.
    private static _allocatedByteCount: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::_rectangle
    private _rectangle: { x: number; y: number; width: number; height: number };
    // AS3 lazily creates a Sprite the first child needs and removes it when the
    // last child does. This port never adds child contexts to a real display
    // list (see class doc comment), so the plain array below is present from
    // construction and needs no lazy create/teardown step of its own.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::setupChildContainer()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::removeChildContainer()
    private _children: IGraphicContext[] = [];

    // Derived name: AS3 calls this _SafeStr_6028 (_Str_7873 in the 2016 tree) and
    // no tree recovers it. It gates fetch/allocate/releaseDrawBuffer.
    private _hasBitmapBuffer: boolean = false;
    // AS3: the BitmapData held by the context's Bitmap display object.
    private _buffer: OffscreenCanvas | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::_useAlpha
    private _useAlpha: boolean = true;
    // AS3: the Shape assigned as the display object's mask by setDrawRegion().
    private _maskRectangle: { x: number; y: number; width: number; height: number } | null = null;

    constructor(name: string, type: number, rect: { x: number; y: number; width: number; height: number })
    {
        GraphicContext._instanceCount++;
        this._name = name;
        this._rectangle = {...rect};

        // AS3 switches on the type to build the matching display object; only
        // GC_TYPE_BITMAP carries a draw buffer, and it allocates it here so
        // `fetchDrawBuffer()` always hands back a real — if blank — surface.
        //
        // `WindowRendererItem` renders into this same buffer (it asks through
        // `allocateDrawBuffer()`), which is what makes `fetchDrawBuffer()` and
        // the per-pixel mouse test read the pixels the window actually drew.
        //
        // Wiring this up moved the per-pixel test from 68 to 97 misses across
        // 251 candidate windows. That is not a regression: the windows that
        // flipped have buffers that are genuinely transparent at the sampled
        // point, and AS3 answers the same. The `icon` that looked like a
        // counter-example turned out to have a *missing asset* — its buffer is
        // blank because nothing was ever drawn into it, and the opaque screen
        // pixel behind it belongs to its parent. Rendering is byte-identical
        // before and after (same PNG hash on a glaze boot), and all 14 probed
        // click targets still receive their events.
        if(type === GraphicContext.GC_TYPE_BITMAP)
        {
            this._hasBitmapBuffer = true;
            this.allocateDrawBuffer(rect.width, rect.height);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get numGraphicContexts()
    public static get numGraphicContexts(): number
    {
        return GraphicContext._instanceCount;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get allocatedByteCount()
    public static get allocatedByteCount(): number
    {
        return GraphicContext._allocatedByteCount;
    }

    private _name: string;

    public get name(): string
    {
        return this._name;
    }

    private _visible: boolean = true;

    public get visible(): boolean
    {
        return this._visible;
    }

    public set visible(value: boolean)
    {
        this._visible = value;
    }

    private _blend: number = 1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get blend()
    public get blend(): number
    {
        return this._blend;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::set blend()
    public set blend(value: number)
    {
        this._blend = value;
    }

    private _mouse: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get mouse()
    public get mouse(): boolean
    {
        return this._mouse;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::set mouse()
    public set mouse(value: boolean)
    {
        this._mouse = value;
    }

    private _filters: unknown[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get filters()
    public get filters(): unknown[]
    {
        return this._filters;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::set filters()
    public set filters(value: unknown[])
    {
        this._filters = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::_disposed
    private _disposed: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::get numChildContexts()
    public get numChildContexts(): number
    {
        return this._children.length;
    }

    /**
     * Returns the mask rectangle set by the last {@link setDrawRegion} call.
     *
     * AS3 builds a `Shape` and assigns it as the display object's `mask`; with
     * no display list the rectangle itself is what a compositor needs.
     *
     * **Nothing reads this today, and that is not an oversight to fix by wiring it up.** AS3 masks
     * a FORCE_CLIPPING context's display object to its visible region, which is a *clip*; the port
     * arrives at the same result arithmetically instead, in `WindowComposite.compositeWindow()`,
     * which intersects `effectiveClip` down the walk and calls `ctx.clip()` per window. Reinstating
     * a real mask here would clip the same pixels twice.
     *
     * It is kept, rather than deleted, because it is the one place that records what AS3's mask
     * *was* — the day the per-context buffer tree lands (see IMPLEMENTATION_STATUS.md → "Not yet
     * done"), the mask belongs on the context's own surface and this is the value it needs.
     */
    // Derived name: the Shape AS3 assigns as the display object mask is
    // _SafeStr_4905 (_Str_3303 in the 2016 tree); no tree recovers it.
    public get maskRectangle(): { x: number; y: number; width: number; height: number } | null
    {
        return this._maskRectangle;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::offSet()
    public offset(x: number, y: number): void
    {
        this._rectangle.x = x;
        this._rectangle.y = y;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::getDrawRegion()
    public getDrawRegion(): { x: number; y: number; width: number; height: number }
    {
        return {...this._rectangle};
    }

    /**
     * Moves and resizes the context, reallocating the draw buffer when asked,
     * and sets or clears the display object's mask.
     *
     * @param rect - The new draw region
     * @param reallocate - Whether to resize the draw buffer to match
     * @param maskRect - Mask rectangle, or null to clear the mask
     * @returns The reallocated buffer, or null when none was allocated
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::setDrawRegion()
    public setDrawRegion(
        rect: { x: number; y: number; width: number; height: number },
        reallocate: boolean,
        maskRect: { x: number; y: number; width: number; height: number } | null
    ): OffscreenCanvas | null
    {
        if(rect.width < 1 || rect.height < 1)
        {
            return null;
        }

        let buffer: OffscreenCanvas | null = null;

        if(this._hasBitmapBuffer && reallocate)
        {
            buffer = this.allocateDrawBuffer(rect.width, rect.height);
        }

        this._rectangle.x = rect.x;
        this._rectangle.y = rect.y;
        this._rectangle.width = rect.width;
        this._rectangle.height = rect.height;

        this._maskRectangle = maskRect ? {...maskRect} : null;

        return buffer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::fetchDrawBuffer()
    public fetchDrawBuffer(): OffscreenCanvas | null
    {
        return this._hasBitmapBuffer ? this._buffer : null;
    }

    /**
     * Allocates, or resizes, this context's draw buffer.
     *
     * Mirrors AS3: a buffer whose dimensions already match is kept, a
     * mismatched one is released first, and a zero-sized request allocates
     * nothing. `allocatedByteCount` tracks the same 4-bytes-per-pixel total
     * AS3 tracked for `TrackedBitmapData`.
     *
     * @param width - Requested buffer width
     * @param height - Requested buffer height
     * @returns The buffer, or null when this context holds none
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::allocateDrawBuffer()
    public allocateDrawBuffer(width: number, height: number): OffscreenCanvas | null
    {
        if(!this._hasBitmapBuffer)
        {
            return null;
        }

        if(this._buffer)
        {
            if(this._buffer.width !== width || this._buffer.height !== height)
            {
                GraphicContext._allocatedByteCount -= this._buffer.width * this._buffer.height * 4;
                this._buffer = null;
            }
        }

        if(!this._buffer && width > 0 && height > 0)
        {
            this._buffer = new OffscreenCanvas(width, height);
            GraphicContext._allocatedByteCount += width * height * 4;
        }

        return this._buffer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::releaseDrawBuffer()
    public releaseDrawBuffer(): void
    {
        if(this._hasBitmapBuffer && this._buffer)
        {
            GraphicContext._allocatedByteCount -= this._buffer.width * this._buffer.height * 4;
            this._buffer = null;
        }
    }

    /**
     * Whether this context carries a bitmap draw buffer at all.
     *
     * AS3 keeps the same flag to decide whether `fetchDrawBuffer()`,
     * `allocateDrawBuffer()` and `releaseDrawBuffer()` do anything.
     */
    // Derived name: AS3 calls this _SafeStr_6028 (_Str_7873 in the 2016 tree) and
    // no tree recovers it. It gates fetch/allocate/releaseDrawBuffer.
    public get hasBitmapBuffer(): boolean
    {
        return this._hasBitmapBuffer;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::_useAlpha
    // TS-only accessor: AS3 keeps the field protected with no getter.
    public get useAlpha(): boolean
    {
        return this._useAlpha;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::addChildContext()
    public addChildContext(context: IGraphicContext): IGraphicContext
    {
        this._children.push(context);

        return context;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::addChildContextAt()
    public addChildContextAt(context: IGraphicContext, index: number): IGraphicContext
    {
        this._children.splice(index, 0, context);

        return context;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::getChildContextAt()
    public getChildContextAt(index: number): IGraphicContext
    {
        return this._children[index];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::getChildContextByName()
    public getChildContextByName(name: string): IGraphicContext | null
    {
        for(const child of this._children)
        {
            if((child as unknown as { name?: string }).name === name)
            {
                return child;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::getChildContextIndex()
    public getChildContextIndex(context: IGraphicContext): number
    {
        return this._children.indexOf(context);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::removeChildContext()
    public removeChildContext(context: IGraphicContext): IGraphicContext
    {
        const index = this._children.indexOf(context);

        if(index >= 0)
        {
            this._children.splice(index, 1);
        }

        return context;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::removeChildContextAt()
    public removeChildContextAt(index: number): IGraphicContext
    {
        const [removed] = this._children.splice(index, 1);

        return removed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::setChildContextIndex()
    public setChildContextIndex(context: IGraphicContext, index: number): void
    {
        const current = this._children.indexOf(context);

        if(current >= 0)
        {
            this._children.splice(current, 1);
            this._children.splice(index, 0, context);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::swapChildContexts()
    public swapChildContexts(a: IGraphicContext, b: IGraphicContext): void
    {
        const indexA = this._children.indexOf(a);
        const indexB = this._children.indexOf(b);

        if(indexA >= 0 && indexB >= 0)
        {
            this._children[indexA] = b;
            this._children[indexB] = a;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::swapChildContextsAt()
    public swapChildContextsAt(indexA: number, indexB: number): void
    {
        const temp = this._children[indexA];
        this._children[indexA] = this._children[indexB];
        this._children[indexB] = temp;
    }

    /**
     * Records the region the debug overlay should outline.
     *
     * AS3 draws straight into the context's own `graphics` — a green box around
     * the context and a blue one around the dirty region. There is no display
     * list to draw into here, so the region is stored and
     * `WindowComposite.drawRedrawRegionOverlay()` strokes both boxes at
     * composite time, which is where the desktop-wide canvas lives.
     *
     * Nothing calls this, in this port or in AS3 — it is a debug hook with no
     * caller in any tree. Passing null turns the overlay off again.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::showRedrawRegion()
    public showRedrawRegion(rect: { x: number; y: number; width: number; height: number } | null): void
    {
        this._redrawRegion = rect ? {...rect} : null;
    }

    // AS3: the dirty rectangle passed to showRedrawRegion(), kept for the overlay.
    private _redrawRegion: { x: number; y: number; width: number; height: number } | null = null;

    public get redrawRegion(): { x: number; y: number; width: number; height: number } | null
    {
        return this._redrawRegion;
    }

    /**
      * sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::getDisplayObject() /
     * setDisplayObject() / getAbsoluteMousePosition() / getRelativeMousePosition() /
     * set parent() are display-list members: they read `getChildAt(0)`,
     * `stage.mouseX` and `DisplayObjectContainer.addChild()`. The port has no
     * Flash display list — `WindowComposite` composites the window tree onto a
     * single canvas and `MouseEventProcessor` owns the pointer position — so
     * there is no object to hand back and no stage to read. They are recorded
     * here rather than implemented; porting them means giving the context a
     * display node, which the compositor deliberately does not have.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::toString()
    public toString(): string
    {
        return `[object GraphicContext name="${this._name}"]`;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/GraphicContext.as::dispose()
    public dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            GraphicContext._instanceCount--;

            for(const child of this._children)
            {
                child.dispose();
            }

            this._children.length = 0;
            this._filters.length = 0;

            this.releaseDrawBuffer();
            this._maskRectangle = null;
        }
    }
}
