import {ClassicProgressBarRenderer} from './ClassicProgressBarRenderer';
import type {IVariableFxBarAssetNames} from './IVariableFxBarLayout';

/**
 * The health bar: a thinner, borderless variant whose end cap is drawn differently from every other
 * bar's.
 *
 * Three of its overrides are one decision. `barBodyIncludesEndWidth` false makes the body stop
 * short of the cap instead of running under it, and `usesSeparateBarEndOverlaySource` true then
 * re-shades that cap from its own source rather than reusing the body's — so the 1px cap keeps its
 * own highlight instead of inheriting a slice of the body's gradient, which at this size would read
 * as a smudge. The two paddings differing (0 for the cap, 1 for its base) is what offsets the two
 * by the one pixel that makes them line up.
 *
 * It also has no metallic artwork at all, so a metallic paint colour simply shades normally.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/HealthProgressBarRenderer.as
 */
export class HealthProgressBarRenderer extends ClassicProgressBarRenderer
{
    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::HEALTH_BAR_ASSETS
    //   Name derived: the AS3 constant is `_SafeStr_10220`.
    private static readonly HEALTH_BAR_ASSETS: IVariableFxBarAssetNames = {
        background: 'variablefx_health_bar_background',
        bar: 'variablefx_health_bar_fill',
        darkening: 'variablefx_health_bar_darkening',
        lighting: 'variablefx_health_bar_lighting',
        metallic: null
    };

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::HEALTH_OVERLAY_SLICE
    //   Name derived: the AS3 constant is `_SafeStr_9091`.
    private static readonly HEALTH_OVERLAY_SLICE = {leftWidth: 1, rightWidth: 1};

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get assetNames()
    protected override get assetNames(): IVariableFxBarAssetNames
    {
        return HealthProgressBarRenderer.HEALTH_BAR_ASSETS;
    }

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get layerDescription()
    protected override get layerDescription(): string
    {
        return 'health progress bar';
    }

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get overlaySlice()
    protected override get overlaySlice(): {leftWidth: number; rightWidth: number}
    {
        return HealthProgressBarRenderer.HEALTH_OVERLAY_SLICE;
    }

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get barEndWidthPx()
    protected override get barEndWidthPx(): number
    {
        return 1;
    }

    /** One pixel of fill is enough for a one-pixel cap, so it is never skipped. */
    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get barEndMinimumFillWidthPx()
    protected override get barEndMinimumFillWidthPx(): number
    {
        return 1;
    }

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get barBodyIncludesEndWidth()
    protected override get barBodyIncludesEndWidth(): boolean
    {
        return false;
    }

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get barEndSourceRightPaddingPx()
    protected override get barEndSourceRightPaddingPx(): number
    {
        return 0;
    }

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get barEndBaseSourceRightPaddingPx()
    protected override get barEndBaseSourceRightPaddingPx(): number
    {
        return 1;
    }

    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::get usesSeparateBarEndOverlaySource()
    protected override get usesSeparateBarEndOverlaySource(): boolean
    {
        return true;
    }

    /** Three sizes, not five — and `medium` is the fallback, as everywhere else. */
    // AS3: .../renderers/bar/HealthProgressBarRenderer.as::resolveFrameWidth()
    protected override resolveFrameWidth(width: string): number
    {
        switch(width)
        {
            case 'small': return 32;
            case 'medium': return 48;
            case 'large': return 64;
            default: return 48;
        }
    }
}
