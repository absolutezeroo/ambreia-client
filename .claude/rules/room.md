---
paths:
  - "**/room/**"
  - "packages/ambreia-iso/**"
---

# Room engine rules

`@ambreia/iso` is the room engine: its core (`src/`: manager, instances, objects, renderer, events, utils), `scene/` (planes, content loader, factories), `furniture/`, `avatar/`, `effects/` — a type is drawn only if its module registered it (`registerScene/Furniture/Avatars/Effects`, `DEFAULT_ROOM_MODULES`). The engine's `habbo/room/` keeps the game glue (`RoomEngine`, `RoomMessageHandler`). Out of session, rooms load through `IsoStage`.

1. Use `createObjectInternal()`, never `createRoomObject()`, when creating room objects from a container (the latter recurses infinitely).
2. `renderer/` is a render-loop hot path: no allocations per frame, cache textures by content key, cull objects outside the viewport. See `docs/STYLEGUIDE.md` → Performance.
3. See `docs/PATTERNS.md` for Manager/Handler patterns before adding new room object types.
4. A new room object type is a `register()` in its module's `register*.ts`, not a `switch` case; effects (avatar additions, particles) go through `AvatarVisualization.additions` / `FurnitureFireworksVisualization.particleSystems`, set by `registerEffects`.
