import type {IWindow} from './IWindow';
import type {IIterable} from './utils/IIterable';

/**
 * Container window interface.
 *
 * Extends IWindow with child management: add, remove, find, group, iteration.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as
 */
export interface IWindowContainer extends IWindow, IIterable {
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::get numChildren()
    readonly numChildren: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::addChild()
    addChild(child: IWindow): IWindow;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::addChildAt()
    addChildAt(child: IWindow, index: number): IWindow;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::getChildAt()
    getChildAt(index: number): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::getChildByID()
    getChildByID(id: number): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::getChildByTag()
    getChildByTag(tag: string): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::getChildByName()
    getChildByName(name: string): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::getChildIndex()
    getChildIndex(child: IWindow): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::findChildByTag()
    findChildByTag(tag: string): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::findChildByName()
    findChildByName(name: string): IWindow | null;

    enableLookupCache(): void;
    
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::removeChild()
    removeChild(child: IWindow): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::removeChildAt()
    removeChildAt(index: number): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::setChildIndex()
    setChildIndex(child: IWindow, index: number): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::swapChildren()
    swapChildren(a: IWindow, b: IWindow): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::swapChildrenAt()
    swapChildrenAt(indexA: number, indexB: number): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::groupChildrenWithID()
    groupChildrenWithID(id: number, result: IWindow[], depth?: number): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::groupChildrenWithTag()
    groupChildrenWithTag(tag: string, result: IWindow[], depth?: number): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::getChildUnderPoint()
    getChildUnderPoint(point: { x: number; y: number }): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContainer.as::groupChildrenUnderPoint()
    groupChildrenUnderPoint(point: { x: number; y: number }, result: IWindow[]): void;
}
