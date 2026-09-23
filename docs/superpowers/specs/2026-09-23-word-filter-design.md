# The hotel-wide word filter — design

**Date:** 2026-09-23
**Status:** approved, not yet implemented
**Packages:** `../vortex-emulator` (`Vortex.Database`, `Vortex.Primitives`, `Vortex.Observability`,
`Vortex.Rooms`, `Vortex.Social`, `Vortex.Players`, `Vortex.PacketHandlers`, `Vortex.WebApi`,
`Vortex.Dashboard.API`, `Vortex.Dashboard.Web`), `packages/vortex-web` (one refusal message)

## What this is

One list of forbidden words, kept by staff in the dashboard, applied **everywhere a player writes
text that another player will read** — room chat, private messages, mottos, names, groups, rooms,
forums, pets, bots, post-its, wired text, and the website's feed.

Each word carries its own action, chosen by staff:

- **Replace** — the text goes through with the offending span replaced (default `bobba`);
- **Refuse** — the text is rejected and the player is told why.

Every hit is journaled, and staff can read the journal by player.

This closes the gap the social-feed spec left open (`2026-09-21-web-social-feed-design.md`, "a word
filter … is a separate project").

## What exists today, and why none of it is reused

Measured 2026-09-23 against the emulator:

- **No hotel-wide filter exists.** The only `bobba` in the code is the per-room default.
- **The per-room filter** (`RoomFilterWordEntity`, applied at `RoomChatSystem.cs:120`,
  algorithm at `:388-410`) splits on `' '` and looks each whole token up case-insensitively.
  `bad!`, `bad,` and `c.o.n` all pass. It is the room OWNER's list and stays exactly as it is; the
  hotel filter runs **before** it.
- **The per-player filter** (`PlayerWordFilterEntity`) is never applied server-side — the client
  masks what that player sees. Untouched.
- **No chokepoint.** The inputs reach ~25 separate sinks. The inbound packet pipeline
  (`IMessageBehavior<T>`) and the cancellable event bus can *drop* text but cannot *rewrite* it
  (message properties are `init`-only; events are immutable records whose publishers only read
  `Cancel`), so neither can implement Replace, and neither covers the web API.

Hence: one shared service, called explicitly at each sink.

## Scope

Delivered in two batches under this one spec.

**Batch 1 — the core and the busiest inputs**

| Sink | Where (emulator) | On Refuse |
|---|---|---|
| Room chat / shout / whisper | `RoomChatSystem.SendChatFromPlayerAsync`, beside `ApplyFilterWords` | line sent to nobody; notification to the speaker |
| Private message | `MessengerGrain.SendMessageAsync` | returns `InstantMessageErrorCodeType.OfflineFailed` (see below) + notification; no row written |
| Room invite text | `MessengerGrain.Presence.cs` invite path | invite sent to nobody; notification |
| Motto | `PlayerGrain.SetMottoAsync` | motto unchanged; notification |
| Username, in game | `ChangeUserNameMessageHandler`, `CheckUserNameMessageHandler` | `NameChangeResultCode.NameNotValid` |
| Username, web | `WebApiPlayerService` create + rename | `pocket.auth.name_not_valid` (the code both routes already answer) |
| Web feed body + poll choices | `WebApiFeedService.PublishAsync` | `FeedRefusal.WordFiltered` → 400 `feed_word_filtered` → a toast in vortex-web |

**Names are special:** any hit refuses, whatever the word's action — a name with `bobba` spliced
into it is not a name anyone chose.

**Batch 2 — the rest of the inventory**

Group name + description (create and edit), group forum subject + post, room name + description
(create and settings), room tags, room event / promotion name + description, pet name (purchase and
gift), bot name + chatter lines, post-it (new and edit), mannequin name, gift card message, wired
text fields (show message, bot talk, placeholders), wired chest name + description, wired contract
texts, guide-session chat and guide request description. On Refuse, each answers with whatever
refusal the sink already has; where it has none, the text is not saved and the player gets the
notification.

**Out, each for a stated reason**

- **Staff-facing text** — call-for-help, web reports, mod tools. Filtering what a player reports
  would hide the evidence.
- **Private-to-self text** — saved navigator searches, safety answers.
- **Poll answers** (`PlayerPollGrain`) — read only by staff.
- **Retroactive filtering** — a word added today does not rewrite yesterday's mottos or rows.
- **Automatic sanctions** — the journal is read by staff; there is no threshold that mutes.
- **Unicode confusables** beyond what NFKD folds to Latin (Cyrillic `о` for `o`). A ceiling,
  stated in the code, with the upgrade path (a confusables table in the normaliser).

## Data model (`Vortex.Database`)

### `word_filter_words` — `WordFilterWordEntity`

| Column | Type | Notes |
|---|---|---|
| `id` | int | |
| `word` | varchar(64) | unique; stored as staff typed it, normalised at compile time |
| `action` | `WordFilterAction` (`Replace` = 0, `Refuse` = 1) | |
| `match` | `WordFilterMatch` (`WholeWord` = 0, `Partial` = 1) | |
| `replacement` | varchar(64), nullable | null → the configured default |
| `created_by` | int, nullable | the operator's account |
| `created_at`, `updated_at`, `deleted_at` | | the usual `VortexEntity` columns; delete is soft |

### `word_filter_hits` — `WordFilterHitEntity`

| Column | Type | Notes |
|---|---|---|
| `id` | long | |
| `player_id` | int | |
| `source` | `WordFilterSource` | `RoomChat`, `Messenger`, `RoomInvite`, `Motto`, `Username`, `FeedPost`, … (batch 2 appends) |
| `word_id` | int | the first word that matched |
| `action` | `WordFilterAction` | what was actually done (always `Refuse` for names) |
| `original_text` | varchar(512) | truncated |
| `occurred_at` | datetime | capture time, not flush time |

Indexes: `(player_id, occurred_at)` and `(occurred_at)`.

The enums live in `Vortex.Primitives/Moderation/WordFilter/`.

### Configuration (`ConfigKeyCatalog`, live through `IServerConfigGrain`)

- `word_filter.replacement` — default `bobba`.
- `word_filter.refused_message` — the text of the refusal notification. Default:
  `Ton message contient un mot interdit.`

Both are read when the list compiles, not per call.

## Matching

Everything below is applied **identically** to each listed word (at compile time) and to the text
(per call), so a word and its disguised forms normalise to the same thing.

**Per-character normalisation, one output character per input character.** Because it is 1:1, a match
found in the normalised text is the *same span* in the original, and Replace can swap exactly that
span while leaving everything around it — punctuation, casing of the rest, emoji — untouched.

1. lower-case (invariant);
2. accents removed: the character's NFKD decomposition, first character kept (`é → e`, `ﬁ`-style
   ligatures keep their first letter);
