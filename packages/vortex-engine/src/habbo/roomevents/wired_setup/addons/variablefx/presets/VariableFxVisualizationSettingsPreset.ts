import type {IWindow} from '@core/window/IWindow';
import {VariableFxPaintColor} from '@habbo/room/object/visualization/variablefx/VariableFxPaintColor';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import {ExpandableDropdownOption} from '../../../common/advanced_dropdown/ExpandableDropdownOption';
import type {PresetManager} from '../../../uibuilder/PresetManager';
import {DropdownParam} from '../../../uibuilder/params/DropdownParam';
import {SectionParam} from '../../../uibuilder/params/SectionParam';
import {TextParam} from '../../../uibuilder/params/TextParam';
import type {DropdownPreset} from '../../../uibuilder/presets/DropdownPreset';
import type {SectionPreset} from '../../../uibuilder/presets/SectionPreset';
import type {SimpleListViewPreset} from '../../../uibuilder/presets/SimpleListViewPreset';
import type {TextPreset} from '../../../uibuilder/presets/TextPreset';
import {WiredUIPreset} from '../../../uibuilder/presets/WiredUIPreset';
import type {NamedDropdownPreset} from '../../../uibuilder/presets/combinations/NamedDropdownPreset';
import type {WiredStyle} from '../../../uibuilder/styles/WiredStyle';
import type {VariableFxCategoryDefinition} from '../model/VariableFxCategoryDefinition';
import {VariableFxEditorMetadata} from '../model/VariableFxEditorMetadata';
import type {VariableFxEditorState} from '../model/VariableFxEditorState';
import type {VariableFxOption} from '../model/VariableFxOption';
import type {IVariableFxStateListener} from './IVariableFxStateListener';
import type {VariableFxPreviewBlockPreset} from './VariableFxPreviewBlockPreset';
import type {VariableFxPreviewPreset} from './VariableFxPreviewPreset';

/**
 * The form: a style picker in the section header, the live preview, and seven dropdowns under it.
 *
 * Every dropdown is both HIDDEN and DISABLED independently, and the two mean different things. A
 * selector is hidden when the CATEGORY has no use for it at all — a number display has no width —
 * and disabled when the category uses it but this particular style offers only one choice, so the
 * row stays visible for alignment and reads as "not yours to change". `notApplicableOptions()` is
 * what a disabled dropdown shows.
 *
 * The whole form rebuilds itself on every change, because the choices are interdependent: picking a
 * style rewrites the colour list, picking a segmented renderer disables the width, and picking a
 * level style reveals the sub-renderer. `_refreshing` is the guard that stops `reinit()` from
 * re-entering `stateChanged()` while that rebuild is in flight.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/presets/VariableFxVisualizationSettingsPreset.as
 */
export class VariableFxVisualizationSettingsPreset extends WiredUIPreset
{
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::NOT_APPLICABLE_OPTION_ID
    private static readonly NOT_APPLICABLE_OPTION_ID: number = -1;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::METALLIC_COLOR_PREFIX_KEY
    private static readonly METALLIC_COLOR_PREFIX_KEY: string = 'wiredfurni.params.variablefx.color.prefix.metallic';

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::DYNAMIC_COLOR_PREFIX_KEY
    private static readonly DYNAMIC_COLOR_PREFIX_KEY: string = 'wiredfurni.params.variablefx.color.prefix.dynamic';

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::ICON_LOCALIZATION_PREFIX
    private static readonly ICON_LOCALIZATION_PREFIX: string = 'wiredfurni.params.variablefx.icon.';

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::CAMPAIGN_ICONS_ENABLED_KEY
    private static readonly CAMPAIGN_ICONS_ENABLED_KEY: string = 'wired.variablefx.campaign.icons.enabled';

