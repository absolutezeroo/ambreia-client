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
