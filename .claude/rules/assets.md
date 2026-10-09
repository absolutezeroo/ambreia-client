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
- **`.ambreia` directories stand in for directories of `.nitro`** (plan `docs/superpowers/plans/2026-10-08-asset-packs.md`):
  one `<name>.ambreia` per bundle, images used by several pieces once in `images/<sha1>`, the
  manifests (`ManifestCodec`) deflated with `dictionary/<id>.bin`, `ambreia.json` at the root.
  `build-ambreia.ts` is incremental and checks everything (lossless WebP per pixel, manifests, a
  read-back); unreadable bundles are listed in `report.json`. The `asset-packs` feature mounts
  `config.json` → `asset-packs.{clothing,furniture}` (directory URLs) on the avatar / furniture
  download directories; `NitroBundleLoader` reads a mounted piece and falls back to the `.nitro`
  when it is missing. Image *data* is identical; browsers premultiply PNG and WebP alpha with
  different rounding, so semi-transparent pixels can render up to 2/255 apart (invisible).
- **The client's own assets ship as two `.ambreia` bundles** (`public/assets-images.ambreia`,
  `assets-xml.ambreia`, written by `tools/bundle-assets.mjs` on `predev`/`prebuild`): an `AMBB`
  header over one entry table (`AssetBundle.ts`), the body deflated when that pays (the XML one).
  PNGs become lossless WebP checked per pixel (`tools/lossless-webp.mjs`, shared with
  `build-ambreia.ts`) under their `.png` key, cached by sha1 in `.ambreia-build/bundle-images/`
  so a rebuild re-encodes only changed images. Not encrypted (owner's choice).
- **Encrypted `.ambreia` directories** (`build:ambreia --key-file=<file>`): AES-256-GCM per file and
  HMAC file names from one 32-byte master key (`AmbreiaLayout`). The key file lives outside anything
  served (the tool refuses a key inside the output) and the client gets it from `asset-packs.key`.
  That config is public, so this stops a direct look at an URL and name guessing, not a player:
  the key belongs in a server message after login. A directory needs the key it was built with
  (`ambreia.json` → `keyId`); a change of key or encryption is a build into an empty folder (the
  tool refuses to mix them). Build state (`<kind>.sources.json`, the digest of each `.nitro` — "up
  to date" means same digest, not newer mtime) and `<kind>.report.json` go to `--state-dir`
  (`.ambreia-build/`, gitignored), never into the served output.
