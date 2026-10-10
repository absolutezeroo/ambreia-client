import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RoomPlaneParser} from '../src/scene/object/RoomPlaneParser';
import {RoomPlaneData} from '../src/scene/object/RoomPlaneData';

function parse(heights: number[][]): RoomPlaneParser
{
    const parser = new RoomPlaneParser();

    parser.initializeTileMap(heights[0].length, heights.length);
    heights.forEach((row, y) => row.forEach((h, x) => parser.setTileHeight(x, y, h)));
    parser.initializeFromTileData(-1, {x: -1, y: -1});

    return parser;
}

// Heights of the vertical floor planes (the sides of the floor slabs), keyed by where they stand.
function floorSides(heights: number[][]): {x: number; y: number; z: number; height: number}[]
{
    const parser = parse(heights);
    const sides = [];

    for(let i = 0; i < parser.planeCount; i++)
    {
        const loc = parser.getPlaneLocation(i)!;
        const right = parser.getPlaneRightSide(i)!;

        if(parser.getPlaneType(i) === RoomPlaneData.PLANE_FLOOR && right.z !== 0)
        {
            sides.push({x: loc.x, y: loc.y, z: loc.z, height: right.z});
        }
    }

    return sides;
}

test('a flat floor keeps the thin Habbo edge', () =>
{
    for(const side of floorSides([[0, 0], [0, 0]]))
    {
        assert.equal(side.height, 0.25);
    }
});

test('a raised tile is a solid block down to its lower neighbour', () =>
{
    const sides = floorSides([[0, 0, 0], [0, 3, 0], [0, 0, 0]]);

    // Its four sides run from the neighbours' floor up to z = 3 (+x, +y, -x, -y).
    const tall = sides.filter(s => s.height === 3).map(s => `${s.x},${s.y},${s.z}`).sort();

    assert.deepEqual(tall, ['0.5,0.5,0', '0.5,1.5,0', '1.5,0.5,0', '1.5,1.5,0']);
    // and the floor around it has no edge against it, only along the room's border (x, y = -0.5 or 2.5).
    const inner = sides.filter(s => s.height !== 3 && ![s.x, s.y].some(c => c === -0.5 || c === 2.5));

    assert.deepEqual(inner, []);
});

test('a raised tile over the void goes down under the lowest floor', () =>
{
    const sides = floorSides([[0, 2]]);

    // The +y face of tile (1,0) borders nothing: it drops to the room's lowest floor, minus the edge.
    // (The thin edge of the ground running under it stands there too.)
    const front = sides.find(s => s.x === 1.5 && s.y === 0.5 && s.height > 1);

    assert.deepEqual(front, {x: 1.5, y: 0.5, z: -0.25, height: 2.25});
});

// Height and front corner of every horizontal floor plane (the tops).
function floorTops(heights: number[][]): {x: number; y: number; z: number}[]
{
    const parser = parse(heights);
    const tops = [];

    for(let i = 0; i < parser.planeCount; i++)
    {
        const loc = parser.getPlaneLocation(i)!;

        // z < 0 is the off-map door tile parse() passes
        if(parser.getPlaneType(i) === RoomPlaneData.PLANE_FLOOR && parser.getPlaneRightSide(i)!.z === 0 && loc.z >= 0)
        {
            tops.push({x: loc.x, y: loc.y, z: loc.z});
        }
    }

    return tops;
}

test('a single step is a plain step: no ramp spills onto the floor below', () =>
{
    assert.deepEqual(floorTops([[0, 1]]).map(t => t.z).sort(), [0, 1]);
});

test('a staircase climbs in quarter steps, the floor beside it stays flat', () =>
{
    const tops = floorTops([[0, 1, 2], [0, 0, 0]]);

    // Row 0 is the staircase: its tiles slope in quarters (z = 0.25, 0.5…).
    assert.ok(tops.some(t => t.y <= 0.5 && !Number.isInteger(t.z)));
    // Row 1 runs beside it and stays flat at 0 (Habbo sloped it toward the steps).
    assert.ok(tops.filter(t => t.y > 0.5).every(t => t.z === 0));
});

test('a tile surface gives the quarters as drawn, for an editor to follow the steps', () =>
{
    const parser = parse([[0, 1, 2], [0, 0, 0]]);

    // Tile (0,0) ramps up toward (1,0) in quarters; tile (1,1) beside the stair is flat.
    assert.deepEqual(parser.getTileSurface(0, 0)!.slice(0, 4), [0, 0.25, 0.5, 0.75]);
    assert.deepEqual(parser.getTileSurface(1, 1), new Array(16).fill(0));
    assert.equal(parser.getTileSurface(5, 5), null);
});

test('raised floor is cut per tile and sorts as its tile; the lowest floor stays merged behind', () =>
{
    const parser = parse([[0, 0, 0], [0, 2, 2], [0, 2, 2]]);
    const tiles = new Set<string>();
    let ground = 0;

    for(let i = 0; i < parser.planeCount; i++)
    {
        if(parser.getPlaneType(i) !== RoomPlaneData.PLANE_FLOOR || parser.getPlaneLocation(i)!.z < -1) continue;

        const tile = parser.getPlaneSortTile(i);

        if(tile) tiles.add(`${tile.x},${tile.y},${tile.z}`);
        else ground++;
    }

    // The 2 × 2 platform is four pieces, one per tile, each at its tile and height.
    assert.deepEqual([...tiles].sort(), ['1,1,2', '1,2,2', '2,1,2', '2,2,2']);
    assert.ok(ground > 0);
});

test('the lowest floor runs under the raised tiles, so a faded block shows ground, not a hole', () =>
{
    const tops = floorTops([[0, 3, 0]]);

    // One ground plane across all three tiles, and the raised top over the middle one.
    assert.deepEqual(tops.filter(t => t.z === 0), [{x: 2.5, y: 0.5, z: 0}]);
    assert.ok(tops.some(t => t.z === 3));
});

// The room's visualization settings (2986) arrive after the floor map built the planes: the
// thickness multipliers must rebuild them, as AS3 re-parsed its plane XML (regeneratePlanes()).
test('new thickness multipliers rebuild the planes, and the tiles stay as they were', () =>
{
    const parser = parse([[0, 0], [0, 0]]);
    const edges = (): number[] => Array.from({length: parser.planeCount}, (_, i) => i)
        .filter(i => parser.getPlaneType(i) === RoomPlaneData.PLANE_FLOOR && parser.getPlaneRightSide(i)!.z !== 0)
        .map(i => parser.getPlaneRightSide(i)!.z);

    // A tile set after the build (the message handler raises the door's) survives the rebuild.
    parser.setTileHeight(1, 1, 5);
    const count = parser.planeCount;

    parser.floorThicknessMultiplier = 0.25;
    parser.wallThicknessMultiplier = 0.25;
    parser.regeneratePlanes();

    assert.equal(parser.planeCount, count);
    assert.ok(edges().length > 0);
    for(const edge of edges()) assert.equal(edge, 0.0625);
    assert.equal(parser.getTileHeight(1, 1), 5);
});
