/**
 * Hex — hurlant's byte/hex conversion helper.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/hurlant/util/_SafeCls_69.as
 *
 * All six members are ported. `fromArray()` is the only one this client reaches — from the new
 * mod tool's room-name check — and `toRawString()`/`fromRawString()` are dead in AS3 itself
 * (only the declarations appear in WIN63, win63_version and PRODUCTION). They are the whole of a
 * small self-contained utility, so the class is carried complete rather than trimmed to its one
 * live member.
 *
 * DEVIATION: AS3 routes bytes through `ByteArray.readMultiByte()`/`writeMultiByte()` with a
 *   charset name. Only two charsets are ever passed — `"utf-8"` (the default) and
 *   `"iso-8859-1"` (the raw variants) — so `TextDecoder`/`TextEncoder` covers the first and a
 *   per-code-unit map covers the second, which is exactly what latin-1 is.
 * AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/util/_SafeCls_69.as
 */
export class Hex
{
    /**
     * `("0" + b.toString(16)).substr(-2, 2)` in AS3 — a right-anchored two-character slice, which
     * `padStart(2, '0')` reproduces exactly for the 0..255 a byte can hold.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/util/_SafeCls_69.as::fromArray()
    public static fromArray(bytes: Uint8Array, colons: boolean = false): string
    {
        let result: string = '';

        for(let index = 0; index < bytes.length; index++)
        {
            result += bytes[index].toString(16).padStart(2, '0');

            if(colons)
            {
                if(index < bytes.length - 1) result += ':';
            }
        }

        return result;
    }

    /**
     * Parses a hex string into bytes, tolerating a `0x` prefix, whitespace and colons.
     *
     * An odd number of digits is left-padded with a zero, so `"abc"` reads as `0x0a 0xbc` — AS3's
     * `(length & 1) == 1` check, kept because it decides where the nibbles land.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/util/_SafeCls_69.as::toArray()
    public static toArray(hex: string): Uint8Array
    {
        let cleaned = hex.replace(/^0x|\s|:/gm, '');

        if((cleaned.length & 1) === 1) cleaned = '0' + cleaned;

        const bytes = new Uint8Array(cleaned.length / 2);

        for(let i = 0; i < cleaned.length; i += 2)
        {
            bytes[i / 2] = parseInt(cleaned.substr(i, 2), 16);
        }

        return bytes;
    }

    /**
     * Decodes a hex string into text.
     *
     * `charset` takes the two values AS3 ever passes: `"utf-8"` and `"iso-8859-1"`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/util/_SafeCls_69.as::toString()
    public static toString(hex: string, charset: string = 'utf-8'): string
    {
        const bytes = Hex.toArray(hex);

        if(charset === 'iso-8859-1')
        {
            // latin-1 is the identity map from byte to code point, which is why this needs no
            // decoder — and why TextDecoder('latin1') would be the same thing more slowly.
            let result = '';

            for(const byte of bytes) result += String.fromCharCode(byte);

            return result;
        }

        return new TextDecoder(charset).decode(bytes);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/util/_SafeCls_69.as::toRawString()
    public static toRawString(hex: string): string
    {
        return Hex.toString(hex, 'iso-8859-1');
    }

    /**
     * Encodes text as a hex string.
     *
     * A code point above 0xFF has no latin-1 byte; AS3's `writeMultiByte` substitutes there too,
     * and `& 0xFF` is the same truncation Flash performs.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/util/_SafeCls_69.as::fromString()
    public static fromString(text: string, colons: boolean = false, charset: string = 'utf-8'): string
    {
        let bytes: Uint8Array;

        if(charset === 'iso-8859-1')
        {
            bytes = new Uint8Array(text.length);

            for(let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xFF;
        }
        else
        {
            bytes = new TextEncoder().encode(text);
        }

        return Hex.fromArray(bytes, colons);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/util/_SafeCls_69.as::fromRawString()
    public static fromRawString(text: string, colons: boolean = false): string
    {
        return Hex.fromString(text, colons, 'iso-8859-1');
    }
}
