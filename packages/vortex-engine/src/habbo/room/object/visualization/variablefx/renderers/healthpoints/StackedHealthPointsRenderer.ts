import type {IVariableFxRenderer} from '../../IVariableFxRenderer';
import {VariableFxFrame} from '../../VariableFxFrame';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {AnimatedHeartOpacities} from './AnimatedHeartOpacities';
import {StackedHealthPointsHeartPrebake, type IStackedHealthPointsAssets} from './StackedHealthPointsHeartPrebake';

/**
 * A grid of hearts, one per health point, that fills and empties one heart at a time.
 *
 * The first renderer in the feature that is not a bar, and it shows in three places. Its FRAME
 * RESIZES — a stack of three hearts and a stack of thirty are different bitmaps, so `frameWidth`
 * and `frameHeight` are computed from the current count rather than from the config. It grows
 * UPWARD: row 0 is the bottom row, which is why `drawHeart()` counts rows down from `rowCount`.
 * And its value is read as a COUNT, not as a fraction — `context.progress` is never consulted for
 * anything but the paint colour.
 *
 * Width and height do not agree on which count to use, deliberately. The height follows
 * `max(target, visible)` so the frame is already tall enough for hearts that are fading in and
 * still tall enough for ones fading out; the width follows the visible count alone, so a stack that
 * has not yet reached a second row stays narrow.
 *
 * Redraw is decided by a SIGNATURE — size, colour, and every heart's quantised opacity joined into
 * a string — rather than by comparing two numbers as the bars do. With up to 100 independently
 * animating hearts there is no single value that would answer the question.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/healthpoints/StackedHealthPointsRenderer.as
 */
export class StackedHealthPointsRenderer implements IVariableFxRenderer
{
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::HORIZONTAL_SPACING
    private static readonly HORIZONTAL_SPACING: number = 1;

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::VERTICAL_SPACING
    private static readonly VERTICAL_SPACING: number = 3;

