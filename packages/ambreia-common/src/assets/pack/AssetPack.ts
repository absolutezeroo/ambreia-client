import {decodeManifest} from './ManifestCodec';
import type {IEncodedManifest} from './ManifestCodec';
import {inflateManifest, PACK_HEAD_LENGTH, PACK_PREFIX_LENGTH, parsePackShard, parsePackTop, readPackHead, shardOf} from './AssetPackFormat';
import type {IPackShard, IPackTop} from './AssetPackFormat';

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
    top: IPackTop;
    dictionary: Uint8Array;
    shardsStart: number;
    dataStart: number;
}

/**
 * One .ambreia pack, read a piece at a time. The first piece costs one request for the head and the
 * top level (shard table, dictionary), one for its index shard and one for the piece; a shard is
 * kept once read, and a piece whose images follow its manifest — every image it is the first to
 * use — is a single request.
 */
export class AssetPack
{
    private _open: Promise<IOpenPack> | null = null;
    private readonly _shards = new Map<number, Promise<IPackShard>>();
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
        const pack = await this.open();
        const item = (await this.shard(pack, shardOf(name, pack.top.shards.length)))[name];

        if(!item) return null;

        const [manifestOffset, manifestLength, images] = item;
        const spans: Array<[number, number]> = [[manifestOffset, manifestLength], ...images.map(([, offset, length]): [number, number] => [offset, length])];
        const bytes = await this.readSpans(spans, pack.dataStart);
        const manifest = decodeManifest(JSON.parse(new TextDecoder().decode(inflateManifest(bytes[0], pack.dictionary))) as IEncodedManifest);

        return [
            {name: `${name}.json`, data: new TextEncoder().encode(JSON.stringify(manifest))},
            ...images.map(([entry, , , format], i) =>
            {
                const entryName = entry === 0 ? `${name}.png` : entry;

                return {name: format === 0 ? entryName.replace(/\.png$/i, '.webp') : entryName, data: bytes[i + 1]};
            })
        ];
    }

    private open(): Promise<IOpenPack>
    {
        this._open ??= (async () =>
        {
            let prefix = await this._fetch(this.url, 0, PACK_PREFIX_LENGTH - 1);
            const topLength = readPackHead(prefix);
            const shardsStart = PACK_HEAD_LENGTH + topLength;

            if(prefix.length < shardsStart) prefix = await this._fetch(this.url, 0, shardsStart - 1);

            const {top, dictionary} = parsePackTop(prefix.subarray(PACK_HEAD_LENGTH, shardsStart));
            const last = top.shards[top.shards.length - 1];

            return {top, dictionary, shardsStart, dataStart: shardsStart + (last ? last[0] + last[1] : 0)};
        })().catch((error: unknown) =>
        {
            this._broken = true;

            throw error;
        });

        return this._open;
    }

    private shard(pack: IOpenPack, index: number): Promise<IPackShard>
    {
        let shard = this._shards.get(index);

        if(!shard)
        {
            const [offset, length] = pack.top.shards[index];

            shard = this._fetch(this.url, pack.shardsStart + offset, pack.shardsStart + offset + length - 1).then(parsePackShard);
            // A failed read is not cached: the next piece of that shard asks again.
            shard.catch(() => this._shards.delete(index));
            this._shards.set(index, shard);
        }

        return shard;
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
