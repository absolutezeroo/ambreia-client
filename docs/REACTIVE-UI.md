# A signals layer for the window system — design

**Status: unfinished experiment — it stopped at `vortex-glaze` and was never adopted by
the client.** This was a test to replace and modernize the old imperative, Flash-derived
view code; it was not carried through (confirmed by the user, 2026-08-19). Read the rest
of this document as a design that was *tried on the editor*, not as the client's UI
direction: no part of `vortex-client` or of the rest of `vortex-engine` drives its window
tree through it. §2 still governs who *may* adopt it — that permission was simply never
taken up.

**It is not dead code, though.** The layer's only consumers are seven files in
`packages/vortex-glaze/src/` (`state/EditorSignals.ts`, `main.ts`, and five
`ui/windows/Window*.ts`) — deleting it breaks the Glaze editor. Its `TS-only` markers are
valid: genuine port-free infrastructure with a real consumer. Equally, do not "finish the
migration" into the client unprompted.

**What was built**, on `feat/reactive-ui`: core (`core/reactive/`), window
adapter (`core/window/reactive/`), and glaze adoption: `WindowHierarchy` and
`WindowProperty` fully reconciled (`each`), `WindowBottomBar`,
`WindowToolbar` and `WindowHierarchyControls` bound where they vary.
`WindowGallery`, `WindowPalette` and `WindowColorPicker` deliberately stay
imperative: one-shot popups with a single writer have nothing to bind.
Measured on the glaze harness *and nowhere else* — hierarchy: collapse 2→0 / visibility
10→0 row builds; property editor: selection change 40→0 (row reuse), two-way
`WE_CHANGE` verified. Two findings worth keeping: a deferred bind lands after
construction completes, which *fixed* the zoom dropdown's empty caption (the
old imperative set fell into the TS super()-before-fields gap); and a setter
with side effects (button caption auto-size) needs its geometry reasserted in
the same effect — `WindowHierarchyControls` shows the pattern.

This is the design for a small, dependency-free reactive layer ("our own SolidJS") that drives
the existing `core/window` controllers declaratively: `signal` → `bind`/`each` → the same
`WindowController` tree, the same XML layouts, the same renderer. It is **additive**: no
controller changes, no new rendering path, no VDOM.

---

## 1. What it is, and what it is emphatically not

The window system is a retained-mode display list. Views today mutate it imperatively:
find a child by name, set a caption, tear a list down and rebuild it. The layer replaces the
*driving* of that tree, never the tree itself:

```
state (signals)  ──effect──▶  WindowController setters  ──invalidate──▶  WindowRenderer
```

Rejected alternative — `react-reconciler`: it would work (the host config maps onto
`addChild`/`removeChild`/`setChildIndex`), but React's model is re-render-then-diff, and a
retained tree wants the opposite: write the one property that changed. Fine-grained signals do
exactly that with ~250 lines and zero dependencies (`vortex-glaze`'s dependency list today is
`eventemitter3` + `pixi.js` + the workspace packages; it should stay that way).

JSX is out of scope for v1. If it is ever wanted, `solid-js/universal`'s `createRenderer`
needs six host functions (`createElement`, `insertNode`, `removeNode`, `setProperty`,
`getParentNode`, `getNextSibling`) and every one maps 1:1 onto the `IWindowContainer` API —
but ported layouts come from XML via `WindowParser.parseAndConstruct()`, and a JSX layer that
*constructs* trees would compete with the parser. Construction stays XML; the layer binds.

## 2. Who may use it — the fidelity boundary

This is the paragraph that decides everything else.

An earlier estimate counted 190 manual `addListItem`/`removeListItem*` calls and 130
`getChildByName` calls across 47 files under `habbo/` as the pain surface. Most of that code
is **ported from AS3**, and its imperative shape *is* the AS3 shape: a `refresh()` that clears
and rebuilds a list is the faithful port of an AS3 `refresh()` that does the same.
the former rule "Never simplify AS3 architecture" (removed 2026-10-07) and the project's
own history (every "plausible improvement" over the AS3 mechanism has eventually been
reverted) put that code out of bounds.

| May adopt the layer | Must not |
|---|---|
| `vortex-glaze` — the whole editor is TS-only | Any `habbo/` view whose body traces to AS3 members |
| `vortex-client` TS-only surfaces (debugger, changelog, login shell) | `core/window` controllers themselves |
| Future TS-only tooling and features | TS-only *glue inside* a ported class (keeps one idiom per file) |

So the honest pitch is not "modernise the ported views" — it is "stop hand-rolling tree
updates in the code that was never AS3 to begin with". Glaze is the flagship consumer: its
hierarchy panel, property rows and gallery all rebuild imperatively today, and none of it has
an AS3 counterpart to stay faithful to.

## 3. Module layout

