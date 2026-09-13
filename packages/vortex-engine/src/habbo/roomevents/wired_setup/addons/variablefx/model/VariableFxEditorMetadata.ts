import {OrderedMap} from '@core/utils/OrderedMap';
import {VariableFxCatalog} from '@habbo/room/object/visualization/variablefx/VariableFxCatalog';
import {VariableFxPreviewStyles} from '@habbo/room/object/visualization/variablefx/VariableFxPreviewStyles';
import type {VariableFxPreviewStyleDefinition} from '@habbo/room/object/visualization/variablefx/VariableFxPreviewStyleDefinition';
import {VariableFxCategoryDefinition} from './VariableFxCategoryDefinition';
import {VariableFxOption} from './VariableFxOption';
import {VariableFxStyleDefinition} from './VariableFxStyleDefinition';

/**
 * Everything the Wired editor needs to know about Variable FX, DERIVED rather than declared.
 *
 * Not one hand-written table: the categories, styles, colours, widths and renderers all come from
 * the runtime tables the client already ships — {@link VariableFxCatalog} for the id↔name mappings
 * and {@link VariableFxPreviewStyles} for the 38 styles. What this adds is the editor's own view of
 * them: localization keys, per-style allow-lists as `VariableFxOption` objects the dropdowns can
 * bind to, and the `categoryUses*` questions the UI hides its sections by.
 *
 * That derivation is why the editor cannot offer a style the renderer cannot draw.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/model/VariableFxEditorMetadata.as
 */
export class VariableFxEditorMetadata
{
    // AS3: .../model/VariableFxEditorMetadata.as::_categories
    private static _categories: Map<number, VariableFxCategoryDefinition> | null = null;

    // AS3: .../model/VariableFxEditorMetadata.as::_colors
    private static _colors: Map<number, VariableFxOption> = new Map();

    // AS3: .../model/VariableFxEditorMetadata.as::_renderers
    private static _renderers: Map<number, VariableFxOption> = new Map();

    // AS3: .../model/VariableFxEditorMetadata.as::_widths
    private static _widths: Map<number, VariableFxOption> = new Map();

    /** An unknown category falls back to `progress_bar`, the one every build has. */
    // AS3: .../model/VariableFxEditorMetadata.as::getCategory()
    static getCategory(categoryId: number): VariableFxCategoryDefinition
    {
        VariableFxEditorMetadata.initialize();

        const categories = VariableFxEditorMetadata._categories ?? new Map<number, VariableFxCategoryDefinition>();
        const found = categories.get(categoryId) ?? categories.get(VariableFxCatalog.CATEGORY_PROGRESS_BAR_ID);

        // `initialize()` fills every id the catalogue lists, so the fallback below is unreachable —
        // kept because the alternative is a non-null assertion on a Map lookup, and a definition
        // with one empty style degrades exactly the way `getStyle()` already does.
        return found ?? new VariableFxCategoryDefinition(categoryId, '', []);
    }

