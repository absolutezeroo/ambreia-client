/**
 * IRoomEngine Interface
 *
 * Based on AS3: com.sulake.habbo.room.IRoomEngine
 *
 * Main interface for the Habbo room engine.
 */
import type {Container, Ticker} from 'pixi.js';
import type {EventEmitter} from 'eventemitter3';
import type {IDisposable} from '@core/runtime/IDisposable';
import type {IRoomInstance} from '@room/IRoomInstance';
import type {IRoomGeometry} from '@room/utils/IRoomGeometry';
import type {IRoomObject} from '@room/object/IRoomObject';
import type {IVector3d} from '@room/utils/IVector3d';
import type {IStuffData} from './object/data/IStuffData';
import type {PetColorResult} from './PetColorResult';
import type {IGetImageListener} from './IGetImageListener';
import type {ImageResult} from './ImageResult';
import type {ISelectedRoomObjectData} from './ISelectedRoomObjectData';
import type {SelectedRoomObjectData} from './utils/SelectedRoomObjectData';
import type {VariableFxConfigUpdateData} from './object/variablefx/VariableFxConfigUpdateData';
import type {VariableFxStatusUpdateData} from './object/variablefx/VariableFxStatusUpdateData';
import type {VariableFxStatusRemoveData} from './object/variablefx/VariableFxStatusRemoveData';
import type {IRoomAreaSelectionManager} from './IRoomAreaSelectionManager';
import type {RoomPlaneParser} from './object/RoomPlaneParser';
import type {IRoomEngineRectangle} from './RoomEngine';
import type {RenderRoomMessageComposer} from '@habbo/communication/messages/outgoing/camera/RenderRoomMessageComposer';

