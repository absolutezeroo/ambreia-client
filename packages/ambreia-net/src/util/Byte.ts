/**
 * Byte wrapper class for message composition
 * Used to explicitly mark a value as a single byte in message arrays
 */
export class Byte
{
    // AS3: .../src/com/sulake/core/communication/util/Byte.as::get value()
    public readonly value: number;

    constructor(value: number)
    {
        this.value = value & 0xFF;
    }

    toString(): string
    {
        return `Byte(${this.value})`;
    }
}
