import type {IStatusEntry} from '../IStatusEntry';
import type {IVfxPhase} from '../IVfx';

/** Which auras start and stop when an object's statuses become `after`; statuses without an aura count for nothing. */
export function auraDiff(before: ReadonlySet<string>, after: readonly IStatusEntry[], aura: (statusId: string) => IVfxPhase | null): {start: string[]; stop: string[]}
{
    const now = new Set(after.map(entry => entry.statusId).filter(id => aura(id) !== null));

    return {start: [...now].filter(id => !before.has(id)), stop: [...before].filter(id => !now.has(id))};
}
