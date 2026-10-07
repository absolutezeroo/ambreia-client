import type {IWidget} from './IWidget';

/**
 * Interface for the running number widget.
 *
 * Displays a number that animates (counts up) from a current value
 * to a target value at a configurable frequency.
 *
 * @see sources/win63_version/habbo/window/widgets/IRunningNumberWidget.as
 */
export interface IRunningNumberWidget extends IWidget
{
    /**
	 * The target number to animate towards.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRunningNumberWidget.as::get number()
    number: number;
    /**
	 * The number of display digits (leading zeros).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRunningNumberWidget.as::get digits()
    digits: number;
    /**
	 * The color style index.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRunningNumberWidget.as::get colorStyle()
    colorStyle: number;
    /**
	 * The update frequency in milliseconds.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRunningNumberWidget.as::get updateFrequency()
    updateFrequency: number;

    /**
	 * Set the initial number (skips animation).
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRunningNumberWidget.as::set initialNumber()
    set initialNumber(value: number);
}
