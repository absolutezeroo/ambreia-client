# vortex-imager

External avatar, clothing, pet, group-badge, furniture and room imager for Vortex. It answers the same
`/habbo-imaging/…` routes a Habbo hotel already points at, so the client, the CMS and anything
else that embeds an avatar or a guild badge can use it without changing a URL.

**It does not reimplement the renderer.** `AvatarRenderManager`, `AvatarStructure`,
`AvatarImage`, `RoomContentLoader`, `RoomVisualization`, the forty-odd `Furniture*Visualization`
classes and the ~130 more behind them are `vortex-engine`'s own, running unmodified; only the
browser APIs underneath them are replaced (`src/shim/`). A separate renderer drifts from the
client the first time either side is touched, and the drift shows up as avatars that look subtly
wrong on the website and right in the room, or a catalog thumbnail that does not match the item
you just placed.

The one thing the engine cannot lend is the rasterizer:
`RoomObjectSpriteVisualization.getImage()` and `RoomRenderingCanvas` both end at
`renderer.extract.canvas()`, and there is no PixiJS renderer in Node. What they consume is plain
data — `getSprite(i)` gives a texture, an offset, a depth, a tint — so `src/render/composeSprites.ts`
draws it on a 2D canvas instead, which is what AS3's own `BitmapData.draw()` loop did before
PixiJS was in the picture.

## Running

Nothing, most of the time: `pnpm dev` and `pnpm web` each start the imager themselves
(`tools/vite-plugin-imager.mjs`), because both dev servers proxy `/habbo-imaging` to it and a
proxy with nothing behind it is avatars that silently do not draw. The plugin probes :8081 first,
so whichever you start second — or a service you started by hand — keeps the port.

```bash
pnpm imager:dev      # dev server: rebuilds and restarts on change
pnpm imager:build    # bundle to dist/
pnpm imager          # run the built bundle
```

Run those when the imager itself is what you are working on: `imager:dev` restarts on change,
where the dev-server plugin builds once and leaves it alone.

### Pre-generating

```bash
pnpm --filter vortex-imager pregenerate --furni --badges --avatars   # add --force to re-render
```

Bakes the routes to static PNGs, the way a real hotel ships `hof_furni`. It renders nothing
itself — it asks this service over HTTP, so the baked bytes are the bytes the live route would
have produced, encoder and parameter defaults included.

The names come from `imagingKey()` in `tools/vite-plugin-imager.mjs`, which is also what serves
them: both dev servers look in that directory *before* the `/habbo-imaging` proxy, so a baked
image never reaches the imager at all. Anything not baked — a room, a look changed since the last
run, a furni nobody generated — falls through and renders live. Baking is a fast path, never the
only path.

The directory is `IMAGER_STATIC_ROOT`, or `<IMAGER_ASSETS_ROOT>/habbo-imaging` when the imager
runs on the machine that serves the assets — put it there and Apache/nginx answers those URLs
with nothing of ours running at all. Failing both, `static/` next to the package.

What goes stale: furni on an asset build (delete the directory), badges when a guild is edited,
avatars the moment a player changes clothes. A re-run skips what is already on disk, so it costs
only what changed; `--force` re-renders everything.

### The database account

`tools/grant-readonly.sql` creates `vortex_imager`@`127.0.0.1` with `SELECT` on the seven tables
`src/db/Database.ts` reads and nothing else. Run it once as root, put the password in `.env`, and
the service stops holding credentials that could drop the hotel:

```bash
mysql -u root -p turbo < tools/grant-readonly.sql   # after replacing __PASSWORD__
```

`imager:dev` runs two watchers under one command — esbuild rewrites `dist/index.js`, and Node's
`--watch` restarts the service when it does. A restart re-downloads the figure map and the
mandatory libraries, which is about 12s against a remote asset host and near-instant with
`IMAGER_ASSETS_ROOT` set.

Configuration is environment-driven; copy `.env.example` to `.env`. The only things you
configure are where the asset host is and how to reach the database. Which avatar build is
current, where the badge parts live, what the figure map is called — all of that is read from
the hotel's own `external_variables`, exactly as the client reads it, so the imager cannot fall
a build behind.

Set `IMAGER_ASSETS_ROOT` when the imager runs on the machine that serves the assets: reads then
skip HTTP entirely, which matters because a single avatar pulls a dozen `.nitro` libraries.

## Routes

