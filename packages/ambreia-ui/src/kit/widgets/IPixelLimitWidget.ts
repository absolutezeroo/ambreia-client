import type {IWidget} from './IWidget';
import type {IBitmapDataContainer} from '../../utils/IBitmapDataContainer';

/**
 * Interface for the pixel-limit widget.
 *
 * Obfuscated to `_SafeCls_3624` in the primary tree and to `_Str_17266` in the
 * unobfuscated 2016 one, so `IPixelLimitWidget` is derived from the single class that
 * implements it, `PixelLimitWidget`. The shape is verbatim: `_SafeCls_2028` (this port's
 * `IWidget`) plus `_SafeCls_1989` (`IBitmapDataContainer`) plus `limit`.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3624.as
 */
export interface IPixelLimitWidget extends IWidget, IBitmapDataContainer
{
    /**
	 * The meter's fill, 0-100. Clamped on write, and rounded down to a 20% step when the
	 * asset URI is computed.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/_SafeCls_3624.as::get limit()
    limit: number;
}
