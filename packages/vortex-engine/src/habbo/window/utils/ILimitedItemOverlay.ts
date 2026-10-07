import type {IDisposable} from '@ambreia/common/IDisposable';
import type {IWindowContainer} from '@core/window/IWindowContainer';

/**
 * Interface for limited item overlays.
 *
 * Displays a serial number and series size badge on limited-edition
 * furniture items in the catalog and inventory views.
 *
 * @see sources/win63_version/habbo/window/utils/ILimitedItemOverlay.as
 */
export interface ILimitedItemOverlay extends IDisposable
{
    /**
	 * The container window holding the overlay elements.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/utils/ILimitedItemOverlay.as::get window()
    readonly window: IWindowContainer | null;

    /**
	 * Set the serial number of this limited item.
	 */
    serialNumber: number;

    /**
	 * Set the total series size of this limited item.
	 */
    seriesSize: number;
}