| Route | Notes |
|---|---|
| `GET /habbo-imaging/avatarimage` | `?figure=` or `?user=`, plus the parameters below |
| `GET /habbo-imaging/avatarimage/<name>.png` | Path form; equivalent to `?user=<name>` |
| `GET /habbo-imaging/badge/<code>.png` | Guild badge; `.gif` resolves to the same PNG |
| `GET /habbo-imaging/badge-fill/<code>.png` | `group_logo_url_template`'s route |
| `GET /habbo-imaging/clothing/<figure>.png` | One clothing item, on nobody |
| `GET /habbo-imaging/effect/<id>.png` | An effect's own sprites, without the avatar |
| `GET /habbo-imaging/handitem/<id>.png` | The object in the avatar's hand, without the avatar |
| `GET /habbo-imaging/pet/<type>.png` | A pet; `?type=` is the query form |
| `GET /habbo-imaging/furniture` | `?class=` or `?id=`, plus the parameters below |
| `GET /habbo-imaging/furniture/<class>.png` | Path form; equivalent to `?class=<class>` |
| `GET /habbo-imaging/room/<roomId>.png` | A whole room, from the database |
| `GET /health` | Cache sizes, room pipeline, database reachability |

Everything is answered as `image/png`. `.gif` is accepted because every stored
`group.badge.url` on a Habbo hotel ends in `.gif` — `BadgeImageManager` rewrites the extension
before requesting it, but CMS templates and old links do not.

### Avatar parameters

| Parameter | Values | Default |
|---|---|---|
| `figure` | a figure string | — |
| `user` | a username, resolved against `players` | — |
| `direction`, `head_direction` | 0–7 | 2 |
| `size` | `s`, `m`, `l`, `b` | `m` |
| `headonly` | `1` to render just the head | off |
| `crop` | `1` to trim the transparent margin | off |
| `action` | comma-separated: `std`, `sit`, `lay`, `wlk`, `swim`, `float`, `wav`, `respect`, `blow`, `laugh`, `cry`, `idle`, `sleep`, `talk`, and `crr=<id>`, `drk=<id>`, `sig=<id>`, `dance=<n>`, `fx=<n>` | `std` |
| `gesture` | `sml`, `agr`, `srp`, `sad` | — |
| `crr`, `drk`, `sign`, `dance`, `effect` | ids, as parameters of their own | — |
| `frame` (`frame_num`) | animation frame to advance to | 0 |
| `gender` | `M` / `F` | the figure's own |

`figure` wins over `user`, so a caller that already knows the look never pays for a query.

### Effects and hand items, on their own

Both take `direction`, `frame`, `size`, `zoom` and `bg` like everything else, and both accept an
optional `figure=` — they still run the whole avatar pipeline, they just do not draw the figure.

**`/effect/<id>.png`** composites only the sprites the effect adds — the spotlight cone, the
halo, the hoverboard. Most effects add none: they are an animation the avatar performs, and
those answer 400 saying exactly that rather than handing back a blank image.

**`/handitem/<id>.png`** returns the item alone; `?drk=1` uses the drinking pose instead of the
carrying one, which some items are only drawn for. It goes through the avatar's own body-part
cache rather than guessing the asset name, because the carry animation remaps the item's
direction — building `h_crr_ri_2_2_0` by hand returns a real sprite that is simply the wrong
one (an orange torch where the avatar is holding a blue can).

Glow effects were dark blobs until `render/extractDarknessToAlpha.ts` existed: they are authored
as light on black and drawn additively, which needs something to add to, and a transparent PNG
is nothing. That pass — the engine's own, and AS3's before it — re-encodes the darkness as
alpha. It fixed `?effect=` on the avatar route too, where the same blob had always been.

### Clothing, on nobody

**`/clothing/<figure>.png`** renders the figure string and nothing else — `clothing/ch-255-73.png`
is that shirt, hanging in the air, with no body inside it. It takes the avatar route's `direction`,
`size`, `zoom`, `action`, `gesture` and `frame`, so a garment can be shown in the pose it is drawn
for. Several parts at once is just a longer figure (`clothing/hr-165-45.hd-180-1.png`).

It is `/avatarimage` underneath, with two differences, and the second is the reason the route
exists rather than a line of documentation:

- **`crop=1` by default**, since a garment on its own is mostly empty canvas. `crop=0` gives the
  full avatar canvas with the part in its usual place, which is what you want to overlay several.
