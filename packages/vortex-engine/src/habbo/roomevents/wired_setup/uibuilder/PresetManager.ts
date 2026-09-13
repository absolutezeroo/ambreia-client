import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import {OrderedMap} from '@core/utils/OrderedMap';
import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';

import type {WiredStyle} from './styles/WiredStyle';
import {TextParam} from './params/TextParam';
import type {HtmlTextParam} from './params/HtmlTextParam';
import type {WiredUIPreset} from './presets/WiredUIPreset';
import {ensureWrappersRegistered} from './presets/registerWrappers';
import {SpacerPreset} from './presets/SpacerPreset';
import {SplitterPreset} from './presets/SplitterPreset';
import {SpacingPreset} from './presets/SpacingPreset';
import {TextPreset} from './presets/TextPreset';
import {ButtonPreset} from './presets/ButtonPreset';
import {IconButtonPreset} from './presets/IconButtonPreset';
import {HtmlPreset} from './presets/HtmlPreset';
import {StaticBitmapAssetWrapperPreset} from './presets/StaticBitmapAssetWrapperPreset';
import {TextualButtonPreset} from './presets/TextualButtonPreset';
import {PaddedContainerPreset} from './presets/PaddedContainerPreset';
import {ContainerButtonPreset} from './presets/ContainerButtonPreset';
import {CenteredContainerPreset} from './presets/CenteredContainerPreset';
import {SimpleListViewPreset} from './presets/SimpleListViewPreset';
import {ScrollListPreset} from './presets/ScrollListPreset';
import {ButtonRowPreset} from './presets/ButtonRowPreset';
import {HorizontalSectionListPreset} from './presets/HorizontalSectionListPreset';
import {CheckboxOptionPreset} from './presets/CheckboxOptionPreset';
import {CheckboxGroupPreset} from './presets/CheckboxGroupPreset';
import {RadioButtonPreset} from './presets/RadioButtonPreset';
import {RadioGroupPreset} from './presets/RadioGroupPreset';
import {TextInputPreset} from './presets/TextInputPreset';
import {NumberInputPreset} from './presets/NumberInputPreset';
import {TextAreaPreset} from './presets/TextAreaPreset';
import {BitmapViewPreset} from './presets/BitmapViewPreset';
import {AvatarImagePreset} from './presets/AvatarImagePreset';
import {CollapseExpandSectionButtonPreset} from './presets/CollapseExpandSectionButtonPreset';
import {SourceTypeSelectorPreset} from './presets/SourceTypeSelectorPreset';
import {SectionPreset} from './presets/SectionPreset';
import {BorderSection} from './presets/sections/BorderSection';
import {ItemTypeSelectionSection} from './presets/sections/ItemTypeSelectionSection';
import {ItemTypeSelectionPreset} from './presets/contracts/ItemTypeSelectionPreset';
import {ChestItemIconPreviewerPreset} from './presets/contracts/ChestItemIconPreviewerPreset';
import {NodeOverviewPreset} from './presets/contracts/NodeOverviewPreset';
import {TradeRuleEditorPreset} from './presets/contracts/TradeRuleEditorPreset';
import type {TradeRuleEditNodeCallback, TradeRuleEditorCallback, TradeRuleChangeCallback} from './presets/contracts/TradeRuleEditorPreset';
import {TradeRuleListEditorPreset} from './presets/contracts/TradeRuleListEditorPreset';
import type {NodeOverviewClickCallback} from './presets/contracts/NodeOverviewPreset';
import {UsageInfoSection} from './presets/sections/UsageInfoSection';
import {UsageWarningSection} from './presets/sections/UsageWarningSection';
import {ChronoMaskFilterPreset} from './presets/applications/ChronoMaskFilterPreset';
import {ChronoRangeFilterPreset} from './presets/applications/ChronoRangeFilterPreset';
import {SubVariableCreatorPreset} from './presets/applications/SubVariableCreatorPreset';
import type {SubVariableParam} from './params/applications/SubVariableParam';
import {WindowWrapperPreset} from './presets/WindowWrapperPreset';
import {LevelXpPreviewPreset} from './presets/applications/LevelXpPreviewPreset';
import {FloorDrawingPreset} from './presets/applications/FloorDrawingPreset';
import {FloorEditorPreset} from './presets/applications/FloorEditorPreset';
import {InputSourceSection} from './presets/main_layout/InputSourceSection';
import {AssetButtonPreset} from './presets/AssetButtonPreset';
import {AssetButtonRowPreset} from './presets/AssetButtonRowPreset';
import type {MiniAssetIconButtonPreset} from './presets/MiniAssetIconButtonPreset';
import {VolterMiniAssetIconButtonPreset} from './presets/VolterMiniAssetIconButtonPreset';
import {PressedButtonMiniAssetIconButtonPreset} from './presets/PressedButtonMiniAssetIconButtonPreset';
import type {HeaderPreset} from './presets/main_layout/HeaderPreset';
import {VolterHeaderPreset} from './presets/main_layout/VolterHeaderPreset';
import {IlluminaHeaderPreset} from './presets/main_layout/IlluminaHeaderPreset';
import {FooterPreset} from './presets/main_layout/FooterPreset';
import {AdvancedSettingsWrapperPreset} from './presets/main_layout/AdvancedSettingsWrapperPreset';
import {FramePreset} from './presets/main_layout/FramePreset';
import {InnerBorderFramePreset} from './presets/main_layout/InnerBorderFramePreset';
import type {SourceTypeSelectorParam} from './params/SourceTypeSelectorParam';
import type {SectionParam} from './params/SectionParam';
import type {AssetButtonParam} from './params/AssetButtonParam';
import {MenuPreset} from './presets/menu/MenuPreset';
import type {IMenuElement} from './presets/menu/elements/IMenuElement';
import {SliderPreset} from './presets/SliderPreset';
import {SliderSection} from './presets/sections/SliderSection';
import {NamedNumberInputPreset} from './presets/combinations/NamedNumberInputPreset';
import {NamedTextInputPreset} from './presets/combinations/NamedTextInputPreset';
import {RewardRowPreset} from './presets/combinations/RewardRowPreset';
import {VariableFxPreviewPreset} from '../addons/variablefx/presets/VariableFxPreviewPreset';
import {VariableFxPreviewBlockPreset} from '../addons/variablefx/presets/VariableFxPreviewBlockPreset';
import {RewardListPreset} from './presets/combinations/RewardListPreset';
import {DropdownPreset} from './presets/DropdownPreset';
import {NamedDropdownPreset} from './presets/combinations/NamedDropdownPreset';
import {VariablePickerPreset} from './presets/VariablePickerPreset';
import {VariableNameSection} from './presets/sections/VariableNameSection';
import {ChooseVariableSection} from './presets/sections/ChooseVariableSection';
import {ValueOrVariableSection} from './presets/sections/ValueOrVariableSection';
import {PlaceholderNameSection} from './presets/sections/PlaceholderNameSection';
import {VariableFxValueRangePreset} from '../addons/variablefx/presets/VariableFxValueRangePreset';
import {VariableFxAdvancedRangePreset} from '../addons/variablefx/presets/VariableFxAdvancedRangePreset';
import {VariableFxVariableOverrideRowPreset} from '../addons/variablefx/presets/VariableFxVariableOverrideRowPreset';
import {VariableFxVisualizationSettingsPreset} from '../addons/variablefx/presets/VariableFxVisualizationSettingsPreset';
import type {IVariableFxStateListener} from '../addons/variablefx/presets/IVariableFxStateListener';
import {PlaceholderTypeSection} from './presets/sections/PlaceholderTypeSection';
import {VariablePlaceholderModeSection} from './presets/sections/VariablePlaceholderModeSection';
import type {ISliderConverter} from '../common/slider_converter/ISliderConverter';
import type {IWiredTypeHolder} from '../IWiredTypeHolder';
import type {ListScrollParams} from './params/ListScrollParams';
import type {CheckboxOptionParam} from './params/CheckboxOptionParam';
import type {RadioButtonParam} from './params/RadioButtonParam';
import type {TextInputParam} from './params/TextInputParam';
import type {NumberInputParam} from './params/NumberInputParam';
import type {TextAreaParam} from './params/TextAreaParam';
import type {DropdownParam} from './params/DropdownParam';
import type {WiredVariable} from '@habbo/communication/messages/incoming/userdefinedroomevents/variables/WiredVariable';

