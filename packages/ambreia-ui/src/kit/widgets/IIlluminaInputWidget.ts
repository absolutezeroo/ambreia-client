import type {IWidget} from './IWidget';
import type {IIlluminaInputHandler} from './IIlluminaInputHandler';

/**
 * Interface for the Illumina input widget.
 *
 * Provides a text input field with optional submit button,
 * empty message placeholder, and multiline support.
 *
 * @see sources/win63_version/habbo/window/widgets/IIlluminaInputWidget.as
 */
export interface IIlluminaInputWidget extends IWidget
{
    /**
	 * The current message text.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaInputWidget.as::get message()
    message: string;

    /**
	 * The submit handler called when the user submits input.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaInputWidget.as::get submitHandler()
    submitHandler: IIlluminaInputHandler | null;

    /**
	 * The caption displayed on the submit button.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaInputWidget.as::get buttonCaption()
    buttonCaption: string;

    /**
	 * The placeholder text shown when the input is empty.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaInputWidget.as::get emptyMessage()
    emptyMessage: string;

    /**
	 * Whether the input supports multiple lines.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaInputWidget.as::get multiline()
    multiline: boolean;

    /**
	 * The maximum number of characters allowed (0 = unlimited).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IIlluminaInputWidget.as::get maxChars()
    maxChars: number;
}
