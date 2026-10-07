/**
 * IRoomObjectVisualization Interface
 *
 * Based on AS3: com.sulake.room.object.visualization.IRoomObjectVisualization
 *
 * Base interface for room object visualizations.
 */
import type {IRoomObject} from '../IRoomObject';
import type {IRoomGeometry} from '../../utils/IRoomGeometry';
import type {IRoomObjectVisualizationData} from './IRoomObjectVisualizationData';

export interface IRoomObjectVisualization
{
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::get object()
    object: IRoomObject | null;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::get boundingRectangle()
    readonly boundingRectangle: { x: number; y: number; width: number; height: number };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::get image()
    readonly image: HTMLCanvasElement | null;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::dispose()
    dispose(): void;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::initialize()
    initialize(data: IRoomObjectVisualizationData): boolean;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::update()
    update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::getImage()
    // TS deviation: returns an HTMLCanvasElement instead of AS3's BitmapData - both are
    // synchronous, in-memory rasterizations (PixiJS's renderer.extract.canvas() is
    // synchronous, matching BitmapData's timing); converting to ImageBitmap is the
    // caller's job (RoomEngine), same async boundary already established by ImageResult.ts.
    getImage(backgroundColor: number, originalId: number): HTMLCanvasElement | null;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::getInstanceId()
    getInstanceId(): number;

    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectVisualization.as::getUpdateID()
    getUpdateID(): number;
}
