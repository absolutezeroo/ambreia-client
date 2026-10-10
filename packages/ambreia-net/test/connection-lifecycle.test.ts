// One connection state, with the moves the table allows, and `reset` whenever a ready session is lost.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ConnectionLifecycle, DEFAULT_RECONNECT_POLICY} from '../src/connection/ConnectionLifecycle';

test('the connection goes idle → connecting → handshaking → ready, and a refused move changes nothing', () =>
{
    const lifecycle = new ConnectionLifecycle();
    const seen: string[] = [];

    lifecycle.on('change', (from, to) => seen.push(`${from}>${to}`));

    assert.equal(lifecycle.to('ready'), false, 'idle cannot be ready');
    assert.equal(lifecycle.state, 'idle');
    assert.equal(lifecycle.to('connecting', 'host:40001'), true);
    assert.equal(lifecycle.to('connecting', 'host:40002'), true, 'the next port is the same state');
    assert.equal(lifecycle.detail, 'host:40002');
    assert.equal(lifecycle.to('handshaking'), true);
    assert.equal(lifecycle.to('ready'), true);
    assert.deepEqual(seen, ['idle>connecting', 'connecting>handshaking', 'handshaking>ready']);
});

test('leaving ready emits reset; each reconnect attempt is a change; ready clears the attempt', () =>
{
    const lifecycle = new ConnectionLifecycle();
    const resets: string[] = [];
    let changes = 0;

    lifecycle.on('reset', to => resets.push(to));
    lifecycle.on('change', () => changes++);
    lifecycle.to('connecting');
    lifecycle.to('handshaking');
    lifecycle.to('ready');
    changes = 0;

    lifecycle.attempt = 1;
    assert.equal(lifecycle.to('reconnecting', 'attempt 1'), true);
    lifecycle.attempt = 2;
    assert.equal(lifecycle.to('reconnecting', 'attempt 2'), true);
    assert.equal(changes, 2);
    assert.deepEqual(resets, ['reconnecting']);

    lifecycle.to('handshaking');
    lifecycle.to('ready');
    assert.equal(lifecycle.attempt, 0);
    assert.equal(lifecycle.to('closed', 'code 1000'), true);
    assert.deepEqual(resets, ['reconnecting', 'closed']);
    assert.equal(lifecycle.to('connecting'), true, 'a closed connection may be opened again');
});

test('the default policy backs off exponentially, stays under 30 s and spreads each pause', () =>
{
    const policy = DEFAULT_RECONNECT_POLICY;

    assert.equal(policy.maxAttempts, 6);

    for(let attempt = 1; attempt <= 8; attempt++)
    {
        const base = Math.min(30_000, 1_000 * 2 ** (attempt - 1));
        const delay = policy.delayMs(attempt);

        assert.ok(delay >= base * 0.5 && delay <= base * 1.5, `attempt ${attempt}: ${delay} ms around ${base}`);
    }
});
