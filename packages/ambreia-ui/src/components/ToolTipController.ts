import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IToolTipWindow} from './IToolTipWindow';
import type {WindowEvent} from '../events/WindowEvent';
import {ButtonController} from './ButtonController';

/**
 * Controller for tooltip windows.
 *
 * Extends ButtonController with the expand-to-accommodate flag set.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ToolTipController.as
 */
export class ToolTipController extends ButtonController implements IToolTipWindow
{
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
        param = param | 0x020000;
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }
}
