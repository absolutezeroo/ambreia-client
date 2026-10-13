import type {
    ComposerClass,
    EventClass,
    IMessageConfiguration,
} from '@ambreia/net/messages/IMessageConfiguration';
import {
    Logger,
} from '@ambreia/common/utils/Logger';

// Incoming Events - Handshake
import {
    AuthenticationOKMessageEvent,
    CompleteDiffieHandshakeMessageEvent,
    DisconnectReasonMessageEvent,
    InitDiffieHandshakeMessageEvent,
    PingMessageEvent,
    UserObjectMessageEvent,
    UserRightsMessageEvent,
} from './incoming/handshake/index';

// Incoming Events - Availability
import {
    MaintenanceStatusMessageEvent,
} from './incoming/availability/index';

// Incoming Events - Avatar
import {
    FigureUpdateMessageEvent,
} from './incoming/avatar/index';

// Incoming Events - Notifications
import {
    NotificationDialogMessageEvent,
} from './incoming/notifications/index';

// Incoming Events - Room Session
import {
    CantConnectMessageEvent,
    CloseConnectionMessageEvent,
    HanditemConfigurationMessageEvent,
    OpenConnectionMessageEvent,
    RoomForwardMessageEvent,
    RoomReadyMessageEvent,
} from './incoming/room/session/index';

// Incoming Events - Room Layout
import {
    RoomEntryTileMessageEvent,
} from './incoming/room/layout/index';

// Incoming Events - Room Permissions
import {
    YouAreControllerMessageEvent,
    YouAreNotControllerMessageEvent,
    YouAreOwnerMessageEvent,
} from './incoming/room/permissions/index';

// Incoming Events - Room Engine
import {
    FloorHeightMapMessageEvent,
    FurnitureAliasesMessageEvent,
    HeightMapMessageEvent,
    HeightMapUpdateMessageEvent,
    ItemAddMessageEvent,
    ItemDataUpdateMessageEvent,
    ItemRemoveMessageEvent,
    ItemsMessageEvent,
    ItemStateUpdateMessageEvent,
    ItemUpdateMessageEvent,
    ObjectAddMessageEvent,
    ObjectDataUpdateMessageEvent,
    ObjectRemoveMessageEvent,
    ObjectsMessageEvent,
    ObjectUpdateMessageEvent,
    RoomEntryInfoMessageEvent,
    RoomPropertyMessageEvent,
    RoomVisualizationSettingsEvent,
    UserRemoveMessageEvent,
    UsersMessageEvent,
    UserUpdateMessageEvent,
} from './incoming/room/engine/index';

// Incoming Events - Room Action
import {
    CarryObjectMessageEvent,
    UserChangeMessageEvent,
} from './incoming/room/action/index';

// Outgoing Composers - Handshake & Core
import {
    ClientHelloMessageComposer,
    CompleteDiffieHandshakeMessageComposer,
    DisconnectMessageComposer,
    InfoRetrieveMessageComposer,
    InitDiffieHandshakeMessageComposer,
    PongMessageComposer,
    SSOTicketMessageComposer,
    UniqueIDMessageComposer,
    VersionCheckMessageComposer,
} from './outgoing/index';

// Outgoing Composers - Room Session
import {
    OpenFlatConnectionMessageComposer,
    QuitMessageComposer,
} from './outgoing/room/session/index';

// Outgoing Composers - Room Engine
import {
    GetFurnitureAliasesMessageComposer,
    MoveAvatarMessageComposer,
} from './outgoing/room/engine/index';

// Outgoing Composers - Room Chat

// Outgoing Composers - Room Furniture
import {UseFurnitureMessageComposer} from './outgoing/room/furniture/UseFurnitureMessageComposer';
import {UseWallItemMessageComposer} from './outgoing/room/furniture/UseWallItemMessageComposer';
import {Incoming, Outgoing} from './Headers.generated';

// Outgoing Composers - Room Avatar
import {
    LookToMessageComposer,
} from './outgoing/room/avatar/index';

const log = Logger.getLogger('habbo.communication.HabboMessages');

/**
 * A `Map` that refuses to lose an entry quietly.
 *
 * Registering two classes under one header used to be invisible: the second `set()` replaced the
 * first, `MessageRegistry` then only ever saw the survivor, and the loser surfaced much later — if
 * at all — as a bare "Unknown message event class" from whichever handler happened to register it.
 * That is how `GuestRoomSearchResultMessageEvent` sat on 1265 (the Wired trigger's header) with no
 * id of its own. A collision here is always a bug in one of the two headers, never a policy.
 *
 * This has no AS3 counterpart: AS3 assigns into a plain array (`_SafeStr_4546[id] = cls`) and has
 * the same hazard, but its ids came from the compiler rather than from being recovered by hand.
 */
