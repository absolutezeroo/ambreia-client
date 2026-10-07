# Vortex Style Guide

This document defines all code conventions for the project. These rules are mandatory and without exception.

## Table of contents

1. [Formatting](#formatting)
2. [Naming](#naming)
3. [Imports and exports](#imports-and-exports)
4. [Classes and interfaces](#classes-and-interfaces)
5. [Methods](#methods)
6. [Properties](#properties)
7. [JSDoc](#jsdoc)
8. [File structure](#file-structure)
9. [Habbo-specific conventions](#habbo-specific-conventions)
10. [Logging](#logging)
11. [Performance](#performance)

---

## Formatting

### Braces: Allman (MANDATORY)

The opening brace is ALWAYS on its own line. No exceptions.

```typescript
// CORRECT
export class RoomSession
{
    constructor()
    {
        if(condition)
        {
            doSomething();
        }
        else
        {
            doSomethingElse();
        }
    }
}

// WRONG — K&R forbidden
export class RoomSession {
    constructor() {
        if(condition) {
```

### Indentation

- 4 spaces (no tabs)
- Content indented inside braces

### Spacing

```typescript
// No space before parentheses
if(condition)           // CORRECT
if (condition)          // WRONG

for(let i = 0; ...)    // CORRECT
for (let i = 0; ...)   // WRONG

myFunction()            // CORRECT
myFunction ()           // WRONG

// Space after commas
foo(a, b, c)            // CORRECT
foo(a,b,c)              // WRONG

// Spaces around operators
x = a + b               // CORRECT
x=a+b                   // WRONG
```

### Blank lines

- One blank line between methods
- One blank line between logical sections in a long method
- No multiple consecutive blank lines
- No blank line after the opening brace of a class or method

---

## Naming

| Element | Convention | Examples |
|---------|-----------|----------|
| Classes | PascalCase | `RoomSessionManager`, `AvatarRenderManager` |
| Interfaces | `I` + PascalCase | `IRoomSessionManager`, `IMessageParser` |
| Private fields | `_` + camelCase | `_roomId`, `_sessions`, `_disposed` |
| Protected fields | `_` + camelCase | `_connection`, `_listener` |
| Public fields | camelCase | `roomId`, `name` (rare, prefer getters) |
| Public methods | camelCase | `getSession()`, `createRoom()` |
| Private methods | camelCase | `processEvent()`, `parseData()` |
| Constants | UPPER_SNAKE_CASE | `MAX_ROOM_COUNT`, `DEFAULT_TIMEOUT` |
| Enums | PascalCase | `RoomType.Public`, `ObjectCategory.Floor` |
| Type parameters | Uppercase letter | `T`, `K`, `V` |
| Class files | PascalCase | `RoomSession.ts`, `IRoomSession.ts` |
| Utility files | camelCase | `colorUtils.ts`, `mathHelper.ts` |

### AS3 correspondence

Inherited classes keep their AS3 name, except when TypeScript convention requires a change:

```
AS3: RoomSessionManager      → TS: RoomSessionManager       (identical)
AS3: IRoomSessionManager     → TS: IRoomSessionManager       (identical)
AS3: _roomSessions           → TS: _roomSessions             (identical)
AS3: var k_MAX_ROOMS:int     → TS: MAX_ROOMS (const)         (TS convention)
AS3: function dispose():void → TS: dispose(): void           (identical)
```

---

## Imports and exports

### Import type

```typescript
// Use import type for type-only imports
import type { IRoomSession } from './IRoomSession';
import type { IMessageDataWrapper } from '@ambreia/net/messages/IMessageDataWrapper';

// Regular import for values (classes, functions, constants)
import { RoomSession } from './RoomSession';
import { Component } from '@ambreia/kernel/runtime/Component';
```

### Path aliases

Always prefer aliases over deep relative paths:

```typescript
// CORRECT — alias
import { Component } from '@ambreia/kernel/runtime/Component';
import type { IRoomEngine } from '@room/IRoomEngine';

// WRONG — deep relative path
import { Component } from '../../../../core/di/Component';
```

### Named exports only

```typescript
// CORRECT
export { RoomSessionManager };
export type { IRoomSessionManager };

// WRONG
export default RoomSessionManager;
```

### Import order

1. External types (`import type` from third-party packages)
2. External imports (third-party packages)
3. Internal types (`import type` from `@ambreia/…`, or relative inside a package)
4. Internal imports (from `@ambreia/…`, or relative inside a package)
5. Relative imports

---

## Classes and interfaces

### Class structure

```typescript
/**
 * Class description.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/module/ClassName.as
 */
export class ClassName extends ParentClass implements IClassName
{
    // 1. Static constants
    public static readonly MAX_COUNT: number = 100;

    // 2. Private/protected fields
    private _id: number;
    private _name: string;
    private _disposed: boolean = false;

    // 3. Constructor
    constructor(id: number, name: string)
    {
        super();

        this._id = id;
        this._name = name;
    }

    // 4. Getters/Setters
    get id(): number { return this._id; }
    get name(): string { return this._name; }

    set name(value: string)
    {
        this._name = value;
    }

    // 5. Public methods
    public doSomething(): void
    {
        // ...
    }

    // 6. Protected methods
    protected processInternal(): void
    {
        // ...
    }

    // 7. Private methods
    private handleEvent(): void
    {
        // ...
    }

    // 8. dispose() — ALWAYS last
    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        // Cleanup...
    }
}
```

### Interface

```typescript
/**
 * Interface for ClassName.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/module/IClassName.as
 */
export interface IClassName
{
    readonly id: number;
    readonly name: string;

    doSomething(): void;
    dispose(): void;
}
```

### Rules

- Every class has an `I*` interface in a separate file
- The interface lists only public members
- Interfaces use `readonly` for getters without a setter

---

## Methods

### Early returns at method start

```typescript
// Standard pattern for message handlers
private onRoomInfo(event: RoomInfoEvent): void
{
    if(!event) return;

    const parser = event.parser;

    if(!parser) return;

    // Processing...
}
```

### Null returns

```typescript
// Return null (not undefined) for optional values
public getSession(roomId: number): IRoomSession | null
{
    return this._sessions.get(roomId) ?? null;
}
```

### dispose()

```typescript
// ALWAYS the last method in the class
dispose(): void
{
    if(this._disposed) return;

    this._disposed = true;

    // 1. Remove listeners
    // 2. Clear collections
    // 3. Nullify references
    this._sessions.clear();
    this._connection = null;
}
```

---

## Properties

### Short getters (one line)

```typescript
get roomId(): number { return this._roomId; }
get name(): string { return this._name; }
get isDisposed(): boolean { return this._disposed; }
```

### Long getters (multi-line)

```typescript
get fullName(): string
{
    if(!this._firstName || !this._lastName) return '';

    return `${this._firstName} ${this._lastName}`;
}
```

### Setters

```typescript
set name(value: string)
{
    if(this._name === value) return;

    this._name = value;
}
```

---

## JSDoc

### Required on

- All classes
- All public methods
- All interfaces

### Format

```typescript
/**
 * Short description of the class/method.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/module/ClassName.as
 */
```

### Parameters and returns

```typescript
/**
 * Creates a new room session.
 *
 * @param roomId - The room identifier
 * @param password - The room password (empty string if none)
 * @returns The created session, or null if creation failed
 */
public createSession(roomId: number, password: string): IRoomSession | null
```

### AS3 reference

The `@see` tag MUST point to the corresponding AS3 source file:

```typescript
/**
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/RoomSessionManager.as
 */
```

---

## File structure

### One file = one class/interface

```
RoomSession.ts          → export class RoomSession
IRoomSession.ts         → export interface IRoomSession
RoomSessionManager.ts   → export class RoomSessionManager
IRoomSessionManager.ts  → export interface IRoomSessionManager
```

### Directory organization

Follow the AS3 structure:

```
source_as_win63/habbo/session/
├── RoomSessionManager.as
├── IRoomSessionManager.as
├── RoomSession.as
├── IRoomSession.as
└── handler/
    ├── RoomDataHandler.as
    └── RoomChatHandler.as

→ packages/ambreia-game/src/session/
  ├── RoomSessionManager.ts
  ├── IRoomSessionManager.ts
  ├── RoomSession.ts
  ├── IRoomSession.ts
  └── handler/
      ├── RoomDataHandler.ts
      └── RoomChatHandler.ts
```

### Barrel files (index.ts)

- Create one `index.ts` per module directory for exports
- Export public classes and interfaces
- Do NOT export internal/private classes

---

## Habbo-specific conventions

### Full AS3 port

The client was ported in full from the AS3 — both logic and display classes, the Flash UI system included, using PixiJS. Since 2026-10-07 inherited code is restructured rather than re-ported (`docs/superpowers/specs/2026-10-07-client-architecture-design.md` §10). Flash XML layouts still ship as XML, verbatim from the dump, and are parsed at runtime.

### AS3 → TypeScript mapping

| AS3 | TypeScript |
|-----|-----------|
| `int` | `number` |
| `uint` | `number` |
| `Number` | `number` |
| `String` | `string` |
| `Boolean` | `boolean` |
| `Array` | Precise type (`string[]`, `Map<K,V>`) |
| `Dictionary` | `Map<K, V>` |
| `Vector.<T>` | `T[]` |
| `Object` | Precise type or `Record<string, unknown>` |
| `null` | `null` (not `undefined`) |
| `Event` | `MessageEvent` or specific event |
| `EventDispatcher` | `EventEmitter` (EventEmitter3) |
| `BitmapData` | `OffscreenCanvas` / PixiJS `Texture` |
| `Sprite` / `MovieClip` | PixiJS `Container` / `Sprite` |
| `XML` | JSON (converted from original XML layouts) |

### Avoid `any`

```typescript
// WRONG
private _data: any;

// CORRECT — type precisely
private _data: Map<number, RoomData>;
private _data: Record<string, unknown>;  // If type is truly unknown
```

---

## Logging

`console` is banned by ESLint everywhere except `core/utils/Logger.ts`. Every file that logs declares
one module-level logger:

```typescript
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('habbo.room.RoomEngine');
```

### The name is a dotted module path (MANDATORY)

The namespace mirrors the file's path under `src/`, with the class as the leaf — `client.` and
`glaze.` prefix the two non-engine packages. This is enforced by `no-restricted-syntax`, and it is
not cosmetic: levels resolve by walking the path outwards, so `__log.set('habbo.room', 'debug')`
covers `RoomEngine`, `RoomContentLoader`, `TileObjectMap` and everything else under `habbo.room`.
Flat names also collided silently — `Moderation` was three different files, `Navigator` two.

Do not repeat the class name inside the message (`log.warn('[CatalogViewer] …')`) — the prefix
already carries it. A bracket that names a *method* or a sub-scope (`[GA]`, `[LoginStep]`) is fine,
and `log.child('preload')` is better.

### Choosing a level

| Level | For | Visible in dev | Visible in prod |
|-------|-----|----------------|-----------------|
| `trace` | Per frame, per packet, per room object, per grid item | no | no |
| `debug` | What a subsystem decided and why; component lifecycle | no | no |
| `info` | Milestones a developer wants unasked: connected, room entered, assets ready | **yes** | no |
| `warn` | The client met data or a code path it does not handle — unported branch, unknown enum, missing asset | **yes** | **yes** |
| `error` | Something failed and the user will notice | **yes** | **yes** |

Two recurring mistakes, both of which this codebase had at scale:

- **`info` for lifecycle.** `'Navigator initialized'` is `debug`. `info` is for things that are
  interesting when you are *not* working on that subsystem.
- **`debug` for a defect.** `'Unknown pricing model'`, `'not ported yet'`, `'Could not find
  element'` are `warn`. A silent format mismatch renders nothing and throws nothing — see
  `docs/IMPLEMENTATION_STATUS.md`; hiding it at `debug` is how it stays unnoticed for months.

### Cost

`log.debug` and friends are *properties* holding a pre-bound `console` method, so a disabled level
costs one property read and a no-op call — and DevTools attributes the line to your call site
instead of to `Logger.ts`. What is **not** free is the argument:

```typescript
// WRONG — the template literal, the map and the join all run at WARN too
log.trace(`libs: ${libs.map(l => l.libraryName).join(', ')}`);

// CORRECT
if(log.isEnabled(LogLevel.TRACE)) log.trace(`libs: ${libs.map(l => l.libraryName).join(', ')}`);
```

For a warning raised from a loop, use `log.once(key)` so it fires once per key:

```typescript
log.once(`missing-lib:${name}`).warn(`Avatar library not in the figure map: ${name}`);
```

### Changing levels at runtime

No rebuild, no code change. In the browser console:

```js
__log.list()                        // every logger and its resolved level
__log.set('habbo.room', 'trace')    // one subsystem
__log.only('habbo.catalog')         // silence everything else
__log.level('debug')                // the root level
__log.reset()                       // back to the build default
__log.spec()                        // copy into a ?log= URL to share a repro
```

The same spec works as a URL parameter (`?log=warn,habbo.room:trace,-core.window`) and persists in
the `vortex:log` localStorage key. Precedence: build default < localStorage < URL.

---

## Performance

These rules are mandatory for all code in critical paths (render loop, message parsing, mouse handling). The AS3 lifecycle system (dispose, flush/parse, object management) is fully preserved — these rules address JS-specific optimizations within that lifecycle.

### Collections: Set/Map for lookups (MANDATORY)

NEVER use `Array.includes()`, `Array.indexOf()`, or `Array.find()` for membership testing or key-based lookup. Use `Set` or `Map` which provide O(1) access.

```typescript
// WRONG — O(n) per call
private _ignoredUsers: number[] = [];

isIgnored(userId: number): boolean
{
    return this._ignoredUsers.includes(userId);
}

// CORRECT — O(1)
private _ignoredUsers: Set<number> = new Set();

isIgnored(userId: number): boolean
{
    return this._ignoredUsers.has(userId);
}
```

**Exception**: Arrays whose order matters AND that are never searched may remain as `Array`.

### Allocations in loops (FORBIDDEN)

NEVER create objects, arrays, or closures inside a render loop or high-frequency handler (tick, mouse move, animation frame).

```typescript
// WRONG — allocates a new array every frame
const sortSlice = this._sprites.slice(0, count);
sortSlice.sort((a, b) => b.z - a.z);

// CORRECT — sort in place, use a dirty flag
if(this._zOrderDirty)
{
    this._sprites.sort((a, b) => b.z - a.z);
    this._zOrderDirty = false;
}
```

### Reuse collections instead of replacing

Clear an existing collection instead of replacing the reference. This avoids creating garbage for the GC.

```typescript
// WRONG — creates a new array, the old one becomes garbage
this._objects = [];

// CORRECT — clears the existing array
this._objects.length = 0;

// WRONG — creates a new Map
this._cache = new Map();

// CORRECT — clears the existing Map
this._cache.clear();
```

### String concatenation in loops (FORBIDDEN)

```typescript
// WRONG — creates intermediate strings
let result = '';
for(const action of actions)
{
    result += action.type + action.param;
}

// CORRECT — collect then join
const parts: string[] = [];
for(const action of actions)
{
    parts.push(action.type, action.param);
}
const result = parts.join('');
```

### Array.concat() (FORBIDDEN in loops)

`concat()` creates a new array. Use `push()` to append in place.

```typescript
// WRONG — allocates a new array
this._items = this._items.concat(newItems);

// CORRECT — appends in place
this._items.push(...newItems);
```

### Textures and Canvas: cache and reuse

- NEVER create an `OffscreenCanvas`, `HTMLCanvasElement`, or `Texture.from()` every frame
- Cache textures by content key (direction, action, animation frame)
- Resize an existing canvas instead of creating a new one
- Implement an eviction policy (LRU) for texture caches

```typescript
// WRONG — new canvas and new texture on every call
const offscreen = new OffscreenCanvas(w, h);
// ... draw ...
return Texture.from({ resource: offscreen });

// CORRECT — check cache first
const cacheKey = `${direction}_${action}_${frame}`;
const cached = this._textureCache.get(cacheKey);
if(cached) return cached;
// ... draw and store in cache ...
```

### Culling: do not process invisible objects

Any object outside the viewport must NOT execute its visualization or animation logic.

```typescript
// WRONG — process all objects every frame
for(const [id, entry] of this._visualizations)
{
    this.renderObject(entry.visualization, ...);
}

// CORRECT — check visibility first
for(const [id, entry] of this._visualizations)
{
    if(!this.isInViewport(entry.bounds)) continue;

    this.renderObject(entry.visualization, ...);
}
```

### Color transforms: use the GPU

NEVER use `getImageData`/`putImageData` with a per-pixel loop for color transforms. Use PixiJS filters or `globalCompositeOperation`.

```typescript
// WRONG — GPU→CPU readback, loop, CPU→GPU re-upload
const imageData = ctx.getImageData(0, 0, w, h);
for(let i = 0; i < imageData.data.length; i += 4)
{
    imageData.data[i] = Math.round(imageData.data[i] * rMul);
    // ...
}
ctx.putImageData(imageData, 0, 0);

// CORRECT — GPU color transform via compositing
ctx.globalCompositeOperation = 'multiply';
ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
ctx.fillRect(0, 0, w, h);
ctx.globalCompositeOperation = 'source-over';
```

### Listeners: always clean up

Every `addEventListener` or `emitter.on()` MUST have a matching `removeEventListener` / `emitter.off()` in `dispose()`. An orphaned listener prevents the GC from collecting the object.