import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unservedHeaders, overlappingHeaders} from '../src/NewStyleHeaders';

// A header the server uses is served by exactly one style: an inherited event or composer in
// HabboMessages, or a new-style map (NewStyleHeaders). Both at once is refused by map.install().
test('a header moved to the new style no longer needs an inherited event', () =>
{
    const headers = {Chat: 1, Ping: 2, Move: 3};

    assert.deepEqual(unservedHeaders(headers, new Set([2]), new Set([1])), ['Move']);
});

test('a header served by both styles is named', () =>
{
    assert.deepEqual(overlappingHeaders({Chat: 1, Ping: 2}, new Set([1, 2]), new Set([2])), ['Ping']);
});
