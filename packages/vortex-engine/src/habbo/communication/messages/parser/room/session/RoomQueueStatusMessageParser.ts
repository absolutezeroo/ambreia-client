import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import {RoomQueueSet} from './RoomQueueSet';

/**
 * RoomQueueStatusMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.session.RoomQueueStatusMessageEventParser
 */
export class RoomQueueStatusMessageParser implements IMessageParser
{
    private _queueSets: Map<number, RoomQueueSet> = new Map();
    private _activeTarget: number = 0;
    private _flatId: number = 0;

    get flatId(): number
    {
        return this._flatId;
    }

    get activeTarget(): number
    {
        return this._activeTarget;
    }

    flush(): boolean
    {
        this._queueSets.clear();
        this._activeTarget = 0;
        this._flatId = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper)
        {
            return false;
        }

        this._queueSets.clear();

        this._flatId = wrapper.readInt();

        const queueSetCount = wrapper.readInt();

        for(let i = 0; i < queueSetCount; i++)
        {
            const name = wrapper.readString();
            const target = wrapper.readInt();

            if(i === 0)
            {
                this._activeTarget = target;
            }

            const queueSet = new RoomQueueSet(name, target);
            const queueCount = wrapper.readInt();

            for(let j = 0; j < queueCount; j++)
            {
                queueSet.addQueue(wrapper.readString(), wrapper.readInt());
            }

            this._queueSets.set(queueSet.target, queueSet);
        }

        return true;
    }

    getQueueSetTargets(): number[]
    {
        return Array.from(this._queueSets.keys());
    }

    getQueueSet(target: number): RoomQueueSet | null
    {
        return this._queueSets.get(target) ?? null;
    }
}
