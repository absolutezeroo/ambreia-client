# Habbo Client-Server Architecture

How **Turbo Cloud** (`vortex-emulator`, the server) and **vortex-client** (the client, package name `com.sulake.habbo` — "habbo-client-clean") work together.

**Server:** Turbo Cloud — .NET 9/10, Microsoft Orleans (virtual actors), SuperSocket networking, EF Core (Pomelo MySQL)
**Client:** vortex-client — ActionScript 3 / Flash Player, protocol revision `WIN63-202601121721-391685409`
**Protocol:** Binary TCP **and** WebSocket with the classic length+header framing, optional RC4 encryption

> This document replaces an earlier draft that assumed a Java/Netty "Arcturus"-style server. That draft's protocol details, packet IDs, and bug list did not apply to this project's actual server and have been discarded rather than patched. Every fact below is sourced from `vortex-emulator` and `vortex-client` directly (file paths cited throughout), plus the emulator's own status docs (`ROADMAP.md`, `TODO.md`, `CONSOLIDATION.md`, `DATA-MODEL.md`, `PETS-DESIGN.md`, `docs/walkthroughs/request-lifecycle.md`).

---


## Collectibles — the empty wallet list that hangs two tabs (fixed 2026-08-13)

`GetCollectibleWalletAddresses` used to be answered with a bare
`new CollectibleWalletAddressesMessageComposer()` — empty Stardust address, empty list. The client
is faithful to AS3 here and both tabs deadlock on that:

- `RewardClaimsTab` only leaves its loading state from `onNftClaimsMessage()` (when its per-wallet
  request queue drains) or `onNftClaimResultMessage()`. Zero wallets means zero requests, so
  neither fires.
- `CollectionsTab` disables its wallet dropdown when the list is empty, so `selectWallet()` and
  therefore `requestCollections()` are never reached, and its single `setReady(true)` inside
  `onNftCollectionsMessage()` never runs.

Verified against `sources/WIN63-202607011411-782849652/.../tabs/RewardClaimsTab.as` (lines 95-108
and 158-172): the Flash client has the same two exit points and would hang identically. **This is a
server gap, not a client bug** — do not "fix" it by forcing the tabs ready.

The handler now derives a deterministic Stardust address from `ctx.PlayerId` (`0x` + the id as
40 hex digits) and returns it. The client's parser pushes a non-empty Stardust address into its
wallet list, which is what unblocks both requests. There is no wallet grain and nowhere in the
client to link an external wallet, so the derived address is the whole feature.

