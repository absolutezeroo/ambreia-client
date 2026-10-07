import type {IWindow} from './IWindow';
import type {IWindowParser} from './utils/IWindowParser';
import type {IResourceManager} from './IResourceManager';
import type {IDisposable} from "@ambreia/common/IDisposable";
import type {IInputEventTracker} from './IInputEventTracker';
import type {IWindowLinkTracker} from './IWindowLinkTracker';
import type {IInternalWindowServices} from './services/IInternalWindowServices';
import type {IWindowFactory} from './IWindowFactory';
import type {IWidgetFactory} from './IWidgetFactory';
import type {IWindowLocalization} from './IWindowLocalization';

/**
 * Window context interface.
 *
 * A context represents a layer in which windows are created and managed.
 * Each layer has its own factory, parser, desktop, and event processing.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as
 */
export interface IWindowContext extends IDisposable
{
    inputEventTrackers: IInputEventTracker[];

    /**
	 * Everyone who asked to be told when a link inside a window is followed.
	 *
	 * `HTMLTextController.update()` walks it on every anchor click; a tracker whose `linkPattern`
	 * is empty hears about every link, the rest only about their own prefix.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/WindowContext.as::get linkEventTrackers()
    readonly linkEventTrackers: IWindowLinkTracker[];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::getWindowServices()
    getWindowServices(): IInternalWindowServices;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::getWindowParser()
    getWindowParser(): IWindowParser;

    getWindowFactory(): IWindowFactory;

    getWidgetFactory(): IWidgetFactory | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::getDesktopWindow()
    getDesktopWindow(): IWindow | null;

    getResourceManager(): IResourceManager | null;

    setLocalizationManager(localization: IWindowLocalization | null): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::registerLocalizationListener()
    registerLocalizationListener(key: string, window: IWindow): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::removeLocalizationListener()
    removeLocalizationListener(key: string, window: IWindow): void;

    findWindowByName(name: string): IWindow | null;

    findWindowByTag(tag: string): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::groupChildrenWithTag()
    groupChildrenWithTag(tag: string, result: IWindow[], depth?: number): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::create()
    create(
        name: string,
        caption: string,
        type: number,
        style: number,
        param: number,
        rect: { x: number; y: number; width: number; height: number } | null,
        procedure: ((event: unknown, window: IWindow) => void) | null,
        parent: IWindow | null,
        id: number,
        tags?: string[] | null,
        dynamicStyle?: string,
        properties?: unknown[] | null
    ): IWindow;

    update(deltaTime: number): void;

    render(deltaTime: number): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::destroy()
    destroy(window: IWindow): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::invalidate()
    invalidate(window: IWindow, rect: {
        x: number;
        y: number;
        width: number;
        height: number
    } | null, flags: number): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::getLastError()
    getLastError(): Error | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::getLastErrorCode()
    getLastErrorCode(): number;

    handleError(code: number, error: Error): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowContext.as::flushError()
    flushError(): void;

    addMouseEventTracker(tracker: IInputEventTracker): void;

    removeMouseEventTracker(tracker: IInputEventTracker): void;
}
