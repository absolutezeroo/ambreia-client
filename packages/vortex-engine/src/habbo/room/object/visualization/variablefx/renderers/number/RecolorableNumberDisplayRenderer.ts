import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import {VariableFxRendererPrebakeCache} from '../../VariableFxRendererPrebakeCache';
import type {VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {NumberDisplayDesigns, type INumberDisplayDigit, type IRecolorableNumberDisplayDesign} from './NumberDisplayDesigns';
import {NumberDisplayRendererBase} from './NumberDisplayRendererBase';
import {
    RecolorableNumberDisplayColorPrebake,
    type IRecolorableNumberDisplayLayers
} from './RecolorableNumberDisplayColorPrebake';

/**
 * A number whose glyph sheet is grey and gets tinted to the config's colour.
 *
 * Two designs use it, `blocky` and `shalimar`, and the design is named by the config's `design`
 * extra rather than by the renderer key — an unknown one throws, because there is no sensible
 * default sheet to fall back to.
 *
 * Its per-frame work is nothing: the sheet is recoloured once per colour by the prebake, shared
 * across every object on the same config, and drawing a digit is one region blit out of it. The
 * only thing the renderer tracks is whether the colour has moved.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/number/RecolorableNumberDisplayRenderer.as
 */
export class RecolorableNumberDisplayRenderer extends NumberDisplayRendererBase
{
    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::_paintRgb (name derived)
    //   `_SafeStr_7138`: the colour the sheet is tinted to.
    private _paintRgb: number;

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::_renderedPaintRgb (name derived)
    //   `_SafeStr_8943`: null until the first frame, which is what forces it.
    private _renderedPaintRgb: number | null = null;

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::_colorPrebake (name derived)
    private _colorPrebake: RecolorableNumberDisplayColorPrebake;

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::RecolorableNumberDisplayRenderer()
    constructor(context: VariableFxRendererContext)
    {
        const design = RecolorableNumberDisplayRenderer.resolveDesign(context);

        super(context, design);

        this._colorPrebake = VariableFxRendererPrebakeCache.getOrCreate(
            context.config,
            () => RecolorableNumberDisplayRenderer.createPrebake(context, design)
        ) as RecolorableNumberDisplayColorPrebake;
        this._paintRgb = RecolorableNumberDisplayRenderer.resolvePaintRgb(context);
    }

    /** Throws on an unknown design: there is no default sheet, so carrying on would draw nothing. */
    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::resolveDesign()
    private static resolveDesign(context: VariableFxRendererContext): IRecolorableNumberDisplayDesign
    {
        const name = VariableFxPaintColor.readExtra(context.config.extra, 'design');
        const design = NumberDisplayDesigns.getRecolorableDesign(name);

        if(design === null)
        {
            throw new Error(`Unknown recolorable Variable FX number display design '${name === null ? '' : name}'.`);
        }

        return design;
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::drawDigit()
    protected override drawDigit(digit: INumberDisplayDigit, x: number, y: number): void
    {
        const sheet = this._colorPrebake.getOrCreateNumbersPrebake(this._paintRgb);

        if(sheet === null) return;

        this.composer.drawSourceRegion(sheet, digit.sourceX, 0, digit.width, this.digitHeight, x, y, 'normal', 255);
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::resolveBitmapDataClassLayer()
    protected override resolveBitmapDataClassLayer(): VariableFxDrawable | null
    {
        return this._colorPrebake.baseNumbers;
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::updateRendererData()
    protected override updateRendererData(context: VariableFxRendererContext, _time: number): void
    {
        this._paintRgb = RecolorableNumberDisplayRenderer.resolvePaintRgb(context);
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::needsRendererUpdate()
    protected override needsRendererUpdate(): boolean
    {
        return this._renderedPaintRgb === null || this._renderedPaintRgb !== this._paintRgb;
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::didRenderFrame()
    protected override didRenderFrame(): void
    {
        this._renderedPaintRgb = this._paintRgb;
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::createPrebake()
    private static createPrebake(
        context: VariableFxRendererContext,
        design: IRecolorableNumberDisplayDesign
    ): RecolorableNumberDisplayColorPrebake
    {
        return new RecolorableNumberDisplayColorPrebake(
            RecolorableNumberDisplayRenderer.resolveLayers(context, design)
        );
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::resolveLayers()
    private static resolveLayers(
        context: VariableFxRendererContext,
        design: IRecolorableNumberDisplayDesign
    ): IRecolorableNumberDisplayLayers
    {
        const layers = design.layers;

        return {
            darkening: RecolorableNumberDisplayRenderer.getOptionalLayer(context, layers.darkening),
            lighting: RecolorableNumberDisplayRenderer.getOptionalLayer(context, layers.lighting),
            numberLines: RecolorableNumberDisplayRenderer.getOptionalLayer(context, layers.numberLines),
            numbers: RecolorableNumberDisplayRenderer.getLayer(context, layers.numbers)
        };
    }

    /** A design that does not name a layer simply has none — that is not a missing asset. */
    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::getOptionalLayer()
    private static getOptionalLayer(
        context: VariableFxRendererContext,
        name: string | null
    ): VariableFxDrawable | null
    {
        return name === null ? null : RecolorableNumberDisplayRenderer.getLayer(context, name);
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::getLayer()
    private static getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX number display layer '${name}'.`);

        return layer;
    }

    /**
     * A team colour is resolved against the STATUS — that is where the delegated colour arrives —
     * and everything else against the config. Progress is passed as 0 either way: a number display
     * has no red-to-green band to sit on.
     */
    // AS3: .../renderers/number/RecolorableNumberDisplayRenderer.as::resolvePaintRgb()
    private static resolvePaintRgb(context: VariableFxRendererContext): number
    {
        if(VariableFxPaintColor.resolve(context.config.color).typeName === VariableFxPaintColor.DYNAMIC_TEAM_COLOR)
        {
            return VariableFxPaintColor.resolveTargetPaintColor(
                context.config.color, context.config.extra, 0, context.status.extra
            ).rgb;
        }

        return VariableFxPaintColor.resolvePaintColor(context.config.color, context.config.extra).rgb;
    }
}