Wire shape, covered by `Vortex.Revisions.Tests/Collectibles/CollectibleWalletAddressesWireTests.cs`:
the Stardust address is a string written **before** the count-prefixed list of the others, and an
empty string there means "none linked".

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Connection Lifecycle](#2-connection-lifecycle)
3. [Wire Protocol](#3-wire-protocol)
4. [Encryption Negotiation](#4-encryption-negotiation)
5. [Authentication](#5-authentication)
6. [Packet System In Depth](#6-packet-system-in-depth)
7. [Room System](#7-room-system)
8. [Chat](#8-chat)
9. [Catalog and Purchasing](#9-catalog-and-purchasing)
10. [Inventory](#10-inventory)
11. [Navigator](#11-navigator)
12. [Messenger and Friends](#12-messenger-and-friends)
13. [Trading and Marketplace](#13-trading-and-marketplace)
14. [Groups and Guilds](#14-groups-and-guilds)
15. [Avatar System](#15-avatar-system)
16. [Moderation](#16-moderation)
17. [WIRED](#17-wired)
18. [Pets and Bots](#18-pets-and-bots)
19. [Games](#19-games)
20. [Achievements](#20-achievements)
21. [Packet Alignment Audit](#21-packet-alignment-audit)
22. [Configuration and Deployment](#22-configuration-and-deployment)
23. [Threading and Performance](#23-threading-and-performance)
24. [Known Issues](#24-known-issues)
25. [Architecture Diagrams](#25-architecture-diagrams)

---

## 1. System Overview

### What Each Side Does

The **server** (Turbo Cloud) is the authoritative game state manager. It owns all persistent data (players, rooms, items, currencies) in MySQL via EF Core, enforces game rules inside Orleans grains, validates every action, and fans state changes back out to connected clients over Orleans streams. It never trusts the client.

The **client** (vortex-client) is a Flash-based rendering and input layer. It presents the hotel visually, captures user input, sends requests to the server, and applies the server's responses to the local display. It has no authority over game state.

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER / FLASH PLAYER                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  vortex-client (ActionScript 3)                        │  │
│  │  ├─ HabboAir.as           Entry point / app shell      │  │
│  │  ├─ HabboAirMain.as       Component bootstrap          │  │
│  │  ├─ com/sulake/core/       Core framework               │  │
│  │  │   └─ communication/     SocketConnection, EvaWireFormat │
│  │  └─ com/sulake/habbo/      Game modules                 │  │
│  │      ├─ communication/     HabboMessages, protocol       │  │
│  │      ├─ room/              Room engine & rendering       │  │
│  │      ├─ catalog/           Shop UI                       │  │
│  │      ├─ inventory/         Inventory UI                  │  │
│  │      ├─ navigator/         Room browser UI                │  │
│  │      ├─ avatar/            Figure rendering                │  │
│  │      └─ [20+ subsystems]                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │ TCP or WebSocket                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
              ══════════════╪══════════════  Network
                            │
┌───────────────────────────┼─────────────────────────────────┐
│  Turbo Cloud (Turbo.Cloud.sln, .NET 9/10 + Orleans)         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Turbo.Main               Host composition root        │  │
│  │  ├─ Turbo.Networking       SuperSocket TCP + WS, session│  │
│  │  ├─ Turbo.Crypto            DH + RSA + RC4              │  │
│  │  ├─ Turbo.Pipeline/Messages Generic envelope dispatch    │  │
│  │  ├─ Turbo.Revisions         Protocol def (Headers,       │  │
│  │  │   /Revision20260112      Parsers/, Serializers/)      │  │
│  │  ├─ Turbo.PacketHandlers    Orchestration-only handlers  │  │
│  │  ├─ Turbo.Rooms             RoomGrain (modules+systems)  │  │
│  │  ├─ Turbo.Players           PlayerGrain, PlayerPresence, │  │
│  │  │                          Messenger, Groups            │  │
│  │  ├─ Turbo.Catalog           CatalogPurchaseGrain, LTD     │  │
│  │  ├─ Turbo.Inventory         InventoryGrain                │  │
│  │  ├─ Turbo.Marketplace       Auction-style listings        │  │
│  │  ├─ Turbo.Navigator         Room search/categories         │  │
│  │  ├─ Turbo.Authentication    SSO ticket resolution           │  │
│  │  ├─ Turbo.Plugins           Assembly scan / hot reload      │  │
│  │  └─ [Furniture, Events, Observability, WebApi, ...]        │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                 │
│                    ┌──────┴──────┐                          │
│                    │  MySQL (EF  │                          │
│                    │  Core/Pomelo)│                         │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

Everything under a domain project (`Turbo.Rooms`, `Turbo.Catalog`, `Turbo.Players`, ...) is implemented as one or more **Orleans grains** — virtual actors, not singleton manager classes. There is no `Emulator`-style static service locator.

### Data Flow Summary

1. User performs an action in the client (click, type, drag).
2. Client builds a message via `HabboMessages.as`'s composer registry and sends it over the socket via `EvaWireFormat`.
3. Server's `ClientPacketDecoder` (`Turbo.Networking/Package`) decodes the frame into a typed message using the active `IRevision`'s parser table.
4. `MessageSystem`/`MessageRegistry` (`Turbo.Messages`) dispatch the message to every registered `IMessageHandler<T>` for that type (assembly-scanned at boot, not hand-registered).
5. The handler is orchestration-only — it resolves an Orleans grain (a room, player, catalog, etc.) and calls a method on it. All actual game logic and persistence lives in the grain.
6. The grain mutates state and — for room broadcasts — publishes an outgoing composer onto an **Orleans stream**, never writing to a socket directly.
7. Each affected player's `PlayerPresenceGrain` (subscribed to the relevant stream(s)) receives the composer and hands it to the session layer (`SessionObserver`), which serializes it via the revision's serializer table and writes the framed bytes to that player's actual socket.
8. Client receives the frame, `EvaWireFormat` decodes it, looks up the registered `MessageEvent` class by header, its parser extracts fields, and the registered callback updates UI/room state.

---

## 2. Connection Lifecycle

### Phase 1: Host Startup

`Turbo.Main/Program.cs` builds the host in a fixed order:

1. `builder.AddOrleans()` (`Turbo.Main/Extensions/HostApplicationBuilderExtensions.cs`) — configures a single-silo, localhost-clustered Orleans runtime (`UseLocalhostClustering()`, in-memory grain storage for player/room/pub-sub state, in-memory stream providers for the default and room stream providers). In non-Development environments this logs an explicit warning that this clustering configuration won't survive restarts or scale across nodes.
2. `AddTurboLogging → AddTurboNetworking → AddTurboPlugins → AddTurboDatabaseContext → AddTurboEventSystem → AddTurboMessageSystem → AddTurboCrypto → AddTurboRevisions`.
3. Domain plugin modules registered via `AddHostPlugin<TModule>`: `ObservabilityModule, AuthenticationModule, FurnitureModule, CatalogModule, PlayerModule, InventoryModule, MarketplaceModule, DashboardApiModule, NavigatorModule, RoomModule, PacketHandlersModule, WebApiModule`. Each module's assembly gets scanned later for message handlers.
4. `AddHostedService<TurboEmulator>()` — registered **last**, so it starts after `PluginBootstrapper` (which does the assembly scanning) and any hot-reload service.

`TurboEmulator.StartAsync` (`Turbo.Main/TurboEmulator.cs`): registers the embedded `Revision20260112` with `IRevisionManager`, sequentially reloads every static-data provider (furniture definitions, catalog/club-offer/club-gift snapshots, currency types, group badge parts, pet palettes/commands/levels, navigator contexts, room models), and only then calls `INetworkManager.StartAsync` — so TCP/WS sockets don't open until the revision and all data providers are warm.

### Phase 2: Transport

`NetworkManager` (`Turbo.Networking/NetworkManager.cs`) starts **two independent SuperSocket hosts concurrently** — a TCP host and a WebSocket host — both listening from the same process. This is a real architectural difference from a TCP-only classic server: vortex-client can (depending on build/config) connect over either transport, and both funnel into the same `PackageHandler`/`MessageSystem` dispatch stack (see §6).

### Phase 3: Handshake

```
Client                                          Server
  │                                                │
  │──── ClientHelloMessageEvent (4000) ───────────>│  version string
  │──── UniqueIDMessageEvent (2920) ──────────────>│  machine/device id
  │──── VersionCheckMessageEvent (3517) ──────────>│
  │                                                │
  │──── InitDiffieHandshakeMessageEvent (3644) ───>│  request DH parameters
  │<─── InitDiffieHandshakeComposer (2334) ────────│  RSA-signed prime, generator, server pubkey
  │                                                │
  │  (Client verifies signature, generates DH pair)│
  │                                                │
  │──── CompleteDiffieHandshakeMessageEvent (1517)>│  RSA-encrypted client DH public key
  │                                                │  Server computes shared secret,
  │                                                │  validates client key in range [2, p-2]
  │<─── CompleteDiffieHandshakeComposer (3034) ───│  server DH public key, sent in PLAINTEXT
  │                                                │  Server arms CryptoIn now, CryptoOut only if
  │                                                │  EnableServerToClientEncryption is true
  │                                                │
  │  ════ FURTHER CLIENT→SERVER PACKETS ARE RC4-ENCRYPTED ════
  │                                                │
  │──── SSOTicketMessageEvent (749) ──────────────>│  SSO token from web login
  │                                                │
  │<─── AuthenticationOKMessageComposer (3014) ────│  ~15 more composers follow (see §5)
  │                                                │
```

Note the asymmetry versus a "sign the DH params, encrypt the reply" model some servers use: Turbo's handshake **signs** (not encrypts) the prime/generator/server-pubkey with RSA (so the client can verify authenticity without needing to decrypt anything expensive), and only the client's own DH public key is RSA-**encrypted** on the wire (§4 has the full detail, including why the DH prime is only 384 bits).

### Phase 4: Session

After authentication, `ISessionGateway.AddSessionToPlayerAsync` binds the session to the player id, displacing any stale session for that player (so a reconnect kicks the old connection), registers an Orleans-callback `ISessionContextObserver` reference with `PlayerPresenceGrain`, and publishes a `PlayerConnectedEvent`. The user is now fully connected and can navigate rooms, chat, shop, etc.

### Phase 5: Disconnect

**Client side:** the socket closes; the client shows a disconnection overlay and may retry.

**Server side:** whichever transport (TCP `SessionContext` or `WebSocketSessionContext`) detects the close calls `ISessionGateway.RemoveSessionAsync`, which unbinds the player↔session mapping. Grain-side cleanup (removing the avatar from any active room, persisting final state) happens through the normal `PlayerPresenceGrain`/`RoomGrain` deactivation paths rather than a single global "dispose client" routine — there is no equivalent of a `GameClientManager.disposeClient()` god-method.

---

## 3. Wire Protocol

The frame format is **the same classic shape** you'd expect from any Habbo-derived protocol — this part of the old draft was actually correct in spirit, just wrongly attributed to Netty.

### Frame Structure

```
┌──────────────┬──────────────┬──────────────────────────┐
│ Length (4B)   │ Header (2B)  │ Body (variable)          │
│ big-endian    │ big-endian   │                          │
│ int32         │ uint16       │ type-specific fields     │
└──────────────┴──────────────┴──────────────────────────┘

Length = size of (Header + Body), NOT including the 4 length bytes themselves
```

### Data Types

| Type    | Wire Size | Encoding |
|---------|-----------|----------|
| int     | 4 bytes   | Big-endian signed 32-bit |
| short   | 2 bytes   | Big-endian signed 16-bit |
| boolean | 1 byte    | `0x00` = false, `0x01` = true |
| string  | 2 + N     | 2-byte big-endian length prefix, then N bytes of UTF-8 |

### Server Side: Encoding and Decoding

`Turbo.Networking/Package/ClientPacketDecoder.cs` (incoming):
1. Peek 4 bytes for the length. If RC4 is active on this session (`ctx.CryptoIn`), those 4 bytes are decrypted via `Rc4Engine.Peek(...)` — a clone-and-simulate read that does **not** consume real keystream — because with encryption on, the length prefix itself is encrypted and has to be read before the decoder knows how many more bytes to wait for.
2. Reject (`InvalidDataException`, connection closed) if `length < 0` or `length > MaxPacketBodyBytes` (default **65536**, `Turbo.Networking/Configuration/NetworkingConfig.cs` — not the 417,792 figure from the old draft).
3. Wait for `length + 4` bytes to be buffered; once available, decrypt the whole frame for real via `ctx.CryptoIn.Process(...)`, then read the 2-byte big-endian header immediately following the (now-discarded) length.

`Turbo.Primitives/Packets/AbstractSerializer.cs` (outgoing): writes a placeholder 4-byte length, then the 2-byte header, then the body; goes back and overwrites the length field with the real body+header length once serialization is complete.

`ClientPacket`'s primitive readers (`PopInt`, `PopShort`, `PopString`, ...) all use `BinaryPrimitives.Read*BigEndian`; the outgoing side's writers are the fluent `WriteInteger`/`WriteShort`/`WriteString`/`WriteBoolean` equivalents.

### Client Side: Encoding and Decoding

`EvaWireFormat.as` (`vortex-client/src/com/sulake/core/communication/wireformat/EvaWireFormat.as`) mirrors the server's logic: encodes a composer's field array into the same length+header+body frame, encrypting via `ArcFour` if the handshake has completed; on receive, reads the frame, decrypts, looks up the header in `HabboMessages.as`'s `_events` map to get the right `MessageEvent` subclass, and hands the payload to its parser.

### Maximum Packet Size

`NetworkingConfig.MaxPacketBodyBytes` = **65536 bytes** (config section `Turbo:Networking`), enforced identically for both the TCP and WebSocket transports since both funnel through the same decoder.

---

## 4. Encryption Negotiation

### Overview

`Turbo:Crypto` config (`Turbo.Crypto/Configuration/CryptoConfig.cs`) controls whether encryption runs at all (`EnableServerToClientEncryption` gates the *server→client* direction specifically — client→server RC4 is always armed once the handshake completes). The scheme is Diffie-Hellman (secured by RSA signing/encryption) producing a shared secret used as an RC4 stream-cipher key — same overall shape as classic Habbo servers, different concrete implementation.

### Step-by-Step

**1. Client requests DH parameters** — `InitDiffieHandshakeMessageEvent` (header 3644), essentially an empty request.

**2. Server generates/serves DH parameters** — `Turbo.Crypto/DiffieService.cs`:
- Uses a **fixed, hard-coded 384-bit safe prime** (`p = 2q+1` form, generator `2`) rather than generating a fresh prime per boot. This is a deliberate, documented trade-off: the client can only RSA-decrypt a DH public key up to the ~117-byte block size of a 1024-bit RSA key, which caps the DH prime size — the code comment explicitly calls this "an accepted residual risk imposed by the legacy client handshake," below the ≥2048-bit modern recommendation.
- Server's own DH keypair (`DH_PRIVATE_BIT_SIZE = 380` random bits, top bit forced set) is generated fresh via `SecureRandom` **once per process start**, not per session.
- The prime, generator, and server public key are each **RSA-signed** (`RsaService.Sign` — really a raw private-key PKCS#1 encryption of the decimal string form, chunked; not a padded verifiable signature scheme) and returned as lowercase hex via `InitDiffieHandshakeComposer` (header 2334).

**3. Client processes DH parameters** — verifies/uses the values, generates its own DH keypair, computes the shared secret, derives an RC4 key.

**4. Client sends its public key** — `CompleteDiffieHandshakeMessageEvent` (header 1517), RSA-**encrypted** (not signed) hex string.

**5. Server completes the handshake** — `Turbo.PacketHandlers/Handshake/CompleteDiffieHandshakeMessageHandler.cs`:
- `DiffieService.GetSharedKey(...)` hex-decodes and RSA-decrypts the client's public key, parses it as a decimal `BigInteger`, **validates it's in range `[2, p-2]`** (rejects trivial/small-subgroup values — a real security check the legacy protocol shape doesn't strictly require but this implementation adds anyway), computes `clientPubKey^serverPrivate mod p`, and uses the unsigned byte representation as the RC4 key.
- Replies with `CompleteDiffieHandshakeComposer` (header 3034, containing the server's own DH public key) — **sent in plaintext**, *then* calls `ISessionContext.SetupEncryption(sharedKey, enableServerToClientEncryption)` to arm the RC4 engines. `CryptoIn` (client→server) is always armed; `CryptoOut` (server→client) only if the config flag is set.

**6. All subsequent client→server traffic is RC4-encrypted** (and server→client too, if `EnableServerToClientEncryption`). Both the length prefix and the body are covered.

### RSA Key Configuration

`Turbo:Crypto` config keys (`CryptoConfig`): `KeySize` (actually the RSA public **exponent** hex, not a byte length — a slightly confusing name inherited from the field's role), `PublicKey` (modulus hex), `PrivateKey` (private exponent hex, server-only), `EnableServerToClientEncryption` (bool). `RsaService` builds BouncyCastle `RsaKeyParameters` from these and does PKCS#1 encrypt/decrypt via `Pkcs1Encoding(RsaEngine)`.

The client has the matching public exponent/modulus embedded in its own crypto classes; if these don't match the server's `PublicKey`, the DH handshake will fail (the client can't correctly verify/decrypt).

### Security Notes

- RC4 is a weak cipher by modern standards; this is accepted as inherent to supporting the legacy Flash client, not a Turbo-specific oversight.
- The 384-bit DH prime is well below modern recommendations — again, a deliberate, documented legacy-client constraint (see step 2), not an accidental bug.
- `Rc4Engine` (`Turbo.Crypto/Rc4Engine.cs`) is a standard KSA+PRGA implementation with a `Peek` mode (clone-and-simulate without consuming keystream) specifically to support reading the still-encrypted length prefix in the decoder (§3) — a small but important implementation detail that a naive RC4 port would miss.

---

## 5. Authentication

### SSO Token Flow

There is no separate password-based login packet — authentication is **exclusively SSO-ticket based**:

1. User logs into a **web application** outside this repo, which mints a ticket and stores it as a `SecurityTicketEntity` row (`Turbo.Database.Entities.Security`).
2. The client sends that ticket via `SSOTicketMessageEvent` (header 749).
3. `Turbo.PacketHandlers/Handshake/SSOTicketMessageHandler.cs` calls `IAuthenticationService.GetPlayerIdFromTicketAsync` (`Turbo.Authentication/AuthenticationService.cs`):
   - Looks up the ticket row via `IDbContextFactory<TurboDbContext>`.
   - Missing ticket → publishes `PlayerLoginFailedEvent` (with an HMAC-SHA256 hash of the remote IP, never the raw IP) and fails.
   - Expired (past `entity.ExpiresAt`, or `CreatedAt + TicketTtlSeconds` if unset) and not locked → deletes the ticket and fails.
   - Otherwise **refreshes the ticket's expiry** on every successful use (bounded replay window, allows reconnect without a fresh ticket) and returns the resolved player id, publishing `PlayerLoggedInEvent`.
4. The handler checks `IPlayerGrain.GetActiveBanExpiryAsync` **before** registering the session — a banned account gets `UserBannedMessageComposer` and the connection is closed without ever being added to `ISessionGateway`.
5. On success, `ISessionGateway.AddSessionToPlayerAsync` binds the session, and the handler fires off the login response burst.

### Login Response Burst

`SSOTicketMessageHandler` sends roughly 15 composers in sequence after a successful login (exact set depends on account state — moderator bootstrap composers are conditional on rank): `AuthenticationOKMessageComposer`, avatar effects, navigator settings, favourite rooms, figure set ids, noobness level, user rights, club/gift info, credit balance, activity points, availability status, achievement score (the player's real score — see §20, which used to claim
otherwise), first-login-of-day flag, mystery box keys, builders club status, perk allowances, and (if the account has moderator rank) `ModeratorInitMessageComposer`/`CfhTopicsInitMessageComposer`.

### Permissions

`Turbo.Authentication/Permissions/PermissionService.cs` (`IPermissionService.ResolveForPlayerAsync`) resolves the player's `PermissionSet` from `RoleEntity`/`RolePermissionEntity`/`PlayerAccountRoleEntity` — this is what gates moderator-tool bootstrap and every `Capabilities.Moderation.*`-checked handler (§16). See §24 for a real, currently-open gap in how new accounts get their initial role.

---

## 6. Packet System In Depth

### How Packets Map to Code

Packet IDs and their handling code are defined in exactly **one place**: `Turbo.Revisions/Revision20260112/Headers.cs`, two `internal static class`es of `public const int` fields —

```csharp
// Headers.cs
internal static class MessageEvent      // client → server (incoming to the server)
{
    #region Incoming
    public const int MoveAvatarMessageEvent = 144;
    public const int ChatMessageEvent = 641;
    public const int SSOTicketMessageEvent = 749;
    // ... ~525 entries
}

internal static class MessageComposer   // server → client (outgoing from the server)
{
    #region Outgoing
    public const int ChatMessageComposer = 1264;
    public const int OpenConnectionMessageComposer = 1915;
    public const int AuthenticationOKMessageComposer = 3014;
    // ... ~538 entries
}
```

`Turbo.Revisions/Revision20260112/Revision20260112.cs` (3480 lines) builds the actual `IRevision` from these constants: `Parsers` is `IDictionary<int, IParser>` keyed by the `MessageEvent` ids; `Serializers` is `IDictionary<Type, ISerializer>` keyed by the **composer's CLR type** (each serializer's constructor is handed its header id from `MessageComposer`). Both dictionaries are hand-built object initializers, grouped into `#region`s by domain (Room, Catalog, Inventory, Navigator, FriendList, Moderator, Handshake, Game, Wired, ...).

`Turbo.Networking/Revisions/RevisionManager.cs` (`IRevisionManager`) holds a `Dictionary<string, IRevision>` keyed by the revision's build string (`"WIN63-202601121721-391685409"` for the embedded default). This is the plugin extension point: additional client revisions can be registered by a separate plugin without touching core code — see `CONTEXT.md`'s note that `Revision<id>/Parsers|Serializers` trees for *other* revisions belong in a plugin repo, not in `turbo-cloud` itself.

### Client — `HabboMessages.as` (~1,996 lines)

```actionscript
// vortex-client/src/com/sulake/habbo/communication/HabboMessages.as
_composers[144] = MoveAvatarMessageComposer;   // client sends this to header 144
_composers[641] = ChatMessageComposer;

_events[1264] = ChatMessageEvent;              // client receives this from header 1264
_events[1915] = OpenConnectionMessageEvent;
```

Note the naming convention is **side-relative**: the same logical "chat" packet is `ChatMessageEvent`/`ChatMessageComposer` on the server (event = server receives, composer = server sends) and `ChatMessageComposer`/`ChatMessageEvent` on the client (composer = client sends, event = client receives) — mirror images of each other. What has to match between the two codebases is the **numeric header id** and the **field order/types**, not the class name.

### Handler Instantiation (Server)

There is no manual registration file to edit. `Turbo.Plugins/PluginBootstrapper.cs` (an `IHostedService` that runs before `TurboEmulator`) iterates every `IHostPluginModule` registered in `Program.cs` and calls `AssemblyProcessor.ProcessAsync` on each module's assembly. For `PacketHandlersModule` (assembly = `Turbo.PacketHandlers`), this uses reflection (`AssemblyExplorer.FindClosedImplementations`) to find every class implementing `IMessageHandler<TMessage>` and registers it — activator + invoker delegates — on the shared `MessageRegistry`. **Dropping a new `IMessageHandler<T>` class into `Turbo.PacketHandlers/<Domain>/` is the entire registration step.**

Dispatch (`Turbo.Messages/MessageSystem.cs` → `Turbo.Messages/Registry/MessageRegistry.cs`, both built on the generic `Turbo.Pipeline` envelope-dispatch engine also reused by `Turbo.Events` for domain events):
- Resolves the acting player id and active room id from `ISessionGateway`/`IPlayerPresenceGrain`.
- Runs every matching handler for a message type **in parallel** (`Task.WhenAll`, `HandlerExecutionMode.Parallel`, unbounded degree of parallelism) — not sequentially like a single-dispatch classic server.
- Handler/behavior errors are caught, logged, and reported to an `IErrorGroupingSink` — a bad handler doesn't take down the connection.

Representative real handlers:

```csharp
// Turbo.PacketHandlers/Room/Engine/MoveAvatarMessageHandler.cs
public class MoveAvatarMessageHandler(IRoomService roomService) : IMessageHandler<MoveAvatarMessage>
{
    public async ValueTask HandleAsync(MoveAvatarMessage message, MessageContext ctx, CancellationToken ct) =>
        await roomService.ClickTileAsync(ctx.AsActionContext(), message.TargetX, message.TargetY, ct);
}
```

```csharp
// Turbo.PacketHandlers/Room/Chat/ChatMessageHandler.cs
public class ChatMessageHandler(IGrainFactory grainFactory) : IMessageHandler<ChatMessage>
{
    public async ValueTask HandleAsync(ChatMessage message, MessageContext ctx, CancellationToken ct)
    {
        if (ctx.PlayerId <= 0 || ctx.RoomId <= 0) return;
        await grainFactory.GetRoomGrain(ctx.RoomId)
            .SendChatFromPlayerAsync(ctx.PlayerId, message.Text, 0, message.StyleId, [], message.TrackingId)
            .ConfigureAwait(false);
    }
}
```

Handlers are **orchestration-only** — guard the context, resolve one grain, delegate, return. This is a hard architectural rule stated in the emulator's own `CONTEXT.md`: no persistence, no business logic, no direct socket access inside a handler.

### Field Read/Write Convention

Parsers and serializers under `Turbo.Revisions/Revision20260112/{Parsers,Serializers}/**` use the same `Pop*`/`Write*` idiom as the classic protocol shape:

```csharp
// Turbo.Revisions/Revision20260112/Parsers/Room/Engine/MoveAvatarMessageParser.cs
public IMessageEvent Parse(IClientPacket packet) =>
    new MoveAvatarMessage { TargetX = packet.PopInt(), TargetY = packet.PopInt() };

// Turbo.Revisions/Revision20260112/Parsers/Room/Chat/ChatMessageParser.cs
public IMessageEvent Parse(IClientPacket packet) =>
    new ChatMessage { Text = packet.PopString(), StyleId = packet.PopInt(), TrackingId = packet.PopInt() };
```

```csharp
// Turbo.Revisions/Revision20260112/Serializers/Room/Chat/ChatMessageComposerSerializer.cs (shape)
packet.WriteInteger(message.ObjectId).WriteString(message.Text).WriteInteger(message.Gesture)...
```

If the field order or types diverge between a Turbo parser and vortex-client's matching composer (or vice versa), the packet is misread — there is no schema validation on the wire, only sequential binary reads, same as any classic Habbo-derived protocol.

### Broadcast Patterns

| Pattern | Mechanism | Use Case |
|---------|-----------|----------|
| **Room broadcast** | `RoomGrain.SendComposerToRoomAsync` publishes to the room's Orleans stream (`RoomOutbound`); every subscribed `PlayerPresenceGrain` delivers to its own session(s) | Chat, movement, item state |
| **Target player** | `MessageContext.SendComposerAsync` / `PlayerPresenceGrain.SendComposerAsync` directly | Login response, inventory, personal data |
| **Friends** | Iterate the target's `MessengerGrain` friend list, resolve each friend's presence | Online status changes |
| **Group members** | Iterate group membership via `GroupGrain`/`GroupDirectoryGrain` | Guild announcements |

The critical architectural point (see the full walkthrough in §7 and §25): **a room grain never touches a socket.** It only ever publishes to a stream; delivery is entirely the presence grain's responsibility. This is what lets a room deactivate, rehydrate, or (in a real multi-silo deployment) migrate without any socket-handling code needing to know or care.

---

## 7. Room System

### Entering a Room

`Turbo.PacketHandlers/Room/Session/OpenFlatConnectionMessageHandler.cs` → `IRoomService.OpenRoomForPlayerIdAsync` (`Turbo.Rooms/RoomService.cs`):

```
Client                                          Server
  │                                                │
  │──── RoomNetworkOpenConnectionMessageEvent ────>│  roomId (header 2407)
  │                                                │
  │<─── OpenConnectionMessageComposer (1915) ──────│  sent immediately
  │                                                │
  │  [room.EnsureRoomActiveAsync() — activates the RoomGrain if needed]
  │  [Rights/full/locked/password check — owners/rights-holders bypass all three;
  │   on rejection: CantConnectMessageComposer + RoomConnectionErrorType, and stop]
  │                                                │
  │<─── RoomReadyMessageComposer (2244) ──────────│  Batch 1: map/entry state
  │<─── RoomRatingMessageComposer ────────────────│  (hardcoded Rating=0 — see §24)
  │<─── RoomEntryTileMessageComposer ─────────────│  door X/Y/rotation
  │<─── HeightMapMessageComposer ──────────────────│  tile-encoded heights
  │<─── FloorHeightMapMessageComposer ─────────────│  scale type, wall height, model
  │                                                │
  │<─── RoomEntryInfoMessageComposer ─────────────│  Batch 2: contents/rights
  │<─── ObjectsMessageComposer (3997) ─────────────│  floor items + owner names
  │<─── ItemsMessageComposer ──────────────────────│  wall items + owner names
  │<─── UsersMessageComposer (1835) ───────────────│  avatar snapshots
  │<─── UserUpdateMessageComposer ─────────────────│
  │<─── YouAreControllerMessageComposer ──────────│  real resolved rights (fixed 2026-07-05)
  │<─── WiredPermissionsEventMessageComposer ─────│  gated on rights
  │                                                │
  │<─── YouAreOwnerMessageComposer ────────────────│  only if owner
  │<─── DanceMessageComposer (per dancing avatar) ─│
  │                                                │
  │  [playerPresence.SetActiveRoomAsync(roomId) — subscribes to the room's stream]
  │                                                │
```

`YouAreControllerMessageComposer` sending the *real* resolved `RoomControllerType` (rather than a hardcoded owner-or-none value) was fixed 2026-07-05 (`ROADMAP.md` Story 1.2). Doorbell/queue UX for locked rooms (a request-to-enter flow) is explicitly out of scope for the current build — only the flat reject ships.

### Room Grain Architecture

`Turbo.Rooms/Grains/RoomGrain.cs` is a `sealed partial class` split across 9 files by concern (`.Security`, `.Map`, `.Settings`, `.Avatar`, `.Pets`, `.Furni`, `.Furni.Floor`, `.Furni.Wall`, `.Moderation`). It composes:

- **Modules** (own a slice of state + operations on it): `RoomActionModule`, `RoomAvatarModule`, `RoomEventModule`, `RoomFurniModule`, `RoomMapModule`, `RoomObjectModule`, `RoomSecurityModule`.
- **Systems** (behavioral engines over that state): `RoomPathingSystem`, `RoomAvatarTickSystem`, `RoomPetSystem`, `RoomRollerSystem`, `RoomWiredSystem`, `RoomChatSystem`.

Both are plain classes holding a back-reference to the grain, constructed once when the grain activates — calling them is an in-process method call, not an Orleans round-trip.

**The room tick** is a single Orleans `RegisterGrainTimer` firing every `RoomConfig.RoomTickMs` = **50ms**, which internally gates each sub-system against its own independent boundary:

| Sub-system | Interval (`RoomConfig`) |
|---|---|
| Avatar movement step | `AvatarTickMs` = 500ms (the direct analog of the classic ~500ms Habbo walk tick) |
| Roller movement | `RollerTickMs` = 2000ms |
| WIRED evaluation | `WiredTickMs` = 50ms |
| Dirty item/tile persistence flush | `DirtyItemsTickMs` = 2000ms |

Boundaries are computed against a per-room `EpochMs` set at first activation, so each sub-system only does real work once its own interval has elapsed even though the outer timer fires every 50ms. `RoomGrain.OnDeactivateAsync` flushes dirty state and deregisters from `RoomDirectoryGrain` before Orleans deactivates the grain (idle timeout `RoomDeactivationDelayMs` = 1,800,000ms / 30 minutes, or explicit deactivation).

There is no `RoomUnit` grain — avatars, pets, and bots-as-a-concept are plain in-memory objects (`IRoomAvatar` et al., `Turbo.Primitives.Rooms.Object.Avatars`) living in the room grain's own dictionaries.

### Movement

`MoveAvatarMessageHandler` → `IRoomService.ClickTileAsync` → `RoomGrain.ClickTileAsync` (fires wired click-tile triggers) + `WalkAvatarToAsync` (kicks off pathing). Pathfinding is a real **A\*** (`Turbo.Rooms/Grains/Systems/RoomPathingSystem.cs`): 8-directional, cardinal cost 10 / diagonal cost 14 (classic Habbo-style costs), capped at `MaxPathNodes` = 4096, walkability delegated to `RoomMapModule` (height-diff limited by `MaxStepHeight`, diagonal-corner checking configurable via `EnableDiagonalChecking`).

Per-tick advancement (`RoomAvatarTickSystem`, gated at the 500ms avatar boundary): pops one tile off the path, validates the step, fires floor-item walk-on/walk-off hooks, updates position/rotation, and **batches all changed avatars into one `UserUpdateMessageComposer` broadcast per tick** rather than one packet per avatar.

### Furniture Interaction

Dispatch chain: `UseFurnitureMessageHandler` → `IRoomService.UseItemInRoomAsync` → `RoomGrain.UseItemByIdAsync` → `RoomActionModule` (permission check via `RoomSecurityModule.CanUseFurniAsync`, with a rentable-space fallback) → `RoomFurniModule.UseItemByIdAsync` → `item.Logic.OnUseAsync(...)`.

Interaction behavior is **not** a classic `InteractionDefault`/`InteractionTeleport` class hierarchy — it's a string-keyed **`RoomObjectLogic`** registry (`Turbo.Rooms/Providers/RoomObjectLogicProvider.cs`), populated at startup by scanning for a `[RoomObjectLogic("key")]` attribute, falling back to `"default_floor"` for any furniture whose logic-type string has no registered class. Real non-wired logic types that exist: `default_floor`, `default_wall`, `default_avatar`, `dice`, `fireworks`, `roller`, `wheel_of_fortune`, `gate`, `room_invisible_click_tile`, `pet_food`/`pet_nest`/`pet_drink`, `monsterplant_seed`. This is a smaller set than classic Habbo's `InteractionType` zoo (no dedicated teleport/vending/trophy-specific classes) — most special furniture is handled more generically. WIRED itself is implemented as ~90 additional `RoomObjectLogic` subclasses (§17).

### The Golden Rule: Rooms Don't Touch Sockets

The single most important correction versus a classic single-process server design: **a `RoomGrain` never writes to a socket.** It calls `SendComposerToRoomAsync`, which publishes to an Orleans stream (`RoomOutbound`, keyed by room id). Every player currently in that room has a `PlayerPresenceGrain` subscribed to the stream; each one receives the composer independently and hands it to its own `SessionObserver` for the actual socket write. See the full traced example in §25 — this is exactly how a chat message actually reaches the screen.

---

## 8. Chat

### Sending a Message

```
Client                                          Server
  │                                                │
  │  [User types "Hello!" and presses Enter]       │
  │                                                │
  │──── ChatMessageEvent (641) ───────────────────>│  text, styleId, trackingId
  │     (shout: ShoutMessageEvent 2286)             │
  │     (whisper: WhisperMessageEvent)              │
  │                                                │
  │  [RoomChatSystem.SendChatFromPlayerAsync]      │
  │  [  Resolve player → avatar in this room;      │
  │     drop silently if none]                     │
  │  [  Mute check (RemainingMutePeriodMessageComposer if muted)]
  │  [  Persist to RoomChatlogEntity, truncated to 100 chars]
  │                                                │
  │<─── ChatMessageComposer (1264) ────────────────│  broadcast to room via stream
  │     (shout: ShoutMessageComposer 3310)          │
  │     (whisper: WhisperMessageComposer, sender+target only) │
  │                                                │
```

### Chat Variants

| Client sends | Header | Server system | Broadcast scope |
|---|---|---|---|
| `ChatMessageEvent` | 641 | `RoomChatSystem` | Room-wide |
| `ShoutMessageEvent` | 2286 | `RoomChatSystem` | Room-wide |
| `WhisperMessageEvent` | — (see §21) | `RoomChatSystem` | Sender + target only |

### Real Gaps (not present in this server today)

- **No word/profanity filter.** There is no filtering, substitution, or blocking logic anywhere in the chat path.
- **No flood control is enforced.** `RoomEntity.ChatFloodType` (`ChatSettingsSnapshot.FloodSensitivity`) is a real, persisted per-room setting — readable and settable via `SaveRoomSettingsMessageHandler` — but `RoomChatSystem` never reads it. It is dead configuration today. Per-room custom word-filter handlers (`GetCustomRoomFilterMessageHandler`/`UpdateRoomFilterMessageHandler`) are the one remaining stub in the RoomSettings area (`ROADMAP.md` Story 1.4).

Do not assume either protection exists when reasoning about client behavior — messages of any content and any rate reach the room as sent.

---

## 9. Catalog and Purchasing

### Purchasing an Item

`PurchaseFromCatalogMessageHandler` → the per-player **`CatalogPurchaseGrain`** (`Turbo.Catalog/Grains/CatalogPurchaseGrain.cs`, `ICatalogPurchaseGrain.PurchaseOfferFromCatalogAsync`):

1. Looks up the offer in the in-memory `CatalogSnapshot` (built/reloaded by `CatalogSnapshotProvider`, DB-backed).
2. Resolves club level/discount via `IPlayerGrain.GetClubSubscriptionAsync`.
3. Builds a list of `WalletDebitRequest`s covering the credits/silver/activity-point cost.
4. Calls `IPlayerWalletGrain.ExecutePurchaseAsync(debitRequests, grantCallback, ...)` — an **atomic debit-then-grant** pattern: the grant callback only runs if every debit succeeds, and if the grant itself throws, the wallet is refunded (`CreditBackAsync`) rather than left in a charged-but-ungranted state.
5. The grant callback calls `IInventoryGrain.GrantCatalogOfferAsync`, tracks spend for kickback purposes, and publishes a `CatalogPurchasedEvent`.

**Limited-edition items** get their own dedicated grain, `LtdRaffleGrain` (keyed per LTD series) — batches raffle entries; a losing entry's refund is awaited (`Task.WhenAll`), not fire-and-forget (a real fix logged in `CONSOLIDATION.md`).

Other catalog grains: `VoucherGrain` (redeem-code grain), a room-ad purchase path in `CatalogPurchaseGrain.RoomAd.cs` (marked partial — needs more room/furniture orchestration per `ROADMAP.md` Story 4.2). Builders Club subscription tiers are tracked in `Vortex.Players/BuildersClubService.cs`.

**Builders Club is a catalog feature here and nothing more — the enforcement half does not exist.**
Worth stating plainly, because every other mention of Builders Club in these docs is about the
catalog and the placement flow, both of which work, and their absence of a caveat reads as
"the feature is done". It is not:

- **A lapsed subscription locks nothing.** In Habbo, a room whose owner is no longer paying is
  invisible in the navigator and refuses entry to everyone but the owner and staff. There is no
  Builders Club condition anywhere in the emulator's room-entry or navigator-listing paths — grep
  `BuildersClub` under `Vortex.Rooms`/`Vortex.Navigator`/the navigator and room handlers and you
  get nothing. `IBuildersClubService` is read by the catalog handler and the SSO handshake, and by
  no one else.
- **Nothing to port on the client side, either.** The rule is server-enforced: the AS3 client has
  no room-access gate for it. Its only Builders-Club mentions outside the catalog are the toolbar,
  the furni data, and a FAQ link in the room settings.
- **The marker is missing one level deeper.** The client recognises a Builders Club item purely by
  its **id range** — `2147418112 .. 2147483647` (`BuilderClubUtils.isBuilderClubId`, AS3
  `_SafeCls_1824`). That range appears nowhere in the emulator, so Builders Club furniture is
  allocated ordinary ids and the server has no way to answer "does this room contain Builders Club
  furniture". Seven client call sites that consult it are therefore permanently false: the
  "Builders Club" owner label in the furni chooser, the owner marker and provenance tint in
  `InfoStandFurniView`, the pickup confirmation in `InfoStandWidgetHandler`, and two `RoomEngine`
  guards.

So the room lock is not a wiring job: allocating Builders Club furniture inside the id range the
client already expects comes first — that alone revives the seven dead call sites — and only then
can a navigator filter and an entry refusal (bypassed for the owner and for `room.moderate.any`)
have anything to test.

### Currencies

`CurrencyType` (`Turbo.Primitives/Players/Enums/Wallet/CurrencyType.cs`):

```csharp
public enum CurrencyType { Credits = 1, Silver = 2, Emeralds = 3, ActivityPoints = 4 }
```

**Named seasonal currencies (classic "Duckets"/"Diamonds") are not hardcoded enum values** — they're modeled generically as `ActivityPoints` with an `ActivityPointType` int discriminator, resolved against a DB-seeded `currency_types` table. There is no committed seed data naming any specific seasonal currency; that's an admin/DB-seeding concern, not a code concern. Don't assume a specific currency name maps to a specific enum member — check the seeded `CurrencyTypeEntity` rows instead.

### Explicitly Deferred

Targeted offers (`GetTargetedOffer`/`PurchaseTargetedOffer` etc.), the seasonal-calendar daily offer, and full gift-flow completeness are open work per `ROADMAP.md` Story 4.2/4.4 — not present yet.

---

## 10. Inventory

### Loading Inventory

Per-player **`InventoryGrain`** (`Turbo.Inventory/Grains/InventoryGrain.cs` + `.Furni.cs`/`.Pets.cs` partials), hydrated from DB via `InventoryFurnitureLoader`. The client requests furniture inventory on demand (`RequestFurniInventoryMessageHandler`) → `IPlayerPresenceGrain.OpenFurnitureInventoryAsync` (`Turbo.Players/Grains/Modules/PlayerInventoryModule.cs`) fetches all item snapshots from the grain and **fragments** them into `FurniListEventMessageComposer` packets, sized by a config value (`PlayerPresenceConfig.FurniInventoryFragmentSize` — no longer a hardcoded 100, per `CONSOLIDATION.md`).

### Placing Furniture

Real flow, a clean two-grain cross-call matching the "one grain per responsibility" rule in `CONTEXT.md`:

1. `IInventoryGrain.GetItemSnapshotAsync(itemId)` on the **player's** inventory grain — validates ownership/product type.
2. `IRoomGrain.PlaceFloorItemAsync`/`PlaceWallItemInRoomAsync` on the **room's** grain — the actual world-state mutation, gated by `RoomSecurityModule.CanPlaceFurniAsync`.

Handler: `Turbo.PacketHandlers/Room/Engine/PlaceObjectMessageHandler.cs` (parses wall vs. floor coordinate strings) → `IRoomService.PlaceFloorItemInRoomAsync`/`PlaceWallItemInRoomAsync` (`Turbo.Rooms/RoomService.Floor.cs`/`.Wall.cs`).

The place/move/pickup/use core furniture loop is complete for the literal verbs (`ROADMAP.md` Epic 1: "100%"); peripheral extras (gift/mystery-trophy consumables, dimmer, mannequin figure display, YouTube display furni, rent/buyout flows, pet mounting UX) remain partial — the underlying furniture stuff-data types (`Turbo.Furniture/StuffData/*.cs`) exist, the surrounding UX flows for some of them don't.

---

## 11. Navigator

Core classes: `Turbo.Navigator/NavigatorService.cs` (`INavigatorService`), `Turbo.Navigator/NavigatorProvider.cs` (`INavigatorProvider`, DB-backed cache).

Categories and quick-links are **entirely data-driven**, not one-hardcoded-handler-per-feature: `NavigatorProvider.ReloadAsync` loads `NavigatorTopLevelContextEntity`/`NavigatorFlatCategoryEntity` rows, each carrying a `SearchCode` string mapped to a `NavigatorQueryType` enum value via a dictionary built from that DB data. `NavigatorService.FetchRoomsAsync` dispatches on the resolved query type:

- `MyRooms` → rooms owned by the player.
- `MyFavorites` → joins `PlayerFavouriteRooms`.
- `ByFlatCategory` → category-filtered.
- `RoomAds` → advertised rooms.
- default (covers "official"/"popular"/anything else unmapped) → all rooms, **sorted by live population** (`OrderByDescending(x => x.UsersNow)`) — there is no separate "official rooms" curation list or "popularity" scoring algorithm; `Score`/`Ranking` fields are hardcoded to 0 in the underlying query extension.

`GetRoomsByTagAsync` is a stub returning an empty list — tag search does not work. "My rooms"/favorites/search/room creation (`NewNavigatorInitMessageHandler`, `NewNavigatorSearchMessageHandler`, `CreateFlatMessageHandler`, `GetGuestRoomMessageHandler`) are real. `ROADMAP.md` puts `NewNavigator` at 100% and the legacy `Navigator` handler set at ~64% (the remaining stubs are peripheral: room-events, room-ads-catalog tie-in, staff-pick/tags/popular-tags/home-room/rate-flat).

---

## 12. Messenger and Friends

No separate "Messenger" project — it's a set of grains on **`Turbo.Players/Grains/`**, split by concern:

- `MessengerGrain.cs` — lifecycle/hydration, per-player grain.
- `MessengerGrain.Friends.cs` — friend list, requests, accept/decline, blocking.
- `MessengerGrain.Messaging.cs` — instant messages, including an **offline delivery queue**: undelivered `MessengerMessageEntity` rows are read and flushed on a timer (the same "queue dirty state, flush via `RegisterGrainTimer`, flush on deactivate" pattern used elsewhere for housekeeping writes).
- `MessengerGrain.Presence.cs` — online/offline fan-out to friends.

All the expected handlers exist and are real (not stubs): friend request/accept/decline/remove, friend-request list, messenger init, send/get message history, follow-friend, room invites, Habbo search, relationship status, visit-user. `ROADMAP.md` lists Epic 5 ("Social") as **Partial** overall, but friends/messenger specifically are the functionally-complete part of that epic.

---

## 13. Trading and Marketplace

These are **two entirely separate systems** — treat them as unrelated features, not two names for the same thing.

### Trading (classic two-player room exchange) — Does Not Exist

Every handler under `Turbo.PacketHandlers/Inventory/Trading/` is a **100% empty stub**:

```csharp
// e.g. OpenTradingMessageHandler.cs, AddItemToTradeMessageHandler.cs, and 8 others
public async ValueTask HandleAsync(...) { await ValueTask.CompletedTask.ConfigureAwait(false); }
```

Confirmed by `TODO.md` ("Trading … are stubs"), `ROADMAP.md` (Epic 6: **Stub**), and `DATA-MODEL.md` §7 (describes the *intended*, not-yet-built design: a transient offer/lock/confirmation flow, no persistent state table). One related piece already exists ahead of the feature itself: `ModTradingLockMessageHandler.cs` lets staff lock a user's trading ability, even though trading itself can't be used yet.

### Marketplace (async listing/auction) — Real and Working

`Turbo.Marketplace/Grains/MarketplacePurchaseGrain.cs` (`IMarketplacePurchaseGrain`): `MakeOfferAsync(itemId, price)` validates ownership via the seller's `InventoryGrain`, takes a flat commission (`COMMISSION_PERCENT = 1`), and lists for a fixed `OFFER_DURATION` (3 days). `BuyOfferAsync` atomically claims the offer (`ExecuteUpdate` guarded on `State == Active`) and re-lists it if the inventory grant fails after payment — closing a real "sold but ungranted" bug (`CONSOLIDATION.md` R6). `MarketplaceSearchGrain` handles search/stats queries. Handlers: `Turbo.PacketHandlers/Marketplace/*` (`MakeOfferMessageHandler`, `GetMarketplaceOffersMessageHandler`, `BuyMarketplaceOfferMessageHandler`, `CancelMarketplaceOfferMessageHandler`, `GetMarketplaceItemStatsMessageHandler`, `RedeemMarketplaceOfferCreditsMessageHandler`, `BuyMarketplaceTokensMessageHandler`).

In short: **Marketplace** = list an item for sale, any other player buys it asynchronously, no direct negotiation. **Trading** = synchronous two-player item-for-item exchange in a room — unimplemented.

---

## 14. Groups and Guilds

Fully implemented — a real subsystem, not a stub. Lives in `Turbo.Players/Grains/`:

- `GroupDirectoryGrain.cs` (singleton grain) — creation wizard data, **group creation** (validates room ownership, room-not-already-a-guild-base, publishes a cancellable `GroupCreatingEvent`, debits creation cost via `IPlayerWalletGrain.TryDebitAsync`, creates the group + enrolls the owner as admin, publishes `GroupCreatedEvent`), memberships, favouriting, badge editor data, forums listing.
- `GroupGrain.cs` — per-group member management; `AdminOnlyDecoration`/`MembersCanDecorate` are real DB-backed columns (re-verified per `CONSOLIDATION.md` P2, not hardcoded).
- `GroupForumGrain.cs` — thread/post CRUD, config-bound page-size caps.
- Badge system: part/color/position triples assembled into a badge code (`GuildBadgeLibrary`, `GroupBadgePartProvider`).
- A real production event hook, `GroupNameValidationBehavior` (`IEventBehavior<GroupCreatingEvent>`), rejects empty/too-long guild names — proof the event-behavior extension point (`Turbo.Events`) is exercised in production, not just scaffolding.

DB: `DATA-MODEL.md` §2 labels Groups **IMPLEMENTED** (migration `20260619035829_AddGroups.cs` onward — tables `groups`, `group_members`, `group_membership_requests`, `group_forum_settings`, `group_forum_threads`, `group_forum_posts`). Known gaps: unread-forum-post counts aren't persisted (always reports 0, documented inline as a deliberate simplification); `CanChangeSettings`/`IsStaff` forum fields are hardcoded `false`; real `isGroupRoom`/`canGroupDecorate` wiring into `RoomSecurityModule` is still open (`ROADMAP.md` Epic 2.2).

---

## 15. Avatar System

### Figure String

Same format as classic Habbo — a dot-separated list of part codes, each `<part>-<type>-<color>`:

```
hd-180-1.ch-255-92.lg-285-82.sh-290-92.hr-100-61.ha-1003-92
```

### Server-Side Handling

`UpdateFigureDataMessageHandler` (`Turbo.PacketHandlers/Register/`) → `IPlayerGrain.SetFigureAsync(figure, gender)` in `Turbo.Players/Grains/PlayerGrain.cs`. This method **stores the raw figure string verbatim, with zero server-side validation** — no check on part ownership, valid part/color combinations, or gender-appropriateness anywhere in the repo (confirmed by grep: no `ValidateFigure`/`FigureValidator`-shaped call exists at all). After persisting, it notifies `PlayerPresenceGrain.OnFigureUpdatedAsync`, which sends `FigureUpdateEventMessageComposer` to the owning client and broadcasts `UserChangeMessageComposer` (figure + gender + motto + achievement score) to the player's current room.

This confirms the expected division of responsibility: **the server never renders or interprets figure/avatar visuals** — it's a string that gets stored and relayed; all rendering is 100% client-side (`AvatarRenderManager.as` and friends in vortex-client). The lack of any server-side figure validation is a real, if deliberate-looking, gap worth knowing about if reasoning about trust boundaries.

Related, separate: `SetMannequinFigureMessageHandler` (a furniture-level figure string, same no-validation story), avatar-effect activation/selection handlers (a full effects subsystem is deliberately deferred — see §20 for the same deferral pattern with achievements).

---

## 16. Moderation

Real and, per `ROADMAP.md` Epic 2.3, **"Done (2026-07-05)"** for the core loop:

- All 24 files under `Turbo.PacketHandlers/Moderator/` are real handlers, gated by `Capabilities.Moderation.*` permission checks (`IPermissionService`).
- **Bans**: `ModBanMessageHandler` resolves a `SanctionPresetSnapshot` (real DB-backed `SanctionPresetEntity`), computes ban duration (or permanent), calls `IPlayerGrain.ApplyAccountBanAsync`, force-disconnects the live session via `ISessionGateway`, and sends `UserBannedMessageComposer`. Every action goes through `ModToolActionHelper.IsAuthorizedAsync` (a staff member can't sanction someone of equal or higher rank) and emits an audit event.
- **Mutes/kicks/alerts/trading-locks**: `ModMuteMessageHandler`, `ModKickMessageHandler`, `ModAlertMessageHandler`, `ModTradingLockMessageHandler` — same authorization pattern.
- **CFH (Call For Help) ticket system**: real DB entities (`CfhTicketEntity`, `CfhTopicEntity`). Full lifecycle: player-side report (`CallForHelpMessageHandler`, `GetCfhStatusMessageHandler`) and staff pick/close/default-sanction (`PickIssuesMessageHandler`, `CloseIssuesMessageHandler`, `ReleaseIssuesMessageHandler`, `CloseIssueDefaultActionMessageHandler`, `DefaultSanctionMessageHandler`, `GetCfhChatlogMessageHandler`).
- **Chat/room-visit logs**: `GetRoomChatlogMessageHandler`, `GetUserChatlogMessageHandler`, `GetRoomVisitsMessageHandler` — backed by real room-entry logging.
- Moderation is orchestrated at the **service/handler level** (`ISanctionPresetService`, direct grain calls) — there is no dedicated `ModerationGrain`/`CfhGrain`.

Not yet done: `ModToolPreferencesMessageHandler` (cosmetic, per-staff window geometry), moderator room/user-info lookups, room-wide staff broadcast tools (`ModerateRoomMessageHandler`/`ModeratorActionMessageHandler`/`ModMessageMessageHandler`) — none block the core ban/mute/CFH loop.

---

## 17. WIRED

Real and extensive — this is one of the more sophisticated subsystems in the codebase, implemented as `Turbo.Rooms/Grains/Systems/RoomWiredSystem.cs` plus ~90 `RoomObjectLogic` subclasses under `Turbo.Rooms/Object/Logic/Furniture/Floor/Wired/**`.

### Shape

Six kinds, all registered under `wf_*`-prefixed logic keys (matching modern-client wired codes, not classic 1.0 wired):

| Kind | Leaf count | Examples |
|---|---|---|
| Triggers | 22 | click furni/tile, walk on/off, Habbo says keyword, collision, join/leave room, at-time, periodically, score achieved, game starts/ends, bot reaches habbo/item, receive signal, variable changed, item state updated, counter reaches time |
| Conditions | 30 (incl. `Negative*` variants) | furni state/type match, habbo has effect/handitem/badge, group membership, team rank/score, room user count, timer more/less-than |
| Selectors | 21 | by type/name/action/area/neighborhood/group/team/signal/on-item/with-variable/with-handitem, remote/selected selection |
| Addons | 8 | execution limit, random actions, unseen actions, movement physics, carry users, animation time controls, OR-mode condition evaluation |
| **Actions** | **only 4 implemented** (`ChaseHabbo`, `GiveVariable`, `MoveRotateFurni`, `ToggleItemState`) against a `WiredActionType` enum defining **44** codes (teleport, kick, mute, give score, bot teleport/move/talk/follow, move-furni-to-user, freeze user, and more) | — |
| Variables | — | durable, cross-item: `wf_var_user`/`_room`/`_furni`/`_quest`/`_quest_chain`/`_reference`/`_context` |

**The real, precise gap: only 4 of 44 `WiredActionType` values have a working implementation.** Triggers/conditions/selectors/addons/variables are comparatively complete — actions are the bottleneck.

### Evaluation Engine

Each room has a tile-stack index rebuilt lazily when marked dirty. Every `WiredTickMs` (50ms) boundary: dequeue a budgeted number of room events (`WiredMaxEventsPerTick` = 64) → match triggers by supported event type → run selectors → run addons → evaluate conditions (`None`/`Any`/`All` mode) → if the trigger fires, **schedule** (not immediately run) the action chain on a priority-queue-based scheduler (supports per-action delays, `WiredMaxScheduledPerTick` = 64 budget/tick) → execute in order, honoring each action's configured delay and rescheduling mid-chain if needed. `WiredEffectModeType` controls how many actions in the stack actually fire (`FirstOnly`/`Random`/all).

This delay-aware, budgeted, dirty-tracked scheduler is a meaningfully more sophisticated engine than a classic synchronous wired-stack executor.

### Persistence

Wired configuration (selected items, params, variable ids) is stored per-item as JSON (`ExtraDataSectionType.WIRED`), classified `Persistent` — it survives room unload/reboot. Only the ephemeral "already triggered this window" counters live in in-memory `RoomWiredSystem` state.

---

## 18. Pets and Bots

### Pets — Fully Implemented (game logic only — see the serializer gaps below)

`RoomPetSystem` (`Turbo.Rooms/Grains/Systems/RoomPetSystem*.cs`, split into `.Placement`/`.Motion`/`.Care`/`.Breeding` partials) is a **room-scoped system, deliberately not a separate grain** — `PETS-DESIGN.md` explains the rationale directly: pets need continuous access to room-state for navigation, and a separate `PetGrain` would add a cross-grain-call round trip on every movement step. It reuses the same `RoomPathingSystem` A* as avatars, and runs its own needs-driven state machine (Idle → Wander → Hungry → Eat → Sleep → Command) with nutrition/energy decay over real time, XP/leveling, and learned commands.

Backed by real DB entities (`PetEntity`, `PetFoodEntity`, `PetCommandEntity`, `PetLevelEntity`, `PetPaletteEntity`) with a substantial migration history (breeding fields, monsterplant fields, energy/max-uses). Handlers cover placement, feeding, commands, riding/mounting, breeding, respect. `ROADMAP.md` marks "Room/Pets: 100%". Pet position writes deliberately ride the existing dirty-flush timer rather than writing on every move (a real optimization, `CONSOLIDATION.md` O5) — but `CONSOLIDATION.md` also flags most of `RoomPetSystem`'s logic beyond feeding as having no test coverage yet.

### Pets — the room→client serializers are NOT all implemented (verified 2026-07-16)

The "100%" above describes the **game logic** (`RoomPetSystem`, entities, handlers), and it is accurate for that. It is **not** true of the wire layer: 6 of the 8 room-pet server→client messages cannot be consumed by a faithful client, because the emulator's serializer either writes nothing or writes a different message than the AS3 defines. Every one of these composers *is* dispatched (2-4 call sites each), so a client that registers the real protocol will receive these headers in normal play.

Verified by reading `Turbo.Revisions/Revision20260701/Serializers/Room/Pets/*.cs` against `sources/win63_version/habbo/communication/messages/parser/room/pets/*.as`. **`Revision20260112` is byte-for-byte identical on all of these**, so this is unfinished work, not a regression. Note the primary AS3 tree has no pet message package at all (it is package-obfuscated under `src/unknowns/`), so `win63_version` is the authority for this set.

| Header | Message | AS3 parser reads | Revision20260701 serializer writes | Status |
|---|---|---|---|---|
| 332 | `PetCommands` | petId, n, ids[], n, ids[] | identical | ✅ agrees |
| 3195 | `PetPlacingError` | errorCode | errorCode | ✅ agrees |
| 2753 | `PetStatusUpdate` | roomIndex, petId, 4× bool | **empty body (`//`)** | ❌ throws on read |
| 3796 | `PetFigureUpdate` | roomIndex, petId, figureData, 2× bool | **empty body (`//`)** | ❌ throws on read |
| 31 | `PetRespectFailed` | requiredDays, avatarAgeInDays | **empty body (`//`)** | ❌ throws on read |
| 3104 | `PetLevelUpdate` | roomIndex, petId, level | petId, level | ❌ leading roomIndex missing → fields shift, throws |
| 946 | `PetExperience` | petId, petRoomIndex, gainedExperience | petId, experience, experienceForNextLevel, level, maxLevel | ⚠️ **fails silently** |
| 2940 | `PetBreedingResult` | 2× (int, int, string, int, string, int, bool) | petOneId, petTwoId, result | ❌ unrelated shape, throws |

**`PetExperience` (946) is the dangerous one.** It is the only entry that does not throw: the server writes five ints where the client reads three, so there is always enough data on the wire and no read runs off the end. `petRoomIndex` silently receives the pet's total experience and `gainedExperience` silently receives the next-level threshold. Treat any value from `PetExperienceEventParser` as untrustworthy until the serializer is fixed.

The failures are contained: `SocketConnection.handleReceivedMessage()` wraps `parser.parse()` in a try/catch, logging the error and calling `messageParseError` per message. Each packet has its own wrapper, so an over-read cannot desync the stream — a mismatched pet packet is a logged error, not a dropped connection.

The client ports all of these AS3-faithfully anyway (`habbo/communication/messages/{incoming,parser}/room/pet/`), because the client's job is to speak the real protocol; **the fix belongs in the emulator's serializers**, and the three empty ones are the obvious starting point.

### Bots — built server-side on 2026-08-08

**This section used to read "Bots — Do Not Exist". That is no longer true**, and the row in the
summary table below said the same thing; both were written before the emulator grew the feature.

vortex-emulator now has: `Vortex.Database/Entities/Room/BotEntity.cs` with its `AddBots` /
`AddBotSkills` migrations, `Vortex.Inventory/Grains/InventoryGrain.Bots.cs` (list, create, grant on
purchase), `Vortex.Rooms/Grains/RoomGrain.Bots.cs` plus `RoomBotSystem{,.Chatter,.Motion}.cs` (a
placed bot stands, wanders and says what its owner configured), and real handlers for
`GetBotInventoryMessage`, `PlaceBotMessage`, `RemoveBotFromFlatMessage`, `CommandBotMessage` and
`GetBotCommandConfigurationDataMessage`. A `Robot` catalog product grants a bot: the look comes from
the product's `figure` / `figure;f` field, the name from the buyer.

Wire shape, from `Serializers/Inventory/Bots/BotSerialization.cs` — note the order, which is the
client's own (`_SafeCls_3143`): `int id`, `string name`, `string motto`, **`string gender`**,
`string figure`. `BotAddedToInventory` (3570) appends a boolean telling the client whether to open
the inventory; `BotRemovedFromInventory` (2032) carries the id alone.

Still missing server-side: **`MoveBotMessage` (1295) has no handler and the id is absent from
`Headers.cs`** — dragging a placed bot moves it client-side only.

---

## 19. Games

No `Turbo.Games` project exists in the solution at all (confirmed against the full 28-project `.sln` list). The entire `Turbo.PacketHandlers/Game/{Arena,Directory,Ingame,Lobby,Score}/*Handler.cs` tree — game-directory join/leave/status, arena chat/exit/play-again, in-game snowball throw/move/status, leaderboard queries — is **100% no-op protocol stubs**, inherited purely from the revision's parser/serializer scaffolding (`Turbo.Revisions/.../Parsers/Game/**`). There is no game-room grain, no team/score state, no collision logic, no lobby matchmaking. This was never scheduled work (not even listed as an epic in `ROADMAP.md`) — treat SnowStorm/Freeze/BattleBall-style minigames as entirely unbuilt, not "partially built."

---

## 20. Achievements

**This section was wrong on every claim it made, and was rewritten on 2026-09-20.** It said the
system "does not exist", that `GetAchievementsMessageHandler.cs` was "a fully empty stub", and that
`PlayerGrain.cs` "hardcodes `AchievementScore = 0` on every login". None of that holds: there is a
real `Vortex.Progression/Achievements/` subsystem (progress calculator, resolution rules, account
level ladder, event handlers), the handler is a working 42 lines, `PlayerGrain` loads
`_state.AchievementScore` from the `players` row, and the login composer sends
`summary.AchievementScore`. It is kept as a warning: a section stating a flat absence ages worse
than one stating a mechanism, because nobody re-checks "does not exist".

What is actually open is narrower and needs measuring, not asserting: **not every achievement has a
trigger that can fire it**. Count the achievements defined against the ones some code path actually
awards before quoting a number — an earlier count is a dated claim, not a fact.

**The room avatar's copy of the score was a separate bug, fixed 2026-09-20.**
`RoomPlayerAvatar.ActivityPoints` was `{ get; init; } = 0` and nothing ever initialised it, so the
avatar block on the wire carried a hard 0 for everyone while the extended profile — built from the
same `PlayerSummarySnapshot.AchievementScore` — showed the real score. The two numbers travel by
different paths; seeing one right does not mean the other is.

---

## 21. Packet Alignment Audit

This section replaces the old draft's fabricated Arcturus-vs-client numbers with a real diff, generated by parsing `Turbo.Revisions/Revision20260112/Headers.cs` (`MessageEvent`/`MessageComposer` constants) against `vortex-client/src/com/sulake/habbo/communication/HabboMessages.as` (`_composers`/`_events` registration maps), matched by numeric header id per direction.

### Summary

| Direction | Turbo entries | Client entries | Shared ids | Turbo-only | Client-only |
|---|---|---|---|---|---|
| Client → Server (`MessageEvent` vs. client `_composers`) | 525 | 471 | 430 | 95 | 41 |
| Server → Client (`MessageComposer` vs. client `_events`) | 538 | 479 | 460 | 78 | 19 |

Of the 430 shared client→server ids, 419 have clearly-matching class-name stems on both sides (high confidence they're the same logical packet); 11 have same-id-but-different-looking names and are worth double-checking before relying on them. Of the 460 shared server→client ids, 457 match cleanly and 3 look mismatched.

### "Turbo-only" and "Client-only" — mostly explained by feature scope, not bugs

The bulk of the "Turbo-only" ids on both sides are packets for features vortex-client's build genuinely doesn't send/expect at all: NFT/collectibles (`ClaimNftClaimsMessageEvent`, `GetNftCreditsMessageEvent`, ...), the treasure-hunt/seasonal-quest system, marketplace tokens, and — on the server→client side — packets for features described elsewhere in this doc as unimplemented-but-protocol-scaffolded (`WiredFurniSelectorComposer`, `FurniListRemoveMultipleComposer`, `BlockListMessageComposer`, `LtdRaffleResultMessageComposer`, etc. — several of these correspond to real Turbo features whose composer just isn't in this particular client build's registry, which is a client-coverage gap rather than a protocol bug).

The "Client-only" ids (client can send/expects to receive a packet with no Turbo counterpart at that id) are the more actionable half — these represent either client UI paths with literally no server handler (e.g. `SearchFaqsMessageComposer`, `GetWeeklyCompetitiveLeaderboardComposer`, `GetUserGameAchievementsMessageComposer`, `IgnoreUserIdMessageComposer`, `GetGiftMessageComposer`, `GiveStarGemToUserMessageComposer` — clicking these UI elements sends a packet the server silently drops as unknown, per `PackageHandler`'s "Incoming Unknown {Header}" warning-and-drop behavior) or client-expected server events that never arrive (`HotelMergeNameChangeEvent`, `AvailabilityTimeMessageEvent`, `CameraSnapshotMessageEvent`, `WeeklyCompetitiveLeaderboardEvent`, the whole FAQ-related event family, `BotReceivedMessageEvent` — several of these map directly onto features this doc already covers as unbuilt: FAQ system, weekly competitive leaderboards, camera, bots).

### Candidate Semantic Mismatches (same id, different-looking name — not yet manually verified)

These are **candidates for investigation**, not confirmed bugs — flagged by the diff's name-stem heuristic, not by reading both implementations side-by-side:

| Id | Direction | Turbo name | Client name |
|---|---|---|---|
| 991 | C→S | `SetMannequinFigureEvent` | `GetTargetedOfferComposer` |
| 2932 | C→S | `ReleaseIssuesMessageEvent` | `GetHabboBasicMembershipExtendOfferComposer` |
| 398 | S→C | `MarketplaceConfigurationComposer` | `RoomThumbnailUpdateResultEvent` |
| 611 | S→C | `PostItPlacedComposer` | `CatalogPageExpirationEvent` |
| 866 | S→C | `NavigatorSavedSearchesComposer` | `IsOfferGiftableMessageEvent` |

If any of these ids are ever hit in practice, the payload will misparse on one side or the other silently (no schema validation on this wire format — see §3/§6). A handful of the 11+3 total flagged mismatches are almost certainly false positives from naming-convention differences rather than real bugs (e.g. ids where both sides clearly describe the same feature but the name-stem heuristic didn't strip a differing prefix like `Get`/`Request`) — this table intentionally shows only the ones that look genuinely unrelated by name. Treat this whole section as a solid starting point for a focused audit, not an exhaustive, manually-verified bug list.

---

## 22. Configuration and Deployment

### Server Configuration

Turbo uses the standard .NET configuration system (`appsettings.json` + environment variables prefixed `TURBO__`), not an `.ini` file. Key sections:

```jsonc
// Turbo:Networking
{ "PingIntervalMilliseconds": 10000, "MaxPacketBodyBytes": 65536 }

// Turbo:Crypto
{ "KeySize": "<RSA public exponent hex>", "PublicKey": "<RSA modulus hex>",
  "PrivateKey": "<RSA private exponent hex>", "EnableServerToClientEncryption": true }

// Turbo:Database
{ "ConnectionString": "...", "LoggingEnabled": false }

// Turbo:Orleans
{ "AdvertisedIp": "127.0.0.1", "SiloPort": 11111, "GatewayPort": 3000 }

// Turbo:Rooms
{ "RoomTickMs": 50, "AvatarTickMs": 500, /* ...see §7 for the full list... */ }
```

### RSA/DH Key Alignment

Same requirement as any Habbo-derived protocol: the server's `Turbo:Crypto.PublicKey`/`KeySize` (modulus/exponent) must match whatever RSA public key is embedded in vortex-client's crypto classes, or the handshake in §4 fails at the signature-verification/encryption step.

### Database

EF Core with the **Pomelo MySQL** provider (`Turbo.Database/Extensions/ServiceCollectionExtensions.cs`, `UseMySql(...)`), accessed via `IDbContextFactory<TurboDbContext>` (factory pattern — a fresh, short-lived context per operation, not one long-lived scoped context). `Turbo.Database/Context/TurboDbContext.cs` exposes ~60 `DbSet<>`s, grouped by domain folder under `Entities/`:

| Category | Example Tables |
|----------|---------------|
| Players/Auth | `PlayerEntity`, `PlayerAccountEntity`, `AccountBanEntity`, `SecurityTicketEntity`, `PlayerCurrencyEntity`, `PlayerBadgeEntity`, `PlayerKickbackEntity`, `PlayerSubscriptionEntity` |
| Rooms | `RoomEntity`, `RoomModelEntity`, `RoomBanEntity`, `RoomMuteEntity`, `RoomRightEntity`, `RoomEntryLogEntity`, `RoomChatlogEntity` |
| Furniture | `FurnitureDefinitionEntity`, `FurnitureEntity`, `FurnitureTeleportLinkEntity` |
| Catalog/Economy | `CatalogPageEntity`, `CatalogOfferEntity`, `CurrencyTypeEntity`, `VoucherEntity`, `MarketplaceOfferEntity`, `EconomyLedgerEntity` |
| Groups/Forums | `GroupEntity`, `GroupMemberEntity`, `GroupForumThreadEntity`, `GroupForumPostEntity` |
| Moderation | `RoleEntity`, `RolePermissionEntity`, `SanctionPresetEntity`, `CfhTicketEntity` |
| Navigator/Messenger | `NavigatorTopLevelContextEntity`, `PlayerFavoriteRoomsEntity`, `MessengerFriendEntity`, `MessengerMessageEntity` |
| Pets | `PetEntity`, `PetCommandEntity`, `PetLevelEntity`, `PetPaletteEntity` |

Notable relationship design: most FKs use `DeleteBehavior.Restrict`/`SetNull` rather than cascade (explicit per-relationship decisions, e.g. `GroupEntity`↔`RoomEntity` is modeled as two independent one-directional FKs rather than a true inverse pair, to avoid a MySQL cascade cycle).

---

## 23. Threading and Performance

### Server Concurrency Model

Turbo's concurrency model is **Orleans virtual actors**, not a Netty-style boss/worker thread-pool:

```
Host process
  ├─ SuperSocket TCP listener + SuperSocket WebSocket listener (concurrent)
  ├─ Orleans silo (single-node, localhost clustering in this deployment)
  │   ├─ Grain activations (Room, Player, Catalog, Messenger, Group, ...)
  │   │   — each grain is single-threaded by the Orleans turn-based execution model,
  │   │     so no manual locks are needed inside grain code
  │   ├─ Per-room 50ms RegisterGrainTimer (§7) — replaces a shared "room cycle" thread pool
  │   └─ GrainCollectionOptions.CollectionAge = 2 minutes — idle grains deactivate automatically
  ├─ EF Core / Pomelo MySQL — via IDbContextFactory, short-lived contexts per operation
  └─ Handler dispatch — parallel (Task.WhenAll) across all handlers matching one message type
```

Everything is **in-memory / single-silo today**: grain storage, pub-sub, and both stream providers use Orleans' memory providers, and the silo uses `UseLocalhostClustering()`. The host logs an explicit warning in non-Development environments that this won't survive a restart or scale across multiple nodes — a real, acknowledged limitation of the current deployment shape, not an oversight to "fix" casually (multi-silo clustering is a deliberate follow-on piece of work, not a bug).

### Client Threading Model

Flash Player is single-threaded; vortex-client runs its usual frame-tick loop (socket buffer processing, message dispatch, room engine update, render, input) — this side of the architecture is unchanged from any Flash-era Habbo client and wasn't part of this rewrite's research scope; treat prior assumptions about the client's own frame loop as still valid unless directly contradicted by reading `vortex-client` source.

### Performance Characteristics

| Concern | How It's Handled |
|---------|-----------------|
| **Packet dispatch** | Handlers for one message type run in parallel (`Task.WhenAll`), not sequentially |
| **Room ticks** | Each active room is its own Orleans grain with its own 50ms timer — no shared thread pool to contend over |
| **Database** | `IDbContextFactory` short-lived contexts; batch operations use single `WHERE ... IN (...)` queries rather than per-entity loops (an explicit `CONTEXT.md` rule) |
| **Idle cleanup** | Rooms/players deactivate automatically after `RoomDeactivationDelayMs` (30 min) / Orleans' 2-minute collection age, unless `[KeepAlive]` |
| **Batched writes** | Dirty item/tile state flushes on a timer (2s) rather than per-mutation, per room |

---

## 24. Known Issues

All items below are sourced directly from the emulator's own status docs (`ROADMAP.md`, `TODO.md`, `CONSOLIDATION.md`, `DATA-MODEL.md`) — nothing here is speculative.

### Unimplemented Systems (entire feature areas, not bugs in existing code)

| System | Status |
|---|---|
| Trading (classic room-to-room) | 100% stub handlers (§13) |
| Achievements | 100% stub, `AchievementScore` hardcoded 0 (§20) |
| Bots | **Built 2026-08-08** — entity, inventory, purchase, placement, pickup, chatter/wander (§18). Only `MoveBot` (1295) is unhandled |
| Games (SnowStorm/Freeze/BattleBall-style) | 100% stub, no `Turbo.Games` project exists (§19) |
| Avatar effects | Deferred alongside Achievements — needs a full subsystem from zero |

### Real, Precise Gaps in Otherwise-Implemented Systems

| Gap | Detail |
|---|---|
| WIRED actions | Only 4 of 44 `WiredActionType` values implemented (§17) — triggers/conditions/selectors are comparatively complete |
| Chat safety | No word filter, no flood control enforced despite a stored (but unread) `ChatFloodType` room setting (§8) |
| Room rating | `RoomRatingMessageComposer` hardcodes `Rating = 0, CanRate = false` — permanent stub |
| Navigator "popular rooms" | No real ranking algorithm — falls back to a plain population sort; `Score`/`Ranking` fields hardcoded 0 |
| Navigator tag search | `GetRoomsByTagAsync` returns an empty list unconditionally |
| Group forum unread counts | Not persisted — `GetUnreadForumsCountAsync` always returns 0 (documented simplification) |
| Avatar figure validation | Zero server-side validation of figure strings — stored and relayed verbatim (§15) |
| Staff role assignment | `TODO.md`: new accounts get rank hardcoded to Administrator at login — no rank persistence/default-role logic yet. This is a real, currently-open security-relevant gap, not fixed by the 2026-07-05 moderation completion pass (that pass was about the moderation *tools*, not initial role assignment). |

### Overall Completeness Caveat

`CONSOLIDATION.md` notes that a large fraction of packet handlers by raw count are still empty stubs (its own snapshots range from "~300 of ~501" to an older, now-superseded "393 of 498 (78%)" figure — the two numbers reflect different points in time, not a contradiction to resolve). The correct read is: **coverage is highly uneven by design, not uniformly ~X% done** — core gameplay (room/chat/furniture placement, catalog purchasing, moderation, groups, navigator, messenger) is genuinely solid per `ROADMAP.md`'s 2026-07-05 table, while several whole feature areas (trading, achievements, games) are simply not started (bots were, on 2026-08-08 — see §18). Don't average these into one blended "% complete" number when reasoning about what will actually work.

### Architectural Notes (not bugs — deliberate current trade-offs)

| Note | Detail |
|---|---|
| Single-silo, in-memory Orleans clustering | Explicitly logged as non-production-grade outside Development (§23) — a known, accepted deployment limitation, not an oversight |
| 384-bit DH prime | A deliberate legacy-client constraint (RSA block-size limit), not an accidental weak default (§4) |
| No per-grain manual locking | Not needed — Orleans' turn-based single-threaded grain execution model provides this; do not "fix" by adding locks inside grain code |

---

## 25. Architecture Diagrams

### Full Request-Response Flow

The emulator's own `vortex-emulator/docs/walkthroughs/request-lifecycle.md` traces one real chat packet end-to-end in more depth than a diagram can — read it directly for the fullest picture. Condensed:

```
client socket
   │  raw bytes
   ▼
ClientPacketDecoder                 (Turbo.Networking/Package)
   │  decrypt (RC4, if active) → typed IMessageEvent via the active IRevision's parser
   ▼
PackageHandler → MessageSystem.PublishAsync   (Turbo.Networking / Turbo.Messages)
   │  resolves PlayerId/RoomId from ISessionGateway, builds MessageContext
   ▼
MessageRegistry → IMessageHandler<T>.HandleAsync   (Turbo.PacketHandlers/<Domain>)
   │  orchestration only: guard ctx, resolve ONE grain, delegate, return
   ▼
Domain Grain (e.g. RoomGrain, PlayerGrain, CatalogPurchaseGrain, ...)
   │  real business logic + persistence live here (modules/systems for RoomGrain)
   ▼
   ├─ Direct reply: MessageContext.SendComposerAsync → this player's PlayerPresenceGrain → socket
   │
   └─ Room broadcast: RoomGrain.SendComposerToRoomAsync
        │  publishes to an Orleans stream (RoomOutbound) — NOT a direct socket write
        ▼
      Each in-room player's PlayerPresenceGrain (subscribed to the stream)
        │  receives independently, resolves its own live session(s)
        ▼
      SessionObserver.SendComposerAsync → serialize via IRevision's serializer → client socket
```

**The single most important architectural fact, repeated because it's easy to miss coming from a classic-server mental model: a room grain never writes to a socket.** It publishes a composer to a stream; every player's own presence grain is responsible for delivering to that player. This is what lets a room deactivate, rehydrate, or (in a real multi-silo deployment) migrate without any socket-handling code needing to change.

### Subsystem Communication Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT SUBSYSTEMS (vortex-client)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  Room     │ │ Catalog  │ │Navigator │ │Inventory │ │Messenger │    │
│  │  Engine   │ │  Shop    │ │  Search  │ │  Panel   │ │ Friends  │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │
│       │            │            │            │            │            │
│  ┌────┴────────────┴────────────┴────────────┴────────────┴─────┐     │
│  │            HabboCommunicationManager + EvaWireFormat + ArcFour │     │
│  └───────────────────────────┬───────────────────────────────────┘     │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                     TCP or WebSocket, optional RC4
                               │
┌──────────────────────────────┼────────────────────────────────────────┐
│  ┌───────────────────────────┴───────────────────────────────────┐     │
│  │   SuperSocket (TCP + WS) → ClientPacketDecoder → PackageHandler │     │
│  │              → MessageSystem/MessageRegistry (Turbo Cloud)      │     │
│  └────┬────────────┬────────────┬────────────┬────────────┬──────┘     │
│       │            │            │            │            │            │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐    │
│  │  Room    │ │ Catalog  │ │Navigator │ │Inventory │ │ Messenger │    │
│  │  Grain   │ │ Grains   │ │ Service  │ │  Grain   │ │  Grains   │    │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │
│       │            │            │            │            │            │
│  ┌────┴────────────┴────────────┴────────────┴────────────┴─────┐     │
│  │             MySQL (EF Core / Pomelo, IDbContextFactory)        │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                        │
│                     SERVER SUBSYSTEMS (Turbo Cloud, Orleans grains)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Room Tick Cycle

```
Every 50ms per active room (Orleans RegisterGrainTimer), boundary-gated per sub-system:

RoomGrain's timer callback
  │
  ├─ [every 500ms] RoomAvatarTickSystem.ProcessAvatarsAsync
  │   ├─ Advance one A*-path tile per avatar with pending movement
  │   ├─ Fire walk-off/walk-on furniture hooks
  │   └─ Batch all changed avatars into one UserUpdateMessageComposer broadcast
  │
  ├─ [every 50ms] RoomWiredSystem.ProcessWiredAsync
  │   ├─ Process dirty tile stacks
  │   ├─ Dequeue up to WiredMaxEventsPerTick (64) room events
  │   ├─ Match triggers → run selectors → run addons → evaluate conditions
  │   └─ Schedule (not immediately run) matching action chains, honoring per-action delays
  │
  ├─ [every 2000ms] RoomRollerSystem.ProcessRollersAsync
  │   └─ Move items/avatars riding active rollers
  │
  ├─ [pet system, its own internal cadence] RoomPetSystem
  │   └─ Needs-driven state machine: wander/hungry/eat/sleep/command, XP/leveling
  │
  └─ [every 2000ms] FlushDirtyTilesAsync / FlushDirtyItemsAsync
      └─ Persist accumulated tile-height and item-state changes to MySQL,
         capped at MaxDirtyItemsPerFlush (100) / MaxTileHeightsPerFlush (200) per flush
```

---

## Appendix A: Key File Locations

### Server (`vortex-emulator`, solution `Turbo.Cloud.sln`)

| File | Purpose |
|------|---------|
| `Turbo.Main/Program.cs` | Host entry point, service registration order |
| `Turbo.Main/TurboEmulator.cs` | Hosted service: revision registration, data-provider warm-up, network start |
| `Turbo.Main/Extensions/HostApplicationBuilderExtensions.cs` | Orleans silo configuration |
| `Turbo.Networking/NetworkManager.cs` | TCP + WebSocket SuperSocket host setup |
| `Turbo.Networking/Package/ClientPacketDecoder.cs` | Frame decode (length/header/RC4-peek) |
| `Turbo.Networking/Package/PackageHandler.cs` | Parser lookup + dispatch into `MessageSystem` |
| `Turbo.Networking/Session/SessionGateway.cs` | Session↔player mapping, session/observer registration |
| `Turbo.Crypto/DiffieService.cs` | DH parameter generation, shared-key derivation |
| `Turbo.Crypto/RsaService.cs` | RSA sign/encrypt/decrypt for the handshake |
| `Turbo.Crypto/Rc4Engine.cs` | RC4 stream cipher, incl. non-consuming `Peek` |
| `Turbo.Messages/MessageSystem.cs` | Incoming packet publish entry point |
| `Turbo.Messages/Registry/MessageRegistry.cs` | Handler/behavior registry + dispatch (parallel execution) |
| `Turbo.Plugins/PluginBootstrapper.cs` | Assembly scan that registers all `IMessageHandler<T>`s |
| `Turbo.Revisions/Revision20260112/Headers.cs` | The packet ID registry (`MessageEvent`/`MessageComposer`) |
| `Turbo.Revisions/Revision20260112/Revision20260112.cs` | Parser/serializer dictionaries for the embedded revision |
| `Turbo.Authentication/AuthenticationService.cs` | SSO ticket → player id resolution |
| `Turbo.Rooms/Grains/RoomGrain.cs` (+ 9 partials) | Room grain: state, modules, systems, tick timer |
| `Turbo.Rooms/Grains/Systems/RoomPathingSystem.cs` | A* pathfinding |
| `Turbo.Rooms/Grains/Systems/RoomChatSystem.cs` | Say/shout/whisper, mute, chatlog |
| `Turbo.Rooms/Grains/Systems/RoomWiredSystem.cs` | WIRED evaluation/scheduling engine |
| `Turbo.Rooms/Grains/Systems/RoomPetSystem.cs` (+ partials) | Pet AI/movement/breeding |
| `Turbo.Rooms/Providers/RoomObjectLogicProvider.cs` | Furniture interaction-logic registry |
| `Turbo.Catalog/Grains/CatalogPurchaseGrain.cs` | Purchase debit/grant/refund flow |
| `Turbo.Catalog/Grains/LtdRaffleGrain.cs` | Limited-edition raffle purchasing |
| `Turbo.Inventory/Grains/InventoryGrain.cs` (+ partials) | Per-player furniture/pet inventory |
| `Turbo.Marketplace/Grains/MarketplacePurchaseGrain.cs` | Auction-style listing/buying |
| `Turbo.Navigator/NavigatorService.cs` | Room search/category dispatch |
| `Turbo.Players/Grains/MessengerGrain.cs` (+ partials) | Friends, messaging, presence fan-out |
| `Turbo.Players/Grains/PlayerPresenceGrain.cs` | Session delivery, active-room stream subscription |
| `Turbo.Players/Grains/GroupDirectoryGrain.cs`, `GroupGrain.cs` | Guild creation/membership |
| `Turbo.Database/Context/TurboDbContext.cs` | EF Core DbContext (Pomelo MySQL) |
| `docs/walkthroughs/request-lifecycle.md` | Full traced example of one chat packet, socket to socket |
| `CONTEXT.md`, `ROADMAP.md`, `TODO.md`, `CONSOLIDATION.md`, `DATA-MODEL.md`, `PETS-DESIGN.md` | Living architecture/status docs — check these before assuming a feature's state |

### Client (`vortex-client`)

| File | Purpose |
|------|---------|
| `src/HabboAir.as` | Application shell / entry point |
| `src/HabboAirMain.as` | Component bootstrap sequence |
| `src/com/sulake/core/communication/connection/SocketConnection.as` | TCP socket wrapper |
| `src/com/sulake/core/communication/wireformat/EvaWireFormat.as` | Binary frame encode/decode |
| `src/com/sulake/habbo/communication/HabboCommunicationManager.as` | Protocol manager |
| `src/com/sulake/habbo/communication/HabboMessages.as` | Packet ID registry (`_composers`/`_events`, ~1,996 lines) |
| `src/com/sulake/habbo/communication/encryption/ArcFour.as` | RC4 implementation |
| `src/com/sulake/habbo/communication/encryption/DiffieHellman.as` | DH key exchange |
| `src/com/sulake/habbo/room/RoomEngine.as` | Room rendering engine |
| `src/com/sulake/habbo/room/RoomMessageHandler.as` | Room message handlers |
| `src/com/sulake/habbo/avatar/AvatarRenderManager.as` | Avatar rendering |

---

## Appendix B: Packet ID Quick Reference

All values below are read directly from `Turbo.Revisions/Revision20260112/Headers.cs` — grep it yourself for anything not listed here rather than assuming a value.

### Handshake Sequence

| Step | Direction | Constant | Header |
|------|-----------|----------|--------|
| 1 | C→S | `MessageEvent.ClientHelloMessageEvent` | 4000 |
| 2 | C→S | `MessageEvent.UniqueIDMessageEvent` | 2920 |
| 3 | C→S | `MessageEvent.VersionCheckMessageEvent` | 3517 |
| 4 | C→S | `MessageEvent.InitDiffieHandshakeMessageEvent` | 3644 |
| 5 | S→C | `MessageComposer.InitDiffieHandshakeComposer` | 2334 |
| 6 | C→S | `MessageEvent.CompleteDiffieHandshakeMessageEvent` | 1517 |
| 7 | S→C | `MessageComposer.CompleteDiffieHandshakeComposer` | 3034 |
| 8 | C→S | `MessageEvent.SSOTicketMessageEvent` | 749 |
| 9 | S→C | `MessageComposer.AuthenticationOKMessageComposer` | 3014 |
| — | S→C | `MessageComposer.UniqueMachineIDComposer` | 836 |

### Common Room Packets

| Direction | Header | Constant | Purpose |
|-----------|--------|----------|---------|
| C→S | 2407 | `MessageEvent.RoomNetworkOpenConnectionMessageEvent` | Enter room request |
| S→C | 1915 | `MessageComposer.OpenConnectionMessageComposer` | Connection opened |
| S→C | 2244 | `MessageComposer.RoomReadyMessageComposer` | Room model loaded |
| S→C | 3997 | `MessageComposer.ObjectsMessageComposer` | Floor furniture list |
| S→C | 1835 | `MessageComposer.UsersMessageComposer` | Users in room |
| C→S | 144 | `MessageEvent.MoveAvatarMessageEvent` | Walk request |
| C→S | 641 | `MessageEvent.ChatMessageEvent` | Say chat |
| S→C | 1264 | `MessageComposer.ChatMessageComposer` | Chat broadcast |
| C→S | 2286 | `MessageEvent.ShoutMessageEvent` | Shout chat |
| S→C | 3310 | `MessageComposer.ShoutMessageComposer` | Shout broadcast |
| C→S | 2317 | `MessageEvent.WhisperMessageEvent` | Whisper chat |
| S→C | 492 | `MessageComposer.WhisperMessageComposer` | Whisper broadcast |

### Common User/Economy Packets

| Direction | Header | Constant | Purpose |
|-----------|--------|----------|---------|
| S→C | 3337 | `MessageComposer.UserRightsMessageComposer` | Rank/rights |
| S→C | 118 | `MessageComposer.CreditBalanceComposer` | Credit balance |

Extend this table by grepping `Headers.cs` directly for anything you need that isn't listed — the full set is ~525 incoming + ~538 outgoing constants, far too many to usefully enumerate here.
