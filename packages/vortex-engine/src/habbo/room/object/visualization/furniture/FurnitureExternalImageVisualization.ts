/**
 * FurnitureExternalImageVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureExternalImageVisualization
 *
 * Displays user-uploaded external images on furniture (posters, selfies). The room object's
 * `furniture_data` model string carries a small JSON blob, one of:
 *  - `{"id": "<uuid>"}` - a photo/selfie: the real thumbnail URL is not known yet and must be
 *    resolved from the id, either individually (`loadExtraData()`) or batched through
 *    `ExtraDataManager`, depending on which mode `setExternalBaseUrls()` was configured with.
 *  - `{"w": "<url>"}` / `{"url": "<url>"}` - a poster: the URL is already known and only needs
 *    the small-thumbnail suffix applied.
 *
 * AS3 loads the resolved thumbnail URL through `flash.display.Loader`; that happens one class up,
 * in `FurnitureDynamicThumbnailVisualization` (see its header for the browser-side substitution).
 */
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import {RoomObjectVariableEnum} from '@habbo/room/object/RoomObjectVariableEnum';
import {Logger} from '@ambreia/common/utils/Logger';
import {Vortex} from '../../../../../Vortex';
import {FurnitureDynamicThumbnailVisualization} from './FurnitureDynamicThumbnailVisualization';
import {ExtraDataManager} from '../data/ExtraDataManager';

const log = Logger.getLogger('habbo.room.object.visualization.furniture.FurnitureExternalImageVisualization');

