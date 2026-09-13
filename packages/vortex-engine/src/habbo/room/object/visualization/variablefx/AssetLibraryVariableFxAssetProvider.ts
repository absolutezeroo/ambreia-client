import {Logger} from '@core/utils/Logger';
import {AssetBitmap} from '@core/assets/AssetBitmap';
import {XmlAsset} from '@core/assets/XmlAsset';
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IVariableFxAssetProvider} from './IVariableFxAssetProvider';

const log = Logger.getLogger('habbo.room.object.visualization.variablefx.AssetLibraryVariableFxAssetProvider');

/**
 * The live provider: everything comes out of the component's asset library, by the exact name the
 * renderer asks for.
 *
 * Those names are the `*Com.as`/`*Lib.as` field names — the 121 `variablefx_*` images plus
 * `variablefx_renderer_mapping` and `variablefx_icon_metadata`, all declared in
 * `HabboRoomObjectVisualizationLib`. A miss here is silent by design (AS3 returns null and the
 * renderer draws nothing), so it is logged: a blank effect and an absent asset look identical on
 * screen, and the name is the only thing that tells them apart.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/AssetLibraryVariableFxAssetProvider.as
 */
export class AssetLibraryVariableFxAssetProvider implements IVariableFxAssetProvider
{
    // AS3: .../visualization/variablefx/AssetLibraryVariableFxAssetProvider.as::_assets
    private _assets: IAssetLibrary;

    // AS3: .../visualization/variablefx/AssetLibraryVariableFxAssetProvider.as::AssetLibraryVariableFxAssetProvider()
    constructor(assets: IAssetLibrary)
    {
        this._assets = assets;
    }

    /**
     * AS3 casts `asset as BitmapDataAsset` and reads `.content as BitmapData`. Here the library
     * stores a seeded `ImageBitmap` for some assets and a `Texture` for others, so the cast is
     * `AssetBitmap.resolveSync()`, which returns the bitmap when it can be had without a copy.
     * Null from it means the caller must not draw, exactly as a null BitmapData did.
     */
    // AS3: .../visualization/variablefx/AssetLibraryVariableFxAssetProvider.as::getBitmapData()
    getBitmapData(name: string): ImageBitmap | null
    {
        const asset = this._assets.getAssetByName(name);

        if(asset === null)
        {
            log.warn(`No VariableFx bitmap named "${name}" in the asset library`);

            return null;
        }

        const bitmap = AssetBitmap.resolveSync(asset.content);

        if(bitmap === null)
        {
            log.warn(`VariableFx asset "${name}" holds no bitmap that can be drawn`);
        }

        return bitmap;
    }

    // AS3: .../visualization/variablefx/AssetLibraryVariableFxAssetProvider.as::getXml()
    getXml(name: string): Document | null
    {
        const asset = this._assets.getAssetByName(name);

        if(!(asset instanceof XmlAsset))
        {
            log.warn(`No VariableFx XML named "${name}" in the asset library`);

            return null;
        }

        return asset.content;
    }
}