export interface IRoomEngine extends IDisposable {
    // Event emitter
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::get events()
    readonly events: EventEmitter;
    /**
     * The currently active room ID.
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::get activeRoomId()
    readonly activeRoomId: number;
    /**
     * Whether the active room session has the local user in decorate (furni move) mode.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::get isDecorateMode()
    readonly isDecorateMode: boolean;
    /**
     * Whether the room is currently in game mode.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::set isGameMode()
    isGameMode: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::get activeRoomHasHanditemControlBlocked()
    readonly activeRoomHasHanditemControlBlocked: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::get activeRoomHasChooserDisabled()
    readonly activeRoomHasChooserDisabled: boolean;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::get activeRoomHasFreeFurniMovementsMode()
    readonly activeRoomHasFreeFurniMovementsMode: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::rotateActiveObjectPreview()
    rotateActiveObjectPreview(roomId: number, forward: boolean): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::get areaSelectionManager()
    readonly areaSelectionManager: IRoomAreaSelectionManager;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getFurnitureType()
    getFurnitureType(type: number): string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getFurnitureTypeId()
    getFurnitureTypeId(type: string): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getWallItemType()
    getWallItemType(type: number, param?: string | null): string | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::getFurnitureIcon()
    getFurnitureIcon(type: number, listener: IGetImageListener, param?: string | null, stuffData?: unknown): ImageResult;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getFurnitureIconUrl()
    getFurnitureIconUrl(type: number): string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::selectRoomObject()
    selectRoomObject(roomId: number, id: number, category: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::selectAvatar()
    selectAvatar(roomId: number, objectId: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getSelectedAvatarId()
    getSelectedAvatarId(): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getActiveRoomIsPlayingGame()
    getActiveRoomIsPlayingGame(): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::showUseProductSelection()
    showUseProductSelection(inventoryStripId: number, furnitureTypeId: number, objectId?: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getRoomObjectCount()
    getRoomObjectCount(roomId: number, category: number): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getRoomObjectWithIndex()
    getRoomObjectWithIndex(roomId: number, index: number, category: number): IRoomObject | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::changeObjectModelData()
    changeObjectModelData(roomId: number, objectId: number, category: number, key: string, value: number): boolean;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::getWallItemIcon()
    getWallItemIcon(type: number, listener: IGetImageListener, param?: string | null): ImageResult;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getWallItemIconUrl()
    getWallItemIconUrl(type: number, param?: string | null): string | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getFurnitureImage()
    getFurnitureImage(
        type: number,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener,
        backgroundColor?: number,
        param?: string | null,
        state?: number,
        frameCount?: number,
        stuffData?: unknown,
        forceGeneric?: boolean
    ): ImageResult;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getWallItemImage()
    getWallItemImage(
        type: number,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener,
        backgroundColor?: number,
        param?: string | null,
        state?: number,
        frameCount?: number
    ): ImageResult;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomImage()
    getRoomImage(
        floorType: string | null,
        wallType: string | null,
        landscapeType: string | null,
        scale: number,
        listener: IGetImageListener,
        extra?: string | null
    ): ImageResult;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetImage()
    getPetImage(
        type: number,
        paletteId: number,
        color: number,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener | null,
        fullImage?: boolean,
        backgroundColor?: number,
        customParts?: { layerId: number; partId: number; paletteId: number }[] | null,
        posture?: string | null
    ): ImageResult;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetColor()
    getPetColor(typeId: number, colorId: number): PetColorResult | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetColorsByTag()
    getPetColorsByTag(typeId: number, tag: string): PetColorResult[] | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetLayerIdForTag()
    getPetLayerIdForTag(typeId: number, tag: string): number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getPetDefaultPalette()
    getPetDefaultPalette(typeId: number, tag: string): PetColorResult | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomObjectImage()
    getRoomObjectImage(
        roomId: number,
        objectId: number,
        category: number,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener,
        backgroundColor?: number
    ): ImageResult;

    // `forceImmediate` is TS-only (no AS3 equivalent) - see RoomEngine.ts's implementation comment.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getGenericRoomObjectImage()
    getGenericRoomObjectImage(
        type: string | null,
        param: string,
        direction: IVector3d,
        scale: number,
        listener: IGetImageListener | null,
        backgroundColor?: number,
        extra?: string | null,
        stuffData?: unknown,
        state?: number,
        frameCount?: number,
        posture?: string | null,
        originalId?: number,
        forceImmediate?: boolean
    ): ImageResult;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::isRoomObjectContentAvailable()
    isRoomObjectContentAvailable(type: string): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::initializeRoomObjectInsert()
    initializeRoomObjectInsert(
        source: string,
        itemId: number,
        category: number,
        type: number,
        extra: string,
        stuffData?: unknown,
        state?: number,
        animFrame?: number,
        posture?: string | null,
        // AS3's last argument: place repeatedly. The inventory passes true so one stack can be laid
        // out without reopening it between items; the catalog and the infostand leave it false.
        repeatedPlacement?: boolean
    ): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::cancelRoomObjectInsert()
    cancelRoomObjectInsert(): void;

    // CatalogObjectMover, RecyclerCatalogWidget) already null-check before use.
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::getSelectedObjectData()
    getSelectedObjectData(roomId: number): ISelectedRoomObjectData | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::setObjectMoverIconSpriteVisible()
    setObjectMoverIconSpriteVisible(visible: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getObjectMoverIconSpriteVisible()
    getObjectMoverIconSpriteVisible(): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::initializeRoom()
    initializeRoom(
        roomId: number,
        planeParser: RoomPlaneParser | null,
        doorX?: number,
        doorY?: number,
        doorZ?: number,
        doorDir?: number,
        cameraInitPosition?: IVector3d | null
    ): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::disposeObjectFurniture()
    disposeObjectFurniture(roomId: number, id: number, pickerId?: number, refresh?: boolean): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::disposeObjectWallItem()
    disposeObjectWallItem(roomId: number, id: number, pickerId?: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::disposeObjectUser()
    disposeObjectUser(roomId: number, roomIndex: number): boolean;

    // TS-only: see RoomEngine.ts for why this exists.
    setTicker(ticker: Ticker): void;

    // TS-only: see RoomEngine.ts for why this exists.
    registerCanvasSyncCallback(callback: () => void): void;

    // TS-only: see RoomEngine.ts for why this exists.
    unregisterCanvasSyncCallback(callback: () => void): void;

    // Room lifecycle
    createRoomInstance(roomId: number): IRoomInstance | null;

    disposeRoomInstance(roomId: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::purgeRoomContent()
    purgeRoomContent(): void;

    getRoomInstance(roomId: number): IRoomInstance | null;

    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::setActiveRoom()
    setActiveRoom(roomId: number): void;

    getActiveRoomId(): number;

    // Object management
    addRoomObjectUser(roomId: number, id: number, location: IVector3d, direction: IVector3d, type: string): boolean;

    /**
     * Adds a user-category object **and gives it its figure**.
     *
     * `addRoomObjectUser()` above is the low level: its `type` is the object type — `user`, `pet`,
     * a pet's real content type — which decides the logic and visualization, and it has no figure
     * argument at all. Passing a figure string there creates an object of a type that resolves to
     * nothing, which is how the avatar-editor preview came up empty.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::addObjectUser()
    addObjectUser(
        roomId: number,
        roomIndex: number,
        location: IVector3d,
        direction: IVector3d,
        headDirection: number,
        userType: number,
        figure: string
    ): boolean;

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
        synchronize?: boolean,
        data?: IStuffData | null
    ): boolean;

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
        ownerName: string | null
    ): boolean;

    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::isMoveBlocked()
    isMoveBlocked(): boolean;

    /**
	 * Blocks avatar movement while a drag owns the pointer — set by the area selector for the length
	 * of a selection, so dragging a rectangle does not also walk the avatar.
	 */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::setMoveBlocked()
    setMoveBlocked(blocked: boolean): void;

    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::getRoomObject()
    getRoomObject(roomId: number, objectId: number, category: number): IRoomObject | null;

