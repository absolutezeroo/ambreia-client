import {EventEmitter} from 'eventemitter3';
import {Component, type IContext} from '@core/runtime';
import {Logger} from '@core/utils/Logger';
import type {IAsset} from './IAsset';
import type {IAssetLibrary} from './IAssetLibrary';
import type {IAssetLoader} from './loaders/IAssetLoader';
import {type AssetClass, type AssetLoaderClass, AssetTypeDeclaration} from './AssetTypeDeclaration';
import {AssetLoaderStruct} from './AssetLoaderStruct';
import {AssetLoaderEvent, AssetLoaderEventType} from './loaders/AssetLoaderEvent';

// Import default asset types
import {UnknownAsset} from './UnknownAsset';
import {TextAsset} from './TextAsset';
import {XmlAsset} from './XmlAsset';
import {BitmapDataAsset} from './BitmapDataAsset';
import {SoundAsset} from './SoundAsset';
import {NitroAsset} from './NitroAsset';

// Import default loaders
import {BinaryFileLoader} from './loaders/BinaryFileLoader';
import {TextFileLoader} from './loaders/TextFileLoader';
import {BitmapFileLoader} from './loaders/BitmapFileLoader';
import {SoundFileLoader} from './loaders/SoundFileLoader';
import {NitroBundleLoader} from './loaders/NitroBundleLoader';

/**
 * Asset library events
 *
 * AS3 declares these as four static constants on `AssetLibrary` itself; they are grouped here so
 * a listener can be typed against the set. The values are AS3's verbatim — they are what goes on
 * the wire of the event system, so they cannot be shortened along with the names.
 */
export const AssetLibraryEvents = {
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::ASSET_LIBRARY_READY
    READY: 'AssetLibraryReady',
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::ASSET_LIBRARY_LOADED
    LOADED: 'AssetLibraryLoaded',
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::ASSET_LIBRARY_UNLOADED
    UNLOADED: 'AssetLibraryUnloaded',
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::ASSET_LIBRARY_LOAD_ERROR
    LOAD_ERROR: 'AssetLibraryLoadError',
} as const;

/**
 * AssetLibrary
 *
 * Based on AS3: com.sulake.core.assets.AssetLibrary
 *
 * A library that manages a collection of assets. Provides:
 * - Type registration (MIME type → Asset class → Loader class)
 * - Asset storage and retrieval by name, content, or index
 * - Loading assets from files
 * - Automatic type detection by file extension
 */
export class AssetLibrary extends Component implements IAssetLibrary 
{
    /**
     * Shared type registry (global, across all libraries)
     */
    private static _sharedTypesByMime: Map<string, AssetTypeDeclaration> = new Map();

    /**
     * Whether the shared types have been initialized
     */
    private static _sharedTypesInitialized: boolean = false;

    /**
     * Instance counter for debugging
     */
    private static _instanceCount: number = 0;
    private readonly _libraryEvents: EventEmitter = new EventEmitter();
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::_name
    private readonly _name: string;
    private readonly _assetMap: Map<string, IAsset> = new Map();
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::_assetNameArray
    private readonly _assetNameArray: string[] = [];
    private readonly _pendingLoads: Map<string, AssetLoaderStruct> = new Map();
    private readonly _localTypesByMime: Map<string, AssetTypeDeclaration> = new Map();
    private readonly _assetByContent: Map<unknown, IAsset> = new Map();
    private readonly _assetNameIndex: Map<string, number> = new Map();

    constructor(context: IContext, name: string = 'AssetLibrary') 
    {
        super(context);

        this._name = name;

        // Initialize shared types on first library creation
        if(!AssetLibrary._sharedTypesInitialized) 
        {
            this.initializeSharedTypes();
        }

        AssetLibrary._instanceCount++;
        AssetLibrary._libraryRefs.push(this);
    }

    /**
     * All library instances (for debugging)
     */
    private static _libraryRefs: AssetLibrary[] = [];

