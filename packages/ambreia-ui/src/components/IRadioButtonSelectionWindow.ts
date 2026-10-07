import type {IWindowContainer} from '../IWindowContainer';
import type {IRadioButtonWindow} from './IRadioButtonWindow';

/**
 * Interface for radio button selection containers.
 *
 * Tracks the currently selected radio button within a group.
 *
 * @see sources/win63_version/core/window/components/IRadioButtonSelectionWindow.as
 */
export interface IRadioButtonSelectionWindow extends IWindowContainer
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IRadioButtonSelectionWindow.as::get selected()
    readonly selected: IRadioButtonWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/window/components/IRadioButtonSelectionWindow.as::radioButtonSelection()
    radioButtonSelection(button: IRadioButtonWindow): void;
}
