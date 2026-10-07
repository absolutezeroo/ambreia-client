import type {EventEmitter} from 'eventemitter3';
import type {IAssetLibrary} from '../core/assets/index';
import {AssetBitmap} from '@ambreia/common/assets/AssetBitmap';
import {Logger} from '@ambreia/common/utils/Logger';
import {BadgeInfo} from './BadgeInfo';
import {BadgeImageReadyEvent} from './events/BadgeImageReadyEvent';

const log = Logger.getLogger('habbo.session.BadgeImageManager');

/**
 * Minimal surface this manager needs from its owner — AS3 passes the SessionDataManager itself
 * and only ever calls getProperty() on it.
 */
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::BadgeImageManager() param3
export interface IBadgeImageConfiguration
{
    getProperty(key: string): string;
}

/**
 * Loads and caches badge images.
 *
 * A badge is never returned on first ask: the lookup misses, a load is kicked off against the
 * hotel's image library, and callers get null (or the placeholder) until BADGE_IMAGE_READY
 * fires. That is AS3's own behaviour, not a limitation of this port — every consumer is
 * expected to either re-ask or listen for the event.
 *
 * **The cache is a plain Map here, where AS3 uses its AssetLibrary.** The library was the
 * faithful choice and was rejected on a type conflict: this port's `BitmapDataAsset.content` is
 * a PixiJS `Texture`, while the whole badge API — `BadgeInfo`, the five SessionDataManager
 * accessors, and `Product.initIcon()`'s `createImageBitmap(badgeImage)` call — is written
 * against `HTMLImageElement`. Routing through the library would have meant changing that public
 * contract everywhere to satisfy an internal detail. Everything else — the asset-name scheme,
 * the group-badge dedup, the two URL shapes, the 50% small-badge derivation and the ready
 * event — is ported as-is.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as
 */
