import type {IVariableFxAssetProvider} from './variablefx/IVariableFxAssetProvider';
import type {VariableFxRendererRegistry} from './variablefx/VariableFxRendererRegistry';
import type {VariableFxConfigStore} from './VariableFxConfigStore';

/**
 * The three things a visualization needs to build a Variable FX effect, per room.
 *
 * The CONFIGS are per-room because a config id means nothing outside the room that sent it. The
 * asset provider and the registry are not — they are the factory's, shared by every room — but
 * they are reachable through here so a visualization has exactly one place to look.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/IVariableFxVisualizationRoomData.as
 */
export interface IVariableFxVisualizationRoomData
{
    // AS3: .../visualization/IVariableFxVisualizationRoomData.as::get variableFxVisualizationManager()
    readonly variableFxVisualizationManager: VariableFxConfigStore | null;

    // AS3: .../visualization/IVariableFxVisualizationRoomData.as::get variableFxAssetProvider()
    readonly variableFxAssetProvider: IVariableFxAssetProvider | null;

    // AS3: .../visualization/IVariableFxVisualizationRoomData.as::get variableFxRendererRegistry()
    readonly variableFxRendererRegistry: VariableFxRendererRegistry | null;

    // AS3: .../visualization/IVariableFxVisualizationRoomData.as::dispose()
    dispose(): void;
}
