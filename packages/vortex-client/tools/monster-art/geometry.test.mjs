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
