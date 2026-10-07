import type {IWindowRenderer} from './IWindowRenderer';
import type {ISkinContainer} from './ISkinContainer';
import type {IWindow} from '../IWindow';
import type {IWindowContext} from '../IWindowContext';
import type {IWindowContainer} from '../IWindowContainer';
import type {IGraphicContextHost} from './IGraphicContextHost';
import {WindowParam} from '../enum/WindowParam';
import {WindowDisposeEvent} from '../events/WindowDisposeEvent';
import {WindowRendererItem} from './WindowRendererItem';

type Point = { x: number; y: number };
type Rectangle = { x: number; y: number; width: number; height: number };

/**
 * Window renderer managing per-window draw buffers and compositing.
 *
 * The render queue, dirty-region merge, branch traversal, and clipping logic
 * follow the AS3 win63 implementation.
 *
 * @see sources/win63_version/core/window/graphics/WindowRenderer.as
 */
export class WindowRenderer implements IWindowRenderer
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::RECT
    private static readonly RECT: Rectangle = {x: 0, y: 0, width: 0, height: 0};
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::MAX_DIRTY_REGIONS_PER_WINDOW
    private static readonly MAX_DIRTY_REGIONS_PER_WINDOW: number = 3;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::MAX_DISTANCE_BEFORE_COMBINE
    private static readonly MAX_DISTANCE_BEFORE_COMBINE: number = 10;

    private _debug: boolean = false;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::_disposed
    private _disposed: boolean = false;
    private _renderVersion: number = 0;

    private _skinContainer: ISkinContainer;
    private _rendererItems: Map<IWindow, WindowRendererItem>;

    private _renderQueue: IWindow[];
    private _dirtyRegions: Rectangle[][];
    private _renderQueueIndices: Map<IWindow, number>;

    private _drawLocation: Point;
    private _clipRegion: Rectangle;
    private _dirtyRegion: Rectangle;
    private _visibleRegion: Rectangle;

    private _windowDisposedCallback: (event: WindowDisposeEvent) => void;

    constructor(skinContainer: ISkinContainer)
    {
        this._skinContainer = skinContainer;
        this._rendererItems = new Map<IWindow, WindowRendererItem>();

        this._renderQueue = [];
        this._dirtyRegions = [];
        this._renderQueueIndices = new Map<IWindow, number>();

        this._drawLocation = {x: 0, y: 0};
        this._clipRegion = {x: 0, y: 0, width: 0, height: 0};
        this._dirtyRegion = {x: 0, y: 0, width: 0, height: 0};
        this._visibleRegion = {x: 0, y: 0, width: 0, height: 0};

        this._windowDisposedCallback = this.windowDisposedCallback.bind(this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::get disposed()
    public get disposed(): boolean
    {
        return this._disposed;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::get debug()
    public get debug(): boolean
    {
        return this._debug;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::set debug()
    public set debug(value: boolean)
    {
        this._debug = value;
    }

    public get renderVersion(): number
    {
        return this._renderVersion;
    }

    public hasPendingUpdates(): boolean
    {
        return this._renderQueue.length > 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::areRectanglesCloseEnough()
    private static areRectanglesCloseEnough(a: Rectangle, b: Rectangle, distance: number): boolean
    {
        if((a.x < (b.x + b.width))
            && ((a.x + a.width) > b.x)
            && (a.y < (b.y + b.height))
            && ((a.y + a.height) > b.y))
        {
            return true;
        }

        const dx = (a.x > b.x) ? (a.x - (b.x + b.width)) : (b.x - (a.x + a.width));
        const dy = (a.y > b.y) ? (a.y - (b.y + b.height)) : (b.y - (a.y + a.height));

        return (dx <= distance) && (dy <= distance);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::childRectToClippedDrawRegion()
    private static childRectToClippedDrawRegion(window: IWindow, drawLocation: Point, clipRegion: Rectangle): boolean
    {
        if(window.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT))
        {
            const renderingX = window.renderingX;
            const renderingY = window.renderingY;

            drawLocation.x += renderingX;
            drawLocation.y += renderingY;

            if(window.clipping)
            {
                if(drawLocation.x < renderingX)
                {
                    const delta = renderingX - drawLocation.x;

                    clipRegion.x += delta;
                    clipRegion.width -= delta;
                    drawLocation.x = renderingX;
                }

                if(drawLocation.x < 0)
                {
                    clipRegion.x -= drawLocation.x;
                    clipRegion.width += drawLocation.x;
                    drawLocation.x = 0;
                }

                if(drawLocation.y < renderingY)
                {
                    const delta = renderingY - drawLocation.y;

                    clipRegion.y += delta;
                    clipRegion.height -= delta;
                    drawLocation.y = renderingY;
                }

                if(drawLocation.y < 0)
                {
                    clipRegion.y -= drawLocation.y;
                    clipRegion.height += drawLocation.y;
                    drawLocation.y = 0;
                }

                if((drawLocation.x + clipRegion.width) > (renderingX + window.renderingWidth))
                {
                    clipRegion.width -= ((drawLocation.x + clipRegion.width) - (renderingX + window.renderingWidth));
                }

                if((drawLocation.y + clipRegion.height) > (renderingY + window.renderingHeight))
                {
                    clipRegion.height -= ((drawLocation.y + clipRegion.height) - (renderingY + window.renderingHeight));
                }
            }

            if(window.parent)
            {
                WindowRenderer.childRectToClippedDrawRegion(window.parent, drawLocation, clipRegion);
            }
        }
        else if(window.clipping)
        {
            if(drawLocation.x < 0)
            {
                const delta = drawLocation.x;

                clipRegion.x -= delta;
                clipRegion.width += delta;
                drawLocation.x = 0;
            }

            if(drawLocation.y < 0)
            {
                const delta = drawLocation.y;

                clipRegion.y -= delta;
                clipRegion.height += delta;
                drawLocation.y = 0;
            }
        }

        return (clipRegion.width > 0) && (clipRegion.height > 0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::getDrawLocationAndClipRegion()
    private static getDrawLocationAndClipRegion(window: IWindow, dirtyRegion: Rectangle, drawLocation: Point, clipRegion: Rectangle): boolean
    {
        clipRegion.x = 0;
        clipRegion.y = 0;
        clipRegion.width = window.renderingWidth;
        clipRegion.height = window.renderingHeight;

        let visible = true;

        if(!window.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT))
        {
            if(window.parent && window.testParamFlag(WindowParam.FORCE_CLIPPING))
            {
                visible = WindowRenderer.childRectToClippedDrawRegion(window.parent, drawLocation, clipRegion);
                drawLocation.x = clipRegion.x;
                drawLocation.y = clipRegion.y;
            }
            else
            {
                drawLocation.x = 0;
                drawLocation.y = 0;
            }
        }
        else if(window.parent)
        {
            visible = WindowRenderer.childRectToClippedDrawRegion(window.parent, drawLocation, clipRegion);
        }
        else
        {
            drawLocation.x = 0;
            drawLocation.y = 0;
        }

        if(dirtyRegion.x > clipRegion.x)
        {
            const delta = dirtyRegion.x - clipRegion.x;

            drawLocation.x += delta;
            clipRegion.x += delta;
            clipRegion.width -= delta;
        }

        if(dirtyRegion.y > clipRegion.y)
        {
            const delta = dirtyRegion.y - clipRegion.y;

            drawLocation.y += delta;
            clipRegion.y += delta;
            clipRegion.height -= delta;
        }

        if((dirtyRegion.x + dirtyRegion.width) < (clipRegion.x + clipRegion.width))
        {
            const delta = (clipRegion.x + clipRegion.width) - (dirtyRegion.x + dirtyRegion.width);

            clipRegion.width -= delta;
        }

        if((dirtyRegion.y + dirtyRegion.height) < (clipRegion.y + clipRegion.height))
        {
            const delta = (clipRegion.y + clipRegion.height) - (dirtyRegion.y + dirtyRegion.height);

            clipRegion.height -= delta;
        }

        return visible && (clipRegion.width > 0) && (clipRegion.height > 0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::render()
    public render(): void
    {
        let renderQueueLength = this._renderQueue.length;

        if(renderQueueLength > 0)
        {
            this._renderVersion++;
        }

        while(renderQueueLength-- > 0)
        {
            const window = this._renderQueue.pop();
            const dirtyRegions = this._dirtyRegions.pop();

            if(!window || !dirtyRegions)
            {
                continue;
            }

            this._renderQueueIndices.delete(window);

            if(window.disposed)
            {
                continue;
            }

            const drawBuffer = window.fetchDrawBuffer() as OffscreenCanvas | null;

            for(const dirtyRegion of dirtyRegions)
            {
                this._visibleRegion.x = window.renderingX;
                this._visibleRegion.y = window.renderingY;
                this._visibleRegion.width = window.renderingWidth;
                this._visibleRegion.height = window.renderingHeight;

                this.renderWindowBranch(window, dirtyRegion, this._visibleRegion, drawBuffer);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::addToRenderQueue()
    public addToRenderQueue(window: IWindow, rect: Rectangle | null, flags: number): void
    {
        if(!rect)
        {
            rect = this._dirtyRegion;
            this._dirtyRegion.x = 0;
            this._dirtyRegion.y = 0;
            this._dirtyRegion.width = window.renderingWidth;
            this._dirtyRegion.height = window.renderingHeight;
        }
        else
        {
            this._dirtyRegion.x = rect.x;
            this._dirtyRegion.y = rect.y;
            this._dirtyRegion.width = rect.width;
            this._dirtyRegion.height = rect.height;
        }

        if(this.isRectEmpty(rect))
        {
            return;
        }

        if(this.getWindowRendererItem(window).invalidate(window, flags))
        {
            if(window.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT) || window.testParamFlag(WindowParam.FORCE_CLIPPING))
            {
                const desktop = window.context.getDesktopWindow();

                while(true)
                {
                    const parent = window.parent;

                    if(parent === null)
                    {
                        return;
                    }

                    if(parent === desktop)
                    {
                        break;
                    }

                    if(!parent.visible)
                    {
                        return;
                    }

                    const parentWidth = parent.renderingWidth;
                    const parentHeight = parent.renderingHeight;

                    this.offsetRect(this._dirtyRegion, window.renderingX, window.renderingY);

                    if(parent.clipping)
                    {
                        const dirtyRight = this.rectRight(this._dirtyRegion);
                        const dirtyBottom = this.rectBottom(this._dirtyRegion);

                        if((this._dirtyRegion.x > parentWidth)
                            || (this._dirtyRegion.y > parentHeight)
                            || (dirtyRight < 0)
                            || (dirtyBottom < 0))
                        {
                            return;
                        }

                        if(this._dirtyRegion.x < 0)
                        {
                            this._dirtyRegion.width += this._dirtyRegion.x;
                            this._dirtyRegion.x = 0;
                        }

                        if(this._dirtyRegion.y < 0)
                        {
                            this._dirtyRegion.height += this._dirtyRegion.y;
                            this._dirtyRegion.y = 0;
                        }

                        if(this.rectRight(this._dirtyRegion) > parentWidth)
                        {
                            this._dirtyRegion.width = Math.max(0, parentWidth - this._dirtyRegion.x);
                        }

                        if(this.rectBottom(this._dirtyRegion) > parentHeight)
                        {
                            this._dirtyRegion.height = Math.max(0, parentHeight - this._dirtyRegion.y);
                        }
                    }

                    if(this.isRectEmpty(this._dirtyRegion))
                    {
                        return;
                    }

                    window = parent;

                    if(!window.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT) && !window.testParamFlag(WindowParam.FORCE_CLIPPING))
                    {
                        break;
                    }
                }
            }

            this.getWindowRendererItem(window).invalidate(window, 32);

            const queueIndex = this._renderQueueIndices.get(window);

            if(queueIndex !== undefined)
            {
                const dirtyRegions = this._dirtyRegions[queueIndex];
                let mergedRegion = this._dirtyRegion;
                let count = dirtyRegions.length;

                if(count > WindowRenderer.MAX_DIRTY_REGIONS_PER_WINDOW)
                {
                    const popped = dirtyRegions.pop();

                    if(popped)
                    {
                        mergedRegion = this.unionRect(mergedRegion, popped);
                    }

                    count--;
                }

                let index = 0;

                while(index < count)
                {
                    const existing = dirtyRegions[index];

                    if(WindowRenderer.areRectanglesCloseEnough(existing, mergedRegion, WindowRenderer.MAX_DISTANCE_BEFORE_COMBINE))
                    {
                        dirtyRegions.splice(index, 1);
                        mergedRegion = this.unionRect(mergedRegion, existing);
                        count--;
                        index = 0;
                    }
                    else
                    {
                        index++;
                    }
                }

                dirtyRegions.push((mergedRegion === this._dirtyRegion) ? this.cloneRect(mergedRegion) : mergedRegion);
            }
            else
            {
                const newIndex = this._renderQueue.length;

                this._renderQueue.push(window);
                this._dirtyRegions.push([this.cloneRect(this._dirtyRegion)]);
                this._renderQueueIndices.set(window, newIndex);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::flushRenderQueue()
    public flushRenderQueue(): void
    {
        if(this._renderQueue.length || this._dirtyRegions.length)
        {
            this._renderQueue.length = 0;
            this._dirtyRegions.length = 0;
            this._renderQueueIndices.clear();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::invalidate()
    public invalidate(context: IWindowContext, _rect: Rectangle): void
    {
        const desktop = context.getDesktopWindow() as IWindowContainer | null;

        if(!desktop)
        {
            return;
        }

        let childCount = desktop.numChildren;

        while(childCount-- > 0)
        {
            const child = desktop.getChildAt(childCount);

            if(child)
            {
                this.addToRenderQueue(child, null, 1);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::getDrawBufferForRenderable()
    public getDrawBufferForRenderable(window: IWindow): OffscreenCanvas | null
    {
        let item = this._rendererItems.get(window) ?? null;

        if(!item)
        {
            item = this.registerRenderable(window);
            item.invalidate(window, 1);
            item.render(window);
        }

        return item ? item.buffer : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::purge()
    public purge(window: IWindow | null = null, recursive: boolean = true): void
    {
        if(window)
        {
            if(!window.visible || !recursive)
            {
                const item = this._rendererItems.get(window) ?? null;

                if(item)
                {
                    item.dispose();
                    this._rendererItems.delete(window);
                }

                recursive = false;
            }

            const container = window as unknown as IWindowContainer;

            if(this.isWindowContainer(container))
            {
                for(let i = 0; i < container.numChildren; i++)
                {
                    const child = container.getChildAt(i);

                    if(child)
                    {
                        this.purge(child, recursive);
                    }
                }
            }
        }
        else
        {
            const purgeList: IWindow[] = [];

            for(const candidate of this._rendererItems.keys())
            {
                if((!candidate.visible)
                    || (!recursive)
                    || ((candidate.parent === null) && !this.isDesktopWindow(candidate)))
                {
                    purgeList.push(candidate);
                }
            }

            while(purgeList.length)
            {
                const candidate = purgeList.pop();

                if(candidate)
                {
                    this.purge(candidate, recursive);
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::registerRenderable()
    public registerRenderable(window: IWindow): WindowRendererItem
    {
        let item = this._rendererItems.get(window) ?? null;

        if(item === null)
        {
            item = new WindowRendererItem(this._skinContainer);
            this._rendererItems.set(window, item);
            item.invalidate(window, 8);
        }

        if(!window.hasEventListener(WindowDisposeEvent.WE_DISPOSED))
        {
            window.addEventListener(WindowDisposeEvent.WE_DISPOSED, this._windowDisposedCallback);
        }

        return item;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::removeRenderable()
    public removeRenderable(window: IWindow): void
    {
        window.removeEventListener(WindowDisposeEvent.WE_DISPOSED, this._windowDisposedCallback);

        const item = this._rendererItems.get(window) ?? null;

        if(item !== null)
        {
            item.dispose();
            this._rendererItems.delete(window);
        }
    }

    /**
     * `drawBuffer` is the target AS3 composes this branch into: every window
     * sharing a graphic context draws onto its owner's BitmapData, which is why
     * the parameter is threaded down the recursion.
     *
     * It is **not read** here, and cannot be until the port renders in one
     * stage. `getWindowRendererItem(window).render(window)` below draws each
     * window into its own buffer and `WindowComposite` blits them, so there is
     * no shared target to compose into. The parameter is kept because removing
     * it would erase the shape of AS3's compositing from the signature, and
     * because the day the two render stages merge, this is where the target
     * arrives. `window.fetchDrawBuffer()` feeding it currently yields null for
     * every window — see `GraphicContext`'s constructor note.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::renderWindowBranch()
    private renderWindowBranch(window: IWindow, dirtyRegion: Rectangle, visibleRegion: Rectangle, drawBuffer: OffscreenCanvas | null): void
    {
        const graphicHost = window as unknown as IGraphicContextHost;
        let graphicContext = graphicHost?.getGraphicContext?.(false) ?? null;

        if(graphicContext)
        {
            graphicContext.visible = window.visible;
        }

        if(window.visible)
        {
            this._drawLocation.x = window.renderingX;
            this._drawLocation.y = window.renderingY;

            if(WindowRenderer.getDrawLocationAndClipRegion(window, dirtyRegion, this._drawLocation, this._clipRegion))
            {
                if(window.clipping)
                {
                    visibleRegion = this.intersectionRect(visibleRegion, window.renderingRectangle);
                }

                this.offsetRect(visibleRegion, -window.x, -window.y);
                this.getWindowRendererItem(window).render(window);

                const container = window as unknown as IWindowContainer;

                if(!this.isWindowContainer(container))
                {
                    return;
                }

                if(window.clipping)
                {
                    dirtyRegion = this.cloneRect(dirtyRegion);

                    if(dirtyRegion.x < 0)
                    {
                        dirtyRegion.width += dirtyRegion.x;
                        dirtyRegion.x = 0;
                    }

                    if(dirtyRegion.y < 0)
                    {
                        dirtyRegion.height += dirtyRegion.y;
                        dirtyRegion.y = 0;
                    }

                    if(dirtyRegion.width > window.width)
                    {
                        dirtyRegion.width = window.renderingWidth;
                    }

                    if(dirtyRegion.height > window.height)
                    {
                        dirtyRegion.height = window.renderingHeight;
                    }
                }

                for(let i = 0; i < container.numChildren; i++)
                {
                    const child = container.getChildAt(i);

                    if(!child)
                    {
                        continue;
                    }

                    WindowRenderer.RECT.x = child.x;
                    WindowRenderer.RECT.y = child.y;
                    WindowRenderer.RECT.width = child.width;
                    WindowRenderer.RECT.height = child.height;

                    if(this.intersectsRect(WindowRenderer.RECT, dirtyRegion))
                    {
                        if(child.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT))
                        {
                            this.offsetRect(dirtyRegion, -child.x, -child.y);
                            this.renderWindowBranch(child, dirtyRegion, visibleRegion, drawBuffer);
                            this.offsetRect(dirtyRegion, child.x, child.y);
                        }
                        else if(child.testParamFlag(WindowParam.FORCE_CLIPPING))
                        {
                            this.offsetRect(dirtyRegion, -child.x, -child.y);
                            this.renderWindowBranch(child, dirtyRegion, visibleRegion, child.fetchDrawBuffer() as OffscreenCanvas | null);
                            this.offsetRect(dirtyRegion, child.x, child.y);
                        }
                        else if(child.visible)
                        {
                            const childGraphicHost = child as unknown as IGraphicContextHost;

                            if(childGraphicHost?.hasGraphicsContext?.())
                            {
                                const childItem = this._rendererItems.get(child) ?? null;

                                if(!childItem || childItem.needsRedraw(child))
                                {
                                    this.renderWindowBranch(
                                        child,
                                        {x: 0, y: 0, width: child.renderingWidth, height: child.renderingHeight},
                                        visibleRegion,
                                        child.fetchDrawBuffer() as OffscreenCanvas | null
                                    );
                                }
                                else
                                {
                                    const childGraphicContext = childGraphicHost.getGraphicContext(true);

                                    if(childGraphicContext)
                                    {
                                        childGraphicContext.visible = true;
                                    }
                                }
                            }
                        }
                    }
                    else if(!this.intersectsRect(WindowRenderer.RECT, visibleRegion))
                    {
                        const childGraphicHost = child as unknown as IGraphicContextHost;

                        if(childGraphicHost?.hasGraphicsContext?.())
                        {
                            const childGraphicContext = childGraphicHost.getGraphicContext(true);

                            if(childGraphicContext)
                            {
                                childGraphicContext.visible = false;
                            }
                        }
                    }
                }

                this.offsetRect(visibleRegion, window.renderingX, window.renderingY);
            }
            else if(!window.testParamFlag(WindowParam.USE_PARENT_GRAPHIC_CONTEXT))
            {
                if(window.testParamFlag(WindowParam.FORCE_CLIPPING))
                {
                    if(!graphicContext)
                    {
                        graphicContext = graphicHost?.getGraphicContext?.(true) ?? null;
                    }

                    if(graphicContext)
                    {
                        graphicContext.visible = false;
                    }
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::getWindowRendererItem()
    protected getWindowRendererItem(window: IWindow): WindowRendererItem
    {
        let item = this._rendererItems.get(window) ?? null;

        if(item === null)
        {
            item = this.registerRenderable(window);
        }

        return item;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::windowDisposedCallback()
    protected windowDisposedCallback(event: WindowDisposeEvent): void
    {
        if(event.window)
        {
            this.removeRenderable(event.window);
        }
    }

    private isWindowContainer(target: unknown): target is IWindowContainer
    {
        return !!target
            && (typeof (target as IWindowContainer).numChildren === 'number')
            && (typeof (target as IWindowContainer).getChildAt === 'function');
    }

    private isDesktopWindow(window: IWindow): boolean
    {
        return window.context.getDesktopWindow() === window;
    }

    private cloneRect(rect: Rectangle): Rectangle
    {
        return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
        };
    }

    private rectRight(rect: Rectangle): number
    {
        return rect.x + rect.width;
    }

    private rectBottom(rect: Rectangle): number
    {
        return rect.y + rect.height;
    }

    private isRectEmpty(rect: Rectangle): boolean
    {
        return (rect.width <= 0) || (rect.height <= 0);
    }

    private offsetRect(rect: Rectangle, dx: number, dy: number): void
    {
        rect.x += dx;
        rect.y += dy;
    }

    private intersectsRect(a: Rectangle, b: Rectangle): boolean
    {
        return (a.x < this.rectRight(b))
            && (this.rectRight(a) > b.x)
            && (a.y < this.rectBottom(b))
            && (this.rectBottom(a) > b.y);
    }

    private unionRect(a: Rectangle, b: Rectangle): Rectangle
    {
        const left = Math.min(a.x, b.x);
        const top = Math.min(a.y, b.y);
        const right = Math.max(this.rectRight(a), this.rectRight(b));
        const bottom = Math.max(this.rectBottom(a), this.rectBottom(b));

        return {
            x: left,
            y: top,
            width: Math.max(0, right - left),
            height: Math.max(0, bottom - top),
        };
    }

    private intersectionRect(a: Rectangle, b: Rectangle): Rectangle
    {
        const left = Math.max(a.x, b.x);
        const top = Math.max(a.y, b.y);
        const right = Math.min(this.rectRight(a), this.rectRight(b));
        const bottom = Math.min(this.rectBottom(a), this.rectBottom(b));

        return {
            x: left,
            y: top,
            width: Math.max(0, right - left),
            height: Math.max(0, bottom - top),
        };
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/WindowRenderer.as::dispose()
    public dispose(): void
    {
        if(this._disposed)
        {
            return;
        }

        this._disposed = true;

        for(const [window, item] of this._rendererItems)
        {
            window.removeEventListener(WindowDisposeEvent.WE_DISPOSED, this._windowDisposedCallback);
            item.dispose();
        }

        this._rendererItems.clear();
        this._renderQueue.length = 0;
        this._dirtyRegions.length = 0;
        this._renderQueueIndices.clear();
    }
}
