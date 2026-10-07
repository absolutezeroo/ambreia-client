/**
 * RoomMessageHandler
 *
 * Based on AS3: com.sulake.habbo.room.RoomMessageHandler
 *
 * Handles all incoming server messages for rooms.
 * Bridges the communication layer to the room engine.
 */
import type {IConnection} from '@ambreia/net/connection/IConnection';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IRoomCreator} from './IRoomCreator';
import {Vector3d} from '@ambreia/iso/utils/Vector3d';
import type {IVector3d} from '@ambreia/iso/utils/IVector3d';
import {RoomObjectUserTypes, getUserTypeName} from '@ambreia/iso/scene/object/RoomObjectUserTypes';
import {FurniStackingHeightMap} from '@ambreia/iso/scene/utils/FurniStackingHeightMap';

// Message Events - Room Session
import {RoomReadyMessageEvent} from '../communication/messages/incoming/room/session/RoomReadyMessageEvent';
import type {RoomReadyMessageParser} from '../communication/messages/parser/room/session/RoomReadyMessageParser';

// Message Events - Room Engine
import {
    FurnitureAliasesMessageEvent
} from '../communication/messages/incoming/room/engine/FurnitureAliasesMessageEvent';
import {HeightMapMessageEvent} from '../communication/messages/incoming/room/engine/HeightMapMessageEvent';
import {FloorHeightMapMessageEvent} from '../communication/messages/incoming/room/engine/FloorHeightMapMessageEvent';
import {HeightMapUpdateMessageEvent} from '../communication/messages/incoming/room/engine/HeightMapUpdateMessageEvent';
import {ObjectsMessageEvent} from '../communication/messages/incoming/room/engine/ObjectsMessageEvent';
import {ObjectAddMessageEvent} from '../communication/messages/incoming/room/engine/ObjectAddMessageEvent';
import {ObjectUpdateMessageEvent} from '../communication/messages/incoming/room/engine/ObjectUpdateMessageEvent';
import {ObjectRemoveMessageEvent} from '../communication/messages/incoming/room/engine/ObjectRemoveMessageEvent';
import {
    ObjectDataUpdateMessageEvent
} from '../communication/messages/incoming/room/engine/ObjectDataUpdateMessageEvent';
import {
    ObjectsDataUpdateMessageEvent
} from '../communication/messages/incoming/room/engine/ObjectsDataUpdateMessageEvent';
import {DiceValueMessageEvent} from '../communication/messages/incoming/room/engine/DiceValueMessageEvent';
import {OneWayDoorStatusMessageEvent} from '../communication/messages/incoming/room/engine/OneWayDoorStatusMessageEvent';
import type {OneWayDoorStatusMessageParser} from '../communication/messages/parser/room/engine/OneWayDoorStatusMessageParser';
import {ItemStateUpdateMessageEvent} from '../communication/messages/incoming/room/engine/ItemStateUpdateMessageEvent';
import type {ItemStateUpdateMessageParser} from '../communication/messages/parser/room/engine/ItemStateUpdateMessageParser';
import {ItemsStateUpdateMessageEvent} from '../communication/messages/incoming/room/engine/ItemsStateUpdateMessageEvent';
import type {ItemsStateUpdateMessageParser} from '../communication/messages/parser/room/engine/ItemsStateUpdateMessageParser';
import {ItemDataUpdateMessageEvent} from '../communication/messages/incoming/room/engine/ItemDataUpdateMessageEvent';
import type {ItemDataUpdateMessageParser} from '../communication/messages/parser/room/engine/ItemDataUpdateMessageParser';
import {AreaHideMessageEvent} from '../communication/messages/incoming/room/engine/AreaHideMessageEvent';
import type {AreaHideMessageParser} from '../communication/messages/parser/room/engine/AreaHideMessageParser';
import {ObjectRemoveConfirmMessageEvent} from '../communication/messages/incoming/room/engine/ObjectRemoveConfirmMessageEvent';
import type {ObjectRemoveConfirmMessageParser} from '../communication/messages/parser/room/engine/ObjectRemoveConfirmMessageParser';
import {PickupObjectMessageComposer} from '../communication/messages/outgoing/room/engine/PickupObjectMessageComposer';
import {SpecialRoomEffectMessageEvent} from '../communication/messages/incoming/room/engine/SpecialRoomEffectMessageEvent';
import type {SpecialRoomEffectMessageParser} from '../communication/messages/parser/room/engine/SpecialRoomEffectMessageParser';
import {RoomRotatingEffect} from '@ambreia/iso/utils/RoomRotatingEffect';
import {RoomShakingEffect} from '@ambreia/iso/utils/RoomShakingEffect';
import {RoomEngineZoomEvent} from '@ambreia/iso/scene/events/RoomEngineZoomEvent';
import {PetExperienceEvent} from '../communication/messages/incoming/room/pet/PetExperienceEvent';
import type {PetExperienceEventParser} from '../communication/messages/parser/room/pet/PetExperienceEventParser';
import {PetFigureUpdateEvent} from '../communication/messages/incoming/room/pet/PetFigureUpdateEvent';
import type {PetFigureUpdateEventParser} from '../communication/messages/parser/room/pet/PetFigureUpdateEventParser';
import {YouArePlayingGameMessageEvent} from '../communication/messages/incoming/room/session/YouArePlayingGameMessageEvent';
import type {YouArePlayingGameMessageParser} from '../communication/messages/parser/room/session/YouArePlayingGameMessageParser';
import {YouAreNotSpectatorMessageEvent} from '../communication/messages/incoming/room/session/YouAreNotSpectatorMessageEvent';
import type {YouAreNotSpectatorMessageParser} from '../communication/messages/parser/room/session/YouAreNotSpectatorMessageParser';
import {GamePlayerValueMessageEvent} from '../communication/messages/incoming/room/session/GamePlayerValueMessageEvent';
import type {GamePlayerValueMessageParser} from '../communication/messages/parser/room/session/GamePlayerValueMessageParser';
import {HanditemConfigurationMessageEvent} from '../communication/messages/incoming/room/session/HanditemConfigurationMessageEvent';
import type {HanditemConfigurationMessageParser} from '../communication/messages/parser/room/session/HanditemConfigurationMessageParser';
import {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IDisposable} from '@ambreia/common/IDisposable';
import {GuideSessionStartedMessageEvent} from '../communication/messages/incoming/help/GuideSessionStartedMessageEvent';
import {GuideSessionEndedMessageEvent} from '../communication/messages/incoming/help/GuideSessionEndedMessageEvent';
import {GuideSessionErrorMessageEvent} from '../communication/messages/incoming/help/GuideSessionErrorMessageEvent';
import type {GuideSessionStartedMessageParser} from '../communication/messages/parser/help/GuideSessionStartedMessageParser';
import {ItemRemoveMultipleMessageEvent} from '../communication/messages/incoming/room/engine/ItemRemoveMultipleMessageEvent';
import type {ItemRemoveMultipleMessageParser} from '../communication/messages/parser/room/engine/ItemRemoveMultipleMessageParser';
import {ObjectRemoveMultipleMessageEvent} from '../communication/messages/incoming/room/engine/ObjectRemoveMultipleMessageEvent';
import type {ObjectRemoveMultipleMessageParser} from '../communication/messages/parser/room/engine/ObjectRemoveMultipleMessageParser';
import type {DiceValueMessageParser} from '../communication/messages/parser/room/engine/DiceValueMessageParser';
import {LegacyStuffData} from '@ambreia/iso/scene/object/data/LegacyStuffData';
import {ItemsMessageEvent} from '../communication/messages/incoming/room/engine/ItemsMessageEvent';
import {ItemAddMessageEvent} from '../communication/messages/incoming/room/engine/ItemAddMessageEvent';
import {ItemUpdateMessageEvent} from '../communication/messages/incoming/room/engine/ItemUpdateMessageEvent';
import {ItemRemoveMessageEvent} from '../communication/messages/incoming/room/engine/ItemRemoveMessageEvent';
import {UsersMessageEvent} from '../communication/messages/incoming/room/engine/UsersMessageEvent';
import {UserUpdateMessageEvent} from '../communication/messages/incoming/room/engine/UserUpdateMessageEvent';
import {UserRemoveMessageEvent} from '../communication/messages/incoming/room/engine/UserRemoveMessageEvent';
import {BlockUserUpdateMessageEvent} from '../communication/messages/incoming/users/BlockUserUpdateMessageEvent';
import type {BlockUserUpdateMessageParser} from '../communication/messages/parser/users/BlockUserUpdateMessageParser';
import {UserObjectMessageEvent} from '../communication/messages/incoming/handshake/UserObjectMessageEvent';
import {
    SlideObjectBundleMessageEvent
} from '../communication/messages/incoming/room/engine/SlideObjectBundleMessageEvent';
import {RoomPropertyMessageEvent} from '../communication/messages/incoming/room/engine/RoomPropertyMessageEvent';
import {
    RoomVisualizationSettingsEvent
} from '../communication/messages/incoming/room/engine/RoomVisualizationSettingsEvent';

// Message Events - Room Chat
import {UserTypingMessageEvent} from '../communication/messages/incoming/room/chat/UserTypingMessageEvent';
import {ChatMessageEvent} from '../communication/messages/incoming/room/chat/ChatMessageEvent';
import {ShoutMessageEvent} from '../communication/messages/incoming/room/chat/ShoutMessageEvent';
import {WhisperMessageEvent} from '../communication/messages/incoming/room/chat/WhisperMessageEvent';
import type {
    ChatMessageEventParser
} from '../communication/messages/parser/room/chat/ChatMessageEventParser';
import {IgnoreResultMessageEvent} from '../communication/messages/incoming/users/IgnoreResultMessageEvent';
import {IgnoreResult} from '../session/IIgnoredUsersManager';

