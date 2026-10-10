---
paths:
  - "packages/vortex-client/tools/**"
  - "packages/vortex-client/src/assets/**"
  - "packages/vortex-glaze/tools/**"
  - "install.mjs"
---

# Client assets: how they are built and named

- **Window layouts and skins ship as XML, verbatim from the dump**, written by
  `packages/vortex-client/tools/build-window-assets.mjs` out of the dump's `src/layouts/` +
  `src/_assets/` + `src/binaryData/*Com.as`. There is no JSON compile step. `binaryDataXml_organized/`
  is a leftover named after each XML's internal `<layout name="...">`, a Flash label AS3 never reads:
  name nothing from it. New, non-Habbo layouts go in `packages/vortex-client/src/vortex-layouts/`.
- **An asset's real name is its `*Com.as` field name**, the exact string passed to
  `assets.getAssetByName()` (`HabboWindowManagerCom.as`: `habbo_window_layout_bubble_xml:Class =
  bubble_xml$44e3d739...`). Libraries are per component, so one field name can mean two embeds
  (`avatar_image_xml` in HabboFriendBar and HabboWindowManager): join declarations to files on the
  embed's **whole** linkage name, hash included. Collapsing to the short name once shipped a layout
  under an image's name.
- **The builder also reads AIR-1.0.31 as a supplement.** `resolveTree()` tells the two tree shapes
  apart by where the `*Com.as` manifests are, never by directory name. AIR adds names WIN63 lacks and
  never replaces one, except the names in `AIR_PREFERRED` (today: adds `raid_protection_settings_xml`,
  overrides `iro_room_details_framed_xml`). `--no-air` builds without it. Measure AIR-vs-WIN63 gaps
  with the builder's own report, not by filename: AIR blobs carry linkage names, shipped assets carry
  field names.
- **Images are gitignored** (`*.png`). A new image reaches anyone else only through
  `vortex-client-assets.zip` (`node install.mjs --pack`). Image names keep their subfolder under
  `images/` (`images/rpg/skills/icon_00.png` → `rpg/skills/icon_00`).
- `import-air-images.mjs` reads AIR's `*Com.as` **and `*Lib.as`** (VariableFx art is declared in
  `HabboRoomObjectVisualizationLib.as`) and strips a redundant `_png` suffix from field names
  (`user_typing_png` is the shipped `user_typing.png`).
- **Shipped assets can lag the primary dump**: check before assuming a code gap.
  `src/assets/configurations/HabboAvatarGeometry.xml` has 9 bodyparts and no `order-*` attributes
  where the WIN63 dump has 11 (`petl`/`petr`).
- **Every asset family is an `.ambreia` directory, and nothing reads a `.nitro`** (spec
  `docs/superpowers/specs/2026-10-09-ambreia-everything-design.md`): `ambreia/{clothing,effects,room,pets,furniture}/`
  on the asset server, one `<name>.ambreia` per bundle, images used by several pieces once in
  `images/<sha1>`, the manifests (`ManifestCodec`) deflated with `dictionary/<id>.bin`,
  `ambreia.json` at the root. The `.nitro` sources live outside anything served
  (`C:/laragon/ambreia-sources/<family>/`, filled by `tools/gather-ambreia-sources.mjs`);
  `build:ambreia:all` builds the five families (`build-ambreia.ts`: incremental, lossless WebP per
  pixel, manifests and a read-back checked; unreadable bundles in `<family>.report.json`) and writes
  `.ambreia-build/coverage.json`: figure-map and effect-map libraries, pets and room bundles with no
  piece. A missing base library (`hh_*`, minus `KNOWN_ABSENT_BASE`) or room bundle fails it.
  A family `config.json` leaves out defaults to `${url.prefix}/ambreia/<family>/`, so only the key of
  encrypted directories has to come from it.
- **Loading a piece:** the `asset-packs` feature opens the five directories from `config.json` →
  `asset-packs.{clothing,effects,room,pets,furniture,key}` (all required) into
  `made.assetDirectories`; the avatar renderer and `RoomContentLoader` load with
  `AssetLibrary.loadPiece(assetName, directory, piece)` (`AmbreiaPieceLoader`). A missing piece warns
  once and does not display; a directory that cannot be read (wrong key, no WebCrypto off a secure
  origin) is an error once. In game, a furni icon is the furni rendered at scale 1 (its `_icon_`
  assets). The hotel's own icons (`<class>[_<colour>]_icon`, which differ from that render for about
  four in ten furni) are the optional `icons` family; tools get them from the imager
  (`/habbo-imaging/furniture?class=…&size=icon`), which renders the furni only when there is none. The imager, the
  iso sandbox and the map editor read the same `config.json` section. Image *data* is identical to
  the source; browsers premultiply PNG and WebP alpha with different rounding, so semi-transparent
  pixels can render up to 2/255 apart (invisible).
- **The client's own assets ship as two `.ambreia` bundles** (`public/assets-images.ambreia`,
  `assets-xml.ambreia`, written by `tools/bundle-assets.mjs` on `predev`/`prebuild`): an `AMBB`
  header over one entry table (`AssetBundle.ts`), the body deflated when that pays (the XML one).
  PNGs become lossless WebP checked per pixel (`tools/lossless-webp.mjs`, shared with
  `build-ambreia.ts`) under their `.png` key, cached by sha1 in `.ambreia-build/bundle-images/`
  so a rebuild re-encodes only changed images. Not encrypted (owner's choice).
- **Encrypted `.ambreia` directories** (`build:ambreia --key-file=<file>`): AES-256-GCM per file and
  HMAC file names from one 32-byte master key (`AmbreiaLayout`). The key file lives outside anything
  served (the tool refuses a key inside the output) and the client, the imager and the dev tools get
  it from `config.json` → `asset-packs.key`.
  That config is public, so this stops a direct look at an URL and name guessing, not a player:
  the key belongs in a server message after login. A directory needs the key it was built with
  (`ambreia.json` → `keyId`); a change of key or encryption is a build into an empty folder (the
  tool refuses to mix them). Build state (`<kind>.sources.json`, the digest of each `.nitro` — "up
  to date" means same digest, not newer mtime) and `<kind>.report.json` go to `--state-dir`
  (`.ambreia-build/`, gitignored), never into the served output.
- **Monsters** are pets drawn by `tools/monster-art/` (spec
  `docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md`): `monsters/<id>/rig.json`
  (volumes on bones, materials, decals, poses) → `build:monster-art` → `<id>.aseprite` (layers
  forme/peinture/détails/finition, plus `retouche` for hand edits, never overwritten) and
  `monster.json` → `build:monsters` → `pets/<id>.nitro` → `build:ambreia:all --only=pets`. The pet
  type is the id's index in `pet.configuration`. `monster-art:preview <id>` shows the 8 directions
  live. A hand-drawn `.aseprite` (the slime) goes through `build:monsters` the same way.
- **Combat effects** are PixelLab VFX exports committed under `packages/vortex-client/spells/<folder>/<name>.{json,png}`
  (the PNGs are un-ignored there). `bundle-assets.mjs` ships each as `rpg/vfx/<folder>/<name>` and
  `tools/build-vfx-sheets.mjs` (`pnpm gen:vfx`, on `predev`) writes their grid and anchor into
  `@ambreia/game` `features/combat/vfxSheets.generated.ts`. Which sheet plays when is the emulator's
  content (`vfx` phases of a skill, `basicAttack` of a class, `aura` of a status), never a table or
  a class/skill id in the client.
