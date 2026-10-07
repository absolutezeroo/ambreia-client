import type {EventEmitter} from 'eventemitter3';
import type {IAssetLibrary} from '../core/assets/index';
import {AssetBitmap} from '@ambreia/common/assets/AssetBitmap';
import {Logger} from '@ambreia/common/utils/Logger';
import type {IFurnitureData} from '@ambreia/iso/furniture/data/IFurnitureData';
import {FurniIconImageReadyEvent} from './events/FurniIconImageReadyEvent';

const log = Logger.getLogger('habbo.session.FurniIconImageManager');

/**
 * Minimal surface this manager needs from the configuration — AS3 is handed the
 * IHabboConfigurationManager and only ever calls getProperty() on it.
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::FurniIconImageManager() param3
export interface IFurniIconConfiguration
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_49.as::getProperty()
    getProperty(key: string): string;
}

/**
 * Minimal surface this manager needs from its owner — AS3 is handed the SessionDataManager
 * itself and only ever asks it for furniture data.
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::FurniIconImageManager() param4
export interface IFurniIconDataSource
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getFloorItemData()
    getFloorItemData(typeId: number): IFurnitureData | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/SessionDataManager.as::getWallItemData()
    getWallItemData(typeId: number): IFurnitureData | null;
}

/**
 * Loads and caches the small furni icons the furni chest floats above itself.
 *
 * Same contract as `BadgeImageManager`: the first ask always misses, kicks off a load against
 * the hotel's icon URL, and returns null; callers either re-ask or listen for
 * FIIRE_ICON_READY. That is AS3's behaviour, not a port limitation.
 *
 * **The cache is a plain Map here, where AS3 uses its own AssetLibrary** — for the reason
 * `BadgeImageManager` documents at length: this port's `BitmapDataAsset.content` is a PixiJS
 * `Texture` while the image has to reach `RoomContentLoader.addGraphicAsset()` as something
 * `Texture.from()` accepts.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as
 */
