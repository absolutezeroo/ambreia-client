import {ClassicProgressBarRenderer} from './ClassicProgressBarRenderer';
import type {IVariableFxBarAssetNames} from './IVariableFxBarLayout';

/**
 * The classic bar in its smaller artwork. Identical in every respect but the assets — the metrics,
 * the slices, the end cap and the sizes all come from the parent.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/ClassicMiniProgressBarRenderer.as
 */
export class ClassicMiniProgressBarRenderer extends ClassicProgressBarRenderer
{
    // AS3: .../renderers/bar/ClassicMiniProgressBarRenderer.as::CLASSIC_MINI_PROGRESS_BAR_ASSETS
    //   Name derived: the AS3 constant is `_SafeStr_10323`; named after the parent's.
    private static readonly CLASSIC_MINI_PROGRESS_BAR_ASSETS: IVariableFxBarAssetNames = {
        background: 'variablefx_classic_mini_bar_background',
        bar: 'variablefx_classic_mini_bar_fill',
        darkening: 'variablefx_classic_mini_bar_darkening',
        lighting: 'variablefx_classic_mini_bar_lighting',
        metallic: 'variablefx_classic_mini_bar_metallic'
    };

    // AS3: .../renderers/bar/ClassicMiniProgressBarRenderer.as::get assetNames()
    protected override get assetNames(): IVariableFxBarAssetNames
    {
        return ClassicMiniProgressBarRenderer.CLASSIC_MINI_PROGRESS_BAR_ASSETS;
    }

    // AS3: .../renderers/bar/ClassicMiniProgressBarRenderer.as::get layerDescription()
    protected override get layerDescription(): string
    {
        return 'classic mini progress bar';
    }
}