    /** Levels and number displays have no min/max to configure; everything else does. */
    // AS3: .../model/VariableFxEditorMetadata.as::categoryUsesValueRange()
    static categoryUsesValueRange(categoryId: number): boolean
    {
        return categoryId !== VariableFxCatalog.CATEGORY_LEVELLING_PROGRESS_ID
            && categoryId !== VariableFxCatalog.CATEGORY_NUMBER_DISPLAY_ID;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::categoryUsesColorSelector()
    static categoryUsesColorSelector(categoryId: number): boolean
    {
        return VariableFxEditorMetadata.categoryHasStyleMatching(categoryId, (style) => style.hasColorOptions);
    }

    // AS3: .../model/VariableFxEditorMetadata.as::categoryUsesWidthSelector()
    static categoryUsesWidthSelector(categoryId: number): boolean
    {
        return VariableFxEditorMetadata.categoryHasStyleMatching(categoryId, (style) => style.hasWidthOptions);
    }

    // AS3: .../model/VariableFxEditorMetadata.as::categoryUsesRendererSelector()
    static categoryUsesRendererSelector(categoryId: number): boolean
    {
        return VariableFxEditorMetadata.categoryHasStyleMatching(categoryId, (style) => style.hasRendererOptions);
    }

    // AS3: .../model/VariableFxEditorMetadata.as::categoryUsesSubRendererSelector()
    static categoryUsesSubRendererSelector(categoryId: number): boolean
    {
        return VariableFxEditorMetadata.categoryHasStyleMatching(categoryId, (style) => style.extra.hasKey('sub_renderer'));
    }

    // AS3: .../model/VariableFxEditorMetadata.as::categoryUsesIconSelector()
    static categoryUsesIconSelector(categoryId: number): boolean
    {
        return VariableFxEditorMetadata.categoryHasStyleMatching(categoryId, (style) => style.supportsIcon);
    }

    /**
     * True when ANY renderer the category can reach is segmented — including through a
     * sub-renderer, which is why a level style counts even though the level badge itself has no
     * segments: its nested bar might.
     */
    // AS3: .../model/VariableFxEditorMetadata.as::categoryUsesSegmentsSelector()
    static categoryUsesSegmentsSelector(categoryId: number): boolean
    {
        return VariableFxEditorMetadata.categoryHasStyleMatching(categoryId, (style) =>
        {
            if(style.extra.hasKey('sub_renderer')) return true;

            for(const option of style.rendererOptions)
            {
                if(VariableFxEditorMetadata.rendererSupportsSegments(option.id)) return true;
            }

            return VariableFxEditorMetadata.rendererSupportsSegments(style.defaultRenderer.id);
        });
    }

    /** Block (2), arrow (4) and thermometer (13) — the three that draw discrete segments. */
    // AS3: .../model/VariableFxEditorMetadata.as::rendererSupportsSegments()
    static rendererSupportsSegments(rendererId: number): boolean
    {
        return rendererId === 2 || rendererId === 4 || rendererId === 13;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::getColor()
    static getColor(colorId: number): VariableFxOption
    {
        VariableFxEditorMetadata.initialize();

        return VariableFxEditorMetadata.colorOptionById(colorId);
    }

    // AS3: .../model/VariableFxEditorMetadata.as::getWidth()
    static getWidth(widthId: number): VariableFxOption
    {
        VariableFxEditorMetadata.initialize();

        return VariableFxEditorMetadata.widthOptionById(widthId);
    }

    // AS3: .../model/VariableFxEditorMetadata.as::getRenderer()
    static getRenderer(rendererId: number): VariableFxOption
    {
        VariableFxEditorMetadata.initialize();

        return VariableFxEditorMetadata.rendererOptionById(rendererId);
    }

    /**
     * What a level badge may nest inside itself.
     *
     * The badge whose own renderer is 20 (`level_with_progress`) offers a real choice of three
     * bars; every other level style is pinned to whatever its `sub_renderer` extra names.
     */
    // AS3: .../model/VariableFxEditorMetadata.as::getSubRendererOptions()
    static getSubRendererOptions(style: VariableFxStyleDefinition): VariableFxOption[]
    {
        VariableFxEditorMetadata.initialize();

        if(!style.extra.hasKey('sub_renderer')) return [];

        if(style.defaultRenderer.id === 20)
        {
            return [
                VariableFxEditorMetadata.getRenderer(2),
                VariableFxEditorMetadata.getRenderer(3),
                VariableFxEditorMetadata.getRenderer(4)
            ];
        }

        return [VariableFxEditorMetadata.getRenderer(Number(style.extra.getValue('sub_renderer')) | 0)];
    }

    /** The id if the list has it, the given default otherwise — the editor's whole repair rule. */
    // AS3: .../model/VariableFxEditorMetadata.as::optionIn()
    static optionIn(options: VariableFxOption[], id: number, fallback: VariableFxOption): VariableFxOption
    {
        for(const option of options)
        {
            if(option.id === id) return option;
        }

        return fallback;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::categoryHasStyleMatching()
    private static categoryHasStyleMatching(
        categoryId: number,
        matches: (style: VariableFxStyleDefinition) => boolean
    ): boolean
    {
        for(const style of VariableFxEditorMetadata.getCategory(categoryId).styles)
        {
            if(matches(style)) return true;
        }

        return false;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::initialize()
    private static initialize(): void
    {
        if(VariableFxEditorMetadata._categories !== null) return;

        for(const id of VariableFxCatalog.getColorIds())
        {
            VariableFxEditorMetadata._colors.set(id, new VariableFxOption(
                id, `wiredfurni.params.variablefx.color.${id}`, VariableFxCatalog.resolveColorById(id)
            ));
        }

        for(const id of VariableFxCatalog.getWidthIds())
        {
            VariableFxEditorMetadata._widths.set(id, new VariableFxOption(
                id, `wiredfurni.params.variablefx.width.${id}`, VariableFxCatalog.resolveWidthById(id)
            ));
        }

        for(const id of VariableFxCatalog.getRendererIds())
        {
            VariableFxEditorMetadata._renderers.set(id, new VariableFxOption(
                id, `wiredfurni.params.variablefx.renderer.${id}`, VariableFxCatalog.resolveRendererById(id) ?? ''
            ));
        }

        const categories = new Map<number, VariableFxCategoryDefinition>();

        for(const id of VariableFxCatalog.getCategoryIds())
        {
            const previews = VariableFxPreviewStyles.getByCategoryId(id);

            categories.set(id, new VariableFxCategoryDefinition(
                id,
                previews.length === 0 ? '' : previews[0].category,
                previews.map((preview) => VariableFxEditorMetadata.styleFromPreviewDefinition(preview))
            ));
        }

        VariableFxEditorMetadata._categories = categories;
    }

    /**
     * The editor's view of one runtime style.
     *
     * Note `runtimeStyle` is the DEFAULT RENDERER's name, not the preview's `serverStyle` — AS3
     * passes `defaultRenderer` into that slot. It reaches `VariableFxConfigData.style` through
     * `toRuntimeConfig()`, so the editor's preview config carries a renderer name where the
     * visualization factory's wire-built config carries a server style name. Faithful, and worth
     * knowing before comparing the two.
     */
    // AS3: .../model/VariableFxEditorMetadata.as::styleFromPreviewDefinition()
    private static styleFromPreviewDefinition(preview: VariableFxPreviewStyleDefinition): VariableFxStyleDefinition
    {
        const color = VariableFxEditorMetadata.colorByRuntimeValue(preview.defaultColor);
        const width = VariableFxEditorMetadata.widthByRuntimeValue(preview.defaultWidth);
        const renderer = VariableFxEditorMetadata.rendererByRuntimeValue(preview.defaultRenderer);

        return new VariableFxStyleDefinition(
            preview.styleId,
            `wiredfurni.params.variablefx.style.${preview.category}.${preview.styleId}`,
            preview.defaultRenderer,
            VariableFxEditorMetadata.optionsByRuntimeValue(preview.allowedColors, VariableFxEditorMetadata.colorByRuntimeValue),
            VariableFxEditorMetadata.optionsByRuntimeValue(preview.allowedWidths, VariableFxEditorMetadata.widthByRuntimeValue),
            VariableFxEditorMetadata.optionsByRuntimeValue(preview.allowedRenderers, VariableFxEditorMetadata.rendererByRuntimeValue),
            color ?? VariableFxEditorMetadata.colorOptionById(VariableFxCatalog.resolveColorId('NOT_APPLICABLE')),
            width ?? VariableFxEditorMetadata.widthOptionById(VariableFxCatalog.resolveWidthId('not_applicable')),
            renderer ?? VariableFxEditorMetadata.rendererOptionById(0),
            VariableFxEditorMetadata.copyMap(preview.defaultConfigExtra),
            VariableFxEditorMetadata.copyMap(preview.defaultStatusExtra),
            preview.categoryId === VariableFxCatalog.CATEGORY_NUMBER_DISPLAY_ID
        );
    }

    // AS3: .../model/VariableFxEditorMetadata.as::colorOptions()
    private static optionsByRuntimeValue(
        runtimeValues: string[],
        resolve: (value: string) => VariableFxOption | null
    ): VariableFxOption[]
    {
        const options: VariableFxOption[] = [];

        for(const value of runtimeValues)
        {
            const option = resolve(value);

            if(option !== null) options.push(option);
        }

        return options;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::copyMap()
    private static copyMap(source: OrderedMap | null): OrderedMap
    {
        return source === null ? new OrderedMap() : source.clone();
    }

    /**
     * Null when the name does not round-trip.
     *
     * `resolveColorId()` answers -1 for an unknown name and -1 IS a real id (`NOT_APPLICABLE`), so
     * the only safe test is whether the option found maps back to the name asked for.
     */
    // AS3: .../model/VariableFxEditorMetadata.as::colorByRuntimeValue()
    private static colorByRuntimeValue(runtimeValue: string): VariableFxOption | null
    {
        const option = VariableFxEditorMetadata.colorOptionById(VariableFxCatalog.resolveColorId(runtimeValue));

        return option.runtimeValue === runtimeValue ? option : null;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::widthByRuntimeValue()
    private static widthByRuntimeValue(runtimeValue: string): VariableFxOption | null
    {
        const option = VariableFxEditorMetadata.widthOptionById(VariableFxCatalog.resolveWidthId(runtimeValue));

        return option.runtimeValue === runtimeValue ? option : null;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::rendererByRuntimeValue()
    private static rendererByRuntimeValue(runtimeValue: string): VariableFxOption | null
    {
        const option = VariableFxEditorMetadata.rendererOptionById(VariableFxCatalog.resolveRendererId(runtimeValue));

        return option.runtimeValue === runtimeValue ? option : null;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::colorOptionById()
    private static colorOptionById(colorId: number): VariableFxOption
    {
        return VariableFxEditorMetadata._colors.get(colorId)
            ?? VariableFxEditorMetadata._colors.get(VariableFxCatalog.resolveColorId('NOT_APPLICABLE'))!;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::widthOptionById()
    private static widthOptionById(widthId: number): VariableFxOption
    {
        return VariableFxEditorMetadata._widths.get(widthId)
            ?? VariableFxEditorMetadata._widths.get(VariableFxCatalog.resolveWidthId('not_applicable'))!;
    }

    // AS3: .../model/VariableFxEditorMetadata.as::rendererOptionById()
    private static rendererOptionById(rendererId: number): VariableFxOption
    {
        return VariableFxEditorMetadata._renderers.get(rendererId)
            ?? VariableFxEditorMetadata._renderers.get(0)!;
    }
}
