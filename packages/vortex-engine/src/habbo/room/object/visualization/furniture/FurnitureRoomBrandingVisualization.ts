/**
 * FurnitureRoomBrandingVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureRoomBrandingVisualization
 *
 * Base for branded/billboard furniture with external images.
 * Loads images from asset collection and creates state-dependent variants.
 */
import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {FurnitureVisualization} from './FurnitureVisualization';
import {Texture} from 'pixi.js';

export class FurnitureRoomBrandingVisualization extends FurnitureVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBrandingVisualization.as::BRANDED_IMAGE_SPRITE_TAG
    private static readonly BRANDED_IMAGE_SPRITE_TAG: string = 'branded_image';
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBrandingVisualization.as::OBJECT_STATE_DEFAULT
    private static readonly OBJECT_STATE_DEFAULT: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBrandingVisualization.as::OBJECT_STATE_FLIPH
    private static readonly OBJECT_STATE_FLIPH: number = 1;
    private static readonly OBJECT_STATE_FLIPV: number = 2;
    private static readonly OBJECT_STATE_FLIPBOTH: number = 3;

    protected _imageUrl: string | null = null;
    protected _imageReady: boolean = false;
    protected _brandingOffsetX: number = 0;
    protected _brandingOffsetY: number = 0;
    protected _brandingOffsetZ: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBrandingVisualization.as::_dynamicAssetName
    private _dynamicAssetName: string | null = null;

    override dispose(): void
    {
        if(this._dynamicAssetName !== null && this.assetCollection !== null)
        {
            this.assetCollection.disposeAsset(this._dynamicAssetName);
            this._dynamicAssetName = null;
        }

        super.dispose();
        this._imageUrl = null;
    }

    protected override updateObject(scale: number, geometryDirection: number): boolean
    {
        if(super.updateObject(scale, geometryDirection))
        {
            if(this._imageReady)
            {
                this.checkAndCreateImageForCurrentState(scale);
            }

            return true;
        }

        return false;
    }

    protected override updateModel(scale: number): boolean
    {
        const result = super.updateModel(scale);
        const roomObject = this.object;

        if(roomObject !== null)
        {
            const model = roomObject.getModel();

            if(model !== null)
            {
                this._brandingOffsetX = model.getNumber('furniture_branding_offset_x') || 0;
                this._brandingOffsetY = model.getNumber('furniture_branding_offset_y') || 0;
                this._brandingOffsetZ = model.getNumber('furniture_branding_offset_z') || 0;
            }
        }

        if(!this._imageReady)
        {
            this._imageReady = this.checkIfImageReady();

            if(this._imageReady)
            {
                this.checkAndCreateImageForCurrentState(scale);

                return true;
            }
        }
        else if(this.checkIfImageChanged())
        {
            this._imageReady = false;
            this._imageUrl = null;

            return true;
        }

        return result;
    }

    protected override getSpriteAssetName(scale: number, layerIndex: number): string
    {
        const size = this.getSize(scale);
        let layerName: string;

        if(layerIndex < this.spriteCount - 1)
        {
            layerName = String.fromCharCode('a'.charCodeAt(0) + layerIndex);
        }
        else
        {
            layerName = 'sd';
        }

        let assetName: string;

        if(size === 1)
        {
            assetName = this.type + '_icon_' + layerName;
        }
        else
        {
            const frame = this.getFrameNumber(scale, layerIndex);
            assetName = this.type + '_' + size + '_' + layerName + '_' + this.direction + '_' + frame;
        }

        const tag = this.getSpriteTag(scale, this.direction, layerIndex);

        if(this._imageUrl !== null && tag === FurnitureRoomBrandingVisualization.BRANDED_IMAGE_SPRITE_TAG)
        {
            const state = this.object?.getState(0) || 0;

            return this._imageUrl + '_' + size + '_' + state;
        }

        return assetName;
    }

    protected override getLibraryAssetNameForSprite(asset: IGraphicAsset, sprite: IRoomObjectSprite): string
    {
        if(sprite.tag !== FurnitureRoomBrandingVisualization.BRANDED_IMAGE_SPRITE_TAG)
        {
            return super.getLibraryAssetNameForSprite(asset, sprite);
        }

        const model = this.object?.getModel();

        if(model !== null && model !== undefined)
        {
            const url = model.getString('furniture_branding_image_url');

            if(url !== null && url.length > 0)
            {
                return url;
            }
        }

        return super.getLibraryAssetNameForSprite(asset, sprite);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBrandingVisualization.as::checkIfImageChanged()
    protected checkIfImageChanged(): boolean
    {
        const model = this.object?.getModel();

        if(model !== null && model !== undefined)
        {
            const url = model.getString('furniture_branding_image_url');

            if(url !== null && url !== this._imageUrl)
            {
                return true;
            }
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBrandingVisualization.as::checkIfImageReady()
    protected checkIfImageReady(): boolean
    {
        const model = this.object?.getModel();

        if(model !== null && model !== undefined)
        {
            const url = model.getString('furniture_branding_image_url');

            if(url !== null)
            {
                if(this._imageUrl === null || this._imageUrl !== url)
                {
                    const status = model.getNumber('furniture_branding_image_status');

                    if(status === 1)
                    {
                        if(this.assetCollection !== null)
                        {
                            const asset = this.assetCollection.getAsset(url);

                            if(asset !== null && asset.texture !== null)
                            {
                                this.imageReady(url);

                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBrandingVisualization.as::imageReady()
    protected imageReady(url: string): void
    {
        this._imageUrl = url;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBrandingVisualization.as::checkAndCreateImageForCurrentState()
    private checkAndCreateImageForCurrentState(scale: number): void
    {
        if(this.object === null || this._imageUrl === null || this.assetCollection === null)
        {
            return;
        }

        const sourceAsset = this.assetCollection.getAsset(this._imageUrl);

        if(sourceAsset === null)
        {
            return;
        }

        const state = this.object.getState(0);
        const size = this.getSize(scale);
        const assetName = this._imageUrl + '_' + size + '_' + state;

        const existing = this.assetCollection.getAsset(assetName);

        if(existing !== null)
        {
            return;
        }

        if(sourceAsset.texture === null)
        {
            return;
        }

        const shouldScale = this._imageUrl.indexOf('noscale') === -1;
        let effectiveSize = size;

        if(this._imageUrl.indexOf('force32') > -1)
        {
            effectiveSize = 32;
        }

        // AS3: FurnitureRoomBrandingVisualization.as::checkAndCreateImageForCurrentState() halves the
        // source bitmap when rendering at icon size (32) unless the branding image URL contains
        // "noscale" - the port must reproduce this or branded billboards render oversized at icon zoom.
        // The offsets below then use this (possibly downscaled) bitmap's own dimensions, exactly as
        // AS3's `_loc2_.width`/`_loc2_.height` do, not the original sourceAsset dimensions.
        let texture: Texture = sourceAsset.texture;
        let effectiveWidth = sourceAsset.width;
        let effectiveHeight = sourceAsset.height;

        if(effectiveSize === 32 && shouldScale)
        {
            const source = (texture as unknown as {source?: {resource?: unknown}}).source;
            const resource = (source?.resource as CanvasImageSource) ?? null;

            if(resource !== null)
            {
                effectiveWidth = Math.max(1, Math.round(sourceAsset.width / 2));
                effectiveHeight = Math.max(1, Math.round(sourceAsset.height / 2));

                const canvas = new OffscreenCanvas(effectiveWidth, effectiveHeight);
                const ctx = canvas.getContext('2d')!;

                ctx.drawImage(resource, 0, 0, sourceAsset.width, sourceAsset.height, 0, 0, effectiveWidth, effectiveHeight);

                texture = Texture.from(canvas.transferToImageBitmap());
            }
        }

        let offsetX = 0;
        let offsetY = 0;
        let flipH = false;
        let flipV = false;

        switch(state)
        {
            case FurnitureRoomBrandingVisualization.OBJECT_STATE_DEFAULT:
                offsetX = 0;
                offsetY = 0;
                flipH = false;
                flipV = false;
                break;
            case FurnitureRoomBrandingVisualization.OBJECT_STATE_FLIPH:
                offsetX = -(effectiveWidth || 0);
                offsetY = 0;
                flipH = true;
                flipV = false;
                break;
            case FurnitureRoomBrandingVisualization.OBJECT_STATE_FLIPV:
                offsetX = -(effectiveWidth || 0);
                offsetY = -(effectiveHeight || 0);
                flipH = true;
                flipV = true;
                break;
            case FurnitureRoomBrandingVisualization.OBJECT_STATE_FLIPBOTH:
                offsetX = 0;
                offsetY = -(effectiveHeight || 0);
                flipH = false;
                flipV = true;
                break;
        }

        if(this._dynamicAssetName !== null)
        {
            this.assetCollection.disposeAsset(this._dynamicAssetName);
        }

        this._dynamicAssetName = assetName;
        this.assetCollection.addAsset(assetName, texture, true, offsetX, offsetY, flipH, flipV);
    }
}
