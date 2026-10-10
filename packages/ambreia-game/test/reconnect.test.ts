// NP-01: a lost session comes back by itself, a close that was meant does not, and a socket that
// never carried a session is the port loop's.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onSocketClosed} from '../src/communication/reconnect';

const policy = {maxAttempts: 3, delayMs: (attempt: number): number => attempt * 100};

test('a ready session lost without a close frame is retried with the policy\'s pause, attempt by attempt', () =>
{
    assert.deepEqual(onSocketClosed({code: 1006, expected: false, state: 'ready', attempt: 0, policy}), {kind: 'retry', attempt: 1, delayMs: 100});
    assert.deepEqual(onSocketClosed({code: 1006, expected: false, state: 'reconnecting', attempt: 1, policy}), {kind: 'retry', attempt: 2, delayMs: 200});
    assert.deepEqual(onSocketClosed({code: null, expected: false, state: 'reconnecting', attempt: 2, policy}), {kind: 'retry', attempt: 3, delayMs: 300});
    assert.deepEqual(onSocketClosed({code: 1006, expected: false, state: 'handshaking', attempt: 3, policy}), {kind: 'failed'});
});

test('a close the peer or the client meant is final, whatever the attempt', () =>
{
    assert.deepEqual(onSocketClosed({code: 1000, expected: false, state: 'ready', attempt: 0, policy}), {kind: 'closed'});
    assert.deepEqual(onSocketClosed({code: 1001, expected: false, state: 'reconnecting', attempt: 2, policy}), {kind: 'closed'});
    assert.deepEqual(onSocketClosed({code: 1006, expected: true, state: 'ready', attempt: 0, policy}), {kind: 'closed'});
    assert.deepEqual(onSocketClosed({code: 1000, expected: true, state: 'idle', attempt: 0, policy}), {kind: 'ignore'});
});

test('a socket that never carried a session is left to the port loop', () =>
{
    assert.deepEqual(onSocketClosed({code: 1006, expected: false, state: 'connecting', attempt: 0, policy}), {kind: 'ignore'});
    assert.deepEqual(onSocketClosed({code: 1006, expected: false, state: 'handshaking', attempt: 0, policy}), {kind: 'ignore'});
    assert.deepEqual(onSocketClosed({code: 1006, expected: false, state: 'closed', attempt: 0, policy}), {kind: 'ignore'});
});
