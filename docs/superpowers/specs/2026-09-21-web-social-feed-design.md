# The social feed — design

**Date:** 2026-09-21
**Status:** approved, not yet implemented
**Packages:** `packages/vortex-web` (front), `../vortex-emulator` (`Vortex.Database`, `Vortex.WebApi`)

## What this is

A social feed on the hotel's website: a player writes a status, publishes photos they have already
taken in game, or asks a poll question, and other players comment, repost and favourite it. Posts
carry `#tags` and the feed can be filtered by one.

### Where the design comes from

A single screenshot of a 2015-era Habbo dashboard, supplied by the user and **not present in this
repository or in the emulator's** — both were searched for its strings (`POST AS`,
`Create a photo album`, `FRIEND INFORMATIONS`) and neither has them. The screenshot is therefore the
whole visual specification; there is no template, stylesheet or dump behind it to consult, and
nothing below should be written as if there were.

It slots into `vortex-web` more cleanly than it looks. That package is already in the screenshot's
palette — `--color-page: #0c3a65`, `--color-card: #0b6395`, `--color-panel-head: #0e3955` — and
`ContentAside` is already its layout: a main column beside a fixed 304px aside.

## Scope

In:

- the three post kinds the composer offers: **status**, **Habbo photos**, **poll**
- comments, and **rich comments** — a comment may itself carry photos or a poll, which the
  screenshot shows and which costs nothing under the data model below
- **reposts and favourites**, the two counters on each post's bar
- **hashtags**, extracted on publish, rendered as links, and searchable
- **`POST AS ▾`** — publishing under a group's identity

Out, each for a stated reason:

- **the right-hand column** (friend requests, room invitations, birthdays, friend and group
  recommendations). There is no friends surface on the web API at all; this is a subsystem of its
  own, not a side box. The aside renders the site's standard CMS safety box instead, which is what
  the home, the community pages and an article already do.
- **`Create a photo album`** — a fourth post kind, not retained.
- **the news card in the feed** (the red banner in the screenshot). Articles exist
  (`GET /api/public/articles`) so this is cheap later, but it is not part of the feed's own model.
- **a word filter.** There is none in the emulator to reuse: `RoomFilterWordEntity` is per-room (the
  words a room owner bans in their room) and `PlayerWordFilterEntity` is a player's own. Writing a
  hotel-wide one is a separate project. Removal, below, is what v1 ships instead.

## Surface

### Route

`/community/chats`, a new tab in `COMMUNITY_TABS`.

This follows the precedent already set by `/community/leaderboard`: a tab habbo.com does not have,
carrying a `DEVIATION:` comment saying so, with its labels in `src/locales/site/{fr,en}.json` rather
than in the fetched habbo.com dictionaries. The screenshot's `DASHBOARD | CHATS` sub-band **is** the
community tab bar — there is nothing to build for it.

### Layout

`CommunityShell` (the tabs) → `PageHeader` → the body in `ContentAside`.

The tag search box goes in the `PageHeader`, **not** in the tab bar: `Tabs` is shared by seven pages
and shells and must not learn a search field for one of them.

### Files

Seven new, all under `packages/vortex-web/src`:

| File | Responsibility |
|---|---|
| `pages/community/Chats.svelte` | the page: composer, feed, pagination, tag filter |
| `components/feed/FeedComposer.svelte` | the three tabs (status / photos / poll), the `POST AS ▾` menu, Publish. **The same component is the comment form** — in the screenshot they are the same form |
| `components/feed/FeedPost.svelte` | header (head + "X published 2 new pictures"), body, the comments/reposts/favourites bar, and **its own children**: a comment is a post |
| `components/feed/FeedPoll.svelte` | the choices, the percentage bars, the vote |
| `components/feed/FeedBody.svelte` | the text with its `#tags` turned into links |
| `lib/feed.ts` | the API calls, beside `api.ts` |
| `locales/site/{fr,en}.json` | the labels (edited, not created) |

The photo grid and the comment thread get no file of their own: the first is a grid of
`<img src={photoUrl(key)}>` inside `FeedPost`, the second is `FeedPost` rendering itself. Everything
else is reused — `Panel`, `Avatar`, `Button`, `Field`, `Tabs`, `EmptyResults`, `notifier`, `session`.

