import {test} from 'node:test';
import assert from 'node:assert/strict';
import {project, surfaceOutline} from '../src/view/isoMath';

test('a flat tile outlines as its rhombus', () =>
{
    const outline = surfaceOutline(2, 3, new Array(16).fill(1));
    const corners = [project(2, 3, 1), project(3, 3, 1), project(3, 4, 1), project(2, 4, 1)];

    // Every point lies on the rhombus' edges, and its four corners are all there.
    for(const [x, y] of corners) assert.ok(outline.some((v, i) => i % 2 === 0 && v === x && outline[i + 1] === y));
});

test('a stair quarter ramp outlines its steps: a riser joins two quarters at different heights', () =>
{
    const surface = Array.from({length: 16}, (_, i) => (i % 4) / 4);
    const outline = surfaceOutline(0, 0, surface);

    // Along the back edge, the end of quarter 0 (h 0) and the start of quarter 1 (h 0.25) share x, y.
    assert.deepEqual(outline.slice(2, 4), project(0.25, 0, 0));
    assert.deepEqual(outline.slice(4, 6), project(0.25, 0, 0.25));
});
