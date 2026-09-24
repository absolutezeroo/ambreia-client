# Photo albums — design

**Date:** 2026-09-24
**Status:** delivered 2026-09-24 — emulator `42492c585` (migration `AddWebAlbums`), merged into
main with the word filter's batch 2; site `45a75565`
**Packages:** `../vortex-emulator` (`Vortex.Database`, `Vortex.Primitives`, `Vortex.WebApi`),
`packages/vortex-web`

## What this is

The fourth post kind the social feed's screenshot showed and the feed spec left out
(`2026-09-21-web-social-feed-design.md`, "Create a photo album — not retained"). An album is a
**named collection** of a player's in-game photos: a title, a description, as many photos as they
like, added over time. It has its own page, a section on its owner's profile, and a card in the feed.

Decided with the user, 2026-09-24:

- a named collection, not a frozen multi-photo post;
- **public**, like the photo gallery and the feed — every photo in it is already a published photo;
- **one card in the feed, which comes back up**: creating an album posts an `Album` card; adding
  photos later bumps that card to the top, the way an active thread would. Likes, shares and
  comments are the card's, through the feed's existing machinery.

## Out

- manual reordering (photos stay in the order they were added);
- albums shared between players;
- private albums.

## Data model (`Vortex.Database`)

### `web_albums` — `WebAlbumEntity`

| Column | Notes |
|---|---|
| `player_id` | the owner |
| `title` | 1–60 characters |
| `description` | 0–500 characters |
| `feed_post_id` | the album's card in the feed |
| `created_at`, `updated_at`, `deleted_at` | `VortexEntity`; delete is soft |

### `web_album_photos` — `WebAlbumPhotoEntity`

`album_id`, `camera_photo_id`, `ordinal`; unique on `(album_id, camera_photo_id)`. Re-filtered on
read exactly like `web_feed_post_photos`: a photo its owner has since unpublished leaves the album.

### `web_feed_posts.bumped_at`

Nullable. The feed sorts originals on `bumped_at ?? created_at`; adding photos to an album sets its
card's `bumped_at` and announces `FeedChangedEvent`, so open feeds refresh it.

### `FeedPostKind.Album = 3`

An album card carries no body of its own; the card reads the album (title, first four photos,
count, link) through the post's album id.

## Rules

- Only the owner's own **published** photos — the same check a photo post makes.
- An album is created with at least one photo (`album_empty` otherwise): an empty card says nothing.
- Title and description go through the hotel-wide word filter, source `WordFilterSource.Album` (19).
- At most 100 photos per album — `WebApiAlbumService.MaximumPhotos`, a constant: nothing asked to
  tune it.
- **An album lives and dies with its card.** There is no album delete: deleting the card through
  the feed's own `DELETE /api/user/feed/{id}` (second factor included) deletes the album, and a
  staff takedown of the card (`FeedAdminService.RemoveAsync`) takes it too. One path, not two.
- Adding photos skips one already in the album and bumps the card only when something was added,
  so a retried request neither doubles a photo nor bumps twice. Removing a photo hard-deletes the
  link, so the unique index does not refuse putting it back.
- A rename announces `FeedChangedEvent` but does not bump: a rename is not news.
- The feed composer cannot post an `Album` card itself (`KindMismatch`); only the album service
  writes one.

## API (`Vortex.WebApi`)

| Route | |
|---|---|
| `GET /api/public/albums/{id}` | one album and its photos |
| `GET /api/public/users/{uniqueId}/albums` | a player's albums, newest first |
| `POST /api/user/albums` | `{ title, description, photoKeys }` → the album; posts its card |
| `PUT /api/user/albums/{id}` | `{ title, description }` |
| `POST /api/user/albums/{id}/photos` | `{ photoKeys }` → bumps the card |
| `DELETE /api/user/albums/{id}/photos/{photoKey}` | |

No album delete route — see Rules. Create and add-photos share the feed's publish rate limit.

Refusals come back as codes (`album_not_found`, `album_title_invalid`,
`album_description_too_long`, `album_empty`, `album_photo_not_yours`, `album_full`,
`album_word_filtered`) and become toasts on the site. `album_not_found` also answers "not yours",
so a caller cannot probe whose albums exist.

## Site (`vortex-web`)

- A fourth tab, **Album**, in the feed composer: title, description, and the Photos tab's picker.
- `/community/albums/:id`: the album's page — grid, the site's photo viewer, and for the owner:
  add photos, remove one, rename, delete.
- An **Albums** section on the profile.
- The feed card for `Album`: title, four photos, "N photos", a link to the page.

## Testing

`Vortex.WebApi.Tests`, against the in-memory database, the way the feed's are: ownership, the
published-only rule, the cap, the word filter, the bump reordering the feed, delete taking the card
and the card's takedown taking the album.