### The composer uploads nothing

`Habbo Photos` picks from the player's **own already-published camera photos**, which
`GET /api/public/users/{uniqueId}/photos` already serves and `photoUrl(key)` already addresses.
There is no new upload path, no new storage, and no new moderation surface for image bytes.

## Data model

Seven entities under `Vortex.Database/Entities/Feed/`, one EF migration. House conventions
throughout: `VortexEntity` base, `[Table("snake_case")]`, `[Column("snake_case")]`, `[Index]`,
`<X>EntityId` foreign keys with a navigation property.

### `web_feed_posts` — `WebFeedPostEntity`

| Column | Notes |
|---|---|
| `player_id` | **the real author, always**, even when the post displays as a group |
| `group_id` | nullable — the displayed identity (`POST AS`) |
| `parent_id` | nullable — null is a root post, set makes the row a comment |
| `kind` | `Status` / `Photo` / `Poll` |
| `body` | the text, max 500 |

Inherits `CreatedAt` and `DeletedAt` from `VortexEntity`. Indexed on `(parent_id, created_at)` for a
thread, `(player_id, created_at)` for a player's own, and `(deleted_at, created_at)` for the root
feed.

**One table, self-referencing, is the load-bearing decision.** A comment is a post with a parent, so
"a photo inside a comment" and "a poll inside a comment" need no second set of tables, no
polymorphic owner column, and no second projection. The two rejected alternatives were: separate
post and comment tables (which forces exactly that duplication), and reusing
`Vortex.Database/Entities/Polls` for the poll kind (a multi-question questionnaire wired to the
game client's poll packets, of which a feed poll would use about a tenth, while coupling the feed to
the game's poll system).

### `web_feed_post_photos` — `WebFeedPostPhotoEntity`

`post_id`, `photo_id` (FK to `camera_photos`), `ordinal`.

The foreign key, **not the photo key as a string**: the projection re-checks that the photo is
still published and not deleted, so a photo the owner later takes back disappears from the post
instead of staying in it as a 404. It does **not** re-check the owner's `ProfileVisible` — see
"Reads" under Trust boundary for why that column governs browsing a profile and not publishing.

### `web_feed_poll_choices` — `WebFeedPollChoiceEntity`

`post_id`, `ordinal`, `label` (max 80).

### `web_feed_poll_votes` — `WebFeedPollVoteEntity`

`post_id`, `choice_id`, `player_id`. Unique on `(post_id, player_id)`.

Carrying `post_id` as well as `choice_id` is what makes that unique index expressible without a
subquery — one vote per player per poll, enforced by the database rather than by whichever handler
happens to run.

### `web_feed_reactions` — `WebFeedReactionEntity`

`post_id`, `player_id`, `kind` (`Repost` / `Favorite`). Unique on `(post_id, player_id, kind)`.

Un-reacting **deletes the row**. The reasoning is written out in full in `CameraPhotoLikeEntity` and
applies here word for word: a counter cannot be un-incremented correctly because it does not
remember who, and a soft delete would keep the pair and make the unique index refuse the next
reaction.

### `web_feed_tags` / `web_feed_post_tags`

`web_feed_tags`: `tag`, lowercased, unique. `web_feed_post_tags`: `post_id`, `tag_id`, unique on the
pair. The original casing stays in the post's body — the table holds the search key only.

### No stored counters

Comments, reposts and favourites are correlated `COUNT`s in the projection, one query per page.

`ponytail:` this is a deliberate ceiling. Denormalised counters would buy nothing today and cost
three invalidation paths; add them if the feed grows past the point where the correlated counts
measure badly.

## API

`Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs` (a partial, like `.Camera.cs`), over
`Services/IWebApiFeedService.cs` + `WebApiFeedService.cs` (EF, `IDbContextFactory<VortexDbContext>`,
exactly the shape of `WebApiPhotoService`).

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/public/feed?page=&pageSize=&tag=` | anonymous | the feed: root posts, newest first, each with its counters and its 3 most recent comments |
| `GET /api/public/feed/{id}` | anonymous | one post and all its comments, paginated |
| `POST /api/user/feed` | session | publish. A comment is the same call with `parentId` |
| `DELETE /api/user/feed/{id}` | session | soft delete |
| `PUT /api/user/feed/{id}/reaction` | session | `{kind, on}` |
| `POST /api/user/feed/{id}/vote` | session | `{choiceId}` |

**There is no route for `POST AS ▾`.** `GET /api/public/users/{uniqueId}/profile` already returns the
player's groups, and the server re-checks membership on publish regardless of what the client sends,
so the composer's list is display only.

### Response shape

Flat records, matching `PhotoSummary`'s style rather than nesting an author object:

```csharp
public sealed record FeedPost(
    int Id,
    string AuthorUniqueId,
    string AuthorName,
    string AuthorFigureString,
    int? GroupId,
    string? GroupName,
    string? GroupBadgeCode,
    FeedPostKind Kind,
    string Body,
    DateTime CreatedAt,
    IReadOnlyList<PhotoSummary> Photos,
    FeedPoll? Poll,
    IReadOnlyList<string> Tags,
    int CommentCount,
    int RepostCount,
    int FavoriteCount,
    bool RepostedByMe,
    bool FavoritedByMe,
    bool Mine,
    IReadOnlyList<FeedPost> Comments
);

public sealed record FeedPoll(
    int TotalVotes,
    int? MyChoiceId,
    IReadOnlyList<FeedPollChoice> Choices
);

public sealed record FeedPollChoice(int Id, string Label, int Votes);

public sealed record FeedPage(int Page, int PageSize, int Total, IReadOnlyList<FeedPost> Items);
```

`Photos` is `PhotoSummary`, the record the site already renders through `PhotoColumns` and
`photoUrl` — not a second photo shape.

`Comments` holds the 3 most recent on a root read, and is empty on a comment: the tree is one level
deep by construction (see validation).

The percentage the screenshot shows on each poll bar is computed on the front from
`Votes / TotalVotes`; the server sends counts.

### Types

`openapi.json` is rewritten by `Vortex.WebApi.Tests/OpenApiDocumentTests.cs`, which fails when the
API's shape has moved and the file has not. Then `pnpm api:types` regenerates
`packages/vortex-web/src/lib/api.generated.ts`. `lib/feed.ts` wraps the generated types the way
`api.ts` does.

## Trust boundary

The feed is public, user-generated content. Nothing the browser sends is believed.

### Reads

Every query carries the same condition, in one place in `WebApiFeedService` — **the post is not
deleted** — and that is the whole of it.

**The feed does NOT gate on `ProfileVisible`, and this paragraph used to say the opposite.** It was
written by copying `IWebApiPhotoService`'s rule across without checking what that column defaults
to. It defaults to **false**: this hotel honours habbo.com's own promise on the registration form,
*"Ton profil est privé par défaut"*. Gating the feed on it made the feature broken by default rather
than private by default — a new player's posts were invisible to everyone including themselves, and
the write path returned HTTP 200 with a `null` body because `PublishAsync` read its own new row back
through that same gate, which crashed the page's render loop.

The rule that replaces it: **publishing is the consent.** Posting to the hotel's public feed is
itself an act of publication, and it is a different act from letting someone browse your profile.
`ProfileVisible` governs the second and says nothing about the first. A player who does not want a
post read does not post it; the delete in `DELETE /api/user/feed/{id}` is how they take one back.

Two things this does **not** change:

- **The photo gallery keeps its own rule.** `IWebApiPhotoService` still requires `ProfileVisible`,
  because browsing a gallery of someone's photos by their name is browsing them. That is its
  decision and it stands.
- **A photo attached to a feed post is still re-checked for published and not-deleted**, so a
  picture the owner takes back leaves the post. Only the `ProfileVisible` half of that re-check
  goes, for the same reason as above — the author attached their own already-public photo to their
  own public post.

### Writes — validation rules

| Field | Rule |
|---|---|
| `body` | trimmed, ≤ 500 characters; empty is refused except on a `Photo` post carrying at least one photo |
| `photoKeys` | ≤ 4, and every one must be **the caller's own** and **published** — otherwise a player republishes someone else's photo under their name. The request carries keys because that is what the browser knows; the service resolves each to a `camera_photos` id and stores the id, and a key that resolves to nothing is a refusal, not a skipped photo |
| `pollChoices` | 2 to 5, each ≤ 80 characters after trimming |
| `parentId` | must exist, not be deleted, and **be a root** — no comment on a comment. The screenshot has none, and it keeps the thread one level deep |
| `groupId` | must be a group the caller is a member of, re-checked server-side |
| `kind` | must agree with the payload: a `Poll` with no choices, or a `Photo` with no photos, is refused |
| `choiceId` (vote) | must belong to the poll named in the route |

Every refusal is an `ApiErrorResponse` with a code, following the existing `photo_not_found` style:
`feed_post_not_found`, `feed_body_too_long`, `feed_photo_not_yours`, `feed_poll_invalid`,
`feed_parent_not_root`, `feed_group_not_member`.

### Rate limiting

A `FeedPostRateLimit` in `WebApiConfig`, on the same `RateLimitOptions` mechanism the hotel already
uses for login, registration, SSO, reports and chain RPC, applied to `POST /api/user/feed`.

### Removal

The author deletes their own, through `DELETE /api/user/feed/{id}`.

**Staff removal is part of v1** — a public feed with no takedown is a hole — but it does **not** go
on this API. `Vortex.WebApi` has no permission check anywhere in it: not one of its routes reads
`Vortex.Primitives.Permissions.Capabilities`, and teaching it a capability system for one endpoint
is the wrong place to put one. That plumbing already exists in `Vortex.Dashboard.API`, which is
where every staff surface in this hotel lives.

So: a new capability key under `Capabilities` — `web.feed.moderate` — declared and seeded the way
the others are (`Vortex.Authentication/Permissions/DefaultRoles.cs`,
`PermissionSeederService.cs`; `CapabilityDeclarationTests` fails on a key that is declared and never
granted), and one dashboard endpoint that soft-deletes a row behind the dashboard's existing
capability guard. Small, because none of the plumbing is new.

## Testing

`Vortex.WebApi.Tests/WebApiTestFactory` brings the API up in memory. One test per rule in the table
above, plus:

- a reaction is idempotent — reacting twice leaves one row, un-reacting removes it
- one vote per player per poll, and changing a vote moves it rather than adding one
- a photo belonging to another player is refused
- **a post by a player whose profile is private DOES appear, and its author gets it back on
  publish** — the inverse of what this line asked for until the `ProfileVisible` rule was dropped.
  Both halves matter: the read, because `profile_visible` is false by default and the feed would
  otherwise be empty for nearly everyone; and the write, because `PublishAsync` reads its own new
  row back, so a gate there returned HTTP 200 with a null body and crashed the page
- a comment is returned under its root and never as a root itself

`OpenApiDocumentTests` fails on its own if the shape moves without `openapi.json`.

## Build order

1. **Entities + migration** (`Vortex.Database`) — the seven tables, no behaviour.
2. **`IWebApiFeedService` + `WebApiFeedService`** — reads first (`GetFeedAsync`, `GetPostAsync`),
   with the shared condition helper, mirroring `WebApiPhotoService`.
3. **`WebApiEndpoints.Feed.cs`** — the two read routes; regenerate `openapi.json` and
   `api.generated.ts`.
4. **`Chats.svelte` + `FeedPost` + `FeedBody` + `lib/feed.ts`** against real reads, seeded by hand.
   The feed renders before anything can be written to it.
5. **Writes** — `POST /api/user/feed` with its full validation, then `FeedComposer`.
6. **Poll** — choices, votes, `FeedPoll.svelte`.
7. **Reactions** — the bar's two counters.
8. **Tags** — extraction on publish, links in `FeedBody`, the `?tag=` filter and the header's search.
9. **Comments** — `parentId` on publish, `FeedPost` rendering itself, the comment form.
10. **Staff removal** — the `web.feed.moderate` capability and its dashboard endpoint — the rate
    limit, and the test pass over every rule.

Steps 1-4 are the vertical slice that proves the model; nothing after step 4 changes its shape.
