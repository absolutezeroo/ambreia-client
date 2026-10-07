import type {IWidget} from './IWidget';

/**
 * Interface for the room thumbnail widget.
 *
 * Displays a thumbnail image for a room, loaded by flat ID.
 *
 * @see sources/win63_version/habbo/window/widgets/IRoomThumbnailWidget.as
 */
export interface IRoomThumbnailWidget extends IWidget
{
    /**
	 * Reset the thumbnail to its default/blank state.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRoomThumbnailWidget.as::reset()
    reset(): void;

    /**
	 * Set the room (flat) ID to load a thumbnail for.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRoomThumbnailWidget.as::set flatId()
    set flatId(value: number);
}
