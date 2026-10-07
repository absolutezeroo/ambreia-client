# Ambreia — Map Editor Specification

> **Type**: Superpowers-style design specification  
> **Project**: Ambreia  
> **Subsystem**: Map / Room Editor  
> **Version**: 0.1.0  
> **Date**: 2026-10-07  
> **Status**: Draft for design validation  
> **Primary stack**: C# / .NET, existing Habbo-style client/emulator, Vortex backend  
> **UI direction**: Habbo Flash client-inspired editor UI  
> **Core world model**: Habbo room model + real furni/mobis + MMORPG gameplay layers

> **Author**: the owner. Source of truth for the map editor; it supersedes
> `2026-10-07-ambreia-map-editor-design.md` (the first-render spec), which stays as the record of
> what the first render built. Answers that the existing code already gives to §93's open
> decisions are listed in the appendix at the end.

---

# 0. Purpose

This document is the source of truth for the **Ambreia Map Editor**.

It is a **design specification**, not an implementation plan. It defines:

- editor behavior;
- UI panels;
- room/floor editing;
- real Habbo furni/mobi usage;
- NPC/spawn/zone/trigger authoring;
- quest/resource/teleporter bindings;
- navigation and collisions;
- audio/VFX/ambience;
- world events and boss anchors;
- validation;
- test/debug tooling;
- AOI/ECS integration;
- save/export/versioning;
- acceptance criteria.

Exact source files, class names, commits and task sequencing belong in a separate implementation plan.

Normative terms:

- **MUST** = required.
- **MUST NOT** = prohibited.
- **SHOULD** = strongly recommended.
- **MAY** = optional.

---

# 1. Product vision

## 1.1 Core concept — APPROVED

The Ambreia Map Editor builds maps using the **real Habbo room paradigm**:

- room floor tiles;
- tile heights;
- holes;
- walls;
- actual Habbo mobis/furni;
- furni states;
- furni rotations;
- stacking;
- Habbo-compatible avatar navigation.

On top of that base, the editor adds MMORPG layers:

- NPCs;
- monsters;
- spawn zones;
- safe/PvP/quest/boss zones;
- triggers;
- teleporters;
- resource nodes;
- quest bindings;
- navigation overlays;
- audio zones;
- ambient VFX;
- world events;
- boss encounter anchors;
- AOI/debug data.

The editor **MUST NOT** become a generic Unity/Unreal terrain editor.

## 1.2 Real mobis first — APPROVED

Environment construction is based on real furni/mobis wherever possible.

Examples:

- forest -> trees/plants/rocks mobis;
- market -> stalls/counters/decorations;
- city -> floors/walls/lamps/statues/fountains;
- dungeon -> existing or custom Habbo-compatible furni;
- crafting station -> furni + RPG interaction binding.

The editor MUST NOT invent a parallel decorative system when a furni already represents the visual object.

## 1.3 Habbo Flash visual identity — APPROVED

The editor UI SHOULD follow the classic Habbo Flash client language:

- blue title bars;
- cream/light content panels;
- classic tabs;
- square/beveled buttons;
- compact dense forms;
- blue selection highlight;
- red close button;
- simple iconography;
- no futuristic dark IDE theme.

---

# 2. Main editor modes

The editor MUST expose these authoring modes:

```text
General
Room Model / Floor
Mobis
NPCs
Monsters
Spawns
Zones
Navigation
Collisions
Quests
Triggers
Wired
Teleporters / Transitions
Resources
Audio
VFX / Ambience
Events / Bosses
Validation
Test / Debug
Map Settings
```

The exact tab arrangement may evolve, but all functionality must remain reachable.

---

# 3. Main screen layout