/**
 * PresetManager — the factory the wired UI builder uses to instantiate every preset (buttons, text,
 * inputs, sections, layouts…), always threading the current wired style. It also caches parsed XML
 * window templates (`createLayout`) so repeated widgets clone from one parse.
 *
 * All 69 of the AS3 `create*` factory methods are ported, each instantiating its concrete preset
 * from `wired_setup/uibuilder/presets/**`. If one ever goes missing that is a regression, not a
 * deliberate omission.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/PresetManager.as
 */
export class PresetManager
{
    // AS3: PresetManager.as::_roomEvents
    private _roomEvents: HabboUserDefinedRoomEvents;

    // AS3: PresetManager.as::_presetTemplates
    private _presetTemplates: OrderedMap<string, IWindow> = new OrderedMap<string, IWindow>();

    // AS3: PresetManager.as::PresetManager()
    constructor(roomEvents: HabboUserDefinedRoomEvents)
    {
        // Populate the WiredUIPreset wrapper-constructor registry before any preset is built (breaks
        // the base<->wrapper import cycle; see presets/wrapperCtors).
        ensureWrappersRegistered();
        this._roomEvents = roomEvents;
    }

    // AS3: PresetManager.as::get wiredStyle()
    get wiredStyle(): WiredStyle
    {
        return this._roomEvents.wiredCtrl.wiredStyle;
    }

