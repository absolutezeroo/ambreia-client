import {deflateRaw, inflateRaw} from 'pako';
import {encodeManifest} from './ManifestCodec';

/**
 * The .ambreia pack format, v1 (plan 2026-10-08-asset-packs). Big-endian throughout:
 *
 *   0   "AMBR"          magic
 *   4   u16 version, u16 flags
 *   8   u32 topLength   bytes of the top level, which follows
 *   12  top level: u32 length + deflate-raw JSON IPackTop, then u32 length + the manifests' deflate
 *       dictionary
 *   ..  the index shards, each deflate-raw JSON IPackShard
 *   ..  data: per piece, its manifest (deflate-raw with the dictionary), then the images it is the
 *       first to use — so one Range reads a piece whole
 *
 * The index is sharded by a hash of the piece name (~256 pieces a shard): a client that shows six
 * pieces reads the top level and at most six small shards, never the index of the whole pack.
 */
export const PACK_MAGIC = 'AMBR';
export const PACK_VERSION = 1;
export const PACK_HEAD_LENGTH = 12;
/** What a reader asks for first: the head and, nearly always, the whole top level with it. */
export const PACK_PREFIX_LENGTH = 64 * 1024;

const PIECES_PER_SHARD = 256;

export type PackImageExt = 'webp' | 'png';

export interface IPackTop
{
    v: number;
    kind: string;
    /** [offset, length] of each shard, from the end of the top level */
    shards: Array<[number, number]>;
}

/**
 * name → [manifest offset, manifest length, images]; an image is [entry name, offset, length,
 * format] with entry name 0 for `<name>.png`, format 0 for WebP and 1 for PNG. Offsets are from
 * the start of the data.
 */
export type IPackShard = Record<string, [number, number, Array<[string | 0, number, number, 0 | 1]>]>;

export interface IPackImageInput
{
    /** The image's file name inside the .nitro, e.g. `hat_U_party7.png`. */
    entryName: string;
    /** Content identity: pieces sharing a key share the stored image. */
    key: string;
    ext: PackImageExt;
    /** Called only for a key not stored yet, so a build converts each image once. */
    bytes(): Uint8Array;
}

/** The shard a piece name lives in (FNV-1a over the UTF-16 code units). */
export function shardOf(name: string, shardCount: number): number
{
    let hash = 0x811c9dc5;

    for(let i = 0; i < name.length; i++)
    {
        hash ^= name.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }

    return (hash >>> 0) % shardCount;
}

const deflateJson = (value: unknown, options: {dictionary?: Uint8Array} = {}): Uint8Array =>
    deflateRaw(new TextEncoder().encode(JSON.stringify(value)), {level: 9, ...options});

/** Writes the data as it goes (a pack can be half a gigabyte), then hands back everything before it. */
export class AssetPackWriter
{
    private readonly _items = new Map<string, IPackShard[string]>();
    private readonly _imageByKey = new Map<string, [number, number, 0 | 1]>();
    private _offset = 0;

    constructor(private readonly _kind: string, private readonly _dictionary: Uint8Array, private readonly _write: (chunk: Uint8Array) => void) {}

    /** Adds a piece; returns its compressed manifest, so a build can check it decodes back. */
    addItem(name: string, manifest: Record<string, unknown>, images: readonly IPackImageInput[]): Uint8Array
    {
        if(this._items.has(name)) throw new Error(`Pack: "${name}" is added twice`);

        const compressed = deflateJson(encodeManifest(manifest), {dictionary: this._dictionary});
        const entries: IPackShard[string][2] = [];

        this._items.set(name, [this._offset, compressed.length, entries]);
        this.append(compressed);

        for(const image of images)
        {
            let span = this._imageByKey.get(image.key);

            if(!span)
            {
                const bytes = image.bytes();

                span = [this._offset, bytes.length, image.ext === 'webp' ? 0 : 1];
                this._imageByKey.set(image.key, span);
                this.append(bytes);
            }

            entries.push([image.entryName === `${name}.png` ? 0 : image.entryName, ...span]);
        }

        return compressed;
    }

    /** Whether an image with this key is stored already (later pieces only point at it). */
    hasImage(key: string): boolean
    {
        return this._imageByKey.has(key);
    }

    /** Head, top level and index shards: what goes in front of the data written so far. */
    finish(): Uint8Array
    {
        const shardCount = Math.max(1, Math.ceil(this._items.size / PIECES_PER_SHARD));
        const shards: IPackShard[] = Array.from({length: shardCount}, () => ({}));

        for(const [name, item] of this._items) shards[shardOf(name, shardCount)][name] = item;

        const blobs = shards.map(shard => deflateJson(shard));
        const spans: Array<[number, number]> = [];
        let at = 0;

        for(const blob of blobs)
        {
            spans.push([at, blob.length]);
            at += blob.length;
        }

        const top = deflateJson({v: PACK_VERSION, kind: this._kind, shards: spans} satisfies IPackTop);
        const topLength = 4 + top.length + 4 + this._dictionary.length;
        const head = new Uint8Array(PACK_HEAD_LENGTH + topLength + at);
        const view = new DataView(head.buffer);
        let cursor = PACK_HEAD_LENGTH + topLength;

        head.set(new TextEncoder().encode(PACK_MAGIC), 0);
        view.setUint16(4, PACK_VERSION);
        view.setUint16(6, 0);
        view.setUint32(8, topLength);
        view.setUint32(12, top.length);
        head.set(top, 16);
        view.setUint32(16 + top.length, this._dictionary.length);
        head.set(this._dictionary, 20 + top.length);

        for(const blob of blobs)
        {
            head.set(blob, cursor);
            cursor += blob.length;
        }

        return head;
    }

    private append(bytes: Uint8Array): void
    {
        this._write(bytes);
        this._offset += bytes.length;
    }
}

/** The length of the top level, from the first PACK_HEAD_LENGTH bytes. */
export function readPackHead(head: Uint8Array): number
{
    if(head.length < PACK_HEAD_LENGTH || new TextDecoder().decode(head.subarray(0, 4)) !== PACK_MAGIC)
    {
        throw new Error('Not an .ambreia pack (bad magic)');
    }

    const view = new DataView(head.buffer, head.byteOffset, head.length);
    const version = view.getUint16(4);

    if(version !== PACK_VERSION) throw new Error(`Unsupported .ambreia pack version ${version} (this client reads ${PACK_VERSION})`);

    return view.getUint32(8);
}

/** The top level (shard table) and the manifests' dictionary, from the bytes after the head. */
export function parsePackTop(bytes: Uint8Array): {top: IPackTop; dictionary: Uint8Array}
{
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
    const topLength = view.getUint32(0);
    const top = JSON.parse(new TextDecoder().decode(inflateRaw(bytes.subarray(4, 4 + topLength)))) as IPackTop;
    const dictionaryLength = view.getUint32(4 + topLength);

    return {top, dictionary: bytes.slice(8 + topLength, 8 + topLength + dictionaryLength)};
}

export function parsePackShard(bytes: Uint8Array): IPackShard
{
    return JSON.parse(new TextDecoder().decode(inflateRaw(bytes))) as IPackShard;
}

export function inflateManifest(bytes: Uint8Array, dictionary: Uint8Array): Uint8Array
{
    // pako's inflate takes `dictionary` (its deflate's twin); @types/pako only declares it for deflate.
    return inflateRaw(bytes, {dictionary} as Parameters<typeof inflateRaw>[1]);
}
