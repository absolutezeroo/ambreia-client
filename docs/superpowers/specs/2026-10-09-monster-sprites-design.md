# Monster sprites: real art for monsters

Date: 2026-10-09. Status: approved in conversation (three sections), the owner asked for everything up
to the visual check in one go.

## 1. Goal

Monsters (M1a: `Vortex.Rpg.Monsters`, rendered as Habbo pets) get their own art and animations
(idle, walk, attack, hit, death) instead of a recoloured Habbo pet. The art source is undecided
(packs, custom pixel art, Habbo pets reworked), so the pipeline takes any source.

Out of scope: the players' attack animations (`wpn=`/`atk=` avatar actions), boss telegraphs (M1c),
loot (M2).

## 2. Approach: compile to the pet format

A monster stays a pet on the wire and in the client (`RoomObjectType.Pet`, `PetLogic`,
`AnimatedPetVisualization`). An offline compiler turns a neutral source into a pet `.nitro` (the
same two files as every pet: `<id>.json` + `<id>.png`), which `build:ambreia` packs like any pet.
No new renderer, no wire change for the art; selection, shadow, the target portrait and the imager
work as for pets.

### Source (`packages/vortex-client/monsters/<id>/monster.json`)

```json
{
  "id": "slime",
  "scale": 1,
  "anchor": [16, 30],
  "directions": [2],
  "sheet": "slime.png",
  "cell": [32, 32],
  "animations": {
    "idle":   {"row": 0, "frames": 4, "ms": 160},
    "walk":   {"row": 1, "frames": 4, "ms": 120},
    "attack": {"row": 2, "frames": 4, "ms": [80, 80, 160, 120]},
    "hit":    {"row": 3, "frames": 2, "ms": 120},
    "death":  {"row": 4, "frames": 4, "ms": 140}
  }
}
```

- `directions`: the Habbo directions the source draws (1 = screen right, 3 = toward the viewer,
  5 = left, 7 = away). Grid rows: an animation's `row` is its first direction, the next directions
  follow on the next rows.
- `aseprite` instead of `sheet`/`cell`: the tags name the animations (`idle` or `idle_<dir>`),
  frame durations come from the file, visible layers are flattened.
- `anchor`: the pixel of a cell (before `scale`) that stands on the tile centre.
- `idle` and `walk` are required; `attack`, `hit`, `death` are optional (no `death`: the corpse
  shows `idle`).

### Output

- Postures `std` (idle), `mv` (walk), `ded` (death, plays once and holds its last frame); gestures
  `atk`, `hit` (play once). One layer, size 64, the `sd` shadow, no palette (the figure colour
  tints the sprite: an elite wolf is `"<type> 0 FF8080"`).
- The 8 directions: a missing one is the mirror of the opposite one (`source` + `flipH`, as
  `bunnyevil` does for 4-6), else the nearest drawn direction.
- Frame time: `ms` becomes `frameRepeat` at the pet animation's frame time.
- The compiler refuses (writes nothing) on a missing `idle`/`walk`, a missing tag or cell, an empty
  frame, or a bad direction: a broken pet library renders nothing at all in the client.

### Registration

The id is appended to `pet.configuration` (`legacy.defaults.json`); its index is the type id the
server's monster `figure` uses. The compiler prints it.

## 3. Animations in play

| Animation | Pet | Trigger |
|---|---|---|
| idle | posture `std` | server default (no change) |
| walk | posture `mv` | server, each step (no change) |
| attack | gesture `atk` | client, `RpgCombatEvents` hit whose attacker is a monster |
| hit | gesture `hit` | client, same message, target is a monster, outcome not `miss` |
| death | posture `ded` | server, status `ded` during the corpse delay |

Client, inherited code:

- `PetLogic` stamps every gesture message (`figure_gesture_seq`) so the same gesture restarts.
- `AnimatedPetVisualization` hands a gesture back to the posture once its animation is over **when
  it ran past its first frame** (an action). One-frame gestures (Habbo's expressions) keep the
  3-second hold.

Server:

- **Corpse**: a killed monster stops being a combatant at once (XP, `MonsterKilledEvent`, threat as
  today), gets the status `ded`, and leaves the room `corpseSeconds` later (monster definition,
  default 2, 0-10). The respawn timer is unchanged.
- **Facing**: on each swing the attacker turns toward its target (monsters and players), through
  the existing `UserUpdate`.

## 4. Verification

1. `node:test` on the compiler: a fixture grid and a generated `.aseprite` compile; the `.nitro`
   reads back with 8 directions, the postures and gestures, mirrored assets; bad sources are refused.
2. The imager renders the monster per direction and animation; anchor and scale compared with
   `dog`.
3. The client in a zone with the monster: walk, attack facing the player, hit, death then removal.
4. Emulator tests: the corpse is not targetable and leaves after `corpseSeconds`; the attacker
   faces its target.

## 5. First monster

A slime drawn for the purpose (directions 2 and 0, mirrored for 4 and 6, the five animations), about
40 px wide like Habbo's dog. It is an `.aseprite` (`*.png` is gitignored, so a PNG grid source would
not be versioned), the pet type 37. It replaces the figure of `proof_brute`; the wolf stays a
recoloured dog until it has art.
