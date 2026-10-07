import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IBoxSizerWindow} from './IBoxSizerWindow';
import type {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {ContainerController} from './ContainerController';

/**
 * Controller for box sizer windows.
 *
 * Auto-layouts children horizontally or vertically with configurable
 * spacing and padding. Supports relative sizing via child tags.
 *
 * @see sources/win63_version/core/window/components/BoxSizerController.as
 */
export class BoxSizerController extends ContainerController implements IBoxSizerWindow
{
    private _spacing: number = 5;
    private _paddingHorizontal: number = 8;
    private _paddingVertical: number = 8;
    private _vertical: boolean = false;
    private _autoRearrange: boolean = true;

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

    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('spacing', this._spacing));
        props.push(this.createProperty('vertical', this._vertical));
        props.push(this.createProperty('padding_horizontal', this._paddingHorizontal));
        props.push(this.createProperty('padding_vertical', this._paddingVertical));

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
                    this._spacing = prop.value as number;
                    break;
                case 'padding_horizontal':
                    this._paddingHorizontal = prop.value as number;
                    break;
                case 'padding_vertical':
                    this._paddingVertical = prop.value as number;
                    break;
                case 'vertical':
                    this._vertical = prop.value as boolean;
                    break;
            }
        }

        super.properties = value;
        this.arrangeChildren();
    }

    public override update(source: WindowController, event: WindowEvent): boolean
    {
        switch(event.type)
        {
            case 'WE_CHILD_RELOCATED':
            case 'WE_CHILD_REMOVED':
            case 'WE_CHILD_ADDED':
            case 'WE_CHILD_RESIZED':
            case 'WE_RESIZED':
            case 'WE_CHILD_VISIBILITY':
                this.arrangeChildren();
                break;
        }

        return super.update(source, event);
    }

    /**
	 * Sets the horizontal padding.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::setHorizontalPadding()
    public setHorizontalPadding(value: number): void
    {
        this._paddingHorizontal = value;
        this.arrangeChildren();
    }

    /**
	 * Sets the vertical padding.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::setVerticalPadding()
    public setVerticalPadding(value: number): void
    {
        this._paddingVertical = value;
        this.arrangeChildren();
    }

    /**
	 * Sets the spacing between children.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::setSpacing()
    public setSpacing(value: number): void
    {
        this._spacing = value;
        this.arrangeChildren();
    }

    /**
	 * Sets vertical or horizontal layout.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::setVertical()
    public setVertical(value: boolean): void
    {
        this._vertical = value;
        this.arrangeChildren();
    }

    /**
	 * Enables or disables automatic rearrangement.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::setAutoRearrange()
    public setAutoRearrange(value: boolean): void
    {
        this._autoRearrange = value;

        if(value)
        {
            this.arrangeChildren();
        }
    }

    /**
	 * Returns whether automatic rearrangement is enabled.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::getAutoRearrange()
    public getAutoRearrange(): boolean
    {
        return this._autoRearrange;
    }

    /**
	 * Arranges children along the main axis.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::arrangeChildren()
    private arrangeChildren(): void
    {
        if(!this._autoRearrange)
        {
            return;
        }

        let previous: IWindow | null = null;
        const relativeSpace = this.calculateSpaceForRelatives();
        const relativeSum = this.getRelativeValuesSum();

        if(!this._vertical)
        {
            for(let i = 0; i < this.numChildren; i++)
            {
                const child = this.getChildAt(i);

                if(child && child.visible)
                {
                    if(!previous)
                    {
                        child.x = this._paddingHorizontal;
                    }
                    else
                    {
                        child.x = previous.x + previous.width + this._spacing;
                    }

                    child.y = this._paddingVertical;

                    const relValue = this.getRelativeValue(child);

                    if(relValue > 0 && relativeSum > 0)
                    {
                        child.width = (relativeSpace * relValue) / relativeSum;
                    }

                    previous = child;
                }
            }
        }
        else
        {
            for(let i = 0; i < this.numChildren; i++)
            {
                const child = this.getChildAt(i);

                if(child && child.visible)
                {
                    if(!previous)
                    {
                        child.y = this._paddingVertical;
                    }
                    else
                    {
                        child.y = previous.y + previous.height + this._spacing;
                    }

                    child.x = this._paddingHorizontal;

                    const relValue = this.getRelativeValue(child);

                    if(relValue > 0 && relativeSum > 0)
                    {
                        child.height = (relativeSpace * relValue) / relativeSum;
                    }

                    previous = child;
                }
            }
        }
    }

    /**
	 * Extracts the relative sizing value from a child's tags.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::getRelativeValue()
    private getRelativeValue(child: IWindow): number
    {
        let result = 0;

        for(let i = 0; i < child.tags.length; i++)
        {
            const tag = child.tags[i];

            if(tag.indexOf('relative') !== -1)
            {
                const openParen = tag.indexOf('(');
                const closeParen = tag.indexOf(')');

                if(openParen !== -1 && closeParen !== -1)
                {
                    result = parseInt(tag.slice(openParen + 1, closeParen), 10);

                    if(result < 0)
                    {
                        result = 0;
                    }

                    child.tags.splice(i, 1, 'relative(' + result + ')');
                }
            }
        }

        return result;
    }

    /**
	 * Returns the sum of all relative values of visible children.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::getRelativeValuesSum()
    private getRelativeValuesSum(): number
    {
        let sum = 0;

        for(let i = 0; i < this.numChildren; i++)
        {
            const child = this.getChildAt(i);

            if(child && child.visible)
            {
                sum += this.getRelativeValue(child);
            }
        }

        return sum;
    }

    /**
	 * Calculates space available for relatively-sized children.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BoxSizerController.as::calculateSpaceForRelatives()
    private calculateSpaceForRelatives(): number
    {
        let space = this._vertical
            ? (this.height - (this._paddingVertical * 2))
            : (this.width - (this._paddingHorizontal * 2));

        for(let i = 0; i < this.numChildren; i++)
        {
            const child = this.getChildAt(i);

            if(child && child.visible)
            {
                if(this.getRelativeValue(child) === 0)
                {
                    if(this._vertical)
                    {
                        space -= (child.height + this._spacing);
                    }
                    else
                    {
                        space -= (child.width + this._spacing);
                    }
                }
                else
                {
                    space -= this._spacing;
                }
            }
        }

        return space + this._spacing;
    }
}
