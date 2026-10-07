import {decodeManifest} from './ManifestCodec';
import type {IEncodedManifest} from './ManifestCodec';
import {inflateManifest, parsePackIndexRegion, PACK_HEAD_LENGTH, readPackHead} from './AssetPackFormat';
import type {IPackIndex} from './AssetPackFormat';

/** Reads bytes [start, end] (inclusive) of `url`. */
export type RangeFetch = (url: string, start: number, end: number) => Promise<Uint8Array>;

/** The server answered a Range request with the whole file: reading on would download it all. */
export class PackRangeUnsupportedError extends Error
{
    constructor(readonly url: string, readonly status: number)
    {
        super(`${url} answered ${status} to a Range request: the server does not serve byte ranges`);
        this.name = 'PackRangeUnsupportedError';
    }
}

export const httpRange: RangeFetch = async (url, start, end) =>
{
    const controller = new AbortController();
    const response = await fetch(url, {headers: {Range: `bytes=${start}-${end}`}, signal: controller.signal});

    if(response.status !== 206)
    {
        // Before the body is read: a 200 here is the whole pack, possibly hundreds of megabytes.
        controller.abort();

        throw response.ok ? new PackRangeUnsupportedError(url, response.status) : new Error(`${url}: HTTP ${response.status}`);
    }

    return new Uint8Array(await response.arrayBuffer());
};

interface IOpenPack
{
    index: IPackIndex;
    dictionary: Uint8Array;
    dataStart: number;
}

/**
 * One .ambreia pack, read a piece at a time. The index is fetched with the first piece (two Range
 * requests: head, then index) and kept; a piece is then one request when its images follow its
 * manifest, which the build arranges for every image a piece is the first to use.
 */
export class AssetPack
{
    private _open: Promise<IOpenPack> | null = null;
    private _broken = false;

    constructor(readonly url: string, private readonly _fetch: RangeFetch = httpRange) {}

    /** True once the pack failed to open: its pieces load from their .nitro again. */
    get broken(): boolean
    {
        return this._broken;
    }

    /** The files of the piece's .nitro (`<name>.json`, then its images), or null if the pack lacks it. */
    async read(name: string): Promise<Array<{name: string; data: Uint8Array}> | null>
    {
        const {index, dictionary, dataStart} = await this.open();
        const item = index.items[name];

        if(!item) return null;

        const [manifestOffset, manifestLength, entries] = item;
        const spans: Array<[number, number]> = [[manifestOffset, manifestLength], ...entries.map(([, image]): [number, number] => [index.images[image][0], index.images[image][1]])];
        const bytes = await this.readSpans(spans, dataStart);
        const manifest = decodeManifest(JSON.parse(new TextDecoder().decode(inflateManifest(bytes[0], dictionary))) as IEncodedManifest);

        return [
            {name: `${name}.json`, data: new TextEncoder().encode(JSON.stringify(manifest))},
            ...entries.map(([entryName, image], i) => ({name: index.images[image][2] === 'webp' ? entryName.replace(/\.png$/i, '.webp') : entryName, data: bytes[i + 1]}))
        ];
    }

    private open(): Promise<IOpenPack>
    {
        this._open ??= (async () =>
        {
            const regionLength = readPackHead(await this._fetch(this.url, 0, PACK_HEAD_LENGTH - 1));
            const region = await this._fetch(this.url, PACK_HEAD_LENGTH, PACK_HEAD_LENGTH + regionLength - 1);

            return {...parsePackIndexRegion(region), dataStart: PACK_HEAD_LENGTH + regionLength};
        })().catch((error: unknown) =>
        {
            this._broken = true;

            throw error;
        });

        return this._open;
    }

    /** One request when the spans are back to back, one per span otherwise (a shared image). */
    private async readSpans(spans: Array<[number, number]>, dataStart: number): Promise<Uint8Array[]>
    {
        const start = Math.min(...spans.map(([offset]) => offset));
        const end = Math.max(...spans.map(([offset, length]) => offset + length));
        const total = spans.reduce((sum, [, length]) => sum + length, 0);

        if(end - start === total)
        {
            const block = await this._fetch(this.url, dataStart + start, dataStart + end - 1);

            return spans.map(([offset, length]) => block.subarray(offset - start, offset - start + length));
        }

        return Promise.all(spans.map(([offset, length]) => this._fetch(this.url, dataStart + offset, dataStart + offset + length - 1)));
    }
}