class HeaderMap<T> extends Map<number, T>
{
    constructor(private readonly _kind: string)
    {
        super();
    }

    override set(id: number, value: T): this
    {
        const existing = this.get(id);

        if(existing !== undefined && existing !== value)
        {
            log.error(
                `Duplicate ${this._kind} header ${id}: ${(value as {name?: string}).name ?? value} would replace `
                + `${(existing as {name?: string}).name ?? existing}. One of the two headers is wrong — the replaced `
                + 'class ends up with no id and never fires. Check the WIN63 registry (_SafeCls_2046.as).'
            );
        }

        return super.set(id, value);
    }
}

/**
 * Habbo message configuration
 * Maps message IDs to their composer and event classes
 */
export class HabboMessages implements IMessageConfiguration
{
    constructor()
    {
        this.registerEvents();
        this.registerComposers();
    }

    private _events: Map<number, EventClass> = new HeaderMap<EventClass>('incoming event');

    // AS3: .../src/com/sulake/habbo/communication/_SafeCls_2046.as::get events()
    get events(): Map<number, EventClass>
    {
        return this._events;
    }

    // AS3: .../src/com/sulake/habbo/communication/_SafeCls_2046.as::_composers
    private _composers: Map<number, ComposerClass> = new HeaderMap<ComposerClass>('outgoing composer');

    // AS3: .../src/com/sulake/habbo/communication/_SafeCls_2046.as::get composers()
    get composers(): Map<number, ComposerClass>
    {
        return this._composers;
    }

    /**
     * Register incoming message events (Server -> Client)
     */
    private registerEvents(): void 
    {
        // === HANDSHAKE ===
        this._events.set(Incoming.InitDiffieHandshakeComposer, InitDiffieHandshakeMessageEvent);
        this._events.set(Incoming.CompleteDiffieHandshakeComposer, CompleteDiffieHandshakeMessageEvent);
        this._events.set(Incoming.AuthenticationOKMessageComposer, AuthenticationOKMessageEvent);
        this._events.set(Incoming.DisconnectReasonComposer, DisconnectReasonMessageEvent);

        // === SESSION ===
        this._events.set(Incoming.PingMessageComposer, PingMessageEvent);
        this._events.set(Incoming.UserRightsMessageComposer, UserRightsMessageEvent);
        this._events.set(Incoming.UserObjectComposer, UserObjectMessageEvent);

        // === AVAILABILITY ===
        this._events.set(Incoming.MaintenanceStatusMessageComposer, MaintenanceStatusMessageEvent);

        // === AVATAR ===
        this._events.set(Incoming.FigureUpdateComposer, FigureUpdateMessageEvent);

        // === ROOM SESSION ===
        this._events.set(Incoming.RoomReadyMessageComposer, RoomReadyMessageEvent);
        this._events.set(Incoming.OpenConnectionMessageComposer, OpenConnectionMessageEvent);
        this._events.set(Incoming.CloseConnectionMessageComposer, CloseConnectionMessageEvent);
        this._events.set(Incoming.HanditemConfigurationMessageComposer, HanditemConfigurationMessageEvent);
        this._events.set(Incoming.RoomForwardMessageComposer, RoomForwardMessageEvent);
        this._events.set(Incoming.CantConnectMessageComposer, CantConnectMessageEvent);

        // === ROOM PERMISSIONS ===
        this._events.set(Incoming.YouAreControllerMessageComposer, YouAreControllerMessageEvent);
        this._events.set(Incoming.YouAreNotControllerMessageComposer, YouAreNotControllerMessageEvent);
        this._events.set(Incoming.YouAreOwnerMessageComposer, YouAreOwnerMessageEvent);

        // === ROOM ENGINE ===
        this._events.set(Incoming.FloorHeightMapMessageComposer, FloorHeightMapMessageEvent);
        this._events.set(Incoming.FurnitureAliasesMessageComposer, FurnitureAliasesMessageEvent);
        this._events.set(Incoming.HeightMapMessageComposer, HeightMapMessageEvent);
        this._events.set(Incoming.HeightMapUpdateMessageComposer, HeightMapUpdateMessageEvent);
        this._events.set(Incoming.RoomEntryTileMessageComposer, RoomEntryTileMessageEvent);
        this._events.set(Incoming.RoomEntryInfoMessageComposer, RoomEntryInfoMessageEvent);
        this._events.set(Incoming.ObjectsMessageComposer, ObjectsMessageEvent);
        this._events.set(Incoming.ObjectAddMessageComposer, ObjectAddMessageEvent);
        this._events.set(Incoming.ObjectUpdateMessageComposer, ObjectUpdateMessageEvent);
        this._events.set(Incoming.ObjectRemoveMessageComposer, ObjectRemoveMessageEvent);
        this._events.set(Incoming.ObjectDataUpdateMessageComposer, ObjectDataUpdateMessageEvent);
        this._events.set(Incoming.ItemsMessageComposer, ItemsMessageEvent);
        this._events.set(Incoming.ItemAddMessageComposer, ItemAddMessageEvent);
        this._events.set(Incoming.ItemUpdateMessageComposer, ItemUpdateMessageEvent);
        this._events.set(Incoming.ItemRemoveMessageComposer, ItemRemoveMessageEvent);
        this._events.set(Incoming.ItemStateUpdateMessageComposer, ItemStateUpdateMessageEvent);
        this._events.set(Incoming.ItemDataUpdateMessageComposer, ItemDataUpdateMessageEvent);
        this._events.set(Incoming.UsersMessageComposer, UsersMessageEvent);
        this._events.set(Incoming.UserUpdateMessageComposer, UserUpdateMessageEvent);
        this._events.set(Incoming.UserRemoveMessageComposer, UserRemoveMessageEvent);
        this._events.set(Incoming.RoomPropertyMessageComposer, RoomPropertyMessageEvent);
        this._events.set(Incoming.RoomVisualizationSettingsComposer, RoomVisualizationSettingsEvent);

        // === ROOM ACTION ===
        this._events.set(Incoming.CarryObjectMessageComposer, CarryObjectMessageEvent);
        this._events.set(Incoming.UserChangeMessageComposer, UserChangeMessageEvent);

        // === NOTIFICATIONS (extended) ===
        // AS3: sources/win63_version/habbo/communication/class_1881.as — name_1[2806] = ElementPointerMessageEvent
        this._events.set(Incoming.NotificationDialogMessageComposer, NotificationDialogMessageEvent);
    }

