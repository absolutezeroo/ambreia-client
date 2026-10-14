import {EventEmitter} from 'eventemitter3';
import type {IRpgNpcMarker} from '@ambreia/protocol/incoming/rpg/quests/IRpgNpcMarker';
import type {IQuests} from '../IQuests';

/**
 * The zone's NPCs and their markers for this player (RpgNpcs, M2a §3.2), by room object id: the whole
 * list each time. Kept by id even before the room knows the unit — they come apart from its entry.
 */
export class NpcMarkers implements IQuests
{
    readonly events = new EventEmitter<{changed: []}>();
    private _byObject = new Map<number, string>();

    get all(): ReadonlyMap<number, string>
    {
        return this._byObject;
    }

    set(npcs: readonly IRpgNpcMarker[]): void
    {
        this._byObject = new Map(npcs.map(npc => [npc.objectId, npc.marker]));
        this.events.emit('changed');
    }

    markerOf(objectId: number): string | null
    {
        return this._byObject.get(objectId) ?? null;
    }

    isNpc(objectId: number): boolean
    {
        return this._byObject.has(objectId);
    }

    clear(): void
    {
        this.set([]);
    }
}
