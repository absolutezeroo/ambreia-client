/**
 * FurnitureGuildCustomizedVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3389
 *
 * Base class for guild-customizable furniture with dynamic thumbnail support.
 * Handles isometric thumbnail projection per direction.
 */
import type {Texture} from 'pixi.js';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureGuildCustomizedVisualization extends AnimatedFurnitureVisualization
{
    protected static readonly THUMBNAIL_SPRITE_TAG: string = 'THUMBNAIL';

    private _thumbnailAssetName32: string | null = null;
    private _thumbnailAssetName64: string | null = null;
    private _thumbnailImageNormal: Texture | null = null;
    private _thumbnailImage32: Texture | null = null;
    private _lastDirection: number = 0;
    private _needsRefresh: boolean = false;

    private _hasOutline: boolean = false;

    set hasOutline(value: boolean)
    {
        this._hasOutline = value;
    }

    get hasThumbnailImage(): boolean
    {
        return this._thumbnailImageNormal !== null;
    }

    setThumbnailImages(normal: Texture | null, small: Texture | null = null): void
    {
        this._thumbnailImageNormal = normal;
        this._thumbnailImage32 = small !== null ? small : normal;
        this._needsRefresh = true;
    }

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

        this.refreshThumbnail(scale);

        return true;
    }

    protected override getSpriteAssetName(scale: number, layerIndex: number): string
    {
        if(this._thumbnailImageNormal === null || this.getSpriteTag(scale, this.direction, layerIndex) !== FurnitureGuildCustomizedVisualization.THUMBNAIL_SPRITE_TAG)
        {
            return super.getSpriteAssetName(scale, layerIndex);
        }

        return this.getThumbnailAssetName(scale);
    }

    protected getThumbnailAssetName(scale: number): string
    {
        if(this._thumbnailAssetName32 === null)
        {
            const id = this.object?.getId() || 0;
            this._thumbnailAssetName32 = this.getFullThumbnailAssetName(id, 32);
            this._thumbnailAssetName64 = this.getFullThumbnailAssetName(id, 64);
        }

        return scale === 32 ? this._thumbnailAssetName32 : this._thumbnailAssetName64!;
    }

    protected getFullThumbnailAssetName(objectId: number, size: number): string
    {
        return [this.type, objectId, 'thumb', size].join('_');
    }

    private refreshThumbnail(scale: number): void
    {
        if(this.assetCollection === null)
        {
            return;
        }

        if(this._thumbnailImageNormal !== null)
        {
            this.addThumbnailAsset(this._thumbnailImageNormal, 64, scale);
            this.addThumbnailAsset(this._thumbnailImage32 || this._thumbnailImageNormal, 32, scale);
        }
        else
        {
            this.assetCollection.disposeAsset(this.getThumbnailAssetName(64));
            this.assetCollection.disposeAsset(this.getThumbnailAssetName(32));
        }

        this._needsRefresh = false;
        this._lastDirection = this.direction;
    }

    private addThumbnailAsset(texture: Texture, size: number, _scale: number): void
    {
        if(this.assetCollection === null)
        {
            return;
        }

        for(let i = 0; i < this.spriteCount; i++)
        {
            if(this.getSpriteTag(size, this.direction, i) === FurnitureGuildCustomizedVisualization.THUMBNAIL_SPRITE_TAG)
            {
                const baseName = this.getSpriteAssetNameWithoutFrame(size, i, false) + this.getFrameNumber(size, i);
                const baseAsset: IGraphicAsset | null = this.getAsset(baseName, i);

                if(baseAsset !== null)
                {
                    const assetName = this.getThumbnailAssetName(size);
                    this.assetCollection.disposeAsset(assetName);
                    this.assetCollection.addAsset(assetName, texture, true, baseAsset.offsetX, baseAsset.offsetY);
                }

                return;
            }
        }
    }
}
