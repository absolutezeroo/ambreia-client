import {Spritesheet, type Texture} from 'pixi.js';
import {inflate} from 'pako';
import {BinaryFileLoader} from './BinaryFileLoader';
import {platform} from '../../platform/Platform';
import {textureFromCanvas} from '../../graphics/textureFromCanvas';
import {Logger} from '../../utils/Logger';
import {AssetPacks} from '../pack/AssetPacks';

const log = Logger.getLogger('core.assets.loaders.NitroBundleLoader');

/**
 * Nitro bundle asset data interface
 */
export interface IAssetData
{
    type?: string;
    name?: string;
    visualizationType?: string;
    logicType?: string;
    spritesheet?: ISpritesheetData;
    assets?: Record<string, IAssetInfo>;
    aliases?: Record<string, IAssetAlias>;

    [key: string]: unknown;
}

/**
 * Spritesheet data structure
 */
export interface ISpritesheetData
{
    meta?: {
        image?: string;
        format?: string;
        size?: { w: number; h: number };
        scale?: string;
    };
    frames?: Record<string, IFrameInfo>;
}

/**
 * Frame info for spritesheet
 */
export interface IFrameInfo
{
    frame: { x: number; y: number; w: number; h: number };
    rotated?: boolean;
    trimmed?: boolean;
    spriteSourceSize?: { x: number; y: number; w: number; h: number };
    sourceSize?: { w: number; h: number };
}

/**
 * Asset info from bundle
 */
export interface IAssetInfo
{
    source?: string;
    x?: number;
    y?: number;
    flipH?: boolean;
    flipV?: boolean;
    usesPalette?: boolean;
}

/**
 * Asset alias reference
 */
export interface IAssetAlias
{
    link: string;
    flipH?: boolean;
    flipV?: boolean;
}

/**
 * NitroBundleLoader
 *
 * Custom loader for Nitro bundle files (.nitro).
 *
 * Nitro bundles are a custom format containing:
 * - JSON manifest with asset data
 * - PNG spritesheet(s)
 *
 * The format is a simple binary structure:
 * - 4 bytes: number of files
 * - For each file:
 *   - 2 bytes: filename length
 *   - N bytes: filename (UTF-8)
 *   - 4 bytes: file data length
 *   - N bytes: file data
 */
export class NitroBundleLoader extends BinaryFileLoader
{
    /**
	 * Whether ownership of textures has been transferred to an asset
	 */
    private _ownershipTransferred: boolean = false;

    constructor(mimeType: string, url?: string, id: number = -1)
    {
        super(mimeType, url, id);
    }

    private _jsonData: IAssetData | null = null;

    // TS-only: the piece's files when an .ambreia directory stood in for the .nitro (plan 2026-10-08-asset-packs).
    private _packFiles: Array<{name: string; data: Uint8Array}> | null = null;
    // TS-only: set once the piece's files did not parse; this loader then sticks to the .nitro, retries included.
    private _packFailed = false;

    /**
	 * The parsed JSON data from the bundle
	 */
    get jsonData(): IAssetData | null
    {
        return this._jsonData;
    }

    private _textures: Map<string, Texture> = new Map();

    /**
	 * The extracted textures (individual sprites from spritesheet)
	 */
    get textures(): Map<string, Texture>
    {
        return this._textures;
    }

    private _spritesheet: Spritesheet | null = null;

    /**
	 * The spritesheet if available
	 */
    get spritesheet(): Spritesheet | null
    {
        return this._spritesheet;
    }

    private _baseTexture: Texture | null = null;

    /**
	 * The base texture (original PNG)
	 */
    get baseTexture(): Texture | null
    {
        return this._baseTexture;
    }

    /**
	 * The loaded content (returns the JSON data)
	 */
    override get content(): unknown
    {
        return this._jsonData;
    }

    /**
	 * Get a texture by name
	 */
    getTexture(name: string): Texture | null
    {
        return this._textures.get(name) || this._baseTexture;
    }

    /**
	 * Transfer ownership of textures to an asset.
	 * After calling this, dispose() will NOT destroy the textures.
	 * The receiving asset is responsible for destroying them.
	 */
    transferOwnership(): void
    {
        this._ownershipTransferred = true;
    }

    /**
	 * Dispose of this loader
	 */
    override dispose(): void
    {
        if(!this._disposed)
        {
            this._jsonData = null;
            this._packFiles = null;

            // Only destroy textures if ownership wasn't transferred
            if(!this._ownershipTransferred)
            {
                // Spritesheet disposal handles its textures
                if(this._spritesheet)
                {
                    this._spritesheet.destroy(true);
                    this._spritesheet = null;
                }
                else if(this._baseTexture)
                {
                    this._baseTexture.destroy(true);
                }

                this._baseTexture = null;
                this._textures.clear();
            }
            else
            {
                // Clear references without destroying
                this._spritesheet = null;
                this._baseTexture = null;
                this._textures.clear();
            }

            super.dispose();
        }
    }

