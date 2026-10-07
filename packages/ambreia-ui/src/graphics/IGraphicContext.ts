import type {IDisposable} from "@ambreia/common/IDisposable";

/**
 * Interface for a graphic context: a node of the window system's own render
 * tree, owning the draw buffer its window renders into.
 *
 * In AS3 the implementation extends `Sprite` and the buffer is the `BitmapData`
 * of a child `Bitmap`. The port has no Flash display list, so the buffer is an
 * `OffscreenCanvas` and child contexts live in an array — see
 * `GraphicContext` for what that costs and what it keeps.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/IGraphicContext.as
 */
export interface IGraphicContext extends IDisposable
{
    // DEVIATION: the AS3 interface declares five display-list members this one does not: `get
    //   parent` / `set parent` (a `DisplayObjectContainer`), `getDisplayObject` /
    //   `setDisplayObject`, and `getAbsoluteMousePosition` / `getRelativeMousePosition`. Their
    //   implementations read `getChildAt(0)`, `stage.mouseX` and
    //   `DisplayObjectContainer.addChild()`. The port has no Flash display list — `WindowComposite`
    //   composites the window tree onto one canvas and `MouseEventProcessor` owns the pointer
    //   position — so there is no object to hand back and no stage to read. `IWindow` carries the
    //   two mouse-position methods, which is where the port's callers ask for them.
    //   `GraphicContext.ts` says the same beside its own implementation; it is repeated here
    //   because the members are declared on *this* file's AS3 counterpart, and a note on the
    //   implementation does not account for an interface's members.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/IGraphicContext.as::getDisplayObject()
    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::get filters()
    filters: unknown[];
    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::get visible()
    visible: boolean;
    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::get blend()
    blend: number;
    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::get mouse()
    mouse: boolean;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::get numChildContexts()
    readonly numChildContexts: number;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::offSet()
    // Spelled `offset` here, and takes the two coordinates rather than AS3's `Point` — the port has
    // no `flash.geom.Point`, and every caller passes a pair.
    offset(x: number, y: number): void;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::getDrawRegion()
    getDrawRegion(): { x: number; y: number; width: number; height: number };

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::fetchDrawBuffer()
    fetchDrawBuffer(): OffscreenCanvas | null;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::allocateDrawBuffer()
    allocateDrawBuffer(width: number, height: number): OffscreenCanvas | null;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::releaseDrawBuffer()
    releaseDrawBuffer(): void;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::setDrawRegion()
    setDrawRegion(
        rect: { x: number; y: number; width: number; height: number },
        reallocate: boolean,
        maskRect: { x: number; y: number; width: number; height: number } | null
    ): OffscreenCanvas | null;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::getChildContextByName()
    getChildContextByName(name: string): IGraphicContext | null;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::showRedrawRegion()
    showRedrawRegion(rect: { x: number; y: number; width: number; height: number } | null): void;

    // TS-only: AS3 strokes the region into its own `graphics` inside showRedrawRegion() and keeps
    // no accessor. This port has no display list there, so the region is read back at composite
    // time instead — see `WindowComposite.drawRedrawRegionOverlay()`.
    readonly redrawRegion: { x: number; y: number; width: number; height: number } | null;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::addChildContext()
    addChildContext(context: IGraphicContext): IGraphicContext;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::addChildContextAt()
    addChildContextAt(context: IGraphicContext, index: number): IGraphicContext;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::getChildContextAt()
    getChildContextAt(index: number): IGraphicContext;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::getChildContextIndex()
    getChildContextIndex(context: IGraphicContext): number;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::removeChildContext()
    removeChildContext(context: IGraphicContext): IGraphicContext;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::removeChildContextAt()
    removeChildContextAt(index: number): IGraphicContext;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::setChildContextIndex()
    setChildContextIndex(context: IGraphicContext, index: number): void;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::swapChildContexts()
    swapChildContexts(a: IGraphicContext, b: IGraphicContext): void;

    // AS3: .../src/com/sulake/core/window/graphics/IGraphicContext.as::swapChildContextsAt()
    swapChildContextsAt(indexA: number, indexB: number): void;
}
