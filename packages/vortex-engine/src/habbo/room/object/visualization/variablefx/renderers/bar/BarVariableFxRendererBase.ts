import type {IVariableFxRenderer} from '../../IVariableFxRenderer';
import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxFrame} from '../../VariableFxFrame';
import {AnimatedPaintColor, type IVariableFxPaintColorSource} from '../../animation/AnimatedPaintColor';
import {AnimatedScalar} from '../../animation/AnimatedScalar';

/**
 * What every progress bar shares: an animated fill level, an animated fill colour, and the rule
 * for when the bitmap actually has to be redrawn.
 *
 * That rule is the point of the class. A bar is redrawn only when the FILLED PIXEL WIDTH changes,
 * not when the underlying progress does — a value creeping from 0.500 to 0.503 on a 40px bar moves
 * nothing, and repainting for it would put the whole feature on the frame budget for no visible
 * difference. Colour changes are gated the same way, and further: a recolour is ignored outright
 * while the bar is empty and was empty, since there is nothing on screen to recolour.
 *
 * Subclasses supply their own size and their own drawing; this class never draws.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/BarVariableFxRendererBase.as
 */
export class BarVariableFxRendererBase implements IVariableFxRenderer
{
    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::_context
    private _context: VariableFxRendererContext;

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::_fillColor
    private _fillColor: AnimatedPaintColor;

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::_frame
    private _frame: VariableFxFrame;

    /**
     * False until the first `updateData()`. The first one always SNAPS rather than animating —
     * an effect appearing on screen should be at its value, not racing up to it from zero.
     */
    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::_initialized (name derived)
    private _initialized: boolean = false;

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::_lastRenderedFillColor (name derived)
    private _lastRenderedFillColor: number = -1;

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::_lastRenderedPixelWidth
    private _lastRenderedPixelWidth: number = -1;

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::_progress (name derived)
    private _progress: AnimatedScalar;

