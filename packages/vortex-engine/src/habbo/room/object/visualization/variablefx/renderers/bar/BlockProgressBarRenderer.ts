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

/** The block bar's layout: a normal bar layout plus how many blocks and how wide the splitters are. */
interface IBlockBarLayout extends IVariableFxBarLayout
{
    blockCount: number;
    blockWidth: number;
    splitterWidth: number;
}

interface IBlockBarAssets
{
    background: VariableFxDrawable;
    bar: VariableFxDrawable;
    metallic: VariableFxDrawable | null;
    overlays: IVariableFxBarOverlay[];
    splitters: VariableFxDrawable;
}

interface IBlockBarPrebake
{
    assets: IBlockBarAssets;
    backgroundPrebake: OffscreenCanvas;
    barPrebake: OffscreenCanvas | null;
    foregroundPrebake: OffscreenCanvas;
    iconLayout: VariableFxIconOverlayLayout;
    layout: IBlockBarLayout;
}

/**
 * A bar drawn as discrete blocks: 7px cells separated by 1px splitters.
 *
 * The blocks are NOT drawn one at a time. The fill is a continuous tiled strip, and the splitters
 * are a separate layer composited over it afterwards — so a partly-filled block is clipped
 * mid-cell, which is what lets the bar animate smoothly while still reading as discrete. That is
 * also why this renderer has a FOREGROUND prebake where the classic bar has none: the splitters and
 * the icon have to land on top of the fill, not under it.
 *
 * The block count comes from the size name, or from a `segments` extra that overrides it.
 *
 * Unlike the classic family this extends the base directly — nothing about a blocked bar is a
 * variation of a nine-sliced one.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/BlockProgressBarRenderer.as
 */
export class BlockProgressBarRenderer extends BarVariableFxRendererBase
{
    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::BLOCK_WIDTH
    private static readonly BLOCK_WIDTH: number = 7;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::SPLITTER_WIDTH
    private static readonly SPLITTER_WIDTH: number = 1;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::CHROME_EDGE_WIDTH
    private static readonly CHROME_EDGE_WIDTH: number = 3;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::FRAME_HEIGHT
    private static readonly FRAME_HEIGHT: number = 13;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::FILL_Y
    private static readonly FILL_Y: number = 3;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::FILL_HEIGHT
    private static readonly FILL_HEIGHT: number = 7;

    /** One block plus its splitter — the tile the fill repeats on. */
    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::BLOCK_CHUNK_WIDTH
    private static readonly BLOCK_CHUNK_WIDTH: number = 8;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::BLOCK_PROGRESS_BAR_ASSETS
    private static readonly BLOCK_PROGRESS_BAR_ASSETS = {
        background: 'variablefx_block_bar_background',
        bar: 'variablefx_block_bar_fill',
        darkening: 'variablefx_block_bar_darkening',
        lighting: 'variablefx_block_bar_lighting',
        metallic: 'variablefx_block_bar_metallic',
        splitters: 'variablefx_block_bar_splitters'
    };

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::_assets
    private _assets: IBlockBarAssets;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::_backgroundPrebake (name derived)
    private _backgroundPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::_barCache
    private _barCache: OffscreenCanvas | null = null;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::_cachedBarArgb (name derived)
    private _cachedBarArgb: number = -1;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::_barPrebake (name derived)
    private _barPrebake: OffscreenCanvas | null;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::_foregroundPrebake (name derived)
    private _foregroundPrebake: OffscreenCanvas;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::_iconLayout
    private _iconLayout: VariableFxIconOverlayLayout;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::_layout
    private _layout: IBlockBarLayout;

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::BlockProgressBarRenderer()
    constructor(context: VariableFxRendererContext)
    {
        super(context);

        const prebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => this.createPrebake(context)
        ) as VariableFxGenericRendererPrebake;

        const data = prebake.data as IBlockBarPrebake;

