/** The player's cooldowns (RpgCooldowns, M1b §6.5): the list is complete, a skill missing from it is ready. */
export class CooldownBook
{
    private readonly _readyAt = new Map<string, number>();
    private _globalReadyAt = 0;

    get globalReadyAt(): number
    {
        return this._globalReadyAt;
    }

    /** All the deadlines, for a view that lists them. */
    get all(): ReadonlyMap<string, number>
    {
        return this._readyAt;
    }

    /** The deadline of this skill's cooldown; 0 when ready. */
    readyAt(skillId: string): number
    {
        return this._readyAt.get(skillId) ?? 0;
    }

    set(globalRemainingMs: number, skills: readonly {skillId: string; remainingMs: number}[], now: number): void
    {
        this._readyAt.clear();
        for(const skill of skills) this._readyAt.set(skill.skillId, now + skill.remainingMs);
        this._globalReadyAt = now + globalRemainingMs;
    }

    clear(): void
    {
        this._readyAt.clear();
        this._globalReadyAt = 0;
    }
}