    // AS3: PresetManager.as::createLayout()
    createLayout(name: string): IWindow
    {
        if(this._presetTemplates.hasKey(name))
        {
            return this._presetTemplates.getValue(name)!.clone();
        }

        const template = this._roomEvents.getXmlWindow(name)!;

        this._presetTemplates.add(name, template);

        return template.clone();
    }

    // AS3: PresetManager.as::createSpacer()
    createSpacer(size: number): SpacerPreset
    {
        return new SpacerPreset(this._roomEvents, this, this.wiredStyle, size);
    }

    // AS3: PresetManager.as::createSplitter()
    createSplitter(): SplitterPreset
    {
        return new SplitterPreset(this._roomEvents, this, this.wiredStyle);
    }

    // AS3: PresetManager.as::createSpacing()
    createSpacing(vertical: boolean, size: number): SpacingPreset
    {
        return new SpacingPreset(this._roomEvents, this, this.wiredStyle, vertical, size);
    }

    // AS3: PresetManager.as::createText()
    createText(text: string, param: TextParam | null = null): TextPreset
    {
        if(param == null)
        {
            param = TextParam.DEFAULT;
        }

        return new TextPreset(this._roomEvents, this, this.wiredStyle, text, param);
    }

    // AS3: PresetManager.as::createButton()
    createButton(caption: string, onClick: (() => void) | null, mode: number = 0): ButtonPreset
    {
        return new ButtonPreset(this._roomEvents, this, this.wiredStyle, caption, onClick, mode);
    }

    // AS3: PresetManager.as::createIconButtonPreset()
    createIconButtonPreset(name: string, onClick: (() => void) | null): IconButtonPreset
    {
        return new IconButtonPreset(this._roomEvents, this, this.wiredStyle, name, onClick);
    }

    // AS3: PresetManager.as::createHtml()
    createHtml(text: string, param: HtmlTextParam): HtmlPreset
    {
        return new HtmlPreset(this._roomEvents, this, this.wiredStyle, text, param);
    }

    // AS3: PresetManager.as::createBitmapWrapperPreset()
    createBitmapWrapperPreset(assetUri: string): StaticBitmapAssetWrapperPreset
    {
        return new StaticBitmapAssetWrapperPreset(this._roomEvents, this, this.wiredStyle, assetUri);
    }

    // AS3: PresetManager.as::createTextualButtonPreset()
    createTextualButtonPreset(caption: string, onClick: () => void): TextualButtonPreset
    {
        return new TextualButtonPreset(this._roomEvents, this, this.wiredStyle, caption, onClick);
    }

    // AS3: PresetManager.as::createNamedNumberInput()
    createNamedNumberInput(param: NumberInputParam, name: string, bold: boolean = false): NamedNumberInputPreset
    {
        return new NamedNumberInputPreset(this._roomEvents, this, this.wiredStyle, param, name, bold);
    }