3. leetspeak folded: `4 @ → a`, `3 → e`, `1 ! → i`, `0 → o`, `5 $ → s`, `7 → t`;
4. anything still not `[a-z0-9]` becomes a space.

**Per-word pattern.** The normalised word, with consecutive repeats collapsed (`coon → con`), becomes
one `Regex` in which each letter is `x+` and letters are joined by ` *`:
`con → c+ *o+ *n+`. So `con`, `CON`, `cooonnn`, `c.o.n`, `c o n`, `c0n` and `ç0n` all match.

- **WholeWord** wraps it in `(?<![a-z0-9])…(?![a-z0-9])` — the span must start and end on a word
  boundary of the text. This is what keeps `concert` and `Scunthorpe` clean.
- **Partial** has no guards.

Regexes are built with `RegexOptions.Compiled | RegexOptions.CultureInvariant` and a match timeout.

**Outcome.** Every word is tried against the text:

- any **Refuse** match → the whole text is refused (Replace matches in the same text do not matter);
- otherwise every **Replace** match is replaced right-to-left in the original text by the word's
  replacement (or the default);
- no match → the text comes back as the same instance, so the hot path allocates nothing.

`ponytail:` one regex per word, tried in turn — O(words × length). Fine for hundreds of words on
chat-length lines; the upgrade path if the list grows into thousands is a single Aho-Corasick pass
over the normalised text.

## The service

**`IWordFilter`** — `Vortex.Primitives/Moderation/WordFilter/IWordFilter.cs`:

```csharp
public interface IWordFilter
{
    // Filters `text` written by `playerId` for `source`, journals any hit, and answers what to do.
    WordFilterResult Apply(string text, WordFilterSource source, int playerId);

    // The notification text for a refusal, from `word_filter.refused_message`.
    string RefusedMessage { get; }

    // Re-reads the list and the two config keys and swaps the compiled set atomically.
    Task ReloadAsync(CancellationToken ct);
}

public readonly record struct WordFilterResult(string Text, bool Refused, bool Changed);
```

Synchronous on purpose: it is on the chat path, it touches no I/O (the journal write is an enqueue),
and every sink — grain or web service — can call it without an extra hop.

**`WordFilter`** — `Vortex.Observability/WordFilter/`, registered by `ObservabilityModule` as a
singleton and as a hosted service that performs the first `ReloadAsync` at start. It holds one
immutable compiled set behind a `volatile` reference; a reload builds a new set and swaps it, so a
call in flight never sees half a list.

It lives in `Vortex.Observability` because the journal belongs there: hits go through the existing
durable channel (`AuditChannel` → `AuditWriterService`) as a new `WordFilterHitRecord`, exactly like
`ChannelEconomyLedger` — non-blocking, batched, retried, dead-lettered. A saturated channel logs and
drops the hit; it never delays the chat line.

