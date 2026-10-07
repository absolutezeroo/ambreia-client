/**
 * FurnitureRoomBillboardVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureRoomBillboardVisualization
 *
 * Room billboard - extends branding with branding URL click and offset adjustments.
 */
import {FurnitureRoomBrandingVisualization} from './FurnitureRoomBrandingVisualization';

export class FurnitureRoomBillboardVisualization extends FurnitureRoomBrandingVisualization
{
    protected override getAdClickUrl(model: { getString(key: string): string | null }): string | null
    {
        return model.getString('furniture_branding_url');
    }

    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        return super.getSpriteXOffset(scale, direction, layerIndex) + this._brandingOffsetX;
    }

    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        return super.getSpriteYOffset(scale, direction, layerIndex) + this._brandingOffsetY;
    }

    protected override getSpriteZOffset(scale: number, direction: number, layerIndex: number): number
    {
        return super.getSpriteZOffset(scale, direction, layerIndex) + this._brandingOffsetZ * -1;
    }
}
