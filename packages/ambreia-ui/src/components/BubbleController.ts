import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IBubbleWindow} from './IBubbleWindow';
import type {WindowController} from '../WindowController';
import type {WindowEvent} from '../events/WindowEvent';
import type {PropertyStruct} from '../utils/PropertyStruct';
import {FrameController} from './FrameController';

/**
 * Controller for bubble windows with directional pointers.
 *
 * Extends FrameController with pointer elements (up, down, left, right)
 * that can be positioned relative to the bubble. Used for speech bubbles,
 * tooltips with arrows, etc.
 *
 * @see sources/win63_version/core/window/components/BubbleController.as
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::BubbleController
export class BubbleController extends FrameController implements IBubbleWindow
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::TAG_POINTER_UP_ELEMENT
    private static readonly TAG_POINTER_UP_ELEMENT: string = '_POINTER_UP';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::TAG_POINTER_DOWN_ELEMENT
    private static readonly TAG_POINTER_DOWN_ELEMENT: string = '_POINTER_DOWN';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::TAG_POINTER_LEFT_ELEMENT
    private static readonly TAG_POINTER_LEFT_ELEMENT: string = '_POINTER_LEFT';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::TAG_POINTER_RIGHT_ELEMENT
    private static readonly TAG_POINTER_RIGHT_ELEMENT: string = '_POINTER_RIGHT';

    // AS3: sources/win63_version/core/window/components/BubbleController.as::var_81
    private _direction: string | null = null;
    // AS3: sources/win63_version/core/window/components/BubbleController.as::_pointerOffset
    private _pointerOffset: number | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::BubbleController()
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

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::BubbleController()
    protected override finalize(): void
    {
        super.finalize();

        this._direction ??= 'down';
        this._pointerOffset ??= 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::get direction()
    public get direction(): string
    {
        return this._direction ?? 'down';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::set direction()
    public set direction(value: string)
    {
        const currentDirection = this.direction;

        if(value !== currentDirection)
        {
            const newPointer = this.getChildByName(value);

            if(!newPointer)
            {
                throw new Error('Invalid pointer direction: "' + value + '"!');
            }

            const oldPointer = this.getChildByName(currentDirection);

            if(oldPointer)
            {
                oldPointer.visible = false;
            }

            newPointer.visible = true;
            this._direction = value;
            // Not a no-op: re-invokes the setter to reposition the now-visible pointer at the
            // current offset for the new direction (the setter reads `this.direction`).
            // eslint-disable-next-line no-self-assign
            this.pointerOffset = this.pointerOffset;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::get pointerOffset()
    public get pointerOffset(): number
    {
        return this._pointerOffset ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::set pointerOffset()
    public set pointerOffset(value: number)
    {
        const direction = this.direction;
        const pointer = this.getChildByName(direction);
        const parsedOffset = Number(value);
        const offset = Number.isFinite(parsedOffset) ? parsedOffset : 0;

        if(!pointer)
        {
            throw new Error('Invalid pointer direction: "' + direction + '"!');
        }

        if(direction === 'up' || direction === 'down')
        {
            pointer.x = (this.width / 2) + offset;
        }
        else
        {
            pointer.y = (this.height / 2) + offset;
        }

        this._pointerOffset = offset;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::get properties()
    public override get properties(): unknown[]
    {
        const props = super.properties;

        props.push(this.createProperty('direction', this.direction));
        props.push(this.createProperty('pointer_offset', this.pointerOffset));

        return props;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::set properties()
    public override set properties(value: unknown[])
    {
        for(const item of value)
        {
            const prop = item as PropertyStruct;

            switch(prop.key)
            {
                case 'direction':
                    this.direction = prop.value as string;
                    break;
                case 'pointer_offset':
                    this.pointerOffset = prop.value as number;
                    break;
            }
        }

        super.properties = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/BubbleController.as::update()
    public override update(source: WindowController, event: WindowEvent): boolean
    {
        const result = super.update(source, event);
        const pointerOffset = this.pointerOffset;

        if(pointerOffset !== 0)
        {
            if(source === (this as unknown))
            {
                if(event.type === 'WE_RESIZED')
                {
                    this.pointerOffset = pointerOffset;
                }
            }
        }

        return result;
    }
}