    // AS3: PresetManager.as::createNamedTextInput()
    createNamedTextInput(param: TextInputParam, name: string, bold: boolean = false): NamedTextInputPreset
    {
        return new NamedTextInputPreset(this._roomEvents, this, this.wiredStyle, param, name, bold);
    }

    // AS3: PresetManager.as::createRewardList()
    createRewardList(maxRewards: number, displayedRewards: number): RewardListPreset
    {
        return new RewardListPreset(this._roomEvents, this, this.wiredStyle, maxRewards, displayedRewards);
    }

    // AS3: PresetManager.as::createRewardRow()
    createRewardRow(): RewardRowPreset
    {
        return new RewardRowPreset(this._roomEvents, this, this.wiredStyle);
    }

    // AS3: PresetManager.as::createDropdown()
    createDropdown(param: DropdownParam): DropdownPreset
    {
        return new DropdownPreset(this._roomEvents, this, this.wiredStyle, param);
    }

    // AS3: PresetManager.as::createNamedDropdown()
    createNamedDropdown(param: DropdownParam, caption: string, bold: boolean = false): NamedDropdownPreset
    {
        return new NamedDropdownPreset(this._roomEvents, this, this.wiredStyle, param, caption, bold);
    }

    // AS3: PresetManager.as::createVariablePicker()
    createVariablePicker(variableFilter: ((variable: WiredVariable) => boolean) | null = null, onSelect: ((variable: WiredVariable | null) => void) | null = null): VariablePickerPreset
    {
        return new VariablePickerPreset(this._roomEvents, this, this.wiredStyle, variableFilter, onSelect);
    }

    // AS3: PresetManager.as::createValueOrVariableSection()
    createValueOrVariableSection(mergedType: number, sourceTypes: number[], title: string, min: number, max: number): ValueOrVariableSection
    {
        return new ValueOrVariableSection(this._roomEvents, this, this.wiredStyle, mergedType, sourceTypes, title, min, max);
    }

    // AS3: PresetManager.as::createChooseVariableSection()
    createChooseVariableSection(mergedType: number = -1, sourceTypes: number[] | null = null, filter: ((variable: WiredVariable) => boolean) | null = null, onSelect: ((variable: WiredVariable | null) => void) | null = null, title: string | null = null): ChooseVariableSection
    {
        return new ChooseVariableSection(this._roomEvents, this, this.wiredStyle, mergedType, sourceTypes, filter, onSelect, title);
    }

    // AS3: PresetManager.as::createPaddedContainerPreset()
    createPaddedContainerPreset(wrapped: WiredUIPreset, leftPadding: number, top: number, rightPadding: number, bottom: number, window: IWindowContainer | null = null, stretchMode: boolean = false): PaddedContainerPreset
    {
        return new PaddedContainerPreset(this._roomEvents, this, this.wiredStyle, wrapped, leftPadding, top, rightPadding, bottom, window, stretchMode);
    }

    /** A padded container wearing the style's OUTER border rather than a plain one. */
    // AS3: PresetManager.as::createVariableFxValueRangePreset()
    createVariableFxValueRangePreset(listener: IVariableFxStateListener): VariableFxValueRangePreset
    {
        return new VariableFxValueRangePreset(this._roomEvents, this, this.wiredStyle, listener);
    }

    // AS3: PresetManager.as::createVariableFxAdvancedRangePreset()
    createVariableFxAdvancedRangePreset(listener: IVariableFxStateListener): VariableFxAdvancedRangePreset
    {
        return new VariableFxAdvancedRangePreset(this._roomEvents, this, this.wiredStyle, listener);
    }

    // AS3: PresetManager.as::createVariableFxVariableOverrideRowPreset()
    createVariableFxVariableOverrideRowPreset(
        kind: number,
        onChange: () => void
    ): VariableFxVariableOverrideRowPreset
    {
        return new VariableFxVariableOverrideRowPreset(this._roomEvents, this, this.wiredStyle, kind, onChange);
    }

    // AS3: PresetManager.as::createVariableFxVisualizationSettingsPreset()
    createVariableFxVisualizationSettingsPreset(
        listener: IVariableFxStateListener
    ): VariableFxVisualizationSettingsPreset
    {
        return new VariableFxVisualizationSettingsPreset(this._roomEvents, this, this.wiredStyle, listener);
    }

