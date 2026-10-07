import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IIconButtonWindow} from './IIconButtonWindow';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {InteractiveController} from './InteractiveController';

/**
 * Controller for icon button windows.
 *
 * An interactive button that displays an icon image specified by URL.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IconButtonController.as
 */
export class IconButtonController extends InteractiveController implements IIconButtonWindow
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
    }

    private _imageUrl: string = '';

    /**
	 * The URL of the icon image.
	 */
    public get imageUrl(): string
    {
        return this._imageUrl;
    }

    public set imageUrl(value: string)
    {
        this._imageUrl = value ?? '';
    }

    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('image_url', this._imageUrl));

        return props;
    }

    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'image_url':
                    this._imageUrl = prop.value as string;
                    break;
            }
        }

        super.properties = value;
    }
}
