import type {ILimitedItemOverlayWidget} from './ILimitedItemOverlayWidget';

/**
 * Interface for the limited item supply left overlay widget.
 *
 * Extends the base limited item overlay with supply-left count
 * for catalog purchase views.
 *
 * @see sources/win63_version/habbo/window/widgets/ILimitedItemSupplyLeftOverlayWidget.as
 */
export interface ILimitedItemSupplyLeftOverlayWidget extends ILimitedItemOverlayWidget
{
    /**
	 * The number of items remaining in the supply.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/ILimitedItemSupplyLeftOverlayWidget.as::get supplyLeft()
    supplyLeft: number;
}
