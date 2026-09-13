import {OrderedMap} from '@core/utils/OrderedMap';
import type {IVariableFxRendererPrebake} from './IVariableFxRendererPrebake';

/**
 * The visualization's view of a config: how the effect should look, resolved from the ids the
 * server sent into the names the renderers speak.
 *
 * Distinct from `room/object/variablefx/VariableFxConfigUpdateData`, which is the wire form and
 * keeps the ids. `RoomObjectVisualizationFactory` is what turns one into the other.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxConfigData.as
 */
export class VariableFxConfigData
{
    // AS3: .../variablefx/VariableFxConfigData.as::category
    category: string;

    // AS3: .../variablefx/VariableFxConfigData.as::categoryId
    categoryId: number;

    // AS3: .../variablefx/VariableFxConfigData.as::style
    style: string;

    // AS3: .../variablefx/VariableFxConfigData.as::styleId
    //   Name recovered — see the wire-side VariableFxConfigUpdateData.styleId.
    styleId: number;

    // AS3: .../variablefx/VariableFxConfigData.as::renderer
    renderer: string;

    // AS3: .../variablefx/VariableFxConfigData.as::rendererId
    rendererId: number;

    // AS3: .../variablefx/VariableFxConfigData.as::width
    width: string;

    // AS3: .../variablefx/VariableFxConfigData.as::color
    color: string;

    // AS3: .../variablefx/VariableFxConfigData.as::defaultMinValue
    defaultMinValue: number;

    // AS3: .../variablefx/VariableFxConfigData.as::defaultMaxValue
    defaultMaxValue: number;

    // AS3: .../variablefx/VariableFxConfigData.as::extra
    extra: OrderedMap;

    /**
     * Artwork baked once for this config and shared by every effect using it. The visualizer holds
     * the instance it was built against and stops drawing when the config's has been replaced —
     * that identity comparison is the whole reason the field is here.
     */
    // AS3: .../variablefx/VariableFxConfigData.as::prebake
    //   Name derived: the AS3 field is `_SafeStr_6194`, typed `_SafeCls_4064`, an interface whose
    //   only member is dispose(). Named after the `*Prebake` classes that implement it.
    prebake: IVariableFxRendererPrebake | null = null;

    // AS3: .../variablefx/VariableFxConfigData.as::VariableFxConfigData()
    constructor(
        category: string,
        style: string,
        renderer: string,
        width: string,
        color: string,
        defaultMinValue: number,
        defaultMaxValue: number,
        extra: OrderedMap | null = null,
        categoryId: number = -1,
        styleId: number = -1,
        rendererId: number = -1
    )
    {
        this.category = category;
        this.categoryId = categoryId;
        this.style = style;
        this.styleId = styleId;
        this.renderer = renderer;
        this.rendererId = rendererId;
        this.width = width;
        this.color = color;
        this.defaultMinValue = defaultMinValue;
        this.defaultMaxValue = defaultMaxValue;
        this.extra = extra ?? new OrderedMap();
    }

    /**
     * A derived config for a renderer that draws a sub-part of this one — the level renderers do
     * this to put a progress bar inside themselves.
     *
     * Note what it does NOT carry over: the bounds are forced to 0..1, because the sub-renderer is
     * handed a progress, not the original value.
     */
    // AS3: .../variablefx/VariableFxConfigData.as::cloneForRenderer()
    cloneForRenderer(
        category: string,
        rendererAndStyle: string,
        rendererId: number,
        color: string,
        extra: OrderedMap | null = null
    ): VariableFxConfigData
    {
        return new VariableFxConfigData(
            category,
            rendererAndStyle,
            rendererAndStyle,
            this.width,
            color,
            0,
            1,
            extra ?? this.extra,
            this.categoryId,
            this.styleId,
            rendererId
        );
    }
}
