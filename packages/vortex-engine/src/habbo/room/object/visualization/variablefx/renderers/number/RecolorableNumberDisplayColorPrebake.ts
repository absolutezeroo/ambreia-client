import type {IVariableFxRendererPrebake} from '../../IVariableFxRendererPrebake';
import {VariableFxBitmapComposer, type VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxColorTransform} from '../../rendering/VariableFxColorTransform';

/** The resolved artwork behind a recolourable design. Only `numbers` is required. */
export interface IRecolorableNumberDisplayLayers
{
    numbers: VariableFxDrawable;
    numberLines: VariableFxDrawable | null;
    darkening: VariableFxDrawable | null;
    lighting: VariableFxDrawable | null;
}

/**
 * One finished glyph sheet per colour, kept for as long as the config lives.
 *
 * The whole sheet is recoloured at once rather than each glyph as it is drawn — which is the point,
 * since a four-digit number would otherwise pay for the tint four times per frame and the sheet is
 * only ~200px wide. What comes back is a sheet the renderer slices with a plain `drawSourceRegion`.
 *
 * The tint is a multiply against the RGB, not a fill: the grey artwork carries the shading and the
 * colour scales it, so a dark pixel stays dark. The optional layers on top of it are the design's
 * own detailing — `shalimar` has ruled lines its sheet does not — and are applied AFTER the tint so
 * they keep their own colour.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/number/RecolorableNumberDisplayColorPrebake.as
 */
export class RecolorableNumberDisplayColorPrebake implements IVariableFxRendererPrebake
{
    /** The untinted sheet, exposed for `resolveBitmapDataClassLayer()`. */
    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::baseNumbers (name derived)
    //   `_SafeStr_8051`: the raw `numbers` layer, handed straight back.
    baseNumbers: VariableFxDrawable | null;

    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::_layers
    private _layers: IRecolorableNumberDisplayLayers | null;

    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::_sheets (name derived)
    //   `_SafeStr_6624`: the tinted sheets, by RGB.
    private _sheets: Map<number, OffscreenCanvas> = new Map();

    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::RecolorableNumberDisplayColorPrebake()
    constructor(layers: IRecolorableNumberDisplayLayers)
    {
        this._layers = layers;
        this.baseNumbers = layers.numbers;
    }

    /** Keyed on RGB only — the alpha a caller passes in is masked off before the lookup. */
    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::getOrCreateNumbersPrebake()
    getOrCreateNumbersPrebake(argb: number): OffscreenCanvas | null
    {
        if(this._layers === null) return null;

        const rgb = argb & 0xFFFFFF;
        const cached = this._sheets.get(rgb);

        if(cached !== undefined) return cached;

        const sheet = this.createNumbersPrebake(rgb);

        this._sheets.set(rgb, sheet);

        return sheet;
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::createNumbersPrebake()
    private createNumbersPrebake(rgb: number): OffscreenCanvas
    {
        const layers = this._layers;
        const source = layers === null ? null : layers.numbers;
        const sheet = new OffscreenCanvas(
            Math.max(1, source === null ? 1 : source.width),
            Math.max(1, source === null ? 1 : source.height)
        );
        const composer = new VariableFxBitmapComposer(sheet);

        composer.clear(0);

        if(layers === null || source === null) return sheet;

        composer.drawSourceRegion(
            source, 0, 0, source.width, source.height, 0, 0, 'normal', 255, null,
            RecolorableNumberDisplayColorPrebake.createBaseColorTransformFromRgb(rgb)
        );

        RecolorableNumberDisplayColorPrebake.drawOptionalPrebakeLayer(composer, layers.numberLines, 'normal');
        RecolorableNumberDisplayColorPrebake.drawOptionalPrebakeLayer(composer, layers.darkening, 'multiply');
        RecolorableNumberDisplayColorPrebake.drawOptionalPrebakeLayer(composer, layers.lighting, 'add');

        return sheet;
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::drawOptionalPrebakeLayer()
    private static drawOptionalPrebakeLayer(
        composer: VariableFxBitmapComposer,
        layer: VariableFxDrawable | null,
        blendMode: string
    ): void
    {
        if(layer !== null) composer.drawLayer(layer, 0, 0, blendMode, 255);
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::createBaseColorTransformFromRgb()
    private static createBaseColorTransformFromRgb(rgb: number): VariableFxColorTransform
    {
        return new VariableFxColorTransform(
            ((rgb >>> 16) & 0xFF) / 255,
            ((rgb >>> 8) & 0xFF) / 255,
            (rgb & 0xFF) / 255,
            1
        );
    }

    // AS3: .../renderers/number/RecolorableNumberDisplayColorPrebake.as::dispose()
    dispose(): void
    {
        this._sheets = new Map();
        this._layers = null;
        this.baseNumbers = null;
    }
}
