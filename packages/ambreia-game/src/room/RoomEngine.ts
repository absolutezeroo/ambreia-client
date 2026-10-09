/**
 * RoomEngine
 *
 * Based on AS3: com.sulake.habbo.room.RoomEngine
 *
 * Main room engine implementation. Orchestrates room rendering,
 * object management, and event handling.
 *
 * IMPORTANT: RoomEngine depends on IRoomManager for room instance management.
 * It does NOT manage rooms directly - that's RoomManager's responsibility.
 */
import type {Container, Renderer, Ticker} from 'pixi.js';
import {Sprite, Texture} from 'pixi.js';
import {Component, ComponentDependency, type IContext, type IUpdateReceiver} from '../core/runtime/index';
import {extractCanvas} from '@ambreia/iso/renderer/TextureExtractor';
import {createRoomRegistries} from '@ambreia/iso/object/createRoomRegistries';
import {DEFAULT_ROOM_MODULES} from '@ambreia/iso/defaultRoomModules';
import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IRoomEngine} from './IRoomEngine';
import {RoomAreaSelectionManager} from './utils/RoomAreaSelectionManager';
import type {IRoomCreator} from './IRoomCreator';
import type {IRoomEngineServices} from './IRoomEngineServices';
import type {IRoomContentDirectories} from '@ambreia/iso/scene/IRoomContentDirectories';
import type {IRoomInstance} from '@ambreia/iso/IRoomInstance';
import type {IRoomManager} from '@ambreia/iso/IRoomManager';
import type {IRoomManagerListener} from '@ambreia/iso/IRoomManagerListener';
import type {IRoomObject} from '@ambreia/iso/object/IRoomObject';
import type {IRoomObjectController} from '@ambreia/iso/object/IRoomObjectController';
import type {IRoomObjectEventHandler} from '@ambreia/iso/object/logic/IRoomObjectEventHandler';
import type {IRoomObjectSpriteVisualization} from '@ambreia/iso/object/visualization/IRoomObjectSpriteVisualization';
import type {IRoomRenderer} from '@ambreia/iso/renderer/IRoomRenderer';
import type {IRoomRendererFactory} from '@ambreia/iso/renderer/IRoomRendererFactory';
import type {IRoomRenderingCanvasMouseListener} from '@ambreia/iso/renderer/IRoomRenderingCanvasMouseListener';
import type {RoomSpriteMouseEvent} from '@ambreia/iso/events/RoomSpriteMouseEvent';
import type {IRoomGeometry} from '@ambreia/iso/utils/IRoomGeometry';
import {RoomGeometry} from '@ambreia/iso/utils/RoomGeometry';
import {IID_RoomManager} from '../iid/IIDRoomManager';
import {IID_RoomRendererFactory} from '../iid/IIDRoomRendererFactory';
import {IID_RoomSessionManager} from '../iid/IIDRoomSessionManager';
import type {IRoomSessionManager} from '../session/IRoomSessionManager';
import type {IRoomSession} from '../session/IRoomSession';
import {RoomObjectCategoryEnum} from '@ambreia/iso/scene/object/RoomObjectCategoryEnum';
import {RoomObjectOperationEnum} from '@ambreia/iso/scene/object/RoomObjectOperationEnum';
import {RoomObjectAvatarSelectedMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarSelectedMessage';
import {RoomObjectAvatarTargetUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarTargetUpdateMessage';
import {RoomObjectSelectedMessage} from '@ambreia/iso/scene/messages/RoomObjectSelectedMessage';
import {RoomObjectVisibilityUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectVisibilityUpdateMessage';
import {LookToMessageComposer} from '@ambreia/protocol/outgoing/room/avatar/LookToMessageComposer';
import {getUserTypeName, RoomObjectUserTypes} from '@ambreia/iso/scene/object/RoomObjectUserTypes';
import {RoomObjectVariableEnum} from '@ambreia/iso/scene/object/RoomObjectVariableEnum';
import {StuffDataFactory} from '@ambreia/iso/scene/object/data/StuffDataFactory';
import {RoomEngineEvent} from '@ambreia/iso/scene/events/RoomEngineEvent';
import {RoomEngineObjectEvent} from '@ambreia/iso/scene/events/RoomEngineObjectEvent';
import {RoomEngineDragWithMouseEvent} from '@ambreia/iso/scene/events/RoomEngineDragWithMouseEvent';
import {RoomEngineUseProductEvent} from '@ambreia/iso/scene/events/RoomEngineUseProductEvent';
import {RoomObjectFactory} from '@ambreia/iso/scene/RoomObjectFactory';
import {RoomVariableEnum} from '@ambreia/iso/scene/RoomVariableEnum';
import {RoomObjectVisualizationFactory} from '@ambreia/iso/scene/object/RoomObjectVisualizationFactory';
import type {IRoomObjectVisualizationFactory} from '@ambreia/iso/object/IRoomObjectVisualizationFactory';
import type {RoomRenderingCanvas} from '@ambreia/iso/scene/renderer/RoomRenderingCanvas';
import type {IStuffData} from '@ambreia/iso/scene/object/data/IStuffData';
import type {IGetImageListener} from '@ambreia/iso/scene/IGetImageListener';
import {ImageResult} from '@ambreia/iso/scene/ImageResult';
import type {ISelectedRoomObjectData} from '@ambreia/iso/scene/ISelectedRoomObjectData';

// Messages
import {RoomObjectMoveUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectMoveUpdateMessage';
import {RoomObjectAvatarUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarUpdateMessage';
import {RoomObjectAvatarFigureUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarFigureUpdateMessage';
import {RoomObjectAvatarPostureUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarPostureUpdateMessage';
import {RoomObjectAvatarGestureUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarGestureUpdateMessage';
import {RoomObjectAvatarBlockedUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarBlockedUpdateMessage';
import {RoomObjectHeightUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectHeightUpdateMessage';
import {RoomObjectAvatarFlatControlUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarFlatControlUpdateMessage';
import {RoomObjectAvatarPetGestureUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarPetGestureUpdateMessage';
import {RoomObjectAvatarEffectUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarEffectUpdateMessage';
import {RoomObjectAvatarChatUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarChatUpdateMessage';
import {RoomObjectAvatarTypingUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarTypingUpdateMessage';
import {RoomObjectAvatarDanceUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarDanceUpdateMessage';
import {RoomObjectAvatarSleepUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarSleepUpdateMessage';
import {RoomObjectAvatarMutedUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarMutedUpdateMessage';
import {RoomObjectAvatarUseObjectUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarUseObjectUpdateMessage';
import {RoomObjectAvatarExperienceUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarExperienceUpdateMessage';
import {RoomObjectAvatarPlayerValueUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarPlayerValueUpdateMessage';
import {RoomObjectAvatarExpressionUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarExpressionUpdateMessage';
import {RoomObjectAvatarGuideStatusUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarGuideStatusUpdateMessage';
import {RoomObjectAvatarCarryObjectUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarCarryObjectUpdateMessage';
import {RoomObjectAvatarSignUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarSignUpdateMessage';
import {RoomObjectAvatarOwnMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarOwnMessage';
import type {IVector3d} from '@ambreia/iso/utils/IVector3d';
import {Vector3d} from '@ambreia/iso/utils/Vector3d';
import {RoomCamera} from '@ambreia/iso/scene/utils/RoomCamera';
import type {FurniStackingHeightMap} from '@ambreia/iso/scene/utils/FurniStackingHeightMap';
import {PetFigureData as AvatarPetFigureData, PetFigureData} from '@ambreia/avatar/pets/PetFigureData';
import type {IRoomObjectModelController} from '@ambreia/iso/object/IRoomObjectModelController';
import {SelectedRoomObjectData} from '@ambreia/iso/scene/utils/SelectedRoomObjectData';
import {TileObjectMap} from '@ambreia/iso/scene/utils/TileObjectMap';
import {LegacyWallGeometry} from '@ambreia/iso/scene/utils/LegacyWallGeometry';
import {RoomPlaneParser} from '@ambreia/iso/scene/object/RoomPlaneParser';
import {RoomData} from '@ambreia/iso/scene/utils/RoomData';
import {Logger} from "../core/index";
import {RoomVisualizationData} from '@ambreia/iso/scene/object/visualization/room/RoomVisualizationData';
import type {IAssetRoomVisualizationData} from '@ambreia/iso/scene/object/visualization/room/rasterizer/basic/PlaneRasterizerTypes';
import type {NitroAsset} from '@ambreia/common/assets/NitroAsset';
import {IID_HabboConfigurationManager} from '../iid/IIDHabboConfigurationManager';
import {IID_HabboWindowManager} from '../iid/IIDHabboWindowManager';
import type {IHabboWindowManager} from '../window/IHabboWindowManager';
import type {IHabboConfigurationManager} from '../configuration/IHabboConfigurationManager';
import {IID_SessionDataManager} from '../iid/IIDSessionDataManager';
import type {ISessionDataManager} from '../session/ISessionDataManager';
import {IID_AvatarRenderManager} from '../iid/IIDAvatarRenderManager';
import type {IAvatarRenderManager} from '@ambreia/avatar/IAvatarRenderManager';
import {BadgeImageReadyEvent} from '../session/events/BadgeImageReadyEvent';
import {RoomObjectGroupBadgeUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectGroupBadgeUpdateMessage';
import {RoomObjectRoomAdEvent} from '@ambreia/iso/scene/events/RoomObjectRoomAdEvent';
import {RoomObjectBadgeAssetEvent} from '@ambreia/iso/scene/events/RoomObjectBadgeAssetEvent';
import {RoomObjectDimmerStateUpdateEvent} from '@ambreia/iso/scene/events/RoomObjectDimmerStateUpdateEvent';
import {RoomEngineDimmerStateEvent} from '@ambreia/iso/scene/events/RoomEngineDimmerStateEvent';
import {RoomObjectFurniIconAssetEvent} from '@ambreia/iso/scene/events/RoomObjectFurniIconAssetEvent';
import {RoomObjectFurniIconUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectFurniIconUpdateMessage';
import {FurniIconImageReadyEvent} from '../session/events/FurniIconImageReadyEvent';
import {RoomEngineRoomAdEvent} from '@ambreia/iso/scene/events/RoomEngineRoomAdEvent';
import {EventEmitter} from 'eventemitter3';
import {RoomContentLoader} from '@ambreia/iso/scene/RoomContentLoader';
import type {PetColorResult} from '@ambreia/iso/scene/PetColorResult';
import {RoomContentLoadedEvent} from '@ambreia/iso/events/RoomContentLoadedEvent';
import {RoomObjectTileCursorUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectTileCursorUpdateMessage';
import {MoveAvatarMessageComposer} from '@ambreia/protocol/outgoing/room/engine/MoveAvatarMessageComposer';
import {ClickFurniMessageComposer} from '@ambreia/protocol/outgoing/room/engine/ClickFurniMessageComposer';
import {ClickCharacterComposer} from '@ambreia/protocol/outgoing/room/ClickCharacterComposer';
import {
    UseFurnitureMessageComposer
} from '@ambreia/protocol/outgoing/room/furniture/UseFurnitureMessageComposer';
import {
    PlaceObjectMessageComposer
} from '@ambreia/protocol/outgoing/room/engine/PlaceObjectMessageComposer';
import {
    SetObjectDataMessageComposer
} from '@ambreia/protocol/outgoing/room/furniture/SetObjectDataMessageComposer';
import {
    SetRandomStateMessageComposer
} from '@ambreia/protocol/outgoing/room/furniture/SetRandomStateMessageComposer';
import {
    UseWallItemMessageComposer
} from '@ambreia/protocol/outgoing/room/furniture/UseWallItemMessageComposer';
import {PlacePetComposer} from '@ambreia/protocol/outgoing/room/pet/PlacePetComposer';
import {PlaceBotMessageComposer} from '@ambreia/protocol/outgoing/room/bot/PlaceBotMessageComposer';
import {
    PlacePostItMessageComposer
} from '@ambreia/protocol/outgoing/room/engine/PlacePostItMessageComposer';
import {
    RemoveBotFromFlatMessageComposer
} from '@ambreia/protocol/outgoing/room/bot/RemoveBotFromFlatMessageComposer';
import {MoveBotMessageComposer} from '@ambreia/protocol/outgoing/room/bot/MoveBotMessageComposer';
import {MovePetMessageComposer} from '@ambreia/protocol/outgoing/room/pet/MovePetMessageComposer';
import {
    GetGuildFurniContextMenuInfoMessageComposer
} from '@ambreia/protocol/outgoing/room/furniture/GetGuildFurniContextMenuInfoMessageComposer';
import {
    GetResolutionAchievementsMessageComposer
} from '@ambreia/protocol/outgoing/quest/GetResolutionAchievementsMessageComposer';
import {MoveObjectMessageComposer} from '@ambreia/protocol/outgoing/room/engine/MoveObjectMessageComposer';
import {
    MoveWallItemMessageComposer
} from '@ambreia/protocol/outgoing/room/engine/MoveWallItemMessageComposer';
import {
    PickupObjectMessageComposer
} from '@ambreia/protocol/outgoing/room/engine/PickupObjectMessageComposer';
import {RoomEngineObjectPlacedEvent} from '@ambreia/iso/scene/events/RoomEngineObjectPlacedEvent';
import {RoomObjectRoomMaskUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectRoomMaskUpdateMessage';
import {RoomObjectModelDataUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectModelDataUpdateMessage';
import {RoomObjectDataUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectDataUpdateMessage';
import {RoomObjectItemDataUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectItemDataUpdateMessage';
import {RoomObjectRoomFloorHoleUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectRoomFloorHoleUpdateMessage';
import {RoomEngineAreaHideStateWidgetEvent} from '@ambreia/iso/scene/events/RoomEngineAreaHideStateWidgetEvent';
import {RoomObjectAvatarDirectionUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectAvatarDirectionUpdateMessage';
import {RoomObjectRoomColorUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectRoomColorUpdateMessage';
import {RoomEngineRoomColorEvent} from '@ambreia/iso/scene/events/RoomEngineRoomColorEvent';
import {LegacyStuffData} from '@ambreia/iso/scene/object/data/LegacyStuffData';
import {RoomObjectUpdateMessage} from '@ambreia/iso/messages/RoomObjectUpdateMessage';
import {RoomObjectRoomUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectRoomUpdateMessage';
import {RoomObjectRoomPlaneVisibilityUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectRoomPlaneVisibilityUpdateMessage';
import {RoomObjectRoomPlanePropertyUpdateMessage} from '@ambreia/iso/scene/messages/RoomObjectRoomPlanePropertyUpdateMessage';
import {RoomObjectTileMouseEvent} from '@ambreia/iso/scene/events/RoomObjectTileMouseEvent';
import {RoomObjectWallMouseEvent} from '@ambreia/iso/scene/events/RoomObjectWallMouseEvent';
import {RoomObjectStateChangeEvent} from '@ambreia/iso/scene/events/RoomObjectStateChangeEvent';
import {RoomObjectWidgetRequestEvent} from '@ambreia/iso/scene/events/RoomObjectWidgetRequestEvent';
import {RoomObjectFloorHoleEvent} from '@ambreia/iso/scene/events/RoomObjectFloorHoleEvent';
import {RoomObjectPlaySoundIdEvent} from '@ambreia/iso/scene/events/RoomObjectPlaySoundIdEvent';
import {RoomObjectSamplePlaybackEvent} from '@ambreia/iso/scene/events/RoomObjectSamplePlaybackEvent';
import {RoomObjectMoveEvent} from '@ambreia/iso/scene/events/RoomObjectMoveEvent';
import {RoomEngineObjectPlaySoundEvent} from '@ambreia/iso/scene/events/RoomEngineObjectPlaySoundEvent';
import {RoomEngineObjectSamplePlaybackEvent} from '@ambreia/iso/scene/events/RoomEngineObjectSamplePlaybackEvent';
import {RoomObjectDataRequestEvent} from '@ambreia/iso/scene/events/RoomObjectDataRequestEvent';
import {RoomObjectHSLColorEnableEvent} from '@ambreia/iso/scene/events/RoomObjectHSLColorEnableEvent';
import {RoomEngineHSLColorEnableEvent} from '@ambreia/iso/scene/events/RoomEngineHSLColorEnableEvent';
import {RoomObjectFurnitureActionEvent} from '@ambreia/iso/scene/events/RoomObjectFurnitureActionEvent';
import {RoomEngineToWidgetEvent} from '@ambreia/iso/scene/events/RoomEngineToWidgetEvent';
import {
    DiceOffMessageComposer,
    EnterOneWayDoorMessageComposer,
    GetItemDataMessageComposer,
    RemoveItemMessageComposer,
    SetItemDataMessageComposer,
    SpinWheelOfFortuneMessageComposer,
    ThrowDiceMessageComposer
} from '@ambreia/protocol/outgoing/room/furniture/index';
import {RoomUserData} from '@ambreia/protocol/incoming/room/engine/RoomUserData';
import {RoomObjectMouseEvent} from '@ambreia/iso/events/RoomObjectMouseEvent';
import {OrderedMap} from '@ambreia/common/utils/OrderedMap';
import {GraphicAssetCollection} from '@ambreia/common/graphics/GraphicAssetCollection';

const log = Logger.getLogger('habbo.room.RoomEngine');

interface IRoomEngineRoomInstanceData {
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::get roomCamera()
    roomCamera: RoomCamera;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::get furniStackingHeightMap()
    furniStackingHeightMap: FurniStackingHeightMap | null;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::get tileObjectMap()
    tileObjectMap: TileObjectMap | null;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::worldType
    worldType: string | null;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::get legacyGeometry()
    // AS3 constructs it eagerly in the RoomInstanceData constructor (_SafeCls_2223.as:35), so it is
    // never null for a live room — RoomMessageHandler fills its height map from the floor heightmap
    // message and the wall-item paths read it back.
    legacyGeometry: LegacyWallGeometry;
    /**
	 * AS3 wraps this in a `selectedObject` accessor pair whose setter disposes the previous value.
	 * The record holds it directly here and `resetSelectedObjectData()` does the disposing, which
	 * is the only place AS3's setter is reached from either.
	 */
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::get selectedObject()
    selectedObjectData: SelectedRoomObjectData | null;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::get placedObject()
    placedObjectData: SelectedRoomObjectData | null;
    /**
	 * AS3 keeps this on RoomInstanceData behind `addButtonMouseCursorOwner()`,
	 * `removeButtonMouseCursorOwner()` and `hasButtonMouseCursorOwners()` — three one-line array
	 * operations. This port models RoomInstanceData as a plain record (see the fields above), so
	 * those three fold into RoomEngine's own helpers of the same name, which is where AS3 calls
	 * them from anyway.
	 */
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::get mouseButtonCursorOwners()
    mouseButtonCursorOwners: string[];

    /**
	 * Furniture the server has announced but which has not been built yet.
	 *
	 * `addObjectFurniture()` pushes here rather than creating: a room with three hundred items
	 * would otherwise build all three hundred inside one message handler. `createRoomFurniture()`
	 * drains it a few at a time, on a frame budget.
	 *
	 * DEVIATION: AS3 holds these in a keyed collection, and its `getFurnitureData()`/
	 *   `getWallItemData()` no-arg accessors are *takes* — each removes the entry it returns. A
	 *   plain array shifted from the front is the same queue with the same take semantics, and
	 *   the id key buys nothing for the drain.
	 *
	 *   It does buy something for *removal*, which is why the by-id take is ported and not
	 *   deviated away: `disposeObjectFurniture()`/`disposeObjectWallItem()` call
	 *   `getFurnitureDataWithId()`/`getWallItemDataWithId()` and discard the result, purely to
	 *   drop an entry the drain has not reached yet. See both methods below.
	 */
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::addFurnitureData()
    furnitureQueue: IPendingFurnitureData[];

    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2223.as::addWallItemData()
    wallItemQueue: IPendingWallItemData[];
}

/**
 * One queued floor item, holding exactly the arguments `addObjectFurniture()` was handed.
 */
// AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as
export interface IPendingFurnitureData {
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get id()
    id: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get typeId()
    typeId: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get className()
    className: string | null;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get location()
    location: IVector3d;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get direction()
    direction: IVector3d;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get state()
    state: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get data()
    data: IStuffData | null;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get extra()
    extra: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get expiryTime()
    expiryTime: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get usagePolicy()
    usagePolicy: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get ownerId()
    ownerId: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get ownerName()
    ownerName: string;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get synchronized()
    synchronized: boolean;
}

/** TS-only (RPG F3c §16): the RP actions played as Habbo expressions (AvatarAction.getExpressionTime() ids). */
const RPG_EXPRESSIONS: Readonly<Record<string, number>> = {wave: 1, laugh: 3, sad: 4, clap: 7};
/** Habbo's « surprised » face (AvatarAction.GESTURE_SURPRISED). */
const RPG_SURPRISED_GESTURE = 3;

/**
 * One queued wall item. Its `data` is a string where the floor item's is an `IStuffData` — the
 * wall message carries the legacy blob, not a parsed one.
 */
// AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as
export interface IPendingWallItemData {
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get id()
    id: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get typeId()
    typeId: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get location()
    location: IVector3d;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get direction()
    direction: IVector3d;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get state()
    state: number;
    // DEVIATION: the wall message carries the legacy blob rather than a parsed IStuffData, so
    //   this is a string where the floor item's `data` is an object.
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get data()
    data: string;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get usagePolicy()
    usagePolicy: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get ownerId()
    ownerId: number;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get ownerName()
    ownerName: string;
    // AS3: .../src/com/sulake/habbo/room/utils/_SafeCls_2114.as::get expiryTime()
    secondsToExpiration: number;
}

export interface IRoomEngineRectangle {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

export class RoomEngine extends Component implements IRoomEngine,
    IRoomManagerListener,
    IRoomCreator,
    IRoomEngineServices,
    IUpdateReceiver,
    IRoomRenderingCanvasMouseListener 
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::USER_ALLOWED_DIRECTIONS
    // The eight-way rotation a rentable bot is allowed; unlike a plant or a piece of furniture it
    // has no per-object direction list to read.
    private static readonly USER_ALLOWED_DIRECTIONS: number[] = [0, 45, 90, 135, 180, 225, 270, 315];

    /**
     * The floor/wall/landscape types `initializeRoom()` opens with, before a parked `RoomData` or a
     * room-properties message supplies real ones. AS3 spells them as bare locals at the top of the
     * method; named here because the deferral path re-reads them.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::initializeRoom()
    private static readonly DEFAULT_FLOOR_TYPE: string = '111';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::initializeRoom()
    private static readonly DEFAULT_WALL_TYPE: string = '201';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::initializeRoom()
    private static readonly DEFAULT_LANDSCAPE_TYPE: string = '1';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::ROOM_TEMP_ID
    private static readonly ROOM_TEMP_ID: string = 'temporary_room';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::OBJECT_ID_ROOM
    public static readonly OBJECT_ID_ROOM: number = -1;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::OBJECT_TYPE_ROOM
    private static readonly OBJECT_TYPE_ROOM: string = 'room';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::OBJECT_ID_ROOM_HIGHLIGHTER
    private static readonly OBJECT_ID_ROOM_HIGHLIGHTER: number = -2;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::OBJECT_TYPE_ROOM_HIGHLIGHTER
    private static readonly OBJECT_TYPE_ROOM_HIGHLIGHTER: string = 'tile_cursor';

    // Derived name: `_SafeStr_10894` is obfuscated in every tree; named after the type string below.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::OBJECT_ID_SELECTION_ARROW
    private static readonly OBJECT_ID_SELECTION_ARROW: number = -3;

    // Derived name: `_SafeStr_11037` is obfuscated in every tree; named after its value.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::OBJECT_TYPE_SELECTION_ARROW
    private static readonly OBJECT_TYPE_SELECTION_ARROW: string = 'selection_arrow';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::ROOM_DRAG_THRESHOLD
    private static readonly ROOM_DRAG_THRESHOLD: number = 15;

    private _roomObjectFactory: RoomObjectFactory;
    private _visualizationFactory: RoomObjectVisualizationFactory;
    private _roomData: Map<string, unknown>;
    private _ownUserIds: Map<number, number>;
    private _roomObjectAliases: Map<string, string>;
    private _renderingCanvases: Map<number, RoomRenderingCanvas> = new Map();
    private _resizeHandlers: WeakMap<RoomRenderingCanvas, () => void> = new WeakMap();
    private _pixiStage: Container | null = null;
    private _roomVisualizationData: RoomVisualizationData | null = null;

    /** How many textures the last conversion pass blitted instead of reading back — see blitTextureFrame(). */
    private _blittedTextureCount: number = 0;
    private _configurationManager: IHabboConfigurationManager | null = null;
    private _sessionDataManager: ISessionDataManager | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_pendingBadgeObjects
    // Derived name: obfuscated in the primary tree. Objects waiting on a badge image,
    // keyed by badge id; the BADGE_IMAGE_READY listener is attached only while it is
    // non-empty, exactly as AS3 does.
    private _pendingBadgeObjects: Map<string, {object: IRoomObjectController; groupBadge: boolean}[]> = new Map();

    /**
	 * Keyed by `furniIconListenerKey()`, holding the chests waiting on one item's icon.
	 */
    // Name DERIVED from what it holds; the AS3 field is obfuscated in every tree.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_SafeStr_5238
    private _pendingFurniIconObjects: Map<string, IRoomObjectController[]> = new Map();
    private _contentLoader: RoomContentLoader;
    /**
     * Whether onConfigurationComplete() has already set the content loader up.
     *
     * TS-only: AS3 needs no such flag because it disposes and rebuilds the loader on every
     * completion, which this port cannot do — see the comment at onConfigurationComplete().
     */
    private _contentLoaderInitialized: boolean = false;
    private _contentLoaderEvents: EventEmitter = new EventEmitter();
    private _roomInstanceData: Map<number, IRoomEngineRoomInstanceData>;
    private _boundOnContentLoaded: ((type: string) => void) = this.onContentLoaded.bind(this);
    private _boundOnContentLoaderReady: (() => void) = this.onContentLoaderReady.bind(this);
    private _pendingFurnitureViz: Map<string, Array<{
        roomId: number;
        objectId: number;
        category: number
    }>> = new Map();

    private _initializedRooms: Set<number> = new Set();

    /**
     * Rooms asked for before the engine could build them, keyed by room identifier.
     *
     * `initializeRoom()` parks its argument here when `isInitialized` is still false and
     * `roomManagerInitialized()` replays the lot; `updateObjectRoom()` parks a floor/wall/landscape
     * push here when the room object does not exist yet. Distinct from `_initializedRooms`, which
     * is the opposite end of the same story — rooms already built.
     *
     * Name recovered from `PRODUCTION-201601012205-226667486`'s `RoomEngine.as` (`_roomDatas`);
     * the primary tree obfuscates it to `_SafeStr_5320`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_roomDatas
    private _roomDatas: Map<string, RoomData> = new Map();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_mouseEventsDisabledAboveY
    // Derived name: obfuscated in every tree; the accessor it backs is readable.
    private _mouseEventsDisabledAboveY: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_mouseEventsDisabledLeftToX
    // Derived name: obfuscated in every tree; the accessor it backs is readable.
    private _mouseEventsDisabledLeftToX: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_mouseEventsDisabledRects
    // Derived name: obfuscated in every tree. Named rectangles that swallow room mouse
    // events — the room-tools toolbar and the chat-history handle each register one.
    private _mouseEventsDisabledRects: OrderedMap<string, {x: number; y: number; width: number; height: number}> | null =
        new OrderedMap<string, {x: number; y: number; width: number; height: number}>();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_clickThroughUsers
    // AS3 uses its own string-set class; a Set is the same thing.
    private _clickThroughUsers: Set<string> = new Set();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_clickThroughFurni
    // Derived name: obfuscated in the primary tree; the getter it backs is readable.
    private _clickThroughFurni: Set<string> = new Set();

    private _roomDragging: boolean = false;
    private _roomDragStarted: boolean = false;
    private _roomDragStartX: number = 0;
    private _roomDragStartY: number = 0;
    private _roomDragLastX: number = 0;
    private _roomDragLastY: number = 0;
    private _roomDraggingAlwaysCenters: boolean = false;
    private _roomSessionManager: IRoomSessionManager | null = null;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_windowManager
    private _windowManager: IHabboWindowManager | null = null;
    private _roomRendererFactory: IRoomRendererFactory | null = null;
    private _moverIconSprite: Sprite | null = null;
    private _moverIconCanvas: RoomRenderingCanvas | null = null;
    // Derived name: `_objectPlacementSource` is declared in no AS3 tree — the trace points
    // at the class it belongs to, but the identifier itself is this port's.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::_objectPlacementSource
    private _objectPlacementSource: string | null = '';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_SafeStr_7265
    private _pendingImageListeners: Map<number, IGetImageListener> = new Map();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_SafeStr_6137
    private _imageIdCounter: number = 0;
    private _ticker: Ticker | null = null;
    private _canvasSyncCallbacks: Set<() => void> = new Set();
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::_moveMouseEventCache
    // The last mouse-move over the room, replayed by recalibrateMovements() so an in-progress
    // drag/place ghost re-snaps after the tile map rebuilds — and so the *next* item of a repeated
    // placement gets its ghost immediately instead of waiting for the mouse to move again.
    //
    // It caches the event, not tile coordinates: AS3 replays it through handleRoomObjectMouseMove(),
    // which needs to know whether the cursor was over a floor tile or a wall. Caching only x/y made
    // repeated placement impossible to replay for a wall item, which has neither.
    private _moveMouseEventCache: {
        tileEvent: {tileX: number; tileY: number} | null;
        wallEvent: RoomObjectWallMouseEvent | null;
    } | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::setMouseEventId()
    // (name derived: AS3 has no dedicated field, it reuses the per-(category, type) mouse-event-id
    // map that processRoomCanvasMouseEvent() maintains — see setMouseEventId(0, "click", eventId) in
    // handleRoomObjectMouseClick()'s category-100 arm, which consumes a click for the room bucket so
    // the floor does not act on it a second time.)
    //
    // This port needs its own slot for it. One physical click reaches placeObject() TWICE: the
    // placement ghost is a category-10 object, the room planes are category 0, and
    // processRoomCanvasMouseEvent() dedups per category *bucket* — so the two deliveries never
    // collide and both arrive. That was harmless while the first call left no selection behind, but
    // repeated placement re-arms the next item synchronously inside the first call, so the second
    // delivery found a fresh OBJECT_PLACE and placed a second item on the same spot.
    private _lastPlacementEventId: string | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::_repeatedPlacement
    // Set from initializeRoomObjectInsert()'s last argument. The inventory passes true, so placing
    // one item of a stack immediately re-arms the next; the catalog and the infostand pass nothing.
    // Names derived — obfuscated in every tree (_SafeStr_8143/_SafeStr_8228/_SafeStr_6975).
    private _repeatedPlacement: boolean = false;
    // AS3: .../_SafeCls_1821.as::_repeatedPlacementTypeId — the type of the last item placed while
    // repeating, so the direction below is only reused for another item of the same type.
    private _repeatedPlacementTypeId: number = -1;
    // AS3: .../_SafeCls_1821.as::_repeatedPlacementDirection — the direction the last item was
    // placed at, in degrees. Carrying it over is what makes a row of furni come out aligned instead
    // of resetting to the default rotation on every copy.
    private _repeatedPlacementDirection: number = -1;
    private _selectedObject: { roomId: number; id: number; category: number } | null = null;
    /**
     * TS-only (RPG F3b §7.3): the zone's usable floor objects, by id, as RpgZoneInteractives lists
     * them; null outside a zone, where the Habbo click path stays. Set by features/interaction.
     */
    private _rpgInteractives: ReadonlyMap<number, string> | null = null;
    /** TS-only (RPG F3b §7.3): the avatar (room object id) under the target circle; 0 for none. */
    private _rpgTargetId = 0;
    /** TS-only (RPG F3c §16): avatars dancing from an RP action; their first step stops it. */
    private readonly _rpgDancers = new Set<number>();

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::getSelectedAvatarId()
    private _selectedAvatarId: number = -1;

    // AS3: _SafeCls_1821.as::processRoomCanvasMouseEvent() dedups per (category-bucket, event type):
    // getMouseEventId(category, type) keyed on BOTH the bucketed category and the type. The key is
    // `${bucket}_${type}`; the value is the last eventId already delivered for that slot, so a click
    // that alpha-hits several stacked same-category objects only reaches the frontmost, WITHOUT a
    // 'click' suppressing a same-frame 'doubleClick' (separate slots) — that separation is what keeps
    // double-click-to-use working. An earlier port used a single field for all types/categories,
    // which merged those slots and swallowed fast double-clicks (and any second-category object).
    private _mouseEventIds: Map<string, string> = new Map<string, string>();

    // The host's renderer, for screenshots: the game does not own the application (J6).
    private readonly _renderer: () => Renderer | null;
    // TS-only: the room content's .ambreia directories (spec 2026-10-09-ambreia-everything), read when
    // the content loader starts — after features/asset-packs opened them.
    private readonly _directories: () => IRoomContentDirectories | null;

    constructor(context: IContext, assetLibrary: IAssetLibrary | null = null, renderer: () => Renderer | null = () => null,
        directories: () => IRoomContentDirectories | null = () => null)
    {
        super(context, 0, assetLibrary);
        this._renderer = renderer;
        this._directories = directories;
        // The object types come from registries filled by the room modules (J4).
        const registries = createRoomRegistries(DEFAULT_ROOM_MODULES);

        this._roomObjectFactory = new RoomObjectFactory(registries.logics);
        this._visualizationFactory = new RoomObjectVisualizationFactory(registries.visualizations);
        // AS3's factory reads `assets` off its own Component base; this port's factory is a plain
        // class, so the library is handed to it here (AnimatedPetVisualizationData.commonAssets).
        this._visualizationFactory.assets = assetLibrary;
        this._contentLoader = new RoomContentLoader();
        this._roomData = new Map();
        this._ownUserIds = new Map();
        this._roomObjectAliases = new Map();
        this._roomInstanceData = new Map();

        // Listen to object events from factory
        this._roomObjectFactory.addObjectEventListener(this.handleRoomObjectEvent.bind(this));
    }

    private _activeRoomId: number = -1;

    get activeRoomId(): number 
    {
        return this._activeRoomId;
    }

    private _roomManager: IRoomManager | null = null;

    get roomManager(): IRoomManager | null
    {
        return this._roomManager;
    }

    // AS3: RoomEngine.as::_SafeStr_5591 (the area-selection manager, name derived from the getter)
    private _areaSelectionManager: RoomAreaSelectionManager | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::get areaSelectionManager()
    get areaSelectionManager(): RoomAreaSelectionManager
    {
        // AS3 creates the manager in init(); the port creates it lazily, which is equivalent because
        // nothing reaches it before a room exists.
        this._areaSelectionManager ??= new RoomAreaSelectionManager(this);

        return this._areaSelectionManager;
    }

    private _connection: IConnection | null = null;

    get connection(): IConnection | null 
    {
        return this._connection;
    }

    set connection(value: IConnection | null) 
    {
        this._connection = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get isDecorateMode()
    get isDecorateMode(): boolean 
    {
        if(!this._roomSessionManager) 
        {
            return false;
        }

        const session = this._roomSessionManager.getSession(this._activeRoomId);

        return !!session && session.isUserDecorating;
    }

    private _isGameMode: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get isGameMode()
    get isGameMode(): boolean 
    {
        return this._isGameMode;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::set isGameMode()
    set isGameMode(value: boolean)
    {
        this._isGameMode = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get activeRoomHasFreeFurniMovementsMode()
    // AS3 body: isRoomVariableActive(_activeRoomId, "free_furni_movements_mode"). When set,
    // any user may move/rotate furniture in the room (checkFurniManipulationRights passes).
    get activeRoomHasFreeFurniMovementsMode(): boolean
    {
        const room = this.getRoomInstance(this._activeRoomId);

        return room !== null && room.getNumber(RoomVariableEnum.FREE_FURNI_MOVEMENTS_MODE) !== 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get activeRoomHasHanditemControlBlocked()
    // AS3 body: isRoomVariableActive(_activeRoomId, "handitem_control_blocked"). The server
    // sets it through HanditemConfiguration; the avatar menus hide give/drop handitem on it.
    get activeRoomHasHanditemControlBlocked(): boolean
    {
        const room = this.getRoomInstance(this._activeRoomId);

        return room !== null && room.getNumber(RoomVariableEnum.HANDITEM_CONTROL_BLOCKED) !== 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get activeRoomHasChooserDisabled()
    // AS3 body: isRoomVariableActive(_activeRoomId, "chooser_disabled"). When set, the user and
    // furni chooser windows refuse to populate — a room can opt out of being listed.
    get activeRoomHasChooserDisabled(): boolean
    {
        const room = this.getRoomInstance(this._activeRoomId);

        return room !== null && room.getNumber(RoomVariableEnum.CHOOSER_DISABLED) !== 0;
    }

    protected override get dependencies(): Array<ComponentDependency<any>> 
    {
        return [
            new ComponentDependency(
                IID_RoomManager,
                (manager: IRoomManager | null) => 
                {
                    this._roomManager = manager;

                    if(manager && 'setObjectFactory' in manager) 
                    {
                        // Set the object factory on room manager
                        (manager as unknown as {
                            setObjectFactory: (f: RoomObjectFactory) => void;
                            setVisualizationFactory: (f: IRoomObjectVisualizationFactory) => void;
                        }).setObjectFactory(this._roomObjectFactory);

                        // Set the visualization factory on room manager
                        (manager as unknown as {
                            setVisualizationFactory: (f: IRoomObjectVisualizationFactory) => void;
                        }).setVisualizationFactory(this._visualizationFactory);
                    }
                },
                true // Required dependency
            ),
            new ComponentDependency(
                IID_RoomRendererFactory,
                (factory: IRoomRendererFactory | null) =>
                {
                    this._roomRendererFactory = factory;
                },
                true // Required dependency
            ),
            // AS3: _SafeCls_90.as:434 — RoomEngine takes IIDHabboWindowManager so that
            // RoomMessageHandler can raise the pick-up confirm.
            new ComponentDependency(
                IID_HabboWindowManager,
                (windowManager: IHabboWindowManager | null) =>
                {
                    this._windowManager = windowManager;
                },
                true
            ),
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (config: IHabboConfigurationManager | null) =>
                {
                    this._configurationManager = config;

                    // AS3's real dependency setter is `null` here - it does nothing synchronously
                    // at resolution time, relying entirely on the 'complete' listener below to call
                    // onConfigurationComplete() once configuration has actually finished loading
                    // (sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as:389-392).
                    // This port's VortexMain.ts::prepareCore() awaits HabboConfigurationManager's
                    // async download before constructing RoomEngine, so by the time this dependency
                    // resolves 'complete' has already fired to nobody and never fires again - the
                    // same race already fixed once in AvatarRenderManager.tryOnConfigurationComplete()
                    // and SessionDataManager's own IID_HabboConfigurationManager dependency. Catch up
                    // directly, deferred a microtask so the IID_SessionDataManager dependency listed
                    // below (which onConfigurationComplete() reads) finishes resolving first, matching
                    // the order a genuinely-late 'complete' would arrive in.
                    if(config?.isInitialized())
                    {
                        queueMicrotask(() => this.onConfigurationComplete());
                    }
                },
                false, // Optional - room can render with flat colors without textures
                [{type: 'complete', callback: this.onConfigurationComplete.bind(this)}]
            ),
            new ComponentDependency(
                IID_SessionDataManager,
                (sessionData: ISessionDataManager | null) => 
                {
                    this._sessionDataManager = sessionData;

                    if(sessionData) 
                    {
                        this._contentLoader.furniDataSource = sessionData;
                    }
                },
                false // Optional - needed for furniture className lookup
            ),
            new ComponentDependency(
                IID_AvatarRenderManager,
                (avatarRenderer: IAvatarRenderManager | null) =>
                {
                    this._visualizationFactory.avatarRenderManager = avatarRenderer;
                },
                false // Optional - needed for avatar visualization
            ),
            new ComponentDependency(
                IID_RoomSessionManager,
                (manager: IRoomSessionManager | null) =>
                {
                    this._roomSessionManager = manager;
                },
                false // Optional - needed to resolve isDecorateMode from the active room session
            ),
        ];
    }

    /**
     * A click on an avatar. Outside game mode AS3 does nothing here — the avatar's own selection
     * happens on the way in, in the caller.
     */
    // DEVIATION: in game mode AS3 hands the click to the games manager (`gameEngine.handleClickOnHuman()`,
    //   a snow-war throw); the RPG fork removed Snow War and the games manager, so nothing is left.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleClickOnAvatar()
    private handleClickOnAvatar(_objectId: number, _event: RoomObjectMouseEvent): void
    {
    }

    /**
     * The pointer entering an avatar, in game mode: the tile cursor is moved onto that avatar's own
     * tile so the aim marker follows the target.
     */
    // DEVIATION: AS3 then tells the games manager who is under the pointer
    //   (`gameEngine.handleMouseOverOnHuman()`); the RPG fork removed Snow War and the games manager.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleMouseEnterAvatar()
    private handleMouseEnterAvatar(objectId: number, _event: RoomObjectMouseEvent): void
    {
        if(this.isDecorateMode) return;

        if(!this.isGameMode) return;

        const tileCursor = this.getTileCursor(this._activeRoomId);

        if(tileCursor !== null && tileCursor.getEventHandler() !== null)
        {
            const avatar = this.getRoomObject(
                this._activeRoomId,
                objectId,
                RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
            ) as IRoomObjectController | null;

            if(avatar !== null)
            {
                const location = avatar.getLocation();

                tileCursor.getEventHandler()!.processUpdateMessage(
                    new RoomObjectUpdateMessage(new Vector3d(location.x, location.y, location.z), null)
                );
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get useOffsetScrolling()
    private get useOffsetScrolling(): boolean 
    {
        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get cameraFollowDuration()
    private get cameraFollowDuration(): number 
    {
        return this._configurationManager?.getBoolean('room.camera.follow_user') ? 1000 : 0;
    }

    getRoom(roomId: number): IRoomInstance | null
    {
        return this.getRoomInstance(roomId);
    }

    /**
     * The room instance's own string bag — `room_wall_type` / `room_floor_type` /
     * `room_landscape_type` are written here by `updateObjectRoom()`. The catalog reads them back
     * to rebuild the *other two* decoration slots when it changes one of them.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomStringValue()
    getRoomStringValue(roomId: number, key: string): string | null
    {
        const room = this.getRoom(roomId);

        if(room !== null)
        {
            return room.getString(key);
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get configuration()
    get configuration(): IHabboConfigurationManager | null
    {
        return this._configurationManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get roomSessionManager()
    get roomSessionManager(): IRoomSessionManager | null
    {
        return this._roomSessionManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get sessionDataManager()
    get sessionDataManager(): ISessionDataManager | null
    {
        return this._sessionDataManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get windowManager()
    get windowManager(): IHabboWindowManager | null
    {
        return this._windowManager;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomObjectCategory()
    // AS3 delegates to the content loader (getObjectCategory), returning -2 with no
    // loader. The old hardcoded switch defaulted every unrecognised type to FURNITURE —
    // so a wall item (window_basic, poster, …) resolved to 10 (FURNITURE) instead of 20
    // (WALL), and an unknown type to 10 instead of -2. The loader's getObjectCategory is
    // faithfully ported and checks the real floor/wall/pet registries.
    getRoomObjectCategory(type: string): number
    {
        if(this._contentLoader !== null)
        {
            return this._contentLoader.getObjectCategory(type);
        }

        return -2;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::isRoomObjectContentAvailable()
    isRoomObjectContentAvailable(type: string): boolean 
    {
        return this._roomManager?.isContentAvailable(type) ?? false;
    }

    getRoomObjectWithIndex(roomId: number, index: number, category: number): IRoomObject | null 
    {
        const room = this.getRoomInstance(roomId);
        if(!room) 
        {
            return null;
        }

        return room.getObjectWithIndex(index, category);
    }

    getRoomObjectCount(roomId: number, category: number): number 
    {
        const room = this.getRoomInstance(roomId);
        if(!room) 
        {
            return 0;
        }

        return room.getObjectCount(category);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setTileCursorState()
    setTileCursorState(roomId: number, state: number): void
    {
        const cursor = this.getTileCursor(roomId);

        cursor?.getEventHandler()?.processUpdateMessage(new RoomObjectDataUpdateMessage(state, null));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::toggleTileCursorVisibility()
    toggleTileCursorVisibility(roomId: number, visible: boolean): void
    {
        const cursor = this.getTileCursor(roomId);

        cursor?.getEventHandler()?.processUpdateMessage(
            new RoomObjectTileCursorUpdateMessage(null, 0, visible, '', true)
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getTileCursor()
    getTileCursor(roomId: number): IRoomObjectController | null 
    {
        const room = this.getRoomInstance(roomId);
        if(!room) 
        {
            return null;
        }

        return room.getObject(RoomEngine.OBJECT_ID_ROOM_HIGHLIGHTER, RoomObjectCategoryEnum.OBJECT_CATEGORY_CURSOR) as IRoomObjectController | null;
    }

    getSelectionArrow(roomId: number): IRoomObjectController | null 
    {
        const room = this.getRoomInstance(roomId);
        if(!room) 
        {
            return null;
        }

        return room.getObject(RoomEngine.OBJECT_ID_SELECTION_ARROW, RoomObjectCategoryEnum.OBJECT_CATEGORY_CURSOR) as IRoomObjectController | null;
    }

    /**
	 * Whether a game is running in the given room
	 *
	 * Read from the room instance's `is_playing_game` variable, which the server sets on a real
	 * minigame (the RPG fork dropped AS3's second source, the wired game mode).
	 */
    /**
	 * The room's world type, as the server named it on entry
	 *
	 * `"public"` for a public space, `"private"` for a flat. Null when the room is not loaded —
	 * callers use that to tell "not a public space" from "not known yet".
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getWorldType()
    getWorldType(roomId: number): string | null
    {
        return this.getRoomInstanceData(roomId)?.worldType ?? null;
    }

    /**
	 * Reads a numeric room variable, or NaN when the room has no value under that name
	 *
	 * NaN rather than 0 is the point: `is_playing_game` and friends are meaningfully absent, and
	 * zero is a legitimate value for several of them.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomNumberValue()
    getRoomNumberValue(roomId: number, key: string): number
    {
        const room = this.getRoomInstance(roomId);

        if(room === null || !room.hasValueForName(key)) return NaN;

        return room.getNumber(key);
    }

    /**
	 * Every object of one category currently in the room
	 *
	 * Empty rather than null while the engine is not ready, so callers can iterate unguarded —
	 * AS3 makes the same choice.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomObjects()
    getRoomObjects(roomId: number, category: number): IRoomObject[]
    {
        if(!this._roomManagerInitialized) return [];

        const room = this._roomManager?.getRoom(this.getRoomIdentifier(roomId)) ?? null;

        return room?.getObjects(category) ?? [];
    }

    /**
	 * The numeric pet type at the head of a pet figure string
	 *
	 * A pet figure is `"<typeId> <paletteId> <colour> …"`, so this is the first token. -1 when the
	 * string is null or has no second token — AS3 requires the space to be there before trusting
	 * the first field.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetTypeId()
    getPetTypeId(figure: string | null): number
    {
        if(figure === null) return -1;

        const parts = figure.split(' ');

        if(parts.length <= 1) return -1;

        return parseInt(parts[0], 10);
    }

    /**
	 * Turns the room's background tint on or off
	 *
	 * The engine does not apply the colour itself — it checks the room object exists and then
	 * announces it, and the UI layer listening for ROHSLCEE_ROOM_BACKGROUND_COLOR does the work.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectRoomBackgroundColor()
    updateObjectRoomBackgroundColor(roomId: number, enable: boolean, hue: number, saturation: number, lightness: number): boolean
    {
        const room = this.getObjectRoom(roomId);

        if(room === null || room.getEventHandler() === null) return false;

        this.events.emit(
            RoomEngineHSLColorEnableEvent.ROOM_BACKGROUND_COLOR,
            new RoomEngineHSLColorEnableEvent(
                RoomEngineHSLColorEnableEvent.ROOM_BACKGROUND_COLOR, roomId, enable, hue, saturation, lightness
            )
        );

        return true;
    }

    /**
	 * Marks an avatar as the one this client is driving
	 *
	 * The visualization uses it for everything that only applies to yourself — the own-avatar
	 * bubble, the name colour, the click behaviour.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectUserOwnUserAvatar()
    updateObjectUserOwnUserAvatar(roomId: number, roomIndex: number): boolean
    {
        const user = this.getRoomObject(roomId, roomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

        if(user === null || user.getEventHandler() === null) return false;

        user.getEventHandler()?.processUpdateMessage(new RoomObjectAvatarOwnMessage());

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectUserGesture()
    updateObjectUserGesture(roomId: number, roomIndex: number, gesture: number): boolean
    {
        const user = this.getRoomObject(roomId, roomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

        if(user === null || user.getEventHandler() === null) return false;

        user.getEventHandler()?.processUpdateMessage(new RoomObjectAvatarGestureUpdateMessage(gesture));

        return true;
    }

    /**
	 * Puts an effect on your own avatar, wherever it currently is
	 *
	 * The caller knows the effect id and nothing else — this resolves the room and the index from
	 * the active session, which is why the me-menu can ask for an effect without tracking either.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setAvatarEffect()
    setAvatarEffect(effectId: number): void
    {
        if(this._sessionDataManager === null || this._roomSessionManager === null) return;

        const session = this._roomSessionManager.getSession(this._activeRoomId);

        if(session === null) return;

        this.updateObjectUserEffect(this._activeRoomId, session.ownUserRoomId, effectId, 0);
    }

    /**
	 * Hands a loaded asset library to the content loader as one object type's content
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::insertContentLibrary()
    insertContentLibrary(typeId: number, category: number, assetLibrary: IAssetLibrary): boolean
    {
        return this._contentLoader.insertObjectContent(typeId, category, assetLibrary);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get roomContentLoader()
    get roomContentLoader(): RoomContentLoader
    {
        return this._contentLoader;
    }

    /**
	 * Registers an object with the room's tile map, so a walk can find what stands on a tile
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addObjectToTileMap()
    protected addObjectToTileMap(roomId: number, object: IRoomObject): void
    {
        this.getRoomInstanceData(roomId)?.tileObjectMap?.addRoomObject(object);
    }

    // DEVIATION: the hook AS3 leaves for a subclass to supply its own event handler. This port
    //   folded `_SafeCls_1821` into RoomEngine itself rather than keeping it a separate object — its
    //   members are traced here, from `handleRoomObjectEvent()` down — so there is no instance to
    //   create and nothing to override.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::createRoomObjectEventHandlerInstance()

    // DEVIATION: `_SafeCls_1821`'s accessor onto the `_SafeCls_90` (RoomEngine) instance that owned
    //   it — every `roomEngine.foo()` call inside that class went through it. Folding the class in
    //   collapses the accessor to `this`, which is not a member worth exposing; every former
    //   `roomEngine.x` call site reads `this.x` directly.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::get roomEngine()

    // DEVIATION: two `uint` bit flags (1 and 4) that nothing in either tree reads — `grep -rn
    //   SETUP_WITHOUT sources/` finds only the two declarations and `RoomSessionManager`'s
    //   unrelated `SETUP_WITHOUT_TRACKING`, and there is no `setup()` in `_SafeCls_90.as` for them
    //   to be passed to. They are dead in AS3 as well as absent here; the engine's dependencies are
    //   wired by the DI container either way.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::SETUP_WITHOUT_TOOLBAR
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::SETUP_WITHOUT_GAME_MANAGER

    // DEVIATION: AS3 first answers true when the active room's wired environment is in game mode
    //   (`roomEvents.isGameMode`). The RPG fork removed wired, so only the room variable is read.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getIsPlayingGame()
    getIsPlayingGame(roomId: number): boolean
    {
        const room = this.getRoomInstance(roomId);

        return room !== null && room.getNumber(RoomVariableEnum.IS_PLAYING_GAME) > 0;
    }

    getActiveRoomIsPlayingGame(): boolean
    {
        return this.getIsPlayingGame(this._activeRoomId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::showUseProductSelection()
    // The inventory's entry point: a pet product used straight from the strip, before it is
    // placed. `objectId` is -1 when the whole group is used rather than one identified item.
    // The category comes from the product's own type, so the bubbles know what they target.
    showUseProductSelection(inventoryStripId: number, furnitureTypeId: number, objectId: number = -1): void
    {
        if(!this._contentLoader) return;

        const type = this._contentLoader.getActiveObjectType(furnitureTypeId);
        const category = this.getRoomObjectCategory(type ?? '');

        this.events.emit(
            RoomEngineUseProductEvent.USE_PRODUCT_FROM_INVENTORY,
            new RoomEngineUseProductEvent(
                RoomEngineUseProductEvent.USE_PRODUCT_FROM_INVENTORY,
                this._activeRoomId, objectId, category, inventoryStripId, furnitureTypeId
            )
        );
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::isAreaSelectionMode()
    isAreaSelectionMode(): boolean
    {
        return this.areaSelectionManager.areaSelectionState !== RoomAreaSelectionManager.NOT_ACTIVE;
    }

    /**
	 * True while a drag must not also walk the avatar. Set by the area selector for the length of a
	 * selection; both AS3 read sites are avatar-move paths.
	 */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::isMoveBlocked()
    isMoveBlocked(): boolean
    {
        return this._moveBlocked;
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::setMoveBlocked()
    setMoveBlocked(blocked: boolean): void
    {
        this._moveBlocked = blocked;
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::_SafeStr_9481 (name derived: move blocked)
    private _moveBlocked: boolean = false;

    /**
     * AS3's flag is `private var … = true` and is written nowhere in the class, so the live half of
     * the expression is the area-selection test: while a select-area drag is running, a click is
     * part of the rectangle and must not also walk the avatar or move the walk cursor. The port
     * returned a bare `true`, which is what let both happen.
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::_SafeStr_10330 (name derived from its one reader)
    private _whereYouClickWhereYouGoEnabled: boolean = true;

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::isWhereYouClickWhereYouGo()
    isWhereYouClickWhereYouGo(): boolean
    {
        return this._whereYouClickWhereYouGoEnabled && !this.isAreaSelectionMode();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::roomManagerInitialized()
    roomManagerInitialized(success: boolean): void
    {
        if(!success)
        {
            log.error('Failed to initialize manager');

            return;
        }

        this._roomManagerInitialized = true;

        this.events.emit(RoomEngineEvent.REE_ENGINE_INITIALIZED);

        // Every room asked for while the flag above was false. Iterated over a snapshot because
        // initializeRoom() deletes its own entry as it goes: AS3 walks the live map by index and
        // silently skips whatever shifts down behind a removal, which is an artifact of its
        // collection rather than intent — the intent is plainly "replay all of them".
        for(const roomData of [...this._roomDatas.values()])
        {
            this.initializeRoom(
                roomData.roomId,
                roomData.data,
                roomData.doorX ?? undefined,
                roomData.doorY ?? undefined,
                roomData.doorZ ?? undefined,
                roomData.doorDir ?? undefined,
                roomData.cameraInitPosition
            );
        }
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_SafeStr_5461
     *
     * Name DERIVED: obfuscated in every tree. Set once by `roomManagerInitialized(true)` and read
     * by `isInitialized` — engine-wide readiness, distinct from `_initializedRooms`, which tracks
     * individual rooms.
     */
    private _roomManagerInitialized: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get mouseEventsDisabledAboveY()
    get mouseEventsDisabledAboveY(): number
    {
        return this._mouseEventsDisabledAboveY;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::set mouseEventsDisabledAboveY()
    set mouseEventsDisabledAboveY(value: number)
    {
        this._mouseEventsDisabledAboveY = value;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get mouseEventsDisabledLeftToX()
    get mouseEventsDisabledLeftToX(): number
    {
        return this._mouseEventsDisabledLeftToX;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::set mouseEventsDisabledLeftToX()
    set mouseEventsDisabledLeftToX(value: number)
    {
        this._mouseEventsDisabledLeftToX = value;
    }

    /**
	 * Registers a screen rectangle that swallows room mouse events, under a caller-chosen
	 * name so the same caller can move or drop it later. An empty rectangle removes it.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setMouseEventsDisabledRect()
    setMouseEventsDisabledRect(name: string, rect: {x: number; y: number; width: number; height: number} | null): void
    {
        if(this._mouseEventsDisabledRects === null || !name || name.length === 0) return;

        if(rect === null || rect.width <= 0 || rect.height <= 0)
        {
            this._mouseEventsDisabledRects.remove(name);

            return;
        }

        // AS3 clones the rectangle: the callers hand in a scratch one they keep reusing.
        const clone = {x: rect.x, y: rect.y, width: rect.width, height: rect.height};

        if(this._mouseEventsDisabledRects.hasKey(name)) this._mouseEventsDisabledRects.replace(name, clone);
        else this._mouseEventsDisabledRects.add(name, clone);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::removeMouseEventsDisabledRect()
    removeMouseEventsDisabledRect(name: string): void
    {
        if(this._mouseEventsDisabledRects === null || !name || name.length === 0) return;

        this._mouseEventsDisabledRects.remove(name);
    }

    /**
	 * Note the coordinate spaces, because they do not obviously match: the rectangles come
	 * from `IWindow.getGlobalRectangle()` (desktop space) while `x`/`y` here are canvas-local
	 * (`RoomDesktop.canvasMouseHandler()` subtracts the canvas' global position). AS3 does the
	 * identical subtraction in its own `canvasMouseHandler()`, so this is not a port slip —
	 * it works because the room canvas sits at the desktop origin. Do not "fix" it by adding
	 * an offset without checking that first.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::isMouseEventDisabledByRect()
    private isMouseEventDisabledByRect(x: number, y: number): boolean
    {
        if(this._mouseEventsDisabledRects === null) return false;

        for(let i = 0; i < this._mouseEventsDisabledRects.length; i++)
        {
            const rect = this._mouseEventsDisabledRects.getWithIndex(i);

            if(rect !== null
                && x >= rect.x && x < rect.x + rect.width
                && y >= rect.y && y < rect.y + rect.height)
            {
                return true;
            }
        }

        return false;
    }

    /**
	 * Registers or drops one owner's request to click through users / furniture. Wired's room
	 * environment is the only caller: while it holds the flag, clicks on avatars or furni are
	 * ignored by the room and fall through to the floor.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addFloorHole()
    addFloorHole(roomId: number, objectId: number): void
    {
        if(objectId < 0) return;

        const room = this.getObjectRoom(roomId);
        const furniture = this.getRoomObject(roomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) as IRoomObjectController | null;

        if(!furniture || !furniture.getModel() || !room || !room.getEventHandler()) return;

        const location = furniture.getLocation();

        room.getEventHandler()!.processUpdateMessage(new RoomObjectRoomFloorHoleUpdateMessage(
            RoomObjectRoomFloorHoleUpdateMessage.ADD_HOLE,
            objectId,
            Math.trunc(location.x),
            Math.trunc(location.y),
            Math.trunc(furniture.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_X)),
            Math.trunc(furniture.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Y))
        ));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::removeFloorHole()
    removeFloorHole(roomId: number, objectId: number): void
    {
        if(objectId < 0) return;

        const room = this.getObjectRoom(roomId);

        room?.getEventHandler()?.processUpdateMessage(
            new RoomObjectRoomFloorHoleUpdateMessage(RoomObjectRoomFloorHoleUpdateMessage.REMOVE_HOLE, objectId)
        );
    }

    /**
	 * A furni logic asking for a badge image. If the session already has it, the graphic
	 * assets go straight onto the object's asset collection; otherwise the object is parked
	 * against the badge id and the placeholder name is sent, and `onBadgeLoaded()` finishes
	 * the job when the image arrives.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::requestBadgeImageAsset()
    requestBadgeImageAsset(roomId: number, objectId: number, category: number, badgeId: string, groupBadge: boolean = true): void
    {
        const object = roomId === 0
            ? (this._roomManager?.getRoom('temporary_room')?.getObject(objectId, category) as IRoomObjectController | null ?? null)
            : (this.getRoomObject(roomId, objectId, category) as IRoomObjectController | null);

        if(!object || !object.getEventHandler() || !this._sessionDataManager) return;

        let assetName = groupBadge
            ? this._sessionDataManager.getGroupBadgeAssetName(badgeId)
            : this._sessionDataManager.getBadgeImageAssetName(badgeId);

        if(!assetName)
        {
            assetName = 'loading_icon';

            if(this._pendingBadgeObjects.size === 0)
            {
                this._sessionDataManager.events.on(BadgeImageReadyEvent.BADGE_IMAGE_READY, this.onBadgeLoaded);
            }

            const waiting = this._pendingBadgeObjects.get(badgeId) ?? [];

            waiting.push({object, groupBadge});
            this._pendingBadgeObjects.set(badgeId, waiting);
        }
        else
        {
            this.addBadgeGraphicAssets(object, badgeId, groupBadge);
        }

        object.getEventHandler()!.processUpdateMessage(new RoomObjectGroupBadgeUpdateMessage(badgeId, assetName));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addBadgeGraphicAssets()
    private addBadgeGraphicAssets(object: IRoomObjectController, badgeId: string, groupBadge: boolean = false): void
    {
        const session = this._sessionDataManager;

        if(!session) return;

        const name = groupBadge ? session.getGroupBadgeAssetName(badgeId) : session.getBadgeImageAssetName(badgeId);
        const image = groupBadge ? session.getGroupBadgeImage(badgeId) : session.getBadgeImage(badgeId);

        if(name && image) this._contentLoader.addGraphicAsset(object.getType(), name, Texture.from(image), false);

        const smallName = groupBadge ? session.getGroupBadgeSmallAssetName(badgeId) : session.getBadgeImageSmallAssetName(badgeId);
        const smallImage = groupBadge ? session.getGroupBadgeSmallImage(badgeId) : session.getBadgeSmallImage(badgeId);

        if(smallName && smallImage) this._contentLoader.addGraphicAsset(object.getType(), smallName, Texture.from(smallImage), false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::onBadgeLoaded()
    private onBadgeLoaded = (event: BadgeImageReadyEvent): void =>
    {
        const waiting = this._pendingBadgeObjects.get(event.badgeId);
        const session = this._sessionDataManager;

        if(!waiting || !session)
        {
            log.warn(`Could not find matching objects for group badge asset request ${event.badgeId}`);

            return;
        }

        for(const entry of waiting)
        {
            this.addBadgeGraphicAssets(entry.object, event.badgeId, entry.groupBadge);

            const assetName = entry.groupBadge
                ? session.getGroupBadgeAssetName(event.badgeId)
                : session.getBadgeImageAssetName(event.badgeId);

            entry.object.getEventHandler()?.processUpdateMessage(
                new RoomObjectGroupBadgeUpdateMessage(event.badgeId, assetName ?? ''));
        }

        this._pendingBadgeObjects.delete(event.badgeId);

        if(this._pendingBadgeObjects.size === 0)
        {
            session.events.off(BadgeImageReadyEvent.BADGE_IMAGE_READY, this.onBadgeLoaded);
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::furniIconListenerKey()
    static furniIconListenerKey(wallItem: boolean, typeId: number, extra: string): string
    {
        return `${wallItem ? '1' : '0'}-${typeId}-${extra}`;
    }

    /**
	 * A furni chest asking for the icon of one item it holds. Same shape as
	 * `requestBadgeImageAsset()`: the placeholder name goes out immediately and the object is
	 * parked against the item key, then `onFurniIconLoaded()` sends the real one.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::requestFurniIconAsset()
    requestFurniIconAsset(
        roomId: number,
        objectId: number,
        category: number,
        wallItem: boolean,
        typeId: number,
        extra: string
    ): void
    {
        const object = roomId === 0
            ? (this._roomManager?.getRoom('temporary_room')?.getObject(objectId, category) as IRoomObjectController | null ?? null)
            : (this.getRoomObject(roomId, objectId, category) as IRoomObjectController | null);

        if(!object || !object.getEventHandler() || !this._sessionDataManager) return;

        let assetName = this._sessionDataManager.getFurniIconImageAssetName(wallItem, typeId, extra);

        if(!assetName)
        {
            assetName = 'loading_icon';

            if(this._pendingFurniIconObjects.size === 0)
            {
                this._sessionDataManager.events.on(FurniIconImageReadyEvent.FURNI_ICON_READY, this.onFurniIconLoaded);
            }

            const key = RoomEngine.furniIconListenerKey(wallItem, typeId, extra);
            const waiting = this._pendingFurniIconObjects.get(key) ?? [];

            waiting.push(object);
            this._pendingFurniIconObjects.set(key, waiting);
        }
        else
        {
            this.addFurniIconGraphicAssets(object, wallItem, typeId, extra);
        }

        object.getEventHandler()!.processUpdateMessage(
            new RoomObjectFurniIconUpdateMessage(assetName, wallItem, typeId, extra));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addFurniIconGraphicAssets()
    private addFurniIconGraphicAssets(object: IRoomObjectController, wallItem: boolean, typeId: number, extra: string): void
    {
        const session = this._sessionDataManager;

        if(!session) return;

        const name = session.getFurniIconImageAssetName(wallItem, typeId, extra);
        const image = session.getFurniIconImage(wallItem, typeId, extra);

        if(name && image) this._contentLoader.addGraphicAsset(object.getType(), name, Texture.from(image), false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::onFurniIconLoaded()
    private onFurniIconLoaded = (event: FurniIconImageReadyEvent): void =>
    {
        const key = RoomEngine.furniIconListenerKey(event.wallItem, event.typeId, event.extra);
        const waiting = this._pendingFurniIconObjects.get(key);
        const session = this._sessionDataManager;

        if(!waiting || !session)
        {
            log.warn(`Could not find matching objects for furni icon asset request ${key}`);

            return;
        }

        for(const object of waiting)
        {
            this.addFurniIconGraphicAssets(object, event.wallItem, event.typeId, event.extra);

            object.getEventHandler()?.processUpdateMessage(
                new RoomObjectFurniIconUpdateMessage(event.assetName, event.wallItem, event.typeId, event.extra));
        }

        this._pendingFurniIconObjects.delete(key);

        if(this._pendingFurniIconObjects.size === 0)
        {
            session.events.off(FurniIconImageReadyEvent.FURNI_ICON_READY, this.onFurniIconLoaded);
        }
    };

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setClickSettings()
    setClickSettings(owner: string, throughUsers: boolean, throughFurni: boolean): void
    {
        const wasClickThroughUsers = this.clickThroughUsers;
        const wasClickThroughFurni = this.clickThroughFurni;

        if(throughUsers) this._clickThroughUsers.add(owner);
        else this._clickThroughUsers.delete(owner);

        if(throughFurni) this._clickThroughFurni.add(owner);
        else this._clickThroughFurni.delete(owner);

        // Turning click-through on drops the hand cursor the now-unclickable objects had
        // registered — nothing sends a mouse-out once the clicks stop reaching them.
        if(!wasClickThroughUsers && throughUsers)
        {
            this.removeButtonMouseCursorOwners(this._activeRoomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);
        }

        if(!wasClickThroughFurni && throughFurni)
        {
            this.removeButtonMouseCursorOwners(this._activeRoomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);
            this.removeButtonMouseCursorOwners(this._activeRoomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_mouseCursorUpdate
    private _mouseCursorUpdate: boolean = false;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::_SafeStr_7833
    // (name DERIVED from its readable getter below, the way RoomData's fields were.)
    private _playerUnderCursor: number = -1;

    /**
	 * The user the pointer is over, in game mode only — AS3's game HUD reads it. Outside game
	 * mode it stays -1, because `requestMouseCursor()` only ever writes it under `isGameMode`.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get playerUnderCursor()
    get playerUnderCursor(): number
    {
        return this._playerUnderCursor;
    }

    /**
	 * A room object reporting that the pointer entered or left it — `ROFCAE_MOUSE_BUTTON` on the
	 * way in, `ROFCAE_MOUSE_ARROW` on the way out. Objects register as *owners* of the hand
	 * cursor rather than setting it, so several can claim it and it only drops when the last one
	 * lets go.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::requestMouseCursor()
    requestMouseCursor(type: string, objectId: number, objectType: string): void
    {
        const category = this.getRoomObjectCategory(objectType);
        const isPlayer = this.isGameMode && category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER;

        if(type !== RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_BUTTON)
        {
            if(isPlayer) this._playerUnderCursor = -1;

            this.removeButtonMouseCursorOwner(this._activeRoomId, category, objectId);
        }
        else
        {
            if(isPlayer) this._playerUnderCursor = objectId;

            this.addButtonMouseCursorOwner(this._activeRoomId, category, objectId);
        }
    }

    /**
	 * Note the rights gate, which is AS3's: over a floor or wall item the hand only appears for
	 * someone who can actually use it. Avatars are unconditional.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addButtonMouseCursorOwner()
    private addButtonMouseCursorOwner(roomId: number, category: number, objectId: number): void
    {
        const session = this._roomSessionManager?.getSession(roomId) ?? null;
        const isItem = category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
            || category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL;

        if(isItem && (session === null || session.roomControllerLevel < 1)) return;

        const owners = this.getRoomInstanceData(roomId).mouseButtonCursorOwners;
        const key = category + '_' + objectId;

        if(owners.indexOf(key) === -1)
        {
            owners.push(key);

            this._mouseCursorUpdate = true;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::removeButtonMouseCursorOwner()
    private removeButtonMouseCursorOwner(roomId: number, category: number, objectId: number): void
    {
        const owners = this.getRoomInstanceData(roomId).mouseButtonCursorOwners;
        const index = owners.indexOf(category + '_' + objectId);

        if(index > -1)
        {
            owners.splice(index, 1);

            this._mouseCursorUpdate = true;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::removeButtonMouseCursorOwners()
    private removeButtonMouseCursorOwners(roomId: number, category: number): void
    {
        const owners = this.getRoomInstanceData(roomId).mouseButtonCursorOwners;
        const prefix = category + '_';

        for(let i = owners.length - 1; i >= 0; i--)
        {
            if(owners[i].indexOf(prefix) === 0)
            {
                owners.splice(i, 1);

                this._mouseCursorUpdate = true;
            }
        }
    }

    /**
	 * AS3 writes Flash's global `Mouse.cursor`; the port's equivalent is the document cursor,
	 * which is where `MouseCursorControl` writes too. The client's own canvas rule wins over it
	 * while the pointer is on a window, so `App.onMouseMove()` clears that rule when nothing is
	 * hit — without which none of this would ever be visible.
	 *
	 * Reads the map directly rather than through `getRoomInstanceData()`: AS3's returns null for
	 * an unknown room, this port's *creates* the record, and the cursor must not be what brings a
	 * room's state into existence.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateMouseCursor()
    private updateMouseCursor(): void
    {
        if(!this._mouseCursorUpdate) return;

        this._mouseCursorUpdate = false;

        const data = this._roomInstanceData.get(this._activeRoomId) ?? null;

        document.body.style.cursor = data !== null && data.mouseButtonCursorOwners.length > 0
            ? 'pointer'
            : 'auto';
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get clickThroughUsers()
    get clickThroughUsers(): boolean
    {
        return this._clickThroughUsers.size > 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get clickThroughFurni()
    get clickThroughFurni(): boolean
    {
        return this._clickThroughFurni.size > 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get isInitialized()
    get isInitialized(): boolean
    {
        return this._roomManagerInitialized;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::runUpdate()
    runUpdate(): void
    {
        this.update(1);
    }

    /**
     * TS-only: AS3 has no such member on the engine — callers cast it to its Component base and go
     * through `context.createLinkEvent()` themselves, which a TS interface cannot express. This is
     * that same access, declared instead of cast.
     */
    createLinkEvent(link: string): void
    {
        this.context.createLinkEvent(link);
    }

    /**
     * Detaches the engine from the frame tick entirely, rather than setting a flag the update loop
     * checks — the room previewer uses it to freeze the preview while a dialog rebuilds it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::set disableUpdate()
    set disableUpdate(value: boolean)
    {
        if(value)
        {
            this.removeUpdateReceiver(this);
        }
        else
        {
            this.registerUpdateReceiver(this, 1);
        }
    }

    /**
     * Advances an object to its next automatic state locally — the animation cycle a furni plays in
     * the catalog preview, with no server round trip. Distinct from the private `changeObjectState()`
     * further down, which is the room-object *event* handler that asks the server to toggle a real
     * furni.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::changeObjectState()
    changeObjectState(roomId: number, objectId: number, category: number): void
    {
        const object = this.getRoomObject(roomId, objectId, category) as IRoomObjectController | null;

        if(object === null || object.getModelController() === null) return;

        let stateIndex = object.getModelController().getNumber(RoomObjectVariableEnum.FURNITURE_AUTOMATIC_STATE_INDEX);

        // AS3 starts at 1 rather than 0 when the index has never been set: state 0 is what the
        // object is already showing.
        stateIndex = isNaN(stateIndex) ? 1 : stateIndex + 1;

        object.getModelController().setNumber(RoomObjectVariableEnum.FURNITURE_AUTOMATIC_STATE_INDEX, stateIndex);

        const dataFormat = object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_DATA_FORMAT);
        const stuffData = StuffDataFactory.getStuffDataForType(dataFormat);

        stuffData?.initializeFromRoomObjectModel(object.getModel());

        object.getEventHandler()?.processUpdateMessage(new RoomObjectDataUpdateMessage(stateIndex, stuffData));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::contentLoaded()
    contentLoaded(type: string, success: boolean): void 
    {
        // The "room" bundle (floor/wall/landscape rasterizer data) is only ever
        // loaded through RoomManager's own placeholder-type preload
        // (RoomManager.initialize() -> getPlaceHolderTypes()), which reports back
        // exclusively through this IRoomManagerListener callback — never through
        // _contentLoaderEvents (that path is furniture-only, see loadFurnitureContent()).
        if(success && type === RoomEngine.OBJECT_TYPE_ROOM) 
        {
            this.onRoomContentReady();
        }

        this.resolvePendingImageListeners(type);

        this.events.emit('contentLoaded', type, success);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::objectInitialized()
    // TODO(AS3): only the wall-item branch is ported. Still owed from the same method: re-applying
    //   the stuff data through `furniture_data_format` (RoomObjectDataUpdateMessage), dispatching
    //   REOE_CONTENT_UPDATED, and `addObjectToTileMap()` for any room but "temporary_room".
    objectInitialized(roomId: string, objectId: number, category: number): void
    {
        // A window's logic learns its mask type in initialize(), which runs when the furni's content
        // lands — usually after addObjectWallItem() already asked for the mask and found none. This
        // is AS3's second chance; without it no window loaded with the room ever cut the wall open.
        const numericRoomId = parseInt(roomId, 10);

        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL && !isNaN(numericRoomId))
        {
            this.updateObjectRoomWindow(numericRoomId, objectId);
        }

        this.events.emit('objectInitialized', roomId, objectId, category);
    }

    objectsInitialized(type: string): void 
    {
        this.events.emit('objectsInitialized', type);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getFurnitureType()
    getFurnitureType(type: number): string | null 
    {
        return this._contentLoader?.getActiveObjectType(type) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getFurnitureTypeId()
    getFurnitureTypeId(type: string): number
    {
        return this._contentLoader?.getActiveObjectTypeId(type) ?? 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getWallItemType()
    getWallItemType(type: number, param: string | null = null): string | null 
    {
        return this._contentLoader?.getWallItemType(type, param) ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::initializeRoomObjectInsert()
    initializeRoomObjectInsert(
        source: string,
        itemId: number,
        category: number,
        type: number,
        extra: string,
        stuffData: unknown = null,
        state: number = -1,
        animFrame: number = -1,
        posture: string | null = null,
        repeatedPlacement: boolean = false
    ): boolean
    {
        // AS3's initializeRoomObjectInsert() has no category guard at all — it accepts whatever it is
        // handed and lets handleObjectPlace() build the right kind of ghost. All three categories now
        // have one: floor furniture (10), wall items (20) and users/pets/bots (100).
        this._objectPlacementSource = source;
        this._repeatedPlacement = repeatedPlacement;

        let direction = new Vector3d(0);

        // AS3: the next copy of the same floor furni comes up already rotated the way the last one
        // was placed. Only for category 10, only for the same type, and only while repeating —
        // anything else clears the carry-over so a new selection starts from the default direction.
        if(repeatedPlacement
            && category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
            && type === this._repeatedPlacementTypeId
            && this._repeatedPlacementDirection >= 0)
        {
            direction = new Vector3d(this._repeatedPlacementDirection);
        }
        else
        {
            this.clearRepeatedPlacementData();
        }

        this.setSelectedObjectData(
            this._activeRoomId, itemId, category, new Vector3d(-100, -100), direction,
            RoomObjectOperationEnum.OBJECT_PLACE, type, extra, stuffData as IStuffData | null, state, animFrame, posture
        );
        this.setObjectMoverIconSprite(type, category, false, extra, posture);
        this.setObjectMoverIconSpriteVisible(false);

        // AS3 replays the cached mouse-move here, with the operation check turned OFF. That replay is
        // what makes repeated placement continuous: the item just placed cleared the selection, so
        // without it the next one has no ghost until the mouse moves again — and if the cursor is
        // already where you want the next copy, it never does.
        if(repeatedPlacement)
        {
            this.recalibrateMovements(this._activeRoomId, false);
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::clearRepeatedPlacementData()
    private clearRepeatedPlacementData(): void
    {
        this._repeatedPlacementTypeId = -1;
        this._repeatedPlacementDirection = -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::cancelRoomObjectInsert()
    cancelRoomObjectInsert(): void
    {
        this._repeatedPlacement = false;
        this.clearRepeatedPlacementData();
        this.resetSelectedObjectData(this._activeRoomId);
    }

    /**
     * Clears whatever selection/placement state survived from the room just left, so a stale
     * selected avatar id or an in-progress move/place does not bleed into the next room. AS3 calls
     * this from `_SafeCls_90.as::onRoomSessionEvent()` on RSE_STARTED; this port's composition
     * root (VortexMain) owns that listener and calls this directly, the same way it already does
     * for RoomMessageHandler.setCurrentRoom().
     *
     * `startMoveOrPlacing()`/`stopMoveOrPlacing()` are not ported (nothing currently flips
     * "object_handler" click-through on), so unlike AS3 this always clears the owner rather than
     * only when a flag was set — `setClickSettings()` is a Set add/delete and clearing an owner
     * that was never added is a no-op, so the end state matches.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::enterNewRoom()
    enterNewRoom(): void
    {
        this._selectedAvatarId = -1;
        this._selectedObject = null;
        this._objectPlacementSource = null;
        this.setClickSettings('object_handler', false, false);
    }

    /**
	 * What was last dropped into the room, and is waiting for the server to confirm it.
	 *
	 * It is not the selection: `placeObject()` records the item here and clears the selection in
	 * the same breath, so that when the real object arrives from the server `addObjectFurniture()`
	 * can recognise it and select it — which is what keeps a just-placed furni under the mover.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setPlacedObjectData()
    setPlacedObjectData(roomId: number, data: SelectedRoomObjectData | null): void
    {
        const instanceData = this.getRoomInstanceData(roomId);

        // AS3's `set placedObject` disposes whatever it replaces.
        if(instanceData.placedObjectData !== null && instanceData.placedObjectData !== data)
        {
            instanceData.placedObjectData.dispose();
        }

        instanceData.placedObjectData = data;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPlacedObjectData()
    getPlacedObjectData(roomId: number): ISelectedRoomObjectData | null
    {
        return this._roomInstanceData.get(roomId)?.placedObjectData ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::getSelectedObjectData()
    getSelectedObjectData(roomId: number): ISelectedRoomObjectData | null 
    {
        return this._roomInstanceData.get(roomId)?.selectedObjectData ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::setObjectMoverIconSpriteVisible()
    setObjectMoverIconSpriteVisible(visible: boolean): void 
    {
        if(this._moverIconSprite) this._moverIconSprite.visible = visible;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getObjectMoverIconSpriteVisible()
    getObjectMoverIconSpriteVisible(): boolean 
    {
        return this._moverIconSprite?.visible ?? false;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::getFurnitureIcon()
    // `stuffData` typed `unknown` because it's currently unused by
    // getGenericRoomObjectThumbnail() (Phase 1), and callers may hold either
    // of this codebase's two separate IStuffData interfaces (inventory vs room).
    getFurnitureIcon(type: number, listener: IGetImageListener, param: string | null = null, stuffData: unknown = null): ImageResult 
    {
        const activeType = this._contentLoader?.getActiveObjectType(type) ?? null;
        const colorIndex = this._contentLoader ? String(this._contentLoader.getActiveObjectColorIndex(type)) : '';

        return this.getGenericRoomObjectThumbnail(activeType, colorIndex, listener, param, stuffData);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::getWallItemIcon()
    getWallItemIcon(type: number, listener: IGetImageListener, param: string | null = null): ImageResult 
    {
        const wallType = this._contentLoader?.getWallItemType(type, param) ?? null;
        const colorIndex = this._contentLoader ? String(this._contentLoader.getWallItemColorIndex(type)) : '';

        return this.getGenericRoomObjectThumbnail(wallType, colorIndex, listener, param, null);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getFurnitureImage()
    getFurnitureImage(
        type: number,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener,
        backgroundColor: number = 0,
        param: string | null = null,
        state: number = -1,
        frameCount: number = -1,
        stuffData: unknown = null,
        forceGeneric: boolean = false
    ): ImageResult 
    {
        const activeType = this._contentLoader?.getActiveObjectType(type) ?? null;
        const colorIndex = this._contentLoader ? String(this._contentLoader.getActiveObjectColorIndex(type)) : '';

        if(scale === 1 && listener !== null && !forceGeneric) 
        {
            return this.getGenericRoomObjectThumbnail(activeType, colorIndex, listener, param, stuffData);
        }

        return this.getGenericRoomObjectImage(activeType, colorIndex, direction, scale, listener, backgroundColor, param, stuffData, state, frameCount);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getWallItemImage()
    getWallItemImage(
        type: number,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener,
        backgroundColor: number = 0,
        param: string | null = null,
        state: number = -1,
        frameCount: number = -1
    ): ImageResult 
    {
        const wallType = this._contentLoader?.getWallItemType(type, param) ?? null;
        const colorIndex = this._contentLoader ? String(this._contentLoader.getWallItemColorIndex(type)) : '';

        if(scale === 1 && listener !== null) 
        {
            return this.getGenericRoomObjectThumbnail(wallType, colorIndex, listener, param, null);
        }

        return this.getGenericRoomObjectImage(wallType, colorIndex, direction, scale, listener, backgroundColor, param, null, state, frameCount);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomImage()
    getRoomImage(
        floorType: string | null,
        wallType: string | null,
        landscapeType: string | null,
        scale: number,
        listener: IGetImageListener,
        extra: string | null = null
    ): ImageResult 
    {
        let payload = `${floorType ?? ''}\n${wallType ?? ''}\n${landscapeType ?? ''}\n`;

        if(extra !== null) payload += extra;

        return this.getGenericRoomObjectImage('room', payload, new Vector3d(), scale, listener);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetImage()
    getPetImage(
        type: number,
        paletteId: number,
        color: number,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener | null,
        fullImage: boolean = true,
        backgroundColor: number = 0,
        customParts: { layerId: number; partId: number; paletteId: number }[] | null = null,
        posture: string | null = null
    ): ImageResult 
    {
        let payload = `${type} ${paletteId} ${color.toString(16)}`;

        if(!fullImage) payload += ' head';

        if(customParts !== null) 
        {
            payload += ` ${customParts.length}`;

            for(const part of customParts) payload += ` ${part.layerId} ${part.partId} ${part.paletteId}`;
        }

        const petType = this._contentLoader?.getPetType(type) ?? null;

        return this.getGenericRoomObjectImage(petType, payload, direction, scale, listener, backgroundColor, null, null, -1, -1, posture);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetColor()
    getPetColor(typeId: number, colorId: number): PetColorResult | null 
    {
        if(this._contentLoader != null) return this._contentLoader.getPetColor(typeId, colorId);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetColorsByTag()
    // Returns null (not an empty array) with no content loader, matching AS3 - the caller in
    // PetPreviewCatalogWidget iterates the result, so the distinction is preserved rather than
    // smoothed over.
    getPetColorsByTag(typeId: number, tag: string): PetColorResult[] | null 
    {
        if(this._contentLoader != null) return this._contentLoader.getPetColorsByTag(typeId, tag);

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetLayerIdForTag()
    getPetLayerIdForTag(typeId: number, tag: string): number 
    {
        if(this._contentLoader != null) return this._contentLoader.getPetLayerIdForTag(typeId, tag);

        return -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetDefaultPalette()
    getPetDefaultPalette(typeId: number, tag: string): PetColorResult | null 
    {
        if(this._contentLoader != null) return this._contentLoader.getPetDefaultPalette(typeId, tag);

        return null;
    }

    // per-format payload) until it exists.
    getRoomObjectImage(
        roomId: number,
        objectId: number,
        category: number,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener,
        backgroundColor: number = 0
    ): ImageResult 
    {
        let type: string | null = null;
        let extra: string | null = null;
        let param = '';
        let stuffData: IStuffData | null = null;
        let state = -1;
        let objectFound = false;

        const room = this.getRoomInstance(roomId);

        if(room !== null) 
        {
            const object = room.getObject(objectId, category);

            if(object !== null && object.getModel() !== null) 
            {
                type = object.getType();
                state = object.getId();
                objectFound = true;

                switch(category) 
                {
                    case 10:
                    case 20:
                    {
                        param = String(object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_COLOR));
                        extra = object.getModel().getString(RoomObjectVariableEnum.FURNITURE_EXTRAS);

                        // Format 0 is the plain legacy string, which the visualization already
                        // reads off the model; only the richer formats need a wrapper rebuilt here,
                        // and that is what carries e.g. a poster's chosen image into the icon.
                        const dataFormat = object.getModel().getNumber(RoomObjectVariableEnum.FURNITURE_DATA_FORMAT);

                        if(dataFormat !== 0)
                        {
                            stuffData = StuffDataFactory.getStuffDataForType(dataFormat);
                            stuffData?.initializeFromRoomObjectModel(object.getModel());
                        }

                        break;
                    }
                    case 100:
                        param = object.getModel().getString(RoomObjectVariableEnum.AVATAR_FIGURE);
                }
            }
        }

        // TS deviation: AS3's caller for this method (InfoStandWidgetHandler::handleGetFurniInfoMessage())
        // passes listener=null, making getGenericRoomObjectImage() take its synchronous "content
        // already available" branch unconditionally (the pending/isRoomObjectContentAvailable() gate
        // is skipped entirely whenever no listener is given). This port can't do a truly synchronous
        // capture (ImageBitmap conversion is always async - see ImageResult.ts), so listener is never
        // null here; `objectFound` recreates the same guarantee AS3's callers rely on instead - an
        // object that's actually alive in the room already has its content loaded by definition, so
        // there is no need to wait on a future resolvePendingImageListeners() pass that (for content
        // loaded long before this call) may never fire again.
        return this.getGenericRoomObjectImage(type, param, direction, scale, listener, backgroundColor, extra, stuffData, -1, -1, null, state, objectFound);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getGenericRoomObjectImage()
    // TS deviation: AS3 returns a synchronously-populated BitmapData when content is already
    // available (id=0) and the caller reads result.data directly with no further callback.
    // ImageBitmap conversion is always async in the browser (see ImageResult.ts), so this port
    // always resolves via the pending id>0 path and delivers through imageReady()/imageFailed()
    // - same convention already established by getGenericRoomObjectThumbnail(). The "content
    // already available" branch below therefore must NOT reset result.id to 0 like AS3 does:
    // it still delivers asynchronously (createImageBitmap() is a Promise), so the id returned to
    // the caller has to keep matching the id used in that later imageReady()/imageFailed() call.
    // `forceImmediate` is a TS-only addition (no AS3 equivalent - see getRoomObjectImage()'s own
    // comment): forces this same "capture now, don't wait" branch even when
    // isRoomObjectContentAvailable() says no, for callers that already know their content is loaded.
    getGenericRoomObjectImage(
        type: string | null,
        param: string,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener | null,
        backgroundColor: number = 0,
        extra: string | null = null,
        stuffData: unknown = null,
        state: number = -1,
        frameCount: number = -1,
        posture: string | null = null,
        _originalId: number = -1,
        forceImmediate: boolean = false
    ): ImageResult 
    {
        const result = new ImageResult();

        result.id = -1;

        if(!this._roomManager || type === null) return result;

        let room = this._roomManager.getRoom(RoomEngine.ROOM_TEMP_ID);

        if(room === null)
        {
            room = this._roomManager.createRoom(RoomEngine.ROOM_TEMP_ID, null);

            if(room === null) return result;
        }

        const category = this._contentLoader?.getObjectCategory(type) ?? -2;

        this._imageIdCounter++;

        const objectId = this._imageIdCounter;

        const object = room.createRoomObject(objectId, type, category) as IRoomObjectController | null;

        if(object === null || object.getModelController() === null || object.getEventHandler() === null) return result;

        const modelController = object.getModelController();

        switch(category) 
        {
            case 10:
            case 20:
                modelController.setNumber('furniture_color', Number(param));
                modelController.setString('furniture_extras', extra ?? '');
                break;
            case 100:
                if(type === 'user' || type === 'bot' || type === 'rentable_bot' || type === 'pet') 
                {
                    modelController.setString('figure', param);
                    break;
                }

                {
                    const petFigure = new PetFigureData(param);

                    modelController.setNumber('pet_palette_index', petFigure.paletteId);
                    modelController.setNumber('pet_color', petFigure.color);

                    if(petFigure.headOnly) modelController.setNumber('pet_head_only', 1);

                    if(petFigure.customLayerIds.length > 0) 
                    {
                        modelController.setNumberArray('pet_custom_layer_ids', petFigure.customLayerIds);
                        modelController.setNumberArray('pet_custom_part_ids', petFigure.customPartIds);
                        modelController.setNumberArray('pet_custom_palette_ids', petFigure.customPaletteIds);
                    }

                    if(posture !== null) modelController.setString('figure_posture', posture);
                }

                break;
            case 0:
                // DEVIATION: AS3's visualization factory hands a `room` object the shared
                //   RoomVisualizationData (RoomObjectVisualizationFactory.as l.300). This port's
                //   factory has no `room` branch — it builds that data in RoomEngine, with the
                //   canvas textures only RoomEngine has — so createVisualizationForObject() attaches
                //   it by hand for the live room. The temporary room here was never given it: its
                //   planes had no rasterizer, and the Spaces previews drew flat walls and no view.
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getGenericRoomObjectImage()
                if(this._roomVisualizationData !== null)
                {
                    object.getVisualization()?.initialize(this._roomVisualizationData);
                }

                this.initializeRoomForGettingImage(object, param);
        }

        object.setDirection(direction);
        object.setState(state, 0);

        const visualization = object.getVisualization();

        if(visualization === null)
        {
            room.disposeObject(objectId, category);

            return result;
        }

        if(state > -1 || stuffData) 
        {
            const dataUpdateMessage = new RoomObjectDataUpdateMessage(state, stuffData as IStuffData | null);

            object.getEventHandler()?.processUpdateMessage(dataUpdateMessage);
        }

        const geometry = new RoomGeometry(scale, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5));

        visualization.update(geometry, 0, true, false);

        for(let i = 0; i < frameCount; i++) 
        {
            visualization.update(geometry, 0, true, false);
        }

        result.id = objectId;

        if(!forceImmediate && !this.isRoomObjectContentAvailable(type) && listener !== null) 
        {
            // AS3 also captures a (necessarily blank, since content isn't loaded yet) image here
            // and stores it on the result - this port never trusts a synchronous ImageResult.data
            // (see ImageResult.ts), so that first blank capture is skipped entirely. The object
            // stays alive; resolvePendingImageListeners() re-renders and delivers for real once
            // contentLoaded() fires.
            this._pendingImageListeners.set(objectId, listener);
            modelController.setNumber('image_query_scale', scale, true);
        }
        else 
        {
            const canvas = visualization.getImage(backgroundColor, _originalId);

            room.disposeObject(objectId, category);

            // AS3 ends this branch with `result.id = 0` and the image already on `result.data` -
            // the "synchronous hit" contract ImageResult's own header documents. This port used to
            // hand the canvas to the async createImageBitmap() and deliver through imageReady()
            // instead, on the stated grounds that Texture->ImageBitmap "is inherently asynchronous
            // in the browser". It is not: OffscreenCanvas.transferToImageBitmap() is synchronous,
            // and this codebase already relies on that elsewhere (ColourGridCatalogWidget).
            //
            // Honouring the real contract is not cosmetic. Callers that follow AS3 - every pet
            // catalog widget - call onWidgetsInitialized() from imageReady(), which re-dispatches
            // SelectProduct -> updateImage() -> getPetImage(). With an always-async result that
            // re-enters imageReady() and spins forever, allocating a temporary-room object per
            // iteration. Returning synchronously ends the chain exactly where AS3 ends it.
            if(canvas !== null) 
            {
                const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
                const offscreenCtx = offscreen.getContext('2d');

                if(offscreenCtx !== null) 
                {
                    offscreenCtx.drawImage(canvas, 0, 0);

                    result.data = offscreen.transferToImageBitmap();
                    result.id = 0;

                    return result;
                }
            }

            if(listener !== null) listener.imageFailed(objectId);
        }

        geometry.dispose();

        return result;
    }

    createRoomInstance(roomId: number): IRoomInstance | null 
    {
        if(!this._roomManager) 
        {
            log.warn('RoomManager not available');
            return null;
        }

        const roomIdStr = this.getRoomIdentifier(roomId);

        // Check if room already exists
        let room = this._roomManager.getRoom(roomIdStr);

        if(room) 
        {
            this.getRoomInstanceData(roomId);

            return room;
        }

        // Create via RoomManager
        room = this._roomManager.createRoom(roomIdStr, null);

        if(!room) 
        {
            return null;
        }

        // Create room object and cursors.
        // These go through RoomManager.createRoomObject which handles the internal creation.
        room.createRoomObject(RoomEngine.OBJECT_ID_ROOM, RoomEngine.OBJECT_TYPE_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM);
        room.createRoomObject(RoomEngine.OBJECT_ID_ROOM_HIGHLIGHTER, RoomEngine.OBJECT_TYPE_ROOM_HIGHLIGHTER, RoomObjectCategoryEnum.OBJECT_CATEGORY_CURSOR);

        if(this._configurationManager?.getBoolean('avatar.widget.enabled') !== true) 
        {
            room.createRoomObject(RoomEngine.OBJECT_ID_SELECTION_ARROW, RoomEngine.OBJECT_TYPE_SELECTION_ARROW, RoomObjectCategoryEnum.OBJECT_CATEGORY_CURSOR);
        }

        this.getRoomInstanceData(roomId);

        return room;
    }

    disposeRoomInstance(roomId: number): void 
    {
        if(!this._roomManager) 
        {
            return;
        }

        const roomIdStr = this.getRoomIdentifier(roomId);
        this._roomManager.disposeRoom(roomIdStr);

        this._roomData.delete(roomIdStr);
        this._ownUserIds.delete(roomId);
        this._initializedRooms.delete(roomId);

        const instanceData = this._roomInstanceData.get(roomId);

        if(instanceData !== undefined) 
        {
            instanceData.roomCamera.dispose();
            instanceData.furniStackingHeightMap?.dispose();
            instanceData.tileObjectMap?.dispose();
            instanceData.legacyGeometry.dispose();
            instanceData.selectedObjectData?.dispose();
            instanceData.placedObjectData?.dispose();
            this._roomInstanceData.delete(roomId);
        }

        // Dispose rendering canvas
        this.disposeRenderingCanvas(roomId);

        this.events.emit(RoomEngineEvent.REE_DISPOSED, new RoomEngineEvent(RoomEngineEvent.REE_DISPOSED, roomId));
    }

    getRoomInstance(roomId: number): IRoomInstance | null 
    {
        if(!this._roomManager) 
        {
            return null;
        }

        const roomIdStr = this.getRoomIdentifier(roomId);

        return this._roomManager.getRoom(roomIdStr);
    }

    /**
     * Every object of one category in the **active** room. Unlike `getRoomObject()`, this takes no
     * room id — AS3 resolves the room from `activeRoomId` itself, so a caller cannot ask about a
     * room it is not standing in.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getObjectsByCategory()
    getObjectsByCategory(category: number): IRoomObject[]
    {
        let room: IRoomInstance | null = null;

        if(this._roomManager !== null)
        {
            room = this._roomManager.getRoom(this.getRoomIdentifier(this._activeRoomId));
        }

        if(room === null) return [];

        return room.getObjects(category);
    }

    setActiveRoom(roomId: number): void
    {
        this._activeRoomId = roomId;
    }

    getActiveRoomId(): number 
    {
        return this._activeRoomId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_2223.as::set furniStackingHeightMap()
    // Rebuilding the tileObjectMap here (same width/height) whenever the stacking map is
    // replaced matches AS3's RoomInstanceData setter, which does the same as a side effect.
    setFurniStackingHeightMap(roomId: number, map: FurniStackingHeightMap): void 
    {
        const instanceData = this.getRoomInstanceData(roomId);

        instanceData.furniStackingHeightMap?.dispose();
        instanceData.furniStackingHeightMap = map;

        instanceData.tileObjectMap?.dispose();
        instanceData.tileObjectMap = new TileObjectMap(map.width, map.height);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::getFurniStackingHeightMap()
    getFurniStackingHeightMap(roomId: number): FurniStackingHeightMap | null 
    {
        return this._roomInstanceData.get(roomId)?.furniStackingHeightMap ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getLegacyGeometry()
    // AS3 reads the geometry back off the engine everywhere it is needed — RoomMessageHandler's
    // heightmap/wall-item handlers (_SafeCls_1984.as:569/906/979/1399) and the wall-item placement
    // in _SafeCls_1821.as all go through this accessor. It is per room, which is why it lives on the
    // room instance data and not as one field on whoever happened to fill it in first.
    getLegacyGeometry(roomId: number): LegacyWallGeometry | null
    {
        // AS3 goes through getRoomInstanceData(), the creating variant — not the plain map lookup
        // getFurniStackingHeightMap() uses. That matters: the floor heightmap message can land
        // before anything else has touched the room's instance data, and the geometry it fills in
        // has to be the one the placement paths read back later.
        return this.getRoomInstanceData(roomId).legacyGeometry;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getTileObjectMap()
    getTileObjectMap(roomId: number): TileObjectMap | null
    {
        return this._roomInstanceData.get(roomId)?.tileObjectMap ?? null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::refreshTileObjectMap()
    refreshTileObjectMap(roomId: number, _reason: string): void
    {
        const map = this.getTileObjectMap(roomId);

        // AS3 populates the map only when it exists, but recalibrateMovements() runs
        // unconditionally afterwards (_SafeCls_90.as:4660-4664).
        if(map !== null)
        {
            const objects = this.getRoomInstance(roomId)?.getObjects(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) ?? [];

            map.populate(objects);
        }

        this.recalibrateMovements(roomId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::recalibrateMovements()
    // Replays the cached mouse-move, so an in-progress OBJECT_MOVE/OBJECT_PLACE ghost re-snaps
    // instead of keeping a stale position until the next real mouse-move. Two callers, and the
    // second argument is what separates them:
    //  - after the tile map rebuilds (`checkOperation` left true): only replay when something is
    //    actually being moved or placed;
    //  - from initializeRoomObjectInsert()'s repeated-placement arm (`false`): replay
    //    unconditionally, because the selection was only just created and the point is to build its
    //    ghost right now.
    private recalibrateMovements(roomId: number, checkOperation: boolean = true): void
    {
        if(checkOperation)
        {
            const selectedObjectData = this._roomInstanceData.get(roomId)?.selectedObjectData ?? null;

            if(selectedObjectData === null)
            {
                return;
            }

            const operation = selectedObjectData.operation;

            if(operation !== RoomObjectOperationEnum.OBJECT_MOVE && operation !== RoomObjectOperationEnum.OBJECT_PLACE)
            {
                return;
            }
        }

        const cache = this._moveMouseEventCache;

        if(cache === null)
        {
            return;
        }

        // AS3 replays through handleRoomObjectMouseMove(), which re-reads the operation off the
        // selection rather than taking it from the caller — so this reads it again here rather than
        // reusing the one the guard above may have looked at.
        const data = this._roomInstanceData.get(roomId)?.selectedObjectData ?? null;

        if(data === null) return;

        if(data.operation === RoomObjectOperationEnum.OBJECT_PLACE)
        {
            this.handleObjectPlace(roomId, cache.tileEvent, cache.wallEvent);
        }
        else if(data.operation === RoomObjectOperationEnum.OBJECT_MOVE)
        {
            this.handleObjectMove(roomId, cache.tileEvent, cache.wallEvent);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::rotateActiveObjectPreview()
    // Rotates the ghost of a floor-furniture (cat 10) currently being placed/moved, in place and
    // with no server round-trip — driven by the mouse wheel (no modifier) while a placement/move
    // preview is active. Returns true only when the direction actually changed and validated.
    rotateActiveObjectPreview(roomId: number, forward: boolean): boolean
    {
        const data = this._roomInstanceData.get(roomId)?.selectedObjectData ?? null;

        if(data === null) return false;
        if(data.category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) return false;
        if(data.operation !== RoomObjectOperationEnum.OBJECT_MOVE && data.operation !== RoomObjectOperationEnum.OBJECT_PLACE) return false;

        const object = this.getRoomObject(roomId, data.id, data.category) as IRoomObjectController | null;

        if(object === null) return false;

        const nextDirection = this.getValidRoomObjectDirection(object, forward);

        if(nextDirection === object.getDirection().x) return false;

        const dirVec = new Vector3d(nextDirection);

        if(!this.validateFurnitureDirection(object, dirVec, this.getFurniStackingHeightMap(roomId))) return false;

        object.setDirection(dirVec);
        this.updateSelectedObjectData(
            roomId, data.id, data.category, object.getLocation(), dirVec, data.operation,
            data.typeId, data.instanceData, data.stuffData, data.state, data.animFrame, data.posture
        );
        this.recalibrateMovements(roomId);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetType()
    // Resolves a pet's content type from its figure — the figure's first space-separated token is
    // the pet type id, which RoomContentLoader maps to the asset library name. AS3's own fallback
    // when it has no content loader is the literal 'pet'; kept, even though that type resolves to
    // nothing, because it is the AS3 behaviour and the loader is never actually null here.
    private getPetType(figure: string | null): string | null
    {
        if(figure !== null)
        {
            const parts = figure.split(' ');

            if(parts.length > 1)
            {
                const typeId = parseInt(parts[0], 10);

                if(this._contentLoader !== null) return this._contentLoader.getPetType(typeId);

                return RoomObjectUserTypes.PET;
            }
        }

        return null;
    }

    addRoomObjectUser(
        roomId: number,
        id: number,
        location: IVector3d,
        direction: IVector3d,
        type: string
    ): boolean
    {
        const room = this.getRoomInstance(roomId);
        if(!room) 
        {
            return false;
        }

        // AS3 (addObjectUser -> createObjectUser) passes the resolved object *type* straight
        // through; this port used to map it to a RoomObjectLogicEnum value first and pass that
        // instead. The mapping was a pure identity — RoomObjectLogicEnum and RoomObjectUserTypes
        // declare the same four strings ('user'/'pet'/'bot'/'rentable_bot') — so it changed nothing
        // for users and bots, but it also *undid* addObjectUser()'s pet-type resolution: a pet
        // arriving here as its real content type ('monsterplant', ...) matched none of the cases
        // and silently fell back to 'user'. Passing `type` is what AS3 does and is identical for
        // every previously-working case.
        //
        // RoomManager.createRoomObject() then derives the logic and visualization from this type
        // via RoomContentLoader (getLogicType()/getVisualizationType() off the bundle's index), so
        // a real pet type resolves to PetLogic + AnimatedPetVisualization the same way 'user'
        // resolves to AvatarLogic + AvatarVisualization.
        const object = room.createRoomObject(id, type, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

        if(!object) 
        {
            return false;
        }

        (object as IRoomObjectController).setLocation(location);
        (object as IRoomObjectController).setDirection(direction);

        this.events.emit(
            RoomEngineObjectEvent.REOE_ADDED,
            new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_ADDED, roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        );

        return true;
    }

    addRoomObjectFurniture(
        roomId: number,
        id: number,
        typeId: number,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        extra: string | null,
        expiryTime: number,
        usagePolicy: number,
        ownerId: number,
        ownerName: string | null,
        _synchronize = true,
        data: IStuffData | null = null,
        realRoomObject: boolean = true
    ): boolean
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        // Resolve className from typeId using SessionDataManager
        const className = this.getFurnitureClassName(typeId, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

        // AS3: _SafeCls_90.as::createObjectFurniture() passes the real furniture classname
        // (not a pre-resolved logic type) into createObject() - RoomManager.createRoomObject()
        // resolves visualizationType/logicType/content-loading itself from this className.
        // Passing logicType here (as this used to) made loadObjectContent() try to fetch
        // assets for a fake type like "furniture_multistate", which has none - the object
        // got stuck on placeholder content forever since no real content load ever completes
        // for a type that doesn't exist.
        const object = room.createRoomObject(id, className, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

        if(!object) 
        {
            return false;
        }

        (object as IRoomObjectController).setLocation(location);
        (object as IRoomObjectController).setDirection(direction);

        const model = (object as IRoomObjectController).getModelController();

        if(model) 
        {
            // AS3: _SafeCls_90.as::addObjectFurnitureFromData() - furniture_color was never written
            // here, so FurnitureVisualization::updateObject()'s getNumber('furniture_color') read
            // always came back unset and every colorized furni (chair_norja*2, bowl*3, ...) rendered
            // with getColor()'s 0xFFFFFF default tint - i.e. white - instead of its palette color.
            // The icon/image paths (getFurnitureIcon()/getFurnitureImage()) already passed the index
            // through, which is why the same item looked correct in the catalog but white in-room.
            model.setNumber(RoomObjectVariableEnum.FURNITURE_COLOR, this.getFurnitureColorIndex(typeId), true);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID, typeId);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA, state);
            // AS3: _SafeCls_90.as::addObjectFurnitureFromData() — neither of these two was written.
            // `furniture_real_room_object` gates fifteen `getNumber(...) === 1` tests across the
            // furniture logics (dimmer, jukebox, song disk, sound machine, crackable, high score,
            // pet customization, pet product, background colour, area hide, and FurnitureLogic's
            // own widget dispatch), and with no writer every one of them was permanently false:
            // clicking any of that furniture opened nothing. `furniture_ad_url` is what
            // `RoomDesktop.handleRoomAdClick()`/`handleRoomAdTooltip()` read, and
            // `RoomContentLoader.getRoomObjectAdURL()` had no caller either.
            model.setString(RoomObjectVariableEnum.FURNITURE_AD_URL, this.roomContentLoader.getRoomObjectAdURL(className), true);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT, realRoomObject ? 1 : 0, false);
            // AS3: _SafeCls_90.as::addObjectFurnitureFromData() - expiry_time/expirty_timestamp/
            // usage_policy were never written here, so InfoStandWidgetHandler's getNumber() reads
            // (both default to NaN when unset) always failed their === 1/=== 2 usage-policy checks
            // and always computed a NaN rent-expiration - the infostand's USE button and rent
            // extend/buyout buttons could never show regardless of server data or rights.
            model.setNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIME, expiryTime);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIMESTAMP, Date.now());
            model.setNumber(RoomObjectVariableEnum.FURNITURE_USAGE_POLICY, usagePolicy);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_OWNER_ID, ownerId);

            if(ownerName) 
            {
                model.setString(RoomObjectVariableEnum.FURNITURE_OWNER_NAME, ownerName);
            }

            // Both variables are real and AS3 writes both, in different places: the numeric
            // `furniture_extra` here (_SafeCls_90.as:3046, from a DTO whose `extra` is a Number),
            // and the string `furniture_extras` at _SafeCls_1722.as:327 / RoomPreviewer.as:174 /
            // _SafeCls_90.as:4277. This port flattened the DTO and typed `extra` as string, so it
            // had only ever written the string one — leaving the numeric variable unset for its
            // one reader, the custom-stack-height widget handler's `getNumber("furniture_extra")
            // == 1` test (_SafeCls_3852.as:98). Writing both keeps the port's own FURNITURE_EXTRAS
            // readers (:2272, :4459) working without changing this signature.
            if(extra)
            {
                // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::addObjectFurnitureFromData()
                model.setString(RoomObjectVariableEnum.FURNITURE_EXTRAS, extra);

                const extraValue = Number(extra);

                // AS3's `extra` is a Number and cannot be non-numeric; this port's string can be,
                // and setNumber(NaN) would poison the `== 1` test with a value that fails every
                // comparison instead of simply reading as absent.
                if(!isNaN(extraValue))
                {
                    model.setNumber(RoomObjectVariableEnum.FURNITURE_EXTRA, extraValue);
                }
            }
        }

        // AS3: _SafeCls_90.as::addObjectFurnitureFromData() calls updateObjectFurniture() right
        // after createObjectFurniture(), which dispatches a RoomObjectDataUpdateMessage carrying
        // the real IStuffData through the object's own event handler - this port was previously
        // dropping `data` entirely (both call sites either had no parameter for it or collapsed it
        // to `extra.toString()`/`getLegacyString()`), so format-2+ stuff data (e.g. guild-colored
        // furniture) never reached FurnitureGuildCustomizedLogic and rendered with un-substituted
        // base sprite content instead of the cropped/offset badge thumbnail.
        if(data) 
        {
            const eventHandler = (object as IRoomObjectController).getEventHandler();

            eventHandler?.processUpdateMessage(new RoomObjectDataUpdateMessage(state, data));
        }

        // Trigger furniture asset loading
        this.loadFurnitureContent(roomId, id, className, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

        this.events.emit(
            RoomEngineObjectEvent.REOE_ADDED,
            new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_ADDED, roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        );

        return true;
    }

    addRoomObjectWallItem(
        roomId: number,
        id: number,
        typeId: number,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        extra: string | null,
        expiryTime: number,
        usagePolicy: number,
        ownerId: number,
        ownerName: string | null,
        realRoomObject: boolean = true
    ): boolean
    {
        const room = this.getRoomInstance(roomId);

        if(!room)
        {
            return false;
        }

        // Resolve className from typeId using SessionDataManager
        const className = this.getFurnitureClassName(typeId, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL);

        // AS3: _SafeCls_90.as::createObjectFurniture()/createObject() - see addRoomObjectFurniture()'s
        // comment above for why the real classname (not a pre-resolved logic type) must be passed here.
        const object = room.createRoomObject(id, className, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL);

        if(!object) 
        {
            return false;
        }

        (object as IRoomObjectController).setLocation(location);
        (object as IRoomObjectController).setDirection(direction);

        const model = (object as IRoomObjectController).getModelController();

        if(model) 
        {
            // AS3: _SafeCls_90.as::addObjectWallItemFromData() - same furniture_color gap as the
            // floor path above. AS3 writes this one non-immutable (unlike the floor path's `true`).
            model.setNumber(RoomObjectVariableEnum.FURNITURE_COLOR, this.getWallItemColorIndex(typeId), false);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_TYPE_ID, typeId);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA, state);
            // The same two the floor path was missing, plus `object_accurate_z_value`, which the
            // renderer reads per object through `roomObjectVariableAccurateZ` (set at :5873) —
            // AS3 writes it on every wall item and only on wall items.
            // AS3: _SafeCls_90.as::addObjectWallItemFromData()
            model.setString(RoomObjectVariableEnum.FURNITURE_AD_URL, this.roomContentLoader.getRoomObjectAdURL(className), true);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_REAL_ROOM_OBJECT, realRoomObject ? 1 : 0, false);
            model.setNumber(RoomObjectVariableEnum.OBJECT_ACCURATE_Z_VALUE, 1, true);
            // AS3: _SafeCls_90.as::addObjectWallItemFromData() - see addRoomObjectFurniture()'s
            // matching comment above; the wall-item path had the exact same gap.
            model.setNumber(RoomObjectVariableEnum.FURNITURE_USAGE_POLICY, usagePolicy);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIME, expiryTime);
            model.setNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIMESTAMP, Date.now());
            model.setNumber(RoomObjectVariableEnum.FURNITURE_OWNER_ID, ownerId);

            if(ownerName) 
            {
                model.setString(RoomObjectVariableEnum.FURNITURE_OWNER_NAME, ownerName);
            }

            // Both variables are real and AS3 writes both, in different places: the numeric
            // `furniture_extra` here (_SafeCls_90.as:3046, from a DTO whose `extra` is a Number),
            // and the string `furniture_extras` at _SafeCls_1722.as:327 / RoomPreviewer.as:174 /
            // _SafeCls_90.as:4277. This port flattened the DTO and typed `extra` as string, so it
            // had only ever written the string one — leaving the numeric variable unset for its
            // one reader, the custom-stack-height widget handler's `getNumber("furniture_extra")
            // == 1` test (_SafeCls_3852.as:98). Writing both keeps the port's own FURNITURE_EXTRAS
            // readers (:2272, :4459) working without changing this signature.
            if(extra)
            {
                // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::addObjectFurnitureFromData()
                model.setString(RoomObjectVariableEnum.FURNITURE_EXTRAS, extra);

                const extraValue = Number(extra);

                // AS3's `extra` is a Number and cannot be non-numeric; this port's string can be,
                // and setNumber(NaN) would poison the `== 1` test with a value that fails every
                // comparison instead of simply reading as absent.
                if(!isNaN(extraValue))
                {
                    model.setNumber(RoomObjectVariableEnum.FURNITURE_EXTRA, extraValue);
                }
            }
        }

        this.loadFurnitureContent(roomId, id, className, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL);

        return true;
    }

    getRoomObject(roomId: number, objectId: number, category: number): IRoomObject | null 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return null;
        }

        return room.getObject(objectId, category);
    }

    disposeRoomObject(roomId: number, objectId: number, category: number): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const success = room.disposeObject(objectId, category);

        if(success) 
        {
            this.events.emit(
                RoomEngineObjectEvent.REOE_REMOVED,
                new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_REMOVED, roomId, objectId, category)
            );
        }

        return success;
    }

    /**
     * The one entry point for "the user asked to change this object": rotate, pick up, eject or
     * start a move.
     *
     * This carried a marker saying there was "no cancel/right-click binding onto the move it
     * starts — a shared gap with the unbuilt furniture-context-menu widget". Both halves were
     * wrong, checked 2026-09-05. The widget is built and wired
     * (`ui/widget/furniture/contextmenu/FurnitureContextMenuWidget.ts` plus its handler, a
     * `RoomWidgetFactory` case and a `RoomDesktop` case). And AS3 has no right-click binding to
     * port: `WME_RIGHT_CLICK` is declared in `WindowMouseEvent.as` and listened for nowhere under
     * `com/sulake/`. The cancel itself exists and is complete — `cancelRoomObjectInsert()`, at all
     * three AS3 call sites (catalog, recycler widget, furni model).
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::modifyRoomObject()
    modifyRoomObject(objectId: number, category: number, action: string): boolean
    {
        const object = this.getRoomObject(this._activeRoomId, objectId, category);

        // DEVIATION: AS3 refuses every operation here while the room is in wired play-test mode;
        // the RPG has no wired, so no play-test mode.
        const session = this._roomSessionManager?.getSession(this._activeRoomId) ?? null;

        // DEVIATION: since the core cut (2026-10-07) the server takes no furni move, rotation or
        //   pickup (no MoveObject, MoveWallItem nor PickupObject in its Headers.cs): the decor is the
        //   map editor's. The modifier shortcuts (Shift, Ctrl, Alt-drag) and the move button used to
        //   move or turn a furni on screen alone, where the server never heard of it.
        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE || category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL) return false;

        switch(action)
        {
            // AS3: _SafeCls_1821.as::modifyRoomObject() "OBJECT_ROTATE_POSITIVE"/"OBJECT_ROTATE_NEGATIVE" case
            case RoomObjectOperationEnum.OBJECT_ROTATE_POSITIVE:
            case RoomObjectOperationEnum.OBJECT_ROTATE_NEGATIVE: {
                if(!object || !this._connection) return false;

                const controller = object as IRoomObjectController;

                const forward = action === RoomObjectOperationEnum.OBJECT_ROTATE_POSITIVE;
                const nextDirection = this.getValidRoomObjectDirection(controller, forward);
                const stackingMap = this.getFurniStackingHeightMap(this._activeRoomId);

                if(!this.validateFurnitureDirection(controller, new Vector3d(nextDirection), stackingMap)) return false;

                const location = controller.getLocation();

                // AS3: for a monsterplant/rentable_bot the rotation goes through
                // sendMoveUserObjectMessage (MovePet 432 / MoveBot 1295), NOT the furniture
                // MoveObject composer. The type is checked, not the category — AS3 tests
                // getType() here even though only category 100 can carry those two types.
                if(controller.getType() === 'monsterplant' || controller.getType() === 'rentable_bot')
                {
                    return this.sendMoveUserObjectMessage(
                        session, controller, objectId,
                        Math.trunc(location.x), Math.trunc(location.y), nextDirection / 45
                    );
                }

                this._connection.send(new MoveObjectMessageComposer(objectId, Math.trunc(location.x), Math.trunc(location.y), nextDirection / 45));

                return true;
            }
            // AS3: _SafeCls_1821.as::modifyRoomObject() "OBJECT_PICKUP_PET" case — pick up a
            // monsterplant, sent via roomSession.pickUpPet(webID) resolved from the room index.
            case RoomObjectOperationEnum.OBJECT_PICKUP_PET: {
                const userData = session?.userDataManager?.getUserDataByIndex(objectId) ?? null;

                if(session === null || userData === null) return false;

                session.pickUpPet(userData.webID);

                return true;
            }
            // AS3: _SafeCls_1821.as::modifyRoomObject() "OBJECT_PICKUP_BOT" case — connection.send(
            // new _SafeCls_3108(webID)) (id 2743).
            case RoomObjectOperationEnum.OBJECT_PICKUP_BOT: {
                // Mirrors the pet branch above: AS3 resolves the user data and sends its webID,
                // not the room-object id. The server answers it (RemoveBotFromFlatMessageHandler
                // → BotRemovedFromInventory/BotAddedToInventory), so the bot really does come back
                // into the hand.
                if(this._connection === null) return false;

                const userData = session?.userDataManager?.getUserDataByIndex(objectId) ?? null;

                if(session === null || userData === null) return false;

                this._connection.send(new RemoveBotFromFlatMessageComposer(userData.webID));

                return true;
            }
            case RoomObjectOperationEnum.OBJECT_PICKUP:
            case RoomObjectOperationEnum.OBJECT_EJECT: {
                // DEVIATION: AS3 disposes whatever send() did. Since the core cut (2026-10-07) pickup is
                //   outside the server contract, send() refuses it, and disposing anyway removed on screen
                //   a furni the server still has; the object now stays unless the request left.
                if(this._connection && !this._connection.send(new PickupObjectMessageComposer(objectId, category))) return false;

                return this.disposeRoomObject(this._activeRoomId, objectId, category);
            }
            // AS3: _SafeCls_1821.as::modifyRoomObject() "OBJECT_MOVE" case
            case RoomObjectOperationEnum.OBJECT_MOVE: {
                // AS3 puts no category condition on this case at all, because it can finish a move
                // for all three, and neither does this port any more. Floor furni (10) and
                // bots/plants (100) go through handleObjectMove()'s tile arm, which treats the two
                // identically as AS3 does (_SafeCls_1821.as:1112); wall items (20) go through its
                // wall arm and end on MoveWallItemMessageComposer. InfoStandWidgetHandler's move
                // button is the caller that reaches here with category 20.
                if(!object) return false;

                const controller = object as IRoomObjectController;

                this.setObjectAlphaMultiplier(controller, 0.5);
                this.setSelectedObjectData(
                    this._activeRoomId, objectId, category, controller.getLocation(), controller.getDirection(), RoomObjectOperationEnum.OBJECT_MOVE
                );
                this.setObjectMoverIconSprite(objectId, category, true);
                this.setObjectMoverIconSpriteVisible(false);

                return true;
            }
            default:
                log.warn(`modifyRoomObject: action not implemented yet: ${action}`);

                return false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::useRoomObjectInActiveRoom()
    useRoomObjectInActiveRoom(objectId: number, category: number): boolean 
    {
        const object = this.getRoomObject(this._activeRoomId, objectId, category);
        const handler = object?.getMouseHandler() as IRoomObjectEventHandler | null;

        if(handler?.useObject) 
        {
            handler.useObject();

            return true;
        }

        return false;
    }

    /**
	 * Save a floor furniture's stuff data — the ad-furni branding path.
	 *
	 * Two AS3 methods collapsed into one here, matching how this port already folds the
	 * RoomObjectEventHandler into the engine: `_SafeCls_90.as` gates on category 10 and forwards,
	 * `_SafeCls_1821.as` resolves the object, rejects any operation other than
	 * OBJECT_SAVE_STUFF_DATA, and sends. The unknown-operation branch logs rather than returning
	 * false — AS3 returns true either way once the object resolves.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::modifyRoomObjectDataWithMap()
    modifyRoomObjectDataWithMap(objectId: number, category: number, action: string, data: Map<string, string>): boolean
    {
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) return false;

        const object = this.getRoomObject(this._activeRoomId, objectId, category);

        if(object === null) return false;

        if(action !== RoomObjectOperationEnum.OBJECT_SAVE_STUFF_DATA)
        {
            log.warn(`could not modify room object data, unknown operation ${action}`);
        }
        else if(this._connection !== null)
        {
            this._connection.send(new SetObjectDataMessageComposer(objectId, data));
        }

        return true;
    }

    updateRoomObjectUser(
        roomId: number,
        objectId: number,
        location: IVector3d | null,
        targetLocation: IVector3d | null,
        direction: IVector3d | null,
        headDirection: number,
        canStandUp: boolean,
        baseY: number,
        animationTime: number = NaN,
        skipPositionUpdate: boolean = false,
        jumpingPower: number = NaN
    ): boolean
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;
        const handler = object?.getEventHandler() ?? null;
        const model = object?.getModel() ?? null;

        if(!object || handler === null || model === null) 
        {
            return false;
        }

        const resolvedLocation = location ?? object.getLocation();
        const resolvedDirection = direction ?? object.getDirection();
        let resolvedHeadDirection = headDirection;

        if(Number.isNaN(resolvedHeadDirection)) 
        {
            const modelHeadDirection = model.getNumber(RoomObjectVariableEnum.HEAD_DIRECTION);

            resolvedHeadDirection = Number.isNaN(modelHeadDirection) ? 0 : modelHeadDirection;
        }

        let resolvedBaseY = baseY;
        const roomZScale = room.getNumber('room_z_scale');

        if(!Number.isNaN(roomZScale) && roomZScale !== 0) 
        {
            resolvedBaseY = resolvedBaseY / roomZScale;
        }

        let avatarLocation = resolvedLocation;

        if(resolvedLocation !== null && resolvedBaseY !== 0) 
        {
            avatarLocation = new Vector3d(resolvedLocation.x, resolvedLocation.y, resolvedLocation.z + resolvedBaseY);
        }

        const avatarMessage = new RoomObjectAvatarUpdateMessage(
            this.fixedUserLocation(roomId, avatarLocation),
            this.fixedUserLocation(roomId, targetLocation),
            resolvedDirection,
            resolvedHeadDirection,
            canStandUp,
            resolvedBaseY,
            animationTime,
            skipPositionUpdate,
            jumpingPower
        );

        handler.processUpdateMessage(avatarMessage);

        return true;
    }

    updateRoomObjectUserFigure(
        roomId: number,
        objectId: number,
        figure: string,
        gender: string | null,
        clubLevel: string | null,
        isRiding: boolean
    ): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarFigureUpdateMessage(figure, gender ?? 'M', '', isRiding);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    updateRoomObjectUserPosture(roomId: number, objectId: number, posture: string, parameter: string): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarPostureUpdateMessage(posture, parameter);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    updateRoomObjectUserGesture(roomId: number, objectId: number, gesture: number): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarGestureUpdateMessage(gesture);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    /**
	 * The room-rights level the server reports for an avatar. `AvatarLogic` turns it into the
	 * `figure_flat_control` model value the visualization draws the marker from.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectUserFlatControl()
    updateObjectUserFlatControl(roomId: number, objectId: number, flatControl: string | null): boolean
    {
        const object = this.getRoomObject(roomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

        if(!object || !object.getEventHandler()) return false;

        object.getEventHandler()!.processUpdateMessage(new RoomObjectAvatarFlatControlUpdateMessage(flatControl));

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectUserBlocked()
    updateObjectUserBlocked(roomId: number, objectId: number, isBlocked: boolean): boolean
    {
        const object = this.getRoomObject(roomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

        if(!object || !object.getEventHandler()) return false;

        object.getEventHandler()!.processUpdateMessage(new RoomObjectAvatarBlockedUpdateMessage(isBlocked));

        return true;
    }

    /**
	 * Pets live in the user category, so this looks the object up exactly as the avatar
	 * updates do — AS3 calls the same `getObjectUser()` here.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectPetGesture()
    updateObjectPetGesture(roomId: number, objectId: number, gesture: string): boolean
    {
        const object = this.getRoomObject(roomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

        if(!object || !object.getEventHandler()) return false;

        object.getEventHandler()!.processUpdateMessage(new RoomObjectAvatarPetGestureUpdateMessage(gesture));

        return true;
    }

    updateRoomObjectUserEffect(roomId: number, objectId: number, effect: number, delay = 0): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarEffectUpdateMessage(effect, delay);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    updateRoomObjectUserChat(roomId: number, objectId: number, numberOfWords: number): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarChatUpdateMessage(numberOfWords);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    updateRoomObjectUserTyping(roomId: number, objectId: number, isTyping: boolean): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarTypingUpdateMessage(isTyping);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    updateRoomObjectUserDance(roomId: number, objectId: number, danceStyle: number): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarDanceUpdateMessage(danceStyle);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    updateRoomObjectUserSleep(roomId: number, objectId: number, isSleeping: boolean): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarSleepUpdateMessage(isSleeping);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    updateRoomObjectUserCarryObject(roomId: number, objectId: number, itemType: number): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarCarryObjectUpdateMessage(itemType);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    updateRoomObjectUserSign(roomId: number, objectId: number, signType: number): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        const message = new RoomObjectAvatarSignUpdateMessage(signType);

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    setRoomObjectUserOwnUser(roomId: number, objectId: number): boolean
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController;

        if(!object || !object.getEventHandler()) 
        {
            return false;
        }

        this.setRoomOwnObjectId(roomId, objectId);

        const message = new RoomObjectAvatarOwnMessage();

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    /**
     * How many queued items to build between clock reads.
     *
     * AS3 checks the elapsed time every fourth item rather than every item, because reading the
     * clock is not free either.
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::createRoomFurniture() (`_loc4_ % 4`)
    private static readonly FURNITURE_BUILD_BATCH: number = 4;

    /** The frame budget the drain gives itself before leaving the rest for the next one. */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::createRoomFurniture() (`>= 30`)
    private static readonly FURNITURE_BUILD_BUDGET_MS: number = 30;

    /**
     * Builds queued furniture, floor first then walls, for as long as the frame budget allows.
     *
     * Game mode drains without a budget: AS3 skips the time check there because a game room has
     * to be whole before the first frame, not merely soon.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::createRoomFurniture()
    private createRoomFurniture(): void
    {
        const startedAt = performance.now();

        for(const [roomId, instanceData] of this._roomInstanceData)
        {
            let built = 0;
            let outOfTime = false;

            while(instanceData.furnitureQueue.length > 0)
            {
                const data = instanceData.furnitureQueue.shift()!;

                if(data.className !== null)
                {
                    this.addObjectFurnitureByNameFromData(
                        roomId, data.id, data.className, data.location, data.direction, data.state);
                }
                else
                {
                    this.addRoomObjectFurniture(
                        roomId, data.id, data.typeId, data.location, data.direction, data.state,
                        data.extra.toString(), data.expiryTime, data.usagePolicy, data.ownerId,
                        data.ownerName, data.synchronized, data.data);
                }

                if(++built % RoomEngine.FURNITURE_BUILD_BATCH === 0
                    && !this._isGameMode
                    && performance.now() - startedAt >= RoomEngine.FURNITURE_BUILD_BUDGET_MS)
                {
                    outOfTime = true;
                    break;
                }
            }

            while(!outOfTime && instanceData.wallItemQueue.length > 0)
            {
                const data = instanceData.wallItemQueue.shift()!;

                this.addObjectWallItemFromData(
                    roomId, data.id, data.typeId, data.location, data.direction, data.state,
                    data.data, data.usagePolicy, data.ownerId, data.ownerName, data.secondsToExpiration);

                if(++built % RoomEngine.FURNITURE_BUILD_BATCH === 0
                    && !this._isGameMode
                    && performance.now() - startedAt >= RoomEngine.FURNITURE_BUILD_BUDGET_MS)
                {
                    outOfTime = true;
                    break;
                }
            }

            // AS3 returns rather than continuing to the next room: the budget is for the whole
            // pass, not per room, so a room that used it up ends the pass.
            if(outOfTime) return;
        }
    }

    /**
     * TS-only: the safety net under the queue.
     *
     * `update()` is what drains the queue in AS3, and nothing calls `update()` here — the port
     * runs off a PixiJS ticker instead (see `setTicker()`). Anything that builds a room without
     * ever attaching one, `RoomPreviewer` included, would otherwise queue furniture that is
     * never built. With no ticker the queue is drained on the spot, which is exactly the
     * behaviour this port had before the queue existed.
     */
    private drainFurnitureQueuesIfUnticked(): void
    {
        if(this._ticker === null) this.createRoomFurniture();
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::update()
    update(time: number): void
    {
        if(this._roomManager)
        {
            // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::update() calls this first.
            this.createRoomFurniture();
            this._roomManager.update(time);

            // AS3 iterates ALL room instances and updates each renderer —
            // not only the active room. This is what drives rendering of
            // window-hosted rooms such as the RoomPreviewer's preview room.
            const count = this._roomManager.getRoomCount();

            for(let i = 0; i < count; i++) 
            {
                const room = this._roomManager.getRoomWithIndex(i);
                const renderer = room?.getRenderer();

                if(renderer) 
                {
                    renderer.update(time);
                }
            }

            this.updateRoomCameras(time);
        }
    }

    // TS-only: RoomEngine.update(time) is not actually driven by a running
    // loop in this port (nothing calls it from vortex-client) — the visible
    // room rendering instead rides the shared PixiJS Application ticker set
    // here, which does run continuously. Used to keep window-hosted room
    // canvases (e.g. RoomPreviewerWidget) that createRoomCanvas() parents onto
    // the root stage — not the window tree — synced to their host window's
    // screen position/visibility every frame, matching how AS3's RoomPreviewer
    // relies on a continuous per-frame tick (registerUpdateReceiver) rather
    // than reacting to specific window events.
    setTicker(ticker: Ticker): void 
    {
        this._ticker?.remove(this.onTickerUpdate);
        this._ticker = ticker;
        this._ticker.add(this.onTickerUpdate);
    }

    registerCanvasSyncCallback(callback: () => void): void 
    {
        this._canvasSyncCallbacks.add(callback);
    }

    unregisterCanvasSyncCallback(callback: () => void): void
    {
        this._canvasSyncCallbacks.delete(callback);
    }

    initializeRoomVisuals(
        roomId: number,
        floorType: string,
        wallType: string,
        landscapeType: string,
        worldType: number
    ): void 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return;
        }

        const roomObject = room.getObject(RoomEngine.OBJECT_ID_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM) as IRoomObjectController;

        if(roomObject) 
        {
            const model = roomObject.getModelController();

            if(model) 
            {
                model.setString(RoomObjectVariableEnum.ROOM_FLOOR_TYPE, floorType, true);
                model.setString(RoomObjectVariableEnum.ROOM_WALL_TYPE, wallType, true);
                model.setString(RoomObjectVariableEnum.ROOM_LANDSCAPE_TYPE, landscapeType, true);
                model.setNumber(RoomObjectVariableEnum.ROOM_WORLD_TYPE, worldType, true);
            }
        }

        this.events.emit(RoomEngineEvent.REE_INITIALIZED, new RoomEngineEvent(RoomEngineEvent.REE_INITIALIZED, roomId));
    }

    /**
     * The "room object doesn't exist yet" branch used to carry a TODO saying it could not be
     * ported: `win63_version` decompiles it into `null.floorType = param2`-style lines that cannot
     * be the real code. The primary tree has it intact — the update is buffered onto the same
     * `RoomData` that `initializeRoom()` parks, and reaches the room when the floor height map
     * finally builds it. See CLAUDE.md → "win63_version is a worse decompile".
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectRoom()
    updateObjectRoom(roomId: number, floorType?: string | null, wallType?: string | null, landscapeType?: string | null, skipModelUpdate: boolean = false): boolean
    {
        const room = this.getRoomInstance(roomId);
        const roomObject = room?.getObject(RoomEngine.OBJECT_ID_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM) as IRoomObjectController | null;

        if(!roomObject)
        {
            const roomIdentifier = this.getRoomIdentifier(roomId);
            let roomData = this._roomDatas.get(roomIdentifier) ?? null;

            if(roomData === null)
            {
                roomData = new RoomData(roomId, null);

                this._roomDatas.set(roomIdentifier, roomData);
            }

            if(floorType != null) roomData.floorType = floorType;

            if(wallType != null) roomData.wallType = wallType;

            if(landscapeType != null) roomData.landscapeType = landscapeType;

            return true;
        }

        const eventHandler = roomObject.getEventHandler();

        if(!eventHandler) return false;

        if(floorType != null) 
        {
            if(room && !skipModelUpdate) room.setString(RoomObjectVariableEnum.ROOM_FLOOR_TYPE, floorType);

            eventHandler.processUpdateMessage(new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_FLOOR_UPDATE, floorType));
        }

        if(wallType != null) 
        {
            if(room && !skipModelUpdate) room.setString(RoomObjectVariableEnum.ROOM_WALL_TYPE, wallType);

            eventHandler.processUpdateMessage(new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_WALL_UPDATE, wallType));
        }

        if(landscapeType != null) 
        {
            if(room && !skipModelUpdate) room.setString(RoomObjectVariableEnum.ROOM_LANDSCAPE_TYPE, landscapeType);

            eventHandler.processUpdateMessage(new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_LANDSCAPE_UPDATE, landscapeType));
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectRoomVisibilities()
    updateObjectRoomVisibilities(roomId: number, wallsVisible: boolean, floorVisible: boolean = true): boolean 
    {
        const room = this.getRoomInstance(roomId);
        const roomObject = room?.getObject(RoomEngine.OBJECT_ID_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM) as IRoomObjectController | null;
        const eventHandler = roomObject?.getEventHandler();

        if(!eventHandler) return false;

        eventHandler.processUpdateMessage(new RoomObjectRoomPlaneVisibilityUpdateMessage(RoomObjectRoomPlaneVisibilityUpdateMessage.WALL_VISIBILITY, wallsVisible));
        eventHandler.processUpdateMessage(new RoomObjectRoomPlaneVisibilityUpdateMessage(RoomObjectRoomPlaneVisibilityUpdateMessage.FLOOR_VISIBILITY, floorVisible));

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectRoomPlaneThicknesses()
    updateObjectRoomPlaneThicknesses(roomId: number, wallThicknessMultiplier: number, floorThicknessMultiplier: number): boolean 
    {
        const room = this.getRoomInstance(roomId);
        const roomObject = room?.getObject(RoomEngine.OBJECT_ID_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM) as IRoomObjectController | null;
        const eventHandler = roomObject?.getEventHandler();

        if(!eventHandler) return false;

        eventHandler.processUpdateMessage(new RoomObjectRoomPlanePropertyUpdateMessage(RoomObjectRoomPlanePropertyUpdateMessage.WALL_THICKNESS, wallThicknessMultiplier));
        eventHandler.processUpdateMessage(new RoomObjectRoomPlanePropertyUpdateMessage(RoomObjectRoomPlanePropertyUpdateMessage.FLOOR_THICKNESS, floorThicknessMultiplier));

        return true;
    }

    getRoomOwnObjectId(roomId: number): number 
    {
        return this._ownUserIds.get(roomId) ?? -1;
    }

    setRoomOwnObjectId(roomId: number, objectId: number): void 
    {
        this._ownUserIds.set(roomId, objectId);

        const camera = this.getRoomInstanceData(roomId).roomCamera;

        camera.targetId = objectId;
        camera.targetCategory = RoomObjectCategoryEnum.OBJECT_CATEGORY_USER;
        camera.activateFollowing(this.cameraFollowDuration);
    }

    disposeRoom(roomId: number): void
    {
        this.disposeRoomInstance(roomId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::purgeRoomContent()
    purgeRoomContent(): void
    {
        this._contentLoader?.purge();
    }

    /**
     * AS3 overrides the Component-level `purge()` to drop the room content on top of whatever the
     * base frees. `ComponentContext.purge()` walks every component and calls this, so without the
     * override a context-wide purge left the room's content loader — the largest cache the client
     * holds — untouched. `purgeRoomContent()` is a separate public method AS3 also declares, and
     * was already ported; this is the override beside it, not a rename of it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::purge()
    override purge(): void
    {
        super.purge();

        this._contentLoader?.purge();
    }

    /**
	 * Records what kind of room this is, for `getWorldType()` to read back
	 *
	 * AS3 stores the string on the room's own instance data and nowhere else. The port used to
	 * push it into the room object's `room_world_type` model variable as a *number* instead —
	 * `parseInt('public')` is NaN, so every room was recorded as 0, into a variable neither tree
	 * reads.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setWorldType()
    setWorldType(roomId: number, worldType: string): void
    {
        const data = this.getRoomInstanceData(roomId);

        if(data !== null) data.worldType = worldType;
    }

    initializeRoom(
        roomId: number,
        planeParser: RoomPlaneParser | null,
        doorX?: number,
        doorY?: number,
        doorZ?: number,
        doorDir?: number,
        cameraInitPosition: IVector3d | null = null
    ): void
    {
        // Guard against double initialization (server can send height map twice)
        if(this._initializedRooms.has(roomId))
        {
            log.debug(`Room ${roomId} already initialized, skipping`);

            return;
        }

        const roomIdentifier = this.getRoomIdentifier(roomId);
        let floorType: string | null = RoomEngine.DEFAULT_FLOOR_TYPE;
        let wallType: string | null = RoomEngine.DEFAULT_WALL_TYPE;
        let landscapeType: string | null = RoomEngine.DEFAULT_LANDSCAPE_TYPE;
        let pending = this._roomDatas.get(roomIdentifier) ?? null;

        // AS3 parks the room instead of failing when the engine is not ready, and replays it from
        // roomManagerInitialized(). Without this the room was dropped forever: the room previewer
        // inside any window built at DI time — the wired chest's, the catalog's — asks for its
        // preview room long before RoomManager finishes loading its placeholder object content, and
        // the only trace was "Cannot create room — manager not initialized (state: 1)".
        //
        // The types are carried across the re-park unguarded, exactly as AS3 does: a second park
        // with a null floorType overwrites the default. The asymmetry with the guarded read below
        // is AS3's, not a transcription slip.
        if(!this.isInitialized)
        {
            if(pending !== null)
            {
                this._roomDatas.delete(roomIdentifier);

                floorType = pending.floorType;
                wallType = pending.wallType;
                landscapeType = pending.landscapeType;

                // Guarded, unlike the three types above: a re-park that brings no camera position
                // keeps the one already stored. AS3 is asymmetrical here in exactly this way.
                if(cameraInitPosition === null) cameraInitPosition = pending.cameraInitPosition;
            }

            pending = new RoomData(roomId, planeParser);
            pending.floorType = floorType;
            pending.wallType = wallType;
            pending.landscapeType = landscapeType;
            pending.cameraInitPosition = cameraInitPosition;
            pending.setDoor(doorX, doorY, doorZ, doorDir);

            this._roomDatas.set(roomIdentifier, pending);

            log.debug(
                `Room engine not initialized yet, cannot create room ${roomId}.`
                + ' Room data stored for later initialization.'
            );

            return;
        }

        // AS3: a room parked by updateObjectRoom() alone carries no plane data, so replaying it
        // here must not build a plane-less room — it waits for the floor height map, which parks
        // its parser on the same entry and comes back through this method.
        if(planeParser === null)
        {
            log.debug(
                'Room property messages received before floor height map,'
                + ' will initialize when floor height map received.'
            );

            return;
        }

        if(pending !== null)
        {
            this._roomDatas.delete(roomIdentifier);

            if(pending.floorType !== null && pending.floorType.length > 0) floorType = pending.floorType;

            if(pending.wallType !== null && pending.wallType.length > 0) wallType = pending.wallType;

            if(pending.landscapeType !== null && pending.landscapeType.length > 0) landscapeType = pending.landscapeType;

            if(pending.cameraInitPosition !== null) cameraInitPosition = pending.cameraInitPosition;
        }

        // Create room instance if it doesn't exist
        let room = this.getRoomInstance(roomId);

        if(!room) 
        {
            room = this.createRoomInstance(roomId);
        }

        if(!room)
        {
            return;
        }

        // Where the server wants the camera parked when the room opens. Written onto the room
        // instance rather than acted on here: `RoomDesktop.initCameraLocation()` reads the three
        // back and drives `updateRoomCamera()` with them, which is the spectator-entry path.
        if(cameraInitPosition !== null)
        {
            room.setNumber(RoomVariableEnum.CAMERA_INIT_X, cameraInitPosition.x);
            room.setNumber(RoomVariableEnum.CAMERA_INIT_Y, cameraInitPosition.y);
            room.setNumber(RoomVariableEnum.CAMERA_INIT_Z, cameraInitPosition.z);
        }

        // If we have plane data, store it for rendering
        if(planeParser !== null) 
        {
            log.debug(`Initializing room ${roomId} with ${planeParser.planeCount} planes`);

            const roomObject = room.getObject(RoomEngine.OBJECT_ID_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM) as IRoomObjectController;

            if(roomObject) 
            {
                const model = roomObject.getModelController();

                if(model) 
                {
                    // Store the RoomPlaneParser reference in the model
                    // (equivalent of AS3 model.setString("room_plane_xml", xml))
                    model.setObject(RoomObjectVariableEnum.ROOM_PLANE_PARSER, planeParser);

                    // AS3: RoomLogic.initialize(xml) → _planeParser.initializeFromXML(xml)
                    const eventHandler = roomObject.getEventHandler();

                    if(eventHandler !== null) 
                    {
                        eventHandler.initialize(planeParser);
                    }

                    // AS3 passes these three down to createRoom(), which sends exactly these
                    // messages. They come from the parked RoomData when a room-properties push
                    // arrived first, and otherwise from the "111"/"201"/"1" defaults AS3's
                    // initializeRoom() opens with — which is still what every room renders with
                    // here, because that message is not ported (protocol gap, see
                    // docs/IMPLEMENTATION_STATUS.md "room"). Without them room_floor_type /
                    // room_wall_type stay unset and RoomVisualization falls back to its own
                    // invented "default" id, which has no matching texture and renders as a blank
                    // placeholder instead of the classic floor/wallpaper.
                    if(eventHandler !== null && floorType !== null)
                    {
                        eventHandler.processUpdateMessage(
                            new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_FLOOR_UPDATE, floorType)
                        );
                    }

                    if(eventHandler !== null && wallType !== null)
                    {
                        eventHandler.processUpdateMessage(
                            new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_WALL_UPDATE, wallType)
                        );
                    }

                    if(eventHandler !== null && landscapeType !== null)
                    {
                        eventHandler.processUpdateMessage(
                            new RoomObjectRoomUpdateMessage(RoomObjectRoomUpdateMessage.ROOM_LANDSCAPE_UPDATE, landscapeType)
                        );
                    }

                    // Store dimensions for compatibility
                    model.setNumber(RoomObjectVariableEnum.ROOM_FLOOR_HEIGHT, planeParser.floorHeight, true);
                    model.setNumber(RoomObjectVariableEnum.ROOM_WALL_HEIGHT, planeParser.wallHeight, true);

                    // Store door position if detected (AS3: <doors> XML element)
                    if(doorX !== undefined && doorDir !== undefined) 
                    {
                        // AS3: Send door mask to RoomLogic via RoomObjectRoomMaskUpdateMessage
                        // (RoomEngine.createRoom() lines 3044-3076)
                        const doorMaskLocation = new Vector3d(doorX, doorY!, doorZ!);
                        const doorMaskMessage = new RoomObjectRoomMaskUpdateMessage(
                            RoomObjectRoomMaskUpdateMessage.ADD_MASK,
                            'door_0',
                            RoomObjectRoomMaskUpdateMessage.MASK_TYPE_DOOR,
                            doorMaskLocation,
                            RoomObjectRoomMaskUpdateMessage.MASK_CATEGORY_HOLE
                        );

                        if(eventHandler !== null) 
                        {
                            eventHandler.processUpdateMessage(doorMaskMessage);
                        }

                        // AS3: door position on model uses -0.5 offset in door direction
                        if(doorDir === 90) 
                        {
                            model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_X, doorX - 0.5, true);
                            model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_Y, doorY!, true);
                        }

                        if(doorDir === 180) 
                        {
                            model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_X, doorX, true);
                            model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_Y, doorY! - 0.5, true);
                        }

                        model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_Z, doorZ!, true);
                        model.setNumber(RoomObjectVariableEnum.ROOM_DOOR_DIR, doorDir, true);

                        // Set displacement on room geometry for door depth sorting
                        // AS3: displacement position uses -0.5 offset in door direction
                        const canvas = this.getExistingRenderingCanvas(roomId);

                        if(canvas?.geometry) 
                        {
                            const displacementPos = new Vector3d(
                                doorDir === 90 ? doorX - 0.5 : doorX,
                                doorDir === 180 ? doorY! - 0.5 : doorY!,
                                doorZ!
                            );

                            let displacement: IVector3d | null = null;

                            if(doorDir === 90) displacement = new Vector3d(-2000, 0, 0);
                            if(doorDir === 180) displacement = new Vector3d(0, -2000, 0);

                            if(displacement) 
                            {
                                canvas.geometry.setDisplacement(displacementPos, displacement);
                            }
                        }
                    }
                }
            }

            // Create room visualization
            const roomVisualization = this.createVisualizationForObject(roomId, RoomEngine.OBJECT_ID_ROOM, RoomEngine.OBJECT_TYPE_ROOM);

            if(roomVisualization) 
            {
                log.debug(`Created room visualization for room ${roomId}`);
            }

            // Load tile cursor content (.nitro bundle) — goes through the same content loading pipeline as furniture
            this.loadFurnitureContent(roomId, RoomEngine.OBJECT_ID_ROOM_HIGHLIGHTER, RoomEngine.OBJECT_TYPE_ROOM_HIGHLIGHTER, RoomObjectCategoryEnum.OBJECT_CATEGORY_CURSOR);
        }

        this._initializedRooms.add(roomId);
        this.setActiveRoom(roomId);
        this.events.emit(RoomEngineEvent.REE_INITIALIZED, new RoomEngineEvent(RoomEngineEvent.REE_INITIALIZED, roomId));
    }

    /**
     * Queues one floor item; it is built later, by `createRoomFurniture()`.
     *
     * This does not create anything, and AS3's does not either — it returns `true` for a queued
     * item, not a built one. The pacing is the whole point: a full room announces every item in
     * a single message, and building them all inside that handler is what makes room entry
     * stall. `_pendingRoomObjectUpdates` still covers the *other* wait, updates that arrive
     * before their object; this covers the object itself.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addObjectFurniture()
    addObjectFurniture(
        roomId: number,
        id: number,
        typeId: number,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        data: IStuffData | null,
        extra: number,
        expiryTime: number,
        usagePolicy: number,
        ownerId: number,
        ownerName: string,
        synchronized: boolean,
        _refresh: boolean,
        _sizeZ: number
    ): boolean
    {
        this.getRoomInstanceData(roomId).furnitureQueue.push({
            id, typeId, className: null, location, direction, state, data, extra,
            expiryTime, usagePolicy, ownerId, ownerName, synchronized
        });

        this.drainFurnitureQueuesIfUnticked();

        return true;
    }

    addObjectFurnitureByName(
        roomId: number,
        id: number,
        className: string,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        data: IStuffData | null,
        extra: number
    ): boolean
    {
        this.getRoomInstanceData(roomId).furnitureQueue.push({
            id, typeId: 0, className, location, direction, state, data, extra,
            expiryTime: 0, usagePolicy: 0, ownerId: 0, ownerName: '', synchronized: true
        });

        this.drainFurnitureQueuesIfUnticked();

        return true;
    }

    /**
     * Builds one queued floor item, by class name rather than type id.
     *
     * The name path is what the server uses for fixed furniture (the room's own fittings), and
     * it carries none of the owner/expiry metadata the numeric path does.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addObjectFurnitureFromData()
    private addObjectFurnitureByNameFromData(
        roomId: number,
        id: number,
        className: string,
        location: IVector3d,
        direction: IVector3d,
        state: number
    ): boolean
    {
        const room = this.getRoomInstance(roomId);

        if(!room)
        {
            return false;
        }

        const object = room.createRoomObject(id, className, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

        if(!object)
        {
            return false;
        }

        (object as IRoomObjectController).setLocation(location);
        (object as IRoomObjectController).setDirection(direction);

        const model = (object as IRoomObjectController).getModelController();

        if(model) 
        {
            model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA, state);
        }

        this.events.emit(
            RoomEngineObjectEvent.REOE_ADDED,
            new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_ADDED, roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        );

        // The furni we just dropped has come back from the server with its real id: pick it up
        // again, so the mover stays on it. `Math.abs` because the placed id is the inventory
        // one, which is negative.
        const placed = this.getPlacedObjectData(roomId);

        if(placed !== null && Math.abs(placed.id) === id && placed.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        {
            this.selectRoomObject(roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);
        }

        return true;
    }

    /**
     * Pushes one numeric model variable into a live room object, through its own event
     * handler — the same route `updateObjectFurniture()` takes, and for the same reason: the
     * logic classes intercept the update message rather than reading the model back.
     *
     * The present widget is what needs it: opening a gift sets
     * `furniture_disable_picking_animation` so the box does not replay its pickup animation
     * while the contents dialog is up.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::changeObjectModelData()
    changeObjectModelData(roomId: number, objectId: number, category: number, key: string, value: number): boolean
    {
        const room = this.getRoomInstance(roomId);

        if(!room)
        {
            return false;
        }

        const object = room.getObject(objectId, category) as IRoomObjectController | null;

        if(!object)
        {
            return false;
        }

        const eventHandler = object.getEventHandler();

        if(eventHandler)
        {
            eventHandler.processUpdateMessage(new RoomObjectModelDataUpdateMessage(key, value));
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectFurniture()
    // Dispatches through the object's own event handler (matching AS3 exactly) rather than
    // mutating location/direction/state directly - this is required for FurnitureLogic's
    // rotation-bounce animation (_bounceStep/getLocationOffset()) to trigger at all: it
    // intercepts RoomObjectUpdateMessage in processUpdateMessage() to detect a direction-only
    // change (same location) and defers+animates it instead of applying it immediately.
    updateObjectFurniture(
        roomId: number,
        id: number,
        location: IVector3d | null,
        direction: IVector3d | null,
        state: number,
        data: IStuffData | null,
        extra: number = NaN
    ): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) as IRoomObjectController;

        if(!object) 
        {
            return false;
        }

        const eventHandler = object.getEventHandler();

        if(eventHandler) 
        {
            eventHandler.processUpdateMessage(new RoomObjectUpdateMessage(location, direction));
            eventHandler.processUpdateMessage(new RoomObjectDataUpdateMessage(state, data, extra));

            this.events.emit(
                RoomEngineObjectEvent.REOE_UPDATED,
                new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_UPDATED, roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
            );
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectFurnitureHeight()
    updateObjectFurnitureHeight(roomId: number, id: number, height: number): boolean
    {
        const object = this.getRoomObject(roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) as IRoomObjectController | null;

        if(!object) return false;

        // AS3 re-checks the handler inside the null check it already made; kept as the
        // same two-step, because a furniture object with no handler must still answer true.
        if(object.getEventHandler())
        {
            object.getEventHandler()!.processUpdateMessage(new RoomObjectHeightUpdateMessage(null, null, height));
        }

        return true;
    }

    /**
	 * Stamps a fresh rental/expiry countdown on an existing furniture object. The pair is
	 * read back by `InfoStandWidgetHandler`, which subtracts the elapsed time from the stamp.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectFurnitureExpiryTime()
    updateObjectFurnitureExpiryTime(roomId: number, id: number, expiryTime: number): boolean
    {
        const object = this.getRoomObject(roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) as IRoomObjectController | null;

        if(!object) return false;

        object.getModelController().setNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIME, expiryTime);
        // AS3 stamps `getTimer()`; this port stamps `Date.now()` here and at object creation
        // alike, and the one reader subtracts the two, so the epoch does not matter.
        object.getModelController().setNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIMESTAMP, Date.now());

        return true;
    }

    updateObjectFurnitureLocation(
        roomId: number,
        id: number,
        location: IVector3d,
        direction: IVector3d | null,
        target: IVector3d | null,
        animationTime?: number,
        overshootingDistance: number = NaN,
        curveStrength: number = NaN
    ): boolean
    {
        const room = this.getRoomInstance(roomId);

        if(!room)
        {
            return false;
        }

        const object = room.getObject(id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) as IRoomObjectController;

        if(!object || !object.getEventHandler())
        {
            return false;
        }

        const message = new RoomObjectMoveUpdateMessage(
            location,
            target,
            direction,
            animationTime ?? NaN,
            target !== null,
            false,
            overshootingDistance,
            curveStrength
        );

        object.getEventHandler()!.processUpdateMessage(message);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectWallItemExpiryTime()
    updateObjectWallItemExpiryTime(roomId: number, id: number, expiryTime: number): boolean
    {
        const object = this.getObjectWallItem(roomId, id);

        if(!object) return false;

        object.getModelController().setNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIME, expiryTime);
        object.getModelController().setNumber(RoomObjectVariableEnum.FURNITURE_EXPIRY_TIMESTAMP, Date.now());

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectWallItemLocation()
    updateObjectWallItemLocation(
        roomId: number,
        id: number,
        location: IVector3d,
        target: IVector3d | null = null,
        animationTime: number = NaN
    ): boolean
    {
        const object = this.getObjectWallItem(roomId, id);

        if(object === null)
        {
            return false;
        }

        if(object.getEventHandler() !== null)
        {
            const message = new RoomObjectMoveUpdateMessage(location, target, null, animationTime, target !== null);
            object.getEventHandler()?.processUpdateMessage(message);
        }

        // AS3: _SafeCls_90.as::updateObjectWallItemLocation() ends here — the wall item moved, so
        // its plane mask has to be re-emitted at the new position or a window furni moved by wired
        // keeps its hole at the old spot.
        this.updateObjectRoomWindow(roomId, id);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectUserDir()
    updateObjectUserDir(roomId: number, roomIndex: number, direction: IVector3d, headDirection: number): boolean
    {
        const room = this.getRoomInstance(roomId);

        if(room === null)
        {
            return false;
        }

        const object = room.getObject(roomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

        if(object === null || object.getEventHandler() === null || object.getModel() === null)
        {
            return false;
        }

        // The body direction rides on the base message's direction slot; the logic's
        // super.processUpdateMessage() applies it, and dirHead sets the head separately.
        const message = new RoomObjectAvatarDirectionUpdateMessage(null, direction, headDirection);
        object.getEventHandler()?.processUpdateMessage(message);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomGeometry()
    getRoomGeometry(roomId: number): IRoomGeometry | null
    {
        return this.getRoomCanvasGeometry(roomId, 1);
    }

    /**
     * Takes the still-pending floor item with this id out of the room's queue, and returns it.
     *
     * AS3's is a *take* — `_furnitureData.remove(id)` — and `disposeObjectFurniture()` calls it
     * purely for that side effect, discarding the result. It is what stops an "add X" that is
     * still waiting on the frame budget from being built after the server has already said
     * "remove X": without it `createRoomFurniture()` drains the entry a few frames later and
     * builds a ghost of an item that no longer exists.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_2223.as::getFurnitureDataWithId()
    private getFurnitureDataWithId(roomId: number, id: number): IPendingFurnitureData | null
    {
        const queue = this.getRoomInstanceData(roomId).furnitureQueue;
        const index = queue.findIndex(data => data.id === id);

        if(index < 0) return null;

        return queue.splice(index, 1)[0];
    }

    /**
     * The wall-item half of {@link getFurnitureDataWithId}, with the same take semantics and the
     * same reason for existing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/utils/_SafeCls_2223.as::getWallItemDataWithId()
    private getWallItemDataWithId(roomId: number, id: number): IPendingWallItemData | null
    {
        const queue = this.getRoomInstanceData(roomId).wallItemQueue;
        const index = queue.findIndex(data => data.id === id);

        if(index < 0) return null;

        return queue.splice(index, 1)[0];
    }

    /**
     * Removes a floor item. AS3 also flies its icon into the inventory button when the local player
     * picked it up (`pickerId`); that animation left with the core cut (2026-10-07).
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::disposeObjectFurniture()
    disposeObjectFurniture(
        roomId: number,
        id: number,
        _pickerId: number = -1,
        refresh: boolean = false
    ): boolean
    {
        // AS3 drops the pending entry first, before anything else in the method.
        this.getFurnitureDataWithId(roomId, id);

        const success = this.disposeRoomObject(roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);

        // AS3 (_SafeCls_90.as:3238-3241) only refreshes the tile map when the caller
        // asks (param4, default false). The port refreshed unconditionally, which was
        // harmless until refreshTileObjectMap started re-running recalibrateMovements:
        // disposing an OBJECT_PLACE ghost from resetSelectedObjectData (which happens
        // *before* selectedObjectData is cleared) then re-ran handleObjectPlace and
        // rebuilt the very ghost being disposed. Only the server-driven removal passes
        // refresh=true (see _SafeCls_1984.as:782/787).
        if(success && refresh) this.refreshTileObjectMap(roomId, 'RoomEngine.disposeObjectFurniture()');

        return success;
    }

    /**
     * Queues one wall item. Same reasoning as `addObjectFurniture()` — see the note there.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addObjectWallItem()
    addObjectWallItem(
        roomId: number,
        id: number,
        typeId: number,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        data: string,
        usagePolicy: number,
        ownerId: number,
        ownerName: string,
        secondsToExpiration: number
    ): boolean
    {
        this.getRoomInstanceData(roomId).wallItemQueue.push({
            id, typeId, location, direction, state, data,
            usagePolicy, ownerId, ownerName, secondsToExpiration
        });

        this.drainFurnitureQueuesIfUnticked();

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::addObjectWallItemFromData()
    private addObjectWallItemFromData(
        roomId: number,
        id: number,
        typeId: number,
        location: IVector3d,
        direction: IVector3d,
        state: number,
        data: string,
        usagePolicy: number,
        ownerId: number,
        ownerName: string,
        secondsToExpiration: number
    ): boolean
    {
        if(!this.addRoomObjectWallItem(
            roomId,
            id,
            typeId,
            location,
            direction,
            state,
            data,
            secondsToExpiration,
            usagePolicy,
            ownerId,
            ownerName
        )) return false;

        // AS3 reaches this through its `updateObjectWallItem()` call, which ends by re-emitting the
        // window mask. The port places the item inside addRoomObjectWallItem() and skips that call,
        // so a window whose content was already cached — where objectInitialized() never fires —
        // never told the room to cut its hole.
        this.updateObjectRoomWindow(roomId, id);

        // AS3 dispatches REOE_ADDED for wall items too, and this port did not — so
        // RoomAreaSelectionManager, which explicitly wants category 20, never saw one.
        this.events.emit(
            RoomEngineObjectEvent.REOE_ADDED,
            new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_ADDED, roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        );

        // Same re-selection as the floor path — without `Math.abs`, as AS3 has it here.
        const placed = this.getPlacedObjectData(roomId);

        if(placed !== null && placed.id === id && placed.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            this.selectRoomObject(roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL);
        }

        return true;
    }

    updateObjectWallItem(
        roomId: number,
        id: number,
        location: IVector3d | null,
        direction: IVector3d | null,
        state: number,
        _data: string
    ): boolean 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return false;
        }

        const object = room.getObject(id, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL) as IRoomObjectController;

        if(!object) 
        {
            return false;
        }

        if(location) 
        {
            (object as IRoomObjectController).setLocation(location);
        }

        if(direction) 
        {
            (object as IRoomObjectController).setDirection(direction);
        }

        const model = object.getModelController();

        if(model)
        {
            model.setNumber(RoomObjectVariableEnum.FURNITURE_DATA, state);
        }

        // AS3 ends updateObjectWallItem() with this: a window moved by the server re-cuts its hole.
        this.updateObjectRoomWindow(roomId, id);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectWallItemState()
    updateObjectWallItemState(
        roomId: number,
        id: number,
        state: number,
        itemData: string
    ): boolean
    {
        const object = this.getObjectWallItem(roomId, id);

        if(object === null)
        {
            return false;
        }

        // AS3 `new _SafeCls_1945()` — the default empty IStuffData, ported as LegacyStuffData.
        const stuffData = new LegacyStuffData();
        stuffData.setString(itemData);

        const message = new RoomObjectDataUpdateMessage(state, stuffData);

        // AS3 re-tests `_loc7_ != null` here even though the early return above already
        // guaranteed it — preserved verbatim.
        if(object !== null && object.getEventHandler() !== null)
        {
            object.getEventHandler()?.processUpdateMessage(message);
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectWallItemData()
    updateObjectWallItemData(
        roomId: number,
        id: number,
        itemData: string
    ): boolean
    {
        const object = this.getObjectWallItem(roomId, id);

        if(object === null)
        {
            return false;
        }

        const message = new RoomObjectItemDataUpdateMessage(itemData);

        // AS3 re-tests `_loc5_ != null` here even though the early return above already
        // guaranteed it — preserved verbatim.
        if(object !== null && object.getEventHandler() !== null)
        {
            object.getEventHandler()?.processUpdateMessage(message);
        }

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateAreaHide()
    updateAreaHide(
        roomId: number,
        furniId: number,
        on: boolean,
        rootX: number,
        rootY: number,
        width: number,
        length: number,
        invert: boolean
    ): boolean
    {
        // AS3 dispatches the widget event BEFORE the room-object null check, so the widget is told
        // about the toggle even when the room object is gone. Category 10 is the furniture category.
        this.events.emit(
            RoomEngineAreaHideStateWidgetEvent.UPDATE_STATE_AREA_HIDE,
            new RoomEngineAreaHideStateWidgetEvent(
                roomId,
                furniId,
                RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE,
                on
            )
        );

        const roomObject = this.getObjectRoom(roomId);

        if(roomObject === null || roomObject.getEventHandler() === null)
        {
            return false;
        }

        const message = on
            ? new RoomObjectRoomFloorHoleUpdateMessage(
                RoomObjectRoomFloorHoleUpdateMessage.ADD_HOLE,
                furniId,
                rootX,
                rootY,
                width,
                length,
                invert
            )
            : new RoomObjectRoomFloorHoleUpdateMessage(
                RoomObjectRoomFloorHoleUpdateMessage.REMOVE_HOLE,
                furniId
            );

        roomObject.getEventHandler()?.processUpdateMessage(message);
        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectRoomColor()
    updateObjectRoomColor(roomId: number, color: number, light: number, backgroundOnly: boolean): boolean
    {
        const roomObject = this.getObjectRoom(roomId);

        if(roomObject === null || roomObject.getEventHandler() === null)
        {
            return false;
        }

        const message = new RoomObjectRoomColorUpdateMessage(
            RoomObjectRoomColorUpdateMessage.BACKGROUND_COLOR,
            color,
            light,
            backgroundOnly
        );

        roomObject.getEventHandler()?.processUpdateMessage(message);

        this.events.emit(
            RoomEngineRoomColorEvent.RERCE_ROOM_COLOR,
            new RoomEngineRoomColorEvent(roomId, color, light, backgroundOnly)
        );

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectRoomWindow()
    // Re-emits a window wall item's plane mask onto the room object, so the wall it hangs on is cut
    // open at its new position. `visible=false`, or a wall item that no longer exists, removes the
    // mask instead — which is what makes the ghost of a window stop punching a hole in the wall the
    // moment the placement leaves it.
    updateObjectRoomWindow(roomId: number, id: number, visible: boolean = true): void
    {
        const maskId = `${RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL}_${id}`;
        const wallItem = this.getObjectWallItem(roomId, id);
        let message: RoomObjectRoomMaskUpdateMessage | null = null;

        if(wallItem !== null)
        {
            const model = wallItem.getModel();

            if(model !== null && model.getNumber(RoomObjectVariableEnum.FURNITURE_USES_PLANE_MASK) > 0)
            {
                message = visible
                    ? new RoomObjectRoomMaskUpdateMessage(
                        RoomObjectRoomMaskUpdateMessage.ADD_MASK,
                        maskId,
                        model.getString(RoomObjectVariableEnum.FURNITURE_PLANE_MASK_TYPE),
                        wallItem.getLocation()
                    )
                    : new RoomObjectRoomMaskUpdateMessage(RoomObjectRoomMaskUpdateMessage.REMOVE_MASK, maskId);
            }
        }
        else
        {
            message = new RoomObjectRoomMaskUpdateMessage(RoomObjectRoomMaskUpdateMessage.REMOVE_MASK, maskId);
        }

        const roomObject = this.getObjectRoom(roomId);

        if(roomObject !== null && roomObject.getEventHandler() !== null && message !== null)
        {
            roomObject.getEventHandler()?.processUpdateMessage(message);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getObjectRoom()
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_89.as::getObjectRoom()
    getObjectRoom(roomId: number): IRoomObjectController | null
    {
        return this.getRoomObject(
            roomId,
            RoomEngine.OBJECT_ID_ROOM,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM
        ) as IRoomObjectController | null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getObjectWallItem()
    private getObjectWallItem(roomId: number, id: number): IRoomObjectController | null
    {
        return this.getRoomObject(
            roomId,
            id,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL
        ) as IRoomObjectController | null;
    }

    /**
	 * The wall sibling of `disposeObjectFurniture()`, and it had none of what makes that one more
	 * than a delete: no room-window update, no mouse-cursor
	 * release. Both are AS3's, and the second one leaks — the object keeps owning a hand cursor
	 * after it is gone.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::disposeObjectWallItem()
    disposeObjectWallItem(
        roomId: number,
        id: number,
        _pickerId: number = -1
    ): boolean
    {
        // AS3 drops the pending entry first, before anything else in the method.
        this.getWallItemDataWithId(roomId, id);

        const success = this.disposeRoomObject(roomId, id, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL);

        this.updateObjectRoomWindow(roomId, id, false);
        this.removeButtonMouseCursorOwner(roomId, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL, id);

        return success;
    }

    addObjectUser(
        roomId: number,
        roomIndex: number,
        location: IVector3d,
        direction: IVector3d,
        headDirection: number,
        userType: number,
        figure: string
    ): boolean 
    {
        // Map userType to string type
        let type: string;

        switch(userType) 
        {
            case 2:
                type = RoomObjectUserTypes.PET;
                break;
            case 3:
                type = RoomObjectUserTypes.BOT;
                break;
            case 4:
                type = RoomObjectUserTypes.RENTABLE_BOT;
                break;
            default:
                type = RoomObjectUserTypes.USER;
                break;
        }

        // AS3: addObjectUser() — `if(_loc11_ == "pet") _loc11_ = getPetType(param7);`
        //
        // A pet's room object is NOT typed 'pet': that literal is only the user-type name, and no
        // asset library is called 'pet'. AS3 replaces it with the pet's real content type, resolved
        // from the first token of its figure. Without this the object was created as type 'pet',
        // which RoomContentLoader.hasInternalContent() does not recognise, so RoomManager fell through to resolving logic and
        // visualization off a non-existent bundle and defaulted to FurnitureLogic +
        // FurnitureVisualization. FurnitureLogic ignores RoomObjectAvatarFigureUpdateMessage, so
        // the figure below was dropped on the floor, the model kept no pet_type/pet_palette_index/
        // pet_color, and every pet in a room rendered as a black box. PetLogic was never attached
        // to anything — it was dead code.
        if(type === RoomObjectUserTypes.PET)
        {
            const petType = this.getPetType(figure);

            // AS3 lets a null type reach createObjectUser(), which returns null, and addObjectUser()
            // then returns false. Bailing here is the same outcome, one step earlier.
            if(petType === null) return false;

            type = petType;
        }

        if(!this.addRoomObjectUser(roomId, roomIndex, location, direction, type))
        {
            return false;
        }

        const room = this.getRoomInstance(roomId);
        const object = room?.getObject(roomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;
        const handler = object?.getEventHandler() ?? null;

        if(handler !== null) 
        {
            const avatarMessage = new RoomObjectAvatarUpdateMessage(this.fixedUserLocation(roomId, location), null, direction, headDirection, false, 0);
            handler.processUpdateMessage(avatarMessage);

            if(figure !== null && figure !== undefined) 
            {
                const figureMessage = new RoomObjectAvatarFigureUpdateMessage(figure, '');
                handler.processUpdateMessage(figureMessage);
            }
        }

        return true;
    }

    updateObjectUser(
        roomId: number,
        roomIndex: number,
        location: IVector3d | null,
        target: IVector3d | null,
        canStandUp?: boolean,
        baseZ?: number,
        direction?: IVector3d,
        headDirection?: number,
        animationTime?: number,
        skipPositionUpdate?: boolean,
        jumpingPower: number = NaN
    ): boolean
    {
        return this.updateRoomObjectUser(
            roomId,
            roomIndex,
            location,
            target,
            direction ?? null,
            headDirection ?? NaN,
            canStandUp ?? false,
            baseZ ?? 0,
            animationTime ?? NaN,
            skipPositionUpdate ?? false,
            jumpingPower
        );
    }

    updateObjectUserFigure(
        roomId: number,
        roomIndex: number,
        figure: string,
        sex: string,
        subType?: string,
        isRiding?: boolean
    ): boolean 
    {
        return this.updateRoomObjectUserFigure(roomId, roomIndex, figure, sex, subType ?? null, isRiding ?? false);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectUserPosture()
    updateObjectUserPosture(roomId: number, roomIndex: number, posture: string, parameter: string): boolean 
    {
        // TS-only (RPG F3c §16): an RP dance lasts until the avatar walks; the server keeps nothing.
        if(posture === 'mv' && this._rpgDancers.delete(roomIndex)) this.updateObjectUserAction(roomId, roomIndex, RoomObjectVariableEnum.AVATAR_DANCE, 0);

        return this.updateRoomObjectUserPosture(roomId, roomIndex, posture, parameter);
    }

    /**
     * TS-only (RPG F3c §16): plays an RP action on an avatar of the active room, with Habbo's own
     * animations: wave, laugh, cry and respect (the raised hand, for `clap`) are expressions,
     * `surprised` a face, `dance` the first dance until the avatar walks. Unknown keys play nothing.
     */
    playRpgEmote(roomIndex: number, key: string): boolean
    {
        const roomId = this._activeRoomId;

        if(key === 'dance')
        {
            this._rpgDancers.add(roomIndex);

            return this.updateObjectUserAction(roomId, roomIndex, RoomObjectVariableEnum.AVATAR_DANCE, 1);
        }

        if(key === 'surprised') return this.updateObjectUserGesture(roomId, roomIndex, RPG_SURPRISED_GESTURE);

        const expression = RPG_EXPRESSIONS[key];

        return expression !== undefined && this.updateObjectUserAction(roomId, roomIndex, RoomObjectVariableEnum.AVATAR_EXPRESSION, expression);
    }

    /**
	 * True while the user at this room index is on your blocked list.
	 *
	 * AS3 checks it before every user action, so a blocked user's dance, chat, sign and effects
	 * never reach their room object at all — blocking hides what they do, not just what they say.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::userIsBlocked()
    private userIsBlocked(roomId: number, roomIndex: number): boolean
    {
        const session = this._roomSessionManager?.getSession(roomId) ?? null;
        const userData = session?.userDataManager?.getUserDataByIndex(roomIndex) ?? null;

        if(userData === null) return false;

        return this._sessionDataManager?.isBlocked(userData.webID) ?? false;
    }

    /**
     * Update user action (expression, dance, sleep, typing, carry, use object).
     *
     * **This dispatches a typed update message through the object's logic; it does not write the
     * model.** It used to be one `model.setNumber(action, value)`, which reaches the same variable
     * for the simple cases and skips everything the logic does around it — so `figure_talk` was set
     * and `AvatarLogic._talkEndTime` never was, and the mouth would have flapped forever; the
     * carry-object branch never armed its own timers; and `userIsBlocked()` was not consulted at
     * all. The 13 messages below are all ported and all handled by `AvatarLogic.processUpdateMessage()`.
     */
    // DEVIATION: AS3 also maps `figure_habbicon` to the habbicon update message; the RPG fork removed
    //   Habbicons, so that action now takes the no-message warning.
    // DEVIATION: AS3 also maps `figure_is_playing_game` (set only by the snow-war arena) onto
    //   `RoomObjectAvatarPlayingGameMessage`; the RPG fork removed Snow War and the games manager.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectUserAction()
    updateObjectUserAction(
        roomId: number,
        roomIndex: number,
        action: string,
        value: number
    ): boolean
    {
        const roomObject = this.getRoomObject(
            roomId, roomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
        ) as IRoomObjectController | null;

        if(roomObject === null || roomObject.getEventHandler() === null)
        {
            return false;
        }

        if(this.userIsBlocked(roomId, roomIndex))
        {
            return false;
        }

        let message: RoomObjectUpdateMessage | null = null;

        switch(action)
        {
            case RoomObjectVariableEnum.AVATAR_TALK:
                message = new RoomObjectAvatarChatUpdateMessage(value);
                break;
            case RoomObjectVariableEnum.AVATAR_SLEEP:
                message = new RoomObjectAvatarSleepUpdateMessage(value !== 0);
                break;
            case RoomObjectVariableEnum.AVATAR_IS_TYPING:
                message = new RoomObjectAvatarTypingUpdateMessage(value !== 0);
                break;
            case RoomObjectVariableEnum.AVATAR_IS_MUTED:
                message = new RoomObjectAvatarMutedUpdateMessage(value !== 0);
                break;
            case RoomObjectVariableEnum.AVATAR_CARRY_OBJECT:
                // AS3 passes its fifth `parameter` argument here as the message's `itemName`. This
                // port's signature stops at four on purpose — see RoomPreviewer.updateObjectUserAction().
                message = new RoomObjectAvatarCarryObjectUpdateMessage(value);
                break;
            case RoomObjectVariableEnum.AVATAR_USE_OBJECT:
                message = new RoomObjectAvatarUseObjectUpdateMessage(value);
                break;
            case RoomObjectVariableEnum.AVATAR_DANCE:
                message = new RoomObjectAvatarDanceUpdateMessage(value);
                break;
            case RoomObjectVariableEnum.AVATAR_GAINED_EXPERIENCE:
                message = new RoomObjectAvatarExperienceUpdateMessage(value);
                break;
            case RoomObjectVariableEnum.AVATAR_NUMBER_VALUE:
                message = new RoomObjectAvatarPlayerValueUpdateMessage(value);
                break;
            case RoomObjectVariableEnum.AVATAR_SIGN:
                message = new RoomObjectAvatarSignUpdateMessage(value);
                break;
            case RoomObjectVariableEnum.AVATAR_EXPRESSION:
                message = new RoomObjectAvatarExpressionUpdateMessage(value);
                break;
            case RoomObjectVariableEnum.AVATAR_GUIDE_STATUS:
                message = new RoomObjectAvatarGuideStatusUpdateMessage(value);
                break;
            default:
                log.warn(`updateObjectUserAction: no update message for "${action}"`);
                break;
        }

        // AS3 calls processUpdateMessage() unconditionally and returns true even when the switch
        // matched nothing — every `param1 is X` test in the logic then fails and it is a no-op.
        // Skipping the call is the same result without the null argument.
        if(message !== null) roomObject.getEventHandler()?.processUpdateMessage(message);

        return true;
    }

    /**
     * Update user effect.
     * Based on AS3: RoomEngine.updateObjectUserEffect
     */
    updateObjectUserEffect(
        roomId: number,
        roomIndex: number,
        effectId: number,
        _delayMilliSeconds: number
    ): boolean 
    {
        const roomInstance = this.getRoomInstance(roomId);

        if(roomInstance === null) 
        {
            return false;
        }

        const roomObject = roomInstance.getObject(roomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);

        if(roomObject === null) 
        {
            return false;
        }

        const model = (roomObject as IRoomObjectController).getModelController();

        if(model === null) 
        {
            return false;
        }

        // Set the effect - delay handling would be done by visualization layer
        model.setNumber(RoomObjectVariableEnum.AVATAR_EFFECT, effectId);

        return true;
    }

    disposeObjectUser(
        roomId: number,
        roomIndex: number
    ): boolean 
    {
        return this.disposeRoomObject(roomId, roomIndex, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);
    }

    setOwnUserId(roomId: number, roomIndex: number): void
    {
        // AS3 (_SafeCls_90.as:1998-2004) records the own-user object id on the room
        // session before the camera follows it. The port set the camera target (via
        // setRoomObjectUserOwnUser -> setRoomOwnObjectId) but never the session field,
        // so RoomSession.ownUserRoomId stayed -1 for the session's whole life.
        const session = this._roomSessionManager?.getSession(roomId) ?? null;

        if(session !== null)
        {
            session.ownUserRoomId = roomIndex;
        }

        this.setRoomObjectUserOwnUser(roomId, roomIndex);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setIsPlayingGame()
    setIsPlayingGame(roomId: number, isPlaying: boolean): void
    {
        const room = this.getRoomInstance(roomId);

        if(room !== null)
        {
            const value = isPlaying ? 1 : 0;
            room.setNumber(RoomVariableEnum.IS_PLAYING_GAME, value);

            const type = value === 0 ? RoomEngineEvent.REE_NORMAL_MODE : RoomEngineEvent.REE_GAME_MODE;
            this.events.emit(type, new RoomEngineEvent(type, roomId));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::leaveSpectate()
    leaveSpectate(): void
    {
        // AS3 fires this on the ACTIVE room id, not on any room passed in — there is no parameter.
        this.events.emit(
            RoomEngineEvent.REE_ENTRANCE_AFTER_SPECTATE,
            new RoomEngineEvent(RoomEngineEvent.REE_ENTRANCE_AFTER_SPECTATE, this._activeRoomId)
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setHanditemControlBlocked()
    setHanditemControlBlocked(roomId: number, blocked: boolean): void
    {
        const room = this.getRoomInstance(roomId);

        if(room !== null)
        {
            room.setNumber(RoomVariableEnum.HANDITEM_CONTROL_BLOCKED, blocked ? 1 : 0);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setChooserDisabled()
    setChooserDisabled(roomId: number, disabled: boolean): void
    {
        const room = this.getRoomInstance(roomId);

        if(room !== null)
        {
            room.setNumber(RoomVariableEnum.CHOOSER_DISABLED, disabled ? 1 : 0);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setFreeFurniMovementsMode()
    setFreeFurniMovementsMode(roomId: number, enabled: boolean): void
    {
        const room = this.getRoomInstance(roomId);

        if(room !== null)
        {
            room.setNumber(RoomVariableEnum.FREE_FURNI_MOVEMENTS_MODE, enabled ? 1 : 0);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setInvisibleFurni()
    setInvisibleFurni(roomId: number, invisible: boolean): void
    {
        const room = this.getRoomInstance(roomId);

        if(room !== null)
        {
            room.setNumber(RoomVariableEnum.INVISIBLE_FURNI, invisible ? 1 : 0);
            this.updateInvisibleFurniForRoom(roomId, invisible);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateInvisibleFurniForRoom()
    private updateInvisibleFurniForRoom(roomId: number, invisible: boolean): void
    {
        const room = this.getRoomInstance(roomId);

        if(room === null)
        {
            return;
        }

        this.updateInvisibleFurniForObjects(room.getObjects(RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE), invisible);
        this.updateInvisibleFurniForObjects(room.getObjects(RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL), invisible);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateInvisibleFurniForObjects()
    private updateInvisibleFurniForObjects(objects: IRoomObject[] | null, invisible: boolean): void
    {
        if(objects === null)
        {
            return;
        }

        const value = invisible ? 1 : 0;

        for(const object of objects)
        {
            const model = (object as IRoomObjectController).getModelController();

            if(model !== null)
            {
                model.setNumber(RoomObjectVariableEnum.FURNITURE_INVISIBLE_LAYER, value);
            }
        }
    }

    addObjectUpdateCategory(category: number): void
    {
        if(this._roomManager) 
        {
            this._roomManager.addObjectUpdateCategory(category);
        }
    }

    removeObjectUpdateCategory(category: number): void 
    {
        if(this._roomManager) 
        {
            this._roomManager.removeObjectUpdateCategory(category);
        }
    }

    /**
     * Set a furniture type alias.
     * Maps a furniture type name to an alias name.
     * Based on AS3: com.sulake.habbo.room.RoomEngine.setRoomObjectAlias
     */
    setRoomObjectAlias(name: string, alias: string): void 
    {
        this._roomObjectAliases.set(name, alias);
    }

    /**
     * Get the alias for a furniture type name.
     * Returns the alias if set, otherwise returns the original name.
     */
    getRoomObjectAlias(name: string): string 
    {
        return this._roomObjectAliases.get(name) ?? name;
    }

    /**
     * Set the PixiJS stage for rendering
     */
    setStage(stage: Container): void 
    {
        this._pixiStage = stage;
    }

    /**
     * Mounts an externally-owned display object directly onto the PixiJS
     * stage, above every room rendering canvas already added (children
     * appended later render on top).
     *
     * TS-only: no AS3 equivalent. AS3's DisplayObjectWrapperController wraps
     * a genuine Flash DisplayObject that gets added to the same unified
     * display tree as everything else; this port splits UI chrome (drawn via
     * WindowComposite onto a separate Canvas2D element) from room content
     * (rendered by this WebGL/PixiJS stage). WindowComposite's "punch a
     * transparent hole" trick for display_object_wrapper windows only reveals
     * whatever is *already* part of this same PixiJS stage underneath that
     * screen rect - callers like HabboFreeFlowChat (freeflowchat's live chat
     * bubbles) need this explicit mount point since their content has no
     * other path onto the stage.
     */
    addStageChild(displayObject: Container): void
    {
        if(!this._pixiStage) return;

        // Insertion order alone does not hold the "above every room canvas" promise above:
        // HabboFreeFlowChat mounts its bubble root once, at component init, and every room
        // canvas created afterwards is appended over it - which is what put the chat bubbles
        // behind the room. Room canvases keep the default zIndex 0, so one sorted layer above
        // them is enough, and it survives any later addChild().
        this._pixiStage.sortableChildren = true;
        displayObject.zIndex = 1;
        this._pixiStage.addChild(displayObject);
    }

    /**
     * Removes a display object previously added via addStageChild().
     */
    removeStageChild(displayObject: Container): void 
    {
        if(this._pixiStage && displayObject.parent === this._pixiStage) 
        {
            this._pixiStage.removeChild(displayObject);
        }
    }

    /**
     * Keeps the AS3 boundary: room mouse input is routed by RoomDesktop window events.
     */
    setCanvasElement(_canvas: HTMLCanvasElement): void 
    {
    }

    getRenderingCanvas(roomId: number, canvasId: number = 1): RoomRenderingCanvas | null 
    {
        return this.getExistingRenderingCanvas(roomId, canvasId);
    }

    /**
     * Dispose a rendering canvas for a room
     */
    disposeRenderingCanvas(roomId: number, canvasId: number = 1): void 
    {
        const key = roomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        if(canvas) 
        {
            // Remove resize handler if attached
            const resizeHandler = this._resizeHandlers.get(canvas);

            if(resizeHandler) 
            {
                window.removeEventListener('resize', resizeHandler);
                this._resizeHandlers.delete(canvas);
            }

            // Detach from whatever currently holds the container, not just the stage.
            // createRoomCanvas() parents it onto _pixiStage, but RoomDesktop.createRoomView() then
            // re-homes it into the room_canvas_wrapper window (AS3: var_174.setDisplayObject()),
            // so by the time a room is disposed its parent is that window's display object. Testing
            // for _pixiStage therefore never matched a real room canvas and it was never removed:
            // every room left its fully-rendered container on screen, and they stacked up as you
            // moved from room to room. Preview canvases, which keep the stage as parent, are
            // detached by this exactly as before.
            canvas.container.parent?.removeChild(canvas.container);

            const room = this.getRoomInstance(roomId);
            const renderer = room?.getRenderer() as IRoomRenderer | null;

            if(renderer !== null && renderer !== undefined) 
            {
                renderer.disposeCanvas(canvasId);
            }
            else 
            {
                canvas.dispose();
            }

            this._renderingCanvases.delete(key);
        }
    }

    /**
     * Get the content loader instance.
     */
    getContentLoader(): RoomContentLoader 
    {
        return this._contentLoader;
    }

    /**
     * Creates a rendering canvas for a room with explicit dimensions.
     * Unlike getRenderingCanvas(), this does NOT auto-attach a resize listener.
     * RoomDesktop manages resize instead.
     *
     * @returns The PixiJS Container for the canvas, or null on failure
     */
    createRoomCanvas(roomId: number, canvasId: number, width: number, height: number, scale: number): Container | null
    {
        const key = roomId * 1000 + canvasId;

        // Tear down any canvas already registered under this key before replacing it. The set()
        // below would otherwise just drop the old one from the map while its container stays
        // parented in the room view, leaving a fully-rendered room on screen that nothing can
        // reach any more - disposeRenderingCanvas() looks the canvas up by this same key.
        if(this._renderingCanvases.has(key))
        {
            this.disposeRenderingCanvas(roomId, canvasId);
        }

        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return null;
        }

        let renderer = room.getRenderer() as IRoomRenderer | null;

        if(renderer === null) 
        {
            renderer = this._roomRendererFactory?.createRenderer() ?? null;
        }

        if(renderer === null) 
        {
            return null;
        }

        renderer.roomObjectVariableAccurateZ = RoomObjectVariableEnum.OBJECT_ACCURATE_Z_VALUE;
        room.setRenderer(renderer);

        const canvas = renderer.createCanvas(canvasId, width, height, scale) as RoomRenderingCanvas | null;

        if(canvas === null) 
        {
            return null;
        }

        canvas.mouseListener = this;

        // The canvas sorts an object resting on furniture differently from one on the ground, and
        // the ground is not z=0: a raised floor tile carries its own altitude. Resolved per call
        // rather than captured, because the geometry only arrives with the floor height map.
        canvas.floorHeightAt = (x: number, y: number): number | null =>
            this.getLegacyGeometry(roomId)?.getTileHeight(x, y) ?? null;
        // A raised tile's floor is a solid piece sorted among the objects (@ambreia/iso sortTile).
        canvas.raisedFloorAt = (x: number, y: number): boolean =>
            this.getLegacyGeometry(roomId)?.isRaisedFloor(x, y) ?? false;
        // The player sees through the raised floor hiding them or the tile under the pointer.
        canvas.seeThrough = true;
        // The see-through avatars' masks are stamped with the client's renderer.
        canvas.pixiRenderer = this._renderer;

        this._renderingCanvases.set(key, canvas);
        this.applyRoomCanvasGeometry(roomId, canvas);

        if(this._pixiStage) 
        {
            if(canvas.container.parent !== this._pixiStage) 
            {
                this._pixiStage.addChild(canvas.container);
            }
        }

        return canvas.container;
    }

    /**
     * Modifies the dimensions of an existing room canvas.
     */
    modifyRoomCanvas(roomId: number, canvasId: number, width: number, height: number): boolean 
    {
        const key = roomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        if(!canvas) 
        {
            return false;
        }

        canvas.initialize(width, height);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setRoomCanvasMask()
    setRoomCanvasMask(roomId: number, canvasId: number, useMask: boolean): void
    {
        const key = roomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        if(!canvas)
        {
            return;
        }

        canvas.useMask = useMask;
    }

    /**
	 * Captures the room canvas for the camera.
	 *
	 * AS3 signature is `snapshotRoomCanvasToBitmap(roomId, canvasId, bitmap, matrix, smoothing)`,
	 * drawing the canvas's display object into a caller-supplied `BitmapData` through a `Matrix`.
	 * This port has no mutable bitmap type — window components take an immutable `ImageBitmap` —
	 * so the region is passed in instead of a translation matrix and the result is returned. The
	 * captured pixels are identical; only who owns the buffer changes.
	 *
	 * The capture reuses `RoomRenderingCanvas.takeScreenShot()`, which already forces a 1:1,
	 * zero-offset, visibility-check-free render and restores the previous state afterwards — the
	 * same guarantees AS3 gets from drawing the live display object while the camera holds the room
	 * at scale 1.
	 */
    /**
	 * Captures the room canvas and hands the PNG to the browser's download flow — AS3's
	 * `FileReference.save()`. The name is sanitised the same way, and falls back to a
	 * timestamp if what is left is empty.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::createScreenShot()
    createScreenShot(roomId: number, canvasId: number, name: string): void
    {
        const canvas = this.getRenderingCanvas(roomId, canvasId);
        const renderer = this._renderer();

        if(!canvas || !renderer) return;

        const safeName = (name ?? '').replace(/[:/\\"<>|%*?]/g, '');
        const fileName = (safeName.length > 0 ? safeName : `Habbo ${new Date().toISOString()}`) + '.png';

        canvas.takeScreenShot(renderer).toBlob((blob) =>
        {
            if(!blob) return;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::snapshotRoomCanvasToBitmap()
    async snapshotRoomCanvasToBitmap(
        roomId: number,
        canvasId: number,
        region: IRoomEngineRectangle | null = null,
        backgroundColor: number = 0
    ): Promise<ImageBitmap | null>
    {
        const canvas = this.getRenderingCanvas(roomId, canvasId);

        if(!canvas) return null;

        const renderer = this._renderer();

        if(!renderer) return null;

        try
        {
            const source = canvas.takeScreenShot(renderer);

            if(!source || source.width < 1 || source.height < 1) return null;

            const width = Math.max(1, Math.round(region?.width ?? source.width));
            const height = Math.max(1, Math.round(region?.height ?? source.height));
            const target = document.createElement('canvas');

            target.width = width;
            target.height = height;

            const context = target.getContext('2d');

            if(!context) return null;

            // AS3 fills the destination with the room background before drawing, in the caller;
            // doing it here keeps the two call sites (camera, room thumbnail) from repeating it.
            context.fillStyle = `#${(backgroundColor >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
            context.fillRect(0, 0, width, height);

            // The room's pan, added back. `region` is measured on the room as the player is looking
            // at it — `CameraViewFinder.getViewPort()` reads window coordinates — and that is also
            // the space `getRenderRoomMessage()` subtracts it in, since every coordinate it writes
            // carries `+ screenOffsetX/Y`. But `takeScreenShot()` re-renders the room at 1:1 with
            // the offsets forced to zero, so its pixels are the room *unpanned*: cropping it at
            // `region` alone framed a place the player was not looking at, and the photo came back
            // showing somewhere else by exactly the distance the room had been dragged.
            //
            // AS3 has nothing to add back because it draws the live display object through a
            // matrix, pan included; the zero-offset re-render is this port's own, and this is its
            // other half.
            const panX = Math.round(canvas.screenOffsetX);
            const panY = Math.round(canvas.screenOffsetY);

            context.drawImage(
                source,
                -(Math.round(region?.left ?? 0) - panX),
                -(Math.round(region?.top ?? 0) - panY)
            );

            return await createImageBitmap(target);
        }
        catch (error)
        {
            log.warn('snapshotRoomCanvasToBitmap: capture failed', error);

            return null;
        }
    }

    /**
     * The canvas the player is actually looking at.
     *
     * AS3 reads `getRoomCanvas(activeRoomId, activeCanvasId)`. This port has no separate
     * active-canvas id: canvases are keyed `roomId * 1000 + canvasId` and the main room view is
     * always canvasId 1, which is `getRenderingCanvas()`'s default. Every caller that used to
     * spell this lookup out inline now comes through here.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getActiveRoomActiveCanvas()
    getActiveRoomActiveCanvas(): RoomRenderingCanvas | null
    {
        return this.getRenderingCanvas(this._activeRoomId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::setFpsCounterEnabled()
    setFpsCounterEnabled(enabled: boolean): void
    {
        const canvas = this.getActiveRoomActiveCanvas();

        if(canvas)
        {
            canvas.fpsCounterEnabled = enabled;
        }
    }

    /**
     * Handles a mouse event forwarded from the client UI layer.
     */
    handleRoomCanvasMouseEvent(
        canvasId: number,
        x: number,
        y: number,
        type: string,
        altKey: boolean,
        ctrlKey: boolean,
        shiftKey: boolean,
        buttonDown: boolean
    ): void 
    {
        // AS3 (sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as:2350-2362): a drag already under way keeps the room, whatever it is
        // dragged over; otherwise the two thresholds and the named rectangles swallow the
        // event. Without this, a click on the room-tools toolbar or the chat-history handle
        // also reached the room underneath.
        if(!this._roomDragging)
        {
            if(this._mouseEventsDisabledAboveY > 0 && y < this._mouseEventsDisabledAboveY) return;

            if(this._mouseEventsDisabledLeftToX > 0 && x < this._mouseEventsDisabledLeftToX) return;

            if(this.isMouseEventDisabledByRect(x, y)) return;
        }

        if(this._activeRoomId < 0) return;

        const key = this._activeRoomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        if(canvas)
        {
            // AS3 (_SafeCls_90.as:2367-2372): ctrl+alt+click zooms the room at the cursor.
            // shift halves the scale; otherwise it doubles, clamping a sub-1 scale up to 1
            // first. The port received the modifier keys here but only handleRoomDragging
            // consumed them, so the zoom shortcut did nothing.
            if(type === 'click' && ctrlKey && altKey)
            {
                const scale = shiftKey ? canvas.scale >> 1 : (canvas.scale < 1 ? 1 : canvas.scale << 1);

                this.setRoomCanvasScale(this._activeRoomId, canvasId, scale, {x, y});

                return;
            }

            // AS3: _SafeCls_1821.as::handleRoomCanvasMouseEvent() repositions the overlay
            // icon sprite unconditionally on every mouse event, at the raw mouse position —
            // visibility is controlled entirely by setObjectMoverIconSpriteVisible()
            // (called from handleObjectPlace()/initializeRoomObjectInsert()), never touched
            // here.
            if(this._moverIconSprite) 
            {
                this._moverIconCanvas = canvas;
                this._moverIconSprite.x = x;
                this._moverIconSprite.y = y;

                if(this._moverIconSprite.parent !== canvas.container) 
                {
                    canvas.container.addChild(this._moverIconSprite);
                }
            }

            if(!this.handleRoomDragging(canvas, x, y, type, altKey, ctrlKey, shiftKey))
            {
                const handled = canvas.handleMouseEvent(x, y, type, altKey, ctrlKey, shiftKey, buttonDown);

                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as:2391-2398
                // `if(!canvas.handleMouseEvent(...)) { if(click) dispatch REOE_DESELECTED(roomId, -1, MINIMUM) }`.
                // The port was discarding the return value, so a click no room object
                // consumed never deselected — which is why the InfoStand furni/user
                // panels and the own-avatar bubble never closed on clicking away.
                if(!handled && type === 'click')
                {
                    this._selectedObject = null;

                    this.events.emit(
                        RoomEngineObjectEvent.REOE_DESELECTED,
                        new RoomEngineObjectEvent(
                            RoomEngineObjectEvent.REOE_DESELECTED,
                            this._activeRoomId,
                            -1,
                            RoomObjectCategoryEnum.MINIMUM
                        )
                    );
                }
            }

            this._roomDragLastX = x;
            this._roomDragLastY = y;
        }
    }

    processRoomCanvasMouseEvent(event: RoomSpriteMouseEvent, object: IRoomObject, geometry: IRoomGeometry): void
    {
        if(event === null || object === null)
        {
            return;
        }

        // Per-(bucket, type) dedup, ported from AS3 processRoomCanvasMouseEvent (getMouseEventId).
        // A click that alpha-hits several stacked SAME-category objects reaches only the frontmost
        // (they share one bucket+type slot), while:
        //  - the room floor plane (category 0) sits in its OWN bucket, so its tile click still fires
        //    alongside a furni click on the same pixel — that back-to-front floor click is how you
        //    walk to a tile partly hidden behind a tall walkable furni (regression fixed here);
        //  - 'click' and 'doubleClick' are SEPARATE slots, so a click never suppresses a same-frame
        //    double-click, keeping double-click-to-use (FurnitureLogic.useObject) working.
        // Category bucketing mirrors AS3: floor=0 keeps its own slot; everything else collapses to
        // -2 except game users (100) while a game is active.
        const category = this.getRoomObjectCategory(object.getType());

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as:365
        // — the flags do exist, Wired's room environment sets them through setClickSettings().
        if((category === 100 && this.clickThroughUsers)
            || ((category === 20 || category === 10) && this.clickThroughFurni))
        {
            return;
        }
        let bucket = category;

        if(category !== 0)
        {
            bucket = (this.getActiveRoomIsPlayingGame() && category === 100) ? 100 : -2;
        }

        if(this.getMouseEventId(bucket, event.type) === event.eventId)
        {
            if(event.type === 'click' || event.type === 'doubleClick'
                || event.type === 'mouseDown' || event.type === 'mouseUp' || event.type === 'mouseMove')
            {
                return;
            }
        }
        else if(event.eventId !== '')
        {
            this.setMouseEventId(bucket, event.type, event.eventId);
        }

        const handler = object.getMouseHandler();

        if(handler !== null)
        {
            handler.mouseEvent(event, geometry);
        }
    }

    /**
     * Records the last event id delivered to a (category bucket, event type) slot. AS3 nests two
     * maps — one per bucket, keyed by type inside it; this port flattens both keys into one string.
     *
     * Writing bucket 0 spends the click on the object that just handled it: the room planes sit in
     * that bucket and are hit by the very same pixel, and the buffered events are flushed front to
     * back, so marking it here makes processRoomCanvasMouseEvent() drop the floor's own tile event —
     * the one that would have sent a MoveAvatar.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::setMouseEventId()
    private setMouseEventId(category: number, type: string, eventId: string): void
    {
        this._mouseEventIds.set(`${category}_${type}`, eventId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::getMouseEventId()
    private getMouseEventId(category: number, type: string): string | null
    {
        return this._mouseEventIds.get(`${category}_${type}`) ?? null;
    }

    /**
     * Gets the room geometry for a canvas.
     */
    getRoomCanvasGeometry(roomId: number, canvasId: number = 1): IRoomGeometry | null 
    {
        const key = roomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        return canvas?.geometry ?? null;
    }

    /**
     * Gets the screen offset of a room canvas.
     */
    getRoomCanvasScreenOffset(roomId: number, canvasId: number = 1): { x: number; y: number } | null 
    {
        const key = roomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        if(!canvas) return null;

        return {x: canvas.screenOffsetX, y: canvas.screenOffsetY};
    }

    /**
     * Sets the screen offset of a room canvas.
     */
    setRoomCanvasScreenOffset(roomId: number, canvasId: number, point: { x: number; y: number }): boolean 
    {
        const key = roomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        if(!canvas) return false;

        canvas.setScreenOffset(point.x, point.y);

        return true;
    }

    /**
     * Sets the scale of a room canvas.
     */
    setRoomCanvasScale(
        roomId: number,
        canvasId: number,
        scale: number,
        _point?: { x: number; y: number } | null,
        _offset?: { x: number; y: number } | null,
        mirror: boolean = false,
        allowFractionalScale: boolean = false,
        _unusedFlag: boolean = false
    ): void 
    {
        // AS3: `if(!getBoolean("zoom.enabled")) return;` — the hotel-wide switch, read off the
        // Component configuration RoomEngine inherits from.
        if(this._configurationManager?.getBoolean('zoom.enabled') !== true) return;

        // AS3 snaps the scale to a whole step unless the caller opts out. The zoom *animation*
        // opts out (`allowFractionalScale`), because it walks through fractional scales on its way
        // to the target; every other caller gets the snap. `mirror` (RoomUI's `isFlipForced`)
        // takes -1, which flips the canvas rather than scaling it.
        if(!allowFractionalScale)
        {
            scale = mirror ? -1 : (scale < 1 ? 0.5 : Math.floor(scale));
        }

        const key = roomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        if(!canvas) return;

        // AS3 passes a fourth argument to setScale(); the canvas declares it and never reads it
        // (`_SafeCls_3073.as::setScale()`), so `_unusedFlag` stops here on purpose.
        canvas.setScale(scale, _point, _offset);

        this.syncRoomCameraLocationToCanvasOffset(roomId, canvas);

        this.events.emit(
            RoomEngineEvent.REE_ROOM_ZOOMED,
            new RoomEngineEvent(RoomEngineEvent.REE_ROOM_ZOOMED, roomId)
        );
    }

    /**
     * Re-anchors the room camera onto the canvas offset after a zoom.
     *
     * Only offset scrolling needs it: in that mode the canvas moves the whole scene by
     * `screenOffsetX/Y` and the camera's location is the negated copy of that offset, so a change
     * of scale that leaves the offset alone silently desynchronises the two — the next camera
     * update then snaps the room back to where the camera still thinks it is.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::syncRoomCameraLocationToCanvasOffset()
    private syncRoomCameraLocationToCanvasOffset(roomId: number, canvas: RoomRenderingCanvas): void
    {
        if(!this.useOffsetScrolling || canvas === null || canvas.scale <= 0) return;

        const instanceData = this._roomInstanceData.get(roomId);

        if(instanceData === undefined || instanceData.roomCamera === null) return;

        instanceData.roomCamera.resetLocation(new Vector3d(
            -RoomEngine.normalizeScreenOffsetForScale(canvas.screenOffsetX, canvas.width, canvas.scale),
            -RoomEngine.normalizeScreenOffsetForScale(canvas.screenOffsetY, canvas.height, canvas.scale)
        ));
    }

    /**
     * Converts a screen offset measured at scale 1 into the same visual offset at `scale`.
     *
     * The identity at scale 0 and 1 is AS3's own early-out, and it is what makes the unzoomed case
     * cost nothing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::normalizeScreenOffsetForScale()
    private static normalizeScreenOffsetForScale(offset: number, size: number, scale: number): number
    {
        if(scale === 0 || scale === 1) return offset;

        const half = (size / scale) / 2;

        return half - (half - offset) / scale;
    }

    /**
     * Gets the scale of a room canvas.
     */
    getRoomCanvasScale(roomId: number, canvasId: number = 1): number 
    {
        const key = roomId * 1000 + canvasId;
        const canvas = this._renderingCanvases.get(key);

        return canvas?.scale ?? 1;
    }

    /**
     * Dispose the room engine
     */
    override dispose(): void
    {
        // AS3 makes dispose() idempotent with an early `if(disposed) return` (_SafeCls_90.as:497).
        if(this.disposed)
        {
            return;
        }

        // Unregister from update loop
        this.removeUpdateReceiver(this);

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as:544-548 disposes the disabled-rect map here.
        this._mouseEventsDisabledRects?.dispose();
        this._mouseEventsDisabledRects = null;

        // AS3's removeUpdateReceiver stops its per-frame tick; here the canvas-sync tick
        // rides the PixiJS Ticker that setTicker() attached, so it must be detached too —
        // otherwise onTickerUpdate keeps firing against a disposed engine whose canvases
        // are already gone.
        this._ticker?.remove(this.onTickerUpdate);
        this._ticker = null;

        // Dispose all rendering canvases
        for(const [, canvas] of this._renderingCanvases) 
        {
            const resizeHandler = this._resizeHandlers.get(canvas);

            if(resizeHandler) 
            {
                window.removeEventListener('resize', resizeHandler);
                this._resizeHandlers.delete(canvas);
            }

            if(this._pixiStage && canvas.container.parent === this._pixiStage) 
            {
                this._pixiStage.removeChild(canvas.container);
            }

            canvas.dispose();
        }

        this._renderingCanvases.clear();

        // Dispose visualization factory
        this._visualizationFactory.dispose();

        // Dispose content loader
        this.events.off(RoomContentLoader.CONTENT_LOADER_READY, this._boundOnContentLoaderReady);
        this._contentLoader.dispose();
        this._contentLoaderEvents.removeAllListeners();
        this._pendingFurnitureViz.clear();

        // AS3 disposes the parked-room map here too (_SafeCls_90.as:539-542).
        this._roomDatas.clear();

        // Clear stage reference
        this._pixiStage = null;

        // AS3 disposes every RoomInstanceData it still holds (_SafeCls_90.as:549-560).
        // The port only did so per-room in removeRoomInstanceData(), so any room still
        // registered at teardown leaked its RoomCamera / FurniStackingHeightMap /
        // TileObjectMap / selection data.
        for(const instanceData of this._roomInstanceData.values())
        {
            instanceData.roomCamera.dispose();
            instanceData.furniStackingHeightMap?.dispose();
            instanceData.tileObjectMap?.dispose();
            instanceData.selectedObjectData?.dispose();
        }

        this._roomInstanceData.clear();

        super.dispose();
    }

    /**
     * TS-only (RPG M1a §9.3): the screen point centred above an avatar or a monster of the active
     * room (its bounding box's top), written into `out` — the combat overlay asks every frame, so
     * nothing is allocated here. False when the object or its canvas is not there.
     */
    getRpgAnchor(objectId: number, out: {x: number; y: number}): boolean
    {
        const canvas = this._renderingCanvases.get(this._activeRoomId * 1000 + 1);
        const geometry = canvas?.geometry ?? null;
        const object = this.getRoomObject(this._activeRoomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER);
        const visualization = object?.getVisualization() ?? null;

        if(canvas === undefined || geometry === null || object === null || visualization === null) return false;

        const screenPoint = geometry.getScreenPoint(object.getLocation());

        if(screenPoint === null) return false;

        const bounds = visualization.boundingRectangle;
        const scale = canvas.scale;

        out.x = (bounds.x + bounds.width / 2 + screenPoint.x) * scale + canvas.width / 2 + canvas.screenOffsetX;
        out.y = (bounds.y + screenPoint.y) * scale + canvas.height / 2 + canvas.screenOffsetY;

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomObjectBoundingRectangle()
    getRoomObjectBoundingRectangle(roomId: number, objectId: number, category: number, canvasId: number): IRoomEngineRectangle | null 
    {
        const canvas = this._renderingCanvases.get(roomId * 1000 + canvasId);
        const geometry = canvas?.geometry ?? null;
        const object = this.getRoomObject(roomId, objectId, category);
        const visualization = object?.getVisualization() ?? null;

        if(canvas === undefined || geometry === null || object === null || visualization === null) 
        {
            return null;
        }

        const bounds = visualization.boundingRectangle;
        const screenPoint = geometry.getScreenPoint(object.getLocation());

        if(screenPoint === null) 
        {
            return null;
        }

        const scale = canvas.scale;
        const left = bounds.x * scale + screenPoint.x * scale + canvas.width / 2 + canvas.screenOffsetX;
        const top = bounds.y * scale + screenPoint.y * scale + canvas.height / 2 + canvas.screenOffsetY;
        const width = bounds.width * scale;
        const height = bounds.height * scale;

        return {
            left,
            top,
            right: left + width,
            bottom: top + height,
            width,
            height
        };
    }

    /**
     * Called when all dependencies are resolved.
     * Register for updates to drive the rendering loop.
     */
    protected override initComponent(): void 
    {
        // Listen for content load success events (AS3: "RCLE_SUCCESS")
        this._contentLoaderEvents.on(RoomContentLoadedEvent.CONTENT_LOAD_SUCCESS, this._boundOnContentLoaded);

        // Register to receive update calls from the context
        this.registerUpdateReceiver(this, 1);
    }

    // (the "temporary_room" walk that resolves getGenericRoomObjectImage()'s pending listeners)
    private resolvePendingImageListeners(type: string): void 
    {
        if(this._pendingImageListeners.size === 0 || !this._contentLoader) return;

        const room = this._roomManager?.getRoom(RoomEngine.ROOM_TEMP_ID) ?? null;

        if(room === null) return;

        const category = this._contentLoader.getObjectCategory(type);
        const count = room.getObjectCount(category);
        let geometry: RoomGeometry | null = null;
        let lastScale = 0;

        for(let i = count - 1; i >= 0; i--) 
        {
            const object = room.getObjectWithIndex(i, category);

            if(object === null || object.getModel() === null || object.getType() !== type) continue;

            const objectId = object.getId();
            const listener = this._pendingImageListeners.get(objectId);

            if(!listener) continue;

            this._pendingImageListeners.delete(objectId);

            const visualization = object.getVisualization();
            let canvas: HTMLCanvasElement | null = null;

            if(visualization !== null) 
            {
                const scale = object.getModel().getNumber('image_query_scale');

                if(geometry !== null && lastScale !== scale) 
                {
                    geometry.dispose();
                    geometry = null;
                }

                if(geometry === null) 
                {
                    lastScale = scale;
                    geometry = new RoomGeometry(scale, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5));
                }

                visualization.update(geometry, 0, true, false);
                canvas = visualization.image;
            }

            room.disposeObject(objectId, category);

            if(canvas !== null) 
            {
                createImageBitmap(canvas)
                    .then((bitmap) => listener.imageReady(objectId, bitmap))
                    .catch(() => listener.imageFailed(objectId));
            }
            else 
            {
                listener.imageFailed(objectId);
            }
        }

        geometry?.dispose();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::setSelectedObjectData()
    setSelectedObjectData(
        roomId: number, id: number, category: number, loc: IVector3d, dir: IVector3d, operation: string,
        typeId: number = 0, instanceData: string | null = null, stuffData: IStuffData | null = null,
        state: number = -1, animFrame: number = -1, posture: string | null = null
    ): void 
    {
        this.resetSelectedObjectData(roomId);

        const data = this.getRoomInstanceData(roomId);

        data.selectedObjectData =
            new SelectedRoomObjectData(id, category, operation, loc, dir, typeId, instanceData, stuffData, state, animFrame, posture);

        // AS3: _SafeCls_90.as::setSelectedObjectData() drops the placed object whenever a
        // selection is set. Both of _SafeCls_1821's setters route through it; this port merged the
        // two classes, so the line lives at each writer instead.
        this.setPlacedObjectData(roomId, null);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::updateSelectedObjectData()
    private updateSelectedObjectData(
        roomId: number, id: number, category: number, loc: IVector3d, dir: IVector3d, operation: string,
        typeId: number = 0, instanceData: string | null = null, stuffData: IStuffData | null = null,
        state: number = -1, animFrame: number = -1, posture: string | null = null
    ): void 
    {
        const data = this.getRoomInstanceData(roomId);

        data.selectedObjectData =
            new SelectedRoomObjectData(id, category, operation, loc, dir, typeId, instanceData, stuffData, state, animFrame, posture);

        // AS3: _SafeCls_90.as::setSelectedObjectData() — see setSelectedObjectData() above.
        this.setPlacedObjectData(roomId, null);
    }

    /**
     * Undoes whatever the pending selection had done to the room, then clears it.
     *
     * A move (OBJECT_MOVE / OBJECT_MOVE_TO) puts the object back at the location and direction it
     * was picked up from and restores its alpha — the server is never told, because the move was
     * abandoned rather than committed. A placement (OBJECT_PLACE) has no original to return to, so
     * its ghost is disposed instead.
     *
     * A stray line above this trace used to claim the storage "never sees OBJECT_MOVE", which the
     * branch below contradicts; it was the severed head of some other comment.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::resetSelectedObjectData()
    private resetSelectedObjectData(roomId: number): void
    {
        this.removeObjectMoverIconSprite();

        const instanceData = this._roomInstanceData.get(roomId);
        const data = instanceData?.selectedObjectData ?? null;

        if(data === null) return;

        if(data.operation === RoomObjectOperationEnum.OBJECT_MOVE || data.operation === RoomObjectOperationEnum.OBJECT_MOVE_TO) 
        {
            const object = this.getRoomObject(roomId, data.id, data.category) as IRoomObjectController | null;

            if(object !== null) 
            {
                if(data.operation !== RoomObjectOperationEnum.OBJECT_MOVE_TO && data.loc !== null && data.dir !== null) 
                {
                    object.setLocation(data.loc);
                    object.setDirection(data.dir);
                }

                this.setObjectAlphaMultiplier(object, 1);
            }
        }
        else if(data.operation === RoomObjectOperationEnum.OBJECT_PLACE)
        {
            // AS3: _SafeCls_1821.as::resetSelectedObjectData() switches the ghost's disposal on its
            // category — 10 furniture, 20 wall item, 100 user. Only the furniture arm was ported, so
            // a pet ghost survived the placement and stayed in the room as a phantom.
            switch(data.category)
            {
                case RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE:
                    this.disposeObjectFurniture(roomId, data.id);
                    break;
                case RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL:
                    this.disposeObjectWallItem(roomId, data.id);
                    break;
                case RoomObjectCategoryEnum.OBJECT_CATEGORY_USER:
                    this.disposeObjectUser(roomId, data.id);
                    break;
            }
        }

        if(instanceData) instanceData.selectedObjectData = null;

        data.dispose();
    }

    // real isometric render (getFurnitureImage with forceGeneric=true), not the flat
    // inventory-grid thumbnail — matches AS3's getGenericRoomObjectImage() call here.
    // This is only ever shown as a fallback: while a valid tile is hovered, the real
    // ghost object built by handleObjectPlace() is shown instead and this icon is
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::setObjectMoverIconSprite()
    // Fallback icon shown only while no valid tile is hovered (the real ghost object built by
    // handleObjectPlace()/handleObjectMove() is shown instead otherwise).
    // Two modes, matching AS3's param3 (direct) flag:
    //  - direct=false: `id` is a furniture TYPE id not yet in the room (OBJECT_PLACE) — renders
    //    via getFurnitureImage() (real isometric render, forceGeneric=true).
    //  - direct=true: `id` is the id of an ALREADY-PLACED object (OBJECT_MOVE) — renders via
    //    getRoomObjectImage(), which reads the object's own current type/color/state.
    // `stuffData` is deliberately NOT forwarded to getFurnitureImage()/getGenericRoomObjectImage():
    // callers pass the INVENTORY-side IStuffData (item.stuffData from FurniModel.ts), but
    // getGenericRoomObjectImage() feeds it into a RoomObjectDataUpdateMessage expecting the
    // ROOM-side IStuffData (which implements writeRoomObjectModel()) - these are two separate,
    // incompatible interfaces in this port (see getFurnitureIcon()'s own `stuffData` comment).
    // Passing it through crashes FurnitureMultiStateLogic.handleDataUpdateMessage(). The icon
    // preview doesn't need it anyway (matches the old getFurnitureIcon()-based icon, whose
    // getGenericRoomObjectThumbnail() path silently ignored this same stuffData).
    setObjectMoverIconSprite(id: number, category: number, direct: boolean, extra: string | null = null, posture: string | null = null): void 
    {
        this.removeObjectMoverIconSprite();

        const roomId = this._activeRoomId;

        const listener: IGetImageListener = {
            imageReady: (_id: number, data: ImageBitmap | null) => 
            {
                if(data === null || this.getSelectedObjectData(roomId) === null) return;

                this._moverIconSprite = new Sprite(Texture.from(data));
                this._moverIconSprite.anchor.set(0.5);
                this._moverIconSprite.eventMode = 'none';

                if(this._moverIconCanvas) 
                {
                    this._moverIconCanvas.container.addChild(this._moverIconSprite);
                }
            },
            imageFailed: () => 
            {
                log.warn(`setObjectMoverIconSprite: failed to render icon (id=${id}, category=${category}, direct=${direct})`);
            },
        };

        if(direct) 
        {
            this.getRoomObjectImage(roomId, id, category, new Vector3d(), 1, listener);

            return;
        }

        // AS3: _SafeCls_90.as::setObjectMoverIconSprite() — the category-100 branch. `id` is the user
        // type, not a furniture type id, so the furniture lookup below would fail (it logged
        // "Could not find type for id: 2" and rendered nothing). A pet's icon comes from its figure,
        // rendered at scale 64 facing 180.
        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        {
            if(id === RoomUserData.USER_TYPE_PET && extra !== null)
            {
                const figureData = new AvatarPetFigureData(extra);

                this.getPetImage(
                    figureData.typeId, figureData.paletteId, figureData.color, new Vector3d(180), 64,
                    listener, true, 0,
                    figureData.customParts.map((part) => ({
                        layerId: part.layerId, partId: part.partId, paletteId: part.paletteId
                    })),
                    posture
                );

                return;
            }

            // AS3: _SafeCls_90.as::setObjectMoverIconSprite():2545-2548 — every other user type
            // (user, bot, rentable bot) renders through getGenericRoomObjectImage() with the type
            // NAME and the figure as its param, facing 180. That is the same path the temporary-room
            // render already supports for 'user'/'bot'/'rentable_bot', so a bot dragged out of the
            // inventory now has a fallback icon instead of nothing.
            const typeName = getUserTypeName(id);

            if(typeName !== null)
            {
                this.getGenericRoomObjectImage(
                    typeName, extra ?? '', new Vector3d(180), 1, listener, 0, null, null, -1, -1, posture
                );

                return;
            }

            log.warn(`setObjectMoverIconSprite: no icon path for user type ${id}`);

            return;
        }

        this.getFurnitureImage(id, new Vector3d(), 1, listener, 0, extra, -1, -1, null, true);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::removeObjectMoverIconSprite()
    removeObjectMoverIconSprite(): void 
    {
        if(this._moverIconSprite) 
        {
            this._moverIconSprite.removeFromParent();
            this._moverIconSprite.destroy();
            this._moverIconSprite = null;
        }

        this._moverIconCanvas = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::setObjectAlphaMultiplier()
    private setObjectAlphaMultiplier(object: IRoomObjectController | null, multiplier: number): void 
    {
        if(object === null) return;

        const model = object.getModelController();

        if(model === null) return;

        if(object.getType() === 'rentable_bot' || object.getType() === 'user') 
        {
            model.setNumber('figure_alpha_multiplier', multiplier);
        }
        else 
        {
            model.setNumber(RoomObjectVariableEnum.FURNITURE_ALPHA_MULTIPLIER, multiplier);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::getValidRoomObjectDirection()
    // Which list of allowed directions applies is chosen by object *type*: a monsterplant reads
    // `pet_allowed_directions` (written by PetLogic from the pet's own definition), a rentable bot
    // uses the fixed eight-way USER_ALLOWED_DIRECTIONS, and everything else reads
    // `furniture_allowed_directions`. Only the last branch used to be ported, which meant rotating
    // a plant or bot resolved to its current direction and sent a rotation that changed nothing.
    private getValidRoomObjectDirection(object: IRoomObjectController, forward: boolean): number
    {
        const model = object.getModel();

        // AS3 returns 0, not the current direction, when there is no model to read.
        if(model === null) return 0;

        const currentDirection = object.getDirection().x;
        const type = object.getType();
        let allowedDirections: readonly number[] | null;

        if(type === 'monsterplant')
        {
            allowedDirections = model.getNumberArray(RoomObjectVariableEnum.PET_ALLOWED_DIRECTIONS);
        }
        else if(type === 'rentable_bot')
        {
            allowedDirections = RoomEngine.USER_ALLOWED_DIRECTIONS;
        }
        else
        {
            allowedDirections = model.getNumberArray(RoomObjectVariableEnum.FURNITURE_ALLOWED_DIRECTIONS);
        }

        if(allowedDirections === null || allowedDirections.length === 0) return currentDirection;

        let index = allowedDirections.indexOf(currentDirection);

        if(index < 0) 
        {
            index = 0;

            for(let i = 0; i < allowedDirections.length; i++) 
            {
                if(currentDirection <= allowedDirections[i]) break;

                index++;
            }

            index %= allowedDirections.length;
        }

        index = forward
            ? (index + 1) % allowedDirections.length
            : (index - 1 + allowedDirections.length) % allowedDirections.length;

        return allowedDirections[index];
    }

    /**
	 * The category-100 counterpart of the furniture MoveObject composer: how a monsterplant or a
	 * rentable bot is repositioned/rotated.
	 *
	 * The two branches are not symmetric. The bot composer takes `objectId` — the room-object
	 * index — straight through, while the pet one resolves that index to the pet's `webID` via
	 * the session's user-data manager first, exactly as the pickup paths do.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::sendMoveUserObjectMessage()
    private sendMoveUserObjectMessage(
        session: IRoomSession | null,
        object: IRoomObjectController | null,
        objectId: number,
        x: number,
        y: number,
        direction: number
    ): boolean
    {
        if(this._connection === null || object === null) return false;

        if(object.getType() === 'rentable_bot')
        {
            // The server has bots, but no handler registered at 1295, so the move stays
            // client-side until one exists — see MoveBotMessageComposer.
            this._connection.send(new MoveBotMessageComposer(objectId, x, y, direction));

            return true;
        }

        if(object.getType() === 'monsterplant' && session !== null)
        {
            const userData = session.userDataManager?.getUserDataByIndex(objectId) ?? null;

            if(userData !== null)
            {
                this._connection.send(new MovePetMessageComposer(userData.webID, x, y, direction));

                return true;
            }
        }

        return false;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::validateFurnitureDirection()
    // Used by modifyRoomObject()'s rotate case to check the newly-rotated footprint fits
    // at the object's current location before sending the rotation to the server.
    // Like validateFurnitureLocation(), AS3 leaves validateLocation()'s 10th (reference-height)
    // parameter at its -1 default, which makes it derive the reference from the target tile.
    private validateFurnitureDirection(object: IRoomObject, direction: IVector3d, stackingMap: FurniStackingHeightMap | null): boolean 
    {
        const model = object.getModel();

        if(model === null) return false;

        const currentDirection = object.getDirection();
        const location = object.getLocation();

        if(currentDirection === null || location === null) return false;

        if(currentDirection.x % 180 === direction.x % 180) return true;

        let sizeX = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_X) || 1;
        let sizeY = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Y) || 1;

        if(sizeX < 1) sizeX = 1;
        if(sizeY < 1) sizeY = 1;

        let limitSizeX = sizeX;
        let limitSizeY = sizeY;

        let quadrant = Math.floor(((direction.x + 45) % 360) / 90);

        if(quadrant === 1 || quadrant === 3) 
        {
            const swap = sizeX;
            sizeX = sizeY;
            sizeY = swap;
        }

        quadrant = Math.floor(((currentDirection.x + 45) % 360) / 90);

        if(quadrant === 1 || quadrant === 3) 
        {
            const swap = limitSizeX;
            limitSizeX = limitSizeY;
            limitSizeY = swap;
        }

        if(stackingMap === null) return false;

        const alwaysStackable = model.getNumber(RoomObjectVariableEnum.FURNITURE_ALWAYS_STACKABLE) === 1;

        return stackingMap.validateLocation(
            location.x, location.y, sizeX, sizeY, location.x, location.y, limitSizeX, limitSizeY, alwaysStackable
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::validateFurnitureLocation()
    private validateFurnitureLocation(
        object: IRoomObjectController, target: IVector3d, limitLocation: IVector3d, limitDirection: IVector3d,
        stackingMap: FurniStackingHeightMap | null
    ): IVector3d | null 
    {
        const model = object.getModel();

        if(model === null) return null;

        const direction = object.getDirection();

        if(target.x === limitLocation.x && target.y === limitLocation.y && direction.x === limitDirection.x) 
        {
            return new Vector3d(limitLocation.x, limitLocation.y, limitLocation.z);
        }

        let sizeX = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_X) || 1;
        let sizeY = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Y) || 1;

        if(sizeX < 1) sizeX = 1;
        if(sizeY < 1) sizeY = 1;

        const limitX = Math.trunc(limitLocation.x);
        const limitY = Math.trunc(limitLocation.y);
        let limitSizeX = sizeX;
        let limitSizeY = sizeY;

        let quadrant = Math.floor(((direction.x + 45) % 360) / 90);

        if(quadrant === 1 || quadrant === 3) 
        {
            const swap = sizeX;
            sizeX = sizeY;
            sizeY = swap;
        }

        quadrant = Math.floor(((limitDirection.x + 45) % 360) / 90);

        if(quadrant === 1 || quadrant === 3) 
        {
            const swap = limitSizeX;
            limitSizeX = limitSizeY;
            limitSizeY = swap;
        }

        if(stackingMap === null) return null;

        const alwaysStackable = model.getNumber(RoomObjectVariableEnum.FURNITURE_ALWAYS_STACKABLE) === 1;

        if(stackingMap.validateLocation(target.x, target.y, sizeX, sizeY, limitX, limitY, limitSizeX, limitSizeY, alwaysStackable)) 
        {
            return new Vector3d(target.x, target.y, stackingMap.getTileHeight(target.x, target.y));
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleFurnitureMove()
    // AS3 declares tileX/tileY as `:int` params, so the fractional tile-center values
    // callers pass (tileX + 0.5) get silently truncated straight back at the call
    // boundary — Math.trunc() here reproduces that coercion. Without it, the fractional
    // coordinates leak into FurniStackingHeightMap's flat-array indexing as non-integer
    // keys, which always miss and make validateLocation() fail unconditionally.
    private handleFurnitureMove(
        object: IRoomObjectController, data: SelectedRoomObjectData, tileX: number, tileY: number,
        stackingMap: FurniStackingHeightMap | null
    ): boolean 
    {
        if(data.loc === null || data.dir === null) return false;

        tileX = Math.trunc(tileX);
        tileY = Math.trunc(tileY);

        const originalDirection = new Vector3d();
        originalDirection.assign(object.getDirection());

        object.setDirection(data.dir);

        const target = new Vector3d(tileX, tileY, 0);
        const resolvedDirection = new Vector3d();
        resolvedDirection.assign(object.getDirection());

        let location = this.validateFurnitureLocation(object, target, data.loc, data.dir, stackingMap);

        if(location === null) 
        {
            resolvedDirection.x = this.getValidRoomObjectDirection(object, true);
            object.setDirection(resolvedDirection);
            location = this.validateFurnitureLocation(object, target, data.loc, data.dir, stackingMap);
        }

        if(location === null) 
        {
            object.setDirection(originalDirection);

            return false;
        }

        object.setLocation(location);
        object.setDirection(resolvedDirection);

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectPlace()
    // TS scope: category 10 (floor furniture) only — see initializeRoomObjectInsert()'s own
    // marker for why wall/avatar categories never reach this (their SelectedRoomObjectData never
    // gets created in the first place).
    //
    // AS3 takes the RoomObjectMouseEvent itself and casts it twice — `as RoomObjectTileMouseEvent`
    // and `as RoomObjectWallMouseEvent` — then uses which of the two came back non-null to decide
    // whether the hovered surface can hold the pending item at all. This port passes the outcome of
    // those two casts instead, because its tile path also runs from a cached coordinate pair
    // (recalibrateMovements) that never had an event. Exactly one of the two is non-null.
    private handleObjectPlace(
        roomId: number,
        tileEvent: {tileX: number; tileY: number} | null,
        wallEvent: RoomObjectWallMouseEvent | null
    ): void
    {
        const instanceData = this._roomInstanceData.get(roomId);
        let data = instanceData?.selectedObjectData ?? null;

        if(data === null || data.loc === null || data.dir === null) return;

        let object = this.getRoomObject(roomId, data.id, data.category) as IRoomObjectController | null;

        const isUserCategory = data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER;
        const isWallCategory = data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL;

        if(object === null)
        {
            // AS3 builds each ghost only from the matching kind of event: a floor item or a pet
            // needs a tile under the cursor, a wall item needs a wall. Hovering the wrong surface
            // creates nothing, and the rest of this pass then runs against a null object — which is
            // how the mover icon comes back on while the cursor is somewhere the item cannot go.
            if(isWallCategory)
            {
                if(wallEvent !== null)
                {
                    // AS3 passes state 0 and usage policy 0 for the ghost and no owner at all; the
                    // real values only arrive with the server's echo once the item is placed.
                    this.addObjectWallItem(
                        roomId, data.id, data.typeId, data.loc, data.dir, 0, data.instanceData ?? '', 0, 0, '', 0
                    );
                }
            }
            else if(isUserCategory && tileEvent !== null)
            {
                // AS3: _SafeCls_1821.as::handleObjectPlace() — the category-100 branch. The ghost is
                // built at the origin facing 180; handleUserPlace() below moves it onto the hovered
                // tile. `instanceData` carries the pet's figure string, `typeId` its user type (2 for
                // a pet, 4 for a rentable bot).
                this.addObjectUser(
                    roomId, data.id, new Vector3d(), new Vector3d(180), 180, data.typeId, data.instanceData ?? ''
                );

                const ghost = this.getRoomObject(roomId, data.id, data.category);

                if(ghost !== null && data.posture !== null)
                {
                    // AS3 sets the raw "figure_posture" key here — the same one AvatarLogic writes
                    // for a live avatar. It is what makes a young monster plant preview at its
                    // growth stage instead of full grown.
                    (ghost.getModel() as IRoomObjectModelController | null)?.setString('figure_posture', data.posture);
                }
            }
            else if(!isUserCategory && !isWallCategory && tileEvent !== null)
            {
                this.addObjectFurniture(
                    roomId, data.id, data.typeId, data.loc, data.dir, data.state,
                    data.stuffData, Number(data.instanceData), -1, 0, 0, '', false, true, -1
                );
            }

            object = this.getRoomObject(roomId, data.id, data.category) as IRoomObjectController | null;

            // AS3 only resolves allowed directions for category 10; a user ghost keeps the 180 it
            // was created with, and a wall item takes the direction of the wall it lands on.
            if(object !== null && !isUserCategory && !isWallCategory)
            {
                const allowedDirections = object.getModel()?.getNumberArray(RoomObjectVariableEnum.FURNITURE_ALLOWED_DIRECTIONS) ?? null;

                if(allowedDirections !== null && allowedDirections.length > 0) 
                {
                    const requestedDirection = data.dir.x;
                    const resolvedDirection = allowedDirections.indexOf(requestedDirection) >= 0
                        ? requestedDirection
                        : allowedDirections[0];

                    const newDir = new Vector3d(resolvedDirection);

                    object.setDirection(newDir);
                    this.updateSelectedObjectData(
                        roomId, data.id, data.category, data.loc, newDir, data.operation,
                        data.typeId, data.instanceData, data.stuffData, data.state, data.animFrame, data.posture
                    );
                    data = instanceData?.selectedObjectData ?? data;
                }
            }

            this.setObjectAlphaMultiplier(object, 0.5);
            this.setObjectMoverIconSpriteVisible(true);
        }

        if(object !== null)
        {
            const stackingMap = this.getFurniStackingHeightMap(roomId);
            let success: boolean;

            if(isWallCategory)
            {
                success = wallEvent !== null && this.handleWallItemMove(
                    object, data,
                    wallEvent.wallLocation, wallEvent.wallWidth, wallEvent.wallHeight,
                    wallEvent.x, wallEvent.y, wallEvent.direction
                );

                if(!success) this.disposeObjectWallItem(roomId, data.id);

                // AS3 calls this on both outcomes, with the outcome as the argument: a window ghost
                // that found a spot cuts its hole in the wall, one that did not takes it back out.
                this.updateObjectRoomWindow(roomId, data.id, success);
            }
            else if(isUserCategory)
            {
                // Whole tile coordinates, not the half-tile centre the furniture arms use: an
                // avatar stands *on* a tile, and AS3 declares this arm's two parameters as `int`.
                success = tileEvent !== null
                    && this.handleUserPlace(object, Math.floor(tileEvent.tileX), Math.floor(tileEvent.tileY), this.getLegacyGeometry(roomId));

                if(!success) this.disposeObjectUser(roomId, data.id);
            }
            else
            {
                success = tileEvent !== null
                    && this.handleFurnitureMove(object, data, tileEvent.tileX + 0.5, tileEvent.tileY + 0.5, stackingMap);

                if(!success) this.disposeObjectFurniture(roomId, data.id);
            }

            this.setObjectMoverIconSpriteVisible(!success);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleWallItemMove()
    // The wall-item counterpart of handleFurnitureMove(): the wall plane under the cursor arrives as
    // a RoomObjectWallMouseEvent, and its own direction becomes the item's — a wall item does not
    // rotate, it faces the wall it was dropped on.
    private handleWallItemMove(
        object: IRoomObjectController,
        data: SelectedRoomObjectData,
        wallLocation: IVector3d | null,
        wallWidth: IVector3d | null,
        wallHeight: IVector3d | null,
        x: number,
        y: number,
        direction: number
    ): boolean
    {
        const location = this.validateWallItemLocation(object, wallLocation, wallWidth, wallHeight, x, y, data);

        if(location === null) return false;

        object.setLocation(location);
        object.setDirection(new Vector3d(direction));

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::validateWallItemLocation()
    // Clamps the hovered point on the wall so the whole item still fits on that wall, then converts
    // it back to a world position. `x` runs along the wall and `y` down it, both in the plane's own
    // units; `wallWidth`/`wallHeight` are the plane's two side vectors, so their lengths are how far
    // the point may travel before the item hangs off the edge.
    //
    // The clamp is written twice on purpose: the first pass pulls an out-of-range point back to the
    // nearest legal one, and the second rejects outright when even the clamped point does not fit —
    // an item wider than the wall, which no amount of sliding can place.
    //
    // `data` is null-checked and never read, exactly as in AS3.
    private validateWallItemLocation(
        object: IRoomObjectController,
        wallLocation: IVector3d | null,
        wallWidth: IVector3d | null,
        wallHeight: IVector3d | null,
        x: number,
        y: number,
        data: SelectedRoomObjectData | null
    ): IVector3d | null
    {
        const model = object.getModel();

        if(model === null || wallLocation === null || wallWidth === null || wallHeight === null || data === null)
        {
            return null;
        }

        const sizeX = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_X);
        const sizeZ = model.getNumber(RoomObjectVariableEnum.FURNITURE_SIZE_Z);
        const centerZ = model.getNumber(RoomObjectVariableEnum.FURNITURE_CENTER_Z);

        const minX = sizeX / 2;
        const maxX = wallWidth.length - sizeX / 2;
        const minY = centerZ;
        const maxY = wallHeight.length - (sizeZ - centerZ);

        if(x < minX || x > maxX || y < minY || y > maxY)
        {
            if(x < minX && x <= maxX) x = minX;
            else if(x >= minX && x > maxX) x = maxX;

            if(y < minY && y <= maxY) y = minY;
            else if(y >= minY && y > maxY) y = maxY;
        }

        if(x < minX || x > maxX || y < minY || y > maxY)
        {
            return null;
        }

        const offset = Vector3d.sum(
            Vector3d.product(wallWidth, x / wallWidth.length),
            Vector3d.product(wallHeight, y / wallHeight.length)
        );

        return Vector3d.sum(wallLocation, offset);
    }

    /**
     * Drops a pet or bot ghost onto a tile.
     *
     * The *wall geometry* answers both questions here, not the furniture stacking map: a pet stands
     * on the floor, so its height is the floor's own altitude and not whatever is stacked on the
     * tile. Using the stacking map put a pet on top of a table it was only being dragged across.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleUserPlace()
    private handleUserPlace(
        object: IRoomObjectController,
        x: number,
        y: number,
        geometry: LegacyWallGeometry | null
    ): boolean
    {
        if(geometry === null) return false;

        if(!geometry.isRoomTile(x, y)) return false;

        object.setLocation(new Vector3d(x, y, geometry.getTileHeight(x, y)));

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::placeObject()
    // TS scope: only the "inventory" floor-furniture placement source (FurniModel.ts, the only
    // caller today) is wired — AS3's stickie/present/rentable_bot-specific composer branches for
    // other placement sources are not ported.
    //
    // `placedOnFloor`/`placedOnWall` are AS3's own two parameters: which kind of mouse event
    // confirmed the placement. They ride out on REOE_PLACED, where FurniModel.onObjectPlaced()
    // needs them to tell a floor placement's re-arm from a wall one.
    //
    // `eventId` is not an AS3 parameter — see _lastPlacementEventId for why this port needs it.
    private placeObject(roomId: number, placedOnFloor: boolean, placedOnWall: boolean, eventId: string): void
    {
        // One click, one placement. Both the ghost's own object click and the room plane's tile
        // click carry the same event id, and both reach here.
        if(eventId !== '' && eventId === this._lastPlacementEventId) return;

        const data = this._roomInstanceData.get(roomId)?.selectedObjectData ?? null;

        if(data === null) return;

        this._lastPlacementEventId = eventId;

        const object = this.getRoomObject(roomId, data.id, data.category) as IRoomObjectController | null;

        let wallLocation = '';
        let x = 0;
        let y = 0;
        let z = 0;
        let rotation = 0;
        const placedInRoom = object !== null && object.getId() === data.id;

        if(object !== null)
        {
            const location = object.getLocation();

            x = location.x;
            y = location.y;
            z = location.z;

            // AS3 keeps the direction in degrees until after the wall string is built
            // (`_loc7_:int = int(getDirection().x)`, then `_loc7_ = (_loc7_ / 45 % 8 + 8) % 8`).
            // The order matters: getOldLocationString() switches on 90 vs 180 and would see 2 vs 4
            // if the eighths conversion ran first.
            const degrees = Math.trunc(object.getDirection().x);

            if(data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
            {
                const legacyGeometry = this.getLegacyGeometry(roomId);

                if(legacyGeometry !== null)
                {
                    wallLocation = legacyGeometry.getOldLocationString(location, degrees) ?? '';
                }
            }

            // AS3 truncates the whole expression on assignment to an int local, where this port
            // used to round it. Identical for every real furniture direction (all multiples of 45).
            rotation = Math.trunc(((degrees / 45) % 8 + 8) % 8);

            // A room may hold exactly one `free_placement_room` furni, and the ghost being placed is
            // already counted — hence `> 1` rather than `> 0`. The two strings are AS3's own, in
            // English and unlocalised: this is a staff-only furni and the alert is written for the
            // person who has the intraweb page open.
            if(object.getType() === 'free_placement_room'
                && (this.getRoom(roomId)?.getObjectCountForType('free_placement_room', RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE) ?? 0) > 1)
            {
                this._windowManager?.alert(
                    'One free placement furni already in room!',
                    'There can be only one free_placement_room furni in a room. See intraweb for instructions on how to use it.',
                    0,
                    null
                );

                return;
            }

            // AS3: _SafeCls_1821.as::placeObject() — the id is un-negated *before* the composer is
            // built, not after. Pets and bots arrive here with a negative id (PetsModel passes
            // `id * -1` so the ghost cannot collide with a real room object), so sending first would
            // put a negative id on the wire.
            let sentId = data.id;

            if(sentId < 0 && data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) sentId *= -1;

            if(this._connection !== null && this._objectPlacementSource === 'inventory')
            {
                if(data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER && data.typeId === RoomUserData.USER_TYPE_PET)
                {
                    // AS3 wraps both coordinates in `int(...)` at every one of these three send
                    // sites. The ghost sits at the tile centre (tileX + 0.5), so sending the raw
                    // location would put a fractional tile on the wire.
                    this._connection.send(new PlacePetComposer(sentId, Math.trunc(x), Math.trunc(y)));
                }
                else if(data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER && data.typeId === RoomUserData.USER_TYPE_BOT)
                {
                    this._connection.send(new PlaceBotMessageComposer(sentId, Math.trunc(x), Math.trunc(y)));
                }
                else if(object.getModel()?.hasString(RoomObjectVariableEnum.FURNITURE_IS_STICKIE))
                {
                    // AS3 picks the stickie composer off the object's own model, not off its
                    // category — a stickie is a wall item, but it does not take the wall item
                    // message. Ahead of the generic fallback, exactly as here.
                    //
                    // AS3 writes `getString("furniture_is_stickie") != null`, which cannot be
                    // transcribed literally: FurnitureStickieLogic sets the flag to the EMPTY
                    // STRING (`setString('furniture_is_stickie', '')`), and this port's
                    // RoomObjectModel.getString() returns `''` for a missing key too — so the test
                    // is true for every object and false for none. `hasString()` is the distinction
                    // AS3's null return actually carries. Written the literal way, every wall item
                    // went out as a stickie and the server dropped it: the ghost followed the wall
                    // and the click placed nothing.
                    this._connection.send(new PlacePostItMessageComposer(sentId, wallLocation));
                }
                else
                {
                    this._connection.send(new PlaceObjectMessageComposer(
                        sentId, data.category, wallLocation, Math.trunc(x), Math.trunc(y), rotation
                    ));
                }
            }
        }

        // AS3: _SafeCls_1821.as::placeObject() — remember what was just placed, so the next copy of
        // the same floor furni comes up at the same rotation. Read back by
        // initializeRoomObjectInsert() when the inventory re-arms; floor furniture only, since it is
        // the only category whose direction the player controls.
        if(this._repeatedPlacement && data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE && object !== null)
        {
            this._repeatedPlacementTypeId = data.typeId;
            this._repeatedPlacementDirection = Math.trunc(object.getDirection().x);
        }

        const instanceData = data.instanceData;
        const category = data.category;

        // AS3 (_SafeCls_1821.as:2455/2492-2495/2528): the placed objectId is emitted
        // UN-negated - it is the selected object's own id. The sign is flipped ONLY for
        // user/avatar items (category 100) that arrive negative. The port previously emitted
        // `-data.id`, which double-negated against FurniModel.onObjectPlaced()'s floor gate
        // (`-event.objectId === pendingPlacementRef`), so the equality never held, the re-arm
        // never fired, and placing from the inventory stopped after a single item.
        let objectId = data.id;

        if(objectId < 0 && category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        {
            objectId = -objectId;
        }

        // AS3 records what was just placed *before* clearing the selection — note the raw
        // `data.id`, negative for an inventory item, which is what the add paths match on.
        // resetSelectedObjectData() only clears the selection, so the record survives it.
        this.setPlacedObjectData(roomId, new SelectedRoomObjectData(data.id, data.category, null, null, null));
        this.resetSelectedObjectData(roomId);

        this.events.emit(
            'REOE_PLACED',
            new RoomEngineObjectPlacedEvent(
                'REOE_PLACED', roomId, objectId, category,
                wallLocation, x, y, z, rotation, placedInRoom, placedOnFloor, placedOnWall, instanceData,
                // AS3's param14. Without it every listener sees every placement as its own — the
                // catalog's three placement callbacks are all gated on this being 'catalog'.
                this._objectPlacementSource
            )
        );
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::_Str_22095() (getGenericRoomObjectThumbnail)
    // DEVIATION: AS3 downloads the catalogue icon PNG (icons/<type>_icon.png). The port renders the
    // furni at scale 1, where its visualization draws the `_icon_` assets of its piece in its
    // variant's colour: the icon PNGs are gone (spec 2026-10-09-ambreia-everything §2).
    private getGenericRoomObjectThumbnail(
        type: string | null,
        param: string,
        listener: IGetImageListener,
        extraData: string | null = null,
        stuffData: unknown = null
    ): ImageResult 
    {
        return this.getGenericRoomObjectImage(type, param, new Vector3d(), 1, listener, 0, extraData, stuffData);
    }

    /**
     * Builds the throwaway 6x6 flat room `getRoomImage()` renders its materials onto.
     *
     * DEVIATION: AS3 serialises the parser to XML, hands the XML to `initialize()` and disposes
     *   the parser. This port's `RoomLogic.initialize()` takes the parser instance itself (see
     *   its own comment: `RoomPlaneParser` has no XML serialiser here and `RoomVisualization`
     *   reads the instance back out of `ROOM_PLANE_PARSER`), so the instance is stored rather
     *   than disposed — disposing it would empty the model the visualization is about to read.
     *   The geometry it describes is AS3's, tile for tile.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::initializeRoomForGettingImage()
    private initializeRoomForGettingImage(object: IRoomObjectController, payload: string | null): void
    {
        if(payload === null) return;

        const parts = payload.split('\n');

        if(parts.length < 3) return;

        const floorType = parts[0];
        const wallType = parts[1];
        const landscapeType = parts[2];
        const extra = parts.length > 3 ? parts[3] : null;

        // AS3's `_loc11_ = 6`: a 6x6 floor inside an 8x8 tile map, so the ring of border tiles
        // stays at its default height and the walls have something to stand on.
        const size = 6;
        const planeParser = new RoomPlaneParser();

        planeParser.initializeTileMap(size + 2, size + 2);

        for(let y = 1; y < 1 + size; y++)
        {
            for(let x = 1; x < 1 + size; x++)
            {
                planeParser.setTileHeight(x, y, 0);
            }
        }

        planeParser.wallHeight = size;
        planeParser.initializeFromTileData();

        const model = object.getModelController();

        model.setObject(RoomObjectVariableEnum.ROOM_PLANE_PARSER, planeParser);
        object.getEventHandler()?.initialize(planeParser);

        object.getModelController().setString('room_floor_type', floorType);
        object.getModelController().setString('room_wall_type', wallType);
        object.getModelController().setString('room_landscape_type', landscapeType);

        if(extra !== null && extra !== '') 
        {
            const maskMessage = new RoomObjectRoomMaskUpdateMessage(
                RoomObjectRoomMaskUpdateMessage.ADD_MASK,
                '20_1',
                extra,
                new Vector3d(2.5, 0.5, 2)
            );

            object.getEventHandler()?.processUpdateMessage(maskMessage);
        }
    }

    /**
     * Asks the ad manager for a billboard's picture.
     *
     * Silently does nothing without an ad manager, as AS3 does: room ads are an optional
     * subsystem and a hotel without one simply shows blank billboards.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::requestRoomAdImage()
    // DEVIATION: AS3 asks the ad manager, which left with the core cut (2026-10-07); billboards stay blank.
    requestRoomAdImage(_roomId: number, _objectId: number, _objectCategory: number, _imageURL: string, _clickURL: string): void
    {
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomInstanceData()
    private getRoomInstanceData(roomId: number): IRoomEngineRoomInstanceData
    {
        let data = this._roomInstanceData.get(roomId);

        if(data === undefined) 
        {
            data = {
                roomCamera: new RoomCamera(),
                furniStackingHeightMap: null,
                tileObjectMap: null,
                legacyGeometry: new LegacyWallGeometry(),
                worldType: null,
                selectedObjectData: null,
                placedObjectData: null,
                mouseButtonCursorOwners: [],
                furnitureQueue: [],
                wallItemQueue: []
            };

            data.roomCamera.activateFollowing(this.cameraFollowDuration);
            this._roomInstanceData.set(roomId, data);
        }

        return data;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectMove()
    // TS scope: category 10 (floor furniture) only, matching modifyRoomObject()'s OBJECT_MOVE case.
    // Takes the two casts AS3 makes on the incoming event, for the reason spelled out on
    // handleObjectPlace(). Exactly one of the two is non-null.
    private handleObjectMove(
        roomId: number,
        tileEvent: {tileX: number; tileY: number} | null,
        wallEvent: RoomObjectWallMouseEvent | null
    ): void
    {
        const data = this._roomInstanceData.get(roomId)?.selectedObjectData ?? null;

        if(data === null || data.loc === null || data.dir === null) return;

        const object = this.getRoomObject(roomId, data.id, data.category) as IRoomObjectController | null;

        if(object === null) return;

        let success: boolean;

        if(data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            success = wallEvent !== null && this.handleWallItemMove(
                object, data,
                wallEvent.wallLocation, wallEvent.wallWidth, wallEvent.wallHeight,
                wallEvent.x, wallEvent.y, wallEvent.direction
            );

            if(!success)
            {
                // Unlike a placement, a move has somewhere to fall back to: the item is already in
                // the room, so AS3 puts it back where the drag started rather than disposing it.
                object.setLocation(data.loc);
                object.setDirection(data.dir);
            }

            this.updateObjectRoomWindow(roomId, data.id, success);
        }
        else
        {
            const stackingMap = this.getFurniStackingHeightMap(roomId);

            success = tileEvent !== null
                && this.handleFurnitureMove(object, data, tileEvent.tileX + 0.5, tileEvent.tileY + 0.5, stackingMap);

            if(!success)
            {
                // AS3 re-runs the move against the drag's *original* tile, so a furni dragged over
                // an illegal spot snaps back instead of hanging at the last valid one. The port
                // used to leave it where it was.
                this.handleFurnitureMove(object, data, data.loc.x, data.loc.y, stackingMap);
            }
        }

        // Alpha 0 rather than 0.5 on failure: AS3 hides the dragged object outright while the
        // cursor is somewhere it cannot go, and shows the mover icon in its place.
        this.setObjectAlphaMultiplier(object, success ? 0.5 : 0);
        this.setObjectMoverIconSpriteVisible(!success);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::modifyRoomObject() "OBJECT_MOVE_TO" case
    // Sends the object's own current (already tile-snapped/validated) location - the object was
    // live-updated by handleObjectMove() on every preceding mouse move. AS3 first re-tags the
    // selection OBJECT_MOVE_TO (so the trailing resetSelectedObjectData() keeps the moved
    // position instead of restoring the original one) and THEN resets it (line 2419-2421,
    // _loc11_ stays true for OBJECT_MOVE_TO - only OBJECT_MOVE sets it false). The reset is what
    // clears the selection so a *second* move can start; without it the stale OBJECT_MOVE_TO
    // state left handleRoomObjectMouseDown()'s "already busy" guard permanently tripped, so ALT-drag
    // worked exactly once. (An earlier port comment wrongly claimed AS3 leaves the state set.)
    private confirmObjectMove(roomId: number): void
    {
        const data = this._roomInstanceData.get(roomId)?.selectedObjectData ?? null;

        if(data === null || data.loc === null || data.dir === null) return;

        const object = this.getRoomObject(roomId, data.id, data.category) as IRoomObjectController | null;

        if(object === null) 
        {
            this.resetSelectedObjectData(roomId);

            return;
        }

        this.updateSelectedObjectData(
            roomId, data.id, data.category, data.loc, data.dir, RoomObjectOperationEnum.OBJECT_MOVE_TO,
            data.typeId, data.instanceData, data.stuffData, data.state, data.animFrame, data.posture
        );
        this.setObjectAlphaMultiplier(object, 1);
        this.removeObjectMoverIconSprite();

        if(this._connection !== null && data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        {
            const direction = ((Math.trunc(object.getDirection().x) % 360) + 360) % 360;
            const location = object.getLocation();

            this._connection.send(new MoveObjectMessageComposer(data.id, Math.trunc(location.x), Math.trunc(location.y), direction / 45));
        }
        // AS3: the `param3 == 100` branch of the same case (_SafeCls_1821.as:2392-2398) — a
        // monsterplant or rentable bot dropped on a new tile goes out through the user-move
        // composers instead of MoveObject.
        else if(this._connection !== null && data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        {
            const direction = ((Math.trunc(object.getDirection().x) % 360) + 360) % 360;
            const location = object.getLocation();
            const session = this._roomSessionManager?.getSession(roomId) ?? null;

            this.sendMoveUserObjectMessage(
                session, object, data.id,
                Math.trunc(location.x), Math.trunc(location.y), direction / 45
            );
        }

        // AS3: the `param3 == 20` branch of the same case (_SafeCls_1821.as:2399-2416). Unlike the
        // other two, this one sends no coordinates — the whole destination is the legacy
        // wall-location string, and the send is skipped entirely when it comes back null (a
        // direction that is neither 90 nor 180 cannot name a wall).
        else if(this._connection !== null && data.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            const legacyGeometry = this.getLegacyGeometry(roomId);

            if(legacyGeometry !== null)
            {
                // AS3 keeps the direction in degrees here, as it does in placeObject(): this is the
                // 90/180 getOldLocationString() switches on, not the eighths the floor path sends.
                const degrees = Math.trunc(object.getDirection().x) % 360;
                const wallLocation = legacyGeometry.getOldLocationString(object.getLocation(), degrees);

                if(wallLocation !== null)
                {
                    this._connection.send(new MoveWallItemMessageComposer(
                        data.id, RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL, wallLocation
                    ));
                }
            }
        }

        // AS3 line 2419-2421: reset the (now OBJECT_MOVE_TO-tagged) selection so the moved object
        // keeps its new position and the selection is cleared - required for a repeatable move.
        this.resetSelectedObjectData(roomId);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::getRoomObjectScreenLocation()
    // Public: the wired overview tab's VariableInfoBubbleView projects holder objects to screen space.
    public getRoomObjectScreenLocation(roomId: number, objectId: number, category: number, canvasId: number = 1): {
        x: number;
        y: number
    } | null
    {
        const geometry = this.getRoomCanvasGeometry(roomId, canvasId);

        if(!geometry) return null;

        const object = this.getRoomObject(roomId, objectId, category);

        if(!object) return null;

        const point = geometry.getScreenPoint(object.getLocation());

        if(!point) return null;

        const canvas = this._renderingCanvases.get(roomId * 1000 + canvasId);

        if(canvas) 
        {
            point.x *= canvas.scale;
            point.y *= canvas.scale;
            point.x += canvas.width / 2 + canvas.screenOffsetX;
            point.y += canvas.height / 2 + canvas.screenOffsetY;
        }

        return point;
    }

    private onTickerUpdate = (): void =>
    {
        // AS3 drains the furniture queue at the top of update(). This ticker is the only thing
        // running per frame in this port, so it is where that has to happen — see
        // drainFurnitureQueuesIfUnticked() for what covers the no-ticker case.
        // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::update()
        this.createRoomFurniture();

        for(const callback of this._canvasSyncCallbacks)
        {
            callback();
        }

        // AS3 drives this from update(), which in this port nothing calls (see setTicker()). It
        // is a dirty-flag check, so having both call sites costs nothing and is what makes the
        // cursor actually change.
        this.updateMouseCursor();
    };

    /**
     * Get or create a rendering canvas for a room
     */
    private getExistingRenderingCanvas(roomId: number, canvasId: number = 1): RoomRenderingCanvas | null 
    {
        const key = roomId * 1000 + canvasId;

        return this._renderingCanvases.get(key) ?? null;
    }

    private applyRoomCanvasGeometry(roomId: number, canvas: RoomRenderingCanvas): void 
    {
        const room = this.getRoomInstance(roomId);

        if(!room || !canvas.geometry) return;

        const roomZScale = room.getNumber('room_z_scale');

        if(!Number.isNaN(roomZScale)) 
        {
            canvas.geometry.z_scale = roomZScale;
        }

        const roomObject = room.getObject(RoomEngine.OBJECT_ID_ROOM, RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM);
        const model = roomObject?.getModel();

        if(!model) return;

        const doorX = model.getNumber(RoomObjectVariableEnum.ROOM_DOOR_X);
        const doorY = model.getNumber(RoomObjectVariableEnum.ROOM_DOOR_Y);
        const doorZ = model.getNumber(RoomObjectVariableEnum.ROOM_DOOR_Z);
        const doorDir = model.getNumber(RoomObjectVariableEnum.ROOM_DOOR_DIR);

        if(Number.isNaN(doorX) || Number.isNaN(doorY) || Number.isNaN(doorZ) || Number.isNaN(doorDir)) 
        {
            return;
        }

        let displacement: IVector3d | null = null;

        if(doorDir === 90) displacement = new Vector3d(-2000, 0, 0);
        if(doorDir === 180) displacement = new Vector3d(0, -2000, 0);

        if(displacement) 
        {
            canvas.geometry.setDisplacement(new Vector3d(doorX, doorY, doorZ), displacement);
        }
    }

    /**
     * Handles free room camera dragging.
     *
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::handleRoomDragging()
     */
    private handleRoomDragging(
        canvas: RoomRenderingCanvas,
        x: number,
        y: number,
        type: string,
        altKey: boolean,
        ctrlKey: boolean,
        shiftKey: boolean
    ): boolean 
    {
        let deltaX = x - this._roomDragLastX;
        let deltaY = y - this._roomDragLastY;

        if(type === 'mouseDown') 
        {
            if(!altKey && !ctrlKey && !shiftKey && !this.isDecorateMode) 
            {
                this._roomDragging = true;
                this._roomDragStarted = false;
                this._roomDragStartX = x;
                this._roomDragStartY = y;
            }
        }
        else if(type === 'mouseUp') 
        {
            if(this._roomDragging) 
            {
                this._roomDragging = false;

                if(this._roomDragStarted) 
                {
                    const camera = this.getRoomInstanceData(this._activeRoomId).roomCamera;

                    if(this.useOffsetScrolling) 
                    {
                        if(!camera.isMoving) 
                        {
                            camera.centeredLocX = false;
                            camera.centeredLocY = false;
                        }

                        camera.resetLocation(new Vector3d(-canvas.screenOffsetX, -canvas.screenOffsetY));
                    }

                    if(this._roomDraggingAlwaysCenters) 
                    {
                        camera.reset();
                    }

                    this.events.emit(
                        RoomEngineDragWithMouseEvent.DRAG_END,
                        new RoomEngineDragWithMouseEvent(RoomEngineDragWithMouseEvent.DRAG_END, this._activeRoomId)
                    );
                }
            }
        }
        else if(type === 'mouseMove') 
        {
            if(this._roomDragging) 
            {
                if(!this._roomDragStarted) 
                {
                    deltaX = x - this._roomDragStartX;
                    deltaY = y - this._roomDragStartY;

                    if(deltaX <= -RoomEngine.ROOM_DRAG_THRESHOLD ||
                        deltaX >= RoomEngine.ROOM_DRAG_THRESHOLD ||
                        deltaY <= -RoomEngine.ROOM_DRAG_THRESHOLD ||
                        deltaY >= RoomEngine.ROOM_DRAG_THRESHOLD) 
                    {
                        this._roomDragStarted = true;
                        this.events.emit(
                            RoomEngineDragWithMouseEvent.DRAG_START,
                            new RoomEngineDragWithMouseEvent(RoomEngineDragWithMouseEvent.DRAG_START, this._activeRoomId)
                        );
                    }

                    deltaX = 0;
                    deltaY = 0;
                }

                if(deltaX !== 0 || deltaY !== 0) 
                {
                    canvas.screenOffsetX += deltaX;
                    canvas.screenOffsetY += deltaY;

                    if(!this._roomDragStarted) 
                    {
                        this.events.emit(
                            RoomEngineDragWithMouseEvent.DRAG_START,
                            new RoomEngineDragWithMouseEvent(RoomEngineDragWithMouseEvent.DRAG_START, this._activeRoomId)
                        );
                    }

                    this._roomDragStarted = true;
                }

                if(this._roomDragStarted) 
                {
                    canvas.suppressMouseUpdate();

                    return true;
                }
            }
        }
        else if(type === 'click' || type === 'doubleClick') 
        {
            this._roomDragging = false;

            if(this._roomDragStarted) 
            {
                this._roomDragStarted = false;

                return true;
            }
        }

        return false;
    }

    /**
     * Process loaded room content bundle and create RoomVisualizationData.
     */
    private onRoomContentReady(): void 
    {
        // Not `findAssetByName()`: that reads this component's own library, and the room bundle is
        // registered in the content loader's per-type AssetLibraryCollection. Both misses below used
        // to return in silence, which is how the floor and the walls ended up painted in their flat
        // base colour — RoomPlane falls back to `_color` whenever it has no rasterizer.
        const asset = this._contentLoader.getAssetByName(RoomEngine.OBJECT_TYPE_ROOM) as NitroAsset | null;

        if(!asset)
        {
            log.warn(`No '${RoomEngine.OBJECT_TYPE_ROOM}' asset in the content loader — the room planes will render untextured`);
            return;
        }

        const jsonData = asset.jsonData;

        if(!jsonData)
        {
            log.warn('Room bundle has no JSON data — the room planes will render untextured');
            return;
        }

        // Extract room visualization data from bundle JSON
        // The room.nitro bundle contains a "roomVisualization" key with floor/wall/landscape data
        const vizData = ((jsonData as Record<string, unknown>).roomVisualization ?? null) as IAssetRoomVisualizationData | null;

        if(!vizData) 
        {
            log.warn('Room bundle has no roomVisualization data');
            return;
        }

        // Create RoomVisualizationData and initialize with JSON config
        this._roomVisualizationData = new RoomVisualizationData();
        this._roomVisualizationData.initialize(vizData);

        // Convert PixiJS textures to HTMLCanvasElement for the rasterizer system.
        //
        // Nitro bundle spritesheet frames are prefixed with the library name
        // (e.g. frame "room_floor_texture_64_0_floor_basic"), while the
        // roomVisualization JSON's bitmap "assetName" references omit that
        // prefix (e.g. "floor_texture_64_0_floor_basic") — same convention
        // GraphicAssetCollection.defineAssets() already resolves for
        // avatars/furniture. Register both forms so PlaneRasterizer's
        // direct-name lookup resolves regardless of which form it sees.
        const canvasTextures = new Map<string, HTMLCanvasElement>();
        const textures: Map<string, Texture> = asset.textures;
        const libraryPrefix = `${RoomEngine.OBJECT_TYPE_ROOM}_`;
        const conversionStart = performance.now();

        this._blittedTextureCount = 0;

        if(textures) 
        {
            for(const [name, texture] of textures) 
            {
                const canvas = this.pixiTextureToCanvas(texture);

                if(canvas !== null) 
                {
                    canvasTextures.set(name, canvas);

                    if(name.startsWith(libraryPrefix)) 
                    {
                        canvasTextures.set(name.slice(libraryPrefix.length), canvas);
                    }
                }
            }
        }

        const readbacks = textures ? textures.size - this._blittedTextureCount : 0;

        log.info(`Room textures converted in ${Math.round(performance.now() - conversionStart)} ms `
            + `(${this._blittedTextureCount} blitted, ${readbacks} via GPU readback)`);

        // The masks need more than a texture by name: `PlaneMaskManager.updateMask()` positions
        // each one by the asset's own offset and flips it when the asset says so, and neither
        // survives the conversion to a canvas map above. `defineFromSpritesheet()` keeps them —
        // it reads the bundle's `assets` descriptors, where `x`/`y` become the offsets and
        // `flipH`/`flipV` the flags — so the mask manager gets its own collection off the same
        // spritesheet the rasterizers are fed from.
        // AS3: .../src/com/sulake/habbo/room/object/visualization/room/RoomVisualizationData.as::initializeAssetCollection()
        const maskCollection = new GraphicAssetCollection();

        maskCollection.defineFromSpritesheet(
            textures ?? new Map(),
            (jsonData as Record<string, unknown>).assets ?? null,
            RoomEngine.OBJECT_TYPE_ROOM
        );

        this._roomVisualizationData.initializeAssetCollection(canvasTextures, maskCollection);

        log.debug(`Room visualization data initialized with ${canvasTextures.size} textures`);
    }

    /**
     * Convert a PixiJS Texture to an HTMLCanvasElement.
     *
     * TS note: this used to read texture.source.resource directly and draw it via
     * ctx.drawImage(). That's fragile - PixiJS doesn't guarantee a CPU-side resource
     * stays attached to a TextureSource once it's been uploaded to the GPU (source.resource
     * can legitimately be undefined for a fully valid, on-screen texture). renderer.extract.canvas()
     * is PixiJS's own supported way to read a Texture back to a canvas regardless of backing
     * resource, so it's used here instead.
     */
    private pixiTextureToCanvas(texture: Texture): HTMLCanvasElement | null
    {
        try
        {
            const frame = texture.frame;

            if(frame.width < 1 || frame.height < 1) return null;

            const blitted = this.blitTextureFrame(texture);

            if(blitted)
            {
                return blitted;
            }

            return extractCanvas(texture);
        }
        catch (error)
        {
            log.warn('pixiTextureToCanvas: failed to convert texture to canvas', error);

            return null;
        }
    }

    /**
     * Blits a texture's frame straight out of its CPU-side source bitmap.
     *
     * extract.canvas() is correct for any texture but pays a synchronous GPU->CPU readback
     * each call, and onRoomContentReady() makes 304 of them back to back — measured as a
     * ~800 ms frame in the boot log. Room bundle frames all share one TextureSource built by
     * the piece loader from `Texture.from(imageBitmap)`, so the pixels are already in memory
     * and a plain drawImage() of the frame rect produces the same canvas without touching the
     * GPU.
     *
     * Returns null whenever that is not provably the case — no CPU resource, or a rotated or
     * trimmed frame, where the layout extract.canvas() produces is not simply the frame rect.
     * The caller then falls back, so correctness never depends on this path succeeding.
     */
    private blitTextureFrame(texture: Texture): HTMLCanvasElement | null
    {
        const resource = (texture.source as unknown as { resource?: unknown } | null)?.resource;

        if(!resource) return null;

        // OffscreenCanvas belongs in this list: `Texture.from({resource: offscreenCanvas})` is how
        // AvatarImageCache and GraphicAssetCollection.colorizePalette() build their textures, and
        // it is a CanvasImageSource like the other three. Leaving it out sent exactly those
        // textures down the extract.canvas() fallback, which cannot read a canvas-backed texture at
        // all - it returns the screen (see the note in Vortex.init()).
        const drawable = (typeof ImageBitmap !== 'undefined' && resource instanceof ImageBitmap)
            || (typeof OffscreenCanvas !== 'undefined' && resource instanceof OffscreenCanvas)
            || resource instanceof HTMLCanvasElement
            || resource instanceof HTMLImageElement;

        if(!drawable) return null;
        if((texture.rotate ?? 0) !== 0) return null;
        if(texture.trim) return null;

        const frame = texture.frame;
        const canvas = document.createElement('canvas');

        canvas.width = Math.ceil(frame.width);
        canvas.height = Math.ceil(frame.height);

        const context = canvas.getContext('2d');

        if(!context) return null;

        context.imageSmoothingEnabled = false;
        context.drawImage(
            resource as CanvasImageSource,
            frame.x, frame.y, frame.width, frame.height,
            0, 0, canvas.width, canvas.height
        );

        this._blittedTextureCount++;

        return canvas;
    }

    /**
     * Snaps an avatar's z onto the floor when it is standing on bare tile.
     *
     * The three-way agreement test is the whole point: the server's z, the stacking map's tile
     * height and the wall geometry's tile height all matching (within 0.02) means nothing is
     * stacked under the avatar, so its height is the *floor's* and should come from
     * `getFloorAltitude()` — which is the stair-aware value, and the reason an avatar walking up a
     * staircase rises smoothly instead of stepping through it. Any disagreement means the avatar is
     * standing on top of furniture, and the server's z is kept untouched.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::fixedUserLocation()
    private fixedUserLocation(roomId: number, location: IVector3d | null): IVector3d | null
    {
        if(location === null) return null;

        const stackingHeightMap = this.getFurniStackingHeightMap(roomId);
        const legacyGeometry = this.getLegacyGeometry(roomId);

        if(stackingHeightMap === null || legacyGeometry === null) return location;

        let z = location.z;

        const stackingHeight = stackingHeightMap.getTileHeight(location.x, location.y);
        const geometryHeight = legacyGeometry.getTileHeight(location.x, location.y);

        if(Math.abs(z - stackingHeight) < 0.02 && Math.abs(stackingHeight - geometryHeight) < 0.02)
        {
            z = legacyGeometry.getFloorAltitude(location.x, location.y);
        }

        return new Vector3d(location.x, location.y, z);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomIdentifier()
    private getRoomIdentifier(roomId: number): string 
    {
        return String(roomId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectEvent()
    // AS3 switches on `param1.type` (a RoomObjectEvent subtype's string constant) inside one method;
    // this port dispatches on the event's runtime class instead — see the per-branch AS3: traces
    // below for which switch case each `instanceof` arm replaces.
    private handleRoomObjectEvent(event: unknown): void
    {
        // Handle tile mouse events for tile cursor
        if(event instanceof RoomObjectTileMouseEvent)
        {
            this.handleTileMouseEvent(event);
        }
        // AS3 does not branch here at all: handleRoomObjectMouseEvent() takes every room-object
        // mouse event and each handler casts to the subtype it wants. This port dispatches on the
        // subtype instead, so a wall event has to be picked out before the generic
        // RoomObjectMouseEvent arm — RoomObjectWallMouseEvent extends it, and being swallowed there
        // is why hovering a wall did nothing while a wall item was pending.
        else if(event instanceof RoomObjectWallMouseEvent)
        {
            this.handleWallMouseEvent(event);
        }
        else if(event instanceof RoomObjectMouseEvent)
        {
            this.handleObjectMouseEvent(event);
        }
        // AS3: RoomObjectEventHandler.as::processObjectEvent() ROSCE_STATE_CHANGE/ROSCE_STATE_RANDOM
        // cases — a furni "use" (e.g. double-click, dispatched by FurnitureLogic.useObject()) turns
        // into the server use/state message. This is what opens a wired furni's config.
        else if(event instanceof RoomObjectStateChangeEvent)
        {
            if(event.type === RoomObjectStateChangeEvent.ROSCE_STATE_RANDOM)
            {
                this.handleObjectRandomStateChange(event);
            }
            else
            {
                this.handleObjectStateChange(event);
            }
        }
        // AS3: RoomObjectEventHandler.as::processObjectEvent() -> handleObjectActionEvent().
        // The ROFCAE_* furniture actions that go straight to the wire. Same shape of gap as the
        // widget-request bridge below: RoomObjectFurnitureActionEvent was declared and raised by
        // the logics, and nothing consumed it.
        else if(event instanceof RoomObjectFurnitureActionEvent)
        {
            // AS3: _SafeCls_1821.as::processObjectEvent() sends ROFCAE_MOUSE_ARROW and
            // ROFCAE_MOUSE_BUTTON to handleRoomActionMouseRequestEvent(), *not* to
            // handleObjectActionEvent(). Both were reaching useObject() here, which has no case
            // for either and dropped them — every hover-in and hover-out an avatar or a
            // multi-state furni raised died at that switch.
            if(event.type === RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_BUTTON
                || event.type === RoomObjectFurnitureActionEvent.ROFCAE_MOUSE_ARROW)
            {
                this.requestMouseCursor(event.type, event.objectId, event.objectType ?? '');
            }
            else
            {
                this.handleObjectActionEvent(event, this._activeRoomId);
            }
        }
        // AS3: RoomObjectEventHandler.as::processObjectEvent() -> handleObjectWidgetRequestEvent().
        // Until this branch existed, every ROWRE_* a furniture logic raised died here: both
        // RoomObjectWidgetRequestEvent and RoomEngineToWidgetEvent were declared, the logics
        // emitted the first, and nothing ever translated it into the second.
        else if(event instanceof RoomObjectWidgetRequestEvent)
        {
            this.handleObjectWidgetRequestEvent(event, this._activeRoomId);
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectDimmerStateEvent()
        // The moodlight's own state, on its way to the room and to the dimmer widget. Both ends
        // were already ported — `FurnitureRoomDimmerLogic` raises it and
        // `FurnitureDimmerWidgetHandler` listens for the engine event below — and this translation
        // in the middle was the only thing missing, so the widget never learned the light's state.
        else if(event instanceof RoomObjectDimmerStateUpdateEvent)
        {
            this.handleObjectDimmerStateEvent(event, this._activeRoomId);
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectGroupBadgeEvent()
        else if(event instanceof RoomObjectBadgeAssetEvent)
        {
            if(event.type === RoomObjectBadgeAssetEvent.LOAD_BADGE)
            {
                this.requestBadgeImageAsset(this._activeRoomId, event.objectId,
                    this.getRoomObjectCategory(event.objectType ?? ''), event.badgeId, event.groupBadge);
            }
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectFurniIconAssetEvent()
        else if(event instanceof RoomObjectFurniIconAssetEvent)
        {
            if(event.type === RoomObjectFurniIconAssetEvent.LOAD_FURNI_ICON)
            {
                this.requestFurniIconAsset(this._activeRoomId, event.objectId,
                    this.getRoomObjectCategory(event.objectType ?? ''), event.wallItem, event.typeId, event.extra);
            }
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectRoomAdEvent()
        else if(event instanceof RoomObjectRoomAdEvent)
        {
            const category = this.getRoomObjectCategory(event.objectType ?? '');
            let engineType: string | null = null;

            switch(event.type)
            {
                case RoomObjectRoomAdEvent.ROOM_AD_FURNI_CLICK:
                    this.events.emit(event.type, event);
                    // AS3 follows the ad's click url through the toolbar here; the toolbar left with the core cut.

                    engineType = RoomEngineRoomAdEvent.FURNI_CLICK;
                    break;

                case RoomObjectRoomAdEvent.ROOM_AD_FURNI_DOUBLE_CLICK:
                    // AS3 opens a CATALOG_PAGE: link here; the catalog left with the core cut.
                    engineType = RoomEngineRoomAdEvent.FURNI_DOUBLE_CLICK;
                    break;

                case RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_SHOW:
                    engineType = RoomEngineRoomAdEvent.TOOLTIP_SHOW;
                    break;

                case RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_HIDE:
                    engineType = RoomEngineRoomAdEvent.TOOLTIP_HIDE;
                    break;

                // The only case with no engine event of its own: it starts a load instead.
                // AS3: .../src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectRoomAdEvent()
                case RoomObjectRoomAdEvent.ROOM_AD_LOAD_IMAGE:
                    this.requestRoomAdImage(
                        this._activeRoomId, event.objectId, category, event.imageUrl ?? '', event.clickUrl ?? '');
                    break;
            }

            if(engineType !== null)
            {
                this.events.emit(engineType, new RoomEngineObjectEvent(engineType, this._activeRoomId, event.objectId, category));
            }
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectPlaySoundEvent()
        else if(event instanceof RoomObjectPlaySoundIdEvent)
        {
            if(this.connection !== null)
            {
                const category = this.getRoomObjectCategory(event.objectType ?? '');

                this.events.emit(event.type, new RoomEngineObjectPlaySoundEvent(
                    event.type === RoomObjectPlaySoundIdEvent.PLAY_SOUND
                        ? RoomEngineObjectPlaySoundEvent.PLAY_SOUND
                        : RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH,
                    this._activeRoomId, event.objectId, category, event.soundId, event.pitch));
            }
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectSamplePlaybackEvent()
        else if(event instanceof RoomObjectSamplePlaybackEvent)
        {
            if(this.connection !== null)
            {
                const category = this.getRoomObjectCategory(event.objectType ?? '');
                // The four ROPSPE_* types map onto the four REOSPE_* ones by the same suffix.
                const engineType = event.type.replace('ROPSPE_', 'REOSPE_');

                this.events.emit(engineType, new RoomEngineObjectSamplePlaybackEvent(
                    engineType, this._activeRoomId, event.objectId, category,
                    event.sampleId, event.pitch));
            }
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleSelectedObjectMove() / handleSelectedObjectRemove() /
        // handleObjectSlide() — the selection arrow follows the object it is attached to, a
        // removed object clears the avatar selection, and a sliding wall item repaints its window.
        else if(event instanceof RoomObjectMoveEvent)
        {
            const roomId = this._activeRoomId;
            const category = this.getRoomObjectCategory(event.objectType ?? '');

            if(event.type === RoomObjectMoveEvent.ROME_POSITION_CHANGED)
            {
                const object = this.getRoomObject(roomId, event.objectId, category) as IRoomObjectController | null;
                const arrow = this.getSelectionArrow(roomId);

                if(object && arrow && arrow.getEventHandler())
                {
                    arrow.getEventHandler()!.processUpdateMessage(new RoomObjectUpdateMessage(object.getLocation(), null));
                }
            }
            else if(event.type === RoomObjectMoveEvent.ROME_OBJECT_REMOVED)
            {
                this.setSelectedAvatar(roomId, 0, false);
            }
            else if(event.type === RoomObjectMoveEvent.ROME_SLIDE_ANIMATION
                && category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
            {
                this.updateObjectRoomWindow(roomId, event.objectId);
            }
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectDataRequestEvent(). A furni logic asking the
        // engine who the local user is, or what the asset URL prefix is; the engine answers by
        // writing the value onto the object's own model.
        else if(event instanceof RoomObjectDataRequestEvent)
        {
            // AS3 casts getModel() to the writable IRoomObjectModelController; the port keeps
            // the two apart, so read the controller directly.
            const model = (event.object as IRoomObjectController | null)?.getModelController() ?? null;

            if(model !== null)
            {
                if(event.type === RoomObjectDataRequestEvent.CURRENT_USER_ID)
                {
                    model.setNumber(RoomObjectVariableEnum.SESSION_CURRENT_USER_ID, this.sessionDataManager?.userId ?? 0);
                }
                else if(event.type === RoomObjectDataRequestEvent.URL_PREFIX)
                {
                    model.setString(RoomObjectVariableEnum.SESSION_URL_PREFIX,
                        this._configurationManager?.getProperty('url.prefix') ?? '');
                }
            }
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectHSLColorEnableEvent(). Straight relay of the
        // background-colour furni's state to whoever listens on the engine.
        else if(event instanceof RoomObjectHSLColorEnableEvent)
        {
            if(event.type === RoomObjectHSLColorEnableEvent.ROOM_BACKGROUND_COLOR)
            {
                this.events.emit(RoomEngineHSLColorEnableEvent.ROOM_BACKGROUND_COLOR,
                    new RoomEngineHSLColorEnableEvent(
                        RoomEngineHSLColorEnableEvent.ROOM_BACKGROUND_COLOR,
                        this._activeRoomId,
                        event.enable,
                        event.hue,
                        event.saturation,
                        event.lightness
                    ));
            }
        }
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectFloorHoleEvent(). Same dead-signal shape as the
        // ROWRE_* branch above: FurnitureFloorHoleLogic emits ADD_HOLE/REMOVE_HOLE, RoomLogic
        // knows how to apply the resulting update message, and nothing joined the two.
        else if(event instanceof RoomObjectFloorHoleEvent)
        {
            if(event.type === RoomObjectFloorHoleEvent.ADD_HOLE) this.addFloorHole(this._activeRoomId, event.objectId);
            else if(event.type === RoomObjectFloorHoleEvent.REMOVE_HOLE) this.removeFloorHole(this._activeRoomId, event.objectId);
        }

        // Forward object events
        if(event && typeof event === 'object' && 'type' in event)
        {
            this.events.emit('roomObjectEvent', event);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectActionEvent()
    private handleObjectActionEvent(event: RoomObjectFurnitureActionEvent, roomId: number): void
    {
        if(event === null) return;

        this.useObject(roomId, event.objectId, event.objectType, event.type);
    }

    // DEVIATION: AS3 also confirms and claims an NFT reward box here; the RPG fork removed NFT.
    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::useObject()
     *
     * `roomId` and `objectType` are unused in AS3's body too — it takes them for the signature and
     * only ever reads `objectId` and `useType`.
     */
    private useObject(_roomId: number, objectId: number, _objectType: string | null, useType: string): void
    {
        const connection = this.connection;

        if(connection === null) return;

        switch(useType)
        {
            case RoomObjectFurnitureActionEvent.ROFCAE_DICE_ACTIVATE:
                connection.send(new ThrowDiceMessageComposer(objectId));
                break;
            case RoomObjectFurnitureActionEvent.ROFCAE_DICE_OFF:
                connection.send(new DiceOffMessageComposer(objectId));
                break;
            case RoomObjectFurnitureActionEvent.ROFCAE_USE_HABBOWHEEL:
                connection.send(new SpinWheelOfFortuneMessageComposer(objectId));
                break;
            case RoomObjectFurnitureActionEvent.ROFCAE_STICKIE:
                connection.send(new GetItemDataMessageComposer(objectId));
                break;
            case RoomObjectFurnitureActionEvent.ROFCAE_ENTER_ONEWAYDOOR:
                connection.send(new EnterOneWayDoorMessageComposer(objectId));
                break;
        }
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::modifyRoomObjectData()
     *
     * The category gate is AS3's: only wall items (20) are accepted, and anything else returns
     * false without touching the wire.
     */
    modifyRoomObjectData(objectId: number, category: number, colorHex: string, text: string): boolean
    {
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL) return false;

        return this.modifyWallItemData(this._activeRoomId, objectId, colorHex, text);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::deleteRoomObject()
    deleteRoomObject(objectId: number, category: number): boolean
    {
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL) return false;

        return this.deleteWallItem(this._activeRoomId, objectId);
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::modifyWallItemData()
     *
     * `roomId` is unused in AS3's body too — the server infers the room from the session.
     */
    modifyWallItemData(_roomId: number, objectId: number, colorHex: string, text: string): boolean
    {
        const connection = this.connection;

        if(connection === null) return false;

        connection.send(new SetItemDataMessageComposer(objectId, colorHex, text));

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::deleteWallItem()
    deleteWallItem(_roomId: number, objectId: number): boolean
    {
        const connection = this.connection;

        if(connection === null) return false;

        connection.send(new RemoveItemMessageComposer(objectId));

        return true;
    }

    /**
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectWidgetRequestEvent()
     *
     * Translates a furniture logic's widget request (`ROWRE_*`) into the room-engine event the
     * room desktop listens for (`RETWE_*`). The mapping is 1:1 and carries no logic of its own;
     * three of the cases additionally forward the object's own widget/context-menu name.
     *
     * `_SafeCls_1821` is AS3's RoomObjectEventHandler, which this port folded into RoomEngine —
     * the same class that already implements IRoomRenderingCanvasMouseListener here.
     */
    /**
     * The moodlight's state, from the room object to the room engine's own event bus.
     *
     * AS3 guards on the connection being live, which is what keeps a state event from a room
     * being torn down out of the widget's hands.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectDimmerStateEvent()
    private handleObjectDimmerStateEvent(event: RoomObjectDimmerStateUpdateEvent, roomId: number): void
    {
        if(this._connection === null) return;

        this.events.emit(
            RoomEngineDimmerStateEvent.CYCLED,
            new RoomEngineDimmerStateEvent(
                roomId,
                event.objectId,
                event.state,
                event.presetId,
                event.effectId,
                event.color,
                event.brightness
            )
        );
    }

    // DEVIATION: AS3 also forwards ROWRE_JUKEBOX_PLAYLIST_EDITOR (`_SafeCls_1821.as:1473-1478`); the
    //   RPG fork removed jukebox music.
    // DEVIATION: AS3 also forwards the mystery-box and mystery-trophy open-dialog requests; the RPG
    //   fork removed mystery boxes.
    // DEVIATION: AS3 also forwards ROWRE_MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG
    //   (`_SafeCls_1821.as:1486`); the RPG fork removed monsterplants.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleObjectWidgetRequestEvent()
    private handleObjectWidgetRequestEvent(event: RoomObjectWidgetRequestEvent, roomId: number): void
    {
        const objectId = event.objectId;
        const objectType = event.objectType;

        if(objectType === null) return;

        const category = this.getRoomObjectCategory(objectType);

        // AS3 reads the name off the object's own event handler for the three payload-carrying
        // cases; `widget` and `contextMenu` are the same underlying field.
        const widgetName = (event.object as IRoomObjectController | null)?.getEventHandler?.()?.widget ?? null;

        // The seam where the four silent furni-widget wirings meet: the logic names a widget, the
        // desktop routes the event to the handler whose `type` matches that name, and a mismatch —
        // or a null here — is a furni that does nothing, with no throw and no other trace. Diagnosing
        // one without this line means reading four files and guessing; with it,
        // `__log.set('habbo.room.RoomEngine', 'debug')` answers it in one click.
        log.debug(`Widget request ${event.type} for object ${objectId} (${objectType}) → widget ${widgetName ?? 'none'}`);

        switch(event.type)
        {
            case RoomObjectWidgetRequestEvent.ROWRE_OPEN_WIDGET:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_OPEN_WIDGET, roomId, objectId, category, widgetName);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_CLOSE_WIDGET:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_CLOSE_WIDGET, roomId, objectId, category, widgetName);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_OPEN_FURNI_CONTEXT_MENU:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_OPEN_FURNI_CONTEXT_MENU, roomId, objectId, category, widgetName);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_CLOSE_FURNI_CONTEXT_MENU:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_CLOSE_FURNI_CONTEXT_MENU, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_PLACEHOLDER:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_PLACEHOLDER, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_CREDITFURNI:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_CREDITFURNI, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_STICKIE:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_STICKIE, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_PRESENT:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_PRESENT, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_TROPHY:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_TROPHY, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_TEASER:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_TEASER, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_ECOTRONBOX:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_ECOTRONBOX, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_DIMMER:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_DIMMER, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_REMOVE_DIMMER:
                this.emitToWidget(RoomEngineToWidgetEvent.REMOVE_DIMMER, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_CLOTHING_CHANGE:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_CLOTHING_CHANGE, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_BACKGROUND_COLOR:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_BACKGROUND_COLOR, roomId, objectId, category);
                break;
            // AS3: _SafeCls_1821.as:1530-1531. No widget behind this one — the handler follows the
            // link itself, which is why it is wired here with nothing else to port.
            case RoomObjectWidgetRequestEvent.ROWRE_INTERNAL_LINK:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_INTERNAL_LINK, roomId, objectId, category);
                break;
            // AS3: _SafeCls_1821.as:1524-1528
            case RoomObjectWidgetRequestEvent.ROWRE_HIGH_SCORE_DISPLAY:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_HIGH_SCORE_DISPLAY, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_HIDE_HIGH_SCORE_DISPLAY:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_HIDE_HIGH_SCORE_DISPLAY, roomId, objectId, category);
                break;
            // AS3: _SafeCls_1821.as:1494-1495. The two names do not match on purpose: the
            // room-object side says HIDE_AREA, the widget side says AREA_HIDE.
            case RoomObjectWidgetRequestEvent.ROWRE_HIDE_AREA:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_AREA_HIDE, roomId, objectId, category);
                break;
            // Double-clicking a pet product already standing in the room. Unlike its siblings this
            // one does not go through RoomEngineToWidgetEvent: AS3 dispatches the use-product event
            // itself, which AvatarInfoWidgetHandler picks up to raise one bubble per eligible pet.
            case RoomObjectWidgetRequestEvent.ROWRE_PET_PRODUCT_MENU:
                this.events.emit(
                    RoomEngineUseProductEvent.USE_PRODUCT_FROM_ROOM,
                    new RoomEngineUseProductEvent(RoomEngineUseProductEvent.USE_PRODUCT_FROM_ROOM, roomId, objectId, category)
                );
                break;
            // The only case here that does not raise a widget event: AS3 sends the request itself
            // and lets the reply (`GuildFurniContextMenuInfo`, 3220) open the bubble, because the
            // guild's name and membership flags only exist server-side. The guild id rides along
            // from the object's own model.
            case RoomObjectWidgetRequestEvent.ROWRE_GUILD_FURNI_CONTEXT_MENU:
            {
                const guildId = event.object?.getModel()?.getNumber(
                    RoomObjectVariableEnum.FURNITURE_GUILD_CUSTOMIZED_GUILD_ID
                ) ?? 0;

                this.connection?.send(new GetGuildFurniContextMenuInfoMessageComposer(objectId, guildId));
                break;
            }
            // AS3: _SafeCls_1821.as:1488-1490. The widget event keeps the ROWRE_ prefix its sibling
            // requests trade for RETWE_ — AS3 spells it that way on both sides, so the mismatch is
            // the source's, not a typo here.
            case RoomObjectWidgetRequestEvent.ROWRE_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG:
                this.emitToWidget(
                    RoomEngineToWidgetEvent.REQUEST_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG,
                    roomId, objectId, category
                );
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_MANNEQUIN:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_MANNEQUIN, roomId, objectId, category);
                break;
            // AS3: _SafeCls_1821.as:1502-1503
            case RoomObjectWidgetRequestEvent.ROWRE_EFFECTBOX_OPEN_DIALOG:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_EFFECTBOX_OPEN_DIALOG, roomId, objectId, category);
                break;
            // The second of the two cases here that talk to the server directly instead of raising
            // a widget event (the guild-furni one above is the other). Achievement id 0 means "just
            // send me the list" — the same composer with a real id is what commits a choice, so the
            // zero is load-bearing, not a placeholder.
            // AS3: _SafeCls_1821.as:1508-1509
            case RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_OPEN:
                this.connection?.send(new GetResolutionAchievementsMessageComposer(objectId, 0));
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_ENGRAVING:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_ACHIEVEMENT_RESOLUTION_FAILED:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_ACHIEVEMENT_RESOLUTION_FAILED, roomId, objectId, category);
                break;
            // AS3: _SafeCls_1821.as:1518-1523
            case RoomObjectWidgetRequestEvent.ROWRE_FRIEND_FURNITURE_CONFIRM:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_FRIEND_FURNITURE_CONFIRM, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_FRIEND_FURNITURE_ENGRAVING:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_FRIEND_FURNITURE_ENGRAVING, roomId, objectId, category);
                break;
            case RoomObjectWidgetRequestEvent.ROWRE_BADGE_DISPLAY_ENGRAVING:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_BADGE_DISPLAY_ENGRAVING, roomId, objectId, category);
                break;
            // AS3: _SafeCls_1821.as:1533-1534 — the last case, and the only one AS3 leaves without
            // a trailing `break`.
            case RoomObjectWidgetRequestEvent.ROWRE_ROOM_LINK:
                this.emitToWidget(RoomEngineToWidgetEvent.REQUEST_ROOM_LINK, roomId, objectId, category);
                break;
            default:
                // Every `ROWRE_*` AS3 answers to is now mapped, so reaching this means the object
                // raised a request type that exists in neither client.
                log.warn(`Unmapped room-object widget request: ${event.type}`);
                break;
        }
    }

    /**
     * AS3 inlines this dispatch at every case of handleObjectWidgetRequestEvent(); folded into
     * one helper here because the port emits by name rather than through a Flash event bus.
     */
    private emitToWidget(type: string, roomId: number, objectId: number, category: number, widget: string | null = null): void
    {
        this.events.emit(type, new RoomEngineToWidgetEvent(type, roomId, objectId, category, widget));
    }

    // AS3: sources/win63_version/habbo/room/class_1947.as::handleObjectStateChange()
    private handleObjectStateChange(event: RoomObjectStateChangeEvent): void
    {
        const object = event.object;

        if(object === null) return;

        this.sendObjectStateChange(this._activeRoomId, object.getId(), object.getType(), event.param, false);
    }

    // AS3: sources/win63_version/habbo/room/class_1947.as::handleObjectRandomStateChange()
    private handleObjectRandomStateChange(event: RoomObjectStateChangeEvent): void
    {
        const object = event.object;

        if(object === null) return;

        this.sendObjectStateChange(this._activeRoomId, object.getId(), object.getType(), event.param, true);
    }

    /**
     * The room-object *event* half: asks the server to toggle a real furni. It belongs to a
     * different AS3 class (`class_1947`, the room-object event handler) that this port flattened
     * into RoomEngine, which is why it needed a distinct name — the engine's own
     * `changeObjectState()` above cycles a preview's state locally, with no server round trip.
     * Name DERIVED for the collision; the AS3 trace still points at the real member.
     */
    // AS3: sources/win63_version/habbo/room/class_1947.as::changeObjectState()
    private sendObjectStateChange(roomId: number, objectId: number, objectType: string, state: number, isRandom: boolean): void
    {
        const category = this.getRoomObjectCategory(objectType);

        this.changeRoomObjectState(roomId, objectId, category, state, isRandom);
    }

    // AS3: sources/win63_version/habbo/room/class_1947.as::changeRoomObjectState()
    private changeRoomObjectState(roomId: number, objectId: number, category: number, state: number, isRandom: boolean): boolean
    {
        if(this._connection === null) return true;

        // DEVIATION: in an RPG zone a furni's own state change (its logic's double click) sends
        // nothing: the single click on a listed object already used it (handleObjectMouseEvent()).
        if(this._rpgInteractives !== null) return true;

        // DEVIATION: AS3 refuses furni below usage policy 2 here while the room is in wired
        // play-test mode; the RPG has no wired, so no play-test mode.
        const session = this._roomSessionManager?.getSession(roomId) ?? null;

        const selectedObjectData = this._roomInstanceData.get(roomId)?.selectedObjectData ?? null;

        if(selectedObjectData === null || selectedObjectData.operation !== RoomObjectOperationEnum.OBJECT_PLACE)
        {
            if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
            {
                if(!isRandom)
                {
                    this._connection.send(new UseFurnitureMessageComposer(objectId, state));
                }
                else
                {
                    this._connection.send(new SetRandomStateMessageComposer(objectId, state));
                }
            }
            else if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
            {
                this._connection.send(new UseWallItemMessageComposer(objectId, state));
            }
        }

        // Outside the `selectedObjectData` branch in AS3 too: placing a furni still counts as a
        // use for the achievement, even though no use message went out.
        session?.trackEventLogOncePerSession('Achievements', 'interaction', 'furniture.use');

        return true;
    }

    /**
     * Handle tile mouse events - update the tile cursor.
     * Based on AS3 RoomObjectEventHandler.handleMouseOverTile()
     */
    private handleTileMouseEvent(event: RoomObjectTileMouseEvent): void 
    {
        if(this._activeRoomId < 0) return;

        // AS3 feeds every tile event to the area selector before its own switch
        // (_SafeCls_1821.as::handleRoomObjectMouseEvent()). The selector ignores everything unless a
        // tool has activated it, so this costs a state comparison the rest of the time — and without
        // it the wired "select area" drag never sees a tile.
        this.areaSelectionManager.handleTileMouseEvent(event);

        const tileX = event.tileXAsInt;
        const tileY = event.tileYAsInt;
        const tileZ = event.tileZAsInt;

        if(event.type === RoomObjectMouseEvent.ROE_MOUSE_MOVE)
        {
            // Cache the move for recalibrateMovements() (AS3 _moveMouseEventCache), which replays
            // it to re-snap a ghost after a tile-map rebuild or to build the next one of a repeated
            // placement. tileZ is not kept: neither handleObjectPlace() nor handleObjectMove() reads
            // it — they re-derive the height from the stacking map.
            this._moveMouseEventCache = {tileEvent: {tileX, tileY}, wallEvent: null};

            const tileCursor = this.getTileCursor(this._activeRoomId);
            const cursorUpdate = this.handleMouseOverTile(event, this._activeRoomId);

            if(tileCursor && tileCursor.getEventHandler() && cursorUpdate !== null)
            {
                tileCursor.getEventHandler()!.processUpdateMessage(cursorUpdate);
            }

            // AS3: _SafeCls_1821.as::handleObjectPlace()/handleObjectMove() — real ghost-object
            // preview while an inventory item is pending placement or an already-placed object
            // is being dragged. AS3 gates on neither category nor tile-vs-wall event here; it hands
            // the event to handleObjectPlace(), which branches internally (10 furniture, 20 wall,
            // 100 user/pet/bot). Restricting this to category 10 is what kept the pet ghost from
            // ever being built, even once initializeRoomObjectInsert() started accepting it — and
            // excluding category 20 kept a wall-item ghost alive over the floor, where AS3 disposes
            // it (handleObjectPlace()'s wall arm finds no wall event and gives up).
            const selectedObjectData = this._roomInstanceData.get(this._activeRoomId)?.selectedObjectData ?? null;

            if(selectedObjectData !== null)
            {
                if(selectedObjectData.operation === RoomObjectOperationEnum.OBJECT_PLACE)
                {
                    this.handleObjectPlace(this._activeRoomId, {tileX, tileY}, null);
                }
                else if(selectedObjectData.operation === RoomObjectOperationEnum.OBJECT_MOVE)
                {
                    this.handleObjectMove(this._activeRoomId, {tileX, tileY}, null);
                }
            }
        }
        else if(event.type === RoomObjectMouseEvent.ROE_MOUSE_CLICK) 
        {
            // A click that ends an area drag belongs to the selector, not to the room: AS3 tests it
            // first and skips placement, move-confirmation and walking when it returns true
            // (_SafeCls_90.as:2382). Without this the drag would never end and the avatar would walk
            // to wherever the rectangle finished.
            if(this.areaSelectionManager.finishSelecting()) return;

            const selectedObjectData = this._roomInstanceData.get(this._activeRoomId)?.selectedObjectData ?? null;

            if(selectedObjectData !== null && selectedObjectData.operation === RoomObjectOperationEnum.OBJECT_PLACE)
            {
                // AS3: _SafeCls_1821.as::placeObject() — sends the ghost's own current
                // (already tile-snapped/direction-validated) location, then disposes it;
                // the real furniture only appears once the server echoes the add back.
                //
                // AS3 passes which kind of event confirmed the placement straight through
                // (`placeObject(roomId, tileEvent != null, wallEvent != null)`); this is the tile
                // arm, so the placement is on the floor.
                this.placeObject(this._activeRoomId, true, false, event.eventId);
            }
            else if(selectedObjectData !== null && selectedObjectData.operation === RoomObjectOperationEnum.OBJECT_MOVE)
            {
                // AS3: _SafeCls_1821.as::modifyRoomObject() "OBJECT_MOVE_TO" case
                this.confirmObjectMove(this._activeRoomId);
            }
            else
            {
                // AS3: _SafeCls_1821.as::handleClickOnTile() — in decorate mode the floor is not a
                // walk target at all: clicks belong to the furniture being arranged. A spectator
                // clicks nothing either, and in game mode the click is a game action rather than a
                // walk.
                // DEVIATION: AS3 hands that game-mode click to the games manager
                //   (`handleClickOnHuman()` on the player under the cursor, else `handleClickOnTile()`);
                //   the RPG fork removed Snow War and the games manager, so it is only swallowed.
                if(this.isDecorateMode) return;

                const session = this._roomSessionManager?.getSession(this._activeRoomId) ?? null;

                if(session !== null && session.isSpectatorMode) return;

                if(this.isGameMode) return;

                // The second of `isMoveBlocked()`'s two AS3 read sites — the area selector holds it
                // for the length of a drag, and without this the click that ends the drag also
                // walked the avatar to wherever the rectangle finished.
                if(this.isMoveBlocked()) return;

                // The floor plane's own height at that tile - the surface actually pointed at, which
                // for a click on bare floor is the one the server should walk to even when a raised
                // item shares the tile.
                this._connection?.send(new MoveAvatarMessageComposer(tileX, tileY, tileZ));
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectMouseMove()
    // The wall counterpart of handleTileMouseEvent(). AS3 has no such split — one
    // handleRoomObjectMouseMove()/handleRoomObjectMouseClick() pair takes both kinds of event and
    // lets handleObjectPlace()/placeObject() sort out which surface is under the cursor — so this
    // routes to the same two methods, with the wall event where the tile event would go.
    //
    // Only a pending placement or move is handled: a wall carries no tile cursor and nothing walks
    // to it, so there is no third branch here the way handleTileMouseEvent() has one.
    private handleWallMouseEvent(event: RoomObjectWallMouseEvent): void
    {
        if(this._activeRoomId < 0) return;

        if(event.type === RoomObjectMouseEvent.ROE_MOUSE_MOVE)
        {
            // Cached before the operation check, as AS3 does — handleRoomObjectMouseMove() writes
            // _moveMouseEventCache on its second line, ahead of reading the selection. One field for
            // both surfaces there, since it caches the event itself. Caching only under an active
            // selection would leave a repeated wall placement replaying a stale tile.
            this._moveMouseEventCache = {tileEvent: null, wallEvent: event};
        }

        const selectedObjectData = this._roomInstanceData.get(this._activeRoomId)?.selectedObjectData ?? null;

        if(selectedObjectData === null) return;

        const operation = selectedObjectData.operation;

        if(operation !== RoomObjectOperationEnum.OBJECT_PLACE && operation !== RoomObjectOperationEnum.OBJECT_MOVE) return;

        if(event.type === RoomObjectMouseEvent.ROE_MOUSE_MOVE)
        {
            if(operation === RoomObjectOperationEnum.OBJECT_PLACE)
            {
                this.handleObjectPlace(this._activeRoomId, null, event);
            }
            else
            {
                this.handleObjectMove(this._activeRoomId, null, event);
            }
        }
        else if(event.type === RoomObjectMouseEvent.ROE_MOUSE_CLICK)
        {
            if(operation === RoomObjectOperationEnum.OBJECT_PLACE)
            {
                this.placeObject(this._activeRoomId, false, true, event.eventId);
            }
            else
            {
                this.confirmObjectMove(this._activeRoomId);
            }
        }
    }

    /**
     * Handle object mouse events - selects the clicked object (furniture/user)
     * so widgets (e.g. infostand) can react. A modifier-held click on furniture is
     * routed to the manipulation shortcuts (SHIFT=rotate, CTRL=pickup) instead.
     *
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as — object click handling
     * that leads to RoomEngineObjectEvent.REOE_SELECTED being dispatched.
     */
    private handleObjectMouseEvent(event: RoomObjectMouseEvent): void
    {
        // AS3: _SafeCls_1821.as::handleRoomObjectMouseEvent() switches on ALL five object event
        // types. The port previously handled only DOWN and CLICK and early-returned on the rest,
        // which silently dropped MOVE/ENTER/LEAVE — so hovering a walkable furni never snapped the
        // tile cursor onto its surface, and REOE_MOUSE_ENTER/LEAVE were never emitted (no other
        // emit site exists). Route them faithfully.
        if(event.type === RoomObjectMouseEvent.ROE_MOUSE_DOWN)
        {
            this.handleRoomObjectMouseDown(event);

            return;
        }

        if(event.type === RoomObjectMouseEvent.ROE_MOUSE_MOVE)
        {
            this.handleRoomObjectMouseMove(event);

            return;
        }

        if(event.type === RoomObjectMouseEvent.ROE_MOUSE_ENTER)
        {
            this.handleRoomObjectMouseEnter(event);

            return;
        }

        if(event.type === RoomObjectMouseEvent.ROE_MOUSE_LEAVE)
        {
            this.handleRoomObjectMouseLeave(event);

            return;
        }

        if(event.type !== RoomObjectMouseEvent.ROE_MOUSE_CLICK) return;

        const obj = event.object;

        if(!obj) return;

        const objType = obj.getType();
        const objId = obj.getId();

        // AS3 (handleRoomObjectMouseClick, _SafeCls_1821.as:605-690) confirms a placement/move
        // only for a clicked category of 0 (the floor) - its ghost is mouse-transparent, so the
        // click passes THROUGH it to the tile. This port's ghost is a normal interactive
        // furniture object that sits under the cursor and captures the click as an object event,
        // so it never reaches handleTileMouseEvent()'s placeObject path. That made placing feel
        // impossible - every click just re-selected the ghost - and broke repeated ("on the fly")
        // inventory placement once the FurniModel re-arm was fixed.
        //
        // While a placement/move is active, route ANY object-level click to the placement
        // confirmation, whatever was hit: a click on the ghost (which sits on a valid tile)
        // places it; a click over the void outside the room hits nothing placeable, but the
        // ghost was already disposed by handleObjectPlace() on the invalid-tile hover, so
        // placeObject() finds no ghost and emits REOE_PLACED with placedInRoom=false - which is
        // exactly how FurniModel.onObjectPlaced() cancels the mover and re-shows the inventory.
        // That gives the AS3 "click outside the room to cancel placement" behaviour.
        if(this._activeRoomId >= 0)
        {
            const selectedObjectData = this._roomInstanceData.get(this._activeRoomId)?.selectedObjectData ?? null;

            if(selectedObjectData !== null)
            {
                if(selectedObjectData.operation === RoomObjectOperationEnum.OBJECT_PLACE)
                {
                    // This path exists only because the ghost captured a click AS3's ghost would
                    // have let through, so there is no tile/wall event here to read the surface
                    // from. The pending item's own category answers it: a wall item's ghost only
                    // ever sits on a wall, anything else on the floor.
                    const onWall = selectedObjectData.category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL;

                    this.placeObject(this._activeRoomId, !onWall, onWall, event.eventId);

                    return;
                }

                if(selectedObjectData.operation === RoomObjectOperationEnum.OBJECT_MOVE)
                {
                    this.confirmObjectMove(this._activeRoomId);

                    return;
                }
            }
        }

        if(this._activeRoomId < 0) return;

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as:2391-2398
        // A click no room object handled (i.e. the floor/empty space) dispatches
        // REOE_DESELECTED(roomId, -1, MINIMUM) unconditionally. Without this the
        // InfoStand furni/user panels and the own-avatar bubble never closed when
        // clicking away.
        if(objType === 'room' || objId < 0)
        {
            this._selectedObject = null;

            this.events.emit(
                RoomEngineObjectEvent.REOE_DESELECTED,
                new RoomEngineObjectEvent(
                    RoomEngineObjectEvent.REOE_DESELECTED,
                    this._activeRoomId,
                    -1,
                    RoomObjectCategoryEnum.MINIMUM
                )
            );

            return;
        }

        const category = this.findObjectCategory(this._activeRoomId, obj);

        if(category === null) return;

        // AS3: _SafeCls_1821.as::handleRoomObjectMouseClick() OBJECT_UNDEFINED modifier branches
        // (lines 749-778). clickRoomObject (line 581) suppresses the plain click when a modifier
        // is held, so a modified click manipulates the furniture instead of selecting it. The
        // dispatched REOE_REQUEST_* events are consumed by RoomDesktop.roomObjectEventHandler(),
        // which applies checkFurniManipulationRights() then calls modifyRoomObject(). Disabled in
        // game mode (AS3 line 751). Only the two exact gestures are intercepted; every other
        // click (including plain, and modifier combos AS3 does not act on) falls through to the
        // normal selection below.
        if(!this.isGameMode
            && (category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
                || category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL))
        {
            // SHIFT-only click rotates floor furniture (cat 10 only; wall furni excluded) — AS3 line 753.
            if(event.shiftKey && !event.ctrlKey && !event.altKey
                && category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
            {
                this.events.emit(
                    RoomEngineObjectEvent.REOE_REQUEST_ROTATE,
                    new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_REQUEST_ROTATE, this._activeRoomId, objId, category)
                );

                // AS3 line 769: a modifier gesture spends the click, floor included.
                if(event.eventId !== '') this.setMouseEventId(0, 'click', event.eventId);

                return;
            }

            // CTRL-only click picks up floor/wall furniture — AS3 line 763.
            if(event.ctrlKey && !event.altKey && !event.shiftKey)
            {
                this.events.emit(
                    RoomEngineObjectEvent.REOE_REQUEST_PICKUP,
                    new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_REQUEST_PICKUP, this._activeRoomId, objId, category)
                );

                if(event.eventId !== '') this.setMouseEventId(0, 'click', event.eventId);

                return;
            }

            // ALT+drag move is a mouse-DOWN gesture — see handleRoomObjectMouseDown().
        }

        // AS3: _SafeCls_1821.as::handleRoomObjectMouseClick() cat-100 branch (lines 700-748).
        // Modifier gestures on rentable bots / monsterplants call modifyRoomObject() directly
        // (unlike furni, which dispatch REOE_REQUEST_*).
        //
        // SHIFT-only rotates. AS3 evaluates it *before* the selection step and skips selecting
        // when it succeeds (line 700-708), which is why it is checked first here too. When it
        // fails, AS3 selects the object and then repeats the very same call inside the cat-100
        // block (line 726-730); the inputs are identical, so the retry can only fail again — it
        // is noted rather than duplicated.
        if(!this.isGameMode && category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
            && (objType === 'monsterplant' || objType === 'rentable_bot')
            && event.shiftKey && !event.ctrlKey && !event.altKey)
        {
            if(this.modifyRoomObject(objId, category, RoomObjectOperationEnum.OBJECT_ROTATE_POSITIVE))
            {
                if(event.eventId !== '') this.setMouseEventId(0, 'click', event.eventId);

                return;
            }
        }

        if(!this.isGameMode && category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER
            && (objType === 'monsterplant' || objType === 'rentable_bot')
            && event.ctrlKey && !event.altKey && !event.shiftKey)
        {
            // CTRL-only click picks it up — bot → OBJECT_PICKUP_BOT (AS3 line 721), plant →
            // OBJECT_PICKUP_PET (line 732).
            this.modifyRoomObject(objId, category, objType === 'rentable_bot' ? RoomObjectOperationEnum.OBJECT_PICKUP_BOT : RoomObjectOperationEnum.OBJECT_PICKUP_PET);

            if(event.eventId !== '') this.setMouseEventId(0, 'click', event.eventId);

            return;
        }

        // AS3: _SafeCls_1821.as::handleRoomObjectMouseClick() line 738 — the `else` arm of the
        // cat-100 modifier chain above. Does nothing outside game mode; in it, a click on an avatar
        // is a snow-war throw at that player.
        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        {
            this.handleClickOnAvatar(objId, event);

            // AS3 line 740-746: `if(!playingGame) _loc10_ = true`, which claims the click for the
            // room bucket. Without it the floor plane's own tile event for the same physical click
            // arrives next and walks the avatar — clicking a pet to open its panel walked you onto
            // the tile under it, and clicking another player walked you at them.
            if(event.eventId !== '') this.setMouseEventId(0, 'click', event.eventId);
        }

        // DEVIATION: in an RPG zone the decor is frozen (F3b §7.3): a click on an object the server
        //   listed uses it, any other object does nothing — no ClickFurni, no info stand. Walking onto
        //   a walkable one still works as in AS3 below.
        if(this._rpgInteractives !== null
            && (category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE || category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL))
        {
            if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE && this._rpgInteractives.has(objId))
            {
                this._connection?.send(new UseFurnitureMessageComposer(objId, 0));
            }

            if(this.isWhereYouClickWhereYouGo() && this.handleMoveTargetFurni(event))
            {
                if(event.eventId !== '') this.setMouseEventId(0, 'click', event.eventId);
            }

            return;
        }

        // AS3: _SafeCls_1821.as::handleRoomObjectMouseClick() — a plain (unmodified) furni click
        // notifies the server via ClickFurni (wired "click furni" triggers, click interactions),
        // then, in where-you-click-where-you-go mode, walks the avatar onto the furni if it is
        // walkable. clickRoomObject() self-guards on modifiers; handleMoveTargetFurni() only walks
        // for a walkable floor furni (getActiveSurfaceLocation returns null otherwise), so both are
        // no-ops for avatars, pets and decorative furniture.
        this.clickRoomObject(event);

        // A walk onto the furni is a walk: AS3 seeds the same `_loc10_` with its result so the tile
        // underneath does not send a second, contradicting MoveAvatar.
        if(this.isWhereYouClickWhereYouGo() && this.handleMoveTargetFurni(event))
        {
            if(event.eventId !== '') this.setMouseEventId(0, 'click', event.eventId);
        }

        this.selectRoomObject(this._activeRoomId, objId, category);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectMouseMove()
    // Object-hover branch only (tile-hover is handled by handleTileMouseEvent). Snaps the tile
    // cursor onto the surface tile of a walkable floor furni under the cursor, so hovering a rug or
    // any stand/sit/lay-able furni shows the same highlight you get over bare floor.
    private handleRoomObjectMouseMove(event: RoomObjectMouseEvent): void
    {
        if(this._activeRoomId < 0) return;

        const obj = event.object;

        if(obj === null || obj.getId() === -1) return;

        const tileCursor = this.getTileCursor(this._activeRoomId);

        if(tileCursor === null || tileCursor.getEventHandler() === null) return;

        if(!this.isWhereYouClickWhereYouGo()) return;

        const category = this.getRoomObjectCategory(obj.getType());
        const cursorUpdate = this.handleMouseOverObject(category, this._activeRoomId, event);

        // AS3 also processes a null update (hiding the cursor) for a non-walkable furni; the port's
        // tile-cursor handler is not null-tolerant, so leaving the cursor untouched there is the
        // safe, near-identical behaviour (the highlight simply doesn't move onto the furni).
        if(cursorUpdate !== null)
        {
            tileCursor.getEventHandler()!.processUpdateMessage(cursorUpdate);
        }
    }

    /**
     * Where the walk cursor goes for a hovered *tile*. With where-you-click-where-you-go on this is
     * simply the tile itself, which is the only branch the port used to have — it built that message
     * inline and never asked.
     *
     * The other branch matters over a variable-height furni (`furniture_is_variable_height`, the
     * adjustable platforms): the cursor is lifted by the difference between the stacking height at
     * that tile and the room's own floor height there, so it sits on the furni's surface instead of
     * sinking into the floor under it.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleMouseOverTile()
    private handleMouseOverTile(event: RoomObjectTileMouseEvent, roomId: number): RoomObjectTileCursorUpdateMessage | null
    {
        const tileX = event.tileXAsInt;
        const tileY = event.tileYAsInt;
        const tileZ = event.tileZAsInt;

        if(this.isWhereYouClickWhereYouGo())
        {
            return new RoomObjectTileCursorUpdateMessage(new Vector3d(tileX, tileY, tileZ), 0, true, event.eventId);
        }

        const tileCursor = this.getTileCursor(roomId);

        if(tileCursor === null || tileCursor.getEventHandler() === null) return null;

        if(this.getRoom(roomId) === null) return null;

        const tileObjectMap = this.getTileObjectMap(roomId);

        if(tileObjectMap === null) return null;

        const stackingHeightMap = this.getFurniStackingHeightMap(roomId);

        if(stackingHeightMap === null) return null;

        const occupant = tileObjectMap.getObjectInTile(tileX, tileY);

        const variableHeight = occupant?.getModel()?.getNumber(RoomObjectVariableEnum.FURNITURE_IS_VARIABLE_HEIGHT) ?? 0;

        if(variableHeight > 0)
        {
            const stackingHeight = stackingHeightMap.getTileHeight(tileX, tileY);
            const floorHeight = this.getLegacyGeometry(roomId)?.getTileHeight(tileX, tileY) ?? 0;

            return new RoomObjectTileCursorUpdateMessage(
                new Vector3d(tileX, tileY, tileZ),
                stackingHeight - floorHeight,
                true,
                event.eventId
            );
        }

        return new RoomObjectTileCursorUpdateMessage(new Vector3d(tileX, tileY, tileZ), 0, true, event.eventId);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleMouseOverObject()
    // For a floor furni (category 10) whose surface the cursor is over, returns the tile-cursor
    // update that highlights that surface tile. Reuses getActiveSurfaceLocation (the same projection
    // the click path uses), so hover and click agree on which tile a walkable furni resolves to.
    private handleMouseOverObject(category: number, roomId: number, event: RoomObjectMouseEvent): RoomObjectTileCursorUpdateMessage | null
    {
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE || event.object === null)
        {
            return null;
        }

        const furni = this.getRoomObject(roomId, event.object.getId(), RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);
        const surface = this.getActiveSurfaceLocation(furni, event);

        if(furni === null || surface === null) return null;

        if(this.getFurniStackingHeightMap(roomId) === null) return null;

        return new RoomObjectTileCursorUpdateMessage(
            new Vector3d(surface.x, surface.y, furni.getLocation().z),
            surface.z,
            true,
            event.eventId
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectMouseEnter()
    // Emits REOE_MOUSE_ENTER so hover-driven UI can react, and in game mode snaps the tile cursor
    // onto the avatar and tells the snow-war engine who is under the pointer.
    private handleRoomObjectMouseEnter(event: RoomObjectMouseEvent): void
    {
        const obj = event.object;

        if(obj === null) return;

        const category = this.getRoomObjectCategory(obj.getType());

        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) this.handleMouseEnterAvatar(obj.getId(), event);

        this.events.emit(
            RoomEngineObjectEvent.REOE_MOUSE_ENTER,
            new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_MOUSE_ENTER, this._activeRoomId, obj.getId(), category)
        );
    }

    /**
     * AS3's category-100 arm is *not* gated on game mode, unlike the enter side's: leaving an avatar
     * always resets the tile cursor, which is what stops it from staying stuck under the last
     * avatar the pointer crossed.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectMouseLeave()
    private handleRoomObjectMouseLeave(event: RoomObjectMouseEvent): void
    {
        const obj = event.object;

        if(obj === null) return;

        const category = this.getRoomObjectCategory(obj.getType());

        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        {
            const tileCursor = this.getTileCursor(this._activeRoomId);

            tileCursor?.getEventHandler()?.processUpdateMessage(new RoomObjectDataUpdateMessage(0, null));
        }

        this.events.emit(
            RoomEngineObjectEvent.REOE_MOUSE_LEAVE,
            new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_MOUSE_LEAVE, this._activeRoomId, obj.getId(), category)
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::clickRoomObject()
    // Sends the plain-click notification to the server: floor furni by object id, wall furni by its
    // negation (the server tells the two apart by sign), and an avatar through its own composer.
    // Suppressed when any modifier is held, so a rotate/pickup/move gesture never doubles as a click.
    private clickRoomObject(event: RoomObjectMouseEvent): void
    {
        if(event.altKey || event.ctrlKey || event.shiftKey) return;

        const obj = event.object;

        if(!obj || this._connection === null) return;

        const category = this.findObjectCategory(this._activeRoomId, obj);

        if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE)
        {
            this._connection.send(new ClickFurniMessageComposer(obj.getId()));
        }
        else if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL)
        {
            this._connection.send(new ClickFurniMessageComposer(-obj.getId()));
        }
        else if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        {
            this._connection.send(new ClickCharacterComposer(obj.getId()));
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleMoveTargetFurni()
    // Walks the avatar onto a clicked walkable floor furni (the exact surface tile under the cursor
    // within the furni's footprint). Returns false — no walk — for non-walkable furni, which is how
    // Habbo leaves decorative items (vitrines etc.) to be walked *behind* by clicking the floor.
    private handleMoveTargetFurni(event: RoomObjectMouseEvent): boolean
    {
        const obj = event.object;

        if(!obj) return false;

        const furni = this.getRoomObject(this._activeRoomId, obj.getId(), RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE);
        const location = this.getActiveSurfaceLocation(furni, event);

        if(location !== null && !this.isMoveBlocked() && this._connection !== null)
        {
            // The surface's absolute altitude: the furni's own base plus the height of the face
            // that was clicked. getActiveSurfaceLocation() returns the latter relative to the item,
            // so a rug (sizeZ 0) resting on a table at z=1 resolves to 1, not 0.
            const surfaceZ = (furni?.getLocation().z ?? 0) + location.z;

            this._connection.send(new MoveAvatarMessageComposer(location.x, location.y, surfaceZ));

            return true;
        }

        return false;
    }

    // Projects the click into the furni's surface grid and returns the tile hit, or null if the furni
    // is not stand/sit/lay-able. Pure pixel math ported verbatim from AS3 (variable roles preserved:
    // a/b are the screen->iso projection, then split into the two tile-axis components); the one
    // departure is the footprint clamp at the end, explained where it happens.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::getActiveSurfaceLocation()
    private getActiveSurfaceLocation(obj: IRoomObject | null, event: RoomObjectMouseEvent): Vector3d | null
    {
        if(obj === null) return null;

        const data = this.sessionDataManager?.getFloorItemDataByName(obj.getType()) ?? null;

        if(data === null) return null;

        if(!(data.canStandOn || data.canSitOn || data.canLayOn)) return null;

        const model = obj.getModel();

        if(model === null) return null;

        const location = obj.getLocation();
        const locX = location.x;
        const locY = location.y;
        let sizeX = model.getNumber('furniture_size_x');
        let sizeY = model.getNumber('furniture_size_y');
        const sizeZ = model.getNumber('furniture_size_z');
        const direction = obj.getDirection().x;

        if(direction === 90 || direction === 270)
        {
            const swap = sizeX;
            sizeX = sizeY;
            sizeY = swap;
        }

        if(sizeX < 1) sizeX = 1;
        if(sizeY < 1) sizeY = 1;

        const geometry = this.getRoomCanvasGeometry(this._activeRoomId, 1);

        if(geometry === null) return null;

        const scale = geometry.scale;
        const canSit = data.canSitOn;
        const sitOffset = canSit ? 0.5 : 0;
        const projX = (scale / 2 + event.spriteOffsetX + event.localX) / (scale / 4);
        const projY = (event.spriteOffsetY + event.localY + (sizeZ - sitOffset) * scale / 2) / (scale / 4);
        const isoA = (projX + 2 * projY) / 4;
        const isoB = (projX - 2 * projY) / 4;
        const tileX = Math.floor(locX + isoA);
        const tileY = Math.floor(locY - isoB + 1);

        const tileZ = canSit ? sizeZ - 0.5 : sizeZ;

        if(tileX >= locX && tileX < locX + sizeX && tileY >= locY && tileY < locY + sizeY)
        {
            return new Vector3d(tileX, tileY, tileZ);
        }

        // DEVIATION: AS3 returns null once the projection leaves the furni's own footprint, and
        //   RoomTileCursorLogic.processUpdateMessage() discards a null update - so the highlight
        //   freezes on the last tile that resolved and the click sends nothing. Flash could afford
        //   that: a furni's art matched its footprint, so the miss was rare. It is not rare here.
        //   Instrumenting elegantp_c17_carpet gave loc=(13,5) size=2x3 local=(149,52)
        //   spriteOffset=(-96,-17) -> (15,5): an opaque pixel of the item's own art, one tile past
        //   a footprint of x 13..14. The art overhangs, and those pixels are visually bare floor.
        //
        //   The projection itself is exact - offsetX=-96 is precisely the origin tile's centre to
        //   the footprint's west corner (3 tiles x 32px), so the +scale/2 bias is right, and the
        //   centres of (13,5)/(14,5)/(13,6) each resolve to themselves. tileX/tileY therefore
        //   already name the tile under the pointer, in or out of the footprint.
        //
        //   Which way to answer depends on sizeZ, because that is the height the projection plane
        //   sits at. Flat (a rug): the plane IS the floor, the extrapolation is exact, so return
        //   the tile pointed at - clicking a rug's overhang walks you onto the floor there, as
        //   aimed. Raised: the plane is above the floor and the overhanging pixels are the item's
        //   own body, so extrapolating would send you past it; clamp into the footprint instead,
        //   which is what makes a tall item clickable when it has no tile of its own underneath.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::getActiveSurfaceLocation()
        if(sizeZ === 0)
        {
            return new Vector3d(tileX, tileY, tileZ);
        }

        return new Vector3d(
            Math.min(Math.max(tileX, locX), locX + sizeX - 1),
            Math.min(Math.max(tileY, locY), locY + sizeY - 1),
            tileZ
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::handleRoomObjectMouseDown()
    // ALT-only mouse-down (or, in decorate mode, a plain drag) on floor furniture starts a move,
    // dispatching REOE_REQUEST_MOVE → RoomDesktop.checkFurniManipulationRights → modifyRoomObject
    // OBJECT_MOVE (the ghost then follows the cursor and a click confirms via confirmObjectMove).
    // AS3 gates on `cat == 10 || cat == 20 || type == "monsterplant" || type == "rentable_bot"`
    // (_SafeCls_1821.as:1063) — note the last two are matched by *type*, not by category. Wall
    // furni (20) is still excluded here: confirmObjectMove has no wall-move composer to finish the
    // drag with, so starting one would only ever be undone.
    private handleRoomObjectMouseDown(event: RoomObjectMouseEvent): void
    {
        if(this._activeRoomId < 0 || this.isGameMode) return;

        const obj = event.object;

        if(!obj) return;

        // Only when nothing is already being placed/moved (AS3 "OBJECT_UNDEFINED" operation).
        const selectedObjectData = this._roomInstanceData.get(this._activeRoomId)?.selectedObjectData ?? null;

        if(selectedObjectData !== null) return;

        const category = this.findObjectCategory(this._activeRoomId, obj);
        const objType = obj.getType();

        if(category === null) return;

        // AS3: `_loc5_ == 10 || _loc5_ == 20 || _loc8_ == "monsterplant" || _loc8_ == "rentable_bot"`
        // (_SafeCls_1821.as:1063). Category 20 was missing here, so ALT-drag and decorate-drag never
        // started on a wall item however complete the rest of the move path was.
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE
            && category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL
            && objType !== 'monsterplant' && objType !== 'rentable_bot') return;

        const altOnly = event.altKey && !event.ctrlKey && !event.shiftKey;
        // AS3 decorateModeMove(): decorate mode + neither CTRL nor SHIFT held.
        const decorateMove = this.isDecorateMode && !event.ctrlKey && !event.shiftKey;

        if(altOnly || decorateMove)
        {
            this.events.emit(
                RoomEngineObjectEvent.REOE_REQUEST_MOVE,
                new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_REQUEST_MOVE, this._activeRoomId, obj.getId(), category)
            );
        }
    }

    /**
     * Resolves the category (FURNITURE/WALL/USER) a room object was created under.
     * Objects don't self-report a category, so this probes each category's manager
     * for the same object reference at this id.
     */
    private findObjectCategory(roomId: number, obj: IRoomObject): number | null 
    {
        const id = obj.getId();
        const candidates = [
            RoomObjectCategoryEnum.OBJECT_CATEGORY_FURNITURE,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_USER,
        ];

        for(const category of candidates) 
        {
            if(this.getRoomObject(roomId, id, category) === obj) 
            {
                return category;
            }
        }

        return null;
    }

    /**
     * Selects a room object and dispatches REOE_SELECTED, deselecting
     * whatever was previously selected in that room first.
     *
     * AS3: sources/win63_version/habbo/ui/RoomDesktop.as::roomObjectEventHandler()
     * ("REOE_SELECTED" case) is what ultimately consumes this on the UI side.
     */
    // AS3 declares this on IRoomEngine (public); the port had it private, which is why
    // no widget could highlight an object. Made public with the interface declaration.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::setSelectedObject()
    selectRoomObject(roomId: number, id: number, category: number): void
    {
        if(this._selectedObject && (this._selectedObject.id !== id || this._selectedObject.category !== category))
        {
            this.deselectRoomObject();
        }

        this._selectedObject = {roomId, id, category};

        // AS3 tells the object itself, not just the listeners: a furni draws its own selection
        // outline off this message, so emitting REOE_SELECTED alone left the highlight unpainted.
        // Avatars are excluded — their selection runs through setSelectedAvatar() instead.
        if(category !== RoomObjectCategoryEnum.OBJECT_CATEGORY_USER)
        {
            const object = this.getRoomObject(roomId, id, category) as IRoomObjectController | null;

            object?.getEventHandler()?.processUpdateMessage(new RoomObjectSelectedMessage(true));
        }

        this.events.emit(
            RoomEngineObjectEvent.REOE_SELECTED,
            new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_SELECTED, roomId, id, category)
        );
    }

    /**
     * AS3 splits this in two: `RoomEngine.selectAvatar()` delegates to the room-object event
     * handler's `setSelectedAvatar(roomId, objectId, true)`. That handler is flattened into
     * RoomEngine on this port (the same way `selectRoomObject()` above is), so the delegate's
     * body lives here rather than in a separate class.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::selectAvatar()
    selectAvatar(roomId: number, objectId: number): void
    {
        this.setSelectedAvatar(roomId, objectId, true);
    }

    /** TS-only (RPG F3b §7.3): the zone's usable objects (id → interaction), or null to leave the zone's rules. */
    setRpgInteractives(objects: ReadonlyMap<number, string> | null): void
    {
        this._rpgInteractives = objects;
    }

    /** TS-only (RPG F3b §7.3): moves the target circle to this avatar of the active room; 0 takes it away. */
    setRpgTarget(objectId: number): void
    {
        if(objectId === this._rpgTargetId) return;

        this.markRpgTarget(this._rpgTargetId, false);
        this._rpgTargetId = objectId;
        this.markRpgTarget(objectId, true);
    }

    private markRpgTarget(objectId: number, targeted: boolean): void
    {
        if(objectId === 0) return;

        const object = this.getRoomObject(this._activeRoomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

        object?.getEventHandler()?.processUpdateMessage(new RoomObjectAvatarTargetUpdateMessage(targeted));
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getSelectedAvatarId()
    getSelectedAvatarId(): number
    {
        return this._selectedAvatarId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1821.as::setSelectedAvatar()
    private setSelectedAvatar(roomId: number, objectId: number, select: boolean): void
    {
        const previous = this.getRoomObject(roomId, this._selectedAvatarId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

        if(previous && previous.getEventHandler())
        {
            previous.getEventHandler()?.processUpdateMessage(new RoomObjectAvatarSelectedMessage(false));
            this._selectedAvatarId = -1;
        }

        let selected = false;

        if(select)
        {
            const object = this.getRoomObject(roomId, objectId, RoomObjectCategoryEnum.OBJECT_CATEGORY_USER) as IRoomObjectController | null;

            if(object && object.getEventHandler())
            {
                object.getEventHandler()?.processUpdateMessage(new RoomObjectAvatarSelectedMessage(true));
                selected = true;
                this._selectedAvatarId = objectId;

                // AS3 skips the LookTo when a click-user wired trigger owns the click
                // (`roomEvents.hasClickUserWired()`). The RPG fork removed wired, which is the
                // same answer AS3 gets with no wired environment received: always look.
                const location = object.getLocation();

                this.connection?.send(new LookToMessageComposer(location.x, location.y));
            }
        }

        const arrow = this.getSelectionArrow(roomId);

        if(arrow && arrow.getEventHandler())
        {
            arrow.getEventHandler()?.processUpdateMessage(
                new RoomObjectVisibilityUpdateMessage(
                    (selected && !this.getActiveRoomIsPlayingGame())
                        ? RoomObjectVisibilityUpdateMessage.ENABLED
                        : RoomObjectVisibilityUpdateMessage.DISABLED
                )
            );
        }
    }

    /**
     * Deselects the currently selected room object (if any) and dispatches
     * REOE_DESELECTED.
     */
    private deselectRoomObject(): void
    {
        if(!this._selectedObject) return;

        const {roomId, id, category} = this._selectedObject;

        this._selectedObject = null;

        this.events.emit(
            RoomEngineObjectEvent.REOE_DESELECTED,
            new RoomEngineObjectEvent(RoomEngineObjectEvent.REOE_DESELECTED, roomId, id, category)
        );
    }

    /**
     * Create and add a visualization for a room object.
     * Uses the visualization factory for creating visualization instances.
     *
     * @see AS3 RoomManager.createRoomObject() visualization creation
     */
    private createVisualizationForObject(roomId: number, objectId: number, type: string): IRoomObjectSpriteVisualization | null 
    {
        const visualization = this._visualizationFactory.createRoomObjectVisualization(type);

        if(visualization === null) 
        {
            return null;
        }

        // Check if visualization is sprite-based
        const spriteVisualization = visualization as IRoomObjectSpriteVisualization;

        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            return null;
        }

        const object = room.getObject(objectId, this.getRoomObjectCategory(type));

        if(object) 
        {
            spriteVisualization.object = object;
        }

        // Initialize room visualization with texture data (rasterizers)
        if(type === RoomEngine.OBJECT_TYPE_ROOM && this._roomVisualizationData !== null) 
        {
            spriteVisualization.initialize(this._roomVisualizationData);
        }

        if(object) 
        {
            (object as IRoomObjectController).setVisualization(visualization);
            room.getRenderer()?.feedRoomObject(object);
        }

        return spriteVisualization;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateRoomCameras()
    private updateRoomCameras(time: number): void 
    {
        for(const [roomId, data] of this._roomInstanceData) 
        {
            const camera = data.roomCamera;
            const target = this.getRoomObject(roomId, camera.targetId, camera.targetCategory);

            if(target !== null) 
            {
                if(roomId !== this._activeRoomId || !this._roomDragging) 
                {
                    this.updateRoomCamera(roomId, 1, target.getLocation(), time);
                }
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateRoomCamera()
    private updateRoomCamera(roomId: number, canvasId: number, targetLocation: IVector3d, time: number): void 
    {
        const canvas = this._renderingCanvases.get(roomId * 1000 + canvasId);
        const data = this._roomInstanceData.get(roomId);
        const room = this.getRoomInstance(roomId);

        if(canvas === undefined || data === undefined || room === null || canvas.scale !== 1) 
        {
            return;
        }

        const geometry = canvas.geometry;
        const camera = data.roomCamera;
        const screenWidth = Math.round(canvas.width);
        const screenHeight = Math.round(canvas.height);
        const activeRoomBounds = this.getActiveRoomBoundingRectangle(canvasId);

        if(activeRoomBounds !== null &&
            (activeRoomBounds.right < 0 ||
                activeRoomBounds.bottom < 0 ||
                activeRoomBounds.left >= screenWidth ||
                activeRoomBounds.top >= screenHeight)) 
        {
            camera.reset();
        }

        if(camera.screenWd === screenWidth &&
            camera.screenHt === screenHeight &&
            camera.scale === geometry.scale &&
            camera.geometryUpdateId === geometry.updateId &&
            Vector3d.isEqual(targetLocation, camera.targetObjectLoc) &&
            !camera.isMoving) 
        {
            camera.limitedLocationX = false;
            camera.limitedLocationY = false;
            camera.centeredLocX = false;
            camera.centeredLocY = false;

            return;
        }

        camera.targetObjectLoc = targetLocation;

        const target = new Vector3d(
            Math.round(targetLocation.x),
            Math.round(targetLocation.y),
            Math.floor(targetLocation.z) + 1
        );

        const minX = room.getNumber(RoomVariableEnum.ROOM_MIN_X) - 0.5;
        const minY = room.getNumber(RoomVariableEnum.ROOM_MIN_Y) - 0.5;
        const maxX = room.getNumber(RoomVariableEnum.ROOM_MAX_X) + 0.5;
        const maxY = room.getNumber(RoomVariableEnum.ROOM_MAX_Y) + 0.5;

        if(!Number.isFinite(minX) ||
            !Number.isFinite(minY) ||
            !Number.isFinite(maxX) ||
            !Number.isFinite(maxY))
        {
            return;
        }

        if(activeRoomBounds === null)
        {
            // AS3 (_SafeCls_90.as:1155-1158): with no active bounds yet, nudge the
            // geometry toward the origin and bail. A bare return leaves the camera
            // wherever it was, so the first framing inherits the previous room's
            // residual position instead of a defined origin.
            geometry.adjustLocation(new Vector3d(0, 0), 25);

            return;
        }

        const centerX = Math.round((minX + maxX) / 2);
        const centerY = Math.round((minY + maxY) / 2);
        let cameraZ = target.z;
        let localX = target.x - centerX;
        let localY = target.y - centerY;
        const xScale = geometry.scale / Math.sqrt(2);
        const yScale = xScale / 2;
        const angle = -((geometry.direction.x + 90) / 180) * Math.PI;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedX = localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;

        localX = rotatedX;
        localY = rotatedY * (yScale / xScale);

        const maxScreenX = screenWidth / 2 / xScale - 1;
        const maxScreenY = screenHeight / 2 / yScale - 1;
        // AS3 (_SafeCls_90.as:1134,1148): the room-centre screen anchor uses the
        // constant z = 2 (_loc19_), NOT the target's floor(z)+1 (_loc46_ / cameraZ,
        // which is reserved for the target location below). The port had fused the two.
        const centerScreen = geometry.getScreenPoint(new Vector3d(centerX, centerY, 2));

        if(centerScreen === null) 
        {
            return;
        }

        centerScreen.x += Math.round(screenWidth / 2);
        centerScreen.y += Math.round(screenHeight / 2);

        const bounds = {
            left: activeRoomBounds.left - canvas.screenOffsetX,
            top: activeRoomBounds.top - canvas.screenOffsetY,
            right: activeRoomBounds.right - canvas.screenOffsetX,
            bottom: activeRoomBounds.bottom - canvas.screenOffsetY,
            width: activeRoomBounds.width,
            height: activeRoomBounds.height
        };

        if(!(bounds.width > 1 && bounds.height > 1)) 
        {
            geometry.adjustLocation(new Vector3d(-30, -30), 25);

            return;
        }

        const boundLeft = (bounds.left - centerScreen.x - geometry.scale * 0.25) / xScale;
        const boundRight = (bounds.right - centerScreen.x + geometry.scale * 0.25) / xScale;
        const boundTop = (bounds.top - centerScreen.y - geometry.scale * 0.5) / yScale;
        const boundBottom = (bounds.bottom - centerScreen.y + geometry.scale * 0.5) / yScale;
        let limitedLocationX = false;
        let limitedLocationY = false;
        let centeredLocX = false;
        let centeredLocY = false;
        const roomScreenWidth = Math.round((boundRight - boundLeft) * xScale);

        if(roomScreenWidth < screenWidth) 
        {
            cameraZ = 2;
            localX = (boundRight + boundLeft) / 2;
            centeredLocX = true;
        }
        else 
        {
            if(localX > boundRight - maxScreenX) 
            {
                localX = boundRight - maxScreenX;
                limitedLocationX = true;
            }

            if(localX < boundLeft + maxScreenX) 
            {
                localX = boundLeft + maxScreenX;
                limitedLocationX = true;
            }
        }

        const roomScreenHeight = Math.round((boundBottom - boundTop) * yScale);

        if(roomScreenHeight < screenHeight) 
        {
            cameraZ = 2;
            localY = (boundBottom + boundTop) / 2;
            centeredLocY = true;
        }
        else 
        {
            if(localY > boundBottom - maxScreenY) 
            {
                localY = boundBottom - maxScreenY;
                limitedLocationY = true;
            }

            if(localY < boundTop + maxScreenY) 
            {
                localY = boundTop + maxScreenY;
                limitedLocationY = true;
            }

            if(limitedLocationY) 
            {
                localY /= yScale / xScale;
            }
        }

        const invX = localX * cos + localY * sin;
        const invY = -localX * sin + localY * cos;
        const desiredLocation = new Vector3d(
            Math.round((invX + centerX) * 2) / 2,
            Math.round((invY + centerY) * 2) / 2,
            cameraZ
        );

        let topMargin = 0.35;
        let bottomMargin = 0.2;
        let sideMargin = 0.2;
        const minViewWidth = 10;
        const minViewHeight = 10;

        if(sideMargin * screenWidth > 100) 
        {
            sideMargin = 100 / screenWidth;
        }

        if(topMargin * screenHeight > 150) 
        {
            topMargin = 150 / screenHeight;
        }

        if(bottomMargin * screenHeight > 150) 
        {
            bottomMargin = 150 / screenHeight;
        }

        if(camera.limitedLocationX && camera.screenWd === screenWidth && camera.screenHt === screenHeight) 
        {
            sideMargin = 0;
        }

        if(camera.limitedLocationY && camera.screenWd === screenWidth && camera.screenHt === screenHeight) 
        {
            topMargin = 0;
            bottomMargin = 0;
        }

        let viewWidth = screenWidth * (1 - sideMargin * 2);
        let viewHeight = screenHeight * (1 - (topMargin + bottomMargin));

        if(viewWidth < minViewWidth) 
        {
            viewWidth = minViewWidth;
        }

        if(viewHeight < minViewHeight) 
        {
            viewHeight = minViewHeight;
        }

        const viewLeft = -viewWidth / 2;
        const viewTop = topMargin + bottomMargin > 0 ? -viewHeight * (bottomMargin / (topMargin + bottomMargin)) : -viewHeight / 2;
        const viewRight = viewLeft + viewWidth;
        const viewBottom = viewTop + viewHeight;
        // AS3 (_SafeCls_90.as:1266,1273): the target's screen point is taken with the
        // raw z (_loc6_.z is still param3.z here); _loc6_.z is only overwritten with
        // floor(z)+1 afterwards. target.z already holds floor(z)+1, so pass the raw z.
        const targetScreen = geometry.getScreenPoint(new Vector3d(target.x, target.y, targetLocation.z));

        if(targetScreen === null) 
        {
            return;
        }

        targetScreen.x += canvas.screenOffsetX;
        targetScreen.y += canvas.screenOffsetY;

        if(camera.location === null)
        {
            // AS3 (_SafeCls_90.as:1278): the first framing snaps the geometry straight
            // to desiredLocation (`location = _loc6_`), no z-offset. adjustLocation(…, 0)
            // sets it directly (offset = -0 * unitZ = 0); the previous `, 25` shifted the
            // start point 25 along z, so the camera visibly travelled in on every entry.
            geometry.adjustLocation(desiredLocation, 0);

            if(this.useOffsetScrolling)
            {
                camera.initializeLocation(new Vector3d(0, 0, 0));
            }
            else 
            {
                camera.initializeLocation(desiredLocation);
            }
        }

        const desiredScreen = geometry.getScreenPoint(desiredLocation);

        if(desiredScreen !== null) 
        {
            const roomSizeChanged = camera.roomWd !== activeRoomBounds.width ||
                camera.roomHt !== activeRoomBounds.height ||
                camera.screenWd !== screenWidth ||
                camera.screenHt !== screenHeight;
            const shouldMove = (((targetScreen.x < viewLeft || targetScreen.x > viewRight) && !camera.centeredLocX) ||
                ((targetScreen.y < viewTop || targetScreen.y > viewBottom) && !camera.centeredLocY) ||
                (centeredLocX && !camera.centeredLocX && camera.screenWd !== screenWidth) ||
                (centeredLocY && !camera.centeredLocY && camera.screenHt !== screenHeight) ||
                roomSizeChanged);

            if(shouldMove) 
            {
                camera.limitedLocationX = limitedLocationX;
                camera.limitedLocationY = limitedLocationY;
                camera.target = this.useOffsetScrolling ? new Vector3d(desiredScreen.x, desiredScreen.y, 0) : desiredLocation;
            }
            else 
            {
                if(!limitedLocationX) 
                {
                    camera.limitedLocationX = false;
                }

                if(!limitedLocationY) 
                {
                    camera.limitedLocationY = false;
                }
            }
        }

        camera.centeredLocX = centeredLocX;
        camera.centeredLocY = centeredLocY;
        camera.screenWd = screenWidth;
        camera.screenHt = screenHeight;
        camera.scale = geometry.scale;
        camera.geometryUpdateId = geometry.updateId;
        camera.roomWd = activeRoomBounds.width;
        camera.roomHt = activeRoomBounds.height;

        if(!(this._sessionDataManager?.isRoomCameraFollowDisabled ?? false)) 
        {
            camera.update(time, this.useOffsetScrolling ? 8 : 0.5);
        }

        const location = camera.location;

        if(location === null) 
        {
            return;
        }

        if(this.useOffsetScrolling) 
        {
            canvas.screenOffsetX = -location.x;
            canvas.screenOffsetY = -location.y;
        }
        else 
        {
            geometry.adjustLocation(location, 25);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getActiveRoomBoundingRectangle()
    private getActiveRoomBoundingRectangle(canvasId: number): IRoomEngineRectangle | null 
    {
        return this.getRoomObjectBoundingRectangle(
            this._activeRoomId,
            RoomEngine.OBJECT_ID_ROOM,
            RoomObjectCategoryEnum.OBJECT_CATEGORY_ROOM,
            canvasId
        );
    }

    /**
     * Configuration has finished loading - set up the content loader and room manager,
     * then re-derive everything else that reads configuration.
     *
     * AS3's own dependency setter for IID_HabboConfigurationManager is `null` (does nothing
     * synchronously at resolution time); this whole method is what its 'complete' listener calls.
     *
     * @see AS3 sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::onConfigurationComplete() lines 458-485
     */
    private onConfigurationComplete(): void
    {
        if(!this.assets || !this._configurationManager)
        {
            return;
        }

        // AS3 opens this method by tearing the previous loader down —
        // `if(_roomContentLoader){ _roomContentLoader.dispose(); events.removeEventListener(
        // "RCL_LOADER_READY", onContentLoaderReady); }` (_SafeCls_90.as l.460-464) — because
        // configuration can complete more than once and it rebuilds from scratch each time. It can
        // afford that: its loader owns an AssetLibraryCollection per content type, so disposing it
        // takes the registered assets with it.
        //
        // This port registers every content type into the one shared `assets` library, which
        // outlives the loader. Rebuilding here therefore does not start from scratch: the loader
        // goes back to STATE_INITIALIZING while its six place-holder loads are still in flight, and
        // RoomManager re-requests types whose names the shared library already holds — which is
        // AssetLibrary's "Asset with name room already exists", escalated by onContentLoadError()
        // into the crash that left rooms with no walls, no tile cursor and no way to walk.
        //
        // A second completion carries nothing new for the loader either: every property read below
        // comes from the same configuration. So the first initialisation stands.
        if(this._contentLoaderInitialized) return;

        // TS-only: the room content's .ambreia directories (features/asset-packs). Checked before the
        // flag so a later completion retries when they were missing.
        const directories = this._directories();

        if(directories === null)
        {
            log.error('No .ambreia directories (asset-packs): the room content cannot load');

            return;
        }

        this._contentLoaderInitialized = true;

        // AS3: _roomContentLoader.visualizationFactory = _visualizationFactory
        this._contentLoader.visualizationFactory = this._visualizationFactory;

        // AS3: var_1634.initialize(events, this)
        this._contentLoader.initialize(this.events, this._configurationManager, directories);

        if(this._sessionDataManager)
        {
            this._contentLoader.furniDataSource = this._sessionDataManager;
        }

        // AS3: _roomManager categories and content loader are set here; initialize() waits for RCL_LOADER_READY.
        if(this._roomManager)
        {
            this._roomManager.addObjectUpdateCategory(10);
            this._roomManager.addObjectUpdateCategory(20);
            this._roomManager.addObjectUpdateCategory(100);
            this._roomManager.addObjectUpdateCategory(200);
            this._roomManager.addObjectUpdateCategory(0);
            this._roomManager.setContentLoader(this._contentLoader);
        }

        this.events.off(RoomContentLoader.CONTENT_LOADER_READY, this._boundOnContentLoaderReady);
        this.events.on(RoomContentLoader.CONTENT_LOADER_READY, this._boundOnContentLoaderReady);

        // AS3: _roomDraggingAlwaysCenters = getBoolean("room.dragging.always_center");
        this._roomDraggingAlwaysCenters = this._configurationManager.getBoolean('room.dragging.always_center');

        // TS-only: not part of AS3's onConfigurationComplete() (its two real AS3 call sites are
        // onToolbarClicked()'s MEMENU case and setOwnUserId(), both unrelated to configuration).
        // cameraFollowDuration itself reads config ("room.camera.follow_user"), so any room camera
        // created via getRoomInstanceData() before configuration finished loading would have locked
        // in the wrong (default) follow duration - this retroactively re-applies the real value to
        // every room created so far, a gap that can't exist in AS3 since configuration is always
        // already available before any room is created there.
        for(const data of this._roomInstanceData.values())
        {
            data.roomCamera.activateFollowing(this.cameraFollowDuration);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::onContentLoaderReady()
    private onContentLoaderReady(): void 
    {
        if(this._roomManager === null) 
        {
            return;
        }

        this._roomManager.initialize(null, this);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getFurnitureColorIndex()
    private getFurnitureColorIndex(typeId: number): number 
    {
        if(this._contentLoader != null) return this._contentLoader.getActiveObjectColorIndex(typeId);

        return 0;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getWallItemColorIndex()
    private getWallItemColorIndex(typeId: number): number 
    {
        if(this._contentLoader != null) return this._contentLoader.getWallItemColorIndex(typeId);

        return 0;
    }

    /**
     * Get furniture className from typeId.
     * Uses RoomContentLoader's typeId→className mapping (populated by setActiveObjectType/setWallItemType).
     *
     * @see AS3 RoomContentLoader var_2179
     * @param typeId The furniture type ID
     * @param category The object category (furniture or wall)
     * @returns The className string
     */
    private getFurnitureClassName(typeId: number, category: number): string 
    {
        // First try the content loader's typeId→className map
        const className = this._contentLoader.getClassName(typeId, category);

        if(className) 
        {
            return className;
        }

        // Fallback to SessionDataManager
        if(this._sessionDataManager) 
        {
            let furniData;

            if(category === RoomObjectCategoryEnum.OBJECT_CATEGORY_WALL) 
            {
                furniData = this._sessionDataManager.getWallItemData(typeId);
            }
            else 
            {
                furniData = this._sessionDataManager.getFloorItemData(typeId);
            }

            if(furniData) 
            {
                return furniData.className;
            }
        }

        log.warn(`Unknown furniture typeId: ${typeId}, category: ${category}`);

        return `type_${typeId}`;
    }

    /**
     * Start loading furniture content and track pending visualization requests.
     */
    private loadFurnitureContent(roomId: number, objectId: number, className: string, category: number): void
    {
        // isLoaded() alone can lie: purge() frees a content type's GraphicAssetCollection to
        // reclaim GPU memory without clearing this flag (matches RoomManager.ts::isContentAvailable()/
        // createRoomObject(), which both pair the two for the same reason - see their comments).
        if(this._contentLoader.isLoaded(className) && this._contentLoader.getGraphicAssetCollection(className) !== null)
        {
            // Already loaded - create visualization immediately
            this.createVisualizationForFurniture(roomId, objectId, className, category);
            return;
        }

        // Track this object as pending for when content loads
        let pending = this._pendingFurnitureViz.get(className);

        if(!pending) 
        {
            pending = [];
            this._pendingFurnitureViz.set(className, pending);
        }

        pending.push({roomId, objectId, category});

        // Start loading
        this._contentLoader.loadObjectContent(className, this._contentLoaderEvents);
    }

    /**
     * Called when a furniture content bundle has finished loading.
     *
     * Furniture/tile-cursor content is requested via loadFurnitureContent(), which
     * always uses _contentLoaderEvents — the "room" type is never loaded through
     * this path (it's preloaded by RoomManager and reported via contentLoaded()).
     */
    private onContentLoaded(type: string): void 
    {
        // Create visualizations for all pending objects of this type
        const pending = this._pendingFurnitureViz.get(type);

        if(pending) 
        {
            for(const entry of pending) 
            {
                this.createVisualizationForFurniture(entry.roomId, entry.objectId, type, entry.category);
            }

            this._pendingFurnitureViz.delete(type);
        }
    }

    /**
     * Create a visualization for a furniture item using loaded content.
     * Uses the visualization factory for creating instances and caching viz data.
     *
     * @param roomId The room ID
     * @param objectId The object ID
     * @param className The furniture className
     * @param category The object category
     *
     * @see AS3 RoomManager.createRoomObject() lines 335-356
     */
    private createVisualizationForFurniture(roomId: number, objectId: number, className: string, category: number): void 
    {
        const room = this.getRoomInstance(roomId);

        if(!room) 
        {
            log.warn(`[createVisualizationForFurniture] No room instance for roomId=${roomId} (className=${className})`);

            return;
        }

        const object = room.getObject(objectId, category);

        if(!object) 
        {
            log.warn(`[createVisualizationForFurniture] No room object for objectId=${objectId} category=${category} (className=${className})`);

            return;
        }

        // Get visualization type from content loader.
        const vizType = this._contentLoader.getVisualizationType(className);

        if(!vizType) 
        {
            log.warn(`[createVisualizationForFurniture] getVisualizationType() returned null for className=${className}`);

            return;
        }

        // Create visualization instance from visualization factory
        const visualization = this._visualizationFactory.createRoomObjectVisualization(vizType);

        if(!visualization) 
        {
            log.warn(`[createVisualizationForFurniture] Factory returned null for vizType=${vizType}`);
            return;
        }

        const spriteVisualization = visualization as IRoomObjectSpriteVisualization;

        // Set asset collection from content loader
        const assetCollection = this._contentLoader.getGraphicAssetCollection(className);

        if(assetCollection) 
        {
            spriteVisualization.assetCollection = assetCollection;
        }
        else 
        {
            log.warn(`[createVisualizationForFurniture] getGraphicAssetCollection() returned null for className=${className} - object will render without graphics`);
        }

        // Get or create visualization data via the visualization factory (cached)
        const rawVizData = this._contentLoader.getVisualizationXML(className);

        if(rawVizData) 
        {
            const vizData = this._visualizationFactory.getRoomObjectVisualizationData(className, vizType, rawVizData);

            if(vizData) 
            {
                spriteVisualization.initialize(vizData);
            }
            else 
            {
                log.warn(`[createVisualizationForFurniture] getRoomObjectVisualizationData() returned null for className=${className} vizType=${vizType} - visualization not initialized`);
            }
        }
        else 
        {
            log.warn(`[createVisualizationForFurniture] getVisualizationXML() returned null for className=${className} - visualization not initialized`);
        }

        // Assign the room object
        spriteVisualization.object = object;
        (object as IRoomObjectController).setVisualization(visualization);
        room.getRenderer()?.feedRoomObject(object);
    }
}
