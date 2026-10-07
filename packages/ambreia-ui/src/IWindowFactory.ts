import type {IWindow} from './IWindow';
import type {DefaultAttStruct} from './utils/DefaultAttStruct';
import type {IThemeManager} from './theme/IThemeManager';

/**
 * Window factory interface.
 *
 * Creates and destroys windows, provides layout and default attribute lookups,
 * and gives access to the theme manager.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowFactory.as
 */
export interface IWindowFactory
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowFactory.as::create()
    create(
        name: string,
        type: number,
        style: number,
        param: number,
        rect: { x: number; y: number; width: number; height: number },
        procedure?: ((event: unknown, window: IWindow) => void) | null,
        dynamicStyle?: string,
        id?: number,
        tags?: string[] | null,
        parent?: IWindow | null,
        properties?: unknown[] | null,
        layerName?: string
    ): IWindow;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowFactory.as::destroy()
    destroy(window: IWindow): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowFactory.as::buildFromXML()
    buildFromXML(
        layout: string | Document | Element,
        contextLayer?: number,
        namedWindows?: Map<string, IWindow> | null
    ): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowFactory.as::windowToXMLString()
    windowToXMLString(window: IWindow): string;

    getLayoutByTypeAndStyle(type: number, style: number): string | null;

    getDefaultsByTypeAndStyle(type: number, style: number): DefaultAttStruct | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/IWindowFactory.as::getThemeManager()
    getThemeManager(): IThemeManager;
}
