import {OrderedMap} from '@core/utils/OrderedMap';
import type {VariableFxOption} from './VariableFxOption';

/**
 * One style as the EDITOR sees it: what the user may choose, and what each choice defaults to.
 *
 * The three `has*Options` getters are what the UI hides sections by, and each asks a slightly
 * different question. Colours and widths are hidden when the style's own default is the
 * "not applicable" sentinel — a heart stack has no width to pick. Renderers are hidden when there
 * is only ONE, because a dropdown with a single entry is noise.
 *
 * Distinct from `VariableFxPreviewStyleDefinition`, which is the RUNTIME side of the same style:
 * that one says what to draw, this one says what may be configured.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/model/VariableFxStyleDefinition.as
 */
export class VariableFxStyleDefinition
{
    // AS3: .../model/VariableFxStyleDefinition.as::id
    id: number;

    // AS3: .../model/VariableFxStyleDefinition.as::localizationKey
    localizationKey: string;

    // AS3: .../model/VariableFxStyleDefinition.as::runtimeStyle
    runtimeStyle: string;

    // AS3: .../model/VariableFxStyleDefinition.as::colorOptions
    colorOptions: VariableFxOption[];

    // AS3: .../model/VariableFxStyleDefinition.as::widthOptions
    widthOptions: VariableFxOption[];

    // AS3: .../model/VariableFxStyleDefinition.as::rendererOptions
    rendererOptions: VariableFxOption[];

    // AS3: .../model/VariableFxStyleDefinition.as::defaultColor
    defaultColor: VariableFxOption;

    // AS3: .../model/VariableFxStyleDefinition.as::defaultWidth
    defaultWidth: VariableFxOption;

    // AS3: .../model/VariableFxStyleDefinition.as::defaultRenderer
    defaultRenderer: VariableFxOption;

    /** Config extras every effect of this style gets, before the editor's own additions. */
    // AS3: .../model/VariableFxStyleDefinition.as::extra
    extra: OrderedMap;

    // AS3: .../model/VariableFxStyleDefinition.as::defaultStatusExtra
    defaultStatusExtra: OrderedMap;

    // AS3: .../model/VariableFxStyleDefinition.as::supportsIcon
    supportsIcon: boolean;

    // AS3: .../model/VariableFxStyleDefinition.as::VariableFxStyleDefinition()
    constructor(
        id: number,
        localizationKey: string,
        runtimeStyle: string,
        colorOptions: VariableFxOption[] | null,
        widthOptions: VariableFxOption[] | null,
        rendererOptions: VariableFxOption[] | null,
        defaultColor: VariableFxOption,
        defaultWidth: VariableFxOption,
        defaultRenderer: VariableFxOption,
        extra: OrderedMap | null = null,
        defaultStatusExtra: OrderedMap | null = null,
        supportsIcon: boolean = false
    )
    {
        this.id = id;
        this.localizationKey = localizationKey;
        this.runtimeStyle = runtimeStyle;
        this.colorOptions = colorOptions ?? [];
        this.widthOptions = widthOptions ?? [];
        this.rendererOptions = rendererOptions ?? [];
        this.defaultColor = defaultColor;
        this.defaultWidth = defaultWidth;
        this.defaultRenderer = defaultRenderer;
        this.extra = extra ?? new OrderedMap();
        this.defaultStatusExtra = defaultStatusExtra ?? new OrderedMap();
        this.supportsIcon = supportsIcon;
    }

    // AS3: .../model/VariableFxStyleDefinition.as::get hasColorOptions()
    get hasColorOptions(): boolean
    {
        return this.colorOptions.length > 0 && this.defaultColor.runtimeValue !== 'NOT_APPLICABLE';
    }

    // AS3: .../model/VariableFxStyleDefinition.as::get hasWidthOptions()
    get hasWidthOptions(): boolean
    {
        return this.widthOptions.length > 0 && this.defaultWidth.runtimeValue !== 'not_applicable';
    }

    /** One renderer is not a choice, so the dropdown is hidden rather than shown with one row. */
    // AS3: .../model/VariableFxStyleDefinition.as::get hasRendererOptions()
    get hasRendererOptions(): boolean
    {
        return this.rendererOptions.length > 1;
    }
}
