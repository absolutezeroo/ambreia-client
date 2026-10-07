/**
 * RoomObjectVisualizationFactory
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomObjectVisualizationFactory
 *
 * Factory for creating room object visualizations and caching visualization data.
 * Separated from RoomObjectFactory which handles logic/manager creation only.
 *
 * @see source_as_win63/habbo/room/object/RoomObjectVisualizationFactory.as
 */
import type {IRoomObjectVisualizationFactory} from '@room/object/IRoomObjectVisualizationFactory';
import type {IRoomObjectVisualization} from '@room/object/visualization/IRoomObjectVisualization';
import type {IRoomObjectVisualizationData} from '@room/object/visualization/IRoomObjectVisualizationData';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IGraphicAssetCollection} from '@ambreia/common/graphics/IGraphicAssetCollection';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import {GraphicAssetCollection} from '@ambreia/common/graphics/GraphicAssetCollection';
import type {RoomObjectVisualizationRegistry} from '@room/object/RoomObjectVisualizationRegistry';

export class RoomObjectVisualizationFactory implements IRoomObjectVisualizationFactory
{
    private readonly _visualizations: RoomObjectVisualizationRegistry;

    constructor(visualizations: RoomObjectVisualizationRegistry)
    {
        this._visualizations = visualizations;
    }

    private _visualizationDataCache: Map<string, IRoomObjectVisualizationData> = new Map();
    private _disposed: boolean = false;

    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::assets
    private _assets: IAssetLibrary | null = null;

    /**
	 * Asset library reference for pet visualization data injection.
	 *
	 * AS3: sources/win63_version/habbo/room/object/RoomObjectVisualizationFactory.as::assets
	 * (a Component property there; this port's factory is a plain class, so it is injected the
	 * same way avatarRenderManager already is - see RoomEngine's ComponentDependency wiring).
	 */
    set assets(value: IAssetLibrary | null)
    {
        this._assets = value;

        for(const data of this._visualizationDataCache.values())
        {
            if('commonAssets' in data)
            {
                (data as {commonAssets: IAssetLibrary | null}).commonAssets = value;
            }
        }
    }

    /**
	 * Set the avatar render manager reference for avatar visualization data injection.
	 *
	 * @see AS3 RoomObjectVisualizationFactory._habboAvatar
	 */
    // DEVIATION: AS3's factory extends the Component base (_SafeCls_50) and overrides
    //   `dependencies` to declare its IIDAvatarRenderManager need, resolved by the DI container
    //   which then invokes the callback that assigns `_habboAvatar`. This port's factory is a plain
    //   class, not a DI Component (see the class-level @see above), so there is no `dependencies`
    //   getter to override. The same avatar-render-manager reference still reaches it — RoomEngine
    //   resolves its own IIDAvatarRenderManager dependency and pushes it in here directly
    //   (RoomEngine.ts, `this._visualizationFactory.avatarRenderManager = avatarRenderer`).
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::get dependencies()
    set avatarRenderManager(value: IAvatarRenderManager | null)
    {
        this._avatarRenderManager = value;

        for(const data of this._visualizationDataCache.values())
        {
            if('avatarRenderManager' in data)
            {
                (data as {avatarRenderManager: IAvatarRenderManager | null}).avatarRenderManager = value;
            }
        }
    }

    /**
	 * @see sources/win63_version/habbo/room/object/RoomObjectVisualizationFactory.as::createGraphicAssetCollection()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::createGraphicAssetCollection()
    createGraphicAssetCollection(): IGraphicAssetCollection
    {
        return new GraphicAssetCollection();
    }

    /**
	 * Create a visualization instance for the given type.
	 *
	 * @see AS3 RoomObjectVisualizationFactory.createRoomObjectVisualization()
	 */
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::createRoomObjectVisualization()
    createRoomObjectVisualization(type: string): IRoomObjectVisualization | null
    {
        return this.createVisualizationInstance(type);
    }

    // DEVIATION: AS3 switches over the types here; the registry passed in holds them since J4.
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::createRoomObjectVisualization()
    private createVisualizationInstance(type: string): IRoomObjectVisualization | null
    {
        return this._visualizations.create(type);
    }

    /**
	 * Get or create cached visualization data for a content type.
	 * Data is created once per content id and then cached.
	 *
	 * @see AS3 RoomObjectVisualizationFactory.getRoomObjectVisualizationData()
	 */
    // DEVIATION: AS3 also builds the snow-war objects' shared data class (`_SafeCls_2245`); the RPG
    //   fork removed Snow War.
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::getRoomObjectVisualizationData()
    getRoomObjectVisualizationData(id: string, type: string, data: unknown): IRoomObjectVisualizationData | null
    {
        // Check cache first
        const cached = this._visualizationDataCache.get(id);

        if(cached)
        {
            return cached;
        }

        // The data class is the registry's (registerData(), per module); see registerAllRoomObjects.
        const vizData = this._visualizations.createData(type);

        if(vizData === null) return null;

        if(!vizData.initialize(data))
        {
            vizData.dispose();

            return null;
        }

        // AS3 sets these per class (pet: `commonAssets`; avatar and mannequin: the avatar
        // renderer). Done by what the data has, so this factory needs no avatar class.
        if('commonAssets' in vizData) (vizData as {commonAssets: IAssetLibrary | null}).commonAssets = this._assets;
        if('avatarRenderManager' in vizData) (vizData as {avatarRenderManager: IAvatarRenderManager | null}).avatarRenderManager = this._avatarRenderManager;

        this._visualizationDataCache.set(id, vizData);

        return vizData;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        for(const vizData of this._visualizationDataCache.values())
        {
            vizData.dispose();
        }

        this._visualizationDataCache.clear();

        this._disposed = true;
    }
}
