# Copilot Instructions — Vortex

> The section between the `BEGIN:GENERATED-RULES` / `END:GENERATED-RULES` markers below is generated from `.claude/rules/*.md` by `scripts/sync-agent-docs.mjs`. Do not hand-edit that section — edit the source file under `.claude/rules/` and run `pnpm run sync:agents`.

Full TypeScript/PixiJS v8 port of the Habbo Hotel Flash client. Monorepo: `vortex-engine` (engine) + `vortex-client` (display, UI). The entire Flash client is ported — both logic and display, and the original Flash window layouts/skins ship as XML, verbatim from the dump. There is no ENGINE/VIEW split and no separate UI framework: AS3 display classes are ported to PixiJS, not replaced.

<!-- BEGIN:GENERATED-RULES -->
## Mandatory: read before coding

Before writing any implementation code, you MUST complete these steps IN ORDER:

1. **Read the AS3 source file** — Find and read the corresponding AS3 file IN ITS ENTIRETY
   - Primary: `sources/WIN63-202607011411-782849652/src/com/sulake/<module>/<Class>.as`
   - Secondary: `sources/win63_version/<module>/<Class>.as`
   - Tertiary: `sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/<module>/<Class>.as`
   - **Never invent a name for an obfuscated identifier.** `win63_version` will not recover it — that tree is obfuscated too, with a different scheme. Only PRODUCTION is unobfuscated, and only for classes that existed in 2016. See CLAUDE.md → "AS3 sources" for how to identify a class, and what to do when a name exists in no tree (say so at the declaration; never pass a derived name off as recovered).
2. **Read the AS3 interface** — `I<Class>.as` + `handler/` directory if present
3. **Check `docs/PATTERNS.md`** if implementing a Composer, Parser, Event, Manager, or UI Window
4. **Check `docs/IMPLEMENTATION_STATUS.md`** for the current module status
5. **Read `docs/CLIENT-SERVER-ARCHITECTURE.md`** if touching anything in `habbo/communication/` (composers, parsers, message events/IDs) or any feature that sends/receives network messages — it documents how this client is expected to talk to a real Arcturus-Community-style server: the wire protocol, handshake/encryption sequence, message ID conventions, full per-system request/response flows (room, chat, catalog, inventory, trading, etc.), and a list of **known real-server bugs and protocol mismatches**. Some AS3 behavior that looks wrong may actually be a deliberate workaround for a documented server-side bug — check this doc before "fixing" wire-format code in `habbo/communication/`.

If you haven't read the AS3 source, your implementation is invalid. No exceptions.

## Before you delete or replace existing TypeScript

The steps above are about the AS3 side. Most of the damage comes from the other one.

**Read the body of every call you remove, replace, or stop making.** Not its name — its
body. This port's method names are inherited from AS3, and the TS behind them is frequently
narrower, wider, or simply different. A name tells you what someone meant; only the body
tells you what the next line depends on.

This is not hypothetical. `createMainWindow()` ended with `hideMainWindow()`, which does not
hide anything — it detaches the window from its parent, and `showMainWindow()` refuses to
attach a window that already has one. Replacing that call with the `visible = false` the AS3
actually specifies stopped the catalog opening at all. The name lied; the body did not.

Two corollaries, both learned the same way:

- **"This change is inert" is a claim, not an observation.** Verify it or don't write it.
  Threading `catalogType` into `useNonTabbedCatalog()` was described as inert for
  BUILDERS_CLUB. It was the opposite: both navigators shared one window, so the per-type
  answer let BUILDERS_CLUB hide NORMAL's tabs permanently.
- **A faithful change to one member can break because a *different* member is unfaithful.**
  Both examples above were correct AS3 applied on top of a still-flattened structure. When a
  faithful change misbehaves, suspect the structure under it before reverting the change.

## Before you act on a finding from an audit or an agent

Verify it against the source yourself. Findings are claims, and a confident, well-cited claim
is still a claim. In the 2026-07-17 parity audit, 3 of 26 criticals did not survive contact
with the code, and one of them would have broken the client had it been acted on; separately,
several findings were already fixed by the time they were read. Re-checking costs minutes.
See `docs/IMPLEMENTATION_STATUS.md` → "Cross-module parity audit" for what the failures
looked like and why they were convincing.

