import type {DefaultAttStruct} from '../utils/DefaultAttStruct';
import type {ISkinRenderer} from './renderer/ISkinRenderer';
import type {IDisposable} from "@ambreia/common/IDisposable";

/**
 * Interface for a container of skin renderers indexed by window type and style.
 *
 * Provides lookup methods for skin renderers, default attributes, and
 * state resolution for the window rendering pipeline.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/core/window/graphics/ISkinContainer.as
 */
export interface ISkinContainer extends IDisposable
{
    /**
	 * Returns the skin renderer for the given window type and style.
	 *
	 * @param type - The window type
	 * @param style - The window style
	 * @returns The skin renderer, or null
	 */
    // AS3: .../src/com/sulake/core/window/graphics/ISkinContainer.as::getSkinRendererByTypeAndStyle()
    getSkinRendererByTypeAndStyle(type: number, style: number): ISkinRenderer | null;

    /**
	 * Returns the default attributes for the given window type and style.
	 *
	 * @param type - The window type
	 * @param style - The window style
	 * @returns The default attribute struct, or null
	 */
    // AS3: .../src/com/sulake/core/window/graphics/ISkinContainer.as::getDefaultAttributesByTypeAndStyle()
    getDefaultAttributesByTypeAndStyle(type: number, style: number): DefaultAttStruct | null;

    /**
	 * Resolves the actual drawable state for a window type, style, and state combination.
	 *
	 * @param type - The window type
	 * @param style - The window style
	 * @param state - The combined window state flags
	 * @returns The resolved drawable state
	 */
    // AS3: .../src/com/sulake/core/window/graphics/ISkinContainer.as::getTheActualState()
    getTheActualState(type: number, style: number, state: number): number;
}
