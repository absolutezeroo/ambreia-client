# `<Module>` architecture

## Overview

What this module does, one paragraph. Which AS3 package it maps to (`sources/WIN63-202607011411-782849652/src/com/sulake/habbo/<module>/`, cross-referenced against `sources/win63_version/habbo/<module>/` for obfuscated names).

## AS3 class map

| AS3 class | Role | TS equivalent | Status |
|-----------|------|----------------|--------|
| `<Class>.as` | ... | `<Class>.ts` | ✅ / ⚠️ partial / ❌ |

## Key interactions

Sequence of how the main classes in this module cooperate (event flow, manager → handler → view, composer/parser round-trips if networked). Diagrams welcome (ASCII or Mermaid).

## Divergences & TODOs

Any deliberate TypeScript-side divergence from the AS3 (each marked `// DEVIATION:` at its declaration — see `.claude/rules/30-as3-traceability.md`), and any outstanding `TODO(AS3)` markers left in this module's code.