    /** The empty first entry is "no icon", which is why the list is indexed rather than keyed. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::STANDARD_ICON_IDS
    private static readonly STANDARD_ICON_IDS: readonly string[] = [
        '', 'battery', 'burning', 'cash', 'cooldown', 'droplet', 'energy', 'eye', 'fish', 'food',
        'freezing', 'gems', 'gold', 'health', 'honor', 'magic', 'mana', 'poison', 'repairing',
        'reputation', 'shield', 'stamina', 'star_power', 'stealth', 'timeleft', 'upgrading', 'wooden_logs'
    ];

    /** Behind an external variable, or staff — a campaign's icons are not everyone's to use. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::CAMPAIGN_ICON_IDS (name derived)
    //   The AS3 constant is `_SafeStr_10266`.
    private static readonly CAMPAIGN_ICON_IDS: readonly string[] = [
        'ranch.aubergine', 'ranch.carrot', 'ranch.corn', 'ranch.egg', 'ranch.grape',
        'ranch.potato', 'ranch.pumpkin', 'ranch.sapling', 'ranch.tomato', 'ranch.wheat'
    ];

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_listener (name derived)
    private _listener: IVariableFxStateListener | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_state (name derived)
    private _state: VariableFxEditorState | null = null;

    /** True while `refreshForStyle()` is rewriting the dropdowns, so their change events are ignored. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_refreshing (name derived)
    private _refreshing: boolean = false;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_iconIds (name derived)
    private _iconIds: readonly string[];

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_section (name derived)
    private _section: SectionPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_content
    private _content: SimpleListViewPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_styleDropdown (name derived)
    private _styleDropdown: DropdownPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_preview (name derived)
    private _preview: VariableFxPreviewPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_previewBlock (name derived)
    private _previewBlock: VariableFxPreviewBlockPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_outerContainer (name derived)
    private _outerContainer: WiredUIPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_selectorContainer (name derived)
    private _selectorContainer: WiredUIPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_selectorCaption (name derived)
    private _selectorCaption: TextPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_selectorList (name derived)
    private _selectorList: SimpleListViewPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_colorDropdown (name derived)
    private _colorDropdown: NamedDropdownPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_widthDropdown (name derived)
    private _widthDropdown: NamedDropdownPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_rendererDropdown (name derived)
    private _rendererDropdown: NamedDropdownPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_subRendererDropdown (name derived)
    private _subRendererDropdown: NamedDropdownPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_segmentsDropdown (name derived)
    private _segmentsDropdown: NamedDropdownPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_iconDropdown (name derived)
    private _iconDropdown: NamedDropdownPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_iconAlignmentDropdown (name derived)
    private _iconAlignmentDropdown: NamedDropdownPreset | null;

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::_selectors (name derived)
    private _selectors: NamedDropdownPreset[];

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::VariableFxVisualizationSettingsPreset()
    constructor(
        roomEvents: HabboUserDefinedRoomEvents,
        presetManager: PresetManager,
        wiredStyle: WiredStyle,
        listener: IVariableFxStateListener
    )
    {
        super(roomEvents, presetManager, wiredStyle);

        this._listener = listener;
        this._iconIds = VariableFxVisualizationSettingsPreset.STANDARD_ICON_IDS;

        if(roomEvents.getBoolean(VariableFxVisualizationSettingsPreset.CAMPAIGN_ICONS_ENABLED_KEY)
            || (roomEvents.sessionDataManager?.hasSecurity(4) ?? false))
        {
            this._iconIds = [
                ...VariableFxVisualizationSettingsPreset.STANDARD_ICON_IDS,
                ...VariableFxVisualizationSettingsPreset.CAMPAIGN_ICON_IDS
            ];
        }

        const onChange = (): void => this.stateChanged();

        this._styleDropdown = presetManager.createDropdown(new DropdownParam('', null, onChange, ''));
        this._preview = presetManager.createVariableFxPreviewPreset();
        this._previewBlock = presetManager.createVariableFxPreviewBlockPreset(
            this._preview, () => this.onRandomizePreview()
        );

        this._colorDropdown = presetManager.createNamedDropdown(
            new DropdownParam('', null, onChange), '${wiredfurni.params.variablefx.visualization.color}');
        this._widthDropdown = presetManager.createNamedDropdown(
            new DropdownParam('', null, onChange), '${wiredfurni.params.variablefx.visualization.width}');
        this._rendererDropdown = presetManager.createNamedDropdown(
            new DropdownParam('', null, onChange), '${wiredfurni.params.variablefx.visualization.renderer}');
        this._subRendererDropdown = presetManager.createNamedDropdown(
            new DropdownParam('', null, onChange), '${wiredfurni.params.variablefx.visualization.sub_renderer}');
        this._segmentsDropdown = presetManager.createNamedDropdown(
            new DropdownParam('', VariableFxVisualizationSettingsPreset.segmentsOptions(), onChange),
            '${wiredfurni.params.variablefx.visualization.segments}');
        this._iconDropdown = presetManager.createNamedDropdown(
            new DropdownParam('', this.iconOptions(), onChange),
            '${wiredfurni.params.variablefx.visualization.icon}');
        this._iconAlignmentDropdown = presetManager.createNamedDropdown(
            new DropdownParam('', VariableFxVisualizationSettingsPreset.iconAlignmentOptions(), onChange),
            '${wiredfurni.params.variablefx.visualization.icon_alignment}');

        this._selectors = [
            this._colorDropdown, this._widthDropdown, this._rendererDropdown, this._subRendererDropdown,
            this._segmentsDropdown, this._iconDropdown, this._iconAlignmentDropdown
        ];

        this._selectorList = presetManager.createSimpleListView(true, this._selectors);
        this._selectorList.spacing = wiredStyle.genericVerticalSpacing;

        const captionParam = new TextParam(1, true);

        captionParam.textColor = wiredStyle.softTextColor;

        this._selectorCaption = presetManager.createText('${wiredfurni.params.variablefx.visualization}', captionParam);

        const captionedList = presetManager.createSimpleListView(true, [this._selectorCaption, this._selectorList]);

        captionedList.spacing = wiredStyle.genericVerticalSpacing;

        this._selectorContainer = presetManager.createPaddedContainerPreset(
            captionedList, 6, 5, 6, 5, wiredStyle.createBorder()
        );
        this._content = presetManager.createSimpleListView(true, [this._previewBlock, this._selectorContainer]);
        this._content.spacing = wiredStyle.genericVerticalSpacing;
        this._outerContainer = presetManager.createSurroundingBorderContainerPreset(this._content, 5, 5, 5, 5);

        const sectionParam = new SectionParam();

        sectionParam.headerOptionLeft = this._styleDropdown;
        sectionParam.titleYOffset = wiredStyle.namedDropdownOffset;

        this._section = presetManager.createSection(
            '${wiredfurni.params.variablefx.visualization.style}', this._outerContainer, sectionParam
        );
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::init()
    init(state: VariableFxEditorState): void
    {
        this._state = state;

        this._preview?.init(state);
        this.refreshForStyle();
        this.refreshPreview();
    }

    /**
     * Writes the form back into the state.
     *
     * Each selector contributes only when it is BOTH visible and enabled, with two exceptions that
     * clear instead: a visible-but-disabled segments dropdown zeroes the count, and a hidden or
     * disabled icon dropdown clears the icon. Leaving a stale value there would write a param the
     * server reads back as meaningful.
     */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::applyToState()
    applyToState(state: VariableFxEditorState): void
    {
        if(this._styleDropdown !== null) state.styleId = this._styleDropdown.selectedId;

        if(VariableFxVisualizationSettingsPreset.isActive(this._colorDropdown))
        {
            state.colorId = this._colorDropdown!.selectedId;
        }

        if(VariableFxVisualizationSettingsPreset.isActive(this._widthDropdown))
        {
            state.widthId = this._widthDropdown!.selectedId;
        }

        if(VariableFxVisualizationSettingsPreset.isActive(this._rendererDropdown))
        {
            state.rendererId = this._rendererDropdown!.selectedId;
        }

        if(VariableFxVisualizationSettingsPreset.isActive(this._subRendererDropdown))
        {
            state.subRendererId = this._subRendererDropdown!.selectedId;
        }

        if(VariableFxVisualizationSettingsPreset.isActive(this._segmentsDropdown))
        {
            state.segments = this._segmentsDropdown!.selectedId;
        }

        if(this._segmentsDropdown !== null && this._segmentsDropdown.visible && this._segmentsDropdown.disabled)
        {
            state.segments = 0;
        }

        if(VariableFxVisualizationSettingsPreset.isActive(this._iconDropdown)
            && this._iconDropdown!.selected !== null)
        {
            state.icon = this.iconIdForOption(this._iconDropdown!.selectedId);
        }

        if(this._iconDropdown !== null && (!this._iconDropdown.visible || this._iconDropdown.disabled))
        {
            state.icon = '';
        }

        if(VariableFxVisualizationSettingsPreset.isActive(this._iconAlignmentDropdown))
        {
            state.iconAlignmentId = this._iconAlignmentDropdown!.selectedId;
        }
    }

