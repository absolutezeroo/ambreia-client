import type {IRoomSession} from '../IRoomSession';
import {RoomSessionEvent} from './RoomSessionEvent';

/**
 * Room session queue event
 *
 * @see source_as_win63/habbo/session/events/RoomSessionQueueEvent.as
 */
export class RoomSessionQueueEvent extends RoomSessionEvent
{
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::QUEUE_STATUS
    public static readonly QUEUE_STATUS = 'RSQE_QUEUE_STATUS';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::QUEUE_TYPE_NORMAL
    public static readonly QUEUE_TYPE_NORMAL = 'd';
    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::_queues
    private _queues: Map<string, number> = new Map();

    constructor(session: IRoomSession, name: string, target: number, isActive: boolean = false)
    {
        super(RoomSessionQueueEvent.QUEUE_STATUS, session);
        this._queueSetName = name;
        this._queueSetTarget = target;
        this._isActive = isActive;
    }

    private _queueSetName: string;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::get queueSetName()
    get queueSetName(): string
    {
        return this._queueSetName;
    }

    private _queueSetTarget: number;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::get queueSetTarget()
    get queueSetTarget(): number
    {
        return this._queueSetTarget;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::_isActive
    private _isActive: boolean;

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::get isActive()
    get isActive(): boolean
    {
        return this._isActive;
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::get queueTypes()
    get queueTypes(): string[]
    {
        return Array.from(this._queues.keys());
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::addQueue()
    addQueue(type: string, size: number): void
    {
        this._queues.set(type, size);
    }

    // AS3: .../src/com/sulake/habbo/session/events/RoomSessionQueueEvent.as::getQueueSize()
    getQueueSize(type: string): number
    {
        return this._queues.get(type) ?? 0;
    }
}