    // AS3: PresetManager.as::createVariableFxPreviewPreset()
    createVariableFxPreviewPreset(): VariableFxPreviewPreset
    {
        return new VariableFxPreviewPreset(this._roomEvents, this, this.wiredStyle);
    }

    // AS3: PresetManager.as::createVariableFxPreviewBlockPreset()
    createVariableFxPreviewBlockPreset(
        preview: VariableFxPreviewPreset,
        onRandomize: () => void
    ): VariableFxPreviewBlockPreset
    {
        return new VariableFxPreviewBlockPreset(this._roomEvents, this, this.wiredStyle, preview, onRandomize);
    }

    // AS3: PresetManager.as::createSurroundingBorderContainerPreset()
    createSurroundingBorderContainerPreset(
        wrapped: WiredUIPreset,
        leftPadding: number,
        top: number,
        rightPadding: number,
        bottom: number
    ): PaddedContainerPreset
    {
        return this.createPaddedContainerPreset(
            wrapped, leftPadding, top, rightPadding, bottom, this.wiredStyle.createSurroundingBorder()
        );
    }

    // AS3: PresetManager.as::createContainerButtonPreset()
    createContainerButtonPreset(wrapped: WiredUIPreset, onClick: (() => void) | null, stretchMode: boolean = true): ContainerButtonPreset
    {
        return new ContainerButtonPreset(this._roomEvents, this, this.wiredStyle, wrapped, onClick, stretchMode);
    }

    // AS3: PresetManager.as::createCenteredContainerPreset()
    createCenteredContainerPreset(wrapped: WiredUIPreset, margin: number, window: IWindowContainer | null = null): CenteredContainerPreset
    {
        return new CenteredContainerPreset(this._roomEvents, this, this.wiredStyle, wrapped, margin, window);
    }

    // AS3: PresetManager.as::createSimpleListView()
    createSimpleListView(vertical: boolean, presets: WiredUIPreset[], centered: boolean = false): SimpleListViewPreset
    {
        return new SimpleListViewPreset(this._roomEvents, this, this.wiredStyle, vertical, presets, centered);
    }

    // AS3: PresetManager.as::createScrollList()
    createScrollList(presets: WiredUIPreset[], scrollParams: ListScrollParams, centered: boolean = false): ScrollListPreset
    {
        return new ScrollListPreset(this._roomEvents, this, this.wiredStyle, presets, scrollParams, centered);
    }

    // AS3: PresetManager.as::createButtonRow()
    createButtonRow(buttons: WiredUIPreset[]): ButtonRowPreset
    {
        return new ButtonRowPreset(this._roomEvents, this, this.wiredStyle, buttons);
    }

    // AS3: PresetManager.as::createHorizontalSectionListPreset()
    createHorizontalSectionListPreset(presets: WiredUIPreset[]): HorizontalSectionListPreset
    {
        return new HorizontalSectionListPreset(this._roomEvents, this, this.wiredStyle, presets);
    }

    // AS3: PresetManager.as::createCheckboxOption()
    createCheckboxOption(param: CheckboxOptionParam, last: boolean = false): CheckboxOptionPreset
    {
        return new CheckboxOptionPreset(this._roomEvents, this, this.wiredStyle, param, last);
    }

    // AS3: PresetManager.as::createCheckboxGroup()
    createCheckboxGroup(params: CheckboxOptionParam[], onChange: ((id: number, selected: boolean) => void) | null = null, columns: number = 1): CheckboxGroupPreset
    {
        return new CheckboxGroupPreset(this._roomEvents, this, this.wiredStyle, params, onChange, columns);
    }

    // AS3: PresetManager.as::createRadioButton()
    createRadioButton(param: RadioButtonParam, last: boolean = false): RadioButtonPreset
    {
        return new RadioButtonPreset(this._roomEvents, this, this.wiredStyle, param, last);
    }

    // AS3: PresetManager.as::createRadioGroup()
    createRadioGroup(params: RadioButtonParam[], onChange: ((selected: number) => void) | null = null, columns: number = 1): RadioGroupPreset
    {
        return new RadioGroupPreset(this._roomEvents, this, this.wiredStyle, params, onChange, columns);
    }

