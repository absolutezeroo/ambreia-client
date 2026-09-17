# vortex-skins

Vortex's own authored window skins. **Not a port** — nothing here comes from the AS3 dump, so no
file in this directory carries an `AS3:` trace.

This is the skin counterpart of `src/vortex-layouts/`, and exists for the same reason:
`src/assets/window-skins/` is gitignored and rewritten from the dump by
`tools/build-window-assets.mjs`, so a hand-authored file placed there is wiped on the next asset
build.

Loaded by `App.readVortexSkins()`, after the dump's skins, via `import.meta.glob`.

## Naming

**The file's basename is the skin id**, i.e. the string an element descriptor's `asset` field
points at (`HabboWindowManager.loadSkinAssets()`).

- `habbo_skin_frame.xml` → **merges into** the dump's `habbo_skin_frame`: a `<template>`,
  `<layout>` or `<state>` whose name the dump already uses replaces that one, anything else is
  added, and everything the file is silent about is kept. So a file carries only what it changes.
- a brand-new id renders nothing on its own: skins are reached only through the element
  description, never by name from a layout.

**Do not redefine `<variable key="asset">`.** The variables merge too, and that one is what the
dump's own templates resolve `asset="$asset"` through — overriding it repoints every template in
the skin at your image. Write the atlas name on the template instead.

## Binding a new skin id

Add `habbo_element_description_xml.xml` here, carrying only the `<window>` entries you are adding.
It merges on `(type, style)`, the pair `ElementDescriptorRegistry` looks a descriptor up by, so an
entry whose type/style the dump already declares replaces it and the other ~330 are untouched.

Check the style number is free before using it (`grep 'style="84"'` against the built
`src/assets/window-skins/habbo_element_description_xml.xml`) — a collision silently wins over the
dump's entry rather than erroring.

## Bitmaps

A skin's `<template>` resolves its bitmap out of the atlases decoded at boot, so it can only
reference an atlas already listed in `ATLAS_NAMES` (`src/App.ts`). A new spritesheet needs an entry
there *and* the PNG in the image bundle. `BitmapSkinParser.parseTemplateList()` looks it up with
`atlases.get()` and draws nothing when it misses, with no warning — so a standalone image that is
not in an atlas is not a bitmap this system can draw.

The name is normalised: `asset="vortex_icons_png"` and `asset="vortex_icons"` both resolve to the
`vortex_icons` entry in `ATLAS_NAMES` (`normalizeAssetName()` strips `_png`/`_xml`/…).

`vortex_icons.png` is the sheet for Vortex's own art; `tools/build-vortexcoin-icon.mjs` draws it
and documents its regions.
