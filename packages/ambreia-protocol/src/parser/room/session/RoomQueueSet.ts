/**
 * RoomQueueSet
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.class_1634
 * Secondary reference: com.sulake.habbo.communication.messages.parser.room.session.RoomQueueSet
 */
export class RoomQueueSet
{
    private _name: string;
    private _target: number;
    private _queues: Map<string, number>;

    constructor(name: string, target: number)
    {
        this._name = name;
        this._target = target;
        this._queues = new Map();
    }

    get name(): string
    {
        return this._name;
    }

    get target(): number
    {
        return this._target;
    }

    get queueTypes(): string[]
    {
        return Array.from(this._queues.keys());
    }

    getQueueSize(type: string): number
    {
        return this._queues.get(type) ?? 0;
    }

    addQueue(type: string, size: number): void
    {
        this._queues.set(type, size);
    }
}