    /**
     * Get all library instances
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::get assetLibraryRefArray()
    static get libraryRefs(): AssetLibrary[] 
    {
        return AssetLibrary._libraryRefs;
    }

    /**
     * Get the number of library instances
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::get numAssetLibraryInstances()
    static get numInstances(): number 
    {
        return AssetLibrary._instanceCount;
    }

    /**
	 * Prefixes every cache key this process writes
	 *
	 * AS3 uses it to keep two clients running side by side out of each other's cached game data.
	 * Empty is the default and means "no prefix", which is why a null hand-in is not an error.
	 */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::setCacheNamespace()
    static setCacheNamespace(namespace: string | null): void
    {
        AssetLibrary._cacheNamespace = namespace ?? '';
    }

    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::_SafeStr_8375 (name derived: read only by setCacheNamespace)
    private static _cacheNamespace: string = '';

    // TS-only: nothing in the port reads the namespace yet — the browser cache is per-origin — so
    // it is exposed rather than left write-only.
    static get cacheNamespace(): string
    {
        return AssetLibrary._cacheNamespace;
    }

    // The four below carried TODO markers and should not have: each names a mechanism this port
    // deliberately replaced, not one it still owes. Reclassified 2026-09-05 per
    // `.claude/rules/30`'s table — a gap you intend to close is a TODO, a decision already made
    // is a DEVIATION.

    // DEVIATION: AS3 opens `File.applicationStorageDirectory` and sweeps stale temp files out of
    //   it. That is the AIR filesystem API — `flash.filesystem` has no browser counterpart to
    //   narrow to — and the browser build caches through the HTTP layer, so there is no directory
    //   to sweep and nothing for the method to do.
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::enableGamedataCache()

    // DEVIATION: AS3 gates its own static `debug()` on a per-class flag. This port logs through
    //   `Logger.getLogger('core.assets.AssetLibrary')`, whose level is set centrally (see
    //   `CLAUDE.md` → Conventions), so a second per-class switch would only be
    //   able to contradict it.
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::setDebugLogsEnabled()

    // DEVIATION: AS3 resolves a linkage name to a `Class` through the library's
    //   `ApplicationDomain`. Nothing here is loaded as runtime SWF definitions — assets arrive as
    //   files and are looked up by name through `getAssetByName()` — so there is no domain to ask
    //   and no `Class` to return.
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::getClass()

    // DEVIATION: AS3 loads a library from a `URLRequest` through `flash.display.Loader`. The
    //   port's loaders (see `loaders/`) take a URL directly — `loadFromUrl()` below is the method
    //   that replaced it, same job, no Loader.
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::loadFromFile()

    private _url: string = '';

    /**
     * The URL this library was loaded from
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::get url()
    get url(): string 
    {
        return this._url;
    }

    private _manifest: object | null = null;

    /**
     * The manifest object
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::get manifest()
    get manifest(): object | null 
    {
        return this._manifest ?? {};
    }

    private _isReady: boolean = false;

    /**
     * Whether the library is ready
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::get isReady()
    get isReady(): boolean 
    {
        return this._isReady;
    }

    /**
     * Library-level event emitter
     */
    get libraryEvents(): EventEmitter 
    {
        return this._libraryEvents;
    }

    /**
     * The name of this library
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::get name()
    get name(): string 
    {
        return this._name;
    }

    /**
     * Number of assets in this library
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::get numAssets()
    get numAssets(): number 
    {
        return this._assetMap.size;
    }

    /**
     * Array of all asset names
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::get nameArray()
    get nameArray(): string[] 
    {
        return [...this._assetNameArray];
    }

    /**
     * Dispose of this library
     */
    override dispose(): void 
    {
        if(!this.disposed) 
        {
            this.unload();

            // Remove from global refs
            const index = AssetLibrary._libraryRefs.indexOf(this);

            if(index >= 0) 
            {
                AssetLibrary._libraryRefs.splice(index, 1);
            }

            AssetLibrary._instanceCount--;

            this._libraryEvents.removeAllListeners();

            super.dispose();
        }
    }

