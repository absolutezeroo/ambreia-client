/**
 * IHash — the hurlant as3crypto hash interface, ported verbatim.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/IHash.as
 *
 * `ByteArray` becomes `Uint8Array`; the AS3 `uint` returns become `number`.
 */
export interface IHash
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/IHash.as::getInputSize()
    getInputSize(): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/IHash.as::getHashSize()
    getHashSize(): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/IHash.as::hash()
    hash(source: Uint8Array): Uint8Array;

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/IHash.as::toString()
    toString(): string;

    // AS3: sources/WIN63-202607011411-782849652/src/com/hurlant/crypto/hash/IHash.as::getPadSize()
    getPadSize(): number;
}
