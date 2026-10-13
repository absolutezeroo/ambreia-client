import type {IUserData} from '../../session/IUserData';
import {UserDataType} from '../../session/UserData';
import type {WindowBits} from '../../ui/kit/WindowBits';
import type {ILogNames} from './views/ILogNames';

/**
 * Who a combatant is, as the frames and the log name it: a monster (a pet of the room, M1a §9.1)
 * by its content id, anyone else by their user name, the player as « you » in the log.
 */
export class CombatNames implements ILogNames
{
    constructor(
        private readonly _user: (objectId: number) => Pick<IUserData, 'name' | 'type'> | null,
        private readonly _texts: () => Pick<WindowBits, 'text' | 'contentName'>,
        private readonly _ownObjectId: () => number
    ) {}

    isMonster(objectId: number): boolean
    {
        return this._user(objectId)?.type === UserDataType.PET;
    }

    /** Null: nobody of the room has this id. */
    nameOf(objectId: number): string | null
    {
        const user = this._user(objectId);

        if(!user) return null;

        return user.type === UserDataType.PET ? this._texts().contentName(`${user.name}.name`, user.name) : user.name;
    }

    /** A log line's name: « you » for the player, '' for someone gone. */
    name(objectId: number): string
    {
        return objectId === this._ownObjectId() ? this._texts().text('vortex.combat.log.you') : this.nameOf(objectId) ?? '';
    }

    content(id: string): string
    {
        return this._texts().contentName(`${id}.name`, id);
    }
}
