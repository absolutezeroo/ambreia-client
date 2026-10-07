// Spec §8: net lets a dev tool listen to, edit, drop and inject packets.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SocketConnection} from '../src/connection/SocketConnection';
import {MessageEvent} from '../src/messages/MessageEvent';
import {MessageComposer} from '../src/messages/MessageComposer';
import {MessageDataWrapper} from '../src/messages/MessageDataWrapper';
import {WireFormatter} from '../src/wireformat/WireFormatter';
import {ByteArray} from '../src/util/ByteArray';
import type {IEncryption} from '../src/encryption/IEncryption';
import type {IConnection} from '../src/connection/IConnection';
import type {IMessageDataWrapper} from '../src/messages/IMessageDataWrapper';

class ValueParser
{
    value = 0;

    flush(): boolean
    {
        this.value = 0;
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        this.value = wrapper.readInt();
        return true;
    }
}

const received: number[] = [];

class ValueEvent extends MessageEvent
{
    constructor()
    {
        super(event => received.push((event.parser as ValueParser).value), ValueParser);
    }
}

class ValueComposer extends MessageComposer<[number]>
{
    constructor(private readonly _value: number)
    {
        super();
    }

    getMessageArray(): [number]
    {
        return [this._value];
    }
}

const PLAIN = {encipher: () => undefined, decipher: () => undefined} as unknown as IEncryption;
const THROWS = {encipher: () => undefined, decipher: () => { throw new Error('deciphered'); }} as unknown as IEncryption;

function connection(serverToClient: IEncryption = PLAIN): {connection: SocketConnection; sent: ArrayBuffer[]}
{
    const c = new SocketConnection();
    const sent: ArrayBuffer[] = [];

    c.registerMessageClasses({events: new Map([[100, ValueEvent]]), composers: new Map([[200, ValueComposer]])});
    c.addMessageEvent(new ValueEvent());
    c.setEncryption(PLAIN, serverToClient);
    // A socket that is open and records what it is given; SocketConnection.init() would dial out.
    (c as unknown as {_socket: unknown})._socket = {readyState: WebSocket.OPEN, send: (data: ArrayBuffer) => sent.push(data)};

    return {connection: c, sent};
}

function sentValue(buffer: ArrayBuffer): number
{
    const [wrapper] = new WireFormatter().splitMessages(new ByteArray(buffer), {getServerToClientEncryption: () => null} as unknown as IConnection);

    return wrapper.readInt();
}

test('an injected message reaches its handler with its values', () =>
{
    received.length = 0;
    connection().connection.injectIncoming(100, [7]);

    assert.deepEqual(received, [7]);
});

test('an injected message is never deciphered', () =>
{
    received.length = 0;
    connection(THROWS).connection.injectIncoming(100, [8]);

    assert.deepEqual(received, [8]);
});

test('the tap can drop or replace an incoming message', () =>
{
    const {connection: c} = connection();

    received.length = 0;
    c.setPacketTap({incoming: () => null});
    c.injectIncoming(100, [1]);
    c.setPacketTap({incoming: () =>
    {
        const data = new WireFormatter().encode(100, [99]);
        const body = new ByteArray(data.length - 4);

        data.position = 4;
        data.readBytes(body, 0, data.length - 4);
        body.position = 2;

        return new MessageDataWrapper(100, body);
    }});
    c.injectIncoming(100, [1]);

    assert.deepEqual(received, [99]);
});

test('the tap sees outgoing values, can edit them or drop the message', () =>
{
    const {connection: c, sent} = connection();
    const seen: unknown[][] = [];

    c.setPacketTap({outgoing: (id, values) =>
    {
        seen.push([id, ...values]);
        return values[0] === 2 ? null : [Number(values[0]) * 10];
    }});

    assert.equal(c.send(new ValueComposer(1)), true);
    assert.equal(c.send(new ValueComposer(2)), false);
    assert.deepEqual(seen, [[200, 1], [200, 2]]);
    assert.deepEqual(sent.map(sentValue), [10]);
});

// Real composers hand out their own `_data` array, not a copy.
class DataComposer extends MessageComposer<[number]>
{
    private readonly _data: [number] = [5];

    getMessageArray(): [number]
    {
        return this._data;
    }
}

test('a tap that edits the outgoing values in place does not change the composer', () =>
{
    const {connection: c} = connection();
    const composer = new DataComposer();

    c.registerMessageClasses({events: new Map(), composers: new Map([[201, DataComposer]])});
    c.setPacketTap({outgoing: (_id, values) =>
    {
        values[0] = 50;
        return values;
    }});
    c.send(composer);

    assert.deepEqual(composer.getMessageArray(), [5]);
});