    /** Rebuilds every dropdown's contents, visibility and enabled state from the current style. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::refreshForStyle()
    refreshForStyle(): void
    {
        const state = this._state;

        if(state === null) return;

        const category = VariableFxEditorMetadata.getCategory(state.categoryId);
        const style = state.currentStyle();

        this._refreshing = true;

        this._styleDropdown?.reinit(VariableFxVisualizationSettingsPreset.styleOptions(category), state.styleId);
        this._colorDropdown?.reinit(this.colorOptionVectorWithDefault(style.colorOptions, style.defaultColor), state.colorId);
        this._widthDropdown?.reinit(
            VariableFxVisualizationSettingsPreset.optionVectorWithDefault(style.widthOptions, style.defaultWidth), state.widthId);
        this._rendererDropdown?.reinit(
            VariableFxVisualizationSettingsPreset.optionVectorWithDefault(style.rendererOptions, style.defaultRenderer), state.rendererId);

        const subRenderers = VariableFxEditorMetadata.getSubRendererOptions(style);

        if(subRenderers.length > 0)
        {
            this._subRendererDropdown?.reinit(
                VariableFxVisualizationSettingsPreset.optionVector(subRenderers), state.subRendererId);
        }
        else
        {
            this._subRendererDropdown?.reinit(
                VariableFxVisualizationSettingsPreset.notApplicableOptions(),
                VariableFxVisualizationSettingsPreset.NOT_APPLICABLE_OPTION_ID);
        }

        if(style.supportsIcon)
        {
            this._iconDropdown?.reinit(this.iconOptions(), this.iconOptionId(state.icon));
            this._iconAlignmentDropdown?.reinit(
                VariableFxVisualizationSettingsPreset.iconAlignmentOptions(), state.iconAlignmentId);
        }
        else
        {
            this._iconDropdown?.reinit(
                VariableFxVisualizationSettingsPreset.notApplicableOptions(),
                VariableFxVisualizationSettingsPreset.NOT_APPLICABLE_OPTION_ID);
            this._iconAlignmentDropdown?.reinit(
                VariableFxVisualizationSettingsPreset.notApplicableOptions(),
                VariableFxVisualizationSettingsPreset.NOT_APPLICABLE_OPTION_ID);
        }

        // A level badge's segments belong to the bar nested inside it, not to the badge.
        const segmentRendererId = state.categoryId === 2 && state.rendererId === 20
            ? state.subRendererId
            : state.rendererId;
        const supportsSegments = VariableFxEditorMetadata.rendererSupportsSegments(segmentRendererId);
        const segmented = supportsSegments && state.segments > 0;

        this._segmentsDropdown?.reinit(
            supportsSegments
                ? VariableFxVisualizationSettingsPreset.segmentsOptions()
                : VariableFxVisualizationSettingsPreset.notApplicableOptions(),
            supportsSegments ? state.segments : VariableFxVisualizationSettingsPreset.NOT_APPLICABLE_OPTION_ID
        );

        VariableFxVisualizationSettingsPreset.setVisible(
            this._colorDropdown, VariableFxEditorMetadata.categoryUsesColorSelector(state.categoryId));
        VariableFxVisualizationSettingsPreset.setVisible(
            this._widthDropdown, VariableFxEditorMetadata.categoryUsesWidthSelector(state.categoryId));
        VariableFxVisualizationSettingsPreset.setVisible(
            this._rendererDropdown, VariableFxEditorMetadata.categoryUsesRendererSelector(state.categoryId));
        VariableFxVisualizationSettingsPreset.setVisible(
            this._subRendererDropdown, VariableFxEditorMetadata.categoryUsesSubRendererSelector(state.categoryId));
        VariableFxVisualizationSettingsPreset.setVisible(
            this._segmentsDropdown, VariableFxEditorMetadata.categoryUsesSegmentsSelector(state.categoryId));
        VariableFxVisualizationSettingsPreset.setVisible(
            this._iconDropdown, VariableFxEditorMetadata.categoryUsesIconSelector(state.categoryId));
        VariableFxVisualizationSettingsPreset.setVisible(
            this._iconAlignmentDropdown, VariableFxEditorMetadata.categoryUsesIconSelector(state.categoryId));

        VariableFxVisualizationSettingsPreset.setDisabled(this._colorDropdown,
            !VariableFxVisualizationSettingsPreset.selectorHasEditableOptions(style.colorOptions, style.defaultColor.id));
        // A segmented bar's width is dictated by its segment count, so the width picker goes dead.
        VariableFxVisualizationSettingsPreset.setDisabled(this._widthDropdown,
            !VariableFxVisualizationSettingsPreset.selectorHasEditableOptions(style.widthOptions, style.defaultWidth.id) || segmented);
        VariableFxVisualizationSettingsPreset.setDisabled(this._rendererDropdown,
            !VariableFxVisualizationSettingsPreset.selectorHasEditableOptions(style.rendererOptions, style.defaultRenderer.id));
        VariableFxVisualizationSettingsPreset.setDisabled(this._subRendererDropdown,
            !VariableFxVisualizationSettingsPreset.selectorHasEditableOptions(subRenderers, state.subRendererId));
        VariableFxVisualizationSettingsPreset.setDisabled(this._segmentsDropdown, !supportsSegments);
        VariableFxVisualizationSettingsPreset.setDisabled(this._iconDropdown, !style.supportsIcon);
        VariableFxVisualizationSettingsPreset.setDisabled(this._iconAlignmentDropdown, !style.supportsIcon);

        this.alignSelectorNames();

        this._refreshing = false;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::refreshPreview()
    refreshPreview(): void
    {
        if(this._state === null) return;

        this._preview?.refresh(this._state);
        this._previewBlock?.refreshZoomLabel();
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::get window()
    override get window(): IWindow
    {
        return this._section!.window;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::resizeToWidth()
    override resizeToWidth(width: number): void
    {
        super.resizeToWidth(width);

        this._section?.resizeToWidth(width);
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::get childPresets()
    protected override get childPresets(): WiredUIPreset[]
    {
        return this._section === null ? [] : [this._section];
    }

    /** Randomize moves the VALUE only, so the form is untouched and only the preview is told. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::onRandomizePreview()
    private onRandomizePreview(): void
    {
        const state = this._state;

        if(state === null) return;

        this.applyToState(state);
        state.sanitize();

        this._preview?.randomize(state);
        this._previewBlock?.refreshZoomLabel();
        this._listener?.variableFxStateChanged(state, false);
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::stateChanged()
    private stateChanged(): void
    {
        const state = this._state;

        if(this._refreshing || state === null) return;

        this.applyToState(state);
        state.sanitize();
        this.refreshForStyle();

        this._listener?.variableFxStateChanged(state, true);
    }

    /** One label column for the whole stack — the widest visible label sets it for all of them. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::alignSelectorNames()
    private alignSelectorNames(): void
    {
        let width = 0;

        for(const selector of this._selectors)
        {
            if(selector.visible) width = Math.max(width, selector.nameWidth);
        }

        for(const selector of this._selectors)
        {
            if(selector.visible) selector.nameWidth = width;
        }

        this._selectorList?.resize();
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::styleOptions()
    private static styleOptions(category: VariableFxCategoryDefinition): ExpandableDropdownOption[]
    {
        return category.styles.map((style) => new ExpandableDropdownOption(style.id, `\${${style.localizationKey}}`));
    }

    /** A style with no options of its own still shows its default, so the row is never empty. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::optionVectorWithDefault()
    private static optionVectorWithDefault(options: VariableFxOption[], fallback: VariableFxOption): ExpandableDropdownOption[]
    {
        return VariableFxVisualizationSettingsPreset.optionVector(options.length > 0 ? options : [fallback]);
    }

    /** One option is not a choice — and neither is a list whose only entry is "not applicable". */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::selectorHasEditableOptions()
    private static selectorHasEditableOptions(options: VariableFxOption[], selectedId: number): boolean
    {
        return options.length > 1 && selectedId !== VariableFxVisualizationSettingsPreset.NOT_APPLICABLE_OPTION_ID;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::notApplicableOptions()
    private static notApplicableOptions(): ExpandableDropdownOption[]
    {
        return [new ExpandableDropdownOption(
            VariableFxVisualizationSettingsPreset.NOT_APPLICABLE_OPTION_ID,
            '${wiredfurni.params.variablefx.not_applicable}'
        )];
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::optionVector()
    private static optionVector(options: VariableFxOption[]): ExpandableDropdownOption[]
    {
        return options.map((option) => new ExpandableDropdownOption(option.id, `\${${option.key}}`));
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::isDynamicColor()
    private static isDynamicColor(option: VariableFxOption): boolean
    {
        return option.runtimeValue === VariableFxPaintColor.DYNAMIC_RED_TO_GREEN
            || option.runtimeValue === VariableFxPaintColor.DYNAMIC_LEVELLING
            || option.runtimeValue === VariableFxPaintColor.DYNAMIC_TEAM_COLOR;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::isMetallicColor()
    private static isMetallicColor(option: VariableFxOption): boolean
    {
        return VariableFxPaintColor.resolve(option.runtimeValue).isMetallic;
    }

    /** "Not specified" plus 1..100 — the same cap `VariableFxSegmentedProgress` enforces. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::segmentsOptions()
    private static segmentsOptions(): ExpandableDropdownOption[]
    {
        const options = [new ExpandableDropdownOption(
            0, '${wiredfurni.params.variablefx.visualization.segments.not_specified}'
        )];

        for(let count = 1; count <= 100; count++) options.push(new ExpandableDropdownOption(count, String(count)));

        return options;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::iconAlignmentOptions()
    private static iconAlignmentOptions(): ExpandableDropdownOption[]
    {
        return [
            new ExpandableDropdownOption(0, '${wiredfurni.params.variablefx.icon_alignment.left}'),
            new ExpandableDropdownOption(1, '${wiredfurni.params.variablefx.icon_alignment.right}'),
            new ExpandableDropdownOption(2, '${wiredfurni.params.variablefx.icon_alignment.double}')
        ];
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::colorOptionVectorWithDefault()
    private colorOptionVectorWithDefault(options: VariableFxOption[], fallback: VariableFxOption): ExpandableDropdownOption[]
    {
        return this.colorOptionVector(options.length > 0 ? options : [fallback]);
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::colorOptionVector()
    private colorOptionVector(options: VariableFxOption[]): ExpandableDropdownOption[]
    {
        return options.map((option) => new ExpandableDropdownOption(option.id, this.colorDisplayString(option)));
    }

    /**
     * A prefix marks the colours that behave differently rather than just looking different — a
     * dynamic colour tracks the value, a metallic one is shaded twice. Metallic is NOT prefixed on
     * a number display, where the extra shading is not applied.
     */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::colorDisplayString()
    private colorDisplayString(option: VariableFxOption): string
    {
        let prefix: string | null = null;

        if(VariableFxVisualizationSettingsPreset.isDynamicColor(option))
        {
            prefix = VariableFxVisualizationSettingsPreset.DYNAMIC_COLOR_PREFIX_KEY;
        }
        else if(VariableFxVisualizationSettingsPreset.isMetallicColor(option) && this._state?.categoryId !== 5)
        {
            prefix = VariableFxVisualizationSettingsPreset.METALLIC_COLOR_PREFIX_KEY;
        }

        if(prefix === null) return this.localized(option.key);

        return `${this.localized(prefix)} ${this.localized(option.key)}`;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::localized()
    private localized(key: string): string
    {
        return this._roomEvents.localization.getLocalization(key, key);
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::iconOptions()
    private iconOptions(): ExpandableDropdownOption[]
    {
        return this._iconIds.map((icon, index) => new ExpandableDropdownOption(
            index,
            icon === '' ? '${wiredfurni.params.variablefx.icon.none}' : this.iconDisplayString(icon)
        ));
    }

    /** A dotted id is a campaign's — shown as "<campaign> <icon>" so the list groups visually. */
    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::iconDisplayString()
    private iconDisplayString(icon: string): string
    {
        const key = VariableFxVisualizationSettingsPreset.ICON_LOCALIZATION_PREFIX + icon;
        const dot = icon.indexOf('.');

        if(dot === -1) return this.localized(key);

        const campaignKey = VariableFxVisualizationSettingsPreset.ICON_LOCALIZATION_PREFIX + icon.substring(0, dot);

        return `${this.localized(campaignKey)} ${this.localized(key)}`;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::iconOptionId()
    private iconOptionId(icon: string): number
    {
        for(const option of this.iconOptions())
        {
            if(this.iconIdForOption(option.id) === icon) return option.id;
        }

        return 0;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::iconIdForOption()
    private iconIdForOption(id: number): string
    {
        return id >= 0 && id < this._iconIds.length ? this._iconIds[id] : '';
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::applyToState()
    private static isActive(selector: NamedDropdownPreset | null): boolean
    {
        return selector !== null && selector.visible && !selector.disabled;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::refreshForStyle()
    private static setVisible(selector: NamedDropdownPreset | null, visible: boolean): void
    {
        if(selector !== null) selector.visible = visible;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::refreshForStyle()
    private static setDisabled(selector: NamedDropdownPreset | null, disabled: boolean): void
    {
        if(selector !== null) selector.disabled = disabled;
    }

    // AS3: .../presets/VariableFxVisualizationSettingsPreset.as::dispose()
    override dispose(): void
    {
        if(this.disposed) return;

        super.dispose();

        this._listener = null;
        this._state = null;
        this._section = null;
        this._content = null;
        this._styleDropdown = null;
        this._preview = null;
        this._previewBlock = null;
        this._outerContainer = null;
        this._selectorContainer = null;
        this._selectorCaption = null;
        this._selectorList = null;
        this._colorDropdown = null;
        this._widthDropdown = null;
        this._rendererDropdown = null;
        this._subRendererDropdown = null;
        this._segmentsDropdown = null;
        this._iconDropdown = null;
        this._iconAlignmentDropdown = null;
        this._selectors = [];
    }
}
