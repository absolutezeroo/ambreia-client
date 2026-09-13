import type {OrderedMap} from '@core/utils/OrderedMap';
import type {VariableFxRendererContext} from '../VariableFxRendererContext';
import type {VariableFxDrawable} from './VariableFxBitmapComposer';
import type {VariableFxIconDefinition} from './VariableFxIconDefinition';
import {VariableFxIconMetadata} from './VariableFxIconMetadata';
import {VariableFxIconOverlayLayout} from './VariableFxIconOverlayLayout';

/**
 * The icon a config asked for, once its artwork has been fetched — or null when it asked for none.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/rendering/VariableFxConfiguredIcon.as
 */
export class VariableFxConfiguredIcon
{
    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::ICON_CONFIG_EXTRA_KEY
    static readonly ICON_CONFIG_EXTRA_KEY: string = 'icon';

    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::ICON_ALIGNMENT_CONFIG_EXTRA_KEY
    static readonly ICON_ALIGNMENT_CONFIG_EXTRA_KEY: string = 'icon_alignment';

    /** How far the icon sits ON the bar rather than beside it. */
    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::BAR_ICON_OVERLAP_PX
    static readonly BAR_ICON_OVERLAP_PX: number = 5;

    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::BAR_ICON_CONTENT_Y_OFFSET_PX
    static readonly BAR_ICON_CONTENT_Y_OFFSET_PX: number = 2;

    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::bitmapData
    bitmapData: VariableFxDrawable;

    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::definition
    definition: VariableFxIconDefinition;

    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::VariableFxConfiguredIcon()
    constructor(bitmapData: VariableFxDrawable, definition: VariableFxIconDefinition)
    {
        this.bitmapData = bitmapData;
        this.definition = definition;
    }

    /**
     * Null when the config names no icon — that is the ordinary case, not a failure.
     *
     * A config that DOES name one and whose artwork is missing throws, as AS3 does: the frame is
     * sized around the icon, so carrying on would lay the bar out for art that is not there.
     */
    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::resolve()
    static resolve(context: VariableFxRendererContext): VariableFxConfiguredIcon | null
    {
        const name = VariableFxConfiguredIcon.readExtra(context.config.extra, VariableFxConfiguredIcon.ICON_CONFIG_EXTRA_KEY);

        if(name === null || name.length === 0) return null;

        const definition = VariableFxIconMetadata.resolve(context.assetProvider, name);
        const bitmap = context.assetProvider === null ? null : context.assetProvider.getBitmapData(definition.assetName);

        if(bitmap === null) throw new Error(`Missing Variable FX icon layer '${definition.assetName}'.`);

        return new VariableFxConfiguredIcon(bitmap, definition);
    }

    /** Anything but `right` or `double` is `left`, including an absent value. */
    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::resolveAlignment()
    static resolveAlignment(context: VariableFxRendererContext): string
    {
        const alignment = VariableFxConfiguredIcon.readExtra(
            context.config.extra,
            VariableFxConfiguredIcon.ICON_ALIGNMENT_CONFIG_EXTRA_KEY
        );

        switch(alignment)
        {
            case 'right':
            case 'double':
                return alignment;
            default:
                return 'left';
        }
    }

    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::resolveBarIconOverlayLayout()
    static resolveBarIconOverlayLayout(
        contentWidth: number,
        contentHeight: number,
        icon: VariableFxConfiguredIcon | null,
        alignment: string = 'left',
        contentYOffsetPx: number = VariableFxConfiguredIcon.BAR_ICON_CONTENT_Y_OFFSET_PX
    ): VariableFxIconOverlayLayout
    {
        return VariableFxIconOverlayLayout.resolve({
            alignment,
            contentHeight,
            contentWidth,
            contentYOffsetPx,
            iconHeight: icon === null ? 0 : icon.bitmapData.height,
            iconOffsetX: icon === null ? 0 : icon.definition.offsetX,
            iconOffsetY: icon === null ? 0 : icon.definition.offsetY,
            iconWidth: icon === null ? 0 : icon.bitmapData.width,
            overlapPx: VariableFxConfiguredIcon.BAR_ICON_OVERLAP_PX
        });
    }

    // AS3: .../variablefx/rendering/VariableFxConfiguredIcon.as::readExtra()
    private static readExtra(extra: OrderedMap | null, key: string): string | null
    {
        if(extra === null) return null;

        const value = extra.getValue(key);

        if(value === null || value === undefined) return null;

        return String(value).trim();
    }
}