    /**
     * TS-only: a .nitro under a directory an .ambreia directory is mounted on is read from its piece
     * file when the directory holds it, and fetched as before otherwise — or when the piece cannot be
     * read or decoded, which is said once per directory and reason.
     */
    override load(url: string): void
    {
        const mounted = this._packFailed ? null : AssetPacks.resolve(url);

        if(!mounted)
        {
            super.load(url);

            return;
        }

        this._url = url;
        this._data = null;
        this._packFiles = null;
        this._errorCode = 0;

        // Two-argument then(): a throw from a listener of the success path must not start a second load.
        mounted.pack.read(mounted.name).then((files) =>
        {
            if(this._disposed) return;

            if(!files)
            {
                super.load(url);

                return;
            }

            this._packFiles = files;
            this._status = 200;
            this._bytesLoaded = files.reduce((total, file) => total + file.data.length, 0);
            this.handleLoadEvent('open');
            this.handleLoadEvent('complete');
        }, (error: unknown) =>
        {
            if(this._disposed) return;

            this.fallBackToNitro(url, mounted.pack.url, error);
        });
    }

    /** The piece could not be used: its .nitro instead, once, without spending a retry on the piece. */
    private fallBackToNitro(url: string, directory: string, error: unknown): void
    {
        // pako throws strings; WebCrypto, DOMExceptions.
        const reason = String((error as Error | null)?.message ?? error);

        log.once(`pack:${directory}:${reason}`).warn(`${directory}: ${reason} — the pieces concerned load from their .nitro files`);
        this._packFailed = true;
        this._packFiles = null;
        super.load(url);
    }

    /**
	 * Override to parse bundle after loading
	 */
    protected override handleLoadEvent(type: string, httpStatus?: number): void
    {
        if(type === 'complete' && (this._data || this._packFiles))
        {
            const fromPack = this._packFiles !== null;

            this.parseBundle().then(() =>
            {
                super.handleLoadEvent('complete', httpStatus);
            }, (error: unknown) =>
            {
                if(this._disposed) return;

                // A piece that arrived but does not decode (an image the browser refuses, a server
                // answering 200 with a page): its .nitro, not a retry of the same piece.
                if(fromPack)
                {
                    this.releaseTextures();
                    this.fallBackToNitro(this._url, 'an .ambreia piece', error);

                    return;
                }

                log.error('Error parsing bundle:', error);

                super.handleLoadEvent('ioError', httpStatus);
            });

            return;
        }

        super.handleLoadEvent(type, httpStatus);
    }

    // TS-only: drops what a failed parse of a piece left before the .nitro is parsed into this loader.
    private releaseTextures(): void
    {
        this._spritesheet?.destroy(true);
        if(!this._spritesheet) this._baseTexture?.destroy(true);
        this._spritesheet = null;
        this._baseTexture = null;
        this._textures.clear();
        this._jsonData = null;
    }

    /**
	 * Parse the nitro bundle format
	 */
    private async parseBundle(): Promise<void>
    {
        const files = this._packFiles ?? (this._data ? this.extractFiles(this._data) : null);

        if(!files)
        {
            throw new Error('No data to parse');
        }

        // Find and parse the JSON file
        const jsonFile = files.find(f => f.name.endsWith('.json'));

        if(!jsonFile)
        {
            throw new Error('No JSON file found in bundle');
        }

        const decoder = new TextDecoder('utf-8');
        const jsonString = decoder.decode(jsonFile.data);
        this._jsonData = JSON.parse(jsonString);

        // Find and load the image: PNG in a .nitro, WebP (lossless) or PNG in an .ambreia pack
        const pngFile = files.find(f => f.name.endsWith('.png') || f.name.endsWith('.webp'));

        if(pngFile)
        {
            // Decoded by the platform (createImageBitmap in a browser), not Assets.load: PixiJS
            // cannot detect a parser for a blob URL.
            const image = await platform().decodeImage(new Uint8Array(pngFile.data), pngFile.name.endsWith('.webp') ? 'image/webp' : 'image/png');

            this._baseTexture = textureFromCanvas(image as unknown as {width: number; height: number});

            // If there's spritesheet data, parse it
            if(this._jsonData?.spritesheet?.frames)
            {
                await this.parseSpritesheet();
            }
        }
    }

