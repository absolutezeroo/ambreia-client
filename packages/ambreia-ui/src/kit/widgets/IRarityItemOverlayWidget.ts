import type {IWidget} from './IWidget';

/**
 * Interface for the rarity item overlay widget (base).
 *
 * Displays the rarity level for special items.
 *
 * @see sources/win63_version/habbo/window/widgets/IRarityItemOverlayWidget.as
 */
export interface IRarityItemOverlayWidget extends IWidget
{
    /**
	 * The rarity level of the item.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRarityItemOverlayWidget.as::get rarityLevel()
    rarityLevel: number;
}
