import type {IWindow} from '../IWindow';
import type {IDisposable} from "@ambreia/common/IDisposable";

/**
 * Interface for parsing XML window layout definitions and constructing window trees.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IWindowParser.as
 */
export interface IWindowParser extends IDisposable
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IWindowParser.as::parseAndConstruct()
    parseAndConstruct(layout: string | Document | Element, parent: IWindow | null, namedWindows: Map<string, IWindow> | null): IWindow | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/utils/IWindowParser.as::windowToXMLString()
    windowToXMLString(window: IWindow): string;
}
