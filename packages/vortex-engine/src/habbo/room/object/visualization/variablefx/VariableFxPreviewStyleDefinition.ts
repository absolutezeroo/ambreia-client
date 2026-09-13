import {OrderedMap} from '@core/utils/OrderedMap';

/**
 * One style the server can name, and everything the client knows about it.
 *
 * Two jobs in one class, which is why it carries both defaults and allow-lists. The **client**
 * needs `serverStyle` and the extras to build a renderable config out of a numeric config update.
 * The **Wired editor** needs the allow-lists, to offer only the colours, widths and renderers that
 * style actually supports.
 *
 * `styleId` is scoped to the category, not global — `(categoryId, styleId)` is the key the wire
 * sends and the pair is what identifies a style.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/VariableFxPreviewStyleDefinition.as
 */
export class VariableFxPreviewStyleDefinition
{
    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::allowedColors
    allowedColors: string[];

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::allowedRenderers
    allowedRenderers: string[];

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::allowedWidths
    allowedWidths: string[];

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::category
    category: string;

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::categoryId
    categoryId: number;

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::defaultColor
    defaultColor: string;

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::defaultRenderer
    defaultRenderer: string;

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::defaultWidth
    defaultWidth: string;

    /** Extras every config of this style gets — the icon, the design, the sub-renderer. */
    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::defaultConfigExtra
    defaultConfigExtra: OrderedMap;

    /** Extras the EDITOR seeds a preview status with; the real status comes from the wire. */
    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::defaultStatusExtra
    defaultStatusExtra: OrderedMap;

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::serverStyle
    serverStyle: string;

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::styleId
    //   Name RECOVERED: the AS3 field is `_SafeStr_5449`, the same obfuscated name
    //   `VariableFxConfigUpdateData.styleId` carries, and `getByCategoryAndStyleId()` matches the
    //   two against each other.
    styleId: number;

    // AS3: .../variablefx/VariableFxPreviewStyleDefinition.as::VariableFxPreviewStyleDefinition()
    constructor(
        allowedColors: string[],
        allowedRenderers: string[],
        allowedWidths: string[],
        category: string,
        categoryId: number,
        defaultColor: string,
        defaultRenderer: string,
        defaultWidth: string,
        serverStyle: string,
        styleId: number,
        defaultConfigExtra: OrderedMap | null = null,
        defaultStatusExtra: OrderedMap | null = null
    )
    {
        this.allowedColors = allowedColors;
        this.allowedRenderers = allowedRenderers;
        this.allowedWidths = allowedWidths;
        this.category = category;
        this.categoryId = categoryId;
        this.defaultColor = defaultColor;
        this.defaultRenderer = defaultRenderer;
        this.defaultWidth = defaultWidth;
        this.serverStyle = serverStyle;
        this.styleId = styleId;
        this.defaultConfigExtra = defaultConfigExtra ?? new OrderedMap();
        this.defaultStatusExtra = defaultStatusExtra ?? new OrderedMap();
    }
}
