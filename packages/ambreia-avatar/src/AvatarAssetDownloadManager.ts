import EventEmitter from 'eventemitter3';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {AmbreiaDirectory} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import type {IAvatarFigureContainer} from './IAvatarFigureContainer';
import type {IAvatarImageListener} from './IAvatarImageListener';
import type {AvatarStructure} from './AvatarStructure';
import type {AssetAliasCollection} from './alias/AssetAliasCollection';
import {AvatarAssetDownloadLibrary} from './AvatarAssetDownloadLibrary';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.avatar.AvatarAssetDownloadManager');

/**
 * Manages downloading avatar asset libraries based on figure data.
 *
 * Parses the figure map to create library-to-part mappings, then downloads
 * the required libraries when a figure's assets are requested. Libraries are
 * queued and downloaded with a maximum of 4 simultaneous downloads.
 * Listeners are notified when all libraries for a given figure are ready.
 *
 * In AS3, this extends EventDispatcherWrapper and uses Timer + URLRequest for
 * download scheduling. The mandatory libraries are "hh_human_body" and "hh_human_item".
 *
 * @see sources/win63_version/habbo/avatar/AvatarAssetDownloadManager.as
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as
 */
export class AvatarAssetDownloadManager extends EventEmitter 
{
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::LIBRARY_LOADED
    public static readonly LIBRARY_LOADED: string = 'LIBRARY_LOADED';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_SafeStr_9372
    // AS3's default is 6, not a named constant like this - `4` here was invented. AS3 also bumps
    // it to 16 in the constructor when the figure-map URL host is "//rumba.sulake.com" (a specific
    // legacy CDN); that bump is a dead branch in this port (no such host exists), so only the
    // default is restored.
    private static readonly MAX_SIMULTANEOUS_DOWNLOADS: number = 6;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::LIB_BODY
    private static readonly LIB_BODY: string = 'hh_human_body';
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::LIB_ITEMS
    private static readonly LIB_ITEMS: string = 'hh_human_item';
    // Ambreia's weapons, carried like hand items (vortex-client/tools/build-weapon-handitems.mjs).
    // Hand items are never asked for by a figure, so only a mandatory library gets downloaded.
    private static readonly LIB_WEAPONS: string = 'ambreia_weapons';

    /** Downloaded before any avatar renders; VortexMain counts them on the loading bar. */
    public static readonly MANDATORY_LIBRARIES: readonly string[] = [
        AvatarAssetDownloadManager.LIB_BODY,
        AvatarAssetDownloadManager.LIB_ITEMS,
        AvatarAssetDownloadManager.LIB_WEAPONS
    ];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_structure
    private _structure: AvatarStructure;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_libraries
    private _libraries: Map<string, AvatarAssetDownloadLibrary>;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_figureMap
    private _figureMap: Map<string, AvatarAssetDownloadLibrary[]>;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_incompleteFigures
    private _incompleteFigures: Map<string, AvatarAssetDownloadLibrary[]>;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_listeners
    private _listeners: Map<string, IAvatarImageListener[]>;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_pendingDownloadQueue
    private _pendingDownloadQueue: AvatarAssetDownloadLibrary[];
    private _pendingDownloadSet: Set<AvatarAssetDownloadLibrary>;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_currentDownloads
    private _currentDownloads: AvatarAssetDownloadLibrary[];
    private _currentDownloadSet: Set<AvatarAssetDownloadLibrary>;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::_initDownloadBuffer
    private _initDownloadBuffer: [IAvatarFigureContainer, IAvatarImageListener | null][];
    private _isReady: boolean;
    // DEVIATION: AS3 holds the libraries' URL template; the port holds the clothing family's
    // .ambreia directory (spec 2026-10-09-ambreia-everything).
    private _directory: AmbreiaDirectory;
    private _assetLibrary: IAssetLibrary;
    private _aliasCollection: AssetAliasCollection | null;
    private _mandatoryLibs: string[];
    private _renderReadyProvider: (() => boolean) | null;
    private _mandatoryLibrariesReadyCallback: (() => void) | null;

    // TS-only: the loading-bar hook the host passes in place of Core.instance.
    private readonly _libraryLoadedCallback: ((libraryName: string) => void) | null;

