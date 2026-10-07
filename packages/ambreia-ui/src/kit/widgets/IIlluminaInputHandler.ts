import type {IWidgetWindow} from '../../components/IWidgetWindow';

/**
 * Interface for handling Illumina input widget submissions.
 *
 * Implemented by classes that need to receive text input from an IIlluminaInputWidget.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaInputHandler.as
 */
export interface IIlluminaInputHandler
{
    /**
	 * Called when the user submits input.
	 *
	 * Receives the *widget window*, not its name: every handler has to reach through it to
	 * `widget.widget` and clear the field, which is what AS3 does and what a bare name cannot
	 * support. (This port passed a `string` until 2026-08-11, and its one handler worked around
	 * that by looking the widget up on itself.)
	 *
	 * @param widget - The widget window that was submitted
	 * @param message - The submitted text
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaInputHandler.as::onInput()
    onInput(widget: IWidgetWindow, message: string): void;
}
