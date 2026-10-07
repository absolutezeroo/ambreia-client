import type {IWidget} from './IWidget';

/**
 * Interface for the room user count widget.
 *
 * Displays the current number of users in a room.
 *
 * @see sources/win63_version/habbo/window/widgets/IRoomUserCountWidget.as
 */
export interface IRoomUserCountWidget extends IWidget
{
    /**
	 * Set the user count to display.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/IRoomUserCountWidget.as::set userCount()
    set userCount(value: number);
}
