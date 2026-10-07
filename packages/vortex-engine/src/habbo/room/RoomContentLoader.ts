/**
 * RoomContentLoader
 *
 * Based on AS3: com.sulake.habbo.room.RoomContentLoader
 *
 * Loader for room content (furniture, pets, room assets).
 * Loads .nitro bundles, creates GraphicAssetCollections and caches them.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as
 */
import type {Texture} from 'pixi.js';
import type {EventEmitter} from 'eventemitter3';
import type {IRoomContentLoader, RoomContentData} from '@room/IRoomContentLoader';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IRoomObjectController} from '@room/object/IRoomObjectController';
import type {IRoomObjectVisualizationFactory} from '@room/object/IRoomObjectVisualizationFactory';
import type {IGraphicAssetCollection} from '@ambreia/common/graphics/IGraphicAssetCollection';
import type {IAsset} from '@ambreia/common/assets/IAsset';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import {AssetLibraryCollection} from '@ambreia/common/assets/AssetLibraryCollection';
import type {IFurniDataSource, IRoomContentConfiguration} from './IRoomContentConfiguration';
import type {IFurnitureData} from '@habbo/session/furniture/IFurnitureData';
import type {IFurniDataListener} from '@habbo/session/furniture/IFurniDataListener';
import type {IRoomContentListener} from './IRoomContentListener';
import type {NitroAsset} from '@ambreia/common/assets/NitroAsset';
import type {AssetLoaderEvent} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import { AssetLoaderEventType} from '@ambreia/common/assets/loaders/AssetLoaderEvent';
import {RoomContentLoadedEvent} from '@room/events/RoomContentLoadedEvent';
import {RoomObjectCategoryEnum} from './object/RoomObjectCategoryEnum';
import {getVisualizationType} from './object/RoomObjectUserTypes';
import {PetColorResult} from './PetColorResult';
import {Logger} from '@core';

const log = Logger.getLogger('habbo.room.RoomContentLoader');

export class RoomContentLoader implements IRoomContentLoader, IFurniDataListener
{
    /**
    * RoomContentLoader states.
    *
    * @see AS3 RoomContentLoader lines 42-46
    */
    // AS3: sources/win63_version/habbo/room/class_1835.as::STATE_CREATED
    private static readonly STATE_CREATED = 0;

    // AS3: sources/win63_version/habbo/room/class_1835.as::STATE_INITIALIZING
    private static readonly STATE_INITIALIZING = 1;

    // AS3: sources/win63_version/habbo/room/class_1835.as::STATE_READY
    private static readonly STATE_READY = 2;

    /**
	 * Event emitted on stateEvents when content loader is ready.
	 *
	 * @see AS3 RoomContentLoader.CONTENT_LOADER_READY line 38
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::CONTENT_LOADER_READY
    public static readonly CONTENT_LOADER_READY = 'RCL_LOADER_READY';

    // AS3: sources/win63_version/habbo/room/class_1835.as::ASSET_LIBRARY_NAME_PREFIX
    private static readonly ASSET_LIBRARY_NAME_PREFIX = 'RoomContentLoader ';

    // AS3: sources/win63_version/habbo/room/class_1835.as::CONTENT_DROP_DELAY
    private static readonly CONTENT_DROP_DELAY = 20000;

    // AS3: sources/win63_version/habbo/room/class_1835.as::COMPRESSION_INTERVAL
    private static readonly COMPRESSION_INTERVAL = 30000;

    // AS3: sources/win63_version/habbo/room/class_1835.as::PLACE_HOLDER_FURNITURE
    private static readonly PLACE_HOLDER_FURNITURE = 'place_holder';
    // AS3: sources/win63_version/habbo/room/class_1835.as::PLACE_HOLDER_WALL_ITEM
    private static readonly PLACE_HOLDER_WALL_ITEM = 'wall_place_holder';
    // AS3: sources/win63_version/habbo/room/class_1835.as::PLACE_HOLDER_PET
    private static readonly PLACE_HOLDER_PET = 'pet_place_holder';
    // AS3: sources/win63_version/habbo/room/class_1835.as::PLACE_HOLDER_DEFAULT
    private static readonly PLACE_HOLDER_DEFAULT = 'place_holder';
    // AS3: sources/win63_version/habbo/room/class_1835.as::ROOM_CONTENT
    private static readonly ROOM_CONTENT = 'room';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::TILE_CURSOR
    private static readonly TILE_CURSOR = 'tile_cursor';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::SELECTION_ARROW
    private static readonly SELECTION_ARROW = 'selection_arrow';

    /**
	 * @see AS3 RoomContentLoader.PLACE_HOLDER_TYPES line 62
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::PLACE_HOLDER_TYPES
    private static readonly PLACE_HOLDER_TYPES: string[] = [
        'place_holder',
        'wall_place_holder',
        'pet_place_holder',
        'room',
        'tile_cursor',
        'selection_arrow'
    ];

    // AS3: sources/win63_version/habbo/room/class_1835.as::PLACE_HOLDER_TYPES_GPU
    private static readonly PLACE_HOLDER_TYPES_GPU: Set<string> = new Set([
        'place_holder',
        'wall_place_holder',
        'pet_place_holder',
        'room',
        'selection_arrow'
    ]);

    // --- AS3 var_2179: typeId -> className (floor items) ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_activeObjectTypes
    private _activeObjectTypes: Map<number, string> = new Map();

    // --- AS3 var_2532: className -> typeId (floor items) ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_activeObjectTypeIds
    private _activeObjectTypeIds: Map<string, number> = new Map();

    // --- AS3 var_2100: Dictionary of floor item classNames ---
    private _floorItems: Map<string, number> = new Map();

    // --- AS3 var_2552: typeId -> className (wall items) ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_wallItemTypes
    private _wallItemTypes: Map<number, string> = new Map();

    // --- AS3 var_2816: className -> typeId (wall items) ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_wallItemTypeIds
    private _wallItemTypeIds: Map<string, number> = new Map();

    // --- AS3 _wallItems: Dictionary of wall item classNames ---
    // AS3: sources/win63_version/habbo/room/class_1835.as::_wallItems
    private _wallItems: Map<string, number> = new Map();

    // --- AS3 var_2887: typeId -> petType ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_petTypes
    private _petTypes: Map<number, string> = new Map();

    // --- AS3 var_2094: Dictionary petName -> typeId ---
    private _petTypeIds: Map<string, number> = new Map();

    // --- AS3 _petColors: typeId -> (colorId -> PetColorResult) ---
    // AS3: sources/win63_version/habbo/room/class_1835.as::_petColors
    private _petColors: Map<number, Map<number | string, PetColorResult>> | null = null;

    // --- AS3 _petLayers: typeId -> (size -> (tag -> layerId)) ---
    // AS3: sources/win63_version/habbo/room/class_1835.as::_petLayers
    private _petLayers: Map<number, Map<string, Map<string, number>>> | null = null;

    // --- AS3 var_2442: className -> revision ---
    private _revisions: Map<string, number> = new Map();

    // --- AS3 var_2291: alias -> original ---
    private _aliases: Map<string, string> = new Map();

    // --- AS3 var_2370: original -> alias ---
    private _reverseAliases: Map<string, string> = new Map();

    // --- AS3 var_2748: className -> adUrl ---
    private _adUrls: Map<string, string> = new Map();

    // --- AS3 var_614: libraryName -> AssetLibrary ---
    private _assetLibraries: Map<string, IAssetLibrary> = new Map();

    // --- AS3 name_1: contentType -> IEventDispatcher ---
    private _assetLibraryEventDispatchers: Map<string, EventEmitter> = new Map();

    // --- AS3 var_1347: additional contentType -> source contentType ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_additionalObjectTypeLibraries
    private _additionalObjectTypeLibraries: Map<string, string> = new Map();

    // --- Converted AS3 XML assets stored as JSON by contentType. ---
    private _contentData: Map<string, RoomContentData> = new Map();

    // --- AS3 _visualizationFactory ---
    // AS3: sources/win63_version/habbo/room/class_1835.as::_visualizationFactory
    private _visualizationFactory: IRoomObjectVisualizationFactory | null = null;

    // --- AS3 var_1827: contentType -> GraphicAssetCollection ---
    private _graphicAssetCollections: Map<string, IGraphicAssetCollection> = new Map();
    // --- AS3 _stateEvents: IEventDispatcher ---
    // AS3: sources/win63_version/habbo/room/class_1835.as::_stateEvents
    private _stateEvents: EventEmitter | null = null;
    // --- AS3 var_4558: furniDataReady ---
    private _furniDataReady: boolean = false;
    // --- AS3 var_3642: pendingFurniData ---
    private _pendingFurniData: boolean = false;
    // --- Configuration URLs (AS3 var_4646, var_4721, var_4542, var_4243, var_4790) ---
    private _furnitureDownloadUrl: string = '';
    private _furnitureDownloadNameTemplate: string = '';
    private _furnitureIconDownloadNameTemplate: string = '';
    private _petDownloadUrl: string = '';
    private _petDownloadNameTemplate: string = '';
    // --- AS3 var_3839/iconAssets ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_iconAssets
    private _iconAssets: IAssetLibrary | null = null;

    // --- AS3 var_581/iconListener ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_iconListener
    private _iconListener: IRoomContentListener | null = null;

    // --- AS3 var_1813: ignored furni types ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_ignoredFurniTypes
    private _ignoredFurniTypes: Set<string> | null = null;

    // --- AS3 _lastAssetCompressionTime ---
    // AS3: sources/win63_version/habbo/room/class_1835.as::_lastAssetCompressionTime
    private _lastAssetCompressionTime: number = 0;

    private _configurationManager: IRoomContentConfiguration | null = null;
    private _loadedTypes: Map<string, boolean> = new Map();
    private _loadingTypes: Map<string, Promise<void>> = new Map();

    // --- AS3 var_149: state ---
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomContentLoader.as::_state
    private _state: number = RoomContentLoader.STATE_CREATED;

    get state(): number
    {
        return this._state;
    }

    // --- AS3 var_318: disposed ---
    private _disposed: boolean = false;

    // AS3: sources/win63_version/habbo/room/class_1835.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::set visualizationFactory()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::set visualizationFactory()
    set visualizationFactory(factory: IRoomObjectVisualizationFactory)
    {
        this._visualizationFactory = factory;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::set iconAssets()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::set iconAssets()
    set iconAssets(assets: IAssetLibrary)
    {
        this._iconAssets = assets;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::set iconListener()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::set iconListener()
    set iconListener(listener: IRoomContentListener)
    {
        this._iconListener = listener;
    }

    // AS3: sources/win63_version/habbo/room/class_1835.as::_sessionDataManager
    private _furniDataSource: IFurniDataSource | null = null;

    /**
	 * @see AS3 RoomContentLoader.set sessionDataManager (line 157)
	 */
    // DEVIATION: AS3 takes the session data manager; only its furnidata is read, so any source does.
    // AS3: sources/win63_version/habbo/room/class_1835.as::set sessionDataManager()
    set furniDataSource(source: IFurniDataSource)
    {
        this._furniDataSource = source;

        if(this._pendingFurniData)
        {
            this._pendingFurniData = false;
            this.initFurnitureData();
        }
    }

