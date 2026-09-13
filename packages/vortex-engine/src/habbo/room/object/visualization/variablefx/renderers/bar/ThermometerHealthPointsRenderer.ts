import type {OrderedMap} from '@core/utils/OrderedMap';
import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxGenericRendererPrebake} from '../../VariableFxGenericRendererPrebake';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {VariableFxSegmentedProgress} from '../../VariableFxSegmentedProgress';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxClipRect} from '../../rendering/VariableFxClipRect';
import {BarVariableFxRendererBase} from './BarVariableFxRendererBase';
import {VariableFxBarSliceUtils} from './VariableFxBarSliceUtils';
import type {IVariableFxBarLayout} from './IVariableFxBarLayout';

/** The six layers a thermometer is built from. None of them is tinted. */
interface IThermometerAssets
{
    background: VariableFxDrawable;
    darkening: VariableFxDrawable;
    fill: VariableFxDrawable;
    lighting: VariableFxDrawable;
    splitters: VariableFxDrawable;
    top: VariableFxDrawable;
}

/** What `createPrebake()` stores on the config, and the constructor reads back. */
interface IThermometerPrebake
{
    backgroundPrebake: OffscreenCanvas;
    barPrebake: OffscreenCanvas;
    darkeningPrebake: OffscreenCanvas;
    layout: IVariableFxBarLayout;
    splittersPrebake: OffscreenCanvas;
}

/**
 * The health-point thermometer: a notched track that fills left to right in fixed 5px segments.
 *
 * It is the ONLY renderer in the family that ignores the config's colour entirely. Nothing here is
 * tinted, no paint colour is resolved, and there is no dynamic cache — the fill's colour is one
 * pixel of the `fill` artwork, tiled. That is also why the whole thing bakes ONCE per config and
 * never recomposites: a frame is four `drawLayer` calls onto four prebaked bitmaps, and the only
 * thing that moves between frames is the clip on the second one.
 *
 * Like the arrow bar it is segmented, so `extra.segments` overrides the size's default count and the
 * frame is sized by that count: 5px per segment, two 2px edges, and one pixel of slack on the right
 * that the last splitter would otherwise sit on.
 *
 * The shading is unusual in two ways. The lighting is a single source PIXEL tiled into a 1px line
 * along the top of the fill — not a layer — and the darkening is drawn over the whole track, filled
 * or not, so the empty part of the bar is shaded exactly like the full part.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/ThermometerHealthPointsRenderer.as
 */
export class ThermometerHealthPointsRenderer extends BarVariableFxRendererBase
{
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::FRAME_EDGE_WIDTH
    private static readonly FRAME_EDGE_WIDTH: number = 3;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::DARKENING_SLICE_WIDTH
    private static readonly DARKENING_SLICE_WIDTH: number = 4;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::FILL_X
    private static readonly FILL_X: number = 2;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::FILL_Y
    private static readonly FILL_Y: number = 2;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::LIGHTING_INSET_X
    private static readonly LIGHTING_INSET_X: number = 3;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::LIGHTING_Y
    private static readonly LIGHTING_Y: number = 3;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::LIGHTING_SOURCE_X
    private static readonly LIGHTING_SOURCE_X: number = 3;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::LIGHTING_SOURCE_Y
    private static readonly LIGHTING_SOURCE_Y: number = 1;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::LIGHTING_SOURCE_WIDTH
    private static readonly LIGHTING_SOURCE_WIDTH: number = 1;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::LIGHTING_SOURCE_HEIGHT
    private static readonly LIGHTING_SOURCE_HEIGHT: number = 1;

