/**
 * Randomizer
 *
 * Based on AS3: com.sulake.habbo.room.object.visualization.room.utils.Randomizer
 *
 * Static seeded PRNG for deterministic random patterns in plane materials.
 */
export class Randomizer
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::DEFAULT_SEED
    public static readonly DEFAULT_SEED: number = 1;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::DEFAULT_MODULUS
    public static readonly DEFAULT_MODULUS: number = 16777216;

    private static _instance: Randomizer | null = null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::_seed
    private _seed: number = 1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::_multiplier
    private _multiplier: number = 69069;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::_increment
    private _increment: number = 5;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::_modulus
    private _modulus: number = 16777216;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::setSeed()
    static setSeed(seed: number = 1): void
    {
        if(Randomizer._instance === null)
        {
            Randomizer._instance = new Randomizer();
        }
        Randomizer._instance._seed = seed;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::setModulus()
    static setModulus(modulus: number = 16777216): void
    {
        if(Randomizer._instance === null)
        {
            Randomizer._instance = new Randomizer();
        }
        if(modulus < 1)
        {
            modulus = 1;
        }
        Randomizer._instance._modulus = modulus;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::getValues()
    static getValues(count: number, min: number, max: number): number[]
    {
        if(Randomizer._instance === null)
        {
            Randomizer._instance = new Randomizer();
        }
        return Randomizer._instance.getRandomValues(count, min, max);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::getArray()
    static getArray(count: number, max: number): number[]
    {
        if(Randomizer._instance === null)
        {
            Randomizer._instance = new Randomizer();
        }
        return Randomizer._instance.getRandomArray(count, max);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::getRandomValues()
    private getRandomValues(count: number, min: number, max: number): number[]
    {
        const result: number[] = [];
        for(let i = 0; i < count; i++)
        {
            result.push(this.iterateScaled(min, max - min));
        }
        return result;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::getRandomArray()
    private getRandomArray(count: number, max: number): number[]
    {
        if(count > max || max > 1000)
        {
            return [];
        }
        const pool: number[] = [];
        for(let i = 0; i <= max; i++)
        {
            pool.push(i);
        }
        const result: number[] = [];
        for(let i = 0; i < count; i++)
        {
            const idx = this.iterateScaled(0, pool.length - 1);
            result.push(pool[idx]);
            pool.splice(idx, 1);
        }
        return result;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::iterate()
    private iterate(): number
    {
        let value = this._multiplier * this._seed + this._increment;
        if(value < 0)
        {
            value = -value;
        }
        value %= this._modulus;
        this._seed = value;
        return value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/utils/Randomizer.as::iterateScaled()
    private iterateScaled(min: number, range: number): number
    {
        const value = this.iterate();
        if(range < 1)
        {
            return min;
        }
        return Math.floor(min + (value / this._modulus) * range);
    }
}
