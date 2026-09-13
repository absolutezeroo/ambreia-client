import type {OrderedMap} from '@core/utils/OrderedMap';
import {VariableFxConfigData} from '@habbo/room/object/visualization/variablefx/VariableFxConfigData';
import {VariableExtraSourceTypes} from '../../../common/VariableExtraSourceTypes';
import {WiredInputSourcePicker} from '../../../inputsources/WiredInputSourcePicker';
import {VariableFxEditorMetadata} from './VariableFxEditorMetadata';
import type {VariableFxStyleDefinition} from './VariableFxStyleDefinition';

/**
 * Everything the Wired editor holds while an effect is being configured.
 *
 * Twenty-odd fields, and the important method is {@link sanitize}: it is called after loading from
 * the wire, after every source-type change, and before writing back, and it REPAIRS rather than
 * rejects. A style the build does not have becomes the category's first style, a colour outside the
 * style's allow-list becomes its default, an out-of-range duration is clamped. That is what keeps
 * an effect saved by a newer client from locking the editor.
 *
 * Several fields are deliberately cleared rather than kept when they stop applying — an audience
 * variable when the visibility is not an audience mode, the icon alignment outside a number
 * display. Keeping them would write params the server would then read back as meaningful.
 *
 * Named for what it is: the AS3 class is `_SafeCls_4621` and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/model/_SafeCls_4621.as
 */
export class VariableFxEditorState
{
    // AS3: .../model/_SafeCls_4621.as::categoryId
    categoryId: number = 0;

    // AS3: .../model/_SafeCls_4621.as::sourceType
    sourceType: number = 0;

    // AS3: .../model/_SafeCls_4621.as::visibility
    visibility: number = 0;

    // AS3: .../model/_SafeCls_4621.as::showMode
    showMode: number = 0;

    // AS3: .../model/_SafeCls_4621.as::visibilityMask
    //   Name RECOVERED: the AS3 field is `_SafeStr_5289`, the same obfuscated name
    //   `VariableFxConfigUpdateData.visibilityMask` carries; both sit at int param index 3.
    visibilityMask: number = 0;

    // AS3: .../model/_SafeCls_4621.as::showOnMouseHover
    showOnMouseHover: boolean = false;

    // AS3: .../model/_SafeCls_4621.as::showDuration
    showDuration: number = 0;

    // AS3: .../model/_SafeCls_4621.as::styleId
    styleId: number = 0;

    // AS3: .../model/_SafeCls_4621.as::colorId
    colorId: number = 0;

    // AS3: .../model/_SafeCls_4621.as::widthId
    //   Name RECOVERED: `_SafeStr_5624`, as on `VariableFxConfigUpdateData`.
    widthId: number = 0;

    // AS3: .../model/_SafeCls_4621.as::rendererId
    rendererId: number = 0;

    // AS3: .../model/_SafeCls_4621.as::defaultMinValue
    defaultMinValue: number = 0;

    // AS3: .../model/_SafeCls_4621.as::defaultMaxValue
    defaultMaxValue: number = 0;

    // AS3: .../model/_SafeCls_4621.as::overrideMinEnabled
    overrideMinEnabled: boolean = false;

    // AS3: .../model/_SafeCls_4621.as::overrideMaxEnabled
    overrideMaxEnabled: boolean = false;

    // AS3: .../model/_SafeCls_4621.as::overrideMinTarget
    overrideMinTarget: number = 0;

    // AS3: .../model/_SafeCls_4621.as::overrideMaxTarget
    overrideMaxTarget: number = 0;

    // AS3: .../model/_SafeCls_4621.as::segments
    segments: number = 0;

    // AS3: .../model/_SafeCls_4621.as::subRendererId
    subRendererId: number = 0;

    // AS3: .../model/_SafeCls_4621.as::iconAlignmentId (name derived)
    //   `_SafeStr_5896`: 0 left, 1 right, 2 double — see `iconAlignmentRuntimeValue()`.
    iconAlignmentId: number = 0;

    // AS3: .../model/_SafeCls_4621.as::icon
    icon: string = '';

    // AS3: .../model/_SafeCls_4621.as::overrideMinVariableId
    overrideMinVariableId: string = '';

    // AS3: .../model/_SafeCls_4621.as::overrideMaxVariableId
    overrideMaxVariableId: string = '';

    // AS3: .../model/_SafeCls_4621.as::audienceVariableId
    audienceVariableId: string = '';

    // AS3: .../model/_SafeCls_4621.as::audienceVariableValue
    audienceVariableValue: number = 0;