    /** The cap on the stack: rows times hearts-per-row is the most that will ever be drawn. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::MAX_ROWS
    private static readonly MAX_ROWS: number = 20;

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::STACKED_HEALTH_POINTS_ASSETS
    private static readonly STACKED_HEALTH_POINTS_ASSETS = {
        background: 'variablefx_stacked_health_points_background',
        darkening: 'variablefx_stacked_health_points_darkening',
        darkeningMetallic: 'variablefx_stacked_health_points_darkening_metallic',
        lighting: 'variablefx_stacked_health_points_lighting',
        lightingMetallic: 'variablefx_stacked_health_points_lighting_metallic',
        metallic: 'variablefx_stacked_health_points_metallic'
    };

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::_context
    private _context: VariableFxRendererContext;

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::_fillArgb (name derived)
    //   `_SafeStr_7567`: the colour every heart is baked in.
    private _fillArgb: number = -1;

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::_frame
    private _frame: VariableFxFrame = new VariableFxFrame();

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::_heartOpacities (name derived)
    //   `_SafeStr_5943`: the cascade.
    private _heartOpacities: AnimatedHeartOpacities = new AnimatedHeartOpacities();

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::_initialized (name derived)
    private _initialized: boolean = false;

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::_renderedSignature (name derived)
    //   `_SafeStr_8154`: what the frame on screen currently shows.
    private _renderedSignature: string = '';

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::_heartPrebake (name derived)
    private _heartPrebake: StackedHealthPointsHeartPrebake;

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::_targetHeartCount (name derived)
    //   `_SafeStr_8611`: how many hearts the current value asks for.
    private _targetHeartCount: number = 0;

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::StackedHealthPointsRenderer()
    constructor(context: VariableFxRendererContext)
    {
        this._context = context;
        this._heartPrebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => StackedHealthPointsRenderer.createPrebake(context)
        ) as StackedHealthPointsHeartPrebake;
        this._fillArgb = StackedHealthPointsRenderer.resolveFillArgb(context);
    }

    /** Only two sizes exist here, and anything unrecognised is the narrow one. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::resolveStackedHealthPointsPerRow()
    static resolveStackedHealthPointsPerRow(width: string): number
    {
        switch(width)
        {
            case 'large': return 5;
            default: return 3;
        }
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get frame()
    get frame(): VariableFxFrame
    {
        return this._frame;
    }

    /** The cascade ends on its own, so the visualizer never has to tick this one continuously. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get isContinuous()
    get isContinuous(): boolean
    {
        return false;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::updateData()
    updateData(context: VariableFxRendererContext, time: number): void
    {
        this._context = context;
        this._fillArgb = StackedHealthPointsRenderer.resolveFillArgb(context);
        this._targetHeartCount = this.resolveTargetHeartCount();

        // An initialize is a whole-room sync, not a change the user made: snap, do not cascade.
        if(!this._initialized || context.status.isInitialize)
        {
            this._heartOpacities.snapTo(this._targetHeartCount, time);
            this._initialized = true;

            return;
        }

        this._heartOpacities.setTarget(this._targetHeartCount, time);
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::needsUpdate()
    needsUpdate(time: number): boolean
    {
        return this._frame.bitmapData === null
            || this._frame.width !== this.frameWidth
            || this._frame.height !== this.frameHeight
            || this.createRenderedSignature() !== this._renderedSignature
            || this._heartOpacities.needsUpdate(time, 1);
    }

    /**
     * Advances the cascade FIRST, then decides.
     *
     * The order matters: `update()` on the animator is what moves the opacities, and the signature
     * is computed from them — asking `needsUpdate()` first would compare against opacities that
     * have not moved yet and skip the frame.
     */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::update()
    update(time: number): boolean
    {
        const moved = this._heartOpacities.update(time);

        if(!moved && !this.needsUpdate(time)) return false;

        this.ensureFrameBitmap();
        this.renderFrame();

        this._renderedSignature = this.createRenderedSignature();
        this._frame.updateId += 1;

        return true;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get heartWidth()
    private get heartWidth(): number
    {
        return this._heartPrebake.heartWidth;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get heartHeight()
    private get heartHeight(): number
    {
        return this._heartPrebake.heartHeight;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get heartsPerRow()
    private get heartsPerRow(): number
    {
        return StackedHealthPointsRenderer.resolveStackedHealthPointsPerRow(this._context.config.width);
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get renderHeartCount()
    private get renderHeartCount(): number
    {
        return this._heartOpacities.visibleHeartCount;
    }

    /** Height counts hearts on their way IN as well as out, so the frame never has to grow mid-fade. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get heightHeartCount()
    private get heightHeartCount(): number
    {
        return Math.max(this._targetHeartCount, this._heartOpacities.visibleHeartCount);
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get rowCount()
    private get rowCount(): number
    {
        return Math.max(1, Math.ceil(this.heightHeartCount / this.heartsPerRow));
    }

    /** Full width once there is more than one row; otherwise only as wide as there are hearts. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get columnCount()
    private get columnCount(): number
    {
        const visible = this._heartOpacities.visibleHeartCount;

        if(Math.ceil(visible / this.heartsPerRow) > 1) return this.heartsPerRow;

        return Math.max(1, Math.min(this.heartsPerRow, visible));
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get frameWidth()
    private get frameWidth(): number
    {
        return this.columnCount * this.heartWidth
            + (this.columnCount - 1) * StackedHealthPointsRenderer.HORIZONTAL_SPACING;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::get frameHeight()
    private get frameHeight(): number
    {
        return this.rowCount * this.heartHeight
            + (this.rowCount - 1) * StackedHealthPointsRenderer.VERTICAL_SPACING;
    }

    /** Clearing the signature is what makes the next `update()` redraw into the new bitmap. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::ensureFrameBitmap()
    private ensureFrameBitmap(): void
    {
        if(this._frame.bitmapData !== null
            && this._frame.width === this.frameWidth
            && this._frame.height === this.frameHeight)
        {
            return;
        }

        this._frame.disposeBitmap();

        const bitmap = new OffscreenCanvas(Math.max(1, this.frameWidth), Math.max(1, this.frameHeight));

        this._frame.bitmapData = bitmap;
        this._frame.cacheKey = null;
        this._frame.width = bitmap.width;
        this._frame.height = bitmap.height;
        this._renderedSignature = '';
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::renderFrame()
    private renderFrame(): void
    {
        const target = this._frame.bitmapData;

        if(target === null) return;

        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);

        for(let index = 0; index < this.renderHeartCount; index++)
        {
            const opacity = this.resolveHeartOpacity(index);

            if(opacity > 0) this.drawHeart(composer, index, opacity);
        }
    }

    /** Row 0 is the BOTTOM row — the stack grows upward, so rows are counted down from the top. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::drawHeart()
    private drawHeart(composer: VariableFxBitmapComposer, index: number, opacity: number): void
    {
        const row = (index / this.heartsPerRow) | 0;
        const column = index % this.heartsPerRow;
        const x = column * (this.heartWidth + StackedHealthPointsRenderer.HORIZONTAL_SPACING);
        const y = (this.rowCount - row - 1) * (this.heartHeight + StackedHealthPointsRenderer.VERTICAL_SPACING);
        const heart = this._heartPrebake.getOrCreateHeartPrebake(this._fillArgb);

        if(heart !== null) composer.drawLayer(heart, x, y, 'normal', opacity);
    }

    /**
     * The tiny epsilon before rounding is not noise: it lifts an opacity that is exactly on a
     * half-step so it rounds up, which is what stops a heart flickering between two byte values
     * while the cascade holds it still.
     */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::resolveHeartOpacity()
    private resolveHeartOpacity(index: number): number
    {
        return Math.max(0, Math.min(255, Math.round((this._heartOpacities.getOpacity(index) + 1e-9) * 255)));
    }

    /** Size, colour and every heart's opacity — the whole visible state, as one comparable string. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::createRenderedSignature()
    private createRenderedSignature(): string
    {
        const opacities: number[] = [];

        for(let index = 0; index < this.renderHeartCount; index++)
        {
            opacities.push(this.resolveHeartOpacity(index));
        }

        return `${this.frameWidth}x${this.frameHeight}:${this._fillArgb}:${opacities.join(',')}`;
    }

    /**
     * The value read as a COUNT: hearts are whole, so the fractional part is dropped rather than
     * rounded, and the count is bounded three ways — by the value, by the range the config declares,
     * and by the grid's own cap.
     */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::resolveTargetHeartCount()
    private resolveTargetHeartCount(): number
    {
        const value = this._context.status.value - this._context.minValue;
        const range = this._context.maxValue - this._context.minValue;

        if(!Number.isFinite(value) || !Number.isFinite(range)) return 0;

        return Math.min(
            Math.max(0, Math.trunc(value)),
            Math.max(0, Math.trunc(range)),
            this.heartsPerRow * StackedHealthPointsRenderer.MAX_ROWS
        );
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::createPrebake()
    private static createPrebake(context: VariableFxRendererContext): StackedHealthPointsHeartPrebake
    {
        return new StackedHealthPointsHeartPrebake(StackedHealthPointsRenderer.resolveAssets(context));
    }

    /**
     * A metallic paint swaps the shading ARTWORK rather than applying it twice, as the heart fill
     * does — a 14x12 heart is too small for a repeated pass to read.
     */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::resolveAssets()
    private static resolveAssets(context: VariableFxRendererContext): IStackedHealthPointsAssets
    {
        const names = StackedHealthPointsRenderer.STACKED_HEALTH_POINTS_ASSETS;
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const isMetallic = paintColor.isMetallic;
        const darkening = StackedHealthPointsRenderer.getLayer(
            context, isMetallic ? names.darkeningMetallic : names.darkening
        );
        const lighting = StackedHealthPointsRenderer.getLayer(
            context, isMetallic ? names.lightingMetallic : names.lighting
        );

        return {
            background: StackedHealthPointsRenderer.getLayer(context, names.background),
            metallic: isMetallic ? StackedHealthPointsRenderer.getLayer(context, names.metallic) : null,
            overlays: [
                {blendMode: 'multiply', layer: darkening},
                {blendMode: 'add', layer: lighting}
            ]
        };
    }

    /**
     * Throws on a missing layer, as AS3 does. Kept: the heart's size comes from its background's,
     * so carrying on would lay out a grid against artwork that is not there.
     */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::getLayer()
    private static getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX stacked health points layer '${name}'.`);

        return layer;
    }

    /** Resolved against the CURRENT progress, so a dynamic colour still tracks the value. */
    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::resolveFillArgb()
    private static resolveFillArgb(context: VariableFxRendererContext): number
    {
        const paintColor = VariableFxPaintColor.resolveTargetPaintColor(
            context.config.color, context.config.extra, context.progress, context.status.extra
        );

        return (0xFF000000 | paintColor.rgb) >>> 0;
    }

    // AS3: .../renderers/healthpoints/StackedHealthPointsRenderer.as::dispose()
    dispose(): void
    {
        this._frame.disposeBitmap();
    }
}
