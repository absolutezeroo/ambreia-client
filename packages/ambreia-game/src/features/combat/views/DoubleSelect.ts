/**
 * Two selections of the same object within `windowMs` (a double click, as the room engine reports
 * clicks: one REOE_SELECTED each). The pair resets after it fires, and on any other object.
 */
export class DoubleSelect
{
    private _last: {objectId: number; at: number} | null = null;

    constructor(private readonly _windowMs: number) {}

    /** True on the second click of a pair. */
    select(objectId: number, now: number): boolean
    {
        const last = this._last;

        if(last && last.objectId === objectId && now - last.at <= this._windowMs)
        {
            this._last = null;

            return true;
        }

        this._last = {objectId, at: now};

        return false;
    }
}
