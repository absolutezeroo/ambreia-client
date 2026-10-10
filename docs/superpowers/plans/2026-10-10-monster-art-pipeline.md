# Monster Art Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tool that draws monsters from a `rig.json` (3D volumes on bones) in four passes (form, paint, details, finish), in 8 directions and 5 animations, into a layered `.aseprite` that the existing `build-monsters` compiler turns into a pet.

**Architecture:** Plain Node modules under `packages/vortex-client/tools/monster-art/`: vector math, Habbo projection, signed-distance primitives, a rig loader (validation, mirroring, forward kinematics), the four passes, a frame renderer, a build CLI and a live preview server. Shapes are written in model space at rest and follow their bone; the scene distance maps each sample point back to its bone's rest space, so a posed rig is exact.

**Tech Stack:** Node ≥ 22 ES modules, `node:test`, `sharp` (already a devDependency), the repo's `tools/lib/aseprite.mjs`.

**Spec:** `docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md` (read it first; this plan refines §4 in Task 2).

## Global Constraints

- No new dependency. `sharp` is the only image library; the preview uses `node:http` and `fs.watch`.
- Code style: the repo's (Allman braces, 4 spaces, English comments that say why). Each edit is linted by a hook (`node node_modules/eslint/bin/eslint.js <file>` to run it by hand); fix what it reports.
- Units are pixels at Habbo's 64 scale; model space `[u, s, v]` = forward, the monster's right, up; origin on the floor at the tile centre.
- Directions are Habbo's 0-7; direction `k` turns the model by `(k − 2) × 45°` from world x (screen lower right) toward world y (screen lower left).
- The light, back light and every paint/finish threshold are constants of the tool, identical for every monster.
- Never a bare `git commit` and never `git add -A`: commit by path, `git commit -m "<message>" -- <paths>`. Messages in French in the repo's style (`monstres : …`), ending with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB
  ```
- Tests: `node --test packages/vortex-client/tools/monster-art/<file>.test.mjs` for one file; `pnpm check` (≈1 min) before each commit that touches `.mjs` used by `pnpm test` — it must be green.
- `*.png` is gitignored; the generated `.aseprite` and `rig.json` are versioned.

## Review Focus

1. **A pose that moves a part past its rest bounds** (a lunge, a raised club): the canvas must still contain every pixel of every frame — test in Task 4 (`no frame touches the canvas edge`).
2. **`rig.json` saved with a JSON syntax error while the preview runs**: the page shows the error and the server keeps running — test in Task 7 (`loadAndRender returns the error`).
3. **A rebuild after hand retouches when the canvas changed size** (a shape grew): refuse instead of misplacing the retouches — test in Task 6.
4. **An `.aseprite` re-saved by Aseprite itself** (extra chunks such as a colour profile): still readable — test in Task 5.
5. **A decal on the far side** (an eye seen from behind): not painted — test in Task 4.

---

### Task 1: Vectors, projection, distance primitives

**Files:**
- Create: `packages/vortex-client/tools/monster-art/vec.mjs`
- Create: `packages/vortex-client/tools/monster-art/projection.mjs`
- Create: `packages/vortex-client/tools/monster-art/sdf.mjs`
- Test: `packages/vortex-client/tools/monster-art/geometry.test.mjs`

**Interfaces:**
- Produces (`vec.mjs`): `add, sub, mul, dot, cross, len, norm, clamp, mix, lerp3`; rigid transforms `{r: number[9] (row-major), t: number[3]}`: `IDENTITY, rotate(m, p), apply(m, p), compose(a, b)` (b first, then a), `invert(m)`, `translation(t)`, `rotation([ru, rs, rv])` (degrees; R = Rv·Rs·Ru).
- Produces (`projection.mjs`): `MX, MY, VIEW, LIGHT, BACK_LIGHT, SPREAD`, `project(p) → [sx, sy]` (offset from the anchor), `unproject(sx, sy) → p`, `heading(direction) → {f, r}`, `modelToWorld(h, q)`, `worldToModel(h, p)`.
- Produces (`sdf.mjs`): `roundCone(p, a, b, ra, rb) → {d, h}`, `ellipsoid(p, c, r) → d`, `triangle(p, a, b, c, thickness) → d`, `smin(a, b, k) → d`.

- [ ] **Step 1: Write the failing tests**

```js
// packages/vortex-client/tools/monster-art/geometry.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {apply, compose, invert, rotation, translation} from './vec.mjs';
import {VIEW, heading, modelToWorld, project, unproject, worldToModel} from './projection.mjs';
import {ellipsoid, roundCone, smin, triangle} from './sdf.mjs';

const near = (a, b, eps = 1e-9) => (Array.isArray(a) ? a.every((x, i) => Math.abs(x - b[i]) < eps) : Math.abs(a - b) < eps);

test('rotation: +s swings what hangs forward and lifts what points forward; +v turns toward +s', () =>
{
    assert.ok(near(apply(rotation([0, 90, 0]), [0, 0, -1]), [1, 0, 0]));
    assert.ok(near(apply(rotation([0, 90, 0]), [1, 0, 0]), [0, 0, 1]));
    assert.ok(near(apply(rotation([0, 0, 90]), [1, 0, 0]), [0, 1, 0]));
    assert.ok(near(apply(rotation([90, 0, 0]), [0, 1, 0]), [0, 0, 1]));
});

test('compose applies the right-hand transform first; invert undoes', () =>
{
    const m = compose(translation([1, 2, 3]), rotation([10, 20, 30]));

    assert.ok(near(apply(m, [0, 0, 0]), [1, 2, 3]));
    assert.ok(near(apply(invert(m), apply(m, [4, -5, 6])), [4, -5, 6]));
});

test('projection: up is up, x goes to the lower right, the view direction flattens to a point', () =>
{
    assert.ok(near(project([0, 0, 1]), [0, -1]));
    assert.ok(near(project([1, 0, 0]), [2 / Math.sqrt(5), 1 / Math.sqrt(5)]));
    assert.ok(near(project(VIEW), [0, 0]));
    assert.ok(near(project(unproject(3, -2)), [3, -2]));
});

test('heading: direction 2 faces world x, 3 faces the viewer (straight down the screen)', () =>
{
    assert.ok(near(heading(2).f, [1, 0, 0]));
    assert.ok(near(heading(2).r, [0, 1, 0]));
    const [sx, sy] = project(heading(3).f);
    assert.ok(Math.abs(sx) < 1e-9 && sy > 0);
    const h = heading(5);
    assert.ok(near(worldToModel(h, modelToWorld(h, [3, -1, 2])), [3, -1, 2]));
});