    get isFurniDataReady(): boolean
    {
        return this._furniDataReady;
    }

    /**
	 * Initialize the content loader with dependencies.
	 *
	 * @param stateEvents EventEmitter to emit CONTENT_LOADER_READY when ready
	 * @param assetLibrary Asset library for loading Nitro bundles
	 * @param configurationManager Configuration manager for URL templates
	 *
	 * @see AS3 RoomContentLoader.initialize() lines 181-192
	 */
    // AS3 takes `(IEventDispatcher, IRoomContentConfiguration)` and no asset library: it builds one
    // AssetLibraryCollection per content type in addAssetLibraryCollection() and never holds a
    // library of its own. The port's third parameter existed only to feed the shared-library design
    // that made two content types share one asset namespace, so it goes with it.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_2288.as::initialize()
    initialize(stateEvents: EventEmitter, configurationManager: IRoomContentConfiguration): void
    {
        this._stateEvents = stateEvents;
        this._configurationManager = configurationManager;

        this._furnitureDownloadUrl = configurationManager.getProperty('flash.dynamic.download.url');
        this._furnitureDownloadNameTemplate = configurationManager.getProperty('flash.dynamic.download.name.template');
        this._furnitureIconDownloadNameTemplate = configurationManager.getProperty('flash.dynamic.icon.download.name.template');
        this._petDownloadUrl = configurationManager.getProperty('pet.dynamic.download.url');
        this._petDownloadNameTemplate = configurationManager.getProperty('pet.dynamic.download.name.template');

        this._state = RoomContentLoader.STATE_INITIALIZING;

        this.initFurnitureData();
        this.initPetData(configurationManager);
    }

