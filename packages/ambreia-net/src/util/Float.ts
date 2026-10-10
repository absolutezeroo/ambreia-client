/**
 * A value to write as a 32-bit float. The wire format writes a bare `number` as an int: a float
 * is opt-in, so a fractional coordinate in an int field is caught instead of silently encoded as
 * four bytes the server reads as an integer.
 */
export class Float
{
    constructor(public readonly value: number)
    {}
}
