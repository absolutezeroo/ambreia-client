import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxGenericRendererPrebake} from '../../VariableFxGenericRendererPrebake';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxClipRect} from '../../rendering/VariableFxClipRect';
import {VariableFxColorUtils} from '../../rendering/VariableFxColorUtils';
import {VariableFxConfiguredIcon} from '../../rendering/VariableFxConfiguredIcon';
import type {VariableFxIconOverlayLayout} from '../../rendering/VariableFxIconOverlayLayout';
import {BarVariableFxRendererBase} from './BarVariableFxRendererBase';
import {VariableFxBarSliceUtils} from './VariableFxBarSliceUtils';
import type {IVariableFxBarLayout, IVariableFxBarOverlay} from './IVariableFxBarLayout';

/**
 * A shading pass over the striped fill, with its OWN nine-slice caps.
 *
 * The classic bar gives every overlay the same 3/3 slice; this one does not — its lighting layer
 * has a 9px left cap, because the highlight running along the top of the bar has a long, shaped
 * start it cannot stretch.
 */
interface IStripedBarOverlay extends IVariableFxBarOverlay
{
    sliceLeftWidth: number;
    sliceRightWidth: number;
}

/** The six layers a striped bar is built from — `metallic` only when the paint is metallic. */
interface IStripedBarAssets
{
    background: VariableFxDrawable;
    bar: VariableFxDrawable;
    darkening: VariableFxDrawable;
    lighting: VariableFxDrawable;
    metallic: VariableFxDrawable | null;
    stripe: VariableFxDrawable;
}

/** What `createPrebake()` stores on the config, and the constructor reads back. */
interface IStripedBarPrebake
{
    assets: IStripedBarAssets;
    backgroundPrebake: OffscreenCanvas;
    barEndPrebake: OffscreenCanvas | null;
    barPrebake: OffscreenCanvas | null;
    barShapePrebake: OffscreenCanvas;
    foregroundPrebake: OffscreenCanvas | null;
    iconLayout: VariableFxIconOverlayLayout;
    layout: IVariableFxBarLayout;
    overlays: IStripedBarOverlay[];
    stripesOverlayPrebake: OffscreenCanvas | null;
    stripesOverlayShapePrebake: OffscreenCanvas;
}

/**
 * The bar with diagonal stripes crawling along its fill — the "loading" bar of the family.
 *
 * It is the only bar that animates on its own: the fill can sit perfectly still and the renderer
 * still redraws, because the stripes move. That is what `hasRendererSpecificRenderChange()` reports
 * and what `isContinuous` announces to the visualizer — but only while there IS fill, so an empty
 * bar costs nothing.
 *
 * The motion is a SCROLLING LAYER, not a redraw per frame. The stripe pattern is baked once, one
 * period wider than the bar, and shifted between -10 and -1 pixels; at 10px per period and 70ms per
 * pixel, a period takes 700ms and the shift is indistinguishable from redrawing the stripes at a
 * new offset. Ten distinct positions, so ten is also how many frames exist.
 *
 * Two prebakes instead of the classic's one, for the same reason the classic has one: the bar and
 * the stripes are tinted from the SAME animated colour but to different shades — the stripes are
 * the fill's colour at half value in HSV — so each gets its own cache keyed on its own ARGB.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/StripedProgressBarRenderer.as
 */
export class StripedProgressBarRenderer extends BarVariableFxRendererBase
{
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::FRAME_HEIGHT
    private static readonly FRAME_HEIGHT: number = 13;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::CHROME_EDGE_WIDTH
    private static readonly CHROME_EDGE_WIDTH: number = 3;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::FILL_Y
    private static readonly FILL_Y: number = 3;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::FILL_HEIGHT
    private static readonly FILL_HEIGHT: number = 7;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::FILL_OVERLAY_SLICE_WIDTH
    private static readonly FILL_OVERLAY_SLICE_WIDTH: number = 3;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::LIGHTING_SLICE_LEFT_WIDTH
    private static readonly LIGHTING_SLICE_LEFT_WIDTH: number = 9;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::BAR_END_WIDTH
    private static readonly BAR_END_WIDTH: number = 2;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::BAR_END_MINIMUM_FILL_WIDTH
    private static readonly BAR_END_MINIMUM_FILL_WIDTH: number = 4;