export class BadgeImageManager
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::_SafeStr_10539
    // (the identifier is obfuscated; its value "group_badge" is the switch case in
    // getBadgeImageInternal(), so the name is derived from the value.)
    static readonly TYPE_GROUP: string = 'group_badge';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::TYPE_NORMAL
    static readonly TYPE_NORMAL: string = 'normal_badge';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::ASSET_PREFIX
    private static readonly ASSET_PREFIX: string = 'badge_';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::ASSET_SMALL_POSTFIX
    private static readonly ASSET_SMALL_POSTFIX: string = '_32';

    // TS-only: the per-badge image cache. AS3 keeps these inside its own `_assets` library; here
    // they are a plain Map, for the type reason in the class doc.
    private _images: Map<string, HTMLImageElement> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::_assets
    // Only the placeholder comes out of it in this port — the badge images themselves are cached
    // in `_images` above rather than added to the library.
    private _assets: IAssetLibrary | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/BadgeImageManager.as::_events
    private _events: EventEmitter | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/BadgeImageManager.as::_configuration
    private _configuration: IBadgeImageConfiguration | null;

    /**
	 * Group badges are deduplicated by asset name so a room full of the same guild does not
	 * fire one request per member.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::_requestedGroupBadges
    private _requestedGroupBadges: Set<string> = new Set();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::BadgeImageManager()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::BadgeImageManager()
    constructor(assets: IAssetLibrary | null, events: EventEmitter, configuration: IBadgeImageConfiguration)
    {
        this._assets = assets;
        this._events = events;
        this._configuration = configuration;
    }

    /**
	 * @param useplaceholder when true, a miss returns the loading placeholder instead of null.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::getBadgeImage()
    getBadgeImage(
        badgeName: string,
        type: string = BadgeImageManager.TYPE_NORMAL,
        useplaceholder: boolean = true,
        small: boolean = false
    ): HTMLImageElement | null
    {
        let image = this.getBadgeImageInternal(badgeName, type, small);

        if(!image && useplaceholder) image = this.getPlaceholder();

        return image;
    }

    /**
	 * The double lookup is AS3's: if the small variant is missing but the full-size one is
	 * cached, derive the small one first, then ask again.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::getSmallBadgeImage()
    getSmallBadgeImage(badgeName: string, type: string = BadgeImageManager.TYPE_NORMAL): HTMLImageElement | null
    {
        if(this.getBadgeImageInternal(badgeName, type, true) === null && this.getBadgeImageInternal(badgeName) !== null)
        {
            this.createSmallBadgeBitmap(BadgeImageManager.ASSET_PREFIX + badgeName, badgeName);
        }

        return this.getBadgeImage(badgeName, type, false, true);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::getBadgeImageWithInfo()
    getBadgeImageWithInfo(badgeName: string): BadgeInfo
    {
        const image = this.getBadgeImageInternal(badgeName);

        return image !== null ? new BadgeInfo(image, false) : new BadgeInfo(this.getPlaceholder(), true);
    }

    /**
	 * Returns the cache key if the image is already there, otherwise null — and kicks off the
	 * load as a side effect, so a second call after the event will succeed.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::getBadgeImageAssetName()
    getBadgeImageAssetName(
        badgeName: string,
        type: string = BadgeImageManager.TYPE_NORMAL,
        small: boolean = false
    ): string | null
    {
        const assetName = BadgeImageManager.ASSET_PREFIX + badgeName + (small ? BadgeImageManager.ASSET_SMALL_POSTFIX : '');

        if(this._images.has(assetName)) return assetName;

        this.getBadgeImageInternal(badgeName, type, small);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::getSmallScaleBadgeAssetName()
    getSmallScaleBadgeAssetName(badgeName: string, type: string = BadgeImageManager.TYPE_NORMAL): string | null
    {
        const assetName = this.getBadgeImageAssetName(badgeName, type, true);

        if(assetName === null)
        {
            this.createSmallBadgeBitmap(BadgeImageManager.ASSET_PREFIX + badgeName, badgeName);

            return this.getBadgeImageAssetName(badgeName, type, true);
        }

        return assetName;
    }

    /**
	 * The cache miss path. Note the small variant never triggers a request of its own — it is
	 * only ever derived locally from the full-size image, so a miss there returns null.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::getBadgeImageInternal()
    private getBadgeImageInternal(
        badgeName: string,
        type: string = BadgeImageManager.TYPE_NORMAL,
        small: boolean = false
    ): HTMLImageElement | null
    {
        const assetName = BadgeImageManager.ASSET_PREFIX + badgeName + (small ? BadgeImageManager.ASSET_SMALL_POSTFIX : '');

        const cached = this._images.get(assetName);

        if(cached) return cached;

        if(small) return null;

        log.trace(`Request badge: ${badgeName}`);

        let url: string | null = null;

        switch(type)
        {
            case BadgeImageManager.TYPE_NORMAL:
                if(this._configuration !== null)
                {
                    url = `${this._configuration.getProperty('image.library.url')}album1584/${badgeName}.png`;
                }
                break;

            case BadgeImageManager.TYPE_GROUP:
                if(this._configuration !== null && !this._requestedGroupBadges.has(assetName))
                {
                    url = this._configuration.getProperty('group.badge.url').replace('%imagerdata%', badgeName);

                    // The configured group-badge URL still ends in .gif on most hotels; AS3
                    // rewrites the extension rather than the whole URL.
                    if(url.substr(-4) === '.gif') url = `${url.slice(0, -3)}png`;

                    this._requestedGroupBadges.add(assetName);
                }
                break;
        }

        if(url !== null) this.loadBadgeImage(assetName, url);

        return null;
    }

    /**
	 * AS3 hands the request to `assets.loadAssetFromFile()` and listens for the loader's
	 * complete event; with a plain Map cache the equivalent is an Image element.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::getBadgeImageInternal() loadAssetFromFile branch
    private loadBadgeImage(assetName: string, url: string): void
    {
        const image = new Image();

        // Required for the canvas read in renderSmallScaleBadgeBitmap(): without it, deriving
        // the small badge taints the canvas and toDataURL() throws.
        image.crossOrigin = 'anonymous';

        image.onload = (): void => this.onBadgeImageReady(assetName, image);

        image.onerror = (): void => log.warn(`Badge image failed to load: ${url}`);

        image.src = url;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::onBadgeImageReady()
    private onBadgeImageReady(assetName: string, image: HTMLImageElement): void
    {
        if(this._events === null) return;

        this._images.set(assetName, image);

        const badgeId = assetName.replace(BadgeImageManager.ASSET_PREFIX, '');

        this._events.emit(BadgeImageReadyEvent.BADGE_IMAGE_READY, new BadgeImageReadyEvent(badgeId, image));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::createSmallBadgeBitmap()
    private createSmallBadgeBitmap(sourceAssetName: string, badgeName: string): void
    {
        const small = this.renderSmallScaleBadgeBitmap(sourceAssetName);

        if(!small) return;

        this._images.set(BadgeImageManager.ASSET_PREFIX + badgeName + BadgeImageManager.ASSET_SMALL_POSTFIX, small);
    }

    /**
	 * Half-scale copy of an already-cached badge.
	 *
	 * The returned element is not decoded yet — assigning a data URL starts a fresh load, so
	 * like a network badge it is blank on the call that creates it and usable afterwards. AS3
	 * could draw straight into a BitmapData and had no such gap.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::renderSmallScaleBadgeBitmap()
    private renderSmallScaleBadgeBitmap(assetName: string): HTMLImageElement | null
    {
        const source = this._images.get(assetName);

        if(!source) return null;

        const canvas = document.createElement('canvas');

        canvas.width = source.width / 2;
        canvas.height = source.height / 2;

        const context = canvas.getContext('2d');

        if(context === null) return null;

        context.drawImage(source, 0, 0, canvas.width, canvas.height);

        const scaled = new Image();

        scaled.src = canvas.toDataURL();

        return scaled;
    }

    // TS-only: AS3 clones the BitmapData on every call, so each caller owns its copy. Here the
    // conversion out of the asset library costs a canvas round trip, and nothing mutates the
    // placeholder, so one element is built on first use and shared.
    private _placeholder: HTMLImageElement | null = null;

    /**
	 * The spinner shown in place of a badge whose image has not arrived yet.
	 *
	 * AS3 clones the `loading_icon` asset's BitmapData directly; this port's library stores a
	 * PixiJS `Texture`, so it goes through `AssetBitmap` to reach the `HTMLImageElement` the rest
	 * of this class is typed in.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::getPlaceholder()
    private getPlaceholder(): HTMLImageElement | null
    {
        if(this._placeholder !== null) return this._placeholder;

        const asset = this._assets?.getAssetByName('loading_icon') ?? null;

        if(asset === null)
        {
            log.warn('No "loading_icon" asset - badges load with no placeholder');

            return null;
        }

        this._placeholder = AssetBitmap.resolveImageElementSync(asset.content);

        return this._placeholder;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/BadgeImageManager.as::dispose()
    dispose(): void
    {
        this._images.clear();
        this._requestedGroupBadges.clear();
        this._events = null;
        this._configuration = null;
    }
}
