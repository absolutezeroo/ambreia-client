import {test} from 'node:test';
import assert from 'node:assert/strict';
import {project, scale2x, iconGrip, drawFrame} from './build-weapon-handitems.mjs';

/** A 3-px thick diagonal from bottom-left to top-right, like the icons' weapons. */
function diagonal(size)
{
    const data = Buffer.alloc(size * size * 4);

    for(let i = 0; i < size; i++)
    {
        for(const dx of [-1, 0, 1]) if(i + dx >= 0 && i + dx < size) data.writeUInt32LE(0xff808080, ((size - 1 - i) * size + i + dx) * 4);
    }

    return {data, width: size, height: size};
}

const opaque = pixels => { let n = 0; for(let i = 3; i < pixels.length; i += 4) if(pixels[i]) n++; return n; };

test('project: direction 1 faces screen-right, 3 the viewer (floor at half height), up is up', () =>
{
    const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

    assert.ok(near(project({f: 1, r: 0, u: 0}, 1), [1, 0]));
    assert.ok(near(project({f: 1, r: 0, u: 0}, 3), [0, 0.5]));
    assert.ok(near(project({f: 0, r: 1, u: 0}, 3), [-1, 0]), 'facing the viewer, its right hand is on screen-left');
    assert.ok(near(project({f: 0, r: 0, u: 1}, 5), [0, -1]));
});

test('drawFrame: the grip lands where it says, and the blade goes behind once past the body plane', () =>
{
    const icon = diagonal(20), big = scale2x(scale2x(scale2x(icon))), grip = iconGrip(icon);
    const forward = drawFrame(icon, big, grip, {pose: 'std', blade: {f: 0.6, r: 0, u: 0.8}, edge: {f: 1, r: 0, u: 0}}, 1);
    const backward = drawFrame(icon, big, grip, {pose: 'std', blade: {f: -0.6, r: 0, u: 0.8}, edge: {f: 1, r: 0, u: 0}}, 1);

    assert.equal(opaque(forward.back), 0);
    assert.ok(opaque(forward.front) > 15);
    // std holds the hand 3 px in front of the body: only the hilt stays in front.
    assert.ok(opaque(backward.back) > opaque(backward.front) && opaque(backward.front) > 0, `${opaque(backward.front)} front, ${opaque(backward.back)} back`);

    const [gx, gy] = forward.grip;

    assert.ok(forward.front[(Math.floor(gy) * forward.width + Math.floor(gx)) * 4 + 3] > 0, 'an opaque pixel under the grip');
});
