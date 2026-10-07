import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IRadioButtonWindow} from './IRadioButtonWindow';
import type {ITextWindow} from './ITextWindow';
import type {WindowEvent} from '../events/WindowEvent';
import {SelectableController} from './SelectableController';

/**
 * Controller for radio button windows.
 *
 * Extends SelectableController with IRadioButtonWindow compliance.
 * Radio buttons are grouped by their parent ISelectorWindow for
 * mutual exclusion.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/RadioButtonController.as
 */
export class RadioButtonController extends SelectableController implements IRadioButtonWindow
{
    // AS3: .../src/com/sulake/core/window/components/RadioButtonController.as::TEXT_FIELD_NAME
    protected static readonly TEXT_FIELD_NAME: string = '_CAPTION_TEXT';

    constructor(
        name: string,
        type: number,
        style: number,
        param: number,
        context: IWindowContext,
        rect: { x: number; y: number; width: number; height: number },
        parent: IWindow | null = null,
        procedure: ((event: WindowEvent, window: IWindow) => void) | null = null,
        tags: string[] | null = null,
        properties: unknown[] | null = null,
        id: number = 0
    )
    {
        param = param | 0x01;
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }

    public override get caption(): string
    {
        return super.caption;
    }

    public override set caption(value: string)
    {
        super.caption = value;

        const textChild = this.getChildByName('_CAPTION_TEXT');

        if(textChild !== null)
        {
            textChild.caption = this.caption;
        }
    }

    /**
	 * Syncs the _CAPTION_TEXT child width when the rectangle changes.
	 */
    public override setRectangle(x: number, y: number, width: number, height: number): void
    {
        super.setRectangle(x, y, width, height);

        const textChild = this.getChildByName('_CAPTION_TEXT') as ITextWindow | null;

        if(textChild !== null)
        {
            textChild.width = width;
        }
    }
}
