/**
 * IRoomObjectEventHandler Interface
 *
 * Based on AS3: com.sulake.room.object.logic.IRoomObjectEventHandler
 *
 * Interface for room object logic/behavior handlers.
 */
import type {EventEmitter} from 'eventemitter3';
import type {RoomObjectUpdateMessage} from '../../messages/RoomObjectUpdateMessage';
import type {IRoomObjectController} from '../IRoomObjectController';
import type {IRoomObjectMouseHandler} from './IRoomObjectMouseHandler';

export interface IRoomObjectEventHandler extends IRoomObjectMouseHandler
{
    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::get object()
    object: IRoomObjectController | null;
    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::get eventDispatcher()
    eventDispatcher: EventEmitter | null;

    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::get widget()
    readonly widget: string | null;
    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::get contextMenu()
    readonly contextMenu: string | null;

    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::dispose()
    dispose(): void;

    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::initialize()
    initialize(data: unknown): void;

    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::tearDown()
    tearDown(): void;

    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::update()
    update(time: number): void;

    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::processUpdateMessage()
    processUpdateMessage(message: RoomObjectUpdateMessage): void;

    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::useObject()
    useObject(): void;

    // AS3: .../src/com/sulake/room/object/logic/IRoomObjectEventHandler.as::getEventTypes()
    getEventTypes(): string[];
}
