import type {IWidget} from './IWidget';

/**
 * Interface for the limited item overlay widget (base).
 *
 * Displays serial number and series size information for limited edition items.
 *
 * @see sources/win63_version/habbo/window/widgets/ILimitedItemOverlayWidget.as
 */
export interface ILimitedItemOverlayWidget extends IWidget
{
    /**
	 * The serial number of the limited item.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ILimitedItemOverlayWidget.as::get serialNumber()
    serialNumber: number;

    /**
	 * The total series size.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ILimitedItemOverlayWidget.as::get seriesSize()
    seriesSize: number;
}