    constructor(
        directory: AmbreiaDirectory,
        structure: AvatarStructure,
        assetLibrary: IAssetLibrary,
        aliasCollection: AssetAliasCollection | null = null,
        renderReadyProvider: (() => boolean) | null = null,
        mandatoryLibrariesReadyCallback: (() => void) | null = null,
        libraryLoadedCallback: ((libraryName: string) => void) | null = null
    ) 
    {
        super();

        this._libraryLoadedCallback = libraryLoadedCallback;

        this._structure = structure;
        this._directory = directory;
        this._assetLibrary = assetLibrary;
        this._aliasCollection = aliasCollection;
        this._renderReadyProvider = renderReadyProvider;
        this._mandatoryLibrariesReadyCallback = mandatoryLibrariesReadyCallback;
        this._libraries = new Map();
        this._figureMap = new Map();
        this._incompleteFigures = new Map();
        this._listeners = new Map();
        this._pendingDownloadQueue = [];
        this._pendingDownloadSet = new Set();
        this._currentDownloads = [];
        this._currentDownloadSet = new Set();
        this._initDownloadBuffer = [];
        this._isReady = false;
        // DEVIATION: AS3 lists LIB_BODY and LIB_ITEMS only; Ambreia adds LIB_WEAPONS.
        this._mandatoryLibs = [...AvatarAssetDownloadManager.MANDATORY_LIBRARIES];
    }

    /**
     * Parses figure map data and starts downloading mandatory libraries.
     *
     * In AS3, this is called after the figuremap XML is loaded from URL or cache.
     * The map is generated and mandatory libs are queued for download.
     *
     * @param data - The figure map data (JSON, adapted from XML)
     */
    public loadFigureMap(data: any): void 
    {
        if(!data) return;

        if(typeof data === 'object' && Object.keys(data).length === 0) return;

        this.generateMap(data);

        log.info(`Figure map loaded: ${this._libraries.size} libraries, ${this._figureMap.size} part mappings`);

        this.loadMandatoryLibs();
        this._isReady = true;
        this.processInitBuffer();
    }

    /**
     * Checks whether all required libraries for a figure are already downloaded.
     *
     * @param figure - The figure container to check
     * @returns True if all required libraries are ready
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::isReady()
    public isReady(figure: IAvatarFigureContainer): boolean 
    {
        if(!this._isReady || (this._renderReadyProvider !== null && !this._renderReadyProvider())) return false;

        const libs = this.getLibsToDownload(figure);

        return libs.length === 0;
    }

    /**
     * Returns whether any mandatory libraries are still missing.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::isMissingMandatoryLibs()
    public isMissingMandatoryLibs(): boolean 
    {
        return this._mandatoryLibs.length > 0;
    }

    /**
     * Initiates loading of all asset libraries required by the given figure.
     *
     * If the manager is not yet ready, the request is buffered for later processing.
     * If all libraries are already downloaded, the listener is notified immediately.
     * Otherwise, the required libraries are queued for download and the listener
     * is registered for notification when all are complete.
     *
     * @param figure - The figure container describing the avatar
     * @param listener - Optional listener to notify when assets are ready
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::loadFigureSetData()
    public loadFigureSetData(figure: IAvatarFigureContainer, listener: IAvatarImageListener | null = null): void 
    {
        const renderReady = this._renderReadyProvider === null || this._renderReadyProvider();

        if(!this._isReady || !renderReady) 
        {
            this._initDownloadBuffer.push([figure, listener]);
            return;
        }

        const figureString = figure.getFigureString();
        const libs = this.getLibsToDownload(figure);

        log.debug(`loadFigureSetData: ${figureString} → ${libs.length} libs to download: [${libs.map(l => l.libraryName).join(', ')}]`);

        if(libs.length > 0) 
        {
            if(listener && !listener.disposed) 
            {
                if(!this._listeners.has(figureString)) 
                {
                    this._listeners.set(figureString, []);
                }

                this._listeners.get(figureString)!.push(listener);
            }

            this._incompleteFigures.set(figureString, libs);

            for(const lib of libs) 
            {
                this.addToQueue(lib);
            }

            this.processPending();
        }
        else if(listener !== null && !listener.disposed) 
        {
            listener.avatarImageReady(figureString);
        }
    }

    /**
     * Flushes the init download buffer, processing any requests that were queued
     * before the manager was ready.
     */
    public processInitBuffer(): void 
    {
        const buffer = this._initDownloadBuffer;

        this._initDownloadBuffer = [];

        for(const [figure, listener] of buffer) 
        {
            this.loadFigureSetData(figure, listener);
        }
    }