## Conventions

| Rule            | Convention                                       |
|-----------------|--------------------------------------------------|
| Braces          | **Allman** (opening brace on its own line)       |
| Classes         | PascalCase                                       |
| Interfaces      | `I` + PascalCase (`IRoomSession`)                |
| Private fields  | `_` + camelCase (`_roomId`)                      |
| Constants       | UPPER_SNAKE_CASE                                 |
| Methods         | camelCase                                        |
| Imports         | `import type` for type-only imports              |
| Exports         | Named only (never `export default`)              |
| `dispose()`     | Always last method, checks `_disposed`           |
| Null safety     | `| null` (never `| undefined`)                   |
| Spacing         | `if(condition)` not `if (condition)`             |
| Logger          | `Logger.getLogger('habbo.room.RoomEngine')` — dotted module path, never `console.log` |

Full reference: `docs/STYLEGUIDE.md`

## Logging

The level decides whether anyone ever reads it — `docs/STYLEGUIDE.md` → Logging has the table.
Short version: `trace` for anything per-frame/per-packet/per-item, `debug` for a subsystem's own
commentary (including "X initialized"), `info` only for milestones worth seeing while working on
something *else*, `warn` for data or a code path the client does not handle (unknown enum, unported
branch, missing asset — these render nothing and throw nothing, so `debug` buries them), `error`
when the user will notice. Dev shows `info` and up; production `warn` and up.

## Path aliases

**Engine** (`vortex-engine`): `@core/` → `src/core/` | `@habbo/` → `src/habbo/` | `@room/` → `src/room/` | `@iid/` → `src/iid/`

**Client** (`vortex-client`): `@core/` `@habbo/` `@room/` `@iid/` → engine src | `@ui/` `@/` → `src/`

## Architecture and critical rules

```
vortex-engine                                   vortex-client (depends on engine)
├── core/    Low-level, communication          ├── ui/          Flash UI classes (ported)
├── habbo/   Game logic                        ├── window/      Window system (from Flash)
├── room/    Room engine                       ├── display/     Display components (PixiJS)
└── iid/     DI symbols                        └── assets/      Window layouts/skins (XML, gitignored)
```

Data flow: `Engine emits event → Client display class listens and updates`

## Critical rules

1. **AS3 is the source of truth** — Never invent code. Read `sources/WIN63-202607011411-782849652/` first, cross-referencing `sources/win63_version/` when identifiers there are obfuscated
2. **Never simplify AS3 architecture** — If AS3 has handlers/interfaces/delegation, implement them exactly
3. **Engine must NEVER import from client** — `vortex-engine` has zero UI knowledge
4. **Never override `get events()`** in Component subclasses — breaks the DI event system; use a different property name (e.g. `sessionEvents`)
5. **Use `createObjectInternal()`** not `createRoomObject()` from container (infinite recursion)
6. **Update `docs/IMPLEMENTATION_STATUS.md`** after every significant implementation
7. **Performance**: `Set`/`Map` for lookups, no allocations in render loops, cache textures, viewport culling (see `docs/STYLEGUIDE.md` Performance section and `docs/PATTERNS.md` section 0)
8. **Full port**: ALL AS3 files are ported — both logic AND display. Flash XML layouts/skins ship as XML, verbatim. No ENGINE/VIEW distinction
   **Exception du fork RPG :** ce dépôt est le client du RPG Habbo
   (spec : `vortex-rpg-emulator/docs/superpowers/specs/2026-10-05-habbo-rpg-design.md`).
   Les features listées en section 7 de la spec (« Retiré ») sont supprimées volontairement et ne
   doivent pas être re-portées. Tout le reste suit toujours la règle du port complet.
9. **Managers**: DI Component with IID registration, one `I<Manager>` interface per manager (see `docs/PATTERNS.md` → Manager template)

## AS3 traceability

Every TypeScript class, method, accessor, property, interface member, handler, parser, composer, or event ported from AS3 MUST include an `AS3:` source trace comment immediately above the declaration.

Required format:

```ts
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/<path>/<Class>.as::<memberName>()
```

For AS3 accessors and properties:

