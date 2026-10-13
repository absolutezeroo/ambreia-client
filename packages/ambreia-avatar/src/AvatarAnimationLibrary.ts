import EventEmitter from 'eventemitter3';
import type {AssetLoaderEvent} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {AmbreiaDirectory} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import type {NitroAsset} from '@ambreia/common/assets/NitroAsset';
import {AssetLoaderEventType} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.avatar.AvatarAnimationLibrary');

/**
 * Manages downloading a single avatar effect asset library.
 *
 * Similar to AvatarAssetDownloadLibrary but for effect animations.
 * Also extracts and stores animation data from the loaded resource.
 *
 * In AS3, this extends EventDispatcherWrapper and implements INamed.
 * The animation data is extracted from the loaded SWF resource's animation property.
 *
 * @see sources/win63_version/habbo/avatar/AvatarAnimationLibrary.as
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/AvatarAnimationLibrary.as
 */
export class AvatarAnimationLibrary extends EventEmitter 
{
    public static readonly COMPLETE: string = 'EADL_COMPLETE';

    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::STATE_IDLE
    private static readonly STATE_IDLE: number = 0;
    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::STATE_DOWNLOADING
    private static readonly STATE_DOWNLOADING: number = 1;
    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::STATE_READY
    private static readonly STATE_READY: number = 2;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::_revision
    private _revision: string;
    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::_downloadUrl
    // DEVIATION: AS3 holds a URL template; the port holds the effects family's .ambreia directory
    // (spec 2026-10-09-ambreia-everything).
    private _directory: AmbreiaDirectory;
    private _assetLibrary: IAssetLibrary;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::_state
    private _state: number;

    constructor(name: string, revision: string, directory: AmbreiaDirectory, assetLibrary: IAssetLibrary)
    {
        super();

        this._name = name;
        this._revision = revision;
        this._directory = directory;
        this._assetLibrary = assetLibrary;
        this._state = AvatarAnimationLibrary.STATE_IDLE;
        this._animation = null;
    }

    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::_name
    private _name: string;

    /**
     * The name of this effect library.
     */
    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::get name()
    public get name(): string 
    {
        return this._name;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::_animation
    private _animation: any | null;

    /**
     * The animation data extracted from the loaded effect library.
     *
     * In AS3, this is XML data extracted from the loaded SWF resource's animation property.
     * In our port, this is JSON animation data from the .nitro bundle.
     */
    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::get animation()
    public get animation(): any | null 
    {
        return this._animation;
    }

    /**
     * Whether the library has finished downloading.
     */
    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::get isReady()
    public get isReady(): boolean 
    {
        return this._state === AvatarAnimationLibrary.STATE_READY;
    }

    /**
     * Begins downloading this effect library's assets.
     *
     * In AS3 this creates a URLRequest and loads via LibraryLoader.
     * On completion, extracts animation data from the resource and emits COMPLETE.
     */
    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::startDownloading()
    public startDownloading(): void 
    {
        if(this._state !== AvatarAnimationLibrary.STATE_IDLE) return;

        this._state = AvatarAnimationLibrary.STATE_DOWNLOADING;

        // Check if already loaded in asset library
        if(this._assetLibrary.hasAsset(this._name)) 
        {
            this.extractAnimation();
            this._state = AvatarAnimationLibrary.STATE_READY;
            this.emit(AvatarAnimationLibrary.COMPLETE, this);

            return;
        }

        log.debug(`Downloading effect: ${this._name} (revision ${this._revision}) from ${this._directory.url}`);

        try
        {
            const loader = this._assetLibrary.loadPiece(this._name, this._directory);

            if(!loader) 
            {
                log.warn(`Failed to start loading effect: ${this._name}`);
                this._state = AvatarAnimationLibrary.STATE_READY;
                this.emit(AvatarAnimationLibrary.COMPLETE, this);

                return;
            }

            loader.events.on('event', (event: AssetLoaderEvent) => 
            {
                if(event.type === AssetLoaderEventType.COMPLETE) 
                {
                    log.debug(`Loaded effect: ${this._name}`);
                    this.extractAnimation();
                    this._state = AvatarAnimationLibrary.STATE_READY;
                    this.emit(AvatarAnimationLibrary.COMPLETE, this);
                }
                else if(event.type === AssetLoaderEventType.ERROR) 
                {
                    log.warn(`Failed to load effect: ${this._name}`);
                    this._state = AvatarAnimationLibrary.STATE_READY;
                    this.emit(AvatarAnimationLibrary.COMPLETE, this);
                }
            });
        }
        catch (error) 
        {
            log.warn(`Error loading effect ${this._name}: ${error}`);
            this._state = AvatarAnimationLibrary.STATE_READY;
            this.emit(AvatarAnimationLibrary.COMPLETE, this);
        }
    }

    // AS3: .../src/com/sulake/habbo/avatar/EffectAssetDownloadLibrary.as::toString()
    public toString(): string 
    {
        return this._name + (this.isReady ? '[x]' : '[ ]');
    }

    /**
     * Extracts animation data from the loaded .nitro bundle's JSON.
     *
     * In AS3, this is extracted from the loaded SWF resource.
     */
    private extractAnimation(): void 
    {
        const asset = this._assetLibrary.getAssetByName(this._name) as NitroAsset | null;

        if(asset) 
        {
            const jsonData = (asset as any).jsonData;

            if(jsonData?.animations) 
            {
                this._animation = jsonData.animations;
            }
        }
    }
}
