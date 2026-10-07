---
paths:
  - "sources/**"
  - "**/*.as"
---

# Reading the AS3 sources

`sources/` holds decompiled Flash client dumps. They are read-only reference (a hook refuses edits):
read them to understand why inherited code behaves as it does. Since 2026-10-07 the port no longer
has to stay faithful to them, and **message ids never come from them** (the emulator's `Headers.cs` is
the source, via `pnpm gen:headers`).

## The trees

| Directory                                    | Use                    | Package roots                           |
|----------------------------------------------|------------------------|-----------------------------------------|
| `sources/WIN63-202607011411-782849652/`      | **Primary**            | `src/com/sulake/{habbo,room,core,iid}/` |
| `sources/win63_version/`                     | Names only             | `habbo/`, `room/`, `core/`              |
| `sources/PRODUCTION-201601012205-226667486/` | Identify / recover names (2016, unobfuscated) | `src/com/sulake/habbo/` |
| `sources/AIR-1.0.31/`                        | Behaviour of AIR-only features, never ids | `src/com/sulake/{habbo,room,core,iid}/` |

Path mapping: `WIN63-…/src/com/sulake/<module>/` ↔ `win63_version/<module>/` ↔
`PRODUCTION-…/src/com/sulake/habbo/<module>/`. `AS3:` trace comments always point at the primary tree.

## Obfuscation

- **Class names are obfuscated, member names are not.** `habbo/room/_SafeCls_90.as` declares
  `implements IRoomEngine` and its 255 methods are readable: that file is RoomEngine. Identify a class
  by the interface it implements, not by a name lookup.
- **About 40% of interfaces are obfuscated too** (`implements _SafeCls_1783` says nothing until that
  interface is resolved). Match its members against a named interface in PRODUCTION, or against this
  port's own `I*.ts` (`_SafeCls_1783` is `ICatalogNavigator`, because `CatalogNavigator.as` takes it).
- **When a name exists in no tree, derive it and say so at the declaration**; never pass a derived
  name off as recovered (see `CatalogWindowState.requestedPage`).
- `win63_version` does **not** recover names file-for-file: it is obfuscated with another scheme
  (RoomEngine is `_SafeCls_90.as` in the primary, `class_34.as` there, `RoomEngine.as` only in PRODUCTION).

## `win63_version` is a worse decompile: never read a body from it

Its bodies have produced shipped bugs: `SpinnerCatalogWidget.refresh()` reads `visible = 0 > 0` (a
permanently hidden container); `GiftWrappingConfigurationEventParser.parse()` reads `while(0 < _loc2_)`
in four loops (a browser hang). When a `win63_version` body reads as dead or absurd, it is the
decompiler and the primary tree settles it. Cite `win63_version` only for a *name* (it is the only
tree where messages have readable filenames).

## Decompiler traps in the primary tree

- **E4X `@` is dropped from computed attribute access.** `_loc3_.@["order-before"]` comes back as
  `_loc3_["order-before"]`, which reads as child access and makes live code look dead. If the name is
  an attribute in the XML, the source had `.@[...]` (`AvatarModelGeometry.as`, `order-before`).
- **`src/unknowns/` (`_SafePkg_N/`) is part of the client**: 556 files import from it (parser DTOs,
  composers, `IStuffData` holders). Search it before concluding a definition does not exist.
- **The flat `src/_SafeCls_N.as` files are the embedded-asset classes** and carry the name mapping in
  a footer comment (`@identifier _SafeCls_894 = "header_png$e4f111fb..."`); `tools/lib/cryptedManifest.mjs`
  reads them.

## AIR-1.0.31

A later build and a strict superset in readable classes. It is the only tree with **VariableFx**
(`habbo/room/object/variablefx/`, `.../visualization/variablefx/`, `.../visualization/stacked/`),
**raid protection** (`habbo/navigator/raidprotection/`) and the wired `VariablesWebApiAddon`. Read it
for behaviour of those. Its assets are 1,092 `.bin` blobs in `src/binaryData/` named
`<charId>_<class>`, where `<class>` is the linkage name or the `_SafeCls_N` its `*Com.as` assigns:
`HabboNavigatorCom.as` says `raid_protection_settings_xml:Class = _SafeCls_1412`, so the layout is
`binaryData/3129__SafeCls_1412.bin`. **Look there before reconstructing an AIR layout by hand.** Images
are not in the dump: cut them from the launcher's `HabboAir.swf` with JPEXS
(`ffdec-cli -export binaryData,symbolClass,image <outdir> <swf>`), then
`AIR_IMAGE_EXPORT=<dir> node packages/vortex-client/tools/import-air-images.mjs`.

## Not this project's server

`sources/HABBO-ARCTURUS-DAYBREAK/` is an unrelated Java emulator from a 2016 build: 221 of its 229
shared message names disagree on the id. Read it only to see how someone else serialised a message.
