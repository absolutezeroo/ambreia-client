/**
 * FurnitureGiftWrappedFireworksVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureGiftWrappedFireworksVisualization
 *
 * Gift wrapped fireworks - shows gift wrapping when state is 0, fireworks otherwise.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import {FurnitureFireworksVisualization} from './FurnitureFireworksVisualization';

export class FurnitureGiftWrappedFireworksVisualization extends FurnitureFireworksVisualization
{
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGiftWrappedFireworksVisualization.as::PRESENT_DEFAULT_STATE
    private static readonly PRESENT_DEFAULT_STATE: number = 0;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGiftWrappedFireworksVisualization.as::MAX_PACKET_TYPE_VALUE
    private static readonly MAX_PACKET_TYPE_VALUE: number = 9;
    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGiftWrappedFireworksVisualization.as::MAX_RIBBON_TYPE_VALUE
    private static readonly MAX_RIBBON_TYPE_VALUE: number = 11;

    private _packetType: number = 0;
    private _ribbonType: number = 0;
    private _state: number = 0;

    override update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void
    {
        this.updateTypes();
        super.update(geometry, time, update, skipUpdate);
    }

    protected override getFrameNumber(scale: number, layerIndex: number): number
    {
        if(this._state === FurnitureGiftWrappedFireworksVisualization.PRESENT_DEFAULT_STATE)
        {
            if(layerIndex <= 1)
            {
                return this._packetType;
            }

            if(layerIndex === 2)
            {
                return this._ribbonType;
            }
        }

        return super.getFrameNumber(scale, layerIndex);
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

        const frame = this.getFrameNumber(scale, layerIndex);

        return this.type + '_' + size + '_' + layerName + '_' + this.direction + '_' + frame;
    }

    protected override setAnimation(animationId: number): void
    {
        this._state = animationId;
        super.setAnimation(animationId);
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGiftWrappedFireworksVisualization.as::updateTypes()
    private updateTypes(): void
    {
        const model = this.object?.getModel();

        if(model !== null && model !== undefined)
        {
            const extras = model.getString('furniture_extras') || '0';
            const value = parseInt(extras) || 0;
            const packetType = Math.floor(value / 1000);
            const ribbonType = value % 1000;

            this._packetType = packetType > FurnitureGiftWrappedFireworksVisualization.MAX_PACKET_TYPE_VALUE ? 0 : packetType;
            this._ribbonType = ribbonType > FurnitureGiftWrappedFireworksVisualization.MAX_RIBBON_TYPE_VALUE ? 0 : ribbonType;
        }
    }
}