Recommended structure:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Ambreia Map Editor                                               │
│ Fichier | Édition | Affichage | Outils | Test | Aide            │
├──────────────┬────────────────────────────────┬─────────────────┤
│ MODE / LIST  │                                │ PROPRIÉTÉS      │
│              │                                │                 │
│              │        VIEWPORT HABBO          │ Contextuelles   │
│              │        ISOMÉTRIQUE             │                 │
│              │                                │                 │
├──────────────┼────────────────────────────────┼─────────────────┤
│ CATALOGUE /  │ MINI-CARTE / JOURNAL / CALQUES│ INFOS / DEBUG   │
│ FILTRES      │                                │                 │
└──────────────┴────────────────────────────────┴─────────────────┘
```

Persistent information SHOULD include:

- map name;
- save state;
- active mode;
- active layer;
- current selection;
- undo/redo availability;
- zoom;
- grid state;
- validation state.

---

# 4. File operations

The **File** menu MUST provide:

- New Map;
- Open Map;
- Open Recent;
- Save;
- Save As;
- Save Copy;
- Import legacy room/map;
- Export runtime map;
- Export debug snapshot;
- Close Map;
- Exit.

Optional:

- Import room model only;
- Import furni placement set;
- Import map template.

---

# 5. Edit operations

The **Edit** menu MUST provide:

- Undo;
- Redo;
- Cut;
- Copy;
- Paste;
- Duplicate;
- Delete;
- Select All;
- Deselect;
- Lock Selection;
- Unlock Selection.

All normal destructive authoring operations SHOULD be undoable.

---

# 6. View controls

The **View** menu MUST allow toggling:

- grid;
- tile heights;
- tile coordinates;
- walls;
- wall cutaway;
- furni bounds;
- NPC markers;
- spawn areas;
- zones;
- triggers;
- quest markers;
- resources;
- navigation;
- collisions;
- audio zones;
- VFX zones;
- AOI cells;
- runtime IDs;
- debug labels;
- minimap;
- inspector;
- layers panel;
- activity log.

---

# 7. New map wizard

Creating a new map SHOULD request:

```text
Map ID
Display name
Map type
Region
Room model/template
Default wall settings
Default floor height
Default music/ambience
Player capacity
PvP policy
AOI profile
```

Supported map types SHOULD include:

```text
World
City
Outdoor
Interior
Dungeon
Raid
GuildHall
Housing
Arena
Tutorial
Event
```

---

# 8. Room model / floor editor

## 8.1 Tile state

Every map tile MUST support at least:

```text
X
Y
Height
Exists
Walkable
Hole
SpecialFlags[]
```

## 8.2 Tools

Required floor tools:

- Select;
- Add Tile;
- Remove Tile;
- Raise Tile;
- Lower Tile;
- Set Exact Height;
- Paint Height;
- Rectangle;
- Fill;
- Line;
- Copy Region;
- Paste Region;
- Move Selection.

## 8.3 Height display

The editor SHOULD optionally display tile heights directly on the map.

Example:

```text
0 0 0 0
0 1 1 0
0 1 2 0
0 0 0 0
```

## 8.4 Floor validation

The editor MUST detect:

- invalid tile coordinates;
- duplicate coordinates;
- out-of-bounds tiles;
- impossible avatar movement where required;
- isolated required areas;
- invalid hole placement;
- invalid spawn tile.

---

# 9. Walls

Map wall settings SHOULD support:

- enabled/disabled;
- wall height;
- wall thickness/profile;
- wall cutaway behavior;
- wall material/style where supported;
- floor material/style where supported.

The viewport MUST support a Habbo-like wall cutaway mode.

---

# 10. Player spawn points

The map MUST support at least one valid player spawn.

Fields:

```text
SpawnPointId
Name
X
Y
Z/Height
Direction
Type
Conditions?
```

Types MAY include:

- Default Entry;
- Respawn;
- Dungeon Entry;
- Dungeon Return;
- Teleporter Arrival;
- Guild Hall Arrival;
- Tutorial Entry;
- Event Arrival.

Validation MUST ensure the spawn is on a valid unblocked tile.

---

# 11. Real mobi catalogue

The editor MUST read from the real furni/mobi definition source used by Ambreia.

Each catalogue entry SHOULD expose:

```text
FurniDefinitionId
DisplayName
Category
SubCategory
Thumbnail/Icon
Footprint
AllowedRotations
States
StackHeight
WalkableBehavior
InteractionType
Tags
```

## 11.1 Search

Search MUST support:

- exact furni ID;
- partial furni ID;
- display name;
- category;
- tags.

## 11.2 Filters

Recommended filters:

```text
All
Favorites
Recent
By Category
By Catalogue
Rare
Seasonal
Limited
RPG-enabled
```

## 11.3 Categories

At minimum:

- Seating;
- Tables;
- Decorations;
- Plants;
- Lighting;
- Walls;
- Floors;
- Doors;
- Storage;
- Rare;
- Limited;
- Seasonal;
- Event;
- Miscellaneous.

---

# 12. Mobi placement

Designer flow:

```text
Choose mobi
→ ghost preview
→ valid tile
→ rotate if needed
→ place
```

Placement MUST validate:

- tile exists;
- footprint fits;
- stack rules;
- collision;
- floor height;
- item height;
- room bounds.

Invalid placement SHOULD render a clear red preview.

Recommended shortcuts:

- click = place;
- right click = cancel;
- wheel/key = rotate;
- shift = repeated placement;
- alt = sample existing mobi.

---

# 13. Mobi inspector

When a mobi is selected, inspector SHOULD show:

```text
Furni ID
Instance ID
Display name
Category
X
Y
Z
Rotation
State
Stack height
Walkable
Interaction
Locked
Tags
RPG behavior reference?
Notes
```

Actions:

- Move;
- Rotate;
- Change State;
- Duplicate;
- Copy;
- Delete;
- Lock Position;
- Reset Definition Defaults.

---

# 14. Multi-selection

The editor MUST support:

- Ctrl/Shift click;
- rectangle selection;
- select same furni ID;
- select by layer;
- select by tag.

Group operations:

- move;
- delete;
- duplicate;
- copy;
- change layer;
- add/remove tags;
- lock/unlock;
- rotate group;
- change Z;
- nudge.

Batch transforms SHOULD commit atomically where partial movement would create invalid state.

---

# 15. Clipboard and templates

Designers SHOULD be able to copy/paste a region containing selected layers.

Possible included data:

- floor;
- heights;
- mobis;
- zones;
- triggers;
- NPCs;
- resources.

Reusable templates MAY exist for:

- market stall;
- house interior;
- guild room;
- dungeon room;
- decorative cluster;
- boss arena;
- quest NPC setup.

---

# 16. Layers panel

Baseline layers:

```text
Floor
Walls
Mobis
NPCs
Monsters
Spawns
Zones
Navigation
Collisions
Triggers
Wired
Quests
Resources
Teleporters
Audio
VFX
Events
Debug
```

Each layer SHOULD support:

- visible;
- hidden;
- locked;
- selectable;
- color indicator.

---

# 17. NPC editor

## 17.1 NPC list

NPC mode MUST expose:

- search;
- list;
- active status;
- template ID;
- faction;
- service icons;
- Add;
- Duplicate;
- Delete;
- Focus on Map.

## 17.2 NPC inspector

Fields SHOULD include:

```text
NpcInstanceId
NpcTemplateId
DisplayName
Look/Avatar
X
Y
Z
Direction
Faction
Profession/Role
IdleAnimation
MovementProfile
DialogueId
ShopId?
QuestGiverProfile?
BankService?
TravelService?
ProfessionService?
InteractionRadius
SpawnCondition
Active
```

## 17.3 NPC services

Services SHOULD be composable:

- Talk;
- Shop;
- Quest;
- Bank;
- Travel;
- Profession;
- Guild Service;
- Reputation Vendor.

## 17.4 NPC visibility conditions

Possible conditions:

- quest state;
- player level;
- reputation;
- event state;
- time of day;
- faction;
- item owned.

---

# 18. Direct monster placement

Direct monster placement is intended for:

- scripted encounters;
- unique enemies;
- testing;
- decorative runtime entities.

Fields MAY include:

```text
MonsterDefinitionId
InstanceId
LevelOverride?
FactionOverride?
Position
Direction
AggroOverride?
RespawnPolicy?
Active
```

Normal repeatable world mobs SHOULD use spawn definitions.

---

# 19. Spawn editor

Spawn authoring is a major MMORPG feature.

## 19.1 Spawn types

Supported types SHOULD include:

```text
MonsterSpawn
NpcSpawn
ResourceSpawn
BossSpawn
EventSpawn
AmbientSpawn
```

## 19.2 Monster spawn fields

```text
SpawnId
Name
MonsterDefinitionId
Shape
AreaPoints
AnchorPosition?
MinAlive
MaxAlive
RespawnMin
RespawnMax
WanderRadius
AggroRadiusOverride?
LevelMin
LevelMax
GroupProfile?
AOIActivation
ActivationRadius
SleepDelay
Conditions[]
Tags[]
```

## 19.3 Spawn shapes

Must support:

- point;
- rectangle;
- polygon;
- radius/circle if useful;
- multi-point cluster.

## 19.4 Spawn preview

Viewport SHOULD display:

- spawn area;
- sample spawn points;
- maximum count;
- monster icon;
- IDs;
- activation radius optionally.

## 19.5 Spawn simulation

A debug action MAY temporarily simulate spawn placement without modifying saved map data.

---

# 20. Zone editor

Zones are logical gameplay regions independent from decoration.

## 20.1 Zone types

Suggested:

```text
SafeZone
PvPZone
QuestArea
BossArea
CityArea
DungeonArea
GatheringArea
AudioArea
EventArea
NoMountArea
NoCombatArea
RestrictedArea
Custom
```

## 20.2 Zone fields

```text
ZoneId
Name
Shape
Points
Priority
Tags[]
DisplayName?
DisplayOnHUD
SafeZone
PvPPolicy
RecommendedLevel
MusicOverride?
AmbienceOverride?
WeatherOverride?
RulesProfile?
Conditions[]
```

## 20.3 Overlap

Overlapping zones MUST be supported.

Priority/rule resolution MUST be explicit.

Validation MUST warn about incompatible overlaps.

---

# 21. Zone drawing tools

Required:

- Rectangle;
- Polygon;
- Move Point;
- Add Point;
- Remove Point;
- Move Entire Zone;
- Duplicate;
- Resize;
- Debug Color.

Zones render as transparent editor overlays only.

---

# 22. Navigation editor

Base navigation SHOULD derive from:

- floor existence;
- tile height;
- holes;
- furni walkability/collision.

Editor overlays:

- walkable;
- blocked;
- special cost;
- one-way if supported;
- interaction reachable;
- NPC paths;
- monster paths.

Manual overrides MAY mark:

- force blocked;
- force walkable where engine permits;
- no monster;
- no NPC;
- high cost.

---

# 23. Path test tool

The editor MUST support:

```text
Select Start
Select End
Compute Path
Display Path
Display Cost
Display Failure Reason
```

This tool must use the same navigation rules as runtime or a faithful equivalent.

---

# 24. Collision editor

If runtime collision differs from standard walkability, expose:

```text
PlayerCollision
MonsterCollision
ProjectileCollision
InteractionBlocking
VisionBlocking
```

Default values SHOULD come from definitions; manual override should be exceptional and visible.

---

# 25. Quest integration

The map editor references quest definitions; it does not need to become the complete quest editor.

Supported bindings:

- quest giver;
- quest turn-in;
- exploration objective;
- interact target;
- kill area;
- collect area;
- escort start/end;
- dungeon entrance;
- boss objective;
- waypoint.

Fields:

```text
QuestId
ObjectiveId
MarkerType
TargetEntityOrZone
VisibilityPolicy
Condition
```

Validation MUST detect missing quest/objective references.

---

# 26. Trigger editor

A trigger consists of:

```text
TriggerId
Event
Conditions[]
Actions[]
Cooldown?
RepeatPolicy
Active
DebugVisible
```

## 26.1 Events

Baseline:

- EnterZone;
- LeaveZone;
- Interact;
- ItemUsed;
- MonsterKilled;
- BossKilled;
- QuestStateChanged;
- TimerElapsed;
- PlayerLevelReached;
- ResourceGathered;
- DoorOpened;
- TeleportCompleted;
- InstanceStarted;
- InstanceCompleted.

## 26.2 Conditions

Possible:

- level;
- quest state;
- item owned;
- reputation;
- class;
- specialization;
- faction;
- event state;
- party state;
- time window;
- random chance;
- test flag.

## 26.3 Actions

Possible:

- start quest;
- advance quest;
- show dialogue;
- spawn entity;
- activate/deactivate spawn;
- open/close door;
- teleport player;
- play sound;
- play VFX;
- start world event;
- send notification;
- change zone state;
- apply temporary effect;
- set script variable.

## 26.4 Trigger safety

The editor SHOULD detect obvious self-triggering loops and broken references.

---

# 27. Wired integration

Habbo Wired and Ambreia RPG Triggers are separate systems.

The editor MAY expose both, but MUST NOT merge their semantics.

Wired editor SHOULD expose where supported:

- placed Wired items;
- type;
- configuration;
- dependencies;
- group/channel;
- debug state;
- test activation.

Validation SHOULD warn about incomplete chains and missing references.

---

# 28. Teleporter editor

Supported types:

- local teleporter;
- cross-map teleporter;
- dungeon entrance;
- guild hall entrance;
- house entrance;
- return portal;
- waypoint.

Fields:

```text
TeleporterId
SourceEntityOrTile
DestinationMapId
DestinationSpawnPointId
Facing
Cooldown?
Cost?
RequiredLevel?
RequiredQuest?
RequiredReputation?
PartyPolicy?
InstancePolicy?
```

Validation MUST detect missing destination map/spawn and blocked arrivals.

---

# 29. Transitions

Transitions represent invisible/decorative passages such as:

- door to interior;
- cave entrance;
- stairs to another map;
- dungeon portal;
- region transition.

Transition settings MAY include:

- destination;
- fade;
- loading indicator;
- conditions;
- party transfer;
- instance creation.

---

# 30. Interactive objects

Compatible mobis MAY receive RPG interaction bindings.

Examples:

- chest;
- lever;
- door;
- sign;
- altar;
- book;
- crafting station;
- bank chest;
- quest object.

A mobi MAY reference:

```text
InteractionDefinitionId
Cooldown
UseCount?
Respawn?
QuestBinding?
LootTable?
StateChange?
```

The visual furni definition remains separate from gameplay logic.

---

# 31. Resource nodes

Real mobis may visually represent resource nodes.

Examples:

- tree -> woodcutting;
- ore/rock -> mining;
- plant -> gathering;
- water/fishing marker -> fishing.

Fields:

```text
ResourceNodeId
ResourceDefinitionId
VisualMobiInstanceId?
Position
ProfessionRequirement
LevelRequirement
GatherTime
LootTable
RespawnPolicy
AOIActivation
PersonalOrShared
Conditions[]
```

---

# 32. Crafting stations

Mobis MAY expose station services:

- Forge;
- Cooking Station;
- Alchemy Table;
- Workbench;
- Loom;
- Enchanting Station.

Fields:

```text
StationType
AllowedProfessions
RequiredLevel?
InteractionRadius
UIProfile
Conditions
```

---

# 33. Audio editor

Supported audio types:

- ambient zone;
- point source;
- music override;
- event SFX;
- interact SFX.

Audio zone fields:

```text
AudioZoneId
Shape
ClipId
Loop
Volume
Priority
FadeIn
FadeOut
DistanceProfile?
Condition?
```

Point source fields:

```text
Position
ClipId
Radius
Loop
Volume
OcclusionPolicy?
```

Viewport SHOULD display audio radius/zone overlays.

---

# 34. VFX / ambience editor

Supported environmental VFX MAY include:

- smoke;
- fog;
- leaves;
- sparks;
- water mist;
- magical aura;
- dust;
- rain;
- snow.

Fields:

```text
VfxInstanceId
VfxDefinitionId
PositionOrZone
Loop
Scale
Rotation
VisibilityDistance
AOIActivation
Conditions[]
```

VFX are presentation-only unless explicitly paired with gameplay logic.

---

# 35. Lighting / atmosphere

The editor SHOULD provide lightweight atmosphere controls compatible with the client:

- ambient brightness;
- ambient tint;
- day/night preset;
- fog amount;
- weather;
- background/sky profile;
- light-emitting mobi behavior.

It MUST NOT require a physically-based 3D lighting workflow.

---

# 36. World events

Maps MAY contain world-event anchors.

Fields MAY include:

```text
WorldEventId
EventDefinitionId
ActivationZone
SpawnGroups[]
ObjectiveBindings[]
AnnouncementProfile
Cooldown
Schedule?
```

Editor SHOULD show:

- event boundary;
- event spawns;
- objectives;
- boss position;
- important anchors.

---

# 37. Boss encounter editor

Fields MAY include:

```text
EncounterId
BossDefinitionId
ArenaZoneId
BossSpawnPoint
AddSpawnGroups[]
DoorBindings[]
HazardMarkers[]
ResetPoint
RewardAnchor?
```

Map-level phase anchors MAY be tagged:

- add spawn A;
- meteor marker;
- safe point;
- boss teleport point;
- phase door;
- hazard center.

The map editor provides spatial anchors; encounter logic remains reusable external data/code.

---

# 38. Loot containers

Loot chests may be:

- one-time;
- per-player;
- respawning;
- quest-bound;
- dungeon reward.

Fields:

```text
LootContainerId
VisualMobiInstanceId
LootTableId
PersonalOrShared
RespawnPolicy
RequiredKey?
RequiredQuest?
InteractionTime?
```

---

# 39. Minimap

Minimap features:

- viewport rectangle;
- click-to-jump;
- zoom;
- layer filters;
- marker filters;
- selection highlight;
- selected zone highlight.

Markers MAY include:

- NPC;
- spawn;
- quest;
- event;
- teleporter;
- boss;
- resource.

---

# 40. Global search

The editor MUST support global search across:

- ID;
- name;
- furni ID;
- NPC template;
- monster definition;
- quest ID;
- zone ID;
- trigger ID;
- spawn ID;
- teleporter ID;
- tag.

Selecting a result SHOULD:

- switch to relevant mode;
- focus viewport;
- highlight object;
- open inspector.

---

# 41. Contextual inspector

Inspector MUST be contextual.

Examples:

- tile -> tile properties;
- mobi -> mobi properties;
- NPC -> NPC properties;
- spawn -> spawn properties;
- zone -> zone properties;
- trigger -> trigger properties.

Unrelated empty fields SHOULD NOT be displayed.

---

# 42. Local activity log

The editor SHOULD expose a recent action log:

```text
19:42:15  Mobi moved
19:42:11  Zone resized
19:42:04  Spawn added
19:41:58  Tile height changed
```

This is separate from permanent version history.

---

# 43. Undo / redo

Undo/redo MUST cover:

- floor changes;
- heights;
- mobi add/remove/move/rotate/state;
- NPC changes;
- spawn changes;
- zone changes;
- trigger changes;
- teleporter changes;
- resource changes;
- audio/VFX changes;
- map settings.

Batch actions SHOULD undo as one logical operation.

Example:

```text
Move 18 selected mobis
```

= one undo step.

---

# 44. Autosave and crash recovery

The editor SHOULD support:

- periodic recovery snapshot;
- explicit normal saves;
- crash recovery prompt.

Autosave MUST NOT overwrite the last known valid map when serialization fails.

---

# 45. Map settings panel

Required fields:

```text
MapId
DisplayName
Description
MapType
RegionId
RecommendedLevelMin
RecommendedLevelMax
PlayerCapacity
DefaultSpawnPoint
PvPPolicy
DefaultMusic
DefaultAmbience
WeatherProfile?
AOIProfile
InstancePolicy
Tags[]
```

Optional:

- map icon;
- loading image;
- difficulty;
- world coordinate placement.

---

# 46. AOI configuration

Map SHOULD expose or reference:

```text
CellSize
ActivationRadius
DeactivationMargin
SleepDelay
UnloadDelay
EntityVisibilityRadius
SpawnActivationRadius
```

AOI debug MUST visualize:

- cells;
- active cells;
- sleeping cells;
- unloaded cells;
- player AOI;
- entities per cell;
- spawn count;
- live tick cost in test mode.

---

# 47. ECS/runtime debug

During playtest, expose at minimum:

```text
Players
Monsters
NPCs
Projectiles
GroundEffects
ResourceNodes
ActiveCells
SleepingCells
ZoneTickMs
AiTickMs
PathfindingMs
AoiUpdateMs
PacketsPerSecond
```

Selecting a live runtime entity SHOULD allow read-only component inspection where practical.

---

# 48. Test mode

The editor MUST support launching the current map in test mode.

Options SHOULD include:

```text
Character
Level override
Class
Specialization
God mode
Infinite resource
No cooldown
Show collisions
Show navigation
Show AOI
Show triggers
Show IDs
Show spawn regions
```

Designer can start at:

- default spawn;
- selected tile;
- named spawn point.

Returning to edit MUST preserve unsaved editor state.

---

# 49. Live debug tools

Developer-only playtest tools MAY include:

- teleport to cursor;
- kill selected monster;
- reset encounter;
- activate event;
- force quest state;
- inspect AI state;
- inspect threat;
- show path;
- despawn cell;
- wake cell;
- reload definitions;
- reload runtime map snapshot.

These tools MUST NOT be exposed in production player mode.

---

# 50. Validation system

Validation is mandatory before publish/export.

Severities:

```text
Error
Warning
Info
```

## 50.1 Blocking errors

Examples:

- no valid player spawn;
- duplicate MapId;
- duplicate authored object ID;
- teleporter destination missing;
- spawn references missing monster definition;
- NPC template missing;
- quest objective missing;
- invalid zone polygon;
- entity outside map bounds;
- invalid serialization;
- required runtime reference missing.

## 50.2 Warnings

Examples:

- unreachable area;
- overlapping safe/PvP zones;
- unused zone;
- unused trigger;
- spawn max = 0;
- NPC has no interaction;
- resource has no loot table;
- high entity density;
- no ambient audio;
- orphaned debug marker.

## 50.3 Click-to-focus

Every validation issue MUST be clickable.

Clicking SHOULD:

- switch mode;
- select object;
- focus viewport;
- open inspector.

---

# 51. Navigation validation

Validation SHOULD detect:

- player spawn isolated;
- quest NPC unreachable;
- blocked teleporter arrival;
- inaccessible boss arena;
- inaccessible dungeon exit;
- unreachable resource node;
- spawn point on blocked tile;
- large disconnected walkable islands.

---

# 52. Spawn validation

Validation SHOULD detect:

- invalid shape;
- spawn outside map;
- invalid monster ID;
- invalid level range;
- min > max;
- invalid respawn values;
- spawn area fully blocked;
- forbidden duplicate exclusive boss spawns.

---

# 53. Trigger validation

Validation SHOULD detect:

- missing target;
- missing action reference;
- invalid quest reference;
- invalid zone reference;
- invalid teleporter reference;
- obvious infinite self-trigger.

---

# 54. Mobi validation

Validation SHOULD detect:

- missing furni definition;
- invalid state;
- invalid rotation;
- impossible placement;
- unsupported stack relationship;
- footprint outside map.

---

# 55. Runtime export / publish

Export MUST fail if blocking errors exist.

Runtime export SHOULD contain only runtime-relevant data.

Editor-only data MAY be omitted:

- panel layout;
- current selection;
- editor camera;
- debug colors;
- editor-only comments.

After export, show summary:

```text
Map ID
Map version
Tiles
Mobis
NPCs
Spawns
Zones
Triggers
Teleporters
Resources
Audio regions
VFX
Warnings
Output path
```

---

# 56. Versioning

Saved/published maps SHOULD include:

```text
MapId
SchemaVersion
ContentVersion
LastModified
Author?
BuildVersion?
```

Older schema versions must either:

- migrate safely;
- open read-only with warning;
- fail with an actionable migration error.

---

# 57. Stable IDs

Every authored gameplay object MUST have a stable unique ID.

Examples:

```text
zone.ambre.market
spawn.ambre.market.rats
npc.ambre.blacksmith
trigger.ambre.city.enter
teleporter.ambre.inn.upstairs
resource.ambre.forest.iron_01
```

Display names MUST NOT be authoritative references.

---

# 58. Data ownership

Suggested map ownership:

```text
Map file
├── Room model
├── Furni instances
├── NPC placements
├── Spawn definitions
├── Zones
├── Triggers
├── Teleporters
├── Resource placements
├── Audio/VFX placements
├── Encounter anchors
└── References to global definitions
```

Global reusable definitions remain outside map:

```text
Monster definitions
NPC templates
Quest definitions
Item definitions
Loot tables
Skill definitions
AI profiles
World event definitions
Audio definitions
VFX definitions
```

---

# 59. Example serialized structure

Illustrative only:

```yaml
map:
  id: map.ambre.city
  name: Ville d'Ambre
  type: City
  region: region.ambre

