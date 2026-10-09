import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LegacyWallGeometry} from '../src/scene/utils/LegacyWallGeometry';

function geometry(heights: number[][]): LegacyWallGeometry
{
    const g = new LegacyWallGeometry();

    g.initialize(heights[0].length, heights.length, 0);
    heights.forEach((row, y) => row.forEach((h, x) => g.setTileHeight(x, y, h)));

    return g;
}

// The avatar stands on the floor as drawn (RoomPlaneParser.rampCorners): half a level up on a stair
// tile that ramps, flat beside the stair where Habbo used to lift it onto a corner it no longer draws.
test('an avatar stands half a level up on a stair ramp, flat beside the stair', () =>
{
    const g = geometry([[0, 1, 2], [0, 0, 0]]);

    assert.equal(g.getFloorAltitude(0, 0), 0.5);
    assert.equal(g.getFloorAltitude(1, 0), 1.5);
    assert.equal(g.getFloorAltitude(1, 1), 0);
    assert.equal(g.getFloorAltitude(0, 1), 0);
});

test('a single step lifts nothing: the floor beside it is flat', () =>
{
    assert.equal(geometry([[0, 1]]).getFloorAltitude(0, 0), 0);
});