    // AS3: PresetManager.as::createTextInput()
    createTextInput(param: TextInputParam): TextInputPreset
    {
        return new TextInputPreset(this._roomEvents, this, this.wiredStyle, param);
    }

    // AS3: PresetManager.as::createNumberInput()
    createNumberInput(param: NumberInputParam): NumberInputPreset
    {
        return new NumberInputPreset(this._roomEvents, this, this.wiredStyle, param);
    }

    // AS3: PresetManager.as::createTextArea()
    createTextArea(param: TextAreaParam): TextAreaPreset
    {
        return new TextAreaPreset(this._roomEvents, this, this.wiredStyle, param);
    }

    // AS3: PresetManager.as::createBitmapViewPreset()
    createBitmapViewPreset(ownGraphicContext: boolean = false): BitmapViewPreset
    {
        return new BitmapViewPreset(this._roomEvents, this, this.wiredStyle, ownGraphicContext);
    }

    // AS3: PresetManager.as::createAvatarImagePreset()
    createAvatarImagePreset(): AvatarImagePreset
    {
        return new AvatarImagePreset(this._roomEvents, this, this.wiredStyle);
    }

    // AS3: PresetManager.as::createCollapseExpandSectionButton()
    createCollapseExpandSectionButton(callback: ((expanded: boolean) => void) | null = null, startExpanded: boolean = true): CollapseExpandSectionButtonPreset
    {
        return new CollapseExpandSectionButtonPreset(this._roomEvents, this, this.wiredStyle, callback, startExpanded);
    }

    // AS3: PresetManager.as::createSourceTypeSelector()
    createSourceTypeSelector(param: SourceTypeSelectorParam): SourceTypeSelectorPreset
    {
        return new SourceTypeSelectorPreset(this._roomEvents, this, this.wiredStyle, param);
    }

    // AS3: PresetManager.as::createSection()
    createSection(title: string, content: WiredUIPreset, param: SectionParam | null = null): SectionPreset
    {
        return new SectionPreset(this._roomEvents, this, this.wiredStyle, title, content, param);
    }

    // AS3: PresetManager.as::createRuleEditorPreset()
    createRuleEditorPreset(
        title: string,
        onEditNode: TradeRuleEditNodeCallback | null,
        onAddMore: TradeRuleEditorCallback | null,
        onClose: TradeRuleEditorCallback | null = null,
        onChange: TradeRuleChangeCallback | null = null
    ): TradeRuleEditorPreset
    {
        return new TradeRuleEditorPreset(this._roomEvents, this, this.wiredStyle, title, onEditNode, onAddMore, onClose, onChange);
    }

    // AS3: PresetManager.as::createRuleListEditorPreset()
    createRuleListEditorPreset(
        onEditNode: TradeRuleEditNodeCallback | null,
        onAddNode: TradeRuleEditorCallback | null
    ): TradeRuleListEditorPreset
    {
        return new TradeRuleListEditorPreset(this._roomEvents, this, this.wiredStyle, onEditNode, onAddNode);
    }

    // AS3: PresetManager.as::createNodeOverviewPreset()
    createNodeOverviewPreset(title: string, onNodeClicked: NodeOverviewClickCallback | null = null): NodeOverviewPreset
    {
        return new NodeOverviewPreset(this._roomEvents, this, this.wiredStyle, title, onNodeClicked);
    }

    // AS3: PresetManager.as::createItemTypeSelectionSection()
    createItemTypeSelectionSection(): ItemTypeSelectionSection
    {
        return new ItemTypeSelectionSection(this._roomEvents, this, this.wiredStyle);
    }

    // AS3: PresetManager.as::createItemTypeSelectionPreset()
    createItemTypeSelectionPreset(): ItemTypeSelectionPreset
    {
        return new ItemTypeSelectionPreset(this._roomEvents, this, this.wiredStyle);
    }

    // AS3: PresetManager.as::createChestItemIconPreviewerPreset()
    createChestItemIconPreviewerPreset(): ChestItemIconPreviewerPreset
    {
        return new ChestItemIconPreviewerPreset(this._roomEvents, this, this.wiredStyle);
    }

    // AS3: PresetManager.as::createBorderSection()
    createBorderSection(title: string, content: WiredUIPreset, param: SectionParam | null = null): BorderSection
    {
        return new BorderSection(this._roomEvents, this, this.wiredStyle, title, content, param);
    }