        this._assets = data.assets;
        this._backgroundPrebake = data.backgroundPrebake;
        this._barPrebake = data.barPrebake;
        this._foregroundPrebake = data.foregroundPrebake;
        this._iconLayout = data.iconLayout;
        this._layout = data.layout;

        if(this._barPrebake === null)
        {
            this._barCache = BlockProgressBarRenderer.createTransparentBitmap(
                this._iconLayout.frameWidth, this._iconLayout.frameHeight
            );
        }
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::resolveBlockProgressBarBlockCount()
    static resolveBlockProgressBarBlockCount(width: string, extra: OrderedMap | null): number
    {
        return VariableFxSegmentedProgress.resolveSegmentCount(
            width, extra, BlockProgressBarRenderer.resolveDefaultBlockProgressBarBlockCount
        );
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::resolveDefaultBlockProgressBarBlockCount()
    private static resolveDefaultBlockProgressBarBlockCount(width: string): number
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

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::get frameWidth()
    protected override get frameWidth(): number
    {
        return this._iconLayout.frameWidth;
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::get frameHeight()
    protected override get frameHeight(): number
    {
        return this._iconLayout.frameHeight;
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::get progressPixelWidth()
    protected override get progressPixelWidth(): number
    {
        return this._layout.fillWidth;
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::createFrameBitmap()
    protected override createFrameBitmap(width: number, height: number): OffscreenCanvas | null
    {
        return BlockProgressBarRenderer.createTransparentBitmap(width, height);
    }

    /** Background, fill clipped to the filled width, then splitters and icon ON TOP. */
    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::renderFrame()
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

            if(bar !== null) composer.drawLayer(bar, 0, 0, 'normal', 255, this.resolveProgressClip(filled));
        }

        composer.drawLayer(this._foregroundPrebake, 0, 0, 'normal', 255);
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::createPrebake()
    private createPrebake(context: VariableFxRendererContext): VariableFxGenericRendererPrebake
    {
        const layout = this.resolveLayout(context.config.width, context.config.extra);
        const assets = this.resolveAssets(context);
        const icon = VariableFxConfiguredIcon.resolve(context);
        const iconLayout = this.resolveIconOverlayLayout(context, layout, icon);
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const isDynamicPaint = VariableFxPaintColor.isDynamicPaintColor(context.config.color);

        const backgroundPrebake = BlockProgressBarRenderer.createTransparentBitmap(iconLayout.frameWidth, iconLayout.frameHeight);
        const foregroundPrebake = BlockProgressBarRenderer.createTransparentBitmap(iconLayout.frameWidth, iconLayout.frameHeight);
        const barPrebake = isDynamicPaint
            ? null
            : BlockProgressBarRenderer.createTransparentBitmap(iconLayout.frameWidth, iconLayout.frameHeight);

        this.prebakeBackground(backgroundPrebake, assets, layout, iconLayout);
        this.prebakeForeground(foregroundPrebake, assets, layout, iconLayout, icon);

        if(barPrebake !== null)
        {
            this.drawBarBitmap(barPrebake, (0xFF000000 | paintColor.rgb) >>> 0, assets, layout, iconLayout);
        }

        const data: IBlockBarPrebake = {assets, backgroundPrebake, barPrebake, foregroundPrebake, iconLayout, layout};

        return new VariableFxGenericRendererPrebake(data, null);
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::prebakeBackground()
    private prebakeBackground(
        target: OffscreenCanvas,
        assets: IBlockBarAssets,
        layout: IBlockBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        composer.drawThreeSlice(
            assets.background,
            VariableFxBarSliceUtils.resolveBackgroundSliceLeftWidth(layout),
            VariableFxBarSliceUtils.resolveBackgroundSliceRightWidth(layout),
            layout.width, iconLayout.contentX, iconLayout.contentY, 'normal', 255
        );
    }

    /** The layer that goes over the fill: the splitters that cut it into blocks, then the icon. */
    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::prebakeForeground()
    private prebakeForeground(
        target: OffscreenCanvas,
        assets: IBlockBarAssets,
        layout: IBlockBarLayout,
        iconLayout: VariableFxIconOverlayLayout,
        icon: VariableFxConfiguredIcon | null
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);

        composer.clear(0);
        this.drawSplitters(composer, assets.splitters, iconLayout.contentX, iconLayout.contentY, layout);

        if(icon !== null)
        {
            composer.drawLayer(icon.bitmapData, iconLayout.iconX, iconLayout.iconY, 'normal', 255);
        }
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::resolveBarPrebakeOrCache()
    private resolveBarPrebakeOrCache(): OffscreenCanvas | null
    {
        if(this._barPrebake !== null) return this._barPrebake;

        if(this._cachedBarArgb !== this.displayedFillArgb && this._barCache !== null)
        {
            this._cachedBarArgb = this.displayedFillArgb;
            this.drawBarBitmap(this._barCache, this.displayedFillArgb, this._assets, this._layout, this._iconLayout);
        }

        return this._barCache;
    }

    /**
     * A flat rectangle of the paint colour, then the block artwork MULTIPLIED over it — the reverse
     * of the classic bar, which tints its artwork instead. Here the artwork is the texture and the
     * colour is underneath it.
     */
    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::drawBarBitmap()
    private drawBarBitmap(
        target: OffscreenCanvas,
        argb: number,
        assets: IBlockBarAssets,
        layout: IBlockBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): void
    {
        const composer = new VariableFxBitmapComposer(target);
        const contentX = iconLayout.contentX;
        const contentY = iconLayout.contentY;
        const clip = BlockProgressBarRenderer.resolveProgressClipFor(layout.fillWidth, layout, iconLayout);

        composer.clear(0);
        composer.fillRect(contentX + layout.fillX, contentY + layout.fillY, layout.fillWidth, layout.fillHeight, argb);

        this.drawRepeatedFillLayer(composer, assets.bar, 'multiply', contentX, contentY, clip, layout);

        if(assets.metallic !== null)
        {
            this.drawRepeatedFillLayer(composer, assets.metallic, 'normal', contentX, contentY, clip, layout);
        }

        for(const overlay of assets.overlays)
        {
            this.drawRepeatedFillLayer(composer, overlay.layer, overlay.blendMode, contentX, contentY, clip, layout);
        }
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::drawRepeatedFillLayer()
    private drawRepeatedFillLayer(
        composer: VariableFxBitmapComposer,
        layer: VariableFxDrawable,
        blendMode: string,
        contentX: number,
        contentY: number,
        clip: VariableFxClipRect,
        layout: IBlockBarLayout
    ): void
    {
        if(clip.width <= 0) return;

        composer.drawTiledChunk(
            layer,
            new VariableFxClipRect(0, 0, BlockProgressBarRenderer.BLOCK_CHUNK_WIDTH, layout.fillHeight),
            contentX + layout.fillX, contentY + layout.fillY,
            layout.fillWidth, layout.fillHeight, blendMode, 255, clip
        );
    }

    /**
     * One splitter after each block INCLUDING the last, which falls just outside the fill and is
     * therefore clipped away — the loop runs to `blockCount`, not `blockCount - 1`.
     */
    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::drawSplitters()
    private drawSplitters(
        composer: VariableFxBitmapComposer,
        splitters: VariableFxDrawable,
        contentX: number,
        contentY: number,
        layout: IBlockBarLayout
    ): void
    {
        for(let block = 1; block <= layout.blockCount; block += 1)
        {
            const x = contentX + layout.fillX + block * BlockProgressBarRenderer.BLOCK_CHUNK_WIDTH - layout.splitterWidth;

            composer.drawTiledChunk(
                splitters,
                new VariableFxClipRect(0, layout.fillY, layout.splitterWidth, layout.fillHeight),
                x, contentY + layout.fillY,
                layout.splitterWidth, layout.fillHeight, 'normal', 255
            );
        }
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::resolveProgressClip()
    private resolveProgressClip(width: number): VariableFxClipRect
    {
        return BlockProgressBarRenderer.resolveProgressClipFor(width, this._layout, this._iconLayout);
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::resolveProgressClip()
    private static resolveProgressClipFor(
        width: number,
        layout: IBlockBarLayout,
        iconLayout: VariableFxIconOverlayLayout
    ): VariableFxClipRect
    {
        return new VariableFxClipRect(
            iconLayout.contentX + layout.fillX,
            iconLayout.contentY + layout.fillY,
            width,
            layout.fillHeight
        );
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::resolveAssets()
    private resolveAssets(context: VariableFxRendererContext): IBlockBarAssets
    {
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);
        const isMetallic = paintColor.isMetallic;
        const names = BlockProgressBarRenderer.BLOCK_PROGRESS_BAR_ASSETS;
        const darkening = this.getLayer(context, names.darkening);
        const lighting = this.getLayer(context, names.lighting);

        return {
            background: this.getLayer(context, names.background),
            bar: this.getLayer(context, names.bar),
            metallic: isMetallic ? this.getLayer(context, names.metallic) : null,
            overlays: isMetallic
                ? [
                    {blendMode: 'add', layer: lighting},
                    {blendMode: 'multiply', layer: darkening},
                    {blendMode: 'add', layer: lighting},
                    {blendMode: 'multiply', layer: darkening}
                ]
                : [
                    {blendMode: 'multiply', layer: darkening},
                    {blendMode: 'add', layer: lighting}
                ],
            splitters: this.getLayer(context, names.splitters)
        };
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::getLayer()
    private getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX block progress bar layer '${name}'.`);

        return layer;
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::resolveIconOverlayLayout()
    private resolveIconOverlayLayout(
        context: VariableFxRendererContext,
        layout: IBlockBarLayout,
        icon: VariableFxConfiguredIcon | null
    ): VariableFxIconOverlayLayout
    {
        return VariableFxConfiguredIcon.resolveBarIconOverlayLayout(
            layout.width, layout.height, icon, VariableFxConfiguredIcon.resolveAlignment(context)
        );
    }

    /**
     * Every measurement is derived from the block count — this bar's width is a consequence of how
     * many blocks it has, not a configured size.
     */
    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::resolveLayout()
    private resolveLayout(width: string, extra: OrderedMap | null): IBlockBarLayout
    {
        const blockCount = BlockProgressBarRenderer.resolveBlockProgressBarBlockCount(width, extra);
        const fillWidth = blockCount * BlockProgressBarRenderer.BLOCK_WIDTH
            + (blockCount - 1) * BlockProgressBarRenderer.SPLITTER_WIDTH;

        return {
            blockCount,
            blockWidth: BlockProgressBarRenderer.BLOCK_WIDTH,
            fillHeight: BlockProgressBarRenderer.FILL_HEIGHT,
            fillWidth,
            fillX: BlockProgressBarRenderer.CHROME_EDGE_WIDTH,
            fillY: BlockProgressBarRenderer.FILL_Y,
            height: BlockProgressBarRenderer.FRAME_HEIGHT,
            sliceLeftWidth: BlockProgressBarRenderer.CHROME_EDGE_WIDTH,
            sliceRightWidth: BlockProgressBarRenderer.CHROME_EDGE_WIDTH,
            splitterWidth: BlockProgressBarRenderer.SPLITTER_WIDTH,
            width: fillWidth + BlockProgressBarRenderer.CHROME_EDGE_WIDTH * 2
        };
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::createTransparentBitmap()
    private static createTransparentBitmap(width: number, height: number): OffscreenCanvas
    {
        return new OffscreenCanvas(Math.max(1, width | 0), Math.max(1, height | 0));
    }

    // AS3: .../renderers/bar/BlockProgressBarRenderer.as::dispose()
    override dispose(): void
    {
        super.dispose();

        this._barCache = null;
    }
}
