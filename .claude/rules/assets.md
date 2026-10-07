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