    /** One stripe every 10px, so the pattern repeats — and scrolls — on a 10px cycle. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::STRIPE_PERIOD_PX
    private static readonly STRIPE_PERIOD_PX: number = 10;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::STRIPE_STEP_MS
    private static readonly STRIPE_STEP_MS: number = 70;

    /** The stripes are the fill's own colour at half value in HSV — same hue, darker. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::STRIPE_VALUE_SCALE
    private static readonly STRIPE_VALUE_SCALE: number = 0.5;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::STRIPED_PROGRESS_BAR_ASSETS
    private static readonly STRIPED_PROGRESS_BAR_ASSETS = {
        background: 'variablefx_striped_bar_background',
        bar: 'variablefx_striped_bar_fill',
        darkening: 'variablefx_striped_bar_darkening',
        darkeningMetallic: 'variablefx_striped_bar_darkening_metallic',
        lighting: 'variablefx_striped_bar_lighting',
        lightingMetallic: 'variablefx_striped_bar_lighting_metallic',
        metallic: 'variablefx_striped_bar_metallic',
        stripe: 'variablefx_striped_bar_stripe'
    };

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_assets
    private _assets: IStripedBarAssets;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_backgroundPrebake (name derived)
    //   `_SafeStr_9127`: the baked chrome, drawn first on every frame.
    private _backgroundPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_barCache
    private _barCache: OffscreenCanvas | null = null;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_cachedBarArgb (name derived)
    //   `_SafeStr_9406`: the ARGB `_barCache`/`_barEndCache` were last composited for.
    private _cachedBarArgb: number = -1;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_barEndCache
    private _barEndCache: OffscreenCanvas | null = null;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_barEndPrebake (name derived)
    private _barEndPrebake: OffscreenCanvas | null;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_barPrebake (name derived)
    private _barPrebake: OffscreenCanvas | null;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_barShapePrebake (name derived)
    //   `_SafeStr_10326`: the untinted fill, kept so a dynamic colour can be re-tinted from it
    //   without re-running the nine-slice.
    private _barShapePrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_foregroundPrebake (name derived)
    //   `_SafeStr_8907`: the icon, baked — this bar draws it over the fill, not beside it.
    private _foregroundPrebake: OffscreenCanvas | null;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_iconLayout
    private _iconLayout: VariableFxIconOverlayLayout;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_lastStripePhase (name derived)
    //   `_SafeStr_9525`: the stripe phase the last rendered frame used.
    private _lastStripePhase: number = -1;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_layout
    private _layout: IVariableFxBarLayout;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_overlays
    private _overlays: IStripedBarOverlay[];

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_stripesOverlayCache
    private _stripesOverlayCache: OffscreenCanvas | null = null;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_cachedStripesArgb (name derived)
    //   `_SafeStr_10086`: the ARGB `_stripesOverlayCache` was last tinted to.
    private _cachedStripesArgb: number = -1;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_stripesOverlayPrebake (name derived)
    private _stripesOverlayPrebake: OffscreenCanvas | null;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::_stripesOverlayShapePrebake (name derived)
    //   `_SafeStr_8477`: the untinted stripe run, one period wider than the bar.
    private _stripesOverlayShapePrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::StripedProgressBarRenderer()
    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => this.createPrebake(context)
        ) as VariableFxGenericRendererPrebake;

        const data = prebake.data as IStripedBarPrebake;

        this._assets = data.assets;
        this._backgroundPrebake = data.backgroundPrebake;
        this._barEndPrebake = data.barEndPrebake;
        this._barPrebake = data.barPrebake;
        this._barShapePrebake = data.barShapePrebake;
        this._foregroundPrebake = data.foregroundPrebake;
        this._iconLayout = data.iconLayout;
        this._layout = data.layout;
        this._overlays = data.overlays;
        this._stripesOverlayPrebake = data.stripesOverlayPrebake;
        this._stripesOverlayShapePrebake = data.stripesOverlayShapePrebake;

        // No baked fill means a dynamic colour: allocate the per-renderer caches it recomposites
        // into instead.
        if(this._barPrebake === null)
        {
            this._barCache = StripedProgressBarRenderer.createTransparentBitmap(
                this._iconLayout.frameWidth, this._iconLayout.frameHeight
            );
            this._barEndCache = StripedProgressBarRenderer.createTransparentBitmap(
                StripedProgressBarRenderer.BAR_END_WIDTH, this._iconLayout.frameHeight
            );
        }

        if(this._stripesOverlayPrebake === null)
        {
            this._stripesOverlayCache = StripedProgressBarRenderer.createTransparentBitmap(
                this._stripesOverlayShapePrebake.width, this._stripesOverlayShapePrebake.height
            );
        }
    }

    /** The five configured sizes. An unknown name is `medium`, not an error. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveStripedProgressBarFrameWidth()
    static resolveStripedProgressBarFrameWidth(width: string): number
    {
        switch(width)
        {
            case 'extra_small': return 29;
            case 'small': return 37;
            case 'medium': return 53;
            case 'large': return 69;
            case 'extra_large': return 85;
            default: return 53;
        }
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::get frameWidth()
    protected override get frameWidth(): number
    {
        return this._iconLayout.frameWidth;
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::get frameHeight()
    protected override get frameHeight(): number
    {
        return this._iconLayout.frameHeight;
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::get progressPixelWidth()
    protected override get progressPixelWidth(): number
    {
        return this._layout.fillWidth;
    }

    /**
     * Continuous only while there is fill: the stripes are what moves, and with nothing filled
     * there are no stripes on screen.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::get isContinuous()
    override get isContinuous(): boolean
    {
        return this.calculateFilledPixelWidth() > 0;
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::createFrameBitmap()
    protected override createFrameBitmap(width: number, height: number): OffscreenCanvas | null
    {
        return StripedProgressBarRenderer.createTransparentBitmap(width, height);
    }

    /**
     * Background, fill, end cap, stripes, icon. AS3 wraps this in `lock()`/`unlock()`, which has no
     * Canvas counterpart and needs none — it was a BitmapData batching hint, not semantics.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::renderFrame()
    protected override renderFrame(time: number): void
    {
        const target = this.mutableFrame.bitmapData;

        if(target === null) return;

        const composer = new VariableFxBitmapComposer(target);
        const filled = this.calculateFilledPixelWidth();

        composer.drawLayer(this._backgroundPrebake, 0, 0, 'normal', 255);

        if(filled > 0)
        {
            const clip = this.createFillClip(filled);
            const bar = this.resolveBarPrebakeOrCache();

            if(bar !== null) composer.drawLayer(bar, 0, 0, 'normal', 255, clip);

            if(StripedProgressBarRenderer.shouldDrawBarEnd(filled))
            {
                const barEnd = this.resolveBarEndPrebakeOrCache();

                // Drawn at y = 0, not at `contentY`: the end cap bitmap is full frame height, cut
                // straight out of the finished bar, so it is already at its final vertical offset.
                if(barEnd !== null)
                {
                    composer.drawLayer(
                        barEnd,
                        this._iconLayout.contentX + this._layout.fillX + filled - StripedProgressBarRenderer.BAR_END_WIDTH,
                        0,
                        'normal',
                        255,
                        this.createFillClip(this._layout.fillWidth)
                    );
                }
            }

            const stripes = this.resolveStripesOverlayPrebakeOrCache();

            if(stripes !== null)
            {
                composer.drawLayer(stripes, StripedProgressBarRenderer.resolveStripeLayerX(time), 0, 'multiply', 255, clip);
            }
        }

        if(this._foregroundPrebake !== null) composer.drawLayer(this._foregroundPrebake, 0, 0, 'normal', 255);
    }

    /** The stripes move even when nothing else does — this is what keeps the bar animating. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::hasRendererSpecificRenderChange()
    protected override hasRendererSpecificRenderChange(time: number): boolean
    {
        return this.calculateFilledPixelWidth() > 0
            && StripedProgressBarRenderer.resolveStripePhase(time) !== this._lastStripePhase;
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::didRenderFrame()
    protected override didRenderFrame(time: number): void
    {
        this._lastStripePhase = StripedProgressBarRenderer.resolveStripePhase(time);
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::createPrebake()
    private createPrebake(context: VariableFxRendererContext): VariableFxGenericRendererPrebake
    {
        const layout = StripedProgressBarRenderer.resolveLayout(context.config.width);
        const assets = this.resolveAssets(context);
        const icon = VariableFxConfiguredIcon.resolve(context);
        const iconLayout = StripedProgressBarRenderer.resolveIconOverlayLayout(context, layout, icon);
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const overlays = StripedProgressBarRenderer.resolveOverlays(assets);
        const isDynamicPaint = VariableFxPaintColor.isDynamicPaintColor(context.config.color);

        const backgroundPrebake = StripedProgressBarRenderer.createTransparentBitmap(
            iconLayout.frameWidth, iconLayout.frameHeight
        );
        const barShapePrebake = StripedProgressBarRenderer.createTransparentBitmap(
            iconLayout.frameWidth, iconLayout.frameHeight
        );
        const foregroundPrebake = iconLayout.hasIcon
            ? StripedProgressBarRenderer.createTransparentBitmap(iconLayout.frameWidth, iconLayout.frameHeight)
            : null;

        // One period wider than the frame plus a whole stripe, so the layer can scroll a full cycle
        // without either end coming into view.
        const stripesOverlayShapePrebake = StripedProgressBarRenderer.createTransparentBitmap(
            iconLayout.frameWidth + StripedProgressBarRenderer.STRIPE_PERIOD_PX + assets.stripe.width,
            iconLayout.frameHeight
        );

        // Baked only for a static colour — a dynamic one changes as the value does.
        const barPrebake = isDynamicPaint
            ? null
            : StripedProgressBarRenderer.createTransparentBitmap(iconLayout.frameWidth, iconLayout.frameHeight);
        const barEndPrebake = isDynamicPaint
            ? null
            : StripedProgressBarRenderer.createTransparentBitmap(
                StripedProgressBarRenderer.BAR_END_WIDTH, iconLayout.frameHeight
            );
        const stripesOverlayPrebake = isDynamicPaint
            ? null
            : StripedProgressBarRenderer.createTransparentBitmap(
                stripesOverlayShapePrebake.width, stripesOverlayShapePrebake.height
            );

        StripedProgressBarRenderer.prebakeBackground(backgroundPrebake, assets, layout, iconLayout);
        StripedProgressBarRenderer.prebakeBarShape(barShapePrebake, assets, layout, iconLayout);
        StripedProgressBarRenderer.prebakeForeground(foregroundPrebake, icon, iconLayout);
        StripedProgressBarRenderer.prebakeStripesOverlayShape(stripesOverlayShapePrebake, assets, layout, iconLayout);

        if(barPrebake !== null && barEndPrebake !== null && stripesOverlayPrebake !== null)
        {
            StripedProgressBarRenderer.drawBarBitmap(
                barPrebake, barEndPrebake, (0xFF000000 | paintColor.rgb) >>> 0,
                barShapePrebake, assets, overlays, layout, iconLayout
            );
            StripedProgressBarRenderer.drawStripesOverlayBitmap(
                stripesOverlayPrebake,
                (0xFF000000 | StripedProgressBarRenderer.resolveStripeRgb(paintColor.rgb)) >>> 0,
                stripesOverlayShapePrebake
            );
        }

        const data: IStripedBarPrebake = {
            assets, backgroundPrebake, barEndPrebake, barPrebake, barShapePrebake, foregroundPrebake,
            iconLayout, layout, overlays, stripesOverlayPrebake, stripesOverlayShapePrebake
        };

        // AS3 disposes seven BitmapData here. An OffscreenCanvas is collected once unreferenced, so
        // the callback has nothing to do — kept as the hook the prebake contract asks for.
        return new VariableFxGenericRendererPrebake(data, null);
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::prebakeBackground()
    private static prebakeBackground(
        target: OffscreenCanvas,
        assets: IStripedBarAssets,
        layout: IVariableFxBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawThreeSlice(
            assets.background,
            VariableFxBarSliceUtils.resolveBackgroundSliceLeftWidth(layout),
            VariableFxBarSliceUtils.resolveBackgroundSliceRightWidth(layout),
            layout.width,
            iconLayout.contentX,
            iconLayout.contentY,
            'normal',
            255
        );
    }

    /** The fill at full width, UNTINTED — every colour this bar ever shows is tinted from this. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::prebakeBarShape()
    private static prebakeBarShape(
        target: OffscreenCanvas,
        assets: IStripedBarAssets,
        layout: IVariableFxBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawThreeSlice(
            assets.bar,
            layout.sliceLeftWidth,
            layout.sliceRightWidth,
            layout.fillWidth,
            iconLayout.contentX + layout.fillX,
            iconLayout.contentY + layout.fillY,
            'normal',
            255
        );
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::prebakeForeground()
    private static prebakeForeground(
        target: OffscreenCanvas | null,
        icon: VariableFxConfiguredIcon | null,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        if(target === null || icon === null) return;

        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawLayer(icon.bitmapData, iconLayout.iconX, iconLayout.iconY, 'normal', 255);
    }

    /**
     * The stripe run, laid down one stripe every period across the fill and a period beyond it.
     *
     * The overshoot is what the scroll eats: the layer is drawn at -10..-1, so without the extra
     * stripe past the right edge a gap would open there as it moved.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::prebakeStripesOverlayShape()
    private static prebakeStripesOverlayShape(
        target: OffscreenCanvas,
        assets: IStripedBarAssets,
        layout: IVariableFxBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);
        const limit = layout.fillWidth + StripedProgressBarRenderer.STRIPE_PERIOD_PX;

        composer.clear(0);

        for(let offset = 0; offset <= limit; offset += StripedProgressBarRenderer.STRIPE_PERIOD_PX)
        {
            composer.drawLayer(
                assets.stripe,
                iconLayout.contentX + layout.fillX + offset,
                iconLayout.contentY + layout.fillY,
                'normal',
                255
            );
        }
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveBarPrebakeOrCache()
    private resolveBarPrebakeOrCache(): OffscreenCanvas | null
    {
        if(this._barPrebake !== null) return this._barPrebake;

        this.resolveDynamicBarCaches();

        return this._barCache;
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveBarEndPrebakeOrCache()
    private resolveBarEndPrebakeOrCache(): OffscreenCanvas | null
    {
        if(this._barEndPrebake !== null) return this._barEndPrebake;

        this.resolveDynamicBarCaches();

        return this._barEndCache;
    }

    /**
     * The stripe layer is keyed on its OWN colour, not the fill's — two colours that scale to the
     * same half-value shade share a stripe bake even though their fills differ.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveStripesOverlayPrebakeOrCache()
    private resolveStripesOverlayPrebakeOrCache(): OffscreenCanvas | null
    {
        if(this._stripesOverlayPrebake !== null) return this._stripesOverlayPrebake;

        const argb = (0xFF000000 | StripedProgressBarRenderer.resolveStripeRgb(this.displayedFillArgb & 0xFFFFFF)) >>> 0;

        if(this._cachedStripesArgb !== argb && this._stripesOverlayCache !== null)
        {
            this._cachedStripesArgb = argb;

            StripedProgressBarRenderer.drawStripesOverlayBitmap(
                this._stripesOverlayCache, argb, this._stripesOverlayShapePrebake
            );
        }

        return this._stripesOverlayCache;
    }

    /** Recomposites the dynamic caches only when the animated colour has actually moved. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveDynamicBarCaches()
    private resolveDynamicBarCaches(): void
    {
        const argb = this.displayedFillArgb;

        if(this._cachedBarArgb === argb) return;

        this._cachedBarArgb = argb;

        if(this._barCache === null || this._barEndCache === null) return;

        StripedProgressBarRenderer.drawBarBitmap(
            this._barCache, this._barEndCache, argb, this._barShapePrebake,
            this._assets, this._overlays, this._layout, this._iconLayout
        );
    }

    /**
     * Tints the baked fill shape, shades it, then derives the end cap from the result.
     *
     * The shading passes are REPEATED three-slices, not stretched ones: this bar's darkening and
     * lighting artwork carries the stripe rhythm, and stretching it would smear a run of highlights
     * into one long one.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::drawBarBitmap()
    private static drawBarBitmap(
        target: OffscreenCanvas,
        barEndTarget: OffscreenCanvas,
        argb: number,
        barShape: OffscreenCanvas,
        assets: IStripedBarAssets,
        overlays: IStripedBarOverlay[],
        layout: IVariableFxBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawTintedLayer(barShape, 0, 0, argb, 'normal', 255);

        if(assets.metallic !== null)
        {
            StripedProgressBarRenderer.drawFullFillLayer(
                composer, assets.metallic, 'add', layout, iconLayout,
                StripedProgressBarRenderer.LIGHTING_SLICE_LEFT_WIDTH,
                StripedProgressBarRenderer.FILL_OVERLAY_SLICE_WIDTH
            );
        }

        for(const overlay of overlays)
        {
            StripedProgressBarRenderer.drawFullFillLayer(
                composer, overlay.layer, overlay.blendMode, layout, iconLayout,
                overlay.sliceLeftWidth, overlay.sliceRightWidth
            );
        }

        StripedProgressBarRenderer.drawBarEndBitmap(barEndTarget, target, layout, iconLayout);
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::drawStripesOverlayBitmap()
    private static drawStripesOverlayBitmap(target: OffscreenCanvas, argb: number, shape: OffscreenCanvas): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawTintedLayer(shape, 0, 0, argb, 'normal', 255);
    }

    /**
     * The end cap is a 2px column CUT OUT of the finished bar, not drawn again — which is why it
     * matches the shading of the body it butts against.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::drawBarEndBitmap()
    private static drawBarEndBitmap(
        target: OffscreenCanvas,
        bar: OffscreenCanvas,
        layout: IVariableFxBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);
        const sourceX = iconLayout.contentX + layout.fillX + layout.fillWidth - StripedProgressBarRenderer.BAR_END_WIDTH;

        composer.clear(0);
        composer.drawLayer(bar, -sourceX, 0, 'normal', 255);
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::drawFullFillLayer()
    private static drawFullFillLayer(
        composer: VariableFxBitmapComposer,
        layer: VariableFxDrawable,
        blendMode: string,
        layout: IVariableFxBarLayout,
        iconLayout: VariableFxIconOverlayLayout,
        sliceLeftWidth: number,
        sliceRightWidth: number
    ): void
    {
        composer.drawRepeatedThreeSlice(
            layer, sliceLeftWidth, sliceRightWidth, layout.fillWidth,
            iconLayout.contentX + layout.fillX, iconLayout.contentY + layout.fillY, blendMode, 255
        );
    }

    /** Clips a layer to the filled part of the bar — this is what makes the bar a bar. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::createFillClip()
    private createFillClip(width: number): VariableFxClipRect
    {
        return new VariableFxClipRect(
            this._iconLayout.contentX + this._layout.fillX,
            this._iconLayout.contentY + this._layout.fillY,
            width,
            this._layout.fillHeight
        );
    }

    /** Below this much fill there is no room for an end cap, so none is drawn. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::shouldDrawBarEnd()
    private static shouldDrawBarEnd(filled: number): boolean
    {
        return filled >= StripedProgressBarRenderer.BAR_END_MINIMUM_FILL_WIDTH;
    }

    /** The stripe layer sits a whole period to the left, so its overshoot covers the right edge. */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveStripeLayerX()
    private static resolveStripeLayerX(time: number): number
    {
        return StripedProgressBarRenderer.resolveStripePhase(time) - StripedProgressBarRenderer.STRIPE_PERIOD_PX;
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveStripePhase()
    private static resolveStripePhase(time: number): number
    {
        if(time <= 0) return 0;

        return ((time / StripedProgressBarRenderer.STRIPE_STEP_MS) | 0) % StripedProgressBarRenderer.STRIPE_PERIOD_PX;
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveStripeRgb()
    private static resolveStripeRgb(rgb: number): number
    {
        return VariableFxColorUtils.scaleRgbValueInHsv(rgb, StripedProgressBarRenderer.STRIPE_VALUE_SCALE);
    }

    /**
     * A metallic paint swaps the shading ARTWORK rather than applying it twice as the classic bar
     * does — a striped fill already carries a rhythm, and a doubled pass over it reads as noise.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveAssets()
    private resolveAssets(context: VariableFxRendererContext): IStripedBarAssets
    {
        const names = StripedProgressBarRenderer.STRIPED_PROGRESS_BAR_ASSETS;
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const isMetallic = paintColor.isMetallic;

        return {
            background: this.getLayer(context, names.background),
            bar: this.getLayer(context, names.bar),
            darkening: this.getLayer(context, isMetallic ? names.darkeningMetallic : names.darkening),
            lighting: this.getLayer(context, isMetallic ? names.lightingMetallic : names.lighting),
            metallic: isMetallic ? this.getLayer(context, names.metallic) : null,
            stripe: this.getLayer(context, names.stripe)
        };
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveOverlays()
    private static resolveOverlays(assets: IStripedBarAssets): IStripedBarOverlay[]
    {
        return [
            {
                blendMode: 'multiply',
                layer: assets.darkening,
                sliceLeftWidth: StripedProgressBarRenderer.FILL_OVERLAY_SLICE_WIDTH,
                sliceRightWidth: StripedProgressBarRenderer.FILL_OVERLAY_SLICE_WIDTH
            },
            {
                blendMode: 'add',
                layer: assets.lighting,
                sliceLeftWidth: StripedProgressBarRenderer.LIGHTING_SLICE_LEFT_WIDTH,
                sliceRightWidth: StripedProgressBarRenderer.FILL_OVERLAY_SLICE_WIDTH
            }
        ];
    }

    /**
     * Throws on a missing layer, as AS3 does. Kept: the bar's every measurement is derived from its
     * artwork, so carrying on would lay out a bar against something that is not there.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::getLayer()
    private getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX striped progress bar layer '${name}'.`);

        return layer;
    }

    /**
     * Every metric here is a CONSTANT, unlike the classic bar, whose height comes from its
     * background artwork — only the width is configured.
     */
    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveLayout()
    private static resolveLayout(width: string): IVariableFxBarLayout
    {
        const frameWidth = StripedProgressBarRenderer.resolveStripedProgressBarFrameWidth(width);

        return {
            fillHeight: StripedProgressBarRenderer.FILL_HEIGHT,
            fillWidth: Math.max(0, frameWidth - StripedProgressBarRenderer.CHROME_EDGE_WIDTH * 2),
            fillX: StripedProgressBarRenderer.CHROME_EDGE_WIDTH,
            fillY: StripedProgressBarRenderer.FILL_Y,
            height: StripedProgressBarRenderer.FRAME_HEIGHT,
            sliceLeftWidth: StripedProgressBarRenderer.CHROME_EDGE_WIDTH,
            sliceRightWidth: StripedProgressBarRenderer.CHROME_EDGE_WIDTH,
            width: frameWidth
        };
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::resolveIconOverlayLayout()
    private static resolveIconOverlayLayout(
        context: VariableFxRendererContext,
        layout: IVariableFxBarLayout,
        icon: VariableFxConfiguredIcon | null
    ): VariableFxIconOverlayLayout
    {
        return VariableFxConfiguredIcon.resolveBarIconOverlayLayout(
            layout.width, layout.height, icon, VariableFxConfiguredIcon.resolveAlignment(context)
        );
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::createTransparentBitmap()
    private static createTransparentBitmap(width: number, height: number): OffscreenCanvas
    {
        return new OffscreenCanvas(Math.max(1, width | 0), Math.max(1, height | 0));
    }

    // AS3: .../renderers/bar/StripedProgressBarRenderer.as::dispose()
    override dispose(): void
    {
        super.dispose();

        this._barCache = null;
        this._barEndCache = null;
        this._stripesOverlayCache = null;
    }
}
