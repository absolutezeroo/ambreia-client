/**
 * FurnitureDynamicThumbnailVisualization
 *
 * Base for furniture whose thumbnail is loaded asynchronously from a URL (external/user images,
 * YouTube video covers). Subclasses only implement `getThumbnailURL()`; this class polls it on
 * every model update, kicks off a load when the URL changes, and hands the result to
 * `FurnitureThumbnailVisualization.setThumbnailImages()` once it arrives.
 *
 * Class identity: obfuscated in the primary tree as
 * `sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1874.as`.
 * Recovered as `FurnitureDynamicThumbnailVisualization` from the unobfuscated
 * `sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureDynamicThumbnailVisualization.as`, whose
 * shape matches `_SafeCls_1874` exactly (the `getThumbnailURL()` "must be overridden" contract, the
 * `updateModel()` load-on-change logic); corroborated by `sources/win63_version/habbo/room/object/visualization/furniture/class_2189.as`.
 * PRODUCTION is 2016 and cited for the name only - the body ported below is WIN63's.
 *
 * AS3 loads with `flash.display.Loader` + `LoaderContext(checkPolicyFile)` (Flash's cross-domain
 * policy check). There is no Loader in a browser DOM; this port uses the same `new Image()` +
 * `crossOrigin = 'anonymous'` load this codebase already uses for other cross-origin furniture
 * images (`BadgeImageManager.loadBadgeImage()`), which is the browser's equivalent CORS gate, then
 * wraps the loaded element in a PixiJS `Texture` the same way `RoomEngine.addBadgeGraphicAssets()`
 * already does for those. AS3 does not guard against a URL changing again before the previous
 * load finishes (no request is cancelled, and the handler is not scoped to the request that started
 * it) - this port keeps that exact race rather than adding a staleness check AS3 does not have.
 */
import {Texture} from 'pixi.js';
import {Logger} from '@ambreia/common/utils/Logger';
import {FurnitureThumbnailVisualization} from './FurnitureThumbnailVisualization';

const log = Logger.getLogger('habbo.room.object.visualization.furniture.FurnitureDynamicThumbnailVisualization');

export class FurnitureDynamicThumbnailVisualization extends FurnitureThumbnailVisualization
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1874.as::_SafeStr_7236
    // Obfuscated field with no recoverable name; holds the URL of the thumbnail currently
    // loaded/loading, so a repeat with the same URL is skipped.
    private _lastThumbnailUrl: string | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1874.as::updateModel()
    protected override updateModel(scale: number): boolean
    {
        if(this.object !== null)
        {
            const url = this.getThumbnailURL();

            if(this._lastThumbnailUrl !== url)
            {
                this._lastThumbnailUrl = url;

                if(url !== null && url !== '')
                {
                    this.loadThumbnail(url);
                }
                else
                {
                    this.setThumbnailImages(null);
                }
            }
        }

        return super.updateModel(scale);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1874.as::getThumbnailURL()
    protected getThumbnailURL(): string | null
    {
        throw new Error('[FurnitureDynamicThumbnailVisualization] getThumbnailURL() must be overridden!');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1874.as::updateModel() Loader construction
    private loadThumbnail(url: string): void
    {
        const image = new Image();

        image.crossOrigin = 'anonymous';
        image.onload = (): void => this.onThumbnailLoaded(image);
        image.onerror = (): void => FurnitureDynamicThumbnailVisualization.onThumbnailError(url);

        image.src = url;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1874.as::onThumbnailLoaded()
    private onThumbnailLoaded(image: HTMLImageElement): void
    {
        this.setThumbnailImages(Texture.from(image));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1874.as::onThumbnailError()
    private static onThumbnailError(url: string): void
    {
        log.warn(`External Image thumbnail download error: ${url}`);
    }
}