```
vortex-engine/src/core/reactive/          # pure signal core — imports nothing from window/
    Signal.ts        signal(), computed()
    Effect.ts        effect(), onCleanup(), Scope
    Scheduler.ts     the flush queue and its attachment point
    batch.ts         batch(), untrack()
    index.ts

vortex-engine/src/core/window/reactive/   # window adapter — may import core/window types
    WindowScope.ts   scope tied to a window's lifetime
    bind.ts          bind(), on()
    each.ts          keyed list reconciler over ItemListController
    index.ts
```

Both directories are **entirely TS-only** (no AS3 counterpart exists). Per
`.claude/rules/30-as3-traceability.md`, every exported member carries a `// TS-only:` line
comment with the reason; the module-level reason is "reactive driving layer for TS-only
consumers; AS3 has no equivalent — views there are hand-wired". Precedent for TS-only
infrastructure living in the engine: `GlyphAtlas`, `NativeWheelDelta`, `WindowComposite`,
`BitmapHitTest`.

Living in the engine keeps it importable by client and glaze (both depend on the engine) and
adds no engine→client edge (rule #3).

## 4. The core — exact semantics

Kept deliberately small. No async, no resources, no stores, no context API.

```ts
const [count, setCount] = signal(0);                  // Object.is equality; setter skips no-ops
const label = computed(() => `${count()} items`);     // lazy, cached, recomputes on pull
const dispose = effect(() => { win.caption = label(); });  // queued, never synchronous
batch(() => { setA(1); setB(2); });                   // one flush for both
untrack(() => count());                               // read without subscribing
onCleanup(() => sub.remove());                        // runs before re-run and on dispose
```

- **Dependency tracking** is automatic: reading a signal inside an effect/computed subscribes
  it; each re-run re-collects from scratch (so conditional reads work).
- **Writes mark, never run.** A setter marks dependents dirty and enqueues affected effects
  on the scheduler. Nothing user-visible executes inside a setter — this is the load-bearing
  rule, see §5.
- **Computeds are pull-based**: marked dirty on write, recomputed only when read. Diamond
  dependencies therefore cost one recompute per flush, and effects always observe a
  consistent final state (no intermediate "glitch" values, because they run after all writes
  of the batch/frame, not interleaved with them).
- **Convergence**: if an effect writes signals, the queue re-flushes until stable, capped at
  100 iterations, then `error`-logs the effect chain (`Logger`, module path
  `core.reactive.Scheduler`) and stops — matching the "warn on the path the client does not
  handle" logging rule rather than hanging the frame.

## 5. The scheduler — the one architectural decision

**Effects never run synchronously.** They queue, and the queue flushes at one point in the
frame:

```
HabboWindowManager.update(deltaTime)               [AS3-traced, NOT modified]
 ├─ contexts update (top→bottom)                    ← input dispatched, handlers write signals
 ├─ events.emit(HABBO_WINDOW_TRACKING_EVENT_RENDER) ← ★ Scheduler flushes here
 ├─ contexts render (bottom→top)                    ← sees the post-flush tree
 └─ inputEventQueue.flush()
```

The tracking event already sits exactly between input and render in
`habbo/window/HabboWindowManager.ts::update()`. The scheduler *subscribes* to it:

```ts
Scheduler.attach(windowManager.events);   // called by whoever boots: GlazeBoot, client bootstrap
```

so **no AS3-traced file is edited** — the boundary is consumer-side wiring. Glaze drives
`windowManager.update()` from its own rAF ticker (`GlazeBoot`), so it inherits the boundary
for free.

Why synchronous effects are forbidden here, concretely:

1. **Disposal during dispatch.** Disposing a window mid-event breaks the processor's walk
   over the tree. Glaze already learned this and coalesces rebuilds to avoid disposing a
   widget inside the event that triggered it. A synchronous effect reintroduces the bug
   class wholesale; a frame-boundary flush makes it structurally impossible.
2. **Pooled events.** `WindowEvent`s are `allocate()`/`recycle()`d. An effect running inside
   a dispatch could observe — or worse, retain — an event object that is recycled the moment
   the dispatch returns. At the flush boundary no dispatch is live.
3. **One-frame guarantee.** Handler writes a signal → same frame's render shows the result.
   No tearing between two windows bound to the same state.

Secondary flush triggers, both already motivated by shipped behaviour:

- **`Scheduler.flushNow()`** — for tests, and for the background-tab path: packets are
  processed on WebSocket `onmessage` while a hidden tab's rAF is paused, so network-driven
  signal writes must be flushed at the end of that processing batch, not "next frame"
  (there is no next frame until the tab returns).
- **Re-entrancy guard**: `flushNow()` during a flush is a no-op (the running flush already
  drains the queue).

## 6. The window adapter

### Scope and lifetime

```ts
const scope = createWindowScope(rootWindow);
// every bind/on/each created inside is owned by the scope
scope.run(() => { ... });
// disposed automatically when rootWindow dispatches WE_DESTROYED, or manually:
scope.dispose();
```

`WindowController.dispose()` already dispatches `WE_DESTROY`/`WE_DESTROYED`
(`WindowController.ts`, dispose path) — the same hook `GestureAgentService` uses. A scope
subscribes once, and tears down all its effects, listeners and child scopes. Disposal order:
children first, then own cleanups (mirrors the `dispose()` conventions of the port).

### `bind` — property binding on the parsed tree

```ts
bind(win, 'caption', () => `${state.selected()?.name ?? ''}`);
bind(win, 'visible', () => state.tab() === 'items');
bind(region, 'color', () => state.warning() ? 0xffff4444 : 0xff74dbfa);
```

One effect per binding; equality-guarded (most controller setters also self-guard and call
`WindowContext.invalidate` themselves — the guard here just avoids requeuing). The tree is
still **built by `WindowParser` from XML**; `bind` attaches to what the parser produced. The
`getChildByName` lookup happens once, at scope setup, not per update.

### `on` — event subscription with automatic teardown

```ts
on(win, 'WME_CLICK', (event) => state.select(item.id));
```

Wraps `addEventListener`/`removeEventListener`; removal is registered on the owning scope.
**Contract: handlers must not retain the event object** — it is pooled and recycled after
dispatch. Copy the fields you need into signals. (Handlers run synchronously inside the
dispatch, as all listeners do today; it is *effects* that defer.)

### `each` — keyed list reconciliation over `ItemListController`

```ts
each(scope, itemList, () => state.offers(), {
    key: (offer) => offer.id,
    create: (offer) => buildOfferRow(context, offer),   // returns IWindow; may bind() inside
});
```

The reconciler runs as one effect and uses the controller's real API —
`numListItems`, `getListItemAt`, `getListItemIndex`, `addListItemAt`, `removeListItem`
(all on `core/window/components/ItemListController.ts`):

1. Read the new array; build `key → item` and detect duplicates (log `warn`, keep first).
2. **Remove** rows whose key vanished → `removeListItem(row)` + dispose the row's scope
   (which disposes the window).
3. **Create** rows for new keys via `create()`, each wrapped in a child scope.
4. **Order** by walking the target sequence and calling `addListItemAt` only where the
   current index disagrees — minimal moves, no rebuild.

Layout stays the controller's job (`auto_arrange_items`, spacing, scrollbars): the reconciler
manages membership and order, nothing else. This is the piece that replaces glaze's
"clear-and-rebuild the hierarchy panel on every change".

### `fromEvent` — bridging existing emitters into signals (v1.5, optional)

```ts
const selected = fromEvent(editorState, 'selectionChanged', () => editorState.selection);
```

Glaze's `EditorState` is emitter-based; this adapter lets panels bind to it without rewriting
it. Deferred until the pilot shows it is needed.

## 7. Rules explicitly preserved

- **Engine never imports client** — layer lives in the engine, imports nothing upward.
- **`get events()` never overridden** — the layer defines no Components at all.
- **XML is the constructor** for ported layouts; the layer never builds what the parser builds.
- **`dispose()` last, `_disposed`-guarded** on every class the layer adds.
- **Logging** per the table: `trace` for per-flush internals, `warn` for duplicate keys /
  convergence cap, nothing at `info` in steady state.
- **Traceability**: all-`TS-only` module; `scripts/check-as3-trace.mjs` reads the line above
  each declaration, so the `TS-only:` marker goes there (line comment, not block).

## 8. Pilot, and how it is judged

**Pilot: glaze's hierarchy panel (`WindowHierarchy`)** — TS-only, rebuilds imperatively
today, exercises `each` (rows), `bind` (names/visibility/selection highlight), `on` (row
clicks) and scope teardown (layout switch) in one component. Second candidate:
`WindowProperty` rows (exercises `WE_CHANGE` two-way flow).

Measured before/after, with the existing headless-glaze harness (probe + `interact.mjs`):

1. **Behaviour**: the 14-target click probe stays 14/14; screenshot hash unchanged after
   equivalent interactions.
2. **Work done**: count of window creations/disposals per interaction (instrument
   `numGraphicContexts` / a counter in `create()`) — expect rebuild-the-panel to become
   touch-two-rows.
3. **Code**: LOC and `getChildByName` count in the migrated files.
4. **The hazard**: a soak of rapid interactions (the shortcut fuzzer pattern) with the
   convergence logger armed — zero cap hits, zero mid-dispatch disposals.

If the pilot fails any of these, the layer stays in glaze or dies there; nothing else will
have taken a dependency on it.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Effect disposes a window that another queued effect touches | Effects check their scope's `disposed` flag before running; disposing a scope dequeues its effects |
| Handler retains a pooled `WindowEvent` | Documented contract on `on()`; copy fields, never the object |
| Hidden tab: writes never flush | `flushNow()` after network batch processing (same path that already re-renders on `visibilitychange`) |
| Infinite write loops | Convergence cap + logged effect chain |
| Two idioms in one file | Boundary rule in §2: ported files stay imperative, whole-file adoption only |
| Layer creep into ported views | The `TS-only` marker makes any `reactive/` import inside an AS3-traced view greppable; review gate |

## 10. Naming

Module path is the name: `@core/reactive` and `core/window/reactive`. No branding, no
package split until something outside this repo wants it.
