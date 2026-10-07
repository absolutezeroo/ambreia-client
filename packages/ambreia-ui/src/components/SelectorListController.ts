import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {ISelectorListWindow} from './ISelectorListWindow';
import type {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {SelectorController} from './SelectorController';

/**
 * Controller for selector list windows.
 *
 * Extends SelectorController with automatic layout of selectable
 * children in either horizontal or vertical orientation.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/SelectorListController.as
 */
export class SelectorListController extends SelectorController implements ISelectorListWindow
{
    private _updating: boolean = false;

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

        this._bringToFront = false;
    }

    protected _spacing: number = 0;

    /**
	 * The spacing between selectable children.
	 */
    // AS3: .../src/com/sulake/core/window/components/SelectorListController.as::get spacing()
    public get spacing(): number
    {
        return this._spacing;
    }

    // AS3: .../src/com/sulake/core/window/components/SelectorListController.as::set spacing()
    public set spacing(value: number)
    {
        this._spacing = value;
        this.updateSelectableRegion();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/SelectorListController.as::_vertical
    private _vertical: boolean = false;

    /**
	 * Whether children are arranged vertically.
	 */
    // AS3: .../src/com/sulake/core/window/components/SelectorListController.as::get vertical()
    public get vertical(): boolean
    {
        return this._vertical;
    }

    // AS3: .../src/com/sulake/core/window/components/SelectorListController.as::set vertical()
    public set vertical(value: boolean)
    {
        this._vertical = value;
        this.updateSelectableRegion();
    }

    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('spacing', this._spacing));
        props.push(this.createProperty('vertical', this._vertical));

        return props;
    }

    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'spacing':
                    if(prop.value !== this._spacing)
                    {
                        this.spacing = prop.value as number;
                    }
                    break;
                case 'vertical':
                    if(prop.value !== this._vertical)
                    {
                        this.vertical = prop.value as boolean;
                    }
                    break;
            }
        }

        super.properties = value;
    }

    public override update(source: WindowController, event: WindowEvent): boolean
    {
        if(event.type === 'WE_CHILD_ADDED')
        {
            this.updateSelectableRegion();
        }
        else if(event.type === 'WE_CHILD_RESIZED')
        {
            this.updateSelectableRegion();
        }
        else if(event.type === 'WE_CHILD_RELOCATED')
        {
            this.updateSelectableRegion();
        }
        else if(event.type === 'WE_CHILD_REMOVED')
        {
            this.updateSelectableRegion();
        }

        return super.update(source, event);
    }

    /**
	 * Re-arranges children along the main axis.
	 */
    // AS3: .../src/com/sulake/core/window/components/SelectorListController.as::updateSelectableRegion()
    private updateSelectableRegion(): void
    {
        if(this._updating)
        {
            return;
        }

        this._updating = true;

        const count = this.numSelectables;
        let offset: number = 0;

        for(let i = 0; i < count; i++)
        {
            const child = this.getSelectableAt(i) as unknown as IWindow;

            if(child)
            {
                if(this._vertical)
                {
                    child.y = offset;
                    offset += child.height + this._spacing;
                }
                else
                {
                    child.x = offset;
                    offset += child.width + this._spacing;
                }
            }
        }

        this._updating = false;
    }
}