- **No gender ever reaches it.** `AvatarRenderManager.createAvatarImage()` runs
  `validateAvatarFigure()` *only* when it is handed a gender, and that method fills in the default
  head, chest and legs for every mandatory set type the figure is missing. So the same figure comes
  back as a bare shirt without a gender and as a whole dressed avatar with one — `gender=` and
  `user=` are dropped here rather than silently changing what the route means.

A figure naming a part this hotel does not have answers **400**, not a transparent image. That is
the one behaviour that differs from `/avatarimage`, which answers 200 with a 1x1 crop: a caller
walking figuredata hits the case constantly, and a blank 200 is indistinguishable from a part that
is genuinely invisible at that direction.

### Pets

**`/pet/<type>.png`** renders a pet in the same isometric view the catalog previews one in —
`RoomEngine.getGenericRoomObjectImage()`'s category-100 branch, which is the path every pet
widget in the client already takes.

| Parameter | Values | Default |
|---|---|---|
| `type` | a pet name (`dog`, `monsterplant`) or its numeric type id | — |
| `palette` | palette id, as `SellablePetPalettes` numbers them | 0 |
| `color` | `RRGGBB` — the pet's own colour, not a background | `ffffff` |
| `head` | `1` to render just the head | off |
| `direction`, `head_direction` | 0–7 | 2 |
| `posture` | the pet's own: `std`, `lay`, `sit`, `eat`, `ded`, … | the resting one |
| `gesture` | the pet's own | — |
| `figure` | a whole pet figure string, overriding the four above | — |
| `size`, `zoom`, `bg`, `frame` | as everywhere else | `m` |

The names come from the hotel's own `pet.configuration`, so a name this hotel does not offer
answers 404 rather than downloading a bundle that is not there. `figure=` takes the string the wire
and the `pets` table carry (`<typeId> <paletteId> <colorHex>[ head][ …custom parts]`) and is how
you render a pet that has custom parts.

`posture` is left unset by default because that is what the catalog does — `getPetImage()` takes a
posture argument and every pet widget passes none. A posture a pet has no animation for falls back
to the resting one rather than failing.

### Furniture parameters

There is no Habbo route to match here: the real hotel serves furniture as pre-baked images out
of `images.habbo.com/dcr/hof_furni/`, which is a build artefact rather than an endpoint. This
one renders on demand, in the same isometric view — same geometry constants — the catalog
previews an item in, so a thumbnail matches what gets placed.

| Parameter | Values | Default |
|---|---|---|
| `class` | the furni's class name, e.g. `throne` | — |
| `id` | the furnidata sprite id; `class` wins | — |
| `wallitem` | `1` to resolve `class`/`id` as a wall item | auto |
| `direction` | 0–7 | 2 |
| `size` | `s` (32), `m` (64), `l` (64 @2x), `b` (64 @3x) | `m` |
| `state` | visualization state; `-1` leaves the default | -1 |
| `frame` | extra animation frames to advance | 0 |
| `color` | palette index, overriding furnidata's | the item's own |
| `extra` | `furniture_extras` — picks a multi-sprite variant | — |
| `bg` | `RRGGBB` or `AARRGGBB` background | transparent |
| `zoom` | resize factor, 0–4 | from `size` |

A name furnidata has never heard of answers 404 rather than the placeholder box the room would
draw for it.

### Room parameters

`GET /habbo-imaging/room/<roomId>.png` renders the room's model — floor, walls, the doorway cut
out of them — and every item standing on it, floor and wall alike, depth-sorted by the same
geometry the client sorts with. The image is sized to the room rather than to a viewport, so a
big room comes back big.

| Parameter | Values | Default |
|---|---|---|
| `walls` | `0` to drop the walls | on, unless the room has `hide_walls` |
| `furni` | `0` to render the bare model | on |
| `floor`, `wall`, `landscape` | decoration ids, overriding the room's own | the room's |
| `frame` | animation frames to advance every furni by, 0–600 | 0 |
| `size`, `zoom`, `bg` | as above | `m` |