    /** The pitch of one health point — the frame is this times the segment count. */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::SEGMENT_WIDTH (name derived)
    //   The AS3 constant is `_SafeStr_11462`, value 5; named for both its readers, the frame-width
    //   formula and the splitter run's step.
    private static readonly SEGMENT_WIDTH: number = 5;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::SPLITTER_WIDTH
    private static readonly SPLITTER_WIDTH: number = 2;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::SPLITTER_SOURCE_X (name derived)
    //   The AS3 constant is `_SafeStr_11001`, value 0 — where the splitter is cut out of its sheet.
    private static readonly SPLITTER_SOURCE_X: number = 0;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::SPLITTER_SOURCE_Y (name derived)
    //   The AS3 constant is `_SafeStr_11488`, value 2 — the sheet's top two rows are not the
    //   splitter.
    private static readonly SPLITTER_SOURCE_Y: number = 2;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::THERMOMETER_HEALTH_POINTS_ASSETS
    private static readonly THERMOMETER_HEALTH_POINTS_ASSETS = {
        background: 'variablefx_thermometer_health_points_background',
        darkening: 'variablefx_thermometer_health_points_darkening',
        fill: 'variablefx_thermometer_health_points_fill',
        lighting: 'variablefx_thermometer_health_points_lighting',
        splitters: 'variablefx_thermometer_health_points_splitters',
        top: 'variablefx_thermometer_health_points_top'
    };

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::_backgroundPrebake (name derived)
    private _backgroundPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::_barPrebake (name derived)
    private _barPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::_darkeningPrebake (name derived)
    private _darkeningPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::_layout
    private _layout: IVariableFxBarLayout;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::_splittersPrebake (name derived)
    private _splittersPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::ThermometerHealthPointsRenderer()
    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => this.createPrebake(context)
        ) as VariableFxGenericRendererPrebake;

        const data = prebake.data as IThermometerPrebake;

        this._backgroundPrebake = data.backgroundPrebake;
        this._barPrebake = data.barPrebake;
        this._darkeningPrebake = data.darkeningPrebake;
        this._layout = data.layout;
        this._splittersPrebake = data.splittersPrebake;
    }

    /** 5px per segment, the two edges, and one pixel of right-hand slack. */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::resolveThermometerHealthPointsFrameWidth()
    static resolveThermometerHealthPointsFrameWidth(width: string, extra: OrderedMap | null = null): number
    {
        const segments = ThermometerHealthPointsRenderer.resolveThermometerHealthPointsSegmentCount(width, extra);

        return segments * ThermometerHealthPointsRenderer.SEGMENT_WIDTH
            + ThermometerHealthPointsRenderer.FILL_X * 2
            + 1;
    }

    /** The configured count, or the size name's default when `extra.segments` says nothing usable. */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::resolveThermometerHealthPointsSegmentCount()
    static resolveThermometerHealthPointsSegmentCount(width: string, extra: OrderedMap | null = null): number
    {
        return VariableFxSegmentedProgress.resolveSegmentCount(
            width, extra, ThermometerHealthPointsRenderer.resolveDefaultThermometerHealthPointsSegmentCount
        );
    }

    /** The five configured sizes. An unknown name is `medium`, not an error. */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::resolveDefaultThermometerHealthPointsSegmentCount()
    private static resolveDefaultThermometerHealthPointsSegmentCount(width: string): number
    {
        switch(width)
        {
            case 'extra_small': return 4;
            case 'small': return 6;
            case 'medium': return 9;
            case 'large': return 12;
            case 'extra_large': return 15;
            default: return 9;
        }
    }

    /** No icon layout here — the frame IS the bar, nothing hangs off either end. */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::get frameWidth()
    protected override get frameWidth(): number
    {
        return this._layout.width;
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::get frameHeight()
    protected override get frameHeight(): number
    {
        return this._layout.height;
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::get progressPixelWidth()
    protected override get progressPixelWidth(): number
    {
        return this._layout.fillWidth;
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::createFrameBitmap()
    protected override createFrameBitmap(width: number, height: number): OffscreenCanvas | null
    {
        return ThermometerHealthPointsRenderer.createTransparentBitmap(width, height);
    }

    /**
     * Four blits onto four baked bitmaps, and the only thing that changes between frames is the
     * clip on the second.
     *
     * The darkening goes over the empty track too — it is the track's own shading, not the fill's.
     */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::renderFrame()
    protected override renderFrame(_time: number): void
    {
        const target = this.mutableFrame.bitmapData;

        if(target === null) return;

        const composer = new VariableFxBitmapComposer(target);
        const filled = this.calculateFilledPixelWidth();

        composer.drawLayer(this._backgroundPrebake, 0, 0, 'normal', 255);

        if(filled > 0)
        {
            composer.drawLayer(
                this._barPrebake, 0, 0, 'normal', 255,
                ThermometerHealthPointsRenderer.createFillClipFor(filled, this._layout)
            );
        }

        composer.drawLayer(this._darkeningPrebake, 0, 0, 'multiply', 255);
        composer.drawLayer(this._splittersPrebake, 0, 0, 'normal', 255);
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::createPrebake()
    private createPrebake(context: VariableFxRendererContext): VariableFxGenericRendererPrebake
    {
        const assets = this.resolveAssets(context);
        const layout = ThermometerHealthPointsRenderer.resolveLayout(
            context.config.width, context.config.extra, assets.background
        );

        const backgroundPrebake = ThermometerHealthPointsRenderer.createTransparentBitmap(layout.width, layout.height);
        const barPrebake = ThermometerHealthPointsRenderer.createTransparentBitmap(layout.width, layout.height);
        const darkeningPrebake = ThermometerHealthPointsRenderer.createTransparentBitmap(layout.width, layout.height);
        const splittersPrebake = ThermometerHealthPointsRenderer.createTransparentBitmap(layout.width, layout.height);

        ThermometerHealthPointsRenderer.prebakeBackground(backgroundPrebake, assets, layout);
        ThermometerHealthPointsRenderer.prebakeBar(barPrebake, assets, layout);
        ThermometerHealthPointsRenderer.prebakeDarkening(darkeningPrebake, assets, layout);
        ThermometerHealthPointsRenderer.prebakeSplitters(splittersPrebake, assets, layout);

        const data: IThermometerPrebake = {
            backgroundPrebake, barPrebake, darkeningPrebake, layout, splittersPrebake
        };

        // AS3 disposes four BitmapData here. An OffscreenCanvas is collected once unreferenced, so
        // the callback has nothing to do — kept as the hook the prebake contract asks for.
        return new VariableFxGenericRendererPrebake(data, null);
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::prebakeBackground()
    private static prebakeBackground(
        target: OffscreenCanvas,
        assets: IThermometerAssets,
        layout: IVariableFxBarLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawThreeSlice(
            assets.background,
            VariableFxBarSliceUtils.resolveBackgroundSliceLeftWidth(layout),
            VariableFxBarSliceUtils.resolveBackgroundSliceRightWidth(layout),
            layout.width,
            0,
            0,
            'normal',
            255
        );
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::prebakeBar()
    private static prebakeBar(target: OffscreenCanvas, assets: IThermometerAssets, layout: IVariableFxBarLayout): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        ThermometerHealthPointsRenderer.drawFill(composer, assets.fill, layout.fillWidth, layout);
        ThermometerHealthPointsRenderer.drawLighting(composer, assets.lighting, layout.fillWidth, layout);
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::prebakeDarkening()
    private static prebakeDarkening(
        target: OffscreenCanvas,
        assets: IThermometerAssets,
        layout: IVariableFxBarLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        ThermometerHealthPointsRenderer.drawFullTrackLayer(composer, assets.darkening, 'normal', layout);
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::prebakeSplitters()
    private static prebakeSplitters(
        target: OffscreenCanvas,
        assets: IThermometerAssets,
        layout: IVariableFxBarLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        ThermometerHealthPointsRenderer.drawTopPixels(composer, assets.top, layout);
        ThermometerHealthPointsRenderer.drawSplitters(composer, assets.splitters, layout);
    }

    /**
     * The fill is ONE PIXEL of artwork tiled across the whole fillable area.
     *
     * Not a stretch and not a nine-slice: the top-left pixel of `fill` is the bar's colour, and
     * everything else about the fill comes from the shading passes over it.
     */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::drawFill()
    private static drawFill(
        composer: VariableFxBitmapComposer,
        fill: VariableFxDrawable,
        width: number,
        layout: IVariableFxBarLayout
    ): void
    {
        if(width <= 0 || fill.width <= 0 || fill.height <= 0) return;

        composer.drawTiledChunk(
            fill, new VariableFxClipRect(0, 0, 1, 1),
            layout.fillX, layout.fillY, width, layout.fillHeight, 'normal', 255
        );
    }

    /** Drawn at the track's full width whatever the fill is doing — it shades the track, not the fill. */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::drawFullTrackLayer()
    private static drawFullTrackLayer(
        composer: VariableFxBitmapComposer,
        layer: VariableFxDrawable,
        blendMode: string,
        layout: IVariableFxBarLayout
    ): void
    {
        composer.drawThreeSlice(
            layer,
            ThermometerHealthPointsRenderer.DARKENING_SLICE_WIDTH,
            ThermometerHealthPointsRenderer.DARKENING_SLICE_WIDTH,
            layout.fillWidth, layout.fillX, layout.fillY, blendMode, 255
        );
    }

    /**
     * The 1px highlight along the top of the fill — again one source pixel, tiled into a line.
     *
     * It is inset by 3px at BOTH ends (hence the doubled inset in the length), so the highlight
     * stops short of the rounded corners instead of running into them.
     */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::drawLighting()
    private static drawLighting(
        composer: VariableFxBitmapComposer,
        lighting: VariableFxDrawable,
        width: number,
        layout: IVariableFxBarLayout
    ): void
    {
        const inset = ThermometerHealthPointsRenderer.LIGHTING_INSET_X;
        const length = Math.min(width - inset, layout.fillWidth - inset * 2);

        if(length <= 0
            || lighting.width < ThermometerHealthPointsRenderer.LIGHTING_SOURCE_X + ThermometerHealthPointsRenderer.LIGHTING_SOURCE_WIDTH
            || lighting.height < ThermometerHealthPointsRenderer.LIGHTING_SOURCE_Y + ThermometerHealthPointsRenderer.LIGHTING_SOURCE_HEIGHT)
        {
            return;
        }

        composer.drawTiledChunk(
            lighting,
            new VariableFxClipRect(
                ThermometerHealthPointsRenderer.LIGHTING_SOURCE_X,
                ThermometerHealthPointsRenderer.LIGHTING_SOURCE_Y,
                ThermometerHealthPointsRenderer.LIGHTING_SOURCE_WIDTH,
                ThermometerHealthPointsRenderer.LIGHTING_SOURCE_HEIGHT
            ),
            layout.fillX + inset, ThermometerHealthPointsRenderer.LIGHTING_Y,
            length, ThermometerHealthPointsRenderer.LIGHTING_SOURCE_HEIGHT, 'add', 255
        );
    }

    /**
     * The track's four corner pixels, copied one at a time out of the `top` sheet.
     *
     * The source inset is the frame's own inset — the corner pixel of the artwork sits exactly where
     * the fill starts, so `FILL_X`/`FILL_Y` locate it in the sheet as well as on the frame. AS3
     * inlines both values, so this is the reading the geometry supports, not a distinct constant.
     */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::drawTopPixels()
    private static drawTopPixels(
        composer: VariableFxBitmapComposer,
        top: VariableFxDrawable,
        layout: IVariableFxBarLayout
    ): void
    {
        const sourceLeftX = Math.min(ThermometerHealthPointsRenderer.FILL_X, top.width - 1);
        const sourceRightX = Math.max(0, top.width - ThermometerHealthPointsRenderer.FILL_X - 1);
        const sourceTopY = Math.min(ThermometerHealthPointsRenderer.FILL_Y, top.height - 1);
        const sourceBottomY = Math.max(0, top.height - ThermometerHealthPointsRenderer.FILL_Y - 1);
        const targetLeftX = layout.fillX;
        const targetRightX = layout.width - layout.fillX - 1;
        const targetTopY = layout.fillY;
        const targetBottomY = layout.fillY + layout.fillHeight - 1;

        ThermometerHealthPointsRenderer.drawSingleSourcePixel(composer, top, sourceLeftX, sourceTopY, targetLeftX, targetTopY);
        ThermometerHealthPointsRenderer.drawSingleSourcePixel(composer, top, sourceLeftX, sourceBottomY, targetLeftX, targetBottomY);
        ThermometerHealthPointsRenderer.drawSingleSourcePixel(composer, top, sourceRightX, sourceTopY, targetRightX, targetTopY);
        ThermometerHealthPointsRenderer.drawSingleSourcePixel(composer, top, sourceRightX, sourceBottomY, targetRightX, targetBottomY);
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::drawSingleSourcePixel()
    private static drawSingleSourcePixel(
        composer: VariableFxBitmapComposer,
        source: VariableFxDrawable,
        sourceX: number,
        sourceY: number,
        targetX: number,
        targetY: number
    ): void
    {
        composer.drawTiledChunk(
            source, new VariableFxClipRect(sourceX, sourceY, 1, 1), targetX, targetY, 1, 1, 'normal', 255
        );
    }

    /**
     * The notches between health points — every 5px, and never on the last one.
     *
     * The run stops at `fillWidth - SEGMENT_WIDTH - 1` rather than at the end, which is what the
     * frame's one pixel of right-hand slack is for: a splitter there would sit on the border.
     */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::drawSplitters()
    private static drawSplitters(
        composer: VariableFxBitmapComposer,
        splitters: VariableFxDrawable,
        layout: IVariableFxBarLayout
    ): void
    {
        const sourceHeight = Math.min(layout.fillHeight, splitters.height - ThermometerHealthPointsRenderer.SPLITTER_SOURCE_Y);
        const sourceWidth = Math.min(ThermometerHealthPointsRenderer.SPLITTER_WIDTH, splitters.width - ThermometerHealthPointsRenderer.SPLITTER_SOURCE_X);
        const clip = ThermometerHealthPointsRenderer.createFillClipFor(layout.fillWidth, layout);

        if(sourceWidth <= 0 || sourceHeight <= 0) return;

        const last = layout.fillWidth - ThermometerHealthPointsRenderer.SEGMENT_WIDTH - 1;

        for(let offset = ThermometerHealthPointsRenderer.SEGMENT_WIDTH;
            offset <= last;
            offset += ThermometerHealthPointsRenderer.SEGMENT_WIDTH)
        {
            composer.drawTiledChunk(
                splitters,
                new VariableFxClipRect(
                    ThermometerHealthPointsRenderer.SPLITTER_SOURCE_X,
                    ThermometerHealthPointsRenderer.SPLITTER_SOURCE_Y,
                    sourceWidth,
                    sourceHeight
                ),
                layout.fillX + offset, layout.fillY, sourceWidth, layout.fillHeight, 'normal', 255, clip
            );
        }
    }

    /** Clips a layer to the filled part of the bar — this is what makes the bar a bar. */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::createFillClip()
    private static createFillClipFor(width: number, layout: IVariableFxBarLayout): VariableFxClipRect
    {
        return new VariableFxClipRect(layout.fillX, layout.fillY, width, layout.fillHeight);
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::resolveAssets()
    private resolveAssets(context: VariableFxRendererContext): IThermometerAssets
    {
        const names = ThermometerHealthPointsRenderer.THERMOMETER_HEALTH_POINTS_ASSETS;

        return {
            background: this.getLayer(context, names.background),
            darkening: this.getLayer(context, names.darkening),
            fill: this.getLayer(context, names.fill),
            lighting: this.getLayer(context, names.lighting),
            splitters: this.getLayer(context, names.splitters),
            top: this.getLayer(context, names.top)
        };
    }

    /**
     * Throws on a missing layer, as AS3 does. Kept: the bar's height comes from its background's,
     * so carrying on would lay out a bar against artwork that is not there.
     */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::getLayer()
    private getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX thermometer health points layer '${name}'.`);

        return layer;
    }

    /** Width from the segment count, height from the background artwork. */
    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::resolveLayout()
    private static resolveLayout(
        width: string,
        extra: OrderedMap | null,
        background: VariableFxDrawable
    ): IVariableFxBarLayout
    {
        const frameWidth = ThermometerHealthPointsRenderer.resolveThermometerHealthPointsFrameWidth(width, extra);

        return {
            fillHeight: Math.max(1, background.height - ThermometerHealthPointsRenderer.FILL_Y * 2),
            fillWidth: Math.max(0, frameWidth - ThermometerHealthPointsRenderer.FILL_X * 2),
            fillX: ThermometerHealthPointsRenderer.FILL_X,
            fillY: ThermometerHealthPointsRenderer.FILL_Y,
            height: background.height,
            sliceLeftWidth: ThermometerHealthPointsRenderer.FRAME_EDGE_WIDTH,
            sliceRightWidth: ThermometerHealthPointsRenderer.FRAME_EDGE_WIDTH,
            width: frameWidth
        };
    }

    // AS3: .../renderers/bar/ThermometerHealthPointsRenderer.as::createTransparentBitmap()
    private static createTransparentBitmap(width: number, height: number): OffscreenCanvas
    {
        return new OffscreenCanvas(Math.max(1, width | 0), Math.max(1, height | 0));
    }
}
