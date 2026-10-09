import {decodeManifest} from './ManifestCodec';
import type {IEncodedManifest} from './ManifestCodec';
import {decodePiece, inflateManifest} from './AmbreiaPiece';
import {plainLayout} from './AmbreiaLayout';
import type {IAmbreiaLayout, LogicalPath} from './AmbreiaLayout';

/** The bytes at `url`, or null when the server has no such file (404). */
export type FetchBytes = (url: string) => Promise<Uint8Array | null>;

export const httpBytes: FetchBytes = async (url) =>
{
    const response = await fetch(url);

    if(response.status === 404) return null;
    if(!response.ok) throw new Error(`${url}: HTTP ${response.status}`);

    return new Uint8Array(await response.arrayBuffer());
};

/** `ambreia.json` at the root of a built directory: no secret in it. */
export interface IAmbreiaDescriptor
{
    v: number;
    kind: string;
    /** Id of the manifests' deflate dictionary. */
    dictionary: string;
    encrypted?: boolean;
    /** Which master key an encrypted directory needs (AmbreiaLayout.keyId). */
    keyId?: string | null;
}

interface IOpenDirectory
{
    descriptor: IAmbreiaDescriptor;
    dictionary: Uint8Array;
    layout: IAmbreiaLayout;
}

/**
 * A directory of .ambreia pieces, one per bundle of an asset family (plan 2026-10-08-asset-packs, spec
 * 2026-10-09-ambreia-everything). Its descriptor and dictionary are read once; then a piece is one
 * request, plus one for an image several pieces share. An encrypted directory needs the layout of its
 * master key: without it, or with another key, the directory is unusable and nothing from it loads.
 */
export class AmbreiaDirectory
{
    private _open: Promise<IOpenDirectory> | null = null;
    private readonly _shared = new Map<string, Promise<Uint8Array>>();
    private _broken = false;

    readonly url: string;

    constructor(url: string, private readonly _fetch: FetchBytes = httpBytes, private readonly _layout: IAmbreiaLayout | Promise<IAmbreiaLayout> | null = null)
    {
        this.url = url.endsWith('/') ? url : `${url}/`;
    }

    /** True once the directory failed to open: none of its pieces will load. */
    get broken(): boolean
    {
        return this._broken;
    }

    /** The piece's files (`<name>.json`, then its images, as its source bundle had them), or null if the directory lacks it. */
    async read(name: string): Promise<Array<{name: string; data: Uint8Array}> | null>
    {
        const {descriptor, dictionary, layout} = await this.open();
        const bytes = await this.get(layout, {kind: 'piece', name});

        if(!bytes) return null;

        const piece = decodePiece(bytes, name);

        if(piece.dictionaryId !== descriptor.dictionary)
        {
            throw new Error(`${name}.ambreia was built with dictionary ${piece.dictionaryId}, the directory has ${descriptor.dictionary}: rebuild it`);
        }

        const manifest = decodeManifest(JSON.parse(new TextDecoder().decode(inflateManifest(piece.manifest, dictionary))) as IEncodedManifest);
        const images = await Promise.all(piece.images.map(async image => ({
            name: image.format === 'webp' ? image.entryName.replace(/\.png$/i, '.webp') : image.entryName,
            data: image.shared ? await this.shared(layout, image.shared, image.format) : image.bytes!
        })));

        return [{name: `${name}.json`, data: new TextEncoder().encode(JSON.stringify(manifest))}, ...images];
    }

    private open(): Promise<IOpenDirectory>
    {
        this._open ??= (async () =>
        {
            const raw = await this._fetch(`${this.url}ambreia.json`);

            if(!raw) throw new Error(`${this.url}ambreia.json not found: not an .ambreia directory`);

            const descriptor = JSON.parse(new TextDecoder().decode(raw)) as IAmbreiaDescriptor;
            let layout = plainLayout();

            if(descriptor.encrypted)
            {
                const given = await this._layout;

                if(!given?.encrypted) throw new Error(`${this.url} is encrypted and no key was given`);
                if(given.keyId !== descriptor.keyId) throw new Error(`${this.url} needs key ${descriptor.keyId}, the key given is ${given.keyId}`);

                layout = given;
            }

            const dictionary = await this.get(layout, {kind: 'dictionary', id: descriptor.dictionary});

            if(!dictionary) throw new Error(`${this.url}: the dictionary ${descriptor.dictionary} is missing`);

            return {descriptor, dictionary, layout};
        })().catch((error: unknown) =>
        {
            this._broken = true;

            throw error;
        });

        return this._open;
    }

    /** A file's bytes, decrypted when the layout says so; null when the server lacks it. */
    private async get(layout: IAmbreiaLayout, logical: LogicalPath): Promise<Uint8Array | null>
    {
        const path = await layout.path(logical);
        const bytes = await this._fetch(this.url + path.split('/').map(encodeURIComponent).join('/'));

        return bytes ? layout.open(logical, bytes) : null;
    }

    private shared(layout: IAmbreiaLayout, sha1: string, format: 'webp' | 'png'): Promise<Uint8Array>
    {
        let image = this._shared.get(sha1);

        if(!image)
        {
            image = this.get(layout, {kind: 'image', sha1, format}).then((bytes) =>
            {
                if(!bytes) throw new Error(`${this.url}: the shared image ${sha1} is missing`);

                return bytes;
            });
            // A failed read is not kept: the next piece using it asks again.
            image.catch(() => this._shared.delete(sha1));
            this._shared.set(sha1, image);
        }

        return image;
    }
}
