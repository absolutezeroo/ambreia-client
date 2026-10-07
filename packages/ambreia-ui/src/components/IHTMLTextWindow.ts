import type {ITextFieldWindow} from './ITextFieldWindow';

/**
 * Interface for HTML text windows with link support.
 *
 * AS3 `_SafeCls_2117` extends ITextFieldWindow (adding linkTarget/initializeLinkStyle); the concrete
 * HTMLTextController extends TextFieldController and already implements that surface, so this extends
 * ITextFieldWindow to expose text/selectable/fontSize (needed by wired HtmlPreset), not just IWindow.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IHTMLTextWindow.as
 */
export interface IHTMLTextWindow extends ITextFieldWindow
{
    html: string;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/components/IHTMLTextWindow.as::get linkTarget()
    linkTarget: string;

    /**
	 * Applies the standard blue link styling. See the implementation for why it is currently inert
	 * in this port.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/_SafeCls_2117.as::initializeLinkStyle()
    initializeLinkStyle(): void;
}
