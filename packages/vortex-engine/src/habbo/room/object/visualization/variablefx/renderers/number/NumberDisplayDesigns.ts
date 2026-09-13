/** Where one glyph sits in its sheet, and how wide it is. Heights come from the design. */
export interface INumberDisplayDigit
{
    sourceX: number;
    value: string;
    width: number;
}

/** What the base renderer needs from any design: metrics and a glyph table. */
export interface INumberDisplayDesign
{
    design: string;
    digitHeight: number;
    digitSpacing: number;
    iconContentYOffsetPx: number;
    iconOverlapPx: number;
    digits: INumberDisplayDigit[];
}

/**
 * The layer names a recolourable design composites its sheet from.
 *
 * AS3 simply omits the keys a design does not use; written as explicit `null`s here, per the port's
 * no-`undefined` rule, so "this design has no ruled lines" and "someone mistyped the key" are
 * different things.
 */
export interface INumberDisplayLayers
{
    numbers: string;
    numberLines: string | null;
    darkening: string | null;
    lighting: string | null;
}

/** A design whose sheet is grey and gets tinted — one sheet, every colour. */
export interface IRecolorableNumberDisplayDesign extends INumberDisplayDesign
{
    layers: INumberDisplayLayers;
}

/** A design whose sheet already carries its colours, one row per colour. */
export interface IBakedColorNumberDisplayDesign extends INumberDisplayDesign
{
    colorRows: Record<string, number>;
}

/**
 * The three number designs, as data.
 *
 * Every glyph's position and width is written out by hand here rather than measured from the
 * artwork, because the sheets are proportional: `1` is 9px wide in `blocky` where every other digit
 * is 13, and `freeze_style` runs a NEGATIVE spacing of -4 so its glyphs overlap. Nothing about that
 * is recoverable from a PNG.
 *
 * The split between the two lookups is the split between the two renderers: a recolourable design
 * names grey layers to tint, a baked-colour one names rows to slice out of a sheet that is already
 * coloured. A design belongs to exactly one of the two.
 *
 * Named for what it holds: the AS3 class is `_SafeCls_4578` and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/number/_SafeCls_4578.as
 */
export class NumberDisplayDesigns
{
    // AS3: .../renderers/number/_SafeCls_4578.as::getRecolorableDesign()
    static getRecolorableDesign(design: string | null): IRecolorableNumberDisplayDesign | null
    {
        switch(design)
        {
            case 'blocky':
                return {
                    design: 'blocky',
                    digitHeight: 22,
                    digitSpacing: 3,
                    iconContentYOffsetPx: 0,
                    iconOverlapPx: -6,
                    digits: [
                        NumberDisplayDesigns.digit('0', 0, 13),
                        NumberDisplayDesigns.digit('1', 14, 9),
                        NumberDisplayDesigns.digit('2', 24, 13),
                        NumberDisplayDesigns.digit('3', 38, 13),
                        NumberDisplayDesigns.digit('4', 52, 13),
                        NumberDisplayDesigns.digit('5', 66, 13),
                        NumberDisplayDesigns.digit('6', 80, 13),
                        NumberDisplayDesigns.digit('7', 94, 13),
                        NumberDisplayDesigns.digit('8', 108, 13),
                        NumberDisplayDesigns.digit('9', 122, 13),
                        NumberDisplayDesigns.digit('-', 136, 13)
                    ],
                    layers: {
                        numbers: 'variablefx_number_blocky_numbers',
                        numberLines: null,
                        darkening: 'variablefx_number_blocky_darkening',
                        lighting: 'variablefx_number_blocky_lighting'
                    }
                };

            case 'shalimar':
                return {
                    design: 'shalimar',
                    digitHeight: 23,
                    digitSpacing: 3,
                    iconContentYOffsetPx: 0,
                    iconOverlapPx: -6,
                    digits: [
                        NumberDisplayDesigns.digit('0', 0, 17),
                        NumberDisplayDesigns.digit('1', 18, 17),
                        NumberDisplayDesigns.digit('2', 36, 17),
                        NumberDisplayDesigns.digit('3', 54, 17),
                        NumberDisplayDesigns.digit('4', 72, 17),
                        NumberDisplayDesigns.digit('5', 90, 17),
                        NumberDisplayDesigns.digit('6', 108, 17),
                        NumberDisplayDesigns.digit('7', 126, 17),
                        NumberDisplayDesigns.digit('8', 144, 17),
                        NumberDisplayDesigns.digit('9', 162, 17),
                        NumberDisplayDesigns.digit('-', 180, 17)
                    ],
                    layers: {
                        numbers: 'variablefx_number_shalimar_numbers',
                        numberLines: 'variablefx_number_shalimar_number_lines',
                        darkening: 'variablefx_number_shalimar_darkening',
                        lighting: 'variablefx_number_shalimar_lighting'
                    }
                };

            default:
                return null;
        }
    }

    /** One design, and the rows are 22px apart in a 109px sheet — five colours plus the glyph height. */
    // AS3: .../renderers/number/_SafeCls_4578.as::getBakedColorDesign()
    static getBakedColorDesign(design: string | null): IBakedColorNumberDisplayDesign | null
    {
        if(design !== 'freeze_style') return null;

        return {
            design: 'freeze_style',
            digitHeight: 21,
            digitSpacing: -4,
            iconContentYOffsetPx: 0,
            iconOverlapPx: -1,
            digits: [
                NumberDisplayDesigns.digit('0', 0, 16),
                NumberDisplayDesigns.digit('1', 17, 13),
                NumberDisplayDesigns.digit('2', 31, 16),
                NumberDisplayDesigns.digit('3', 48, 16),
                NumberDisplayDesigns.digit('4', 65, 16),
                NumberDisplayDesigns.digit('5', 82, 16),
                NumberDisplayDesigns.digit('6', 99, 16),
                NumberDisplayDesigns.digit('7', 116, 16),
                NumberDisplayDesigns.digit('8', 133, 16),
                NumberDisplayDesigns.digit('9', 150, 16),
                NumberDisplayDesigns.digit('-', 167, 16)
            ],
            colorRows: {
                RED: 0,
                GREEN: 22,
                BLUE: 44,
                YELLOW: 66,
                WHITE: 88
            }
        };
    }

    // AS3: .../renderers/number/_SafeCls_4578.as::digit()
    private static digit(value: string, sourceX: number, width: number): INumberDisplayDigit
    {
        return {sourceX, value, width};
    }
}
