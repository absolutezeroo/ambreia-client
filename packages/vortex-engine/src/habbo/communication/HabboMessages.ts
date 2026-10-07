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
} from './messages/incoming/handshake';

// Incoming Events - Availability
import {
    MaintenanceStatusMessageEvent,
} from './messages/incoming/availability';

// Incoming Events - Avatar
import {
    FigureUpdateMessageEvent,
} from './messages/incoming/avatar';

// Incoming Events - Navigator
import {
    RoomRatingMessageEvent,
} from './messages/incoming/navigator';

// Incoming Events - Notifications
// Incoming Events - Notifications (extended)
import {
    NotificationDialogMessageEvent,
} from './messages/incoming/notifications';

// Incoming Events - Inventory

// Incoming Events - Catalog

// Incoming Events - Marketplace

// Incoming Events - Landing View

// Incoming Events - Competition

// Incoming Events - Quest

// Incoming Events - Achievements

// Incoming Events - Room Session
import {
    CantConnectMessageEvent,
    CloseConnectionMessageEvent,
    HanditemConfigurationMessageEvent,
    OpenConnectionMessageEvent,
    RoomForwardMessageEvent,
    RoomReadyMessageEvent,
} from './messages/incoming/room/session';

// Incoming Events - Room Layout
import {
    RoomEntryTileMessageEvent,
} from './messages/incoming/room/layout';

// Incoming Events - Room Permissions
import {
    YouAreControllerMessageEvent,
    YouAreNotControllerMessageEvent,
    YouAreOwnerMessageEvent,
} from './messages/incoming/room/permissions';

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
} from './messages/incoming/room/engine';

// Incoming Events - Room Chat

// Incoming Events - Room Furniture

// Incoming Events - Room Pet

// Incoming Events - Room Rentable Bot

// Outgoing Composers - Youtube display furni

// Incoming Events - Youtube display furni

// Outgoing Composers - Crafting

// Incoming Events - Crafting

// Onboarding (new user flow) — the starter-room pick and the figure save. Imported by path: the
// nux/ barrels are generated and do not list these yet.
// The NUX dialogs (habbo/nux/HabboNuxDialogs): the phone-verification offer and the gift picker.
// The rentable-space furniture (habbo/ui/handler/RentableSpaceWidgetHandler).
// SMS identity verification (habbo/phonenumber/HabboPhoneNumber). AS3 files these under
// incoming|outgoing/gifts/; this port keeps the phone composers in outgoing/preferences/.

// Incoming Events - Help (name change events)

// Incoming Events - Error

// Incoming Events - Users

// Incoming Events - Preferences

// Incoming Events - Discord

// Incoming Events - Perk

// Incoming Events - Chat styles

// Incoming Events - Campaign

// Incoming Events - Advertisement

// Incoming Events - Tracking

// Incoming Events - Friendlist

// Incoming Events - Room Action
import {
    AvatarEffectMessageEvent,
    CarryObjectMessageEvent,
    DanceMessageEvent,
    UserChangeMessageEvent,
} from './messages/incoming/room/action';

// Incoming Events - New Navigator

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
} from './messages/outgoing';

// Outgoing Composers - Navigator

// Outgoing Composers - New Navigator

// Outgoing Composers - Room Session
import {
    OpenFlatConnectionMessageComposer,
    QuitMessageComposer,
} from './messages/outgoing/room/session';

// Outgoing Composers - Room Engine
import {
    GetFurnitureAliasesMessageComposer,
    MoveAvatarMessageComposer,
} from './messages/outgoing/room/engine';

// Outgoing Composers - Room Chat

// Outgoing Composers - Room Avatar
import {
    LookToMessageComposer,
} from './messages/outgoing/room/avatar';

// Outgoing Composers - Room Action

// Incoming Events - Room Settings

// Outgoing Composers - Room (settings)

// Outgoing Composers - Room (root)

// Outgoing Composers - Discord

// Outgoing Composers - Preferences

// Outgoing Composers - Sound

// Incoming Events - Friendship furni (love lock and friends)

// Outgoing Composers - Sound

// Outgoing Composers - Room Furniture

// Outgoing Composers - Room Rentable Bots

// Outgoing Composers - Room Pet

// Outgoing Composers - Landing View

// Outgoing Composers - Catalog

// Outgoing Composers - Marketplace

// Outgoing Composers - Quest

// Outgoing Composers - Achievements

// Outgoing Composers - Talent

// Outgoing Composers - Competition

// Outgoing Composers - Notifications

// Outgoing Composers - Tracking

// Outgoing Composers - Friendlist

// Outgoing Composers - Campaign

// Outgoing Composers - Advertisement

// Outgoing Composers - Handshake (NUX)

// Outgoing Composers - Inventory

