/**
 * IRoomObjectFactory Interface
 *
 * Based on AS3: com.sulake.room.IRoomObjectFactory
 *
 * Factory interface for creating room object logic and managers.
 * Visualization creation is handled by IRoomObjectVisualizationFactory.
 *
 * @see source_as_win63/room/IRoomObjectFactory.as
 */
import type {EventEmitter} from 'eventemitter3';
import type {IRoomObjectEventHandler} from './object/logic/IRoomObjectEventHandler';
import type {IRoomObjectManager} from './IRoomObjectManager';

export interface IRoomObjectFactory
{
    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::get events()
    readonly events: EventEmitter;

    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::addObjectEventListener()
    addObjectEventListener(callback: (event: unknown) => void): void;

    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::removeObjectEventListener()
    removeObjectEventListener(callback: (event: unknown) => void): void;

    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::createRoomObjectLogic()
    createRoomObjectLogic(type: string): IRoomObjectEventHandler | null;

    // AS3: .../src/com/sulake/room/IRoomObjectFactory.as::createRoomObjectManager()
    createRoomObjectManager(): IRoomObjectManager;

    /**
     * VariableFx configurations for one room, routed by each config's `isUserFx` to the avatar or
     * the furniture store. The room id is the *identifier* string, not the flat id.
     *
     * `unknown[]` rather than the DTO on purpose: AS3 types this parameter `Array` so that
     * `com.sulake.room` depends on nothing in `com.sulake.habbo`, and the concrete factory — which
     * does live in habbo — narrows it. Importing the DTO here would invert that, for a type the
     * interface never uses.
     */
    // AS3: sources/AIR-1.0.31/scripts/com/sulake/room/IRoomObjectFactory.as::updateVariableFxConfigs()
    updateVariableFxConfigs(roomId: string, configs: unknown[]): void;

    /**
     * Removes by id from BOTH stores: the message carries only config ids, and nothing in it says
     * which half the config belonged to.
     */
    // AS3: sources/AIR-1.0.31/scripts/com/sulake/room/IRoomObjectFactory.as::removeVariableFxConfigs()
    removeVariableFxConfigs(roomId: string, configIds: number[]): void;

    // AS3: sources/AIR-1.0.31/scripts/com/sulake/room/IRoomObjectFactory.as::disposeRoomLogicData()
    disposeRoomLogicData(roomId: string): void;
}
