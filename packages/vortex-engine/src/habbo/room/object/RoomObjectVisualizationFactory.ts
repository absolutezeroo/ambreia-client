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
import type {IAssetLibrary} from '@core/assets/IAssetLibrary';
import type {IGraphicAssetCollection} from '@room/object/visualization/utils/IGraphicAssetCollection';
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import {GraphicAssetCollection} from '@room/object/visualization/utils/GraphicAssetCollection';
import {RoomObjectVisualizationEnum} from './RoomObjectVisualizationEnum';

// Room Visualizations
import {RoomVisualization} from './visualization/room/RoomVisualization';
import {TileCursorVisualization} from './visualization/room/TileCursorVisualization';

// Furniture Visualizations
import {FurnitureVisualization} from './visualization/furniture/FurnitureVisualization';
import {AnimatedFurnitureVisualization} from './visualization/furniture/AnimatedFurnitureVisualization';
import {
    FurnitureResettingAnimatedVisualization
} from './visualization/furniture/FurnitureResettingAnimatedVisualization';
import {FurniturePosterVisualization} from './visualization/furniture/FurniturePosterVisualization';
import {FurnitureStickieVisualization} from './visualization/furniture/FurnitureStickieVisualization';
import {FurnitureBottleVisualization} from './visualization/furniture/FurnitureBottleVisualization';
import {FurnitureFurniChestVisualization} from './visualization/furniture/FurnitureFurniChestVisualization';
import {FurnitureCoinsChestVisualization} from './visualization/furniture/FurnitureCoinsChestVisualization';
import {FurnitureHabboWheelVisualization} from './visualization/furniture/FurnitureHabboWheelVisualization';
import {FurnitureValRandomizerVisualization} from './visualization/furniture/FurnitureValRandomizerVisualization';
import {FurnitureQueueTileVisualization} from './visualization/furniture/FurnitureQueueTileVisualization';
import {FurniturePartyBeamerVisualization} from './visualization/furniture/FurniturePartyBeamerVisualization';
import {FurnitureCuboidVisualization} from './visualization/furniture/FurnitureCuboidVisualization';
import {FurnitureGiftWrappedVisualization} from './visualization/furniture/FurnitureGiftWrappedVisualization';
import {VariableFxVisualizationRoomData} from './visualization/VariableFxVisualizationRoomData';
import {VariableFxConfigData} from './visualization/variablefx/VariableFxConfigData';
import {VariableFxCatalog} from './visualization/variablefx/VariableFxCatalog';
import {VariableFxPreviewStyles} from './visualization/variablefx/VariableFxPreviewStyles';
import {VariableFxRendererRegistry} from './visualization/variablefx/VariableFxRendererRegistry';
import {AssetLibraryVariableFxAssetProvider} from './visualization/variablefx/AssetLibraryVariableFxAssetProvider';
import type {IVariableFxAssetProvider} from './visualization/variablefx/IVariableFxAssetProvider';
import type {VariableFxConfigUpdateData} from './variablefx/VariableFxConfigUpdateData';
import {FurnitureCounterClockVisualization} from './visualization/furniture/FurnitureCounterClockVisualization';
import {FurnitureScoreBoardVisualization} from './visualization/furniture/FurnitureScoreBoardVisualization';
import {FurnitureFireworksVisualization} from './visualization/furniture/FurnitureFireworksVisualization';
import {
    FurnitureGiftWrappedFireworksVisualization
} from './visualization/furniture/FurnitureGiftWrappedFireworksVisualization';
import {FurnitureSoundblockVisualization} from './visualization/furniture/FurnitureSoundblockVisualization';
import {FurnitureVoteCounterVisualization} from './visualization/furniture/FurnitureVoteCounterVisualization';
import {FurnitureVoteMajorityVisualization} from './visualization/furniture/FurnitureVoteMajorityVisualization';
import {FurnitureBadgeDisplayVisualization} from './visualization/furniture/FurnitureBadgeDisplayVisualization';
import {FurnitureGuildCustomizedVisualization} from './visualization/furniture/FurnitureGuildCustomizedVisualization';
import {
    FurnitureGuildIsometricBadgeVisualization
} from './visualization/furniture/FurnitureGuildIsometricBadgeVisualization';
import {FurnitureRoomBillboardVisualization} from './visualization/furniture/FurnitureRoomBillboardVisualization';
import {FurnitureRoomBackgroundVisualization} from './visualization/furniture/FurnitureRoomBackgroundVisualization';
import {
    FurnitureBuilderPlaceholderVisualization
} from './visualization/furniture/FurnitureBuilderPlaceholderVisualization';
import {FurnitureExternalImageVisualization} from './visualization/furniture/FurnitureExternalImageVisualization';
import {FurnitureYoutubeVisualization} from './visualization/furniture/FurnitureYoutubeVisualization';
import {FurnitureMannequinVisualization} from './visualization/furniture/FurnitureMannequinVisualization';
import {FurnitureWaterAreaVisualization} from './visualization/furniture/FurnitureWaterAreaVisualization';
import {FurniturePlanetSystemVisualization} from './visualization/furniture/FurniturePlanetSystemVisualization';

