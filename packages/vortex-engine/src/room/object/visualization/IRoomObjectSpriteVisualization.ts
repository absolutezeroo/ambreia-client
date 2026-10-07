/**
 * IRoomObjectSpriteVisualization Interface
 *
 * Based on AS3: com.sulake.room.object.visualization.IRoomObjectSpriteVisualization
 *
 * Interface for sprite-based room object visualizations.
 * The canvas (RoomRenderingCanvas) reads sprite data via getSprite(i)
 * and owns the actual display objects (ExtendedSprites).
 */
import type {IRoomObjectVisualization} from './IRoomObjectVisualization';
import type {IRoomObjectSprite} from './IRoomObjectSprite';
import type {IGraphicAssetCollection} from '@ambreia/common/graphics/IGraphicAssetCollection';
import type {RoomObjectSpriteData} from '@ambreia/common/graphics/RoomObjectSpriteData';

export interface IRoomObjectSpriteVisualization extends IRoomObjectVisualization
{
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSpriteVisualization.as::get spriteCount()
    spriteCount: number;
    assetCollection: IGraphicAssetCollection | null;

    // AS3 declares this on the parent IRoomObjectGraphicVisualization, which this port did not
    // add as a separate interface (RoomManager sets it on every visualization it creates, right
    // after assetCollection, regardless of subtype).
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectGraphicVisualization.as::setExternalBaseUrls()
    setExternalBaseUrls(baseUrl: string, secureBaseUrl: string, batchesEnabled: boolean): void;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSpriteVisualization.as::getSprite()
    getSprite(index: number): IRoomObjectSprite | null;

    /**
     * The object as the camera's payload describes it, which is not what it draws.
     *
     * AS3 declares a bare `Array` and fills it with `RoomObjectSpriteData` — see
     * `AvatarVisualization.getSpriteList()`, which builds one record per figure layer, and
     * `SpriteDataCollector.getFurniData()`, which adds the object's screen position to the records
     * in place. Typing it as the live sprites instead is what made the avatar and the mannequin
     * unnameable in a photo: their body parts carry no `libraryAssetName`, and the names the server
     * needs (`h_std_bd_1_2_0`) exist only on these records.
     */
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSpriteVisualization.as::getSpriteList()
    getSpriteList(): RoomObjectSpriteData[] | null;

    getUpdateID(): number;

    getInstanceId(): number;
}
