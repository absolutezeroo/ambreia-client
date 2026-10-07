import {Logger} from '@ambreia/common/utils/Logger';
import type {IRoomObjectEventHandler} from './logic/IRoomObjectEventHandler';

const log = Logger.getLogger('room.object.RoomObjectLogicRegistry');

/**
 * Object type → logic. A host registers the modules it wants (scene, furniture, avatars, effects);
 * an object of a type nobody registered gets no logic, as an unknown type did in AS3's switch.
 *
 * In AS3 a switch in RoomObjectFactory.createRoomObjectLogic().
 */
export class RoomObjectLogicRegistry
{
    private readonly _builders = new Map<string, () => IRoomObjectEventHandler>();
    private readonly _unknown = new Set<string>();

    public register(type: string, create: () => IRoomObjectEventHandler): void
    {
        this._builders.set(type, create);
    }

    public create(type: string): IRoomObjectEventHandler | null
    {
        const create = this._builders.get(type);

        if(create) return create();

        if(!this._unknown.has(type))
        {
            this._unknown.add(type);
            log.warn(`No logic registered for room object type "${type}"; it gets none`);
        }

        return null;
    }

    public types(): string[]
    {
        return [...this._builders.keys()].sort();
    }
}