roomModel:
  width: 64
  height: 64
  tiles: ...

furni:
  - instanceId: furni.000001
    definitionId: furni_hc_sofa
    x: 14
    y: 8
    z: 0
    rotation: 2
    state: 0

npcs:
  - id: npc.ambre.intendant
    templateId: npc.intendant
    x: 22
    y: 11
    direction: 4

spawns:
  - id: spawn.ambre.rats
    monsterDefinitionId: monster.rat
    shape: polygon
    maxAlive: 6
    respawnSeconds: 30

zones:
  - id: zone.ambre.safe_center
    type: SafeZone
    polygon: ...

triggers:
  - id: trigger.ambre.city.enter
    event: EnterZone
    target: zone.ambre.entry
    actions: ...

teleporters:
  - id: teleporter.ambre.inn
    destinationMapId: map.ambre.inn
    destinationSpawnPointId: spawn.inn.entry
```

Actual serialization format remains OPEN.

---

# 60. Reusable templates

Editor SHOULD support templates for common constructs:

- safe zone;
- boss arena;
- dungeon entrance;
- shop NPC;
- quest NPC;
- resource cluster;
- teleporter pair;
- spawn group;
- ambience zone;
- market composition.

Instantiated templates MUST receive unique IDs.

---

# 61. Favorites / recent

Catalogue-heavy panels SHOULD support:

- favorites;
- recent mobis;
- recent NPC templates;
- recent monsters;
- recent zones;
- recent trigger actions.

---

# 62. Tags

Major authored entities SHOULD support tags for:

- filtering;
- batch selection;
- scripting;
- validation;
- analytics.

Example tags:

```text
city
forest
quest_main
boss
safe
vendor
crafting
seasonal
debug
```

---

# 63. Editor notes

Designer MAY attach editor-only notes to:

- map;
- zone;
- trigger;
- spawn;
- NPC;
- encounter.

Notes do not need to export to runtime.

---

# 64. Locks

Lockable entities:

- furni;
- floor region;
- NPC;
- spawn;
- zone;
- trigger.

Locked objects may be inspected but not moved/edited until unlocked.

---

# 65. Selection isolation

Editor SHOULD support:

- isolate selected;
- hide unselected;
- show only active layer;
- show only same type;
- focus selected.

This is important for dense Habbo maps.

---

# 66. Complexity warnings

Editor SHOULD calculate approximate complexity:

```text
Total mobis
Visible mobis in hotspot
NPC count
Max active spawns
Resource nodes
Triggers
Audio sources
Looping VFX
Estimated active ECS entities
Estimated AOI hotspot density
```

Warnings should guide designers without blocking unless a real engine limit exists.

---

# 67. Heatmaps

Optional but valuable overlays:

- furni density;
- spawn density;
- NPC density;
- pathfinding cost;
- AOI entity density;
- trigger density;
- audio overlap;
- VFX density.

---

# 68. Large-map navigation

Large maps SHOULD support:

- bookmarks;
- named locations;
- jump-to-zone;
- jump-to-NPC;
- jump-to-spawn;
- jump-to-quest marker;
- minimap click;
- coordinate jump.

---

# 69. Named bookmarks

Editor-only bookmarks MAY store camera position/zoom.

Examples:

```text
Main Gate
Market
North Forest
Boss Arena
Dungeon Entrance
Guild District
```

---

# 70. Responsiveness

Large maps SHOULD load progressively where practical.

The editor MUST remain responsive while:

- catalogue loads;
- thumbnails load;
- map validates;
- minimap rebuilds.

Long operations SHOULD expose progress.

---

# 71. Thumbnail cache

Furni thumbnails SHOULD be cached.

Missing thumbnails MUST NOT prevent placing a valid furni definition.

Use a fallback icon.

---

# 72. Error messages

Errors MUST be actionable.

Bad:

```text
Error 0x84
```

Good:

```text
Impossible de placer "Canapé Club" :
la case (14, 8) est occupée par un mobi non-stackable.
```

---

# 73. External definition reload

Editor SHOULD support reloading external definitions where safe:

- furni catalogue;
- NPC templates;
- monster definitions;
- quests;
- loot tables;
- audio/VFX;
- event definitions.

Conflicting changes MUST produce warnings.

---

# 74. Broken references

If a referenced definition disappears:

- preserve the authored object;
- mark it broken;
- show missing reference;
- prevent runtime export if required;
- allow rebinding.

Do not silently delete authored content.

---

# 75. Playtest separation

Runtime playtest changes MUST NOT automatically mutate authoring data.

Examples not persisted by default:

- monster movement;
- resource gathered;
- NPC killed;
- chest opened;
- temporary door state.

---

# 76. Dungeon authoring

Dungeon maps SHOULD support:

- entry point;
- checkpoints;
- encounter zones;
- boss arena;
- door bindings;
- wipe reset anchors;
- exit point;
- reward chest;
- room sequencing if needed.

Validation SHOULD ensure a valid entry/exit and reachable required objectives.

---

# 77. Guild hall authoring

Guild halls MAY support:

- guild bank anchor;
- crafting stations;
- trophy slots;
- editable decoration zones;
- restricted management zones;
- permission metadata.

The editor SHOULD distinguish:

```text
Static map content
Guild-decoratable areas
Runtime guild decorations
```

---

# 78. Housing authoring

Housing MAY define:

- owner spawn;
- visitor spawn;
- decoration bounds;
- furni placement permissions;
- buildable areas;
- private zones.

---

# 79. PvP arena authoring

Arena maps MAY define:

- team spawns;
- neutral spawn;
- spectator area;
- pre-match safe zone;
- combat zone;
- objective anchors;
- respawn points;
- out-of-bounds area.

---

# 80. Global world integration

Each map MAY define:

```text
WorldRegionId
WorldMapIcon
WorldMapPosition
ConnectedMaps[]
FastTravelNode?
DiscoveryId?
```

---

# 81. Map connection graph

Editor SHOULD eventually provide a graph view.

Nodes = maps.  
Edges = doors, teleporters, transitions, fast travel.

Validation SHOULD detect broken destinations.

---

# 82. Localization

Gameplay-facing content SHOULD reference localization keys where appropriate.

Potential localized fields:

- map name;
- zone display name;
- trigger notification;
- custom NPC text.

---

# 83. Collaboration / permissions

Future support MAY include:

- map lock;
- read-only mode;
- author attribution;
- change attribution;
- library permissions.

Real-time collaborative editing is NOT required for V1.

---

# 84. Backups / revisions

Minimum V1:

- manual save copies;
- autosave recovery.

Future:

- named snapshots;
- revision diff;
- restore revision.

---

# 85. Legacy room import

Because Ambreia reuses the existing Habbo foundation, the editor SHOULD support importing where practical:

- room model;
- floor heights;
- wall settings;
- furni placements;
- room entry point.

Imported maps MUST be validated before publish.

---

# 86. Legacy compatibility export

If required during migration, editor MAY provide a legacy-compatible export target separate from the full Ambreia runtime map.

---

# 87. V1 non-goals

Unless explicitly approved, V1 does NOT require:

- freeform 3D mesh editing;
- terrain sculpting;
- Blender-like transforms;
- physically-based light editor;
- arbitrary C# scripting in map files;
- full quest authoring;
- full AI authoring;
- full boss scripting;
- real-time multi-user editing;
- procedural city generation.

---

# 88. V1 production scope

V1 SHOULD include:

```text
Room model / floor
Walls
Real mobi catalogue
Mobi placement/state/rotation
Multi-selection
Layers
NPC placement
Monster spawn zones
Gameplay zones
Triggers
Teleporters
Quest bindings
Resource nodes
Navigation/path test
Audio zones
VFX placements
Map settings
Validation
Minimap
Global search
Undo/redo
Autosave/recovery
Test mode
AOI debug
Runtime metrics
Export/build
```

---

# 89. UI panel checklist

## Main
- [ ] Title bar
- [ ] File menu
- [ ] Edit menu
- [ ] View menu
- [ ] Test menu
- [ ] Save indicator
- [ ] Undo/redo
- [ ] Zoom
- [ ] Grid toggle

## Floor
- [ ] Select
- [ ] Add
- [ ] Remove
- [ ] Raise
- [ ] Lower
- [ ] Rectangle
- [ ] Fill
- [ ] Exact height
- [ ] Tile inspector

## Mobis
- [ ] Search
- [ ] Categories
- [ ] Favorites
- [ ] Recent
- [ ] Thumbnail grid
- [ ] Placement preview
- [ ] Rotation
- [ ] State
- [ ] Position
- [ ] Duplicate
- [ ] Delete
- [ ] Lock

## NPC
- [ ] List
- [ ] Search
- [ ] Add
- [ ] Duplicate
- [ ] Delete
- [ ] Template
- [ ] Look
- [ ] Position
- [ ] Direction
- [ ] Services
- [ ] Conditions

## Spawns
- [ ] List
- [ ] Add spawn
- [ ] Shape editor
- [ ] Monster definition
- [ ] Count
- [ ] Respawn
- [ ] Wander
- [ ] Aggro
- [ ] Level range
- [ ] AOI activation
- [ ] Conditions
- [ ] Preview

## Zones
- [ ] List
- [ ] Rectangle
- [ ] Polygon
- [ ] Type
- [ ] Name
- [ ] Priority
- [ ] PvP
- [ ] Safe zone
- [ ] Music
- [ ] Ambience
- [ ] Conditions
- [ ] Tags

## Triggers
- [ ] Trigger list
- [ ] Event
- [ ] Conditions
- [ ] Actions
- [ ] Cooldown
- [ ] Repeat policy
- [ ] Debug visibility
- [ ] Test trigger

## Teleporters
- [ ] Destination map
- [ ] Destination spawn
- [ ] Cost
- [ ] Level requirement
- [ ] Quest requirement
- [ ] Reputation requirement
- [ ] Party/instance policy

## Navigation
- [ ] Walkable
- [ ] Blocked
- [ ] Costs
- [ ] Path start
- [ ] Path end
- [ ] Path result
- [ ] Failure reason

## Audio
- [ ] Ambient zone
- [ ] Point source
- [ ] Volume
- [ ] Radius
- [ ] Loop
- [ ] Priority
- [ ] Preview

## VFX
- [ ] VFX selection
- [ ] Position/zone
- [ ] Loop
- [ ] Scale
- [ ] AOI
- [ ] Conditions
- [ ] Preview

## Validation
- [ ] Errors
- [ ] Warnings
- [ ] Info
- [ ] Click-to-focus
- [ ] Re-run
- [ ] Export blocker state

## Test / Debug
- [ ] Launch
- [ ] Spawn point
- [ ] Level
- [ ] Class
- [ ] God mode
- [ ] AOI overlay
- [ ] Collision overlay
- [ ] Path overlay
- [ ] Trigger overlay
- [ ] Runtime metrics

---

# 90. Architecture invariants

### INV-MAP-001
Real environment construction is based on the Habbo room model and real furni/mobis.

### INV-MAP-002
MMORPG gameplay behavior is referenced through stable IDs, not arbitrary embedded code.

### INV-MAP-003
Editor-only overlays never alter gameplay by themselves.

### INV-MAP-004
Every published runtime map passes blocking validation.

### INV-MAP-005
Normal destructive editor operations are undoable where technically possible.

### INV-MAP-006
Gameplay objects use stable unique IDs.

### INV-MAP-007
Broken references are preserved for repair rather than silently deleted.

### INV-MAP-008
Playtest runtime state does not mutate source map data by default.

### INV-MAP-009
AOI/spawn/navigation behavior is inspectable in debug mode.

### INV-MAP-010
Mobi placement uses the same fundamental room/furni constraints as runtime.

---

# 91. Acceptance criteria

The V1 editor is considered functionally complete when a designer can:

1. Create a new Ambreia map.
2. Edit floor tiles and heights.
3. Configure walls.
4. Set valid player entry/respawn points.
5. Search the real furni catalogue.
6. Place real mobis.
7. Rotate and change mobi states.
8. Stack compatible mobis.
9. Multi-select and duplicate decoration groups.
10. Place NPCs with dialogue/shop/quest references.
11. Define monster spawn areas.
12. Define safe, quest, PvP and boss zones.
13. Define triggers with conditions/actions.
14. Bind teleporters between maps.
15. Bind resource nodes to visual mobis.
16. Inspect navigation.
17. Run path tests.
18. Add ambient audio zones.
19. Add environmental VFX.
20. Add world/boss encounter anchors.
21. Search all authored objects globally.
22. Toggle and lock layers.
23. Use undo/redo.
24. Recover from autosave.
25. Run full validation.
26. Click an error and focus the failing object.
27. Launch map in test mode.
28. Visualize AOI cells.
29. Visualize collisions/pathfinding/spawns.
30. Inspect runtime entity counts and tick cost.
31. Export a validated runtime map.
32. Reopen without losing stable IDs or references.

---

# 92. Recommended child specs

After approval, split major editor domains into focused specs if needed:

```text
map-editor-room-model-spec.md
map-editor-mobis-spec.md
map-editor-npc-spec.md
map-editor-spawn-zone-spec.md
map-editor-trigger-spec.md
map-editor-navigation-spec.md
map-editor-test-debug-spec.md
map-runtime-format-spec.md
map-validation-spec.md
```

---

# 93. Open decisions

The following remain OPEN:

1. Final serialization format.
2. Exact legacy room model compatibility format.
3. Exact furni catalogue source/API.
4. Whether custom non-Habbo furni share the same catalogue.
5. Maximum map dimensions.
6. Maximum floor height.
7. Whether editor streams very large maps by region.
8. Default AOI cell size.
9. Default AOI radius.
10. Runtime zone representation: tile list vs polygon.
11. Trigger implementation model.
12. Extent of Wired support in V1.
13. Audio preview support in editor.
14. VFX preview support in editor.
15. Day/night preview in V1.
16. Map graph view timing.
17. Legacy import timing.
18. Legacy export requirement.
19. Revision storage strategy.
20. Standalone editor vs embedded dev/admin client.
21. Published map hot-reload support.
22. Live server entity inspection.
23. Runtime map patching without restart.
24. Collaboration/permissions model.

---

# 94. Recommended implementation order

```text
1. Map document + serialization
2. Room model / floor editor
3. Furni catalogue
4. Furni placement/editing
5. Selection + undo/redo
6. Layers + minimap + search
7. NPC authoring
8. Spawn authoring
9. Zone authoring
10. Navigation + path debug
11. Teleporters
12. Quest bindings
13. Triggers
14. Resource nodes
15. Audio/VFX
16. Validation
17. Test mode
18. AOI/runtime debug
19. Export/build
20. Legacy import/hot reload later
```

---

# 95. Definition of done

The Map Editor is ready for production use when:

- a non-programmer can build a complete playable Ambreia map;
- normal map authoring does not require direct database edits;
- real Habbo mobis are first-class authoring assets;
- RPG map behavior is exposed through explicit editor concepts;
- broken references are detected before runtime;
- AOI/navigation/spawn behavior can be tested visually;
- large maps remain usable;
- exported maps are deterministic and versioned;
- map setup no longer depends on hard-coded server room logic.

---

## End of specification

---

# Appendix — §93 decisions the existing code already answers (2026-10-07)

Recorded so a plan does not reopen them by accident; each can still be revisited by the owner.

| # | Decision | What exists |
|---|---|---|
| 1 | Serialization format | JSON zone document, schema `vortex-rpg-emulator/schemas/zone.schema.json`, generated TS types; stored as versions in `zone_versions` (draft → published) |
| 3 | Furni catalogue source/API | `GET /api/editor/furniture` (definitions: id = sprite id, class name, size, states, walk/sit, stack height); pictures from vortex-imager |
| 5 | Maximum map dimensions | 64 × 64 (`ZoneDocument.MaxSize`) |
| 6 | Maximum floor height | 32 (`ZoneDocument.MaxTileHeight`) |
| 10 | Runtime zone representation | polygon of cells (`ZoneArea.polygon`, at least three points) |
| 19 | Revision storage | every save is a numbered version; publishing marks one live; older versions stay readable (`GET …/document?version=N`) |
| 20 | Standalone vs embedded | standalone Windows app (Tauri) on @ambreia/ui, the owner's Glaze layouts `vortex_map_editor_*` |
| 21 | Published map hot-reload | yes: publishing reloads the zone's room and forwards the players inside |
| 24 | Collaboration / permissions | one editor per zone (lock, 30 min), capabilities `world.zone.edit` and `world.zone.publish` |