// Vortex-specific (no AS3 backing) - furni editor and fishing

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
        this._events.set(3309, InitDiffieHandshakeMessageEvent);
        this._events.set(3401, CompleteDiffieHandshakeMessageEvent);
        this._events.set(230, AuthenticationOKMessageEvent);
        this._events.set(4000, DisconnectReasonMessageEvent);

        // === SESSION ===
        this._events.set(1407, PingMessageEvent);
        this._events.set(3599, UserRightsMessageEvent);
        this._events.set(3985, UserObjectMessageEvent);
        // AS3: header corrected 3913 -> 70 - was swapped with AccountSafetyLockStatusChangeMessageEvent.
        // _SafeCls_2046.as: _SafeStr_4546[70] = _SafeCls_2080, whose only member is `get noobnessLevel():int`.

        // === AVAILABILITY ===
        // AS3: header corrected 184 -> 1737 - was swapped with InfoHotelClosingMessageEvent.
        // sources/WIN63-202607011411-782849652 unknowns/_SafePkg_2018/_SafeCls_3162.as
        // (isInMaintenance, minutesUntilMaintenance, conditional duration) matches this
        // parser exactly and is registered at 1737, not 184.
        this._events.set(1737, MaintenanceStatusMessageEvent);

        // === AVATAR ===
        this._events.set(132, FigureUpdateMessageEvent);

        // === NAVIGATOR ===
        // AS3: header corrected 3796 -> 3081 (_SafeCls_3187, onFavouriteChanged in
        // com/sulake/habbo/navigator/_SafeCls_1951.as / _SafeCls_2208.as). Header 3796
        // there is really onPetFigureUpdate (_SafeCls_2731), an unrelated, unported message.
        // The room's flood sensitivity on its own. `vortex-emulator` sends it from the room
        // settings dialog; nothing here listened, so the chat flow kept the default forever.
        // AS3: header corrected 1265 -> 160 (_SafeCls_3509, whose parser _SafeCls_4150 builds the
        // searchType/searchParam/rooms/ad data class _SafeCls_3104 — WIN63 registry _SafeCls_2046.as
        // l.1262). 1265 is really the Wired furni-trigger push (_SafeCls_3224, registered below at
        // l.1127), and because `_events` is a Map the later `set(1265, ...)` silently replaced this
        // entry, so GuestRoomSearchResultMessageEvent had no id at all.
        this._events.set(2502, RoomRatingMessageEvent);

        // === RAID PROTECTION ===
        // These three exist only in AIR-1.0.31 — no WIN63 build has the feature at all, so there
        // is no 20260701 header to recover and none of the three names is recoverable either
        // (every class is obfuscated in the one tree that has them). AIR's own ids cannot simply
        // be reused: it re-randomises the whole registry, and two of the three collide with
        // messages this revision already uses. So the ids below are *assigned* in 20260701
        // numbering, and must be assigned identically in the emulator's Headers.cs:
        //
        //   AIR  734 -> 3554  (734 is ChatReviewSessionOfferedToGuide here)
        //   AIR 3553 -> 3553  (free on both sides, so AIR's own id is kept)
        //   AIR 3620 -> 3555  (3620 is SecondsUntil here)
        //
        // 3554 and 3555 were picked as the first ids after 3553 that are unused as an event AND
        // as a composer in the WIN63 registry, in this file, and in the emulator.

        // === NOTIFICATIONS ===
        // Header from the WIN63 registry: _SafeStr_4546[2046] = _SafeCls_2011
        // (sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as),
        // corroborated by the emulator's Revision20260701 Headers.cs. The 2016-era 1016 that
        // win63_version and Nitro carry is a different build's number.

        // === INVENTORY ===
        // AS3: header corrected 2475 -> 2405 (_SafeCls_2835, onAvatarEffects in
        // com/sulake/habbo/inventory/_SafeCls_1951.as). Header 2475 there is really
        // onPostMessageMessage (_SafeCls_3133, GroupForumController.as), an unrelated,
        // unported message.
        // Discrete avatar-effect push updates (owned by inventory/_SafeCls_1951.as).
        // IDs from com/sulake/habbo/communication/_SafeCls_2046.as.
        // The avatar editor's two remaining incoming messages. 3629 is *not* the room-effect push
        // (that is 2624, AvatarEffectMessageEvent) — both ids are real and carry different payloads.
        // The avatar editor's hot-looks page.

        // === INVENTORY - FURNI ===
        // AS3: header corrected 3790 -> 1856 (_SafeCls_2440, onFurniListInvalidate,
        // confirmed also at com/sulake/habbo/ui/handler/CraftingWidgetHandler.as:223).
        // Header 3790 there is really onTreasureHuntFail (_SafeCls_3474), an unrelated,
        // unported message.

        // === INVENTORY - BADGES ===
        // AS3: header corrected 1091 -> 2748 (_SafeCls_3926, onBadges in
        // com/sulake/habbo/inventory/_SafeCls_1951.as, also seen at
        // catalog/clubcenter/HabboClubCenter.as:120). Header 1091 there is really
        // onCollectibleMintingEnabledMessage (_SafeCls_2669), an unrelated, unported message.
        // AS3: _SafeStr_4546[2840] = _SafeCls_3204 in the registry
        // com/sulake/habbo/communication/_SafeCls_2046.as:1467 (onBadgeReceived, registered twice —
        // habbo/inventory/_SafeCls_1951.as:200 and habbo/notifications/_SafeCls_1951.as:129).
        // Corroborated by the emulator's own BadgeReceivedComposer = 2840.
        // AS3: WIN63's registry, `_SafeStr_4546[1153] = _SafeCls_3875` — the badge-display
        // furni's rarity/owner-count lookup. The emulator does not implement it.

        // === INVENTORY - PETS ===

        // === INVENTORY - BOTS ===
        // AS3: header corrected 2902 -> 682 (_SafeCls_3058, onBots in
        // com/sulake/habbo/inventory/_SafeCls_1951.as:168). Header 2902 there is really
        // onGameStarted (_SafeCls_3582), an unrelated, unported message.
        // The two single-bot deltas, both from WIN63's own registry (`_SafeStr_4546[3570]` =
        // _SafeCls_3954 / `[2032]` = _SafeCls_3331) and corroborated by the emulator
        // (BotAddedToInventoryComposer / BotRemovedFromInventoryComposer). Without them a bought bot
        // only appeared after a full re-request, and a placed one stayed in the grid.

        // === INVENTORY - TRADING ===
        // The five the trade window needs to explain a refusal or price a web3 trade. IDs from
        // WIN63's registry (`_SafeStr_4546[2855]/[814]/[2294]/[1490]/[3497]`), each corroborated by
        // the emulator (TradeOpenFailed / TradingOtherNotAllowed / TradingYouAreNotAllowed /
        // TradeSilverSet / TradeSilverFee MessageComposer). All five route to
        // `TradingModel.handleMessageEvent()`, as they do in AS3.

        // === GROUP FORUMS ===
        // `_events[1373]/[1222]/[3603]/[3965]/[866]/[2475]/[2988]/[956]/[1146]` in WIN63's
        // registry, each resolved through GroupForumController's own listener registrations —
        // the callback names there (onForumsList, onThreadList, …) are what disambiguate the four
        // pairs that share a wire shape.

        // === INVENTORY - UNSEEN ===

        // === HANDSHAKE (continued) ===

        // === NEW NAVIGATOR ===
        // AS3: header corrected 866 -> 432 - _SafeCls_2046.as: _SafeStr_4546[432] = _SafeCls_3072, whose parser
        // reads `savedSearches:Vector`. 866 is the unread-forums count (parser exposes `unreadForumsCount:int`).

        // === ROOM SESSION ===
        this._events.set(2349, RoomReadyMessageEvent);
        this._events.set(611, OpenConnectionMessageEvent);
        this._events.set(3404, CloseConnectionMessageEvent);
        // AS3: header corrected 1856 -> 412 (_SafeCls_3717, onYouAreNotSpectator,
        // com/sulake/habbo/room/_SafeCls_1984.as:286). Header 1856 there is really
        // onFurniListInvalidate (_SafeCls_2440), which has moved here from 3790 - see
        // the INVENTORY - FURNI section above.
        // Header 2942 (_SafeCls_3587, onConfigurationItemStates, parser _SafeCls_3235). The shape
        // gap this used to flag is closed: HanditemConfigurationMessageEventParser now reads
        // chooserDisabled / freeFurniMovementsEnabled / invisibleFurni, each behind its own
        // bytes-available guard exactly as AS3 does. The emulator writes only the first boolean,
        // which the guards already tolerate.
        this._events.set(2942, HanditemConfigurationMessageEvent);
        this._events.set(3339, RoomForwardMessageEvent);
        this._events.set(2430, CantConnectMessageEvent);

        // === ROOM PERMISSIONS ===
        this._events.set(934, YouAreControllerMessageEvent);
        this._events.set(456, YouAreNotControllerMessageEvent);
        this._events.set(1986, YouAreOwnerMessageEvent);

        // === ROOM ENGINE ===
        this._events.set(2885, FloorHeightMapMessageEvent);
        this._events.set(154, FurnitureAliasesMessageEvent);
        this._events.set(2260, HeightMapMessageEvent);
        this._events.set(3279, HeightMapUpdateMessageEvent);
        this._events.set(2792, RoomEntryTileMessageEvent);
        this._events.set(2914, RoomEntryInfoMessageEvent);
        this._events.set(2104, ObjectsMessageEvent);
        this._events.set(368, ObjectAddMessageEvent);
        this._events.set(114, ObjectUpdateMessageEvent);
        this._events.set(1916, ObjectRemoveMessageEvent);
        this._events.set(2329, ObjectDataUpdateMessageEvent);
        this._events.set(3379, ItemsMessageEvent);
        this._events.set(3733, ItemAddMessageEvent);
        this._events.set(1198, ItemUpdateMessageEvent);
        this._events.set(2859, ItemRemoveMessageEvent);
        this._events.set(834, ItemStateUpdateMessageEvent);
        this._events.set(540, ItemDataUpdateMessageEvent);
        // Header verified (_SafeCls_2131 -> parser _SafeCls_2309). The extra Integer is now
        // identified: AS3 reads `badgesRank` after `isModerator` on the userType==1 branch, and
        // this port does not.
        //
        // It is deliberately still not read. vortex-emulator's RoomAvatarSerializer ends its
        // player block at IsModerator too, so client and server agree today; adding the read to
        // match AS3 alone would consume four bytes that are not on the wire and desync every
        // remaining user in the packet. Fixing it means changing both sides together.
        this._events.set(996, UsersMessageEvent);
        this._events.set(2613, UserUpdateMessageEvent);
        this._events.set(3693, UserRemoveMessageEvent);
        // AS3: sources/win63_version/habbo/communication/messages/incoming/room/engine/RoomPropertyMessageEvent.as
        // (name recovered; obfuscated in primary dump as _SafeStr_4546[1956] = _SafeCls_2935,
        // sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_2935.as - exact
        // field match: floorType/wallType/landscapeType/animatedLandscapeType).
        this._events.set(1956, RoomPropertyMessageEvent);
        // AS3: sources/win63_version/habbo/communication/messages/incoming/room/engine/RoomVisualizationSettingsEvent.as
        // (name recovered; obfuscated in primary dump as _SafeStr_4546[2986] = _SafeCls_2101,
        // sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2102/_SafeCls_2101.as - exact
        // field match: wallsHidden/wallThicknessMultiplier/floorThicknessMultiplier).
        this._events.set(2986, RoomVisualizationSettingsEvent);

        // === ROOM CHAT ===
        // AS3: _SafeCls_2046.as::_events[3614] = _SafeCls_3307 — the server refusing this player's
        // chat for N seconds, subscribed by RoomChatHandler. Corroborated by vortex-emulator's
        // FloodControlMessageComposer = 3614.
        // AS3: _SafeCls_2046.as::_events[3102] = _SafeCls_3646 — the special system message shown
        // above a user, subscribed by RoomChatHandler. No unobfuscated tree names it and the
        // emulator has no constant for 3102 either, so the class name is derived from the AS3
        // handler (`onSpecialSystemChat`); see the parser's header.

        // === ROOM ACTION ===
        // AS3: header corrected 1783 -> 1036 (_SafeCls_3215, onExpression,
        // com/sulake/habbo/room/_SafeCls_1984.as:270, parser _SafeCls_3947 - userId,
        // expressionType - matches this TS parser exactly). Header 1783 there is really
        // onRoomSettingsSaved (_SafeCls_2385), which has moved here - see ROOM SETTINGS below.
        this._events.set(2217, DanceMessageEvent);
        // AS3: header corrected 3629 -> 2624. The registry maps _SafeStr_4546[2624] = _SafeCls_2589,
        // the event RoomMessageHandler.onAvatarEffect subscribes to, whose parser _SafeCls_3361
        // reads (userId, effectId, delayMilliSeconds) — exactly this TS parser. 3629 is a different
        // message entirely (_SafeCls_3136 -> parser _SafeCls_4142, a single `type` int), consumed by
        // AvatarEditorMessageHandler.onAvatarEffectSelected. The wrong header is why in-room avatar
        // effects never arrived even though the whole render pipeline was ported.
        this._events.set(2624, AvatarEffectMessageEvent);
        this._events.set(2850, CarryObjectMessageEvent);
        // AS3: header corrected 2833 -> 1953 (_SafeCls_3578, onUseObject,
        // com/sulake/habbo/room/_SafeCls_1984.as:275, parser _SafeCls_3865 - userId,
        // itemType - matches this TS parser exactly). Header 2833 there is really
        // onStateMessage (_SafeCls_3686, com/sulake/habbo/phonenumber/HabboPhoneNumber.as:82),
        // an unrelated, unported message.
        this._events.set(3798, UserChangeMessageEvent);

        // === ROOM FURNITURE ===
        // Vortex-custom (not in official AS3 dumps): vortex-client commit e8dc43d "chore(protocol):
        // register rentable space (4600/4601) and pet (3072/3073) message IDs"

        // === ROOM PET ===
        // Every header below is read directly out of WIN63's own incoming-events registry,
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // (`_SafeStr_4546[id] = _SafeCls_N`). The pet message package is package-obfuscated there, so
        // each class was identified by the handler that subscribes to it — RoomUsersHandler.as:85-95
        // constructs them by name-bearing callback (onPetInfo, onEnabledPetCommands, …) — and the
        // class names themselves come from the secondary tree's
        // habbo/communication/messages/incoming/room/pets/.
        //
        //   3192 -> _SafeCls_3598 (PetInfo, RoomUsersHandler::onPetInfo)
        //    332 -> _SafeCls_3885 (PetCommands, onEnabledPetCommands)
        //   2753 -> _SafeCls_3115 (PetStatusUpdate, onPetStatusUpdate)
        //   3104 -> _SafeCls_3060 (PetLevelUpdate, onPetLevelUpdate)
        //   3796 -> _SafeCls_2731 (PetFigureUpdate, onPetFigureUpdate)
        //    946 -> _SafeCls_3946 (PetExperience, habbo/room/_SafeCls_1984.as:284 onPetExperience)
        //   3195 -> _SafeCls_3208 (PetPlacingError, onPetPlacingError)
        //
        // These used to be annotated as emulator-derived, with 3192 marked Vortex-custom outright.
        // They are not: all seven are the client's own headers, and the emulator agrees with them.
        // The one genuinely invented member of this block, PetVocalMessageEvent at 3073, is gone —
        // no AS3 tree has such a message, and 3073 is WhisperMessageEvent, which it silently
        // overwrote in this Map.

        // === ROOM RENTABLE BOT ===
        // Same route as the pet block above: every id read out of WIN63's own registry
        // (`_SafeStr_4546[2463]/[1293]/[2336]/[520]`), each class identified by the member that
        // subscribes to it — BotSkillConfigurationViewBase.open() for the configuration answer,
        // RoomDesktop for the skill list and the forced context menu, RoomUsersHandler::onBotError
        // for the refusal. All four corroborated by vortex-emulator's own composer constants.

        // Pet inventory add/remove, from habbo/inventory/_SafeCls_1951.as:170/181:
        //   3013 -> _SafeCls_2397 (PetRemovedFromInventory, onPetRemoved)
        //   3653 -> _SafeCls_3510 (PetAddedToInventory, onPetAdded)

        // PetRespectFailedEvent (header 31, AS3 incoming/room/pets/) is deliberately absent here:
        // it was already ported and registered under incoming/notifications/ (see the NOTIFICATIONS
        // block below), and its parser already reads AS3's requiredDays/avatarAgeInDays exactly.
        // Its directory does not match the AS3 package, but re-homing it would be churn for no
        // behaviour change — and registering a second copy at 31 would have silently overwritten
        // the first, since _events is a Map. The server sends this one with an empty body too.

        // === VAULT / EARNINGS ===
        // The three server->client halves of the vault. Their client->server siblings (809, 3417)
        // have been registered all along; nothing read the answers, because `EarningsController` was
        // unported. Names recovered from vortex-emulator, whose ids match WIN63's registry exactly.

        // === USERS ===
        // AS3: header corrected 3909 -> 2050. The earlier note here claimed this shape (a single
        // int "result") matched no AS3 message; it does - TalentTrackController.as:132 registers
        // `new _SafeCls_2618(onChangeEmailResult)`, and _SafeCls_2046.as maps _SafeStr_4546[2050]
        // to _SafeCls_2618 (parser _SafeCls_4028: `result:int`). 3909 is that controller's *other*
        // event, onTalentTrack (_SafeCls_2633, TalentTrackController.as:133), still unported.
        // The unrelated onEmailStatus message (email, isVerified, allowChange) stays at 2343 as
        // EmailStatusResultEvent (see USERS section below).
        // AS3-verified (vortex-emulator Turbo.Revisions/Revision20260701/Headers.cs:1014,
        // "GuildMembershipsMessageComposer = 3994 ... onGuildMemberships @ HabboCatalog"):
        // matches the real consumer confirmed by reading HabboCatalog.as directly.
        // AS3: header corrected 2087 -> 1948 - HabboGroupsManager.as:199 registers
        // `new _SafeCls_2104(onGroupDeactivated)` and _SafeCls_2046.as maps _SafeStr_4546[1948] to
        // _SafeCls_2104 (parser: `groupId:int` only). 2087 is onMembershipRequested
        // (_SafeCls_2076, HabboGroupsManager.as:203 - parser adds a `requester` block), unported.
        // Group creation / edit. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as lines 1761/1192/1352/1219/1681) and
        // corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (GuildCreationInfoMessageComposer = 973, GuildEditorDataMessageComposer = 1132,
        // GuildCreatedMessageComposer = 2138).
        // Kick/leave step two: how much furni the target still has in the HQ. Header read
        // from WIN63's own registry (habbo/communication/_SafeCls_2046.as line 1241,
        // _SafeStr_4546[1402] = _SafeCls_2145) and corroborated by vortex-emulator
        // Vortex.Revisions/Revision20260701/Headers.cs (GuildMemberFurniCountInHQMessageComposer = 1402).
        // The personal word filter's two replies. Registering them here is what lets
        // WordFilterSettingsView's own addHabboConnectionMessageEvent() resolve a header:
        // MessageRegistry maps an event INSTANCE to an id through this class table, and
        // warns "Unknown message event class" for anything missing from it. Headers read
        // from WIN63's own registry (_SafeStr_4546[2231]/[3622]); the emulator names both
        // differently and implements neither.
        // The navigator's remaining replies. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as, _SafeStr_4546[2051]/[2902]/[1172]/[735]/[1122]/[3208]/[3715])
        // and corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // for all but 1172, which has no constant there at all - hence the derived name on
        // RoomMuteAllMessageEvent.
        // 2051 (FlatAccessible) is registered above, with the room/session events.
        // 2902 was the snow-war `GameStarted` event; the RPG fork removed Snow War, so it is not
        // registered.
        // The spam-wall post-it pair. Headers read from WIN63's own registry
        // (_SafeStr_4546[2816] and _composers[2684]) and corroborated by vortex-emulator
        // (RequestSpamWallPostItMessageComposer = 2816, AddSpamWallPostItMessageEvent = 2684).
        // The members window's five replies. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as, _SafeStr_4546[403]/[3477]/[1735]/[595]/[2087])
        // and corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (GuildMembersMessageComposer = 403, GuildMembershipUpdatedMessageComposer = 3477,
        // GuildMemberMgmtFailedMessageComposer = 1735, GuildMembershipRejectedMessageComposer = 595,
        // GroupMembershipRequestedMessageComposer = 2087).
        // AS3: header corrected 1948 -> 1097 (_SafeCls_2180, onClubStatus,
        // com/sulake/habbo/inventory/_SafeCls_1951.as:462, parser _SafeCls_1956 - exact
        // field-for-field match with this TS parser). Header 1948 there is really
        // onGroupDeactivated (_SafeCls_2104, com/sulake/habbo/groups/HabboGroupsManager.as:199),
        // an unrelated, unported message.

        // === HELP (name change) ===

        // === ONBOARDING (new user flow) ===
        // ID from WIN63's registry (`_SafeStr_4546[3624] = _SafeCls_3056`), corroborated by the
        // emulator as SelectInitialRoomComposer. Answers RoomPicker's starter-room pick.
        // The name-check answer, `_SafeStr_4546[382] = _SafeCls_3600`. Without it the onboarding
        // name dialog spins its wait indicator forever — the reply arrives and is dropped.

        // === LANDING VIEW ELEMENTS ===
        // Three more that were subscribed and never routed. Each id is resolved through the
        // *element* that registers it, which is how they were told apart: WIN63 names them
        // `_SafeCls_4528` ("click_submittedroom"), `_SafeCls_4534` (the countdown) and
        // `_SafeCls_4537` ("click_requestbadge_"), and two of the three answer a handler
        // called `onInfo`, so the handler name alone could not have separated them.
        //
        // win63_version lists these at 1685/1557/2295 — all three stale. Its registry is a
        // different build and is never the authority.

        // === MODERATION TOOLS ===
        // The whole incoming set: ported, subscribed by `ModerationMessageHandler`, and in
        // no header table, so the mod tools received nothing at all. Each id is the WIN63
        // registry entry for the class that handler registers, with the readable name from
        // win63_version, which spells the same handler identically.
        // The reply to GetMyCfhReportStatus (1834), which the client already sent and then had
        // nothing registered to read. WIN63 registry: _SafeStr_4546[3809] = _SafeCls_1752, the
        // class HabboHelp.as:485 subscribes to.

        // Three more the audit found unwired. Their ids come from the AS3 registry's *incoming*
        // table (`_SafeStr_4546`, not `_composers`) — grepping the wrong map is what made them
        // look absent at first.
        // 2518, not 3222: `_SafeStr_4546[2518] = _SafeCls_2772`, whose parser `_SafeCls_4396`
        // is the one with `get prizes()`. 3222 belongs to CompetitionEntrySubmitResultMessageEvent
        // (`_SafeCls_2536` → `_SafeCls_3313`, the goalId/goalCode/result parser).

        // === HELP / GUIDE / CALL FOR HELP ===
        // Twenty-four answers that were ported, parsed and — for twenty of them —
        // subscribed, but were **in no header table at all**, so the dispatcher had
        // nothing to route the packet to and the whole guide/CFH system received
        // nothing. Each id is the WIN63 registry entry for the class `habbo/help`
        // registers against that handler; the readable class name comes from
        // win63_version, which spells the same handler identically.
        // The two NUX dialog notices. IDs from WIN63's registry (`_SafeStr_4546[752] =
        // _SafeCls_3189`, `_SafeStr_4546[3307] = _SafeCls_2677`), corroborated by the emulator as
        // NewUserExperienceNotCompleteComposer / NewUserExperienceGiftOfferComposer. Both are
        // handled by HabboNuxDialogs; 752 carries no payload.

        // === ROOM WIDGETS ===
        // The furniture-refusal / failed-respect notice, `_events[169] = _SafeCls_3982`,
        // corroborated by the emulator as CustomUserNotificationMessageComposer. Two handlers read
        // it: CustomUserNotificationWidgetHandler opens the dialog, AvatarInfoWidgetHandler refunds
        // the respect on codes 4-5.
        // The rentable-space answers, `_events[2800]/[2158]/[3117]`, all three corroborated by the
        // emulator (RentableSpaceStatus/RentOk/RentFailed MessageComposer).

        // === PHONE NUMBER (SMS identity verification) ===
        // IDs from WIN63's registry (`_events[2833]/[2845]/[712]`). The emulator corroborates
        // 2845 and 712 (TryPhoneNumberResultMessageComposer / TryVerificationCodeResultMessageComposer)
        // but has no constant at all for 2833, so that one rests on the client registry alone.
        // All three are handled by HabboPhoneNumber, and 2833 is what starts the whole flow.

        // === HELP (FAQ) ===
        // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/HabboMessages.as
        // (name recovered via sources/PRODUCTION-201601012205-226667486/OriginalClassNames.txt; obfuscated in primary dump
        // as _SafeStr_4546[2913] = _SafeCls_3480, sources/WIN63-202607011411-782849652/src/unknowns/
        // _SafePkg_1843/_SafeCls_3480.as, whose parser is the real, non-obfuscated
        // com/sulake/habbo/communication/messages/parser/help/_SafeCls_4068.as - exact field match:
        // questionId/answerText - vs. sources/PRODUCTION-201601012205-226667486's FaqTextMessageParser). Response to
        // GetFaqTextMessageComposer(questionId), not yet ported.

        // === GUIDE SESSIONS (room-side markers) ===
        // Headers from the WIN63 registry: _SafeStr_4546[3649] = _SafeCls_3061 (started),
        // [2126] = _SafeCls_2956 (ended), [2377] = _SafeCls_3662 (error). RoomMessageHandler
        // subscribes to all three to paint the guide/requester marker on the two avatars.

        // === PREFERENCES ===

        // === DISCORD ===
        // `_SafeStr_4546[2767] = _SafeCls_2938` in WIN63's registry. The emulator implements the
        // round-trip for real (`DiscordPreferencesHandlers.cs`, backed by `PlayerAccountPreferences`)
        // — it answers both 2883 and 2304 with this event.

        // === PERK ===

        // === CHAT STYLES ===
        // The unlockable band (1000..9999) and the purchasable one. "Nft" is the AS3 / protocol
        // name; the RPG server still sends all three.

        // === CAMPAIGN ===

        // Treasure hunt. Ids from the WIN63 registry, joined to the class each one maps to via
        // the notification manager's own subscriptions (_SafeCls_1951.as:118, 132, 147).

        // === YOUTUBE DISPLAY FURNI (incoming) ===

        // === CRAFTING (incoming) ===
        // Four ids from WIN63's registry, corroborated by the emulator's Headers.cs. The
        // emulator's crafting handlers are empty stubs today, so nothing answers yet.

        // === ADVERTISEMENT ===
        // AS3: header corrected 2247 -> 2396 (_SafeCls_3880, onRoomAdError,
        // com/sulake/habbo/navigator/inroom/RoomEventViewCtrl.as:172, parser _SafeCls_2955 -
        // errorCode, filteredText - exact match with this TS parser). Header 2247 there is
        // really onCollectibles (_SafeCls_3840, com/sulake/habbo/inventory/_SafeCls_1951.as:166),
        // an unrelated, unported message.

        // === TRACKING ===

        // === FRIENDLIST / MESSENGER ===
        // Registered by `HabboMessenger` only behind `client.minimail.embed.enabled`, as
        // AS3 does; the registry entries themselves are unconditional.
        // Friendship furni. The emulator sends none of these three yet — it only has the
        // client->server side (3318) — so the confirm panel stays shut against it.
        // Guild-customised furni: the bubble's own data, answering composer 826.
        // 3707, not 3407. WIN63's registry has `_SafeStr_4546[3707] = _SafeCls_2256`, and
        // `HabboFriendList` subscribes exactly that class as `onAcceptFriendResult`; 3407 is
        // `SelfDonationResultMessageEvent`, whose name survived obfuscation and is unambiguous. The
        // two were registered on the same id, so the later `set` silently unregistered the earlier —
        // self-donation results never fired. **vortex-emulator disagrees** (`AcceptFriendResultComposer
        // = 3407`); the registry wins, and the emulator needs the same correction.

        // === NOTIFICATIONS (extended) ===
        // AS3: sources/win63_version/habbo/communication/class_1881.as — name_1[2806] = ElementPointerMessageEvent
        this._events.set(2243, NotificationDialogMessageEvent);
        // AS3: header corrected 1737 -> 184 - was swapped with MaintenanceStatusMessageEvent
        // (see AVAILABILITY section above). sources/WIN63-202607011411-782849652
        // unknowns/_SafePkg_2018/_SafeCls_2483.as (minutesUntilClosing only) matches this
        // parser exactly and is registered at 184, not 1737.
        // AS3: header corrected 70 -> 3913 - was swapped with NoobnessLevelMessageEvent.
        // _SafeCls_2046.as: _SafeStr_4546[3913] = _SafeCls_1995, parser _SafeCls_2001 (`status:int`
        // plus the two status constants); 70 carries `noobnessLevel`.
        // AS3: header corrected 160 -> 1740 (_SafeCls_3168, onRoomMessagesNotification,
        // com/sulake/habbo/notifications/_SafeCls_1951.as:112, parser _SafeCls_3790 -
        // roomId, roomName, messageCount - exact field-for-field match, including default
        // flush values, with this TS parser). Header 160 there is really
        // onGuestRoomSearchResult (_SafeCls_3509, com/sulake/habbo/navigator/_SafeCls_1951.as),
        // an unrelated, unported message.

        // === ERROR ===

        // === LANDING VIEW ===

        // === COMPETITION ===
        // RoomCompetitionController registers both of these, but neither had a header, so
        // MessageRegistry dropped them with "Unknown message event class" and the room-competition
        // voting/submit replies never arrived. IDs read from WIN63's registry
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as,
        // matching each event to the parser it constructs (member names are not obfuscated):
        //   2617 -> _SafeCls_2434, parser _SafeCls_4063 (goalId/goalCode/resultCode/votesRemaining)
        //   3222 -> _SafeCls_2536, parser _SafeCls_3313 (goalId/goalCode/requiredFurnis/missingFurnis)

        // === CATALOG (bonus rare) ===
        // The reply to GetProductOfferComposer (1692). Header from the primary registry
        // (`_events[1911] = _SafeCls_2066`); the emulator already answers on it.
        // Two payload-less purchase signals. Headers from the primary registry
        // (`_events[533]`/`_events[2735]`); the emulator sends both from its gift-purchase handler.
        // The room list a room ad can point at (`_events[3787]`), read by RoomAdsCatalogWidget.
        // The mute countdown, read by RoomChatHandler.
        // The badge-point limits table, read by HabboInventory into the localization manager.
        // The post-it sheet count, read by HabboInventory into the furni model.
        // The two wallet currencies, read by HabboCatalog into the purse.
        // The three recycler pushes were on invented ids (2166→1919, 3617→281, 3367→3783), taken
        // from the emulator, which had them wrong too — none of 1919/281/3783 has an entry in
        // WIN63's registry at all, and each of 2166/3617/3367 has exactly one. Parser shapes
        // confirm the mapping: _SafeCls_2004 (recyclerStatus, recyclerTimeoutSeconds),
        // _SafeCls_2078 (recyclerFinishedStatus, prizeId), _SafeCls_2027 (prizeLevels).
        // The emulator's constants were corrected in the same pass.

        // === QUEST ===
        // AS3: WIN63-202607011411 registry _SafeCls_2046.as — _SafeStr_4546[id] = event class
        // (the obfuscated class each maps to is named by its QuestMessageHandler callback).
        // 1584 is WIN63-only: neither `win63_version` nor the emulator's Headers.cs carries it, so
        // both the event and its payload-less parser are named from their single subscriber,
        // `CitizenshipVipQuestsPromoExtension.onCitizenshipQuestPromoEnabled()`.

        // === DAILY TASKS ===
        // The three events habbo/quest/dailytasks/DailyTasksController.as registers in its
        // constructor, with the ids from WIN63's own registry _SafeCls_2046.as:
        //   1824 -> _SafeCls_3179 → onActiveDailyTasks  (line 1295)
        //   2506 -> _SafeCls_2859 → onTasksAdded        (line 1414)
        //   1065 -> _SafeCls_3449 → onTaskUpdated       (line 1177)
        // The emulator disagreed on two of the three (2507 and 1762), and 1762 is really
        // CfhTopics — it declares that header twice. WIN63's registry wins; the emulator's
        // Headers.cs has been corrected to match.
        // DailyTasksController subscribes to all three (2026-08-12), views included. Before that
        // commit every one of these three was received and dropped: registered here, with nothing
        // at the other end.

        // === ACHIEVEMENTS ===
        // AchievementsResolutionController's three messages, registered by QuestMessageHandler but
        // headerless until now. Same method as the competition pair above — each event class was
        // identified through the parser it constructs, then looked up in _SafeCls_2046.as:
        //   3143 -> _SafeCls_3258, parser _SafeCls_3983 (stuffId/achievements/endTime)
        //   1844 -> _SafeCls_3814, parser _SafeCls_3262 (stuffId/achievementId/requiredLevelBadgeCode)
        //   1166 -> _SafeCls_3558, parser _SafeCls_3054 (stuffCode/badgeCode)

        // === ROOM SETTINGS ===
        // AS3: header corrected 2631 -> 1783 (_SafeCls_2385, onRoomSettingsSaved,
        // com/sulake/habbo/navigator/_SafeCls_1951.as / _SafeCls_2208.as). Header 2631
        // there is really onCallForHelpResult (_SafeCls_3126,
        // com/sulake/habbo/help/CallForHelpManager.as:81), an unrelated, unported message.
        // Header 1783 was freed by ExpressionMessageEvent moving to 1036 (see ROOM ACTION).

        // === VORTEX-SPECIFIC (no AS3 backing) ===
        // The furni editor's incoming half. These headers exist in no Habbo client; they are matched
        // by hand against the emulator's Vortex.Revisions/Revision20260701/Headers.cs. The 8000-8999
        // band was chosen because it is empty in both registries. Never renumber one side alone.

        // Fishing takes 8100-8199 of the same band, leaving the furni editor room to grow. Even for
        // events, odd for composers, so a request and its reply sit next to each other.
        // 8102 is re-sendable: the server broadcasts it again whenever an operator reloads the
        // tables, and FishingDefinitions.apply() drops a push whose version is not newer.
        // See docs/vortex-original/fishing.md §3 and §6.
        // 8110 was CatchFailed. Origins has no per-cast miss: catches keep coming until the spot
        // runs dry, so the id now carries the end of the session instead.
    }

    /**
     * Register outgoing message composers (Client -> Server)
     */
    private registerComposers(): void
    {
        // === HANDSHAKE ===
        this._composers.set(4000, ClientHelloMessageComposer);
        this._composers.set(2022, InitDiffieHandshakeMessageComposer);
        this._composers.set(2526, CompleteDiffieHandshakeMessageComposer);
        this._composers.set(3584, VersionCheckMessageComposer);
        // Header from _SafeCls_2052 (via sendConnectionParameters()). The shape warning that used
        // to sit here was wrong: AS3's constructor takes only the ticket, but its body pushes
        // *two* values — the ticket then getTimer() — so the wire really does carry both. The TS
        // composer takes the timer as an optional second parameter defaulting to the same call,
        // which produces an identical payload.
        this._composers.set(882, SSOTicketMessageComposer);
        this._composers.set(2309, UniqueIDMessageComposer);

        // === SESSION ===
        this._composers.set(362, PongMessageComposer);
        this._composers.set(2864, DisconnectMessageComposer);
        this._composers.set(756, InfoRetrieveMessageComposer);

        // === TRACKING ===

        // === NAVIGATOR ===
        // Raid protection — AIR-1.0.31 only; see the incoming block above for how the ids were
        // assigned. Unlike the three events, both composer ids are free in this revision and in
        // the emulator, so AIR's own numbers are kept verbatim.
        // Onboarding: the starter-room pick sends a room TYPE, and the figure save sends
        // gender-then-figure. IDs from WIN63's registry (`_composers[3267] = _SafeCls_3967`,
        // `_composers[3339] = _SafeCls_3021`), corroborated by the emulator.
        // The NUX gift claim, `_composers[3490] = _SafeCls_2936`, corroborated by the emulator as
        // NewUserExperienceGetGiftsMessageEvent. Its length prefix counts integers, not items —
        // see the composer.
        // Name check/claim. The onboarding dialog claims on 879 (`_composers[879] = _SafeCls_3401`);
        // the paid rename in habbo/help/namechange uses 1703 and a different composer class, so the
        // two are not interchangeable. The check is shared: `_composers[413] = _SafeCls_3569`.
        // 879 is ClaimNewUserName in WIN63's registry (`_composers[879] = _SafeCls_3401`), a
        // different message that happens to take the same single string — so the wrong id here
        // would have been accepted and handled as a *claim* rather than a change. ChangeUserName
        // is 1703; the emulator agrees. Latent until now: nothing constructs this composer yet.
        // AS3-verified (vortex-emulator Turbo.Revisions/Revision20260701/Headers.cs:184/181):
        // "GetGuildMembershipsMessageEvent = 3918 ... registerGuildSelectorWidget()" and
        // "GetGuildCreationInfoMessageEvent = 2989 ... BuyGuildWidget::onButtonClicked()".
        // Group creation / edit. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as lines 968/759/749/1058/975/1034) and
        // corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (GetGuildEditorDataMessageEvent = 3398, CreateGuildMessageEvent = 207).
        // Guild deletion and the two-step kick/leave. Headers read from WIN63's own
        // registry (habbo/communication/_SafeCls_2046.as lines 855/1138/926) and
        // corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (DeactivateGuildMessageEvent = 2725, GetMemberGuildItemCountMessageEvent = 781,
        // KickMemberMessageEvent = 3156 — whose comment records that 781 was once
        // mistaken for the kick itself).
        // Everything the members window can send. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as lines for _SafeCls_2908/2681/2867/3648/3129/3772/2425)
        // and corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs.

        // === NEW NAVIGATOR ===

        // === ROOM SESSION ===
        this._composers.set(3234, OpenFlatConnectionMessageComposer);
        // AS3: sources/win63_version/habbo/communication/class_1881.as:628 — was incorrectly
        // registered as 2722 (that ID actually belongs to the unported groupforums
        // PostMessageMessageComposer, per class_1881.as:747).
        this._composers.set(3061, QuitMessageComposer);

        // === ROOM AVATAR ===
        this._composers.set(2508, LookToMessageComposer);

        // === ROOM ACTION ===

        // === ROOM RESPECT ===

        // === ROOM FURNITURE ===
        // AS3: _SafeCls_1821.as::useObject() — the six ROFCAE_* furniture actions. Headers from
        // WIN63's registry; all but 350 and 3422 are corroborated by vortex-emulator, whose
        // comments cite these same useObject() cases.
        // 350 disagrees with the emulator, which listens on 204 — see the composer's own note.
        // AS3: _SafeCls_1821.as::modifyWallItemData() / deleteWallItem()
        // AS3: BackgroundColorFurniWidget.as::windowProcedure() apply_button
        // AS3: AreaHideFurniWidget.as::updateData() — the area-hide rectangle and its three flags.
        // AS3: _SafeCls_1821.as::changeRoomObjectState() — the three siblings of UseFurniture
        // above. Floor items split on the isRandom flag (3353 / 1942); wall items take 3590.
        // 3590 disagrees with the emulator, which listens on 1540 — see the composer's own note.
        // AS3: _SafeCls_1821.as::modifyRoomObjectData() "OBJECT_SAVE_STUFF_DATA"

        // The floor plan editor's three. The two GETs have a real handler waiting on the emulator;
        // UpdateFloorProperties is accepted and dropped there today, so saving is a no-op server-side.

        // The special-items display's pair: ask, then claim. Its result is 431, already registered.

        // Vortex-custom (not in official AS3 dumps): vortex-client commit f3bba54 "feat(rentablespace):
        // add config message, compositors and updated display widget"

        // === ROOM PET ===
        // Headers read directly out of WIN63's own outgoing registry,
        // sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // (`_composers[id] = _SafeCls_N`). The composer classes are package-obfuscated, so each was
        // identified from the RoomSession/handler method that sends it — RoomSession.as:507-560,
        // UserDataManager.as:231, InfoStandWidgetHandler.as:460-470/799, PetsModel.as:117/229,
        // habbo/room/_SafeCls_1821.as:2236 — whose names are not obfuscated:
        //
        //   1640 -> _SafeCls_2851 (RemovePetFromFlat, RoomSession::pickUpPet)
        //   1018 -> _SafeCls_2777 (PlacePet, PetsModel::placePet)
        //    432 -> _SafeCls_2560 (MovePet, _SafeCls_1821::sendMoveUserObjectMessage, monsterplant)
        //   3899 -> _SafeCls_2625 (GetPetInfo, UserDataManager::requestPetInfo)
        //   2757 -> _SafeCls_3264 (PetSelected, InfoStandWidgetHandler::handleGetPetInfoMessage)
        //   1996 -> _SafeCls_3238 (MountPet, RoomSession::mountPet/dismountPet)
        //   3713 -> _SafeCls_3089 (TogglePetRidingPermission)
        //   2884 -> _SafeCls_3921 (RemoveSaddleFromPet)
        //   2425 -> _SafeCls_2559 (GetPetCommands)
        //   2099 -> _SafeCls_2749 (CustomizePetWithFurni, RoomSession::useProductForPet)
        //
        // MovePet used to be registered at 2761 as "Vortex-custom": that is the *secondary* tree's
        // header (win63_version/habbo/communication/class_1881.as:754), a different build. 2761 does
        // not exist in this revision's outgoing registry at all, so every monster-plant move was
        // being sent to nothing. IssuePetCommandMessageComposer (3072) is gone entirely — AS3 has no
        // such message; commands are issued as ordinary chat, "<pet name> <command>", by
        // InfoStandWidgetHandler's "RWPCM_PET_COMMAND" branch.

        // === RENTABLE BOTS ===
        // AS3: _SafeCls_1821.as::placeObject() category 100 / typeId 4 — the sibling of PlacePet
        // (1018) one branch up. RoomEngine's TODO named 1295 for this; 1295 is the user-move
        // composer. See PlaceBotMessageComposer's own note.
        // AS3: _SafeCls_1821.as::sendMoveUserObjectMessage() "rentable_bot" branch — the sibling of
        // MovePet (432) above. `_composers[1295] = _SafeCls_2801` in the registry; the Turbo server
        // has bots but no handler at this id. See MoveBotMessageComposer's own note.
        // AS3: _SafeCls_1821.as::modifyRoomObject() "OBJECT_PICKUP_BOT" — takes webID, not objectId.
        // The bot context menu's two senders. Both ids read straight out of WIN63's registry
        // (`_composers[3813] = _SafeCls_2928`, `_composers[2311] = _SafeCls_3415`) and corroborated
        // by vortex-emulator (CommandBotEvent / GetBotCommandConfigurationDataEvent).
        // Hand the carried item to a pet, from InfoStandWidgetHandler.as "RWUAM_GIVE_CARRY_ITEM_TO_PET":
        //   1429 -> _SafeCls_2543 (PassCarryItemToPet)

        // === NOTIFICATIONS ===

        // === TRACKING ===
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // registers this composer's real class (_SafeCls_2653, confirmed via LatencyTracker.as's
        // single-int-param usage) at 544, not 1242 - 1242 belongs to
        // ClearOwnMarketplaceHistoryMessageComposer, a different composer in the same registry.

        // === FRIENDLIST ===
        // Both headers verified (_SafeCls_3920 / _SafeCls_3339), and both shapes re-checked: AS3
        // builds the id list by mutation (addAcceptedRequest/addDeclinedRequest) where the TS
        // composers take varargs, but getMessageArray() emits the same payload either way —
        // [count, ...ids] for accept, [declineAll, count, ...ids] for decline.
        //
        // One edge case survives: AS3 derives declineAll from an empty id list, so
        // `new DeclineFriendMessageComposer(false)` with no ids sends [false, 0] where the real
        // client would send [true, 0]. No caller does that today.

        // === USERS ===

        // === GROUP FORUMS ===
        // Every id read from WIN63's own registry (_SafeCls_2046.as), and every one corroborated
        // by vortex-emulator's MessageEvent constants. The obfuscated classes behind them were
        // identified through GroupForumController, which is unobfuscated in the primary tree and
        // names each one at its call site — the same method the competition composers needed.
        // HabboGroupInfoManager has been sending this on every room entry since it was
        // ported, into nothing: the composer existed but was never registered, so every
        // send was dropped and BadgeImageWidget never learned any group's badge code.
        // 3346 is WIN63's own registry (_SafeCls_2046.as:957, _SafeCls_2839), corroborated
        // by vortex-emulator's GetHabboGroupBadgesMessageEvent = 3346. Not win63_version's
        // 2767 - that is an older build - and not the 2317 the composer's docblock claimed,
        // which matches no tree.
        // AS3: SessionDataManager.as::initSessionData() sends this immediately after 3642 above.
        // AS3: DailyTasksController.as::claimTask()
        // AS3: HabboFreeFlowChat.as::sendChatPreferences()

        // === CAMPAIGN ===

        // === ADVERTISEMENT ===
        // NOTE: GetInterstitialMessageComposer had ID 3698 in win63 source, but that conflicts
        // with OpenPetPackageMessageComposer (also 3698). Removed to avoid collision.
        // GetInterstitialMessageComposer can be re-added with the correct ID if needed.

        // === PREFERENCES ===
        // The other-settings checkboxes. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as, _composers[1332]/[3917]/[2056]) and
        // corroborated by vortex-emulator Vortex.Revisions/Revision20260701/Headers.cs
        // (SetIgnoreRoomInvitesMessageEvent = 1332, SetRoomCameraPreferencesMessageEvent = 3917,
        // ResetPhoneNumberStateMessageEvent = 2056).
        // === DISCORD ===
        // `_composers[2883] = _SafeCls_2988` (the request) and `_composers[2304] = _SafeCls_3638`
        // (the write-back) in WIN63's registry. No emulator counterpart yet.

        // The answer to the phone-verification offer, `_composers[1983] = _SafeCls_2666`,
        // corroborated as SetPhoneNumberVerificationStatusMessageEvent. Shared by HabboNuxDialogs
        // (statuses 0 and 2) and habbo/phonenumber.
        // The two submissions of the SMS flow, `_composers[2890] = _SafeCls_2910` and
        // `_composers[1846] = _SafeCls_2748`, corroborated as TryPhoneNumberMessageEvent /
        // VerifyCodeMessageEvent.
        // The rentable-space requests, `_composers[2626]/[3165]/[61]`, corroborated by the emulator
        // as RentableSpaceStatus/Rent/CancelRent MessageEvent.
        // The personal word filter. Headers read from WIN63's own registry
        // (habbo/communication/_SafeCls_2046.as, _composers[801]/[2656]/[2209]).
        // vortex-emulator's Headers.cs names all three differently, with no verification
        // comment and no handler or parser behind them, so it corroborates nothing here.

        // === SOUND ===
        // Mannequin (widget/furniture/mannequin).
        // 3315 has no emulator counterpart — the two nudge-height arrows send into the void.

        // === ROOM ENGINE ===
        this._composers.set(1901, GetFurnitureAliasesMessageComposer);
        // GetHeightMapMessageComposer removed 2026-08-27. The earlier TODO here was right that
        // 1935 is in no registry table and that nothing constructs it — but it stopped one step
        // short: the class is in **no AS3 tree at all**. It came from
        // `sources/NITRO/packages/nitro-shared/src/packets/outgoing/Room/Engine/GetHeightMapComposer.ts`,
        // which is not one of this project's three sources. In the 2026 protocol the server sends
        // the heightmap unprompted; there is nothing to request.
        this._composers.set(2364, MoveAvatarMessageComposer);
        // Header from sources/WIN63-202607011411-782849652 (_SafeCls_2135 via HabboCatalog.as's
        // placement send). The constructor now carries AS3's full six arguments — id, category,
        // wallLocation, x, y, rotation — and the category picks between the floor and wall shapes.
        // AS3: _SafeCls_1821.as::placeObject() — the "furniture_is_stickie" branch, checked
        // before the generic PlaceObject fallback above.
        // AS3: _SafeCls_2046.as::_composers[2999] = _SafeCls_2682 — the wall-item move, sent by
        // modifyRoomObject()'s "OBJECT_MOVE_TO" case when the moved object is category 20.
        // Corroborated by vortex-emulator's MoveWallItemMessageEvent = 2999.
        // AS3: ClickFurniMessageComposer header 443 (win63 registry); sent on a plain furni click.
        // AS3: _SafeCls_2046.as::_composers[3244] = _SafeCls_2770 — the avatar-category branch of
        // the same clickRoomObject(); corroborated by vortex-emulator's ClickCharacterEvent = 3244.
        // AS3: header corrected 443 -> 1919 (sources/WIN63-202607011411-782849652
        // unknowns/_SafePkg_2136/_SafeCls_3412.as, real construction confirmed at
        // com/sulake/habbo/room/_SafeCls_1821.as:2329 and _SafeCls_1984.as:316).
        // Header 443 there is the unrelated, readable ClickFurniMessageComposer.

        // === ROOM CHAT ===

        // === INVENTORY ===
        // The out-of-room variant of 41. `FurniModel.requestInitialization()` picks between the two
        // on `_isInRoom`; nothing registered this one, so opening the inventory from the hotel view
        // sent the in-room request.
        // Wallpaper/floor/landscape are applied, never placed: FurniModel and HabboCatalog
        // both route those three categories here instead of to the object mover.
        // The request behind BadgePointLimits (3510). Nothing sent it, so the levelled-badge
        // progress table the localization manager reads stayed empty.
        // Acknowledges the new-additions badge. Without it the server re-flags new additions
        // on every login, however many times the catalog was opened.
        // AS3: WIN63's registry, `_composers[2069]`/`[394]` — two of the few composer classes that
        // kept their real names through obfuscation. `HabboInventory.initComponent()` sends both at
        // boot, right after 540; neither existed in this port, so the two balances were never asked
        // for. Corroborated by vortex-emulator, whose handlers for both are real.
        // AS3: WIN63's registry, `_composers[3159] = _SafeCls_3448`. The emulator's only 3159
        // is an unrelated server->client composer, a different table, so not a conflict.
        // `_composers[2236]` in WIN63's registry, resolved through `_SafeCls_4537` — the landing
        // view's badge-request element, identified by the unobfuscated `requestCode` it compares
        // against. win63_version says 2545, which this build gives to something else.
        // Header 699 (_SafeCls_3363, constructed at UnseenItemTracker.as:209). The extra-fields
        // warning that used to sit here is closed — ResetUnseenItemsComposer now sends [category]
        // and nothing else, matching AS3.

        // === LANDING VIEW ===

        // === CATALOG (bonus rare) ===
        // The discounted club-extension offer, asked for by the two toolbar promo bars. Neither
        // could send it before: both were shells with no window and therefore no button to click.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // The room-ad purchase pair (`_composers[2928]`/`_composers[3607]` in the WIN63 registry).
        // 3607 is analytics only - the emulator's handler for it is a deliberate no-op.
        // Targeted offers. 848 is from WIN63's registry and the emulator does NOT match it - it
        // listens on a 9004 placeholder its own comment admits is unresolved, so the request
        // currently reaches nothing. The registry is the authority; the emulator needs the fix.
        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as

        // AS3: the rent extend/buyout quote round trip — request, then one of two confirmations
        // depending on whether the item stands in a room or sits in the inventory strip.

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // Every moderation composer was ported and none was registered, so a moderator could
        // receive the whole tool (all 14 incoming events are wired) and send nothing — each
        // button reached a composer the connection had no header for. Ids are the primary
        // registry's, and each constructor arity was checked against the class it maps to.
        // Moved header: 396 in the 2023 build (win63_version's own registry), 2735 here. The
        // reference server has no handler for it — its 2735 is a *server→client* gift message,
        // a separate namespace — so this one sends into the void until the emulator implements
        // it. Registered anyway: the client registry is the authority on what the client sends.

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // The player half of moderation — reporting and the guide/helper system — had the same
        // defect as the tool itself: 20 composers ported, 2 registered. Only the ones whose
        // constructor shape still matches the primary tree are registered here; see the TODO
        // below for the seven that do not.
        // Bully report, sent by the guardians-gated bully_report form. Header from the primary
        // registry (`_composers[293] = _SafeCls_3410`); the emulator defines no handler for it.
        // Quiz pair, both from the primary registry and both defined by the emulator.
        // The four `GuideSessionController` sends that had no composer until 2026-08-11. Headers
        // from the primary registry, all four corroborated by the emulator's own AS3-traced names.
        // The player's own report history. `vortex-emulator` had the reply composer and no
        // header for the request until 2026-08-11.
        // WIN63 registry: _composers[3028] = _SafeCls_3470, sent by MyReportStatus::onClickAppeal().
        // WIN63 registry: _composers[879] = _SafeCls_3401, the onboarding name claim. Distinct
        // from ChangeUserName (1703), which is the help-side rename — see the composer's header.

        // The remaining seven, whose bodies were re-ported against the primary tree on
        // 2026-08-09 — every one of them was missing fields or had the wrong parameter
        // order, so registering them before the fix would have put a malformed report on
        // the wire. Arity re-checked against the mapped class after the rewrite.

        // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/_SafeCls_2046.as
        // The rest of what `scripts/unwired-messages.mjs` turned up: classes this port wrote
        // and never plugged in. Room competitions were the whole of it — entering, voting and
        // submitting a room were all unreachable.

        // All three ids corrected 2026-08-27 against the WIN63 registry
        // (habbo/communication/_SafeCls_2046.as) joined to their sender in HabboCatalog.as:
        // _composers[1730] = _SafeCls_2061 (getRecyclerStatus), [3669] = _SafeCls_1777
        // (getRecyclerPrizes), [1796] = _SafeCls_2312 (sendRecycleItems). The previous 1246 /
        // 2516 / 2956 appear in no registry table at all — the recycler could not talk to the
        // server, which is why the emulator corrected the same three on its side 2026-08-22.

        // === QUEST ===
        // AS3: WIN63-202607011411 registry _SafeCls_2046.as — _composers[id] = composer class.
        // The resolution-furni pair. 1760 asks for the achievement list *and*, with a non-zero
        // second field, commits the player's choice; 916 clears it. Both are sent by
        // AchievementsResolutionController, which had no window to send them from.

        // === ACHIEVEMENTS ===

        // === TALENT ===

        // The level-only request. Its emulator handler is an empty stub, so nothing answers it —
        // ported because AS3's TalentPromoCtrl sends it on every user-object update.

        // === TALENT (incoming) ===
        // Three ids from WIN63's registry, all corroborated by the emulator's header table.

        // === COMPETITION ===
        // The three the landing view's competition elements send. Every one of these had drifted
        // between builds, so none could be taken from win63_version's registry: it puts them at
        // 2055 / 2517 / 2732 against 1917 / 3109 / 128 here. Each class was identified in the
        // primary tree by its caller — `_SafeCls_4528` and `_SafeCls_4538`, which match
        // win63_version's `class_4150`/`class_4146` line for line — and not by arity, which is
        // ambiguous for a one-String composer.

        // === INVENTORY - TRADING ===
        // The bulk add and the silver-fee toggle, `_composers[3370]`/`_composers[2717]` in WIN63's
        // registry, both corroborated by the emulator. 3370 is NOT interchangeable with 2177: AS3
        // sends the single-item composer when exactly one item survives its filter.

        // === INVENTORY - VAULT / REWARD ===
        // GiveStarGemToUserMessageComposer removed 2026-09-03, the same way
        // GetHeightMapMessageComposer went on 2026-08-27: it is in no AS3 tree at all. It came
        // from `sources/NITRO`, an unrelated TypeScript client, and its `@see` cited a
        // `win63_version` member that does not exist. Its only caller was
        // `SessionDataManager.giveStarGem()`, which nothing called; both are gone. 1111 belongs
        // to ScrGetKickbackInfoMessageComposer.

        // === BADGE LEADERBOARD ===
        // Both ids come from WIN63's own registry (1225 -> _SafeCls_3493, 2503 -> _SafeCls_3446).
        // The emulator has no header for either, so the names are derived — flagged at each
        // declaration.

        // === SEASONAL CALENDAR ===
        // Both ids from WIN63's own registry (1012 -> _SafeCls_3869, 1641 -> _SafeCls_2647), names
        // recovered from win63_version's own filenames and corroborated by the emulator's table.

        // === NUX ===

        // === ROOM SETTINGS ===

        // === YOUTUBE / VIMEO DISPLAY FURNI ===
        // Ids from WIN63's registry; names recovered from win63_version's readable filenames.
        // Vimeo reuses SetObjectDataMessageComposer (246) rather than a composer of its own,
        // which is what AS3's Vimeo handler does too.

        // === CRAFTING ===
        // All five ids from WIN63's own registry and corroborated by the emulator's
        // Headers.cs. Note the emulator's crafting handlers are all empty stubs, so these
        // reach a server that accepts and drops them — the client side is correct regardless.

        // === VORTEX-SPECIFIC (no AS3 backing) ===
        // See the matching note in registerEvents() for why these headers sit at 8000+.

        // Fishing's outgoing half — 8100-8199, odd for composers. The client sends three things and
        // decides none of them; see docs/vortex-original/fishing.md §5.
        // Origins fishing is a session, not a cast per fish: the client starts one and then only
        // listens. 8101 was VortexFishingCastComposer and modelled the wrong interaction.
    }
}
