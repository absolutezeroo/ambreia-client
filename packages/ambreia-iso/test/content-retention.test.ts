// What draws from a graphic asset collection retains it; RoomContentLoader.purge() drops a
// collection only once nothing has for CONTENT_DROP_DELAY. With the two calls missing, every
// session end disposed every furniture and pet collection the next room would have reused.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GraphicAssetCollection} from '@ambreia/common/graphics/GraphicAssetCollection';
import {RoomObjectSpriteVisualization} from '../src/object/visualization/RoomObjectSpriteVisualization';

test('a visualization retains its collection and releases it on dispose or replacement', () =>
{
    const before = Date.now();
    const first = new GraphicAssetCollection();
    const second = new GraphicAssetCollection();

    assert.ok(first.getLastReferenceTimestamp() >= before, 'a fresh collection starts its grace at creation, not at 0');
    assert.equal(first.getReferenceCount(), 0);

    const visualization = new RoomObjectSpriteVisualization();

    visualization.assetCollection = first;
    assert.equal(first.getReferenceCount(), 1);

    // Setting the same collection again is not a second reference.
    visualization.assetCollection = first;
    assert.equal(first.getReferenceCount(), 1);

    visualization.assetCollection = second;
    assert.equal(first.getReferenceCount(), 0, 'the replaced collection is released');
    assert.equal(second.getReferenceCount(), 1);
    assert.ok(first.getLastReferenceTimestamp() >= before, 'the release is dated');

    visualization.dispose();
    assert.equal(second.getReferenceCount(), 0, 'dispose releases');
    assert.equal(visualization.assetCollection, null);
});
