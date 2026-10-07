---
paths:
  - "packages/*/src/**/*.ts"
---

# AS3 traces and inherited code

Inherited code carries a trace to its AS3 origin immediately above the declaration:

```ts
// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/<path>/<Class>.as::<member>()
```

Since 2026-10-07 the trace is **provenance, not a fidelity contract** (client architecture spec §10).

- **Keep the `AS3:` line when you move, rename or restructure a member.** It is the only pointer to
  the code that explains the behaviour. It always names the primary tree and a readable member name,
  never a `_SafeStr_N`/`_SafeCls_N` placeholder.
- **A member that now behaves differently keeps its trace.** Add `// DEVIATION: <what AS3 did, why
  this differs>` when the difference would surprise someone reading the AS3.
- **A half-done inherited member** keeps a compatible signature and `// TODO(AS3): <path>::<member>,
  <what remains>`.
- **New code takes no marker.** `// TS-only: <reason>` is only for a member added to a class that was
  ported from the AS3.

## A faithful line is not a faithful behaviour

When changing inherited code, read further than the line: the rest of the method, the callee it
assigns through, and whoever feeds the value. Four shapes account for every such bug found so far:

1. **Same line, different data.** `-offset.x` was right for a Flash library `<offset>`; the Nitro
   spritesheet path already stores `offsetX = -assetDef.x`. Check what feeds a value before copying
   arithmetic on it.
2. **The languages differ.** `for each` over `undefined` iterates nothing in AS3; `for...of` throws.
   `getString()` never returns null here, so an AS3 `!= null` presence test becomes `hasString()`.
   `x || 1` destroys a legitimate `0`. AS3 runs a subclass's field initialisers before `super()`.
3. **Half-ported contract.** `sprite.assetName = name` matched the AS3, which also set `.asset` on the
   next line. `WindowToolTipAgent` reads `inputEventQueue.mouseX`, but the port never enqueues, so it
   reads zero.
4. **AS3 bugs Flash masked.** `ContextInfoView` calls `show()` outside the branch that positions it.
   Keep the behaviour, note the discrepancy at the declaration, say which one you kept.
