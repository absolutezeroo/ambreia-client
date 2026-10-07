/**
 * FurnitureBadgeDisplayVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3395
 *
 * Displays user badges on furniture with auto-centering.
 */
import type {IRoomObjectSprite} from '../../object/visualization/IRoomObjectSprite';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {AnimatedFurnitureVisualization} from './AnimatedFurnitureVisualization';

export class FurnitureBadgeDisplayVisualization extends AnimatedFurnitureVisualization
{
    private static readonly BADGE_SPRITE_TAG: string = 'BADGE';

    private _badgeAssetName: string = '';
    private _badgeAssetName32: string = '';
    private _visibleInState: number = -1;

    protected override updateModel(scale: number): boolean
    {
        let result = super.updateModel(scale);
        const model = this.object?.getModel();

        if(model !== null && model !== undefined)
        {
            const status = model.getNumber('furniture_badge_image_status');

            if(!isNaN(status))
            {
                const ready = status !== 0;

                if(ready && this._badgeAssetName === '')
                {
                    this._badgeAssetName = model.getString('furniture_badge_asset_name') || '';

                    if(this._badgeAssetName32 === '')
                    {
                        this._badgeAssetName32 = this._badgeAssetName + '_32';
                    }

                    if(model.hasNumber('furniture_badge_visible_in_state'))
                    {
                        this._visibleInState = model.getNumber('furniture_badge_visible_in_state');
                    }

                    result = true;
                }
            }
        }

        return result;
    }

    protected override getSpriteAssetName(scale: number, layerIndex: number): string
    {
        const tag = this.getSpriteTag(scale, this.direction, layerIndex);

        if(tag !== FurnitureBadgeDisplayVisualization.BADGE_SPRITE_TAG ||
			(this._visibleInState !== -1 && this.object!.getState(0) !== this._visibleInState))
        {
            return super.getSpriteAssetName(scale, layerIndex);
        }

        if(scale === 32)
        {
            return this._badgeAssetName32;
        }

        return this._badgeAssetName;
    }

    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        let offset = super.getSpriteXOffset(scale, direction, layerIndex);

        if(this.getSpriteTag(scale, direction, layerIndex) === FurnitureBadgeDisplayVisualization.BADGE_SPRITE_TAG)
        {
            const assetName = scale === 32 ? this._badgeAssetName32 : this._badgeAssetName;
            const asset = this.getAsset(assetName, layerIndex);

            if(asset !== null)
            {
                if(scale === 64)
                {
                    offset += Math.trunc((40 - (asset.width || 0)) / 2);

                    if(direction === 2 && (this.type === 'china_c24_resolution1' || this.type === 'china_c24_resolution2'))
                    {
                        offset -= 40;
                    }
                }
                else
                {
                    offset += Math.trunc((20 - (asset.width || 0)) / 2);
                }
            }
        }

        return offset;
    }

    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        let offset = super.getSpriteYOffset(scale, direction, layerIndex);

        if(this.getSpriteTag(scale, direction, layerIndex) === FurnitureBadgeDisplayVisualization.BADGE_SPRITE_TAG)
        {
            const assetName = scale === 32 ? this._badgeAssetName32 : this._badgeAssetName;
            const asset = this.getAsset(assetName, layerIndex);

            if(asset !== null)
            {
                if(scale === 64)
                {
                    offset += Math.trunc((40 - (asset.height || 0)) / 2);
                }
                else
                {
                    offset += Math.trunc((20 - (asset.height || 0)) / 2);
                }
            }
        }

        return offset;
    }

    protected override getLibraryAssetNameForSprite(asset: IGraphicAsset, sprite: IRoomObjectSprite): string
    {
        if(sprite.tag === FurnitureBadgeDisplayVisualization.BADGE_SPRITE_TAG)
        {
            // AS3's crypted tree says ".png" here, but PRODUCTION (2016, unobfuscated) says
            // ".gif", and real badge assets are gifs (confirmed empirically) - the crypted
            // decompiler corrupted this literal (same bug in BadgeImageWidget,
            // ConcurrentUsersInfoElementHandler, RewardBadgeElementHandler).
            return '%image.library.url%album1584/' + sprite.assetName.replace('badge_', '') + '.gif';
        }

        return super.getLibraryAssetNameForSprite(asset, sprite);
    }
}
