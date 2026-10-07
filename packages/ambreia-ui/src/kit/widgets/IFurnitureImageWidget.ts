import type {IWidget} from './IWidget';

/**
 * Interface for the furniture image widget.
 *
 * Obfuscated to `_SafeCls_3791` in the primary tree, so `IFurnitureImageWidget` is derived
 * from the single class that implements it, `FurnitureImageWidget`. The shape is verbatim.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3791.as
 */
export interface IFurnitureImageWidget extends IWidget
{
    /**
	 * The furniture class name, e.g. `table_plasto_square`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3791.as::get furnitureType()
    furnitureType: string;

    /**
	 * Render scale, 32 or 64.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3791.as::get scale()
    scale: number;

    /**
	 * Facing, as an index into the eight compass directions.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3791.as::get direction()
    direction: number;
}
