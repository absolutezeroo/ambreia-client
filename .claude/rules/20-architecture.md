# Architecture and critical rules

```
vortex-engine                                   vortex-client (depends on engine)
├── core/    Low-level, communication          ├── ui/          Flash UI classes (ported)
├── habbo/   Game logic                        ├── window/      Window system (from Flash)
├── room/    Room engine                       ├── display/     Display components (PixiJS)
└── iid/     DI symbols                        └── assets/      Window layouts/skins (XML, gitignored)
```

Data flow: `Engine emits event → Client display class listens and updates`

## Critical rules

1. **AS3 explains inherited behaviour** — before changing inherited code, read its AS3 origin (the `AS3:` trace). Fidelity is no longer required (spec `2026-10-07-client-architecture-design.md` §10); understanding still is
2. **Restructure on purpose, not by accident** — the package split (spec §3) is the plan. Outside it, do not flatten handlers/interfaces/delegation without writing the reason at the declaration
3. **Engine must NEVER import from client** — `vortex-engine` has zero UI knowledge
4. **Never override `get events()`** in Component subclasses — breaks the DI event system; use a different property name (e.g. `sessionEvents`)
5. **Use `createObjectInternal()`** not `createRoomObject()` from container (infinite recursion)
6. **Update `docs/IMPLEMENTATION_STATUS.md`** after every significant implementation
7. **Performance**: `Set`/`Map` for lookups, no allocations in render loops, cache textures, viewport culling (see `docs/STYLEGUIDE.md` Performance section and `docs/PATTERNS.md` section 0)
8. **No re-port of removed features** — the features listed in section 7 of the RPG spec
   (`vortex-rpg-emulator/docs/superpowers/specs/2026-10-05-habbo-rpg-design.md`) stay removed, except the
   fishing derby (M0 client plan, decision 1). Everything else inherited is kept and restructured, not re-ported.
9. **Managers**: DI Component with IID registration, one `I<Manager>` interface per manager (see `docs/PATTERNS.md` → Manager template)
10. **Layer walls** — the engines (`common`, `net`, `avatar`, `iso`, `ui`) never import `kernel`, `protocol` or `game`; `iso` may import `avatar`, never the reverse; features are folders of `game` and talk through declared interfaces or events (spec §3). Walls are enforced by `package.json` dependencies between packages and by `no-restricted-imports` in `eslint.config.mjs` (add new ones with `wall()`). That rule does not see dynamic `import()` or `typeof import()` types: those two forms are walled by review only, until the package split makes them unresolvable.
