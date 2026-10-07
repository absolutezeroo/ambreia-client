import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindow} from '../../IWindow';

/**
 * Interface for modal dialogs.
 *
 * A modal dialog creates a dimmed background layer and displays a root
 * window centered on top, blocking interaction with underlying windows.
 *
 * In AS3, the `background` property returned an `IBitmapWrapperWindow`
 * which handled the darkened bitmap overlay. In our TS port, this is
 * abstracted as a generic IWindow (the UI layer handles rendering).
 *
 * @see sources/win63_version/habbo/window/utils/IModalDialog.as
 */
export interface IModalDialog extends IDisposable
{
    /**
	 * The root window of this modal dialog.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/IModalDialog.as::get rootWindow()
    readonly rootWindow: IWindow | null;

    /**
	 * The background overlay window.
	 *
	 * In AS3 this was an IBitmapWrapperWindow that drew a darkened
	 * snapshot of the desktop. In the TS port, this is a generic
	 * IWindow; the actual darkening is handled by the UI layer.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/IModalDialog.as::get background()
    readonly background: IWindow | null;
}
