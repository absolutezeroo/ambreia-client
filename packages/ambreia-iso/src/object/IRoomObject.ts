/**
 * IRoomObject Interface
 *
 * Based on AS3: com.sulake.room.object.IRoomObject
 *
 * Read-only interface for room objects.
 */
import type {IVector3d} from '../utils/IVector3d';
import type {IRoomObjectModel} from './IRoomObjectModel';
import type {IRoomObjectMouseHandler} from './logic/IRoomObjectMouseHandler';
import type {IRoomObjectVisualization} from './visualization/IRoomObjectVisualization';

export interface IRoomObject
{
    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getId()
    getId(): number;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getInstanceId()
    getInstanceId(): number;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getType()
    getType(): string;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::isInitialized()
    isInitialized(): boolean;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getLocation()
    getLocation(): IVector3d;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getDirection()
    getDirection(): IVector3d;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getModel()
    getModel(): IRoomObjectModel;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getVisualization()
    getVisualization(): IRoomObjectVisualization | null;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getMouseHandler()
    getMouseHandler(): IRoomObjectMouseHandler | null;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getAvatarLibraryAssetName()
    getAvatarLibraryAssetName(): string;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getState()
    getState(index: number): number;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::getUpdateID()
    getUpdateID(): number;

    // AS3: .../src/com/sulake/room/object/IRoomObject.as::tearDown()
    tearDown(): void;
}
