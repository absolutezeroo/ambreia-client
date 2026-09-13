import type {OrderedMap} from '@core/utils/OrderedMap';
import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxGenericRendererPrebake} from '../../VariableFxGenericRendererPrebake';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import {VariableFxSegmentedProgress} from '../../VariableFxSegmentedProgress';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxClipRect} from '../../rendering/VariableFxClipRect';
import {VariableFxConfiguredIcon} from '../../rendering/VariableFxConfiguredIcon';
import type {VariableFxIconOverlayLayout} from '../../rendering/VariableFxIconOverlayLayout';
import {BarVariableFxRendererBase} from './BarVariableFxRendererBase';
import {VariableFxBarSliceUtils} from './VariableFxBarSliceUtils';
import type {IVariableFxBarLayout, IVariableFxBarOverlay} from './IVariableFxBarLayout';

/** A bar layout that also knows how many arrows it was sized for. */
interface IArrowBarLayout extends IVariableFxBarLayout
{
    arrowCount: number;
}

/** The seven layers an arrow bar is built from — `metallic` only when the paint is metallic. */
interface IArrowBarAssets
{
    background: VariableFxDrawable;
    barChunk: VariableFxDrawable;
    darkening: VariableFxDrawable;
    lighting: VariableFxDrawable;
    metallic: VariableFxDrawable | null;
    splitter: VariableFxDrawable;
    splitterLeft: VariableFxDrawable;
}

/** What `createPrebake()` stores on the config, and the constructor reads back. */
interface IArrowBarPrebake
{
    assets: IArrowBarAssets;
    backgroundPrebake: OffscreenCanvas;
    barPrebake: OffscreenCanvas | null;
    foregroundPrebake: OffscreenCanvas;
    iconLayout: VariableFxIconOverlayLayout;
    layout: IArrowBarLayout;
    overlays: IVariableFxBarOverlay[];
}

/**
 * A bar made of chevrons: the fill is a row of arrowheads, each pointing at the next.
 *
 * Unlike every other bar in the family, this one is SEGMENTED rather than continuous — its width is
 * not a size name but an arrow count, and `extra.segments` can override the default for the size.
 * The frame is then whatever that count needs: two 3px edges plus 9px per arrow.
 *
 * It is also the only bar that draws by STAMPING. There is no nine-slice anywhere in the fill: one
 * 11px chunk is composited once — tinted, shaded, metallic if asked — and then stamped every 9px
 * across the fillable width, clipped to it. The 2px of overhang is the arrowhead, which is why the
 * chunks read as a continuous row of chevrons rather than a row of separate tiles.
 *
 * The separators are not part of the fill at all: `splitterLeft` and the `splitter` run live in the
 * FOREGROUND prebake with the icon, drawn over the fill on every frame, so the notches stay crisp
 * whatever the fill is doing underneath.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/ArrowProgressBarRenderer.as
 */
export class ArrowProgressBarRenderer extends BarVariableFxRendererBase
{
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::FRAME_HEIGHT
    private static readonly FRAME_HEIGHT: number = 13;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::CHROME_EDGE_WIDTH
    private static readonly CHROME_EDGE_WIDTH: number = 3;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::FILL_Y
    private static readonly FILL_Y: number = 3;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::FILL_HEIGHT
    private static readonly FILL_HEIGHT: number = 7;

    /** How much width one arrow takes — the stamp PITCH, not the chunk's own width. */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::ARROW_WIDTH
    private static readonly ARROW_WIDTH: number = 9;

