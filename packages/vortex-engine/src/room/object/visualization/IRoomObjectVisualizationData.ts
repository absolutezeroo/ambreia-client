/**
 * IRoomObjectVisualizationData Interface
 *
 * Based on AS3: com.sulake.room.object.visualization.IRoomObjectVisualizationData
 *
 * Interface for visualization data that can initialize visualizations.
 */
import type {IDisposable} from '@ambreia/common/IDisposable';

export interface IRoomObjectVisualizationData extends IDisposable
{
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectVisualizationData.as::initialize()
    initialize(data: unknown): boolean;
}