    /**
	 * @see AS3 RoomContentLoader.dispose() lines 194-299
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this._activeObjectTypes.clear();
        this._activeObjectTypeIds.clear();
        this._floorItems.clear();
        this._wallItemTypes.clear();
        this._wallItemTypeIds.clear();
        this._wallItems.clear();
        this._petTypes.clear();
        this._petTypeIds.clear();
        this._revisions.clear();
        this._aliases.clear();
        this._reverseAliases.clear();
        this._adUrls.clear();
        this._assetLibraries.clear();
        this._assetLibraryEventDispatchers.clear();
        this._additionalObjectTypeLibraries.clear();
        this._contentData.clear();

        if(this._ignoredFurniTypes !== null)
        {
            this._ignoredFurniTypes.clear();
            this._ignoredFurniTypes = null;
        }

        if(this._petColors !== null)
        {
            this._petColors.clear();
            this._petColors = null;
        }

        if(this._petLayers !== null)
        {
            this._petLayers.clear();
            this._petLayers = null;
        }

        for(const collection of this._graphicAssetCollections.values())
        {
            collection.dispose();
        }

        this._graphicAssetCollections.clear();
        this._loadedTypes.clear();
        this._loadingTypes.clear();

        this._stateEvents = null;
        this._visualizationFactory = null;
        this._iconAssets = null;
        this._iconListener = null;
        this._furniDataSource = null;
        this._configurationManager = null;
    }

    /**
	 * @see AS3 RoomContentLoader.setRoomObjectAlias() lines 301-310
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::setRoomObjectAlias()
    setRoomObjectAlias(alias: string, original: string): void
    {
        this._aliases.set(alias, original);
        this._reverseAliases.set(original, alias);
    }

    /**
	 * @see AS3 RoomContentLoader.getObjectCategory() lines 312-347
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getObjectCategory()
    getObjectCategory(type: string): number
    {
        if(type === null)
        {
            return RoomObjectCategoryEnum.MINIMUM;
        }

        if(this._floorItems.has(type))
        {
            return RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE;
        }

        if(this._wallItems.has(type))
        {
            return RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL;
        }

        if(this._petTypeIds.has(type))
        {
            return RoomObjectCategoryEnum.OBJECT_CATEGORY_USER;
        }

        if(type.indexOf('poster') === 0)
        {
            return RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL;
        }

        if(type === 'room')
        {
            return RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM;
        }

        if(type === 'user' || type === 'pet' || type === 'bot' || type === 'rentable_bot')
        {
            return RoomObjectCategoryEnum.OBJECT_CATEGORY_USER;
        }

        if(type === 'tile_cursor' || type === 'selection_arrow')
        {
            return RoomObjectCategoryEnum.OBJECT_CATEGORY_CURSOR;
        }

        return RoomObjectCategoryEnum.MINIMUM;
    }

    /**
	 * @see AS3 RoomContentLoader.getPlaceHolderType() lines 349-360
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getPlaceHolderType()
    getPlaceHolderType(type: string): string
    {
        if(this._floorItems.has(type))
        {
            return RoomContentLoader.PLACE_HOLDER_FURNITURE;
        }

        if(this._wallItems.has(type))
        {
            return RoomContentLoader.PLACE_HOLDER_WALL_ITEM;
        }

        if(this._petTypeIds.has(type))
        {
            return RoomContentLoader.PLACE_HOLDER_PET;
        }

        return RoomContentLoader.PLACE_HOLDER_DEFAULT;
    }

    /**
	 * @see AS3 RoomContentLoader.getPlaceHolderTypes() lines 362-364
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getPlaceHolderTypes()
    getPlaceHolderTypes(): string[]
    {
        return RoomContentLoader.PLACE_HOLDER_TYPES;
    }

    /**
	 * @see AS3 RoomContentLoader.getActiveObjectType() lines 366-372
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getActiveObjectType()
    getActiveObjectType(typeId: number): string | null
    {
        const className = this._activeObjectTypes.get(typeId) ?? null;

        if(className === null)
        {
            log.warn(`Could not find type for id: ${typeId}`);
        }

        return this.getObjectType(className);
    }

    /**
	 * @see AS3 RoomContentLoader.getActiveObjectTypeId() lines 374-376
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getActiveObjectTypeId()
    getActiveObjectTypeId(type: string): number
    {
        return this._activeObjectTypeIds.get(type) ?? -1;
    }

    /**
	 * @see AS3 RoomContentLoader.getWallItemType() lines 378-384
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getWallItemType()
    getWallItemType(typeId: number, posterType: string | null = null): string | null
    {
        let className = this._wallItemTypes.get(typeId) ?? null;

        if(className === 'poster' && posterType !== null)
        {
            className = className + posterType;
        }

        return this.getObjectType(className);
    }

    /**
	 * @see AS3 RoomContentLoader.getWallItemTypeId() lines 386-388
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getWallItemTypeId()
    getWallItemTypeId(type: string): number
    {
        return this._wallItemTypeIds.get(type) ?? -1;
    }

    /**
	 * @see AS3 RoomContentLoader.getPetType() lines 390-392
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getPetType()
    getPetType(typeId: number): string | null
    {
        return this._petTypes.get(typeId) ?? null;
    }

    /**
	 * @see AS3 RoomContentLoader.getPetTypeId() lines 394-396
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getPetTypeId()
    getPetTypeId(type: string): number
    {
        return this._petTypeIds.get(type) ?? -1;
    }

    /**
	 * @see AS3 RoomContentLoader.getPetColor() lines 398-404
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getPetColor()
    getPetColor(typeId: number, colorId: number): PetColorResult | null
    {
        if(this._petColors === null) return null;

        const colorMap = this._petColors.get(typeId);

        if(colorMap !== undefined)
        {
            return colorMap.get(colorId) ?? colorMap.get(String(colorId)) ?? null;
        }

        return null;
    }

    /**
	 * @see AS3 RoomContentLoader.getPetColorsByTag() lines 406-417
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getPetColorsByTag()
    getPetColorsByTag(typeId: number, tag: string): PetColorResult[]
    {
        const results: PetColorResult[] = [];

        if(this._petColors === null) return results;

        const colorMap = this._petColors.get(typeId);

        if(colorMap !== undefined)
        {
            for(const result of colorMap.values())
            {
                if(result.tag === tag)
                {
                    results.push(result);
                }
            }
        }

        return results;
    }

    /**
	 * @see AS3 RoomContentLoader.getPetLayerIdForTag() lines 419-428
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getPetLayerIdForTag()
    getPetLayerIdForTag(typeId: number, tag: string, size: number = 64): number
    {
        if(this._petLayers === null) return -1;

        const sizeMap = this._petLayers.get(typeId);

        if(sizeMap !== undefined)
        {
            const tagMap = sizeMap.get(size.toString());

            if(tagMap !== undefined)
            {
                return tagMap.get(tag) ?? -1;
            }
        }

        return -1;
    }

    /**
	 * @see AS3 RoomContentLoader.getPetDefaultPalette() lines 430-440
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getPetDefaultPalette()
    getPetDefaultPalette(typeId: number, tag: string): PetColorResult | null
    {
        if(this._petColors === null) return null;

        const colorMap = this._petColors.get(typeId);

        if(colorMap !== undefined)
        {
            for(const result of colorMap.values())
            {
                if(result.layerTags.indexOf(tag) > -1 && result.isMaster)
                {
                    return result;
                }
            }
        }

        return null;
    }

    /**
	 * @see AS3 RoomContentLoader.getActiveObjectColorIndex() lines 442-445
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getActiveObjectColorIndex()
    getActiveObjectColorIndex(typeId: number): number
    {
        const className = this._activeObjectTypes.get(typeId) ?? null;

        return this.getObjectColorIndex(className);
    }

    /**
	 * @see AS3 RoomContentLoader.getWallItemColorIndex() lines 447-450
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getWallItemColorIndex()
    getWallItemColorIndex(typeId: number): number
    {
        const className = this._wallItemTypes.get(typeId) ?? null;

        return this.getObjectColorIndex(className);
    }

    /**
	 * @see AS3 RoomContentLoader.getRoomObjectAdURL() lines 452-457
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getRoomObjectAdURL()
    getRoomObjectAdURL(type: string): string
    {
        return this._adUrls.get(type) ?? '';
    }

    /**
	 * @see AS3 RoomContentLoader.getContentType() lines 459-461
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getContentType()
    getContentType(type: string): string
    {
        return type;
    }

    /**
	 * @see AS3 RoomContentLoader.hasInternalContent() lines 463-469
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::hasInternalContent()
    hasInternalContent(type: string): boolean
    {
        type = getVisualizationType(type);

        return type === 'user' || type === 'game_snowball' || type === 'game_snowsplash';
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::loadObjectContent()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::loadObjectContent()
    loadObjectContent(type: string, events: EventEmitter): boolean
    {
        if(type === null || type === '')
        {
            log.warn('Can not load content, object type unknown!');
            return false;
        }

        let multiType: string | null = null;

        if(type.indexOf(',') >= 0)
        {
            multiType = type;
            type = multiType.split(',')[0];
        }

        const existingLibrary = this.getAssetLibrary(type);

        if(existingLibrary !== null)
        {
            // DEVIATION: AS3 has no such branch - its guard is the bare
            //   `if(getAssetLibrary(type) != null || getAssetLibraryEventDispatcher(type) != null)
            //   return false`, so a type whose GraphicAssetCollection was freed while its library
            //   survived stays permanently blank. That happens when initializeGraphicAssetCollection()
            //   fails and calls disposeGraphicAssetCollection() (purge() no longer produces it: it
            //   drops the collection and the library together, as AS3 does). The rebuild below is
            //   kept because AS3's own object-creation path (room/RoomManager.as::createRoomObject()
            //   lines 307-313) treats `getGraphicAssetCollection() == null` as the one signal that
            //   content needs (re)loading - there is no separate "already loaded" flag there at
            //   all - so rebuilding from the still-present data beats leaving the type looking
            //   loaded with nothing to show.
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_2288.as::loadObjectContent()
            if(this.getGraphicAssetCollection(type) === null)
            {
                const contentType = this.getRoomObjectOriginalName(this.getContentType(type));

                this.registerContentData(contentType, existingLibrary, type);

                const rebuilt = this.initializeGraphicAssetCollection(contentType, existingLibrary);

                // No fresh load is in flight to fire the normal processLoadedLibrary() event
                // path, so tell this specific caller directly - it already queued its pending
                // visualization request before calling in (see RoomEngine.loadFurnitureContent()).
                events.emit(rebuilt ? RoomContentLoadedEvent.CONTENT_LOAD_SUCCESS : RoomContentLoadedEvent.CONTENT_LOAD_FAILURE, contentType);
            }

            return false;
        }

        if(this.getAssetLibraryEventDispatcher(type) !== null)
        {
            return false;
        }

        const assetLibrary = this.addAssetLibraryCollection(type, events);

        if(assetLibrary === null)
        {
            return false;
        }

        if(this.isIgnoredFurniType(type))
        {
            log.warn(`Ignored object type found from configuration. Not downloading assets for: ${type}`);
            return false;
        }

        const urls = multiType !== null ? this.getObjectContentURLs(multiType) : this.getObjectContentURLs(type);

        if(urls.length > 0)
        {
            const loadPromise = this.loadObjectContentFromUrls(type, urls, events, assetLibrary);
            this._loadingTypes.set(type, loadPromise);

            return true;
        }

        return false;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::insertObjectContent()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::insertObjectContent()
    insertObjectContent(typeId: number, category: number, assetLibrary: IAssetLibrary): boolean
    {
        const contentType = this.getAssetLibraryType(assetLibrary);

        if(contentType === null)
        {
            return false;
        }

        switch(category)
        {
            case RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE:
                this._activeObjectTypes.set(typeId, contentType);
                this._activeObjectTypeIds.set(contentType, typeId);
                break;
            case RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL:
                this._wallItemTypes.set(typeId, contentType);
                this._wallItemTypeIds.set(contentType, typeId);
                break;
            default:
                throw new Error(`Registering content library for unsupported category ${category}!`);
        }

        // AS3: `_loc4_ = addAssetLibraryCollection(_loc5_, null) as AssetLibraryCollection;
        // if(_loc4_) { _loc4_.addAssetLibrary(param3); ... }` — the externally loaded library joins
        // the type's collection. The port overwrote the map entry with the bare library instead,
        // which put a type back on a library shared with whoever else was handed the same instance.
        // The cast is AS3's too: addAssetLibrary() is not on IAssetLibrary.
        const collection = this.addAssetLibraryCollection(contentType, null);

        if(collection instanceof AssetLibraryCollection)
        {
            collection.addAssetLibrary(assetLibrary);
        }

        this.registerContentData(contentType, assetLibrary);

        if(this.initializeGraphicAssetCollection(contentType, assetLibrary))
        {
            switch(category)
            {
                case RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE:
                    if(!this._floorItems.has(contentType))
                    {
                        this._floorItems.set(contentType, 1);
                    }
                    break;
                case RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL:
                    if(!this._wallItems.has(contentType))
                    {
                        this._wallItems.set(contentType, 1);
                    }
                    break;
            }

            const dispatcher = this.getAssetLibraryEventDispatcher(contentType, true);

            if(dispatcher !== null)
            {
                dispatcher.emit(RoomContentLoadedEvent.CONTENT_LOAD_SUCCESS, contentType);
            }

            return true;
        }

        return false;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getObjectUrl()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getObjectUrl()
    getObjectUrl(type: string, param: string): string | null
    {
        let multiType: string | null = null;

        if(type && type.indexOf(',') >= 0)
        {
            multiType = type;
            type = multiType.split(',')[0];
        }

        const urls = multiType !== null ? this.getObjectContentURLs(multiType, param, true) : this.getObjectContentURLs(type, param, true);

        if(urls.length > 0)
        {
            return urls[0];
        }

        return null;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::loadThumbnailContent()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::loadThumbnailContent()
    loadThumbnailContent(typeId: number, type: string, param: string, _events: EventEmitter): boolean
    {
        if(this._iconAssets === null || this._iconListener === null)
        {
            log.warn(`loadThumbnailContent: bailing out (iconAssets=${!!this._iconAssets}, iconListener=${!!this._iconListener})`);

            return false;
        }

        let multiType: string | null = null;

        if(type && type.indexOf(',') >= 0)
        {
            multiType = type;
            type = multiType.split(',')[0];
        }

        const urls = multiType !== null ? this.getObjectContentURLs(multiType, param, true) : this.getObjectContentURLs(type, param, true);

        if(urls.length > 0)
        {
            for(const url of urls)
            {
                try
                {
                    const loader = this._iconAssets.loadAssetFromFile([type, param].join('_'), url, 'image/png', typeId);

                    loader.events.on('event', (event: AssetLoaderEvent) =>
                    {
                        if(event.type === AssetLoaderEventType.COMPLETE)
                        {
                            this._iconListener!.iconLoaded(loader.assetLoader?.id ?? typeId, loader.assetName, true);
                        }
                    });
                }
                catch (error)
                {
                    log.warn(`loadThumbnailContent: loadAssetFromFile(${[type, param].join('_')}, ${url}) threw`, error);
                }
            }

            return true;
        }

        return false;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getVisualizationType()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getVisualizationType()
    getVisualizationType(type: string): string | null
    {
        if(type === null)
        {
            return null;
        }

        const index = this.getIndexData(type);

        return index !== null ? this.getString(index, 'visualization', 'visualizationType', 'visualization_type') : null;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getLogicType()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getLogicType()
    getLogicType(type: string): string | null
    {
        if(type === null)
        {
            return null;
        }

        const index = this.getIndexData(type);

        return index !== null ? this.getString(index, 'logic', 'logicType', 'logic_type') : null;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::hasVisualizationXML()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::hasVisualizationXML()
    hasVisualizationXML(type: string): boolean
    {
        return this.hasXML(type, '_visualization');
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getVisualizationXML()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getVisualizationXML()
    getVisualizationXML(type: string): RoomContentData | null
    {
        return this.getXML(type, '_visualization');
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::hasAssetXML()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::hasAssetXML()
    hasAssetXML(type: string): boolean
    {
        return this.hasXML(type, '_assets');
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getAssetXML()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getAssetXML()
    getAssetXML(type: string): RoomContentData | null
    {
        return this.getXML(type, '_assets');
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::hasLogicXML()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::hasLogicXML()
    hasLogicXML(type: string): boolean
    {
        return this.hasXML(type, '_logic');
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getLogicXML()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getLogicXML()
    getLogicXML(type: string): RoomContentData | null
    {
        return this.getXML(type, '_logic');
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::addGraphicAsset()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::addGraphicAsset()
    addGraphicAsset(type: string, assetName: string, texture: Texture, override: boolean, _disposeExisting: boolean = true): boolean
    {
        const collection = this.getGraphicAssetCollection(type);

        if(collection !== null)
        {
            return collection.addAsset(assetName, texture, override, 0, 0, false, false);
        }

        return false;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getGraphicAssetCollection()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getGraphicAssetCollection()
    getGraphicAssetCollection(type: string): IGraphicAssetCollection | null
    {
        const contentType = this.getContentType(type);

        return this._graphicAssetCollections.get(contentType) ?? null;
    }

    /**
	 * @see AS3 RoomContentLoader.roomObjectCreated() lines 695-700
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::roomObjectCreated()
    roomObjectCreated(object: IRoomObject, roomId: string): void
    {
        const controller = object as IRoomObjectController;

        if(controller && controller.getModelController())
        {
            controller.getModelController().setString('object_room_id', roomId, true);
        }
    }

    /**
	 * Called by SessionDataManager when furniture data becomes available.
	 *
	 * @see AS3 RoomContentLoader.furniDataReady() lines 702-704
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::furniDataReady()
    furniDataReady(): void
    {
        this.initFurnitureData();
    }

    /**
	 * @see AS3 RoomContentLoader.setActiveObjectType() lines 706-709
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::setActiveObjectType()
    setActiveObjectType(typeId: number, type: string): void
    {
        this._activeObjectTypes.delete(typeId);
        this._activeObjectTypes.set(typeId, type);
    }

    /**
	 * Get the className for a furniture typeId (combines getActiveObjectType + getWallItemType).
	 *
	 * Must go through those two methods (not read _activeObjectTypes/_wallItemTypes directly) -
	 * they strip the "*colourIndex" suffix via getObjectType(), which indexed-color floor/wall
	 * items (e.g. "carpet_polar*73") carry on the raw stored value. Every downstream content-loader
	 * lookup (getObjectCategory, getObjectContentURLs, ...) expects the base classname only; passing
	 * the raw suffixed string makes getObjectCategory() fail to match _floorItems/_wallItems (which
	 * are keyed by base name), so getObjectContentURLs() silently returns no URLs and the furniture
	 * asset is never downloaded.
	 */
    getClassName(typeId: number, category: number): string | null
    {
        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            return this.getWallItemType(typeId);
        }

