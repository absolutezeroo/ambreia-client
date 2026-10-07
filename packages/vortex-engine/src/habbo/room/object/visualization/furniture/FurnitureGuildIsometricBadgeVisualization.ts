/**
 * FurnitureGuildIsometricBadgeVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.class_3390
 *
 * Guild-customized furniture with two custom colors and badge thumbnail.
 */
import type {IRoomObjectSprite} from '@room/object/visualization/IRoomObjectSprite';
import type {IGraphicAsset} from '@ambreia/common/graphics/IGraphicAsset';
import {FurnitureGuildCustomizedVisualization} from './FurnitureGuildCustomizedVisualization';

export class FurnitureGuildIsometricBadgeVisualization extends FurnitureGuildCustomizedVisualization
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGuildIsometricBadgeVisualization.as::PRIMARY_COLOUR_SPRITE_TAG
    private static readonly PRIMARY_COLOUR_SPRITE_TAG: string = 'COLOR1';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGuildIsometricBadgeVisualization.as::SECONDARY_COLOUR_SPRITE_TAG
    private static readonly SECONDARY_COLOUR_SPRITE_TAG: string = 'COLOR2';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGuildIsometricBadgeVisualization.as::DEFAULT_COLOR_1
    private static readonly DEFAULT_COLOR_1: number = 15658734;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGuildIsometricBadgeVisualization.as::DEFAULT_COLOR_2
    private static readonly DEFAULT_COLOR_2: number = 4934475;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGuildIsometricBadgeVisualization.as::_color1
    private _color1: number = FurnitureGuildIsometricBadgeVisualization.DEFAULT_COLOR_1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGuildIsometricBadgeVisualization.as::_color2
    private _color2: number = FurnitureGuildIsometricBadgeVisualization.DEFAULT_COLOR_2;

    protected override updateModel(scale: number): boolean
    {
        const result = super.updateModel(scale);
        const model = this.object?.getModel();

        if(model === null || model === undefined)
        {
            return result;
        }

        if(!this.hasThumbnailImage)
        {
            const assetName = model.getString('furniture_guild_customized_asset_name');

            if(assetName !== null && this.assetCollection !== null)
            {
                const normalAsset = this.assetCollection.getAsset(assetName);
                const smallAsset = this.assetCollection.getAsset(assetName + '_32');

                this.setThumbnailImages(
                    normalAsset?.texture || null,
                    smallAsset?.texture || null
                );
            }
        }

        const color1 = model.getNumber('furniture_guild_customized_color_1');
        this._color1 = isNaN(color1) ? FurnitureGuildIsometricBadgeVisualization.DEFAULT_COLOR_1 : Math.trunc(color1);

        const color2 = model.getNumber('furniture_guild_customized_color_2');
        this._color2 = isNaN(color2) ? FurnitureGuildIsometricBadgeVisualization.DEFAULT_COLOR_2 : Math.trunc(color2);

        return result;
    }

    protected override getSpriteColor(scale: number, layerIndex: number, colorId: number): number
    {
        const tag = this.getSpriteTag(scale, this.direction, layerIndex);

        switch(tag)
        {
            case FurnitureGuildIsometricBadgeVisualization.PRIMARY_COLOUR_SPRITE_TAG:
                return this._color1;
            case FurnitureGuildIsometricBadgeVisualization.SECONDARY_COLOUR_SPRITE_TAG:
                return this._color2;
            default:
                return super.getSpriteColor(scale, layerIndex, colorId);
        }
    }

    protected override getLibraryAssetNameForSprite(asset: IGraphicAsset, sprite: IRoomObjectSprite): string
    {
        if(sprite.tag === FurnitureGuildCustomizedVisualization.THUMBNAIL_SPRITE_TAG)
        {
            const model = this.object?.getModel();

            if(model !== null && model !== undefined)
            {
                const badgeName = model.getString('furniture_guild_customized_asset_name');

                if(badgeName !== null)
                {
                    return '%group.badge.url%' + badgeName.replace('badge_', '');
                }
            }
        }

        return super.getLibraryAssetNameForSprite(asset, sprite);
    }
}
