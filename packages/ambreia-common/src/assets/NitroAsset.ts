import type {Spritesheet, Texture} from 'pixi.js';
import type {ILazyAsset} from './ILazyAsset';
import type {IAsset} from './IAsset';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';
import type {IAssetData} from './loaders/NitroBundleLoader';
import {NitroBundleLoader} from './loaders/NitroBundleLoader';
import {Logger} from '../utils/Logger';

/**
 * NitroAsset
 *
 * Asset that holds Nitro bundle content (.nitro files).
 * Contains parsed JSON data, textures, and spritesheet.
 */
export class NitroAsset implements ILazyAsset
{
    private _unknown: unknown = null;
    private readonly _declaration: AssetTypeDeclaration;
    private readonly _url: string;

    constructor(declaration: AssetTypeDeclaration, url: string = '')
    {
        this._declaration = declaration;
        this._url = url;
    }

    private _disposed: boolean = false;

    get disposed(): boolean
    {
        return this._disposed;
    }

    private _jsonData: IAssetData | null = null;

    /**
	 * Alias for content - returns JSON data
	 */
    get jsonData(): IAssetData | null
    {
        return this.content;
    }

    private _textures: Map<string, Texture> = new Map();

    /**
	 * The extracted textures (individual sprites from spritesheet)
	 */
    get textures(): Map<string, Texture>
    {
        if(!this._jsonData)
        {
            this.prepareLazyContent();
        }

        return this._textures;
    }

    private _spritesheet: Spritesheet | null = null;

    /**
	 * The spritesheet if available
	 */
    get spritesheet(): Spritesheet | null
    {
        if(!this._jsonData)
        {
            this.prepareLazyContent();
        }

        return this._spritesheet;
    }

    private _baseTexture: Texture | null = null;

    /**
	 * The base texture (original PNG)
	 */
    get baseTexture(): Texture | null
    {
        if(!this._jsonData)
        {
            this.prepareLazyContent();
        }

        return this._baseTexture;
    }

    get url(): string
    {
        return this._url;
    }

    /**
	 * The parsed JSON data from the bundle
	 */
    get content(): IAssetData | null
    {
        if(!this._jsonData)
        {
            this.prepareLazyContent();
        }

        return this._jsonData;
    }

    get declaration(): AssetTypeDeclaration
    {
        return this._declaration;
    }

    /**
	 * Get the asset name from JSON data
	 */
    get name(): string | null
    {
        return this._jsonData?.name ?? null;
    }

    /**
	 * Get the asset type from JSON data
	 */
    get type(): string | null
    {
        return this._jsonData?.type ?? null;
    }

    dispose(): void
    {
        if(!this._disposed)
        {
            this._disposed = true;
            this._jsonData = null;
            this._unknown = null;

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
    }

    setUnknownContent(content: unknown): void
    {
        this._jsonData = null;
        this._textures.clear();
        this._spritesheet = null;
        this._baseTexture = null;

        // For NitroBundleLoader, extract data immediately before the loader is disposed
        // This transfers ownership of textures/spritesheet from loader to asset
        if(content instanceof NitroBundleLoader)
        {
            const loader = content;
            this._jsonData = loader.jsonData;
            this._baseTexture = loader.baseTexture;
            this._spritesheet = loader.spritesheet;

            // Copy textures from loader
            for(const [name, texture] of loader.textures)
            {
                this._textures.set(name, texture);
            }

            // Transfer ownership so loader doesn't destroy textures on dispose
            loader.transferOwnership();

            this._unknown = null;
            return;
        }

        this._unknown = content;
    }

    prepareLazyContent(): void
    {
        if(this._unknown === null)
        {
            return;
        }

        if(this._unknown instanceof NitroBundleLoader)
        {
            const loader = this._unknown;
            this._jsonData = loader.jsonData;
            this._baseTexture = loader.baseTexture;
            this._spritesheet = loader.spritesheet;

            // Copy textures from loader
            for(const [name, texture] of loader.textures)
            {
                this._textures.set(name, texture);
            }

            this._unknown = null;
            return;
        }

        if(this._unknown instanceof NitroAsset)
        {
            const other = this._unknown;
            this._jsonData = other._jsonData;
            this._baseTexture = other._baseTexture;
            this._spritesheet = other._spritesheet;

            // Copy textures from other asset
            for(const [name, texture] of other._textures)
            {
                this._textures.set(name, texture);
            }

            this._unknown = null;
            return;
        }

        // If passed IAssetData directly
        if(typeof this._unknown === 'object' && this._unknown !== null && 'type' in this._unknown)
        {
            this._jsonData = this._unknown as IAssetData;
            this._unknown = null;
            return;
        }

        Logger.getLogger('core.assets.NitroAsset').warn('Unknown content type:', typeof this._unknown);
        this._unknown = null;
    }

    setFromOtherAsset(asset: IAsset): void
    {
        if(asset instanceof NitroAsset)
        {
            this._jsonData = asset._jsonData;
            this._baseTexture = asset._baseTexture;
            this._spritesheet = asset._spritesheet;

            // Copy textures
            this._textures.clear();

            for(const [name, texture] of asset._textures)
            {
                this._textures.set(name, texture);
            }

            return;
        }

        throw new Error('Provided asset is not of type NitroAsset');
    }

    setParamsDesc(_params: Map<string, string>): void
    {
    }

    /**
	 * Get a texture by name
	 */
    getTexture(name: string): Texture | null
    {
        return this._textures.get(name) || this._baseTexture;
    }

    toString(): string
    {
        return `[NitroAsset url=${this._url} name=${this.name}]`;
    }
}