    // AS3: PresetManager.as::createUsageInfoSection()
    createUsageInfoSection(text: string, collapsed: boolean = false, title: string | null = null): UsageInfoSection
    {
        return new UsageInfoSection(this._roomEvents, this, this.wiredStyle, text, collapsed, title);
    }

    // AS3: PresetManager.as::createUsageWarningSection()
    createUsageWarningSection(text: string): UsageWarningSection
    {
        return new UsageWarningSection(this._roomEvents, this, this.wiredStyle, text);
    }

    // AS3: PresetManager.as::createChronoMaskFilter()
    createChronoMaskFilter(labels: string[], columns: number = 1): ChronoMaskFilterPreset
    {
        return new ChronoMaskFilterPreset(this._roomEvents, this, this.wiredStyle, labels, columns);
    }

    // AS3: PresetManager.as::createChronoRangeFilter()
    createChronoRangeFilter(skipLabel: string, exactLabel: string, rangeLabel: string, defaultValue: number, min: number, max: number, width: number): ChronoRangeFilterPreset
    {
        return new ChronoRangeFilterPreset(this._roomEvents, this, this.wiredStyle, skipLabel, exactLabel, rangeLabel, defaultValue, min, max, width);
    }

    // AS3: PresetManager.as::createSubVariableCreator()
    createSubVariableCreator(prefix: string, params: SubVariableParam[]): SubVariableCreatorPreset
    {
        return new SubVariableCreatorPreset(this._roomEvents, this, this.wiredStyle, prefix, params);
    }

    // AS3: PresetManager.as::createWrapperPreset()
    createWrapperPreset(window: IWindow): WindowWrapperPreset
    {
        return new WindowWrapperPreset(this._roomEvents, this, this.wiredStyle, window, false);
    }

    // AS3: PresetManager.as::createLevelXpPreview()
    createLevelXpPreview(previewLevels: number[]): LevelXpPreviewPreset
    {
        return new LevelXpPreviewPreset(this._roomEvents, this, this.wiredStyle, previewLevels);
    }

    // AS3: PresetManager.as::createFloorDrawingPreset()
    createFloorDrawingPreset(onRootTileChanged: (x: number, y: number) => void): FloorDrawingPreset
    {
        return new FloorDrawingPreset(this._roomEvents, this, this.wiredStyle, onRootTileChanged);
    }

    // AS3: PresetManager.as::createFloorEditorPreset()
    createFloorEditorPreset(buttonRow: AssetButtonRowPreset, floorDrawing: FloorDrawingPreset): FloorEditorPreset
    {
        return new FloorEditorPreset(this._roomEvents, this, this.wiredStyle, buttonRow, floorDrawing);
    }

    // AS3: PresetManager.as::createInputSourceSection()
    createInputSourceSection(title: string, sourceType: number, id: number, sourceOptionIds: number[] | null = null, hasCustomTypePicker: boolean = false, dualFurniPickingMode: boolean = false): InputSourceSection
    {
        return new InputSourceSection(this._roomEvents, this, this.wiredStyle, title, sourceType, id, sourceOptionIds, hasCustomTypePicker, dualFurniPickingMode);
    }

    // AS3: PresetManager.as::createAssetButtonRow()
    createAssetButtonRow(params: AssetButtonParam[]): AssetButtonRowPreset
    {
        return new AssetButtonRowPreset(this._roomEvents, this, this.wiredStyle, params);
    }

    // AS3: PresetManager.as::createMiniAssetIconButtonPreset()
    createMiniAssetIconButtonPreset(assetName: string, tooltip: string, onClick: (() => void) | null): MiniAssetIconButtonPreset
    {
        if(this.wiredStyle.isVolter)
        {
            return new VolterMiniAssetIconButtonPreset(this._roomEvents, this, this.wiredStyle, assetName, tooltip, onClick);
        }

        return new PressedButtonMiniAssetIconButtonPreset(this._roomEvents, this, this.wiredStyle, assetName, tooltip, onClick);
    }

    // AS3: PresetManager.as::createAssetButtonPreset()
    createAssetButtonPreset(assetName: string, tooltip: string, onClick: (() => void) | null): AssetButtonPreset
    {
        return new AssetButtonPreset(this._roomEvents, this, this.wiredStyle, assetName, tooltip, onClick);
    }

