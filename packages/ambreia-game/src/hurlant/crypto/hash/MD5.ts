/**
 * MD5 — hurlant as3crypto's MD5, ported member for member.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as
 *
 * The client reaches this from exactly one place: the new mod tool hashes
 * `ownerName + "-" + roomName` and compares it to a hard-coded digest to decide whether a whisper
 * may open the tool. It is ported rather than replaced by a library so that check stays byte-exact.
 *
 * **`uint` semantics are the whole correctness story.** AS3 stores every intermediate in a `uint`,
 * which wraps at 32 bits on assignment. JavaScript numbers do not, so every value that AS3 would
 * have truncated is put back through `>>> 0` here. The bitwise operators need no help — `<<`, `|`
 * and `>>>` already run their operands through ToInt32/ToUint32 — but the additions in `cmn()` and
 * the four accumulators at the end of a block do.
 *
 * AS3's `hash()` pads its `ByteArray` argument up to a multiple of four and then restores the
 * original length before returning, so the caller sees it unchanged. This port copies into a padded
 * buffer instead, which has the same observable result without mutating the caller's array.
 */
import type {IHash} from './IHash';

export class MD5 implements IHash
{
    /** Derived name — `_SafeStr_10421`; the digest length in bytes, matching `getHashSize()`. */
    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::_SafeStr_10421
    public static readonly HASH_SIZE: number = 16;

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::pad_size
    public padSize: number = 48;

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::getInputSize()
    public getInputSize(): number
    {
        return 64;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::getHashSize()
    public getHashSize(): number
    {
        return 16;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::getPadSize()
    public getPadSize(): number
    {
        return this.padSize;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::hash()
    public hash(source: Uint8Array): Uint8Array
    {
        const bitLength = source.length * 8;
        const paddedLength = source.length + ((4 - (source.length % 4)) % 4);
        const padded = new Uint8Array(paddedLength);

        padded.set(source);

        const words: number[] = [];

        for(let index = 0; index < paddedLength; index += 4)
        {
            words.push(
                (padded[index]
                    | (padded[index + 1] << 8)
                    | (padded[index + 2] << 16)
                    | (padded[index + 3] << 24)) >>> 0
            );
        }

        const digest = this.coreMd5(words, bitLength);
        const result = new Uint8Array(16);

        for(let index = 0; index < 4; index++)
        {
            const word = digest[index];

            result[index * 4] = word & 0xFF;
            result[index * 4 + 1] = (word >>> 8) & 0xFF;
            result[index * 4 + 2] = (word >>> 16) & 0xFF;
            result[index * 4 + 3] = (word >>> 24) & 0xFF;
        }

        return result;
    }

    /**
     * AS3 fills each block's sixteen slots with `||= 0` before use, because the padding assignments
     * above can leave holes in the `Array`. A JavaScript hole reads as `undefined`, so the same
     * guard is required here and for the same reason.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::core_md5()
    private coreMd5(x: number[], len: number): number[]
    {
        x[len >> 5] = (x[len >> 5] ?? 0) | (128 << (len % 32));
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        let a = 1732584193;
        let b = 4023233417;
        let c = 2562383102;
        let d = 271733878;

        for(let i = 0; i < x.length; i += 16)
        {
            for(let slot = 0; slot < 16; slot++)
            {
                if(!x[i + slot]) x[i + slot] = 0;
            }

            const olda = a;
            const oldb = b;
            const oldc = c;
            const oldd = d;

            a = MD5.ff(a, b, c, d, x[i + 0], 7, 3614090360);
            d = MD5.ff(d, a, b, c, x[i + 1], 12, 3905402710);
            c = MD5.ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = MD5.ff(b, c, d, a, x[i + 3], 22, 3250441966);
            a = MD5.ff(a, b, c, d, x[i + 4], 7, 4118548399);
            d = MD5.ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = MD5.ff(c, d, a, b, x[i + 6], 17, 2821735955);
            b = MD5.ff(b, c, d, a, x[i + 7], 22, 4249261313);
            a = MD5.ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = MD5.ff(d, a, b, c, x[i + 9], 12, 2336552879);
            c = MD5.ff(c, d, a, b, x[i + 10], 17, 4294925233);
            b = MD5.ff(b, c, d, a, x[i + 11], 22, 2304563134);
            a = MD5.ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = MD5.ff(d, a, b, c, x[i + 13], 12, 4254626195);
            c = MD5.ff(c, d, a, b, x[i + 14], 17, 2792965006);
            b = MD5.ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = MD5.gg(a, b, c, d, x[i + 1], 5, 4129170786);
            d = MD5.gg(d, a, b, c, x[i + 6], 9, 3225465664);
            c = MD5.gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = MD5.gg(b, c, d, a, x[i + 0], 20, 3921069994);
            a = MD5.gg(a, b, c, d, x[i + 5], 5, 3593408605);
            d = MD5.gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = MD5.gg(c, d, a, b, x[i + 15], 14, 3634488961);
            b = MD5.gg(b, c, d, a, x[i + 4], 20, 3889429448);
            a = MD5.gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = MD5.gg(d, a, b, c, x[i + 14], 9, 3275163606);
            c = MD5.gg(c, d, a, b, x[i + 3], 14, 4107603335);
            b = MD5.gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = MD5.gg(a, b, c, d, x[i + 13], 5, 2850285829);
            d = MD5.gg(d, a, b, c, x[i + 2], 9, 4243563512);
            c = MD5.gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = MD5.gg(b, c, d, a, x[i + 12], 20, 2368359562);
            a = MD5.hh(a, b, c, d, x[i + 5], 4, 4294588738);
            d = MD5.hh(d, a, b, c, x[i + 8], 11, 2272392833);
            c = MD5.hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = MD5.hh(b, c, d, a, x[i + 14], 23, 4259657740);
            a = MD5.hh(a, b, c, d, x[i + 1], 4, 2763975236);
            d = MD5.hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = MD5.hh(c, d, a, b, x[i + 7], 16, 4139469664);
            b = MD5.hh(b, c, d, a, x[i + 10], 23, 3200236656);
            a = MD5.hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = MD5.hh(d, a, b, c, x[i + 0], 11, 3936430074);
            c = MD5.hh(c, d, a, b, x[i + 3], 16, 3572445317);
            b = MD5.hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = MD5.hh(a, b, c, d, x[i + 9], 4, 3654602809);
            d = MD5.hh(d, a, b, c, x[i + 12], 11, 3873151461);
            c = MD5.hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = MD5.hh(b, c, d, a, x[i + 2], 23, 3299628645);
            a = MD5.ii(a, b, c, d, x[i + 0], 6, 4096336452);
            d = MD5.ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = MD5.ii(c, d, a, b, x[i + 14], 15, 2878612391);
            b = MD5.ii(b, c, d, a, x[i + 5], 21, 4237533241);
            a = MD5.ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = MD5.ii(d, a, b, c, x[i + 3], 10, 2399980690);
            c = MD5.ii(c, d, a, b, x[i + 10], 15, 4293915773);
            b = MD5.ii(b, c, d, a, x[i + 1], 21, 2240044497);
            a = MD5.ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = MD5.ii(d, a, b, c, x[i + 15], 10, 4264355552);
            c = MD5.ii(c, d, a, b, x[i + 6], 15, 2734768916);
            b = MD5.ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = MD5.ii(a, b, c, d, x[i + 4], 6, 4149444226);
            d = MD5.ii(d, a, b, c, x[i + 11], 10, 3174756917);
            c = MD5.ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = MD5.ii(b, c, d, a, x[i + 9], 21, 3951481745);

            a = (a + olda) >>> 0;
            b = (b + oldb) >>> 0;
            c = (c + oldc) >>> 0;
            d = (d + oldd) >>> 0;
        }

        return [a, b, c, d];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::rol()
    private static rol(value: number, count: number): number
    {
        return ((value << count) | (value >>> (32 - count))) >>> 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::cmn()
    private static cmn(q: number, a: number, b: number, x: number, s: number, t: number): number
    {
        return (MD5.rol((a + q + x + t) >>> 0, s) + b) >>> 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::ff()
    private static ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number
    {
        return MD5.cmn(((b & c) | (~b & d)) >>> 0, a, b, x, s, t);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::gg()
    private static gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number
    {
        return MD5.cmn(((b & d) | (c & ~d)) >>> 0, a, b, x, s, t);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::hh()
    private static hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number
    {
        return MD5.cmn((b ^ c ^ d) >>> 0, a, b, x, s, t);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::ii()
    private static ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number
    {
        return MD5.cmn((c ^ (b | ~d)) >>> 0, a, b, x, s, t);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/MD5.as::toString()
    public toString(): string
    {
        return 'md5';
    }
}
