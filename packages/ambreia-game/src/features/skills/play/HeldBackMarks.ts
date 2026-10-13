import type {IStatusDefinition} from '../IStatusDefinition';
import {holdBack} from '../RpgSkillSession';

/** A slow or a stun (M1c): its icon over the combatant, and its steps as long as the server's. */
export class HeldBackMarks
{
    /** The combatants a slow or a stun holds back. */
    private readonly _held = new Set<number>();

    /**
     * @param mark - the icon over a combatant, null for none (RpgCombatSession.mark)
     * @param stepTime - how long its steps take, null for the normal pace (RoomEngine.setRpgStepTime)
     */
    constructor(
        private readonly _definition: (statusId: string) => IStatusDefinition | null,
        private readonly _icon: (statusId: string) => string,
        private readonly _mark: (objectId: number, icon: string | null) => void,
        private readonly _stepTime: (objectId: number, stepMs: number | null) => void
    ) {}

    update(objectId: number, statuses: readonly {statusId: string}[]): void
    {
        const held = holdBack(statuses, this._definition);

        this._mark(objectId, held.statusId === null ? null : this._icon(held.statusId));
        this._stepTime(objectId, held.stepMs);
        if(held.statusId === null) this._held.delete(objectId);
        else this._held.add(objectId);
    }

    /** The zone was left: everyone walks at their own pace again. */
    clear(): void
    {
        for(const objectId of this._held) this._stepTime(objectId, null);
        this._held.clear();
    }
}
