/**
 * FurnitureGiftWrappedVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureGiftWrappedVisualization
 *
 * Gift wrapped furniture with packet type and ribbon type display.
 */
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import {FurnitureVisualization} from './FurnitureVisualization';

export class FurnitureGiftWrappedVisualization extends FurnitureVisualization
{
    private static readonly EXTRAS_MULTIPLIER: number = 1000;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGiftWrappedVisualization.as::_packetType
    private _packetType: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGiftWrappedVisualization.as::_ribbonType
    private _ribbonType: number = 0;

    override update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void
    {
        this.updateTypes();
        super.update(geometry, time, update, skipUpdate);
    }

    protected override getFrameNumber(_scale: number, layerIndex: number): number
    {
        if(layerIndex <= 1)
        {
            return this._packetType;
        }

        return this._ribbonType;
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

    // AS3: .../src/com/sulake/habbo/room/object/visualization/furniture/FurnitureGiftWrappedVisualization.as::updateTypes()
    private updateTypes(): void
    {
        const roomObject = this.object;

        if(roomObject !== null)
        {
            const model = roomObject.getModel();

            if(model !== null)
            {
                const extras = model.getString('furniture_extras') || '0';
                const value = parseInt(extras) || 0;

                this._packetType = Math.floor(value / FurnitureGiftWrappedVisualization.EXTRAS_MULTIPLIER);
                this._ribbonType = value % FurnitureGiftWrappedVisualization.EXTRAS_MULTIPLIER;
            }
        }
    }
}
