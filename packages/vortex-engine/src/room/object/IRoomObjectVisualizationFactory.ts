/**
 * IRoomObjectVisualizationFactory Interface
 *
 * Based on AS3: com.sulake.room.object.IRoomObjectVisualizationFactory
 *
 * Factory interface for creating room object visualizations and visualization data.
 * Separated from IRoomObjectFactory which handles logic/manager creation only.
 *
 * @see source_as_win63/room/object/IRoomObjectVisualizationFactory.as
 */
import type {IRoomObjectVisualization} from './visualization/IRoomObjectVisualization';
import type {IRoomObjectVisualizationData} from './visualization/IRoomObjectVisualizationData';
import type {IGraphicAssetCollection} from './visualization/utils/IGraphicAssetCollection';

export interface IRoomObjectVisualizationFactory
{
    /**
	 * Create a visualization instance for the given type.
	 *
	 * @param type The visualization type string (e.g. 'room', 'furniture_static', 'user')
	 * @returns A new visualization instance, or null if the type is unknown
	 */
    // AS3: .../src/com/sulake/room/object/IRoomObjectVisualizationFactory.as::createRoomObjectVisualization()
    createRoomObjectVisualization(type: string): IRoomObjectVisualization | null;

    /**
	 * Create a graphic asset collection.
	 *
	 * @see sources/win63_version/room/object/IRoomObjectVisualizationFactory.as
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/IRoomObjectVisualizationFactory.as::createGraphicAssetCollection()
    createGraphicAssetCollection(): IGraphicAssetCollection;

    /**
	 * Get or create cached visualization data for a content type.
	 *
	 * @param id The content identifier (className) used as cache key
	 * @param type The visualization type string
	 * @param data The raw visualization data (JSON from .nitro bundle)
	 * @returns Cached or newly created visualization data, or null on failure
	 */
    // AS3: .../src/com/sulake/room/object/IRoomObjectVisualizationFactory.as::getRoomObjectVisualizationData()
    getRoomObjectVisualizationData(id: string, type: string, data: unknown): IRoomObjectVisualizationData | null;

    dispose(): void;
}
