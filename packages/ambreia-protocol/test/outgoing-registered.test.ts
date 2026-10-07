import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HabboMessages} from '../src/HabboMessages';
import {Outgoing} from '../src/Headers.generated';

// Every message the emulator parses (Headers.cs → Outgoing, by pnpm gen:headers) has a composer
// here: a header the server answers but the client never registered is a feature that silently
// does nothing (UseFurniture and UseWallItem, after the core cut).
test('every outgoing header the emulator parses has a registered composer', () =>
{
    const composers = new HabboMessages().composers;
    const missing = Object.entries(Outgoing).filter(([, id]) => !composers.has(id)).map(([name]) => name);

    assert.deepEqual(missing, []);
});
