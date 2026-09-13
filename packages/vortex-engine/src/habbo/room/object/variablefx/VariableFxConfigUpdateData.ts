import {OrderedMap} from '@core/utils/OrderedMap';

/**
 * One VariableFx *configuration* as the server sends it — the recipe for an effect, not an
 * instance of one. `isUserFx` decides which half of the room it applies to: true routes it to the
 * avatar logic store, false to the furniture one.
 *
 * Every VariableFx class exists only in `AIR-1.0.31`; no WIN63 or PRODUCTION build has the feature.
 * This one's own name and most of its members are readable there. Three fields are obfuscated, and
 * all three are **recovered from readable call sites** rather than derived — each says where at its
 * declaration. Getting that wrong is easy and silent: the first pass here called two of them
 * unread, and both are read.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/variablefx/VariableFxConfigUpdateData.as
 */
export class VariableFxConfigUpdateData
{
    // AS3: .../variablefx/VariableFxConfigUpdateData.as::configId
    configId: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::isUserFx
    isUserFx: boolean;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::showMode
    showMode: number;

    /**
     * A 4-bit mask, not a mode. `MovingObjectLogic` arms an effect's visibility window only when
     * `(visibilityMask & trigger) != 0`.
     */
    // AS3: .../variablefx/VariableFxConfigUpdateData.as::visibilityMask
    //   Name RECOVERED, not derived: the AS3 field is `_SafeStr_5289`, and
    //   `VariableFxVisibilitySettingsPreset` both writes it from and reads it back into its own
    //   readable `.mask` property, clamping it to 0..15.
    visibilityMask: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::showOnMouseHover
    showOnMouseHover: boolean;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::showDuration
    showDuration: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::categoryId
    categoryId: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::styleId
    //   Name RECOVERED: the AS3 field is `_SafeStr_5449`, and `RoomObjectVisualizationFactory`
    //   passes it as the second argument of `getByCategoryAndStyleId(categoryId, …)`, whose result
    //   it reads `.serverStyle` off.
    styleId: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::colorId
    colorId: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::widthId
    //   Name RECOVERED: the AS3 field is `_SafeStr_5624`, passed to `resolveWidthById(…)` and
    //   compared against `resolveWidthId("medium")`; the wired editor drives it from
    //   `widthOptions`/`defaultWidth`.
    widthId: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::rendererId
    //   Indexes `variablefx_renderer_mapping` (renderers_xml), which maps it to a renderer class.
    rendererId: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::defaultMinValue
    defaultMinValue: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::defaultMaxValue
    defaultMaxValue: number;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::extra
    extra: OrderedMap;

    // AS3: .../variablefx/VariableFxConfigUpdateData.as::VariableFxConfigUpdateData()
    constructor(
        configId: number,
        isUserFx: boolean,
        showMode: number,
        visibilityMask: number,
        showOnMouseHover: boolean,
        showDuration: number,
        categoryId: number,
        styleId: number,
        colorId: number,
        widthId: number,
        rendererId: number,
        defaultMinValue: number,
        defaultMaxValue: number,
        extra: OrderedMap | null
    )
    {
        this.configId = configId;
        this.isUserFx = isUserFx;
        this.showMode = showMode;
        this.visibilityMask = visibilityMask;
        this.showOnMouseHover = showOnMouseHover;
        this.showDuration = showDuration;
        this.categoryId = categoryId;
        this.styleId = styleId;
        this.colorId = colorId;
        this.widthId = widthId;
        this.rendererId = rendererId;
        this.defaultMinValue = defaultMinValue;
        this.defaultMaxValue = defaultMaxValue;
        this.extra = extra ?? new OrderedMap();
    }
}
