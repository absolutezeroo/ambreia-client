import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {IRadioButtonWindow} from '@core/window/components/IRadioButtonWindow';
import type {IRegionWindow} from '@core/window/components/IRegionWindow';
import type {ITextWindow} from '@core/window/components/ITextWindow';
import type {IHTMLTextWindow} from '@core/window/components/IHTMLTextWindow';
import type {IFrameWindow} from '@core/window/components/IFrameWindow';
import type {IIconButtonWindow} from '@core/window/components/IIconButtonWindow';
import type {ISelectableWindow} from '@core/window/components/ISelectableWindow';
import type {IDropMenuWindow} from '@core/window/components/IDropMenuWindow';
import type {IInteractiveWindow} from '@core/window/components/IInteractiveWindow';

import type {HabboUserDefinedRoomEvents} from '@habbo/roomevents/HabboUserDefinedRoomEvents';
import {Logger} from '@core/utils/Logger';

const log = Logger.getLogger('habbo.roomevents.wired_setup.uibuilder.styles.WiredStyle');

/**
 * WiredStyle — the base skin of the wired UI builder. Subclasses (volter/illumina/ubuntu variants)
 * override the spacing/colour getters and provide a `styleTemplate` XML window whose named children
 * are cloned by the `create*View` factories to produce fresh skinned widgets.
 *
 * The base returns neutral defaults (0 / "" / false) for every metric and an empty template; only a
 * concrete style yields real windows.
 *
 * Core-window type map for the `create*` return types (obfuscated → port): `_SafeCls_1728`→IWindow,
 * `_SafeCls_1828`→IWindowContainer, `_SafeCls_2013`→IInteractiveWindow (button), `_SafeCls_2110`→
 * IFrameWindow, `_SafeCls_2117`→IHTMLTextWindow, `_SafeCls_2168`→IIconButtonWindow, `_SafeCls_2254`→
 * IWindowContainer (border), `_SafeCls_1857`→ISelectableWindow (checkbox), `_SafeCls_2308`→
 * IDropMenuWindow (the string-populated drop MENU — not IDropListWindow, the IWindow-valued drop
 * LIST used by the catalog GuildSelector; both extend DropBaseController but only the menu carries
 * populateWithVector/openMenu, which the wired ExpandableDropdown drives).
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/uibuilder/styles/WiredStyle.as
 */
export class WiredStyle
{
    // AS3: WiredStyle.as::_roomEvents
    protected _roomEvents: HabboUserDefinedRoomEvents;

    // AS3: WiredStyle.as::WiredStyle()
    constructor(roomEvents: HabboUserDefinedRoomEvents)
    {
        this._roomEvents = roomEvents;
    }

    // AS3: WiredStyle.as::get styleTemplate()
    protected get styleTemplate(): IWindowContainer | null
    {
        return null;
    }