    /**
     * Purges all non-mandatory libraries to free memory.
     *
     * In AS3, this iterates all libraries and calls purge() on those
     * that are ready and not mandatory.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::purge()
    public purge(): void 
    {
        for(const library of this._libraries.values()) 
        {
            if(library.isReady && !library.isMandatory) 
            {
                library.purge();
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::dispose()
    public dispose(): void 
    {
        this._libraries.clear();
        this._figureMap.clear();
        this._incompleteFigures.clear();
        this._listeners.clear();
        this._pendingDownloadQueue.length = 0;
        this._pendingDownloadSet.clear();
        this._currentDownloads.length = 0;
        this._currentDownloadSet.clear();
        this._initDownloadBuffer.length = 0;
        this._renderReadyProvider = null;
        this._mandatoryLibrariesReadyCallback = null;
    }

    /**
     * Generates the library-to-figure-part mapping from figure map data.
     *
     * In AS3, iterates XML `<lib>` elements, creating AvatarAssetDownloadLibrary instances
     * and mapping their `<part>` children by "type:id" keys.
     *
     * Handles multiple JSON formats:
     * - { libraries: [...] } or { libs: [...] }
     * - Root-level array [...]
     * - { lib: [...] } (converted from XML)
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::generateMap()
    private generateMap(data: any): void 
    {
        if(!data) return;

        // Resolve the library array from various possible formats
        let libraries: any[] | null = null;

        if(Array.isArray(data)) 
        {
            libraries = data;
        }
        else if(Array.isArray(data.libraries)) 
        {
            libraries = data.libraries;
        }
        else if(Array.isArray(data.libs)) 
        {
            libraries = data.libs;
        }
        else if(Array.isArray(data.lib)) 
        {
            libraries = data.lib;
        }

        if(!libraries || libraries.length === 0) 
        {
            log.warn(`Figure map data has no recognized library array. Keys: ${Object.keys(data).join(', ')}`);

            return;
        }

        log.debug(`Parsing figure map with ${libraries.length} library entries`);

        for(const libData of libraries) 
        {
            const libName = String(libData.id || '');
            const revision = String(libData.revision || '');

            if(libName === '') continue;

            const library = new AvatarAssetDownloadLibrary(
                libName,
                revision,
                this._directory,
                this._assetLibrary
            );

            library.on(AvatarAssetDownloadLibrary.COMPLETE, () => this.libraryComplete(library));

            this._libraries.set(libName, library);

            // Handle parts in multiple formats
            const parts = libData.parts || libData.part || [];
            const partsArray = Array.isArray(parts) ? parts : [parts];

            for(const partData of partsArray) 
            {
                if(!partData) continue;

                const partType = String(partData.type || '');
                const partId = String(partData.id || '');

                if(partType === '' || partId === '') continue;

                const key = partType + ':' + partId;

                if(!this._figureMap.has(key)) 
                {
                    this._figureMap.set(key, []);
                }

                this._figureMap.get(key)!.push(library);
            }
        }
    }

    /**
     * Determines which libraries still need to be downloaded for a given figure.
     *
     * In AS3, this iterates the figure's part type IDs, looks up each part set,
     * then checks each part's "type:id" key against the figure map for unready libraries.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::getLibsToDownload()
    private getLibsToDownload(figure: IAvatarFigureContainer): AvatarAssetDownloadLibrary[] 
    {
        const result: AvatarAssetDownloadLibrary[] = [];
        const resultSet: Set<AvatarAssetDownloadLibrary> = new Set();

        if(!this._structure) return result;
        if(!figure) return result;

        const figureData = this._structure.figureData;

        if(!figureData) 
        {
            return result;
        }

        const partTypes = figure.getPartTypeIds();

        for(const partType of partTypes) 
        {
            const setType = figureData.getSetType(partType);

            if(!setType) 
            {
                continue;
            }

            const partSetId = figure.getPartSetId(partType);
            const partSet = setType.getPartSet(partSetId);

            if(!partSet) 
            {
                continue;
            }

            for(const part of partSet.parts) 
            {
                const key = part.type + ':' + part.id;
                const libs = this._figureMap.get(key);

                if(libs) 
                {
                    for(const lib of libs) 
                    {
                        if(lib && !lib.isReady && !resultSet.has(lib)) 
                        {
                            resultSet.add(lib);
                            result.push(lib);
                        }
                    }
                }
            }
        }

        return result;
    }

    /**
     * Callback invoked when a library finishes downloading.
     *
     * Removes the library from current downloads, checks which pending figures
     * are now complete, notifies their listeners, removes the completed library
     * from the mandatory list if applicable, and triggers the next batch of downloads.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::libraryComplete()
    private libraryComplete(library: AvatarAssetDownloadLibrary): void
    {
        // Remove from current downloads
        if(this._currentDownloadSet.delete(library)) 
        {
            const downloadIndex = this._currentDownloads.indexOf(library);

            if(downloadIndex !== -1) 
            {
                this._currentDownloads.splice(downloadIndex, 1);
            }
        }

        // Register assets and aliases from the loaded library
        if(this._aliasCollection) 
        {
            this._aliasCollection.onAvatarAssetsLibraryReady(library.libraryName);
        }

        // Check which pending figures are now complete
        const completedFigures: string[] = [];

        for(const [figureString, libs] of this._incompleteFigures) 
        {
            const allReady = libs.every(lib => lib.isReady);

            if(allReady) 
            {
                completedFigures.push(figureString);

                const listeners = this._listeners.get(figureString);

                if(listeners) 
                {
                    for(const listener of listeners) 
                    {
                        if(listener && !listener.disposed) 
                        {
                            listener.avatarImageReady(figureString);
                        }
                    }

                    this._listeners.delete(figureString);
                }
            }
        }

        for(const figureString of completedFigures) 
        {
            this._incompleteFigures.delete(figureString);
        }

        // Remove from mandatory libs if applicable
        const mandatoryIndex = this._mandatoryLibs.indexOf(library.libraryName);

        if(mandatoryIndex !== -1)
        {
            this._mandatoryLibs.splice(mandatoryIndex, 1);

            // AS3 lists these same two libraries a second time, as core asset-libraries in the
            // config document HabboAir hands to `readConfigDocument()`, and it is the core's copy
            // that drives the loading bar between CORE_RATIO and 1.0. Here the core does not
            // fetch them — this manager does — so the completion is reported back to it, which
            // is what decrements `getNumberOfFilesPending()` and emits the progress event
            // VortexMain.onProgressEvent() listens for.
            // TS-only: was `Core.instance?.updateLoadingProcess(...)`; the host passes the callback.
            this._libraryLoadedCallback?.(library.libraryName);

            if(this._mandatoryLibs.length === 0 && this._mandatoryLibrariesReadyCallback !== null)
            {
                const callback = this._mandatoryLibrariesReadyCallback;

                this._mandatoryLibrariesReadyCallback = null;
                callback();
            }
        }

        if(completedFigures.length > 0) 
        {
            this.emit(AvatarAssetDownloadManager.LIBRARY_LOADED, library.libraryName);
        }

        this.processPending();
    }

    /**
     * Adds a library to the pending download queue if not already queued or downloading.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::addToQueue()
    private addToQueue(library: AvatarAssetDownloadLibrary): void 
    {
        if(!library.isReady && !this._pendingDownloadSet.has(library) && !this._currentDownloadSet.has(library)) 
        {
            this._pendingDownloadSet.add(library);
            this._pendingDownloadQueue.push(library);
        }
    }

    /**
     * Processes the pending download queue, starting downloads up to the maximum limit.
     *
     * In AS3, this is triggered by a Timer with 100ms delay.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::processPending()
    private processPending(): void 
    {
        while(this._pendingDownloadQueue.length > 0 && this._currentDownloads.length < AvatarAssetDownloadManager.MAX_SIMULTANEOUS_DOWNLOADS) 
        {
            const library = this._pendingDownloadQueue.shift()!;
            this._pendingDownloadSet.delete(library);

            this._currentDownloadSet.add(library);
            this._currentDownloads.push(library);
            library.startDownloading();
        }
    }

    /**
     * Loads mandatory libraries (hh_human_body, hh_human_item).
     *
     * These are required for basic avatar rendering and are queued immediately.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadManager.as::loadMandatoryLibs()
    private loadMandatoryLibs(): void 
    {
        const libs = this._mandatoryLibs.slice();

        for(const libName of libs) 
        {
            const lib = this._libraries.get(libName);

            if(lib) 
            {
                lib.isMandatory = true;
                this.addToQueue(lib);
            }
        }

        this.processPending();
    }
}
