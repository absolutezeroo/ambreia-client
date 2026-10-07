/**
 * IRoomManagerListener
 *
 * Based on AS3: com.sulake.room.IRoomManagerListener
 *
 * Interface for listening to room manager events.
 */
export interface IRoomManagerListener
{
    /**
	 * Called when the room manager has been initialized.
	 */
    // AS3: .../src/com/sulake/room/IRoomManagerListener.as::roomManagerInitialized()
    roomManagerInitialized(success: boolean): void;

    /**
	 * Called when content has been loaded.
	 */
    // AS3: .../src/com/sulake/room/IRoomManagerListener.as::contentLoaded()
    contentLoaded(type: string, success: boolean): void;

    /**
	 * Called when a single object has been initialized.
	 */
    // AS3: .../src/com/sulake/room/IRoomManagerListener.as::objectInitialized()
    objectInitialized(roomId: string, objectId: number, category: number): void;

    /**
	 * Called when all objects of a type have been initialized.
	 */
    // AS3: .../src/com/sulake/room/IRoomManagerListener.as::objectsInitialized()
    objectsInitialized(type: string): void;
}
