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
import type {IAvatarRenderManager} from '@habbo/avatar/IAvatarRenderManager';
import {GraphicAssetCollection} from '@ambreia/common/graphics/GraphicAssetCollection';
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
import {FurnitureHabboWheelVisualization} from './visualization/furniture/FurnitureHabboWheelVisualization';
import {FurnitureValRandomizerVisualization} from './visualization/furniture/FurnitureValRandomizerVisualization';
import {FurnitureQueueTileVisualization} from './visualization/furniture/FurnitureQueueTileVisualization';
import {FurniturePartyBeamerVisualization} from './visualization/furniture/FurniturePartyBeamerVisualization';
import {FurnitureCuboidVisualization} from './visualization/furniture/FurnitureCuboidVisualization';
import {FurnitureGiftWrappedVisualization} from './visualization/furniture/FurnitureGiftWrappedVisualization';
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
    createRoomObjectVisualization(type: string): IRoomObjectVisualization | null
    {
        return this.createVisualizationInstance(type);
    }

    // DEVIATION: AS3 also maps `game_snowball` / `game_snowsplash` onto the snow-war visualizations;
    //   the RPG fork removed Snow War, so both types fall back to null like any unknown type.
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

            // DEVIATION: AS3 builds FurnitureFurniChestVisualization / FurnitureCoinsChestVisualization
            //   here. The RPG fork removed the wired chests, but furnidata can still name these two
            //   types, so they draw through the chests' own base class: an animated furni with no
            //   floating item icons and no contents plaque.
            case RoomObjectVisualizationEnum.FURNITURE_FURNI_CHEST:
            case RoomObjectVisualizationEnum.FURNITURE_COINS_CHEST:
                return new AnimatedFurnitureVisualization();

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
