/**
 * IRoomUI
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomUI.as
 *
 * Public interface for the room UI component.
 */
import type {IRoomDesktop} from './IRoomDesktop';
import type {IRoomSession} from '@habbo/session/IRoomSession';
import type {IDisplayObjectWrapper} from '@ambreia/ui/components/IDisplayObjectWrapper';

export interface IRoomUI
{
    /**
	 * Creates a desktop for the given room session.
	 */
    // AS3: .../src/com/sulake/habbo/ui/IRoomUI.as::createDesktop()
    createDesktop(session: IRoomSession): IRoomDesktop;

    /**
	 * Disposes a desktop by room identifier.
	 */
    // AS3: .../src/com/sulake/habbo/ui/IRoomUI.as::disposeDesktop()
    disposeDesktop(identifier: string): void;

    /**
	 * Gets a desktop by room identifier.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/ui/IRoomUI.as::getDesktop()
    getDesktop(identifier: string): IRoomDesktop | null;

    /**
	 * The active room desktop.
	 *
	 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomUI.as::get desktop()
	 */
    // AS3: .../src/com/sulake/habbo/ui/IRoomUI.as::get desktop()
    get desktop(): IRoomDesktop | null;

    /**
	 * Gets the active canvas ID for a room.
	 */
    // AS3: .../src/com/sulake/habbo/ui/IRoomUI.as::getActiveCanvasId()
    getActiveCanvasId(roomId: number): number;

    /**
	 * Sets visibility of the active desktop.
	 */
    // AS3: .../src/com/sulake/habbo/ui/IRoomUI.as::set visible()
    set visible(value: boolean);

    /**
	 * Whether the point a mouse event happened at is covered by a context menu or dialog, in which
	 * case a room-canvas click must propagate to it instead of selecting an avatar.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/RoomUI.as::mouseEventPositionHasContextMenu()
    mouseEventPositionHasContextMenu(event: { global: { x: number; y: number } }): boolean;

    /**
	 * The window container the free-flow chat display object is mounted into.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomUI.as::get chatContainer()
    get chatContainer(): IDisplayObjectWrapper | null;

    /**
	 * Routes a HideRoomWidgetEvent to the current desktop's widget handlers.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomUI.as::hideWidget()
    hideWidget(widgetType: string): void;

    /**
	 * Shows the name bubble over a game NPC or player, through the room desktop's avatar-info
	 * widget. Silent when no room desktop or no such widget exists yet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/IRoomUI.as::showGamePlayerName()
    showGamePlayerName(objectId: number, name: string, color: number, fadeDelayMs: number): void;
}
