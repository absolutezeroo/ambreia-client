import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {BarVariableFxRendererBase} from './BarVariableFxRendererBase';
import {MaskedHeartFillFramePrebake, type IMaskedHeartFillAssets} from './MaskedHeartFillFramePrebake';

/**
 * A heart that fills left to right, with a darker line marking the fill's leading edge.
 *
 * The thinnest renderer in the family, because it does almost nothing itself: every frame it could
 * ever draw is memoised by {@link MaskedHeartFillFramePrebake}, so rendering is one lookup and one
 * blit. The interesting work is in the prebake.
 *
 * It is also the only renderer that picks DIFFERENT shading artwork for a metallic colour rather
 * than applying the normal shading twice — a heart is too small for a repeated pass to read, so
 * there are dedicated metallic darkening and lighting layers instead.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/MaskedHeartFillRenderer.as
 */
export class MaskedHeartFillRenderer extends BarVariableFxRendererBase
{
    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::MASKED_HEART_FILL_ASSETS
    private static readonly MASKED_HEART_FILL_ASSETS = {
        background: 'variablefx_masked_heart_fill_background',
        bar: 'variablefx_masked_heart_fill_bar',
        darkening: 'variablefx_masked_heart_fill_darkening',
        darkeningMetallic: 'variablefx_masked_heart_fill_darkening_metallic',
        endPointer: 'variablefx_masked_heart_fill_end_pointer',
        lighting: 'variablefx_masked_heart_fill_lighting',
        lightingMetallic: 'variablefx_masked_heart_fill_lighting_metallic',
        mask: 'variablefx_masked_heart_fill_mask',
        metallic: 'variablefx_masked_heart_fill_metallic'
    };

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::_prebake (name derived)
    private _prebake: MaskedHeartFillFramePrebake;

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::MaskedHeartFillRenderer()
    constructor(context: VariableFxRendererContext)
    {
        super(context);

        this._prebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => this.createPrebake(context)
        ) as MaskedHeartFillFramePrebake;
    }

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::get frameWidth()
    protected override get frameWidth(): number
    {
        return this._prebake.frameWidth;
    }

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::get frameHeight()
    protected override get frameHeight(): number
    {
        return this._prebake.frameHeight;
    }

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::get progressPixelWidth()
    protected override get progressPixelWidth(): number
    {
        return this._prebake.progressPixelWidth;
    }

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::createFrameBitmap()
    protected override createFrameBitmap(width: number, height: number): OffscreenCanvas | null
    {
        if(width <= 0 || height <= 0) return null;

        return new OffscreenCanvas(width, height);
    }

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::renderFrame()
    protected override renderFrame(_time: number): void
    {
        const target = this.mutableFrame.bitmapData;

        if(target === null) return;

        const composer = new VariableFxBitmapComposer(target);
        const frame = this._prebake.getOrCreateFrame(this.displayedFillArgb, this.calculateFilledPixelWidth());

        if(frame !== null) composer.drawLayer(frame, 0, 0, 'normal', 255);
    }

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::createPrebake()
    private createPrebake(context: VariableFxRendererContext): MaskedHeartFillFramePrebake
    {
        const paintColor = VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra);

        return new MaskedHeartFillFramePrebake(this.resolveAssets(context, paintColor.isMetallic));
    }

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::resolveAssets()
    private resolveAssets(context: VariableFxRendererContext, isMetallic: boolean): IMaskedHeartFillAssets
    {
        const names = MaskedHeartFillRenderer.MASKED_HEART_FILL_ASSETS;
        const darkening = this.getLayer(context, isMetallic ? names.darkeningMetallic : names.darkening);
        const lighting = this.getLayer(context, isMetallic ? names.lightingMetallic : names.lighting);

        return {
            background: this.getLayer(context, names.background),
            bar: this.getLayer(context, names.bar),
            endPointer: this.getLayer(context, names.endPointer),
            mask: this.getLayer(context, names.mask),
            metallic: isMetallic ? this.getLayer(context, names.metallic) : null,
            overlays: [
                {blendMode: 'multiply', layer: darkening},
                {blendMode: 'add', layer: lighting}
            ]
        };
    }

    // AS3: .../renderers/bar/MaskedHeartFillRenderer.as::getLayer()
    private getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX masked heart fill layer '${name}'.`);

        return layer;
    }
}
