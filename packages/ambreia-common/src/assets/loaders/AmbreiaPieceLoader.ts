import {Spritesheet, type Texture} from 'pixi.js';
import {BaseFileLoader} from './BaseFileLoader';
import {platform} from '../../platform/Platform';
import {textureFromCanvas} from '../../graphics/textureFromCanvas';
import {Logger} from '../../utils/Logger';
import type {AmbreiaDirectory} from '../pack/AmbreiaDirectory';

const log = Logger.getLogger('core.assets.loaders.AmbreiaPieceLoader');

/** A piece's manifest: the .nitro bundle's JSON, as the build kept it. */
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

export interface IFrameInfo
{
    frame: { x: number; y: number; w: number; h: number };
    rotated?: boolean;
    trimmed?: boolean;
    spriteSourceSize?: { x: number; y: number; w: number; h: number };
    sourceSize?: { w: number; h: number };
}

export interface IAssetInfo
{
    source?: string;
    x?: number;
    y?: number;
    flipH?: boolean;
    flipV?: boolean;
    usesPalette?: boolean;
}

export interface IAssetAlias
{
    link: string;
    flipH?: boolean;
    flipV?: boolean;
}

/**
 * Loads one piece of an .ambreia directory (spec 2026-10-09-ambreia-everything): its manifest and
 * images, the spritesheet cut into textures. Pieces come only through loadPiece(); there is no URL to
 * load and no .nitro to fall back on.
 */
export class AmbreiaPieceLoader extends BaseFileLoader
{
    static readonly MIME_TYPE = 'application/x-ambreia-piece';

    private _directory: AmbreiaDirectory | null = null;
    private _name: string = '';
    private _files: Array<{name: string; data: Uint8Array}> | null = null;
    // A piece the directory does not have, or that does not decode, stays so: no retry.
    private _missing: boolean = false;
    private _ownershipTransferred: boolean = false;
    private _jsonData: IAssetData | null = null;
    private _textures: Map<string, Texture> = new Map();
    private _spritesheet: Spritesheet | null = null;
    private _baseTexture: Texture | null = null;

    /** `${directory}${name}`: the key AssetLibrary tracks a pending piece under. */
    static key(directory: AmbreiaDirectory, name: string): string
    {
        return `${directory.url}${name}`;
    }

    /** The piece's manifest. */
    get jsonData(): IAssetData | null
    {
        return this._jsonData;
    }

    /** The spritesheet's frames, by name. */
    get textures(): Map<string, Texture>
    {
        return this._textures;
    }

    get spritesheet(): Spritesheet | null
    {
        return this._spritesheet;
    }

    /** The piece's whole image. */
    get baseTexture(): Texture | null
    {
        return this._baseTexture;
    }

    get content(): unknown
    {
        return this._jsonData;
    }

    get bytes(): ArrayBuffer | null
    {
        return null;
    }

    getTexture(name: string): Texture | null
    {
        return this._textures.get(name) || this._baseTexture;
    }

    /**
     * The asset receiving the textures owns them from now on: dispose() leaves them alone.
     */
    transferOwnership(): void
    {
        this._ownershipTransferred = true;
    }

    loadPiece(directory: AmbreiaDirectory, name: string): void
    {
        this._directory = directory;
        this._name = name;
        this._url = AmbreiaPieceLoader.key(directory, name);
        this._files = null;
        this._missing = false;
        this._errorCode = 0;
        this.handleLoadEvent('open');

        // Two-argument then(): a throw in a listener of the success path must not count as a failed read.
        directory.read(name).then((files) =>
        {
            if(this._disposed) return;

            if(!files)
            {
                this._missing = true;
                log.once(`missing:${this._url}`).warn(`${name}: not in ${directory.url} — it will not display`);
                this.handleLoadEvent('ioError', 404);

                return;
            }

            this._files = files;
            this._status = 200;
            this._bytesLoaded = files.reduce((total, file) => total + file.data.length, 0);
            this.handleLoadEvent('complete');
        }, (error: unknown) =>
        {
            if(this._disposed) return;

            // pako throws strings; WebCrypto, DOMExceptions.
            const reason = String((error as Error | null)?.message ?? error);

            if(directory.broken) log.once(`broken:${directory.url}`).error(`${directory.url} cannot be read (${reason}): nothing from it will display`);
            else log.warn(`${name}: ${reason}`);

            this.handleLoadEvent('ioError');
        });
    }