```ts
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/<path>/<Class>.as::get propertyName()
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/<path>/<Class>.as::propertyName
```

Always trace to the primary (`WIN63-202607011411-782849652`) path even if the member's identifier had to be recovered by cross-referencing `sources/win63_version/<path>/<Class>.as` — the trace comment must still use a real, human-readable member name, never an obfuscated `_SafeStr_N`/`_SafeCls_N` placeholder.

If the primary source does not contain the member, fall back to `sources/win63_version/...`, then `sources/PRODUCTION-201601012205-226667486/...`, and point the trace at whichever tree actually has it.

Members with **no AS3 counterpart at all** — a port-specific event bus, a convenience accessor kept for ported callers — take `// TS-only:` instead, with a short reason:

```ts
// TS-only: no AS3 counterpart; kept for the ported consumers of `IHabboFriendList`.
getFriendByName(name: string): IFriend | null
```

This rule covers members *ported from* AS3, and `scripts/check-as3-trace.mjs` cannot tell those apart from ones that were never in the source, so it asked for a trace that could not honestly be written. The marker makes the exemption explicit and greppable rather than silent. It is not a way to quiet the check: if the member exists in any tree, it needs the real trace. Confirm it does not before reaching for `TS-only` — several friend-list methods read like AS3 (`acceptFriend`, `removeFriend`) where the source has `acceptFriendRequest`/`declineAllFriendRequests` and no such member.

## Deliberate deviations take `// DEVIATION:`, and keep their `AS3:` line

A member that the port implements **differently on purpose** — a modernisation, not a gap — takes a
`// DEVIATION:` line *in addition to* the `AS3:` trace of the member it deviates from:

```ts
// DEVIATION: AS3 polls this per frame through IUpdateReceiver; the port pushes instead, so the
//   widget only recomputes when the friend list actually changes.
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/friendbar/HabboFriendBar.as::update()
```

The `AS3:` line is mandatory and `scripts/check-as3-trace.mjs` enforces it — a `DEVIATION:` marker
on its own is reported exactly like a missing trace. That pairing is the entire point:
`audit-as3-traces.mjs` and `as3-member-coverage.mjs` both work off `AS3:` citations and neither
knows deviations exist, so keeping the citation is what stops "deliberately replaced" from reading
as "never ported" in the coverage numbers once a modernisation pass starts.

Pick the marker by what the AS3 side says, not by how new the code feels:

| Situation                                             | Marker                       |
|-------------------------------------------------------|------------------------------|
| Ported faithfully                                     | `AS3:`                       |
| Ported partially, rest still owed                     | `TODO(AS3)`                  |
| No AS3 counterpart in any tree                        | `TS-only:`                   |
| AS3 counterpart exists, port does something else      | `DEVIATION:` **+** `AS3:`    |

`DEVIATION:` is not a quieter `TODO(AS3)`. A gap you intend to close is a TODO; a deviation is a
decision you have already made, and the comment must say what the AS3 did and why the port does
not. If you cannot write that sentence, it is a TODO.

### A deviation must cite a check, not an impression

The failure mode is writing `DEVIATION:` because implementing the member looked awkward, and
then never revisiting it — the marker reads as settled and nobody asks again. A 2026-09-03 audit
of all 58 deviations in the port found **six that were nothing of the sort**, each closed in
minutes once someone actually looked:

- `Component.requiredDependencyIids` — "would need re-architecting". The names were already in
  `_pendingDependencies`; the getter is four lines.
- `Component.toXMLString()` / `ComponentContext.toXMLString()` — "reads internals this port does
  not have". Both read `_interfaces`, which holds exactly the iid/refs pairs AS3 dumps.
- `AvatarStructure.renderManager` — "would require changing the constructor signature". It is a
  constructor parameter and a getter; the one caller passes `this`.
- `RoomEngine`'s thumbnail ids — "the port counts up instead and never runs out, so the give-up
  branch has no counterpart". `NumberBank` is fifty readable lines, and its absence meant ids
  were never recycled and the exhaustion guard could never fire.
- `IRoomEngineServices.getActiveRoomActiveCanvas()` — "the port has no caller for it". Three
  call sites were spelling the same lookup out inline, each with its own apologetic comment.

