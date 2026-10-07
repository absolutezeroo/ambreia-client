import type {IChildEntity} from './IChildEntity';
import type {IChildEntityArrayReader} from './IChildEntityArrayReader';

/**
 * A mutable child-entity list: the reader, plus the operations that reorder it.
 *
 * `ChildEntityArray` in this port is typed to `IWindow` and exposes
 * `children`/`length` rather than this contract, so it does not declare
 * `implements IChildEntityArray` — the shapes differ. The interface is
 * declared here because AS3 has it and `ISkinTemplate`/`ISkinLayout` extend it.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IChildEntityArray.as
 */
export interface IChildEntityArray extends IChildEntityArrayReader
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IChildEntityArray.as::addChild()
    addChild(child: IChildEntity): IChildEntity;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IChildEntityArray.as::addChildAt()
    addChildAt(child: IChildEntity, index: number): IChildEntity;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IChildEntityArray.as::removeChild()
    removeChild(child: IChildEntity): IChildEntity;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IChildEntityArray.as::removeChildAt()
    removeChildAt(index: number): IChildEntity;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IChildEntityArray.as::setChildIndex()
    setChildIndex(child: IChildEntity, index: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IChildEntityArray.as::swapChildren()
    swapChildren(a: IChildEntity, b: IChildEntity): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/utils/IChildEntityArray.as::swapChildrenAt()
    swapChildrenAt(indexA: number, indexB: number): void;
}
