import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {VariableFxPaintColor} from '../../VariableFxPaintColor';
import type {VariableFxDrawable} from '../../rendering/VariableFxBitmapComposer';
import {NumberDisplayDesigns, type IBakedColorNumberDisplayDesign, type INumberDisplayDigit} from './NumberDisplayDesigns';
import {NumberDisplayRendererBase} from './NumberDisplayRendererBase';

/**
 * A number whose glyph sheet already carries its colours, one row per colour.
 *
 * The opposite trade from {@link RecolorableNumberDisplayRenderer}: no tint, no prebake, no cache —
 * choosing a colour is choosing a source Y in a sheet the artist coloured. That buys exact control
 * over five palettes and costs the ability to use any other, so a config asking for a colour the
 * sheet has no row for silently gets `GREEN` rather than an error.
 *
 * `freeze_style` is the only design that works this way, and the only one with a NEGATIVE digit
 * spacing — its glyphs overlap by 4px, which is what makes the number read as one frozen block
 * rather than as separate digits.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/number/BakedColorNumberDisplayRenderer.as
 */
export class BakedColorNumberDisplayRenderer extends NumberDisplayRendererBase
{
    /** What a colour with no row of its own falls back to. */
    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::FALLBACK_COLOR_ROW (name derived)
    //   The AS3 constant is `_SafeStr_10980`, value "GREEN"; named for both its readers.
    private static readonly FALLBACK_COLOR_ROW: string = 'GREEN';

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::_bakedDesign (name derived)
    //   `_SafeStr_10452`: a SECOND reference to the same design object the base holds as
    //   `_SafeStr_6658` — kept separately in AS3 too, because a team colour has to re-read
    //   `colorRows`, which is the narrow type's field and not the base's.
    private _bakedDesign: IBakedColorNumberDisplayDesign;

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::_renderedSourceY (name derived)
    //   `_SafeStr_8857`: null until the first frame, which is what forces it.
    private _renderedSourceY: number | null = null;

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::_numbers
    private _numbers: VariableFxDrawable;

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::_sourceY (name derived)
    //   `_SafeStr_6719`: which colour row the glyphs are cut from.
    private _sourceY: number;

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::_usesDynamicTeamColor
    private _usesDynamicTeamColor: boolean;

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::BakedColorNumberDisplayRenderer()
    constructor(context: VariableFxRendererContext)
    {
        const design = BakedColorNumberDisplayRenderer.resolveDesign(context);

        super(context, design);

        this._bakedDesign = design;
        this._numbers = BakedColorNumberDisplayRenderer.getLayer(
            context, BakedColorNumberDisplayRenderer.resolveNumbersAssetName(design)
        );
        this._usesDynamicTeamColor = VariableFxPaintColor.resolve(context.config.color).typeName
            === VariableFxPaintColor.DYNAMIC_TEAM_COLOR;
        this._sourceY = BakedColorNumberDisplayRenderer.resolveSourceY(context, design);
    }

    /** Throws on an unknown design: there is no default sheet, so carrying on would draw nothing. */
    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::resolveDesign()
    private static resolveDesign(context: VariableFxRendererContext): IBakedColorNumberDisplayDesign
    {
        const name = VariableFxPaintColor.readExtra(context.config.extra, 'design');
        const design = NumberDisplayDesigns.getBakedColorDesign(name);

        if(design === null)
        {
            throw new Error(`Unknown baked-color Variable FX number display design '${name === null ? '' : name}'.`);
        }

        return design;
    }

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::drawDigit()
    protected override drawDigit(digit: INumberDisplayDigit, x: number, y: number): void
    {
        this.composer.drawSourceRegion(
            this._numbers, digit.sourceX, this._sourceY, digit.width, this.digitHeight, x, y, 'normal', 255
        );
    }

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::resolveBitmapDataClassLayer()
    protected override resolveBitmapDataClassLayer(): VariableFxDrawable | null
    {
        return this._numbers;
    }

    /** Only a team colour can change under us — a static one picked its row in the constructor. */
    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::updateRendererData()
    protected override updateRendererData(context: VariableFxRendererContext, _time: number): void
    {
        if(this._usesDynamicTeamColor)
        {
            this._sourceY = BakedColorNumberDisplayRenderer.resolveSourceY(context, this._bakedDesign);
        }
    }

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::needsRendererUpdate()
    protected override needsRendererUpdate(): boolean
    {
        return this._renderedSourceY === null || this._renderedSourceY !== this._sourceY;
    }

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::didRenderFrame()
    protected override didRenderFrame(): void
    {
        this._renderedSourceY = this._sourceY;
    }

    /**
     * The colour's NAME is the row key, not its RGB — so `RED` finds row 0 and `GOLD`, which the
     * sheet has no row for, falls through to `GREEN`.
     */
    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::resolveSourceY()
    private static resolveSourceY(
        context: VariableFxRendererContext,
        design: IBakedColorNumberDisplayDesign
    ): number
    {
        const typeName = VariableFxPaintColor.resolve(context.config.color).typeName;
        const rowName = typeName === VariableFxPaintColor.DYNAMIC_TEAM_COLOR
            ? BakedColorNumberDisplayRenderer.resolveDelegatedSourceColor(context, design)
            : typeName;

        const row = design.colorRows[rowName] ?? design.colorRows[BakedColorNumberDisplayRenderer.FALLBACK_COLOR_ROW];

        return row ?? 0;
    }

    /**
     * A team colour arrives as an RGB on the status, and the sheet is indexed by name — so the RGB
     * is matched back against the palette to recover which of the five rows it is.
     *
     * No match, or no colour at all, gives `WHITE` when the design has that row: a team whose
     * colour is not one of the five reads as neutral rather than as another team's.
     */
    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::resolveDelegatedSourceColor()
    private static resolveDelegatedSourceColor(
        context: VariableFxRendererContext,
        design: IBakedColorNumberDisplayDesign
    ): string
    {
        const delegated = VariableFxPaintColor.parseRgbColor(
            VariableFxPaintColor.readExtra(context.status.extra, 'delegated_color')
        );

        if(delegated !== null)
        {
            for(const name of Object.keys(design.colorRows))
            {
                if(VariableFxPaintColor.resolve(name).rgb === delegated) return name;
            }
        }

        return design.colorRows.WHITE !== undefined
            ? 'WHITE'
            : BakedColorNumberDisplayRenderer.FALLBACK_COLOR_ROW;
    }

    /** The sheet's name is the design's, by convention — there is no explicit `layers` entry. */
    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::resolveNumbersAssetName()
    private static resolveNumbersAssetName(design: IBakedColorNumberDisplayDesign): string
    {
        return `variablefx_number_${design.design}_numbers`;
    }

    // AS3: .../renderers/number/BakedColorNumberDisplayRenderer.as::getLayer()
    private static getLayer(context: VariableFxRendererContext, name: string): VariableFxDrawable
    {
        const layer = context.assetProvider === null ? null : context.assetProvider.getBitmapData(name);

        if(layer === null) throw new Error(`Missing Variable FX number display layer '${name}'.`);

        return layer;
    }
}