    disposeRoomObject(roomId: number, objectId: number, category: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::modifyRoomObject()
    modifyRoomObject(objectId: number, category: number, action: string): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::useRoomObjectInActiveRoom()
    useRoomObjectInActiveRoom(objectId: number, category: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::modifyRoomObjectDataWithMap()
    modifyRoomObjectDataWithMap(objectId: number, category: number, action: string, data: Map<string, string>): boolean;

    /**
     * Wall items only (category 20) — anything else returns false without touching the wire.
     * Backs the sticky note's save path.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::modifyRoomObjectData()
    modifyRoomObjectData(objectId: number, category: number, colorHex: string, text: string): boolean;

    /**
     * Wall items only (category 20), same as modifyRoomObjectData(). Backs the sticky note's
     * delete path.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::deleteRoomObject()
    deleteRoomObject(objectId: number, category: number): boolean;

    /**
     * Every object of one category in the **active** room — no room id, AS3 resolves it from
     * `activeRoomId` itself. Backs the external-image widget's next/previous browsing.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::getObjectsByCategory()
    getObjectsByCategory(category: number): IRoomObject[];

    // User updates
    updateRoomObjectUser(
        roomId: number,
        objectId: number,
        location: IVector3d | null,
        targetLocation: IVector3d | null,
        direction: IVector3d | null,
        headDirection: number,
        canStandUp: boolean,
        baseY: number,
        animationTime?: number,
        skipPositionUpdate?: boolean
    ): boolean;

    updateRoomObjectUserFigure(
        roomId: number,
        objectId: number,
        figure: string,
        gender: string | null,
        clubLevel: string | null,
        isRiding: boolean
    ): boolean;

    updateRoomObjectUserPosture(roomId: number, objectId: number, posture: string, parameter: string): boolean;

    updateRoomObjectUserGesture(roomId: number, objectId: number, gesture: number): boolean;

    updateRoomObjectUserEffect(roomId: number, objectId: number, effect: number, delay?: number): boolean;

    updateRoomObjectUserChat(roomId: number, objectId: number, numberOfWords: number): boolean;

    updateRoomObjectUserTyping(roomId: number, objectId: number, isTyping: boolean): boolean;

    updateRoomObjectUserDance(roomId: number, objectId: number, danceStyle: number): boolean;

    updateRoomObjectUserSleep(roomId: number, objectId: number, isSleeping: boolean): boolean;

    updateRoomObjectUserCarryObject(roomId: number, objectId: number, itemType: number): boolean;

    updateRoomObjectUserSign(roomId: number, objectId: number, signType: number): boolean;

    setRoomObjectUserOwnUser(roomId: number, objectId: number): boolean;

    // Rendering
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::update()
    update(time: number): void;

    initializeRoomVisuals(roomId: number, floorType: string, wallType: string, landscapeType: string, worldType: number): void;

    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::updateObjectRoom()
    updateObjectRoom(roomId: number, floorType?: string | null, wallType?: string | null, landscapeType?: string | null, skipModelUpdate?: boolean): boolean;

    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::updateObjectRoomVisibilities()
    updateObjectRoomVisibilities(roomId: number, wallsVisible: boolean, floorVisible?: boolean): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomStringValue()
    getRoomStringValue(roomId: number, key: string): string | null;

    /**
	 * Room mouse events below this screen Y are swallowed. 0 disables the threshold.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::get mouseEventsDisabledAboveY()
    mouseEventsDisabledAboveY: number;

    /**
	 * Room mouse events left of this screen X are swallowed. 0 disables the threshold.
	 *
	 * `HabboFreeFlowChat` sets it to the width of the chat history column.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::get mouseEventsDisabledLeftToX()
    mouseEventsDisabledLeftToX: number;

    /**
	 * Registers a named screen rectangle that swallows room mouse events. An empty
	 * rectangle removes it, so a caller can keep calling this as its window moves.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::setMouseEventsDisabledRect()
    setMouseEventsDisabledRect(name: string, rect: {x: number; y: number; width: number; height: number} | null): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::removeMouseEventsDisabledRect()
    removeMouseEventsDisabledRect(name: string): void;

    /**
	 * Registers or drops one owner's request to click through users / furniture.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::setTileCursorState()
    setTileCursorState(roomId: number, state: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::toggleTileCursorVisibility()
    toggleTileCursorVisibility(roomId: number, visible: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::addFloorHole()
    addFloorHole(roomId: number, objectId: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::removeFloorHole()
    removeFloorHole(roomId: number, objectId: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::requestBadgeImageAsset()
    requestBadgeImageAsset(roomId: number, objectId: number, category: number, badgeId: string, groupBadge?: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::requestFurniIconAsset()
    requestFurniIconAsset(
        roomId: number,
        objectId: number,
        category: number,
        wallItem: boolean,
        typeId: number,
        extra: string
    ): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::createScreenShot()
    createScreenShot(roomId: number, canvasId: number, name: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::setPlacedObjectData()
    setPlacedObjectData(roomId: number, data: SelectedRoomObjectData | null): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::getPlacedObjectData()
    getPlacedObjectData(roomId: number): ISelectedRoomObjectData | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::requestMouseCursor()
    requestMouseCursor(type: string, objectId: number, objectType: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::get playerUnderCursor()
    readonly playerUnderCursor: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::setClickSettings()
    setClickSettings(owner: string, throughUsers: boolean, throughFurni: boolean): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::get clickThroughUsers()
    readonly clickThroughUsers: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_87.as::get clickThroughFurni()
    readonly clickThroughFurni: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::get isInitialized()
    readonly isInitialized: boolean;

    /**
     * The engine's own config reader, inherited from Component. AS3 gets at it by casting the
     * engine back to its concrete Component type (`(_roomEngine as _SafeCls_50).getBoolean(...)`),
     * which a TS interface cannot express — declaring it here is the same access, without the cast.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/core/runtime/_SafeCls_50.as::getBoolean()
    getBoolean(key: string): boolean;

    /**
     * Fires a client link event ("wiredmenu/open/inspection/0/123", …). Same story as `getBoolean`
     * above: AS3 reaches it as `(roomEngine as _SafeCls_50).context.createLinkEvent(link)`, casting
     * the engine back to its Component base to get at the context.
     */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/runtime/IContext.as::createLinkEvent()
    createLinkEvent(link: string): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::runUpdate()
    runUpdate(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::set disableUpdate()
    disableUpdate: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::changeObjectState()
    changeObjectState(roomId: number, objectId: number, category: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectUserAction()
    updateObjectUserAction(roomId: number, roomIndex: number, action: string, value: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectWallItemLocation()
    updateObjectWallItemLocation(
        roomId: number,
        id: number,
        location: IVector3d,
        target?: IVector3d | null,
        animationTime?: number
    ): boolean;

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
        refresh: boolean,
        sizeZ: number
    ): boolean;

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
    ): boolean;

    // Canvas management

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_90.as::updateObjectRoomPlaneThicknesses()
    updateObjectRoomPlaneThicknesses(roomId: number, wallThicknessMultiplier: number, floorThicknessMultiplier: number): boolean;

    // Room data
    getRoomOwnObjectId(roomId: number): number;

    setRoomOwnObjectId(roomId: number, objectId: number): void;

    /**
     * Creates a rendering canvas for a room.
     *
     * @returns The PixiJS Container for the canvas, or null on failure
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::createRoomCanvas()
    createRoomCanvas(roomId: number, canvasId: number, width: number, height: number, scale: number): Container | null;

    /**
     * Modifies the dimensions of an existing room canvas.
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::modifyRoomCanvas()
    modifyRoomCanvas(roomId: number, canvasId: number, width: number, height: number): boolean;

    /**
     * Releases a rendering canvas: detaches its container from whatever holds it
     * and frees the renderer's resources.
     *
     * TS-only — AS3's IRoomEngine has no counterpart because Flash's display list
     * did this for free: a preview canvas was a DisplayObject child of the widget's
     * own window, so disposing the window took the canvas with it. Here
     * `createRoomCanvas()` parents it onto the shared root PixiJS stage instead
     * (see RoomEngine.createRoomCanvas), where nothing owns it — so every owner of
     * a canvas has to hand it back explicitly.
     */
    disposeRenderingCanvas(roomId: number, canvasId?: number): void;

    /**
     * AS3: sources/win63_version/habbo/room/IRoomEngine.as::setRoomCanvasMask()
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::setRoomCanvasMask()
    setRoomCanvasMask(roomId: number, canvasId: number, useMask: boolean): void;

    /**
     * Toggles the `:showstats` FPS/render/memory overlay on the active room canvas.
     * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/IRoomEngine.as::setFpsCounterEnabled()
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::setFpsCounterEnabled()
    setFpsCounterEnabled(enabled: boolean): void;

    /**
     * Handles a mouse event on the room canvas.
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::handleRoomCanvasMouseEvent()
    handleRoomCanvasMouseEvent(
        canvasId: number,
        x: number,
        y: number,
        type: string,
        altKey: boolean,
        ctrlKey: boolean,
        shiftKey: boolean,
        buttonDown: boolean
    ): void;

    /**
     * Gets the room geometry for a canvas.
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::getRoomCanvasGeometry()
    getRoomCanvasGeometry(roomId: number, canvasId?: number): IRoomGeometry | null;

    /**
     * Gets the screen offset of a room canvas.
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::getRoomCanvasScreenOffset()
    getRoomCanvasScreenOffset(roomId: number, canvasId?: number): { x: number; y: number } | null;

    /**
     * Sets the screen offset of a room canvas.
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::setRoomCanvasScreenOffset()
    setRoomCanvasScreenOffset(roomId: number, canvasId: number, point: { x: number; y: number }): boolean;

    /**
     * Mounts an externally-owned display object directly onto the PixiJS
     * stage, above every room rendering canvas already added.
     *
     * TS-only: no AS3 equivalent - see RoomEngine.ts's implementation for why.
     */
    addStageChild(displayObject: Container): void;

    /**
     * Removes a display object previously added via addStageChild().
     */
    removeStageChild(displayObject: Container): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_90.as::getRoomObjectBoundingRectangle()
    getRoomObjectBoundingRectangle(roomId: number, objectId: number, category: number, canvasId: number): IRoomEngineRectangle | null;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomEngine.as::getRoomObjectScreenLocation()
    getRoomObjectScreenLocation(roomId: number, objectId: number, category: number, canvasId?: number): { x: number; y: number } | null;

    /**
     * Sets the scale of a room canvas, optionally centering on a point.
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::setRoomCanvasScale()
    setRoomCanvasScale(
        roomId: number,
        canvasId: number,
        scale: number,
        point?: { x: number; y: number } | null,
        offset?: { x: number; y: number } | null,
        mirror?: boolean,
        allowFractionalScale?: boolean,
        unusedFlag?: boolean
    ): void;

    /**
     * Gets the scale of a room canvas.
     */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::getRoomCanvasScale()
    getRoomCanvasScale(roomId: number, canvasId?: number): number;

    /**
	 * Builds the camera's render request for a viewport. `thumbnail` selects the thumbnail
	 * composer, which packs in its constructor.
	 */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::getRenderRoomMessage()
    getRenderRoomMessage(
        viewPort: IRoomEngineRectangle,
        backgroundColor: number,
        thumbnail?: boolean,
        includeOwnUser?: boolean,
        skipVisibilityChecking?: boolean,
        canvasId?: number
    ): RenderRoomMessageComposer | null;

    /**
	 * Captures the room canvas. See the implementation for why this returns an `ImageBitmap`
	 * instead of drawing into a caller-supplied bitmap as AS3 does.
	 */
    // AS3: .../src/com/sulake/habbo/room/IRoomEngine.as::snapshotRoomCanvasToBitmap()
    snapshotRoomCanvasToBitmap(
        roomId: number,
        canvasId: number,
        region?: IRoomEngineRectangle | null,
        backgroundColor?: number
    ): Promise<ImageBitmap | null>;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserOwnUserAvatar()
    updateObjectUserOwnUserAvatar(roomId: number, roomIndex: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectUserGesture()
    updateObjectUserGesture(roomId: number, roomIndex: number, gesture: number): boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::updateObjectRoomBackgroundColor()
    updateObjectRoomBackgroundColor(
        roomId: number, enable: boolean, hue: number, saturation: number, lightness: number
    ): boolean;

    /**
	 * The numeric pet type at the head of a pet figure string, or -1 when there is none.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_86.as::getPetTypeId()
    getPetTypeId(figure: string | null): number;

    /**
     * VariableFx *configurations* — the recipes. They belong to the room, not to any object, and
     * go straight to the room manager's per-room stores.
     */
    // AS3: sources/AIR-1.0.31/scripts/com/sulake/habbo/room/_SafeCls_86.as::updateVariableFxConfigs()
    updateVariableFxConfigs(roomId: number, configs: VariableFxConfigUpdateData[]): void;

    // AS3: sources/AIR-1.0.31/scripts/com/sulake/habbo/room/_SafeCls_86.as::removeVariableFxConfigs()
    removeVariableFxConfigs(roomId: number, configIds: number[]): void;

    /**
     * VariableFx *statuses* — the live values. Each one names an entity, so these are dispatched
     * one object at a time as a `RoomObjectUpdateMessage`, not stored on the room.
     */
    // AS3: sources/AIR-1.0.31/scripts/com/sulake/habbo/room/_SafeCls_86.as::updateVariableFxStatuses()
    updateVariableFxStatuses(roomId: number, statuses: VariableFxStatusUpdateData[]): void;

    // AS3: sources/AIR-1.0.31/scripts/com/sulake/habbo/room/_SafeCls_86.as::removeVariableFxStatuses()
    removeVariableFxStatuses(roomId: number, statuses: VariableFxStatusRemoveData[]): void;
}