    /**
     * Register outgoing message composers (Client -> Server)
     */
    private registerComposers(): void
    {
        // === HANDSHAKE ===
        this._composers.set(Outgoing.ClientHelloMessageEvent, ClientHelloMessageComposer);
        this._composers.set(Outgoing.InitDiffieHandshakeMessageEvent, InitDiffieHandshakeMessageComposer);
        this._composers.set(Outgoing.CompleteDiffieHandshakeMessageEvent, CompleteDiffieHandshakeMessageComposer);
        this._composers.set(Outgoing.VersionCheckMessageEvent, VersionCheckMessageComposer);
        this._composers.set(Outgoing.SSOTicketMessageEvent, SSOTicketMessageComposer);
        this._composers.set(Outgoing.UniqueIDMessageEvent, UniqueIDMessageComposer);

        // === SESSION ===
        this._composers.set(Outgoing.PongMessageEvent, PongMessageComposer);
        this._composers.set(Outgoing.DisconnectMessageEvent, DisconnectMessageComposer);
        this._composers.set(Outgoing.InfoRetrieveMessageEvent, InfoRetrieveMessageComposer);

        // === ROOM SESSION ===
        this._composers.set(Outgoing.OpenFlatConnectionMessageEvent, OpenFlatConnectionMessageComposer);
        this._composers.set(Outgoing.QuitMessageEvent, QuitMessageComposer);

        // === ROOM AVATAR ===
        this._composers.set(Outgoing.LookToMessageEvent, LookToMessageComposer);

        // === ROOM FURNITURE ===
        this._composers.set(Outgoing.UseFurnitureMessageEvent, UseFurnitureMessageComposer);
        this._composers.set(Outgoing.UseWallItemMessageEvent, UseWallItemMessageComposer);

        // === ROOM ENGINE ===
        this._composers.set(Outgoing.GetFurnitureAliasesMessageEvent, GetFurnitureAliasesMessageComposer);
        this._composers.set(Outgoing.MoveAvatarMessageEvent, MoveAvatarMessageComposer);
    }
}
