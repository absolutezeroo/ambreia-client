import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ClientHelloMessageComposer} from '../src/outgoing/handshake/ClientHelloMessageComposer';
import {REVISION} from '../src/Headers.generated';

// The server picks its id table from this string (spec 2026-10-08-random-header-revisions §4.3).
test('ClientHello announces the revision the client was built for', () =>
{
    assert.equal(new ClientHelloMessageComposer().getMessageArray()[0], REVISION);
});