So: before writing `DEVIATION:`, open the AS3 member and count its lines. If the answer is "this
is fifty lines of readable code and the port has the pieces", it is not a deviation, it is
unfinished work. The comment must name the specific thing that makes the port's shape different —
a Flash type with no counterpart, a field AS3 never increments, an architecture the port
deliberately replaced — and that claim must be one a reader can check. "There is no caller" is
not such a claim; callers arrive. "`_SafeCls_1711` has no entry in the registry, which maps 581
composers" is.

Incomplete members still require a compatible TypeScript signature and a `TODO(AS3)` comment with source path, class/member name, and exact remaining behavior. Never silently omit an AS3 member because it is currently unused; incomplete behavior must be visible as a TODO/stub, not missing from the interface.

## A faithful line is not a faithful port

AS3 is the source of truth. That is not in question, and none of what follows is licence to
deviate — every time this port *departed* from the AS3 it got worse (`AvatarInfoWidget.positionView()`
reimplemented what `RWGOI_MESSAGE_GET_OBJECT_LOCATION` already answered and stranded the bubble at
(0,0); `OwnAvatarMenuView` walked its grid with `numChildren` instead of the grid's own iterator and
made every panel unclickable). The point is narrower and harder: **transcribing the instruction is
not the same as reproducing the behaviour**, and when a literal port misbehaves the fault is in the
port, not in the AS3.

Four shapes account for every such failure found so far. Recognise them before writing the line.

**1. The line is identical; the data it reads is not.** `-offset.x` was right when `offset` came
from a Flash library `<offset>`. Here `GraphicAssetCollection.createFromSpritesheet` already stores
`offsetX = -assetDef.x` off the Nitro bundle. Same instruction, opposite result — the AS3 did not
change, the data's convention did. Check what feeds the value before copying the arithmetic on it.

**2. The language does not tolerate the same thing.** `_frames[index % length]` with a negative
index yields `undefined` in both languages. AS3's `for each` over `undefined` iterates nothing and
the body simply has no data; TypeScript's `for...of` throws — in the render loop, every frame. Also
in this family: `getString()` never returns null in the port, so an AS3 `!= null` key-presence test
becomes permanently true and must be ported as `hasString()`; `x || 1` destroys a legitimate `0`
where AS3 defaults on attribute *absence*; and AS3 runs a derived class's field initialisers before
`super()` where TypeScript runs them after.

**3. The line is faithful but rests on a half-ported contract.** The worst of the four, because
nothing is visibly wrong. `sprite.assetName = name` is exactly what the AS3 does — and the AS3 also
assigns `.asset` on the next line, which the port had dropped. Copying one instruction of two looks
like fidelity. Likewise `WindowToolTipAgent` reads `inputEventQueue.mouseX` exactly as the AS3 does,
but the port dispatches events straight to windows instead of through the queue, so `enqueue()` is
never called and that field has read zero since it was written. A perfect line reading a field
nobody fills. **Read the whole AS3 method, and check that what it depends on is ported too.**

**4. The AS3 has bugs Flash happened to mask.** `ContextInfoView` calls `show()` *outside* the
branch that sets the position; Flash's ordering meant it never surfaced, and here it does. `userData.roomObjectId`
of 0 is passed by the AS3 too, but its engine resolved nothing for object 0 where ours resolves it
happily and returns a valid rectangle at the room origin. Port the behaviour, note the discrepancy
at the declaration, and say which one you kept.

The recipe that catches all four is the same: **read further than the line you are porting** — the
rest of the method, the callee it assigns through, and whoever is supposed to be feeding it.

## Communication rules (`core/communication/`, `habbo/communication/`)

You are editing wire-protocol code (`core/communication/`, `habbo/communication/`).