    /** 2px wider than the pitch: the overhang is the arrowhead, and it laps over its neighbour. */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::BAR_CHUNK_WIDTH
    private static readonly BAR_CHUNK_WIDTH: number = 11;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::SPLITTER_FIRST_X (name derived)
    //   The AS3 constant is `_SafeStr_11146`, value 7 — where the splitter run starts, after the
    //   wider left-hand one.
    private static readonly SPLITTER_FIRST_X: number = 7;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::ARROW_PROGRESS_BAR_ASSETS
    private static readonly ARROW_PROGRESS_BAR_ASSETS = {
        background: 'variablefx_arrow_bar_background',
        barChunk: 'variablefx_arrow_bar_chunk',
        darkening: 'variablefx_arrow_bar_darkening',
        lighting: 'variablefx_arrow_bar_lighting',
        metallic: 'variablefx_arrow_bar_metallic',
        splitter: 'variablefx_arrow_bar_splitter',
        splitterLeft: 'variablefx_arrow_bar_splitter_left'
    };

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_assets
    private _assets: IArrowBarAssets;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_backgroundPrebake (name derived)
    private _backgroundPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_barCache
    private _barCache: OffscreenCanvas | null = null;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_cachedBarArgb (name derived)
    //   `_SafeStr_9406`: the ARGB `_barCache` was last composited for.
    private _cachedBarArgb: number = -1;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_barPrebake (name derived)
    private _barPrebake: OffscreenCanvas | null;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_foregroundPrebake (name derived)
    //   `_SafeStr_8907`: the splitters and the icon, drawn over the fill on every frame.
    private _foregroundPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_iconLayout
    private _iconLayout: VariableFxIconOverlayLayout;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_layout
    private _layout: IArrowBarLayout;

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::_overlays
    private _overlays: IVariableFxBarOverlay[];

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::ArrowProgressBarRenderer()
    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => this.createPrebake(context)
        ) as VariableFxGenericRendererPrebake;

        const data = prebake.data as IArrowBarPrebake;

        this._assets = data.assets;
        this._backgroundPrebake = data.backgroundPrebake;
        this._barPrebake = data.barPrebake;
        this._foregroundPrebake = data.foregroundPrebake;
        this._iconLayout = data.iconLayout;
        this._layout = data.layout;
        this._overlays = data.overlays;

        // No baked fill means a dynamic colour: allocate the cache it recomposites into instead.
        if(this._barPrebake === null)
        {
            this._barCache = ArrowProgressBarRenderer.createTransparentBitmap(
                this._iconLayout.frameWidth, this._iconLayout.frameHeight
            );
        }
    }

    /** The configured count, or the size name's default when `extra.segments` says nothing usable. */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::resolveArrowProgressBarArrowCount()
    static resolveArrowProgressBarArrowCount(width: string, extra: OrderedMap | null): number
    {
        return VariableFxSegmentedProgress.resolveSegmentCount(
            width, extra, ArrowProgressBarRenderer.resolveDefaultArrowProgressBarArrowCount
        );
    }

    /** The frame is sized BY the arrow count, not by the size name — two edges plus 9px per arrow. */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::resolveArrowProgressBarFrameWidth()
    static resolveArrowProgressBarFrameWidth(width: string, extra: OrderedMap | null): number
    {
        return ArrowProgressBarRenderer.CHROME_EDGE_WIDTH * 2
            + ArrowProgressBarRenderer.resolveArrowProgressBarArrowCount(width, extra) * ArrowProgressBarRenderer.ARROW_WIDTH;
    }

    /** The five configured sizes. An unknown name is `medium`, not an error. */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::resolveDefaultArrowProgressBarArrowCount()
    private static resolveDefaultArrowProgressBarArrowCount(width: string): number
    {
        switch(width)
        {
            case 'extra_small': return 3;
            case 'small': return 4;
            case 'medium': return 6;
            case 'large': return 8;
            case 'extra_large': return 10;
            default: return 6;
        }
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::get frameWidth()
    protected override get frameWidth(): number
    {
        return this._iconLayout.frameWidth;
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::get frameHeight()
    protected override get frameHeight(): number
    {
        return this._iconLayout.frameHeight;
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::get progressPixelWidth()
    protected override get progressPixelWidth(): number
    {
        return this._layout.fillWidth;
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::createFrameBitmap()
    protected override createFrameBitmap(width: number, height: number): OffscreenCanvas | null
    {
        return ArrowProgressBarRenderer.createTransparentBitmap(width, height);
    }

    /**
     * Background, fill, foreground — three composites, the last one unconditional because it also
     * carries the splitters, which must show on an empty bar too.
     */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::renderFrame()
    protected override renderFrame(_time: number): void
    {
        const target = this.mutableFrame.bitmapData;

        if(target === null) return;

        const composer = new VariableFxBitmapComposer(target);
        const filled = this.calculateFilledPixelWidth();

        composer.drawLayer(this._backgroundPrebake, 0, 0, 'normal', 255);

        if(filled > 0)
        {
            const bar = this.resolveBarPrebakeOrCache();

            if(bar !== null) composer.drawLayer(bar, 0, 0, 'normal', 255, this.createFillClip(filled));
        }

        composer.drawLayer(this._foregroundPrebake, 0, 0, 'normal', 255);
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::createPrebake()
    private createPrebake(context: VariableFxRendererContext): VariableFxGenericRendererPrebake
    {
        const layout = ArrowProgressBarRenderer.resolveLayout(context.config.width, context.config.extra);
        const assets = this.resolveAssets(context);
        const icon = VariableFxConfiguredIcon.resolve(context);
        const iconLayout = ArrowProgressBarRenderer.resolveIconOverlayLayout(context, layout, icon);
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const overlays = ArrowProgressBarRenderer.resolveOverlays(assets, paintColor.isMetallic);
        const isDynamicPaint = VariableFxPaintColor.isDynamicPaintColor(context.config.color);

        const backgroundPrebake = ArrowProgressBarRenderer.createTransparentBitmap(
            iconLayout.frameWidth, iconLayout.frameHeight
        );
        const foregroundPrebake = ArrowProgressBarRenderer.createTransparentBitmap(
            iconLayout.frameWidth, iconLayout.frameHeight
        );

        // Baked only for a static colour — a dynamic one changes as the value does.
        const barPrebake = isDynamicPaint
            ? null
            : ArrowProgressBarRenderer.createTransparentBitmap(iconLayout.frameWidth, iconLayout.frameHeight);

        ArrowProgressBarRenderer.prebakeBackground(backgroundPrebake, assets, layout, iconLayout);
        ArrowProgressBarRenderer.prebakeForeground(foregroundPrebake, assets, layout, iconLayout, icon);

        if(barPrebake !== null)
        {
            ArrowProgressBarRenderer.drawBarBitmap(
                barPrebake, (0xFF000000 | paintColor.rgb) >>> 0, assets, overlays, layout, iconLayout
            );
        }

        const data: IArrowBarPrebake = {
            assets, backgroundPrebake, barPrebake, foregroundPrebake, iconLayout, layout, overlays
        };

        // AS3 disposes three BitmapData here. An OffscreenCanvas is collected once unreferenced, so
        // the callback has nothing to do — kept as the hook the prebake contract asks for.
        return new VariableFxGenericRendererPrebake(data, null);
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::prebakeBackground()
    private static prebakeBackground(
        target: OffscreenCanvas,
        assets: IArrowBarAssets,
        layout: IArrowBarLayout,
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

    /**
     * The notches between arrows, plus the icon.
     *
     * The left-hand splitter is a different, wider piece than the rest — the run then starts at 7px
     * and repeats on the arrow pitch, so the first gap is narrower than the others by design.
     */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::prebakeForeground()
    private static prebakeForeground(
        target: OffscreenCanvas,
        assets: IArrowBarAssets,
        layout: IArrowBarLayout,
        iconLayout: VariableFxIconOverlayLayout,
        icon: VariableFxConfiguredIcon | null
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);
        const clip = ArrowProgressBarRenderer.createFillClipFor(layout.fillWidth, layout, iconLayout);
        const x = iconLayout.contentX + layout.fillX;
        const y = iconLayout.contentY + layout.fillY;

        composer.clear(0);
        composer.drawLayer(assets.splitterLeft, x, y, 'normal', 255, clip);

        for(let offset = ArrowProgressBarRenderer.SPLITTER_FIRST_X;
            offset < layout.fillWidth;
            offset += ArrowProgressBarRenderer.ARROW_WIDTH)
        {
            composer.drawLayer(assets.splitter, x + offset, y, 'normal', 255, clip);
        }

        if(icon !== null) composer.drawLayer(icon.bitmapData, iconLayout.iconX, iconLayout.iconY, 'normal', 255);
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::resolveBarPrebakeOrCache()
    private resolveBarPrebakeOrCache(): OffscreenCanvas | null
    {
        if(this._barPrebake !== null) return this._barPrebake;

        const argb = this.displayedFillArgb;

        if(this._cachedBarArgb !== argb && this._barCache !== null)
        {
            this._cachedBarArgb = argb;

            ArrowProgressBarRenderer.drawBarBitmap(
                this._barCache, argb, this._assets, this._overlays, this._layout, this._iconLayout
            );
        }

        return this._barCache;
    }

    /**
     * One chunk, stamped across the whole fillable width.
     *
     * Stamping the FULL width and clipping at draw time — rather than stamping only as far as the
     * bar is filled — is what lets the fill be a single cached bitmap: the clip moves every frame,
     * the bitmap does not.
     */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::drawBarBitmap()
    private static drawBarBitmap(
        target: OffscreenCanvas,
        argb: number,
        assets: IArrowBarAssets,
        overlays: IVariableFxBarOverlay[],
        layout: IArrowBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);
        const chunk = ArrowProgressBarRenderer.createBarChunkBitmap(argb, assets, overlays);
        const clip = ArrowProgressBarRenderer.createFillClipFor(layout.fillWidth, layout, iconLayout);
        const x = iconLayout.contentX + layout.fillX;
        const y = iconLayout.contentY + layout.fillY;

        composer.clear(0);

        for(let offset = 0; offset < layout.fillWidth; offset += ArrowProgressBarRenderer.ARROW_WIDTH)
        {
            composer.drawLayer(chunk, x + offset, y, 'normal', 255, clip);
        }
    }

    /**
     * The single arrowhead every stamp draws: tinted, then shaded at its own size.
     *
     * Nothing here is nine-sliced — the chunk is exactly the artwork's 11x7, so the shading layers
     * land on it one-to-one.
     */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::createBarChunkBitmap()
    private static createBarChunkBitmap(
        argb: number,
        assets: IArrowBarAssets,
        overlays: IVariableFxBarOverlay[]
    ): OffscreenCanvas
    {
        const chunk = ArrowProgressBarRenderer.createTransparentBitmap(
            ArrowProgressBarRenderer.BAR_CHUNK_WIDTH, ArrowProgressBarRenderer.FILL_HEIGHT
        );
        const composer = new VariableFxBitmapComposer(chunk);

        composer.clear(0);
        composer.drawTintedLayer(assets.barChunk, 0, 0, argb, 'normal', 255);

        if(assets.metallic !== null) composer.drawLayer(assets.metallic, 0, 0, 'add', 255);

        for(const overlay of overlays)
        {
            composer.drawLayer(overlay.layer, 0, 0, overlay.blendMode, 255);
        }

        return chunk;
    }

    /** Clips a layer to the filled part of the bar — this is what makes the bar a bar. */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::createFillClip()
    private createFillClip(width: number = -1): VariableFxClipRect
    {
        return ArrowProgressBarRenderer.createFillClipFor(width, this._layout, this._iconLayout);
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::createFillClip()
    private static createFillClipFor(
        width: number,
        layout: IArrowBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): VariableFxClipRect
    {
        return new VariableFxClipRect(
            iconLayout.contentX + layout.fillX,
            iconLayout.contentY + layout.fillY,
            width < 0 ? layout.fillWidth : width,
            layout.fillHeight
        );
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::resolveAssets()
    private resolveAssets(context: VariableFxRendererContext): IArrowBarAssets
    {
        const names = ArrowProgressBarRenderer.ARROW_PROGRESS_BAR_ASSETS;
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);

        return {
            background: this.getLayer(context, names.background),
            barChunk: this.getLayer(context, names.barChunk),
            darkening: this.getLayer(context, names.darkening),
            lighting: this.getLayer(context, names.lighting),
            metallic: paintColor.isMetallic ? this.getLayer(context, names.metallic) : null,
            splitter: this.getLayer(context, names.splitter),
            splitterLeft: this.getLayer(context, names.splitterLeft)
        };
    }

    /**
     * A metallic paint gets its shading applied TWICE — lighten, darken, lighten, darken — which is
     * what gives it the harder, polished falloff a single pass cannot.
     */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::resolveOverlays()
    private static resolveOverlays(assets: IArrowBarAssets, isMetallic: boolean): IVariableFxBarOverlay[]
    {
        if(isMetallic)
        {
            return [
                {blendMode: 'add', layer: assets.lighting},
                {blendMode: 'multiply', layer: assets.darkening},
                {blendMode: 'add', layer: assets.lighting},
                {blendMode: 'multiply', layer: assets.darkening}
            ];
        }

        return [
            {blendMode: 'multiply', layer: assets.darkening},
            {blendMode: 'add', layer: assets.lighting}
        ];
    }

    /**
     * Throws on a missing layer, as AS3 does. Kept: the bar's every measurement is derived from its
     * artwork, so carrying on would lay out a bar against something that is not there.
     */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::getLayer()
    private getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX arrow progress bar layer '${name}'.`);

        return layer;
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::resolveIconOverlayLayout()
    private static resolveIconOverlayLayout(
        context: VariableFxRendererContext,
        layout: IArrowBarLayout,
        icon: VariableFxConfiguredIcon | null
    ): VariableFxIconOverlayLayout
    {
        return VariableFxConfiguredIcon.resolveBarIconOverlayLayout(
            layout.width, layout.height, icon, VariableFxConfiguredIcon.resolveAlignment(context)
        );
    }

    /** The only layout in the family derived from a COUNT rather than from a width. */
    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::resolveLayout()
    private static resolveLayout(width: string, extra: OrderedMap | null): IArrowBarLayout
    {
        const arrowCount = ArrowProgressBarRenderer.resolveArrowProgressBarArrowCount(width, extra);
        const fillWidth = arrowCount * ArrowProgressBarRenderer.ARROW_WIDTH;

        return {
            arrowCount,
            fillHeight: ArrowProgressBarRenderer.FILL_HEIGHT,
            fillWidth,
            fillX: ArrowProgressBarRenderer.CHROME_EDGE_WIDTH,
            fillY: ArrowProgressBarRenderer.FILL_Y,
            height: ArrowProgressBarRenderer.FRAME_HEIGHT,
            sliceLeftWidth: ArrowProgressBarRenderer.CHROME_EDGE_WIDTH,
            sliceRightWidth: ArrowProgressBarRenderer.CHROME_EDGE_WIDTH,
            width: fillWidth + ArrowProgressBarRenderer.CHROME_EDGE_WIDTH * 2
        };
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::createTransparentBitmap()
    private static createTransparentBitmap(width: number, height: number): OffscreenCanvas
    {
        return new OffscreenCanvas(Math.max(1, width | 0), Math.max(1, height | 0));
    }

    // AS3: .../renderers/bar/ArrowProgressBarRenderer.as::dispose()
    override dispose(): void
    {
        super.dispose();

        this._barCache = null;
    }
}
