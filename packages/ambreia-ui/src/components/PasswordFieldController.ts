import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import {TextFieldController} from './TextFieldController';
import type {WindowEvent} from '../events/WindowEvent';

/**
 * Controller for password field windows.
 *
 * Extends TextFieldController with password display mode. The hidden
 * input element is set to type="password" so text is masked in the DOM.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/PasswordFieldController.as
 */
export class PasswordFieldController extends TextFieldController
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
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);

        this.displayAsPassword = true;
    }
}
