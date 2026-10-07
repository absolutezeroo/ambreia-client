import type {IWindow} from '../../../IWindow';
import type {IWindowContainer} from '../../../IWindowContainer';
import type {IRegionWindow} from '../../../components/IRegionWindow';
import type {ITextWindow} from '../../../components/ITextWindow';
import type {ITextFieldWindow} from '../../../components/ITextFieldWindow';

/**
 * CellTemplate — holds the detached child windows of a table cell's region template (highlight border,
 * text, input, link container, extra button) and clones+re-aligns them into a target cell container on
 * demand. The template children are removed from the source region on construction so the region can
 * be cloned as an empty shell.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/tableview/CellTemplate.as
 */
export class CellTemplate
{
    // AS3: CellTemplate.as::_SafeStr_5965 (name derived: the cell region template)
    private _region: IRegionWindow;

    // AS3: CellTemplate.as::_highlightBorderTemplate
    private _highlightBorderTemplate: IWindowContainer;

    // AS3: CellTemplate.as::_SafeStr_8426 (name derived: element text template)
    private _elementText: ITextWindow;

    // AS3: CellTemplate.as::_SafeStr_8773 (name derived: element input template)
    private _elementInput: ITextFieldWindow;

    // AS3: CellTemplate.as::_SafeStr_8566 (name derived: link container template)
    private _linkContainer: IRegionWindow;

    // AS3: CellTemplate.as::_SafeStr_8602 (name derived: extra button template)
    private _extraButton: IRegionWindow;

    // AS3: CellTemplate.as::CellTemplate()
    constructor(region: IRegionWindow)
    {
        this._region = region;
        this._highlightBorderTemplate = region.findChildByName('highlight_border') as unknown as IWindowContainer;
        this._elementText = region.findChildByName('element_text') as unknown as ITextWindow;
        this._elementInput = region.findChildByName('element_input') as unknown as ITextFieldWindow;
        this._linkContainer = region.findChildByName('link_container') as unknown as IRegionWindow;
        this._extraButton = region.findChildByName('extra_button') as unknown as IRegionWindow;
        this._region.removeChild(this._extraButton);
        this._region.removeChild(this._linkContainer);
        this._region.removeChild(this._elementInput);
        this._region.removeChild(this._elementText);
        this._region.removeChild(this._highlightBorderTemplate);
    }

    // AS3: CellTemplate.as::clone()
    clone(): IRegionWindow
    {
        return this._region.clone() as unknown as IRegionWindow;
    }

    // AS3: CellTemplate.as::createHighlightBorder()
    createHighlightBorder(target: IWindowContainer): IWindowContainer
    {
        return this.fixAlignmentsAndAdd(this._highlightBorderTemplate, target) as unknown as IWindowContainer;
    }

    // AS3: CellTemplate.as::createElementText()
    createElementText(target: IWindowContainer): ITextWindow
    {
        return this.fixAlignmentsAndAdd(this._elementText, target) as unknown as ITextWindow;
    }

    // AS3: CellTemplate.as::createElementInput()
    createElementInput(target: IWindowContainer): ITextFieldWindow
    {
        return this.fixAlignmentsAndAdd(this._elementInput, target) as unknown as ITextFieldWindow;
    }

    // AS3: CellTemplate.as::createLinkContainer()
    createLinkContainer(target: IWindowContainer): IRegionWindow
    {
        return this.fixAlignmentsAndAdd(this._linkContainer, target) as unknown as IRegionWindow;
    }

    // AS3: CellTemplate.as::createExtraButton()
    createExtraButton(target: IWindowContainer): IRegionWindow
    {
        return this.fixAlignmentsAndAdd(this._extraButton, target) as unknown as IRegionWindow;
    }

    // AS3: CellTemplate.as::fixAlignmentsAndAdd()
    // Clones the template and repositions it inside `target` per its window param alignment bits
    // (0xC0 mask): 0x80 stretch-width right, 0x40 shift-x right, 0xC0 center (or left-pin when the
    // target is narrower and the fill flag 0x10 is set).
    private fixAlignmentsAndAdd(template: IWindow, target: IWindowContainer): IWindow
    {
        const delta = target.width - this._region.width;
        const clone = template.clone();
        const param = template.param;
        let x = template.x;
        let width = template.width;
        const flag = param & 0xC0;

        if(flag === 128)
        {
            width += delta;
        }
        else if(flag === 64)
        {
            x += delta;
        }
        else if(flag === 192)
        {
            if(target.width < template.width && template.getParamFlag(16))
            {
                x = 0;
            }
            else
            {
                x = Math.floor(target.width / 2) - Math.floor(width / 2);
            }
        }

        clone.x = x;
        clone.width = width;
        target.addChild(clone);
        return clone;
    }
}
