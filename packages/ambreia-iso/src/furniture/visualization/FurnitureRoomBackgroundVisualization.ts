/**
 * FurnitureRoomBackgroundVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureRoomBackgroundVisualization
 *
 * Background/wallpaper furniture with directional offsets per size.
 */
import {DirectionalOffsetData} from '../../scene/object/visualization/data/DirectionalOffsetData';
import {FurnitureRoomBrandingVisualization} from './FurnitureRoomBrandingVisualization';

export class FurnitureRoomBackgroundVisualization extends FurnitureRoomBrandingVisualization
{
    private _directionalOffsets: Map<number, DirectionalOffsetData> | null = null;

    override dispose(): void
    {
        super.dispose();
        this._directionalOffsets = null;
    }

    protected override getAdClickUrl(_model: { getString(key: string): string | null }): string | null
    {
        return null;
    }

    protected override imageReady(url: string): void
    {
        super.imageReady(url);

        if(this.assetCollection !== null)
        {
            const asset = this.assetCollection.getAsset(url);

            if(asset !== null && asset.texture !== null)
            {
                this._directionalOffsets = new Map();

                let size = 64;
                let width = asset.width || 0;
                let height = asset.height || 0;

                this.addDirectionalOffsets(size, height, width);

                size = 32;
                width = Math.trunc(width / 2);
                height = Math.trunc(height / 2);

                this.addDirectionalOffsets(size, height, width);
            }
        }
    }

    protected override getSpriteXOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(this._directionalOffsets !== null)
        {
            const size = this.getSize(scale);
            const offsets = this._directionalOffsets.get(size);

            if(offsets !== undefined)
            {
                return offsets.getOffsetX(direction, 0) + this.getScaledOffset(this._brandingOffsetX, scale);
            }
        }

        return super.getSpriteXOffset(scale, direction, layerIndex) + this.getScaledOffset(this._brandingOffsetX, scale);
    }

    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(this._directionalOffsets !== null)
        {
            const size = this.getSize(scale);
            const offsets = this._directionalOffsets.get(size);

            if(offsets !== undefined)
            {
                return offsets.getOffsetY(direction, 0) + this.getScaledOffset(this._brandingOffsetY, scale);
            }
        }

        return super.getSpriteYOffset(scale, direction, layerIndex) + this.getScaledOffset(this._brandingOffsetY, scale);
    }

    protected override getSpriteZOffset(scale: number, direction: number, layerIndex: number): number
    {
        return super.getSpriteZOffset(scale, direction, layerIndex) + this._brandingOffsetZ * -1;
    }

    protected override getSpriteMouseCapture(_scale: number, _direction: number, _layerIndex: number): boolean
    {
        return false;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBackgroundVisualization.as::addDirectionalOffsets()
    private addDirectionalOffsets(size: number, height: number, width: number): void
    {
        const offsets = new DirectionalOffsetData();

        offsets.setOffset(1, 0, -height);
        offsets.setOffset(3, 0, 0);
        offsets.setOffset(5, -width, 0);
        offsets.setOffset(7, -width, -height);
        offsets.setOffset(4, Math.trunc(-width / 2), Math.trunc(-height / 2));

        this._directionalOffsets!.set(size, offsets);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureRoomBackgroundVisualization.as::getScaledOffset()
    private getScaledOffset(offset: number, scale: number): number
    {
        return offset * scale / 64;
    }
}
