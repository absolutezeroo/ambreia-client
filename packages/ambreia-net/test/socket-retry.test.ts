// A retry (next port, second attempt) opens a new socket on the same SocketConnection. The previous
// socket's handlers used to stay attached: its late `onclose` flipped `_connected` and announced a
// disconnect over a connection still being opened.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SocketConnection} from '../src/connection/SocketConnection';

class FakeWebSocket
{
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    static instances: FakeWebSocket[] = [];

    readyState = FakeWebSocket.CONNECTING;
    binaryType = 'blob';
    closed = false;
    onopen: (() => void) | null = null;
    onclose: ((event: {code: number; reason: string; wasClean: boolean}) => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((event: {data: ArrayBuffer}) => void) | null = null;

    constructor(readonly url: string)
    {
        FakeWebSocket.instances.push(this);
    }

    close(): void
    {
        this.closed = true;
        this.readyState = FakeWebSocket.CLOSED;
    }

    send(): void
    {}
}

function withFakeWebSocket<T>(body: () => T): T
{
    const original = (globalThis as {WebSocket?: unknown}).WebSocket;

    FakeWebSocket.instances = [];
    (globalThis as {WebSocket?: unknown}).WebSocket = FakeWebSocket;

    try
    {
        return body();
    }
    finally
    {
        (globalThis as {WebSocket?: unknown}).WebSocket = original;
    }
}

test('a second init() detaches and closes the socket of the first attempt', () =>
{
    withFakeWebSocket(() =>
    {
        const connection = new SocketConnection();
        let disconnects = 0;

        connection.on('disconnected', () => disconnects++);

        assert.equal(connection.init('ws://127.0.0.1:40001'), true);

        const first = FakeWebSocket.instances[0];

        assert.ok(first.onclose, 'the first socket has handlers');
        assert.equal(connection.init('ws://127.0.0.1:40002'), true);
        assert.equal(FakeWebSocket.instances.length, 2);
        assert.equal(first.closed, true, 'the first socket is closed');
        assert.equal(first.onclose, null, 'its handlers are detached');
        assert.equal(first.onopen, null);
        assert.equal(first.onerror, null);
        assert.equal(first.onmessage, null);

        // The second attempt opens: a late close of the first one must not undo it.
        const second = FakeWebSocket.instances[1];

        second.readyState = FakeWebSocket.OPEN;
        second.onopen?.();
        assert.equal(connection.connected, true);
        assert.equal(disconnects, 0);

        connection.dispose();
    });
});
