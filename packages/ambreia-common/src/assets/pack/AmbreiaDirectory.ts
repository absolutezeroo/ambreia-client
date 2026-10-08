import {decodeManifest} from './ManifestCodec';
import type {IEncodedManifest} from './ManifestCodec';
import {decodePiece, inflateManifest} from './AmbreiaPiece';

/** The bytes at `url`, or null when the server has no such file (404). */
export type FetchBytes = (url: string) => Promise<Uint8Array | null>;

export const httpBytes: FetchBytes = async (url) =>
{
    const response = await fetch(url);

    if(response.status === 404) return null;
    if(!response.ok) throw new Error(`${url}: HTTP ${response.status}`);

    return new Uint8Array(await response.arrayBuffer());
};

/** `ambreia.json` at the root of a built directory. */
export interface IAmbreiaDescriptor
{
    v: number;
    kind: string;
    /** Id of `dictionary/<id>.bin`, the manifests' deflate dictionary. */
    dictionary: string;
}

/**
 * A directory of .ambreia pieces standing in for a directory of .nitro bundles (plan
 * 2026-10-08-asset-packs, revision). Its descriptor and dictionary are read once; then a piece is
 * one request (`<name>.ambreia`), plus `images/<sha1>` for an image several pieces share.
 */
export class AmbreiaDirectory
{
    private _open: Promise<{descriptor: IAmbreiaDescriptor; dictionary: Uint8Array}> | null = null;
    private readonly _shared = new Map<string, Promise<Uint8Array>>();
    private _broken = false;

    readonly url: string;

    constructor(url: string, private readonly _fetch: FetchBytes = httpBytes)
    {
        this.url = url.endsWith('/') ? url : `${url}/`;
    }

    /** True once the directory failed to open: its pieces load from their .nitro again. */
    get broken(): boolean
    {
        return this._broken;
    }

    /** The files of the piece's .nitro (`<name>.json`, then its images), or null if the directory lacks it. */
    async read(name: string): Promise<Array<{name: string; data: Uint8Array}> | null>
    {
        const {descriptor, dictionary} = await this.open();
        const bytes = await this._fetch(`${this.url}${encodeURIComponent(name)}.ambreia`);

        if(!bytes) return null;

        const piece = decodePiece(bytes, name);

        if(piece.dictionaryId !== descriptor.dictionary)
        {
            throw new Error(`${name}.ambreia was built with dictionary ${piece.dictionaryId}, the directory has ${descriptor.dictionary}: rebuild it`);
        }

        const manifest = decodeManifest(JSON.parse(new TextDecoder().decode(inflateManifest(piece.manifest, dictionary))) as IEncodedManifest);
        const images = await Promise.all(piece.images.map(async image => ({
            name: image.format === 'webp' ? image.entryName.replace(/\.png$/i, '.webp') : image.entryName,
            data: image.shared ? await this.shared(image.shared, image.format) : image.bytes!
        })));

        return [{name: `${name}.json`, data: new TextEncoder().encode(JSON.stringify(manifest))}, ...images];
    }

    private open(): Promise<{descriptor: IAmbreiaDescriptor; dictionary: Uint8Array}>
    {
        this._open ??= (async () =>
        {
            const raw = await this._fetch(`${this.url}ambreia.json`);

            if(!raw) throw new Error(`${this.url}ambreia.json not found: not an .ambreia directory`);

            const descriptor = JSON.parse(new TextDecoder().decode(raw)) as IAmbreiaDescriptor;
            const dictionary = await this._fetch(`${this.url}dictionary/${descriptor.dictionary}.bin`);

            if(!dictionary) throw new Error(`${this.url}dictionary/${descriptor.dictionary}.bin not found`);

            return {descriptor, dictionary};
        })().catch((error: unknown) =>
        {
            this._broken = true;

            throw error;
        });

        return this._open;
    }

    private shared(sha1: string, format: string): Promise<Uint8Array>
    {
        let image = this._shared.get(sha1);

        if(!image)
        {
            image = this._fetch(`${this.url}images/${sha1}.${format}`).then((bytes) =>
            {
                if(!bytes) throw new Error(`${this.url}images/${sha1}.${format} not found`);

                return bytes;
            });
            // A failed read is not kept: the next piece using it asks again.
            image.catch(() => this._shared.delete(sha1));
            this._shared.set(sha1, image);
        }

        return image;
    }
}