    /**
     * Load the library from a URL
     */
    async loadFromUrl(url: string, isReady: boolean = true): Promise<void> 
    {
        // If already loaded from this URL, just emit ready
        if(this._url === url && this._isReady) 
        {
            this._libraryEvents.emit(AssetLibraryEvents.READY);
            return;
        }

        this._url = url;

        try 
        {
            const response = await fetch(this._url);

            if(!response.ok) 
            {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Try to parse as JSON (for manifest-based libraries)
            const contentType = response.headers.get('content-type') || '';

            if(contentType.includes('application/json') || this._url.endsWith('.json')) 
            {
                this._manifest = await response.json();
            }

            this._isReady = isReady;
            this._libraryEvents.emit(AssetLibraryEvents.LOADED);
            this._libraryEvents.emit(AssetLibraryEvents.READY);
        }
        catch (error) 
        {
            Logger.getLogger('core.assets.AssetLibrary').error(`Failed to load from ${url}:`, error);
            this._isReady = false;
            this._libraryEvents.emit(AssetLibraryEvents.LOAD_ERROR);
            throw error;
        }
    }

    /**
     * Load assets from a resource manifest
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::loadFromResource()
    loadFromResource(manifest: object, _resourceData: unknown): boolean 
    {
        this._manifest = manifest;
        this._isReady = true;
        return true;
    }

    /**
     * Unload all assets
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::unload()
    unload(): void 
    {
        // Dispose pending loaders
        for(const [, loader] of this._pendingLoads) 
        {
            loader.assetLoader?.dispose();
            loader.dispose();
        }

        this._pendingLoads.clear();

        // Dispose all assets
        for(const [, asset] of this._assetMap) 
        {
            asset.dispose();
        }

        this._assetMap.clear();
        this._assetNameArray.length = 0;
        this._assetByContent.clear();
        this._assetNameIndex.clear();

        this._isReady = false;
        this._url = '';

        this._libraryEvents.emit(AssetLibraryEvents.UNLOADED);
    }

    /**
     * Load a single asset from a file
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::loadAssetFromFile()
    loadAssetFromFile(name: string, url: string, mimeType?: string, id: number = -1): AssetLoaderStruct 
    {
        // Check if asset already exists — `hasAsset()`, not `getAssetByName()`: this is a presence
        // test whose expected answer is "no", and getAssetByName() now warns on a miss.
        if(this.hasAsset(name))
        {
            throw new Error(`Asset with name ${name} already exists`);
        }

        // Check if we're already loading this URL
        const existingLoader = this._pendingLoads.get(url);

        if(existingLoader && existingLoader.assetName === name) 
        {
            return existingLoader;
        }

        // Get type declaration
        let declaration: AssetTypeDeclaration | null;

        if(mimeType) 
        {
            declaration = this.getAssetTypeDeclarationByMimeType(mimeType, true);

            if(!declaration) 
            {
                throw new Error(`Asset type declaration for MIME type ${mimeType} not found`);
            }
        }
        else 
        {
            declaration = this.solveTypeDeclarationFromUrl(url);

            if(!declaration) 
            {
                throw new Error(`Couldn't solve asset type for file ${url}`);
            }
        }

        // Create loader
        if(!declaration.loaderClass) 
        {
            throw new Error(`No loader class defined for MIME type ${declaration.mimeType}`);
        }

        const loader = new declaration.loaderClass(declaration.mimeType, url, id);

        // Create struct to track loading
        const struct = new AssetLoaderStruct(name, loader);
        this._pendingLoads.set(url, struct);

        // Listen for load events
        loader.events.on(AssetLoaderEventType.COMPLETE, (event: AssetLoaderEvent) =>
            this.handleAssetLoadEvent(event, loader, struct, declaration!)
        );

        loader.events.on(AssetLoaderEventType.ERROR, (event: AssetLoaderEvent) =>
            this.handleAssetLoadEvent(event, loader, struct, declaration!)
        );

        loader.events.on(AssetLoaderEventType.PROGRESS, (event: AssetLoaderEvent) => 
        {
            struct.dispatchEvent(new AssetLoaderEvent(event.type, event.status));
        });

        return struct;
    }

    /**
     * Get an asset by name
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::getAssetByName()
    getAssetByName(name: string): IAsset | null
    {
        const asset = this._assetMap.get(name) ?? null;

        if(asset === null)
        {
            AssetLibrary.reportMiss(name, this._name);
        }

        return asset;
    }

    /**
     * Warns about an asset name that resolved to nothing, but only for the two suffixes where a
     * miss is *always* a defect rather than a legitimately absent optional asset.
     *
     * A missing layout is never optional — a window whose `*_xml` is absent silently constructs
     * nothing, which is how 16 windows shipped dead. A name ending in `_png` is never correct at
     * all: an image asset's key is its `*Com.as` field name with the `_png` dropped, so the suffix
     * itself means the caller guessed. Everything else genuinely does miss on purpose — a chat
     * style with no emblem asks for `style_N_chat_bubble_emblem` and expects null — and warning on
     * those would be crying wolf, which is worse than the silence it replaces.
     */
    // TS-only: no AS3 counterpart; AS3 resolves these off a Flash embed that cannot be misnamed.
    // Public because AssetLibraryCollection reports the same miss for a whole collection — see the
    // `hasAsset()` probe in its getAssetByName().
    // ponytail: suffix heuristic, not a registry of required names. Swap it for a declared
    // required-asset list per component if the two suffixes stop covering the real misses.
    static reportMiss(name: string, library: string): void
    {
        if(!name.endsWith('_xml') && !name.endsWith('_png')) return;

        if(AssetLibrary.REPORTED_MISSES.has(name)) return;

        AssetLibrary.REPORTED_MISSES.add(name);

        const hint = name.endsWith('_png')
            ? ' Image keys drop the `_png` suffix — the asset is probably registered as `' + name.slice(0, -4) + '`.'
            : '';

        Logger.getLogger('core.assets.AssetLibrary').warn(`No asset named "${name}" in library "${library}" — the caller gets null and renders nothing.${hint}`);
    }

    /** Names already warned about, so a lookup in a render loop warns once and not per frame. */
    // TS-only: no AS3 counterpart; see reportMiss().
    private static readonly REPORTED_MISSES: Set<string> = new Set();

    /**
     * Get an asset by its content
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::getAssetByContent()
    getAssetByContent(content: unknown): IAsset | null 
    {
        return this._assetByContent.get(content) ?? null;
    }

    /**
     * Get an asset by index
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::getAssetByIndex()
    getAssetByIndex(index: number): IAsset | null 
    {
        if(index < 0 || index >= this._assetNameArray.length) 
        {
            return null;
        }

        return this.getAssetByName(this._assetNameArray[index]);
    }

    /**
     * Get the index of an asset
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::getAssetIndex()
    getAssetIndex(asset: IAsset): number 
    {
        for(const [name, a] of this._assetMap) 
        {
            if(a === asset) 
            {
                return this._assetNameIndex.get(name) ?? -1;
            }
        }

        return -1;
    }

    /**
     * Check if an asset exists
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::hasAsset()
    hasAsset(name: string): boolean 
    {
        return this._assetMap.has(name);
    }

    /**
     * Store an asset
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::setAsset()
    setAsset(name: string, asset: IAsset, overwrite: boolean = true): boolean 
    {
        const exists = this._assetMap.has(name);

        if((overwrite || !exists) && asset) 
        {
            if(exists) 
            {
                const oldAsset = this._assetMap.get(name)!;
                if(oldAsset.content !== undefined) 
                {
                    this._assetByContent.delete(oldAsset.content);
                }
            }
            else 
            {
                this._assetNameIndex.set(name, this._assetNameArray.length);
                this._assetNameArray.push(name);
            }

            this._assetMap.set(name, asset);
            if(asset.content !== undefined) 
            {
                this._assetByContent.set(asset.content, asset);
            }
            return true;
        }

        return false;
    }

    /**
     * Create a new asset of the specified type
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::createAsset()
    createAsset(name: string, declaration: AssetTypeDeclaration): IAsset | null 
    {
        if(this.hasAsset(name) || !declaration) 
        {
            return null;
        }

        const asset = new declaration.assetClass(declaration);

        if(!this.setAsset(name, asset)) 
        {
            asset.dispose();
            return null;
        }

        return asset;
    }

    /**
     * Remove an asset
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::removeAsset()
    removeAsset(asset: IAsset): IAsset | null 
    {
        if(!asset) return null;

        for(const [name, a] of this._assetMap) 
        {
            if(a === asset) 
            {
                const index = this._assetNameIndex.get(name);

                if(index !== undefined) 
                {
                    this._assetNameArray.splice(index, 1);
                    this._assetNameIndex.delete(name);
                    this.rebuildNameIndex();
                }

                if(asset.content !== undefined) 
                {
                    this._assetByContent.delete(asset.content);
                }

                this._assetMap.delete(name);
                return asset;
            }
        }

        return null;
    }

    /**
     * Register an asset type declaration
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/assets/AssetLibrary.as::registerAssetTypeDeclaration()
    registerAssetTypeDeclaration(declaration: AssetTypeDeclaration, isShared: boolean = true): boolean
    {
        const registry = isShared ? AssetLibrary._sharedTypesByMime : this._localTypesByMime;

        if(registry.has(declaration.mimeType))
        {
            throw new Error(`Asset type ${declaration.mimeType} already registered!`);
        }

        registry.set(declaration.mimeType, declaration);
        return true;
    }

    /**
     * Get a type declaration by MIME type
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::getAssetTypeDeclarationByMimeType()
    getAssetTypeDeclarationByMimeType(mimeType: string, checkShared: boolean = true): AssetTypeDeclaration | null 
    {
        if(checkShared) 
        {
            const shared = AssetLibrary._sharedTypesByMime.get(mimeType);

            if(shared) 
            {
                return shared;
            }
        }

        return this._localTypesByMime.get(mimeType) ?? null;
    }

    /**
     * Get a type declaration by asset class
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::getAssetTypeDeclarationByClass()
    getAssetTypeDeclarationByClass(assetClass: new (...args: unknown[]) => IAsset, checkShared: boolean = true): AssetTypeDeclaration | null 
    {
        if(checkShared) 
        {
            for(const [, decl] of AssetLibrary._sharedTypesByMime) 
            {
                if(decl.assetClass === assetClass) 
                {
                    return decl;
                }
            }
        }

        for(const [, decl] of this._localTypesByMime) 
        {
            if(decl.assetClass === assetClass) 
            {
                return decl;
            }
        }

        return null;
    }

    /**
     * Get a type declaration by file extension
     */
    // AS3: .../src/com/sulake/core/assets/AssetLibrary.as::getAssetTypeDeclarationByFileName()
    getAssetTypeDeclarationByFileName(fileName: string, checkShared: boolean = true): AssetTypeDeclaration | null 
    {
        // Extract extension
        let ext = fileName.substring(fileName.lastIndexOf('.') + 1);

        // Remove query string
        const queryIndex = ext.indexOf('?');

        if(queryIndex >= 0) 
        {
            ext = ext.substring(0, queryIndex);
        }

        ext = ext.toLowerCase();

        if(checkShared) 
        {
            for(const [, decl] of AssetLibrary._sharedTypesByMime) 
            {
                if(decl.matchesExtension(ext)) 
                {
                    return decl;
                }
            }
        }

        for(const [, decl] of this._localTypesByMime) 
        {
            if(decl.matchesExtension(ext)) 
            {
                return decl;
            }
        }

        return null;
    }

    /**
     * String representation
     */
    override toString(): string 
    {
        return `[AssetLibrary ${this._name} assets=${this._assetMap.size}]`;
    }

    private rebuildNameIndex(): void 
    {
        this._assetNameIndex.clear();
        for(let i = 0; i < this._assetNameArray.length; i++) 
        {
            this._assetNameIndex.set(this._assetNameArray[i], i);
        }
    }

    /**
     * Initialize the default shared type registrations
     */
    private initializeSharedTypes(): void 
    {
        // Binary/Unknown
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('application/octet-stream', UnknownAsset as AssetClass, BinaryFileLoader as unknown as AssetLoaderClass),
            true
        );

        // Text
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('text/plain', TextAsset as AssetClass, TextFileLoader as unknown as AssetLoaderClass, 'txt'),
            true
        );

