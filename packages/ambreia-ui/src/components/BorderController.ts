import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import {ContainerController} from './ContainerController';
import type {WindowEvent} from '../events/WindowEvent';

/**
 * Controller for border windows.
 *
 * A container that renders decorative borders around its children.
 * Extends ContainerController to hold child elements within the
 * bordered area.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BorderController.as
 */
export class BorderController extends ContainerController
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
        id: number = 0,
        _dynamicStyle: string = ''
    )
    {
        super(name, type, style, param, context, rect, parent, procedure, tags, properties, id);
    }
}
