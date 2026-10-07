---
paths:
  - "packages/vortex-client/vite.config.ts"
  - "packages/vortex-client/tools/vite-plugin-*.mjs"
---

# `pnpm dev` pre-bundles the engine

The client statically reaches ~3,970 of the engine's files at boot; served one request per module
that was 15 s cold and ~6 s per reload (the port has no `import.meta.hot`, so every change is a full
reload). `tools/vite-plugin-engine-bundle.mjs` hands the engine to esbuild in watch mode instead
(~185 requests, ~1.3 s cold, ~0.45 s reload). It is serve-only; `pnpm build` is untouched.

- **`@core`/`@habbo`/`@room`/`@iid` are deliberately absent from `resolve.alias` in dev.** `vite:alias`
  runs before user `enforce: 'pre'` plugins, so declaring them would rewrite the specifier to engine
  source before the plugin sees it, and the ~3,970 requests come back. They are restored for
  `command === 'build'`.
- **Only `pixi.js` and `eventemitter3` are external to the bundle** (the client imports them too and
  there must be one instance). `pako` is engine-only and not resolvable from the client package:
  externalising it gives "Failed to resolve import" and a blank page.
- The bundle is written to `packages/vortex-client/.vortex-dev/` (gitignored, ESLint-ignored, and a
  hook refuses edits there).
