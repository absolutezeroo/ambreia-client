import type {IStatusEntry} from '../IStatusEntry';
import type {IVfxPhase} from '../IVfx';
import {auraDiff} from './auraDiff';

/**
 * The status auras (M1d §3): the content's aura of each status, looped on its object while the
 * status lasts. `loop` starts one and returns its stop, or null when the sheet is not there.
 */
export class AuraLayer
{
    private readonly _playing = new Map<number, Map<string, () => void>>();
    private _disposed = false;

    constructor(private readonly _loop: (phase: IVfxPhase, objectId: number) => (() => void) | null, private readonly _aura: (statusId: string) => IVfxPhase | null) {}

    /** The object's statuses are now these. */
    update(objectId: number, statuses: readonly IStatusEntry[]): void
    {
        if(this._disposed) return;

        const playing = this._playing.get(objectId) ?? new Map<string, () => void>();
        const {start, stop} = auraDiff(new Set(playing.keys()), statuses, this._aura);

        for(const statusId of stop)
        {
            playing.get(statusId)?.();
            playing.delete(statusId);
        }

        for(const statusId of start)
        {
            const halt = this._loop(this._aura(statusId)!, objectId);

            // Without its sheet nothing plays; a no-op keeps it from being retried on every update.
            playing.set(statusId, halt ?? (() => undefined));
        }

        if(playing.size > 0) this._playing.set(objectId, playing);
        else this._playing.delete(objectId);
    }

    /** The object left (killed, gone): its auras with it. */
    forget(objectId: number): void
    {
        for(const halt of this._playing.get(objectId)?.values() ?? []) halt();

        this._playing.delete(objectId);
    }

    /** The zone was left. */
    clear(): void
    {
        for(const objectId of [...this._playing.keys()]) this.forget(objectId);
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this.clear();
    }
}
