import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HabboMessages} from '../src/HabboMessages';
import {Incoming} from '../src/Headers.generated';

// The incoming side of outgoing-registered: every message the emulator sends (Headers.cs →
// Incoming) has an event class here. One that is missing is dropped by the connection with a
// single warning, and whatever the server meant by it never happens.
test('every incoming header the emulator sends has a registered event', () =>
{
    const events = new HabboMessages().events;
    const missing = Object.entries(Incoming).filter(([, id]) => !events.has(id)).map(([name]) => name);

    assert.deepEqual(missing, []);
});
