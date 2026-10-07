import type {IRectLimiter} from './utils/IRectLimiter';
import type {PropertyStruct} from './utils/PropertyStruct';
import type {IWindowContext} from './IWindowContext';
import type {WindowEvent} from './events/WindowEvent';
import type {WindowEventListener} from './events/WindowEventDispatcher';
import type {IDisposable} from "@ambreia/common/IDisposable";

/**
 * Core window interface.
 *
 * Defines the complete API for a window element: position, size, style, state,
 * param, events, hit-testing, children lookup, and coordinate conversion.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as
 */
export interface IWindow extends IDisposable
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get x()
    x: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get y()
    y: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get width()
    width: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get height()
    height: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get position()
    position: { x: number; y: number };
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get rectangle()
    rectangle: { x: number; y: number; width: number; height: number };
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get renderingRectangle()
    readonly renderingRectangle: { x: number; y: number; width: number; height: number };
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get left()
    readonly left: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get top()
    readonly top: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get right()
    readonly right: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get bottom()
    readonly bottom: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get renderingX()
    readonly renderingX: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get renderingY()
    readonly renderingY: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get renderingWidth()
    readonly renderingWidth: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get renderingHeight()
    readonly renderingHeight: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get etchingPoint()
    readonly etchingPoint: { x: number; y: number };

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get id()
    id: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get name()
    name: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get caption()
    caption: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get tags()
    tags: string[];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get type()
    type: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get style()
    style: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get state()
    state: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get param()
    param: number;

    offsetX: number;
    offsetY: number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get visible()
    visible: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get background()
    background: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get color()
    color: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get alpha()
    alpha: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get blend()
    blend: number;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get clipping()
    clipping: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get debug()
    debug: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get filters()
    filters: unknown[];
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get dynamicStyle()
    dynamicStyle: string;
    dynamicStyleColor: {
        redMultiplier: number;
        greenMultiplier: number;
        blueMultiplier: number;
        alphaMultiplier: number;
        redOffset: number;
        greenOffset: number;
        blueOffset: number;
        alphaOffset: number;
    } | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get procedure()
    procedure: ((event: WindowEvent, window: IWindow) => void) | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get mouseThreshold()
    mouseThreshold: number;
    ignoreMouseEvents: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get immediateClickMode()
    immediateClickMode: boolean;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get properties()
    properties: unknown[];
    etching: unknown[];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get parent()
    parent: IWindow | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get context()
    readonly context: IWindowContext;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get desktop()
    readonly desktop: IWindow | null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get host()
    readonly host: IWindow;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::get limits()
    readonly limits: IRectLimiter;

    /**
	 * Returns the target window where layout children should be added.
	 *
	 * Compound elements (frames, tab contexts) override this to redirect
	 * children to their content container instead of themselves.
	 *
	 * @see FrameController.getLayoutChildTarget
	 * @see TabContextController.getLayoutChildTarget
	 */
    getLayoutChildTarget(): IWindow;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::destroy()
    destroy(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::clone()
    clone(): IWindow;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::invalidate()
    invalidate(rect?: { x: number; y: number; width: number; height: number } | null): void;

    resolve(): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::center()
    center(): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::offset()
    offset(dx: number, dy: number): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::scale()
    scale(sx: number, sy: number): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::buildFromXML()
    buildFromXML(layout: string | Document | Element, namedWindows?: Map<string, IWindow> | null): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::fetchDrawBuffer()
    fetchDrawBuffer(): unknown;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getDrawRegion()
    getDrawRegion(out: { x: number; y: number; width: number; height: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getRelativeMousePosition()
    getRelativeMousePosition(out: { x: number; y: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getAbsoluteMousePosition()
    getAbsoluteMousePosition(out: { x: number; y: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getMouseRegion()
    getMouseRegion(out: { x: number; y: number; width: number; height: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getLocalPosition()
    getLocalPosition(out: { x: number; y: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getLocalRectangle()
    getLocalRectangle(out: { x: number; y: number; width: number; height: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::hitTestLocalPoint()
    hitTestLocalPoint(point: { x: number; y: number }): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::hitTestLocalRectangle()
    hitTestLocalRectangle(rect: { x: number; y: number; width: number; height: number }): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getGlobalPosition()
    getGlobalPosition(out: { x: number; y: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::setGlobalPosition()
    setGlobalPosition(point: { x: number; y: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getGlobalRectangle()
    getGlobalRectangle(out: { x: number; y: number; width: number; height: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::setGlobalRectangle()
    setGlobalRectangle(rect: { x: number; y: number; width: number; height: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::hitTestGlobalPoint()
    hitTestGlobalPoint(point: { x: number; y: number }): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::hitTestGlobalRectangle()
    hitTestGlobalRectangle(rect: { x: number; y: number; width: number; height: number }): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::resolveVerticalScale()
    resolveVerticalScale(): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::resolveHorizontalScale()
    resolveHorizontalScale(): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::convertPointFromLocalToGlobalSpace()
    convertPointFromLocalToGlobalSpace(point: { x: number; y: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::convertPointFromGlobalToLocalSpace()
    convertPointFromGlobalToLocalSpace(point: { x: number; y: number }): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::findParentByName()
    findParentByName(name: string): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::setStateFlag()
    setStateFlag(flag: number, value?: boolean): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getStateFlag()
    getStateFlag(flag: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::testStateFlag()
    testStateFlag(flag: number, mask?: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::setStyleFlag()
    setStyleFlag(flag: number, value?: boolean): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getStyleFlag()
    getStyleFlag(flag: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::testStyleFlag()
    testStyleFlag(flag: number, mask?: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::setParamFlag()
    setParamFlag(flag: number, value?: boolean): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getParamFlag()
    getParamFlag(flag: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::testParamFlag()
    testParamFlag(flag: number, mask?: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::minimize()
    minimize(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::maximize()
    maximize(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::restore()
    restore(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::activate()
    activate(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::deactivate()
    deactivate(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::lock()
    lock(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::unlock()
    unlock(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::enable()
    enable(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::disable()
    disable(): boolean;

    isEnabled(): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::addEventListener()
    addEventListener(type: string, listener: WindowEventListener, priority?: number): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::removeEventListener()
    removeEventListener(type: string, listener: WindowEventListener): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::hasEventListener()
    hasEventListener(type: string): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::createProperty()
    createProperty(key: string, value: unknown): PropertyStruct;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::getDefaultProperty()
    getDefaultProperty(key: string): PropertyStruct | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::enableChildren()
    enableChildren(enable: boolean, exceptions: string[]): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::activateChildren()
    activateChildren(activate: boolean, exceptions: string[]): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::setVisibleChildren()
    setVisibleChildren(visible: boolean, exceptions: string[]): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindow.as::toString()
    toString(): string;
}