    /** Repairs every field into range, in the order the fields depend on each other. */
    // AS3: .../model/_SafeCls_4621.as::sanitize()
    sanitize(): void
    {
        if(this.sourceType !== WiredInputSourcePicker.FURNI_SOURCE
            && this.sourceType !== WiredInputSourcePicker.USER_SOURCE)
        {
            this.sourceType = WiredInputSourcePicker.USER_SOURCE;
        }

        if(this.visibility < 0 || this.visibility > 4) this.visibility = 2;

        if(this.showMode < 0 || this.showMode > 2) this.showMode = 0;

        // A furni effect has no "everyone but me" to offer, so only the two audience modes survive.
        if(this.sourceType === WiredInputSourcePicker.FURNI_SOURCE && this.visibility !== 3 && this.visibility !== 4)
        {
            this.visibility = 2;
        }

        if(this.visibility !== 3 && this.visibility !== 4)
        {
            this.audienceVariableId = '';
            this.audienceVariableValue = 0;
        }

        this.visibilityMask = VariableFxEditorState.clamp(this.visibilityMask, 0, 15);
        this.showDuration = VariableFxEditorState.clamp(this.showDuration, 1500, 20000);

        const category = VariableFxEditorMetadata.getCategory(this.categoryId);

        this.categoryId = category.id;

        const style = category.getStyle(this.styleId);

        this.styleId = style.id;
        this.colorId = VariableFxEditorMetadata.optionIn(style.colorOptions, this.colorId, style.defaultColor).id;
        this.widthId = VariableFxEditorMetadata.optionIn(style.widthOptions, this.widthId, style.defaultWidth).id;
        this.rendererId = VariableFxEditorMetadata.optionIn(style.rendererOptions, this.rendererId, style.defaultRenderer).id;

        if(this.categoryId === 2)
        {
            // A level's range is the level's own, not the user's — it is always 0..100.
            this.defaultMinValue = 0;
            this.defaultMaxValue = 100;

            const subRenderers = VariableFxEditorMetadata.getSubRendererOptions(style);

            if(subRenderers.length > 0)
            {
                this.subRendererId = VariableFxEditorMetadata.optionIn(subRenderers, this.subRendererId, subRenderers[0]).id;
            }
        }
        else if(VariableFxEditorMetadata.categoryUsesValueRange(this.categoryId) && this.defaultMaxValue <= this.defaultMinValue)
        {
            this.defaultMaxValue = this.defaultMinValue < 100 ? 100 : this.defaultMinValue + 1;
        }

        this.overrideMinTarget = this.sanitizeOverrideTarget(this.overrideMinTarget);
        this.overrideMaxTarget = this.sanitizeOverrideTarget(this.overrideMaxTarget);
        this.segments = VariableFxEditorState.clamp(this.segments, 0, 100);

        if(!VariableFxEditorMetadata.rendererSupportsSegments(this.segmentRendererId)) this.segments = 0;

        this.iconAlignmentId = this.categoryId === 5
            ? VariableFxEditorState.sanitizeIconAlignment(this.iconAlignmentId)
            : 0;
    }

    // AS3: .../model/_SafeCls_4621.as::currentStyle()
    currentStyle(): VariableFxStyleDefinition
    {
        return VariableFxEditorMetadata.getCategory(this.categoryId).getStyle(this.styleId);
    }

    /**
     * The config the editor's PREVIEW renders from — the same class the wire produces, built from
     * the editor's own state instead.
     *
     * The extras are the style's, plus whatever the state adds: `segments` when non-zero,
     * `sub_renderer` for a level, and the icon pair for a number display.
     */
    // AS3: .../model/_SafeCls_4621.as::toRuntimeConfig()
    toRuntimeConfig(): VariableFxConfigData
    {
        const category = VariableFxEditorMetadata.getCategory(this.categoryId);
        const style = this.currentStyle();
        const color = VariableFxEditorMetadata.optionIn(style.colorOptions, this.colorId, style.defaultColor);
        const width = VariableFxEditorMetadata.optionIn(style.widthOptions, this.widthId, style.defaultWidth);
        const renderer = VariableFxEditorMetadata.optionIn(style.rendererOptions, this.rendererId, style.defaultRenderer);
        const extra = style.extra.clone();

        if(this.segments > 0) VariableFxEditorState.setExtra(extra, 'segments', String(this.segments));

        if(this.categoryId === 2)
        {
            VariableFxEditorState.setExtra(extra, 'sub_renderer', String(this.subRendererId));
        }
        else if(this.categoryId === 5)
        {
            if(this.icon.length > 0) VariableFxEditorState.setExtra(extra, 'icon', this.icon);

            VariableFxEditorState.setExtra(
                extra, 'icon_alignment', VariableFxEditorState.iconAlignmentRuntimeValue(this.iconAlignmentId)
            );
        }

        return new VariableFxConfigData(
            category.runtimeCategory,
            style.runtimeStyle,
            renderer.runtimeValue,
            width.runtimeValue,
            color.runtimeValue,
            this.defaultMinValue,
            this.defaultMaxValue,
            extra,
            category.id,
            this.styleId,
            this.rendererId
        );
    }

    /** A level badge's segments belong to the bar NESTED in it, not to the badge. */
    // AS3: .../model/_SafeCls_4621.as::get segmentRendererId()
    private get segmentRendererId(): number
    {
        return this.categoryId === 2 && this.rendererId === 20 ? this.subRendererId : this.rendererId;
    }

    /** A global override keeps its global target; anything else follows the effect's own source. */
    // AS3: .../model/_SafeCls_4621.as::sanitizeOverrideTarget()
    private sanitizeOverrideTarget(target: number): number
    {
        return target === VariableExtraSourceTypes.GLOBAL_SOURCE
            ? VariableExtraSourceTypes.GLOBAL_SOURCE
            : this.sourceType;
    }

    /** Only 1 and 2 are alignments; everything else, 0 included, means left. */
    // AS3: .../model/_SafeCls_4621.as::sanitizeIconAlignment()
    private static sanitizeIconAlignment(value: number): number
    {
        return value === 1 || value === 2 ? value : 0;
    }

    // AS3: .../model/_SafeCls_4621.as::iconAlignmentRuntimeValue()
    private static iconAlignmentRuntimeValue(value: number): string
    {
        switch(VariableFxEditorState.sanitizeIconAlignment(value))
        {
            case 1: return 'right';
            case 2: return 'double';
            default: return 'left';
        }
    }

    /** AS3 writes `map[key] = value`, which on its OrderedMap replaces or adds; this is that. */
    // AS3: .../model/_SafeCls_4621.as::toRuntimeConfig()
    private static setExtra(extra: OrderedMap, key: string, value: string): void
    {
        if(extra.hasKey(key)) extra.replace(key, value);
        else extra.add(key, value);
    }

    // AS3: .../model/_SafeCls_4621.as::clamp()
    private static clamp(value: number, min: number, max: number): number
    {
        return Math.max(min, Math.min(max, value));
    }
}
