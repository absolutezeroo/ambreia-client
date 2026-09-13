import type {IVariableFxAssetProvider} from './variablefx/IVariableFxAssetProvider';
import type {VariableFxRendererRegistry} from './variablefx/VariableFxRendererRegistry';
import {VariableFxConfigStore} from './VariableFxConfigStore';
import type {IVariableFxVisualizationRoomData} from './IVariableFxVisualizationRoomData';

/**
 * One room's Variable FX services, for one kind of object.
 *
 * DEVIATION: AS3 has two classes here — `AvatarVisualizationRoomData` and
 *   `FurnitureVisualizationRoomData` — whose bodies are identical line for line; they differ only
 *   in name and package, and nothing ever distinguishes them by type. One class serves both.
 *
 *   What must stay separate is the INSTANCES, not the classes: an avatar config and a furniture
 *   config can carry the same id, so the factory keeps two maps and looks up whichever the
 *   config's `isUserFx` flag names. That is where the distinction actually lives.
 * AS3: sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/avatar/AvatarVisualizationRoomData.as
 */
export class VariableFxVisualizationRoomData implements IVariableFxVisualizationRoomData
{
    // AS3: .../visualization/avatar/AvatarVisualizationRoomData.as::_assetProvider (name derived)
    private _assetProvider: IVariableFxAssetProvider | null;

    // AS3: .../visualization/avatar/AvatarVisualizationRoomData.as::_variableFxRendererRegistry
    private _rendererRegistry: VariableFxRendererRegistry | null;

    // AS3: .../visualization/avatar/AvatarVisualizationRoomData.as::_configs (name derived)
    private _configs: VariableFxConfigStore | null = new VariableFxConfigStore();

    // AS3: .../visualization/avatar/AvatarVisualizationRoomData.as::AvatarVisualizationRoomData()
    constructor(assetProvider: IVariableFxAssetProvider | null, rendererRegistry: VariableFxRendererRegistry | null)
    {
        this._assetProvider = assetProvider;
        this._rendererRegistry = rendererRegistry;
    }

    // AS3: .../visualization/avatar/AvatarVisualizationRoomData.as::get variableFxVisualizationManager()
    get variableFxVisualizationManager(): VariableFxConfigStore | null
    {
        return this._configs;
    }

    // AS3: .../visualization/avatar/AvatarVisualizationRoomData.as::get variableFxAssetProvider()
    get variableFxAssetProvider(): IVariableFxAssetProvider | null
    {
        return this._assetProvider;
    }

    // AS3: .../visualization/avatar/AvatarVisualizationRoomData.as::get variableFxRendererRegistry()
    get variableFxRendererRegistry(): VariableFxRendererRegistry | null
    {
        return this._rendererRegistry;
    }

    // AS3: .../visualization/avatar/AvatarVisualizationRoomData.as::dispose()
    dispose(): void
    {
        if(this._configs !== null)
        {
            this._configs.dispose();
            this._configs = null;
        }

        this._assetProvider = null;
        this._rendererRegistry = null;
    }
}
