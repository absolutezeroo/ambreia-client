/**
 * IRoomContentListener
 *
 * Based on AS3: com.sulake.habbo.room.IRoomContentListener
 *
 * Interface for listening to room content loading events.
 */
export interface IRoomContentListener
{
    /**
	 * Called when an icon has been loaded.
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/IRoomContentListener.as::iconLoaded()
    iconLoaded(typeId: number, type: string, success: boolean): void;
}
