import type {IWindowContainer} from '../IWindowContainer';
import type {IMargins} from '../utils/IMargins';
import type {IHeaderWindow} from './IHeaderWindow';
import type {ILabelWindow} from './ILabelWindow';
import type {IScalerWindow} from './IScalerWindow';
import type {IWindow} from '../IWindow';

/**
 * Interface for frame windows.
 *
 * A frame window is a windowed container with a title bar (header),
 * content region, margins, and optional scaler for resizing.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFrameWindow.as
 */
export interface IFrameWindow extends IWindowContainer
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFrameWindow.as::get title()
    readonly title: ILabelWindow;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFrameWindow.as::get header()
    readonly header: IHeaderWindow;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFrameWindow.as::get content()
    readonly content: IWindowContainer;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFrameWindow.as::get margins()
    readonly margins: IMargins;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IFrameWindow.as::get scaler()
    readonly scaler: IScalerWindow;
    readonly menuButton: IWindow | null;
    menuButtonVisible: boolean;
    helpButtonAction: (helpPage: string) => void;
    helpPage: string;

    resizeToFitContent(): void;
}
