import type {IWidget} from './IWidget';

/**
 * Interface for the pet image widget.
 *
 * Obfuscated to `_SafeCls_3710` in the primary tree, so `IPetImageWidget` is derived from
 * the single class that implements it, `PetImageWidget`. The shape is verbatim.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as
 */
export interface IPetImageWidget extends IWidget
{
    /**
	 * The pet figure string, `"typeId paletteId color[ breedId customParts…]"`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::get figure()
    figure: string;

    /**
	 * Render scale, 32 or 64.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::get scale()
    scale: number;

    /**
	 * Facing, as an index into the eight compass directions.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::get direction()
    direction: number;

    /**
	 * Horizontal zoom applied to the rendered pet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::get zoomX()
    zoomX: number;

    /**
	 * Vertical zoom applied to the rendered pet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::get zoomY()
    zoomY: number;

    /**
	 * Width of the pet image *before* zoom, or 0 when nothing is drawn yet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::get petWidth()
    readonly petWidth: number;

    /**
	 * Height of the pet image *before* zoom, or 0 when nothing is drawn yet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::get petHeight()
    readonly petHeight: number;

    /**
	 * Halves the zoom when the pet would overflow the widget window.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::get shrinkOnOverflow()
    shrinkOnOverflow: boolean;

    /**
	 * Re-asks the room engine for the current figure and repaints.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3710.as::refresh()
    refresh(): void;
}