    /** Pieces are never loaded by URL. */
    load(url: string): void
    {
        log.error(`AmbreiaPieceLoader.load(${url}): pieces load through AssetLibrary.loadPiece()`);
        this._missing = true;
        this.handleLoadEvent('ioError');
    }

    /** A missing piece or a broken directory stays so: only a failed request is worth another go. */
    protected override retry(): boolean
    {
        if(this._missing || this._directory === null || this._directory.broken) return false;
        if(this._disposed || ++this._retryCount > BaseFileLoader.MAX_RETRIES) return false;

        this.loadPiece(this._directory, this._name);

        return true;
    }

    protected override handleLoadEvent(type: string, httpStatus?: number): void
    {
        if(type === 'complete' && this._files)
        {
            const files = this._files;

            this._files = null;
            this.parsePiece(files).then(() =>
            {
                super.handleLoadEvent('complete', httpStatus);
            }, (error: unknown) =>
            {
                if(this._disposed) return;

                // An image the browser refuses: the same bytes would be refused again.
                this._missing = true;
                this.releaseTextures();
                log.warn(`${this._name}: the piece does not decode (${String((error as Error | null)?.message ?? error)})`);
                super.handleLoadEvent('ioError', httpStatus);
            });

            return;
        }

        super.handleLoadEvent(type, httpStatus);
    }

    /** The manifest, then the image and the spritesheet's frames cut out of it. */
    private async parsePiece(files: Array<{name: string; data: Uint8Array}>): Promise<void>
    {
        const jsonFile = files.find(f => f.name.endsWith('.json'));

        if(!jsonFile) throw new Error('No JSON file found in piece');

        this._jsonData = JSON.parse(new TextDecoder('utf-8').decode(jsonFile.data));

        // WebP (lossless) or PNG: whichever the build kept for this image.
        const imageFile = files.find(f => f.name.endsWith('.png') || f.name.endsWith('.webp'));

        if(!imageFile) return;

        // Decoded by the platform (createImageBitmap in a browser), not Assets.load: PixiJS cannot
        // detect a parser for a blob URL.
        const image = await platform().decodeImage(new Uint8Array(imageFile.data), imageFile.name.endsWith('.webp') ? 'image/webp' : 'image/png');

        this._baseTexture = textureFromCanvas(image as unknown as {width: number; height: number});

        if(this._jsonData?.spritesheet?.frames) await this.parseSpritesheet();
    }

    private async parseSpritesheet(): Promise<void>
    {
        if(!this._baseTexture || !this._jsonData?.spritesheet) return;

        const spritesheetData = this._jsonData.spritesheet;
        const pixiSpritesheetData = {
            frames: spritesheetData.frames || {},
            meta: {
                image: '',
                format: spritesheetData.meta?.format || 'RGBA8888',
                size: spritesheetData.meta?.size || {w: this._baseTexture.width, h: this._baseTexture.height},
                scale: spritesheetData.meta?.scale || '1'
            }
        };

        this._spritesheet = new Spritesheet(this._baseTexture, pixiSpritesheetData);

        await this._spritesheet.parse();

        for(const [name, texture] of Object.entries(this._spritesheet.textures)) this._textures.set(name, texture);
    }

    /** Drops what a failed parse left. */
    private releaseTextures(): void
    {
        this._spritesheet?.destroy(true);
        if(!this._spritesheet) this._baseTexture?.destroy(true);
        this._spritesheet = null;
        this._baseTexture = null;
        this._textures.clear();
        this._jsonData = null;
    }

    override dispose(): void
    {
        if(this._disposed) return;

        this._jsonData = null;
        this._files = null;
        this._directory = null;

        if(!this._ownershipTransferred)
        {
            // The spritesheet's destroy takes its textures with it.
            if(this._spritesheet) this._spritesheet.destroy(true);
            else this._baseTexture?.destroy(true);
        }

        this._spritesheet = null;
        this._baseTexture = null;
        this._textures.clear();

        super.dispose();
    }
}
