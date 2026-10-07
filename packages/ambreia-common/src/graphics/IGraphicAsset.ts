/**
 * IGraphicAsset
 *
 * @see com.sulake.room.object.visualization.utils.IGraphicAsset
 *
 * Interface for graphic asset data used in room object visualizations.
 */
import type {Texture} from 'pixi.js';

export interface IGraphicAsset
{
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get flipH()
    readonly flipH: boolean;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get flipV()
    readonly flipV: boolean;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get width()
    readonly width: number;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get height()
    readonly height: number;
    readonly texture: Texture | null;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get assetName()
    readonly assetName: string;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get libraryAssetName()
    readonly libraryAssetName: string;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get offsetX()
    readonly offsetX: number;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get offsetY()
    readonly offsetY: number;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get originalOffsetX()
    readonly originalOffsetX: number;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get originalOffsetY()
    readonly originalOffsetY: number;
    // AS3: sources/win63_version/room/object/visualization/utils/IGraphicAsset.as::get usesPalette()
    readonly usesPalette: boolean;

    recycle(): void;
}
