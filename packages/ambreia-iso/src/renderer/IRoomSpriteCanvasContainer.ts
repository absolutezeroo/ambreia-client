/**
 * IRoomSpriteCanvasContainer
 *
 * Based on AS3: com.sulake.room.renderer.class_3446
 *
 * Interface for the container that provides room objects to rendering canvases.
 * The RoomRenderer implements this to allow canvases to query objects during rendering.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/IRoomSpriteCanvasContainer.as
 */
import type {IRoomObject} from '../object/IRoomObject';

export interface IRoomSpriteCanvasContainer
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/IRoomSpriteCanvasContainer.as::get roomObjectVariableAccurateZ()
    readonly roomObjectVariableAccurateZ: string | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/IRoomSpriteCanvasContainer.as::getRoomObject()
    getRoomObject(id: string): IRoomObject | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/IRoomSpriteCanvasContainer.as::getRoomObjectWithIndex()
    getRoomObjectWithIndex(index: number): IRoomObject | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/IRoomSpriteCanvasContainer.as::getRoomObjectIdWithIndex()
    getRoomObjectIdWithIndex(index: number): string | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/IRoomSpriteCanvasContainer.as::getRoomObjectCount()
    getRoomObjectCount(): number;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/IRoomSpriteCanvasContainer.as::getRoomObjectIdentifier()
    getRoomObjectIdentifier(object: IRoomObject): string | null;
}
