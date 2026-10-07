/**
 * TileCursorVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.room.TileCursorVisualization
 *
 * Tile cursor with height-based Y offset for layer 1.
 */
import {AnimatedFurnitureVisualization} from '../../../../furniture/visualization/AnimatedFurnitureVisualization';

export class TileCursorVisualization extends AnimatedFurnitureVisualization
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/object/visualization/room/TileCursorVisualization.as::_tileHeight
    private _tileHeight: number = 0;

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/TileCursorVisualization.as::get tileHeight()
    get tileHeight(): number
    {
        return this._tileHeight;
    }

    // AS3: .../src/com/sulake/habbo/room/object/visualization/room/TileCursorVisualization.as::set tileHeight()
    set tileHeight(value: number)
    {
        this._tileHeight = value;
    }

    protected override getSpriteYOffset(scale: number, direction: number, layerIndex: number): number
    {
        if(layerIndex === 1)
        {
            const model = this.object?.getModel();

            if(model !== null && model !== undefined)
            {
                this._tileHeight = model.getNumber('tile_cursor_height') || 0;
            }

            return -this._tileHeight * (scale / 2);
        }

        return super.getSpriteYOffset(scale, direction, layerIndex);
    }
}
