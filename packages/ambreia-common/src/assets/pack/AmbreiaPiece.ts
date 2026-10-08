import {deflateRaw, inflateRaw} from 'pako';
import {encodeManifest} from './ManifestCodec';

/**
 * One .ambreia piece: the optimised form of one .nitro bundle (plan 2026-10-08-asset-packs,
 * revision). Big-endian:
 *
 *   "AMBP", u16 version, u16 flags, 8 bytes: id of the manifest dictionary
 *   u32 length + manifest (ManifestCodec, deflate-raw with the directory's dictionary)
 *   u16 image count, then per image:
 *     u8 flags: 1 = entry name is not `<name>.png` (u16 length + name follows), 2 = PNG kept,
 *               4 = shared (20-byte sha1 of the file in `images/` instead of the bytes)
 *     u32 length + bytes, or the sha1
 */
export const PIECE_MAGIC = 'AMBP';
export const PIECE_VERSION = 1;

const NAMED = 1;
const PNG = 2;
const SHARED = 4;

export type PieceImageFormat = 'webp' | 'png';

export interface IPieceImage
{
    /** The image's file name inside the .nitro (`throne.png`). */
    entryName: string;
    format: PieceImageFormat;
    /** The image itself, when only this piece uses it. */
    bytes?: Uint8Array;
    /** Hex sha1 of the shared file `images/<sha1>.<format>`, when several pieces use it. */
    shared?: string;
}

export interface IPiece
{
    /** 16 hex characters: which dictionary the manifest was compressed with. */
    dictionaryId: string;
    manifest: Uint8Array;
    images: IPieceImage[];
}

export function compressManifest(manifest: Record<string, unknown>, dictionary: Uint8Array): Uint8Array
{
    return deflateRaw(new TextEncoder().encode(JSON.stringify(encodeManifest(manifest))), {level: 9, dictionary});
}

export function inflateManifest(bytes: Uint8Array, dictionary: Uint8Array): Uint8Array
{
    // pako's inflate takes `dictionary` (its deflate's twin); @types/pako only declares it for deflate.
    return inflateRaw(bytes, {dictionary} as Parameters<typeof inflateRaw>[1]);
}

const hexToBytes = (hex: string): Uint8Array => Uint8Array.from(hex.match(/../g) ?? [], pair => parseInt(pair, 16));
const bytesToHex = (bytes: Uint8Array): string => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

export function encodePiece(piece: IPiece, name: string): Uint8Array
{
    const text = new TextEncoder();
    const parts: Uint8Array[] = [];
    const u8 = (value: number): void => { parts.push(Uint8Array.of(value)); };
    const u16 = (value: number): void => { parts.push(Uint8Array.of(value >> 8, value & 0xff)); };
    const u32 = (value: number): void => { parts.push(Uint8Array.of(value >>> 24, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)); };

    parts.push(text.encode(PIECE_MAGIC));
    u16(PIECE_VERSION);
    u16(0);
    parts.push(hexToBytes(piece.dictionaryId));
    u32(piece.manifest.length);
    parts.push(piece.manifest);
    u16(piece.images.length);

    for(const image of piece.images)
    {
        const named = image.entryName !== `${name}.png`;

        u8((named ? NAMED : 0) | (image.format === 'png' ? PNG : 0) | (image.shared ? SHARED : 0));

        if(named)
        {
            const entry = text.encode(image.entryName);

            u16(entry.length);
            parts.push(entry);
        }

        if(image.shared) parts.push(hexToBytes(image.shared));
        else
        {
            u32(image.bytes!.length);
            parts.push(image.bytes!);
        }
    }

    const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    let at = 0;

    for(const part of parts)
    {
        out.set(part, at);
        at += part.length;
    }

    return out;
}

export function decodePiece(bytes: Uint8Array, name: string): IPiece
{
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
    const text = new TextDecoder();

    if(text.decode(bytes.subarray(0, 4)) !== PIECE_MAGIC) throw new Error(`${name}.ambreia is not an .ambreia piece (bad magic)`);

    const version = view.getUint16(4);

    if(version !== PIECE_VERSION) throw new Error(`${name}.ambreia: unsupported version ${version} (this client reads ${PIECE_VERSION})`);

    const dictionaryId = bytesToHex(bytes.subarray(8, 16));
    const manifestLength = view.getUint32(16);
    const manifest = bytes.subarray(20, 20 + manifestLength);
    let at = 20 + manifestLength;
    const count = view.getUint16(at);
    const images: IPieceImage[] = [];

    at += 2;

    for(let i = 0; i < count; i++)
    {
        const flags = bytes[at++];
        let entryName = `${name}.png`;

        if(flags & NAMED)
        {
            const length = view.getUint16(at);

            entryName = text.decode(bytes.subarray(at + 2, at + 2 + length));
            at += 2 + length;
        }

        const format: PieceImageFormat = flags & PNG ? 'png' : 'webp';

        if(flags & SHARED)
        {
            images.push({entryName, format, shared: bytesToHex(bytes.subarray(at, at + 20))});
            at += 20;
        }
        else
        {
            const length = view.getUint32(at);

            images.push({entryName, format, bytes: bytes.subarray(at + 4, at + 4 + length)});
            at += 4 + length;
        }
    }

    return {dictionaryId, manifest, images};
}