export class FurniIconImageManager
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::ASSET_PREFIX
    private static readonly ASSET_PREFIX: string = 'furni_icon_';

    // TS-only: the per-icon image cache. AS3 keeps these inside its own `_assets` library; here
    // they are a plain Map, for the type reason in the class doc.
    private _images: Map<string, HTMLImageElement> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::_assets
    // Only the placeholder comes out of it in this port.
    private _assets: IAssetLibrary | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::_SafeStr_4546
    private _events: EventEmitter | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::_SafeStr_5128
    private _configuration: IFurniIconConfiguration | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::_sessionDataManager
    private _sessionDataManager: IFurniIconDataSource | null;

    /**
	 * Keyed by asset name, holding the (wallItem, typeId, extra) triple the ready event has to
	 * carry back — a second request for an already-loading icon must not start another load.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::_loadingInfo
    private _loadingInfo: Map<string, [boolean, number, string]> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::FurniIconImageManager()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::FurniIconImageManager()
    constructor(
        assets: IAssetLibrary | null,
        events: EventEmitter,
        configuration: IFurniIconConfiguration,
        sessionDataManager: IFurniIconDataSource
    )
    {
        this._assets = assets;
        this._events = events;
        this._configuration = configuration;
        this._sessionDataManager = sessionDataManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::getData()
    private getData(wallItem: boolean, typeId: number, _extra: string): IFurnitureData | null
    {
        if(this._sessionDataManager === null) return null;

        if(wallItem) return this._sessionDataManager.getWallItemData(typeId);

        return this._sessionDataManager.getFloorItemData(typeId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::getClassName()
    private getClassName(wallItem: boolean, typeId: number, extra: string): string
    {
        const data = this.getData(wallItem, typeId, extra);

        if(data === null) return `${String(wallItem)}_${typeId}_${extra}`;

        return data.className + extra;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::getAssetName()
    private getAssetName(wallItem: boolean, typeId: number, extra: string): string
    {
        let assetName = FurniIconImageManager.ASSET_PREFIX + this.getClassName(wallItem, typeId, extra);

        const data = this.getData(wallItem, typeId, extra);

        if(data === null) return assetName;

        if(data.hasIndexedColor) assetName += `_${data.colourIndex}`;

        return assetName;
    }

    /**
	 * @param usePlaceholder when true, a miss returns the loading placeholder instead of null.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::getFurniIconImage()
    getFurniIconImage(
        wallItem: boolean,
        typeId: number,
        extra: string,
        usePlaceholder: boolean = true
    ): HTMLImageElement | null
    {
        let image = this.getFurniIconImageInternal(wallItem, typeId, extra);

        if(!image && usePlaceholder) image = this.getPlaceholder();

        return image;
    }

    /**
	 * Returns the cache key if the icon is already there, otherwise null — and kicks off the
	 * load as a side effect, so a second call after the event will succeed.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::getFurniIconImageAssetName()
    getFurniIconImageAssetName(wallItem: boolean, typeId: number, extra: string): string | null
    {
        const assetName = this.getAssetName(wallItem, typeId, extra);

        if(this._images.has(assetName)) return assetName;

        this.getFurniIconImageInternal(wallItem, typeId, extra);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::getFurniIconImageInternal()
    private getFurniIconImageInternal(wallItem: boolean, typeId: number, extra: string): HTMLImageElement | null
    {
        const className = this.getClassName(wallItem, typeId, extra);
        const assetName = this.getAssetName(wallItem, typeId, extra);

        const cached = this._images.get(assetName);

        if(cached) return cached;

        log.trace(`Request furni icon: ${assetName}`);

        let url: string | null = null;

        if(this._configuration !== null)
        {
            const data = this.getData(wallItem, typeId, extra);

            if(data === null) return null;

            url = this._configuration.getProperty('flash.dynamic.download.url')
                + this._configuration.getProperty('flash.dynamic.icon.download.name.template');

            url = url.replace('%revision%', String(data.revision));
            url = url.replace('%typeid%', className);
            url = url.replace('%param%', data.hasIndexedColor ? `_${data.colourIndex}` : '');
        }

        if(url !== null && !this._loadingInfo.has(assetName))
        {
            this._loadingInfo.set(assetName, [wallItem, typeId, extra]);

            this.loadFurniIconImage(assetName, url);
        }

        return null;
    }

    /**
	 * AS3 hands the request to `assets.loadAssetFromFile()` and listens for the loader's
	 * complete/error events; with a plain Map cache the equivalent is an Image element.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::getFurniIconImageInternal() loadAssetFromFile branch
    private loadFurniIconImage(assetName: string, url: string): void
    {
        const image = new Image();

        image.crossOrigin = 'anonymous';

        image.onload = (): void => this.onFurniIconImageReady(assetName, image);

        // AS3: ...::onFurniIconImageError() — drops the entry so a later ask can retry.
        image.onerror = (): void =>
        {
            this._loadingInfo.delete(assetName);

            log.warn(`Furni icon image failed to load: ${url}`);
        };

        image.src = url;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::onFurniIconImageReady()
    private onFurniIconImageReady(assetName: string, image: HTMLImageElement): void
    {
        const info = this._loadingInfo.get(assetName);

        if(info === undefined) return;

        this._loadingInfo.delete(assetName);
        this._images.set(assetName, image);

        this._events?.emit(
            FurniIconImageReadyEvent.FURNI_ICON_READY,
            new FurniIconImageReadyEvent(assetName, info[0], info[1], info[2], image)
        );
    }

    // TS-only: see BadgeImageManager.getPlaceholder() - one shared element instead of AS3's
    // per-call BitmapData clone, because the conversion is not free here and nothing mutates it.
    private _placeholder: HTMLImageElement | null = null;

    /**
	 * The spinner shown in place of a furniture icon that has not arrived yet.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::getPlaceholder()
    private getPlaceholder(): HTMLImageElement | null
    {
        if(this._placeholder !== null) return this._placeholder;

        const asset = this._assets?.getAssetByName('loading_icon') ?? null;

        if(asset === null)
        {
            log.warn('No "loading_icon" asset - furni icons load with no placeholder');

            return null;
        }

        this._placeholder = AssetBitmap.resolveImageElementSync(asset.content);

        return this._placeholder;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/FurniIconImageManager.as::dispose()
    dispose(): void
    {
        this._images.clear();
        this._loadingInfo.clear();
        this._events = null;
        this._configuration = null;
        this._sessionDataManager = null;
    }
}