    // AS3: WiredStyle.as::get radioButtonSpacing()
    get radioButtonSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get checkboxSpacing()
    get checkboxSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get checkboxYOffset()
    get checkboxYOffset(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get radioButtonYOffset()
    get radioButtonYOffset(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get namedTextYOffset()
    get namedTextYOffset(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get namedInputOffset()
    get namedInputOffset(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get namedDropdownOffset()
    get namedDropdownOffset(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get genericHorizontalSpacing()
    get genericHorizontalSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get genericVerticalSpacing()
    get genericVerticalSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get sectionSpacing()
    get sectionSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get sectionLeftRightMargin()
    get sectionLeftRightMargin(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get headerMargin()
    get headerMargin(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get headerBottomMarginWithLink()
    get headerBottomMarginWithLink(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get headerNameFontSize()
    get headerNameFontSize(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get frameColor()
    get frameColor(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get backgroundColor()
    get backgroundColor(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get advancedBackgroundColor()
    get advancedBackgroundColor(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get yellowTextColor()
    get yellowTextColor(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get softTextColor()
    get softTextColor(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get redTextColor()
    get redTextColor(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get minimumOptionHeight()
    get minimumOptionHeight(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get minimumOptionSpacing()
    get minimumOptionSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get optionExtraUnderSpacing()
    get optionExtraUnderSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get optionExtraUnderLeftMargin()
    get optionExtraUnderLeftMargin(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get LRContainerMargin()
    get LRContainerMargin(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get LRContainerSpacing()
    get LRContainerSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get LRContainerTopBottomPadding()
    get LRContainerTopBottomPadding(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get inputSourceListMinHeight()
    get inputSourceListMinHeight(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get buttonRowSpacing()
    get buttonRowSpacing(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get menuRightOffset()
    get menuRightOffset(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get verticalSplitterColor()
    get verticalSplitterColor(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get name()
    get name(): string
    {
        return '';
    }

    // AS3: WiredStyle.as::get isVolter()
    get isVolter(): boolean
    {
        return false;
    }

    // AS3: WiredStyle.as::get useInnerBorder()
    get useInnerBorder(): boolean
    {
        return false;
    }

    // AS3: WiredStyle.as::get containerButtonPaddingTop()
    get containerButtonPaddingTop(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get containerButtonPaddingLeft()
    get containerButtonPaddingLeft(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get paddedSectionTop()
    get paddedSectionTop(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::get paddedSectionLeft()
    get paddedSectionLeft(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::createSplitterView()
    createSplitterView(): IWindowContainer
    {
        return this.recreateElement('ruler_view') as unknown as IWindowContainer;
    }

    // AS3: WiredStyle.as::createSplitterVerticalView()
    createSplitterVerticalView(): IWindowContainer
    {
        return this.recreateElement('ruler_view_vertical') as unknown as IWindowContainer;
    }

    // AS3: WiredStyle.as::createTextView()
    createTextView(bold: boolean = true): ITextWindow
    {
        return this.recreateElement(bold ? 'text_bold_view' : 'text_view') as unknown as ITextWindow;
    }

    // AS3: WiredStyle.as::createHtmlView()
    createHtmlView(): IHTMLTextWindow
    {
        return this.recreateElement('text_html') as unknown as IHTMLTextWindow;
    }

    // AS3: WiredStyle.as::createTextInputView()
    createTextInputView(): IWindow
    {
        return this.recreateElement('input_template');
    }

    // AS3: WiredStyle.as::createCheckboxView()
    createCheckboxView(): ISelectableWindow
    {
        return this.recreateElement('checkbox_view') as unknown as ISelectableWindow;
    }

    // AS3: WiredStyle.as::createRadioButtonView()
    createRadioButtonView(): IRadioButtonWindow
    {
        return this.recreateElement('radiobutton_view') as unknown as IRadioButtonWindow;
    }

    // AS3: WiredStyle.as::createExpandCollapseSectionRegion()
    createExpandCollapseSectionRegion(): IRegionWindow
    {
        return this.recreateElement('expand_collapse_region') as unknown as IRegionWindow;
    }

    // AS3: WiredStyle.as::createSourceTypeSelector()
    createSourceTypeSelector(): IItemListWindow
    {
        return this.recreateElement('sourcetype_selector_view') as unknown as IItemListWindow;
    }

    // AS3: WiredStyle.as::createDropdown()
    createDropdown(): IDropMenuWindow
    {
        return this.recreateElement('dropdown_view') as unknown as IDropMenuWindow;
    }

    // AS3: WiredStyle.as::createSlider()
    createSlider(): IWindowContainer
    {
        return this.recreateElement('slider') as unknown as IWindowContainer;
    }

    // AS3: WiredStyle.as::createButton()
    createButton(): IInteractiveWindow
    {
        return this.recreateElement('button') as unknown as IInteractiveWindow;
    }

    // AS3: WiredStyle.as::createAssetButton()
    createAssetButton(): IIconButtonWindow
    {
        return this.recreateElement('asset_button') as unknown as IIconButtonWindow;
    }

    // AS3: WiredStyle.as::createIconButton()
    createIconButton(name: string): IWindow
    {
        return this.recreateElement('iconbutton_' + name);
    }

    // AS3: WiredStyle.as::createMiniButton()
    createMiniButton(): IWindow
    {
        return this.recreateElement('mini_button_view');
    }

    // AS3: WiredStyle.as::createFrame()
    createFrame(): IFrameWindow
    {
        return this.recreateElement('frame') as unknown as IFrameWindow;
    }

    // AS3: WiredStyle.as::createQuickMenu()
    createQuickMenu(): IWindowContainer
    {
        return this.recreateElement('quick_menu') as unknown as IWindowContainer;
    }

    // AS3: WiredStyle.as::createInnerBorder()
    createInnerBorder(): IWindowContainer
    {
        return this.recreateElement('inner_border') as unknown as IWindowContainer;
    }

    /**
     * The style id an OUTER border uses, when the style has a distinct one.
     *
     * Zero in the base style and in every style that ships — a subclass overrides it to give the
     * outermost frame a heavier look than the inner panels.
     */
    // AS3: WiredStyle.as::get surroundingBorderStyleId()
    get surroundingBorderStyleId(): number
    {
        return 0;
    }

    // AS3: WiredStyle.as::createBorder()
    createBorder(): IWindowContainer
    {
        return this.recreateElement('border') as unknown as IWindowContainer;
    }

    // AS3: WiredStyle.as::createSurroundingBorder()
    createSurroundingBorder(): IWindowContainer
    {
        const border = this.createBorder();

        if(this.surroundingBorderStyleId > 0) border.style = this.surroundingBorderStyleId;

        return border;
    }

    // AS3: WiredStyle.as::createContainerButton()
    createContainerButton(): IIconButtonWindow
    {
        return this.recreateElement('container_button') as unknown as IIconButtonWindow;
    }

    // The AS3 dereferences the lookup with no check, and so does this — a style that cannot build
    // its own widget has nothing to return. What is added is the sentence saying WHICH element is
    // missing from WHICH skin: the styles do not all carry the same children (illumina shipped
    // without `border` until the AIR copy replaced it), so the bare null dereference names neither.
    // AS3: WiredStyle.as::recreateElement()
    private recreateElement(name: string): IWindow
    {
        const template = this.styleTemplate!;
        const original = template.findChildByName(name)!;

        if(original === null) log.warn(`${this.constructor.name} has no template element "${name}"`);

        const clone = original.clone();

        clone.visible = true;

        return clone;
    }

    // AS3: WiredStyle.as::createTradeRequirementRule()
    createTradeRequirementRule(): IWindowContainer
    {
        return this.recreateElement('requirement_rule') as unknown as IWindowContainer;
    }

    // AS3: WiredStyle.as::createProductIconPreviewer()
    createProductIconPreviewer(): IWindowContainer
    {
        return this.recreateElement('product_icon_previewer') as unknown as IWindowContainer;
    }
}
