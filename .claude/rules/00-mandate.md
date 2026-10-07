# Before you code

This repository is the client of the Habbo RPG fork. Since 2026-10-07 it follows
`docs/superpowers/specs/2026-10-07-client-architecture-design.md`: the engine is being split into
packages (`@vortex/common`, `net`, `avatar`, `iso`, `ui`, `kernel`, `protocol`, `game`), and the
code no longer has to stay faithful to the AS3. The AS3 remains the best explanation of *why*
inherited code behaves the way it does.

Before writing implementation code:

1. **Read the spec and the plan** of the milestone you are working on (`docs/superpowers/specs/`,
   `docs/superpowers/plans/`).
2. **Read the code you change, and its AS3 origin when it has one.** The `AS3:` trace above a
   declaration points to it (primary tree `sources/WIN63-202607011411-782849652/`). Read it to
   understand inherited behaviour before changing it, not to copy it line by line.
3. **Respect the layer walls** (spec §3). `eslint.config.mjs` enforces the ones that exist; a
   `no-restricted-imports` error means the design is wrong, not the rule.
4. **Check `docs/PATTERNS.md`** before adding a Composer, Parser, Event, Manager or window.
5. **Read `docs/CLIENT-SERVER-ARCHITECTURE.md`** before touching anything that sends or receives
   network messages. Message ids come from the emulator (`pnpm gen:headers`), never from the AS3.

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
