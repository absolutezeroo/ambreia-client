import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {NitroAsset} from '@ambreia/common/assets/NitroAsset';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {GraphicAssetCollection} from '@ambreia/common/graphics/GraphicAssetCollection';
import {AssetAlias} from './AssetAlias';

/**
 * Collection of asset aliases for resolving avatar asset names.
 *
 * In AS3, holds an AssetLibraryCollection reference and resolves
 * asset names through an alias chain, then looks up the actual
 * BitmapDataAsset from the loaded SWF libraries.
 *
 * In our port, loaded .nitro bundles register their textures and
 * aliases here. Asset lookup chains through aliases (up to 5 hops)
 * then searches all registered GraphicAssetCollections for the texture.
 *
 * @see sources/win63_version/habbo/avatar/alias/AssetAliasCollection.as
 */
export class AssetAliasCollection
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAliasCollection.as::_aliases
    private _aliases: Map<string, AssetAlias>;
    private _collections: Map<string, GraphicAssetCollection>;
    private _assetLibrary: IAssetLibrary | null;

    constructor()
    {
        this._aliases = new Map();
        this._collections = new Map();
        this._assetLibrary = null;
    }

    /**
	 * Sets the asset library reference for looking up loaded NitroAssets.
	 */
    public setAssetLibrary(assetLibrary: IAssetLibrary): void
    {
        this._assetLibrary = assetLibrary;
    }

    // DEVIATION: AS3 builds every alias here in one pass, walking `_assets.getManifests()` and
    //   reading each manifest's `..alias` nodes. That list cannot exist at this point in the port:
    //   avatar assets arrive as separate `.nitro` bundles over the network, so there is no set of
    //   manifests to enumerate when init() runs. The same aliases are registered per bundle instead,
    //   in `onAvatarAssetsLibraryReady()` below (l.84, `this._aliases.set(aliasName, ...)`), which is
    //   called once per library as it lands. This body is deliberately empty, not unfinished — but
    //   AS3 declares it and `reset()` calls it, so it stays.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAliasCollection.as::init()
    public init(): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAliasCollection.as::reset()
    public reset(): void
    {
        this.init();
    }

    /**
	 * Called when an avatar asset library finishes loading.
	 * Extracts aliases and assets from the loaded .nitro bundle,
	 * creates a GraphicAssetCollection, and registers it.
	 *
	 * In AS3, this gets the library by partial URL match and extracts
	 * alias XML elements from its manifest.
	 *
	 * @param libraryName - The name of the loaded library (e.g. "hh_human_body")
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAliasCollection.as::onAvatarAssetsLibraryReady()
    public onAvatarAssetsLibraryReady(libraryName: string): void
    {
        if(!this._assetLibrary) return;

        const nitroAsset = this._assetLibrary.getAssetByName(libraryName) as NitroAsset | null;

        if(!nitroAsset) return;

        const jsonData = nitroAsset.jsonData;
        const textures = nitroAsset.textures;

        if(!jsonData) return;

        // Register aliases from this library
        if(jsonData.aliases)
        {
            for(const aliasName in jsonData.aliases)
            {
                const aliasData = jsonData.aliases[aliasName];

                this._aliases.set(aliasName, new AssetAlias({
                    name: aliasName,
                    link: aliasData.link || '',
                    fliph: aliasData.flipH ? 1 : 0,
                    flipv: aliasData.flipV ? 1 : 0
                }));
            }
        }

        // Create GraphicAssetCollection from this library's textures and asset defs
        if(textures.size > 0 && jsonData.assets)
        {
            const collection = new GraphicAssetCollection();

            collection.defineFromSpritesheet(textures, jsonData.assets as Record<string, Record<string, unknown>>, libraryName);

            this._collections.set(libraryName, collection);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAliasCollection.as::addAlias()
    public addAlias(name: string, link: string, flipH: boolean = false, flipV: boolean = false): void
    {
        const alias = new AssetAlias({name, link, fliph: flipH ? 1 : 0, flipv: flipV ? 1 : 0});

        this._aliases.set(name, alias);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAliasCollection.as::hasAlias()
    public hasAlias(name: string): boolean
    {
        return this._aliases.has(name);
    }

    /**
	 * Resolves an asset name through alias chains (max 5 hops).
	 *
	 * @see AS3 AssetAliasCollection.getAssetName() lines 88-99
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAliasCollection.as::getAssetName()
    public getAssetName(name: string): string
    {
        let result = name;
        let depth = 5;

        while(this.hasAlias(result) && depth >= 0)
        {
            const alias = this._aliases.get(result)!;

            result = alias.link;
            depth--;
        }

        return result;
    }

    /**
	 * Resolves an asset name through aliases, then searches all registered
	 * GraphicAssetCollections for the actual texture + offset data.
	 *
	 * This is the equivalent of AS3's AssetAliasCollection.getAssetByName()
	 * which calls getAssetName() then _assets.getAssetByName().
	 *
	 * @param name - The asset name (may be an alias)
	 * @returns The graphic asset with texture and offsets, or null
	 */
    public getAsset(name: string): IGraphicAsset | null
    {
        const resolvedName = this.getAssetName(name);

        // Search all registered collections
        for(const collection of this._collections.values())
        {
            const asset = collection.getAsset(resolvedName);

            if(asset) return asset;
        }

        return null;
    }

    /**
	 * Gets the flip state for an alias name.
	 */
    public getAliasFlipH(name: string): boolean
    {
        let result = name;
        let flipH = false;
        let depth = 5;

        while(this.hasAlias(result) && depth >= 0)
        {
            const alias = this._aliases.get(result)!;

            if(alias.flipH) flipH = !flipH;

            result = alias.link;
            depth--;
        }

        return flipH;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/alias/AssetAliasCollection.as::dispose()
    public dispose(): void
    {
        this._aliases.clear();

        for(const collection of this._collections.values())
        {
            collection.dispose();
        }

        this._collections.clear();
        this._assetLibrary = null;
    }
}
