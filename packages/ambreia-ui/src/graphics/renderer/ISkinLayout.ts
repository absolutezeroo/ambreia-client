import type {IChildEntityArray} from '../../utils/IChildEntityArray';

/**
 * A skin layout: the entities that make up one drawable state, plus the size
 * and stretch rules derived from them.
 *
 * `SkinLayout` in this port keeps its entities in `entities`/`addEntity()`
 * rather than the `IChildEntityArray` contract, so it does not declare
 * `implements ISkinLayout`; every other member here it does provide.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as
 */
export interface ISkinLayout extends IChildEntityArray
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::get name()
    readonly name: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::get width()
    readonly width: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::get height()
    readonly height: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::get blendMode()
    readonly blendMode: string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::get transparent()
    readonly transparent: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::dispose()
    dispose(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::isFixedWidth()
    isFixedWidth(): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::isFixedHeight()
    isFixedHeight(): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/renderer/ISkinLayout.as::getDefaultRegion()
    getDefaultRegion(name: string, out: { x: number; y: number; width: number; height: number }): void;
}
