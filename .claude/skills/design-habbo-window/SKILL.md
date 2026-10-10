---
name: design-habbo-window
description: Designs, authors and restyles Vortex window XML layouts (windows, dialogs, bubbles, panels, HUD, RPG screens in src/vortex-layouts/) in the Habbo look. Use when asked to design or build a window or UI screen, "make it look Habbo", reproduce a mockup or screenshot in the client's style, or write a new .xml window layout.
---

# Designing a Habbo window

A Habbo engineer does not draw a window. They derive it from one that already exists, then look at
the result. 788 shipped layouts are in `packages/vortex-client/src/assets/window-layouts/` — that
corpus is the style guide, and it is checked into this repo.

**Design output = a layout XML file + the PNG it renders to.** Both, every time. A layout that has
not been rendered is not a design, it is a guess: this system does not throw on a layout mistake, it
draws nothing or draws it wrong, so the render is the only thing that tells you which you wrote.

## The four steps

### 1. Situate — find the nearest shipped window

Name the family, then find the real files. Never start from a blank file.

```bash
cd packages/vortex-client/src/assets/window-layouts
grep -l 'scrollable_itemlist_vertical' *.xml          # which layouts build this thing?
for f in $(grep -l '<bubble' *.xml); do echo "$(wc -l < $f) $f"; done | sort -n
```

Render the closest match so you have a reference to compare against:

```bash
node .claude/skills/design-habbo-window/render.mjs --layout=chooser_view --out=shots/ref.png
```

Then **read that PNG**. This is the target.

### 2. Crib — read two or three of them whole

Read the actual files, top to bottom. `references/patterns.md` has five skeletons already cut from
shipped layouts (classic window, alert with variable-height content, tabbed window, bubble, control
row) — start from whichever is closest.

You are looking for the idiom, not the pixels: how the family nests its containers, whether it
places children absolutely or stacks them in an `itemlist_*`, which `style` range it lives in, what
its margins and gutters are.

### 3. Write — author the XML

Into `packages/vortex-client/src/vortex-layouts/` for a new Vortex window.
**Not `window-layouts/`** — that directory is gitignored and rewritten wholesale by
`build-window-assets.mjs`, so a file saved there is destroyed by the next asset build. Editing a
window that *does* come from the Flash dump is the one case where `window-layouts/` is right.

`references/layout-xml.md` is the grammar and the measured vocabulary: the
`<layout>/<window>/root/<children>` skeleton, `<var>` properties and their casts, `params` bits,
`style` ranges, the colour families, the text styles that exist, the standard metrics, and the five
mistakes that produce a blank window without logging anything.

### 4. Look — render it and compare

```bash
pnpm --filter vortex-glaze dev          # once, in the background
node .claude/skills/design-habbo-window/render.mjs packages/vortex-client/src/vortex-layouts/my_window.xml
```

Read the PNG next to the step-1 reference. Then keep going: the first render is nearly always
blank, clipped, or black-on-black, and each of those has a named cause in
`references/layout-xml.md` §10. Iterate until it reads as Habbo, and show the user the PNG.

**Do not judge a colour from the thumbnail.** A 200 px render read as "dark teal body, so the text
needs to be white"; sampling the pixels showed the body was `#e9e9e1` in both that window and the
shipped reference, identical — the white "fix" made legible text invisible and cost two iterations.
When a colour decision rests on the render, sample it:

```js
const d = ctx.getImageData(x, y, 1, 1).data;   // draw the PNG to a canvas first
```

Small, high-contrast art plus a scaled-down view is exactly the condition under which the eye
invents a tint. Pixels or nothing.

## What makes a design read as Habbo

| | |
|---|---|
| Frame | `style="3"`, `color="0x418db0"`, a `DropShadowFilter distance="4" alpha="0.349"`, `margin_top` 25–30 |
| Frame body | renders `#e9e9e1` — **light**. Title bar is `#377998`. |
| Body text | Volter 9 px, `embed_fonts="true"`, **dark** (`0x0`, or `0x666666` for a helper line) |
| White text | only on a dark sub-panel or a banner bitmap, never on the frame body — that is what the 144 white `text_color`s in `style="3"` layouts are sitting on |
| Content inset | leave ~10 px below the title bar; `chooser_view` starts its container at `y="13"` |
| Gutters | 1–10 px, and 5 or 10 far more than anything else |
| Varying content | nested `itemlist_vertical` with `spacing`, never hand-placed |
| Emphasis | Habbo yellow `0xfac200`, orange `0xff8133`, link blue `0x1077ac`, alert red `0xc30000` |

Pick one style range and stay in it: `3` for a classic Habbo window, `10x` for an Illumina one.

## When the reference is not a Habbo window

Translating a modern mockup or a free-form idea means mapping its parts onto the vocabulary above —
a card becomes a `<border>`, a section header becomes a `label` with `il_heading_2`, a toolbar
becomes an `itemlist_horizontal`. Do the mapping explicitly before writing XML, and keep step 1: even
with no visual reference, find the shipped window that does the closest *job* and follow its idiom.

## Quick reference

| Need | Where |
|---|---|
| Grammar, attributes, `<var>` types, `params`, `style`, colour, text styles, metrics | `references/layout-xml.md` |
| Copyable skeletons cut from shipped files | `references/patterns.md` |
| Blank / clipped / wrong-colour render | `references/layout-xml.md` §10 |
| Re-measure any claim in those files | the one-liners at the end of each |

Glaze itself (`pnpm --filter vortex-glaze dev`) is the visual editor for the same files — hierarchy,
property inspector, drag-resize, align, undo, Set Theme. Use it when nudging geometry by hand beats
another edit-and-render cycle; `render.mjs` drives the same instance.

## Composed previews — `compose.mjs`

`render.mjs` draws one layout as authored. A window whose tab content, rows and popups are
separate layouts is composed instead: `compose.mjs` registers every `vortex_character_*` layout
from disk, turns Glaze's Localise on, opens a root layout and runs a page-side fill script
(`place`, `add`, `text`, `show`, `tint`, `bar`, `icon` helpers) before the shot.

```bash
node .claude/skills/design-habbo-window/compose.mjs --root=vortex_character_xml --fill=.claude/skills/design-habbo-window/previews/character/fill_titles.js --out=mockup/glaze/character_titles.png
node .claude/skills/design-habbo-window/previews/character/gen_board.mjs   # writes states_character.xml next to it
node .claude/skills/design-habbo-window/compose.mjs --root=.claude/skills/design-habbo-window/previews/character/states_character.xml --fill=.claude/skills/design-habbo-window/previews/character/fill_board.js --out=mockup/glaze/states_character.png
```

`previews/character/` holds the fill scripts of the character window (four tabs, the states
board, the popups). Copy the folder for another window. Edit a layout, then re-run: Glaze
reloads the page on a layout change, so wait a few seconds first.