    // AS3: PresetManager.as::createHeaderPreset()
    createHeaderPreset(name: string, typeHolder: IWiredTypeHolder, buttonMode: number, onApplySnapshot: () => void, onOpenMenu: () => void, onViewLogs: () => void): HeaderPreset
    {
        if(this.wiredStyle.isVolter)
        {
            return new VolterHeaderPreset(this._roomEvents, this, this.wiredStyle, name, typeHolder, buttonMode, onApplySnapshot, onOpenMenu, onViewLogs);
        }

        if(this.wiredStyle.name === 'illumina')
        {
            return new IlluminaHeaderPreset(this._roomEvents, this, this.wiredStyle, name, typeHolder, buttonMode, onApplySnapshot, onOpenMenu, onViewLogs);
        }

        throw new Error('Header preset for unsupported style');
    }

    // AS3: PresetManager.as::createFooterPreset()
    createFooterPreset(onSave: () => void, onCancel: () => void): FooterPreset
    {
        return new FooterPreset(this._roomEvents, this, this.wiredStyle, onSave, onCancel);
    }

    // AS3: PresetManager.as::createAdvancedSettingsWrapperPreset()
    createAdvancedSettingsWrapperPreset(presets: WiredUIPreset[], alwaysExpanded: boolean): AdvancedSettingsWrapperPreset
    {
        return new AdvancedSettingsWrapperPreset(this._roomEvents, this, this.wiredStyle, presets, alwaysExpanded);
    }

    // AS3: PresetManager.as::createMenuPreset()
    createMenuPreset(items: IMenuElement[], menuButton: IWindow): MenuPreset
    {
        return new MenuPreset(this._roomEvents, this, this.wiredStyle, items, menuButton);
    }

    // AS3: PresetManager.as::createSliderPreset()
    createSliderPreset(min: number = 0, max: number = 1, step: number = 0): SliderPreset
    {
        return new SliderPreset(this._roomEvents, this, this.wiredStyle, min, max, step);
    }

    // AS3: PresetManager.as::createSliderSection()
    createSliderSection(localizationKey: string, unit: string, converter: ISliderConverter, min: number = 0, max: number = 1, step: number = 0, showNumberInput: boolean = true, param: SectionParam | null = null): SliderSection
    {
        return new SliderSection(this._roomEvents, this, this.wiredStyle, localizationKey, unit, converter, min, max, step, showNumberInput, param);
    }

    // AS3: PresetManager.as::createVariableNameSection()
    createVariableNameSection(): VariableNameSection
    {
        return new VariableNameSection(this._roomEvents, this, this.wiredStyle);
    }

    // AS3: PresetManager.as::createPlaceholderNameSection()
    createPlaceholderNameSection(title: string, prefix: string): PlaceholderNameSection
    {
        return new PlaceholderNameSection(this._roomEvents, this, this.wiredStyle, title, prefix);
    }

    // AS3: PresetManager.as::createPlaceholderTypeSection()
    createPlaceholderTypeSection(prefix: string | null = null): PlaceholderTypeSection
    {
        return new PlaceholderTypeSection(this._roomEvents, this, this.wiredStyle, prefix);
    }

    // AS3: PresetManager.as::createVariablePlaceholderModeSection()
    createVariablePlaceholderModeSection(title: string): VariablePlaceholderModeSection
    {
        return new VariablePlaceholderModeSection(this._roomEvents, this, this.wiredStyle, title);
    }

    // AS3: PresetManager.as::createFramePreset()
    createFramePreset(elements: WiredUIPreset[], onClose: (() => void) | null, holderKey: string | null = null, code: number = -1, resizable: boolean = false, showMenu: boolean = false, scrollParams: ListScrollParams | null = null): FramePreset
    {
        if(this.wiredStyle.useInnerBorder)
        {
            return new InnerBorderFramePreset(this._roomEvents, this, this.wiredStyle, elements, onClose, holderKey ?? '', code, resizable);
        }

        return new FramePreset(this._roomEvents, this, this.wiredStyle, elements, onClose, holderKey ?? '', code, resizable, showMenu, scrollParams);
    }
}
