import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxGenericRendererPrebake} from '../../VariableFxGenericRendererPrebake';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxClipRect} from '../../rendering/VariableFxClipRect';
import {VariableFxConfiguredIcon} from '../../rendering/VariableFxConfiguredIcon';
import type {VariableFxIconOverlayLayout} from '../../rendering/VariableFxIconOverlayLayout';
import {BarVariableFxRendererBase} from './BarVariableFxRendererBase';
import {VariableFxBarSliceUtils} from './VariableFxBarSliceUtils';
import type {
    IVariableFxBarAssetNames,
    IVariableFxBarAssets,
    IVariableFxBarLayout,
    IVariableFxBarOverlay
} from './IVariableFxBarLayout';

/** What `createPrebake()` stores on the config, and the constructor reads back. */
interface IClassicBarPrebake
{
    assets: IVariableFxBarAssets;
    backgroundPrebake: OffscreenCanvas;
    barEndPrebake: OffscreenCanvas | null;
    barPrebake: OffscreenCanvas | null;
    icon: VariableFxConfiguredIcon | null;
    iconLayout: VariableFxIconOverlayLayout;
    layout: IVariableFxBarLayout;
}

/**
 * The bar everything else is a variation of: a nine-sliced background, a nine-sliced fill tinted to
 * the config's colour, shading passes over it, and an optional icon hanging off one end.
 *
 * WHAT IS BAKED AND WHAT IS NOT is the whole performance story. The background never changes, so it
 * is composited once per config and shared by every object using it. The fill is baked too — but
 * only for a STATIC colour. A dynamic one (red-to-green, levelling, team) has to be recomposited
 * whenever the colour animates, so those fall back to a per-renderer cache keyed on the current
 * ARGB: still only redrawn when the colour actually moves, but not shareable.
 *
 * Drawing a frame is then three layers at most: the baked background, the baked fill clipped to the
 * filled width, and a 2px "end cap" of fill drawn at the boundary so the bar has a lip instead of a
 * cut edge. That end cap is skipped entirely below 4px of fill, where there is no room for it.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/ClassicProgressBarRenderer.as
 */
