import EventEmitter from 'eventemitter3';
import type {AssetLoaderEvent} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import {AssetLoaderEventType} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.avatar.AvatarAssetDownloadLibrary');

/**
 * Manages downloading a single avatar asset library (spritesheet).
 *
 * In AS3, this extends EventDispatcherWrapper and loads SWF libraries via LibraryLoader.
 * In our PixiJS v8 port, we use the AssetLibrary system to load .nitro bundles.
 *
 * @see sources/win63_version/habbo/avatar/AvatarAssetDownloadLibrary.as
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as
 */
export class AvatarAssetDownloadLibrary extends EventEmitter 
{
    public static readonly COMPLETE: string = 'AADL_COMPLETE';

    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::STATE_IDLE
    private static readonly STATE_IDLE: number = 0;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::STATE_DOWNLOADING
    private static readonly STATE_DOWNLOADING: number = 1;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::STATE_READY
    private static readonly STATE_READY: number = 2;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::_revision
    private _revision: string;
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::_downloadUrl
    private _downloadUrl: string;
    private _assetLibrary: IAssetLibrary;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::_state
    private _state: number;

    constructor(libraryName: string, revision: string, downloadUrl: string, assetLibrary: IAssetLibrary) 
    {
        super();

        this._libraryName = libraryName;
        this._revision = revision;
        this._downloadUrl = downloadUrl;
        this._assetLibrary = assetLibrary;
        this._state = AvatarAssetDownloadLibrary.STATE_IDLE;
        this._isMandatory = false;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::_libraryName
    private _libraryName: string;

    /**
     * The name of this asset library.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::get libraryName()
    public get libraryName(): string 
    {
        return this._libraryName;
    }

    private _isMandatory: boolean;

    /**
     * Whether this library is a mandatory (core) library.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::get isMandatory()
    public get isMandatory(): boolean 
    {
        return this._isMandatory;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::set isMandatory()
    public set isMandatory(value: boolean) 
    {
        this._isMandatory = value;
    }

    /**
     * Whether the library has finished downloading.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::get isReady()
    public get isReady(): boolean 
    {
        return this._state === AvatarAssetDownloadLibrary.STATE_READY;
    }

    /**
     * Begins downloading this library's assets.
     *
     * In AS3 this creates a URLRequest and loads via LibraryLoader into the asset library.
     * Here we use the AssetLibrary.loadAssetFromFile() system to load the .nitro bundle.
     * On completion (or error), emits COMPLETE.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::startDownloading()
    public startDownloading(): void 
    {
        if(this._state !== AvatarAssetDownloadLibrary.STATE_IDLE) return;

        this._state = AvatarAssetDownloadLibrary.STATE_DOWNLOADING;

        // Check if already loaded in asset library
        if(this._assetLibrary.hasAsset(this._libraryName)) 
        {
            this._state = AvatarAssetDownloadLibrary.STATE_READY;
            this.emit(AvatarAssetDownloadLibrary.COMPLETE, this);

            return;
        }

        const url = this._downloadUrl
            .replace('%libname%', this._libraryName)
            .replace('%revision%', this._revision);

        if(!url || url === this._downloadUrl) 
        {
            log.warn(`No valid download URL for: ${this._libraryName}`);
            this._state = AvatarAssetDownloadLibrary.STATE_READY;
            this.emit(AvatarAssetDownloadLibrary.COMPLETE, this);

            return;
        }

        log.debug(`Downloading: ${this._libraryName} from ${url}`);

        try 
        {
            const loader = this._assetLibrary.loadAssetFromFile(this._libraryName, url, 'application/x-nitro-bundle');

            if(!loader) 
            {
                log.warn(`Failed to start loading: ${this._libraryName}`);
                this._state = AvatarAssetDownloadLibrary.STATE_READY;
                this.emit(AvatarAssetDownloadLibrary.COMPLETE, this);

                return;
            }

            loader.events.on('event', (event: AssetLoaderEvent) => 
            {
                if(event.type === AssetLoaderEventType.COMPLETE) 
                {
                    log.debug(`Loaded: ${this._libraryName}`);
                    this._state = AvatarAssetDownloadLibrary.STATE_READY;
                    this.emit(AvatarAssetDownloadLibrary.COMPLETE, this);
                }
                else if(event.type === AssetLoaderEventType.ERROR) 
                {
                    log.warn(`Failed to load: ${this._libraryName}`);
                    this._state = AvatarAssetDownloadLibrary.STATE_READY;
                    this.emit(AvatarAssetDownloadLibrary.COMPLETE, this);
                }
            });
        }
        catch (error) 
        {
            log.warn(`Error loading ${this._libraryName}: ${error}`);
            this._state = AvatarAssetDownloadLibrary.STATE_READY;
            this.emit(AvatarAssetDownloadLibrary.COMPLETE, this);
        }
    }

    /**
     * Purges the loaded assets from memory, resetting the library to idle state.
     *
     * In AS3 this removes the asset library from the AssetLibraryCollection.
     */
    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::purge()
    public purge(): void 
    {
        this._state = AvatarAssetDownloadLibrary.STATE_IDLE;
    }

    // AS3: .../src/com/sulake/habbo/avatar/AvatarAssetDownloadLibrary.as::toString()
    public toString(): string 
    {
        return this._libraryName + (this.isReady ? '[x]' : '[ ]');
    }
}
