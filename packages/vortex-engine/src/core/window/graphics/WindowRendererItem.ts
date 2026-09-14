import type {ISkinContainer} from './ISkinContainer';
import type {ISkinRenderer} from './renderer/ISkinRenderer';
import type {IGraphicContextHost} from './IGraphicContextHost';
import type {IWindow} from '../IWindow';

/**
 * Render queue item holding rendering state for a single window.
 *
 * Manages a per-window OffscreenCanvas buffer. The skin renderer draws
 * into this buffer, and the client reads it via fetchDrawBuffer().
 *
 * AS3 equivalent used BitmapData (TrackedBitmapData); we use OffscreenCanvas.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRendererItem.as
 */
export class WindowRendererItem
{
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::RENDER_TYPE_NULL
    protected static readonly RENDER_TYPE_NULL: number = 0;
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::RENDER_TYPE_SKIN
    protected static readonly RENDER_TYPE_SKIN: number = 1;
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::RENDER_TYPE_FILL
    protected static readonly RENDER_TYPE_FILL: number = 2;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/graphics/WindowRendererItem.as::_skinContainer
    private _skinContainer: ISkinContainer;
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::_refresh
    private _refresh: boolean = false;
    private _previousState: number = 0xFFFFFFFF;
    private _currentState: number = 0;
    private _bufferCtx: OffscreenCanvasRenderingContext2D | null = null;

    constructor(skinContainer: ISkinContainer)
    {
        this._skinContainer = skinContainer;
    }

    /**
     * Allocates the buffer this item renders its window's skin into.
     *
     * In AS3 this buffer belongs to the window's `GraphicContext` — the
     * `BitmapData` of its `Bitmap` child — and `render()` receives it as a
     * target. It is asked for the same way here, so `fetchDrawBuffer()` and
     * this item hand out the same surface and the per-pixel mouse test reads
     * the pixels the window actually drew.
     *
     * A window with no graphic-context host still gets a private buffer, so
     * rendering never depends on the lookup succeeding.
     */
    // TS-only: AS3's render() took the target BitmapData as a parameter, so it
    // had no allocation step of its own.
    private static acquireDrawBuffer(window: IWindow, width: number, height: number): OffscreenCanvas | null
    {
        const host = window as unknown as Partial<IGraphicContextHost>;

        if(typeof host.getGraphicContext === 'function')
        {
            const context = host.getGraphicContext(true);

            if(context)
            {
                return context.allocateDrawBuffer(width, height);
            }
        }

        return new OffscreenCanvas(width, height);
    }

    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/graphics/WindowRendererItem.as::_buffer
    private _buffer: OffscreenCanvas | null = null;

    /**
	 * Returns the cached draw buffer for this window.
	 *
	 * Equivalent of AS3 `WindowRendererItem.buffer` (BitmapData getter).
	 */
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::get buffer()
    public get buffer(): OffscreenCanvas | null
    {
        return this._buffer;
    }

