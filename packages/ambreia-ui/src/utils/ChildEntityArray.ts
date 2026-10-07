import type {IWindow} from '../IWindow';

/**
 * Array wrapper for managing child windows.
 *
 * Provides indexed access, add/remove, reordering, and swap
 * operations for child window lists. Mirrors the AS3 ChildEntityArray
 * that extended an internal array base class.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/ChildEntityArray.as
 */
export class ChildEntityArray
{
    private _children: IWindow[] = [];

    /**
	 * Returns the internal children array.
	 */
    public get children(): IWindow[]
    {
        return this._children;
    }

    /**
	 * Returns the number of children.
	 */
    public get length(): number
    {
        return this._children.length;
    }

    /**
	 * Appends a child to the end.
	 *
	 * @param child - The child window to add
	 * @returns The added child
	 */
    // AS3: .../src/com/sulake/core/window/utils/ChildEntityArray.as::addChild()
    public addChild(child: IWindow): IWindow
    {
        this._children.push(child);

        return child;
    }

    /**
	 * Inserts a child at the given index.
	 *
	 * @param child - The child window to add
	 * @param index - The insertion index
	 * @returns The added child
	 */
    // AS3: .../src/com/sulake/core/window/utils/ChildEntityArray.as::addChildAt()
    public addChildAt(child: IWindow, index: number): IWindow
    {
        this._children.splice(index, 0, child);

        return child;
    }

    /**
	 * Removes a child from the array.
	 *
	 * @param child - The child window to remove
	 * @returns The removed child, or null if not found
	 */
    // AS3: .../src/com/sulake/core/window/utils/ChildEntityArray.as::removeChild()
    public removeChild(child: IWindow): IWindow | null
    {
        const index = this._children.indexOf(child);

        if(index < 0)
        {
            return null;
        }

        this._children.splice(index, 1);

        return child;
    }

    /**
	 * Removes the child at the given index.
	 *
	 * @param index - The index to remove
	 * @returns The removed child, or null if index is invalid
	 */
    // AS3: .../src/com/sulake/core/window/utils/ChildEntityArray.as::removeChildAt()
    public removeChildAt(index: number): IWindow | null
    {
        const child = this._children[index];

        if(child != null)
        {
            this._children.splice(index, 1);

            return child;
        }

        return null;
    }

    /**
	 * Returns the child at the given index.
	 *
	 * @param index - The index to read
	 * @returns The child window at that index
	 */
    public getChildAt(index: number): IWindow
    {
        return this._children[index];
    }

    /**
	 * Returns the index of the given child.
	 *
	 * @param child - The child window to find
	 * @returns The index, or -1 if not found
	 */
    public indexOf(child: IWindow): number
    {
        return this._children.indexOf(child);
    }

    /**
	 * Moves a child to a new index position.
	 *
	 * @param child - The child to move
	 * @param index - The target index
	 */
    // AS3: .../src/com/sulake/core/window/utils/ChildEntityArray.as::setChildIndex()
    public setChildIndex(child: IWindow, index: number): void
    {
        const current = this._children.indexOf(child);

        if(current > -1 && index !== current)
        {
            this._children.splice(current, 1);
            this._children.splice(index, 0, child);
        }
    }

    /**
	 * Swaps the positions of two children.
	 *
	 * @param a - First child
	 * @param b - Second child
	 */
    // AS3: .../src/com/sulake/core/window/utils/ChildEntityArray.as::swapChildren()
    public swapChildren(a: IWindow, b: IWindow): void
    {
        if(!a || !b || a === b)
        {
            return;
        }

        let indexA = this._children.indexOf(a);
        let indexB = this._children.indexOf(b);

        if(indexA < 0 || indexB < 0)
        {
            return;
        }

        if(indexB < indexA)
        {
            const temp = a;
            a = b;
            b = temp;
            const tmpIdx = indexA;
            indexA = indexB;
            indexB = tmpIdx;
        }

        this._children.splice(indexB, 1);
        this._children.splice(indexA, 1);
        this._children.splice(indexA, 0, b);
        this._children.splice(indexB, 0, a);
    }

    /**
	 * Swaps children at two index positions.
	 *
	 * @param indexA - First index
	 * @param indexB - Second index
	 */
    // AS3: .../src/com/sulake/core/window/utils/ChildEntityArray.as::swapChildrenAt()
    public swapChildrenAt(indexA: number, indexB: number): void
    {
        this.swapChildren(this._children[indexA], this._children[indexB]);
    }
}