1. Read `docs/CLIENT-SERVER-ARCHITECTURE.md` in full for the system you are touching (handshake/encryption, or the specific composer/parser's request-response flow) before changing anything here.
2. Check that document's "known real-server bugs and protocol mismatches" list first. AS3 code that looks wrong (odd byte order, a seemingly redundant field, a workaround-looking branch) may be a deliberate compensation for a real Arcturus-Community server bug — verify before "fixing" it.
3. `Parser.parse()` read order and `Composer.getMessageArray()` field order MUST match the AS3 exactly; reordering silently breaks the wire format.
4. See `docs/PATTERNS.md` → MessageComposer / MessageParser / MessageEvent templates before adding a new message type. Quick shape reminder:
   - **Composer**: `extends MessageComposer<TupleType>` with `_data` and `getMessageArray()`
   - **Parser**: `implements IMessageParser` with `flush()` + `parse(wrapper)`
   - **Event**: `extends MessageEvent implements IMessageEvent` with `callback` parameter in constructor

## Window/UI rules (`core/window/`, `habbo/window/`, `**/widgets/**`)

You are editing the ported Flash UI/window system (`core/window/`, `habbo/window/`, `habbo/*/widgets/`, client `window/`).

1. See `docs/PATTERNS.md` → "UI Window (ported from Flash)" and "Component Lifecycle" for the expected class shape. Quick shape reminder: UI Windows are ported from the AS3 `IWindow`/`IFrameWindow` hierarchy using PixiJS + the XML layouts described in rule 3.
2. Never override `get events()` in a Component subclass — it breaks the DI event system. Use a differently named property (e.g. `sessionEvents`).
3. Flash XML layouts and skins ship **as XML**, verbatim from the AS3 asset library (`vortex-client/src/assets/window-layouts`, `window-skins`), and are parsed at runtime by `WindowXmlAssetParser` — do not reintroduce a JSON compile step. `tools/build-window-assets.mjs` is the only tool that writes those two directories; it names every file after the `*Com.as` field that declares it, which is the exact string AS3 passes to `assets.getAssetByName()`. Never name an asset after the XML's own `<layout name="...">`: that is a Flash-authoring label AS3 never reads.
4. Flash UI windows/dialogs (`IWindow`, `IFrameWindow`, etc.) are ported as TypeScript classes using PixiJS; Flash display components (buttons, text fields, scrollbars, etc.) are ported as PixiJS display objects. Preserve the original AS3 class hierarchy for UI — do not collapse it into a simplified component model.
5. **A layout declares its own images. Filling one from code is the exception, not the default.** A `<static_bitmap>` names its image with `<var key="asset_uri" value="fishingUI_bg" type="String"/>` in its `<variables>` block — 293 shipped layouts do this. `WindowParser` reads the key and hands it to `StaticBitmapWrapperController.assetUri`, which resolves it through the `ResourceManager`; every image in the bundle is registered under its bare filename (no `.png`), so a bare name works. `properties` round-trips the key, so the image survives an edit-and-save in **vortex-glaze** — which is the point: a layout built out of code-filled `<bitmap>` nodes shows as empty slots there and cannot be laid out. Reach for a plain `<bitmap>` only when the pixels are *computed* (a per-frame composite); two-state art is a second `static_bitmap` underneath toggled by `visible`, the idiom `Achievement.xml` uses. Note the mechanism is on `static_bitmap` only — `<bitmap>` has no image attribute, and `BitmapWrapperController.bitmapAssetName` is written by code and read by nothing.
6. **Text alignment is `auto_size`, and it is a string.** `<var key="auto_size" value="center" type="String"/>` — the values are `left` / `center` / `right` / `none`, not a boolean, and 492 shipped layouts use `center`. `TextSkinRenderer` shifts the line by `(maxWidth - textWidth) / 2`. There is no `align` attribute, which is what makes this easy to miss: do not hand-place a label's x to fake centring, because the glyph width changes with the font and with the text.

## Room engine rules (`room/`, `habbo/room/`)

`room/` (generic engine primitives: `data`, `events`, `object`, `renderer`, `utils`) and `habbo/room/` (Habbo-specific room game logic) are different layers — do not confuse them.

1. Use `createObjectInternal()`, never `createRoomObject()`, when creating room objects from a container (the latter recurses infinitely).
2. `renderer/` is a render-loop hot path: no allocations per frame, cache textures by content key, cull objects outside the viewport. See `docs/STYLEGUIDE.md` → Performance.
3. See `docs/PATTERNS.md` for Manager/Handler patterns before adding new room object types.
<!-- END:GENERATED-RULES -->

## Concrete templates

See `docs/PATTERNS.md` for full, runnable Composer/Parser/Event/Manager/UI Window code templates.
