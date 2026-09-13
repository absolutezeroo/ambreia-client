import type {IVariableFxBarLayout} from './IVariableFxBarLayout';

/**
 * The nine-slice widths for a bar's BACKGROUND, which are not the same as the fill's.
 *
 * The background has to keep its own border AND the inset the fill sits in — so its left cap is the
 * fill's inset plus the border, and its right cap is whatever the fill does not cover plus the
 * border. Using the fill's slice widths for it stretches the border into a smear.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/VariableFxBarSliceUtils.as
 */
export class VariableFxBarSliceUtils
{
    // AS3: .../renderers/bar/VariableFxBarSliceUtils.as::resolveBackgroundSliceLeftWidth()
    static resolveBackgroundSliceLeftWidth(layout: IVariableFxBarLayout): number
    {
        return Math.max(0, layout.fillX + layout.sliceLeftWidth);
    }

    // AS3: .../renderers/bar/VariableFxBarSliceUtils.as::resolveBackgroundSliceRightWidth()
    static resolveBackgroundSliceRightWidth(layout: IVariableFxBarLayout): number
    {
        const uncovered = layout.width - layout.fillX - layout.fillWidth;

        return Math.max(0, uncovered + layout.sliceRightWidth);
    }
}