    /**
	 * Tests whether the window's drawable state has changed.
	 *
	 * @param window - The window to test
	 * @returns True if the state changed since last render
	 */
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::testForStateChange()
    public testForStateChange(window: IWindow): boolean
    {
        return this._skinContainer.getTheActualState(window.type, window.style, window.state) !== this._previousState;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRendererItem.as::needsRedraw()
    public needsRedraw(window: IWindow): boolean
    {
        return this._refresh || this.testForStateChange(window);
    }

    /**
	 * Marks this item as needing re-render for the given invalidation type.
	 *
	 * Port of AS3 WindowRendererItem.invalidate().
	 *
	 * @param window - The window being invalidated
	 * @param flags - The invalidation flags
	 * @returns True if the invalidation caused a change
	 */
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::invalidate()
    public invalidate(window: IWindow, flags: number): boolean
    {
        let changed = false;

        switch(flags)
        {
            case 1:
            case 2:
                this._refresh = true;
                changed = true;
                break;
            case 4:
                changed = true;
                break;
            case 8:
                this._currentState = this._skinContainer.getTheActualState(window.type, window.style, window.state);

                if(this._currentState !== this._previousState)
                {
                    this._refresh = true;
                    changed = true;
                }
                break;
            case 16:
                // AS3 only forces a full refresh here when the window shares its
                // parent's graphic context (no independent context to update blend
                // on); otherwise it just sets the context's `blend` and returns
                // false - no redraw needed. WindowComposite.ts reads window.blend
                // fresh on every composite pass for every window regardless, so we
                // never need to refresh the cached skin buffer for a blend change.
                break;
            case 32:
                changed = true;
                break;
        }

        return changed;
    }

    /**
	 * Renders the skin for the given window into its buffer.
	 *
	 * Port of AS3 WindowRendererItem.render(). The AS3 version takes
	 * drawLocation, clipRegion, visibleRegion, targetBitmapData and
	 * composes into a parent buffer. In our architecture, each window
	 * renders into its own OffscreenCanvas; the client handles compositing.
	 *
	 * @param window - The window to render
	 */
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::render()
    public render(window: IWindow): void
    {
        // Determine render type
        let renderType = window.background ? WindowRendererItem.RENDER_TYPE_FILL : WindowRendererItem.RENDER_TYPE_NULL;

        const renderer: ISkinRenderer | null = this._skinContainer.getSkinRendererByTypeAndStyle(window.type, window.style);

        if(renderer && renderer.isStateDrawable(this._currentState))
        {
            renderType = WindowRendererItem.RENDER_TYPE_SKIN;
        }

        const renderWidth = Math.max(window.renderingWidth, 1);
        const renderHeight = Math.max(window.renderingHeight, 1);

        if(renderType !== WindowRendererItem.RENDER_TYPE_NULL)
        {
            // Asked for on every render, not only on a size change: the window's
            // graphic context owns this buffer and may have replaced it since
            // (a resize, or a context rebuilt by setupGraphicsContext). Adopting
            // a buffer nothing has drawn into is what `_refresh` below is for.
            const buffer = WindowRendererItem.acquireDrawBuffer(window, renderWidth, renderHeight);

            if(buffer !== this._buffer)
            {
                this._buffer = buffer;

                // `willReadFrequently` because this buffer is read back per window per mouse
                // event: `WindowController.testLocalPointHitAgainstAlpha()` samples it through
                // `BitmapHitTest.hitTestAlpha()`, which is the port's stand-in for Flash's native
                // `BitmapData.hitTest()`. That module asks for the flag too, but a canvas hands
                // back the context it already has and silently drops the options — so the flag has
                // to be set HERE, where the context is first acquired, or every mouse move pays a
                // GPU readback and Chrome logs the "Multiple readback operations" warning for it.
                this._bufferCtx = buffer ? buffer.getContext('2d', {willReadFrequently: true}) : null;

                if(this._bufferCtx)
                {
                    this._bufferCtx.imageSmoothingEnabled = false;
                }

                this._refresh = true;
            }

            if(!this._bufferCtx) return;

            if(renderType === WindowRendererItem.RENDER_TYPE_SKIN)
            {
                if(this._refresh)
                {
                    this._refresh = false;

                    // Clear buffer and fill with window color (AS3: fillRect with window.color)
                    this._bufferCtx.clearRect(0, 0, renderWidth, renderHeight);

                    const color = window.color;
                    const a = ((color >> 24) & 0xFF) / 255;
                    const r = (color >> 16) & 0xFF;
                    const g = (color >> 8) & 0xFF;
                    const b = color & 0xFF;

                    this._bufferCtx.fillStyle = `rgba(${r},${g},${b},${a})`;
                    this._bufferCtx.fillRect(0, 0, renderWidth, renderHeight);

                    // Draw the skin
                    renderer!.draw(
                        window,
                        this._bufferCtx,
                        {x: 0, y: 0, width: renderWidth, height: renderHeight},
                        this._currentState,
                        false
                    );
                }
            }
            else if(renderType === WindowRendererItem.RENDER_TYPE_FILL)
            {
                // Fill with window color
                this._bufferCtx.clearRect(0, 0, renderWidth, renderHeight);

                const color = window.color;
                const a = ((color >> 24) & 0xFF) / 255;
                const r = (color >> 16) & 0xFF;
                const g = (color >> 8) & 0xFF;
                const b = color & 0xFF;

                this._bufferCtx.fillStyle = `rgba(${r},${g},${b},${a})`;
                this._bufferCtx.fillRect(0, 0, renderWidth, renderHeight);
            }
        }
        else
        {
            // NULL render type — clear any existing buffer
            if(this._refresh)
            {
                this._refresh = false;

                if(this._buffer && this._bufferCtx)
                {
                    this._bufferCtx.clearRect(0, 0, this._buffer.width, this._buffer.height);
                }
            }
        }

        this._previousState = this._currentState;
    }

    /**
	 * Purges cached data, disposing the buffer.
	 */
    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::purge()
    public purge(): void
    {
        this._buffer = null;
        this._bufferCtx = null;
        this._refresh = true;
    }

    // AS3: .../src/com/sulake/core/window/graphics/WindowRendererItem.as::dispose()
    public dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._buffer = null;
            this._bufferCtx = null;
            this._skinContainer = null!;
        }
    }
}
