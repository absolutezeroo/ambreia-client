# Monster art pipeline: monsters drawn from 3D volumes

Date: 2026-10-10. Status: design agreed in conversation after a spike (wolf, ogre, dragon rendered
from volumes, compared with the hand-built puppet). Follows `2026-10-09-monster-sprites-design.md`,
whose compiler (`build-monsters`) and pet format stay as they are.

## 1. Goal

Draw monsters the way an artist would, in four passes (form, paint, details, finish), but from a
description instead of by hand, so that:

- every direction (8) and every pose is right without drawing it again;
- a new monster, or a variant (elite, colour, size), is a file, not code;
- the result is pixel art that reads at Habbo's scale, and stays retouchable by hand in Aseprite.

Out of scope: tweening between key poses, AI services (PixelLab, Retro Diffusion: possible later as
an optional pass), the server content of new monsters (stats, spawns: a monster needs a
`content/monster/*.json` like today).

## 2. What the spike settled

| Question | Answer |
|---|---|
| Method | Signed distance volumes (ellipsoids, round cones, thick triangles) blended with a smooth minimum, ray-marched one ray per pixel on Habbo's 2:1 projection. A 2D puppet cannot show a face from the front; the volumes can. |
| Paint | "V4": a 5-step hue-shifted ramp per material from Lambert light (Habbo's, from the upper left) and ambient occlusion; floor bounce under the body; specular glints on shiny materials; textures as clusters (scales, fur strands), never noise. |
| Finish | Interior lines where depth jumps between parts; crests lightened and creases darkened from normal and depth discontinuities; a rim light on the silhouette; a selective outline (the material's own dark, lighter where lit); lone pixels removed. |
| Bodies | A quadruped (wolf), an armed biped (ogre), a winged creature (dragon) all work with the same engine. Wings need the thick-triangle primitive. |
| Cost | 70-150 ms per frame in plain Node: about 20 s for a monster (8 directions × ~20 frames). |

## 3. Where things live

```
packages/vortex-client/tools/monster-art/
  sdf.mjs          primitives, smooth minimum, scene distance (and which shape is nearest)
  projection.mjs   Habbo 2:1 projection, view direction, light, direction angles
  rig.mjs          rig.json: validation, bones and forward kinematics, a pose → shapes in model space
  form.mjs         pass 1: G-buffer per pixel (hit, depth, normal, shape, material, local point, AO)
  paint.mjs        pass 2: ramps, light, bounce, glints, cluster textures
  details.mjs      pass 3: decals (eyes, nose, fangs, claws, navel…) where the surface shows them
  finish.mjs       pass 4: interior lines, crests and creases, rim, outline, cleanup
  render.mjs       one frame: the four passes → four RGBA layers; canvas and anchor for a monster
  build.mjs        CLI: rig → <id>.aseprite + monster.json (then build-monsters as today)
  preview.mjs      live preview server
packages/vortex-client/monsters/<id>/
  rig.json         the monster (versioned)
  <id>.aseprite    generated, retouchable (versioned)
  monster.json     generated for build-monsters
```

No new dependency (`sharp` is already there; the preview uses `node:http` and `fs.watch`).

## 4. The rig (`rig.json`)

Units are pixels at Habbo's 64 scale. Model space: `u` forward, `s` to the monster's right, `v` up;
the origin is the tile centre on the floor.

```json
{
  "id": "wolf",
  "ramps": {"grey": ["#3a3b47", "#5d5f6b", "#82848e", "#a9aab0", "#d3d1ca"], "cream": ["…5"]},
  "materials": {
    "fur": {
      "ramp": "grey",
      "when": [{"normalUp": [0.5, 1], "ramp": "saddle"}, {"normalUp": [-1, -0.55], "ramp": "cream"}],
      "texture": "fur", "specular": 0.15
    },
    "leg": {"ramp": "grey", "when": [{"height": [-1, 1.4], "ramp": "cream"}]},
    "tail": {"ramp": "grey", "when": [{"along": [0.35, 1], "ramp": "dark"}]}
  },
  "bones": {
    "body": {"at": [0, 0, 22]},
    "neck": {"parent": "body", "at": [9, 0, 2]},
    "head": {"parent": "neck", "at": [5, 0, 5]},
    "jaw":  {"parent": "head", "at": [2, 0, -2]}
  },
  "shapes": [
    {"name": "ribs", "bone": "body", "ellipsoid": {"center": [5, 0, -0.5], "radii": [7, 5, 6.6]}, "material": "fur"},
    {"name": "snout", "bone": "head", "cone": {"from": [2.7, 0, -0.4], "to": [9.7, 0, -1.9], "radius": [2.4, 1.1]}, "material": "muzzle", "blend": 1.5},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[0, 0, 0], [-4, 6, 8], [-14, 1, -4]], "thickness": 0.45}, "material": "membrane", "blend": 0}
  ],
  "decals": [
    {"kind": "eye", "bone": "head", "at": [3.1, 2, 1], "mirror": true, "colours": ["#e8b545", "#141418"]},
    {"kind": "pixel", "bone": "head", "at": [10.6, 0, -1], "colours": ["#101014"], "size": [1, 2]}
  ],
  "animations": {
    "idle": [{"ms": 240, "pose": {}}, {"ms": 220, "pose": {"body": {"move": [0, 0, 0.5]}, "tail": {"rotate": [0, 0, 8]}}}],
    "walk": ["…"], "attack": ["…"], "hit": ["…"], "death": ["…"]
  }
}
```

- **Bones** form a tree (`parent`); `at` is the joint **in model space at rest**. A pose gives a bone
  a `rotate` (degrees about its joint: about `u` first, then `s`, then `v`) and/or a `move` (added to
  its joint). Shapes and decals are written **in model space at rest** and follow their bone.
- **Shapes**: `ellipsoid`, `cone` (round cone, two radii) or `membrane` (triangle, thickness).
  `blend` is the smooth-minimum radius with what is drawn before (0 = hard edge). Order matters only
  for blending.
- **Mirror**: a bone named `*.l` gets a `*.r` twin (`s` negated). Shapes and decals on a `*.l` bone
  are mirrored onto the twin unless `"mirror": false`; `"mirror": true` mirrors one on a central bone
  (ears, eyes). A pose on a `*.l` bone moves its twin too, mirrored, unless the frame names the twin.
- **Materials** pick a ramp, then the first `when` that matches: `normalUp`, `normalForward`
  (the normal at rest), `height` (`v` of the point at rest), `forward` (its `u`), `along` (position 0..1
  along a cone). `texture`
  is `fur`, `scales` or none; `specular` 0..1, `shininess`, `glint` (a colour).
- **Decals**: `eye` (iris + pupil toward the facing side), `pixel` (a colour, a size). A decal shows
  only where the surface at its pixel is that point (depth test) and faces the camera.
- **Animations**: the five names `build-monsters` knows. Each frame is a pose and a duration; `idle`
  and `walk` loop, `attack` and `hit` play once, `death` holds its last frame. `idle` and `walk` are
  required. A frame may set `"flash": true`: the hit flash, the whole sprite pale.

Validation refuses, with the path of the error (`shapes[3].cone.radius`): an unknown bone or
material, a cycle in the bones, a ramp that is not 5 colours, a missing `idle`/`walk`, a pose naming
an unknown bone.

## 5. The four passes

Per frame and per direction (0-7, Habbo's). Direction `k` turns the model by `(k − 2) × 45°` from the
world's X axis (screen lower right) toward its Y axis (screen lower left): 2 faces the lower right, 3
the viewer, 4 the lower left, 0 the upper right.

1. **Form**: one ray per pixel centre along the view direction; stop at distance < 0.02, at most 120
   steps; ignore hits under the floor. Normal from central differences; AO from 4 samples along it.
2. **Paint**: `light = 0.36 + 0.82·max(0, n·L) − 0.45·AO + 0.18·bounce` → ramp step 0-4; texture
   moves a mid step (1-3) by one on its pattern; a glint replaces the colour where the Blinn term
   passes 0.55; undersides in shadow take 22 % of the floor colour.
3. **Details**: decals as above.
4. **Finish**: interior lines (depth jump > 2.2 between different shapes) take the ramp's darkest;
   crests +1, creases −1; rim +1 on silhouette pixels facing the back light; outline pixels outside;
   a lone pixel whose four neighbours agree takes their colour (eyes and nose excepted).

The light, the back light and the thresholds are constants of the tool, the same for every monster:
monsters must look lit by the same room.

## 6. Output

- **Canvas**: the projected bounds of every frame of every direction, plus 2 px, the same for the
  whole monster; the anchor is where the origin projects.
- **`<id>.aseprite`**, layers bottom to top:
  - `forme` (hidden): each material flat, for reading the shapes;
  - `peinture`, `détails`, `finition`: what each pass adds over the one below;
  - `retouche`: empty when created, **never overwritten**. A rebuild reads the existing file and
    keeps this layer frame by frame when the tags and frame counts are unchanged; otherwise it
    refuses and says which tag changed (`--drop-retouche` to accept losing it).
  - Tags `<animation>_<direction>` for the 8 directions, durations from the rig.
- **`monster.json`** for `build-monsters`: `{"id", "aseprite", "anchor", "directions": [0..7]}`.
  `build-monsters` then flattens the visible layers as today: no mirrored direction any more, every
  direction is drawn.

## 7. Commands

```bash
pnpm --filter vortex-client build:monster-art [id...]   # rig.json → .aseprite + monster.json
pnpm --filter vortex-client monster-art:preview <id>    # http://localhost:5199
pnpm --filter vortex-client build:monsters [id...]      # unchanged: → pets/<id>.nitro
```

The **preview** page shows the 8 directions side by side, every animation playing at its real
durations, on Habbo's floor colour, at ×1 and ×4, with a pass selector (form, paint, details, final).
Saving `rig.json` re-renders and the page reloads (server-sent event); a rig error shows on the page
instead of the image.

## 8. Monsters

- **wolf**: the spike's second-generation rig, with walk (trot), attack (lunge, open jaw), hit
  (recoil), death (falls on its side). Replaces `monsters/wolf/wolf.aseprite` (same pet type 38).
- **ogre** (new pet type 39) and **dragon** (40): rigs and their five animations; registered in
  `pet.configuration`. Without server content they are seen in the preview and the imager only.
- **slime** stays hand-drawn: a hand-made `.aseprite` and a rig-made one go through the same compiler.

## 9. Verification

1. `node:test` in `tools/monster-art/`: projection of known points; distances of each primitive;
   forward kinematics (a rotated parent moves its child); rig validation messages; mirror; one tiny
   rig rendered to a fixed image (a pixel hash) so a change in a pass shows; the `.aseprite` writer
   with several layers read back; `retouche` kept, and refused when a tag changes.
2. The preview for the three monsters, screenshots per direction and animation, looked at.
3. The wolf in game (zone with `monster.forest.wolf`): walk, attack, hit, death with the corpse.
4. `pnpm check` green.

## 10. Later, not now

Tweening between key poses; per-monster palettes locked to a room's palette; worker threads if a
monster takes too long; AI services as an optional finishing pass; the `forme` layer as a mask for
hand painting.