        return this.getActiveObjectType(typeId);
    }

    /**
	 * Check if content is loaded for a given type.
	 */
    isLoaded(type: string): boolean
    {
        return this._loadedTypes.get(type) === true;
    }

    /**
	 * @see AS3 RoomContentLoader.getRoomObjectAlias() lines 876-885
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getRoomObjectAlias()
    private getRoomObjectAlias(type: string): string
    {
        return this._aliases.get(type) ?? type;
    }

    /**
	 * @see AS3 RoomContentLoader.getRoomObjectOriginalName() lines 887-896
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getRoomObjectOriginalName()
    private getRoomObjectOriginalName(type: string): string
    {
        return this._reverseAliases.get(type) ?? type;
    }

    /**
	 * @see AS3 RoomContentLoader.initFurnitureData() lines 783-797
	 */
    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::parseIgnoredFurniTypes()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::parseIgnoredFurniTypes()
    private parseIgnoredFurniTypes(): void
    {
        if(this._configurationManager === null)
        {
            return;
        }

        const ignoredTypes = this._configurationManager.getProperty('gpu.ignored_furni');

        if(!ignoredTypes)
        {
            return;
        }

        this._ignoredFurniTypes = new Set();

        for(const type of ignoredTypes.split(','))
        {
            this._ignoredFurniTypes.add(type.trim());
        }
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::isIgnoredFurniType()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::isIgnoredFurniType()
    private isIgnoredFurniType(type: string): boolean
    {
        return this._ignoredFurniTypes !== null && this._ignoredFurniTypes.has(type);
    }

    // AS3: sources/win63_version/habbo/room/class_1835.as::initFurnitureData()
    private initFurnitureData(): void
    {
        if(this._furniDataSource === null)
        {
            this._pendingFurniData = true;
            return;
        }

        const furniData = this._furniDataSource.getFurniData(this);

        // AS3: getFurniData returns null when data isn't ready.
        // Our TS version returns [] (empty array, truthy in JS).
        // Check length to avoid treating empty data as "ready".
        if(!furniData || furniData.length === 0)
        {
            return;
        }

        this._furniDataSource.removeFurniDataListener(this);

        this.populateFurniData(furniData);

        this._furniDataReady = true;
        this.parseIgnoredFurniTypes();

        log.debug(`Furniture data initialized: ${this._floorItems.size} floor items, ${this._wallItems.size} wall items`);

        this.continueInitilization();
    }

    /**
	 * @see AS3 RoomContentLoader.initPetData() lines 771-781
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::initPetData()
    private initPetData(configurationManager: IRoomContentConfiguration): void
    {
        const petConfig = configurationManager.getProperty('pet.configuration');

        if(petConfig)
        {
            const petTypes = petConfig.split(',');
            let typeId = 0;

            for(const petType of petTypes)
            {
                const trimmed = petType.trim();
                this._petTypeIds.set(trimmed, typeId);
                this._petTypes.set(typeId, trimmed);
                typeId++;
            }
        }

        this._petColors = new Map();
        this._petLayers = new Map();
    }

    /**
	 * @see AS3 RoomContentLoader.continueInitilization() lines 867-874
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::continueInitilization()
    private continueInitilization(): void
    {
        if(this._furniDataReady)
        {
            this._state = RoomContentLoader.STATE_READY;

            if(this._stateEvents !== null)
            {
                this._stateEvents.emit(RoomContentLoader.CONTENT_LOADER_READY);
            }
        }
    }

    /**
	 * @see AS3 RoomContentLoader.populateFurniData() lines 818-865
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::populateFurniData()
    private populateFurniData(data: IFurnitureData[]): void
    {
        for(const item of data)
        {
            const typeId = item.id;
            let className = item.className;
            const baseClassName = className;

            // Handle indexed color suffix (AS3 lines 829-831)
            if(item.hasIndexedColor)
            {
                className = className + '*' + item.colourIndex;
            }

            const revision = item.revision;
            const adUrl = item.adUrl;

            // Track ad URLs (AS3 lines 833-836)
            if(adUrl !== null && adUrl.length > 0)
            {
                this._adUrls.set(className, adUrl);
            }

            if(item.type === 's')
            {
                // Floor item (AS3 lines 838-843)
                this._activeObjectTypes.set(typeId, className);
                this._activeObjectTypeIds.set(className, typeId);

                if(!this._floorItems.has(baseClassName))
                {
                    this._floorItems.set(baseClassName, 1);
                }
            }
            else if(item.type === 'i')
            {
                // Wall item (AS3 lines 844-857)
                if(className === 'post.it')
                {
                    className = 'post_it';
                }
                else if(className === 'post.it.vd')
                {
                    className = 'post_it_vd';
                }

                this._wallItemTypes.set(typeId, className);
                this._wallItemTypeIds.set(className, typeId);

                const wallBaseClassName = className.indexOf('*') >= 0
                    ? className.substring(0, className.indexOf('*'))
                    : className;

                if(!this._wallItems.has(wallBaseClassName))
                {
                    this._wallItems.set(wallBaseClassName, 1);
                }
            }

            // Track revisions (AS3 lines 859-863)
            const existingRevision = this._revisions.get(baseClassName) ?? 0;

            if(revision > existingRevision)
            {
                this._revisions.set(baseClassName, revision);
            }
        }
    }

    /**
	 * Strip the color index suffix from a className.
	 *
	 * @see AS3 RoomContentLoader.getObjectType() lines 898-907
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getObjectType()
    private getObjectType(className: string | null): string | null
    {
        if(className === null)
        {
            return null;
        }

        const starIndex = className.indexOf('*');

        if(starIndex >= 0)
        {
            return className.substring(0, starIndex);
        }

        return className;
    }

    /**
	 * Extract the color index from a className with `*N` suffix.
	 *
	 * @see AS3 RoomContentLoader.getObjectColorIndex() lines 909-919
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getObjectColorIndex()
    private getObjectColorIndex(className: string | null): number
    {
        if(className === null)
        {
            return -1;
        }

        const starIndex = className.indexOf('*');

        if(starIndex >= 0)
        {
            return parseInt(className.substring(starIndex + 1), 10) || 0;
        }

        return 0;
    }

    /**
	 * Get the revision number for a content type.
	 *
	 * @see AS3 RoomContentLoader.getObjectRevision() lines 921-931
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getObjectRevision()
    private getObjectRevision(type: string): number
    {
        const category = this.getObjectCategory(type);

        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE || category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            if(type.indexOf('poster') === 0)
            {
                type = 'poster';
            }

            return this._revisions.get(type) ?? 0;
        }

        return 0;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getObjectContentURLs()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getObjectContentURLs()
    private getObjectContentURLs(type: string, param: string | null = null, icon: boolean = false): string[]
    {
        const contentType = this.getContentType(type);

        switch(contentType)
        {
            case RoomContentLoader.PLACE_HOLDER_FURNITURE:
                return [this.resolveLocalOrAssetBaseUrl('PlaceHolderFurniture.nitro')];
            case RoomContentLoader.PLACE_HOLDER_WALL_ITEM:
                return [this.resolveLocalOrAssetBaseUrl('PlaceHolderWallItem.nitro')];
            case RoomContentLoader.PLACE_HOLDER_PET:
                return [this.resolveLocalOrAssetBaseUrl('PlaceHolderPet.nitro')];
            case RoomContentLoader.ROOM_CONTENT:
                return [this.resolveLocalOrAssetBaseUrl('HabboRoomContent.nitro')];
            case RoomContentLoader.TILE_CURSOR:
                return [this.resolveLocalOrAssetBaseUrl('TileCursor.nitro')];
            case RoomContentLoader.SELECTION_ARROW:
                return [this.resolveLocalOrAssetBaseUrl('SelectionArrow.nitro')];
            default:
            {
                const category = this.getObjectCategory(contentType);

                if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE || category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
                {
                    const alias = this.getRoomObjectAlias(contentType);
                    let name = icon ? this._furnitureIconDownloadNameTemplate : this._furnitureDownloadNameTemplate;
                    name = name.replace(/%typeid%/g, alias);
                    name = name.replace(/%revision%/g, String(this.getObjectRevision(contentType)));

                    if(icon)
                    {
                        const hasIndexedParam = param !== null && param !== '' && this._activeObjectTypeIds.has(`${type}*${param}`);
                        name = name.replace(/%param%/g, hasIndexedParam ? `_${param}` : '');
                    }

                    return [this._furnitureDownloadUrl + name];
                }

                if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
                {
                    let name = this._petDownloadUrl + this._petDownloadNameTemplate;
                    name = name.replace(/%type%/g, contentType);

                    return [name];
                }
            }
        }

        return [];
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::resolveLocalOrAssetBaseUrl()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::resolveLocalOrAssetBaseUrl()
    private resolveLocalOrAssetBaseUrl(fileName: string): string
    {
        return this._petDownloadUrl + fileName;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::loadObjectContent()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::loadObjectContent()
    private async loadObjectContentFromUrls(type: string, urls: string[], events: EventEmitter, assetLibrary: IAssetLibrary): Promise<void>
    {
        await new Promise<void>((resolve) =>
        {
            let remaining = urls.length;
            let failed = false;

            for(const url of urls)
            {
                // loadAssetFromFile() throws synchronously (rather than emitting an ERROR event) when
                // the shared asset library already has an asset registered under `type` - this is not
                // an AS3 code path (AS3 gives each content type its own AssetLibraryCollection, so the
                // name can never collide), but a synchronous throw here would otherwise reject this
                // promise with nothing ever catching it, permanently leaving `type` stuck in
                // _loadingTypes with no graphic asset collection. Route it through the same
                // onContentLoadError()/CONTENT_LOAD_FAILURE path the async loader ERROR event already
                // uses below, instead of letting it surface as an unhandled rejection - matching the
                // same try/catch this file already uses around loadThumbnailContent()'s loadAssetFromFile().
                try
                {
                    const loader = assetLibrary.loadAssetFromFile(type, url);

                    loader.events.on('event', (event: AssetLoaderEvent) =>
                    {
                        if(event.type === AssetLoaderEventType.COMPLETE)
                        {
                            remaining--;

                            if(remaining === 0 && !failed)
                            {
                                this.processLoadedLibrary(type);
                                resolve();
                            }
                        }
                        else if(event.type === AssetLoaderEventType.ERROR)
                        {
                            failed = true;
                            this.onContentLoadError(type, url);
                            this._loadingTypes.delete(type);
                            events.emit(RoomContentLoadedEvent.CONTENT_LOAD_FAILURE, type);
                            resolve();
                        }
                    });
                }
                catch (error)
                {
                    failed = true;
                    log.error(`Failed to load asset content for ${type} at ${url}`, error);
                    this.onContentLoadError(type, url);
                    this._loadingTypes.delete(type);
                    events.emit(RoomContentLoadedEvent.CONTENT_LOAD_FAILURE, type);
                    resolve();
                }
            }
        });
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::onContentLoadError()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::onContentLoadError()
    private onContentLoadError(type: string, failedUrl: string): void
    {
        const placeHolderTypes = this.getPlaceHolderTypes();

        for(const placeHolderType of placeHolderTypes)
        {
            const urls = this.getObjectContentURLs(placeHolderType);

            if(urls.length > 0 && failedUrl !== '' && failedUrl.indexOf(urls[0]) === 0)
            {
                throw new Error(`Failed to load critical room content asset: ${failedUrl}`);
            }
        }

        log.warn(`Failed to load content asset ${type}: ${failedUrl}`);
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::processLoadedLibrary()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::processLoadedLibrary()
    private processLoadedLibrary(type: string): void
    {
        const contentType = this.getRoomObjectOriginalName(type);

        // The collection addAssetLibraryCollection() made for this type, fetched by the key *it*
        // used - the content type, before getRoomObjectOriginalName() is applied. AS3 has no lookup
        // here at all: its onContentLoaded() is handed the collection by the event and passes it
        // straight in. Re-keying it under the original name below is what keeps getAssetLibrary(),
        // which resolves aliases, able to find it afterwards.
        const assetLibrary = this._assetLibraries.get(this.getAssetLibraryName(this.getContentType(type))) ?? null;
        let success = false;

        if(assetLibrary !== null)
        {
            this._assetLibraries.set(this.getAssetLibraryName(contentType), assetLibrary);
            this.registerContentData(contentType, assetLibrary, type);
            success = this.initializeGraphicAssetCollection(contentType, assetLibrary);
        }

        if(success && this._petTypeIds.has(contentType))
        {
            this.extractPetDataFromLoadedContent(contentType);
        }

        const dispatcher = this.getAssetLibraryEventDispatcher(contentType, true);

        if(dispatcher !== null)
        {
            dispatcher.emit(
                success ? RoomContentLoadedEvent.CONTENT_LOAD_SUCCESS : RoomContentLoadedEvent.CONTENT_LOAD_FAILURE,
                contentType
            );
        }

        if(success)
        {
            this._loadedTypes.set(contentType, true);
        }

        this._loadingTypes.delete(contentType);
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::extractPetDataFromLoadedContent()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::extractPetDataFromLoadedContent()
    private extractPetDataFromLoadedContent(type: string): void
    {
        const petTypeId = this._petTypeIds.get(type);

        if(petTypeId === undefined)
        {
            return;
        }

        const collection = this.getGraphicAssetCollection(type);

        if(collection !== null && this._petColors !== null)
        {
            const colorMap = new Map<number | string, PetColorResult>();
            const paletteNames = collection.getPaletteNames();

            for(const paletteName of paletteNames)
            {
                const paletteColors = collection.getPaletteColors(paletteName);

                if(paletteColors !== null && paletteColors.length >= 2)
                {
                    const paletteXML = collection.getPaletteXML(paletteName);
                    const breed = paletteXML !== null ? this.getNumber(paletteXML, 'breed', 0) : 0;
                    const colorTag = paletteXML !== null ? this.getNumber(paletteXML, 'colortag', -1, 'colorTag') : -1;
                    const tagsValue = paletteXML !== null ? this.getString(paletteXML, 'tags') : null;
                    const layerTags = tagsValue !== null ? tagsValue.split(',') : [];
                    const isMaster = paletteXML !== null ? this.getBoolean(paletteXML, 'master', false) : false;

                    colorMap.set(
                        paletteName,
                        new PetColorResult(paletteColors[0], paletteColors[1], breed, colorTag, paletteName, isMaster, layerTags)
                    );
                }
            }

            this._petColors.set(petTypeId, colorMap);
        }

        const visualizationXML = this.getVisualizationXML(type);

        if(visualizationXML !== null && this._petLayers !== null)
        {
            const sizeMap = new Map<string, Map<string, number>>();

            for(const visualization of this.getVisualizationDefinitions(visualizationXML))
            {
                const tagMap = new Map<string, number>();
                const layers = this.getLayerDefinitions(visualization['layers'] ?? visualization['layer'] ?? null);

                for(const [layerId, layerDef] of layers)
                {
                    const tag = this.getString(layerDef, 'tag');

                    if(tag !== null)
                    {
                        tagMap.set(tag, layerId);
                    }
                }

                const size = this.getString(visualization, 'size') ?? String(this.getNumber(visualization, 'size', 64));
                sizeMap.set(size, tagMap);
            }

            this._petLayers.set(petTypeId, sizeMap);
        }
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::initializeGraphicAssetCollection()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::initializeGraphicAssetCollection()
    private initializeGraphicAssetCollection(type: string, assetLibrary: IAssetLibrary): boolean
    {
        if(type === null || assetLibrary === null)
        {
            return false;
        }

        const collection = this.createGraphicAssetCollection(type, assetLibrary);

        if(collection !== null)
        {
            const assetXML = this.getAssetXML(type);

            if(assetXML !== null && this.defineGraphicAssetCollection(collection, type, assetLibrary, assetXML))
            {
                return true;
            }

            this.disposeGraphicAssetCollection(type);
        }

        return false;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::extractObjectContent()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::extractObjectContent()
    extractObjectContent(sourceType: string, targetType: string): boolean
    {
        const assetLibrary = this.getAssetLibrary(sourceType);

        if(assetLibrary === null)
        {
            return false;
        }

        this._additionalObjectTypeLibraries.set(targetType, sourceType);

        if(this.initializeGraphicAssetCollection(targetType, assetLibrary))
        {
            return true;
        }

        this._additionalObjectTypeLibraries.delete(targetType);

        return false;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getAssetLibraryName()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getAssetLibraryName()
    private getAssetLibraryName(type: string): string
    {
        return RoomContentLoader.ASSET_LIBRARY_NAME_PREFIX + type;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getAssetLibrary()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getAssetLibrary()
    private getAssetLibrary(type: string): IAssetLibrary | null
    {
        let contentType = this.getContentType(type);
        contentType = this.getRoomObjectOriginalName(contentType);
        let assetLibrary = this._assetLibraries.get(this.getAssetLibraryName(contentType)) ?? null;

        if(assetLibrary === null)
        {
            const sourceType = this._additionalObjectTypeLibraries.get(contentType) ?? null;

            if(sourceType !== null)
            {
                contentType = this.getContentType(sourceType);
                assetLibrary = this._assetLibraries.get(this.getAssetLibraryName(contentType)) ?? null;
            }
        }

        return assetLibrary;
    }

    // DEVIATION: this is `getAssetXML()` returning the asset instead of the XML inside it. AS3 does
    //   the identical lookup — `getXML()` calls the same private `getAssetLibrary(type)` and pulls
    //   the asset out of it — and can stop at the XML because in Flash the room's textures arrive
    //   separately, as BitmapDataAssets off the component's own library. A .nitro bundle carries the
    //   `roomVisualization` JSON *and* its textures in one asset, and `onRoomContentReady()` needs
    //   both, so it needs the asset. `getAssetXML()` (l.967) stays as it is and still serves every
    //   caller that only wants the `_assets` slice.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_2288.as::getAssetXML()
    getAssetByName(type: string): IAsset | null
    {
        return this.getAssetLibrary(type)?.getAssetByName(type) ?? null;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::addAssetLibraryCollection()
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_2288.as::addAssetLibraryCollection()
    private addAssetLibraryCollection(type: string, events: EventEmitter | null): IAssetLibrary | null
    {
        const contentType = this.getContentType(type);
        const existing = this.getAssetLibrary(type);

        if(existing !== null)
        {
            return existing;
        }

        const libraryName = this.getAssetLibraryName(contentType);

        // AS3: `_loc3_ = new AssetLibraryCollection(_loc4_)` — one collection per content type.
        // That is the whole reason a content type's asset name can never collide with another's:
        // AssetLibraryCollection routes loadAssetFromFile() into its own private `bin` library, so
        // `room`, `tile_cursor` and every furni class each register into a library of their own.
        //
        // This port used to store the one shared `_assetLibrary` under every key instead. The names
        // then shared a single namespace, and since the write path keys `_assetLibraries` on the
        // content type while the read path (getAssetLibrary) keys on getRoomObjectOriginalName() of
        // it, an alias landing in `_objectOriginalNames` between two loads made the lookup miss a
        // library that was in fact still holding the asset. The reload then hit AssetLibrary's
        // `Asset with name X already exists` throw, which onContentLoadError() turns into
        // "Failed to load critical room content asset" for any place-holder type.
        //
        // AS3's constructor takes the name alone; this one also needs the context because
        // AssetLibraryCollection extends Component here where AS3 extends EventDispatcherWrapper.
        const collection: IAssetLibrary = new AssetLibraryCollection(libraryName);

        this._assetLibraries.set(libraryName, collection);

        if(events !== null && this.getAssetLibraryEventDispatcher(type) === null)
        {
            this._assetLibraryEventDispatchers.set(contentType, events);
        }

        return collection;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getAssetLibraryEventDispatcher()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getAssetLibraryEventDispatcher()
    private getAssetLibraryEventDispatcher(type: string, remove: boolean = false): EventEmitter | null
    {
        const contentType = this.getContentType(type);
        const dispatcher = this._assetLibraryEventDispatchers.get(contentType) ?? null;

        if(remove && dispatcher !== null)
        {
            this._assetLibraryEventDispatchers.delete(contentType);
        }

        return dispatcher;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getAssetLibraryType()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getAssetLibraryType()
    private getAssetLibraryType(assetLibrary: IAssetLibrary): string | null
    {
        const indexAsset = assetLibrary.getAssetByName('index');
        const indexData = this.asRecord(indexAsset?.content ?? null);

        if(indexData === null)
        {
            return null;
        }

        return this.getString(indexData, 'type');
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::getXML()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::getXML()
    private getXML(type: string, suffix: string): RoomContentData | null
    {
        const assetLibrary = this.getAssetLibrary(type);

        if(assetLibrary === null)
        {
            return null;
        }

        const contentType = this.getContentType(type);
        const alias = this.getRoomObjectAlias(contentType);
        const asset = assetLibrary.getAssetByName(alias + suffix);
        const assetData = this.asRecord(asset?.content ?? null);

        if(assetData !== null)
        {
            return assetData;
        }

        const data = this._contentData.get(contentType) ?? null;

        if(data === null)
        {
            return null;
        }

        switch(suffix)
        {
            case '_visualization':
                return this.hasVisualizationData(data) ? data : null;
            case '_assets':
                return this.hasAssetData(data) ? data : null;
            case '_logic':
                return this.hasLogicData(data) ? data : null;
            default:
                return null;
        }
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::hasXML()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::hasXML()
    private hasXML(type: string, suffix: string): boolean
    {
        return this.getXML(type, suffix) !== null;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::createGraphicAssetCollection()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::createGraphicAssetCollection()
    private createGraphicAssetCollection(type: string, assetLibrary: IAssetLibrary): IGraphicAssetCollection | null
    {
        const existing = this.getGraphicAssetCollection(type);

        if(existing !== null)
        {
            return existing;
        }

        if(assetLibrary === null || this._visualizationFactory === null)
        {
            return null;
        }

        const collection = this._visualizationFactory.createGraphicAssetCollection();
        this._graphicAssetCollections.set(type, collection);

        return collection;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::disposeGraphicAssetCollection()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::disposeGraphicAssetCollection()
    private disposeGraphicAssetCollection(type: string): boolean
    {
        const contentType = this.getContentType(type);
        const collection = this._graphicAssetCollections.get(contentType) ?? null;

        if(collection !== null)
        {
            this._graphicAssetCollections.delete(contentType);
            collection.dispose();

            return true;
        }

        return false;
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::compressAssets()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::compressAssets()
    compressAssets(): void
    {
        for(const key of this._graphicAssetCollections.keys())
        {
            if(RoomContentLoader.PLACE_HOLDER_TYPES_GPU.has(key))
            {
                continue;
            }
        }

        this._lastAssetCompressionTime = Date.now();
    }

    /**
	 * @see sources/win63_version/habbo/room/class_1835.as::purge()
	 */
    // AS3: sources/win63_version/habbo/room/class_1835.as::purge()
    purge(): void
    {
        if(this._disposed)
        {
            return;
        }

        const now = Date.now();

        for(const [contentType, collection] of Array.from(this._graphicAssetCollections.entries()))
        {
            if(RoomContentLoader.PLACE_HOLDER_TYPES_GPU.has(contentType))
            {
                continue;
            }

            if(collection.getReferenceCount() < 1 && now - collection.getLastReferenceTimestamp() >= RoomContentLoader.CONTENT_DROP_DELAY)
            {
                this._graphicAssetCollections.delete(contentType);
                collection.dispose();

                const libraryName = this.getAssetLibraryName(contentType);
                const assetLibrary = this._assetLibraries.get(libraryName) ?? null;

                // AS3: `_libraries.remove(_loc2_); _loc3_.dispose();` - unconditional, because
                // _libraries holds a dedicated AssetLibraryCollection per content type and disposing
                // one can never touch another's assets. The port had to guard this while every key
                // pointed at one shared library; now that addAssetLibraryCollection() builds a
                // collection per type, the guard is gone and the entry and its library are dropped
                // together, which is what keeps getAssetLibrary() in step with what is really still
                // registered - the desync behind the "tile_cursor already exists" crash.
                if(assetLibrary !== null)
                {
                    this._assetLibraries.delete(libraryName);
                    assetLibrary.dispose();
                }
            }
        }
    }

    private registerContentData(contentType: string, assetLibrary: IAssetLibrary, assetName: string = contentType): void
    {
        const asset = assetLibrary.getAssetByName(assetName) ?? assetLibrary.getAssetByName(contentType);
        const data = this.asRecord(asset?.content ?? null);

        if(data !== null)
        {
            this._contentData.set(contentType, data);
        }
    }

    private defineGraphicAssetCollection(collection: IGraphicAssetCollection, type: string, assetLibrary: IAssetLibrary, data: RoomContentData): boolean
    {
        const asset = (
            assetLibrary.getAssetByName(type) ??
			assetLibrary.getAssetByName(this.getRoomObjectAlias(type)) ??
			assetLibrary.getAssetByName(this.getRoomObjectOriginalName(type))
        ) as NitroAsset | null;
        const assetDefinitions = data['assets'] ?? data['asset'] ?? null;

        if(asset !== null && asset.textures.size > 0 && assetDefinitions !== null && 'defineFromSpritesheet' in collection)
        {
            const libraryName = this.getString(data, 'name') ?? type;
            // This branch returns without ever calling collection.define(), which is where palettes
            // are parsed - so they have to be handed over here or a .nitro library ends up with all
            // of its sprites and none of its palettes (greyscale pets).
            const palettes = (data['palettes'] ?? data['palette'] ?? null) as Record<string, Record<string, unknown>> | null;

            (collection as IGraphicAssetCollection & {
                defineFromSpritesheet(
                    textures: Map<string, Texture>,
                    assetData: unknown,
                    libraryName: string,
                    palettes: Record<string, Record<string, unknown>> | null
                ): void;
            }).defineFromSpritesheet(asset.textures, assetDefinitions, libraryName, palettes);

            return true;
        }

        return collection.define(data);
    }

    private getIndexData(type: string): RoomContentData | null
    {
        const assetLibrary = this.getAssetLibrary(type);

        if(assetLibrary === null)
        {
            return null;
        }

        const contentType = this.getContentType(type);
        const indexAsset = assetLibrary.getAssetByName(contentType + '_index') ?? assetLibrary.getAssetByName('index');
        const indexData = this.asRecord(indexAsset?.content ?? null);

        if(indexData !== null)
        {
            return indexData;
        }

        return this._contentData.get(contentType) ?? null;
    }

    private hasVisualizationData(data: RoomContentData): boolean
    {
        // `roomVisualization` is the room bundle's (HabboRoomContent.nitro) key — the
        // Nitro equivalent of AS3's room_visualization XML. Without it here,
        // hasVisualizationXML("room") returned false even though the room's
        // visualization data is present, which broke RoomManager's content guards.
        return data['visualizations'] !== undefined
            || data['visualization'] !== undefined
            || data['graphics'] !== undefined
            || data['roomVisualization'] !== undefined;
    }

    private hasAssetData(data: RoomContentData): boolean
    {
        return data['assets'] !== undefined || data['asset'] !== undefined;
    }

    private hasLogicData(data: RoomContentData): boolean
    {
        return data['logic'] !== undefined || data['logicType'] !== undefined || data['logic_type'] !== undefined;
    }

    private getVisualizationDefinitions(data: RoomContentData): RoomContentData[]
    {
        const direct = data['visualizations'] ?? data['visualization'] ?? null;
        const graphics = this.asRecord(data['graphics'] ?? null);
        const graphicsVisualizations = graphics !== null ? graphics['visualizations'] ?? graphics['visualization'] ?? null : null;
        const source = direct ?? graphicsVisualizations ?? data;

        if(Array.isArray(source))
        {
            return source.filter((value): value is RoomContentData => this.isVisualizationDefinition(value));
        }

        const sourceRecord = this.asRecord(source);

        if(sourceRecord === null)
        {
            return [];
        }

        if(this.isVisualizationDefinition(sourceRecord))
        {
            return [sourceRecord];
        }

        const visualizations: RoomContentData[] = [];

        for(const value of Object.values(sourceRecord))
        {
            if(this.isVisualizationDefinition(value))
            {
                visualizations.push(value);
            }
        }

        return visualizations;
    }

    private isVisualizationDefinition(value: unknown): value is RoomContentData
    {
        const record = this.asRecord(value);

        return record !== null && (
            record['size'] !== undefined ||
			record['layerCount'] !== undefined ||
			record['layer_count'] !== undefined ||
			record['layers'] !== undefined ||
			record['layer'] !== undefined
        );
    }

    private getLayerDefinitions(data: unknown): Array<[number, RoomContentData]>
    {
        const source = this.unwrapContainer(data, 'layer');
        const definitions: Array<[number, RoomContentData]> = [];

        if(Array.isArray(source))
        {
            for(const value of source)
            {
                const layerDef = this.asRecord(value);

                if(layerDef === null)
                {
                    continue;
                }

                const id = this.getNumber(layerDef, 'id', NaN);

                if(!Number.isNaN(id))
                {
                    definitions.push([id, layerDef]);
                }
            }

            return definitions;
        }

        const sourceRecord = this.asRecord(source);

        if(sourceRecord === null)
        {
            return definitions;
        }

        const directId = this.getNumber(sourceRecord, 'id', NaN);

        if(!Number.isNaN(directId))
        {
            definitions.push([directId, sourceRecord]);

            return definitions;
        }

        for(const idStr in sourceRecord)
        {
            const layerDef = this.asRecord(sourceRecord[idStr]);

            if(layerDef === null)
            {
                continue;
            }

            const indexedId = Number(idStr);
            const id = this.getNumber(layerDef, 'id', indexedId);

            if(!Number.isNaN(id))
            {
                definitions.push([id, layerDef]);
            }
        }

        return definitions;
    }

    private unwrapContainer(value: unknown, key: string): unknown
    {
        const record = this.asRecord(value);

        if(record !== null)
        {
            const direct = record[key];

            if(direct !== undefined && direct !== null)
            {
                return direct;
            }

            const plural = record[`${key}s`];

            if(plural !== undefined && plural !== null)
            {
                return plural;
            }
        }

        return value;
    }

    private getNumber(data: RoomContentData, key: string, defaultValue: number, alternateKey: string | null = null): number
    {
        let value = data[key];

        if((value === null || value === undefined) && alternateKey !== null)
        {
            value = data[alternateKey];
        }

        if(typeof value === 'number')
        {
            return value;
        }

        if(typeof value === 'string' && value.length > 0)
        {
            const parsed = Number(value);

            if(!Number.isNaN(parsed))
            {
                return parsed;
            }
        }

        return defaultValue;
    }

    private getBoolean(data: RoomContentData, key: string, defaultValue: boolean): boolean
    {
        const value = data[key];

        if(typeof value === 'boolean')
        {
            return value;
        }

        if(typeof value === 'number')
        {
            return value !== 0;
        }

        if(typeof value === 'string')
        {
            return value.toLowerCase() === 'true' || value === '1';
        }

        return defaultValue;
    }

    private asRecord(value: unknown): RoomContentData | null
    {
        if(value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value))
        {
            return value as RoomContentData;
        }

        return null;
    }

    private getString(data: RoomContentData, ...keys: string[]): string | null
    {
        for(const key of keys)
        {
            const value = data[key];

            if(typeof value === 'string' && value.length > 0)
            {
                return value;
            }
        }

        return null;
    }
}
