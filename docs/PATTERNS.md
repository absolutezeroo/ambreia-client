# Vortex Implementation Patterns

Detailed templates for each class type. Always use these patterns as a base during implementation.

## Table of contents

### Class patterns
1. [MessageComposer](#messagecomposer)
2. [MessageParser](#messageparser)
3. [MessageEvent](#messageevent)
4. [Manager (Component DI)](#manager-component-di)
5. [Handler (BaseHandler)](#handler-basehandler)
6. [Data class](#data-class)
7. [Interface](#interface)
8. [Message registration](#message-registration)
9. [UI Window (ported from Flash)](#ui-window-ported-from-flash)

### Architecture patterns
10. [Component Lifecycle](#component-lifecycle)
11. [IID / Dependency Registration](#iid--dependency-registration)
12. [Immutability-via-Interface](#immutability-via-interface)
13. [Singleton](#singleton)

### Code conventions
14. [Disposed Guard](#disposed-guard)
15. [Guarded Getter (throw-if-null)](#guarded-getter-throw-if-null)
16. [Lazy Initialization](#lazy-initialization)
17. [EventEmitter Conventions](#eventemitter-conventions)
18. [Null Safety](#null-safety)
19. [Logger Convention](#logger-convention)
20. [import type Convention](#import-type-convention)
21. [Static Instance Counter](#static-instance-counter)
22. [AS3 Reference JSDoc](#as3-reference-jsdoc)

### Safety
23. [Pitfalls to avoid](#pitfalls-to-avoid)

---

## MessageComposer

Composers serialize data for sending to the server.

### Template

```typescript
import { MessageComposer } from '@ambreia/net/messages/MessageComposer';

/**
 * Sends a request to open a flat connection.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/messages/outgoing/room/OpenFlatConnectionMessageComposer.as
 */
export class OpenFlatConnectionMessageComposer extends MessageComposer<ConstructorParameters<typeof OpenFlatConnectionMessageComposer>>
{
    private _data: ConstructorParameters<typeof OpenFlatConnectionMessageComposer>;

    constructor(roomId: number, password: string)
    {
        super();
        this._data = [roomId, password];
    }

    getMessageArray(): [number, string]
    {
        return this._data;
    }
}
```

### Rules

- The generic type of `MessageComposer<T>` is a tuple matching the sent data
- The `_data` field is private and typed with the same tuple
- The constructor calls `super()` then assigns `_data`
- `getMessageArray()` simply returns `_data`
- No complex logic in the composer — just data packaging

### Tuple type examples

```typescript
extends MessageComposer<ConstructorParameters<typeof MyMessageComposer>>
```

---

## MessageParser

Parsers deserialize data received from the server.

### Template

```typescript
import type { IMessageDataWrapper } from '@ambreia/net/messages/IMessageDataWrapper';
import type { IMessageParser } from '@ambreia/net/messages/IMessageParser';

/**
 * Parses room info data from the server.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/messages/parser/room/RoomInfoParser.as
 */
export class RoomInfoParser implements IMessageParser
{
    private _roomId: number = 0;
    private _roomName: string = '';
    private _ownerId: number = 0;
    private _ownerName: string = '';

    flush(): boolean
    {
        this._roomId = 0;
        this._roomName = '';
        this._ownerId = 0;
        this._ownerName = '';
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomId = wrapper.readInt();
        this._roomName = wrapper.readString();
        this._ownerId = wrapper.readInt();
        this._ownerName = wrapper.readString();
        return true;
    }

    get roomId(): number { return this._roomId; }
    get roomName(): string { return this._roomName; }
    get ownerId(): number { return this._ownerId; }
    get ownerName(): string { return this._ownerName; }
}
```

### Rules

- Implements `IMessageParser` with `flush()` and `parse(wrapper)`
- `flush()` resets ALL fields to their default values and returns `true`
- `parse()` checks `if(!wrapper) return false` first
- The read order in `parse()` MUST match exactly the server's send order (see the emulator's serializer for that message, `vortex-rpg-emulator/Vortex.Revisions/Revision20260701/Serializers/`)
- Public getters for each parsed field
- No business logic in the parser — just data extraction

### Available read methods

```typescript
wrapper.readInt()       // 32-bit signed integer
wrapper.readShort()     // 16-bit signed integer
wrapper.readByte()      // Signed byte
wrapper.readString()    // String (length-prefixed)
wrapper.readBoolean()   // Boolean (1 byte)
wrapper.readLong()      // 64-bit integer (BigInt converted to number)
wrapper.readFloat()     // 32-bit float
```

---

## MessageEvent

Events bind a Parser to a callback for incoming message handling.

### Template

```typescript
import { MessageEvent } from '@ambreia/net/messages/MessageEvent';
import type { IMessageEvent, MessageEventCallback } from '@ambreia/net/messages/IMessageEvent';
import { RoomInfoParser } from './RoomInfoParser';

/**
 * Event fired when room info is received.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/messages/incoming/room/RoomInfoEvent.as
 */
export class RoomInfoEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: MessageEventCallback)
    {
        super(callBack, RoomInfoParser);
    }
}
```

### Rules

- Extends `MessageEvent` and implements `IMessageEvent`
- Constructor takes a single `callBack: Function` parameter
- Passes the Parser class (not an instance) to `super()`
- The `parser` getter casts `getParser()` to the concrete parser type

---

## Manager (Component DI)

Managers are the main business logic classes, registered in the DI system.

### Template

```typescript
import { Component } from '@ambreia/kernel/runtime/Component';
import { ComponentDependency } from '@ambreia/kernel/runtime/ComponentDependency';
import { IID_HabboCommunicationManager } from '@ambreia/game/iid/IIDHabboCommunicationManager';
import type { IHabboCommunicationManager } from '@ambreia/game/communication/IHabboCommunicationManager';

/**
 * Manages room instances and their lifecycle.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/room/RoomManager.as
 */
export class RoomManager extends Component implements IRoomManager
{
    private _communicationManager: IHabboCommunicationManager | null = null;
    private _rooms: Map<string, IRoomInstance> = new Map();

    constructor(context: IContext)
    {
        super(context);
    }

    protected get dependencies(): ComponentDependency[]
    {
        return [
            new ComponentDependency(
                IID_HabboCommunicationManager,
                (m) => this._communicationManager = m,
                true
            ),
        ];
    }

    /**
     * Called when all required dependencies are resolved.
     */
    protected override initComponent(): void
    {
        // Safe to use this._communicationManager here
    }

    public createRoom(roomId: string): IRoomInstance | null
    {
        if(this._rooms.has(roomId)) return null;

        const room = new RoomInstance(roomId, this);
        this._rooms.set(roomId, room);
        return room;
    }

    public getRoom(roomId: string): IRoomInstance | null
    {
        return this._rooms.get(roomId) ?? null;
    }

    public removeRoom(roomId: string): void
    {
        const room = this._rooms.get(roomId);

        if(room)
        {
            room.dispose();
            this._rooms.delete(roomId);
        }
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        for(const room of this._rooms.values())
        {
            room.dispose();
        }

        this._rooms.clear();
        super.dispose();
    }
}
```

### Rules

- Extends `Component` and implements an `I*` interface
- Constructor always takes `context: IContext` and calls `super(context)`
- Declare dependencies via `protected get dependencies()` (see [Component Lifecycle](#component-lifecycle))
- Override `initComponent()` for post-DI initialization (NOT constructor)
- **NEVER override `get events()`** — use a different name for custom events
- `dispose()` is ALWAYS the last method, calls `super.dispose()`
- `dispose()` checks `_disposed` to avoid double calls (inherited from `Component`)
- IIDs are registered in `packages/ambreia-game/src/iid/`

---

## Handler (BaseHandler)

Handlers listen to server messages and delegate to a listener.

### Template

```typescript
import type { IConnection } from '@ambreia/net/connection/IConnection';

/**
 * Handles room-related messages from the server.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/handler/RoomDataHandler.as
 */
export class RoomDataHandler
{
    private _connection: IConnection;
    private _listener: IRoomHandlerListener;

    constructor(connection: IConnection, listener: IRoomHandlerListener)
    {
        this._connection = connection;
        this._listener = listener;

        this._connection.addMessageEvent(new RoomInfoEvent(this.onRoomInfo.bind(this)));
        this._connection.addMessageEvent(new RoomReadyEvent(this.onRoomReady.bind(this)));
    }

    private onRoomInfo(event: RoomInfoEvent): void
    {
        if(!event) return;

        const parser = event.parser;

        if(!parser) return;

        // Process data and call listener
        this._listener.onRoomInfo(parser.roomId, parser.roomName);
    }

    private onRoomReady(event: RoomReadyEvent): void
    {
        if(!event) return;

        const parser = event.parser;

        if(!parser) return;

        this._listener.onRoomReady(parser.roomId);
    }

    dispose(): void
    {
        this._connection = null;
        this._listener = null;
    }
}
```

### Rules

- Takes an `IConnection` and a listener in the constructor
- Registers MessageEvents on the connection
- Each message handler checks `if(!event)` and `if(!parser)`
- Delegates processing to the listener, contains NO business logic
- The listener pattern matches `I*Listener` or `I*HandlerListener` interfaces from AS3

---

## Data class

Data classes represent protocol structures.

### Template

```typescript
import type { IMessageDataWrapper } from '@ambreia/net/messages/IMessageDataWrapper';

/**
 * Represents a room entry from navigation results.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/RoomDataParser.as
 */
export class RoomDataParser
{
    private _roomId: number;
    private _roomName: string;
    private _ownerId: number;
    private _ownerName: string;
    private _userCount: number;
    private _maxUsers: number;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._roomId = wrapper.readInt();
        this._roomName = wrapper.readString();
        this._ownerId = wrapper.readInt();
        this._ownerName = wrapper.readString();
        this._userCount = wrapper.readInt();
        this._maxUsers = wrapper.readInt();
    }

    get roomId(): number { return this._roomId; }
    get roomName(): string { return this._roomName; }
    get ownerId(): number { return this._ownerId; }
    get ownerName(): string { return this._ownerName; }
    get userCount(): number { return this._userCount; }
    get maxUsers(): number { return this._maxUsers; }
}
```

### Rules

- Constructor takes an `IMessageDataWrapper` and reads the data
- Read order MUST match exactly the emulator's serializer for that message
- Public getters, no setters (immutable after construction)
- May have a static `parse()` method if the AS3 has one

---

## Interface

### Template

```typescript
import type { IRoomInstance } from './IRoomInstance';

/**
 * Interface for the room manager.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/room/IRoomManager.as
 */
export interface IRoomManager
{
    createRoom(roomId: string): IRoomInstance | null;
    getRoom(roomId: string): IRoomInstance | null;
    removeRoom(roomId: string): void;
    dispose(): void;
}
```

### Rules

- `I` + PascalCase prefix
- Mirrors the public methods of its implementation (for an inherited class, those of its AS3 origin)
- Separate file from the implementation (`IRoomManager.ts` ≠ `RoomManager.ts`)

---

## Message registration

Messages are registered in `HabboMessages.ts`.

### Template

```typescript
// In HabboMessages.ts, registerMessages() method

// Incoming messages (server → client)
this.registerMessageEvent(new RoomInfoEvent(null), IncomingHeader.ROOM_INFO);
this.registerMessageEvent(new RoomReadyEvent(null), IncomingHeader.ROOM_READY);

// Outgoing messages (client → server)
this.registerComposer(OpenFlatConnectionMessageComposer, OutgoingHeader.OPEN_FLAT_CONNECTION);
```

### Rules

- Incoming events are instantiated with `null` as callback (the handler replaces it)
- Outgoing composers are registered by class (not by instance)
- Message IDs are in `IncomingHeader` and `OutgoingHeader`

---

## UI Window (ported from Flash)

The Flash window/UI system is fully ported. UI windows are TypeScript classes using PixiJS for rendering, built from the Flash XML layouts, which ship verbatim from the dump.

### Approach

```typescript
/**
 * Navigator search results window.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/navigator/NavigatorSearchResultsView.as
 */
export class NavigatorSearchResultsView
{
    private _window: IFrameWindow;
    private _navigator: IHabboNewNavigator;
    private _disposed: boolean = false;

    constructor(navigator: IHabboNewNavigator, windowManager: IWindowManager)
    {
        this._navigator = navigator;

        // Build from the registered Flash XML layout, keyed by its AS3 asset name
        this._window = windowManager.buildWidgetLayout('navigator_search');

        // Listen to engine events
        this._navigator.on('searchResults', this.onSearchResults.bind(this));
    }

    private onSearchResults(data: SearchResultData): void
    {
        // Update the PixiJS display objects in the window
        this._window.findChildByName('resultsList').update(data);
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;

        this._navigator.off('searchResults', this.onSearchResults);
        this._window.dispose();
        this._window = null;
        this._navigator = null;
    }
}
```

### Rules

- Keep the inherited UI class hierarchy (IWindow, IFrameWindow, etc.): the window system is extracted, not rewritten (`docs/superpowers/specs/2026-10-07-client-architecture-design.md` §3)
- Flash XML layouts ship as XML and are parsed at runtime (`WindowXmlAssetParser`)
- UI classes listen to engine events via EventEmitter3
- UI classes have `dispose()` that cleans up listeners and display objects
- The engine NEVER knows about UI classes (strict separation)

---

## Component Lifecycle

Every manager and service extends `Component`. The lifecycle follows a strict sequence.

### Lifecycle hooks (in order)

1. **`constructor(context)`** — call `super(context)`, declare field defaults
2. **`get dependencies()`** — return `ComponentDependency[]` (called during construction)
3. **`initComponent()`** — all required dependencies are resolved, safe to use them
4. **`purge()`** — optional cache clearing (called externally when memory pressure)
5. **`dispose()`** — clean up resources, call `super.dispose()`

### Template

```typescript
import { Component } from '@ambreia/kernel/runtime/Component';
import { ComponentDependency } from '@ambreia/kernel/runtime/ComponentDependency';
import { IID_HabboConfigurationManager } from '@ambreia/game/iid/IIDHabboConfigurationManager';
import type { IContext } from '@ambreia/kernel/runtime/IContext';
import type { IHabboConfigurationManager } from '@ambreia/game/configuration/IHabboConfigurationManager';

export class MyManager extends Component implements IMyManager
{
    private _configurationManager: IHabboConfigurationManager | null = null;
    private _cache: Map<string, string> = new Map();

    constructor(context: IContext)
    {
        super(context);
    }

    protected get dependencies(): ComponentDependency[]
    {
        return [
            new ComponentDependency(
                IID_HabboConfigurationManager,
                (m) => this._configurationManager = m,
                true  // required — initComponent waits for this
            ),
        ];
    }

    protected override initComponent(): void
    {
        // All required dependencies are now available
        const url = this._configurationManager!.getProperty('my.url');
        // ...
    }

    purge(): void
    {
        this._cache.clear();
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._cache.clear();
        super.dispose();
    }
}
```

### Rules

- `initComponent()` is called automatically when ALL required dependencies resolve
- Dependencies can resolve synchronously (provider already attached) or asynchronously (provider attached later)
- The `Component` base class manages `_disposed`, `_locked`, `events`, and the DI wiring
- `super.dispose()` emits `ComponentEvents.DISPOSING`, removes all listeners, and sets `_disposed = true`
- **Never** use dependency references in the constructor — they are not yet resolved

---

## IID / Dependency Registration

Every injectable service has a unique Interface Identifier (`IID<T>`) for type-safe dependency injection.

### IID declaration

One file per IID in `packages/ambreia-game/src/iid/`:

```typescript
// IIDRoomEngine.ts
import { createIID } from '@ambreia/kernel/runtime/IID';
import type { IRoomEngine } from '@ambreia/game/room/IRoomEngine';

export const IID_RoomEngine = createIID<IRoomEngine>('IRoomEngine');
```

### Registration (in VortexMain)

```typescript
// Create the component
this._roomEngine = new RoomEngine(ctx, this._core!.assets);

// Register it on the context with its IID(s)
ctx.attachComponent(this._roomEngine, [IID_RoomEngine]);
```

### Consumption (in another Component)

```typescript
protected get dependencies(): ComponentDependency[]
{
    return [
        new ComponentDependency(
            IID_RoomEngine,
            (engine) => this._roomEngine = engine,
            true
        ),
    ];
}
```

### Rules

- `IID<T>` = `symbol & { __type?: T }` — phantom type for compile-time safety
- `createIID<T>(name)` uses `Symbol.for('IID:' + name)` — globally unique
- One IID per interface, one file per IID
- Naming: `IID_` + interface name without `I` prefix → `IID_RoomEngine` for `IRoomEngine`
- Registration order in `VortexMain.initHabboManagers()` matters — dependencies must be registered before consumers

---

## Immutability-via-Interface

The codebase uses a two-tier interface pattern: a read-only interface for consumers and a read-write controller interface for owners.

### Template

```typescript
// IRoomObject.ts — read-only (consumers see this)
export interface IRoomObject
{
    getId(): number;
    getLocation(): IVector3d;
    getDirection(): IVector3d;
    getModel(): IRoomObjectModel;
}

// IRoomObjectController.ts — read-write (owners see this)
export interface IRoomObjectController extends IRoomObject
{
    dispose(): void;
    setLocation(location: IVector3d): void;
    setDirection(direction: IVector3d): void;
    setState(state: number, index: number): boolean;
}
```

### Another example (value types)

```typescript
// IVector3d.ts — read-only
export interface IVector3d
{
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly length: number;
}

// Vector3d.ts — mutable implementation
export class Vector3d implements IVector3d
{
    private _x: number;
    set x(value: number) { this._x = value; this._length = NaN; }
    get x(): number { return this._x; }
    // ...
}
```

### Rules

- Consumer APIs accept/return the read-only interface (`IRoomObject`)
- Manager internals use the controller interface (`IRoomObjectController`)
- For value types, use `readonly` in the interface, mutable setters in the class
- Naming: `I<Name>` (read-only) vs `I<Name>Controller` (read-write)

---

## Singleton

Used for the application shell and global utilities.

### Template

```typescript
export class Vortex
{
    private static _instance: Vortex;

    public static get instance(): Vortex
    {
        if(!this._instance)
        {
            this._instance = new Vortex();
        }

        return this._instance;
    }
}
```

### Rules

- `private static _instance` + `static get instance()`
- Lazy creation on first access
- Used only for true application globals (`Vortex`, `Logger`)
- Managers and services use Component DI instead — **never** make a manager a singleton

---

## Disposed Guard

Every class that owns resources uses an idempotent disposed guard.

### Template

```typescript
protected _disposed: boolean = false;

get disposed(): boolean
{
    return this._disposed;
}

dispose(): void
{
    if(this._disposed) return;

    this._disposed = true;

    // 1. Remove event listeners
    this._events.removeAllListeners();

    // 2. Dispose owned children
    for(const child of this._children.values())
    {
        child.dispose();
    }

    // 3. Clear collections
    this._children.clear();

    // 4. Nullify references
    this._connection = null;
    this._listener = null;

    // 5. Call super if extends Component
    super.dispose();
}
```

### Rules

- `_disposed` check is ALWAYS the first line of `dispose()`
- Set `_disposed = true` immediately after the check (before any cleanup)
- Disposal order: listeners → children → collections → references → super
- `dispose()` is ALWAYS the last method in the class body
- In `Component` subclasses, `_disposed` is inherited — no need to redeclare

---

## Guarded Getter (throw-if-null)

Used in orchestrator classes (`VortexMain`, `Vortex`) where fields are `null` before initialization.

### Template

```typescript
private _roomEngine: RoomEngine | null = null;

get roomEngine(): RoomEngine
{
    if(!this._roomEngine)
    {
        throw new Error('[HabboMain] Not initialized');
    }

    return this._roomEngine;
}
```

### Rules

- Field typed as `T | null`, initialized to `null`
- Getter returns `T` (non-null) or throws
- Error message format: `[ClassName] Not initialized`
- Used for fields that are guaranteed to be set after `init()` but not in the constructor
- Callers can trust the non-null return type after initialization

---

## Lazy Initialization

Three variants used throughout the codebase.

### A. Cached collection (invalidated on mutation)

```typescript
// RoomObjectManager
private _cachedValues: IRoomObjectController[] | null = null;

private getCachedValues(): IRoomObjectController[]
{
    if(this._cachedValues === null)
    {
        this._cachedValues = Array.from(this._objects.values());
    }

    return this._cachedValues;
}

// Invalidate on any mutation:
this._cachedValues = null;
```

### B. NaN sentinel for computed properties

```typescript
// Vector3d
private _length: number = NaN;

get length(): number
{
    if(isNaN(this._length))
    {
        this._length = Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z);
    }

    return this._length;
}

// Invalidate in setters:
set x(value: number) { this._x = value; this._length = NaN; }
```

### C. Lazy sub-object creation

```typescript
private _binLibrary: AssetLibrary | null = null;

private get binLibrary(): AssetLibrary
{
    if(!this._binLibrary)
    {
        this._binLibrary = new AssetLibrary(this.context, 'bin');
    }

    return this._binLibrary;
}
```

### Rules

- Use `null` as sentinel for object/array caches, `NaN` for numeric caches
- Always invalidate the cache when the underlying data changes
- Never use lazy init for data that changes every frame — compute it directly

---

## EventEmitter Conventions

The project uses `eventemitter3` (not Node.js EventEmitter). Three event patterns coexist.

### A. ComponentEvents (lifecycle)

```typescript
import { ComponentEvents } from '@ambreia/kernel/runtime/Component';

// Defined as const object
export const ComponentEvents = {
    RUNNING: 'component:running',
    DISPOSING: 'component:disposing',
    UNLOCKED: 'component:unlocked',
    ERROR: 'component:error',
} as const;

// Emitting
this._events.emit(ComponentEvents.UNLOCKED, this);

// Listening
component.events.on(ComponentEvents.UNLOCKED, (comp) => { ... });
```

### B. Domain events (via Component.events)

```typescript
// Manager emits on its own events getter
this.events.emit('configurationLoaded');
this.events.emit('searchResults', results);

// Listener (via ComponentDependency eventListeners)
new ComponentDependency(
    IID_HabboConfigurationManager,
    (m) => this._config = m,
    true,
    [{ type: 'configurationLoaded', callback: this.onConfigLoaded.bind(this) }]
),
```

### C. Static event name constants (custom event classes)

```typescript
export class UserNameUpdateEvent
{
    public static readonly NAME_UPDATE = 'unue_name_updated';
    // ...
}
```

### Rules

- Always use `eventemitter3`, never Node.js `events`
- Component lifecycle events use the `ComponentEvents` const object
- Custom events use `string` names (not enums)
- Event listeners MUST be cleaned up in `dispose()` — use `removeAllListeners()` or explicit `off()`
- Bind callbacks with `.bind(this)` in the constructor, not with arrow functions in `on()`

---

## Null Safety

Consistent null-handling idioms across the codebase.

### A. Prefer `| null` over `| undefined`

```typescript
// CORRECT
private _visualization: IRoomObjectVisualization | null = null;

// AVOID
private _visualization: IRoomObjectVisualization | undefined;
```

### B. Nullish coalescing for Map lookups

```typescript
return this._objects.get(String(id)) ?? null;     // Map → null
return this._strings.get(key) ?? '';               // Map → empty string
return this._numbers.get(key) ?? NaN;              // Map → NaN
```

### C. Optional chaining for nullable chains

```typescript
return this._assets?.getAssetByName(name) ?? null;
return this._context.configuration?.getProperty(key) ?? '';
```

### D. Explicit null checks (not truthy/falsy)

```typescript
if(this._visualization !== null)
if(object !== null)
if(location === null) return;
```

### Rules

- Fields are typed `T | null` and initialized to `null` — never leave `undefined`
- `Map.get()` returns `undefined`, always convert with `?? null` (or `?? default`)
- Use `=== null` / `!== null` for explicit null checks
- Exception: parser guard shorthand `if(!wrapper) return false` is acceptable (falsy check)

---

## Logger Convention

Named loggers with colored output. One logger per module.

### Template

```typescript
import { Logger } from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('RoomEngine');

// Usage
log.debug('Loading room:', roomId);
log.info('Room created');
log.warn('Missing asset:', assetName);
log.error('Failed to load:', error);
log.success('Room ready!');      // Green ✓ prefix
log.failure('Room load failed'); // Red ✗ prefix
```

### Rules

- Declare `const log = Logger.getLogger('Name')` at module scope (top of file)
- The logger name matches the class/module name
- Levels: `debug` → `info` → `warn` → `error`
- `success()` / `failure()` are styled variants of `info` / `error`
- Log message format: plain string, no brackets (the logger adds `[Name]` prefix automatically)
- Never use `console.log()` directly — always use `Logger`

---

## import type Convention

The codebase enforces separation of type-only imports from value imports.

### Template

```typescript
// Value imports (used at runtime)
import { Component } from '@ambreia/kernel/runtime/Component';
import { EventEmitter } from 'eventemitter3';

// Type-only imports (erased at compile time)
import type { IContext } from '@ambreia/kernel/runtime/IContext';
import type { IRoomObject } from '@room/object/IRoomObject';
import type { IMessageDataWrapper } from '@ambreia/net/messages/IMessageDataWrapper';
```

### Rules

- Use `import type` for interfaces, type aliases, and any symbol used only in type positions
- Use regular `import` for classes, functions, constants, and enums used at runtime
- Group value imports first, then type imports
- This is enforced across 100% of the codebase

---

## Static Instance Counter

Used to give objects unique IDs without an external generator.

### Template

```typescript
export class RoomObject
{
    private static _instanceCounter: number = 0;

    private _instanceId: number;

    constructor(...)
    {
        this._instanceId = RoomObject._instanceCounter++;
    }

    getInstanceId(): number
    {
        return this._instanceId;
    }
}
```

### Rules

- `private static _instanceCounter` on the class, starts at `0`
- Incremented in the constructor with `ClassName._instanceCounter++`
- Instance ID is read-only after construction

---

## AS3 Reference JSDoc

Every class references its AS3 source for traceability.

### Class-level

```typescript
/**
 * RoomObject
 *
 * Based on AS3: com.sulake.room.object.RoomObject
 *
 * Base implementation of a room object.
 */
export class RoomObject implements IRoomObjectController
{
```

### Method-level (when referencing a specific AS3 file)

```typescript
/**
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/communication/messages/parser/handshake/AuthenticationOKMessageParser.as
 */
```

### Rules

- Every class doc starts with "Based on AS3: `com.sulake.package.ClassName`"
- Use `@see sources/WIN63-202607011411-782849652/src/com/sulake/...` for specific file references
- IID files reference their AS3 counterpart: "Based on AS3: `com.sulake.iid.IIDRoomEngine`"
- If no AS3 counterpart exists (new TypeScript-only class), omit the AS3 reference

---

## Pitfalls to avoid

### 0. Performance anti-patterns

These patterns are common when porting AS3→TypeScript. AS3 used Flash Player with a different GC; in JavaScript, these patterns cause freezes and excessive memory usage. The AS3 lifecycle (dispose, flush/parse, object management) is preserved — these rules target JS-runtime-specific pitfalls within that lifecycle.

#### a) Array.includes/indexOf for frequent lookups

```typescript
// WRONG — O(n) on every received message
private _pendingTypes: string[] = [];

if(!this._pendingTypes.includes(type))
{
    this._pendingTypes.push(type);
}

// CORRECT — O(1)
private _pendingTypes: Set<string> = new Set();

if(!this._pendingTypes.has(type))
{
    this._pendingTypes.add(type);
}
```

**Rule**: if a collection is queried via `includes()`, `indexOf()`, or `find()` AND it can exceed 10 elements, replace it with `Set` or `Map`.

#### b) Object allocation in parsers

```typescript
// WRONG — new temporary Map on every parse
parse(wrapper: IMessageDataWrapper): boolean
{
    const ownerMap = new Map<number, string>();  // GC'd after every call
    // ...
}

// CORRECT — reuse a field
private _ownerMap: Map<number, string> = new Map();

parse(wrapper: IMessageDataWrapper): boolean
{
    this._ownerMap.clear();
    // ...
}
```

#### c) Array replacement instead of clearing

```typescript
// WRONG — flush() and parse() both create a new array
flush(): boolean
{
    this._objects = [];  // old array → GC garbage
    return true;
}

// CORRECT — clear in place
flush(): boolean
{
    this._objects.length = 0;
    return true;
}
```

#### d) Textures and OffscreenCanvas in the render loop

Porting AS3 `BitmapData` → `OffscreenCanvas` is conceptually correct, but `new OffscreenCanvas()` + `Texture.from()` on every frame creates a GPU memory leak. Always cache the results.

#### e) Sorting every frame without a dirty flag

If Z-order hasn't changed, don't re-sort. Use a `_zOrderDirty` flag set to `true` only when objects are added, removed, or change Z-index.

#### f) Missing viewport culling

Any offscreen object should be skipped by the render loop. Check bounds (AABB) before calling `renderObject()` or `updateVisualization()`.

Full reference: **Performance** section of `docs/STYLEGUIDE.md`.

---

### 1. Overriding `get events()` in Component

```typescript
// WRONG — breaks the DI system
class MyManager extends Component
{
    private _myEvents = new EventEmitter();
    get events() { return this._myEvents; }  // BREAKS DI RESOLUTION
}

// CORRECT — use a different name
class MyManager extends Component
{
    private _myEvents = new EventEmitter();
    get managerEvents() { return this._myEvents; }
}
```

The DI system uses `Component.events` (via `this._events`) for dependency resolution. Overriding it disconnects the DI listeners.

### 2. Infinite recursion with createRoomObject

```typescript
// WRONG — RoomInstance.createRoomObject() calls container.createRoomObject()
// which calls room.createRoomObject() again → infinite loop
createRoomObject(roomId, objectId, type, category)
{
    const room = this._rooms.get(roomId);
    return room.createRoomObject(objectId, type, category);  // RECURSION
}

// CORRECT — use createObjectInternal
createRoomObject(roomId, objectId, type, category)
{
    const room = this._rooms.get(roomId);
    return room.createObjectInternal(objectId, 1, type, category);
}
```

### 3. Engine → client imports

```typescript
// WRONG — the engine must NEVER know about the client
import { NavigatorWindow } from '@ui/navigator/NavigatorWindow';  // FORBIDDEN

// CORRECT — the engine emits events, the client listens
this.emit('searchResults', results);  // Engine emits
```

### 4. Forgetting to read the AS3

Before EVERY implementation, verify:
- Did you read the AS3 source file?
- Did you check the `implements`?
- Did you check the `handler/` directory?
- Did you read the `I<Class>.as` interface?

If the answer is no to any of these, STOP and read first.