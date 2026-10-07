import type {IDisposable} from '@ambreia/game/core/index';

/**
 * Loading screen interface.
 *
 * Port of AS3 IHabboLoadingScreen → IVortexLoadingScreen.
 * The engine uses this interface to update the loading bar progress.
 * The concrete implementation lives in the client layer (DOM-based).
 *
 * @see sources/WIN63-202607011411-782849652/src/binaryData/IHabboLoadingScreen.as
 */
export interface IVortexLoadingScreen extends IDisposable
{
    /**
	 * Update the loading bar progress.
	 *
	 * @param progress - Progress ratio from 0.0 to 1.0
	 *
	 * @see sources/WIN63-202607011411-782849652/src/binaryData/IHabboLoadingScreen.as updateLoadingBar()
	 */
    // AS3: .../src/binaryData/IHabboLoadingScreen.as::updateLoadingBar()
    updateLoadingBar(progress: number): void;

    /**
	 * Turns the loading screen into a failure screen: the bar animation stops, the rotating status
	 * line becomes "Loading failed", and `message` is shown underneath.
	 *
	 * Without it a boot failure leaves the fake progress bar cycling forever, which is
	 * indistinguishable from a slow load.
	 *
	 * @param message - what went wrong, shown verbatim
	 */
    // AS3: .../src/binaryData/IHabboLoadingScreen.as::showError()
    showError(message: string): void;
}