// Avatar Visualization
import {AvatarVisualization} from './visualization/avatar/AvatarVisualization';
import {AvatarVisualizationData} from './visualization/avatar/AvatarVisualizationData';
import {AvatarFurnitureVisualizationData} from './visualization/furniture/AvatarFurnitureVisualizationData';

// Visualization Data
import {FurnitureVisualizationData} from './visualization/furniture/FurnitureVisualizationData';
import {AnimatedFurnitureVisualizationData} from './visualization/furniture/AnimatedFurnitureVisualizationData';
import {AnimatedPetVisualization} from './visualization/pet/AnimatedPetVisualization';
import {AnimatedPetVisualizationData} from './visualization/pet/AnimatedPetVisualizationData';
import {GameObjectVisualization} from './visualization/furniture/GameObjectVisualization';
import {SnowballVisualization} from './visualization/game/SnowballVisualization';
import {SnowSplashVisualization} from './visualization/game/SnowSplashVisualization';

export class RoomObjectVisualizationFactory implements IRoomObjectVisualizationFactory
{
    /**
    * Visualization types that use AnimatedFurnitureVisualizationData.
    * All others use FurnitureVisualizationData.
    *
    * @see AS3 RoomObjectVisualizationFactory.getRoomObjectVisualizationData() lines 232-283
    */
    private static readonly ANIMATED_VIZ_DATA_TYPES = new Set([
        'furniture_animated',
        // AS3 lists both chests in this branch (RoomObjectVisualizationFactory.as
        // l.270-272). Missing here, they were handed a plain
        // FurnitureVisualizationData, which cannot parse an animated
        // visualization: initialize() failed, the factory disposed it and
        // returned null, and the visualization then ran with `_data` null —
        // `this._data!.getLayerCount()` threw on every frame that touched a
        // chest, in the room render loop, the purchase preview and the wired
        // inspector alike.
        'furniture_furnichest',
        'furniture_coinschest',
        'furniture_resetting_animated',
        'furniture_poster',
        'furniture_habbowheel',
        'furniture_val_randomizer',
        'furniture_bottle',
        'furniture_planet_system',
        'furniture_queue_tile',
        'furniture_party_beamer',
        'furniture_counter_clock',
        'furniture_water_area',
        'furniture_score_board',
        'furniture_fireworks',
        'furniture_gift_wrapped_fireworks',
        'furniture_guild_customized',
        'furniture_guild_isometric_badge',
        'furniture_vote_counter',
        'furniture_vote_majority',
        'furniture_soundblock',
        'furniture_badge_display',
        'furniture_external_image',
        'furniture_youtube',
        'tile_cursor',
    ]);

