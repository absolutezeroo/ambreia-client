import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import {SelectableController} from './SelectableController';

/**
 * Controller for checkbox windows.
 *
 * Toggles selected state on mouse up (WME_UP) event.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/CheckBoxController.as
 */
export class CheckBoxController extends SelectableController
{
    // AS3: .../src/com/sulake/core/window/components/CheckBoxController.as::TEXT_FIELD_NAME
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

    public override update(source: WindowController, event: WindowEvent): boolean
    {
        if(source === (this as unknown))
        {
            switch(event.type)
            {
                case 'WME_UP':
                    if(this.isSelected)
                    {
                        this.unselect();
                    }
                    else
                    {
                        this.select();
                    }
                    break;
            }
        }

        return super.update(source, event);
    }
}