        // XML / HTML
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('text/xml', XmlAsset as AssetClass, TextFileLoader as unknown as AssetLoaderClass, 'xml'),
            true
        );
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('text/html', XmlAsset as AssetClass, TextFileLoader as unknown as AssetLoaderClass, 'htm', 'html'),
            true
        );

        // Images
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('image/png', BitmapDataAsset as AssetClass, BitmapFileLoader as unknown as AssetLoaderClass, 'png'),
            true
        );
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('image/jpeg', BitmapDataAsset as AssetClass, BitmapFileLoader as unknown as AssetLoaderClass, 'jpg', 'jpeg'),
            true
        );
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('image/gif', BitmapDataAsset as AssetClass, BitmapFileLoader as unknown as AssetLoaderClass, 'gif'),
            true
        );
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/assets/AssetLibrary.as:111
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('image/tiff', BitmapDataAsset as AssetClass, BitmapFileLoader as unknown as AssetLoaderClass, 'tif', 'tiff'),
            true
        );

        // Audio
        // AS3 registers this under the literal "sound/mp3" (an internal type tag, not
        // a real HTTP MIME type) - callers pass that same literal to loadAssetFromFile(),
        // so registering under "audio/mpeg" made any such call throw "Asset type
        // declaration for MIME type sound/mp3 not found".
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('sound/mp3', SoundAsset as AssetClass, SoundFileLoader as unknown as AssetLoaderClass, 'mp3'),
            true
        );

        // Nitro bundle (our custom format)
        this.registerAssetTypeDeclaration(
            new AssetTypeDeclaration('application/x-nitro-bundle', NitroAsset as AssetClass, NitroBundleLoader as unknown as AssetLoaderClass, 'nitro'),
            true
        );

        AssetLibrary._sharedTypesInitialized = true;
    }

    /**
     * Handle asset loader events
     */
    private handleAssetLoadEvent(
        event: AssetLoaderEvent,
        loader: IAssetLoader,
        struct: AssetLoaderStruct,
        declaration: AssetTypeDeclaration
    ): void 
    {
        let shouldCleanup = false;

        if(event.type === AssetLoaderEventType.COMPLETE) 
        {
            try 
            {
                // Create asset from loaded content
                const asset = new declaration.assetClass(declaration, loader.url);

                // For NitroBundleLoader, pass the loader itself to preserve textures/spritesheet
                if(loader instanceof NitroBundleLoader) 
                {
                    asset.setUnknownContent(loader);
                }
                else 
                {
                    asset.setUnknownContent(loader.content);
                }

                // Store the asset
                this.setAsset(struct.assetName, asset);

                struct.dispatchEvent(new AssetLoaderEvent(AssetLoaderEventType.COMPLETE, event.status));
            }
            catch (error) 
            {
                Logger.getLogger('core.assets.AssetLibrary').error('Error creating asset:', error);
                struct.dispatchEvent(new AssetLoaderEvent(AssetLoaderEventType.ERROR, event.status));
            }

            shouldCleanup = true;
        }
        else if(event.type === AssetLoaderEventType.ERROR) 
        {
            struct.dispatchEvent(new AssetLoaderEvent(AssetLoaderEventType.ERROR, event.status));
            shouldCleanup = true;
        }

        // Cleanup
        if(shouldCleanup && !this.disposed) 
        {
            this._pendingLoads.delete(loader.url);
            struct.dispose();
        }
    }

    /**
     * Solve type declaration from URL
     */
    private solveTypeDeclarationFromUrl(url: string): AssetTypeDeclaration | null 
    {
        // Remove query string
        let cleanUrl = url;
        const queryIndex = cleanUrl.indexOf('?');

        if(queryIndex >= 0) 
        {
            cleanUrl = cleanUrl.substring(0, queryIndex);
        }

        // Extract extension
        const lastDot = cleanUrl.lastIndexOf('.');

        if(lastDot === -1) 
        {
            return null;
        }

        const ext = cleanUrl.substring(lastDot + 1).toLowerCase();

        // Check local types first
        for(const [, decl] of this._localTypesByMime) 
        {
            if(decl.matchesExtension(ext)) 
            {
                return decl;
            }
        }

        // Check shared types
        for(const [, decl] of AssetLibrary._sharedTypesByMime) 
        {
            if(decl.matchesExtension(ext)) 
            {
                return decl;
            }
        }

        return null;
    }
}