**Reaching it.** Grains take `IWordFilter` by constructor injection like any other singleton. The web
API's own container gets it through `WebApiWebHost.ForwardSingletons` **and** `WebApiTestFactory`
(both, or the routes 500 in production while the tests stay green — see
`check-webapi-forwarding.mjs`). The dashboard plugin resolves it from the host container.

**Refusal notification.** `WordFilterNotice.Create(string message)` in `Vortex.Protocol` builds a
`NotificationDialogMessageComposer` of type `word_filter` with parameters `display=BUBBLE` and
`message=<text>`. The client's `HabboNotifications.showNotification` takes `message` straight from the
parameters when it is present, so this needs **no** entry in `external_variables` or the texts file.
Sinks send it through the player's `PlayerPresenceGrain.SendComposerAsync`, never to a socket.

**Private message on Refuse** answers `OfflineFailed` (10) as well as the notification: the client's
error table is a verbatim port of `MainView.as`'s `ERROR_MESSAGES` (3..14) and has no "filtered"
entry; 10's text states the outcome without asserting a cause, which is why `SendMessageAsync`
already uses it for the ignore-list refusal.

**Multi-silo ceiling.** `ReloadAsync` refreshes the silo it runs on. This hotel runs one silo, where
the dashboard, the web API and every grain share the process. `ponytail:` if it ever runs several,
the reload becomes a broadcast (an Orleans stream the admin service publishes to).

## Dashboard

**Capability** `dashboard.ops.wordfilter.manage`, added to the four files `AGENTS.md` lists
(`Capabilities.cs` + `Dashboard.All`, `dashboardPermissions.js`, `routes.js`, `locales/en.js` +
`fr.js`) and granted in `DefaultRoles.cs`.

**API** (`Vortex.Dashboard.API`, following `DashboardEndpoints.Feed.cs` + `FeedOperations`):

- `GET  /api/v1/wordfilter/words` — the list.
- `POST /api/v1/wordfilter/words`, `PUT …/{id}`, `DELETE …/{id}` — through an Operation, with a
  **mandatory reason** and an **audit entry** (dashboard architecture §16-17).
- `GET  /api/v1/wordfilter/hits?playerId=&source=&page=` — the journal, newest first.
- `POST /api/v1/wordfilter/test` — `{ text }` → what the filter would answer, for trying a word
  before saving it. Journals nothing.

**`WordFilterAdminService`** writes the rows and then calls `IWordFilter.ReloadAsync`. That is
category C of §11 (persistent data feeding a cache): the change is functionally done only once the
reload returns, and the admin service says so at the declaration. Validation: word trimmed, 1-64
characters, not already present after normalisation (two spellings of one word are one word);
replacement ≤ 64.

**Page** `WordFilterPage.svelte`, two tabs:

- **Words** — the table (word, action, match, replacement, author, date), a `New word` button in the
  `panel-head`, every create/edit in a `<Drawer>` (AGENTS.md: no exceptions), delete through
  `ConfirmReasonModal`. The drawer carries the test box: type a sentence, see the result live.
- **Journal** — filters in their own row above the table (player through `<PickerModal kind="user">`,
  never a typed id; source; date), rows showing the avatar, source, word, action and original text.

## vortex-web

Batch 1 adds one thing: `feed_word_filtered` becomes a toast through `lib/notifier.ts`, with its
text in `src/locales/site/{fr,en}.json`. The username refusal already surfaces as
`pocket.auth.name_not_valid`.

## Testing

**`WordFilter` unit tests** (the matcher is pure, so no host is needed):

- each disguise matches: case, accents, leet, repeats, dotted and spaced letters;
- WholeWord does not match inside a longer word (`con` vs `concert`), Partial does;
- Replace swaps exactly the span and keeps surrounding punctuation;
- one Refuse word refuses the whole text even beside Replace matches;
- no match returns the same string instance;
- a reload swaps the set; a call during a reload sees one set or the other;
- a pathological input hits the match timeout and fails open with a warning, never throws into chat.

**Sink tests**, one per batch-1 sink, in the project that already tests that grain or route
(`Vortex.Rooms.Tests`, `Vortex.Players.Tests`, `Vortex.WebApi.Tests`, `Vortex.PacketHandlers.Tests`):
replaced text is what is broadcast/stored; refused text is broadcast/stored nowhere and the refusal
answer is the one in the table above.

**Dashboard**: the admin service validates and reloads; `CapabilityDeclarationTests` covers the new
key; `check-dashboard-capabilities.mjs` covers the front end's four files.

## Build order

1. Enums + entities + migration.
2. `WordFilter` (normaliser, compiler, matcher) + its unit tests — the heart, testable alone.
3. The journal record through `AuditChannel`; registration in `ObservabilityModule`; the two config
   keys.
4. `WordFilterNotice` + batch-1 sinks, one commit per sink, each with its test.
5. Dashboard: capability, admin service + operation + endpoints, page.
6. vortex-web: the `feed_word_filtered` toast.
7. Batch 2 sinks, grouped by module.
