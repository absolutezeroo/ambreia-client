import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HabboMessages} from '../src/HabboMessages';
import {Outgoing} from '../src/Headers.generated';
import {NewStyleHeaders, overlappingHeaders, unservedHeaders} from '../src/NewStyleHeaders';

// Every message the emulator parses (Headers.cs → Outgoing, by pnpm gen:headers) has a composer
// here: a header the server answers but the client never registered is a feature that silently
// does nothing (UseFurniture and UseWallItem, after the core cut).
test('every outgoing header the emulator parses has a registered composer', () =>
{
    const composers = new HabboMessages().composers;
    const legacy = new Set(composers.keys());

    // Served by HabboMessages or by a new-style map (NewStyleHeaders), and never by both.
    assert.deepEqual(unservedHeaders(Outgoing, legacy, NewStyleHeaders.outgoing), []);
    assert.deepEqual(overlappingHeaders(Outgoing, legacy, NewStyleHeaders.outgoing), []);
});
