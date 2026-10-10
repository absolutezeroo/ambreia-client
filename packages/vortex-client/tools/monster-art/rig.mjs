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
