/**
 * IRoomObjectController Interface
 *
 * Based on AS3: com.sulake.room.object.IRoomObjectController
 *
 * Read-write interface for room objects.
 * Extends IRoomObject with setter methods.
 */
import type {IVector3d} from '../utils/IVector3d';
import type {IRoomObject} from './IRoomObject';
import type {IRoomObjectModelController} from './IRoomObjectModelController';
import type {IRoomObjectEventHandler} from './logic/IRoomObjectEventHandler';
import type {IRoomObjectVisualization} from './visualization/IRoomObjectVisualization';

export interface IRoomObjectController extends IRoomObject
{
    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::dispose()
    dispose(): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::setInitialized()
    setInitialized(value: boolean): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::setLocation()
    setLocation(location: IVector3d): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::setDirection()
    setDirection(direction: IVector3d): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::setVisualization()
    setVisualization(visualization: IRoomObjectVisualization | null): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::setState()
    setState(state: number, index: number): boolean;

    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::setEventHandler()
    setEventHandler(handler: IRoomObjectEventHandler | null): void;

    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::getEventHandler()
    getEventHandler(): IRoomObjectEventHandler | null;

    // AS3: .../src/com/sulake/room/object/IRoomObjectController.as::getModelController()
    getModelController(): IRoomObjectModelController;
}
