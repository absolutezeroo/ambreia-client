import type {VariableFxBitmapComposer} from '../../rendering/VariableFxBitmapComposer';
import {VariableFxConfiguredIcon} from '../../rendering/VariableFxConfiguredIcon';
import type {VariableFxIconOverlayLayout} from '../../rendering/VariableFxIconOverlayLayout';
import type {VariableFxRendererContext} from '../../VariableFxRendererContext';
import {ClassicProgressBarRenderer} from './ClassicProgressBarRenderer';
import type {IVariableFxBarAssetNames, IVariableFxBarLayout} from './IVariableFxBarLayout';

/**
 * The big one: a heavy-bordered bar three to seven times the width of the others, for a boss fight.
 *
 * Its 4px border (against the classic's 1px) is the only structural difference; everything else is
 * scale. Two overrides earn their place: it is the only bar that draws EVERY icon placement rather
 * than just the first, so a `double` alignment really does put one at each end; and a non-left
 * alignment drops the 2px content nudge the classic bar applies, because at this size the icon
 * centres against the bar rather than sitting on its rim.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/renderers/bar/BossHealthBarRenderer.as
 */
export class BossHealthBarRenderer extends ClassicProgressBarRenderer
{
    // AS3: .../renderers/bar/BossHealthBarRenderer.as::BOSS_HEALTH_BAR_ASSETS
    private static readonly BOSS_HEALTH_BAR_ASSETS: IVariableFxBarAssetNames = {
        background: 'variablefx_boss_health_bar_background',
        bar: 'variablefx_boss_health_bar_fill',
        darkening: 'variablefx_boss_health_bar_darkening',
        lighting: 'variablefx_boss_health_bar_lighting',
        metallic: 'variablefx_boss_health_bar_metallic'
    };

    // AS3: .../renderers/bar/BossHealthBarRenderer.as::BOSS_LAYOUT_METRICS
    private static readonly BOSS_LAYOUT_METRICS = {
        fillX: 4,
        fillY: 4,
        sliceLeftWidth: 2,
        sliceRightWidth: 2
    };

    // AS3: .../renderers/bar/BossHealthBarRenderer.as::BOSS_OVERLAY_SLICE
    private static readonly BOSS_OVERLAY_SLICE = {leftWidth: 2, rightWidth: 2};

    // AS3: .../renderers/bar/BossHealthBarRenderer.as::get assetNames()
    protected override get assetNames(): IVariableFxBarAssetNames
    {
        return BossHealthBarRenderer.BOSS_HEALTH_BAR_ASSETS;
    }

    // AS3: .../renderers/bar/BossHealthBarRenderer.as::get baseLayoutMetrics()
    protected override get baseLayoutMetrics(): {fillX: number; fillY: number; sliceLeftWidth: number; sliceRightWidth: number}
    {
        return BossHealthBarRenderer.BOSS_LAYOUT_METRICS;
    }

    // AS3: .../renderers/bar/BossHealthBarRenderer.as::get layerDescription()
    protected override get layerDescription(): string
    {
        return 'boss health bar';
    }

    // AS3: .../renderers/bar/BossHealthBarRenderer.as::get overlaySlice()
    protected override get overlaySlice(): {leftWidth: number; rightWidth: number}
    {
        return BossHealthBarRenderer.BOSS_OVERLAY_SLICE;
    }

    /** Its own three sizes, none of which are the names the other bars use. */
    // AS3: .../renderers/bar/BossHealthBarRenderer.as::resolveFrameWidth()
    protected override resolveFrameWidth(width: string): number
    {
        switch(width)
        {
            case 'large': return 100;
            case 'extra_large': return 150;
            case 'big_mahoosive_chonky': return 200;
            default: return 150;
        }
    }

    // AS3: .../renderers/bar/BossHealthBarRenderer.as::resolveIconOverlayLayout()
    protected override resolveIconOverlayLayout(
        context: VariableFxRendererContext,
        layout: IVariableFxBarLayout,
        icon: VariableFxConfiguredIcon | null
    ): VariableFxIconOverlayLayout
    {
        const alignment = VariableFxConfiguredIcon.resolveAlignment(context);

        if(alignment === 'left') return super.resolveIconOverlayLayout(context, layout, icon);

        // No content nudge: at this size the icon centres against the bar rather than perching on
        // its rim, so the 2px the classic bar shifts by would misalign it.
        return VariableFxConfiguredIcon.resolveBarIconOverlayLayout(layout.width, layout.height, icon, alignment, 0);
    }

    /** Every placement, not just the first — this is the bar `double` alignment exists for. */
    // AS3: .../renderers/bar/BossHealthBarRenderer.as::drawIconOverlay()
    protected override drawIconOverlay(
        composer: VariableFxBitmapComposer,
        iconLayout: VariableFxIconOverlayLayout,
        icon: VariableFxConfiguredIcon | null
    ): void
    {
        if(icon === null) return;

        for(const placement of iconLayout.iconPlacements)
        {
            composer.drawLayer(icon.bitmapData, placement.x, placement.y, 'normal', 255);
        }
    }
}
