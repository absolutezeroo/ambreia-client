---
paths:
  - "**/window/**"
  - "**/widgets/**"
  - "packages/ambreia-ui/**"
---

# UI / window system rules

You are editing the ported Flash UI/window system: `@ambreia/ui` (`packages/ambreia-ui/src`, its generic kit in `src/kit/`), the game windows in the engine's `habbo/window/` and `habbo/*/widgets/`, and the client's `window/`.

1. See `docs/PATTERNS.md` → "UI Window (ported from Flash)" and "Component Lifecycle" for the expected class shape. Quick shape reminder: UI Windows are ported from the AS3 `IWindow`/`IFrameWindow` hierarchy using PixiJS + the XML layouts described in rule 3.
2. Never override `get events()` in a Component subclass — it breaks the DI event system. Use a differently named property (e.g. `sessionEvents`).
3. Flash XML layouts and skins ship **as XML**, verbatim from the AS3 asset library (`vortex-client/src/assets/window-layouts`, `window-skins`), and are parsed at runtime by `WindowXmlAssetParser` — do not reintroduce a JSON compile step. `tools/build-window-assets.mjs` is the only tool that writes those two directories; it names every file after the `*Com.as` field that declares it, which is the exact string AS3 passes to `assets.getAssetByName()`. Never name an asset after the XML's own `<layout name="...">`: that is a Flash-authoring label AS3 never reads.
4. Flash UI windows/dialogs (`IWindow`, `IFrameWindow`, etc.) are ported as TypeScript classes using PixiJS; Flash display components (buttons, text fields, scrollbars, etc.) are ported as PixiJS display objects. Preserve the original AS3 class hierarchy for UI — do not collapse it into a simplified component model.
5. **A layout declares its own images. Filling one from code is the exception, not the default.** A `<static_bitmap>` names its image with `<var key="asset_uri" value="fishingUI_bg" type="String"/>` in its `<variables>` block — 293 shipped layouts do this. `WindowParser` reads the key and hands it to `StaticBitmapWrapperController.assetUri`, which resolves it through the `ResourceManager`; every image in the bundle is registered under its bare filename (no `.png`), so a bare name works. `properties` round-trips the key, so the image survives an edit-and-save in **vortex-glaze** — which is the point: a layout built out of code-filled `<bitmap>` nodes shows as empty slots there and cannot be laid out. Reach for a plain `<bitmap>` only when the pixels are *computed* (a per-frame composite); two-state art is a second `static_bitmap` underneath toggled by `visible`, the idiom `Achievement.xml` uses. Note the mechanism is on `static_bitmap` only — `<bitmap>` has no image attribute, and `BitmapWrapperController.bitmapAssetName` is written by code and read by nothing.
6. **Text alignment is `auto_size`, and it is a string.** `<var key="auto_size" value="center" type="String"/>` — the values are `left` / `center` / `right` / `none`, not a boolean, and 492 shipped layouts use `center`. `TextSkinRenderer` shifts the line by `(maxWidth - textWidth) / 2`. There is no `align` attribute, which is what makes this easy to miss: do not hand-place a label's x to fake centring, because the glyph width changes with the font and with the text.
