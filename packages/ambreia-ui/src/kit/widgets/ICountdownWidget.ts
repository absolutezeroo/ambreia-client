import type {IWidget} from './IWidget';

/**
 * Interface for the countdown widget.
 *
 * Obfuscated to `_SafeCls_2433` in the primary tree, so `ICountdownWidget` is derived from
 * the single class that implements it, `CountdownWidget`. The shape is verbatim.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2433.as
 */
export interface ICountdownWidget extends IWidget
{
    /**
	 * Index into the two colour pairs the counter units can be drawn in.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2433.as::get colorStyle()
    colorStyle: number;

    /**
	 * Whether the countdown is ticking down. Turning it off freezes the remaining time.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2433.as::get running()
    running: boolean;

    /**
	 * How many unit groups are shown, 2 to 4. Writing it rebuilds the counter list.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2433.as::get digits()
    digits: number;

    /**
	 * Seconds left. Reading it while running subtracts the elapsed time.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_2433.as::get seconds()
    seconds: number;
}