export class ClassicProgressBarRenderer extends BarVariableFxRendererBase
{
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::CLASSIC_PROGRESS_BAR_ASSETS
    private static readonly CLASSIC_PROGRESS_BAR_ASSETS: IVariableFxBarAssetNames = {
        background: 'variablefx_classic_bar_background',
        bar: 'variablefx_classic_bar_fill',
        darkening: 'variablefx_classic_bar_darkening',
        lighting: 'variablefx_classic_bar_lighting',
        metallic: 'variablefx_classic_bar_metallic'
    };

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::BASE_LAYOUT_METRICS
    private static readonly BASE_LAYOUT_METRICS = {
        fillX: 1,
        fillY: 1,
        sliceLeftWidth: 2,
        sliceRightWidth: 2
    };

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::OVERLAY_SLICE (name derived)
    //   The AS3 constant is `_SafeStr_9968`; named for its only reader, `overlaySlice`.
    private static readonly OVERLAY_SLICE = {leftWidth: 3, rightWidth: 3};

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_assets
    private _assets: IVariableFxBarAssets;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_backgroundPrebake (name derived)
    private _backgroundPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_barCache
    private _barCache: OffscreenCanvas | null = null;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_cachedBarArgb (name derived)
    //   `_SafeStr_9406`: the ARGB the dynamic caches were last drawn for.
    private _cachedBarArgb: number = -1;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_barEndCache
    private _barEndCache: OffscreenCanvas | null = null;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_barEndPrebake (name derived)
    private _barEndPrebake: OffscreenCanvas | null;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_barPrebake (name derived)
    private _barPrebake: OffscreenCanvas | null;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_icon
    private _icon: VariableFxConfiguredIcon | null;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_iconLayout
    private _iconLayout: VariableFxIconOverlayLayout;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::_layout
    private _layout: IVariableFxBarLayout;

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::ClassicProgressBarRenderer()
    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => this.createPrebake(context)
        ) as VariableFxGenericRendererPrebake;

        const data = prebake.data as IClassicBarPrebake;

        this._assets = data.assets;
        this._backgroundPrebake = data.backgroundPrebake;
        this._barEndPrebake = data.barEndPrebake;
        this._barPrebake = data.barPrebake;
        this._icon = data.icon;
        this._iconLayout = data.iconLayout;
        this._layout = data.layout;

        // No baked fill means a dynamic colour: allocate the per-renderer caches it recomposites
        // into instead.
        if(this._barPrebake === null)
        {
            this._barCache = ClassicProgressBarRenderer.createTransparentBitmap(
                this._iconLayout.frameWidth, this._iconLayout.frameHeight
            );
            this._barEndCache = ClassicProgressBarRenderer.createTransparentBitmap(
                this.barEndWidthPx, this._layout.height
            );
        }
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get frameWidth()
    protected override get frameWidth(): number
    {
        return this._iconLayout.frameWidth;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get frameHeight()
    protected override get frameHeight(): number
    {
        return this._iconLayout.frameHeight;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get progressPixelWidth()
    protected override get progressPixelWidth(): number
    {
        return this._layout.fillWidth;
    }

    /** The mini bar overrides exactly this and `layerDescription`, and nothing else. */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get assetNames()
    protected get assetNames(): IVariableFxBarAssetNames
    {
        return ClassicProgressBarRenderer.CLASSIC_PROGRESS_BAR_ASSETS;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get baseLayoutMetrics()
    protected get baseLayoutMetrics(): typeof ClassicProgressBarRenderer.BASE_LAYOUT_METRICS
    {
        return ClassicProgressBarRenderer.BASE_LAYOUT_METRICS;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get iconContentYOffsetPx()
    protected get iconContentYOffsetPx(): number
    {
        return 2;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get layerDescription()
    protected get layerDescription(): string
    {
        return 'classic progress bar';
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get overlaySlice()
    protected get overlaySlice(): typeof ClassicProgressBarRenderer.OVERLAY_SLICE
    {
        return ClassicProgressBarRenderer.OVERLAY_SLICE;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get barEndWidthPx()
    protected get barEndWidthPx(): number
    {
        return 2;
    }

    /** Below this much fill there is no room for an end cap, so none is drawn. */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get barEndMinimumFillWidthPx()
    protected get barEndMinimumFillWidthPx(): number
    {
        return 4;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get barBodyIncludesEndWidth()
    protected get barBodyIncludesEndWidth(): boolean
    {
        return true;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get barEndSourceRightPaddingPx()
    protected get barEndSourceRightPaddingPx(): number
    {
        return 1;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get barEndBaseSourceRightPaddingPx()
    protected get barEndBaseSourceRightPaddingPx(): number
    {
        return this.barEndSourceRightPaddingPx;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::get usesSeparateBarEndOverlaySource()
    protected get usesSeparateBarEndOverlaySource(): boolean
    {
        return false;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::createFrameBitmap()
    protected override createFrameBitmap(width: number, height: number): OffscreenCanvas | null
    {
        return ClassicProgressBarRenderer.createTransparentBitmap(width, height);
    }

    /**
     * Three composites at most. AS3 wraps this in `lock()`/`unlock()`, which has no Canvas
     * counterpart and no need for one — it was a BitmapData batching hint, not semantics.
     */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::renderFrame()
    protected override renderFrame(_time: number): void
    {
        const target = this.mutableFrame.bitmapData;

        if(target === null) return;

        const composer = new VariableFxBitmapComposer(target);
        const filled = this.calculateFilledPixelWidth();
        const contentX = this._iconLayout.contentX;
        const contentY = this._iconLayout.contentY;

        composer.drawLayer(this._backgroundPrebake, 0, 0, 'normal', 255);

        if(filled > 0)
        {
            const bar = this.resolveBarPrebakeOrCache();

            if(bar !== null) composer.drawLayer(bar, 0, 0, 'normal', 255, this.resolveBarBodyClip(filled));

            if(this.shouldDrawBarEnd(filled))
            {
                const barEnd = this.resolveBarEndPrebakeOrCache();

                if(barEnd !== null)
                {
                    composer.drawLayer(
                        barEnd,
                        contentX + this._layout.fillX + filled - this.barEndWidthPx,
                        contentY,
                        'normal',
                        255,
                        this.resolveBarEndClip()
                    );
                }
            }
        }

        this.drawIconOverlay(composer, this._iconLayout, this._icon);
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::drawIconOverlay()
    protected drawIconOverlay(
        composer: VariableFxBitmapComposer,
        iconLayout: VariableFxIconOverlayLayout,
        icon: VariableFxConfiguredIcon | null
    ): void
    {
        if(icon === null) return;

        composer.drawLayer(icon.bitmapData, iconLayout.iconX, iconLayout.iconY, 'normal', 255);
    }

    /** The five configured sizes. An unknown name is `medium`, not an error. */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveFrameWidth()
    protected resolveFrameWidth(width: string): number
    {
        switch(width)
        {
            case 'extra_small': return 29;
            case 'small': return 45;
            case 'medium': return 61;
            case 'large': return 77;
            case 'extra_large': return 93;
            default: return 61;
        }
    }

    /**
     * A metallic paint gets its shading applied TWICE — darken, lighten, darken, lighten — which is
     * what gives it the harder, polished falloff a single pass cannot.
     */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveMetallicOverlays()
    protected resolveMetallicOverlays(darkening: VariableFxDrawable, lighting: VariableFxDrawable): IVariableFxBarOverlay[]
    {
        return [
            {blendMode: 'add', layer: lighting},
            {blendMode: 'multiply', layer: darkening},
            {blendMode: 'add', layer: lighting},
            {blendMode: 'multiply', layer: darkening}
        ];
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveNormalOverlays()
    protected resolveNormalOverlays(darkening: VariableFxDrawable, lighting: VariableFxDrawable): IVariableFxBarOverlay[]
    {
        return [
            {blendMode: 'multiply', layer: darkening},
            {blendMode: 'add', layer: lighting}
        ];
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::createPrebake()
    private createPrebake(context: VariableFxRendererContext): VariableFxGenericRendererPrebake
    {
        const layout = this.resolveLayout(context, context.config.width);
        const assets = this.resolveAssets(context);
        const icon = VariableFxConfiguredIcon.resolve(context);
        const iconLayout = this.resolveIconOverlayLayout(context, layout, icon);
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const isDynamicPaint = VariableFxPaintColor.isDynamicPaintColor(context.config.color);

        const backgroundPrebake = ClassicProgressBarRenderer.createTransparentBitmap(
            iconLayout.frameWidth, iconLayout.frameHeight
        );

        // Baked only for a static colour — a dynamic one changes as the value does.
        const barPrebake = isDynamicPaint
            ? null
            : ClassicProgressBarRenderer.createTransparentBitmap(iconLayout.frameWidth, iconLayout.frameHeight);
        const barEndPrebake = isDynamicPaint
            ? null
            : ClassicProgressBarRenderer.createTransparentBitmap(this.barEndWidthPx, layout.height);

        this.prebakeBackground(backgroundPrebake, assets, layout, iconLayout);

        if(barPrebake !== null && barEndPrebake !== null)
        {
            this.drawBarBitmap(barPrebake, barEndPrebake, (0xFF000000 | paintColor.rgb) >>> 0, assets, layout, iconLayout);
        }

        const data: IClassicBarPrebake = {
            assets, backgroundPrebake, barEndPrebake, barPrebake, icon, iconLayout, layout
        };

        // AS3 disposes three BitmapData here. An OffscreenCanvas is collected once unreferenced, so
        // the callback has nothing to do — kept as the hook the prebake contract asks for.
        return new VariableFxGenericRendererPrebake(data, null);
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::prebakeBackground()
    private prebakeBackground(
        target: OffscreenCanvas,
        assets: IVariableFxBarAssets,
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

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveBarPrebakeOrCache()
    private resolveBarPrebakeOrCache(): OffscreenCanvas | null
    {
        if(this._barPrebake !== null) return this._barPrebake;

        this.resolveDynamicBarCaches();

        return this._barCache;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveBarEndPrebakeOrCache()
    private resolveBarEndPrebakeOrCache(): OffscreenCanvas | null
    {
        if(this._barEndPrebake !== null) return this._barEndPrebake;

        this.resolveDynamicBarCaches();

        return this._barEndCache;
    }

    /** Recomposites the dynamic caches only when the animated colour has actually moved. */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveDynamicBarCaches()
    private resolveDynamicBarCaches(): void
    {
        const argb = this.displayedFillArgb;

        if(this._cachedBarArgb === argb) return;

        this._cachedBarArgb = argb;

        if(this._barCache === null || this._barEndCache === null) return;

        this.drawBarBitmap(this._barCache, this._barEndCache, argb, this._assets, this._layout, this._iconLayout);
    }

    /**
     * Composites the fill at full width into `target`, then derives the end cap from it.
     *
     * The fill is drawn tinted — one grey asset, every colour — and clipped to the fillable area so
     * the shading passes cannot bleed over the border.
     */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::drawBarBitmap()
    private drawBarBitmap(
        target: OffscreenCanvas,
        barEndTarget: OffscreenCanvas,
        argb: number,
        assets: IVariableFxBarAssets,
        layout: IVariableFxBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);
        const contentX = iconLayout.contentX;
        const contentY = iconLayout.contentY;
        const fullFillClip = ClassicProgressBarRenderer.resolveFullFillClip(layout, iconLayout);

        composer.clear(0);
        composer.drawThreeSlice(
            assets.bar,
            layout.sliceLeftWidth,
            layout.sliceRightWidth,
            layout.fillWidth,
            contentX + layout.fillX,
            contentY + layout.fillY,
            'normal',
            255,
            fullFillClip,
            argb
        );

        if(assets.metallic !== null)
        {
            this.drawOverlayLayer(composer, assets.metallic, 'add', layout.fillWidth, contentX, contentY, layout);
        }

        for(const overlay of assets.overlays)
        {
            this.drawOverlayLayer(composer, overlay.layer, overlay.blendMode, layout.fillWidth, contentX, contentY, layout);
        }

        this.drawBarEndBitmap(barEndTarget, target, assets, layout, iconLayout);
    }

    /**
     * The end cap is a 2px slice CUT OUT of the finished bar, not drawn again — which is why it
     * matches the shading of the body it butts against.
     */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::drawBarEndBitmap()
    private drawBarEndBitmap(
        target: OffscreenCanvas,
        bar: OffscreenCanvas,
        assets: IVariableFxBarAssets,
        layout: IVariableFxBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);
        let sourceX = iconLayout.contentX + layout.width - this.barEndSourceRightPaddingPx - this.barEndWidthPx;
        const sourceY = iconLayout.contentY;

        composer.clear(0);

        if(this.usesSeparateBarEndOverlaySource)
        {
            sourceX = iconLayout.contentX + layout.width - this.barEndBaseSourceRightPaddingPx - this.barEndWidthPx;

            composer.drawLayer(bar, -sourceX, -sourceY, 'normal', 255);

            if(assets.metallic !== null) this.drawOverlayEndLayer(composer, assets.metallic, 'add', layout);

            for(const overlay of assets.overlays)
            {
                this.drawOverlayEndLayer(composer, overlay.layer, overlay.blendMode, layout);
            }

            return;
        }

        composer.drawLayer(bar, -sourceX, -sourceY, 'normal', 255);
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::drawOverlayEndLayer()
    private drawOverlayEndLayer(
        composer: VariableFxBitmapComposer,
        layer: VariableFxDrawable,
        blendMode: string,
        layout: IVariableFxBarLayout
    ): void
    {
        const offset = layout.fillWidth - this.barEndSourceRightPaddingPx - this.barEndWidthPx;

        composer.drawThreeSlice(
            layer, this.overlaySlice.leftWidth, this.overlaySlice.rightWidth,
            layout.fillWidth, -offset, layout.fillY, blendMode, 255
        );
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::drawOverlayLayer()
    private drawOverlayLayer(
        composer: VariableFxBitmapComposer,
        layer: VariableFxDrawable,
        blendMode: string,
        width: number,
        contentX: number,
        contentY: number,
        layout: IVariableFxBarLayout,
        clipRect: VariableFxClipRect | null = null
    ): void
    {
        if(width <= 0) return;

        const drawn = Math.min(layout.fillWidth, width);

        composer.drawThreeSlice(
            layer, this.overlaySlice.leftWidth, this.overlaySlice.rightWidth, drawn,
            contentX + layout.fillX, contentY + layout.fillY, blendMode, 255, clipRect
        );
    }

    /** Clips the baked fill to how much of it is filled — this is what makes the bar a bar. */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveBarBodyClip()
    private resolveBarBodyClip(filled: number): VariableFxClipRect
    {
        const width = this.barBodyIncludesEndWidth ? filled : Math.max(0, filled - this.barEndWidthPx);

        return new VariableFxClipRect(
            this._iconLayout.contentX + this._layout.fillX,
            this._iconLayout.contentY + this._layout.fillY,
            width,
            this._layout.fillHeight
        );
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::shouldDrawBarEnd()
    private shouldDrawBarEnd(filled: number): boolean
    {
        return filled >= this.barEndMinimumFillWidthPx;
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveBarEndClip()
    private resolveBarEndClip(): VariableFxClipRect
    {
        return ClassicProgressBarRenderer.resolveFullFillClip(this._layout, this._iconLayout);
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveFullFillClip()
    private static resolveFullFillClip(layout: IVariableFxBarLayout, iconLayout: VariableFxIconOverlayLayout): VariableFxClipRect
    {
        return new VariableFxClipRect(
            iconLayout.contentX + layout.fillX,
            iconLayout.contentY + layout.fillY,
            layout.fillWidth,
            layout.fillHeight
        );
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::createTransparentBitmap()
    protected static createTransparentBitmap(width: number, height: number): OffscreenCanvas
    {
        return new OffscreenCanvas(Math.max(1, width | 0), Math.max(1, height | 0));
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveAssets()
    private resolveAssets(context: VariableFxRendererContext): IVariableFxBarAssets
    {
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const names = this.assetNames;
        const darkening = this.getLayer(context, names.darkening);
        const lighting = this.getLayer(context, names.lighting);
        const isMetallic = paintColor.isMetallic;

        return {
            background: this.getLayer(context, names.background),
            bar: this.getLayer(context, names.bar),
            metallic: isMetallic && names.metallic !== null ? this.getLayer(context, names.metallic) : null,
            overlays: isMetallic
                ? this.resolveMetallicOverlays(darkening, lighting)
                : this.resolveNormalOverlays(darkening, lighting)
        };
    }

    /**
     * Throws on a missing layer, as AS3 does. Kept: the bar's every measurement is derived from its
     * background's size, so carrying on would lay out a bar against artwork that is not there.
     */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::getLayer()
    protected getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX ${this.layerDescription} layer '${name}'.`);

        return layer;
    }

    /**
     * The bar's height comes from the ARTWORK, not from a constant — only its width is configured.
     */
    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveLayout()
    private resolveLayout(context: VariableFxRendererContext, width: string): IVariableFxBarLayout
    {
        const background = context.assetProvider === null
            ? null
            : context.assetProvider.getBitmapData(this.assetNames.background);

        if(background === null)
        {
            throw new Error(`Missing Variable FX ${this.layerDescription} background layer for layout resolution.`);
        }

        const metrics = this.baseLayoutMetrics;
        const frameWidth = this.resolveFrameWidth(width);

        return {
            fillHeight: Math.max(1, background.height - metrics.fillY * 2),
            fillWidth: Math.max(0, frameWidth - metrics.fillX * 2),
            fillX: metrics.fillX,
            fillY: metrics.fillY,
            height: background.height,
            sliceLeftWidth: metrics.sliceLeftWidth,
            sliceRightWidth: metrics.sliceRightWidth,
            width: frameWidth
        };
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::resolveIconOverlayLayout()
    protected resolveIconOverlayLayout(
        context: VariableFxRendererContext,
        layout: IVariableFxBarLayout,
        icon: VariableFxConfiguredIcon | null
    ): VariableFxIconOverlayLayout
    {
        return VariableFxConfiguredIcon.resolveBarIconOverlayLayout(
            layout.width,
            layout.height,
            icon,
            VariableFxConfiguredIcon.resolveAlignment(context),
            this.iconContentYOffsetPx
        );
    }

    // AS3: .../renderers/bar/ClassicProgressBarRenderer.as::dispose()
    override dispose(): void
    {
        super.dispose();

        this._barCache = null;
        this._barEndCache = null;
    }
}
