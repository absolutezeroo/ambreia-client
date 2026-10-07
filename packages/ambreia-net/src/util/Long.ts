/**
 * Long wrapper class for message composition
 * Used to explicitly mark a value as a 64-bit integer in message arrays
 * JavaScript numbers can safely represent integers up to 2^53 - 1
 */
export class Long
{
    // AS3: .../src/com/sulake/core/communication/util/Long.as::get value()
    public readonly value: number;

    constructor(value: number)
    {
        this.value = value;
    }

    /**
	 * Get the high 32 bits
	 */
    get high(): number
    {
        return Math.floor(this.value / 0x100000000);
    }

    /**
	 * Get the low 32 bits
	 */
    get low(): number
    {
        return this.value >>> 0;
    }

    /**
	 * Create from high and low 32-bit parts
	 */
    static fromParts(high: number, low: number): Long
    {
        const value = high * 0x100000000 + (low >>> 0);
        return new Long(value);
    }

    toString(): string
    {
        return `Long(${this.value})`;
    }
}
