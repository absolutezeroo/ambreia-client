/** A telegraph's cells (M1c): red under a monster's cast, the cast bar's gold under a player's. */
const HOSTILE_TELEGRAPH = 0xe03030;
const FRIENDLY_TELEGRAPH = 0xe8b830;

/** What a telegraphed cast shows on the floor (RoomEngine.showRpgTelegraph()) until its RpgCastEnd. */
export class Telegraphs
{
    /**
     * @param show - its cells on the floor, in a colour
     * @param clear - a caster's cells off the floor; null for every caster's
     * @param isMonster - the caster is a monster (hostile)
     */
    constructor(
        private readonly _show: (casterObjectId: number, cells: readonly {x: number; y: number}[], delayMs: number, color: number) => void,
        private readonly _clear: (casterObjectId: number | null) => void,
        private readonly _isMonster: (objectId: number) => boolean
    ) {}

    show(telegraphs: readonly {casterObjectId: number; cells: readonly {x: number; y: number}[]; delayMs: number}[]): void
    {
        for(const telegraph of telegraphs) this._show(telegraph.casterObjectId, telegraph.cells, telegraph.delayMs, this._isMonster(telegraph.casterObjectId) ? HOSTILE_TELEGRAPH : FRIENDLY_TELEGRAPH);
    }

    end(ends: readonly {casterObjectId: number}[]): void
    {
        for(const end of ends) this._clear(end.casterObjectId);
    }

    clear(): void
    {
        this._clear(null);
    }
}