export class FurnitureExternalImageVisualization extends FurnitureDynamicThumbnailVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::setExternalBaseUrls() "disabled" sentinel
    // Name DERIVED: AS3 compares the base URL to the literal "disabled" inline; the sentinel is
    // not a named constant in any tree. Kept consistent with the same derived constant already in
    // ExternalImageWidgetHandler.ts (`URL_BASE_DISABLED`), which reads the same configuration value.
    private static readonly URL_BASE_DISABLED: string = 'disabled';

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::_SafeStr_9859
    private _useExtraDataBatching: boolean = false;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::_SafeStr_6160
    private _thumbnailBaseUrl: string | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::_SafeStr_8711
    private _extraDataBaseUrl: string | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::_SafeStr_5520
    private _resolvedThumbnailUrl: string | null = null;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::_SafeStr_8320
    private _extraDataRequested: boolean = false;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::_SafeStr_6900
    private _thumbnailPathPrefix: string = '';
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::_SafeStr_9863
    private _externalImageUUID: string | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::FurnitureExternalImageVisualization()
    constructor()
    {
        super();

        this.hasOutline = true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::setExternalBaseUrls()
    override setExternalBaseUrls(baseUrl: string, secureBaseUrl: string, batchesEnabled: boolean): void
    {
        this._thumbnailBaseUrl = baseUrl;
        this._extraDataBaseUrl = secureBaseUrl;
        this._useExtraDataBatching = batchesEnabled;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::getThumbnailURL()
    protected override getThumbnailURL(): string | null
    {
        const roomObject = this.object;

        if(roomObject === null
            || this._thumbnailBaseUrl === FurnitureExternalImageVisualization.URL_BASE_DISABLED
            || this._resolvedThumbnailUrl === ExtraDataManager.STATUS_REJECTED)
        {
            return null;
        }

        if(this._resolvedThumbnailUrl)
        {
            return this._resolvedThumbnailUrl;
        }

        const model = roomObject.getModel();

        if(!model.hasString(RoomObjectVariableEnum.FURNITURE_DATA))
        {
            return null;
        }

        const stuffData = model.getString(RoomObjectVariableEnum.FURNITURE_DATA);

        let url: string | null;

        try
        {
            this._thumbnailPathPrefix = roomObject.getType().indexOf('external_image_wallitem_poster') !== -1
                ? ''
                : 'postcards/selfie/';

            const id = this.getJsonValue(stuffData, 'id', null);

            if(id !== null && id.length > 0)
            {
                if(!this._extraDataRequested)
                {
                    this._externalImageUUID = id;
                    this._extraDataRequested = true;

                    if(this._useExtraDataBatching)
                    {
                        ExtraDataManager.requestExtraDataUrl(this);
                    }
                    else
                    {
                        this.loadExtraData(id);
                    }
                }

                return null;
            }

            url = this.getJsonValue(stuffData, 'w', 'url');
            url = this.buildThumbnailUrl(url, this._thumbnailPathPrefix);
        }
        catch
        {
            return null;
        }

        this._resolvedThumbnailUrl = url;

        return url;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::getExternalImageUUID()
    getExternalImageUUID(): string | null
    {
        return this._externalImageUUID;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::buildThumbnailUrl()
    private buildThumbnailUrl(url: string | null, prefix: string): string | null
    {
        if(url === null)
        {
            return null;
        }

        if(url === ExtraDataManager.STATUS_REJECTED)
        {
            return url;
        }

        if(url.indexOf('http') !== 0)
        {
            url = this._thumbnailBaseUrl + prefix + url;
        }

        url = url.replace('.png', '_small.png');

        if(url.indexOf('.png') === -1)
        {
            url += '_small.png';
        }

        return url;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::getJsonValue()
    private getJsonValue(json: string, key: string, fallbackKey: string | null): string | null
    {
        const parsed = JSON.parse(json) as Record<string, unknown>;
        let value = (parsed[key] as string) ?? null;

        if(value === null && fallbackKey !== null)
        {
            value = (parsed[fallbackKey] as string) ?? null;
        }

        return value;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::loadExtraData()
    private loadExtraData(id: string): void
    {
        const url = this._extraDataBaseUrl + id;

        fetch(url)
            .then(response => response.text())
            .then(text => this.onExtraDataLoaded(text))
            .catch((error: unknown) => this.onExtraDataError(error));

        this._extraDataRequested = true;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::onExtraDataError()
    private onExtraDataError(error: unknown): void
    {
        log.warn(`Extra data failed to load ${String(error)}`);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::onExtraDataLoaded()
    private onExtraDataLoaded(responseText: string): void
    {
        if(responseText.length === 0)
        {
            return;
        }

        const url = this.getJsonValue(responseText, 'w', 'url');

        this._resolvedThumbnailUrl = this.buildThumbnailUrl(url, this._thumbnailPathPrefix);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::onUrlFromExtraDataService()
    onUrlFromExtraDataService(url: string): void
    {
        this._resolvedThumbnailUrl = this.buildThumbnailUrl(url, this._thumbnailPathPrefix);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::getExtraDataUrl()
    getExtraDataUrl(): string | null
    {
        return this._extraDataBaseUrl;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::dispose()
    override dispose(): void
    {
        ExtraDataManager.furnitureDisposed(this);

        super.dispose();
    }

    /**
	 * AS3 returns a `BitmapData` here (`RoomObjectSpriteVisualization.getImage()`'s own AS3
	 * signature - see that method's TS override for why this port's equivalent returns an
	 * `HTMLCanvasElement` instead); read out through PixiJS's synchronous renderer extraction,
	 * the same mechanism `RoomObjectSpriteVisualization.extractDarknessToAlpha()` already uses.
	 */
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::getImage()
    override getImage(_backgroundColor: number, originalId: number): HTMLCanvasElement | null
    {
        if(this.assetCollection === null)
        {
            return null;
        }

        let assetName = this.getFullThumbnailAssetName(originalId, 32);
        let asset = this.assetCollection.getAsset(assetName);

        if(asset === null && this.object !== null)
        {
            assetName = `${this.object.getType()}_icon_a`;
            asset = this.assetCollection.getAsset(assetName);
        }

        if(asset === null || asset.texture === null)
        {
            return null;
        }

        try
        {
            return Vortex.instance.application.renderer.extract.canvas(asset.texture) as HTMLCanvasElement;
        }
        catch
        {
            return null;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureExternalImageVisualization.as::getLibraryAssetNameForSprite()
    protected override getLibraryAssetNameForSprite(_asset: IGraphicAsset, _sprite: IRoomObjectSprite): string
    {
        return this._resolvedThumbnailUrl ?? '';
    }
}