// Message Events - Room Action
import {ExpressionMessageEvent} from '../communication/messages/incoming/room/action/ExpressionMessageEvent';
import {DanceMessageEvent} from '../communication/messages/incoming/room/action/DanceMessageEvent';
import {AvatarEffectMessageEvent} from '../communication/messages/incoming/room/action/AvatarEffectMessageEvent';
import {SleepMessageEvent} from '../communication/messages/incoming/room/action/SleepMessageEvent';
import {CarryObjectMessageEvent} from '../communication/messages/incoming/room/action/CarryObjectMessageEvent';
import {UseObjectMessageEvent} from '../communication/messages/incoming/room/action/UseObjectMessageEvent';
import {UserChangeMessageEvent} from '../communication/messages/incoming/room/action/UserChangeMessageEvent';

// Parsers
import type {HeightMapMessageParser} from '../communication/messages/parser/room/engine/HeightMapMessageParser';
import type {
    FloorHeightMapMessageParser
} from '../communication/messages/parser/room/engine/FloorHeightMapMessageParser';
import type {
    HeightMapUpdateMessageParser
} from '../communication/messages/parser/room/engine/HeightMapUpdateMessageParser';
import type {ObjectsMessageParser} from '../communication/messages/parser/room/engine/ObjectsMessageParser';
import type {ObjectAddMessageParser} from '../communication/messages/parser/room/engine/ObjectAddMessageParser';
import type {ObjectUpdateMessageParser} from '../communication/messages/parser/room/engine/ObjectUpdateMessageParser';
import type {ObjectRemoveMessageParser} from '../communication/messages/parser/room/engine/ObjectRemoveMessageParser';
import type {
    ObjectDataUpdateMessageParser
} from '../communication/messages/parser/room/engine/ObjectDataUpdateMessageParser';
import type {
    ObjectsDataUpdateMessageParser
} from '../communication/messages/parser/room/engine/ObjectsDataUpdateMessageParser';
import type {ItemsMessageParser} from '../communication/messages/parser/room/engine/ItemsMessageParser';
import type {ItemAddMessageParser} from '../communication/messages/parser/room/engine/ItemAddMessageParser';
import type {ItemUpdateMessageParser} from '../communication/messages/parser/room/engine/ItemUpdateMessageParser';
import type {ItemRemoveMessageParser} from '../communication/messages/parser/room/engine/ItemRemoveMessageParser';
import type {UsersMessageParser} from '../communication/messages/parser/room/engine/UsersMessageParser';
import type {UserUpdateMessageParser} from '../communication/messages/parser/room/engine/UserUpdateMessageParser';
import type {UserRemoveMessageParser} from '../communication/messages/parser/room/engine/UserRemoveMessageParser';
import type {UserObjectMessageParser} from '../communication/messages/parser/handshake/UserObjectMessageParser';
import type {
    SlideObjectBundleMessageParser
} from '../communication/messages/parser/room/engine/SlideObjectBundleMessageParser';
import type {
    FurnitureAliasesMessageParser
} from '../communication/messages/parser/room/engine/FurnitureAliasesMessageParser';
import type {
    RoomPropertyMessageEventParser
} from '../communication/messages/parser/room/engine/RoomPropertyMessageEventParser';
import type {
    RoomVisualizationSettingsEventParser
} from '../communication/messages/parser/room/engine/RoomVisualizationSettingsEventParser';
import type {FurnitureFloorData} from '../communication/messages/incoming/room/engine/FurnitureFloorData';
import type {FurnitureWallData} from '../communication/messages/incoming/room/engine/FurnitureWallData';
import type {RoomUserData} from '../communication/messages/incoming/room/engine/RoomUserData';

// Parsers - Room Chat
import type {
    UserTypingMessageEventParser
} from '../communication/messages/parser/room/chat/UserTypingMessageEventParser';

// Parsers - Room Action
import type {
    ExpressionMessageEventParser
} from '../communication/messages/parser/room/action/ExpressionMessageEventParser';
import type {DanceMessageEventParser} from '../communication/messages/parser/room/action/DanceMessageEventParser';
import type {
    AvatarEffectMessageEventParser
} from '../communication/messages/parser/room/action/AvatarEffectMessageEventParser';
import type {SleepMessageEventParser} from '../communication/messages/parser/room/action/SleepMessageEventParser';
import type {
    CarryObjectMessageEventParser
} from '../communication/messages/parser/room/action/CarryObjectMessageEventParser';
import type {
    UseObjectMessageEventParser
} from '../communication/messages/parser/room/action/UseObjectMessageEventParser';
import type {
    UserChangeMessageEventParser
} from '../communication/messages/parser/room/action/UserChangeMessageEventParser';

// Room Object Variables
import {RoomObjectVariableEnum} from '@ambreia/iso/scene/object/RoomObjectVariableEnum';

// Room Entry Tile
import {RoomEntryTileMessageEvent} from '../communication/messages/incoming/room/layout/RoomEntryTileMessageEvent';
import type {RoomEntryTileMessageParser} from '../communication/messages/parser/room/layout/RoomEntryTileMessageParser';

// Room Object
import {RoomPlaneParser} from '@ambreia/iso/scene/object/RoomPlaneParser';
import type {LegacyWallGeometry} from '@ambreia/iso/scene/utils/LegacyWallGeometry';
import {Logger} from "@core";
import type {IRoomMessageHandler} from "@habbo/room/IRoomMessageHandler";

const log = Logger.getLogger('habbo.room.RoomMessageHandler');

export class RoomMessageHandler implements IRoomMessageHandler 
{
    // AS3: _SafeCls_1984.as::onSpecialRoomEvent() — `new Timer(1000, discoColours.length + 1)`
    private static readonly DISCO_TICK_MS = 1000;

    // Name derived from the value: AS3 spells the literal 16 inline in `onUsers()`, the only pet
    // type whose posture it applies on room entry.
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onUsers()
    private static readonly MONSTERPLANT_PET_TYPE_ID = 16;

    public static readonly EFFECT_NONE = 0;
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::EFFECT_ROOM_SHAKE
    public static readonly EFFECT_ROOM_SHAKE = 1;
    public static readonly EFFECT_ROOM_ROTATE = 2;
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::EFFECT_ROOM_DISCO
    public static readonly EFFECT_ROOM_DISCO = 3;

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomMessageHandler.as::_roomCreator
    private _roomCreator: IRoomCreator | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomMessageHandler.as::_currentRoomId
    private _currentRoomId: number = 0;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomMessageHandler.as::_ownUserId
    private _ownUserId: number = -1;

    // AS3: _SafeCls_1984.as::_SafeStr_6558 (name derived: the guide's web user id, from its only
    // assignment `= parser.guideUserId` in onGuideSessionStarted)
    private _guideUserId: number = -1;

    // AS3: _SafeCls_1984.as::_SafeStr_6723 (name derived: the requester's web user id, from its only
    // assignment `= parser.requesterUserId` in onGuideSessionStarted)
    private _requesterUserId: number = -1;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomMessageHandler.as::_planeParser
    private _planeParser: RoomPlaneParser;
    private _entryTileEvent: RoomEntryTileMessageEvent | null = null;

    constructor(roomCreator: IRoomCreator)
    {
        this._roomCreator = roomCreator;
        this._planeParser = new RoomPlaneParser();
    }

