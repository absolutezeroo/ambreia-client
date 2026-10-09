import {EventEmitter} from 'eventemitter3';
import type {IAsset} from './IAsset';
import type {IAssetLibrary} from './IAssetLibrary';
import {AssetLibrary, AssetLibraryEvents} from './AssetLibrary';
import type {AssetTypeDeclaration} from './AssetTypeDeclaration';
import type {AssetLoaderStruct} from './AssetLoaderStruct';
import type {AmbreiaDirectory} from './pack/AmbreiaDirectory';

/**
 * AssetLibraryCollection
 *
 * Based on AS3: com.sulake.core.assets.AssetLibraryCollection
 *
 * A collection that aggregates multiple asset libraries and provides
 * a unified interface to query assets across all of them.
 */
// DEVIATION: a Component in AS3, a plain class here — see AssetLibrary.
export class AssetLibraryCollection implements IAssetLibrary
{
    private _disposed: boolean = false;

    protected readonly _libraries: IAssetLibrary[] = [];
    protected readonly _pendingLibraries: IAssetLibrary[] = [];
    protected readonly _collectionEvents: EventEmitter = new EventEmitter();
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::_name
    private readonly _name: string;
    private _libraryCounter: number = 0;

    constructor(name: string = 'AssetLibraryCollection')
    {
        this._name = name;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/AssetLibraryCollection.as::_manifest
    private _manifest: object | null = null;

    /**
	 * The manifest (builds a combined manifest)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::get manifest()
    get manifest(): object | null
    {
        return this._manifest ?? {};
    }

    /**
	 * Collection-level event emitter
	 */
    get collectionEvents(): EventEmitter
    {
        return this._collectionEvents;
    }

    /**
	 * The URL (empty for collections)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::get url()
    get url(): string
    {
        return '';
    }

    /**
	 * The name of this collection
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::get name()
    get name(): string
    {
        return this._name;
    }

    /**
	 * Whether all libraries are ready
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::get isReady()
    get isReady(): boolean
    {
        return this._pendingLibraries.length === 0;
    }

    /**
	 * Total number of assets across all libraries
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::get numAssets()
    get numAssets(): number
    {
        let total = 0;

        for(const lib of this._libraries)
        {
            total += lib.numAssets;
        }

        return total;
    }

    /**
	 * Combined array of all asset names
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::get nameArray()
    get nameArray(): string[]
    {
        const names: string[] = [];

        for(const lib of this._libraries)
        {
            names.push(...lib.nameArray);
        }

        return names;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/assets/AssetLibraryCollection.as::_binLibrary
    protected _binLibrary: AssetLibrary | null = null;

    /**
	 * Get the bin library (lazy creation)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::get binLibrary()
    private get binLibrary(): AssetLibrary
    {
        if(!this._binLibrary)
        {
            this._binLibrary = new AssetLibrary('bin');
            this._libraries.unshift(this._binLibrary);
        }

        return this._binLibrary;
    }

    /**
	 * Dispose of the collection
	 */
    get disposed(): boolean
    {
        return this._disposed;
    }

    dispose(): void
    {
        if(!this.disposed)
        {
            // Dispose pending libraries
            while(this._pendingLibraries.length > 0)
            {
                const lib = this._pendingLibraries.pop()!;
                lib.dispose();
            }

            // Dispose loaded libraries
            while(this._libraries.length > 0)
            {
                const lib = this._libraries.pop()!;
                lib.dispose();
            }

            this._binLibrary = null;
            this._collectionEvents.removeAllListeners();

            this._disposed = true;
        }
    }

    /**
	 * Load a library from a URL and add it to the collection
	 */
    async loadFromUrl(url: string, isReady: boolean = false): Promise<void>
    {
        const library = new AssetLibrary(`lib-${this._libraryCounter++}`);
        this._pendingLibraries.push(library);

        try
        {
            await library.loadFromUrl(url, isReady);

            // Move from pending to loaded
            const index = this._pendingLibraries.indexOf(library);

            if(index >= 0)
            {
                this._pendingLibraries.splice(index, 1);
            }

            this._libraries.push(library);

            // Emit loaded event if all pending are done
            if(this._pendingLibraries.length === 0)
            {
                this._collectionEvents.emit(AssetLibraryEvents.LOADED);
            }
        }
        catch (error)
        {
            // Remove from pending on error
            const index = this._pendingLibraries.indexOf(library);

            if(index >= 0)
            {
                this._pendingLibraries.splice(index, 1);
            }

            library.dispose();
            throw error;
        }
    }

    /**
	 * Load from resource (delegates to bin library)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::loadFromResource()
    loadFromResource(manifest: object, resourceData: unknown): boolean
    {
        return this.binLibrary.loadFromResource(manifest, resourceData);
    }

    /**
	 * Unload all libraries
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::unload()
    unload(): void
    {
        while(this._pendingLibraries.length > 0)
        {
            const lib = this._pendingLibraries.pop()!;
            lib.dispose();
        }

        while(this._libraries.length > 0)
        {
            const lib = this._libraries.pop()!;
            lib.dispose();
        }

        this._binLibrary = null;
    }

    /**
	 * Load an asset from file (delegates to bin library)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::loadAssetFromFile()
    loadAssetFromFile(name: string, url: string, mimeType?: string, id?: number): AssetLoaderStruct
    {
        return this.binLibrary.loadAssetFromFile(name, url, mimeType, id);
    }

    // TS-only: .ambreia pieces go to the same private library as files (spec 2026-10-09-ambreia-everything).
    loadPiece(name: string, directory: AmbreiaDirectory, piece?: string, id?: number): AssetLoaderStruct
    {
        return this.binLibrary.loadPiece(name, directory, piece, id);
    }

    /**
	 * Check if a library exists by name
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::hasAssetLibrary()
    hasAssetLibrary(name: string): boolean
    {
        for(const lib of this._libraries)
        {
            if(lib.name === name)
            {
                return true;
            }
        }

        return false;
    }

    /**
	 * Get a library by name
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetLibraryByName()
    getAssetLibraryByName(name: string): IAssetLibrary | null
    {
        for(const lib of this._libraries)
        {
            if(lib.name === name)
            {
                return lib;
            }
        }

        return null;
    }

    /**
	 * Get a library by URL
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetLibraryByUrl()
    getAssetLibraryByUrl(url: string): IAssetLibrary | null
    {
        for(const lib of this._libraries)
        {
            if(lib.url === url)
            {
                return lib;
            }
        }

        return null;
    }

    /**
	 * Get a library by partial URL match
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetLibraryByPartialUrl()
    getAssetLibraryByPartialUrl(partialUrl: string): IAssetLibrary | null
    {
        for(const lib of this._libraries)
        {
            if(lib.url && lib.url.includes(partialUrl))
            {
                return lib;
            }
        }

        return null;
    }

    /**
	 * Add a library to the collection
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::addAssetLibrary()
    addAssetLibrary(library: IAssetLibrary): void
    {
        if(!this._libraries.includes(library))
        {
            this._libraries.push(library);
        }
    }

    /**
	 * Remove a library from the collection
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::removeAssetLibrary()
    removeAssetLibrary(library: IAssetLibrary): void
    {
        const index = this._libraries.indexOf(library);

        if(index >= 0)
        {
            this._libraries.splice(index, 1);
        }
    }

    /**
	 * Get an asset by name (searches all libraries)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetByName()
    getAssetByName(name: string): IAsset | null
    {
        for(const lib of this._libraries)
        {
            // `hasAsset()` first: searching a collection means every library but one is *expected*
            // to miss, and AssetLibrary.getAssetByName() warns on a miss. Probing first keeps the
            // warning for the case that matters — no library has it — instead of one per library.
            if(lib.hasAsset(name))
            {
                return lib.getAssetByName(name);
            }
        }

        AssetLibrary.reportMiss(name, `collection "${this.name}" (${this._libraries.length} libraries)`);

        return null;
    }

    /**
	 * Get all assets with a given name (from all libraries)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetsByName()
    getAssetsByName(name: string): IAsset[]
    {
        const assets: IAsset[] = [];

        for(const lib of this._libraries)
        {
            // Same reason as getAssetByName() above: gathering every copy means most libraries are
            // expected to miss, and a miss warns. No collection-wide report here — an empty result
            // is a legitimate answer for this method.
            if(lib.hasAsset(name))
            {
                assets.push(lib.getAssetByName(name)!);
            }
        }

        return assets;
    }

    /**
	 * Get an asset by content
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetByContent()
    getAssetByContent(content: unknown): IAsset | null
    {
        for(const lib of this._libraries)
        {
            const asset = lib.getAssetByContent(content);

            if(asset)
            {
                return asset;
            }
        }

        return null;
    }

    /**
	 * Get an asset by index
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetByIndex()
    getAssetByIndex(index: number): IAsset | null
    {
        let current = 0;

        for(const lib of this._libraries)
        {
            const libCount = lib.numAssets;

            if(current + libCount > index)
            {
                return lib.getAssetByIndex(index - current);
            }

            current += libCount;
        }

        return null;
    }

    /**
	 * Get the index of an asset
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetIndex()
    getAssetIndex(asset: IAsset): number
    {
        let offset = 0;

        for(const lib of this._libraries)
        {
            const localIndex = lib.getAssetIndex(asset);

            if(localIndex !== -1)
            {
                return offset + localIndex;
            }

            offset += lib.numAssets;
        }

        return -1;
    }

    /**
	 * Check if an asset exists
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::hasAsset()
    hasAsset(name: string): boolean
    {
        for(const lib of this._libraries)
        {
            if(lib.hasAsset(name))
            {
                return true;
            }
        }

        return false;
    }

    /**
	 * Set an asset (delegates to bin library)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::setAsset()
    setAsset(name: string, asset: IAsset, overwrite?: boolean): boolean
    {
        return this.binLibrary.setAsset(name, asset, overwrite);
    }

    /**
	 * Create an asset (delegates to bin library)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::createAsset()
    createAsset(name: string, declaration: AssetTypeDeclaration): IAsset | null
    {
        return this.binLibrary.createAsset(name, declaration);
    }

    /**
	 * Remove an asset
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::removeAsset()
    removeAsset(asset: IAsset): IAsset | null
    {
        for(const lib of this._libraries)
        {
            const removed = lib.removeAsset(asset);

            if(removed === asset)
            {
                return asset;
            }
        }

        return null;
    }

    /**
	 * Register a type declaration (delegates to bin library)
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::registerAssetTypeDeclaration()
    registerAssetTypeDeclaration(declaration: AssetTypeDeclaration, isShared?: boolean): boolean
    {
        return this.binLibrary.registerAssetTypeDeclaration(declaration, isShared);
    }

    /**
	 * Get type declaration by MIME type
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetTypeDeclarationByMimeType()
    getAssetTypeDeclarationByMimeType(mimeType: string, checkShared: boolean = true): AssetTypeDeclaration | null
    {
        if(checkShared)
        {
            return this.binLibrary.getAssetTypeDeclarationByMimeType(mimeType, true);
        }

        for(const lib of this._libraries)
        {
            const decl = lib.getAssetTypeDeclarationByMimeType(mimeType, false);

            if(decl)
            {
                return decl;
            }
        }

        return null;
    }

    /**
	 * Get type declaration by asset class
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetTypeDeclarationByClass()
    getAssetTypeDeclarationByClass(assetClass: new (...args: unknown[]) => IAsset, checkShared: boolean = true): AssetTypeDeclaration | null
    {
        if(checkShared)
        {
            return this.binLibrary.getAssetTypeDeclarationByClass(assetClass, true);
        }

        for(const lib of this._libraries)
        {
            const decl = lib.getAssetTypeDeclarationByClass(assetClass, false);

            if(decl)
            {
                return decl;
            }
        }

        return null;
    }

    /**
	 * Get type declaration by filename
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getAssetTypeDeclarationByFileName()
    getAssetTypeDeclarationByFileName(fileName: string, checkShared: boolean = true): AssetTypeDeclaration | null
    {
        if(checkShared)
        {
            return this.binLibrary.getAssetTypeDeclarationByFileName(fileName, true);
        }

        for(const lib of this._libraries)
        {
            const decl = lib.getAssetTypeDeclarationByFileName(fileName, false);

            if(decl)
            {
                return decl;
            }
        }

        return null;
    }

    /**
	 * Get all manifests from all libraries
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibraryCollection.as::getManifests()
    getManifests(): object[]
    {
        const manifests: object[] = [];

        for(const lib of this._libraries)
        {
            if(lib.manifest)
            {
                manifests.push(lib.manifest);
            }
        }

        return manifests;
    }

    /**
	 * String representation
	 */
    toString(): string
    {
        return `[AssetLibraryCollection ${this._name} libraries=${this._libraries.length} assets=${this.numAssets}]`;
    }
}