Every item is rendered **in the state it is actually in**: `furniture.extra_data` is decoded the
way the server serializes it (`{"stuff":{"Data":"1"}}` → legacy string `"1"` → state 1) and fed
to the item's own logic as a data-update message, which is what lights a lamp, opens a gate and
starts an animation. An item with nothing to say (`{}`, or a wired box's configuration) reads as
state 0, exactly as it does on the wire.

A still image has to pick one frame of an animation, and `frame=0` — the resting one — is the
only deterministic choice; `frame=N` advances every animated furni by N frames at the port's own
~24fps cadence. Furniture that does not animate in its current state is unaffected, so a room
full of static items renders identically at any `frame`.

A room needs the database. Three things are deliberately **not** drawn: avatars, pets and bots —
they are session state, not room contents, and there is nobody in a room the imager renders. The
`/pet/` route renders a pet on its own; it does not put one in a room.

Rooms cache separately and briefly (`IMAGER_ROOM_CACHE_TTL_MS`, one minute by default). Every
other route here is immutable for its URL — a figure string or a badge code fully describes its
image — but `room/7.png` describes a room that changes whenever someone moves a chair, and
nothing tells the imager when that happened.

### Badge codes

Six-character segments, `b{partId:D2}{colorId:D2}{position:D1}` — the shape the emulator's
`GuildBadgeLibrary` reads and writes. The first segment is the base shape, the rest are symbols
positioned on a 3x3 grid; `s`-prefixed segments are accepted as symbols too, for codes imported
from Arcturus hotels. `?zoom=<n>` scales the 39x39 result.

## Caching

Two tiers, and the split is about what a URL promises.

**An avatar, a badge and a furni are immutable for their URL.** A figure string fully describes
the look; a badge code fully describes the badge; a furni's class and parameters fully describe
the render. The same key can only ever produce the same bytes, so those are kept **on disk**
(`IMAGER_CACHE_DIR`, `cache/` next to the package by default) as well as in memory, and a
restart serves them straight back instead of re-rendering the hotel — measured at 17 ms for an
avatar and 2 ms for a furni against 160 ms+ for a fresh render.

**A room is not.** `room/8.png` names a room whose contents change whenever someone moves a
chair, and nothing tells the imager when that happened. Rooms stay memory-only on a short TTL
(`IMAGER_ROOM_CACHE_TTL_MS`, one minute).

The one thing that *can* change an otherwise-immutable image is the hotel rebuilding its assets,
so the disk path includes the asset build — `cache/vortex-assets-PRODUCTION-…/` — taken from
`flash.client.url`. A client update writes into a new directory and the old one stops being
read; deleting it is the whole of cache invalidation. `IMAGER_CACHE_DIR=` disables the tier
entirely, and `/health` reports the directory in use.

Concurrent renders of the same key are collapsed into one either way: twenty simultaneous
requests for the same avatar do one composite and share the result, which on a single-threaded
renderer matters more than the cache does.

Every response also carries `Cache-Control: public, max-age=21600` and `X-Imager-Cache:
hit|miss`, so browsers and any CDN in front cache too. That header is currently the same for
rooms, which is longer than their own TTL — narrow it if you put a shared cache in front.

## CORS

Every response carries `Access-Control-Allow-Origin` (`IMAGER_CORS_ORIGIN`, `*` by default),
including error responses — otherwise a 404 reaches the browser as an opaque CORS failure
rather than a 404.

This is required, not a convenience. The client tags avatar and badge images with
`crossOrigin = "anonymous"` (`login/ImageLoader`, `BadgeImageManager`,
`onBoardingHcSteps/RoomPicker`) because it reads them back off a canvas —
`BadgeImageManager.renderSmallScaleBadgeBitmap()` derives the 50% badge with `toDataURL()`,
which throws on a tainted canvas. With that flag set, a response without the header is
discarded whatever its status code.

## Requirements

- **Node 20+.**
- **A database**, for `?user=` and for badges. The badge part and colour catalogue
  (`group_badge_parts`, `group_colors`) is the server's data, read rather than mirrored here so
  it cannot go stale. Without `IMAGER_DB_DATABASE` the badge routes answer 503 and `?figure=`
  still works.

## Two things worth knowing

**`size=s` composites at full scale and halves the image.** It does not use
`AvatarScaleType.SMALL`. That scale asks for `sh_*` assets and this asset build has none —
`hh_human_body.nitro` holds 244 assets, every one of them `h_*` — so it renders a fully
transparent avatar with nothing logged. `LARGE_TO_SMALL` (`h_50`) is the mode meant for that
case, but the engine's port of it never halves the parts, so `h`-sized parts get positioned
against a 45x72 canvas and land almost entirely outside it. Both are open engine-side gaps; see
`src/avatar/AvatarRequest.ts`.

**Effect sprites are composited here, not by the engine.** `AvatarImage.getImage()` returns the
body only; an effect's extra sprites (the hoverboard, the emblem halo) are separate room
sprites in the client. `src/render/composeAvatar.ts` flattens them, and its one deliberate
deviation from `AvatarVisualization`'s formula — the sign of the asset offset — is explained at
the line that makes it.
