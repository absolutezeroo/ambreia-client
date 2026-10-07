/**
 * FurnitureYoutubeVisualization
 *
 * @see com.sulake.habbo.room.object.visualization.furniture.FurnitureYoutubeVisualization
 *
 * YouTube video furniture: the cover thumbnail comes straight from the room object's own model
 * (a `THUMBNAIL_URL` entry in its `furniture_data` string map, prefixed with `session_url_prefix`)
 * rather than from `furniture_data` JSON or the ExtraDataManager - so this extends
 * `FurnitureDynamicThumbnailVisualization` directly, the same base `FurnitureExternalImageVisualization`
 * extends, not `FurnitureExternalImageVisualization` itself (AS3: `_SafeCls_2105 extends _SafeCls_1874`,
 * i.e. `FurnitureYoutubeVisualization extends FurnitureDynamicThumbnailVisualization`).
 */
import {RoomObjectVariableEnum} from '../../scene/object/RoomObjectVariableEnum';
import {FurnitureDynamicThumbnailVisualization} from './FurnitureDynamicThumbnailVisualization';

export class FurnitureYoutubeVisualization extends FurnitureDynamicThumbnailVisualization
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_2105.as::THUMBNAIL_URL_KEY
    protected static readonly THUMBNAIL_URL_KEY: string = 'THUMBNAIL_URL';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/visualization/furniture/_SafeCls_2105.as::getThumbnailURL()
    protected override getThumbnailURL(): string | null
    {
        const roomObject = this.object;

        if(roomObject === null)
        {
            return null;
        }

        const model = roomObject.getModel();

        if(!model.hasString(RoomObjectVariableEnum.SESSION_URL_PREFIX))
        {
            return null;
        }

        const prefix = model.getString(RoomObjectVariableEnum.SESSION_URL_PREFIX);
        const dataMap = model.getStringToStringMap(RoomObjectVariableEnum.FURNITURE_DATA);

        return prefix + dataMap.get(FurnitureYoutubeVisualization.THUMBNAIL_URL_KEY);
    }
}