    /**
	 * Parse spritesheet data and create individual textures
	 */
    private async parseSpritesheet(): Promise<void>
    {
        if(!this._baseTexture || !this._jsonData?.spritesheet)
        {
            return;
        }

        const spritesheetData = this._jsonData.spritesheet;

        // Create PixiJS spritesheet data format
        const pixiSpritesheetData = {
            frames: spritesheetData.frames || {},
            meta: {
                image: '',
                format: spritesheetData.meta?.format || 'RGBA8888',
                size: spritesheetData.meta?.size || {w: this._baseTexture.width, h: this._baseTexture.height},
                scale: spritesheetData.meta?.scale || '1',
            },
        };

        // Create spritesheet
        this._spritesheet = new Spritesheet(this._baseTexture, pixiSpritesheetData);

        await this._spritesheet.parse();

        // Copy textures to our map
        for(const [name, texture] of Object.entries(this._spritesheet.textures))
        {
            this._textures.set(name, texture);
        }
    }

    /**
	 * Extract files from the nitro bundle binary format.
	 *
	 * Based on Nitro NitroBundle.ts:
	 * - 2 bytes: file count (int16, big-endian)
	 * - For each file:
	 *   - 2 bytes: filename length (int16, big-endian)
	 *   - N bytes: filename (UTF-8)
	 *   - 4 bytes: compressed data length (int32, big-endian)
	 *   - N bytes: zlib-compressed file data
	 */
    private extractFiles(data: ArrayBuffer): Array<{ name: string; data: Uint8Array }>
    {
        const files: Array<{ name: string; data: Uint8Array }> = [];
        const view = new DataView(data);

        let offset = 0;

        if(data.byteLength < 2)
        {
            throw new Error('Invalid Nitro bundle: missing file count');
        }

        this.validateNotHtmlResponse(data);

        // Read number of files (2 bytes, big-endian int16)
        let numFiles = view.getInt16(offset, false);

        offset += 2;

        while(numFiles > 0)
        {
            // Read filename length (2 bytes, big-endian int16)
            if(offset + 2 > data.byteLength)
            {
                throw new Error('Invalid Nitro bundle: missing filename length');
            }

            const nameLength = view.getInt16(offset, false);

            offset += 2;

            if(nameLength <= 0 || offset + nameLength > data.byteLength)
            {
                throw new Error(`Invalid Nitro bundle: filename length out of range (${nameLength})`);
            }

            // Read filename
            const nameBytes = new Uint8Array(data, offset, nameLength);
            const name = new TextDecoder('utf-8').decode(nameBytes);

            offset += nameLength;

            // Read compressed data length (4 bytes, big-endian int32)
            if(offset + 4 > data.byteLength)
            {
                throw new Error(`Invalid Nitro bundle: missing data length for ${name}`);
            }

            const dataLength = view.getInt32(offset, false);

            offset += 4;

            if(dataLength < 0 || offset + dataLength > data.byteLength)
            {
                throw new Error(`Invalid Nitro bundle: data length out of range for ${name} (${dataLength})`);
            }

            // Read compressed data and decompress with zlib
            const compressedData = new Uint8Array(data, offset, dataLength);
            const fileData = inflate(compressedData);

            offset += dataLength;

            files.push({name, data: fileData});

            numFiles--;
        }

        return files;
    }

    /**
     * A `.nitro` URL that does not exist comes back as a web page, not as a 404 the loader can see
     * — Apache serves its error document, Vite serves the SPA shell — and the bundle parser then
     * reads two characters of markup as a length and reports something like "filename length out of
     * range (25711)", which says nothing about the real problem.
     *
     * The old check tested only `<!doctype html` and `<html`, so anything else HTML-ish (an XML
     * declaration, a comment, a PHP error page, a JSON error body) still reached the parser. This
     * one rejects any text/markup start.
     */
    // TS-only: no AS3 counterpart — AS3 loads through Flash's own asset library, which fails the
    // request rather than handing a page body to the parser.
    private validateNotHtmlResponse(data: ArrayBuffer): void
    {
        const prefix = new TextDecoder('utf-8')
            .decode(new Uint8Array(data, 0, Math.min(data.byteLength, 64)))
            .trimStart();
        const lower = prefix.toLowerCase();

        if(lower.startsWith('<!doctype') || lower.startsWith('<html') || lower.startsWith('<?xml')
            || lower.startsWith('<') || lower.startsWith('{'))
        {
            throw new Error(
                `Invalid Nitro bundle: the server returned text, not a bundle — the file is probably `
                + `missing. url=${this._url} body=${JSON.stringify(prefix.slice(0, 48))}`
            );
        }
    }
}