    /**
     * The animation constants are the AS3's, unexplained there and unexplainable here: an
     * acceleration of 1e-5 per ms², a cap of 0.003 progress per ms (a full bar in ~333ms at
     * cruise), an epsilon of 1e-4, and a gentler deceleration than acceleration — which is what
     * makes a bar arrive softly instead of stopping dead.
     */
    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::BarVariableFxRendererBase()
    constructor(context: VariableFxRendererContext)
    {
        this._context = context;
        this._fillColor = new AnimatedPaintColor(300);
        this._frame = new VariableFxFrame();
        this._progress = new AnimatedScalar(0.00001, 0.003, 0.0001, 0.000008);
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get frame()
    get frame(): VariableFxFrame
    {
        return this._frame;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get isContinuous()
    get isContinuous(): boolean
    {
        return false;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::updateData()
    updateData(context: VariableFxRendererContext, time: number): void
    {
        this._context = context;

        // An initialize is a whole-room sync, not a change the user made: snap, do not animate.
        if(!this._initialized || context.status.isInitialize)
        {
            this._progress.snapTo(context.progress, time);
            this._fillColor.snapTo(this.resolveFillColorSource(), time);
            this._initialized = true;

            return;
        }

        this._progress.setTarget(context.progress, time);
        this._fillColor.setTarget(this.resolveFillColorSource(), time);
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::needsUpdate()
    needsUpdate(time: number): boolean
    {
        return this.hasRenderChange(time)
            || this._progress.needsUpdate(time, this.progressPixelWidth)
            || this._fillColor.needsUpdate(time);
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::update()
    update(time: number): boolean
    {
        this.advanceAnimation(time);

        if(!this.hasRenderChange(time)) return false;

        this.ensureFrameBitmap();
        this.renderFrame(time);

        this._lastRenderedFillColor = this._fillColor.value;
        this._lastRenderedPixelWidth = this.calculateFilledPixelWidth();

        this.didRenderFrame(time);
        this._frame.updateId += 1;

        return true;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get context()
    protected get context(): VariableFxRendererContext
    {
        return this._context;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get displayedFillArgb()
    protected get displayedFillArgb(): number
    {
        return this._fillColor.argb;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get displayedFillRgb()
    protected get displayedFillRgb(): number
    {
        return this._fillColor.value;
    }

    /**
     * The ANIMATED progress, not `context.progress` — that is the target, this is where the bar
     * has actually got to.
     */
    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get displayedProgress()
    protected get displayedProgress(): number
    {
        return this._progress.value;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get mutableFrame()
    protected get mutableFrame(): VariableFxFrame
    {
        return this._frame;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get frameWidth()
    protected get frameWidth(): number
    {
        return 0;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get frameHeight()
    protected get frameHeight(): number
    {
        return 0;
    }

    /** How many pixels wide the *fillable* part is — not the frame, which has borders. */
    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::get progressPixelWidth()
    protected get progressPixelWidth(): number
    {
        return 0;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::calculateFilledPixelWidth()
    protected calculateFilledPixelWidth(): number
    {
        const width = this.progressPixelWidth;

        // Truncated, not rounded: a bar at 99.9% must not read as full.
        return Math.max(0, Math.min(width, (this.displayedProgress * width) | 0));
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::createFrameBitmap()
    protected createFrameBitmap(width: number, height: number): OffscreenCanvas | null
    {
        if(width <= 0 || height <= 0) return null;

        return new OffscreenCanvas(width, height);
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::renderFrame()
    protected renderFrame(_time: number): void
    {
        // Subclasses draw.
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::hasRendererSpecificRenderChange()
    protected hasRendererSpecificRenderChange(_time: number): boolean
    {
        return false;
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::didRenderFrame()
    protected didRenderFrame(_time: number): void
    {
        // Subclasses hook.
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::advanceAnimation()
    private advanceAnimation(time: number): void
    {
        this._progress.update(time);
        this._fillColor.update(this.resolveFillColorSource(), time);
    }

    /**
     * Redraw when the bitmap is missing or the wrong size, when the filled width moved, or when the
     * colour changed AND there is fill on screen to show it on.
     */
    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::hasRenderChange()
    private hasRenderChange(time: number): boolean
    {
        const filled = this.calculateFilledPixelWidth();

        if(this._frame.bitmapData === null
            || this._frame.width !== this.frameWidth
            || this._frame.height !== this.frameHeight
            || filled !== this._lastRenderedPixelWidth)
        {
            return true;
        }

        return (this._fillColor.value !== this._lastRenderedFillColor && (filled > 0 || this._lastRenderedPixelWidth > 0))
            || this.hasRendererSpecificRenderChange(time);
    }

    /**
     * AS3 throws when the bitmap cannot be allocated. Kept, because the alternative is a renderer
     * that silently draws nothing for the rest of the session — and a zero-sized frame means the
     * subclass reported a size it cannot have.
     */
    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::ensureFrameBitmap()
    private ensureFrameBitmap(): void
    {
        if(this._frame.bitmapData !== null
            && this._frame.width === this.frameWidth
            && this._frame.height === this.frameHeight)
        {
            return;
        }

        this._frame.disposeBitmap();

        const bitmap = this.createFrameBitmap(this.frameWidth, this.frameHeight);

        if(bitmap === null) throw new Error('Variable FX bar renderer could not allocate a frame bitmap.');

        this._frame.bitmapData = bitmap;
        this._frame.cacheKey = null;
        this._frame.width = bitmap.width;
        this._frame.height = bitmap.height;

        // A new bitmap has nothing rendered on it, so neither remembered value is valid any more.
        this._lastRenderedFillColor = -1;
        this._lastRenderedPixelWidth = -1;
    }

    /**
     * Note the progress passed here is the DISPLAYED one: a dynamic colour follows the bar as it
     * fills, rather than jumping to the destination band the moment the value changes.
     */
    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::resolveFillColorSource()
    private resolveFillColorSource(): IVariableFxPaintColorSource
    {
        return {
            color: this._context.config.color,
            extra: this._context.config.extra,
            progress: this.displayedProgress,
            statusExtra: this._context.status.extra
        };
    }

    // AS3: .../renderers/bar/BarVariableFxRendererBase.as::dispose()
    dispose(): void
    {
        this._frame.disposeBitmap();
    }
}