    // TS-only: AS3 has no such accessor — every one of its wall-geometry reads is written out in
    // full as `_roomCreator.getLegacyGeometry(_currentRoomId)` (_SafeCls_1984.as:569/906/979/1399).
    // This handler holds the same two values in the same two fields, so the call is folded into one
    // getter rather than repeated at six sites. It replaces a private `new LegacyWallGeometry()`:
    // that single instance was shared across every room the client ever entered, so a wall item
    // placed after a room change was positioned against the previous room's height map.
    private get legacyWallGeometry(): LegacyWallGeometry | null
    {
        return this._roomCreator?.getLegacyGeometry(this._currentRoomId) ?? null;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomMessageHandler.as::_connection
    private _connection: IConnection | null = null;

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::set connection()
    set connection(connection: IConnection | null) 
    {
        if(this._connection !== null) 
        {
            return;
        }

        if(connection !== null) 
        {
            this._connection = connection;

            // Register message events
            connection.addMessageEvent(new RoomReadyMessageEvent(this.onRoomReady.bind(this)));
            connection.addMessageEvent(new FurnitureAliasesMessageEvent(this.onFurnitureAliases.bind(this)));
            connection.addMessageEvent(new HeightMapMessageEvent(this.onHeightMap.bind(this)));
            connection.addMessageEvent(new FloorHeightMapMessageEvent(this.onFloorHeightMap.bind(this)));
            connection.addMessageEvent(new HeightMapUpdateMessageEvent(this.onHeightMapUpdate.bind(this)));
            connection.addMessageEvent(new ObjectsMessageEvent(this.onObjects.bind(this)));
            connection.addMessageEvent(new ObjectAddMessageEvent(this.onObjectAdd.bind(this)));
            connection.addMessageEvent(new ObjectUpdateMessageEvent(this.onObjectUpdate.bind(this)));
            connection.addMessageEvent(new ObjectRemoveMessageEvent(this.onObjectRemove.bind(this)));
            connection.addMessageEvent(new ObjectDataUpdateMessageEvent(this.onObjectDataUpdate.bind(this)));
            connection.addMessageEvent(new ObjectsDataUpdateMessageEvent(this.onObjectsDataUpdate.bind(this)));
            connection.addMessageEvent(new DiceValueMessageEvent(this.onDiceValue.bind(this)));
            connection.addMessageEvent(new OneWayDoorStatusMessageEvent(this.onOneWayDoorStatus.bind(this)));
            connection.addMessageEvent(new ItemStateUpdateMessageEvent(this.onItemStateUpdate.bind(this)));
            connection.addMessageEvent(new ItemsStateUpdateMessageEvent(this.onItemsStateUpdate.bind(this)));
            connection.addMessageEvent(new ItemDataUpdateMessageEvent(this.onItemDataUpdate.bind(this)));
            connection.addMessageEvent(new AreaHideMessageEvent(this.onAreaHide.bind(this)));
            // AS3 registers all three on one handler here (_SafeCls_1984.as:278-280), next to the
            // typing status below. This is the room-engine half of chat — the session's
            // RoomChatHandler dispatches the bubble, this one moves the avatar.
            connection.addMessageEvent(new ChatMessageEvent(this.onChat.bind(this)));
            connection.addMessageEvent(new WhisperMessageEvent(this.onChat.bind(this)));
            connection.addMessageEvent(new ShoutMessageEvent(this.onChat.bind(this)));
            connection.addMessageEvent(new IgnoreResultMessageEvent(this.onIgnoreResult.bind(this)));
            connection.addMessageEvent(new ObjectRemoveConfirmMessageEvent(this.onObjectRemoveConfirm.bind(this)));
            connection.addMessageEvent(new SpecialRoomEffectMessageEvent(this.onSpecialRoomEvent.bind(this)));
            connection.addMessageEvent(new PetExperienceEvent(this.onPetExperience.bind(this)));
            connection.addMessageEvent(new PetFigureUpdateEvent(this.onPetFigureUpdate.bind(this)));
            connection.addMessageEvent(new YouArePlayingGameMessageEvent(this.onPlayingGame.bind(this)));
            connection.addMessageEvent(new YouAreNotSpectatorMessageEvent(this.onYouAreNotSpectator.bind(this)));
            connection.addMessageEvent(new GamePlayerValueMessageEvent(this.onGamePlayerNumberValue.bind(this)));
            connection.addMessageEvent(new HanditemConfigurationMessageEvent(this.onConfigurationItemStates.bind(this)));
            connection.addMessageEvent(new GuideSessionStartedMessageEvent(this.onGuideSessionStarted.bind(this)));
            connection.addMessageEvent(new GuideSessionEndedMessageEvent(this.onGuideSessionEnded.bind(this)));
            connection.addMessageEvent(new GuideSessionErrorMessageEvent(this.onGuideSessionError.bind(this)));
            connection.addMessageEvent(new ItemRemoveMultipleMessageEvent(this.onItemRemoveMultiple.bind(this)));
            connection.addMessageEvent(new ObjectRemoveMultipleMessageEvent(this.onObjectRemoveMultiple.bind(this)));
            connection.addMessageEvent(new ItemsMessageEvent(this.onItems.bind(this)));
            connection.addMessageEvent(new ItemAddMessageEvent(this.onItemAdd.bind(this)));
            connection.addMessageEvent(new ItemUpdateMessageEvent(this.onItemUpdate.bind(this)));
            connection.addMessageEvent(new ItemRemoveMessageEvent(this.onItemRemove.bind(this)));
            // AS3 registers this alongside the room events (_SafeCls_1984.as:241) and it is the only
            // thing that ever assigns `_ownUserId`. The port declared the field and read it in
            // onUsers(), but never ported the listener that fills it — so `data.webID === -1` was
            // false for every user, `setOwnUserId()` never ran, and `RoomSession.ownUserRoomId`
            // stayed -1 for the whole session. Anything keyed on "which of these avatars is me"
            // silently had no answer.
            connection.addMessageEvent(new UserObjectMessageEvent(this.onOwnUserEvent.bind(this)));
            connection.addMessageEvent(new UsersMessageEvent(this.onUsers.bind(this)));
            connection.addMessageEvent(new UserUpdateMessageEvent(this.onUserUpdate.bind(this)));
            connection.addMessageEvent(new UserRemoveMessageEvent(this.onUserRemove.bind(this)));
            // AS3 registers this here too, alongside BlockedUsersManager's own listener: the
            // manager keeps the list, the room engine paints the avatar.
            connection.addMessageEvent(new BlockUserUpdateMessageEvent(this.onBlockUserUpdate.bind(this)));
            connection.addMessageEvent(new SlideObjectBundleMessageEvent(this.onSlideUpdate.bind(this)));
            connection.addMessageEvent(new RoomPropertyMessageEvent(this.onRoomProperty.bind(this)));
            connection.addMessageEvent(new RoomVisualizationSettingsEvent(this.onRoomVisualizationSettings.bind(this)));

            // Room layout events
            connection.addMessageEvent(new RoomEntryTileMessageEvent(this.onEntryTileData.bind(this)));

            // Avatar action events
            connection.addMessageEvent(new UserTypingMessageEvent(this.onTypingStatus.bind(this)));
            connection.addMessageEvent(new ExpressionMessageEvent(this.onExpression.bind(this)));
            connection.addMessageEvent(new DanceMessageEvent(this.onDance.bind(this)));
            connection.addMessageEvent(new AvatarEffectMessageEvent(this.onAvatarEffect.bind(this)));
            connection.addMessageEvent(new SleepMessageEvent(this.onAvatarSleep.bind(this)));
            connection.addMessageEvent(new CarryObjectMessageEvent(this.onCarryObject.bind(this)));
            connection.addMessageEvent(new UseObjectMessageEvent(this.onUseObject.bind(this)));
            connection.addMessageEvent(new UserChangeMessageEvent(this.onUserChange.bind(this)));
        }
    }

    protected _disposed: boolean = false;

    get disposed(): boolean 
    {
        return this._disposed;
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::dispose()
    dispose(): void 
    {
        if(!this._disposed) 
        {
            this._connection = null;
            this._roomCreator = null;
        }
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::setCurrentRoom()
    setCurrentRoom(roomId: number): void 
    {
        if(this._currentRoomId !== 0) 
        {
            if(this._roomCreator !== null) 
            {
                this._roomCreator.disposeRoom(this._currentRoomId);
            }
        }

        this._currentRoomId = roomId;
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::resetCurrentRoom()
    resetCurrentRoom(): void 
    {
        this._currentRoomId = 0;
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onRoomReady()
    onRoomReady(event: IMessageEvent): void 
    {
        const roomReadyEvent = event as RoomReadyMessageEvent;

        if(roomReadyEvent === null || event.connection === null) 
        {
            return;
        }

        const parser = roomReadyEvent.getParser() as RoomReadyMessageParser;

        if(parser === null) 
        {
            return;
        }

        if(this._currentRoomId !== parser.roomId) 
        {
            this.setCurrentRoom(parser.roomId);
        }

        const roomType = parser.roomType;

        if(this._roomCreator !== null) 
        {
            this._roomCreator.setWorldType(parser.roomId, roomType);
        }
    }

    /**
     * Handle furniture aliases from server.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onFurnitureAliases
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onFurnitureAliases()
    onFurnitureAliases(event: IMessageEvent): void 
    {
        if(this._roomCreator === null || event.connection === null) 
        {
            return;
        }

        const aliasesEvent = event as FurnitureAliasesMessageEvent;

        if(aliasesEvent === null) 
        {
            return;
        }

        const parser = aliasesEvent.parser as FurnitureAliasesMessageParser;

        if(parser === null) 
        {
            return;
        }

        const count = parser.aliasCount;

        log.trace(`Received ${count} furniture aliases`);

        for(let i = 0; i < count; i++) 
        {
            const name = parser.getName(i);
            const alias = parser.getAlias(i);

            if(name !== null && alias !== null) 
            {
                this._roomCreator.setRoomObjectAlias(name, alias);
            }
        }
    }

    /**
     * Handle a live room floor/wall/landscape texture update.
     * Based on AS3: sources/win63_version/habbo/room/class_1788.as::onRoomProperty()
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onRoomProperty()
    onRoomProperty(event: IMessageEvent): void 
    {
        if(this._roomCreator === null || this._currentRoomId === 0) 
        {
            return;
        }

        const propertyEvent = event as RoomPropertyMessageEvent;

        if(propertyEvent === null) 
        {
            return;
        }

        const parser = propertyEvent.parser as RoomPropertyMessageEventParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.updateObjectRoom(
            this._currentRoomId,
            this.normalizeRoomPropertyValue(parser.floorType),
            this.normalizeRoomPropertyValue(parser.wallType),
            this.normalizeRoomPropertyValue(parser.landscapeType)
        );
    }

    // Vortex-emulator quirk, not AS3: the server's room record uses "0" as its DB
    // "unset" sentinel for floor/wall/landscape paint (Turbo.Rooms/Grains/RoomGrain.cs)
    // and sends it as a literal RoomPropertyMessageComposer value instead of either
    // omitting the property or sending the real default motif ids - applying "0" as a
    // texture id verbatim renders a real (wrong) motif instead of the intended default

    /**
     * Handle a live room wall-visibility / wall+floor thickness update.
     * Based on AS3: sources/win63_version/habbo/room/class_1788.as::onRoomVisualizationSettings()
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onRoomVisualizationSettings()
    onRoomVisualizationSettings(event: IMessageEvent): void 
    {
        if(this._roomCreator === null || this._currentRoomId === 0) 
        {
            return;
        }

        const settingsEvent = event as RoomVisualizationSettingsEvent;

        if(settingsEvent === null) 
        {
            return;
        }

        const parser = settingsEvent.parser as RoomVisualizationSettingsEventParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.updateObjectRoomVisibilities(this._currentRoomId, !parser.wallsHidden, true);
        this._roomCreator.updateObjectRoomPlaneThicknesses(this._currentRoomId, parser.wallThicknessMultiplier, parser.floorThicknessMultiplier);
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomMessageHandler.as::onHeightMap()
    onHeightMap(event: IMessageEvent): void 
    {
        const heightMapEvent = event as HeightMapMessageEvent;

        if(heightMapEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = heightMapEvent.getParser() as HeightMapMessageParser;

        if(parser === null) 
        {
            return;
        }

        const map = new FurniStackingHeightMap(parser.width, parser.height);

        for(let y = 0; y < parser.height; y++) 
        {
            for(let x = 0; x < parser.width; x++) 
            {
                map.setTileHeight(x, y, parser.getTileHeight(x, y));
                map.setStackingBlocked(x, y, parser.getStackingBlocked(x, y));
                map.setIsRoomTile(x, y, parser.isRoomTile(x, y));
            }
        }

        this._roomCreator.setFurniStackingHeightMap(this._currentRoomId, map);
    }

    /**
     * Handle entry tile data (arrives BEFORE FloorHeightMap).
     * Based on AS3: RoomMessageHandler.onEntryTileData
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onEntryTileData()
    onEntryTileData(event: IMessageEvent): void 
    {
        this._entryTileEvent = event as RoomEntryTileMessageEvent;
    }

    /**
     * Handle floor height map data. Detects door position and generates planes.
     * Based on AS3: RoomMessageHandler.onFloorHeightMap (lines 540-627)
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onFloorHeightMap()
    onFloorHeightMap(event: IMessageEvent): void 
    {
        const floorEvent = event as FloorHeightMapMessageEvent;

        if(floorEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = floorEvent.getParser() as FloorHeightMapMessageParser;

        if(parser === null) 
        {
            return;
        }

        const width = parser.width;
        const height = parser.height;

        // Reset and initialize plane parser
        this._planeParser.reset();
        this._planeParser.initializeTileMap(width, height);

        // Get entry tile data if available (arrives before FloorHeightMap)
        let entryTileParser: RoomEntryTileMessageParser | null = null;

        if(this._entryTileEvent !== null) 
        {
            entryTileParser = this._entryTileEvent.getParser() as RoomEntryTileMessageParser;
        }

        // Door detection variables (AS3 lines 567-570)
        let doorX: number = -1;
        let doorY: number = -1;
        let doorZ: number = 0;
        let doorDir: number = 0;

        // Scan tiles: detect door and set heights (AS3 lines 579-596)
        for(let y = 0; y < height; y++) 
        {
            for(let x = 0; x < width; x++) 
            {
                const tileHeight = parser.getTileHeight(x, y);

                // Door detection: check if tile is on the border and has 3 blocked neighbors
                // AS3 condition: (y > 0 && y < height-1 || x > 0 && x < width-1) && height != -110
                if((y > 0 && y < height - 1 || x > 0 && x < width - 1) && tileHeight !== -110) 
                {
                    // If we have entry tile data, only check that specific tile
                    if(entryTileParser === null || (x === entryTileParser.x && y === entryTileParser.y)) 
                    {
                        // Pattern 1: top + left + bottom blocked â†’ door direction 90 (facing right)
                        if(parser.getTileHeight(x, y - 1) === -110
                            && parser.getTileHeight(x - 1, y) === -110
                            && parser.getTileHeight(x, y + 1) === -110) 
                        {
                            doorX = x + 0.5;
                            doorY = y;
                            doorZ = tileHeight;
                            doorDir = 90;
                        }

                        // Pattern 2: top + left + right blocked â†’ door direction 180 (facing down)
                        if(parser.getTileHeight(x, y - 1) === -110
                            && parser.getTileHeight(x - 1, y) === -110
                            && parser.getTileHeight(x + 1, y) === -110) 
                        {
                            doorX = x;
                            doorY = y + 0.5;
                            doorZ = tileHeight;
                            doorDir = 180;
                        }
                    }
                }

                this._planeParser.setTileHeight(x, y, tileHeight);
            }
        }

        const doorFound = doorX >= 0 && doorY >= 0;

        // Initialize legacy wall geometry with height data for wall item positioning
        const legacyWallGeometry = this.legacyWallGeometry;

        if(legacyWallGeometry !== null)
        {
            legacyWallGeometry.initialize(width, height, parser.fixedWallsHeight);

            for(let y = 0; y < height; y++)
            {
                for(let x = 0; x < width; x++)
                {
                    legacyWallGeometry.setTileHeight(x, y, parser.getTileHeight(x, y));
                }
            }
        }

        // Set door tile height BEFORE initializeFromTileData (AS3 line 598)
        const doorTileX = Math.floor(doorX);
        const doorTileY = Math.floor(doorY);

        if(doorFound) 
        {
            this._planeParser.setTileHeight(doorTileX, doorTileY, doorZ);
        }

        // Generate floor/wall planes, passing explicit door tile position
        this._planeParser.initializeFromTileData(
            parser.fixedWallsHeight,
            doorFound ? {x: doorTileX, y: doorTileY} : undefined
        );

        // Set door tile height AFTER with wallHeight added (AS3 line 601)
        if(doorFound) 
        {
            this._planeParser.setTileHeight(
                Math.floor(doorX), Math.floor(doorY),
                doorZ + this._planeParser.wallHeight
            );

            log.debug(`Door detected at (${doorX}, ${doorY}, ${doorZ}) dir=${doorDir}`);
        }

        // Initialize room with plane parser data and door info
        if(this._roomCreator !== null) 
        {
            this._roomCreator.initializeRoom(
                this._currentRoomId,
                this._planeParser,
                doorFound ? doorX : undefined,
                doorFound ? doorY : undefined,
                doorFound ? doorZ : undefined,
                doorFound ? doorDir : undefined,
                new Vector3d(parser.cameraInitX, parser.cameraInitY, parser.cameraInitZ)
            );
        }
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/room/RoomMessageHandler.as::onHeightMapUpdate()
    onHeightMapUpdate(event: IMessageEvent): void 
    {
        const updateEvent = event as HeightMapUpdateMessageEvent;

        if(updateEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = updateEvent.getParser() as HeightMapUpdateMessageParser;

        if(parser === null) 
        {
            return;
        }

        const map = this._roomCreator.getFurniStackingHeightMap(this._currentRoomId);

        if(map === null) 
        {
            return;
        }

        while(parser.next()) 
        {
            map.setTileHeight(parser.x, parser.y, parser.tileHeight);
            map.setStackingBlocked(parser.x, parser.y, parser.isStackingBlocked);
            map.setIsRoomTile(parser.x, parser.y, parser.isRoomTile);
        }

        this._roomCreator.refreshTileObjectMap(this._currentRoomId, 'RoomMessageHandler.onHeightMapUpdate()');
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onObjects()
    onObjects(event: IMessageEvent): void 
    {
        const objectsEvent = event as ObjectsMessageEvent;

        if(objectsEvent === null) 
        {
            return;
        }

        const parser = objectsEvent.getParser() as ObjectsMessageParser;

        if(parser === null) 
        {
            return;
        }

        const count = parser.objectCount;

        for(let i = 0; i < count; i++) 
        {
            const data = parser.getObject(i);

            if(data !== null) 
            {
                this.addFloorFurniture(this._currentRoomId, data);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onObjectAdd()
    onObjectAdd(event: IMessageEvent): void 
    {
        const addEvent = event as ObjectAddMessageEvent;

        if(addEvent === null) 
        {
            return;
        }

        const parser = addEvent.getParser() as ObjectAddMessageParser;

        if(parser === null) 
        {
            return;
        }

        const data = parser.object;

        if(data !== null) 
        {
            this.addFloorFurniture(this._currentRoomId, data);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onObjectUpdate()
    onObjectUpdate(event: IMessageEvent): void 
    {
        const updateEvent = event as ObjectUpdateMessageEvent;

        if(updateEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = updateEvent.getParser() as ObjectUpdateMessageParser;

        if(parser === null) 
        {
            return;
        }

        const data = parser.object;

        if(data !== null) 
        {
            const location: IVector3d = new Vector3d(data.x, data.y, data.z);
            const direction: IVector3d = new Vector3d(data.dir);

            this._roomCreator.updateObjectFurniture(
                this._currentRoomId,
                data.id,
                location,
                direction,
                data.state,
                data.data,
                data.extra
            );
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onObjectUpdate() sends all three; the port parsed `sizeZ` and
            // `expiryTime` and dropped them, so a stack-height or rental change never
            // reached the object.
            this._roomCreator.updateObjectFurnitureHeight(this._currentRoomId, data.id, data.sizeZ);
            this._roomCreator.updateObjectFurnitureExpiryTime(this._currentRoomId, data.id, data.expiryTime);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onObjectRemove()
    onObjectRemove(event: IMessageEvent): void 
    {
        const removeEvent = event as ObjectRemoveMessageEvent;

        if(removeEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = removeEvent.getParser() as ObjectRemoveMessageParser;

        if(parser === null) 
        {
            return;
        }

        // AS3 (_SafeCls_1984.as:782,:787) passes refresh=true for a server-driven removal
        // so the tile map rebuilds; ghost/preview disposals leave it false.
        this._roomCreator.disposeObjectFurniture(
            this._currentRoomId,
            parser.objectId,
            parser.pickerId,
            true
        );
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onObjectDataUpdate()
    onObjectDataUpdate(event: IMessageEvent): void 
    {
        const dataEvent = event as ObjectDataUpdateMessageEvent;

        if(dataEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = dataEvent.getParser() as ObjectDataUpdateMessageParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.updateObjectFurniture(
            this._currentRoomId,
            parser.id,
            null,
            null,
            parser.state,
            parser.data
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onObjectsDataUpdate()
    onObjectsDataUpdate(event: IMessageEvent): void
    {
        const dataEvent = event as ObjectsDataUpdateMessageEvent;

        if(dataEvent === null)
        {
            return;
        }

        if(this._roomCreator === null)
        {
            return;
        }

        const parser = dataEvent.getParser() as ObjectsDataUpdateMessageParser;

        if(parser === null)
        {
            return;
        }

        for(let i = 0; i < parser.objectCount; i++)
        {
            const object = parser.getObjectData(i);

            if(object !== null)
            {
                this._roomCreator.updateObjectFurniture(
                    this._currentRoomId,
                    object.id,
                    null,
                    null,
                    object.state,
                    object.data
                );
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onDiceValue()
    onDiceValue(event: IMessageEvent): void
    {
        const diceEvent = event as DiceValueMessageEvent;

        if(diceEvent === null)
        {
            return;
        }

        const parser = diceEvent.getParser() as DiceValueMessageParser;

        if(parser === null)
        {
            return;
        }

        if(this._roomCreator === null)
        {
            return;
        }

        // AS3 hands updateObjectFurniture a fresh empty LegacyDataType (_SafeCls_1945) as the stuff
        // data; the rolled face is carried by the state argument.
        this._roomCreator.updateObjectFurniture(
            this._currentRoomId,
            parser.id,
            null,
            null,
            parser.value,
            new LegacyStuffData()
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onOneWayDoorStatus()
    onOneWayDoorStatus(event: IMessageEvent): void
    {
        const doorEvent = event as OneWayDoorStatusMessageEvent;

        if(doorEvent === null)
        {
            return;
        }

        const parser = doorEvent.getParser() as OneWayDoorStatusMessageParser;

        if(parser === null)
        {
            return;
        }

        if(this._roomCreator === null)
        {
            return;
        }

        // Same shape as onDiceValue: the status becomes the object state, with a fresh empty
        // LegacyDataType (AS3 _SafeCls_1945) as the stuff data.
        this._roomCreator.updateObjectFurniture(
            this._currentRoomId,
            parser.id,
            null,
            null,
            parser.status,
            new LegacyStuffData()
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onPetExperience()
    onPetExperience(event: IMessageEvent): void
    {
        const experienceEvent = event as PetExperienceEvent;

        if(experienceEvent === null)
        {
            return;
        }

        const parser = experienceEvent.getParser() as PetExperienceEventParser;

        if(parser === null || this._roomCreator === null)
        {
            return;
        }

        this._roomCreator.updateObjectUserAction(
            this._currentRoomId,
            parser.petRoomIndex,
            'figure_gained_experience',
            parser.gainedExperience
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onPetFigureUpdate()
    onPetFigureUpdate(event: IMessageEvent): void
    {
        const figureEvent = event as PetFigureUpdateEvent;

        if(figureEvent === null)
        {
            return;
        }

        const parser = figureEvent.getParser() as PetFigureUpdateEventParser;

        if(parser === null || this._roomCreator === null)
        {
            return;
        }

        // AS3 reads parser.figureData.figureString with no null check; the port's getter is
        // nullable, so guard. Both the sex and subType arguments are the empty string in AS3.
        const figureData = parser.figureData;

        if(figureData === null)
        {
            return;
        }

        this._roomCreator.updateObjectUserFigure(
            this._currentRoomId,
            parser.roomIndex,
            figureData.figureString,
            '',
            '',
            parser.isRiding
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onPlayingGame()
    onPlayingGame(event: IMessageEvent): void
    {
        const gameEvent = event as YouArePlayingGameMessageEvent;

        if(gameEvent === null)
        {
            return;
        }

        const parser = gameEvent.getParser() as YouArePlayingGameMessageParser;

        if(parser === null || this._roomCreator === null)
        {
            return;
        }

        this._roomCreator.setIsPlayingGame(this._currentRoomId, parser.isPlaying);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onYouAreNotSpectator()
    onYouAreNotSpectator(event: IMessageEvent): void
    {
        const spectatorEvent = event as YouAreNotSpectatorMessageEvent;

        if(spectatorEvent === null)
        {
            return;
        }

        const parser = spectatorEvent.getParser() as YouAreNotSpectatorMessageParser;

        // The message is broadcast per flat: ignore it unless it names the room we are in.
        if(parser === null || parser.flatId !== this._currentRoomId)
        {
            return;
        }

        const session = this._roomCreator?.roomSessionManager?.getSession(this._currentRoomId) ?? null;

        if(session === null || !session.isSpectatorMode)
        {
            return;
        }

        session.isSpectatorMode = false;
        this._roomCreator?.leaveSpectate();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onGamePlayerNumberValue()
    onGamePlayerNumberValue(event: IMessageEvent): void
    {
        if(this._roomCreator === null)
        {
            return;
        }

        if(!(event instanceof GamePlayerValueMessageEvent))
        {
            return;
        }

        const parser = event.getParser() as GamePlayerValueMessageParser;

        if(parser === null)
        {
            return;
        }

        // AS3 routes this through getRoomId(0), a private helper whose argument is ignored: it
        // returns the current room id unconditionally.
        this._roomCreator.updateObjectUserAction(
            this._currentRoomId,
            parser.userId,
            'figure_number_value',
            parser.value
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onConfigurationItemStates()
    onConfigurationItemStates(event: IMessageEvent): void
    {
        const configEvent = event as HanditemConfigurationMessageEvent;

        if(configEvent === null)
        {
            return;
        }

        const parser = configEvent.getParser() as HanditemConfigurationMessageParser;

        if(parser === null || this._roomCreator === null)
        {
            return;
        }

        this._roomCreator.setHanditemControlBlocked(this._currentRoomId, parser.isHanditemControlBlocked);
        this._roomCreator.setChooserDisabled(this._currentRoomId, parser.chooserDisabled);
        this._roomCreator.setFreeFurniMovementsMode(this._currentRoomId, parser.freeFurniMovementsEnabled);
        this._roomCreator.setInvisibleFurni(this._currentRoomId, parser.invisibleFurni);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onSpecialRoomEvent()
    onSpecialRoomEvent(event: IMessageEvent): void
    {
        const parser = event.parser as SpecialRoomEffectMessageParser;

        // AS3 dereferences the parser without a null check here — guard, since the port's `parser`
        // accessor is nullable.
        if(parser === null)
        {
            return;
        }

        // The ids are the wire's own, not the EFFECT_* constants above: 0 rotate, 1 shake, 2 zoom,
        // 3 disco. AS3 has no default branch — an unknown id does nothing.
        switch(parser.effectId)
        {
            case 0:
                RoomRotatingEffect.init(250, 5000);
                RoomRotatingEffect.turnVisualizationOn();
                break;
            case 1:
                RoomShakingEffect.init(250, 5000);
                RoomShakingEffect.turnVisualizationOn();
                break;
            case 2:
                this._roomCreator?.roomSessionManager?.sessionEvents.emit(
                    RoomEngineZoomEvent.ROOM_ZOOM,
                    new RoomEngineZoomEvent(this._currentRoomId, -1, true)
                );
                break;
            case 3:
                this.startDiscoEffect();
                break;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onSpecialRoomEvent()
    // (the `case 3` closure — extracted here because TS has no inline Timer listener)
    private startDiscoEffect(): void
    {
        // AS3 builds a Timer(1000, colours.length + 1): one extra tick past the end of the array.
        // On that last tick arrayIndex === colours.length, so the branch that reads
        // discoColours[arrayIndex++] with backgroundOnly=true indexes one past the end and passes
        // `undefined` as the colour. Preserved verbatim — the tick still fires, and it is what ends
        // the effect on the real client.
        const discoColours = [29371, 16731195, 16764980, 10092288, 29371, 16731195, 16764980, 10092288, 0];
        let arrayIndex = 0;
        let ticksLeft = discoColours.length + 1;

        const tick = (): void =>
        {
            if(this._roomCreator !== null)
            {
                const backgroundOnly = arrayIndex === discoColours.length;
                this._roomCreator.updateObjectRoomColor(
                    this._currentRoomId,
                    discoColours[arrayIndex++],
                    176,
                    backgroundOnly
                );
            }

            ticksLeft--;

            if(ticksLeft > 0)
            {
                setTimeout(tick, RoomMessageHandler.DISCO_TICK_MS);
            }
        };

        setTimeout(tick, RoomMessageHandler.DISCO_TICK_MS);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onObjectRemoveConfirm()
    onObjectRemoveConfirm(event: IMessageEvent): void
    {
        const confirmationEvent = event as ObjectRemoveConfirmMessageEvent;

        if(confirmationEvent === null)
        {
            return;
        }

        const parser = confirmationEvent.getParser() as ObjectRemoveConfirmMessageParser;

        if(parser === null)
        {
            return;
        }

        const windowManager = this._roomCreator?.windowManager ?? null;

        if(windowManager === null)
        {
            return;
        }

        // The composer is built up front, as AS3 does, so the closure captures it rather than the
        // parser — parsers are pooled and flushed, and the dialog answer arrives much later.
        const composer = new PickupObjectMessageComposer(parser.id, parser.category, true);

        // The server sends bare localisation keys; AS3 wraps them in ${...} at the call site.
        windowManager.confirm(
            '${' + parser.confirmTitle + '}',
            '${' + parser.confirmBody + '}',
            0,
            (dialog: IDisposable, windowEvent: WindowEvent): void =>
            {
                dialog.dispose();

                if(windowEvent.type === WindowEvent.WE_OK)
                {
                    event.connection?.send(composer);
                }
            }
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onGuideSessionStarted()
    onGuideSessionStarted(event: IMessageEvent): void
    {
        const parser = event.parser as GuideSessionStartedMessageParser;

        if(parser === null)
        {
            return;
        }

        this._guideUserId = parser.guideUserId;
        this._requesterUserId = parser.requesterUserId;
        this.updateGuideMarker();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onGuideSessionEnded()
    onGuideSessionEnded(_event: IMessageEvent): void
    {
        this.removeGuideMarker();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onGuideSessionError()
    onGuideSessionError(_event: IMessageEvent): void
    {
        this.removeGuideMarker();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::updateGuideMarker()
    private updateGuideMarker(): void
    {
        const ownUserId = this._roomCreator?.sessionDataManager?.userId ?? -1;

        // Each side is marked only from the other's point of view: the guide gets marker 1 when I am
        // the requester, the requester gets marker 2 when I am the guide, and a bystander sees 0.
        this.setUserGuideStatus(this._guideUserId, this._requesterUserId === ownUserId ? 1 : 0);
        this.setUserGuideStatus(this._requesterUserId, this._guideUserId === ownUserId ? 2 : 0);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::removeGuideMarker()
    private removeGuideMarker(): void
    {
        this.setUserGuideStatus(this._guideUserId, 0);
        this.setUserGuideStatus(this._requesterUserId, 0);
        this._guideUserId = -1;
        this._requesterUserId = -1;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::setUserGuideStatus()
    private setUserGuideStatus(userId: number, status: number): void
    {
        if(this._roomCreator === null || this._roomCreator.roomSessionManager === null)
        {
            return;
        }

        const session = this._roomCreator.roomSessionManager.getSession(this._currentRoomId);

        if(session === null)
        {
            return;
        }

        // Type 1 is the avatar user type; the marker rides on the room object, not the web user.
        const userData = session.userDataManager.getUserDataByType(userId, 1);

        if(userData !== null)
        {
            this._roomCreator.updateObjectUserAction(
                this._currentRoomId,
                userData.roomObjectId,
                'figure_guide_status',
                status
            );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onAreaHide()
    onAreaHide(event: IMessageEvent): void
    {
        const areaHideEvent = event as AreaHideMessageEvent;

        if(areaHideEvent === null)
        {
            return;
        }

        const parser = areaHideEvent.getParser() as AreaHideMessageParser;

        if(parser === null)
        {
            return;
        }

        const data = parser.areaHideMessageData;

        // AS3 reads .furniId etc. off the parser's data without a null check — parse() always
        // assigns it, but the port's getter is nullable, so guard here.
        if(data === null)
        {
            return;
        }

        if(this._roomCreator !== null)
        {
            this._roomCreator.updateAreaHide(
                this._currentRoomId,
                data.furniId,
                data.on,
                data.rootX,
                data.rootY,
                data.width,
                data.length,
                data.invert
            );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onItemStateUpdate()
    onItemStateUpdate(event: IMessageEvent): void
    {
        const stateEvent = event as ItemStateUpdateMessageEvent;

        if(stateEvent === null)
        {
            return;
        }

        const parser = stateEvent.getParser() as ItemStateUpdateMessageParser;

        if(parser === null)
        {
            return;
        }

        if(this._roomCreator === null)
        {
            return;
        }

        this._roomCreator.updateObjectWallItemState(
            this._currentRoomId,
            parser.id,
            parser.state,
            parser.itemData
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onItemsStateUpdate()
    onItemsStateUpdate(event: IMessageEvent): void
    {
        const stateEvent = event as ItemsStateUpdateMessageEvent;

        if(stateEvent === null)
        {
            return;
        }

        const parser = stateEvent.getParser() as ItemsStateUpdateMessageParser;

        if(parser === null)
        {
            return;
        }

        if(this._roomCreator === null)
        {
            return;
        }

        for(let i = 0; i < parser.itemCount; i++)
        {
            const itemData = parser.getItemData(i);

            // AS3 dereferences getItemData(i) without a null check — the loop bound makes it
            // unreachable, but the port's return type is nullable, so guard here.
            if(itemData === null)
            {
                continue;
            }

            this._roomCreator.updateObjectWallItemState(
                this._currentRoomId,
                itemData.id,
                itemData.state,
                itemData.itemData
            );
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onItemDataUpdate()
    onItemDataUpdate(event: IMessageEvent): void
    {
        const dataEvent = event as ItemDataUpdateMessageEvent;

        if(dataEvent === null)
        {
            return;
        }

        const parser = dataEvent.getParser() as ItemDataUpdateMessageParser;

        if(parser === null)
        {
            return;
        }

        if(this._roomCreator === null)
        {
            return;
        }

        this._roomCreator.updateObjectWallItemData(
            this._currentRoomId,
            parser.id,
            parser.itemData
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onItemRemoveMultiple()
    onItemRemoveMultiple(event: IMessageEvent): void
    {
        const removeEvent = event as ItemRemoveMultipleMessageEvent;

        if(removeEvent === null)
        {
            return;
        }

        const parser = removeEvent.getParser() as ItemRemoveMultipleMessageParser;

        if(parser === null)
        {
            return;
        }

        if(this._roomCreator === null)
        {
            return;
        }

        for(const itemId of parser.itemIds)
        {
            this._roomCreator.disposeObjectWallItem(this._currentRoomId, itemId, parser.pickerId);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onObjectRemoveMultiple()
    onObjectRemoveMultiple(event: IMessageEvent): void
    {
        const removeEvent = event as ObjectRemoveMultipleMessageEvent;

        if(removeEvent === null)
        {
            return;
        }

        const parser = removeEvent.getParser() as ObjectRemoveMultipleMessageParser;

        if(parser === null)
        {
            return;
        }

        if(this._roomCreator === null)
        {
            return;
        }

        for(const id of parser.ids)
        {
            this._roomCreator.disposeObjectFurniture(this._currentRoomId, id, parser.pickerId);
        }

        this._roomCreator.refreshTileObjectMap(this._currentRoomId, 'RoomEngine.onObjectRemoveMultiple()');
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onItems()
    onItems(event: IMessageEvent): void
    {
        const itemsEvent = event as ItemsMessageEvent;

        if(itemsEvent === null) 
        {
            return;
        }

        const parser = itemsEvent.getParser() as ItemsMessageParser;

        if(parser === null) 
        {
            return;
        }

        const count = parser.itemCount;

        for(let i = 0; i < count; i++) 
        {
            const data = parser.getItem(i);

            if(data !== null) 
            {
                this.addWallItem(this._currentRoomId, data);
            }
        }
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onItemAdd()
    onItemAdd(event: IMessageEvent): void 
    {
        const addEvent = event as ItemAddMessageEvent;

        if(addEvent === null) 
        {
            return;
        }

        const parser = addEvent.getParser() as ItemAddMessageParser;

        if(parser === null) 
        {
            return;
        }

        const data = parser.data;

        if(data !== null) 
        {
            this.addWallItem(this._currentRoomId, data);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onItemUpdate()
    onItemUpdate(event: IMessageEvent): void 
    {
        const updateEvent = event as ItemUpdateMessageEvent;

        if(updateEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = updateEvent.getParser() as ItemUpdateMessageParser;

        if(parser === null) 
        {
            return;
        }

        const data = parser.data;

        const legacyWallGeometry = this.legacyWallGeometry;

        if(data !== null && legacyWallGeometry !== null)
        {
            // Convert wall coordinates to 3D world position using LegacyWallGeometry
            const location = legacyWallGeometry.getLocation(
                data.wallX, data.wallY, data.localX, data.localY, data.dir
            );
            const direction = new Vector3d(
                legacyWallGeometry.getDirection(data.dir)
            );

            this._roomCreator.updateObjectWallItem(
                this._currentRoomId,
                data.id,
                location,
                direction,
                data.state,
                data.data
            );
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onItemUpdate() — same drop as onObjectUpdate(): parsed and thrown away.
            this._roomCreator.updateObjectWallItemExpiryTime(this._currentRoomId, data.id, data.secondsToExpiration);
        }
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onItemRemove()
    onItemRemove(event: IMessageEvent): void 
    {
        const removeEvent = event as ItemRemoveMessageEvent;

        if(removeEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = removeEvent.getParser() as ItemRemoveMessageParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.disposeObjectWallItem(
            this._currentRoomId,
            parser.itemId,
            parser.pickerId
        );
    }

    /**
	 * The server's answer to a block/unblock. Resolves the account id to the avatar's room
	 * object through the session's user data, then marks the object blocked.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onBlockUserUpdate()
    onBlockUserUpdate(event: IMessageEvent): void
    {
        const blockEvent = event as BlockUserUpdateMessageEvent;

        if(blockEvent === null || this._roomCreator === null) return;

        const parser = blockEvent.getParser() as BlockUserUpdateMessageParser;

        if(parser === null) return;

        const session = this._roomCreator.roomSessionManager?.getSession(this._currentRoomId) ?? null;

        if(!session || !session.userDataManager) return;

        const userData = session.userDataManager.getUserData(parser.userId);

        if(userData === null) return;

        this._roomCreator.updateObjectUserBlocked(this._currentRoomId, userData.roomObjectId, parser.result === 1);
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onUsers()
    onUsers(event: IMessageEvent): void 
    {
        const usersEvent = event as UsersMessageEvent;

        if(usersEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = usersEvent.getParser() as UsersMessageParser;

        if(parser === null) 
        {
            return;
        }

        for(let i = 0; i < parser.userCount; i++)
        {
            const data = parser.getUser(i);

            if(data !== null)
            {
                this.addUser(this._currentRoomId, data);
            }
        }

        // AS3's last statement. The guide/requester ids survive a room change, and the avatars
        // that carry the marker only exist once this loop has added them — without this the
        // marker was applied to a room that had no users yet and never re-applied.
        this.updateGuideMarker();
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onUserUpdate()
    onUserUpdate(event: IMessageEvent): void 
    {
        const updateEvent = event as UserUpdateMessageEvent;

        if(updateEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = updateEvent.getParser() as UserUpdateMessageParser;

        if(parser === null) 
        {
            return;
        }

        for(let i = 0; i < parser.userCount; i++) 
        {
            const data = parser.getUser(i);

            if(data === null) 
            {
                continue;
            }

            const location: IVector3d = new Vector3d(data.x, data.y, data.z);
            const direction: IVector3d = new Vector3d(data.bodyDir);
            let target: IVector3d | null = null;

            if(data.isMoving) 
            {
                target = new Vector3d(data.targetX, data.targetY, data.targetZ);
            }

            let hasPosture = false;
            let posture = 'std';
            let postureParameter = '';
            let updateStandPosture = true;
            let hasMoveAction = false;
            let hasSwimAction = false;
            const actions = data.actions;

            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onUserUpdate() clears flat control before walking the actions, so a
            // user who has just lost their rights loses the marker. The port never reset it,
            // which left the marker on until the avatar was recreated.
            this._roomCreator.updateObjectUserFlatControl(this._currentRoomId, data.roomIndex, null);

            for(const action of actions) 
            {
                const actionType = action.actionType;
                const actionParameter = action.actionParameter;

                switch(actionType) 
                {
                    case 'flatctrl':
                        // Was a direct `updateObjectUserAction(AVATAR_FLAT_CONTROL, parseInt)`.
                        // AS3 passes the raw string through `updateObjectUserFlatControl()`, and
                        // `AvatarLogic` is what parses it — with a 0..5 range check the numeric
                        // short-circuit did not have.
                        this._roomCreator.updateObjectUserFlatControl(
                            this._currentRoomId,
                            data.roomIndex,
                            actionParameter
                        );
                        break;

                    case 'sign':
                        if(actions.length === 1) 
                        {
                            updateStandPosture = false;
                        }

                        this._roomCreator.updateObjectUserAction(
                            this._currentRoomId,
                            data.roomIndex,
                            RoomObjectVariableEnum.AVATAR_SIGN,
                            parseInt(actionParameter, 10) || 0
                        );
                        break;

                    case 'gst':
                        if(actions.length === 1) 
                        {
                            updateStandPosture = false;
                        }

                        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onUserUpdate() — the pet gesture. The port read the action
                        // and dropped it, so pets never gestured.
                        this._roomCreator.updateObjectPetGesture(
                            this._currentRoomId,
                            data.roomIndex,
                            actionParameter
                        );
                        break;

                    case 'wav':
                    case 'mv':
                        hasMoveAction = true;
                        hasPosture = true;
                        posture = actionType;
                        postureParameter = actionParameter;
                        break;

                    case 'swim':
                        hasSwimAction = true;
                        hasPosture = true;
                        posture = actionType;
                        postureParameter = actionParameter;
                        break;

                    case 'wf':
                    case 'trd':
                        break;

                    default:
                        hasPosture = true;
                        posture = actionType;
                        postureParameter = actionParameter;
                        break;
                }
            }

            if(!hasMoveAction && hasSwimAction) 
            {
                hasPosture = true;
                posture = 'float';
                postureParameter = '';
            }

            this._roomCreator.updateObjectUser(
                this._currentRoomId,
                data.roomIndex,
                location,
                target,
                data.canStandUp,
                data.localZ,
                direction,
                data.headDir,
                undefined,
                data.skipPositionUpdate
            );

            if(hasPosture) 
            {
                this._roomCreator.updateObjectUserPosture(
                    this._currentRoomId,
                    data.roomIndex,
                    posture,
                    postureParameter
                );
            }
            else if(updateStandPosture) 
            {
                this._roomCreator.updateObjectUserPosture(
                    this._currentRoomId,
                    data.roomIndex,
                    'std',
                    ''
                );
            }
        }
    }

    /**
     * Records which account id is the local player, so `onUsers()` can recognise its own avatar
     * among the room's occupants and hand its room index to `setOwnUserId()`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/room/_SafeCls_1984.as::onOwnUserEvent()
    onOwnUserEvent(event: IMessageEvent): void
    {
        const ownUserEvent = event as UserObjectMessageEvent;

        if(ownUserEvent === null) return;

        const parser = ownUserEvent.getParser() as UserObjectMessageParser;

        if(parser === null) return;

        this._ownUserId = parser.id;
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onUserRemove()
    onUserRemove(event: IMessageEvent): void
    {
        const removeEvent = event as UserRemoveMessageEvent;

        if(removeEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = removeEvent.getParser() as UserRemoveMessageParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.disposeObjectUser(this._currentRoomId, parser.roomIndex);
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onSlideUpdate()
    onSlideUpdate(event: IMessageEvent): void 
    {
        const slideEvent = event as SlideObjectBundleMessageEvent;

        if(slideEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = slideEvent.getParser() as SlideObjectBundleMessageParser;

        if(parser === null) 
        {
            return;
        }

        // Update roller state
        this._roomCreator.updateObjectFurniture(this._currentRoomId, parser.id, null, null, 1, null);
        this._roomCreator.updateObjectFurniture(this._currentRoomId, parser.id, null, null, 2, null);

        // Process sliding objects
        for(const obj of parser.objectList) 
        {
            this._roomCreator.updateObjectFurnitureLocation(
                this._currentRoomId,
                obj.id,
                obj.loc,
                null,
                obj.target
            );
        }

        // Process sliding avatar
        if(parser.avatar !== null) 
        {
            this._roomCreator.updateObjectUser(
                this._currentRoomId,
                parser.avatar.id,
                parser.avatar.loc,
                parser.avatar.target
            );
        }
    }

    addFloorFurniture(roomId: number, data: FurnitureFloorData): void 
    {
        if(data === null || this._roomCreator === null) 
        {
            return;
        }

        const location: IVector3d = new Vector3d(data.x, data.y, data.z);
        const direction: IVector3d = new Vector3d(data.dir);

        if(data.staticClass !== null) 
        {
            this._roomCreator.addObjectFurnitureByName(
                roomId,
                data.id,
                data.staticClass,
                location,
                direction,
                data.state,
                data.data,
                data.extra
            );
        }
        else 
        {
            this._roomCreator.addObjectFurniture(
                roomId,
                data.id,
                data.type,
                location,
                direction,
                data.state,
                data.data,
                data.extra,
                data.expiryTime,
                data.usagePolicy,
                data.ownerId,
                data.ownerName,
                true,
                true,
                data.sizeZ
            );
        }
    }

    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::addWallItem()
    addWallItem(roomId: number, data: FurnitureWallData): void 
    {
        if(data === null || this._roomCreator === null) 
        {
            return;
        }

        // AS3 resolves the geometry from this method's own `roomId` argument, not from
        // `_currentRoomId` (_SafeCls_1984.as::addWallItem() line 979) — every other wall-item
        // handler here uses the current room, this one uses the one it was handed.
        const legacyWallGeometry = this._roomCreator.getLegacyGeometry(roomId);

        if(legacyWallGeometry === null)
        {
            return;
        }

        // Convert wall coordinates to 3D world position using LegacyWallGeometry.
        // AS3 (_SafeCls_1984.as) branches on the wire format: the new format carries
        // wallX/wallY/localX/localY, the old one only y/z. The port always took the new
        // path, so old-format wall items were positioned with the wrong calculation.
        const location = data.isOldFormat
            ? legacyWallGeometry.getLocationOldFormat(data.y, data.z, data.dir)
            : legacyWallGeometry.getLocation(data.wallX, data.wallY, data.localX, data.localY, data.dir);
        const direction: IVector3d = new Vector3d(
            legacyWallGeometry.getDirection(data.dir)
        );

        this._roomCreator.addObjectWallItem(
            roomId,
            data.id,
            data.type,
            location,
            direction,
            data.state,
            data.data,
            data.usagePolicy,
            data.ownerId,
            data.ownerName,
            data.secondsToExpiration
        );
    }

    addUser(roomId: number, data: RoomUserData): void 
    {
        if(data === null || this._roomCreator === null) 
        {
            return;
        }

        const location: IVector3d = new Vector3d(data.x, data.y, data.z);
        const direction: IVector3d = new Vector3d(data.dir);

        this._roomCreator.addObjectUser(
            roomId,
            data.roomIndex,
            location,
            direction,
            data.dir,
            data.userType,
            data.figure
        );

        // Check if this is the own user
        if(data.webID === this._ownUserId)
        {
            this._roomCreator.setOwnUserId(roomId, data.roomIndex);
            // AS3 pairs these two. `setOwnUserId()` only records the index; this is what tells the
            // avatar object itself, through `RoomObjectAvatarOwnMessage`, and the visualization
            // needs it for everything that applies only to you. It was ported and never called.
            this._roomCreator.updateObjectUserOwnUserAvatar(roomId, data.roomIndex);
        }

        // Update user figure
        this._roomCreator.updateObjectUserFigure(
            roomId,
            data.roomIndex,
            data.figure,
            data.sex,
            data.subType,
            data.isRiding
        );

        // A monsterplant (pet type 16) carries its growth stage as a posture, and it is the only
        // pet type AS3 applies this to. `RoomUserData.petPosture` was parsed and read by nobody,
        // so every monsterplant in a room you walked into stood in its default pose.
        if(getUserTypeName(data.userType) === RoomObjectUserTypes.PET
            && this._roomCreator.getPetTypeId(data.figure) === RoomMessageHandler.MONSTERPLANT_PET_TYPE_ID)
        {
            this._roomCreator.updateObjectUserPosture(roomId, data.roomIndex, data.petPosture, '');
        }

        // The muted marker on entry. `onIgnoreResult()` already handles ignoring someone WHILE in
        // the room; this is the other half, and without it walking into a room showed everyone on
        // your ignore list as though they were not. AS3 does it here, per user, behind the same
        // flag.
        if(this._roomCreator.configuration?.getBoolean('avatar.ignored.bubble.enabled'))
        {
            this._roomCreator.updateObjectUserAction(
                roomId,
                data.roomIndex,
                RoomObjectVariableEnum.AVATAR_IS_MUTED,
                this._roomCreator.sessionDataManager?.isIgnored(data.webID) === true ? 1 : 0
            );
        }
    }

    /**
     * `34` and the whole 200-299 block are the notification styles — the server talking, not a
     * user — so no avatar animates for them.
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::styleIsNotification()
    private styleIsNotification(styleId: number): boolean
    {
        return styleId === 34 || (styleId >= 200 && styleId < 300);
    }

    /**
     * Chat, whisper and shout, from the room engine's side: the speaker's gesture and the
     * mouth-flap that lasts as long as the sentence.
     *
     * This is not the chat bubble — `session/handler/RoomChatHandler` does that, and AS3 subscribes
     * both to the same three messages. Only the bubble half was ported, so avatars stood still
     * while they talked. `figure_talk` is `ceil(text.length / 10)`, AS3's own estimate of how long
     * the sentence takes to say.
     *
     * The whisper branch skips your own whisper: you already know you said it, and AS3 returns
     * before touching the object.
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onChat()
    onChat(event: IMessageEvent): void
    {
        if(this._roomCreator === null) return;

        const parser = event.parser as ChatMessageEventParser | null;

        if(parser === null) return;

        if(event instanceof WhisperMessageEvent)
        {
            const session = this._roomCreator.roomSessionManager?.getSession(this._currentRoomId) ?? null;

            if(session !== null && parser.userId === session.ownUserRoomId) return;
        }

        if(this.styleIsNotification(parser.styleId)) return;

        this._roomCreator.updateObjectUserGesture(this._currentRoomId, parser.userId, parser.gesture);
        this._roomCreator.updateObjectUserAction(
            this._currentRoomId,
            parser.userId,
            RoomObjectVariableEnum.AVATAR_TALK,
            Math.ceil(parser.text.length / 10)
        );
    }

    /**
     * Ignoring someone puts the muted marker on their avatar; un-ignoring takes it off.
     *
     * `IgnoredUsersManager` keeps the list — that half was ported — but nothing told the room
     * object, so the avatar looked exactly the same either way. Results 1 and 2 (`OK` and
     * `ALREADY_IGNORED`, after AS3's `result - 1` rebase) mute, 3 unmutes, and anything else is
     * left alone.
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onIgnoreResult()
    onIgnoreResult(event: IMessageEvent): void
    {
        if(this._roomCreator === null) return;

        if(!this._roomCreator.configuration?.getBoolean('avatar.ignored.bubble.enabled')) return;

        const ignoreEvent = event as IgnoreResultMessageEvent;
        const session = this._roomCreator.roomSessionManager?.getSession(this._currentRoomId) ?? null;
        const userData = session?.userDataManager?.getUserData(ignoreEvent.userId) ?? null;

        if(userData === null) return;

        switch(ignoreEvent.result)
        {
            case IgnoreResult.IGNORED:
            case IgnoreResult.IGNORED_LIST_FULL:
                this._roomCreator.updateObjectUserAction(
                    this._currentRoomId, userData.roomObjectId, RoomObjectVariableEnum.AVATAR_IS_MUTED, 1
                );
                break;
            case IgnoreResult.UNIGNORED:
                this._roomCreator.updateObjectUserAction(
                    this._currentRoomId, userData.roomObjectId, RoomObjectVariableEnum.AVATAR_IS_MUTED, 0
                );
                break;
        }
    }

    /**
     * Handle user typing status update.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onTypingStatus
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onTypingStatus()
    onTypingStatus(event: IMessageEvent): void 
    {
        const typingEvent = event as UserTypingMessageEvent;

        if(typingEvent === null) 
        {
            return;
        }

        const parser = typingEvent.getParser() as UserTypingMessageEventParser;

        if(parser === null) 
        {
            return;
        }

        const value = parser.isTyping ? 1 : 0;

        this._roomCreator?.updateObjectUserAction(
            this._currentRoomId,
            parser.userId,
            RoomObjectVariableEnum.AVATAR_IS_TYPING,
            value
        );
    }

    /**
     * Handle user expression update.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onExpression
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onExpression()
    onExpression(event: IMessageEvent): void 
    {
        const expressionEvent = event as ExpressionMessageEvent;

        if(expressionEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = expressionEvent.getParser() as ExpressionMessageEventParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.updateObjectUserAction(
            this._currentRoomId,
            parser.userId,
            RoomObjectVariableEnum.AVATAR_EXPRESSION,
            parser.expressionType
        );
    }

    /**
     * Handle user dance update.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onDance
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onDance()
    onDance(event: IMessageEvent): void 
    {
        const danceEvent = event as DanceMessageEvent;

        if(danceEvent === null || danceEvent.getParser() === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = danceEvent.getParser() as DanceMessageEventParser;

        this._roomCreator.updateObjectUserAction(
            this._currentRoomId,
            parser.userId,
            RoomObjectVariableEnum.AVATAR_DANCE,
            parser.danceStyle
        );
    }

    /**
     * Handle avatar effect update.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onAvatarEffect
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onAvatarEffect()
    onAvatarEffect(event: IMessageEvent): void 
    {
        const effectEvent = event as AvatarEffectMessageEvent;

        if(effectEvent === null || effectEvent.getParser() === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = effectEvent.getParser() as AvatarEffectMessageEventParser;

        this._roomCreator.updateObjectUserEffect(
            this._currentRoomId,
            parser.userId,
            parser.effectId,
            parser.delayMilliSeconds
        );
    }

    /**
     * Handle avatar sleep status update.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onAvatarSleep
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onAvatarSleep()
    onAvatarSleep(event: IMessageEvent): void 
    {
        const sleepEvent = event as SleepMessageEvent;

        if(sleepEvent === null || sleepEvent.getParser() === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = sleepEvent.getParser() as SleepMessageEventParser;

        const value = parser.sleeping ? 1 : 0;

        this._roomCreator.updateObjectUserAction(
            this._currentRoomId,
            parser.userId,
            RoomObjectVariableEnum.AVATAR_SLEEP,
            value
        );
    }

    /**
     * Handle carry object update.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onCarryObject
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onCarryObject()
    onCarryObject(event: IMessageEvent): void 
    {
        if(this._roomCreator === null) 
        {
            return;
        }

        const carryEvent = event as CarryObjectMessageEvent;

        if(carryEvent === null) 
        {
            return;
        }

        const parser = carryEvent.getParser() as CarryObjectMessageEventParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.updateObjectUserAction(
            this._currentRoomId,
            parser.userId,
            RoomObjectVariableEnum.AVATAR_CARRY_OBJECT,
            parser.itemType
        );
    }

    /**
     * Handle use object update.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onUseObject
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onUseObject()
    onUseObject(event: IMessageEvent): void 
    {
        if(this._roomCreator === null) 
        {
            return;
        }

        const useEvent = event as UseObjectMessageEvent;

        if(useEvent === null) 
        {
            return;
        }

        const parser = useEvent.getParser() as UseObjectMessageEventParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.updateObjectUserAction(
            this._currentRoomId,
            parser.userId,
            RoomObjectVariableEnum.AVATAR_USE_OBJECT,
            parser.itemType
        );
    }

    /**
     * Handle user figure change.
     * Based on AS3: com.sulake.habbo.room.RoomMessageHandler.onUserChange
     */
    // AS3: .../src/com/sulake/habbo/room/_SafeCls_1984.as::onUserChange()
    onUserChange(event: IMessageEvent): void 
    {
        const changeEvent = event as UserChangeMessageEvent;

        if(changeEvent === null) 
        {
            return;
        }

        if(this._roomCreator === null) 
        {
            return;
        }

        const parser = changeEvent.getParser() as UserChangeMessageEventParser;

        if(parser === null) 
        {
            return;
        }

        this._roomCreator.updateObjectUserFigure(
            this._currentRoomId,
            parser.id,
            parser.figure,
            parser.sex
        );
    }

    // look, so it's treated the same as "not sent" here.
    private normalizeRoomPropertyValue(value: string | null): string | null
    {
        return value === '0' ? null : value;
    }
}
