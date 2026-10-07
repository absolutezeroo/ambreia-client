import type {IWindow} from '../IWindow';

/**
 * Interface for text link windows.
 *
 * Extends IWindow with a link property representing the URL
 * or action associated with the text link.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/ITextLinkWindow.as
 */
export interface ITextLinkWindow extends IWindow
{
    link: string;
}
