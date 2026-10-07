/**
 * FurnitureThumbnailVisualization
 *
 * Base for furniture whose main sprite is a runtime-loaded thumbnail image (external/user
 * images, YouTube video covers) rather than a shipped asset. Holds the thumbnail bookkeeping:
 * the "THUMBNAIL"-tagged sprite, the per-size asset names, and the isometric transform that
 * skews the flat thumbnail bitmap onto the furniture's sprite for the current direction
 * (plus an optional 1px black outline/halo).
 *
 * Class identity: obfuscated in the primary tree as
 * `sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as`.
 * Recovered as `FurnitureThumbnailVisualization` from the unobfuscated
 * `sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureThumbnailVisualization.as`, whose member
 * set matches `_SafeCls_1873` exactly (down to the `THUMBNAIL_SPRITE_TAG` constant and every method
 * body); corroborated structurally by `sources/win63_version/habbo/room/object/visualization/furniture/class_1866.as` (same obfuscation
 * scheme, same members, different meaningless name). PRODUCTION is 2016 and cited for the name
 * only, never for behavior — the body ported below is WIN63's.
 */
import {Texture} from 'pixi.js';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureThumbnailVisualization extends AnimatedFurnitureVisualization
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::THUMBNAIL_SPRITE_TAG
    protected static readonly THUMBNAIL_SPRITE_TAG: string = 'THUMBNAIL';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::_thumbnailAssetNameSmall
    private _thumbnailAssetNameSmall: string | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::_thumbnailAssetNameNormal
    private _thumbnailAssetNameNormal: string | null = null;
    // Obfuscated field with no recoverable name (_SafeStr_8963 in primary, var_4132 in
    // win63_version) - name kept consistent with the identical member already ported in
    // FurnitureGuildCustomizedVisualization.ts, which shares this exact base class in AS3.
    private _hasOutline: boolean = false;
    // AS3's `_thumbnailImageNormal`/`_thumbnailImageSmall` are Flash BitmapData; this port renders
    // via PixiJS, so they hold a Texture instead - same role, different graphics API.
    private _thumbnailImageNormal: Texture | null = null;
    private _thumbnailImageSmall: Texture | null = null;
    // Obfuscated fields with no recoverable name (_SafeStr_8936/_SafeStr_8240 in primary) - kept
    // consistent with FurnitureGuildCustomizedVisualization.ts's naming for the same members.
    private _lastDirection: number = 0;
    private _needsRefresh: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::set hasOutline()
    set hasOutline(value: boolean)
    {
        this._hasOutline = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::get hasThumbnailImage()
    get hasThumbnailImage(): boolean
    {
        return this._thumbnailImageNormal !== null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::setThumbnailImages()
    setThumbnailImages(normal: Texture | null, small: Texture | null = null): void
    {
        this._thumbnailImageNormal = normal;
        this._thumbnailImageSmall = small !== null ? small : normal;
        this._needsRefresh = true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::updateModel()
    protected override updateModel(scale: number): boolean
    {
        const result = super.updateModel(scale);

        if(this.object === null)
        {
            return result;
        }

        if(!this._needsRefresh && this._lastDirection === this.direction)
        {
            return result;
        }

        this.refreshThumbnail();

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::refreshThumbnail()
    private refreshThumbnail(): void
    {
        if(this.assetCollection === null)
        {
            return;
        }

        if(this._thumbnailImageNormal !== null)
        {
            this.addThumbnailAsset(this._thumbnailImageNormal, 64);
            this.addThumbnailAsset(this._thumbnailImageSmall ?? this._thumbnailImageNormal, 32);
        }
        else
        {
            this.clearThumbnailSpriteAssets();
            this.assetCollection.disposeAsset(this.getThumbnailAssetName(64));
            this.assetCollection.disposeAsset(this.getThumbnailAssetName(32));
        }

        this._needsRefresh = false;
        this._lastDirection = this.direction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::addThumbnailAsset()
    private addThumbnailAsset(texture: Texture, size: number): void
    {
        const collection = this.assetCollection;

        if(collection === null)
        {
            return;
        }

        for(let i = 0; i < this.spriteCount; i++)
        {
            if(this.getSpriteTag(size, this.direction, i) === FurnitureThumbnailVisualization.THUMBNAIL_SPRITE_TAG)
            {
                const baseName = this.getSpriteAssetNameWithoutFrame(size, i, false) + this.getFrameNumber(size, i);
                const baseAsset = this.getAsset(baseName, i);

                if(baseAsset !== null)
                {
                    const transformed = this.generateTransformedThumbnail(texture, baseAsset);
                    const assetName = this.getThumbnailAssetName(size);

                    this.clearThumbnailSpriteAssets();
                    collection.disposeAsset(assetName);
                    collection.addAsset(assetName, transformed, true, baseAsset.offsetX, baseAsset.offsetY);
                }

                return;
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::clearThumbnailSpriteAssets()
    private clearThumbnailSpriteAssets(): void
    {
        for(let i = 0; i < this.spriteCount; i++)
        {
            const sprite = this.getSprite(i);

            if(sprite !== null && sprite.tag === FurnitureThumbnailVisualization.THUMBNAIL_SPRITE_TAG)
            {
                sprite.texture = null;
            }
        }
    }

    /**
	 * AS3 draws with `BitmapData.draw(source, matrix, colorTransform)` - a software rasterizer.
	 * This port has no BitmapData, so the same affine skew is replayed on a 2D canvas context,
	 * whose `setTransform(a,b,c,d,e,f)` takes the same six coefficients as AS3's Matrix. The
	 * outline halo's `ColorTransform(color = 0)` (recolours every drawn pixel to black while
	 * keeping its alpha) is replayed by pre-recolouring a silhouette copy of the source via a
	 * `source-in` composite, then drawing that silhouette instead of the source at the four
	 * offset positions.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::generateTransformedThumbnail()
    private generateTransformedThumbnail(sourceTexture: Texture, targetAsset: IGraphicAsset): Texture
    {
        const sourceElement = FurnitureThumbnailVisualization.getDrawableSource(sourceTexture);

        if(sourceElement === null)
        {
            return sourceTexture;
        }

        const sourceWidth = sourceTexture.width;
        const scale = targetAsset.width / sourceWidth;

        const a = scale;
        let b = 0;
        const c = 0;
        let d = scale;
        let tx = 0;
        let ty = 0;

        switch(this.direction)
        {
            case 0:
            case 4:
                b = 0.5 * scale;
                d = scale * 1.1;
                break;

            case 2:
                b = -0.5 * scale;
                d = scale * 1.1;
                ty = 0.5 * scale * sourceWidth;
                break;

            default:
                break;
        }

        if(this._hasOutline)
        {
            const canvas = new OffscreenCanvas(targetAsset.width + 2, targetAsset.height + 2);
            const ctx = canvas.getContext('2d')!;
            const silhouette = FurnitureThumbnailVisualization.toBlackSilhouette(sourceElement, sourceTexture.width, sourceTexture.height);

            ctx.setTransform(a, b, c, d, tx, ty);
            ctx.drawImage(silhouette, 0, 0);

            tx += 1;
            ty -= 1;
            ctx.setTransform(a, b, c, d, tx, ty);
            ctx.drawImage(silhouette, 0, 0);

            ty += 2;
            ctx.setTransform(a, b, c, d, tx, ty);
            ctx.drawImage(silhouette, 0, 0);

            tx += 1;
            ty -= 1;
            ctx.setTransform(a, b, c, d, tx, ty);
            ctx.drawImage(silhouette, 0, 0);

            tx -= 1;
            ctx.setTransform(a, b, c, d, tx, ty);
            ctx.drawImage(sourceElement, 0, 0);

            return Texture.from(canvas.transferToImageBitmap());
        }

        const canvas = new OffscreenCanvas(targetAsset.width, targetAsset.height);
        const ctx = canvas.getContext('2d')!;

        ctx.setTransform(a, b, c, d, tx, ty);
        ctx.drawImage(sourceElement, 0, 0);

        return Texture.from(canvas.transferToImageBitmap());
    }

    // TS-only: AS3 recolours in the same BitmapData.draw() call via a ColorTransform; a 2D canvas
    // has no per-draw colour transform, so the silhouette is pre-rendered once here instead.
    private static toBlackSilhouette(source: CanvasImageSource, width: number, height: number): OffscreenCanvas
    {
        const canvas = new OffscreenCanvas(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
        const ctx = canvas.getContext('2d')!;

        ctx.drawImage(source, 0, 0);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas;
    }

    // TS-only: AS3's BitmapData is already the drawable pixel source; this port's Texture wraps
    // one, and this reaches into it the same way FurnitureRoomBrandingVisualization.ts already does.
    private static getDrawableSource(texture: Texture): CanvasImageSource | null
    {
        const source = (texture as unknown as {source?: {resource?: unknown}}).source;
        const resource = (source?.resource as CanvasImageSource) ?? null;

        return resource;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::getSpriteAssetName()
    protected override getSpriteAssetName(scale: number, layerIndex: number): string
    {
        if(this._thumbnailImageNormal === null || this.getSpriteTag(scale, this.direction, layerIndex) !== FurnitureThumbnailVisualization.THUMBNAIL_SPRITE_TAG)
        {
            return super.getSpriteAssetName(scale, layerIndex);
        }

        return this.getThumbnailAssetName(scale);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::getThumbnailAssetName()
    protected getThumbnailAssetName(size: number): string
    {
        if(this._thumbnailAssetNameSmall === null)
        {
            const id = this.object?.getId() ?? 0;

            this._thumbnailAssetNameSmall = this.getFullThumbnailAssetName(id, 32);
            this._thumbnailAssetNameNormal = this.getFullThumbnailAssetName(id, 64);
        }

        return size === 32 ? this._thumbnailAssetNameSmall : this._thumbnailAssetNameNormal!;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_1873.as::getFullThumbnailAssetName()
    protected getFullThumbnailAssetName(objectId: number, size: number): string
    {
        return [this.type, objectId, 'thumb', size].join('_');
    }
}