    private _visualizationDataCache: Map<string, IRoomObjectVisualizationData> = new Map();
    private _disposed: boolean = false;

    private _avatarRenderManager: IAvatarRenderManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::assets
    private _assets: IAssetLibrary | null = null;

    /**
     * The Variable FX services, per room and per kind.
     *
     * Two maps, not one: an avatar config and a furniture config can carry the SAME id, and the
     * config update's `isUserFx` flag is what says which store a config belongs in.
     */
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::_avatarVisualizationRoomData (name derived)
    private _avatarVariableFxRoomData: Map<string, VariableFxVisualizationRoomData> = new Map();

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::_furnitureVisualizationRoomData (name derived)
    private _furnitureVariableFxRoomData: Map<string, VariableFxVisualizationRoomData> = new Map();

    /**
     * The asset provider and registry every room's data shares.
     *
     * Both are built LAZILY, on the first config update, rather than in the constructor: the
     * registry's `createDefault()` parses the shipped renderer mapping out of the asset library,
     * and the library is injected after construction. AS3 builds them in `initialize()` for the
     * same reason.
     */
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::_variableFxAssetProvider (name derived)
    private _variableFxAssetProvider: IVariableFxAssetProvider | null = null;

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::_variableFxRendererRegistry
    private _variableFxRendererRegistry: VariableFxRendererRegistry | null = null;

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
            if(data instanceof AnimatedPetVisualizationData)
            {
                data.commonAssets = value;
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
            if(data instanceof AvatarVisualizationData || data instanceof AvatarFurnitureVisualizationData)
            {
                data.avatarRenderManager = value;
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
    createRoomObjectVisualization(type: string, roomId: string | null = null): IRoomObjectVisualization | null
    {
        const visualization = this.createVisualizationInstance(type);

        // The room's Variable FX services, handed over at construction. AS3 does the same here,
        // by `is`-testing the instance; `roomId` is optional so the callers that have no room to
        // name — the thumbnail and preview renderers — are unaffected.
        if(roomId !== null && visualization instanceof AvatarVisualization)
        {
            visualization.variableFxRoomData = this.getAvatarVariableFxRoomData(roomId);
        }

        return visualization;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::createRoomObjectVisualization()
    private createVisualizationInstance(type: string): IRoomObjectVisualization | null
    {
        switch(type)
        {
            // Room
            case RoomObjectVisualizationEnum.ROOM:
                return new RoomVisualization();

                // Tile cursor
            case RoomObjectVisualizationEnum.TILE_CURSOR:
                return new TileCursorVisualization();

                // Furniture - static
            case RoomObjectVisualizationEnum.FURNITURE_STATIC:
                return new FurnitureVisualization();

                // Furniture - animated
            case RoomObjectVisualizationEnum.FURNITURE_ANIMATED:
                return new AnimatedFurnitureVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_RESETTING_ANIMATED:
                return new FurnitureResettingAnimatedVisualization();

                // Furniture - specialized
            case RoomObjectVisualizationEnum.FURNITURE_POSTER:
                return new FurniturePosterVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_STICKIE:
                return new FurnitureStickieVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_BOTTLE:
                return new FurnitureBottleVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_FURNI_CHEST:
                return new FurnitureFurniChestVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_COINS_CHEST:
                return new FurnitureCoinsChestVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_HABBOWHEEL:
                return new FurnitureHabboWheelVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_VAL_RANDOMIZER:
                return new FurnitureValRandomizerVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_QUEUE_TILE:
                return new FurnitureQueueTileVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_PARTY_BEAMER:
                return new FurniturePartyBeamerVisualization();

            // The class was ported and the enum entry was there; only this line
            // was missing, so every `furniture_cuboid` fell through to the
            // default and drew as a plain static furni.
            case RoomObjectVisualizationEnum.FURNITURE_CUBOID:
                return new FurnitureCuboidVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_GIFT_WRAPPED:
                return new FurnitureGiftWrappedVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_COUNTER_CLOCK:
                return new FurnitureCounterClockVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_SCORE_BOARD:
                return new FurnitureScoreBoardVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_FIREWORKS:
                return new FurnitureFireworksVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_GIFT_WRAPPED_FIREWORKS:
                return new FurnitureGiftWrappedFireworksVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_SOUNDBLOCK:
                return new FurnitureSoundblockVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_VOTE_COUNTER:
                return new FurnitureVoteCounterVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_VOTE_MAJORITY:
                return new FurnitureVoteMajorityVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_BADGE_DISPLAY:
                return new FurnitureBadgeDisplayVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_GUILD_CUSTOMIZED:
                return new FurnitureGuildCustomizedVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_GUILD_ISOMETRIC_BADGE:
                return new FurnitureGuildIsometricBadgeVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_BB:
                return new FurnitureRoomBillboardVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_BG:
                return new FurnitureRoomBackgroundVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_BUILDER_PLACEHOLDER:
                return new FurnitureBuilderPlaceholderVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_EXTERNAL_IMAGE:
                return new FurnitureExternalImageVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_YOUTUBE:
                return new FurnitureYoutubeVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_MANNEQUIN:
                return new FurnitureMannequinVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_WATER_AREA:
                return new FurnitureWaterAreaVisualization();

            case RoomObjectVisualizationEnum.FURNITURE_PLANET_SYSTEM:
                return new FurniturePlanetSystemVisualization();

                // Avatar types
            case RoomObjectVisualizationEnum.USER:
            case RoomObjectVisualizationEnum.BOT:
            case RoomObjectVisualizationEnum.RENTABLE_BOT:
                return new AvatarVisualization();

                // Pets
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as
                // `case "pet_animated": _loc3_ = AnimatedPetVisualization; break;` - this case was
                // simply missing from the port, so every pet resolved to null here, which made
                // RoomEngine.getGenericRoomObjectImage() bail on its `visualization === null` guard
                // and return id = -1 for every pet image request.
            case RoomObjectVisualizationEnum.PET_ANIMATED:
                return new AnimatedPetVisualization();

                // Snow war
            case RoomObjectVisualizationEnum.GAME_SNOWBALL:
                return new SnowballVisualization();

            case RoomObjectVisualizationEnum.GAME_SNOWSPLASH:
                return new SnowSplashVisualization();

            default:
                return null;
        }
    }

    /**
	 * Get or create cached visualization data for a content type.
	 * Data is created once per content id and then cached.
	 *
	 * @see AS3 RoomObjectVisualizationFactory.getRoomObjectVisualizationData()
	 */
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::getRoomObjectVisualizationData()
    getRoomObjectVisualizationData(id: string, type: string, data: unknown): IRoomObjectVisualizationData | null
    {
        // Check cache first
        const cached = this._visualizationDataCache.get(id);

        if(cached)
        {
            return cached;
        }

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as
        // `case "pet_animated": _loc8_ = AnimatedPetVisualizationData; break;` - a pet gets its own
        // data class, in a branch separate from the user/bot/rentable_bot one. This port had
        // "pet_animated" folded into the avatar branch, handing every pet an AvatarVisualizationData.
        if(type === RoomObjectVisualizationEnum.PET_ANIMATED)
        {
            const petVizData = new AnimatedPetVisualizationData();
            const ok = petVizData.initialize(data);

            if(!ok)
            {
                petVizData.dispose();

                return null;
            }

            // AS3: `_loc5_.commonAssets = assets;` - without this the pet visualization has no
            // asset library to resolve its sprites against, so it renders nothing and getImage()
            // returns null.
            petVizData.commonAssets = this._assets;

            this._visualizationDataCache.set(id, petVizData);

            return petVizData;
        }

        // AS3: `case "game_snowball": case "game_snowsplash": _loc8_ = _SafeCls_2245;` followed by
        // `_SafeCls_2245(_loc7_).assets = assets`. The two snow-war objects share one data class
        // that parses nothing and carries only the asset library their fixed bitmaps come from.
        if(type === RoomObjectVisualizationEnum.GAME_SNOWBALL || type === RoomObjectVisualizationEnum.GAME_SNOWSPLASH)
        {
            const gameVizData = new GameObjectVisualization();

            if(!gameVizData.initialize(data))
            {
                gameVizData.dispose();

                return null;
            }

            gameVizData.assets = this._assets;

            this._visualizationDataCache.set(id, gameVizData);

            return gameVizData;
        }

        // AS3: `case "furniture_mannequin": _loc8_ = AvatarFurnitureVisualizationData; break;`
        // followed by `else if(_loc7_ is AvatarFurnitureVisualizationData){ _loc9_.avatarRenderer =
        // _habboAvatar; }`. The mannequin is the only type in this branch: it needs a normal
        // furniture visualization data (its own layers still parse) that can additionally render an
        // avatar, which a plain FurnitureVisualizationData cannot.
        if(type === RoomObjectVisualizationEnum.FURNITURE_MANNEQUIN)
        {
            const mannequinVizData = new AvatarFurnitureVisualizationData();

            if(!mannequinVizData.initialize(data))
            {
                mannequinVizData.dispose();

                return null;
            }

            mannequinVizData.avatarRenderManager = this._avatarRenderManager;

            this._visualizationDataCache.set(id, mannequinVizData);

            return mannequinVizData;
        }

        // Avatar visualization types use AvatarVisualizationData
        // AS3: if (_loc7_ is AvatarVisualizationData) { _loc6_.avatarRenderer = _habboAvatar; }
        if(type === 'user' || type === 'bot' || type === 'rentable_bot')
        {
            const avatarVizData = new AvatarVisualizationData();

            if(!avatarVizData.initialize(data))
            {
                avatarVizData.dispose();
                return null;
            }

            avatarVizData.avatarRenderManager = this._avatarRenderManager;

            this._visualizationDataCache.set(id, avatarVizData);

            return avatarVizData;
        }

        // Create the appropriate visualization data based on type
        let vizData: FurnitureVisualizationData;

        if(RoomObjectVisualizationFactory.ANIMATED_VIZ_DATA_TYPES.has(type))
        {
            vizData = new AnimatedFurnitureVisualizationData();
        }
        else
        {
            vizData = new FurnitureVisualizationData();
        }

        // Initialize with the raw data
        if(!vizData.initialize(data))
        {
            vizData.dispose();
            return null;
        }

        // Cache the result
        this._visualizationDataCache.set(id, vizData);

        return vizData;
    }

    /**
     * Turns a room's numeric config updates into renderable configs.
     *
     * Every field on the wire is an id; this is where they become the names the renderers are
     * written against. The STYLE is the one that needs a second table — `(categoryId, styleId)`
     * names a preview style, and it is the style that carries the extras a renderer needs but the
     * server never sends: the icon for a status bar, the `design` for a number display, the
     * `sub_renderer` for a level badge.
     *
     * A style this build does not have leaves the config with an empty style name rather than
     * dropping it, so a renderer resolved by id still draws.
     */
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::updateVariableFxConfigs()
    updateVariableFxConfigs(roomId: string, configs: VariableFxConfigUpdateData[]): void
    {
        for(const config of configs)
        {
            const store = config.isUserFx
                ? this.getAvatarVariableFxRoomData(roomId).variableFxVisualizationManager
                : this.getFurnitureVariableFxRoomData(roomId).variableFxVisualizationManager;

            if(store === null) continue;

            const style = VariableFxPreviewStyles.getByCategoryAndStyleId(config.categoryId, config.styleId);
            const category = VariableFxCatalog.resolveCategoryById(config.categoryId);

            store.upsertConfig(config.configId, new VariableFxConfigData(
                category ?? '',
                style === null ? '' : style.serverStyle,
                VariableFxCatalog.resolveRendererById(config.rendererId) ?? '',
                VariableFxCatalog.resolveWidthById(config.widthId),
                VariableFxCatalog.resolveColorById(config.colorId),
                config.defaultMinValue,
                config.defaultMaxValue,
                config.extra,
                config.categoryId,
                config.styleId,
                config.rendererId
            ));
        }
    }

    /** Removed from BOTH stores: the id alone does not say which kind it was. */
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::removeVariableFxConfigs()
    removeVariableFxConfigs(roomId: string, configIds: number[]): void
    {
        const avatar = this.getAvatarVariableFxRoomData(roomId);
        const furniture = this.getFurnitureVariableFxRoomData(roomId);

        for(const configId of configIds)
        {
            avatar.variableFxVisualizationManager?.removeConfig(configId);
            furniture.variableFxVisualizationManager?.removeConfig(configId);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::getAvatarVisualizationRoomData()
    getAvatarVariableFxRoomData(roomId: string): VariableFxVisualizationRoomData
    {
        return RoomObjectVisualizationFactory.getOrCreateRoomData(
            this._avatarVariableFxRoomData, roomId, this.variableFxAssetProvider, this.variableFxRendererRegistry
        );
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::getFurnitureVisualizationRoomData()
    getFurnitureVariableFxRoomData(roomId: string): VariableFxVisualizationRoomData
    {
        return RoomObjectVisualizationFactory.getOrCreateRoomData(
            this._furnitureVariableFxRoomData, roomId, this.variableFxAssetProvider, this.variableFxRendererRegistry
        );
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::disposeRoomVisualizationData()
    disposeRoomVisualizationData(roomId: string): void
    {
        this._avatarVariableFxRoomData.get(roomId)?.dispose();
        this._avatarVariableFxRoomData.delete(roomId);

        this._furnitureVariableFxRoomData.get(roomId)?.dispose();
        this._furnitureVariableFxRoomData.delete(roomId);
    }

    /** Built on first use — see the field comment for why not in the constructor. */
    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::initialize()
    private get variableFxAssetProvider(): IVariableFxAssetProvider | null
    {
        if(this._variableFxAssetProvider === null && this._assets !== null)
        {
            this._variableFxAssetProvider = new AssetLibraryVariableFxAssetProvider(this._assets);
        }

        return this._variableFxAssetProvider;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::initialize()
    private get variableFxRendererRegistry(): VariableFxRendererRegistry | null
    {
        const provider = this.variableFxAssetProvider;

        if(this._variableFxRendererRegistry === null && provider !== null)
        {
            this._variableFxRendererRegistry = VariableFxRendererRegistry.createDefault(provider);
        }

        return this._variableFxRendererRegistry;
    }

    // AS3: .../src/com/sulake/habbo/room/object/RoomObjectVisualizationFactory.as::getAvatarVisualizationRoomData()
    private static getOrCreateRoomData(
        store: Map<string, VariableFxVisualizationRoomData>,
        roomId: string,
        assetProvider: IVariableFxAssetProvider | null,
        rendererRegistry: VariableFxRendererRegistry | null
    ): VariableFxVisualizationRoomData
    {
        let data = store.get(roomId);

        if(data === undefined)
        {
            data = new VariableFxVisualizationRoomData(assetProvider, rendererRegistry);

            store.set(roomId, data);
        }

        return data;
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

        for(const data of this._avatarVariableFxRoomData.values()) data.dispose();
        for(const data of this._furnitureVariableFxRoomData.values()) data.dispose();

        this._avatarVariableFxRoomData.clear();
        this._furnitureVariableFxRoomData.clear();

        this._variableFxAssetProvider = null;
        this._variableFxRendererRegistry = null;
        this._disposed = true;
    }
}