test('distances: a sphere, a capsule, a thick triangle, smooth minimum', () =>
{
    assert.ok(near(ellipsoid([3, 0, 0], [0, 0, 0], [2, 2, 2]), 1, 1e-6));
    assert.ok(ellipsoid([1, 0, 0], [0, 0, 0], [2, 2, 2]) < 0);
    const {d, h} = roundCone([5, 3, 0], [0, 0, 0], [10, 0, 0], 1, 1);
    assert.ok(near(d, 2) && near(h, 0.5));
    assert.ok(near(triangle([0.2, 0.2, 1], [0, 0, 0], [4, 0, 0], [0, 4, 0], 0.25), 0.75));
    assert.equal(smin(1, 2, 0), 1);
    assert.ok(smin(1, 1, 2) < 1);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test packages/vortex-client/tools/monster-art/geometry.test.mjs`
Expected: FAIL, `Cannot find module './vec.mjs'`.

- [ ] **Step 3: Write `vec.mjs`**

```js
// Vector and rigid-transform helpers for the monster art tools. A point is [u, s, v] in model space
// or [x, y, z] in world space; a transform is a rotation r (3×3, row-major) then a translation t.
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = a => Math.hypot(a[0], a[1], a[2]);
export const norm = a => mul(a, 1 / (len(a) || 1));
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const mix = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export const IDENTITY = {r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0]};

export const rotate = (m, p) => [
    m.r[0] * p[0] + m.r[1] * p[1] + m.r[2] * p[2],
    m.r[3] * p[0] + m.r[4] * p[1] + m.r[5] * p[2],
    m.r[6] * p[0] + m.r[7] * p[1] + m.r[8] * p[2]
];
export const apply = (m, p) => add(rotate(m, p), m.t);

/** a ∘ b: b first, then a. */
export function compose(a, b)
{
    const r = new Array(9);

    for(let i = 0; i < 3; i++)
    {
        for(let j = 0; j < 3; j++) r[i * 3 + j] = a.r[i * 3] * b.r[j] + a.r[i * 3 + 1] * b.r[3 + j] + a.r[i * 3 + 2] * b.r[6 + j];
    }

    return {r, t: apply(a, b.t)};
}

/** The inverse of a rigid transform: the rotation transposed. */
export function invert(m)
{
    const r = [m.r[0], m.r[3], m.r[6], m.r[1], m.r[4], m.r[7], m.r[2], m.r[5], m.r[8]];

    return {r, t: mul(rotate({r, t: [0, 0, 0]}, m.t), -1)};
}

export const translation = t => ({r: IDENTITY.r, t: [...t]});

/**
 * Degrees about u, then s, then v (R = Rv · Rs · Ru). A positive s-rotation lifts what points
 * forward and swings forward what hangs down; a positive v-rotation turns toward +s.
 */
export function rotation([ru, rs, rv])
{
    const k = Math.PI / 180;
    const [cu, su] = [Math.cos(ru * k), Math.sin(ru * k)];
    const [cs, ss] = [Math.cos(rs * k), Math.sin(rs * k)];
    const [cv, sv] = [Math.cos(rv * k), Math.sin(rv * k)];
    const Ru = {r: [1, 0, 0, 0, cu, -su, 0, su, cu], t: [0, 0, 0]};
    const Rs = {r: [cs, 0, -ss, 0, 1, 0, ss, 0, cs], t: [0, 0, 0]};
    const Rv = {r: [cv, -sv, 0, sv, cv, 0, 0, 0, 1], t: [0, 0, 0]};

    return compose(Rv, compose(Rs, Ru));
}
```

- [ ] **Step 4: Write `projection.mjs`**

```js
// Habbo's 2:1 floor. World x goes toward the screen's lower right, y toward its lower left, z up; one
// unit along a floor diagonal is one pixel. MX and MY are the screen axes (the projection's rows).
import {add, dot, mul, norm} from './vec.mjs';

const S5 = Math.sqrt(5);

export const MX = [2 / S5, -2 / S5, 0];
export const MY = [1 / S5, 1 / S5, -1];
/** Toward the viewer: the direction the projection flattens. */
export const VIEW = norm([1, 1, 2 / S5]);
/** Habbo's light, from the screen's upper left and high; the back light rims the far edges. */
export const LIGHT = norm([-0.9, 0.25, 1.3]);
export const BACK_LIGHT = norm([0.35, -1, 0.55]);
/** How far a sphere of radius 1 spreads on screen at most (the longer row's norm). */
export const SPREAD = Math.sqrt(8 / 5);

/** Screen offset of a world point from the anchor, where the world origin lands. */
export const project = p => [dot(MX, p), dot(MY, p)];
/** The world point projecting to (sx, sy) on the plane through the origin that faces the viewer. */
export const unproject = (sx, sy) => add(mul(MX, sx / (8 / 5)), mul(MY, sy / (7 / 5)));

/** Direction k turns the model by (k − 2) × 45° from x toward y: 2 faces the lower right, 3 the viewer. */
export function heading(direction)
{
    const a = (direction - 2) * Math.PI / 4;

    return {f: [Math.cos(a), Math.sin(a), 0], r: [-Math.sin(a), Math.cos(a), 0]};
}

export const modelToWorld = (h, q) => [h.f[0] * q[0] + h.r[0] * q[1], h.f[1] * q[0] + h.r[1] * q[1], q[2]];
export const worldToModel = (h, p) => [dot(p, h.f), dot(p, h.r), p[2]];
```

- [ ] **Step 5: Write `sdf.mjs`**

```js
// Signed distances of the rig's three shapes, and the smooth minimum that melts them together.
import {clamp, cross, dot, len, mix, mul, sub} from './vec.mjs';

/** Round cone from a (radius ra) to b (rb). h is the position along it, 0 at a, 1 at b. */
export function roundCone(p, a, b, ra, rb)
{
    const pa = sub(p, a), ba = sub(b, a);
    const h = clamp(dot(pa, ba) / dot(ba, ba), 0, 1);

    return {d: len(sub(pa, mul(ba, h))) - mix(ra, rb, h), h};
}

/** Axis-aligned ellipsoid (an approximation that is exact for a sphere). */
export function ellipsoid(p, c, r)
{
    const q = sub(p, c);
    const k0 = Math.hypot(q[0] / r[0], q[1] / r[1], q[2] / r[2]);
    const k1 = Math.hypot(q[0] / (r[0] * r[0]), q[1] / (r[1] * r[1]), q[2] / (r[2] * r[2]));

    return k0 * (k0 - 1) / (k1 || 1e-6);
}

const dot2 = a => dot(a, a);

/** A membrane: the triangle abc with a thickness (wings, fins, a loincloth's flap). */
export function triangle(p, a, b, c, thickness)
{
    const ba = sub(b, a), pa = sub(p, a), cb = sub(c, b), pb = sub(p, b), ac = sub(a, c), pc = sub(p, c);
    const n = cross(ba, ac);
    const outside = Math.sign(dot(cross(ba, n), pa)) + Math.sign(dot(cross(cb, n), pb)) + Math.sign(dot(cross(ac, n), pc)) < 2;
    const d2 = outside
        ? Math.min(
            dot2(sub(mul(ba, clamp(dot(ba, pa) / dot2(ba), 0, 1)), pa)),
            dot2(sub(mul(cb, clamp(dot(cb, pb) / dot2(cb), 0, 1)), pb)),
            dot2(sub(mul(ac, clamp(dot(ac, pc) / dot2(ac), 0, 1)), pc)))
        : dot(n, pa) * dot(n, pa) / dot2(n);

    return Math.sqrt(d2) - thickness;
}

/** Polynomial smooth minimum: within k of each other, two shapes melt into one. k = 0 is a hard edge. */
export function smin(a, b, k)
{
    if(k <= 0) return Math.min(a, b);

    const h = Math.max(k - Math.abs(a - b), 0) / k;

    return Math.min(a, b) - h * h * k * 0.25;
}
```

- [ ] **Step 6: Run the tests**

Run: `node --test packages/vortex-client/tools/monster-art/geometry.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add -- packages/vortex-client/tools/monster-art/vec.mjs packages/vortex-client/tools/monster-art/projection.mjs packages/vortex-client/tools/monster-art/sdf.mjs packages/vortex-client/tools/monster-art/geometry.test.mjs
git commit -m "monstres : outil de dessin, géométrie (vecteurs, projection Habbo, volumes)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/tools/monster-art/vec.mjs packages/vortex-client/tools/monster-art/projection.mjs packages/vortex-client/tools/monster-art/sdf.mjs packages/vortex-client/tools/monster-art/geometry.test.mjs
```

---

### Task 2: The rig: validation, mirroring, forward kinematics

**Files:**
- Create: `packages/vortex-client/tools/monster-art/rig.mjs`
- Test: `packages/vortex-client/tools/monster-art/rig.test.mjs`
- Modify: `docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md` §4 (the refinements below)

**Refinements of the spec's §4** (write them into the spec in Step 6):
- A bone's `at` is its joint **in model space at rest**; shapes and decals are written **in model space at rest** and follow their bone (simpler to author: one space, numbers read off a drawing).
- Mirroring: every bone named `*.l` gets a `*.r` twin (`s` negated, parent mapped). Shapes and decals on a `*.l` bone are mirrored onto the twin unless `"mirror": false`; `"mirror": true` mirrors a shape or decal on a central bone (ears, eyes). A pose on a `*.l` bone also moves its twin, mirrored (`rotate [−u, s, −v]`, `move [u, −s, v]`), unless the frame names the twin.
- Material conditions: `normalUp`, `normalForward`, `height`, `forward` (the rest point's `u`), `along`.
- A frame may set `"flash": true` (the hit flash: the whole sprite in a pale colour).

**Interfaces:**
- Consumes: `vec.mjs` (Task 1).
- Produces: `ANIMATIONS = ['idle', 'walk', 'attack', 'hit', 'death']`; `class RigError extends Error {path}`; `hexToRgba('#rrggbb') → [r, g, b, 255]`; `loadRig(json) → rig` where
  `rig = {id, ramps: {name: rgba[5]}, materials: {name: Material}, bones: Map<name, {name, parent, at}>, order: string[] (parents first), shapes: Shape[], decals: Decal[], animations: {name: Frame[]}}`,
  `Material = {ramp: rgba[5], when: {ramp, normalUp?, normalForward?, height?, forward?, along?}[], texture: 'fur'|'scales'|null, specular, shininess, glint: rgba|null}`,
  `Shape = {name, bone, material: Material, materialName, blend, kind: 'ellipsoid'|'cone'|'membrane', center?, radii?, from?, to?, radius?: [a, b], points?: [p, p, p], thickness?}`,
  `Decal = {kind: 'eye'|'pixel', bone, at, colours: rgba[], size: [w, h]}`,
  `Frame = {ms, pose: {bone: {rotate: [3], move: [3]}}, flash: boolean}`;
  `poseBones(rig, pose) → Map<bone, {world, inverse}>` (rest model space → posed model space, and back).

- [ ] **Step 1: Write the failing tests**

```js
// packages/vortex-client/tools/monster-art/rig.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {apply} from './vec.mjs';
import {RigError, loadRig, poseBones} from './rig.mjs';

const near = (a, b, eps = 1e-9) => a.every((x, i) => Math.abs(x - b[i]) < eps);
const grey = ['#111111', '#333333', '#555555', '#777777', '#999999'];

function base(extra = {})
{
    return {
        id: 'beast',
        ramps: {grey, pale: grey},
        materials: {fur: {ramp: 'grey', when: [{normalUp: [0.5, 1], ramp: 'pale'}]}},
        bones: {body: {at: [0, 0, 10]}, 'leg.l': {parent: 'body', at: [0, 2, 8]}},
        shapes: [
            {name: 'trunk', bone: 'body', ellipsoid: {center: [0, 0, 10], radii: [6, 4, 4]}, material: 'fur'},
            {name: 'leg', bone: 'leg.l', cone: {from: [0, 2, 8], to: [0, 2, 0], radius: [1.5, 1]}, material: 'fur'},
            {name: 'ear', bone: 'body', mirror: true, cone: {from: [5, 1, 13], to: [5, 1.5, 16], radius: [1, 0.3]}, material: 'fur'}
        ],
        decals: [{kind: 'eye', bone: 'body', at: [6, 1, 11], mirror: true, colours: ['#eeee00', '#000000']}],
        animations: {
            idle: [{ms: 200, pose: {}}],
            walk: [{ms: 100, pose: {'leg.l': {rotate: [10, 20, 30], move: [1, 2, 3]}}}, {ms: 100, pose: {'leg.l': {rotate: [0, 20, 0]}, 'leg.r': {rotate: [0, -20, 0]}}}]
        },
        ...extra
    };
}

const refuses = (json, path) => assert.throws(() => loadRig(json), e => e instanceof RigError && e.path === path, path);

test('a .l bone gets its .r twin; its shapes and the mirror: true ones are mirrored', () =>
{
    const rig = loadRig(base());

    assert.deepEqual(rig.bones.get('leg.r'), {name: 'leg.r', parent: 'body', at: [0, -2, 8]});
    assert.deepEqual(rig.order.indexOf('body') < rig.order.indexOf('leg.r'), true);
    const legs = rig.shapes.filter(s => s.name === 'leg');
    assert.deepEqual(legs.map(s => s.bone), ['leg.l', 'leg.r']);
    assert.deepEqual(legs[1].from, [0, -2, 8]);
    assert.deepEqual(rig.shapes.filter(s => s.name === 'ear').map(s => s.from), [[5, 1, 13], [5, -1, 13]]);
    assert.equal(rig.decals.length, 2);
    assert.deepEqual(rig.decals[1].at, [6, -1, 11]);
    assert.deepEqual(rig.decals[0].colours[0], [238, 238, 0, 255]);
});

test('a pose on a .l bone moves its twin mirrored, unless the frame names the twin', () =>
{
    const rig = loadRig(base());
    const [first, second] = rig.animations.walk;

    assert.deepEqual(first.pose['leg.r'], {rotate: [-10, 20, -30], move: [1, -2, 3]});
    assert.deepEqual(second.pose['leg.r'].rotate, [0, -20, 0]);
});

test('forward kinematics: a parent turning carries its child; the child turns about its own joint', () =>
{
    const rig = loadRig(base());
    const turned = poseBones(rig, {body: {rotate: [0, 0, 90], move: [0, 0, 0]}});

    // (1, 2, 10) is 1 forward, 2 right of the body's joint (0, 0, 10): a quarter turn brings it to (−2, 1, 10).
    assert.ok(near(apply(turned.get('leg.l').world, [1, 2, 10]), [-2, 1, 10]));

    const swung = poseBones(rig, {'leg.l': {rotate: [0, 90, 0], move: [0, 0, 0]}});
    // The foot (0, 2, 0) hangs 8 under the hip (0, 2, 8): swung 90° it points forward, at the hip's height.
    assert.ok(near(apply(swung.get('leg.l').world, [0, 2, 0]), [8, 2, 8]));
    assert.ok(near(apply(swung.get('leg.l').inverse, [8, 2, 8]), [0, 2, 0]));
});

test('validation names the path of the error', () =>
{
    refuses(base({ramps: {grey: grey.slice(0, 4), pale: grey}}), 'ramps.grey');
    const unknownBone = base();
    unknownBone.shapes[0].bone = 'tail';
    refuses(unknownBone, 'shapes[0].bone');
    const twoKinds = base();
    twoKinds.shapes[0].cone = {from: [0, 0, 0], to: [1, 0, 0], radius: [1, 1]};
    refuses(twoKinds, 'shapes[0]');
    const noWalk = base();
    delete noWalk.animations.walk;
    refuses(noWalk, 'animations.walk');
    const badPose = base();
    badPose.animations.idle[0].pose = {wing: {rotate: [0, 0, 0]}};
    refuses(badPose, 'animations.idle[0].pose.wing');
    const badCondition = base();
    badCondition.materials.fur.when[0] = {colour: [0, 1], ramp: 'pale'};
    refuses(badCondition, 'materials.fur.when[0].colour');
    const cycle = base();
    cycle.bones.body.parent = 'leg.l';
    assert.throws(() => loadRig(cycle), /cycle/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test packages/vortex-client/tools/monster-art/rig.test.mjs`
Expected: FAIL, `Cannot find module './rig.mjs'`.

- [ ] **Step 3: Write `rig.mjs`**

```js
// A monster's rig.json: validated, mirrored (one side written, the .l side), and posed. Shapes and
// decals are written in model space at rest and follow their bone: posing a bone moves everything on
// it about its joint. Spec docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md §4.
import {IDENTITY, add, compose, invert, mul, rotation, translation} from './vec.mjs';

export const ANIMATIONS = ['idle', 'walk', 'attack', 'hit', 'death'];

const REQUIRED = ['idle', 'walk'];
const CONDITIONS = ['normalUp', 'normalForward', 'height', 'forward', 'along'];
const TEXTURES = ['fur', 'scales'];
const HEX = /^#[0-9a-fA-F]{6}$/;

export class RigError extends Error
{
    constructor(path, message)
    {
        super(`${path}: ${message}`);
        this.name = 'RigError';
        this.path = path;
    }
}

export const hexToRgba = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];

const check = (condition, path, message) =>
{
    if(!condition) throw new RigError(path, message);
};
const isVec = (x, n = 3) => Array.isArray(x) && x.length === n && x.every(Number.isFinite);
const twinOf = name => (name.endsWith('.l') ? `${name.slice(0, -2)}.r` : null);
const flipS = p => [p[0], -p[1], p[2]];
const mirrored = item => item.mirror === true || (item.mirror !== false && twinOf(item.bone) !== null);

function readMaterials(json, ramps)
{
    const materials = {};

    for(const [name, m] of Object.entries(json.materials ?? {}))
    {
        const path = `materials.${name}`;

        check(m.ramp in ramps, `${path}.ramp`, `unknown ramp "${m.ramp}"`);
        (m.when ?? []).forEach((w, i) =>
        {
            check(w.ramp in ramps, `${path}.when[${i}].ramp`, `unknown ramp "${w.ramp}"`);
            for(const key of Object.keys(w))
            {
                if(key !== 'ramp') check(CONDITIONS.includes(key) && isVec(w[key], 2), `${path}.when[${i}].${key}`, `a condition is one of ${CONDITIONS.join(', ')}, as [min, max]`);
            }
        });
        check(m.texture === undefined || TEXTURES.includes(m.texture), `${path}.texture`, `one of ${TEXTURES.join(', ')}`);
        check(m.glint === undefined || HEX.test(m.glint), `${path}.glint`, 'a colour #rrggbb');
        check(m.specular === undefined || (m.specular >= 0 && m.specular <= 1), `${path}.specular`, 'between 0 and 1');
        materials[name] = {
            ramp: ramps[m.ramp],
            when: (m.when ?? []).map(w => ({...w, ramp: ramps[w.ramp]})),
            texture: m.texture ?? null,
            specular: m.specular ?? 0,
            shininess: m.shininess ?? 30,
            glint: m.glint ? hexToRgba(m.glint) : null
        };
    }

    return materials;
}

function readBones(json)
{
    const bones = new Map();

    for(const [name, b] of Object.entries(json.bones ?? {}))
    {
        check(isVec(b.at), `bones.${name}.at`, 'must be [u, s, v]');
        bones.set(name, {name, parent: b.parent ?? null, at: b.at});
    }
    for(const b of [...bones.values()])
    {
        const twin = twinOf(b.name);

        if(twin && !bones.has(twin)) bones.set(twin, {name: twin, parent: b.parent && (twinOf(b.parent) ?? b.parent), at: flipS(b.at)});
    }
    for(const b of bones.values()) check(b.parent === null || bones.has(b.parent), `bones.${b.name}.parent`, `unknown bone "${b.parent}"`);

    return bones;
}

/** Parents before children; a cycle is an error. */
function boneOrder(bones)
{
    const order = [], state = new Map();
    const visit = (name, trail) =>
    {
        if(state.get(name) === 'done') return;
        check(state.get(name) !== 'visiting', `bones.${name}.parent`, `cycle: ${[...trail, name].join(' → ')}`);
        state.set(name, 'visiting');

        const parent = bones.get(name).parent;

        if(parent) visit(parent, [...trail, name]);
        state.set(name, 'done');
        order.push(name);
    };

    for(const name of bones.keys()) visit(name, []);

    return order;
}

function readShape(s, path, bones, materials)
{
    check(bones.has(s.bone), `${path}.bone`, `unknown bone "${s.bone}"`);
    check(s.material in materials, `${path}.material`, `unknown material "${s.material}"`);

    const kinds = ['ellipsoid', 'cone', 'membrane'].filter(kind => s[kind]);

    check(kinds.length === 1, path, 'needs exactly one of ellipsoid, cone, membrane');

    const shape = {name: s.name ?? path, bone: s.bone, material: materials[s.material], materialName: s.material, blend: s.blend ?? 2};

    check(Number.isFinite(shape.blend) && shape.blend >= 0, `${path}.blend`, 'a number ≥ 0');

    if(s.ellipsoid)
    {
        check(isVec(s.ellipsoid.center), `${path}.ellipsoid.center`, 'must be [u, s, v]');
        check(isVec(s.ellipsoid.radii) && s.ellipsoid.radii.every(r => r > 0), `${path}.ellipsoid.radii`, 'three radii > 0');

        return {...shape, kind: 'ellipsoid', center: s.ellipsoid.center, radii: s.ellipsoid.radii};
    }
    if(s.cone)
    {
        check(isVec(s.cone.from) && isVec(s.cone.to), `${path}.cone`, 'from and to must be [u, s, v]');
        check(isVec(s.cone.radius, 2) && s.cone.radius.every(r => r >= 0), `${path}.cone.radius`, 'two radii ≥ 0');

        return {...shape, kind: 'cone', from: s.cone.from, to: s.cone.to, radius: s.cone.radius};
    }

    check(Array.isArray(s.membrane.points) && s.membrane.points.length === 3 && s.membrane.points.every(p => isVec(p)), `${path}.membrane.points`, 'three points [u, s, v]');
    check(s.membrane.thickness > 0, `${path}.membrane.thickness`, 'a number > 0');

    return {...shape, kind: 'membrane', points: s.membrane.points, thickness: s.membrane.thickness};
}

function mirrorShape(shape)
{
    const twin = {...shape, bone: twinOf(shape.bone) ?? shape.bone};

    if(shape.kind === 'ellipsoid') twin.center = flipS(shape.center);
    if(shape.kind === 'cone') Object.assign(twin, {from: flipS(shape.from), to: flipS(shape.to)});
    if(shape.kind === 'membrane') twin.points = shape.points.map(flipS);

    return twin;
}

function readDecal(d, path, bones)
{
    check(d.kind === 'eye' || d.kind === 'pixel', `${path}.kind`, 'eye or pixel');
    check(bones.has(d.bone), `${path}.bone`, `unknown bone "${d.bone}"`);
    check(isVec(d.at), `${path}.at`, 'must be [u, s, v]');

    const count = d.kind === 'eye' ? 2 : 1;

    check(Array.isArray(d.colours) && d.colours.length === count && d.colours.every(c => HEX.test(c)), `${path}.colours`, `${count} colour(s) #rrggbb`);
    check(d.size === undefined || (isVec(d.size, 2) && d.size.every(n => Number.isInteger(n) && n > 0)), `${path}.size`, '[width, height] in whole pixels');

    return {kind: d.kind, bone: d.bone, at: d.at, colours: d.colours.map(hexToRgba), size: d.size ?? [1, 1]};
}

function readAnimations(json, bones)
{
    const animations = {};

    for(const name of REQUIRED) check(json.animations?.[name], `animations.${name}`, 'is required');
    for(const [name, frames] of Object.entries(json.animations ?? {}))
    {
        check(ANIMATIONS.includes(name), `animations.${name}`, `one of ${ANIMATIONS.join(', ')}`);
        check(Array.isArray(frames) && frames.length > 0, `animations.${name}`, 'a non-empty list of frames');
        animations[name] = frames.map((f, i) =>
        {
            const path = `animations.${name}[${i}]`;
            const pose = {};

            check(Number.isInteger(f.ms) && f.ms > 0, `${path}.ms`, 'a positive whole number of milliseconds');
            for(const [bone, t] of Object.entries(f.pose ?? {}))
            {
                check(bones.has(bone), `${path}.pose.${bone}`, `unknown bone "${bone}"`);
                check(t.rotate === undefined || isVec(t.rotate), `${path}.pose.${bone}.rotate`, 'degrees [u, s, v]');
                check(t.move === undefined || isVec(t.move), `${path}.pose.${bone}.move`, 'must be [u, s, v]');
                pose[bone] = {rotate: t.rotate ?? [0, 0, 0], move: t.move ?? [0, 0, 0]};
            }
            // A pose on a .l bone moves its twin too, mirrored, unless the frame names the twin.
            for(const [bone, t] of Object.entries(pose))
            {
                const twin = twinOf(bone);

                if(twin && !(twin in pose)) pose[twin] = {rotate: [-t.rotate[0], t.rotate[1], -t.rotate[2]], move: flipS(t.move)};
            }

            return {ms: f.ms, pose, flash: f.flash === true};
        });
    }

    return animations;
}

export function loadRig(json)
{
    check(json !== null && typeof json === 'object', 'rig', 'must be an object');
    check(typeof json.id === 'string' && /^[a-z][a-z0-9_]*$/.test(json.id), 'id', 'lower-case letters, digits, _');

    const ramps = {};

    for(const [name, colours] of Object.entries(json.ramps ?? {}))
    {
        check(Array.isArray(colours) && colours.length === 5 && colours.every(c => HEX.test(c)), `ramps.${name}`, 'must be 5 colours #rrggbb, dark to light');
        ramps[name] = colours.map(hexToRgba);
    }

    const materials = readMaterials(json, ramps);
    const bones = readBones(json);
    const order = boneOrder(bones);
    const shapes = [], decals = [];

    (json.shapes ?? []).forEach((s, i) =>
    {
        const shape = readShape(s, `shapes[${i}]`, bones, materials);

        shapes.push(shape);
        if(mirrored(s)) shapes.push(mirrorShape(shape));
    });
    (json.decals ?? []).forEach((d, i) =>
    {
        const decal = readDecal(d, `decals[${i}]`, bones);

        decals.push(decal);
        if(mirrored(d)) decals.push({...decal, bone: twinOf(decal.bone) ?? decal.bone, at: flipS(decal.at)});
    });

    return {id: json.id, ramps, materials, bones, order, shapes, decals, animations: readAnimations(json, bones)};
}

/** Each bone's transform from rest model space to the posed model space, and its inverse. */
export function poseBones(rig, pose = {})
{
    const posed = new Map();

    for(const name of rig.order)
    {
        const bone = rig.bones.get(name), t = pose[name];
        const local = t ? compose(translation(add(bone.at, t.move)), compose(rotation(t.rotate), translation(mul(bone.at, -1)))) : IDENTITY;
        const world = bone.parent ? compose(posed.get(bone.parent).world, local) : local;

        posed.set(name, {world, inverse: invert(world)});
    }

    return posed;
}
```

- [ ] **Step 4: Run the tests**

Run: `node --test packages/vortex-client/tools/monster-art/rig.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Lint**

Run: `node node_modules/eslint/bin/eslint.js packages/vortex-client/tools/monster-art/rig.mjs packages/vortex-client/tools/monster-art/rig.test.mjs`
Expected: no error.

- [ ] **Step 6: Write the refinements into the spec**

In `docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md` §4:
- replace the bullet that starts with `- **Bones** form a tree` by:
  ```markdown
  - **Bones** form a tree (`parent`); `at` is the joint **in model space at rest**. A pose gives a bone
    a `rotate` (degrees about its joint: about `u` first, then `s`, then `v`) and/or a `move` (added to
    its joint). Shapes and decals are written **in model space at rest** and follow their bone.
  ```
- replace the bullet that starts with `- **Mirror**` by:
  ```markdown
  - **Mirror**: a bone named `*.l` gets a `*.r` twin (`s` negated). Shapes and decals on a `*.l` bone
    are mirrored onto the twin unless `"mirror": false`; `"mirror": true` mirrors one on a central bone
    (ears, eyes). A pose on a `*.l` bone moves its twin too, mirrored, unless the frame names the twin.
  ```
- in the **Materials** bullet, make the condition list `normalUp`, `normalForward`, `height`, `forward` (the rest point's `u`), `along`;
- in the **Animations** bullet, add: `A frame may set "flash": true: the hit flash, the whole sprite pale.`;
- in the JSON example, delete the line `"mirror": ["leg.r", "ear.r", "wing.r"],`.

- [ ] **Step 7: Commit**

```bash
git add -- packages/vortex-client/tools/monster-art/rig.mjs packages/vortex-client/tools/monster-art/rig.test.mjs
git commit -m "monstres : outil de dessin, rig (validation, miroir, cinématique)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/tools/monster-art/rig.mjs packages/vortex-client/tools/monster-art/rig.test.mjs docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md
```

---

### Task 3: Passes 1 and 2: form and paint

**Files:**
- Create: `packages/vortex-client/tools/monster-art/form.mjs`
- Create: `packages/vortex-client/tools/monster-art/paint.mjs`
- Test: `packages/vortex-client/tools/monster-art/passes.test.mjs`

**Interfaces:**
- Consumes: Task 1 (`vec`, `projection`, `sdf`), Task 2 (`loadRig`, `poseBones`, rig shapes and materials).
- Produces:
  - `sceneAt(rig, posed, p) → {d, shape, h, rest}` (p in model space);
  - `form(rig, posed, direction, canvas, region) → G`, `G` an array of `canvas.width × canvas.height`, each `null` or `{depth, n, restN, rest, shape, h, ao}`; `canvas = {width, height, anchorX, anchorY, radius}`, `region = {x0, y0, x1, y1}` (pixels, end exclusive);
  - `FLOOR = [152, 151, 104, 255]`, `FLASH = [242, 245, 255, 255]`;
  - `rampFor(g) → rgba[5]`; `texture(kind, g, k) → -1 | 0 | 1`;
  - `paint(G, {flash}) → {img, index, base}`: `img` colours (rgba or null), `index` ramp steps (Int8Array, −1 where empty), `base` the material's mid colour (for the `forme` layer).

- [ ] **Step 1: Write the failing tests**

```js
// packages/vortex-client/tools/monster-art/passes.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadRig, poseBones} from './rig.mjs';
import {form} from './form.mjs';
import {FLASH, paint, rampFor, texture} from './paint.mjs';
import {VIEW} from './projection.mjs';
import {dot, len, sub} from './vec.mjs';

const grey = ['#111111', '#333333', '#555555', '#777777', '#999999'];
const ball = loadRig({
    id: 'ball',
    ramps: {grey, pale: ['#222222', '#444444', '#666666', '#888888', '#aaaaaa']},
    materials: {skin: {ramp: 'grey', when: [{normalUp: [0.7, 1], ramp: 'pale'}]}},
    bones: {body: {at: [0, 0, 5]}},
    shapes: [{name: 'ball', bone: 'body', ellipsoid: {center: [0, 0, 5], radii: [4, 4, 4]}, material: 'skin'}],
    animations: {idle: [{ms: 100}], walk: [{ms: 100}]}
});
const canvas = {width: 20, height: 24, anchorX: 10, anchorY: 18, radius: 12};
const full = {x0: 0, y0: 0, x1: 20, y1: 24};

test('form: the ball is hit at its centre, facing the viewer, on its surface; the corner misses', () =>
{
    const G = form(ball, poseBones(ball, {}), 2, canvas, full);
    // (0, 0, 5) projects 5 px above the anchor: pixel (10, 13).
    const g = G[13 * 20 + 10];

    assert.ok(g, 'centre hit');
    assert.ok(dot(g.n, VIEW) > 0.9);
    assert.ok(Math.abs(len(sub(g.rest, [0, 0, 5])) - 4) < 0.1);
    assert.equal(G[0], null);
});

test('form: only the region is traced', () =>
{
    const G = form(ball, poseBones(ball, {}), 2, canvas, {x0: 0, y0: 0, x1: 10, y1: 24});

    assert.equal(G[13 * 20 + 10], null);
    assert.ok(G[13 * 20 + 9]);
});

test('paint: the side toward the light is lighter; the top takes the "when" ramp; flash paints all pale', () =>
{
    const G = form(ball, poseBones(ball, {}), 2, canvas, full);
    const {img, index, base} = paint(G);
    const lit = index[11 * 20 + 8], shaded = index[15 * 20 + 12];

    assert.ok(lit > shaded, `lit ${lit} > shaded ${shaded}`);
    assert.deepEqual(base[13 * 20 + 10], ball.materials.skin.ramp[2]);
    assert.equal(img[0], null);
    assert.ok(paint(G, {flash: true}).img.filter(Boolean).every(c => c === FLASH));
});

test('rampFor: the first matching rule wins, else the material ramp', () =>
{
    const m = ball.materials.skin;
    const at = restN => ({restN, rest: [0, 0, 0], h: 0, shape: {material: m}});

    assert.equal(rampFor(at([0, 0, 1])), ball.ramps.pale);
    assert.equal(rampFor(at([0, 0, -1])), ball.ramps.grey);
});

test('texture: only mid tones move, by one step', () =>
{
    const g = {rest: [1, 2, 3], restN: [0, 0, 1]};

    assert.equal(texture('fur', g, 0), 0);
    assert.equal(texture('scales', g, 4), 0);
    assert.equal(texture(null, g, 2), 0);
    for(let u = 0; u < 20; u++) assert.ok([-1, 0, 1].includes(texture('scales', {rest: [u, 0.4, u * 0.3], restN: [0, 0, 1]}, 2)));
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test packages/vortex-client/tools/monster-art/passes.test.mjs`
Expected: FAIL, `Cannot find module './form.mjs'`.

- [ ] **Step 3: Write `form.mjs`**

```js
// Pass 1, form: one ray per pixel toward the posed rig; what each pixel sees (depth, normals, which
// shape and where on it at rest, ambient occlusion). Everything after works from this buffer.
import {add, apply, clamp, dot, mul, norm, rotate, sub} from './vec.mjs';
import {VIEW, heading, unproject, worldToModel} from './projection.mjs';
import {ellipsoid, roundCone, smin, triangle} from './sdf.mjs';

/** Distance from a model-space point to the posed rig; the nearest shape and the point in its bone's rest space. */
export function sceneAt(rig, posed, p)
{
    let d = Infinity, best = Infinity, shape = null, h = 0, rest = null;
    const restOf = new Map();

    for(const s of rig.shapes)
    {
        let q = restOf.get(s.bone);

        if(!q)
        {
            q = apply(posed.get(s.bone).inverse, p);
            restOf.set(s.bone, q);
        }

        let di, hi = 0;

        if(s.kind === 'ellipsoid') di = ellipsoid(q, s.center, s.radii);
        else if(s.kind === 'cone') ({d: di, h: hi} = roundCone(q, s.from, s.to, s.radius[0], s.radius[1]));
        else di = triangle(q, s.points[0], s.points[1], s.points[2], s.thickness);

        d = d === Infinity ? di : smin(d, di, s.blend);
        if(di < best)
        {
            best = di;
            shape = s;
            h = hi;
            rest = q;
        }
    }

    return {d, shape, h, rest};
}

const STEPS = 160, HIT = 0.02, EPSILON = 0.05;

export function form(rig, posed, direction, canvas, region)
{
    const hd = heading(direction);
    const sdf = p => sceneAt(rig, posed, worldToModel(hd, p));
    const {width, height, anchorX, anchorY, radius} = canvas;
    const G = new Array(width * height).fill(null);

    for(let y = region.y0; y < region.y1; y++)
    {
        for(let x = region.x0; x < region.x1; x++)
        {
            const origin = unproject(x + 0.5 - anchorX, y + 0.5 - anchorY);
            let t = radius, hit = null;

            for(let i = 0; i < STEPS && t > -radius; i++)
            {
                const p = add(origin, mul(VIEW, t)), s = sdf(p);

                if(s.d < HIT)
                {
                    hit = {p, s};
                    break;
                }
                t -= Math.max(s.d * 0.9, HIT);
            }

            // Under the floor is not drawn: a foot sunk by a pose is cut at the floor line.
            if(!hit || hit.p[2] < -0.5) continue;

            const p = hit.p;
            const n = norm([
                sdf(add(p, [EPSILON, 0, 0])).d - sdf(sub(p, [EPSILON, 0, 0])).d,
                sdf(add(p, [0, EPSILON, 0])).d - sdf(sub(p, [0, EPSILON, 0])).d,
                sdf(add(p, [0, 0, EPSILON])).d - sdf(sub(p, [0, 0, EPSILON])).d
            ]);
            // Ambient occlusion: how hemmed in the surface is a few pixels out along its normal.
            let ao = 0;

            for(let k = 1; k <= 4; k++)
            {
                const dist = k * 1.4;
                ao += (dist - sdf(add(p, mul(n, dist))).d) / 2 ** k;
            }

            const restN = rotate(posed.get(hit.s.shape.bone).inverse, worldToModel(hd, n));

            G[y * width + x] = {depth: dot(p, VIEW), n, restN, rest: hit.s.rest, shape: hit.s.shape, h: hit.s.h, ao: clamp(ao * 0.35, 0, 1)};
        }
    }

    return G;
}
```

- [ ] **Step 4: Write `paint.mjs`**

```js
// Pass 2, paint: each pixel's ramp step from Habbo's light, ambient occlusion and the floor's bounce;
// glints on shiny materials; textures as clusters (a mid tone moved one step), never noise.
import {add, clamp, dot, norm} from './vec.mjs';
import {LIGHT, VIEW} from './projection.mjs';

export const FLOOR = [152, 151, 104, 255];
export const FLASH = [242, 245, 255, 255];

const HALF = norm(add(LIGHT, VIEW));
const within = (x, [lo, hi]) => x >= lo && x <= hi;
const frac = x => x - Math.floor(x);
const hash = (i, j) => frac(Math.sin(i * 127.1 + j * 311.7) * 43758.5453);
const mixColour = (a, b, t) => [0, 1, 2].map(c => Math.round(a[c] + (b[c] - a[c]) * t)).concat(255);

/** The ramp a surface point takes: its material's first matching rule, else the material's ramp. */
export function rampFor(g)
{
    const m = g.shape.material;

    for(const w of m.when)
    {
        if(w.normalUp && !within(g.restN[2], w.normalUp)) continue;
        if(w.normalForward && !within(g.restN[0], w.normalForward)) continue;
        if(w.height && !within(g.rest[2], w.height)) continue;
        if(w.forward && !within(g.rest[0], w.forward)) continue;
        if(w.along && !within(g.h, w.along)) continue;

        return w.ramp;
    }

    return m.ramp;
}

/** -1, 0 or +1 ramp step on the texture's pattern, at rest so the pattern does not swim when posed. */
export function texture(kind, g, k)
{
    if(!kind || k === 0 || k === 4) return 0;

    const [u, s, v] = g.rest;

    if(kind === 'scales')
    {
        // Small staggered scales: a lit bead on the light side, a dark bead in shadow; none underneath.
        if(g.restN[2] < -0.25) return 0;

        const b = v + Math.abs(s) * 0.5, row = Math.floor(b / 1.8), a = u + (row & 1) * 1.25;

        return frac(a / 2.5) < 0.4 && frac(b / 1.8) > 0.5 ? (k >= 2 ? 1 : -1) : 0;
    }

    // Fur: long, sparse strands along the body.
    const j = Math.floor(v * 0.7 + Math.abs(s) * 0.5), t = (u + j * 2.3) / 5;

    return hash(Math.floor(t), j) < 0.22 && frac(t) < 0.75 ? -1 : 0;
}

export function paint(G, {flash = false} = {})
{
    const img = new Array(G.length).fill(null), index = new Int8Array(G.length).fill(-1), base = new Array(G.length).fill(null);

    for(let i = 0; i < G.length; i++)
    {
        const g = G[i];

        if(!g) continue;

        const m = g.shape.material, ramp = rampFor(g);

        base[i] = m.ramp[2];
        if(flash)
        {
            img[i] = FLASH;
            index[i] = 4;
            continue;
        }

        const light = 0.36 + 0.82 * Math.max(0, dot(g.n, LIGHT)) - 0.45 * g.ao;
        // The floor lights the undersides a little, with its own colour.
        const bounce = Math.max(0, -g.n[2]) * (1 - g.ao);
        let k = Math.floor(clamp((light + bounce * 0.18) * 5, 0, 4.999));

        k = clamp(k + texture(m.texture, g, k), 0, 4);

        const glint = Math.pow(Math.max(0, dot(g.n, HALF)), m.shininess) * m.specular > 0.55;
        let colour = glint ? (m.glint ?? ramp[4]) : ramp[k];

        if(!glint && bounce > 0.35 && k <= 1) colour = mixColour(colour, FLOOR, 0.22);
        img[i] = colour;
        index[i] = k;
    }

    return {img, index, base};
}
```

- [ ] **Step 5: Run the tests**

Run: `node --test packages/vortex-client/tools/monster-art/passes.test.mjs`
Expected: PASS, 5 tests. If `paint: the side toward the light is lighter` fails on its pixel picks, print `index` around the centre and choose a pixel up-left (lit) and down-right (shaded) of (10, 13) that are inside the ball; the assertion itself must stay.

- [ ] **Step 6: Lint and commit**

```bash
node node_modules/eslint/bin/eslint.js packages/vortex-client/tools/monster-art/form.mjs packages/vortex-client/tools/monster-art/paint.mjs packages/vortex-client/tools/monster-art/passes.test.mjs
git add -- packages/vortex-client/tools/monster-art/form.mjs packages/vortex-client/tools/monster-art/paint.mjs packages/vortex-client/tools/monster-art/passes.test.mjs
git commit -m "monstres : outil de dessin, passes forme et peinture

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/tools/monster-art/form.mjs packages/vortex-client/tools/monster-art/paint.mjs packages/vortex-client/tools/monster-art/passes.test.mjs
```

---

### Task 4: Passes 3 and 4, and a whole frame

**Files:**
- Create: `packages/vortex-client/tools/monster-art/details.mjs`
- Create: `packages/vortex-client/tools/monster-art/finish.mjs`
- Create: `packages/vortex-client/tools/monster-art/render.mjs`
- Test: `packages/vortex-client/tools/monster-art/render.test.mjs`
- Create (by the test's first run): `packages/vortex-client/tools/monster-art/__snapshots__/tiny.sha1`

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces:
  - `details(rig, posed, direction, G, img, canvas) → Set<number>` (pixels it painted; mutates `img`);
  - `finish(G, img, index, locked, canvas) → colours[]`;
  - `spheres(rig, posed) → {c, r}[]` (model space); `canvasFor(rig) → {width, height, anchorX, anchorY, radius}`;
  - `frameList(rig) → {direction, animation, index, frame}[]` (directions 0-7, then `ANIMATIONS` order);
  - `renderFrame(rig, canvas, direction, frame) → {forme, peinture, details, finition, final}`, each a `Buffer` of `width × height × 4` RGBA;
  - `rgba(colours, width, height) → Buffer`.

- [ ] **Step 1: Write the failing tests**

```js
// packages/vortex-client/tools/monster-art/render.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRig} from './rig.mjs';
import {canvasFor, frameList, renderFrame} from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const grey = ['#20202a', '#40404e', '#606070', '#808090', '#a0a0b0'];
const tiny = loadRig({
    id: 'tiny',
    ramps: {grey, cream: ['#504838', '#786c58', '#a09078', '#c8b8a0', '#e8dcc8']},
    materials: {
        skin: {ramp: 'grey', when: [{normalUp: [-1, -0.5], ramp: 'cream'}], specular: 0.4},
        horn: {ramp: 'cream', specular: 1, shininess: 12, glint: '#ffffff'}
    },
    bones: {body: {at: [0, 0, 8]}, head: {parent: 'body', at: [6, 0, 10]}},
    shapes: [
        {name: 'trunk', bone: 'body', ellipsoid: {center: [0, 0, 8], radii: [7, 4.5, 5]}, material: 'skin', blend: 0},
        {name: 'skull', bone: 'head', ellipsoid: {center: [9, 0, 13], radii: [3.5, 3, 3]}, material: 'skin'},
        {name: 'horn', bone: 'head', mirror: true, cone: {from: [8, 1.5, 15.5], to: [6, 2, 19], radius: [1, 0.2]}, material: 'horn', blend: 0.3}
    ],
    decals: [{kind: 'eye', bone: 'head', at: [11.6, 1.6, 13.6], mirror: true, colours: ['#ffcc00', '#000000']}],
    animations: {
        idle: [{ms: 200}],
        walk: [{ms: 100, pose: {body: {move: [0, 0, 3]}}}, {ms: 100, pose: {head: {rotate: [0, 30, 0]}}}],
        hit: [{ms: 90, flash: true}]
    }
});
const canvas = canvasFor(tiny);
const opaque = (buf, i) => buf[i * 4 + 3] > 0;
const yellow = buf => Array.from({length: buf.length / 4}, (_, i) => i).filter(i => buf[i * 4] === 0xff && buf[i * 4 + 1] === 0xcc && buf[i * 4 + 2] === 0).length;

test('frameList: 8 directions × every frame of every animation, directions first', () =>
{
    const list = frameList(tiny);

    assert.equal(list.length, 8 * 4);
    assert.deepEqual(list.slice(0, 4).map(f => `${f.animation}${f.index}`), ['idle0', 'walk0', 'walk1', 'hit0']);
    assert.equal(list[4].direction, 1);
});

test('no frame touches the canvas edge, the raised walk pose included', () =>
{
    for(const f of frameList(tiny))
    {
        const {final} = renderFrame(tiny, canvas, f.direction, f.frame);

        for(let y = 0; y < canvas.height; y++)
        {
            for(let x = 0; x < canvas.width; x++)
            {
                if(x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) assert.ok(!opaque(final, y * canvas.width + x), `${f.animation}${f.index} dir ${f.direction} at (${x}, ${y})`);
            }
        }
    }
});

test('the layers stack into the final image; forme is the flat silhouette', () =>
{
    const frame = tiny.animations.idle[0];
    const l = renderFrame(tiny, canvas, 2, frame);

    for(let i = 0; i < canvas.width * canvas.height; i++)
    {
        const top = [l.finition, l.details, l.peinture].find(layer => opaque(layer, i));
        const expected = top ? [...top.subarray(i * 4, i * 4 + 4)] : [0, 0, 0, 0];

        assert.deepEqual([...l.final.subarray(i * 4, i * 4 + 4)], expected, `pixel ${i}`);
        if(opaque(l.peinture, i)) assert.ok(opaque(l.forme, i));
    }
});

test('the eyes show from the front (direction 3), not from behind (7); a flash frame is pale', () =>
{
    assert.ok(yellow(renderFrame(tiny, canvas, 3, tiny.animations.idle[0]).final) > 0);
    assert.equal(yellow(renderFrame(tiny, canvas, 7, tiny.animations.idle[0]).final), 0);

    const flash = renderFrame(tiny, canvas, 2, tiny.animations.hit[0]).peinture;
    assert.ok([...flash].some((v, i) => i % 4 === 0 && v === 242));
});

test('snapshot: the idle frame from direction 2 is unchanged', () =>
{
    const file = join(HERE, '__snapshots__', 'tiny.sha1');
    const hash = createHash('sha1').update(renderFrame(tiny, canvas, 2, tiny.animations.idle[0]).final).digest('hex');

    // First run records it (commit the file); later runs compare. A deliberate change of a pass: delete the file and look at the preview.
    if(!existsSync(file))
    {
        mkdirSync(dirname(file), {recursive: true});
        writeFileSync(file, `${hash}\n`);
    }
    assert.equal(hash, readFileSync(file, 'utf8').trim());
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test packages/vortex-client/tools/monster-art/render.test.mjs`
Expected: FAIL, `Cannot find module './render.mjs'`.

- [ ] **Step 3: Write `details.mjs`**

```js
// Pass 3, details: the rig's decals (eyes, nose, claws…) where the surface at their pixel is them
// and faces the camera, so an eye on the far side of the head is never painted.
import {add, apply, dot} from './vec.mjs';
import {VIEW, heading, modelToWorld, project} from './projection.mjs';

export function details(rig, posed, direction, G, img, canvas)
{
    const hd = heading(direction), {width, height, anchorX, anchorY} = canvas, painted = new Set();
    const toWorld = (bone, at) => modelToWorld(hd, apply(posed.get(bone).world, at));
    const locate = (bone, at) =>
    {
        const world = toWorld(bone, at), [sx, sy] = project(world);
        const x = Math.floor(sx + anchorX), y = Math.floor(sy + anchorY);

        if(x < 0 || y < 0 || x >= width || y >= height) return null;

        const g = G[y * width + x];

        return g && Math.abs(g.depth - dot(world, VIEW)) < 1.6 && dot(g.n, VIEW) > 0.15 ? {x, y, fx: sx + anchorX} : null;
    };
    const put = (x, y, colour) =>
    {
        const i = y * width + x;

        if(x >= 0 && y >= 0 && x < width && y < height && img[i])
        {
            img[i] = colour;
            painted.add(i);
        }
    };

    for(const d of rig.decals)
    {
        const at = locate(d.bone, d.at);

        if(!at) continue;
        if(d.kind === 'eye')
        {
            put(at.x, at.y, d.colours[0]);
            // The pupil sits on the side the head looks to; looking at the viewer, the iris alone.
            const [ax] = project(toWorld(d.bone, add(d.at, [1, 0, 0])));
            const side = ax + anchorX > at.fx + 0.3 ? 1 : ax + anchorX < at.fx - 0.3 ? -1 : 0;

            if(side) put(at.x + side, at.y, d.colours[1]);
            continue;
        }
        for(let dy = 0; dy < d.size[1]; dy++)
        {
            for(let dx = 0; dx < d.size[0]; dx++) put(at.x + dx, at.y - dy, d.colours[0]);
        }
    }

    return painted;
}
```

- [ ] **Step 4: Write `finish.mjs`**

```js
// Pass 4, finish: what makes a 3D render read as drawn pixel art. Interior lines where a near part
// covers a far one; crests lightened and creases darkened; a rim of back light on the silhouette; the
// selective outline; lone pixels removed. Decal pixels are never touched.
import {clamp, dot} from './vec.mjs';
import {BACK_LIGHT, LIGHT} from './projection.mjs';
import {rampFor} from './paint.mjs';

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function finish(G, img, index, locked, canvas)
{
    const {width: W, height: H} = canvas;
    const out = img.slice();
    const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? y * W + x : -1);

    // Interior lines: the far pixel next to a nearer, different shape takes its ramp's darkest.
    for(let y = 0; y < H; y++)
    {
        for(let x = 0; x < W; x++)
        {
            const i = y * W + x, g = G[i];

            if(!g || locked.has(i)) continue;
            for(const [dx, dy] of N4)
            {
                const j = at(x + dx, y + dy), q = j < 0 ? null : G[j];

                if(q && q.depth - g.depth > 2.2 && q.shape !== g.shape)
                {
                    out[i] = rampFor(g)[0];
                    break;
                }
            }
        }
    }

    // Crests (nearer than a neighbour that turns away) +1, creases −1; silhouette pixels facing the back light +1.
    for(let y = 1; y < H - 1; y++)
    {
        for(let x = 1; x < W - 1; x++)
        {
            const i = y * W + x, g = G[i];

            if(!g || locked.has(i) || out[i] !== img[i]) continue;

            const ramp = rampFor(g), k = index[i];

            // Glints, the floor's bounce tint and the flash are left as painted.
            if(img[i] !== ramp[k]) continue;

            let edge = 0, silhouette = false;

            for(const [dx, dy] of N4)
            {
                const q = G[(y + dy) * W + x + dx];

                if(!q)
                {
                    silhouette = true;
                    continue;
                }
                if(1 - dot(g.n, q.n) > 0.3) edge += g.depth > q.depth + 0.15 ? 1 : g.depth < q.depth - 0.15 ? -1 : 0;
            }

            let kk = k + Math.sign(edge);

            if(silhouette && dot(g.n, BACK_LIGHT) > 0.2) kk = Math.max(kk, k + 1);
            kk = clamp(kk, 0, 4);
            if(kk !== k) out[i] = ramp[kk];
        }
    }

    // Outline: an empty pixel touching the shape takes the darkest of its brightest neighbour's ramp,
    // one step lighter where that neighbour is lit.
    for(let y = 0; y < H; y++)
    {
        for(let x = 0; x < W; x++)
        {
            const i = y * W + x;

            if(img[i]) continue;

            let best = -1;

            for(const [dx, dy] of N4)
            {
                const j = at(x + dx, y + dy);

                if(j >= 0 && img[j] && (best < 0 || index[j] > index[best])) best = j;
            }
            if(best < 0) continue;

            const g = G[best], ramp = rampFor(g);

            out[i] = index[best] >= 3 && dot(g.n, LIGHT) > 0.45 ? ramp[1] : ramp[0];
        }
    }

    // Cleanup: a lone pixel whose four neighbours agree takes their colour.
    const before = out.slice();

    for(let y = 1; y < H - 1; y++)
    {
        for(let x = 1; x < W - 1; x++)
        {
            const i = y * W + x, c = before[i];

            if(!c || locked.has(i)) continue;

            const ns = N4.map(([dx, dy]) => before[(y + dy) * W + x + dx]);

            if(ns.every(n => n && n === ns[0]) && ns[0] !== c) out[i] = ns[0];
        }
    }

    return out;
}
```

- [ ] **Step 5: Write `render.mjs`**

```js
// One frame of a monster: the four passes, as four RGBA layers and the flattened image; and the
// canvas that holds every frame from every direction.
import {add, apply, len, mul, sub} from './vec.mjs';
import {SPREAD, heading, modelToWorld, project} from './projection.mjs';
import {ANIMATIONS, poseBones} from './rig.mjs';
import {form} from './form.mjs';
import {paint} from './paint.mjs';
import {details} from './details.mjs';
import {finish} from './finish.mjs';

/** Bounding spheres of the posed shapes, in model space. */
export function spheres(rig, posed)
{
    return rig.shapes.map(s =>
    {
        const m = posed.get(s.bone).world;

        if(s.kind === 'ellipsoid') return {c: apply(m, s.center), r: Math.max(...s.radii)};
        if(s.kind === 'cone')
        {
            const a = apply(m, s.from), b = apply(m, s.to);

            return {c: mul(add(a, b), 0.5), r: len(sub(a, b)) / 2 + Math.max(...s.radius)};
        }

        const pts = s.points.map(p => apply(m, p)), c = mul(add(add(pts[0], pts[1]), pts[2]), 1 / 3);

        return {c, r: Math.max(...pts.map(p => len(sub(p, c)))) + s.thickness};
    });
}

/** The screen box (relative to the anchor) of a posed rig seen from a direction. */
function box(list, direction)
{
    const hd = heading(direction);
    const b = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};

    for(const {c, r} of list)
    {
        const [sx, sy] = project(modelToWorld(hd, c)), e = r * SPREAD;

        b.x0 = Math.min(b.x0, sx - e);
        b.y0 = Math.min(b.y0, sy - e);
        b.x1 = Math.max(b.x1, sx + e);
        b.y1 = Math.max(b.y1, sy + e);
    }

    return b;
}

/** Every frame of the monster in build order: direction 0 to 7, then the animations in ANIMATIONS order. */
export function frameList(rig)
{
    const list = [];

    for(let direction = 0; direction < 8; direction++)
    {
        for(const animation of ANIMATIONS)
        {
            (rig.animations[animation] ?? []).forEach((frame, index) => list.push({direction, animation, index, frame}));
        }
    }

    return list;
}

/** One canvas for the whole monster (every frame, every direction, plus 2 px); the anchor is where the origin lands. */
export function canvasFor(rig)
{
    const all = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};
    let radius = 0;

    for(const frames of Object.values(rig.animations))
    {
        for(const frame of frames)
        {
            const list = spheres(rig, poseBones(rig, frame.pose));

            for(const {c, r} of list) radius = Math.max(radius, len(c) + r);
            for(let direction = 0; direction < 8; direction++)
            {
                const b = box(list, direction);

                all.x0 = Math.min(all.x0, b.x0);
                all.y0 = Math.min(all.y0, b.y0);
                all.x1 = Math.max(all.x1, b.x1);
                all.y1 = Math.max(all.y1, b.y1);
            }
        }
    }

    const left = Math.floor(all.x0) - 2, top = Math.floor(all.y0) - 2;

    return {width: Math.ceil(all.x1) + 2 - left, height: Math.ceil(all.y1) + 2 - top, anchorX: -left, anchorY: -top, radius: radius + 2};
}

export function rgba(colours, width, height)
{
    const buf = Buffer.alloc(width * height * 4);

    colours.forEach((c, i) =>
    {
        if(c) buf.set(c, i * 4);
    });

    return buf;
}

export function renderFrame(rig, canvas, direction, frame)
{
    const {width, height, anchorX, anchorY} = canvas;
    const posed = poseBones(rig, frame.pose);
    // Trace only this pose's box (one pixel wider for the outline).
    const b = box(spheres(rig, posed), direction);
    const region = {
        x0: Math.max(0, Math.floor(b.x0 + anchorX) - 1), y0: Math.max(0, Math.floor(b.y0 + anchorY) - 1),
        x1: Math.min(width, Math.ceil(b.x1 + anchorX) + 1), y1: Math.min(height, Math.ceil(b.y1 + anchorY) + 1)
    };
    const G = form(rig, posed, direction, canvas, region);
    const {img, index, base} = paint(G, {flash: frame.flash});
    const painted = img.slice();
    const locked = details(rig, posed, direction, G, img, canvas);
    const detailed = img.slice();
    const final = finish(G, img, index, locked, canvas);

    return {
        forme: rgba(base, width, height),
        peinture: rgba(painted, width, height),
        details: rgba(detailed.map((c, i) => (c !== painted[i] ? c : null)), width, height),
        finition: rgba(final.map((c, i) => (c !== detailed[i] ? c : null)), width, height),
        final: rgba(final, width, height)
    };
}
```

- [ ] **Step 6: Run the tests**

Run: `node --test packages/vortex-client/tools/monster-art/render.test.mjs`
Expected: PASS, 5 tests; `__snapshots__/tiny.sha1` is created. Run it a second time: still PASS (the snapshot now compares).

- [ ] **Step 7: Lint and commit**

```bash
node node_modules/eslint/bin/eslint.js packages/vortex-client/tools/monster-art/details.mjs packages/vortex-client/tools/monster-art/finish.mjs packages/vortex-client/tools/monster-art/render.mjs packages/vortex-client/tools/monster-art/render.test.mjs
git add -- packages/vortex-client/tools/monster-art/details.mjs packages/vortex-client/tools/monster-art/finish.mjs packages/vortex-client/tools/monster-art/render.mjs packages/vortex-client/tools/monster-art/render.test.mjs packages/vortex-client/tools/monster-art/__snapshots__/tiny.sha1
git commit -m "monstres : outil de dessin, passes détails et finition, rendu d'une frame

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/tools/monster-art/details.mjs packages/vortex-client/tools/monster-art/finish.mjs packages/vortex-client/tools/monster-art/render.mjs packages/vortex-client/tools/monster-art/render.test.mjs packages/vortex-client/tools/monster-art/__snapshots__/tiny.sha1
```

---

### Task 5: `.aseprite` with several layers

**Files:**
- Modify: `packages/vortex-client/tools/lib/aseprite.mjs` (whole file replaced below)
- Test: `packages/vortex-client/tools/lib/aseprite.test.mjs` (new)
- Keep green: `packages/vortex-client/tools/build-monsters.test.mjs` (uses the single-layer API)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `readAsepriteLayers(buffer) → {width, height, layers: {name, visible, image}[], frames: {duration, cels: (Buffer|null)[]}[], tags: {name, from, to}[]}`: each cel a full-canvas RGBA buffer (straight alpha) or `null`;
  - `readAseprite(buffer) → {width, height, frames: {duration, data}[], tags}` (unchanged: visible image layers composited);
  - `writeAseprite({width, height, frames, tags, layer})` (unchanged single layer: `frames[i].data`) **or** `writeAseprite({width, height, layers: {name, visible}[], frames: {duration, cels: (Buffer|null)[]}[], tags})`.

- [ ] **Step 1: Write the failing tests**

```js
// packages/vortex-client/tools/lib/aseprite.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readAseprite, readAsepriteLayers, writeAseprite} from './aseprite.mjs';

const W = 4, H = 3;
const pixel = (x, y, colour) =>
{
    const b = Buffer.alloc(W * H * 4);

    b.writeUInt32BE(colour, (y * W + x) * 4);
    return b;
};

test('several layers round-trip, hidden ones too; the flattened image shows the visible ones in order', () =>
{
    const buffer = writeAseprite({
        width: W, height: H,
        layers: [{name: 'forme', visible: false}, {name: 'peinture', visible: true}, {name: 'retouche', visible: true}],
        frames: [{duration: 120, cels: [pixel(0, 0, 0xff0000ff), pixel(1, 1, 0x00ff00ff), pixel(1, 1, 0x0000ffff)]}, {duration: 80, cels: [null, pixel(2, 2, 0x00ff00ff), null]}],
        tags: [{name: 'idle_0', from: 0, to: 1}]
    });
    const layered = readAsepriteLayers(buffer);

    assert.deepEqual(layered.layers.map(l => [l.name, l.visible]), [['forme', false], ['peinture', true], ['retouche', true]]);
    assert.equal(layered.frames[0].cels[0].readUInt32BE(0), 0xff0000ff);
    assert.equal(layered.frames[1].cels[2], null);
    assert.deepEqual(layered.tags, [{name: 'idle_0', from: 0, to: 1}]);

    const flat = readAseprite(buffer);

    assert.equal(flat.frames[0].data.readUInt32BE(0), 0, 'the hidden layer is not flattened');
    assert.equal(flat.frames[0].data.readUInt32BE((1 * W + 1) * 4), 0x0000ffff, 'the upper layer wins');
    assert.equal(flat.frames[1].duration, 80);
});

test('a file with chunks the reader does not know (as Aseprite writes them) still reads', () =>
{
    const original = writeAseprite({width: W, height: H, frames: [{duration: 100, data: pixel(3, 0, 0x123456ff)}]});
    // A colour profile chunk (0x2007) inserted at the start of frame 0.
    const chunk = Buffer.alloc(6 + 16);

    chunk.writeUInt32LE(chunk.length, 0);
    chunk.writeUInt16LE(0x2007, 4);

    const frameHeader = Buffer.from(original.subarray(128, 144));

    frameHeader.writeUInt32LE(frameHeader.readUInt32LE(0) + chunk.length, 0);
    frameHeader.writeUInt16LE(frameHeader.readUInt16LE(6) + 1, 6);
    frameHeader.writeUInt32LE(frameHeader.readUInt32LE(12) + 1, 12);

    const patched = Buffer.concat([original.subarray(0, 128), frameHeader, chunk, original.subarray(144)]);

    patched.writeUInt32LE(patched.length, 0);
    assert.equal(readAseprite(patched).frames[0].data.readUInt32BE(3 * 4), 0x123456ff);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test packages/vortex-client/tools/lib/aseprite.test.mjs`
Expected: FAIL, `readAsepriteLayers` is not exported.

- [ ] **Step 3: Replace `packages/vortex-client/tools/lib/aseprite.mjs`**

```js
// Reads and writes .aseprite files: what the monster tools need, no more
// (https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md). Image layers only (no
// tilemaps, no blend modes: "normal"); chunks it does not know are skipped, so files saved by Aseprite
// read. readAsepriteLayers keeps the layers apart; readAseprite flattens the visible ones.
import {deflateSync, inflateSync} from 'node:zlib';

const CHUNK_LAYER = 0x2004, CHUNK_CEL = 0x2005, CHUNK_TAGS = 0x2018, CHUNK_PALETTE = 0x2019;

function parse(buffer)
{
    if(buffer.readUInt16LE(4) !== 0xA5E0) throw new Error('not an .aseprite file (bad magic)');

    const frameCount = buffer.readUInt16LE(6), width = buffer.readUInt16LE(8), height = buffer.readUInt16LE(10);
    const depth = buffer.readUInt16LE(12), transparentIndex = buffer.readUInt8(28);

    if(depth !== 32 && depth !== 16 && depth !== 8) throw new Error(`unsupported colour depth ${depth}`);

    const layers = [], tags = [], frames = [], palette = [];
    const string = at => [buffer.toString('utf8', at + 2, at + 2 + buffer.readUInt16LE(at)), at + 2 + buffer.readUInt16LE(at)];
    let offset = 128;

    for(let f = 0; f < frameCount; f++)
    {
        const frameBytes = buffer.readUInt32LE(offset);
        const oldChunks = buffer.readUInt16LE(offset + 6), duration = buffer.readUInt16LE(offset + 8);
        const chunkCount = buffer.readUInt32LE(offset + 12) || oldChunks;
        const cels = [];
        let at = offset + 16;

        for(let c = 0; c < chunkCount; c++)
        {
            const size = buffer.readUInt32LE(at), type = buffer.readUInt16LE(at + 4), body = at + 6;

            if(type === CHUNK_LAYER)
            {
                const flags = buffer.readUInt16LE(body), layerType = buffer.readUInt16LE(body + 2);

                layers.push({name: string(body + 16)[0], visible: (flags & 1) !== 0, image: layerType === 0, opacity: buffer.readUInt8(body + 12)});
            }
            else if(type === CHUNK_CEL)
            {
                const layer = buffer.readUInt16LE(body), x = buffer.readInt16LE(body + 2), y = buffer.readInt16LE(body + 4);
                const opacity = buffer.readUInt8(body + 6), celType = buffer.readUInt16LE(body + 7), data = body + 16;

                if(celType === 0 || celType === 2)
                {
                    const w = buffer.readUInt16LE(data), h = buffer.readUInt16LE(data + 2), raw = buffer.subarray(data + 4, at + size);

                    cels.push({layer, x, y, opacity, w, h, pixels: celType === 2 ? inflateSync(raw) : raw});
                }
                else if(celType === 1)
                {
                    const linked = frames[buffer.readUInt16LE(data)]?.cels.find(cel => cel.layer === layer);

                    if(linked) cels.push({...linked, x, y, opacity});
                }
            }
            else if(type === CHUNK_TAGS)
            {
                let tag = body + 10;

                for(let t = buffer.readUInt16LE(body); t > 0; t--)
                {
                    const [name, next] = string(tag + 17);

                    tags.push({name, from: buffer.readUInt16LE(tag), to: buffer.readUInt16LE(tag + 2)});
                    tag = next;
                }
            }
            else if(type === CHUNK_PALETTE)
            {
                let entry = body + 20;

                for(let i = buffer.readUInt32LE(body + 4); i <= buffer.readUInt32LE(body + 8); i++)
                {
                    const hasName = buffer.readUInt16LE(entry) & 1;

                    palette[i] = [buffer[entry + 2], buffer[entry + 3], buffer[entry + 4], buffer[entry + 5]];
                    entry += 6;
                    if(hasName) entry = string(entry)[1];
                }
            }

            at += size;
        }

        frames.push({duration, cels});
        offset += frameBytes;
    }

    const colourOf = (cel, i) =>
    {
        if(depth === 32) return [cel.pixels[i * 4], cel.pixels[i * 4 + 1], cel.pixels[i * 4 + 2], cel.pixels[i * 4 + 3]];
        if(depth === 16) return [cel.pixels[i * 2], cel.pixels[i * 2], cel.pixels[i * 2], cel.pixels[i * 2 + 1]];

        const index = cel.pixels[i];

        return index === transparentIndex ? [0, 0, 0, 0] : (palette[index] ?? [0, 0, 0, 0]);
    };

    return {width, height, layers, frames, tags, colourOf};
}

/** A cel spread over the whole canvas, RGBA straight alpha. */
function celCanvas(file, cel)
{
    const out = Buffer.alloc(file.width * file.height * 4);

    for(let cy = 0; cy < cel.h; cy++)
    {
        for(let cx = 0; cx < cel.w; cx++)
        {
            const px = cel.x + cx, py = cel.y + cy;

            if(px >= 0 && py >= 0 && px < file.width && py < file.height) out.set(file.colourOf(cel, cy * cel.w + cx), (py * file.width + px) * 4);
        }
    }

    return out;
}

export function readAsepriteLayers(buffer)
{
    const file = parse(buffer);

    return {
        width: file.width,
        height: file.height,
        layers: file.layers.map(({name, visible, image}) => ({name, visible, image})),
        tags: file.tags,
        frames: file.frames.map(frame =>
        {
            const cels = file.layers.map(() => null);

            for(const cel of frame.cels) if(file.layers[cel.layer]?.image) cels[cel.layer] = celCanvas(file, cel);

            return {duration: frame.duration, cels};
        })
    };
}

/** Visible image layers flattened with "normal" blending, bottom layer first. */
export function readAseprite(buffer)
{
    const file = parse(buffer), n = file.width * file.height;

    return {
        width: file.width,
        height: file.height,
        tags: file.tags,
        frames: file.frames.map(frame =>
        {
            const data = Buffer.alloc(n * 4);

            for(const cel of [...frame.cels].sort((a, b) => a.layer - b.layer))
            {
                const layer = file.layers[cel.layer];

                if(!layer || !layer.visible || !layer.image) continue;

                const src = celCanvas(file, cel), alpha = (cel.opacity / 255) * (layer.opacity / 255);

                for(let i = 0; i < n; i++)
                {
                    const o = i * 4, sa = (src[o + 3] / 255) * alpha;

                    if(sa <= 0) continue;

                    const da = data[o + 3] / 255, oa = sa + da * (1 - sa);

                    for(let c = 0; c < 3; c++) data[o + c] = Math.round((src[o + c] * sa + data[o + c] * da * (1 - sa)) / oa);
                    data[o + 3] = Math.round(oa * 255);
                }
            }

            return {duration: frame.duration, data};
        })
    };
}

const chunk = (type, body) =>
{
    const head = Buffer.alloc(6);

    head.writeUInt32LE(6 + body.length, 0);
    head.writeUInt16LE(type, 4);

    return Buffer.concat([head, body]);
};

const aseString = text =>
{
    const bytes = Buffer.from(text, 'utf8'), out = Buffer.alloc(2 + bytes.length);

    out.writeUInt16LE(bytes.length, 0);
    bytes.copy(out, 2);

    return out;
};

/** A cel chunk of the opaque part of a full-canvas RGBA buffer, or null when nothing is opaque. */
function celChunk(layerIndex, data, width, height)
{
    let minX = width, minY = height, maxX = -1, maxY = -1;

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            if(data[(y * width + x) * 4 + 3] === 0) continue;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }
    if(maxX < 0) return null;

    const w = maxX - minX + 1, h = maxY - minY + 1, pixels = Buffer.alloc(w * h * 4);

    for(let y = 0; y < h; y++) data.copy(pixels, y * w * 4, ((minY + y) * width + minX) * 4, ((minY + y) * width + maxX + 1) * 4);

    const head = Buffer.alloc(20);

    head.writeUInt16LE(layerIndex, 0);
    head.writeInt16LE(minX, 2);
    head.writeInt16LE(minY, 4);
    head.writeUInt8(255, 6);
    head.writeUInt16LE(2, 7);
    head.writeUInt16LE(w, 16);
    head.writeUInt16LE(h, 18);

    return chunk(CHUNK_CEL, Buffer.concat([head, deflateSync(pixels)]));
}

/**
 * Writes RGBA frames as an .aseprite. One layer: `frames[i].data` (named `layer`). Several:
 * `layers` [{name, visible}] and `frames[i].cels`, one full-canvas buffer (or null) per layer.
 */
export function writeAseprite({width, height, frames, tags = [], layer = 'Layer 1', layers})
{
    const layerList = layers ?? [{name: layer, visible: true}];
    const frameCels = layers ? frames.map(f => f.cels) : frames.map(f => [f.data]);
    const frameBuffers = frames.map(({duration}, index) =>
    {
        const chunks = [];

        if(index === 0)
        {
            const palette = Buffer.alloc(20 + 6);

            palette.writeUInt32LE(1, 0);
            palette.writeUInt8(255, 20 + 5);
            chunks.push(chunk(CHUNK_PALETTE, palette));
            for(const {name, visible} of layerList)
            {
                const head = Buffer.alloc(16);

                // Flags: 1 visible, 2 editable.
                head.writeUInt16LE(visible === false ? 2 : 3, 0);
                head.writeUInt8(255, 12);
                chunks.push(chunk(CHUNK_LAYER, Buffer.concat([head, aseString(name)])));
            }
            if(tags.length)
            {
                const parts = [Buffer.alloc(10)];

                parts[0].writeUInt16LE(tags.length, 0);
                for(const tag of tags)
                {
                    const head = Buffer.alloc(17);

                    head.writeUInt16LE(tag.from, 0);
                    head.writeUInt16LE(tag.to, 2);
                    head.writeUInt8(0x40, 13);
                    head.writeUInt8(0xA0, 14);
                    head.writeUInt8(0xFF, 15);
                    parts.push(head, aseString(tag.name));
                }
                chunks.push(chunk(CHUNK_TAGS, Buffer.concat(parts)));
            }
        }
        frameCels[index].forEach((data, layerIndex) =>
        {
            const cel = data ? celChunk(layerIndex, data, width, height) : null;

            if(cel) chunks.push(cel);
        });

        const body = Buffer.concat(chunks), header = Buffer.alloc(16);

        header.writeUInt32LE(16 + body.length, 0);
        header.writeUInt16LE(0xF1FA, 4);
        header.writeUInt16LE(Math.min(chunks.length, 0xFFFF), 6);
        header.writeUInt16LE(duration, 8);
        header.writeUInt32LE(chunks.length, 12);

        return Buffer.concat([header, body]);
    });

    const header = Buffer.alloc(128);

    header.writeUInt32LE(128 + frameBuffers.reduce((sum, b) => sum + b.length, 0), 0);
    header.writeUInt16LE(0xA5E0, 4);
    header.writeUInt16LE(frames.length, 6);
    header.writeUInt16LE(width, 8);
    header.writeUInt16LE(height, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(1, 14);
    header.writeUInt16LE(100, 18);
    header.writeUInt16LE(1, 32);
    header.writeUInt8(1, 34);
    header.writeUInt8(1, 35);
    header.writeUInt16LE(16, 40);
    header.writeUInt16LE(16, 42);

    return Buffer.concat([header, ...frameBuffers]);
}
```

- [ ] **Step 4: Run the new tests and the compiler's**

Run: `node --test packages/vortex-client/tools/lib/aseprite.test.mjs packages/vortex-client/tools/build-monsters.test.mjs`
Expected: PASS (2 + 5 tests).

- [ ] **Step 5: Re-read the shipped monsters (nothing in them may change)**

Run: `node packages/vortex-client/tools/build-monsters.mjs --dry-run`
Expected: `slime: … (… bytes)` and `wolf: … (… bytes)` with the same byte counts as before the change (run the same command on the previous commit with `git stash` if in doubt).

- [ ] **Step 6: Lint and commit**

```bash
node node_modules/eslint/bin/eslint.js packages/vortex-client/tools/lib/aseprite.mjs packages/vortex-client/tools/lib/aseprite.test.mjs
git add -- packages/vortex-client/tools/lib/aseprite.test.mjs
git commit -m "monstres : .aseprite à plusieurs calques (lecture, écriture), blocs inconnus ignorés

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/tools/lib/aseprite.mjs packages/vortex-client/tools/lib/aseprite.test.mjs
```

---

### Task 6: The build command (rig → `.aseprite` + `monster.json`), retouches kept

**Files:**
- Create: `packages/vortex-client/tools/monster-art/build.mjs`
- Test: `packages/vortex-client/tools/monster-art/build.test.mjs`
- Modify: `packages/vortex-client/package.json` (scripts)
- Modify: `.claude/rules/assets.md` (one bullet), then regenerate `AGENTS.md`

**Interfaces:**
- Consumes: Task 2 `loadRig`, Task 4 `canvasFor, frameList, renderFrame`, Task 5 `readAsepriteLayers, writeAseprite`; `build-monsters.mjs` `loadSource, compileMonster` (in the test).
- Produces: `LAYERS` (the five layer names/visibility), `keptRetouche(path, {tags, width, height}, dropRetouche) → (Buffer|null)[] | null`, `buildMonsterArt(folder, {dropRetouche}) → {id, frames, canvas, keptRetouche}`; CLI `pnpm --filter vortex-client build:monster-art [--drop-retouche] [<id>...]`.

- [ ] **Step 1: Write the failing tests**

```js
// packages/vortex-client/tools/monster-art/build.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildMonsterArt} from './build.mjs';
import {readAseprite, readAsepriteLayers, writeAseprite} from '../lib/aseprite.mjs';
import {compileMonster, loadSource} from '../build-monsters.mjs';

const grey = ['#20202a', '#40404e', '#606070', '#808090', '#a0a0b0'];
const rig = (extra = {}) => ({
    id: 'blob',
    ramps: {grey},
    materials: {skin: {ramp: 'grey'}},
    bones: {body: {at: [0, 0, 5]}},
    shapes: [{name: 'body', bone: 'body', ellipsoid: {center: [0, 0, 5], radii: [5, 4, 4]}, material: 'skin'}],
    animations: {idle: [{ms: 200}], walk: [{ms: 100}, {ms: 100, pose: {body: {move: [0, 0, 1]}}}]},
    ...extra
});
const folderWith = json =>
{
    const dir = mkdtempSync(join(tmpdir(), 'monster-art-'));

    writeFileSync(join(dir, 'rig.json'), JSON.stringify(json));
    return dir;
};

test('a rig builds into a layered .aseprite with 8 directions and a monster.json build-monsters compiles', async () =>
{
    const dir = folderWith(rig());
    const result = buildMonsterArt(dir);
    const manifest = JSON.parse(readFileSync(join(dir, 'monster.json'), 'utf8'));
    const layered = readAsepriteLayers(readFileSync(join(dir, 'blob.aseprite')));

    assert.equal(result.frames, 8 * 3);
    assert.deepEqual(manifest.directions, [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(manifest.anchor, [result.canvas.anchorX, result.canvas.anchorY]);
    assert.deepEqual(layered.layers.map(l => [l.name, l.visible]), [['forme', false], ['peinture', true], ['détails', true], ['finition', true], ['retouche', true]]);
    assert.deepEqual(layered.tags.slice(0, 3), [{name: 'idle_0', from: 0, to: 0}, {name: 'walk_0', from: 1, to: 2}, {name: 'idle_1', from: 3, to: 3}]);

    const {json} = compileMonster(await loadSource(dir));
    const assets = Object.values(json.assets);

    assert.ok(assets.every(a => !a.flipH), 'every direction is drawn: no mirrored asset');
});

test('hand retouches are kept on a rebuild; a changed tag or canvas is refused unless --drop-retouche', () =>
{
    const dir = folderWith(rig());

    buildMonsterArt(dir);

    // Retouch: one pixel on the retouche layer of frame 0.
    const path = join(dir, 'blob.aseprite');
    const layered = readAsepriteLayers(readFileSync(path));
    const retouche = Buffer.alloc(layered.width * layered.height * 4);

    retouche.writeUInt32BE(0xff00ffff, 0);
    writeFileSync(path, writeAseprite({
        width: layered.width, height: layered.height, tags: layered.tags,
        layers: layered.layers.map(({name, visible}) => ({name, visible})),
        frames: layered.frames.map((f, i) => ({duration: f.duration, cels: [...f.cels.slice(0, 4), i === 0 ? retouche : null]}))
    }));

    assert.equal(buildMonsterArt(dir).keptRetouche, true);
    assert.equal(readAseprite(readFileSync(path)).frames[0].data.readUInt32BE(0), 0xff00ffff);

    // One more idle frame: the tags move.
    const longer = rig();
    longer.animations.idle.push({ms: 200});
    writeFileSync(join(dir, 'rig.json'), JSON.stringify(longer));
    assert.throws(() => buildMonsterArt(dir), /retouche.*idle_0|retouche/);

    // A bigger body: same tags, another canvas.
    const bigger = rig();
    bigger.shapes[0].ellipsoid.radii = [8, 6, 6];
    writeFileSync(join(dir, 'rig.json'), JSON.stringify(bigger));
    assert.throws(() => buildMonsterArt(dir), /canvas/);

    assert.equal(buildMonsterArt(dir, {dropRetouche: true}).keptRetouche, false);
});

test('a broken rig is refused with the path of the error', () =>
{
    const bad = rig();
    bad.shapes[0].bone = 'tail';
    assert.throws(() => buildMonsterArt(folderWith(bad)), /shapes\[0\]\.bone/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test packages/vortex-client/tools/monster-art/build.test.mjs`
Expected: FAIL, `Cannot find module './build.mjs'`.

- [ ] **Step 3: Write `build.mjs`**

```js
#!/usr/bin/env node
// Turns monsters/<id>/rig.json into <id>.aseprite (layers forme (hidden), peinture, détails,
// finition, retouche; tags <animation>_<direction>, 8 directions) and the monster.json that
// build-monsters reads. The retouche layer holds hand edits and is never overwritten.
// Spec docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md.
//
//   pnpm --filter vortex-client build:monster-art [--drop-retouche] [<id>...]
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRig} from './rig.mjs';
import {canvasFor, frameList, renderFrame} from './render.mjs';
import {readAsepriteLayers, writeAseprite} from '../lib/aseprite.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MONSTERS = resolve(HERE, '../../monsters');

export const LAYERS = [
    {name: 'forme', visible: false},
    {name: 'peinture', visible: true},
    {name: 'détails', visible: true},
    {name: 'finition', visible: true},
    {name: 'retouche', visible: true}
];

/** The hand edits of an existing file, frame by frame, or null when there are none. */
export function keptRetouche(path, {tags, width, height}, dropRetouche)
{
    if(!existsSync(path)) return null;

    const old = readAsepriteLayers(readFileSync(path));
    const layer = old.layers.findIndex(l => l.name === 'retouche');

    if(layer < 0 || old.frames.every(f => !f.cels[layer]) || dropRetouche) return null;

    const changed = tags.find((t, i) => old.tags[i]?.name !== t.name || old.tags[i].from !== t.from || old.tags[i].to !== t.to);

    if(changed || old.tags.length !== tags.length)
    {
        throw new Error(`the retouche layer has hand edits and tag ${changed?.name ?? old.tags[tags.length]?.name} changed: rerun with --drop-retouche to lose them`);
    }
    if(old.width !== width || old.height !== height)
    {
        throw new Error(`the retouche layer has hand edits and the canvas changed (${old.width}×${old.height} → ${width}×${height}): rerun with --drop-retouche to lose them`);
    }

    return old.frames.map(f => f.cels[layer]);
}

export function buildMonsterArt(folder, {dropRetouche = false} = {})
{
    const rig = loadRig(JSON.parse(readFileSync(join(folder, 'rig.json'), 'utf8')));
    const canvas = canvasFor(rig);
    const frames = [], tags = [];

    for(const f of frameList(rig))
    {
        const name = `${f.animation}_${f.direction}`;

        if(tags.at(-1)?.name !== name) tags.push({name, from: frames.length, to: frames.length});
        tags.at(-1).to = frames.length;

        const layers = renderFrame(rig, canvas, f.direction, f.frame);

        frames.push({duration: f.frame.ms, cels: [layers.forme, layers.peinture, layers.details, layers.finition, null]});
    }

    const path = join(folder, `${rig.id}.aseprite`);
    const retouche = keptRetouche(path, {tags, width: canvas.width, height: canvas.height}, dropRetouche);

    if(retouche)
    {
        frames.forEach((f, i) =>
        {
            f.cels[4] = retouche[i] ?? null;
        });
    }
    writeFileSync(path, writeAseprite({width: canvas.width, height: canvas.height, layers: LAYERS, frames, tags}));
    writeFileSync(join(folder, 'monster.json'), `${JSON.stringify({
        id: rig.id, aseprite: `${rig.id}.aseprite`, anchor: [canvas.anchorX, canvas.anchorY], directions: [0, 1, 2, 3, 4, 5, 6, 7], scale: 1
    }, null, 2)}\n`);

    return {id: rig.id, frames: frames.length, canvas, keptRetouche: Boolean(retouche)};
}

function main()
{
    const args = process.argv.slice(2);
    const dropRetouche = args.includes('--drop-retouche');
    const wanted = args.filter(a => !a.startsWith('--'));
    const ids = wanted.length ? wanted : readdirSync(MONSTERS).filter(id => existsSync(join(MONSTERS, id, 'rig.json')));
    let failed = 0;

    for(const id of ids)
    {
        const started = Date.now();

        try
        {
            const r = buildMonsterArt(join(MONSTERS, id), {dropRetouche});

            console.log(`${r.id}: ${r.frames} frames, ${r.canvas.width}×${r.canvas.height}, anchor (${r.canvas.anchorX}, ${r.canvas.anchorY})${r.keptRetouche ? ', retouches kept' : ''}, ${((Date.now() - started) / 1000).toFixed(1)} s`);
        }
        catch(error)
        {
            failed++;
            console.error(`${id}: ${error.message}`);
        }
    }

    if(ids.length > failed) console.log('next: pnpm --filter vortex-client build:monsters <id>, then build:ambreia:all --only=pets');
    if(failed) process.exit(1);
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the tests**

Run: `node --test packages/vortex-client/tools/monster-art/build.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 5: Scripts**

In `packages/vortex-client/package.json` `scripts`, after the `"build:monsters"` line, add:
```json
    "build:monster-art": "node ./tools/monster-art/build.mjs",
    "monster-art:preview": "node ./tools/monster-art/preview.mjs",
```

- [ ] **Step 6: The assets rule**

Append to `.claude/rules/assets.md`:
```markdown
- **Monsters** are pets drawn by `tools/monster-art/` (spec
  `docs/superpowers/specs/2026-10-10-monster-art-pipeline-design.md`): `monsters/<id>/rig.json`
  (volumes on bones, materials, decals, poses) → `build:monster-art` → `<id>.aseprite` (layers
  forme/peinture/détails/finition, plus `retouche` for hand edits, never overwritten) and
  `monster.json` → `build:monsters` → `pets/<id>.nitro` → `build:ambreia:all --only=pets`. The pet
  type is the id's index in `pet.configuration`. `monster-art:preview <id>` shows the 8 directions
  live. A hand-drawn `.aseprite` (the slime) goes through `build:monsters` the same way.
```
Then run `pnpm sync:agents` (it regenerates `AGENTS.md` and `.github/copilot-instructions.md` from the rules).

- [ ] **Step 7: Lint, check, commit**

```bash
node node_modules/eslint/bin/eslint.js packages/vortex-client/tools/monster-art/build.mjs packages/vortex-client/tools/monster-art/build.test.mjs
pnpm check
git add -- packages/vortex-client/tools/monster-art/build.mjs packages/vortex-client/tools/monster-art/build.test.mjs
git commit -m "monstres : build:monster-art (rig → .aseprite à calques + monster.json, retouches gardées)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/tools/monster-art/build.mjs packages/vortex-client/tools/monster-art/build.test.mjs packages/vortex-client/package.json .claude/rules/assets.md AGENTS.md .github/copilot-instructions.md
```
(`pnpm check` must end green; if `sync:agents` wrote other files, `git status` shows them: add them to the commit's paths only if `sync:agents` produced them.)

---

### Task 7: The live preview

**Files:**
- Create: `packages/vortex-client/tools/monster-art/preview.mjs`
- Test: `packages/vortex-client/tools/monster-art/preview.test.mjs`

**Interfaces:**
- Consumes: Task 2 `loadRig`, Task 4 `canvasFor, frameList, renderFrame`; `sharp`.
- Produces: `loadAndRender(folder, only) → Promise<{canvas, frames: {animation, direction, index, ms, images: {forme, peinture, details, finition, final}}[]} | {error: string}>` (images are `data:image/png;base64,…`); CLI `pnpm --filter vortex-client monster-art:preview <id> [--port=5199] [--anim=<name>]`.

- [ ] **Step 1: Write the failing tests**

```js
// packages/vortex-client/tools/monster-art/preview.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadAndRender} from './preview.mjs';

const folder = text =>
{
    const dir = mkdtempSync(join(tmpdir(), 'monster-preview-'));

    writeFileSync(join(dir, 'rig.json'), text);
    return dir;
};
const rig = {
    id: 'blob',
    ramps: {grey: ['#20202a', '#40404e', '#606070', '#808090', '#a0a0b0']},
    materials: {skin: {ramp: 'grey'}},
    bones: {body: {at: [0, 0, 5]}},
    shapes: [{name: 'body', bone: 'body', ellipsoid: {center: [0, 0, 5], radii: [5, 4, 4]}, material: 'skin'}],
    animations: {idle: [{ms: 200}], walk: [{ms: 100}]}
};

test('every frame of the chosen animation, every pass as a PNG data URL', async () =>
{
    const result = await loadAndRender(folder(JSON.stringify(rig)), 'walk');

    assert.equal(result.frames.length, 8);
    assert.ok(result.frames.every(f => f.animation === 'walk'));
    for(const pass of ['forme', 'peinture', 'details', 'finition', 'final']) assert.match(result.frames[0].images[pass], /^data:image\/png;base64,/);
});

test('a JSON syntax error or a rig error comes back as an error, without throwing', async () =>
{
    assert.match((await loadAndRender(folder('{"id": "blob",'), null)).error, /JSON/);

    const bad = structuredClone(rig);
    bad.shapes[0].material = 'scales';
    assert.match((await loadAndRender(folder(JSON.stringify(bad)), null)).error, /shapes\[0\]\.material/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test packages/vortex-client/tools/monster-art/preview.test.mjs`
Expected: FAIL, `Cannot find module './preview.mjs'`.

- [ ] **Step 3: Write `preview.mjs`**

```js
#!/usr/bin/env node
// Live preview of a monster's rig on http://localhost:5199: the 8 directions side by side, every
// animation at its real durations, on Habbo's floor colour, ×1 and ×4, one pass or the final image.
// Saving rig.json renders again and the page reloads itself; a rig error shows on the page.
//
//   pnpm --filter vortex-client monster-art:preview <id> [--port=5199] [--anim=<animation>]
import {createServer} from 'node:http';
import {readFileSync, watch} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {loadRig} from './rig.mjs';
import {canvasFor, frameList, renderFrame} from './render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MONSTERS = resolve(HERE, '../../monsters');
const PASSES = ['forme', 'peinture', 'details', 'finition', 'final'];

async function png(buffer, canvas)
{
    const data = await sharp(buffer, {raw: {width: canvas.width, height: canvas.height, channels: 4}}).png().toBuffer();

    return `data:image/png;base64,${data.toString('base64')}`;
}

/** Renders the rig (one animation, or all); an error (JSON, rig) comes back as {error}. */
export async function loadAndRender(folder, only)
{
    try
    {
        const rig = loadRig(JSON.parse(readFileSync(join(folder, 'rig.json'), 'utf8')));
        const canvas = canvasFor(rig);
        const frames = [];

        for(const f of frameList(rig).filter(f => !only || f.animation === only))
        {
            const layers = renderFrame(rig, canvas, f.direction, f.frame), images = {};

            for(const pass of PASSES) images[pass] = await png(layers[pass], canvas);
            frames.push({animation: f.animation, direction: f.direction, index: f.index, ms: f.frame.ms, images});
        }

        return {canvas, frames};
    }
    catch(error)
    {
        return {error: error instanceof SyntaxError ? `rig.json is not valid JSON: ${error.message}` : error.message};
    }
}

const PAGE = `<!doctype html><meta charset="utf-8"><title>monster-art</title>
<style>
body{margin:0;background:#2b2b30;color:#ddd;font:14px system-ui}
header{padding:8px 12px;display:flex;gap:16px;align-items:center}
.row{display:flex;gap:6px;padding:6px 12px;align-items:flex-end}
.row h2{width:70px;font-size:13px;margin:0}
canvas{background:#989768;image-rendering:pixelated}
pre{color:#ff8080;padding:12px;white-space:pre-wrap}
</style>
<header><b id="title"></b>
<label>pass <select id="pass"><option>final</option><option>peinture</option><option>details</option><option>finition</option><option>forme</option></select></label>
<label>zoom <select id="zoom"><option>4</option><option>1</option><option>2</option><option>6</option></select></label>
<span id="status"></span></header><main id="main"></main>
<script>
const main = document.getElementById('main'), status = document.getElementById('status');
let data = null, images = new Map(), canvases = [];
async function load()
{
    status.textContent = 'rendering…';
    data = await (await fetch('/data')).json();
    main.innerHTML = '';
    canvases = [];
    if(data.error) { main.innerHTML = '<pre></pre>'; main.firstChild.textContent = data.error; status.textContent = ''; return; }
    document.getElementById('title').textContent = data.id;
    images = new Map(data.frames.map(f => [f.animation + '/' + f.direction + '/' + f.index, Object.fromEntries(Object.entries(f.images).map(([k, src]) => { const i = new Image(); i.src = src; return [k, i]; }))]));
    const zoom = +document.getElementById('zoom').value;
    for(const animation of [...new Set(data.frames.map(f => f.animation))])
    {
        const row = document.createElement('div'); row.className = 'row';
        row.innerHTML = '<h2>' + animation + '</h2>';
        const list = data.frames.filter(f => f.animation === animation && f.direction === 0);
        for(let d = 0; d < 8; d++)
        {
            const c = document.createElement('canvas'); c.width = data.canvas.width * zoom; c.height = data.canvas.height * zoom; c.title = 'direction ' + d;
            row.appendChild(c);
            canvases.push({c, animation, direction: d, list, frame: 0, at: performance.now()});
        }
        main.appendChild(row);
    }
    status.textContent = data.frames.length + ' frames, ' + data.canvas.width + '×' + data.canvas.height;
}
function draw(now)
{
    const pass = document.getElementById('pass').value;
    for(const v of canvases)
    {
        while(now - v.at > v.list[v.frame].ms) { v.at += v.list[v.frame].ms; v.frame = (v.frame + 1) % v.list.length; }
        const img = images.get(v.animation + '/' + v.direction + '/' + v.list[v.frame].index)?.[pass];
        const g = v.c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, v.c.width, v.c.height);
        if(img?.complete) g.drawImage(img, 0, 0, v.c.width, v.c.height);
    }
    requestAnimationFrame(draw);
}
document.getElementById('zoom').onchange = load;
new EventSource('/events').onmessage = load;
load().then(() => requestAnimationFrame(draw));
</script>`;

function main()
{
    const args = process.argv.slice(2);
    const id = args.find(a => !a.startsWith('--'));
    const port = Number(args.find(a => a.startsWith('--port='))?.slice(7) ?? 5199);
    const only = args.find(a => a.startsWith('--anim='))?.slice(7) ?? null;

    if(!id)
    {
        console.error('usage: monster-art:preview <id> [--port=5199] [--anim=<animation>]');
        process.exit(1);
    }

    const folder = join(MONSTERS, id), clients = new Set();
    let current = loadAndRender(folder, only).then(r => ({id, ...r}));
    let timer = null;

    // Saving rig.json renders again (debounced: editors write in several steps), then tells the pages.
    watch(folder, (_event, file) =>
    {
        if(file !== 'rig.json') return;
        clearTimeout(timer);
        timer = setTimeout(() =>
        {
            current = loadAndRender(folder, only).then(r => ({id, ...r}));
            current.then(r =>
            {
                console.log(r.error ? `error: ${r.error}` : `rendered ${r.frames.length} frames`);
                for(const res of clients) res.write('data: reload\n\n');
            });
        }, 250);
    });

    createServer(async (req, res) =>
    {
        if(req.url === '/data')
        {
            res.writeHead(200, {'content-type': 'application/json'});
            res.end(JSON.stringify(await current));
        }
        else if(req.url === '/events')
        {
            res.writeHead(200, {'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive'});
            clients.add(res);
            req.on('close', () => clients.delete(res));
        }
        else
        {
            res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
            res.end(PAGE);
        }
    }).listen(port, () => console.log(`monster-art preview of ${id}: http://localhost:${port}`));
}

if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the tests**

Run: `node --test packages/vortex-client/tools/monster-art/preview.test.mjs`
Expected: PASS, 2 tests.

- [ ] **Step 5: Lint and commit**

```bash
node node_modules/eslint/bin/eslint.js packages/vortex-client/tools/monster-art/preview.mjs packages/vortex-client/tools/monster-art/preview.test.mjs
git add -- packages/vortex-client/tools/monster-art/preview.mjs packages/vortex-client/tools/monster-art/preview.test.mjs
git commit -m "monstres : aperçu en direct du rig (8 directions, animations, passes)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/tools/monster-art/preview.mjs packages/vortex-client/tools/monster-art/preview.test.mjs
```

---

### Task 8: The wolf, drawn by the pipeline

**Files:**
- Create: `packages/vortex-client/monsters/wolf/rig.json`
- Regenerate: `packages/vortex-client/monsters/wolf/wolf.aseprite`, `packages/vortex-client/monsters/wolf/monster.json` (the hand-made wolf they replace has no `retouche` layer: nothing is lost)

**Interfaces:**
- Consumes: Tasks 6-7 commands; `build-monsters`, `build:ambreia:all`; the `run-vortex-client` skill.
- Produces: the wolf as pet type 38 (unchanged id and type).

- [ ] **Step 1: Write `rig.json`**

```json
{
  "id": "wolf",
  "ramps": {
    "grey": ["#3a3b47", "#5d5f6b", "#82848e", "#a9aab0", "#d3d1ca"],
    "saddle": ["#2a2a34", "#41424e", "#595a66", "#75767f", "#9b9ba0"],
    "cream": ["#6a6157", "#958a79", "#bdb29c", "#ddd4be", "#f3ecd9"],
    "ear": ["#3a2c33", "#6e4f55", "#a2787a", "#c99c97", "#e6c4ba"],
    "dark": ["#16161c", "#24252e", "#33343f", "#454652", "#5b5c68"]
  },
  "materials": {
    "fur": {"ramp": "grey", "when": [{"normalUp": [0.5, 1], "ramp": "saddle"}, {"normalUp": [-1, -0.55], "forward": [-2, 99], "ramp": "cream"}], "texture": "fur", "specular": 0.15},
    "head": {"ramp": "grey", "when": [{"normalUp": [0.5, 1], "ramp": "saddle"}], "specular": 0.15},
    "ruff": {"ramp": "grey", "when": [{"normalUp": [-1, 0.1], "ramp": "cream"}], "texture": "fur"},
    "muzzle": {"ramp": "grey", "when": [{"normalUp": [-1, 0.1], "ramp": "cream"}], "specular": 0.3},
    "ear": {"ramp": "saddle", "when": [{"normalForward": [0.35, 1], "ramp": "ear"}]},
    "leg": {"ramp": "grey", "when": [{"height": [-1, 1.4], "ramp": "cream"}]},
    "tailtip": {"ramp": "grey", "when": [{"along": [0.35, 1], "ramp": "dark"}, {"normalUp": [0.2, 1], "ramp": "saddle"}], "texture": "fur"}
  },
  "bones": {
    "body": {"at": [0, 0, 22.5]},
    "neck": {"parent": "body", "at": [9, 0, 24.5]},
    "head": {"parent": "neck", "at": [14, 0, 29.5]},
    "jaw": {"parent": "head", "at": [18, 0, 28.8]},
    "tail": {"parent": "body", "at": [-14.5, 0, 26.5]},
    "tail2": {"parent": "tail", "at": [-19, 0, 24]},
    "fleg.l": {"parent": "body", "at": [8.5, 2.6, 22]},
    "hleg.l": {"parent": "body", "at": [-10.5, 2.6, 23]}
  },
  "shapes": [
    {"name": "ribs", "bone": "body", "ellipsoid": {"center": [5, 0, 21.5], "radii": [7, 5, 6.6]}, "material": "fur", "blend": 0},
    {"name": "withers", "bone": "body", "mirror": true, "ellipsoid": {"center": [7.5, 2.2, 25.5], "radii": [3.2, 2.2, 3]}, "material": "fur", "blend": 2.5},
    {"name": "waist", "bone": "body", "cone": {"from": [0, 0, 23.3], "to": [-6, 0, 23.7], "radius": [4.7, 3.9]}, "material": "fur", "blend": 3},
    {"name": "hips", "bone": "body", "ellipsoid": {"center": [-10, 0, 23.1], "radii": [5, 4.2, 4.8]}, "material": "fur", "blend": 3},
    {"name": "ruff", "bone": "neck", "ellipsoid": {"center": [10, 0, 26], "radii": [4.6, 5.4, 5.6]}, "material": "ruff", "blend": 3},
    {"name": "neck", "bone": "neck", "cone": {"from": [9, 0, 24.5], "to": [13.5, 0, 30], "radius": [4.2, 3.4]}, "material": "fur", "blend": 3},
    {"name": "skull", "bone": "head", "ellipsoid": {"center": [15.8, 0, 31.1], "radii": [4.2, 3.6, 3.6]}, "material": "head", "blend": 2.5},
    {"name": "cheek", "bone": "head", "ellipsoid": {"center": [16.4, 0, 29.5], "radii": [3, 4.1, 2.4]}, "material": "ruff", "blend": 2},
    {"name": "snout", "bone": "head", "cone": {"from": [18.5, 0, 30.7], "to": [25.5, 0, 29.2], "radius": [2.4, 1.1]}, "material": "muzzle", "blend": 1.5},
    {"name": "jaw", "bone": "jaw", "cone": {"from": [18, 0, 28.8], "to": [24, 0, 27.7], "radius": [1.7, 0.9]}, "material": "muzzle", "blend": 0.8},
    {"name": "ear", "bone": "head", "mirror": true, "cone": {"from": [14.4, 2.1, 33.5], "to": [13.2, 2.52, 40], "radius": [2.1, 0.35]}, "material": "ear", "blend": 1},
    {"name": "upper arm", "bone": "fleg.l", "ellipsoid": {"center": [8.5, 2.6, 18], "radii": [2.4, 1.8, 4.4]}, "material": "leg", "blend": 3},
    {"name": "forearm", "bone": "fleg.l", "cone": {"from": [8.9, 2.6, 12.5], "to": [9.3, 2.6, 2.2], "radius": [1.45, 1.05]}, "material": "leg", "blend": 2.2},
    {"name": "front paw", "bone": "fleg.l", "ellipsoid": {"center": [10, 2.6, 1], "radii": [1.6, 1.15, 1]}, "material": "leg", "blend": 1.2},
    {"name": "thigh", "bone": "hleg.l", "ellipsoid": {"center": [-10.5, 2.6, 19.5], "radii": [3.4, 2.1, 4.6]}, "material": "leg", "blend": 3},
    {"name": "shin", "bone": "hleg.l", "cone": {"from": [-11.2, 2.6, 13.5], "to": [-14.2, 2.6, 6], "radius": [2, 1.15]}, "material": "leg", "blend": 2.2},
    {"name": "hock", "bone": "hleg.l", "cone": {"from": [-14.2, 2.6, 6], "to": [-12.6, 2.6, 1.6], "radius": [1.15, 1]}, "material": "leg", "blend": 1.6},
    {"name": "hind paw", "bone": "hleg.l", "ellipsoid": {"center": [-11.8, 2.6, 1], "radii": [1.6, 1.15, 1]}, "material": "leg", "blend": 1.2},
    {"name": "tail", "bone": "tail", "cone": {"from": [-14.5, 0, 26.5], "to": [-19, 0, 24], "radius": [1.8, 2.8]}, "material": "fur", "blend": 1.2},
    {"name": "tail2", "bone": "tail2", "cone": {"from": [-19, 0, 24], "to": [-23, 0, 18], "radius": [2.8, 2.6]}, "material": "fur", "blend": 1},
    {"name": "tail tip", "bone": "tail2", "cone": {"from": [-23, 0, 18], "to": [-24, 0, 13.5], "radius": [2.6, 0.6]}, "material": "tailtip", "blend": 1}
  ],
  "decals": [
    {"kind": "eye", "bone": "head", "at": [18.9, 2, 32.1], "mirror": true, "colours": ["#e8b545", "#141418"]},
    {"kind": "pixel", "bone": "head", "at": [26.4, 0, 29.9], "colours": ["#101014"], "size": [1, 2]},
    {"kind": "pixel", "bone": "fleg.l", "at": [11.5, 2.6, 0.6], "colours": ["#2a2a30"]},
    {"kind": "pixel", "bone": "hleg.l", "at": [-10.3, 2.6, 0.6], "colours": ["#2a2a30"]}
  ],
  "animations": {
    "idle": [
      {"ms": 240},
      {"ms": 220, "pose": {"neck": {"rotate": [0, 2, 0]}, "tail": {"rotate": [0, 0, 6]}}},
      {"ms": 240},
      {"ms": 220, "pose": {"tail": {"rotate": [0, 0, -4]}}}
    ],
    "walk": [
      {"ms": 110, "pose": {"fleg.l": {"rotate": [0, 18, 0]}, "fleg.r": {"rotate": [0, -18, 0]}, "hleg.l": {"rotate": [0, -18, 0]}, "hleg.r": {"rotate": [0, 18, 0]}, "tail": {"rotate": [0, 0, 5]}}},
      {"ms": 110, "pose": {"body": {"move": [0, 0, 0.8]}}},
      {"ms": 110, "pose": {"fleg.l": {"rotate": [0, -18, 0]}, "fleg.r": {"rotate": [0, 18, 0]}, "hleg.l": {"rotate": [0, 18, 0]}, "hleg.r": {"rotate": [0, -18, 0]}, "tail": {"rotate": [0, 0, -5]}}},
      {"ms": 110, "pose": {"body": {"move": [0, 0, 0.8]}}}
    ],
    "attack": [
      {"ms": 170, "pose": {"body": {"move": [-2, 0, -1.5]}, "neck": {"rotate": [0, -12, 0]}, "fleg.l": {"rotate": [0, -10, 0]}, "hleg.l": {"rotate": [0, 10, 0]}}},
      {"ms": 90, "pose": {"body": {"move": [4, 0, 1]}, "neck": {"rotate": [0, 6, 0]}, "jaw": {"rotate": [0, -28, 0]}, "fleg.l": {"rotate": [0, 30, 0]}, "hleg.l": {"rotate": [0, -25, 0]}}},
      {"ms": 170, "pose": {"body": {"move": [5, 0, 0]}, "neck": {"rotate": [0, -6, 0]}, "fleg.l": {"rotate": [0, 10, 0]}, "hleg.l": {"rotate": [0, -10, 0]}}},
      {"ms": 130, "pose": {"body": {"move": [2, 0, 0]}}}
    ],
    "hit": [
      {"ms": 90, "flash": true, "pose": {"body": {"move": [-2, 0, 0]}, "neck": {"rotate": [0, 10, 0]}}},
      {"ms": 150, "pose": {"body": {"move": [-2, 0, -1]}, "neck": {"rotate": [0, 10, 0]}}}
    ],
    "death": [
      {"ms": 170, "pose": {"body": {"move": [-1, 0, -2]}, "neck": {"rotate": [0, -20, 0]}}},
      {"ms": 170, "pose": {"body": {"rotate": [35, 0, 0], "move": [0, 0, -6]}, "neck": {"rotate": [0, -25, 0]}}},
      {"ms": 220, "pose": {"body": {"rotate": [82, 0, 0], "move": [0, 0, -15]}, "neck": {"rotate": [0, -15, 0]}, "fleg.l": {"rotate": [0, 15, 0]}, "hleg.l": {"rotate": [0, -15, 0]}}},
      {"ms": 600, "pose": {"body": {"rotate": [82, 0, 0], "move": [0, 0, -15]}, "neck": {"rotate": [0, -15, 0]}, "fleg.l": {"rotate": [0, 15, 0]}, "hleg.l": {"rotate": [0, -15, 0]}, "tail": {"rotate": [0, 0, 10]}}}
    ]
  }
}
```

- [ ] **Step 2: Look at it in the preview and tune**

Run (in the background): `pnpm --filter vortex-client monster-art:preview wolf`
Then: `node .claude/skills/run-vortex-client/driver.mjs "goto http://localhost:5199/" "wait 30000" "ss wolf-preview"` and Read `.claude/skills/run-vortex-client/shots/wolf-preview.png`.
Check, and fix in `rig.json` (the page reloads on save) until each holds:
- every direction shows a wolf (from the front, direction 3: two amber eyes, the cream ruff and muzzle; from behind, 7: no eye);
- `walk` trots (diagonal legs together), no foot under the floor line for long;
- `attack` lunges with the jaw open in its second frame;
- `death` ends lying on its side **on** the floor (if it floats or sinks, change the last two frames' `body.move` v; if it rolls the wrong way for the look, negate `rotate[0]`).
Write down the values changed in the commit message.

- [ ] **Step 3: Build**

```bash
pnpm --filter vortex-client build:monster-art wolf
pnpm --filter vortex-client build:monsters wolf
pnpm --filter vortex-client build:ambreia:all --only=pets
```
Expected: `wolf: 144 frames, …` (8 × 18), then `wolf: C:\laragon\ambreia-sources\pets\wolf.nitro`, `pet type 38`, then `pets: 1 written`.

- [ ] **Step 4: In game**

The emulator must be running (`../vortex-rpg-emulator`, its `run-vortex-emulator` skill); a zone with `monster.forest.wolf` spawns. Get a ticket for a zone with wolves (the emulator driver's `testmode`-style route `POST /api/editor/zones/<key>/test?x=&y=`), then:
`node .claude/skills/run-vortex-client/driver.mjs "goto http://localhost:5173/client/?sso=<ticket>" "wait 12000" "ss wolf-game" errors net`
Read the screenshot: the wolves are the new ones, they walk, the attack lunges, a hit flashes; a killed wolf lies on its side for the corpse delay (only if the running emulator has commit `47dfde280`; otherwise say it was not seen). `errors` and `net` report nothing.

- [ ] **Step 5: Check and commit**

```bash
pnpm check
git add -- packages/vortex-client/monsters/wolf/rig.json
git commit -m "monstres : le loup dessiné par la pipeline (rig, 8 directions, 5 animations)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/monsters/wolf/rig.json packages/vortex-client/monsters/wolf/wolf.aseprite packages/vortex-client/monsters/wolf/monster.json
```

---

### Task 9: The ogre and the drake

**Files:**
- Create: `packages/vortex-client/monsters/ogre/rig.json`, `packages/vortex-client/monsters/drake/rig.json`
- Generate: their `.aseprite` and `monster.json`
- Modify: `packages/ambreia-game/src/configuration/legacy.defaults.json` (`pet.configuration`: append `,ogre,drake` → types 39 and 40; the id is `drake` because Habbo's list already has a `dragon`)

**Interfaces:**
- Consumes: Tasks 6-7 commands.
- Produces: pets `ogre` (39) and `drake` (40), seen in the preview and, after `build:ambreia`, in the imager (`/habbo-imaging/pet/ogre.png` once the imager restarted). No server content (spec §1).

- [ ] **Step 1: Write `monsters/ogre/rig.json`**

```json
{
  "id": "ogre",
  "ramps": {
    "skin": ["#26301e", "#3f5130", "#5d7442", "#7f9658", "#a8b97c"],
    "belly": ["#3a3f22", "#5a6436", "#7d8a4d", "#a1ad6a", "#c6cf92"],
    "cloth": ["#2a1c14", "#46301f", "#664630", "#8a6343", "#ad8560"],
    "tusk": ["#6b6150", "#9a8f78", "#c8bea4", "#e6dfca", "#faf6ea"],
    "wood": ["#241710", "#3d281a", "#5a3d27", "#7a5638", "#9c7350"],
    "nail": ["#2a2622", "#3e3832", "#57504a", "#736b63", "#918a82"]
  },
  "materials": {
    "skin": {"ramp": "skin", "specular": 0.5, "shininess": 24},
    "belly": {"ramp": "belly", "when": [{"normalUp": [0.45, 1], "ramp": "skin"}], "specular": 0.4, "shininess": 20},
    "foot": {"ramp": "skin", "when": [{"forward": [4.6, 99], "ramp": "nail"}], "specular": 0.5, "shininess": 24},
    "cloth": {"ramp": "cloth", "texture": "fur"},
    "tusk": {"ramp": "tusk", "specular": 1, "shininess": 12, "glint": "#ffffff"},
    "wood": {"ramp": "wood", "texture": "fur", "specular": 0.2},
    "nail": {"ramp": "nail", "specular": 0.8, "shininess": 16}
  },
  "bones": {
    "body": {"at": [0, 0, 20]},
    "head": {"parent": "body", "at": [3, 0, 28]},
    "arm.l": {"parent": "body", "at": [0, 10.5, 26.5]},
    "leg.l": {"parent": "body", "at": [0.6, 4.2, 16]}
  },
  "shapes": [
    {"name": "thigh", "bone": "leg.l", "ellipsoid": {"center": [0.6, 4.2, 12.8], "radii": [3.9, 3.4, 4.4]}, "material": "skin", "blend": 2},
    {"name": "knee", "bone": "leg.l", "ellipsoid": {"center": [1.8, 4.54, 8.4], "radii": [2.4, 2.4, 2.2]}, "material": "skin", "blend": 1.5},
    {"name": "shin", "bone": "leg.l", "cone": {"from": [1.2, 4.62, 8.6], "to": [0.6, 4.62, 2.4], "radius": [2.8, 2.4]}, "material": "skin", "blend": 1.5},
    {"name": "foot", "bone": "leg.l", "ellipsoid": {"center": [2.5, 4.62, 1.3], "radii": [3.7, 2.6, 1.5]}, "material": "foot", "blend": 1.2},
    {"name": "belly", "bone": "body", "ellipsoid": {"center": [2.8, 0, 15.8], "radii": [7.6, 8.2, 7.2]}, "material": "belly", "blend": 0},
    {"name": "loincloth", "bone": "body", "ellipsoid": {"center": [1.5, 0, 11.4], "radii": [7.4, 7.8, 2.8]}, "material": "cloth", "blend": 1},
    {"name": "flap", "bone": "body", "membrane": {"points": [[5.5, -3, 11.2], [5.5, 3, 11.2], [6.6, 0, 5.8]], "thickness": 0.5}, "material": "cloth", "blend": 0},
    {"name": "ribs", "bone": "body", "ellipsoid": {"center": [0, 0, 23.5], "radii": [5.5, 8.5, 6]}, "material": "skin", "blend": 3},
    {"name": "pec", "bone": "body", "mirror": true, "ellipsoid": {"center": [2, 4, 24.2], "radii": [4.4, 4.4, 3.6]}, "material": "skin", "blend": 2},
    {"name": "traps", "bone": "body", "ellipsoid": {"center": [-1.5, 0, 29], "radii": [4.8, 7, 4]}, "material": "skin", "blend": 3},
    {"name": "shoulder", "bone": "body", "mirror": true, "ellipsoid": {"center": [0, 9.8, 27], "radii": [4.4, 4.2, 4.2]}, "material": "skin", "blend": 2.5},
    {"name": "head", "bone": "head", "ellipsoid": {"center": [3.6, 0, 30.4], "radii": [4, 4, 4]}, "material": "skin", "blend": 3},
    {"name": "brow", "bone": "head", "ellipsoid": {"center": [6, 0, 32.3], "radii": [1.5, 3.6, 1.2]}, "material": "skin", "blend": 1},
    {"name": "nose", "bone": "head", "ellipsoid": {"center": [7.3, 0, 30.6], "radii": [1.6, 1.4, 1.5]}, "material": "skin", "blend": 1},
    {"name": "jaw", "bone": "head", "ellipsoid": {"center": [6, 0, 28], "radii": [3, 3.8, 2.2]}, "material": "skin", "blend": 1},
    {"name": "tusk", "bone": "head", "mirror": true, "cone": {"from": [6.8, 1.8, 28.6], "to": [8, 2.02, 31.6], "radius": [1.05, 0.35]}, "material": "tusk", "blend": 0},
    {"name": "ear", "bone": "head", "mirror": true, "cone": {"from": [3, 3.78, 31.5], "to": [2, 6.3, 33.6], "radius": [1.3, 0.3]}, "material": "skin", "blend": 0.8},
    {"name": "upper arm", "bone": "arm.l", "cone": {"from": [0, 10.5, 26.5], "to": [1, 12.3, 19.5], "radius": [3.2, 2.6]}, "material": "skin", "blend": 2},
    {"name": "forearm", "bone": "arm.l", "ellipsoid": {"center": [2.2, 12.4, 16], "radii": [3.2, 3.2, 4.2]}, "material": "skin", "blend": 1.5},
    {"name": "wrist", "bone": "arm.l", "cone": {"from": [2.5, 12, 14], "to": [3, 11.8, 11.5], "radius": [2.4, 2.2]}, "material": "skin", "blend": 1},
    {"name": "fist", "bone": "arm.l", "ellipsoid": {"center": [3.4, 11.6, 10], "radii": [3, 2.8, 3]}, "material": "skin", "blend": 1.2},
    {"name": "haft", "bone": "arm.l", "mirror": false, "cone": {"from": [3.4, 11.6, 10], "to": [8.8, 11.8, 2.8], "radius": [1.2, 2.2]}, "material": "wood", "blend": 0.3},
    {"name": "club head", "bone": "arm.l", "mirror": false, "cone": {"from": [8.8, 11.8, 2.8], "to": [10.6, 11.9, 0.6], "radius": [3.4, 3.1]}, "material": "wood", "blend": 0.8},
    {"name": "knot", "bone": "arm.l", "mirror": false, "ellipsoid": {"center": [6.1, 12.7, 6.4], "radii": [1.5, 1.5, 1.5]}, "material": "wood", "blend": 0.6},
    {"name": "stud", "bone": "arm.l", "mirror": false, "ellipsoid": {"center": [10.6, 14.4, 1.6], "radii": [1.1, 1.1, 1.1]}, "material": "nail", "blend": 0.2}
  ],
  "decals": [
    {"kind": "pixel", "bone": "head", "at": [6.9, 1.6, 31.3], "mirror": true, "colours": ["#e3c24a"]},
    {"kind": "pixel", "bone": "head", "at": [8.6, 0.6, 30.3], "mirror": true, "colours": ["#1b2414"]},
    {"kind": "pixel", "bone": "head", "at": [8.6, 0, 29], "colours": ["#1a1f12"]},
    {"kind": "pixel", "bone": "head", "at": [8.6, 0.7, 29], "mirror": true, "colours": ["#1a1f12"]},
    {"kind": "pixel", "bone": "head", "at": [8.4, 1.4, 29], "mirror": true, "colours": ["#1a1f12"]},
    {"kind": "pixel", "bone": "body", "at": [10.2, 0, 15.2], "colours": ["#3f4a28"]}
  ],
  "animations": {
    "idle": [
      {"ms": 300},
      {"ms": 280, "pose": {"head": {"rotate": [0, -4, 0]}, "arm.l": {"rotate": [-3, 0, 0]}}}
    ],
    "walk": [
      {"ms": 160, "pose": {"leg.l": {"rotate": [0, 15, 0]}, "leg.r": {"rotate": [0, -15, 0]}, "arm.l": {"rotate": [0, -12, 0]}, "arm.r": {"rotate": [0, 12, 0]}, "body": {"rotate": [0, 0, 4]}}},
      {"ms": 160},
      {"ms": 160, "pose": {"leg.l": {"rotate": [0, -15, 0]}, "leg.r": {"rotate": [0, 15, 0]}, "arm.l": {"rotate": [0, 12, 0]}, "arm.r": {"rotate": [0, -12, 0]}, "body": {"rotate": [0, 0, -4]}}},
      {"ms": 160}
    ],
    "attack": [
      {"ms": 220, "pose": {"arm.l": {"rotate": [0, 165, 0]}, "arm.r": {"rotate": [0, 0, 0]}, "body": {"rotate": [0, 6, 0]}}},
      {"ms": 90, "pose": {"arm.l": {"rotate": [0, 60, 0]}, "arm.r": {"rotate": [0, 0, 0]}, "body": {"rotate": [0, -8, 0]}}},
      {"ms": 200, "pose": {"arm.l": {"rotate": [0, 25, 0]}, "arm.r": {"rotate": [0, 0, 0]}, "body": {"rotate": [0, -12, 0], "move": [1, 0, -1]}}},
      {"ms": 160}
    ],
    "hit": [
      {"ms": 90, "flash": true, "pose": {"body": {"rotate": [0, 8, 0], "move": [-1.5, 0, 0]}}},
      {"ms": 160, "pose": {"body": {"rotate": [0, 8, 0], "move": [-1.5, 0, 0]}}}
    ],
    "death": [
      {"ms": 200, "pose": {"body": {"rotate": [0, -15, 0]}, "head": {"rotate": [0, -15, 0]}}},
      {"ms": 200, "pose": {"body": {"rotate": [0, -50, 0], "move": [0, 0, -6]}}},
      {"ms": 260, "pose": {"body": {"rotate": [0, -85, 0], "move": [0, 0, -13]}, "arm.l": {"rotate": [0, 60, 0]}}},
      {"ms": 600, "pose": {"body": {"rotate": [0, -85, 0], "move": [0, 0, -13]}, "arm.l": {"rotate": [0, 60, 0]}}}
    ]
  }
}
```

- [ ] **Step 2: Write `monsters/drake/rig.json`**

```json
{
  "id": "drake",
  "ramps": {
    "scale": ["#34101a", "#621b22", "#932b28", "#bf4a2f", "#e6813f"],
    "belly": ["#5a3812", "#8a5d1d", "#b98a30", "#ddb553", "#f3dc8c"],
    "membrane": ["#250b18", "#431326", "#652035", "#873446", "#a9525a"],
    "horn": ["#5e5546", "#8c826d", "#bab09a", "#dcd5c0", "#f6f2e4"],
    "claw": ["#141216", "#221f24", "#332f35", "#47424a", "#5e5862"]
  },
  "materials": {
    "scale": {"ramp": "scale", "when": [{"normalUp": [-1, -0.35], "ramp": "belly"}], "texture": "scales", "specular": 0.9, "shininess": 28, "glint": "#ffd27a"},
    "limb": {"ramp": "scale", "specular": 0.9, "shininess": 28, "glint": "#ffd27a"},
    "belly": {"ramp": "belly", "specular": 0.6, "shininess": 20},
    "membrane": {"ramp": "membrane", "specular": 0.3},
    "horn": {"ramp": "horn", "specular": 1, "shininess": 14, "glint": "#ffffff"},
    "claw": {"ramp": "claw", "specular": 0.8, "shininess": 16}
  },
  "bones": {
    "body": {"at": [0, 0, 19]},
    "neck": {"parent": "body", "at": [12, 0, 24]},
    "head": {"parent": "neck", "at": [20.3, 0, 36]},
    "jaw": {"parent": "head", "at": [23, 0, 35.2]},
    "tail": {"parent": "body", "at": [-14, 0, 19]},
    "tail2": {"parent": "tail", "at": [-22, 0, 15]},
    "tail3": {"parent": "tail2", "at": [-29, 0, 9.5]},
    "fleg.l": {"parent": "body", "at": [7.5, 4.8, 16]},
    "hleg.l": {"parent": "body", "at": [-11, 4.8, 15]},
    "wing.l": {"parent": "body", "at": [3, 5.2, 27]}
  },
  "shapes": [
    {"name": "chest", "bone": "body", "ellipsoid": {"center": [6, 0, 20], "radii": [8.5, 6.2, 7.2]}, "material": "scale", "blend": 0},
    {"name": "body", "bone": "body", "cone": {"from": [6, 0, 19], "to": [-10, 0, 18], "radius": [6.4, 5.4]}, "material": "scale", "blend": 3},
    {"name": "hips", "bone": "body", "ellipsoid": {"center": [-11, 0, 18], "radii": [6, 5.4, 5.6]}, "material": "scale", "blend": 3},
    {"name": "shoulder", "bone": "fleg.l", "ellipsoid": {"center": [7.5, 4.8, 16], "radii": [3.6, 2.6, 4.6]}, "material": "limb", "blend": 2},
    {"name": "foreleg", "bone": "fleg.l", "cone": {"from": [8.5, 5.28, 12], "to": [8.8, 5.52, 1.8], "radius": [2.2, 1.7]}, "material": "limb", "blend": 1.5},
    {"name": "front foot", "bone": "fleg.l", "ellipsoid": {"center": [10.4, 5.52, 1.2], "radii": [2.6, 2.2, 1.2]}, "material": "limb", "blend": 1},
    {"name": "front claw", "bone": "fleg.l", "cone": {"from": [12, 4.32, 1.3], "to": [13.8, 4.08, 0.5], "radius": [0.5, 0.15]}, "material": "claw", "blend": 0.2},
    {"name": "front claw", "bone": "fleg.l", "cone": {"from": [12, 5.52, 1.3], "to": [13.8, 5.52, 0.5], "radius": [0.5, 0.15]}, "material": "claw", "blend": 0.2},
    {"name": "front claw", "bone": "fleg.l", "cone": {"from": [12, 6.72, 1.3], "to": [13.8, 6.96, 0.5], "radius": [0.5, 0.15]}, "material": "claw", "blend": 0.2},
    {"name": "thigh", "bone": "hleg.l", "ellipsoid": {"center": [-11, 4.8, 15], "radii": [4.8, 2.8, 5.6]}, "material": "limb", "blend": 2.5},
    {"name": "shin", "bone": "hleg.l", "cone": {"from": [-11.5, 5.28, 10.5], "to": [-15, 5.38, 6], "radius": [2.4, 1.6]}, "material": "limb", "blend": 1.5},
    {"name": "metatarsus", "bone": "hleg.l", "cone": {"from": [-15, 5.38, 6], "to": [-11, 5.52, 1.6], "radius": [1.6, 1.5]}, "material": "limb", "blend": 1},
    {"name": "hind foot", "bone": "hleg.l", "ellipsoid": {"center": [-9, 5.52, 1.2], "radii": [2.6, 2.2, 1.2]}, "material": "limb", "blend": 1},
    {"name": "hind claw", "bone": "hleg.l", "cone": {"from": [-7.4, 4.32, 1.3], "to": [-5.6, 4.08, 0.5], "radius": [0.5, 0.15]}, "material": "claw", "blend": 0.2},
    {"name": "hind claw", "bone": "hleg.l", "cone": {"from": [-7.4, 5.52, 1.3], "to": [-5.6, 5.52, 0.5], "radius": [0.5, 0.15]}, "material": "claw", "blend": 0.2},
    {"name": "hind claw", "bone": "hleg.l", "cone": {"from": [-7.4, 6.72, 1.3], "to": [-5.6, 6.96, 0.5], "radius": [0.5, 0.15]}, "material": "claw", "blend": 0.2},
    {"name": "neck", "bone": "neck", "cone": {"from": [12, 0, 24], "to": [16, 0, 30], "radius": [4, 2.9]}, "material": "scale", "blend": 3},
    {"name": "upper neck", "bone": "neck", "cone": {"from": [16, 0, 30], "to": [20.3, 0, 36], "radius": [2.9, 2.6]}, "material": "scale", "blend": 2.5},
    {"name": "skull", "bone": "head", "ellipsoid": {"center": [22.5, 0, 37.5], "radii": [3.6, 2.9, 2.8]}, "material": "scale", "blend": 2},
    {"name": "brow", "bone": "head", "mirror": true, "ellipsoid": {"center": [24.1, 1.6, 39], "radii": [2, 0.9, 0.8]}, "material": "scale", "blend": 0.8},
    {"name": "snout", "bone": "head", "cone": {"from": [24, 0, 37], "to": [29.5, 0, 35.5], "radius": [2.3, 1.6]}, "material": "scale", "blend": 1.5},
    {"name": "jaw", "bone": "jaw", "cone": {"from": [23, 0, 35.2], "to": [28.8, 0, 34.2], "radius": [1.6, 1.1]}, "material": "belly", "blend": 0.6},
    {"name": "fang", "bone": "jaw", "mirror": true, "cone": {"from": [27.4, 0.9, 34.9], "to": [27.6, 0.9, 35.9], "radius": [0.35, 0.1]}, "material": "horn", "blend": 0},
    {"name": "horn", "bone": "head", "mirror": true, "cone": {"from": [21, 1.5, 39.5], "to": [18.5, 2.18, 42.5], "radius": [1, 0.6]}, "material": "horn", "blend": 0.4},
    {"name": "horn tip", "bone": "head", "mirror": true, "cone": {"from": [18.5, 2.18, 42.5], "to": [15.5, 2.55, 43.5], "radius": [0.6, 0.15]}, "material": "horn", "blend": 0.2},
    {"name": "spike", "bone": "body", "cone": {"from": [-16, 0, 22.5], "to": [-17.8, 0, 26.6], "radius": [1.2, 0.15]}, "material": "horn", "blend": 0.4},
    {"name": "spike", "bone": "body", "cone": {"from": [-12, 0, 22.7], "to": [-13.8, 0, 26.8], "radius": [1.2, 0.15]}, "material": "horn", "blend": 0.4},
    {"name": "spike", "bone": "body", "cone": {"from": [-8, 0, 22.9], "to": [-9.8, 0, 27], "radius": [1.2, 0.15]}, "material": "horn", "blend": 0.4},
    {"name": "spike", "bone": "body", "cone": {"from": [-4, 0, 23.1], "to": [-5.8, 0, 27.2], "radius": [1.2, 0.15]}, "material": "horn", "blend": 0.4},
    {"name": "spike", "bone": "body", "cone": {"from": [0, 0, 23.3], "to": [-1.8, 0, 27.4], "radius": [1.2, 0.15]}, "material": "horn", "blend": 0.4},
    {"name": "spike", "bone": "body", "cone": {"from": [4, 0, 23.5], "to": [2.2, 0, 27.6], "radius": [1.2, 0.15]}, "material": "horn", "blend": 0.4},
    {"name": "spike", "bone": "neck", "cone": {"from": [8, 0, 26], "to": [6.2, 0, 30.1], "radius": [1.2, 0.15]}, "material": "horn", "blend": 0.4},
    {"name": "tail", "bone": "tail", "cone": {"from": [-14, 0, 19], "to": [-22, 0, 15], "radius": [4.6, 2.9]}, "material": "scale", "blend": 2.5},
    {"name": "tail2", "bone": "tail2", "cone": {"from": [-22, 0, 15], "to": [-29, 0, 9.5], "radius": [2.9, 1.7]}, "material": "scale", "blend": 1.5},
    {"name": "tail3", "bone": "tail3", "cone": {"from": [-29, 0, 9.5], "to": [-34, 0, 6.5], "radius": [1.7, 0.9]}, "material": "scale", "blend": 1},
    {"name": "spade", "bone": "tail3", "membrane": {"points": [[-33, 0, 9], [-40, 0, 6.2], [-34, 0, 2.6]], "thickness": 0.6}, "material": "membrane", "blend": 0},
    {"name": "wing arm", "bone": "wing.l", "cone": {"from": [3, 5.2, 27], "to": [-1, 11, 36], "radius": [1.9, 1.2]}, "material": "limb", "blend": 1.2},
    {"name": "wing forearm", "bone": "wing.l", "cone": {"from": [-1, 11, 36], "to": [-5, 13.5, 43], "radius": [1.2, 0.8]}, "material": "limb", "blend": 0.8},
    {"name": "wing claw", "bone": "wing.l", "cone": {"from": [-5, 13.5, 43], "to": [-3.5, 13.5, 44.8], "radius": [0.5, 0.1]}, "material": "horn", "blend": 0.2},
    {"name": "finger", "bone": "wing.l", "cone": {"from": [-5, 13.5, 43], "to": [-13, 17, 41], "radius": [0.75, 0.25]}, "material": "limb", "blend": 0.3},
    {"name": "finger", "bone": "wing.l", "cone": {"from": [-5, 13.5, 43], "to": [-17, 14, 33], "radius": [0.75, 0.25]}, "material": "limb", "blend": 0.3},
    {"name": "finger", "bone": "wing.l", "cone": {"from": [-5, 13.5, 43], "to": [-16, 9.5, 26], "radius": [0.75, 0.25]}, "material": "limb", "blend": 0.3},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[3, 5.2, 27], [-1, 11, 36], [-11, 5.5, 22.5]], "thickness": 0.45}, "material": "membrane", "blend": 0},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[-1, 11, 36], [-5, 13.5, 43], [-11, 5.5, 22.5]], "thickness": 0.45}, "material": "membrane", "blend": 0},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[-5, 13.5, 43], [-13, 17, 41], [-11.7, 14.84, 38.98]], "thickness": 0.45}, "material": "membrane", "blend": 0},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[-5, 13.5, 43], [-11.7, 14.84, 38.98], [-17, 14, 33]], "thickness": 0.45}, "material": "membrane", "blend": 0},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[-5, 13.5, 43], [-17, 14, 33], [-12.7, 12.33, 33.96]], "thickness": 0.45}, "material": "membrane", "blend": 0},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[-5, 13.5, 43], [-12.7, 12.33, 33.96], [-16, 9.5, 26]], "thickness": 0.45}, "material": "membrane", "blend": 0},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[-5, 13.5, 43], [-16, 9.5, 26], [-10.7, 9.48, 30.44]], "thickness": 0.45}, "material": "membrane", "blend": 0},
    {"name": "wing", "bone": "wing.l", "membrane": {"points": [[-5, 13.5, 43], [-10.7, 9.48, 30.44], [-11, 5.5, 22.5]], "thickness": 0.45}, "material": "membrane", "blend": 0}
  ],
  "decals": [
    {"kind": "eye", "bone": "head", "at": [24.9, 1.9, 38.1], "mirror": true, "colours": ["#f5d04a", "#16100c"]},
    {"kind": "pixel", "bone": "head", "at": [29.7, 0.8, 36.4], "mirror": true, "colours": ["#1a0a0c"]}
  ],
  "animations": {
    "idle": [
      {"ms": 300},
      {"ms": 260, "pose": {"neck": {"rotate": [0, 3, 0]}, "wing.l": {"rotate": [6, 0, 0]}, "tail": {"rotate": [0, 0, 4]}}},
      {"ms": 300},
      {"ms": 260, "pose": {"tail": {"rotate": [0, 0, -4]}}}
    ],
    "walk": [
      {"ms": 130, "pose": {"fleg.l": {"rotate": [0, 16, 0]}, "fleg.r": {"rotate": [0, -16, 0]}, "hleg.l": {"rotate": [0, -16, 0]}, "hleg.r": {"rotate": [0, 16, 0]}, "tail": {"rotate": [0, 0, 6]}}},
      {"ms": 130},
      {"ms": 130, "pose": {"fleg.l": {"rotate": [0, -16, 0]}, "fleg.r": {"rotate": [0, 16, 0]}, "hleg.l": {"rotate": [0, 16, 0]}, "hleg.r": {"rotate": [0, -16, 0]}, "tail": {"rotate": [0, 0, -6]}}},
      {"ms": 130}
    ],
    "attack": [
      {"ms": 180, "pose": {"body": {"rotate": [0, 8, 0], "move": [0, 0, 2]}, "neck": {"rotate": [0, 12, 0]}, "wing.l": {"rotate": [18, 0, 0]}}},
      {"ms": 100, "pose": {"body": {"rotate": [0, 4, 0], "move": [3, 0, 1]}, "neck": {"rotate": [0, -18, 0]}, "jaw": {"rotate": [0, -30, 0]}, "wing.l": {"rotate": [28, -8, 0]}}},
      {"ms": 200, "pose": {"body": {"move": [4, 0, 0]}, "neck": {"rotate": [0, -14, 0]}, "jaw": {"rotate": [0, -30, 0]}, "wing.l": {"rotate": [20, 0, 0]}}},
      {"ms": 140, "pose": {"body": {"move": [1, 0, 0]}}}
    ],
    "hit": [
      {"ms": 90, "flash": true, "pose": {"body": {"move": [-2, 0, 0]}, "neck": {"rotate": [0, 10, 0]}}},
      {"ms": 150, "pose": {"body": {"move": [-2, 0, 0]}, "neck": {"rotate": [0, 10, 0]}}}
    ],
    "death": [
      {"ms": 180, "pose": {"neck": {"rotate": [0, -25, 0]}, "body": {"move": [0, 0, -2]}}},
      {"ms": 180, "pose": {"body": {"rotate": [40, 0, 0], "move": [0, 0, -6]}, "neck": {"rotate": [0, -30, 0]}}},
      {"ms": 220, "pose": {"body": {"rotate": [80, 0, 0], "move": [0, 0, -11]}, "neck": {"rotate": [0, -35, 0]}, "wing.l": {"rotate": [-20, 0, 0]}}},
      {"ms": 600, "pose": {"body": {"rotate": [80, 0, 0], "move": [0, 0, -11]}, "neck": {"rotate": [0, -35, 0]}, "wing.l": {"rotate": [-20, 0, 0]}}}
    ]
  }
}
```

- [ ] **Step 3: Register the pet types**

In `packages/ambreia-game/src/configuration/legacy.defaults.json`, the `pet.configuration` value ends with `,slime,wolf"`: change it to end with `,slime,wolf,ogre,drake"`.

- [ ] **Step 4: Preview, tune, build**

For each of `ogre`, `drake`: run the preview, screenshot it as in Task 8 Step 2, and tune the rig until: every direction reads (ogre from the front: two yellow eyes, tusks; drake from the front: wings in a V, two gold eyes), the attack reads (ogre: club overhead then down; drake: rears, jaw open, wings up), death lies on the floor. Then:
```bash
pnpm --filter vortex-client build:monster-art ogre drake
pnpm --filter vortex-client build:monsters ogre drake
pnpm --filter vortex-client build:ambreia:all --only=pets
```
Expected: `pet type 39` for ogre, `pet type 40` for drake; `pets: 2 written`.

- [ ] **Step 5: Check and commit**

```bash
pnpm check
git add -- packages/vortex-client/monsters/ogre packages/vortex-client/monsters/drake
git commit -m "monstres : l'ogre (pet 39) et le drake (pet 40) dessinés par la pipeline

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SJPvZPgZWNgd9mnJDi3ySB" -- packages/vortex-client/monsters/ogre packages/vortex-client/monsters/drake packages/ambreia-game/src/configuration/legacy.defaults.json
```

---

## Self-review notes (kept for the reviewer)

- Spec §3 (files): all created in Tasks 1-7. §4 (rig): Task 2, refinements written into the spec. §5 (passes): Tasks 3-4. §6 (output, retouche): Tasks 5-6. §7 (commands, preview): Tasks 6-7. §8 (monsters): Tasks 8-9 (slime untouched). §9 (verification): tests in each task, preview screenshots and the in-game check in Tasks 8-9, `pnpm check` before the commits that touch tests.
- Performance is not tested: a monster takes tens of seconds to build (spike: 70-150 ms a frame); worker threads are spec §10 "later".
