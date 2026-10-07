import type {IWindow} from '../IWindow';

/**
 * Interface for windows that wrap a display object.
 *
 * In the TypeScript port, display objects are represented as `unknown`
 * since Flash DisplayObject does not exist. The client layer provides
 * concrete rendering.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDisplayObjectWrapper.as
 */
export interface IDisplayObjectWrapper extends IWindow
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDisplayObjectWrapper.as::setDisplayObject()
    setDisplayObject(displayObject: unknown): void;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IDisplayObjectWrapper.as::getDisplayObject()
    getDisplayObject(): unknown;
}
