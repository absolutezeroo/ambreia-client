import {deflateRaw, inflateRaw} from 'pako';
import {encodeManifest} from './ManifestCodec';

/**
 * The .ambreia pack format, v1 (plan 2026-10-08-asset-packs). Big-endian throughout:
 *
 *   0   "AMBR"            magic
 *   4   u16 version, u16 flags
 *   8   u32 regionLength  bytes from 12 to the start of the data
 *   12  u32 indexLength, index (deflate-raw JSON, IPackIndex)
 *   ..  u32 dictionaryLength, the deflate dictionary of the manifests
 *   ..  data: per piece, its manifest (deflate-raw with the dictionary), then the images it is the
 *       first to use — so one Range reads a piece whole
 */
export const PACK_MAGIC = 'AMBR';
export const PACK_VERSION = 1;
export const PACK_HEAD_LENGTH = 12;

export type PackImageExt = 'webp' | 'png';

export interface IPackIndex
{
    v: number;
    kind: string;
    /** name → [manifest offset, manifest length, [[entry name in the .nitro, image index], …]] */
    items: Record<string, [number, number, Array<[string, number]>]>;
    /** [offset, length, format]; offsets from the start of the data */
    images: Array<[number, number, PackImageExt]>;
}

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

/** Writes the data as it goes (a pack can be half a gigabyte), then hands back the head. */
export class AssetPackWriter
{
    private readonly _index: IPackIndex;
    private readonly _imageByKey = new Map<string, number>();
    private _offset = 0;

    constructor(kind: string, private readonly _dictionary: Uint8Array, private readonly _write: (chunk: Uint8Array) => void)
    {
        this._index = {v: PACK_VERSION, kind, items: {}, images: []};
    }

    addItem(name: string, manifest: Record<string, unknown>, images: readonly IPackImageInput[]): void
    {
        if(this._index.items[name]) throw new Error(`Pack: "${name}" is added twice`);

        const compressed = deflateRaw(new TextEncoder().encode(JSON.stringify(encodeManifest(manifest))), {level: 9, dictionary: this._dictionary});
        const entries: Array<[string, number]> = [];

        this._index.items[name] = [this._offset, compressed.length, entries];
        this.append(compressed);

        for(const image of images)
        {
            let at = this._imageByKey.get(image.key);

            if(at === undefined)
            {
                const bytes = image.bytes();

                at = this._index.images.length;
                this._index.images.push([this._offset, bytes.length, image.ext]);
                this._imageByKey.set(image.key, at);
                this.append(bytes);
            }

            entries.push([image.entryName, at]);
        }
    }

    finish(): Uint8Array
    {
        const index = deflateRaw(new TextEncoder().encode(JSON.stringify(this._index)), {level: 9});
        const regionLength = 4 + index.length + 4 + this._dictionary.length;
        const head = new Uint8Array(PACK_HEAD_LENGTH + regionLength);
        const view = new DataView(head.buffer);

        head.set(new TextEncoder().encode(PACK_MAGIC), 0);
        view.setUint16(4, PACK_VERSION);
        view.setUint16(6, 0);
        view.setUint32(8, regionLength);
        view.setUint32(12, index.length);
        head.set(index, 16);
        view.setUint32(16 + index.length, this._dictionary.length);
        head.set(this._dictionary, 20 + index.length);

        return head;
    }

    get itemCount(): number
    {
        return Object.keys(this._index.items).length;
    }

    get imageCount(): number
    {
        return this._index.images.length;
    }

    private append(bytes: Uint8Array): void
    {
        this._write(bytes);
        this._offset += bytes.length;
    }
}

/** The length of the index region, from the first PACK_HEAD_LENGTH bytes. */
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

export function parsePackIndexRegion(region: Uint8Array): {index: IPackIndex; dictionary: Uint8Array}
{
    const view = new DataView(region.buffer, region.byteOffset, region.length);
    const indexLength = view.getUint32(0);
    const index = JSON.parse(new TextDecoder().decode(inflateRaw(region.subarray(4, 4 + indexLength)))) as IPackIndex;
    const dictionaryLength = view.getUint32(4 + indexLength);

    return {index, dictionary: region.slice(8 + indexLength, 8 + indexLength + dictionaryLength)};
}

export function inflateManifest(bytes: Uint8Array, dictionary: Uint8Array): Uint8Array
{
    return inflateRaw(bytes, {dictionary});
}
