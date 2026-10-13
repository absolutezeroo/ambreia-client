import type {IVitals} from '../IVitals';

/** Every combatant's last known health, and the player's own mana (only his is on the wire). */
export class VitalsBook
{
    private readonly _byObject = new Map<number, IVitals>();

    of(objectId: number): IVitals | null
    {
        return this._byObject.get(objectId) ?? null;
    }

    /** A health line (a blow, a vitals line) keeps the mana already known. */
    setHealth(objectId: number, health: number, maxHealth: number): IVitals
    {
        const known = this._byObject.get(objectId);
        const vitals: IVitals = {health, maxHealth, mana: known?.mana ?? null, maxMana: known?.maxMana ?? null};

        this._byObject.set(objectId, vitals);

        return vitals;
    }

    setOwn(objectId: number, health: number, maxHealth: number, mana: number, maxMana: number): IVitals
    {
        const vitals: IVitals = {health, maxHealth, mana, maxMana};

        this._byObject.set(objectId, vitals);

        return vitals;
    }

    forget(objectId: number): void
    {
        this._byObject.delete(objectId);
    }

    clear(): void
    {
        this._byObject.clear();
    }
}
