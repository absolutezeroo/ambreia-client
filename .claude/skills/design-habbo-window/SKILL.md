---
name: design-habbo-window
description: Designs, authors and restyles Vortex window XML layouts (windows, dialogs, HUD panels, RPG screens in packages/vortex-client/src/vortex-layouts/) in the Ambreia purple theme, from the owner's mock-up sheets. Use when asked to design or build a window or UI screen, reproduce a mockup sheet, theme a layout, or write a new .xml window layout; renders every result through Glaze.
---

# Designing an Ambreia window

Work like the interface designer the owner is paying for: measure the sheet, build from the kit,
render, then critique the render pixel by pixel before showing it. A layout that has not been
rendered is not a design, it is a guess: this system draws nothing or draws it wrong on a mistake,
it never throws.

**Design output = layout XML files + the PNGs they render to + a review page (artifact)**, every
time, for every state the sheet shows.

## The theme (decided 2026-10-13, see memory `ambreia-window-theme`)

Illumina purple. The frame body is **dark purple (#383153)**; panels are light.

| Piece | Style | Notes |
|---|---|---|
| Frame | `<frame style="103">` | white title through `ambreia_window_layout_frame_purple_xml` |
| Sunk list ground | `<border style="102">` | lists, bags, grids sit on it |
| Reading panel | `<border style="103">` | detail panes, settings boxes |
| Raised card / row / slot / small box | `<border style="104">` | rows take `dynamic_style="lifted_hover"`, icon buttons `dynamic_style="button"` |
| Button | `<button style="300">` purple, `<button style="301" color="0x…">` tinted | `height_min/max="28"`, width_min/max fixed; green 0x2f9e2f, red 0xd23a2a, blue 0x2a6aa0, disabled 0x9a9a9a |
| Tabs | Habbo `tab_button style="3"` | kept on purpose |
| HUD overlay panel | `<border style="9" color="0x4a4068">`, buttons `style="6" color="0x3a3254"` | white text |
| Banner / emblem | `static_bitmap asset_uri="rpg/parchement"` stretched, dark ink 0x3a2a10 on it | quest header, guild header |
| Selected row | first child `<border visible="false" style="104" name="selected" color="0xffd890"/>` | **first** child, or it hides the row |

Text colours: in a light panel ink `0x1f2a33`, secondary `0x666666`, panel title `0x5a4a7a`;
**drawn straight on the frame: white titles, `0xd8d0e8` text, `0xffd890` links** — dark blue,
black or grey on the frame is the mistake the owner flags most. Green `0x2b9a00`, red `0xc30000`,
amber `0xb07a10`, epic purple `0x8a3ad0`.

## The four steps

### 1. Measure the sheet

Read the mock-up sheet (`mockup/new/<system>/*.png`) and list every window, every state and every
micro-interaction it shows, numbered as on the sheet. Crop and sample with `tools/crop.mjs` and
`tools/sample.mjs` when a size or colour matters. Do not guess a size from the thumbnail.

### 2. Build from the kit

Reuse before writing: `vortex_ui_menu(_row)`, `vortex_ui_confirm`, `vortex_ui_badge`,
`vortex_hud_toast`, `vortex_hud_tip`, `vortex_inventory_item_slot`, `vortex_inventory_tip`,
`vortex_inventory_compare_row`, `vortex_inventory_split`, `vortex_character_stat_row`,
`vortex_market_pager`. Generators use `tools/ui_helpers.mjs` (frame, box, cont, list, txt, btn,
iconBtn, bmp, bar, portrait, selectedOverlay, hud, locales, icon table `I`); see
`previews/*/gen_*.mjs` for examples. One layout with hidden optional blocks in an `itemlist_vertical`
beats one layout per state (zone popup, NPC dialogue). An existing Habbo-styled layout moves to the
theme with `node tools/purple.mjs <layout>` then `node tools/light_on_frame.mjs <layout>`.

Texts: `${vortex.<system>.<key>}` in `src/locales/{fr,en}/<system>.json`, written with `locales()`.
A new locale file needs a Glaze restart (eager glob).

### 3. Render

```bash
pnpm --filter vortex-glaze dev                        # once; restart after a new locale file
node compose.mjs --reload --root=<layout|board.xml> --fill=previews/<sys>/fill_x.js --out=mockup/glaze/x.png
```

Fill scripts run page-side with `build/find/text/tcolor/show/tint/bar/icon/add/place/tab`; `add`
feeds lists and grids; `// @include file.js` pulls a sibling in. A states board is a generated frame
(`previews/<sys>/gen_board.mjs`) with named slots the fill script populates; keep a board under
~1300 px tall and never let two slots overlap.

### 4. Critique the render before showing it

Open the PNG and check, in this order (each is a mistake the owner has already sent back):

1. **Colour on the frame**: every title, label, link, count drawn on the purple must be light.
   `node tools/light_on_frame.mjs --check` lists offenders; without `--check` it fixes them.
   `tools/dark_in_panel.mjs` restores dark ink inside light panels after a blanket replace.
2. **Clipping**: a banner image must fit its slot in *every* tab (quest header 56, guild 60);
   a portrait box needs 4 px of air inside its row (`tools/grow_rows.mjs row:height:boxY`);
   a list's rows must not run under the panel's edge; a wrapped text's height holds its lines.
3. **Collisions**: a wide button never crosses a banner or a title; make it an icon button beside
   it. Tabs size to their captions, so nothing overlays them at a fixed x.
4. **Icons**: every icon button has an icon (`tools/more_icon.mjs` for the « ⋯ » buttons);
   a 16 px icon in a 32 px bitmap is centred with `pivot_point=center`, never by shifting x/y;
   the icon must exist in `assets/images/rpg/ui-icons` (check with `ls | grep`).
5. **Edges**: right-aligned counters keep 8 px from the card's edge; rows have the `selected`
   overlay as first child; grids get `spacing` 4; buttons line up on a common baseline.
6. **Words**: a caption that still reads `vortex.x.y` is a missing text or an un-restarted Glaze.

Then crop the parts you changed at 2× and look again. Fix, re-render, and only then build the
review page (`gen_page_<sys>.mjs` in the scratchpad: data-URI PNGs, dark/light tokens) and publish
it as an artifact; update an existing page in place with its URL.

## Reference

| Need | Where |
|---|---|
| Grammar, `<var>` types, `params`, style ranges, text styles, the five blank-render mistakes | `references/layout-xml.md` |
| Copyable skeletons cut from shipped files | `references/patterns.md` |
| Shipped Habbo layouts (the original idiom, 788 files) | `packages/vortex-client/src/assets/window-layouts/` |
| Tools | `tools/`: purple, light_on_frame, dark_in_panel, grow_rows, add_selected, more_icon, crop, sample, ui_helpers |
| Previews done | `previews/`: character, hud (+ zone/loot), quests, inventory, skills, death, npc, social |

Glaze itself (`pnpm --filter vortex-glaze dev`, :5174) is the visual editor for the same files;
`compose.mjs` drives that instance over CDP.
